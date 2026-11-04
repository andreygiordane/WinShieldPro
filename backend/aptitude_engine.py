"""
Teste de Aptidão - WinShield Pro.

Roda em sequência os motores de teste já existentes (CPU, memória, disco do sistema e
estabilidade sob carga total) e gera um laudo dizendo se a máquina atende uso doméstico,
comercial ou de escritório/corporativo.

O laudo usa só critérios objetivos e explicados (RAM, núcleos, velocidade aleatória do
disco do sistema medida no teste, estabilidade, erros de memória, saúde do disco, edição
do Windows, TPM/Secure Boot). A pontuação do CPU aparece como informação, sem limites
de aprovação, porque não há referência calibrada para ela.
"""

import os
import threading
import time
from datetime import datetime

from backend.core import IS_WINDOWS
from backend.disk_benchmark_engine import DiskBenchmarkEngine
from backend.disk_health_engine import DiskHealthEngine
from backend.hardware_monitor import CoreBenchmarkEngine, CoreEngine
from backend.log_manager import LogManager
from backend.memory_engine import MemoryEngine
from backend.process import run_ps
from backend.stress_bench_engine import StressBenchEngine
from backend.system_engine import SystemEngine
from backend.telemetry import Telemetry

PRESETS = {
    "rapido": {"label": "Rápido", "cpu_sec": 5, "mem_mb": 512, "mem_mode": "quick", "mem_passes": 1,
               "disk_mb": 256, "disk_passes": 1, "loops": 3, "loop_sec": 15, "minutes": 3},
    "moderado": {"label": "Moderado", "cpu_sec": 15, "mem_mb": 2048, "mem_mode": "standard", "mem_passes": 1,
                 "disk_mb": 1024, "disk_passes": 1, "loops": 6, "loop_sec": 30, "minutes": 6},
    "intenso": {"label": "Intenso", "cpu_sec": 30, "mem_mb": 0, "mem_mode": "standard", "mem_passes": 2,
                "disk_mb": 2048, "disk_passes": 2, "loops": 10, "loop_sec": 60, "minutes": 15},
}

PHASES = [
    ("hardware", "Lendo o hardware"),
    ("cpu", "Desempenho do processador"),
    ("memory", "Integridade da memória"),
    ("disk", "Velocidade do disco do sistema"),
    ("stability", "Estabilidade sob carga total"),
    ("report", "Gerando o laudo"),
]

# Leitura aleatória de 4 KB com fila 1: é o que mais pesa na sensação de rapidez do Windows.
# HDs ficam por volta de 0,5 a 2 MB/s; qualquer SSD passa com folga de 10 MB/s.
SSD_CLASS_4K_MBS = 10.0

PROFILES = [
    {"key": "home", "title": "Doméstico",
     "desc": "Navegação, streaming, redes sociais, estudos e Office básico.",
     "ram_min": 4, "ram_rec": 8, "threads_min": 2, "threads_rec": 4, "ssd": "rec", "corporate": False},
    {"key": "business", "title": "Comercial",
     "desc": "Caixa/PDV, sistema de gestão (ERP), emissão de notas, impressoras e várias abas abertas.",
     "ram_min": 8, "ram_rec": 16, "threads_min": 4, "threads_rec": 8, "ssd": "req", "corporate": False},
    {"key": "office", "title": "Escritório / corporativo",
     "desc": "Office completo, Teams/videochamada, VPN, domínio da empresa e segurança gerenciada.",
     "ram_min": 8, "ram_rec": 16, "threads_min": 4, "threads_rec": 8, "ssd": "req", "corporate": True},
]


