# -*- coding: utf-8 -*-
"""
WinShield Pro - Telemetria Real de Hardware (sem valores simulados).

Fontes, em ordem de prioridade:
  1. Contadores de desempenho do Windows (PDH, nomes em inglês -> funciona em
     qualquer idioma do Windows): uso por núcleo, % Processor Performance
     (clock efetivo, igual ao Gerenciador de Tarefas), % Performance Limit
     (limitação de clock por temperatura/energia) e zonas térmicas ACPI.
  2. LibreHardwareMonitor / OpenHardwareMonitor (WMI), quando estiverem em
     execução: temperaturas por núcleo, placa-mãe, ventoinhas, tensões e
     potência. Esses sensores dependem do chip Super I/O e não são expostos
     pelo Windows sem um driver de kernel.
  3. nvidia-smi para GPUs NVIDIA.

Regra de ouro: quando um sensor não existe, o valor é ``None`` e a interface
mostra "N/D". Nenhum número é estimado ou inventado.
"""
import os
import sys
import time
import threading

import psutil

IS_WINDOWS = sys.platform.startswith("win")

if IS_WINDOWS:
    import ctypes
    from ctypes import wintypes
else:  # pragma: no cover - ambiente de desenvolvimento
    ctypes = None
    wintypes = None


# ==============================================================================
# PDH (Performance Data Helper)
# ==============================================================================
PDH_FMT_DOUBLE = 0x00000200
PDH_FMT_NOCAP100 = 0x00008000
PDH_MORE_DATA = 0x800007D2
ERROR_SUCCESS = 0

if IS_WINDOWS:
    class _PDH_FMT_COUNTERVALUE(ctypes.Structure):
        _fields_ = [("CStatus", wintypes.DWORD), ("doubleValue", ctypes.c_double)]

    class _PDH_FMT_COUNTERVALUE_ITEM_W(ctypes.Structure):
        _fields_ = [("szName", ctypes.c_wchar_p), ("FmtValue", _PDH_FMT_COUNTERVALUE)]


class _PdhQuery:
    """Consulta PDH com contadores curinga (ex.: Processor Information(*))."""

    def __init__(self, paths):
        self.ok = False
        self._h = None
        self._counters = {}
        if not IS_WINDOWS:
            return
        try:
            self._pdh = ctypes.WinDLL("pdh")
            h = wintypes.HANDLE()
            if self._pdh.PdhOpenQueryW(None, None, ctypes.byref(h)) != ERROR_SUCCESS:
                return
            self._h = h
            add = getattr(self._pdh, "PdhAddEnglishCounterW", None) or self._pdh.PdhAddCounterW
            for key, path in paths.items():
                hc = wintypes.HANDLE()
                if add(self._h, ctypes.c_wchar_p(path), None, ctypes.byref(hc)) == ERROR_SUCCESS:
                    self._counters[key] = hc
            self._pdh.PdhCollectQueryData(self._h)
            self.ok = bool(self._counters)
        except Exception:
            self.ok = False

    def collect(self):
        if not self.ok:
            return {}
        try:
            self._pdh.PdhCollectQueryData(self._h)
        except Exception:
            return {}
        out = {}
        for key, hc in self._counters.items():
            out[key] = self._read_array(hc)
        return out

    def _read_array(self, hc):
        size = wintypes.DWORD(0)
        count = wintypes.DWORD(0)
        fmt = PDH_FMT_DOUBLE | PDH_FMT_NOCAP100
        st = self._pdh.PdhGetFormattedCounterArrayW(hc, fmt, ctypes.byref(size), ctypes.byref(count), None)
        if (st & 0xFFFFFFFF) != PDH_MORE_DATA or size.value == 0:
            return {}
        buf = (ctypes.c_byte * size.value)()
        st = self._pdh.PdhGetFormattedCounterArrayW(hc, fmt, ctypes.byref(size), ctypes.byref(count), buf)
        if st != ERROR_SUCCESS:
            return {}
        items = ctypes.cast(buf, ctypes.POINTER(_PDH_FMT_COUNTERVALUE_ITEM_W))
        res = {}
        for i in range(count.value):
            it = items[i]
            if it.FmtValue.CStatus in (0, 1):  # PDH_CSTATUS_VALID_DATA / NEW_DATA
                res[it.szName] = float(it.FmtValue.doubleValue)
        return res


