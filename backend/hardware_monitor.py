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
# Codinome e litografia pelo CPUID (família/modelo informados pelo Windows), que
# identificam o silício exatamente. Comparar pedaços do nome confundia, por exemplo,
# o Ryzen 7 5700X (Vermeer) com o 5700G/5600H (Cezanne). Modelo desconhecido = "—".
CPU_CODENAMES = {
    ("AMD", 23, 1): ("Summit Ridge / Naples (Zen)", "14 nm"),
    ("AMD", 23, 8): ("Pinnacle Ridge (Zen+)", "12 nm"),
    ("AMD", 23, 17): ("Raven Ridge (Zen)", "14 nm"),
    ("AMD", 23, 24): ("Picasso (Zen+)", "12 nm"),
    ("AMD", 23, 32): ("Dali (Zen)", "14 nm"),
    ("AMD", 23, 49): ("Rome / Castle Peak (Zen 2)", "7 nm"),
    ("AMD", 23, 96): ("Renoir (Zen 2)", "7 nm"),
    ("AMD", 23, 104): ("Lucienne (Zen 2)", "7 nm"),
    ("AMD", 23, 113): ("Matisse (Zen 2)", "7 nm"),
    ("AMD", 23, 144): ("Van Gogh (Zen 2)", "7 nm"),
    ("AMD", 23, 160): ("Mendocino (Zen 2)", "6 nm"),
    ("AMD", 25, 1): ("Milan (Zen 3)", "7 nm"),
    ("AMD", 25, 8): ("Chagall (Zen 3)", "7 nm"),
    ("AMD", 25, 17): ("Genoa (Zen 4)", "5 nm"),
    ("AMD", 25, 24): ("Storm Peak (Zen 4)", "5 nm"),
    ("AMD", 25, 33): ("Vermeer (Zen 3)", "7 nm"),
    ("AMD", 25, 68): ("Rembrandt (Zen 3+)", "6 nm"),
    ("AMD", 25, 80): ("Cezanne (Zen 3)", "7 nm"),
    ("AMD", 25, 97): ("Raphael (Zen 4)", "5 nm"),
    ("AMD", 25, 116): ("Phoenix (Zen 4)", "4 nm"),
    ("AMD", 25, 117): ("Hawk Point (Zen 4)", "4 nm"),
    ("AMD", 25, 120): ("Phoenix 2 (Zen 4)", "4 nm"),
    ("AMD", 26, 36): ("Strix Point (Zen 5)", "4 nm"),
    ("AMD", 26, 68): ("Granite Ridge (Zen 5)", "4 nm"),
    ("INTEL", 6, 78): ("Skylake (U)", "14 nm"),
    ("INTEL", 6, 94): ("Skylake (S)", "14 nm"),
    ("INTEL", 6, 126): ("Ice Lake (U)", "10 nm"),
    ("INTEL", 6, 140): ("Tiger Lake (U)", "10 nm SuperFin"),
    ("INTEL", 6, 141): ("Tiger Lake (H)", "10 nm SuperFin"),
    ("INTEL", 6, 142): ("Kaby Lake / Coffee Lake / Whiskey Lake (U)", "14 nm"),
    ("INTEL", 6, 151): ("Alder Lake (S)", "Intel 7"),
    ("INTEL", 6, 154): ("Alder Lake (P)", "Intel 7"),
    ("INTEL", 6, 158): ("Kaby Lake / Coffee Lake (S)", "14 nm"),
    ("INTEL", 6, 165): ("Comet Lake (S)", "14 nm"),
    ("INTEL", 6, 166): ("Comet Lake (U)", "14 nm"),
    ("INTEL", 6, 167): ("Rocket Lake", "14 nm"),
    ("INTEL", 6, 170): ("Meteor Lake", "Intel 4"),
    ("INTEL", 6, 183): ("Raptor Lake (S)", "Intel 7"),
    ("INTEL", 6, 186): ("Raptor Lake (P)", "Intel 7"),
    ("INTEL", 6, 189): ("Lunar Lake", "TSMC N3B"),
    ("INTEL", 6, 190): ("Alder Lake-N", "Intel 7"),
    ("INTEL", 6, 191): ("Raptor Lake (S)", "Intel 7"),
    ("INTEL", 6, 197): ("Arrow Lake (H)", "TSMC N3B"),
    ("INTEL", 6, 198): ("Arrow Lake (S)", "TSMC N3B"),
}