class AptitudeEngine:
    _lock = threading.Lock()
    _cancel = threading.Event()
    _state = {"running": False, "phase": None, "preset": None, "progress": 0.0, "phase_progress": 0.0,
              "message": "", "started_at": None, "results": None, "error": None}

    @classmethod
    def status(cls):
        with cls._lock:
            st = dict(cls._state)
        st["phases"] = [{"key": k, "label": l} for k, l in PHASES]
        st["presets"] = {k: {"label": v["label"], "minutes": v["minutes"]} for k, v in PRESETS.items()}
        if st["running"]:
            try:
                cpu = Telemetry.cpu_snapshot()
                st["live"] = {"usage": cpu.get("usage"), "clock": cpu.get("avg_clock")}
            except Exception:
                st["live"] = {}
        st["status"] = "success"
        return st

    @classmethod
    def _set(cls, **kw):
        with cls._lock:
            cls._state.update(kw)

    @classmethod
    def start(cls, preset="rapido"):
        if not IS_WINDOWS:
            return False, "Disponível apenas no Windows."
        if preset not in PRESETS:
            preset = "rapido"
        with cls._lock:
            if cls._state["running"]:
                return False, "O teste de aptidão já está em andamento."
            if StressBenchEngine._running or CoreBenchmarkEngine._running:
                return False, "Há outro teste de carga em execução. Aguarde ele terminar."
            cls._cancel.clear()
            cls._state.update(running=True, phase="hardware", preset=preset, progress=0.0, phase_progress=0.0,
                              message="Preparando…", started_at=datetime.now().strftime("%d/%m/%Y %H:%M"),
                              results=None, error=None)
        threading.Thread(target=cls._worker, args=(preset,), daemon=True, name="aptitude").start()
        return True, f"Teste {PRESETS[preset]['label']} iniciado (≈ {PRESETS[preset]['minutes']} min)."

    @classmethod
    def cancel(cls):
        cls._cancel.set()
        for stop in (DiskBenchmarkEngine.cancel, MemoryEngine.cancel_test, StressBenchEngine.stop):
            try:
                stop()
            except Exception:
                pass
        return True, "Cancelando o teste…"

    # ------------------------------------------------------------------
    @classmethod
    def _phase(cls, key, done_before):
        idx = [k for k, _ in PHASES].index(key)
        cls._set(phase=key, phase_progress=0.0, message=dict(PHASES)[key] + "…",
                 progress=round(done_before, 1))
        return idx

    @classmethod
    def _wait(cls, status_fn, finished, progress_fn, span, base, timeout):
        """Acompanha um motor até terminar, convertendo o progresso dele no progresso geral."""
        t0 = time.time()
        while time.time() - t0 < timeout:
            if cls._cancel.is_set():
                raise InterruptedError
            st = status_fn()
            pct = max(0.0, min(100.0, float(progress_fn(st) or 0)))
            cls._set(phase_progress=round(pct, 1), progress=round(base + span * pct / 100, 1))
            if finished(st):
                return st
            time.sleep(1)
        raise TimeoutError("o teste demorou mais que o esperado")

    @classmethod
    def _worker(cls, preset):
        cfg = PRESETS[preset]
        # Peso de cada fase no progresso geral (proporcional ao tempo esperado)
        spans = {"hardware": 3, "cpu": 15, "memory": 12, "disk": 25, "stability": 42, "report": 3}
        base = 0.0
        res = {"preset": cfg["label"]}
        try:
            LogManager.add_log(f"[APTIDÃO] Teste {cfg['label']} iniciado.")
            cls._phase("hardware", base)
            res["facts"] = cls._facts()
            base += spans["hardware"]

            cls._phase("cpu", base)
            ok, msg = CoreBenchmarkEngine.run_benchmark(duration_sec=cfg["cpu_sec"])
            if not ok:
                raise RuntimeError(msg)
            st = cls._wait(CoreBenchmarkEngine.get_results, lambda s: not s.get("running"),
                           lambda s: s.get("progress"), spans["cpu"], base, 600)
            res["cpu"] = {"single": st.get("single_thread"), "multi": st.get("multi_thread"),
                          "variation": (st.get("details", {}).get("multi") or {}).get("variation_pct")}
            base += spans["cpu"]

            cls._phase("memory", base)
            ok, msg = MemoryEngine.start_memory_test(size_mb=cfg["mem_mb"], passes=cfg["mem_passes"], mode=cfg["mem_mode"])
            if not ok:
                raise RuntimeError(msg)
            st = cls._wait(MemoryEngine.get_test_status, lambda s: s.get("state") in ("completed", "cancelled", "failed"),
                           lambda s: s.get("progress_percent"), spans["memory"], base, 3600)
            if st.get("state") == "failed":
                raise RuntimeError(st.get("current_pattern") or "o teste de memória falhou")
            res["memory"] = {"errors": st.get("errors_found") or 0, "tested_mb": st.get("tested_mb"),
                             "speed_mb_s": st.get("speed_mb_s"), "state": st.get("state")}
            base += spans["memory"]

            cls._phase("disk", base)
            drive = (os.environ.get("SystemDrive") or "C:")[0]
            ok, msg = DiskBenchmarkEngine.start(drive, size_mb=cfg["disk_mb"], passes=cfg["disk_passes"], test_type="all")
            if not ok:
                raise RuntimeError(msg)
            st = cls._wait(DiskBenchmarkEngine.get_status, lambda s: not s.get("running"),
                           lambda s: s.get("progress_percent"), spans["disk"], base, 3600)
            r = st.get("results") or {}
            res["disk"] = {"drive": f"{drive}:", "seq_read": r.get("seq_read_q8"), "seq_write": r.get("seq_write_q8"),
                           "rnd_read_q1": r.get("rnd_read_q1"), "rnd_write_q1": r.get("rnd_write_q1"),
                           "rnd_read_q1_iops": r.get("rnd_read_q1_iops"), "phase": st.get("phase")}
            base += spans["disk"]

            cls._phase("stability", base)
            ok, msg = StressBenchEngine.start("rapido", loops=cfg["loops"], loop_sec=cfg["loop_sec"])
            if not ok:
                raise RuntimeError(msg)
            st = cls._wait(StressBenchEngine.get_status, lambda s: not s.get("running"),
                           lambda s: s.get("progress_pct"), spans["stability"], base, 4 * 3600)
            rr = st.get("result") or {}
            res["stability"] = {"stability": rr.get("stability"), "errors": rr.get("errors", st.get("errors")),
                                "passed": rr.get("passed"), "complete": rr.get("complete"),
                                "clock_drop_pct": rr.get("clock_drop_pct"), "throttle_max": rr.get("throttle_max"),
                                "temp_max": rr.get("temp_max"), "loops": rr.get("loops_done")}
            base += spans["stability"]

            cls._phase("report", base)
            res["profiles"] = evaluate(res)
            res["finished_at"] = datetime.now().strftime("%d/%m/%Y %H:%M")
            cls._set(running=False, phase="done", progress=100.0, phase_progress=100.0,
                     message="Teste concluído.", results=res)
            LogManager.add_log("[APTIDÃO] Teste concluído: " + " | ".join(f"{p['title']}: {p['verdict']}" for p in res["profiles"]))
        except InterruptedError:
            cls._set(running=False, phase="cancelled", message="Teste cancelado.", results=None)
        except Exception as ex:
            cls._set(running=False, phase="error", message=f"O teste parou: {ex}", error=str(ex))
            LogManager.add_log(f"[APTIDÃO] Erro: {ex}")

    @staticmethod
    def _facts():
        st = SystemEngine.static_info()
        core = CoreEngine.get_info()
        disks = DiskHealthEngine.scan()
        disks = disks.get("disks", disks) if isinstance(disks, dict) else disks
        _, out = run_ps("(Get-Partition -DriveLetter $env:SystemDrive[0]).DiskNumber", timeout=15)
        sys_num = int(out.strip()) if (out or "").strip().isdigit() else None
        sys_disk = next((d for d in disks or [] if d.get("index") == sys_num), None)
        caption = st.get("os_caption") or st.get("os") or ""
        return {
            "cpu": core.get("processor", {}).get("name") or st.get("cpu"),
            "cores": st.get("cpu_cores"), "threads": st.get("cpu_threads"),
            "ram_gb": st.get("ram_total_gb"),
            "gpu": st.get("gpus") or [],
            "os": caption,
            "os_business": any(e in caption for e in ("Pro", "Enterprise", "Education")),
            "tpm2": bool(st.get("tpm_present")) and "2.0" in f"{st.get('tpm_version')}",
            "secure_boot": "Ativo" in f"{st.get('secure_boot')}",
            "system_disk": {"model": sys_disk.get("model"), "media": sys_disk.get("media"),
                            "health": sys_disk.get("health") if sys_disk.get("health_source") != "limited" else None}
            if sys_disk else None,
        }


