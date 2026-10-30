# -*- coding: utf-8 -*-
"""
WinShield Pro - StressPulse™ (Teste de Estabilidade do Sistema).

Carga REAL e verificada em cada subsistema:
  * CPU  - SHA-256/BLAKE2b sobre buffers de 1 MiB. Cada resultado é comparado
           com um resultado de referência calculado no início; qualquer
           divergência é um ERRO DE CÁLCULO (sinal clássico de instabilidade).
  * FPU  - séries trigonométricas/raízes em float64 (NumPy, vetorizado AVX/SSE)
           com verificação bit-a-bit contra a referência.
  * Cache- acessos aleatórios (gather) em conjuntos de 8 MiB com checagem de soma.
  * RAM  - aloca o volume escolhido e alterna padrões (sólido, xadrez, endereço
           próprio, aleatório com semente) verificando 100% das palavras.
  * Disco- grava/relê arquivo temporário com dados aleatórios, sem cache do
           Windows (FILE_FLAG_NO_BUFFERING), comparando o hash de cada bloco.
  * GPU  - a carga é gerada pela interface (WebGL2); aqui só é registrada.

Todo o trabalho pesado roda em código nativo (hashlib/NumPy/I-O), que libera o
GIL do Python — por isso as threads conseguem levar todos os núcleos a 100%.

Telemetria: somente valores medidos (ver backend/telemetry.py). Sensores sem
fonte disponível retornam None e aparecem como "N/D" na interface.
"""

import os
import sys
import time
import hashlib
import tempfile
import threading
import gc
from collections import deque

try:
    import numpy as np
except ImportError:  # pragma: no cover
    np = None

from backend.log_manager import LogManager
from backend.telemetry import Telemetry, IS_WINDOWS

if IS_WINDOWS:
    import ctypes
    from ctypes import wintypes


def _fmt_elapsed(sec):
    s = max(0, int(sec or 0))
    return f"{s // 3600:02d}:{(s % 3600) // 60:02d}:{s % 60:02d}"