def _detect_cpu_architecture(name, caption=""):
    vendor = "AMD" if "AMD" in (caption or "").upper() or "AMD" in (name or "").upper() else (
        "INTEL" if "INTEL" in (caption or "").upper() or "INTEL" in (name or "").upper() else "")
    fam = re.search(r"Family\s+(\d+)", caption or "", re.I)
    mod = re.search(r"Model\s+(\d+)", caption or "", re.I)
    codename, process = CPU_CODENAMES.get((vendor, int(fam.group(1)) if fam else -1, int(mod.group(1)) if mod else -1),
                                         ("—", "—"))
    # O Windows não informa o TDP; uma faixa genérica não seria o TDP deste processador
    return {"codename": codename, "process": process, "socket": "—", "tdp": None}


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
            BiosDate = if ($bios.ReleaseDate) { $bios.ReleaseDate.ToUniversalTime().ToString("dd/MM/yyyy") } else { "" }
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
    MEASURE_SEC = 20.0          # padrão por fase (1 thread e todas as threads)
    MIN_SEC, MAX_SEC = 5.0, 120.0
    _measure_sec = MEASURE_SEC  # duração da execução atual
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
            # Duração de medição por fase pedida pela chamada (limitada para seguir confiável)
            try:
                cls._measure_sec = min(cls.MAX_SEC, max(cls.MIN_SEC, float(duration_sec))) if duration_sec else cls.MEASURE_SEC
            except (TypeError, ValueError):
                cls._measure_sec = cls.MEASURE_SEC
            cpu_name = SystemEngine.static_info().get("cpu", "CPU")
            cls._last_results = {
                "single_thread": 0.0, "multi_thread": 0.0, "ratio": 0.0, "running": True,
                "phase": "single", "progress": 1, "reference_cpu": cpu_name, "timestamp": None, "details": {},
                "measure_sec": cls._measure_sec,
            }
        threading.Thread(target=cls._worker, daemon=True).start()
        total = round(2 * (cls.WARMUP_SEC + cls._measure_sec))
        return True, f"Benchmark de CPU iniciado (≈ {total} s)."

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
        # Bytes processados e tempo gasto em CADA operação, por thread: assim a vazão de
        # cada algoritmo é medida de verdade (antes o tempo do laço inteiro era dividido igualmente)
        counters = [dict(sha=0, z=0, b2=0, fp=0, t_sha=0.0, t_z=0.0, t_b2=0.0, t_fp=0.0) for _ in range(n_threads)]
        state = {"measuring": False, "stop": False}

        def work(idx):
            seed = (idx * 2654435761) & 0xFFFFFFFF
            raw = bytes((seed + i * 131) & 0xFF for i in range(4096)) * 256       # 1 MiB
            text = (b"WinShield benchmark " * 13108)[:262144]                      # 256 KiB compressível
            arr = np.linspace(0.1, 100.0, 65536) if np is not None else None
            c = counters[idx]
            clock = time.perf_counter
            while not state["stop"]:
                t0 = clock()
                hashlib.sha256(raw).digest()
                t1 = clock()
                hashlib.blake2b(raw).digest()
                t2 = clock()
                zlib.compress(text, 6)
                t3 = clock()
                if arr is not None:
                    np.sqrt(np.sin(arr) * np.cos(arr) + arr)
                t4 = clock()
                if state["measuring"]:
                    c["sha"] += len(raw); c["t_sha"] += t1 - t0
                    c["b2"] += len(raw); c["t_b2"] += t2 - t1
                    c["z"] += len(text); c["t_z"] += t3 - t2
                    if arr is not None:
                        c["fp"] += arr.size; c["t_fp"] += t4 - t3

        pool = [threading.Thread(target=work, args=(i,), daemon=True) for i in range(n_threads)]
        for t in pool:
            t.start()
        t0 = time.perf_counter()
        total = cls.WARMUP_SEC + cls._measure_sec
        measure_t0 = None
        per_sec = []            # vazão SHA-256 (MB/s) a cada segundo medido
        last_mark = None
        while True:
            el = time.perf_counter() - t0
            if el >= cls.WARMUP_SEC and not state["measuring"]:
                for c in counters:
                    c.update(sha=0, z=0, b2=0, fp=0, t_sha=0.0, t_z=0.0, t_b2=0.0, t_fp=0.0)
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
        def rate(key):
            # Vazão de cada thread (bytes ÷ tempo gasto nessa operação) somada entre as threads
            return sum(c[key] / c["t_" + key] for c in counters if c["t_" + key] > 0) / 1e6
        sha, b2, z, fp = rate("sha"), rate("b2"), rate("z"), rate("fp")
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


