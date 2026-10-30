# -*- coding: utf-8 -*-
"""
WinShield Pro - StressBench™ (Benchmark de Estresse em Loops).

Metodologia (mesma ideia dos "stress tests" de benchmarks profissionais):
  * Uma carga FIXA e determinística é executada em todas as threads lógicas,
    sem pausas, durante N loops consecutivos de duração fixa.
  * Cada "quadro" de trabalho = SHA-256 de 1 MiB + compressão zlib (nível 6) de
    256 KiB + kernel float64 de 128 Ki elementos (NumPy). Todos os resultados
    são comparados com uma referência calculada antes do teste: qualquer
    divergência é contada como ERRO DE CÁLCULO.
  * Pontuação do loop = quadros por segundo × 10 (todas as threads somadas).
  * Estabilidade = pior loop ÷ melhor loop × 100. Aprovado quando a
    estabilidade é ≥ 97% e não houve nenhum erro de cálculo — um sistema que
    perde desempenho com o calor (throttling) ou que erra contas é reprovado.
  * Durante cada loop são registrados temperatura, clock efetivo, potência e
    limitação de clock (somente valores medidos; ausentes = None / "N/D").

Toda a carga roda em código nativo (hashlib / zlib / NumPy elementwise) que
libera o GIL, então as threads ocupam de fato todos os núcleos.
"""

import os
import json
import time
import zlib
import hashlib
import threading

try:
    import numpy as np
except ImportError:  # pragma: no cover
    np = None

from backend.log_manager import LogManager
from backend.telemetry import Telemetry

PRESETS = {
    "rapido":  {"loops": 10, "loop_sec": 30, "label": "Rápido"},
    "padrao":  {"loops": 20, "loop_sec": 60, "label": "Padrão"},
    "extremo": {"loops": 40, "loop_sec": 60, "label": "Extremo"},
}
WARMUP_SEC = 5
PASS_STABILITY = 97.0
SCORE_SCALE = 10.0
HISTORY_MAX = 12


def _history_path():
    base = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
    folder = os.path.join(base, "WinShieldPro")
    try:
        os.makedirs(folder, exist_ok=True)
    except OSError:
        pass
    return os.path.join(folder, "stressbench_history.json")


def _avg(values):
    vals = [v for v in values if v is not None]
    return round(sum(vals) / len(vals), 1) if vals else None


def _max(values):
    vals = [v for v in values if v is not None]
    return round(max(vals), 1) if vals else None