def _core_sort_key(name):
    try:
        a, b = name.split(",")
        return (int(a), int(b))
    except Exception:
        return (999, 999)


# ==============================================================================
# LibreHardwareMonitor / OpenHardwareMonitor via WMI
# ==============================================================================
_LHM_PS = r"""
$ErrorActionPreference='SilentlyContinue'
$ns = $null
foreach ($n in @('root/LibreHardwareMonitor','root/OpenHardwareMonitor')) {
  $s = @(Get-CimInstance -Namespace $n -ClassName Sensor)
  if ($s.Count -gt 0) { $ns = $n; break }
}
if ($ns) {
  [pscustomobject]@{ ns=$ns; s=@($s | ForEach-Object { [pscustomobject]@{ t=[string]$_.SensorType; n=[string]$_.Name; v=[double]$_.Value; i=[string]$_.Identifier } }) } | ConvertTo-Json -Depth 4 -Compress
}
"""


def _lhm_http(port=8085):
    """
    Alternativa ao WMI: servidor web do LibreHardwareMonitor (Opções > Remote Web Server).
    Converte a árvore de data.json para o mesmo formato da consulta WMI.
    """
    import json
    import re
    import urllib.request
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/data.json", timeout=1.0) as r:
            tree = json.loads(r.read().decode("utf-8", "replace"))
    except Exception:
        return None
    out = []

    def walk(node):
        sid, typ, val = node.get("SensorId"), node.get("Type"), node.get("Value")
        if sid and typ and isinstance(val, str):
            m = re.search(r"-?\d+(?:[.,]\d+)?", val.replace(" ", ""))
            if m:
                out.append({"t": typ, "n": node.get("Text") or "", "v": float(m.group(0).replace(",", ".")), "i": sid})
        for ch in node.get("Children") or []:
            walk(ch)

    walk(tree)
    return {"ns": "LibreHardwareMonitor (servidor web)", "s": out} if out else None


def find_lhm():
    """Procura o LibreHardwareMonitor.exe nos locais usuais. Retorna o caminho ou None."""
    now = time.time()
    if now - _LHM_FIND["ts"] < 60:
        return _LHM_FIND["path"]
    roots = [os.environ.get("ProgramFiles", r"C:\Program Files"), os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)"),
             os.environ.get("LOCALAPPDATA", ""), os.path.join(os.path.expanduser("~"), "Downloads"),
             os.path.join(os.path.expanduser("~"), "Desktop"), os.path.join(os.path.expanduser("~"), "Documents")]
    found = None
    for root in filter(None, roots):
        if found or not os.path.isdir(root):
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            if dirpath[len(root):].count(os.sep) >= 3:
                dirnames[:] = []
                continue
            if "LibreHardwareMonitor.exe" in filenames:
                found = os.path.join(dirpath, "LibreHardwareMonitor.exe")
                break
    _LHM_FIND.update(ts=now, path=found)
    return found


_LHM_FIND = {"ts": 0.0, "path": None}