# ======================================================================
# LAUDO
# ======================================================================
def _crit(label, status, detail):
    return {"label": label, "status": status, "detail": detail}


def evaluate(res):
    f, mem, disk, stab, cpu = res["facts"], res["memory"], res["disk"], res["stability"], res.get("cpu") or {}
    ram, threads = f.get("ram_gb") or 0, f.get("threads") or 0
    rnd = disk.get("rnd_read_q1")
    health = (f.get("system_disk") or {}).get("health")

    common = []
    common.append(_crit("Memória sem erros", "ok" if mem["errors"] == 0 else "fail",
                        f"{mem.get('tested_mb') or '?'} MB verificados, {mem['errors']} erro(s)." if mem["errors"] == 0 else
                        f"{mem['errors']} erro(s) na memória RAM: a máquina pode travar ou corromper arquivos. Teste os pentes separadamente."))
    if stab.get("complete"):
        # Instabilidade real = erro de cálculo sob carga ou queda forte de clock (superaquecimento).
        # Pequena variação entre ciclos costuma ser programa em segundo plano, não defeito.
        errors, steady = stab.get("errors") or 0, stab.get("stability") or 0
        drop = stab.get("clock_drop_pct") or 0
        detail = f"Desempenho manteve {steady}% entre o melhor e o pior ciclo, queda de clock de {drop}%"
        if errors:
            status, detail = "fail", f"{errors} erro(s) de cálculo sob carga: sinal de instabilidade (memória, fonte, overclock ou temperatura)."
        elif steady < 90 or drop >= 15:
            status, detail = "fail", detail + ". Queda forte: verifique refrigeração, pasta térmica e fonte."
        elif steady < 97 or drop >= 8:
            status, detail = "warn", detail + (". Variação acima do ideal: feche programas em segundo plano e repita; "
                                               "se continuar, verifique a refrigeração.")
        else:
            status, detail = "ok", detail + ", sem erros."
        common.append(_crit("Estável sob carga total", status, detail))
    else:
        common.append(_crit("Estável sob carga total", "fail", "O teste de estabilidade não chegou ao fim."))
    if f.get("system_disk") is None or health is None:
        common.append(_crit("Saúde do disco do sistema", "warn",
                            "Não foi possível ler o S.M.A.R.T. do disco do sistema (rode o WinShield como administrador)."))
    else:
        common.append(_crit("Saúde do disco do sistema", "ok" if health >= 70 else ("warn" if health >= 40 else "fail"),
                            f"{health}% segundo o S.M.A.R.T. do disco."))
    if rnd is not None:
        fast = rnd >= SSD_CLASS_4K_MBS
        disk_detail = (f"Leitura aleatória (4 KB) de {rnd:.1f} MB/s na unidade {disk['drive']} — "
                       + ("nível de SSD, o Windows e os programas abrem rápido." if fast else
                          "nível de HD mecânico, o Windows fica lento para abrir programas. Um SSD resolve."))
    else:
        fast, disk_detail = None, "Velocidade do disco não medida."

    profiles = []
    for p in PROFILES:
        crits = list(common)
        crits.append(_crit(f"Memória RAM (mín. {p['ram_min']} GB, ideal {p['ram_rec']} GB)",
                           "ok" if ram >= p["ram_rec"] - 0.5 else ("warn" if ram >= p["ram_min"] - 0.5 else "fail"),
                           f"{ram} GB instalados."))
        crits.append(_crit(f"Processador (mín. {p['threads_min']} threads, ideal {p['threads_rec']})",
                           "ok" if threads >= p["threads_rec"] else ("warn" if threads >= p["threads_min"] else "fail"),
                           f"{f.get('cores')} núcleos / {threads} threads."))
        if fast is not None:
            crits.append(_crit("Disco do sistema rápido (SSD)", "ok" if fast else ("fail" if p["ssd"] == "req" else "warn"),
                               disk_detail))
        if p["corporate"]:
            crits.append(_crit("Windows Pro, Enterprise ou Education", "ok" if f.get("os_business") else "fail",
                               f"{f.get('os')}. " + ("Permite entrar no domínio da empresa e gerenciar o BitLocker." if f.get("os_business")
                                                    else "A edição Home não entra em domínio corporativo.")))
            secure = f.get("tpm2") and f.get("secure_boot")
            crits.append(_crit("TPM 2.0 e Secure Boot", "ok" if secure else "warn",
                               "Ativos: atende aos requisitos de segurança do Windows 11." if secure else
                               "Ausentes ou desativados: necessários para Windows 11 e políticas de segurança."))
        worst = "fail" if any(c["status"] == "fail" for c in crits) else ("warn" if any(c["status"] == "warn" for c in crits) else "ok")
        profiles.append({"key": p["key"], "title": p["title"], "desc": p["desc"], "level": worst,
                         "verdict": {"ok": "Atende bem", "warn": "Atende com ressalvas", "fail": "Não recomendado"}[worst],
                         "criteria": crits})
    return profiles