def _nvidia_static():
    """Dados fixos reais da GPU NVIDIA via nvidia-smi (vazio se indisponível)."""
    fields = "vbios_version,pcie.link.gen.max,pcie.link.width.max,pcie.link.gen.current,pcie.link.width.current,clocks.max.graphics,clocks.max.memory,power.limit,driver_version"
    try:
        code, out = run_hidden(f"nvidia-smi --query-gpu={fields} --format=csv,noheader,nounits", timeout=6)
    except Exception:
        return {}
    line = (out or "").strip().splitlines()[0] if code == 0 and out else ""
    parts = [p.strip() for p in line.split(",")]
    if len(parts) < 9:
        return {}
    ok = lambda v: v and "N/A" not in v and "Not Supported" not in v
    vb, gmax, wmax, gcur, wcur, ccore, cmem, plim, drv = parts[:9]
    return {
        "vbios": vb if ok(vb) else "",
        "pcie_max": f"{gmax}.0 x{wmax}" if ok(gmax) and ok(wmax) else "",
        # Em repouso a GPU baixa a geração do link para economizar energia
        "pcie_cur": f"{gcur}.0 x{wcur} (varia com a carga)" if ok(gcur) and ok(wcur) else "",
        "clock_core": f"{ccore} MHz" if ok(ccore) else "",
        "clock_mem": f"{cmem} MHz" if ok(cmem) else "",
        "power_limit": f"{float(plim):.0f} W" if ok(plim) else "",
        "driver": drv if ok(drv) else "",
    }


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
                DriverDate = if ($g.DriverDate) { $g.DriverDate.ToUniversalTime().ToString("dd/MM/yyyy") } else { "" }
                RefreshRate = $g.CurrentRefreshRate
                Width = $g.CurrentHorizontalResolution
                Height = $g.CurrentVerticalResolution
                Vendor = $g.AdapterCompatibility
                PnpId = $g.PNPDeviceID
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
        # Resolução pelos campos numéricos: VideoModeDescription vem traduzido e com a
        # quantidade de cores ("1920 x 1080 x 4294967296 cores")
        width, height, refresh = raw.get("Width"), raw.get("Height"), raw.get("RefreshRate")
        resolution = f"{width} x {height}" if width and height else "—"
        if refresh and resolution != "—":
            resolution += f" @ {refresh} Hz"

        # Só dados lidos do Windows/driver. Especificações que o sistema não informa
        # (núcleos, ROPs, litografia...) não são exibidas em vez de estimadas por tabela.
        hardware = [
            {"label": "Fabricante", "value": (raw.get("Vendor") or "").strip() or "—"},
            {"label": "Memória de vídeo", "value": f"{vram_mb:,} MB".replace(",", ".") if vram_mb else "—"},
        ]
        pnp = raw.get("PnpId") or ""
        m = re.search(r"VEN_([0-9A-F]{4})&DEV_([0-9A-F]{4})", pnp, re.I)
        if m:
            hardware.append({"label": "ID PCI (fabricante:dispositivo)", "value": f"{m.group(1)}:{m.group(2)}".upper()})
        public_driver = ""
        if "NVIDIA" in name.upper() or "GEFORCE" in name.upper():
            smi = _nvidia_static()
            public_driver = smi.get("driver", "")
            for label, key in (("VBIOS", "vbios"), ("PCI Express (máximo)", "pcie_max"), ("PCI Express (atual)", "pcie_cur"),
                               ("Clock máximo do núcleo", "clock_core"), ("Clock máximo da memória", "clock_mem"),
                               ("Limite de energia", "power_limit")):
                if smi.get(key):
                    hardware.append({"label": label, "value": smi[key]})
        display = [
            {"label": "Versão do driver", "value": f"{public_driver} ({driver_ver})" if public_driver else driver_ver},
            {"label": "Data do driver", "value": driver_date},
            {"label": "Resolução", "value": resolution},
        ]

        info = {
            "name": name,
            "memory_size_mb": vram_mb,
            "driver_version": driver_ver,
            "driver_date": driver_date,
            "display_resolution": resolution,
            "hardware": hardware,
            "display": display,
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
