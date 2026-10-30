"""
WinShield SurfaceScan™ - Varredura física real da superfície do disco.

Como funciona:
  * Abre o disco físico (\\\\.\\PhysicalDriveN) — ou o volume (\\\\.\\C:) se o disco
    físico não puder ser aberto — somente LEITURA e sem cache do Windows
    (FILE_FLAG_NO_BUFFERING). Nenhum dado é gravado.
  * A superfície é dividida em 1.200 regiões (grade 60 x 20).
      - Rápido:   lê 32 MiB contíguos no início de cada região (≈ 37 GiB amostrados
                  em 1.200 pontos distribuídos por todo o LBA).
      - Completo: lê 100% dos setores do disco, região por região.
  * Cada leitura é de 1 MiB; a latência de cada leitura é medida com
    QueryPerformanceCounter. A célula da grade recebe o PIOR resultado da região:
        verde   < 20 ms     | azul  20–150 ms
        âmbar  >= 150 ms (setor lento / realocação em andamento)
        vermelho = erro de leitura (CRC / setor ilegível) — confirmado por releitura
  * A curva de transferência (MB/s por região) é registrada como nos scanners de superfície profissionais.

Requer privilégios de administrador (o WinShield Pro já solicita elevação UAC).
"""

import os
import time
import threading
from backend.core import IS_WINDOWS
from backend.log_manager import LogManager
from backend.process import run_ps_json

if IS_WINDOWS:
    import ctypes
    from ctypes import wintypes
    k32 = ctypes.WinDLL("kernel32", use_last_error=True)
    k32.CreateFileW.restype = wintypes.HANDLE
    k32.CreateFileW.argtypes = [wintypes.LPCWSTR, wintypes.DWORD, wintypes.DWORD, wintypes.LPVOID,
                                wintypes.DWORD, wintypes.DWORD, wintypes.HANDLE]
    k32.SetFilePointerEx.argtypes = [wintypes.HANDLE, ctypes.c_longlong, ctypes.POINTER(ctypes.c_longlong), wintypes.DWORD]
    k32.SetFilePointerEx.restype = wintypes.BOOL
    k32.ReadFile.argtypes = [wintypes.HANDLE, ctypes.c_void_p, wintypes.DWORD, ctypes.POINTER(wintypes.DWORD), ctypes.c_void_p]
    k32.DeviceIoControl.argtypes = [wintypes.HANDLE, wintypes.DWORD, wintypes.LPVOID, wintypes.DWORD,
                                    wintypes.LPVOID, wintypes.DWORD, ctypes.POINTER(wintypes.DWORD), wintypes.LPVOID]
    k32.VirtualAlloc.restype = ctypes.c_void_p
    k32.VirtualAlloc.argtypes = [ctypes.c_void_p, ctypes.c_size_t, wintypes.DWORD, wintypes.DWORD]
    k32.VirtualFree.argtypes = [ctypes.c_void_p, ctypes.c_size_t, wintypes.DWORD]
    k32.CloseHandle.argtypes = [wintypes.HANDLE]
    INVALID_HANDLE_VALUE = wintypes.HANDLE(-1).value
else:
    ctypes = None
    wintypes = None
    k32 = None
    INVALID_HANDLE_VALUE = -1

GENERIC_READ = 0x80000000
FILE_SHARE_RW = 0x00000003
OPEN_EXISTING = 3
FILE_FLAG_NO_BUFFERING = 0x20000000
IOCTL_DISK_GET_LENGTH_INFO = 0x0007405C
IOCTL_STORAGE_GET_DEVICE_NUMBER = 0x002D1080

IO_SIZE = 1024 * 1024
QUICK_SAMPLE = 32 * 1024 * 1024
LAT_FAST_MS = 20.0
LAT_SLOW_MS = 150.0


def _open_read(path):
    h = k32.CreateFileW(path, GENERIC_READ, FILE_SHARE_RW, None, OPEN_EXISTING, FILE_FLAG_NO_BUFFERING, None)
    if not h or h == INVALID_HANDLE_VALUE:
        return None
    return h


def _device_length(h):
    out = ctypes.c_longlong(0)
    ret = wintypes.DWORD(0)
    if k32.DeviceIoControl(h, IOCTL_DISK_GET_LENGTH_INFO, None, 0, ctypes.byref(out), 8, ctypes.byref(ret), None):
        return int(out.value)
    return 0