class _ExternalSensors:
    """Lê sensores do LibreHardwareMonitor/OpenHardwareMonitor em segundo plano."""

    _lock = threading.Lock()
    _thread = None
    _last_request = 0.0
    _data = None          # dict com chaves normalizadas
    _source = None
    _checked_once = False

    @classmethod
    def request(cls):
        cls._last_request = time.time()
        if not IS_WINDOWS:
            return None
        with cls._lock:
            if cls._thread is None or not cls._thread.is_alive():
                cls._thread = threading.Thread(target=cls._loop, daemon=True)
                cls._thread.start()
            return cls._data

    @classmethod
    def source(cls):
        return cls._source

    @classmethod
    def _loop(cls):
        from backend.process import run_ps_json
        misses = 0
        while time.time() - cls._last_request < 15:
            raw = None
            try:
                raw = run_ps_json(_LHM_PS, timeout=8)
            except Exception:
                raw = None
            if not raw:
                raw = _lhm_http()
            parsed = cls._parse(raw) if raw else None
            with cls._lock:
                cls._data = parsed
                cls._source = (raw or {}).get("ns") if parsed else None
                cls._checked_once = True
            if parsed is None:
                misses += 1
                # Sem LHM/OHM: verifica de novo só a cada 20 s para não gastar CPU
                time.sleep(20 if misses > 1 else 5)
            else:
                misses = 0
                time.sleep(1.5)

    @staticmethod
    def _parse(raw):
        sensors = raw.get("s") if isinstance(raw, dict) else None
        if isinstance(sensors, dict):
            sensors = [sensors]
        if not sensors:
            return None
        out = {
            "cpu_temp": None, "core_temps": [], "mobo_temp": None, "gpu_temp": None,
            "gpu_hotspot": None, "disk_temps": [],
            "fans": [], "voltages": {}, "cpu_power": None, "cores_power": None,
            "gpu_power": None, "core_clocks": [],
        }
        cpu_candidates = {}
        for s in sensors:
            t, n, v, ident = s.get("t"), (s.get("n") or ""), s.get("v"), (s.get("i") or "").lower()
            if v is None:
                continue
            nl = n.lower()
            is_cpu = "cpu" in ident.split("/")[1] if ident.count("/") >= 2 else False
            is_gpu = "gpu" in ident
            is_lpc = ident.startswith("/lpc/")
            if t == "Temperature":
                if is_cpu:
                    if "package" in nl or "tctl" in nl or "tdie" in nl:
                        cpu_candidates.setdefault(0, v)
                    elif "core max" in nl:
                        cpu_candidates.setdefault(1, v)
                    elif "core average" in nl:
                        cpu_candidates.setdefault(2, v)
                    elif "ccd" in nl:
                        cpu_candidates.setdefault(3, v)
                    if ("core #" in nl) and "distance" not in nl:
                        out["core_temps"].append((n, round(v, 1)))
                elif is_gpu:
                    if "hot spot" in nl or "hotspot" in nl:
                        out["gpu_hotspot"] = round(v, 1)
                    elif out["gpu_temp"] is None and "core" in nl:
                        out["gpu_temp"] = round(v, 1)
                elif is_lpc and out["mobo_temp"] is None:
                    out["mobo_temp"] = round(v, 1)
                elif "/hdd/" in ident or "/nvme/" in ident or "/ssd/" in ident:
                    out["disk_temps"].append(round(v, 1))
            elif t == "Fan":
                out["fans"].append({"name": n, "rpm": int(v), "gpu": is_gpu})
            elif t == "Voltage" and is_lpc:
                key = None
                if "vcore" in nl or nl == "cpu core":
                    key = "vcore"
                elif "+12" in nl or "12v" in nl:
                    key = "v12"
                elif "+5" in nl or "5v" in nl:
                    key = "v5"
                elif "3.3" in nl or "3vcc" in nl or "+3.3" in nl:
                    key = "v33"
                elif "dram" in nl or "dimm" in nl or "vddq" in nl:
                    key = "dram_v"
                if key and key not in out["voltages"]:
                    out["voltages"][key] = round(v, 3)
            elif t == "Voltage" and is_cpu and "vcore" not in out["voltages"] and ("core" in nl and "#" not in nl):
                out["voltages"]["vcore"] = round(v, 3)
            elif t == "Power":
                if is_cpu and "package" in nl and out["cpu_power"] is None:
                    out["cpu_power"] = round(v, 1)
                elif is_cpu and nl in ("cpu cores", "cores") and out["cores_power"] is None:
                    out["cores_power"] = round(v, 1)
                elif is_gpu and out["gpu_power"] is None and ("package" in nl or "power" in nl or "board" in nl):
                    out["gpu_power"] = round(v, 1)
            elif t == "Clock" and is_cpu and "core #" in nl:
                out["core_clocks"].append((n, round(v)))
        if cpu_candidates:
            out["cpu_temp"] = round(cpu_candidates[min(cpu_candidates)], 1)
        out["core_temps"] = [v for _, v in sorted(out["core_temps"], key=lambda x: _num_suffix(x[0]))]
        out["core_clocks"] = [v for _, v in sorted(out["core_clocks"], key=lambda x: _num_suffix(x[0]))]
        return out


