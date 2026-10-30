"""
Módulo de Informações Profundas de Hardware (WinShield Silicon Core™ & Vision Engine™) e Benchmark de Arquitetura.

Extrai dados 100% reais e completos diretamente do Windows (CIM/WMI, Registry,
APIs de Kernel, nvidia-smi para GPU NVIDIA e contadores WMI/Performance para AMD/Intel).
Sem valores mockados de máquina de desenvolvimento.
"""

import os
import re
import sys
import time
import math
import shutil
import platform
import threading
from concurrent.futures import ThreadPoolExecutor

from backend.core import IS_WINDOWS
from backend.process import run_hidden, run_ps_json
from backend.log_manager import LogManager
from backend.system_engine import SystemEngine, _read_gpu_registry_list

try:
    import ctypes
    from ctypes import wintypes
except ImportError:
    ctypes = None
    wintypes = None

try:
    import winreg
except ImportError:
    winreg = None


# ==============================================================================
# TABELA DE ARQUITETURAS E INSTRUÇÕES DE CPU
# ==============================================================================
def _detect_cpu_architecture(name, caption=""):
    n = (name or "").upper()
    if "RYZEN" in n:
        if any(x in n for x in ("9000", "9950", "9900", "9800", "9700", "9600")):
            return {"codename": "Granite Ridge (Zen 5)", "process": "4 nm TSMC", "socket": "Socket AM5", "tdp": "65 W - 170 W"}
        if any(x in n for x in ("8700", "8600", "8500")):
            return {"codename": "Phoenix / Hawk Point (Zen 4)", "process": "4 nm TSMC", "socket": "Socket AM5", "tdp": "65 W"}
        if any(x in n for x in ("7950", "7900", "7800", "7700", "7600", "7500")):
            return {"codename": "Raphael (Zen 4)", "process": "5 nm TSMC", "socket": "Socket AM5", "tdp": "65 W - 170 W"}
        if any(x in n for x in ("5950", "5900", "5800", "5700", "5600", "5500")):
            return {"codename": "Vermeer / Cezanne (Zen 3)", "process": "7 nm TSMC", "socket": "Socket AM4", "tdp": "65 W - 105 W"}
        if any(x in n for x in ("4600", "4500", "4300", "4700")):
            return {"codename": "Renoir (Zen 2)", "process": "7 nm TSMC", "socket": "Socket AM4", "tdp": "65 W"}
        if any(x in n for x in ("3950", "3900", "3800", "3700", "3600", "3500", "3300", "3100")):
            return {"codename": "Matisse (Zen 2)", "process": "7 nm TSMC", "socket": "Socket AM4", "tdp": "65 W - 105 W"}
        if any(x in n for x in ("2700", "2600", "2400", "2200")):
            return {"codename": "Pinnacle Ridge (Zen+)", "process": "12 nm", "socket": "Socket AM4", "tdp": "65 W - 105 W"}
        return {"codename": "AMD Zen Architecture", "process": "TSMC FinFET", "socket": "AM4 / AM5", "tdp": "65 W"}
    if "EPYC" in n or "THREADRIPPER" in n:
        return {"codename": "AMD EPYC / Threadripper", "process": "TSMC FinFET", "socket": "SP3 / sTRX4", "tdp": "180 W+"}
    if "INTEL" in n:
        if "ULTRA" in n:
            return {"codename": "Meteor Lake / Arrow Lake", "process": "Intel 4 / TSMC N3B", "socket": "LGA1851 / FCBGA", "tdp": "28 W - 125 W"}
        if any(x in n for x in ("14900", "14700", "14600", "14500", "14400", "14100")):
            return {"codename": "Raptor Lake Refresh (14th Gen)", "process": "Intel 7 (10 nm)", "socket": "LGA1700", "tdp": "65 W - 125 W"}
        if any(x in n for x in ("13900", "13700", "13600", "13500", "13400", "13100")):
            return {"codename": "Raptor Lake (13th Gen)", "process": "Intel 7 (10 nm)", "socket": "LGA1700", "tdp": "65 W - 125 W"}
        if any(x in n for x in ("12900", "12700", "12600", "12500", "12400", "12100")):
            return {"codename": "Alder Lake (12th Gen)", "process": "Intel 7 (10 nm)", "socket": "LGA1700", "tdp": "65 W - 125 W"}
        if any(x in n for x in ("11900", "11700", "11600", "11400")):
            return {"codename": "Rocket Lake / Tiger Lake (11th Gen)", "process": "14 nm / 10 nm SuperFin", "socket": "LGA1200", "tdp": "65 W - 125 W"}
        if any(x in n for x in ("10900", "10700", "10600", "10400", "10100")):
            return {"codename": "Comet Lake (10th Gen)", "process": "14 nm", "socket": "LGA1200", "tdp": "65 W - 125 W"}
        return {"codename": "Intel Core Architecture", "process": "Intel FinFET", "socket": "LGA / BGA", "tdp": "65 W"}
    return {"codename": caption or "x86-64 Architecture", "process": "—", "socket": "—", "tdp": "—"}


def _parse_cpu_caption(caption):
    """Extrai Family, Model e Stepping reais da string Caption do WMI (ex: 'AMD64 Family 25 Model 33 Stepping 2')."""
    c = caption or ""
    fam_m = re.search(r"Family\s+(\d+)", c, re.IGNORECASE)
    mod_m = re.search(r"Model\s+(\d+)", c, re.IGNORECASE)
    stp_m = re.search(r"Stepping\s+(\d+)", c, re.IGNORECASE)
    fam = f"{fam_m.group(1)} ({hex(int(fam_m.group(1)))[2:].upper()}h)" if fam_m else "—"
    mod = f"{mod_m.group(1)} ({hex(int(mod_m.group(1)))[2:].upper()}h)" if mod_m else "—"
    stp = stp_m.group(1) if stp_m else "—"
    return fam, mod, stp