class StressEngine:
    _lock = threading.Lock()
    _running = False
    _stop_event = threading.Event()
    _workers = []
    _sampler_thread = None

    _start_time = 0.0
    _start_time_str = "—"
    _elapsed_sec = 0

    _config = {
        "stress_cpu": True,
        "stress_fpu": True,
        "stress_cache": True,
        "stress_memory": True,
        "stress_disk": False,
        "stress_gpu": False,
        "threads": 0,               # 0 = todas as threads lógicas
        "memory_mb": 2048,
        "duration_limit_sec": 0,    # 0 = contínuo
    }

    _sector_log = []
    _history = deque(maxlen=600)     # 10 minutos a 1 Hz
    _stats = {}

    # Contadores de trabalho e erros (reais)
    _errors = {"cpu": 0, "fpu": 0, "cache": 0, "memory": 0, "disk": 0}
    _work = {"cpu_bytes": 0, "fpu_ops": 0, "cache_ops": 0, "mem_verified_bytes": 0,
             "disk_written_bytes": 0, "disk_read_bytes": 0}
    _work_prev = None
    _rates = {}
    _memory_tested_mb = 0
    _throttling_active = False
    _gpu_client = {"fps": None, "ts": 0.0, "renderer": None}

    _disk_model_name = None
    _gpu_model_name = None
    _initialized = False

    # ------------------------------------------------------------------
    @classmethod
    def _init_hardware_names(cls):
        if cls._initialized:
            return
        cls._initialized = True
        try:
            from backend.disk_health_engine import DiskHealthEngine
            disks = DiskHealthEngine._cache or []
            sysd = None
            for d in disks:
                if any((v.get("letter") or "").upper() == "C" for v in d.get("volumes", [])):
                    sysd = d
                    break
            sysd = sysd or (disks[0] if disks else None)
            if sysd:
                cls._disk_model_name = sysd.get("model")
                cls._disk_index = sysd.get("index", 0)
                cls._disk_is_nvme = bool(sysd.get("nvme"))
        except Exception:
            pass
        try:
            from backend.system_engine import SystemEngine
            stat = SystemEngine.static_info()
            cls._gpu_model_name = stat.get("gpu_primary") or None
        except Exception:
            pass

    @classmethod
    def _add_sector_entry(cls, status_text, level="info"):
        dt_str = time.strftime("%d/%m/%Y %H:%M:%S")
        cls._sector_log.append({"datetime": dt_str, "status": status_text, "level": level})
        if len(cls._sector_log) > 200:
            cls._sector_log.pop(0)
        LogManager.add_log(f"[STRESSPULSE] {status_text}")

    @classmethod
    def _report_error(cls, kind, msg):
        with cls._lock:
            cls._errors[kind] += 1
            n = cls._errors[kind]
        if n <= 20:  # evita inundar o log
            cls._add_sector_entry(f"ERRO {kind.upper()}: {msg}", "error")

    @classmethod
    def _add_work(cls, key, amount):
        # Operação atômica o suficiente para contadores (GIL), sem lock no caminho quente
        cls._work[key] = cls._work.get(key, 0) + amount

    # ------------------------------------------------------------------
    # WORKERS
    # ------------------------------------------------------------------
    @classmethod
    def _worker_cpu(cls, stop, wid):
        rnd = np.random.default_rng(1000 + wid) if np is not None else None
        buf = rnd.bytes(1 << 20) if rnd is not None else os.urandom(1 << 20)
        ref_sha = hashlib.sha256(buf).digest()
        ref_b2 = hashlib.blake2b(buf).digest()
        n = len(buf)
        while not stop.is_set():
            for _ in range(8):
                if hashlib.sha256(buf).digest() != ref_sha:
                    cls._report_error("cpu", f"divergência SHA-256 na thread {wid}")
                if hashlib.blake2b(buf).digest() != ref_b2:
                    cls._report_error("cpu", f"divergência BLAKE2b na thread {wid}")
            cls._add_work("cpu_bytes", 16 * n)

    @classmethod
    def _worker_fpu(cls, stop, wid):
        if np is None:
            return
        rng = np.random.default_rng(2000 + wid)
        x = rng.uniform(0.5, 50.0, size=131072)          # 1 MiB float64 (cabe no L2/L3)
        out = np.empty_like(x)
        tmp = np.empty_like(x)

        def kernel():
            np.sin(x, out=out)
            np.cos(x, out=tmp)
            np.multiply(out, tmp, out=out)
            np.sqrt(x, out=tmp)
            np.add(out, tmp, out=out)
            np.multiply(out, 1.000001, out=out)
            np.exp(np.negative(np.abs(out, out=tmp), out=tmp), out=tmp)
            np.add(out, tmp, out=out)
            return out

        ref = kernel().copy()
        ops_per_iter = x.size * 9
        while not stop.is_set():
            for _ in range(20):
                r = kernel()
                if not np.array_equal(r, ref):
                    bad = int(np.count_nonzero(r != ref))
                    cls._report_error("fpu", f"{bad} resultado(s) de ponto flutuante incorretos (thread {wid})")
            cls._add_work("fpu_ops", 20 * ops_per_iter)

    @classmethod
    def _worker_cache(cls, stop, wid):
        if np is None:
            return
        rng = np.random.default_rng(3000 + wid)
        data = rng.integers(0, 1 << 30, size=1 << 20, dtype=np.int64)   # 8 MiB
        idx = rng.permutation(data.size)
        ref = int(data.sum())
        while not stop.is_set():
            for _ in range(4):
                g = np.take(data, idx)
                if int(g.sum()) != ref:
                    cls._report_error("cache", f"soma de verificação divergente (thread {wid})")
            cls._add_work("cache_ops", 4 * data.size)

    @classmethod
    def _worker_memory(cls, stop, target_mb):
        if np is None:
            return
        chunk_words = (64 * 1024 * 1024) // 8   # blocos de 64 MiB
        avail_mb = Telemetry.memory()["avail_mb"]
        safe_mb = max(64, min(target_mb, int(avail_mb * 0.85) - 256))
        if safe_mb < target_mb:
            cls._add_sector_entry(f"RAM: limitado a {safe_mb} MB para não paginar (livre: {avail_mb} MB)", "warn")
        blocks = []
        try:
            for _ in range(max(1, safe_mb // 64)):
                if stop.is_set():
                    break
                b = np.empty(chunk_words, dtype=np.uint64)
                b.fill(0)  # força comprometimento físico das páginas
                blocks.append(b)
        except MemoryError:
            cls._add_sector_entry("RAM: alocação interrompida por falta de memória livre", "warn")
        with cls._lock:
            cls._memory_tested_mb = len(blocks) * 64
        cls._add_sector_entry(f"RAM: {len(blocks) * 64} MB alocados e em verificação contínua")

        addr = np.arange(chunk_words, dtype=np.uint64)
        patterns = ["0x5555…", "0xAAAA…", "0xFFFF…", "0x0000…", "endereço", "~endereço", "aleatório"]
        p = 0
        try:
            while not stop.is_set() and blocks:
                name = patterns[p % len(patterns)]
                seed = p
                p += 1
                for bi, b in enumerate(blocks):
                    if stop.is_set():
                        break
                    base = np.uint64(bi * chunk_words)
                    if name == "0x5555…":
                        exp = np.uint64(0x5555555555555555); b.fill(exp)
                    elif name == "0xAAAA…":
                        exp = np.uint64(0xAAAAAAAAAAAAAAAA); b.fill(exp)
                    elif name == "0xFFFF…":
                        exp = np.uint64(0xFFFFFFFFFFFFFFFF); b.fill(exp)
                    elif name == "0x0000…":
                        exp = np.uint64(0); b.fill(exp)
                    elif name == "endereço":
                        np.add(addr, base, out=b); exp = None
                    elif name == "~endereço":
                        np.add(addr, base, out=b); np.invert(b, out=b); exp = None
                    else:
                        r = np.random.default_rng(seed * 1000 + bi)
                        b[:] = r.integers(0, np.iinfo(np.uint64).max, size=chunk_words, dtype=np.uint64, endpoint=True)
                        exp = None
                    # Verificação de 100% das palavras de 64 bits
                    if exp is not None:
                        bad = int(np.count_nonzero(b != exp))
                    elif name == "endereço":
                        bad = int(np.count_nonzero(b != (addr + base)))
                    elif name == "~endereço":
                        bad = int(np.count_nonzero(b != ~(addr + base)))
                    else:
                        r = np.random.default_rng(seed * 1000 + bi)
                        bad = int(np.count_nonzero(b != r.integers(0, np.iinfo(np.uint64).max, size=chunk_words,
                                                                 dtype=np.uint64, endpoint=True)))
                    if bad:
                        first = int(np.flatnonzero(b != exp)[0]) if exp is not None else 0
                        cls._report_error("memory", f"{bad} palavra(s) corrompida(s) no bloco {bi} "
                                                    f"(padrão {name}, offset ~0x{(bi * chunk_words + first) * 8:X})")
                    cls._add_work("mem_verified_bytes", b.nbytes)
        finally:
            blocks.clear()
            with cls._lock:
                cls._memory_tested_mb = 0
            gc.collect()

    @classmethod
    def _worker_disk(cls, stop):
        """Grava e relê 256 MiB com verificação de hash por bloco (sem cache do SO)."""
        block = 1 << 20
        n_blocks = 256
        path = os.path.join(tempfile.gettempdir(), f"winshield_stress_{os.getpid()}.bin")
        io = _UnbufferedFile(path, block)
        rng = np.random.default_rng(42) if np is not None else None
        try:
            if not io.open():
                cls._add_sector_entry("Disco: não foi possível abrir arquivo de teste sem cache", "warn")
                return
            cycle = 0
            while not stop.is_set():
                digests = []
                for i in range(n_blocks):
                    if stop.is_set():
                        break
                    data = rng.bytes(block) if rng is not None else os.urandom(block)
                    digests.append(hashlib.blake2b(data, digest_size=16).digest())
                    if not io.write_at(i * block, data):
                        cls._report_error("disk", f"falha de gravação no bloco {i}")
                    cls._add_work("disk_written_bytes", block)
                io.flush()
                for i, dg in enumerate(digests):
                    if stop.is_set():
                        break
                    data = io.read_at(i * block)
                    if data is None:
                        cls._report_error("disk", f"falha de leitura no bloco {i}")
                    elif hashlib.blake2b(data, digest_size=16).digest() != dg:
                        cls._report_error("disk", f"dados lidos diferentes dos gravados no bloco {i}")
                    cls._add_work("disk_read_bytes", block)
                cycle += 1
        except Exception as ex:
            cls._add_sector_entry(f"Disco: teste interrompido ({ex})", "warn")
        finally:
            io.close()
            try:
                os.remove(path)
            except OSError:
                pass

    # ------------------------------------------------------------------
    # SAMPLER (1 Hz)
    # ------------------------------------------------------------------
    @classmethod
    def _collect_snapshot(cls, elapsed):
        cpu = Telemetry.cpu_snapshot()
        sens = Telemetry.sensors()
        ext = sens.get("external") or {}
        nv = sens.get("nvidia") or {}
        mem = Telemetry.memory()
        batt_status, batt_pct = Telemetry.battery()

        tz = cpu.get("thermal_zones") or {}
        cpu_temp = ext.get("cpu_temp")
        temp_source = "LibreHardwareMonitor" if cpu_temp is not None else None
        if cpu_temp is None and tz:
            cpu_temp = max(tz.values())
            temp_source = "Zona térmica ACPI"

        disk_temp = (ext.get("disk_temps") or [None])[0]
        if disk_temp is None and getattr(cls, "_disk_is_nvme", False):
            disk_temp = cls._nvme_temp()

        fans = ext.get("fans") or []
        cpu_fan = next((f["rpm"] for f in fans if not f["gpu"] and "cpu" in f["name"].lower()), None)
        if cpu_fan is None:
            cpu_fan = next((f["rpm"] for f in fans if not f["gpu"]), None)
        chassis = [f["rpm"] for f in fans if not f["gpu"]]
        chassis_fan = chassis[1] if len(chassis) > 1 else None
        gpu_fan = next((f["rpm"] for f in fans if f["gpu"]), None)
        volt = ext.get("voltages") or {}

        # Limitação de clock (dados do Windows): 100% = sem limitação
        lim = cpu.get("performance_limit_pct")
        passive = cpu.get("thermal_passive_limit_pct")
        limits = [v for v in (lim, passive) if v is not None]
        throttling = round(max(0.0, 100.0 - min(limits)), 1) if limits else None
        thermal = passive is not None and passive < 100

        # Taxas de trabalho (MB/s, Mops/s)
        now = time.time()
        work = dict(cls._work)
        if cls._work_prev:
            dt = max(0.001, now - cls._work_prev[0])
            pw = cls._work_prev[1]
            cls._rates = {
                "cpu_mb_s": round((work["cpu_bytes"] - pw["cpu_bytes"]) / dt / 1e6, 1),
                "fpu_mops": round((work["fpu_ops"] - pw["fpu_ops"]) / dt / 1e6, 1),
                "cache_mops": round((work["cache_ops"] - pw["cache_ops"]) / dt / 1e6, 1),
                "mem_gb_s": round((work["mem_verified_bytes"] - pw["mem_verified_bytes"]) / dt / 1e9, 2),
                "disk_w_mb_s": round((work["disk_written_bytes"] - pw["disk_written_bytes"]) / dt / 1e6, 1),
                "disk_r_mb_s": round((work["disk_read_bytes"] - pw["disk_read_bytes"]) / dt / 1e6, 1),
            }
        cls._work_prev = (now, work)

        gpu_fps = cls._gpu_client["fps"] if now - cls._gpu_client["ts"] < 3 else None

        return {
            "cpu_temp": cpu_temp,
            "temp_source": temp_source,
            "core_temps": ext.get("core_temps") or [],
            "mobo_temp": ext.get("mobo_temp"),
            "disk_temp": disk_temp,
            "disk_name": cls._disk_model_name,
            "gpu_temp": nv.get("temp") if nv.get("temp") is not None else ext.get("gpu_temp"),
            "gpu_hotspot": ext.get("gpu_hotspot"),
            "gpu_name": cls._gpu_model_name,
            "gpu_usage": nv.get("usage"),
            "gpu_fps": gpu_fps,
            "cpu_fan": cpu_fan,
            "gpu_fan": gpu_fan,
            "gpu_fan_pct": nv.get("fan_pct"),
            "chassis_fan": chassis_fan,
            "fans": fans,
            "vcore": volt.get("vcore"),
            "v12": volt.get("v12"),
            "v5": volt.get("v5"),
            "v33": volt.get("v33"),
            "dram_v": volt.get("dram_v"),
            "cpu_power": ext.get("cpu_power"),
            "cores_power": ext.get("cores_power"),
            "gpu_power": nv.get("power") if nv.get("power") is not None else ext.get("gpu_power"),
            "clocks": ext.get("core_clocks") or cpu.get("clocks") or [],
            "avg_clock": cpu.get("avg_clock"),
            "nominal_clock": cpu.get("nominal_clock"),
            "gpu_clock": nv.get("clock"),
            "cpu_usage": cpu.get("usage"),
            "per_core_usage": cpu.get("per_core_usage"),
            "cpu_throttling": throttling,
            "performance_limit_pct": lim,
            "thermal_throttling": thermal,
            "ram_usage_pct": mem["percent"],
            "ram_used_gb": mem["used_gb"],
            "ram_total_gb": mem["total_gb"],
            "battery_status": batt_status,
            "battery_pct": batt_pct,
            "elapsed_sec": elapsed,
            "elapsed_str": _fmt_elapsed(elapsed),
            "test_started_str": cls._start_time_str,
            "memory_errors": cls._errors["memory"],
            "throttling_active": bool(throttling and throttling >= 5 and (cpu.get("usage") or 0) > 50),
            "rates": dict(cls._rates),
            "sensor_sources": {
                "temperatures": temp_source,
                "board": sens.get("external_source"),
                "gpu": "nvidia-smi" if nv else (sens.get("external_source") if ext.get("gpu_temp") is not None else None),
                "clocks": cpu.get("clock_source"),
            },
        }

    @classmethod
    def _nvme_temp(cls):
        now = time.time()
        if now - getattr(cls, "_nvme_temp_ts", 0) < 10:
            return getattr(cls, "_nvme_temp_val", None)
        val = None
        try:
            from backend.disk_health_engine import read_nvme_health
            nv = read_nvme_health(getattr(cls, "_disk_index", 0))
            val = nv.get("temperature") if nv else None
        except Exception:
            val = None
        cls._nvme_temp_ts, cls._nvme_temp_val = now, val
        return val

    @classmethod
    def _sampler_loop(cls, stop):
        while not stop.wait(timeout=1.0):
            if not cls._running:
                break
            elapsed = int(time.time() - cls._start_time)
            lim = cls._config.get("duration_limit_sec", 0)
            if lim and elapsed >= lim:
                cls._add_sector_entry("Duração programada atingida — encerrando com segurança")
                threading.Thread(target=cls.stop_test, kwargs={"completed": True}, daemon=True).start()
                break
            try:
                snap = cls._collect_snapshot(elapsed)
            except Exception as ex:  # nunca derruba o teste por falha de telemetria
                LogManager.add_log(f"[STRESSPULSE] Falha de telemetria: {ex}")
                continue

            thr = snap.get("throttling_active")
            if thr and not cls._throttling_active:
                cls._throttling_active = True
                kind = "térmica" if snap.get("thermal_throttling") else "energia/temperatura"
                cls._add_sector_entry(f"Limitação de clock detectada ({kind}): {snap['cpu_throttling']}% abaixo do nominal", "warn")
            elif not thr and cls._throttling_active:
                cls._throttling_active = False
                cls._add_sector_entry("Limitação de clock encerrada")

            with cls._lock:
                if not cls._running:
                    break
                cls._elapsed_sec = elapsed
                cls._update_stats(snap)
                cls._history.append(snap)

    @classmethod
    def _update_stats(cls, cur):
        keys = ["mobo_temp", "cpu_temp", "disk_temp", "gpu_temp", "cpu_fan", "gpu_fan", "chassis_fan",
                "vcore", "v12", "v5", "v33", "dram_v", "cpu_power", "cores_power", "gpu_power",
                "avg_clock", "gpu_clock", "cpu_usage", "cpu_throttling", "ram_usage_pct", "ram_used_gb", "gpu_usage"]
        pairs = [(k, cur.get(k)) for k in keys]
        pairs += [(f"core_temp_{i + 1}", v) for i, v in enumerate(cur.get("core_temps") or [])]
        # Vazão de cada componente EM CARGA (ignora os 5 s iniciais de alocação/aquecimento)
        cfg = cls._config
        rates = cur.get("rates") or {}
        if (cur.get("elapsed_sec") or 0) >= 5:
            active = {"cpu_mb_s": cfg["stress_cpu"], "fpu_mops": cfg["stress_fpu"],
                      "cache_mops": cfg["stress_cache"], "mem_gb_s": cfg["stress_memory"]}
            pairs += [(f"rate_{k}", rates.get(k)) for k, on in active.items() if on]
            if cfg["stress_disk"] and rates.get("disk_w_mb_s") is not None:
                pairs.append(("rate_disk_mb_s", round(rates["disk_w_mb_s"] + rates.get("disk_r_mb_s", 0), 1)))
            if cfg["stress_gpu"]:
                pairs.append(("rate_gpu_fps", cur.get("gpu_fps")))
        for key, val in pairs:
            if val is None:
                continue
            st = cls._stats.get(key)
            if st is None:
                cls._stats[key] = {"current": val, "min": val, "max": val, "avg": val, "sum": val,
                                   "sumsq": val * val, "count": 1, "std": 0.0}
            else:
                st["current"] = val
                st["min"] = min(st["min"], val)
                st["max"] = max(st["max"], val)
                st["sum"] += val
                st["sumsq"] = st.get("sumsq", 0.0) + val * val
                st["count"] += 1
                st["avg"] = round(st["sum"] / st["count"], 2)
                var = max(0.0, st["sumsq"] / st["count"] - (st["sum"] / st["count"]) ** 2)
                st["std"] = round(var ** 0.5, 3)

    # ------------------------------------------------------------------
    # CONTROLES PÚBLICOS
    # ------------------------------------------------------------------
    @classmethod
    def start_test(cls, config=None):
        from backend.stress_bench_engine import StressBenchEngine
        if StressBenchEngine._running:
            return False, "O benchmark de estresse (StressBench) está em execução. Aguarde ou interrompa-o."
        if cls._running:
            cls.stop_test()
            time.sleep(0.2)
        with cls._lock:
            cls._init_hardware_names()
            if config and isinstance(config, dict):
                for k in ("stress_cpu", "stress_fpu", "stress_cache", "stress_memory", "stress_disk", "stress_gpu"):
                    if k in config or (k + "s") in config:
                        cls._config[k] = bool(config.get(k, config.get(k + "s")))
                for k in ("threads", "memory_mb", "duration_limit_sec"):
                    if k in config:
                        try:
                            cls._config[k] = int(config[k])
                        except (TypeError, ValueError):
                            pass
            cfg = cls._config
            if np is None and (cfg["stress_fpu"] or cfg["stress_cache"] or cfg["stress_memory"]):
                return False, "NumPy não está disponível: FPU, Cache e RAM não podem ser testados."

            threads = cfg.get("threads") or 0
            threads = threads if threads > 0 else (os.cpu_count() or 4)
            threads = max(1, min(256, threads))
            mem_mb = max(128, int(cfg.get("memory_mb") or 2048))

            cls._running = True
            cls._stop_event = threading.Event()
            stop = cls._stop_event
            cls._workers = []
            cls._start_time = time.time()
            cls._start_time_str = time.strftime("%d/%m/%Y %H:%M:%S")
            cls._elapsed_sec = 0
            cls._throttling_active = False
            cls._errors = {k: 0 for k in cls._errors}
            cls._work = {k: 0 for k in cls._work}
            cls._work_prev = None
            cls._rates = {}
            cls._memory_tested_mb = 0
            cls._stats.clear()
            cls._history.clear()
            cls._add_sector_entry("Teste de estabilidade iniciado")

            def spawn(fn, *args, name=""):
                t = threading.Thread(target=fn, args=(stop,) + args, daemon=True, name=name)
                cls._workers.append(t)
                t.start()

            # Quando CPU e FPU estão ativos, divide as threads para não sobrecarregar o agendador
            cpu_n = fpu_n = threads
            if cfg["stress_cpu"] and cfg["stress_fpu"]:
                cpu_n = max(1, threads // 2)
                fpu_n = max(1, threads - cpu_n)
            if cfg["stress_cpu"]:
                cls._add_sector_entry(f"CPU: {cpu_n} thread(s) de SHA-256/BLAKE2b verificados")
                for i in range(cpu_n):
                    spawn(cls._worker_cpu, i, name=f"cpu{i}")
            if cfg["stress_fpu"]:
                cls._add_sector_entry(f"FPU: {fpu_n} thread(s) de ponto flutuante float64 verificados")
                for i in range(fpu_n):
                    spawn(cls._worker_fpu, i, name=f"fpu{i}")
            if cfg["stress_cache"]:
                n = max(1, min(threads, 4))
                cls._add_sector_entry(f"Cache: {n} thread(s) de acesso aleatório em 8 MiB")
                for i in range(n):
                    spawn(cls._worker_cache, i, name=f"cache{i}")
            if cfg["stress_memory"]:
                cls._add_sector_entry(f"RAM: alocando {mem_mb} MB")
                spawn(cls._worker_memory, mem_mb, name="mem")
            if cfg["stress_disk"]:
                cls._add_sector_entry(f"Disco: gravação/leitura verificada sem cache ({cls._disk_model_name or 'unidade do sistema'})")
                spawn(cls._worker_disk, name="disk")
            if cfg["stress_gpu"]:
                cls._add_sector_entry(f"GPU: carga WebGL2 iniciada pela interface ({cls._gpu_model_name or 'GPU'})")

            cls._sampler_thread = threading.Thread(target=cls._sampler_loop, args=(stop,), daemon=True)
            cls._sampler_thread.start()
            return True, "Teste de estabilidade iniciado."

    @classmethod
    def stop_test(cls, completed=False):
        with cls._lock:
            cls._stop_event.set()
            if not cls._running:
                return True, "O teste de estabilidade já está parado."
            cls._running = False
            workers = list(cls._workers)
            cls._workers = []
            cls._throttling_active = False
        total_err = sum(cls._errors.values())
        dur = _fmt_elapsed(time.time() - cls._start_time)
        if total_err:
            cls._add_sector_entry(f"Teste encerrado após {dur}: {total_err} ERRO(S) detectado(s) — sistema INSTÁVEL", "error")
        else:
            cls._add_sector_entry(f"Teste {'concluído' if completed else 'interrompido'} após {dur}: nenhum erro detectado")

        def _cleanup():
            for w in workers:
                try:
                    w.join(timeout=3)
                except Exception:
                    pass
            gc.collect()
        threading.Thread(target=_cleanup, daemon=True).start()
        return True, "Teste de estabilidade encerrado."

    @classmethod
    def reset_stats(cls):
        with cls._lock:
            cls._stats.clear()
            cls._history.clear()
            cls._sector_log.clear()
        cls._add_sector_entry("Estatísticas e histórico reiniciados")
        return True, "Estatísticas limpas."

    @classmethod
    def report_gpu_client(cls, fps=None, renderer=None):
        """Recebe da interface o FPS da carga WebGL2 (prova de que a GPU está trabalhando)."""
        try:
            cls._gpu_client = {"fps": round(float(fps), 1) if fps is not None else None,
                               "ts": time.time(), "renderer": renderer}
        except (TypeError, ValueError):
            pass
        return True

    @classmethod
    def get_status(cls):
        cls._init_hardware_names()
        with cls._lock:
            running = cls._running
            history = list(cls._history)
            stats = {k: dict(v) for k, v in cls._stats.items()}
            sector_log = list(cls._sector_log)
            cfg = dict(cls._config)
            errors = dict(cls._errors)
            elapsed = cls._elapsed_sec
            mem_tested = cls._memory_tested_mb if running else 0
            throttling = cls._throttling_active

        if running and history:
            cur = history[-1]
        else:
            cur = cls._collect_snapshot(elapsed)

        return {
            "running": running,
            "elapsed_sec": elapsed,
            "elapsed_str": _fmt_elapsed(elapsed),
            "test_started_str": cls._start_time_str,
            "config": cfg,
            "current": cur,
            "statistics": stats,
            "history": history[-180:],
            "sector_log": sector_log,
            "errors": errors,
            "errors_total": sum(errors.values()),
            "memory_errors": errors["memory"],
            "memory_tested_mb": mem_tested,
            "work": {k: int(v) for k, v in cls._work.items()},
            "rates": dict(cls._rates),
            "disk_io_mb": round((cls._work["disk_written_bytes"] + cls._work["disk_read_bytes"]) / 1e6, 1),
            "throttling_active": throttling,
            "system_threads": os.cpu_count() or 4,
            "max_clock": cur.get("nominal_clock"),
            "disk_name": cls._disk_model_name,
            "gpu_name": cls._gpu_model_name,
            "gpu_renderer": cls._gpu_client.get("renderer"),
            "battery_status": cur.get("battery_status"),
            "numpy": np is not None,
            "lhm": cls._lhm_info(),
        }

    @classmethod
    def _lhm_info(cls):
        from backend.telemetry import find_lhm
        return {"installed_path": find_lhm()}


# ==============================================================================
# ARQUIVO SEM CACHE (FILE_FLAG_NO_BUFFERING) PARA O TESTE DE DISCO
# ==============================================================================
class _UnbufferedFile:
    def __init__(self, path, block):
        self.path = path
        self.block = block
        self.h = None
        self.f = None
        self.buf = None

    def open(self):
        if IS_WINDOWS:
            try:
                k32 = ctypes.WinDLL("kernel32", use_last_error=True)
                k32.CreateFileW.restype = wintypes.HANDLE
                k32.CreateFileW.argtypes = [wintypes.LPCWSTR, wintypes.DWORD, wintypes.DWORD, wintypes.LPVOID,
                                            wintypes.DWORD, wintypes.DWORD, wintypes.HANDLE]
                k32.VirtualAlloc.restype = ctypes.c_void_p
                k32.VirtualAlloc.argtypes = [ctypes.c_void_p, ctypes.c_size_t, wintypes.DWORD, wintypes.DWORD]
                k32.SetFilePointerEx.argtypes = [wintypes.HANDLE, ctypes.c_longlong, ctypes.c_void_p, wintypes.DWORD]
                k32.ReadFile.argtypes = [wintypes.HANDLE, ctypes.c_void_p, wintypes.DWORD, ctypes.POINTER(wintypes.DWORD), ctypes.c_void_p]
                k32.WriteFile.argtypes = [wintypes.HANDLE, ctypes.c_void_p, wintypes.DWORD, ctypes.POINTER(wintypes.DWORD), ctypes.c_void_p]
                k32.CloseHandle.argtypes = [wintypes.HANDLE]
                k32.FlushFileBuffers.argtypes = [wintypes.HANDLE]
                k32.VirtualFree.argtypes = [ctypes.c_void_p, ctypes.c_size_t, wintypes.DWORD]
                self.k32 = k32
                h = k32.CreateFileW(self.path, 0xC0000000, 0, None, 2,  # GENERIC_RW, CREATE_ALWAYS
                                    0x20000000 | 0x80000000 | 0x04000000,  # NO_BUFFERING|WRITE_THROUGH|DELETE_ON_CLOSE
                                    None)
                if h and h != wintypes.HANDLE(-1).value:
                    self.h = h
                    self.buf = k32.VirtualAlloc(None, self.block, 0x3000, 0x04)
                    return bool(self.buf)
            except Exception:
                self.h = None
        try:
            self.f = open(self.path, "w+b", buffering=0)
            return True
        except OSError:
            return False

    def write_at(self, off, data):
        if self.h:
            ctypes.memmove(self.buf, data, len(data))
            self.k32.SetFilePointerEx(self.h, off, None, 0)
            n = wintypes.DWORD(0)
            return bool(self.k32.WriteFile(self.h, self.buf, len(data), ctypes.byref(n), None)) and n.value == len(data)
        self.f.seek(off)
        return self.f.write(data) == len(data)

    def read_at(self, off):
        if self.h:
            self.k32.SetFilePointerEx(self.h, off, None, 0)
            n = wintypes.DWORD(0)
            if not self.k32.ReadFile(self.h, self.buf, self.block, ctypes.byref(n), None) or n.value != self.block:
                return None
            return ctypes.string_at(self.buf, self.block)
        self.f.seek(off)
        d = self.f.read(self.block)
        return d if len(d) == self.block else None

    def flush(self):
        if self.h:
            self.k32.FlushFileBuffers(self.h)
        elif self.f:
            self.f.flush()
            os.fsync(self.f.fileno())

    def close(self):
        try:
            if self.h:
                self.k32.CloseHandle(self.h)
                if self.buf:
                    self.k32.VirtualFree(ctypes.c_void_p(self.buf), 0, 0x8000)
            elif self.f:
                self.f.close()
        except Exception:
            pass
        self.h = self.f = None


StressPulseEngine = StressEngine