def _num_suffix(name):
    digits = "".join(ch for ch in name.split("#")[-1] if ch.isdigit())
    return int(digits) if digits else 0


# ==============================================================================
# NVIDIA (nvidia-smi)
# ==============================================================================
class _NvidiaSensors:
    _lock = threading.Lock()
    _last = 0.0
    _data = None
    _available = None  # None = ainda não testado

    FIELDS = ("temperature.gpu,utilization.gpu,power.draw,fan.speed,clocks.current.graphics,"
              "clocks.current.memory,memory.used,memory.total,clocks_throttle_reasons.active")

    @classmethod
    def read(cls, max_age=2.0):
        if not IS_WINDOWS or cls._available is False:
            return None
        now = time.time()
        with cls._lock:
            if cls._data is not None and now - cls._last < max_age:
                return cls._data
        try:
            from backend.process import run_hidden
            code, out = run_hidden(f"nvidia-smi --query-gpu={cls.FIELDS} --format=csv,noheader,nounits", timeout=4)
        except Exception:
            code, out = 1, ""
        data = None
        if code == 0 and out and "," in out:
            p = [x.strip() for x in out.strip().splitlines()[0].split(",")]

            def f(i):
                try:
                    return float(p[i])
                except (ValueError, IndexError):
                    return None
            data = {
                "temp": f(0), "usage": f(1), "power": f(2), "fan_pct": f(3),
                "clock": f(4), "mem_clock": f(5), "mem_used_mb": f(6), "mem_total_mb": f(7),
                "throttle_reasons": p[8] if len(p) > 8 else None,
            }
            cls._available = True
        elif cls._available is None:
            cls._available = False
        with cls._lock:
            cls._data, cls._last = data, now
        return data