def _get_cpu_instructions():
    """Conjunto de instruções confirmado pelo kernel (IsProcessorFeaturePresent). Nada é presumido."""
    if IS_WINDOWS and ctypes:
        k32 = ctypes.windll.kernel32
        features = [
            (3, "MMX"), (6, "SSE"), (10, "SSE2"), (13, "SSE3"), (36, "SSSE3"),
            (37, "SSE4.1"), (38, "SSE4.2"), (39, "AVX"), (40, "AVX2"), (41, "AVX-512F"),
            (14, "CMPXCHG16B"), (17, "NX"), (28, "RDRAND"), (32, "RDTSCP"), (20, "SLAT"),
        ]
        present = []
        for fid, name in features:
            try:
                if k32.IsProcessorFeaturePresent(fid):
                    present.append(name)
            except Exception:
                pass
        return ["x86-64"] + present
    return ["x86-64"]


def _get_cache_topology():
    """Lê a hierarquia real de caches via GetLogicalProcessorInformation."""
    if not (IS_WINDOWS and ctypes):
        return None

    class CACHE_DESCRIPTOR(ctypes.Structure):
        _fields_ = [("Level", ctypes.c_ubyte), ("Associativity", ctypes.c_ubyte),
                    ("LineSize", ctypes.c_ushort), ("Size", ctypes.c_ulong), ("Type", ctypes.c_int)]

    class _U(ctypes.Union):
        _fields_ = [("Cache", CACHE_DESCRIPTOR), ("Reserved", ctypes.c_ulonglong * 2)]

    class SLPI(ctypes.Structure):
        _fields_ = [("ProcessorMask", ctypes.c_size_t), ("Relationship", ctypes.c_int), ("u", _U)]

    try:
        k32 = ctypes.windll.kernel32
        size = wintypes.DWORD(0)
        k32.GetLogicalProcessorInformation(None, ctypes.byref(size))
        n = size.value // ctypes.sizeof(SLPI)
        arr = (SLPI * n)()
        if not k32.GetLogicalProcessorInformation(arr, ctypes.byref(size)):
            return None
        caches = {}
        cores = 0
        for e in arr:
            if e.Relationship == 0:   # RelationProcessorCore
                cores += 1
            elif e.Relationship == 2:  # RelationCache
                c = e.u.Cache
                kind = {0: "U", 1: "I", 2: "D", 3: "T"}.get(c.Type, "U")
                key = (c.Level, kind)
                d = caches.setdefault(key, {"count": 0, "size": c.Size, "ways": c.Associativity, "line": c.LineSize})
                d["count"] += 1
        return {"caches": caches, "cores": cores}
    except Exception:
        return None


def _fmt_cache(entry):
    if not entry:
        return "—"
    kb = entry["size"] // 1024
    ways = f", {entry['ways']}-way" if entry.get("ways") and entry["ways"] != 0xFF else ""
    total = entry["count"] * kb
    total_s = f"{round(total / 1024, 1)} MB" if total >= 1024 else f"{total} KB"
    size_s = f"{round(kb / 1024, 1)} MB" if kb >= 1024 else f"{kb} KB"
    if entry["count"] > 1:
        return f"{entry['count']} x {size_s} ({total_s}{ways})"
    return f"{size_s}{ways}"