def export_report():
    """Laudo + ficha do PC em TXT/HTML na pasta Documentos\\WinShield Pro\\Laudos."""
    from backend.pc_sheet_engine import _documents_folder, build_sheet
    from backend.support_engine import _write_reports
    res = AptitudeEngine.status().get("results")
    if not res:
        raise ValueError("Rode o teste antes de salvar o laudo.")
    sections = []
    for p in res["profiles"]:
        rows = [("Resultado", p["verdict"]), ("Uso típico", p["desc"])]
        icon = {"ok": "OK", "warn": "Atenção", "fail": "Falha"}
        rows += [(f"[{icon[c['status']]}] {c['label']}", c["detail"]) for c in p["criteria"]]
        sections.append((f"Uso {p['title'].lower()}", rows))
    cpu, mem, disk, stab = res.get("cpu") or {}, res["memory"], res["disk"], res["stability"]
    sections.append(("Medições", [
        ("Pontuação do CPU (1 thread / todas)", f"{cpu.get('single')} / {cpu.get('multi')}"),
        ("Memória verificada", f"{mem.get('tested_mb')} MB, {mem.get('errors')} erro(s), {mem.get('speed_mb_s')} MB/s"),
        (f"Disco {disk.get('drive')} sequencial (leitura / gravação)", f"{disk.get('seq_read')} / {disk.get('seq_write')} MB/s"),
        (f"Disco {disk.get('drive')} aleatório 4 KB (leitura / gravação)", f"{disk.get('rnd_read_q1')} / {disk.get('rnd_write_q1')} MB/s"),
        ("Estabilidade", f"{stab.get('stability')}% em {stab.get('loops')} ciclo(s), {stab.get('errors')} erro(s)"),
    ]))
    sheet = build_sheet(False)
    sections.append(("Configuração", [("", sheet.get("summary", ""))]))
    sections += sheet.get("sections", [])
    folder = os.path.join(_documents_folder(), "WinShield Pro", "Laudos")
    meta = {"computer": "", "scanned_at": res.get("finished_at", "")}
    files = _write_reports(folder, f"laudo_aptidao_{datetime.now():%Y-%m-%d_%H%M}",
                           f"Laudo de aptidão — teste {res['preset']}", meta, sections)
    return files, folder