# ==============================================================================
# SERVIÇO DE TELEMETRIA
# ==============================================================================
class Telemetry:
    _lock = threading.Lock()
    _query = None
    _last_snapshot = None
    _last_ts = 0.0
    _base_mhz = None

    COUNTERS = {
        "util": r"\Processor Information(*)\% Processor Utility",
        "ptime": r"\Processor Information(*)\% Processor Time",
        "perf": r"\Processor Information(*)\% Processor Performance",
        "limit": r"\Processor Information(*)\% Performance Limit",
        "freq": r"\Processor Information(*)\Processor Frequency",
        "tz_hp": r"\Thermal Zone Information(*)\High Precision Temperature",
        "tz_passive": r"\Thermal Zone Information(*)\% Passive Limit",
    }

    @classmethod
    def _ensure(cls):
        if cls._query is None:
            cls._query = _PdhQuery(cls.COUNTERS)
            time.sleep(0.25)  # PDH precisa de duas coletas para contadores de taxa

    @classmethod
    def base_clock_mhz(cls):
        if cls._base_mhz:
            return cls._base_mhz
        mhz = None
        if IS_WINDOWS:
            try:
                import winreg
                with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"HARDWARE\DESCRIPTION\System\CentralProcessor\0") as k:
                    mhz = int(winreg.QueryValueEx(k, "~MHz")[0])
            except Exception:
                mhz = None
        if not mhz:
            try:
                fr = psutil.cpu_freq()
                mhz = int(fr.max or fr.current) if fr else None
            except Exception:
                mhz = None
        cls._base_mhz = mhz
        return mhz

    @classmethod
    def cpu_snapshot(cls, min_interval=0.9):
        """Uso, clock efetivo e limitação de desempenho reais da CPU."""
        now = time.time()
        with cls._lock:
            if cls._last_snapshot and now - cls._last_ts < min_interval:
                return cls._last_snapshot
            cls._ensure()
            data = cls._query.collect() if cls._query and cls._query.ok else {}
            snap = cls._build_cpu(data)
            cls._last_snapshot, cls._last_ts = snap, time.time()
            return snap

    @classmethod
    def _build_cpu(cls, d):
        base = cls.base_clock_mhz()
        util = d.get("util") or d.get("ptime") or {}
        perf = d.get("perf") or {}
        limit = d.get("limit") or {}
        freq = d.get("freq") or {}

        core_names = sorted([k for k in (util or perf) if "_Total" not in k], key=_core_sort_key)
        if util:
            usage_total = util.get("_Total")
            per_core_usage = [round(min(100.0, util.get(k, 0.0)), 1) for k in core_names]
        else:
            usage_total = None
            per_core_usage = []
        if usage_total is None:
            try:
                per = psutil.cpu_percent(percpu=True)
                per_core_usage = [round(x, 1) for x in per]
                usage_total = sum(per) / max(1, len(per))
            except Exception:
                usage_total = 0.0

        nominal = freq.get("_Total") or (max(freq.values()) if freq else None) or base
        clocks = []
        if perf and nominal:
            for k in core_names:
                if k in perf:
                    clocks.append(int(round(nominal * perf[k] / 100.0)))
            avg_clock = int(round(nominal * perf.get("_Total", sum(perf.values()) / max(1, len(perf))) / 100.0))
            clock_source = "PDH % Processor Performance"
        else:
            try:
                fr = psutil.cpu_freq()
                avg_clock = int(fr.current) if fr else None
            except Exception:
                avg_clock = None
            clocks = [avg_clock] * len(per_core_usage) if avg_clock else []
            clock_source = "psutil" if avg_clock else None

        perf_limit = None
        if limit:
            v = limit.get("_Total")
            if v is None and limit:
                v = max(limit.values())
            perf_limit = round(float(v), 1) if v is not None else None

        tz = d.get("tz_hp") or {}
        tz_temps = {k: round(v / 10.0 - 273.15, 1) for k, v in tz.items() if v and v > 2000}
        passive = d.get("tz_passive") or {}
        passive_min = min(passive.values()) if passive else None

        return {
            "usage": round(min(100.0, float(usage_total or 0.0)), 1),
            "per_core_usage": per_core_usage,
            "clocks": clocks,
            "avg_clock": avg_clock,
            "nominal_clock": int(nominal) if nominal else None,
            "clock_source": clock_source,
            "performance_limit_pct": perf_limit,   # % do clock permitido (100 = sem limitação)
            "thermal_zones": tz_temps,             # {nome_da_zona: °C}
            "thermal_passive_limit_pct": round(passive_min, 1) if passive_min is not None else None,
            "logical_cpus": os.cpu_count() or len(per_core_usage) or 1,
        }

    @classmethod
    def sensors(cls):
        """Sensores de placa-mãe/CPU/GPU quando houver fonte real disponível."""
        ext = _ExternalSensors.request()
        nv = _NvidiaSensors.read()
        return {"external": ext, "external_source": _ExternalSensors.source(), "nvidia": nv}

    @staticmethod
    def memory():
        vm = psutil.virtual_memory()
        return {
            "total_gb": round(vm.total / 1024 ** 3, 2),
            "used_gb": round((vm.total - vm.available) / 1024 ** 3, 2),
            "percent": round(vm.percent, 1),
            "avail_mb": int(vm.available / 1024 ** 2),
        }

    @staticmethod
    def battery():
        try:
            b = psutil.sensors_battery()
        except Exception:
            b = None
        if b is None:
            return "Sem bateria (AC)", None
        st = f"{round(b.percent)}%"
        if b.power_plugged:
            st += " (na tomada)"
        return st, round(b.percent)


def nvidia_snapshot(max_age=2.0):
    return _NvidiaSensors.read(max_age=max_age)