class StressBenchEngine:
    _lock = threading.Lock()
    _running = False
    _stop = threading.Event()
    _frames = []          # contador de quadros por thread (sem lock no caminho quente)
    _errors = 0
    _state = {}
    _history = None

    # ------------------------------------------------------------------
    # CARGA
    # ------------------------------------------------------------------
    @staticmethod
    def _build_payload(wid):
        rng = np.random.default_rng(7000 + wid) if np is not None else None
        raw = rng.bytes(1 << 20) if rng is not None else os.urandom(1 << 20)
        text = (b"WinShield StressBench frame %d " % wid) * 9000
        text = text[:262144]
        x = rng.uniform(0.5, 50.0, size=131072) if rng is not None else None
        return raw, text, x

    @staticmethod
    def _fpu_kernel(x, out, tmp):
        np.sin(x, out=out)
        np.cos(x, out=tmp)
        np.multiply(out, tmp, out=out)
        np.sqrt(x, out=tmp)
        np.add(out, tmp, out=out)
        np.exp(np.negative(np.abs(out, out=tmp), out=tmp), out=tmp)
        np.add(out, tmp, out=out)
        return out

    @classmethod
    def _worker(cls, stop, wid):
        raw, text, x = cls._build_payload(wid)
        ref_sha = hashlib.sha256(raw).digest()
        ref_z = zlib.crc32(zlib.compress(text, 6))
        out = tmp = ref_fp = None
        if x is not None:
            out = np.empty_like(x)
            tmp = np.empty_like(x)
            ref_fp = cls._fpu_kernel(x, out, tmp).copy()
        counter = cls._frames
        while not stop.is_set():
            ok = hashlib.sha256(raw).digest() == ref_sha
            ok = (zlib.crc32(zlib.compress(text, 6)) == ref_z) and ok
            if x is not None:
                ok = np.array_equal(cls._fpu_kernel(x, out, tmp), ref_fp) and ok
            if not ok:
                with cls._lock:
                    cls._errors += 1
                    n = cls._errors
                if n <= 10:
                    LogManager.add_log(f"[STRESSBENCH] ERRO DE CÁLCULO na thread {wid} (resultado divergente da referência)")
            counter[wid] += 1

    # ------------------------------------------------------------------
    # TELEMETRIA
    # ------------------------------------------------------------------
    @staticmethod
    def _sample():
        cpu = Telemetry.cpu_snapshot()
        sens = Telemetry.sensors()
        ext = sens.get("external") or {}
        temp = ext.get("cpu_temp")
        temp_source = sens.get("external_source") if temp is not None else None
        if temp is None:
            tz = cpu.get("thermal_zones") or {}
            temp = max(tz.values()) if tz else None
            temp_source = "Zona térmica ACPI (aproximada)" if temp is not None else None
        lim = [v for v in (cpu.get("performance_limit_pct"), cpu.get("thermal_passive_limit_pct")) if v is not None]
        return {
            "temp": round(temp, 1) if temp is not None else None,
            "temp_source": temp_source,
            "clock": cpu.get("avg_clock"),
            "usage": cpu.get("usage"),
            "power": ext.get("cpu_power"),
            "throttle": round(max(0.0, 100.0 - min(lim)), 1) if lim else None,
        }

    # ------------------------------------------------------------------
    # CONTROLE
    # ------------------------------------------------------------------
    @classmethod
    def _busy_reason(cls):
        try:
            from backend.stress_engine import StressEngine
            if StressEngine._running:
                return "O teste de estabilidade (StressPulse) está em execução. Pare-o antes do benchmark."
        except Exception:
            pass
        try:
            from backend.hardware_monitor import CoreBenchmarkEngine
            if CoreBenchmarkEngine._running:
                return "O benchmark de CPU está em execução. Aguarde terminar."
        except Exception:
            pass
        return None

    @classmethod
    def start(cls, preset="padrao", loops=None, loop_sec=None):
        if np is None:
            return False, "NumPy não está disponível: o benchmark de estresse não pode ser executado."
        busy = cls._busy_reason()
        if busy:
            return False, busy
        cfg = dict(PRESETS.get(preset) or PRESETS["padrao"])
        try:
            if loops:
                cfg["loops"] = max(3, min(100, int(loops)))
            if loop_sec:
                cfg["loop_sec"] = max(15, min(300, int(loop_sec)))
        except (TypeError, ValueError):
            pass
        with cls._lock:
            if cls._running:
                return False, "O benchmark de estresse já está em execução."
            cls._running = True
            cls._stop = threading.Event()
            cls._errors = 0
            threads = os.cpu_count() or 4
            cls._frames = [0] * threads
            cpu_name = ""
            try:
                from backend.system_engine import SystemEngine
                cpu_name = SystemEngine.static_info().get("cpu") or ""
            except Exception:
                pass
            cls._state = {
                "running": True, "phase": "warmup", "preset": preset if preset in PRESETS else "padrao",
                "preset_label": cfg["label"], "loops_total": cfg["loops"], "loop_sec": cfg["loop_sec"],
                "current_loop": 0, "loop_progress": 0.0, "progress_pct": 0.0,
                "elapsed_sec": 0, "eta_sec": cfg["loops"] * cfg["loop_sec"] + WARMUP_SEC,
                "threads": threads, "cpu_name": cpu_name, "loops": [], "live": {}, "result": None,
                "started_at": time.strftime("%d/%m/%Y %H:%M:%S"), "message": "Aquecendo (5 s descartados)",
            }
        threading.Thread(target=cls._run, args=(cfg, cls._stop), daemon=True, name="stressbench").start()
        LogManager.add_log(f"[STRESSBENCH] Iniciado: {cfg['loops']} loops × {cfg['loop_sec']} s em {threads} threads")
        return True, f"Benchmark de estresse iniciado: {cfg['loops']} loops de {cfg['loop_sec']} s."

    @classmethod
    def stop(cls):
        with cls._lock:
            if not cls._running:
                return True, "O benchmark de estresse já está parado."
        cls._stop.set()
        return True, "Interrompendo o benchmark de estresse..."

    @classmethod
    def _set(cls, **kw):
        with cls._lock:
            cls._state.update(kw)

    @classmethod
    def _total_frames(cls):
        return sum(cls._frames)

    @classmethod
    def _run(cls, cfg, stop):
        threads = cls._state["threads"]
        workers = [threading.Thread(target=cls._worker, args=(stop, i), daemon=True, name=f"sb{i}") for i in range(threads)]
        t_start = time.perf_counter()
        loops_out = []
        status = "completed"
        try:
            for w in workers:
                w.start()

            # Aquecimento: estabiliza turbo/threads; resultado descartado
            while time.perf_counter() - t_start < WARMUP_SEC and not stop.is_set():
                time.sleep(0.25)
                cls._set(elapsed_sec=int(time.perf_counter() - t_start), live=cls._sample())

            total = cfg["loops"] * cfg["loop_sec"]
            for n in range(1, cfg["loops"] + 1):
                if stop.is_set():
                    break
                f0 = cls._total_frames()
                e0 = cls._errors
                l0 = time.perf_counter()
                samples = []
                last_f, last_t = f0, l0
                cls._set(phase="running", current_loop=n, message=f"Loop {n} de {cfg['loops']}")
                while not stop.is_set():
                    now = time.perf_counter()
                    el = now - l0
                    if el >= cfg["loop_sec"] - 0.02:
                        break
                    stop.wait(min(1.0, cfg["loop_sec"] - el))
                    s = cls._sample()
                    now = time.perf_counter()
                    fr = cls._total_frames()
                    s["score"] = round((fr - last_f) / max(1e-3, now - last_t) * SCORE_SCALE, 1)
                    last_f, last_t = fr, now
                    samples.append(s)
                    done = (n - 1) * cfg["loop_sec"] + min(cfg["loop_sec"], now - l0)
                    cls._set(
                        live=s,
                        loop_progress=round(min(1.0, (now - l0) / cfg["loop_sec"]), 3),
                        progress_pct=round(done / total * 100, 1),
                        elapsed_sec=int(now - t_start),
                        eta_sec=max(0, int(total - done)),
                    )
                if stop.is_set():
                    break
                dur = time.perf_counter() - l0
                score = round((cls._total_frames() - f0) / dur * SCORE_SCALE, 1)
                loop = {
                    "n": n, "score": score, "seconds": round(dur, 1),
                    "temp_avg": _avg(s["temp"] for s in samples), "temp_max": _max(s["temp"] for s in samples),
                    "clock_avg": _avg(s["clock"] for s in samples), "power_avg": _avg(s["power"] for s in samples),
                    "throttle_max": _max(s["throttle"] for s in samples), "usage_avg": _avg(s["usage"] for s in samples),
                    "errors": cls._errors - e0,
                }
                loops_out.append(loop)
                with cls._lock:
                    cls._state["loops"] = list(loops_out)
                t_txt = f"{loop['temp_avg']} °C" if loop["temp_avg"] is not None else "temp. N/D"
                LogManager.add_log(f"[STRESSBENCH] Loop {n}/{cfg['loops']}: {score} pts | {t_txt} | clock {loop['clock_avg'] or 'N/D'} MHz")
            if stop.is_set() and len(loops_out) < cfg["loops"]:
                status = "stopped"
        except Exception as ex:
            status = "error"
            LogManager.add_log(f"[STRESSBENCH] Falha: {ex}")
        finally:
            stop.set()
            for w in workers:
                w.join(timeout=3)

        result = cls._summarize(loops_out, cfg, status)
        with cls._lock:
            cls._running = False
            cls._state.update(running=False, phase=status, result=result, loop_progress=0.0,
                              progress_pct=100.0 if status == "completed" else cls._state.get("progress_pct", 0),
                              eta_sec=0, message={"completed": "Concluído", "stopped": "Interrompido pelo usuário",
                                                  "error": "Falha durante o teste"}[status])
        if result and status == "completed":
            cls._save_history(result)
            verdict = "APROVADO" if result["passed"] else "REPROVADO"
            LogManager.add_log(f"[STRESSBENCH] {verdict}: estabilidade {result['stability']}% | "
                               f"melhor {result['best']} | pior {result['worst']} | erros {result['errors']}")

    @classmethod
    def _summarize(cls, loops, cfg, status):
        if not loops:
            return None
        scores = [l["score"] for l in loops]
        best, worst = max(scores), min(scores)
        stability = round(worst / best * 100, 1) if best > 0 else 0.0
        errors = sum(l["errors"] for l in loops)
        first, last = loops[0], loops[-1]
        clock_drop = None
        if first.get("clock_avg") and last.get("clock_avg"):
            clock_drop = round((1 - last["clock_avg"] / first["clock_avg"]) * 100, 1)
        temp_rise = None
        if first.get("temp_avg") is not None and last.get("temp_avg") is not None:
            temp_rise = round(last["temp_avg"] - first["temp_avg"], 1)
        complete = status == "completed"
        return {
            "timestamp": time.strftime("%d/%m/%Y %H:%M:%S"),
            "cpu_name": cls._state.get("cpu_name"),
            "threads": cls._state.get("threads"),
            "preset": cls._state.get("preset_label"),
            "loops_done": len(loops), "loops_total": cfg["loops"], "loop_sec": cfg["loop_sec"],
            "best": best, "worst": worst, "average": round(sum(scores) / len(scores), 1),
            "stability": stability, "errors": errors,
            "temp_max": _max(l["temp_max"] for l in loops),
            "temp_rise": temp_rise, "clock_drop_pct": clock_drop,
            "throttle_max": _max(l["throttle_max"] for l in loops),
            "complete": complete,
            "passed": complete and errors == 0 and stability >= PASS_STABILITY,
            "pass_threshold": PASS_STABILITY,
        }

    # ------------------------------------------------------------------
    # HISTÓRICO (persistido em %LOCALAPPDATA%\WinShieldPro)
    # ------------------------------------------------------------------
    @classmethod
    def _load_history(cls):
        if cls._history is None:
            try:
                with open(_history_path(), "r", encoding="utf-8") as f:
                    data = json.load(f)
                cls._history = data if isinstance(data, list) else []
            except (OSError, ValueError):
                cls._history = []
        return cls._history

    @classmethod
    def _save_history(cls, result):
        hist = cls._load_history()
        hist.insert(0, result)
        del hist[HISTORY_MAX:]
        try:
            with open(_history_path(), "w", encoding="utf-8") as f:
                json.dump(hist, f, ensure_ascii=False, indent=1)
        except OSError:
            pass

    @classmethod
    def get_status(cls):
        with cls._lock:
            st = dict(cls._state) if cls._state else {
                "running": False, "phase": "idle", "loops": [], "live": {}, "result": None,
                "threads": os.cpu_count() or 4,
            }
            st["errors"] = cls._errors
        if not st.get("running"):
            st["live"] = cls._sample()
        st["presets"] = PRESETS
        st["history"] = list(cls._load_history())
        st["numpy"] = np is not None
        return st