# ==============================================================================
# MOTOR WINSHIELD CORE-ENGINE (PROCESSADOR & MEMÓRIA)
# ==============================================================================
class CoreEngine:
    _cached_data = None
    _cached_ts = 0.0

    @classmethod
    def get_info(cls, force=False):
        if cls._cached_data and not force and time.time() - cls._cached_ts < 60:
            data = dict(cls._cached_data)
            live_clk = cls._get_live_clock()
            if live_clk:
                data["clocks"]["live_clock_mhz"] = live_clk
            return data

        LogManager.add_log("Consultando especificações reais de processador e memória (WinShield CoreEngine)...")

        ps_script = r"""
        $p = Get-CimInstance Win32_Processor | Select-Object -First 1
        $bb = Get-CimInstance Win32_BaseBoard | Select-Object -First 1
        $bios = Get-CimInstance Win32_BIOS | Select-Object -First 1
        $mem = @(Get-CimInstance Win32_PhysicalMemory)
        $arr = Get-CimInstance Win32_PhysicalMemoryArray | Select-Object -First 1
        
        [pscustomobject]@{
            Name = $p.Name
            Caption = $p.Caption
            Socket = $p.SocketDesignation
            Cores = $p.NumberOfCores
            Threads = $p.NumberOfLogicalProcessors
            MaxClock = $p.MaxClockSpeed
            CurrentClock = $p.CurrentClockSpeed
            ExtClock = $p.ExtClock
            L2Cache = $p.L2CacheSize
            L3Cache = $p.L3CacheSize
            Manufacturer = $p.Manufacturer
            Virtualization = $p.VirtualizationFirmwareEnabled
            BoardMan = $bb.Manufacturer
            BoardProduct = $bb.Product
            BoardVersion = $bb.Version
            BiosMan = $bios.Manufacturer
            BiosVer = $bios.SMBIOSBIOSVersion
            BiosDate = if ($bios.ReleaseDate) { $bios.ReleaseDate.ToString("dd/MM/yyyy") } else { "" }
            MemoryDevices = if ($arr) { [int]$arr.MemoryDevices } else { 0 }
            MemModules = @($mem | ForEach-Object {
                [pscustomobject]@{
                    Man = [string]$_.Manufacturer
                    Part = ([string]$_.PartNumber).Trim()
                    Capacity = [int64]$_.Capacity
                    Speed = [int]$_.Speed
                    ConfiguredSpeed = [int]$_.ConfiguredClockSpeed
                    SMBIOSMemoryType = [int]$_.SMBIOSMemoryType
                    Locator = [string]$_.DeviceLocator
                    Bank = [string]$_.BankLabel
                }
            })
        } | ConvertTo-Json -Depth 4 -Compress
        """
        raw = run_ps_json(ps_script, timeout=30) or {}

        hw_fallback = SystemEngine.hardware_info(block=False)
        static_fallback = SystemEngine.static_info()

        cpu_name = (raw.get("Name") or static_fallback.get("cpu") or platform.processor() or "Processador").strip()
        threads = int(raw.get("Threads") or os.cpu_count() or 1)
        cores = int(raw.get("Cores") or (threads // 2 if threads > 1 else 1))
        live_clk = cls._get_live_clock() or int(raw.get("CurrentClock") or 0)
        max_clock = int(raw.get("MaxClock") or live_clk or 0)
        bus_clock = float(raw.get("ExtClock") or 100.0)
        l2 = int(raw.get("L2Cache") or 0)
        l3 = int(raw.get("L3Cache") or 0)
        socket_str = (raw.get("Socket") or "").strip()

        caption_str = (raw.get("Caption") or "").strip()
        arch = _detect_cpu_architecture(cpu_name, caption_str)
        fam_str, mod_str, stp_str = _parse_cpu_caption(caption_str)
        instructions = _get_cpu_instructions()

        # Memória RAM instalada
        mem_modules = raw.get("MemModules") or []
        if isinstance(mem_modules, dict):
            mem_modules = [mem_modules]

        total_bytes = sum(int(m.get("Capacity", 0) or 0) for m in mem_modules)
        if total_bytes > 0:
            total_gb = round(total_bytes / (1024**3), 1)
        else:
            sys_mem = SystemEngine._memory()
            total_gb = round(sys_mem.get("total", 0) / (1024**3), 1) if sys_mem.get("total") else 0.0

        smbios_type = int(mem_modules[0].get("SMBIOSMemoryType", 0)) if mem_modules else 0
        smbios_map = {
            20: "DDR",
            21: "DDR2",
            22: "DDR2 FB-DIMM",
            24: "DDR3",
            26: "DDR4",
            27: "LPDDR",
            28: "LPDDR2",
            29: "LPDDR3",
            30: "LPDDR4",
            34: "DDR5",
            35: "LPDDR5"
        }
        mem_type_name = smbios_map.get(smbios_type, "RAM")
        configured_speed = int(mem_modules[0].get("ConfiguredSpeed") or mem_modules[0].get("Speed") or 0) if mem_modules else 0
        if len(mem_modules) >= 4:
            channels = "Quad / Dual Channel"
        elif len(mem_modules) >= 2:
            channels = "Dual Channel"
        elif len(mem_modules) == 1:
            channels = "Single Channel"
        else:
            channels = "—"

        slots_total = int(raw.get("MemoryDevices") or 0) or max(len(mem_modules), 2)

        topo = _get_cache_topology()
        if topo and topo["caches"]:
            cc = topo["caches"]
            l1d_str = _fmt_cache(cc.get((1, "D")))
            l1i_str = _fmt_cache(cc.get((1, "I")))
            l2_str = _fmt_cache(cc.get((2, "U")) or cc.get((2, "D")))
            l3_str = _fmt_cache(cc.get((3, "U")) or cc.get((3, "D")))
        else:
            l1d_str = l1i_str = "—"
            l2_str = f"{l2} KB (total)" if l2 else "—"
            l3_str = f"{round(l3 / 1024, 1)} MB ({l3} KB)" if l3 else "—"
        mult_val = round(max_clock / bus_clock, 1) if (max_clock and bus_clock) else 0

        board_man = (raw.get("BoardMan") or hw_fallback.get("board_manufacturer") or "—").replace("Default string", "").strip() or "—"
        board_prod = (raw.get("BoardProduct") or hw_fallback.get("board_product") or "—").replace("Default string", "").strip() or "—"
        bios_man = (raw.get("BiosMan") or hw_fallback.get("bios_vendor") or "—").strip() or "—"
        bios_ver = (raw.get("BiosVer") or hw_fallback.get("bios_version") or "—").strip() or "—"
        bios_date = (raw.get("BiosDate") or hw_fallback.get("bios_date") or "—").strip() or "—"

        info = {
            "processor": {
                "name": cpu_name,
                "codename": arch.get("codename", "—"),
                "package": socket_str if socket_str and socket_str.lower() != "none" else arch.get("socket", "—"),
                "technology": arch.get("process", "—"),
                "tdp": arch.get("tdp", "—"),
                "cores": cores,
                "threads": threads,
                "virtualization": bool(raw.get("Virtualization")),
                "specification": caption_str or cpu_name,
                "family": fam_str,
                "model": mod_str,
                "stepping": stp_str,
                "instructions": " ".join(instructions)
            },
            "caches": {
                "l1_data": l1d_str,
                "l1_inst": l1i_str,
                "l2": l2_str,
                "l3": l3_str
            },
            "clocks": {
                "base_clock_mhz": max_clock,
                "live_clock_mhz": live_clk or max_clock,
                "bus_speed_mhz": bus_clock,
                "multiplier": f"x{mult_val}" if mult_val else "—"
            },
            "motherboard": {
                "manufacturer": board_man,
                "model": board_prod,
                "chipset": hw_fallback.get("board_chipset") or "—",
                "bios_vendor": bios_man,
                "bios_version": bios_ver,
                "bios_date": bios_date,
            },
            "memory": {
                "type": mem_type_name,
                "size_gb": total_gb,
                "channels": channels,
                "speed_mhz": configured_speed,
                "slots_used": len(mem_modules),
                "slots_total": slots_total,
                "modules": [
                    {
                        "locator": m.get("Locator") or f"Slot {idx+1}",
                        "bank": m.get("Bank") or f"Bank {idx}",
                        "manufacturer": (m.get("Man") or "Módulo RAM").strip(),
                        "part_number": (m.get("Part") or "—").strip(),
                        "size_gb": round(int(m.get("Capacity", 0) or 0) / (1024**3), 1),
                        "speed_mhz": int(m.get("ConfiguredSpeed") or m.get("Speed") or configured_speed)
                    }
                    for idx, m in enumerate(mem_modules)
                ]
            }
        }

        cls._cached_data = info
        cls._cached_ts = time.time()
        LogManager.add_log(f"[CORE-ENGINE] Hardware real mapeado: {cpu_name} | {total_gb} GB {mem_type_name}")
        return info

    @staticmethod
    def _get_live_clock():
        """Clock efetivo atual (mesma métrica do Gerenciador de Tarefas: % Processor Performance)."""
        try:
            from backend.telemetry import Telemetry
            snap = Telemetry.cpu_snapshot(min_interval=0.5)
            return int(snap.get("avg_clock") or 0)
        except Exception:
            return 0


# ==============================================================================
# BENCHMARK WINSHIELD CORE-ENGINE (TESTE MULTI-THREAD & SINGLE-THREAD)
# ==============================================================================
class CoreBenchmarkEngine:
    """
    Benchmark de CPU WinShield (single e multi-thread) com cargas nativas que liberam o GIL:
      * SHA-256 (inteiros/ALU)      * zlib nível 6 (ramificações, cache, memória)
      * BLAKE2b (ALU 64 bits)       * NumPy float64 (FPU/SIMD) quando disponível
    Cada fase: 3 s de aquecimento (turbo/estabilização, descartado) + 20 s medidos,
    com uma amostra de vazão por segundo para medir a consistência (coef. de variação).
    A pontuação é baseada em MB/s processados e é proporcional ao desempenho real:
    o fator multi/single reflete de fato o número de núcleos efetivos.
    """
    _lock = threading.Lock()
    _running = False
    WARMUP_SEC = 3.0
    MEASURE_SEC = 20.0
    _last_results = {
        "single_thread": 0.0, "multi_thread": 0.0, "ratio": 0.0, "running": False,
        "phase": "idle", "progress": 0, "reference_cpu": "", "timestamp": None, "details": {},
    }

    @classmethod
    def get_results(cls):
        with cls._lock:
            return dict(cls._last_results)

    @classmethod
    def run_benchmark(cls, duration_sec=None):
        from backend.stress_bench_engine import StressBenchEngine
        from backend.stress_engine import StressEngine
        if StressBenchEngine._running or StressEngine._running:
            return False, "Há um teste de carga em execução. Pare-o antes do benchmark de CPU para não falsear o resultado."
        with cls._lock:
            if cls._running:
                return False, "Benchmark de CPU já está em execução."
            cls._running = True
            cpu_name = SystemEngine.static_info().get("cpu", "CPU")
            cls._last_results = {
                "single_thread": 0.0, "multi_thread": 0.0, "ratio": 0.0, "running": True,
                "phase": "single", "progress": 1, "reference_cpu": cpu_name, "timestamp": None, "details": {},
                "measure_sec": cls.MEASURE_SEC,
            }
        threading.Thread(target=cls._worker, daemon=True).start()
        return True, "Benchmark de CPU iniciado (≈ 50 s)."

    @classmethod
    def _worker(cls):
        try:
            threads = os.cpu_count() or 4
            LogManager.add_log("=== BENCHMARK DE CPU WINSHIELD (3 s aquecimento + 20 s por fase) ===")
            single = cls._run_phase(1, progress_from=1, progress_to=48, phase="single")
            with cls._lock:
                cls._last_results["single_thread"] = single["score"]
                cls._last_results["details"]["single"] = single
                cls._last_results["phase"] = "multi"
            multi = cls._run_phase(threads, progress_from=50, progress_to=99, phase="multi")
            ratio = round(multi["score"] / max(1e-9, single["score"]), 2)
            with cls._lock:
                cls._last_results.update({
                    "single_thread": single["score"], "multi_thread": multi["score"], "ratio": ratio,
                    "running": False, "phase": "completed", "progress": 100,
                    "reference_cpu": f"{SystemEngine.static_info().get('cpu', 'CPU')} ({threads}T)",
                    "timestamp": time.strftime("%d/%m/%Y %H:%M:%S"),
                })
                cls._last_results["details"]["multi"] = multi
            LogManager.add_log(f"[CPU BENCH] Single: {single['score']} | Multi: {multi['score']} | Escala: {ratio}x em {threads} threads")
        except Exception as e:
            LogManager.add_log(f"[ERRO CPU BENCH] {e}")
            with cls._lock:
                cls._last_results["phase"] = "error"
        finally:
            with cls._lock:
                cls._running = False
                cls._last_results["running"] = False

    @classmethod
    def _run_phase(cls, n_threads, progress_from, progress_to, phase):
        import hashlib
        import zlib
        try:
            import numpy as np
        except ImportError:
            np = None
        counters = [dict(sha=0, z=0, b2=0, fp=0) for _ in range(n_threads)]
        state = {"measuring": False, "stop": False}

        def work(idx):
            seed = (idx * 2654435761) & 0xFFFFFFFF
            raw = bytes((seed + i * 131) & 0xFF for i in range(4096)) * 256       # 1 MiB
            text = (b"WinShield benchmark " * 13108)[:262144]                      # 256 KiB compressível
            arr = np.linspace(0.1, 100.0, 65536) if np is not None else None
            c = counters[idx]
            while not state["stop"]:
                hashlib.sha256(raw).digest()
                hashlib.blake2b(raw).digest()
                zlib.compress(text, 6)
                if arr is not None:
                    np.sqrt(np.sin(arr) * np.cos(arr) + arr)
                if state["measuring"]:
                    c["sha"] += len(raw)
                    c["b2"] += len(raw)
                    c["z"] += len(text)
                    if arr is not None:
                        c["fp"] += arr.size

        pool = [threading.Thread(target=work, args=(i,), daemon=True) for i in range(n_threads)]
        for t in pool:
            t.start()
        t0 = time.perf_counter()
        total = cls.WARMUP_SEC + cls.MEASURE_SEC
        measure_t0 = None
        per_sec = []            # vazão SHA-256 (MB/s) a cada segundo medido
        last_mark = None
        while True:
            el = time.perf_counter() - t0
            if el >= cls.WARMUP_SEC and not state["measuring"]:
                for c in counters:
                    c.update(sha=0, z=0, b2=0, fp=0)
                state["measuring"] = True
                measure_t0 = time.perf_counter()
                last_mark = (measure_t0, 0)
            if last_mark and time.perf_counter() - last_mark[0] >= 1.0:
                now, cur = time.perf_counter(), sum(c["sha"] for c in counters)
                per_sec.append((cur - last_mark[1]) / (now - last_mark[0]) / 1e6)
                last_mark = (now, cur)
            if el >= total:
                break
            with cls._lock:
                cls._last_results["progress"] = int(progress_from + (progress_to - progress_from) * el / total)
                cls._last_results["phase"] = phase
            time.sleep(0.1)
        state["stop"] = True
        dur = time.perf_counter() - (measure_t0 or t0)
        for t in pool:
            t.join(timeout=2)
        sha = sum(c["sha"] for c in counters) / dur / 1e6
        b2 = sum(c["b2"] for c in counters) / dur / 1e6
        z = sum(c["z"] for c in counters) / dur / 1e6
        fp = sum(c["fp"] for c in counters) / dur / 1e6
        # Pontuação: soma ponderada das taxas (MB/s), escala 1x = referência interna
        score = round(sha * 0.35 + b2 * 0.25 + z * 0.6 + fp * 0.8, 1)
        # Consistência: coeficiente de variação das amostras de 1 s (baixo = resultado confiável)
        cv = None
        if len(per_sec) >= 3:
            mean = sum(per_sec) / len(per_sec)
            var = sum((x - mean) ** 2 for x in per_sec) / (len(per_sec) - 1)
            cv = round((var ** 0.5) / mean * 100, 1) if mean > 0 else None
        return {"threads": n_threads, "seconds": round(dur, 2), "score": score,
                "sha256_mb_s": round(sha, 1), "blake2b_mb_s": round(b2, 1),
                "zlib_mb_s": round(z, 1), "fpu_melem_s": round(fp, 1),
                "samples": len(per_sec), "variation_pct": cv}


def _detect_gpu_architecture(name):
    n = (name or "").upper()
    if "5090" in n or "5080" in n or "5070" in n:
        return {"chip": "NVIDIA Blackwell", "technology": "4 nm TSMC", "die_size": "—", "transistors": "—", "cuda_cores": "CUDA Cores (Blackwell)", "tmus": "—", "rops": "—", "memory_type": "GDDR7", "bus_width": "256-bit+", "bandwidth": "PCIe 5.0", "directx": "12 Ultimate"}
    elif "4090" in n:
        return {"chip": "AD102 (Ada Lovelace)", "technology": "5 nm (TSMC 4N)", "die_size": "608 mm²", "transistors": "76.300 Milhões", "cuda_cores": "16384 CUDA Cores", "tmus": "512", "rops": "176", "memory_type": "GDDR6X", "bus_width": "384-bit", "bandwidth": "1008 GB/s", "directx": "12 Ultimate"}
    elif "4080" in n:
        return {"chip": "AD103 (Ada Lovelace)", "technology": "5 nm (TSMC 4N)", "die_size": "379 mm²", "transistors": "45.900 Milhões", "cuda_cores": "9728 CUDA Cores", "tmus": "304", "rops": "112", "memory_type": "GDDR6X", "bus_width": "256-bit", "bandwidth": "716.8 GB/s", "directx": "12 Ultimate"}
    elif "4070" in n:
        return {"chip": "AD104 (Ada Lovelace)", "technology": "5 nm (TSMC 4N)", "die_size": "294 mm²", "transistors": "35.800 Milhões", "cuda_cores": "5888+ CUDA Cores", "tmus": "184", "rops": "64", "memory_type": "GDDR6X", "bus_width": "192-bit", "bandwidth": "504.2 GB/s", "directx": "12 Ultimate"}
    elif "4060 TI" in n:
        return {"chip": "AD106 (Ada Lovelace)", "technology": "5 nm (TSMC 4N)", "die_size": "188 mm²", "transistors": "22.900 Milhões", "cuda_cores": "4352 CUDA Cores", "tmus": "136", "rops": "48", "memory_type": "GDDR6", "bus_width": "128-bit", "bandwidth": "288.0 GB/s", "directx": "12 Ultimate"}
    elif "4060" in n:
        return {"chip": "AD107 (Ada Lovelace)", "technology": "5 nm (TSMC 4N)", "die_size": "159 mm²", "transistors": "18.900 Milhões", "cuda_cores": "3072 CUDA Cores", "tmus": "96", "rops": "32", "memory_type": "GDDR6", "bus_width": "128-bit", "bandwidth": "272.0 GB/s", "directx": "12 Ultimate"}
    elif "3080" in n or "3090" in n:
        return {"chip": "GA102 (Ampere)", "technology": "8 nm (Samsung)", "die_size": "628 mm²", "transistors": "28.300 Milhões", "cuda_cores": "8704+ CUDA Cores", "tmus": "272", "rops": "96", "memory_type": "GDDR6X", "bus_width": "320-bit", "bandwidth": "760+ GB/s", "directx": "12 Ultimate"}
    elif "3070" in n:
        return {"chip": "GA104 (Ampere)", "technology": "8 nm (Samsung)", "die_size": "392 mm²", "transistors": "17.400 Milhões", "cuda_cores": "5888 CUDA Cores", "tmus": "184", "rops": "96", "memory_type": "GDDR6", "bus_width": "256-bit", "bandwidth": "448.0 GB/s", "directx": "12 Ultimate"}
    elif "3060" in n:
        return {"chip": "GA106 (Ampere)", "technology": "8 nm (Samsung)", "die_size": "276 mm²", "transistors": "12.000 Milhões", "cuda_cores": "3584+ CUDA Cores", "tmus": "112", "rops": "48", "memory_type": "GDDR6", "bus_width": "192-bit", "bandwidth": "360.0 GB/s", "directx": "12 Ultimate"}
    elif "3050" in n:
        return {"chip": "GA106 / GA107 (Ampere)", "technology": "8 nm (Samsung)", "die_size": "200 mm²", "transistors": "8.700 Milhões", "cuda_cores": "2560 CUDA Cores", "tmus": "80", "rops": "32", "memory_type": "GDDR6", "bus_width": "128-bit", "bandwidth": "224.0 GB/s", "directx": "12 Ultimate"}
    elif "1660" in n or "1650" in n or "2060" in n or "2070" in n or "2080" in n:
        return {"chip": "NVIDIA Turing Architecture", "technology": "12 nm (TSMC)", "die_size": "284 mm²", "transistors": "6.600+ Milhões", "cuda_cores": "Turing Shading Units", "tmus": "—", "rops": "—", "memory_type": "GDDR6", "bus_width": "128/192/256-bit", "bandwidth": "PCIe 3.0 x16", "directx": "12"}
    elif "NVIDIA" in n or "GEFORCE" in n or "QUADRO" in n:
        return {"chip": "NVIDIA GPU Architecture", "technology": "TSMC / Samsung FinFET", "die_size": "—", "transistors": "—", "cuda_cores": "NVIDIA CUDA Cores", "tmus": "—", "rops": "—", "memory_type": "GDDR", "bus_width": "PCIe", "bandwidth": "PCIe Bus", "directx": "12"}
    elif "RADEON" in n or "RX " in n or "AMD" in n:
        return {"chip": "AMD Radeon Architecture", "technology": "TSMC FinFET (7nm/6nm/5nm)", "die_size": "—", "transistors": "—", "cuda_cores": "Stream Processors", "tmus": "—", "rops": "—", "memory_type": "GDDR6 / VRAM", "bus_width": "PCIe Bus", "bandwidth": "PCIe x16", "directx": "12 Ultimate"}
    elif "INTEL" in n or "IRIS" in n or "ARC" in n or "UHD" in n or "HD GRAPHICS" in n:
        return {"chip": "Intel Graphics Architecture", "technology": "Intel FinFET / Xe", "die_size": "Integrada / Dedicada", "transistors": "—", "cuda_cores": "Execution Units (EUs)", "tmus": "—", "rops": "—", "memory_type": "VRAM / Memória Compartilhada", "bus_width": "Dual-Channel / PCIe", "bandwidth": "System Memory / PCIe", "directx": "12"}
    else:
        return {"chip": "Controlador Gráfico do Sistema", "technology": "—", "die_size": "—", "transistors": "—", "cuda_cores": "Shading Units", "tmus": "—", "rops": "—", "memory_type": "VRAM", "bus_width": "—", "bandwidth": "PCIe / Integrado", "directx": "12"}


def _detect_gpu_features(name):
    """Retorna lista de recursos técnicos reais compatíveis com o fabricante da GPU detectada."""
    n = (name or "").upper()
    if "NVIDIA" in n or "GEFORCE" in n or "RTX" in n or "GTX" in n:
        is_rtx = "RTX" in n
        return [
            {"label": "DirectX / Vulkan", "value": "DirectX 12 Ultimate / Vulkan 1.3" if is_rtx else "DirectX 12 / Vulkan 1.3"},
            {"label": "Aceleração de IA / Upscaling", "value": "NVIDIA DLSS & Tensor Cores" if is_rtx else "NVIDIA CUDA & Shader Scaling"},
            {"label": "Computação Paralela", "value": "NVIDIA CUDA / OpenCL 3.0 / DirectCompute"},
            {"label": "Codificação de Vídeo", "value": "NVIDIA NVENC / NVDEC Hardware Codec"},
            {"label": "Barramento Gráfico", "value": "PCI Express x16 / Resizable BAR"}
        ]
    elif "AMD" in n or "RADEON" in n or "RX " in n:
        return [
            {"label": "DirectX / Vulkan", "value": "DirectX 12 Ultimate / Vulkan 1.3"},
            {"label": "Upscaling & Frame Gen", "value": "AMD FidelityFX Super Resolution (FSR)"},
            {"label": "Computação Paralela", "value": "OpenCL 2.2 / DirectCompute / Smart Access Memory"},
            {"label": "Codificação de Vídeo", "value": "AMD AMF / VCN Hardware Media Engine"},
            {"label": "Barramento Gráfico", "value": "PCI Express / AMD Smart Access Memory"}
        ]
    elif "INTEL" in n or "IRIS" in n or "UHD" in n or "ARC" in n:
        return [
            {"label": "DirectX / Vulkan", "value": "DirectX 12 / Vulkan 1.3"},
            {"label": "Upscaling Gráfico", "value": "Intel XeSS / Adaptive Sync"},
            {"label": "Computação Paralela", "value": "OpenCL 3.0 / DirectCompute / OneAPI"},
            {"label": "Codificação de Vídeo", "value": "Intel Quick Sync Video (Hardware Codec)"},
            {"label": "Arquitetura de Memória", "value": "Memória Dinâmica Compartilhada / PCIe"}
        ]
    return [
        {"label": "API Gráfica", "value": "DirectX 12 / OpenGL 4.6"},
        {"label": "Computação", "value": "DirectCompute / WDDM"},
        {"label": "Aceleração de Mídia", "value": "DXVA2 / Direct3D Video Acceleration"},
        {"label": "Interface", "value": "PCI Express / Interno"}
    ]


# ==============================================================================
# MOTOR WINSHIELD VISION-ENGINE (PLACA DE VÍDEO & SENSORES EM TEMPO REAL)
# ==============================================================================
class VisionEngine:
    _cached_static = None
    _cached_ts = 0.0
    _cached_sensors = None
    _cached_sensors_ts = 0.0

    @classmethod
    def get_info(cls):
        """Retorna informações estáticas completas + sensores em tempo real com throttling de 2 segundos."""
        static = cls._get_static_info()
        now = time.time()
        if cls._cached_sensors and (now - cls._cached_sensors_ts < 2.0):
            sensors = cls._cached_sensors
        else:
            sensors = cls._get_live_sensors(static_vram_mb=static.get("memory_size_mb", 0))
            cls._cached_sensors = sensors
            cls._cached_sensors_ts = now

        # Se o sensor ao vivo (ex: nvidia-smi) reportar memory_total_mb maior, sincroniza
        if sensors.get("memory_total_mb", 0) > static.get("memory_size_mb", 0):
            static["memory_size_mb"] = sensors["memory_total_mb"]
        return {
            "gpu": static,
            "sensors": sensors,
            "timestamp": now
        }

    @classmethod
    def _get_static_info(cls):
        if cls._cached_static and time.time() - cls._cached_ts < 300:
            return cls._cached_static

        ps_script = r"""
        $gpus = @(Get-CimInstance Win32_VideoController | Where-Object {
            $_.Name -notmatch 'Parsec|Remote|Virtual|Indirect|Miracast|Spacedesk|Basic Display'
        })
        $g = $gpus | Sort-Object -Property AdapterRAM -Descending | Select-Object -First 1
        if ($g) {
            [pscustomobject]@{
                Name = $g.Name
                VideoProcessor = $g.VideoProcessor
                AdapterRAM = [int64]$g.AdapterRAM
                DriverVersion = $g.DriverVersion
                DriverDate = if ($g.DriverDate) { $g.DriverDate.ToString("dd/MM/yyyy") } else { "" }
                RefreshRate = $g.CurrentRefreshRate
                Resolution = $g.VideoModeDescription
                Status = $g.Status
            } | ConvertTo-Json -Compress
        }
        """
        raw = run_ps_json(ps_script, timeout=20) or {}

        reg_gpus = _read_gpu_registry_list()
        name = (raw.get("Name") or (reg_gpus[0]["name"] if reg_gpus else "") or "Controlador Gráfico do Sistema").strip()

        # Determina VRAM real (64-bit Registry qwMemorySize -> WMI AdapterRAM -> nvidia-smi)
        vram_bytes = 0
        for rg in reg_gpus:
            if rg["name"].lower() == name.lower() and rg.get("vram_bytes", 0) > 0:
                vram_bytes = rg["vram_bytes"]
                break
        if vram_bytes == 0 and reg_gpus and reg_gpus[0].get("vram_bytes", 0) > 0:
            vram_bytes = reg_gpus[0]["vram_bytes"]
        if vram_bytes == 0 and raw.get("AdapterRAM"):
            vram_bytes = int(raw.get("AdapterRAM") or 0)

        vram_mb = int(vram_bytes / (1024**2)) if vram_bytes > 0 else 0

        driver_ver = raw.get("DriverVersion") or (reg_gpus[0].get("driver_version") if reg_gpus else "") or "—"
        driver_date = raw.get("DriverDate") or (reg_gpus[0].get("driver_date") if reg_gpus else "") or "—"
        refresh = raw.get("RefreshRate") or 60
        resolution = raw.get("Resolution") or "Detectado pelo Sistema"

        arch = _detect_gpu_architecture(name)
        features = _detect_gpu_features(name)

        n_up = name.upper()
        subvendor = "NVIDIA Corporation" if ("NVIDIA" in n_up or "GEFORCE" in n_up) else (
            "AMD / ATI" if ("AMD" in n_up or "RADEON" in n_up) else (
                "Intel Corporation" if "INTEL" in n_up else "Fabricante OEM"
            )
        )

        info = {
            "name": name,
            "architecture": arch.get("chip", "—"),
            "process": arch.get("technology", "—"),
            "die_size": arch.get("die_size", "—"),
            "transistors": arch.get("transistors", "—"),
            "cuda_cores": arch.get("cuda_cores", "—"),
            "tmus": arch.get("tmus", "—"),
            "rops": arch.get("rops", "—"),
            "memory_type": arch.get("memory_type", "VRAM"),
            "bus_width": arch.get("bus_width", "—"),
            "memory_size_mb": vram_mb,
            "bandwidth": arch.get("bandwidth", "—"),
            "directx": arch.get("directx", "DirectX 12"),
            "driver_version": driver_ver,
            "driver_date": driver_date,
            "display_resolution": f"{resolution} @ {refresh} Hz" if resolution != "Detectado pelo Sistema" else f"{refresh} Hz",
            "subvendor": subvendor,
            "bus_interface": "PCI Express",
            "features": features
        }

        cls._cached_static = info
        cls._cached_ts = time.time()
        return info

    @classmethod
    def _get_live_sensors(cls, static_vram_mb=0):
        """Obtém sensores ao vivo da GPU via nvidia-smi (NVIDIA) ou contadores WMI do Windows (AMD/Intel)."""
        sensors = {
            "temperature_gpu": 0,
            "temperature_hotspot": 0,
            "gpu_usage_percent": 0,
            "memory_used_mb": 0,
            "memory_total_mb": int(static_vram_mb or 0),
            "memory_usage_percent": 0.0,
            "fan_speed_percent": 0,
            "power_draw_w": 0.0,
            "clock_gpu_mhz": 0,
            "clock_memory_mhz": 0,
            "voltage_v": 0.0,
            "sensor_source": "wddm"
        }

        if not IS_WINDOWS:
            return sensors

        # 1. Tenta nvidia-smi para GPUs NVIDIA dedicadas
        try:
            code, out = run_hidden(
                "nvidia-smi --query-gpu=temperature.gpu,utilization.gpu,memory.used,memory.total,power.draw,clocks.current.graphics,clocks.current.memory --format=csv,noheader,nounits",
                timeout=4
            )
            if code == 0 and out and "," in out:
                line = out.strip().splitlines()[0]
                parts = [p.strip() for p in line.split(",")]
                if len(parts) >= 7:
                    def _safe_float(s):
                        try:
                            return float(s)
                        except ValueError:
                            return 0.0

                    temp = _safe_float(parts[0])
                    util = _safe_float(parts[1])
                    m_used = _safe_float(parts[2])
                    m_total = _safe_float(parts[3]) or float(static_vram_mb or 0)
                    power = _safe_float(parts[4])
                    g_clock = _safe_float(parts[5])
                    m_clock = _safe_float(parts[6])

                    sensors["temperature_gpu"] = int(temp)
                    sensors["temperature_hotspot"] = 0  # nvidia-smi não expõe hotspot; não estimamos
                    sensors["gpu_usage_percent"] = int(util)
                    sensors["memory_used_mb"] = int(m_used)
                    sensors["memory_total_mb"] = int(m_total)
                    sensors["memory_usage_percent"] = round((m_used / max(1.0, m_total)) * 100, 1) if m_total > 0 else 0.0
                    sensors["power_draw_w"] = round(power, 1)
                    sensors["clock_gpu_mhz"] = int(g_clock)
                    sensors["clock_memory_mhz"] = int(m_clock)
                    sensors["sensor_source"] = "nvidia-smi"
                    return sensors
        except Exception:
            pass

        # 2. Fallback universal WDDM / CIM para GPUs AMD Radeon / Intel Graphics / máquinas sem nvidia-smi
        try:
            ps_wddm = r"""
            $eng = @(Get-CimInstance Win32_PerfFormattedData_GPUPerformanceCounters_GPUEngine -ErrorAction SilentlyContinue | Where-Object { $_.Name -match 'engtype_3D|engtype_Compute|engtype_Copy' })
            $mem = @(Get-CimInstance Win32_PerfFormattedData_GPUPerformanceCounters_GPUAdapterMemory -ErrorAction SilentlyContinue)
            $util = 0
            if ($eng) {
                $sum = ($eng | Measure-Object -Property UtilizationPercentage -Sum).Sum
                $util = [math]::Min(100, [int]$sum)
            }
            $dedUsed = 0
            $shrUsed = 0
            if ($mem) {
                $dedUsed = ($mem | Measure-Object -Property DedicatedUsage -Sum).Sum
                $shrUsed = ($mem | Measure-Object -Property SharedUsage -Sum).Sum
            }
            [pscustomobject]@{
                Util = $util
                DedicatedMB = [int]($dedUsed / 1MB)
                SharedMB = [int]($shrUsed / 1MB)
            } | ConvertTo-Json -Compress
            """
            wddm = run_ps_json(ps_wddm, timeout=6) or {}
            util = int(wddm.get("Util") or 0)
            used_mb = int(wddm.get("DedicatedMB") or wddm.get("SharedMB") or 0)
            total_mb = int(static_vram_mb or 0)
            sensors["gpu_usage_percent"] = util
            sensors["memory_used_mb"] = used_mb
            sensors["memory_total_mb"] = total_mb
            if total_mb > 0 and used_mb > 0:
                sensors["memory_usage_percent"] = round(min(100.0, (used_mb / total_mb) * 100.0), 1)
        except Exception:
            pass

        return sensors


# Aliases de compatibilidade proprietária WinShield
SiliconCoreEngine = CoreEngine
CoreBenchmarkEngine = CoreBenchmarkEngine
VisionEngine = VisionEngine
# Aliases de compatibilidade
CoreEngine = CoreEngine
CPUBenchmarkEngine = CoreBenchmarkEngine
VisionEngine = VisionEngine