def _disk_number_for_letter(letter):
    h = _open_read(f"\\\\.\\{letter}:")
    if not h:
        h = k32.CreateFileW(f"\\\\.\\{letter}:", 0, FILE_SHARE_RW, None, OPEN_EXISTING, 0, None)
        if not h or h == INVALID_HANDLE_VALUE:
            return None
    try:
        buf = (ctypes.c_ulong * 3)()
        ret = wintypes.DWORD(0)
        if k32.DeviceIoControl(h, IOCTL_STORAGE_GET_DEVICE_NUMBER, None, 0, buf, ctypes.sizeof(buf), ctypes.byref(ret), None):
            return int(buf[1])
    finally:
        k32.CloseHandle(h)
    return None


class SurfaceScanEngine:
    _lock = threading.Lock()
    _running = False
    _cancel_requested = False
    _thread = None

    TOTAL_BLOCKS = 1200  # grade 60 x 20

    @classmethod
    def _blank_state(cls, drive="C:", mode="quick"):
        return {
            "running": False, "paused": False, "drive": drive, "mode": mode,
            "io_mode": "Aguardando início", "target": None,
            "current_block": -1, "current_lba": 0, "remaining_sec": 0,
            "progress_percent": 0.0, "scanned_mb": 0, "total_mb": 0,
            "bytes_read_actual_mb": 0.0, "current_speed_mb": 0.0,
            "min_speed_mb": None, "max_speed_mb": None, "avg_speed_mb": None,
            "last_latency_ms": 0.0, "avg_latency_ms": 0.0, "max_latency_ms": 0.0,
            "fast_blocks": 0, "normal_blocks": 0, "slow_blocks": 0, "damaged_blocks": 0,
            "damaged_percent": 0.0, "read_errors": 0, "error_lbas": [],
            "elapsed_sec": 0, "blocks": [0] * cls.TOTAL_BLOCKS,
            "speed_curve": [None] * cls.TOTAL_BLOCKS,
            "thresholds_ms": {"fast": LAT_FAST_MS, "slow": LAT_SLOW_MS},
            "status_text": "Pronto para iniciar a varredura física da superfície.",
            "error": None,
        }

    _scan_state = None

    @classmethod
    def get_scan_state(cls):
        with cls._lock:
            if cls._scan_state is None:
                cls._scan_state = cls._blank_state()
            st = dict(cls._scan_state)
            st["blocks"] = list(st["blocks"])
            st["speed_curve"] = list(st["speed_curve"])
            st["error_lbas"] = list(st["error_lbas"])[:100]
            for k in ("progress_percent", "current_speed_mb", "bytes_read_actual_mb", "damaged_percent"):
                st[k] = round(st[k] or 0.0, 2)
            for k in ("last_latency_ms", "avg_latency_ms", "max_latency_ms"):
                st[k] = round(st[k] or 0.0, 2)
            st["elapsed_sec"] = int(st["elapsed_sec"])
            st["remaining_sec"] = int(st["remaining_sec"] or 0)
            return st

    @classmethod
    def start_scan(cls, drive_letter="C", mode="quick"):
        letter = (drive_letter or "C").replace(":", "").replace("\\", "").strip().upper()[:1] or "C"
        mode = "full" if str(mode).lower() in ("full", "deep", "completa", "completo", "profundo") else "quick"
        with cls._lock:
            if cls._running:
                return False, "Uma varredura de superfície já está em andamento."
            if not IS_WINDOWS:
                return False, "A varredura de superfície está disponível apenas no Windows."
            cls._running = True
            cls._cancel_requested = False
            cls._scan_state = cls._blank_state(f"{letter}:", mode)
            cls._scan_state.update(running=True, current_block=0,
                                   io_mode="Abrindo acesso direto ao disco...",
                                   status_text=f"Abrindo {letter}: para leitura física direta...")
            cls._thread = threading.Thread(target=cls._scan_worker, args=(letter, mode), daemon=True)
            cls._thread.start()
            return True, "Varredura de superfície iniciada."

    @classmethod
    def stop_scan(cls):
        with cls._lock:
            if cls._running:
                cls._cancel_requested = True
                cls._scan_state["status_text"] = "Interrompendo varredura..."
                LogManager.add_log("[SURFACESCAN] Cancelamento solicitado pelo usuário.")
                return True
        return False

    @classmethod
    def _set(cls, **kw):
        with cls._lock:
            cls._scan_state.update(kw)

    @classmethod
    def _scan_worker(cls, letter, mode):
        st = cls._scan_state
        handle = None
        buf = None
        t_start = time.perf_counter()
        try:
            # 1. Disco físico (superfície inteira) ou volume como alternativa
            disk_no = _disk_number_for_letter(letter)
            target = None
            if disk_no is not None:
                handle = _open_read(f"\\\\.\\PhysicalDrive{disk_no}")
                if handle:
                    target = f"Disco físico {disk_no} (\\\\.\\PhysicalDrive{disk_no})"
            if not handle:
                handle = _open_read(f"\\\\.\\{letter}:")
                if handle:
                    target = f"Volume {letter}: (\\\\.\\{letter}:)"
            if not handle:
                err = ctypes.get_last_error()
                msg = ("Acesso negado à leitura direta do disco. Execute o WinShield Pro como Administrador."
                       if err == 5 else f"Não foi possível abrir o disco para leitura direta (erro Win32 {err}).")
                cls._set(status_text=msg, error=msg, io_mode="Indisponível")
                LogManager.add_log(f"[SURFACESCAN] {msg}")
                return

            total_bytes = _device_length(handle)
            if total_bytes <= 0:
                cls._set(status_text="Não foi possível obter o tamanho do dispositivo.", error="length")
                return
            total_bytes -= total_bytes % IO_SIZE
            buf = k32.VirtualAlloc(None, IO_SIZE, 0x3000, 0x04)
            region = total_bytes // cls.TOTAL_BLOCKS
            region -= region % IO_SIZE
            per_region = min(region, QUICK_SAMPLE) if mode == "quick" else region
            planned_bytes = per_region * cls.TOTAL_BLOCKS
            cls._set(target=target, total_mb=int(total_bytes / 1048576),
                     io_mode=f"Leitura física direta sem cache — {target}",
                     planned_mb=int(planned_bytes / 1048576),
                     coverage_percent=round(planned_bytes * 100.0 / total_bytes, 2))
            LogManager.add_log(f"=== SURFACESCAN {mode.upper()} em {target}: {total_bytes / 1e9:.1f} GB, "
                               f"{planned_bytes / 1e9:.1f} GB serão lidos ===")

            read_dw = wintypes.DWORD(0)
            new_pos = ctypes.c_longlong(0)
            freq_lat_sum = 0.0
            io_count = 0
            bytes_done = 0
            max_lat = 0.0
            speeds = []

            def read_at(off, size):
                k32.SetFilePointerEx(handle, ctypes.c_longlong(off), ctypes.byref(new_pos), 0)
                t0 = time.perf_counter()
                ok = k32.ReadFile(handle, ctypes.c_void_p(buf), size, ctypes.byref(read_dw), None)
                return bool(ok) and read_dw.value == size, (time.perf_counter() - t0) * 1000.0

            for i in range(cls.TOTAL_BLOCKS):
                if cls._cancel_requested:
                    break
                start = i * region
                worst = 1
                cell_bytes = 0
                cell_t = 0.0
                off = start
                end = start + per_region
                with cls._lock:
                    st["current_block"] = i
                    st["current_lba"] = start // 512
                while off < end:
                    if cls._cancel_requested:
                        break
                    ok, lat = read_at(off, IO_SIZE)
                    if not ok:
                        # Confirma o erro com uma segunda leitura antes de marcar como danificado
                        ok2, lat2 = read_at(off, IO_SIZE)
                        if not ok2:
                            worst = 3
                            with cls._lock:
                                st["read_errors"] += 1
                                if len(st["error_lbas"]) < 500:
                                    st["error_lbas"].append(off // 512)
                            LogManager.add_log(f"[SURFACESCAN] Erro de leitura confirmado no LBA {off // 512:,}")
                        lat = max(lat, lat2)
                    else:
                        cell_bytes += IO_SIZE
                        cell_t += lat / 1000.0
                    if worst != 3:
                        if lat >= LAT_SLOW_MS:
                            worst = 2
                        elif lat >= LAT_FAST_MS and worst == 1:
                            worst = 4
                    io_count += 1
                    freq_lat_sum += lat
                    max_lat = max(max_lat, lat)
                    bytes_done += IO_SIZE
                    off += IO_SIZE
                    if io_count % 16 == 0:
                        el = time.perf_counter() - t_start
                        with cls._lock:
                            st["last_latency_ms"] = lat
                            st["bytes_read_actual_mb"] = bytes_done / 1048576
                            st["elapsed_sec"] = el
                            st["progress_percent"] = bytes_done * 100.0 / planned_bytes
                            st["current_speed_mb"] = (cell_bytes / 1048576) / cell_t if cell_t > 0 else 0.0
                            if bytes_done:
                                st["remaining_sec"] = el * (planned_bytes - bytes_done) / bytes_done

                speed = (cell_bytes / 1048576) / cell_t if cell_t > 0 else 0.0
                if cell_bytes:
                    speeds.append(speed)
                el = time.perf_counter() - t_start
                key = {1: "fast_blocks", 4: "normal_blocks", 2: "slow_blocks", 3: "damaged_blocks"}[worst]
                with cls._lock:
                    st["blocks"][i] = worst
                    st["speed_curve"][i] = round(speed, 1)
                    st[key] += 1
                    done = i + 1
                    st["damaged_percent"] = st["damaged_blocks"] * 100.0 / done
                    st["avg_latency_ms"] = freq_lat_sum / max(1, io_count)
                    st["max_latency_ms"] = max_lat
                    st["current_speed_mb"] = speed
                    st["scanned_mb"] = int((i + 1) * region / 1048576)
                    st["bytes_read_actual_mb"] = bytes_done / 1048576
                    st["progress_percent"] = bytes_done * 100.0 / planned_bytes
                    st["elapsed_sec"] = el
                    st["remaining_sec"] = el * (planned_bytes - bytes_done) / max(1, bytes_done)
                    if speeds:
                        st["min_speed_mb"] = round(min(speeds), 1)
                        st["max_speed_mb"] = round(max(speeds), 1)
                        st["avg_speed_mb"] = round(sum(speeds) / len(speeds), 1)
                    st["status_text"] = (f"Região {done}/{cls.TOTAL_BLOCKS} · LBA {start // 512:,} · "
                                         f"{speed:.0f} MB/s · pior latência da região {'erro' if worst == 3 else ''}")

            with cls._lock:
                st["current_block"] = -1
                st["remaining_sec"] = 0
                if cls._cancel_requested:
                    st["status_text"] = "Varredura interrompida pelo usuário."
                else:
                    st["progress_percent"] = 100.0
                    bad, slow = st["damaged_blocks"], st["slow_blocks"]
                    gb = bytes_done / 1e9
                    if bad == 0 and slow == 0:
                        st["status_text"] = (f"[OK] {gb:,.1f} GB lidos sem erros. Latência média {st['avg_latency_ms']:.2f} ms, "
                                             f"transferência {st['min_speed_mb']}–{st['max_speed_mb']} MB/s.")
                    else:
                        st["status_text"] = (f"[AVISO] {gb:,.1f} GB lidos: {st['read_errors']} erro(s) de leitura em {bad} região(ões) "
                                             f"e {slow} região(ões) com setores lentos (≥ {int(LAT_SLOW_MS)} ms).")
            LogManager.add_log(f"=== SURFACESCAN FINALIZADO: {cls._scan_state['status_text']} ===")
        except Exception as ex:
            LogManager.add_log(f"[ERRO SURFACESCAN] {ex}")
            cls._set(status_text=f"Falha durante a varredura: {ex}", error=str(ex))
        finally:
            if handle:
                k32.CloseHandle(handle)
            if buf:
                k32.VirtualFree(ctypes.c_void_p(buf), 0, 0x8000)
            with cls._lock:
                cls._running = False
                cls._scan_state["running"] = False
                cls._scan_state["current_block"] = -1

    # ------------------------------------------------------------------
    # RECURSOS DO DISCO (somente o que o Windows realmente reporta)
    # ------------------------------------------------------------------
    @classmethod
    def get_drive_features(cls, disk_index=0):
        idx = int(disk_index)
        features = []
        alignment_info = []
        sectors = {"logical": None, "physical": None, "standard": "—"}
        if IS_WINDOWS:
            ps = rf"""
            $ErrorActionPreference='SilentlyContinue'
            $pd = Get-PhysicalDisk | Where-Object {{ $_.DeviceId -eq '{idx}' }} | Select-Object -First 1
            $adv = if ($pd) {{ $pd | Get-StorageAdvancedProperty }} else {{ $null }}
            $trim = (fsutil behavior query DisableDeleteNotify) -join ' '
            $dd = Get-CimInstance Win32_DiskDrive | Where-Object {{ $_.Index -eq {idx} }} | Select-Object -First 1
            $pred = $null
            if ($dd) {{
              $pnp = $dd.PNPDeviceID
              $pred = Get-CimInstance -Namespace root\wmi -ClassName MSStorageDriver_FailurePredictStatus |
                      Where-Object {{ $_.InstanceName -like ($pnp + '*') }} | Select-Object -First 1
            }}
            $rel = if ($pd) {{ $pd | Get-StorageReliabilityCounter }} else {{ $null }}
            $parts = @(Get-Partition -DiskNumber {idx} | ForEach-Object {{
              [pscustomobject]@{{ Letter=[string]$_.DriveLetter; Offset=[int64]$_.Offset; Size=[int64]$_.Size; Type=[string]$_.Type }} }})
            [pscustomobject]@{{
              Bus=[string]$pd.BusType; Media=[string]$pd.MediaType; Spindle=[int64]$pd.SpindleSpeed;
              Logical=[int]$pd.LogicalSectorSize; Physical=[int]$pd.PhysicalSectorSize;
              CacheEnabled=$adv.IsDeviceCacheEnabled; PowerProtected=$adv.IsPowerProtected;
              Trim=$trim; SmartPred=($pred -ne $null); PredictFailure=[bool]$pred.PredictFailure;
              Reliability=($rel -ne $null); Partitions=$parts
            }} | ConvertTo-Json -Depth 4 -Compress
            """
            raw = run_ps_json(ps, timeout=25) or {}
            bus = str(raw.get("Bus") or "")
            media = str(raw.get("Media") or "")
            is_nvme = bus.lower() == "nvme" or bus == "17"
            is_ssd = media.upper() == "SSD" or media == "4" or is_nvme
            trim_txt = str(raw.get("Trim") or "")
            trim_on = None
            if "DisableDeleteNotify" in trim_txt:
                # NTFS DisableDeleteNotify = 0 -> TRIM ativo
                ntfs = trim_txt.split("NTFS")[1] if "NTFS" in trim_txt else trim_txt
                trim_on = "= 0" in ntfs.split("ReFS")[0] or "= 0" in ntfs[:40]
            smart_ok = bool(raw.get("SmartPred")) or is_nvme or bool(raw.get("Reliability"))

            def feat(name, supported, active, desc):
                features.append({"feature": name, "supported": supported, "active": active, "desc": desc})

            feat("S.M.A.R.T. / Health Log", smart_ok, smart_ok,
                 "Monitoramento preditivo reportado pelo controlador" if smart_ok else "O controlador não expôs dados S.M.A.R.T. ao Windows")
            if raw.get("SmartPred"):
                feat("Previsão de falha (SMART)", True, bool(raw.get("PredictFailure")),
                     "FALHA PREVISTA pelo firmware do disco!" if raw.get("PredictFailure") else "Firmware não prevê falha")
            if is_ssd:
                feat("TRIM (Delete Notification)", True, trim_on,
                     "Windows envia comandos TRIM ao SSD" if trim_on else ("TRIM desativado no Windows" if trim_on is False else "Status não pôde ser lido"))
            cache = raw.get("CacheEnabled")
            feat("Cache de gravação do dispositivo", cache is not None, bool(cache) if cache is not None else None,
                 "Informado por Get-StorageAdvancedProperty" if cache is not None else "Não informado pelo driver")
            pp = raw.get("PowerProtected")
            if pp is not None:
                feat("Proteção contra queda de energia (PLP)", True, bool(pp),
                     "Cache protegido por capacitores" if pp else "Cache volátil (sem PLP)")
            feat("Interface", True, True, f"{bus or 'Desconhecida'} · {media or 'mídia não especificada'}"
                 + (f" · {raw.get('Spindle')} RPM" if raw.get("Spindle") and 0 < int(raw.get("Spindle")) < 100000 else ""))

            lg, ph = raw.get("Logical"), raw.get("Physical")
            sectors = {"logical": lg or None, "physical": ph or None,
                       "standard": ("4Kn" if lg == 4096 else ("512e (Advanced Format)" if ph == 4096 else ("512n" if lg == 512 else "—")))}

            parts = raw.get("Partitions") or []
            if isinstance(parts, dict):
                parts = [parts]
            for p in parts:
                off = int(p.get("Offset") or 0)
                ok = off % 4096 == 0
                alignment_info.append({
                    "letter": (p.get("Letter") or "").strip() or None,
                    "offset_bytes": off,
                    "is_4k_aligned": ok,
                    "status_text": f"[OK] Alinhada a 4 KiB (offset {off // 1024:,} KiB)" if ok
                                   else f"[AVISO] Desalinhada: offset {off:,} bytes não é múltiplo de 4096",
                })
        return {"features": features, "alignment": alignment_info, "sector_sizes": sectors}


SectorGuardEngine = SurfaceScanEngine
