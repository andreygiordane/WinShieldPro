"""
WinShield DiskGuard - Diagnóstico e Telemetria Avançada de Saúde de Discos.

Fontes de dados (todas nativas do Windows, sem programas externos):
  * Win32_DiskDrive / MSFT_PhysicalDisk ............ modelo, serial, firmware, barramento
  * Get-StorageReliabilityCounter ................... temperatura, desgaste, horas ligadas
  * MSStorageDriver_FailurePredictData/Thresholds ... atributos S.M.A.R.T. brutos (SATA/ATA)
  * IOCTL_STORAGE_QUERY_PROPERTY (NVMe log 0x02) .... SMART/Health Log completo de SSD NVMe
"""
import ctypes
import threading
import time

from backend.core import IS_WINDOWS
from backend.log_manager import LogManager
from backend.process import run_ps_json

SMART_NAMES = {
    0x01: "Taxa de erros de leitura", 0x02: "Desempenho de transferência", 0x03: "Tempo de rotação (spin-up)",
    0x04: "Partidas/paradas do motor", 0x05: "Setores realocados", 0x07: "Taxa de erros de busca (seek)",
    0x08: "Desempenho de busca", 0x09: "Horas ligado", 0x0A: "Tentativas de rotação",
    0x0B: "Tentativas de recalibração", 0x0C: "Ciclos de energia", 0x0D: "Erros de leitura suaves",
    0x16: "Hélio restante", 0xA9: "Vida restante (%)", 0xAA: "Blocos reservas disponíveis",
    0xAB: "Falhas de programação", 0xAC: "Falhas de apagamento", 0xAD: "Nivelamento de desgaste",
    0xAE: "Desligamentos inesperados", 0xAF: "Falhas de programação (pior caso)",
    0xB1: "Nivelamento de desgaste", 0xB3: "Blocos reservas usados", 0xB4: "Blocos reservas livres",
    0xB5: "Falhas de programação", 0xB6: "Falhas de apagamento", 0xB7: "Erros SATA downshift",
    0xB8: "Erros fim-a-fim", 0xBB: "Erros incorrigíveis reportados", 0xBC: "Timeouts de comando",
    0xBD: "Gravações em altura elevada", 0xBE: "Temperatura do fluxo de ar", 0xBF: "Erros por choque (G-sense)",
    0xC0: "Recolhimentos de emergência", 0xC1: "Ciclos de carga/descarga", 0xC2: "Temperatura",
    0xC3: "Correções ECC por hardware", 0xC4: "Eventos de realocação", 0xC5: "Setores pendentes",
    0xC6: "Setores incorrigíveis (offline)", 0xC7: "Erros CRC UltraDMA (cabo)", 0xC8: "Taxa de erros de gravação",
    0xCA: "Percentual de vida usado", 0xCE: "Altura de voo", 0xD2: "Falhas RAIN",
    0xE1: "Gravações do host (32 MiB)", 0xE2: "Desgaste da mídia (timer)", 0xE6: "Vida útil do drive",
    0xE7: "Vida restante do SSD", 0xE8: "Reserva disponível", 0xE9: "Indicador de desgaste da mídia",
    0xEA: "Leituras totais", 0xF0: "Horas de voo do cabeçote", 0xF1: "Total de LBAs gravados",
    0xF2: "Total de LBAs lidos", 0xF6: "Setores gravados pelo host", 0xF9: "Gravações NAND (GiB)",
    0xFA: "Erros de tentativa de leitura", 0xFE: "Proteção contra queda livre",
}
CRITICAL_ATTRS = {0x05, 0xC4, 0xC5, 0xC6, 0xBB, 0x0A, 0xB8, 0xAB, 0xAC, 0xB5, 0xB6}
WEAR_ATTRS = (0xE7, 0xE9, 0xA9, 0xB1, 0xAD, 0xCA, 0xE6)

BUS_TYPES = {0: "Desconhecido", 1: "SCSI", 2: "ATAPI", 3: "ATA", 4: "IEEE 1394", 5: "SSA",
             6: "Fibre Channel", 7: "USB", 8: "RAID", 9: "iSCSI", 10: "SAS", 11: "SATA",
             12: "SD", 13: "MMC", 15: "Virtual", 16: "Storage Spaces", 17: "NVMe"}
MEDIA_TYPES = {0: "Não especificado", 3: "HDD", 4: "SSD", 5: "SCM"}


# ----------------------------------------------------------------------------
# NVMe Health Log via DeviceIoControl
# ----------------------------------------------------------------------------
def _le(b):
    return int.from_bytes(bytes(b), "little")


def read_nvme_health(disk_index):
    """Lê o NVMe SMART/Health Information Log (página 0x02) direto do controlador."""
    if not IS_WINDOWS:
        return None
    from ctypes import wintypes
    k32 = ctypes.WinDLL("kernel32", use_last_error=True)
    k32.CreateFileW.restype = wintypes.HANDLE
    k32.CreateFileW.argtypes = [wintypes.LPCWSTR, wintypes.DWORD, wintypes.DWORD, wintypes.LPVOID,
                                wintypes.DWORD, wintypes.DWORD, wintypes.HANDLE]
    k32.DeviceIoControl.argtypes = [wintypes.HANDLE, wintypes.DWORD, wintypes.LPVOID, wintypes.DWORD,
                                    wintypes.LPVOID, wintypes.DWORD, ctypes.POINTER(wintypes.DWORD), wintypes.LPVOID]
    k32.CloseHandle.argtypes = [wintypes.HANDLE]
    invalid = wintypes.HANDLE(-1).value
    path = f"\\\\.\\PhysicalDrive{int(disk_index)}"

    IOCTL_STORAGE_QUERY_PROPERTY = 0x002D1400
    hdr, proto, data_len = 8, 40, 512
    for access in (0xC0000000, 0x80000000, 0):
        h = k32.CreateFileW(path, access, 0x3, None, 3, 0, None)
        if not h or h == invalid:
            continue
        try:
            buf = (ctypes.c_ubyte * (hdr + proto + data_len))()
            fields = [
                50, 0,          # PropertyId=StorageDeviceProtocolSpecificProperty, QueryType=Standard
                3,              # ProtocolType = NVMe
                2,              # DataType = LogPage
                0x02,           # ProtocolDataRequestValue = SMART/Health log
                0xFFFFFFFF,     # SubValue = NSID global
                proto,          # ProtocolDataOffset
                data_len,       # ProtocolDataLength
                0, 0, 0, 0,
            ]
            for i, v in enumerate(fields):
                ctypes.c_uint32.from_buffer(buf, i * 4).value = v
            ret = wintypes.DWORD(0)
            ok = k32.DeviceIoControl(h, IOCTL_STORAGE_QUERY_PROPERTY, buf, len(buf), buf, len(buf),
                                     ctypes.byref(ret), None)
            if not ok:
                # alguns drivers exigem NSID = 0
                ctypes.c_uint32.from_buffer(buf, 20).value = 0
                ok = k32.DeviceIoControl(h, IOCTL_STORAGE_QUERY_PROPERTY, buf, len(buf), buf, len(buf),
                                         ctypes.byref(ret), None)
            if not ok:
                continue
            off = ctypes.c_uint32.from_buffer(buf, hdr + 16).value or proto
            d = bytes(buf[hdr + off: hdr + off + data_len])
            if len(d) < 200:
                continue
            temp_k = _le(d[1:3])
            sensors = [(_le(d[200 + i * 2: 202 + i * 2]) - 273) for i in range(8) if _le(d[200 + i * 2: 202 + i * 2])]
            return {
                "critical_warning": d[0],
                "temperature": temp_k - 273 if temp_k else None,
                "available_spare": d[3],
                "spare_threshold": d[4],
                "percentage_used": d[5],
                "data_units_read": _le(d[32:48]),
                "data_units_written": _le(d[48:64]),
                "host_reads": _le(d[64:80]),
                "host_writes": _le(d[80:96]),
                "busy_time_min": _le(d[96:112]),
                "power_cycles": _le(d[112:128]),
                "power_on_hours": _le(d[128:144]),
                "unsafe_shutdowns": _le(d[144:160]),
                "media_errors": _le(d[160:176]),
                "error_log_entries": _le(d[176:192]),
                "warn_temp_time": _le(d[192:196]),
                "crit_temp_time": _le(d[196:200]),
                "sensors": sensors,
            }
        except Exception as ex:  # noqa: BLE001
            LogManager.add_log(f"[AVISO NVMe] Disco {disk_index}: {ex}")
        finally:
            k32.CloseHandle(h)
    return None


# ----------------------------------------------------------------------------
# Parsing SMART ATA
# ----------------------------------------------------------------------------
def parse_smart(data, thresholds):
    attrs = {}
    if not data or len(data) < 362:
        return attrs
    thr = {}
    if thresholds and len(thresholds) >= 362:
        for i in range(30):
            o = 2 + i * 12
            if thresholds[o]:
                thr[thresholds[o]] = thresholds[o + 1]
    for i in range(30):
        o = 2 + i * 12
        aid = data[o]
        if aid == 0:
            continue
        raw = _le(data[o + 5:o + 11])
        attrs[aid] = {
            "id": aid, "hex": f"{aid:02X}", "name": SMART_NAMES.get(aid, f"Atributo do fabricante {aid:02X}"),
            "flags": data[o + 1] | (data[o + 2] << 8), "current": data[o + 3], "worst": data[o + 4],
            "threshold": thr.get(aid, 0), "raw": raw, "raw_hex": f"{raw:012X}",
        }
    for a in attrs.values():
        status = "ok"
        if a["threshold"] and a["current"] <= a["threshold"]:
            status = "fail"
        elif a["id"] in CRITICAL_ATTRS and (a["raw"] & 0xFFFFFFFF) > 0:
            status = "warn"
        a["status"] = status
    return attrs


def _raw32(attrs, aid):
    a = attrs.get(aid)
    return (a["raw"] & 0xFFFFFFFF) if a else 0


def _temp_from_smart(attrs):
    for aid in (0xC2, 0xBE):
        a = attrs.get(aid)
        if a:
            t = a["raw"] & 0xFF
            if 0 < t < 120:
                return t
    return None


# ----------------------------------------------------------------------------
# Cálculo de integridade e heurística preditiva de falhas (WinShield DiskGuard Engine)
# ----------------------------------------------------------------------------
def compute_health(d):
    issues = []
    err = 100.0
    life = 100.0
    attrs = d.get("smart") or {}
    nv = d.get("nvme")
    is_ssd = d["media"] in ("SSD", "NVMe SSD")

    def pen(cond, amount, msg, level="warn"):
        nonlocal err
        if cond:
            err -= amount
            issues.append({"level": level, "text": msg})

    if attrs:
        r05, rc5, rc6, rbb = _raw32(attrs, 0x05), _raw32(attrs, 0xC5), _raw32(attrs, 0xC6), _raw32(attrs, 0xBB)
        pen(r05 > 0, min(60, 5 + r05 * 0.6), f"{r05} setor(es) realocado(s) — a superfície/memória apresenta defeitos.", "crit" if r05 > 50 else "warn")
        pen(rc5 > 0, min(40, 5 + rc5 * 2), f"{rc5} setor(es) pendente(s) aguardando realocação.", "crit")
        pen(rc6 > 0, min(40, 5 + rc6 * 2), f"{rc6} setor(es) incorrigível(is) detectados offline.", "crit")
        pen(rbb > 0, min(30, 3 + rbb), f"{rbb} erro(s) incorrigível(is) reportado(s) ao sistema.")
        rc4 = _raw32(attrs, 0xC4)
        pen(rc4 > 0 and r05 == 0, min(15, rc4 * 0.3), f"{rc4} evento(s) de realocação registrados.")
        r0a = _raw32(attrs, 0x0A)
        pen(r0a > 0, min(20, r0a * 5), f"{r0a} tentativa(s) de rotação do motor falharam.")
        rb8 = _raw32(attrs, 0xB8)
        pen(rb8 > 0, min(20, rb8 * 5), f"{rb8} erro(s) de integridade fim-a-fim.")
        for aid in (0xAB, 0xAC, 0xB5, 0xB6):
            r = _raw32(attrs, aid)
            pen(r > 0 and is_ssd, min(20, 2 + r), f"{r} falha(s) de {SMART_NAMES[aid].lower()} na memória flash.")
        rc7 = _raw32(attrs, 0xC7)
        if rc7 > 0:
            issues.append({"level": "info", "text": f"{rc7} erro(s) CRC de comunicação — verifique o cabo SATA (não afeta a saúde)."})
        failing = [a for a in attrs.values() if a["status"] == "fail"]
        if failing:
            err = min(err, 5)
            for a in failing:
                issues.append({"level": "crit", "text": f"Atributo '{a['name']}' abaixo do limite do fabricante."})
        if is_ssd:
            for aid in WEAR_ATTRS:
                a = attrs.get(aid)
                if a and 0 < a["current"] <= 100:
                    life = float(a["current"])
                    d["wear_source"] = f"SMART {a['hex']} ({a['name']})"
                    break

    if nv:
        life = float(max(0, 100 - nv["percentage_used"]))
        d["wear_source"] = "NVMe Percentage Used"
        me = nv["media_errors"]
        pen(me > 0, min(40, 5 + me * 2), f"{me} erro(s) de integridade de mídia/dados no NVMe.", "crit")
        cw = nv["critical_warning"]
        if nv["spare_threshold"] and nv["available_spare"] < nv["spare_threshold"]:
            err = min(err, 10)
            issues.append({"level": "crit", "text": "Blocos reservas abaixo do limite mínimo do fabricante."})
        if cw & 0x04:
            err = min(err, 20)
            issues.append({"level": "crit", "text": "O controlador NVMe reporta confiabilidade degradada."})
        if cw & 0x08:
            err = min(err, 5)
            issues.append({"level": "crit", "text": "O SSD entrou em modo somente-leitura!"})
        if cw & 0x02:
            issues.append({"level": "warn", "text": "Temperatura acima do limite do controlador."})
        if nv["unsafe_shutdowns"] > 50:
            issues.append({"level": "info", "text": f"{nv['unsafe_shutdowns']} desligamentos inesperados registrados."})
    elif not attrs and d.get("rel_wear") is not None and is_ssd:
        life = float(max(0, 100 - d["rel_wear"]))
        d["wear_source"] = "Storage Reliability Counter"

    if d.get("predict_failure"):
        err = min(err, 5)
        issues.append({"level": "crit", "text": "O próprio disco PREVÊ FALHA (S.M.A.R.T. Predict Failure). Faça backup imediatamente!"})
    if d.get("os_health") in ("Warning", "Unhealthy"):
        issues.append({"level": "warn", "text": f"O Windows reporta o estado do disco como: {d.get('os_health_pt')}."})

    if life < 100 and is_ssd:
        if life <= 10:
            issues.append({"level": "crit", "text": f"Vida útil restante da memória flash: {life:.0f}%. Planeje a substituição."})
        elif life <= 50:
            issues.append({"level": "warn", "text": f"Desgaste elevado: resta {life:.0f}% da vida útil estimada."})

    t = d.get("temperature")
    if t is not None:
        warn, crit = (50, 58) if d["media"] == "HDD" else (70, 80)
        if t >= crit:
            issues.append({"level": "crit", "text": f"Temperatura crítica: {t} °C. Melhore a ventilação."})
            d["temp_status"] = "crit"
        elif t >= warn:
            issues.append({"level": "warn", "text": f"Temperatura elevada: {t} °C."})
            d["temp_status"] = "warn"
        else:
            d["temp_status"] = "ok"

    health = max(0, min(100, round(life * max(0.0, err) / 100.0)))
    if not attrs and not nv and d.get("rel_wear") is None and not d.get("predict_failure"):
        d["health_source"] = "limited"
        issues.append({"level": "info", "text": "O controlador/USB não expõe dados S.M.A.R.T. completos — análise limitada."})
    else:
        d["health_source"] = "full"

    if health >= 90:
        label, lvl = "Excelente", "ok"
    elif health >= 70:
        label, lvl = "Bom", "ok"
    elif health >= 40:
        label, lvl = "Atenção", "warn"
    else:
        label, lvl = "Crítico", "crit"
    if not [i for i in issues if i["level"] in ("warn", "crit")]:
        issues.insert(0, {"level": "ok", "text": "Nenhum setor defeituoso, erro de leitura ou problema de integridade encontrado."})

    used = 100 - life
    poh = d.get("power_on_hours") or 0
    if is_ssd and used >= 1 and poh > 0:
        d["life_remaining_days"] = int(poh * life / used / 24)

    d.update(health=health, health_label=label, health_level=lvl, life=round(life), issues=issues)
    return d


# ----------------------------------------------------------------------------
# Coleta principal
# ----------------------------------------------------------------------------
_PS_SCRIPT = r"""
$ErrorActionPreference='SilentlyContinue'
$disks = @(Get-CimInstance Win32_DiskDrive | ForEach-Object {
  [pscustomobject]@{ Index=[int]$_.Index; Model=[string]$_.Model; Serial=([string]$_.SerialNumber).Trim();
    Firmware=[string]$_.FirmwareRevision; Interface=[string]$_.InterfaceType; Size=[int64]$_.Size;
    PNP=[string]$_.PNPDeviceID; Partitions=[int]$_.Partitions; Status=[string]$_.Status;
    Cylinders=[int64]$_.TotalCylinders; BytesPerSector=[int]$_.BytesPerSector } })
$phys = @(Get-PhysicalDisk | ForEach-Object {
  $r = $_ | Get-StorageReliabilityCounter
  [pscustomobject]@{ DeviceId=[string]$_.DeviceId; FriendlyName=[string]$_.FriendlyName; MediaType=[int]$_.MediaType;
    BusType=[int]$_.BusType; Health=[string]$_.HealthStatus; Operational=(($_.OperationalStatus | ForEach-Object { [string]$_ }) -join ', ');
    MediaTypeStr=[string]$_.MediaType; BusTypeStr=[string]$_.BusType;
    Spindle=[int64]$_.SpindleSpeed; Serial=([string]$_.SerialNumber).Trim(); Firmware=[string]$_.FirmwareVersion;
    Size=[int64]$_.Size; LogicalSector=[int]$_.LogicalSectorSize; PhysicalSector=[int]$_.PhysicalSectorSize;
    Temperature=$r.Temperature; TemperatureMax=$r.TemperatureMax; Wear=$r.Wear; PowerOnHours=$r.PowerOnHours;
    ReadErrorsTotal=$r.ReadErrorsTotal; ReadErrorsUncorrected=$r.ReadErrorsUncorrected;
    WriteErrorsTotal=$r.WriteErrorsTotal; WriteErrorsUncorrected=$r.WriteErrorsUncorrected;
    StartStop=$r.StartStopCycleCount; LoadUnload=$r.LoadUnloadCycleCount;
    ReadLatencyMax=$r.ReadLatencyMax; WriteLatencyMax=$r.WriteLatencyMax } })
$smart = @(Get-CimInstance -Namespace root\wmi -ClassName MSStorageDriver_FailurePredictData | ForEach-Object {
  [pscustomobject]@{ I=[string]$_.InstanceName; D=@($_.VendorSpecific | ForEach-Object { [int]$_ }) } })
$thr = @(Get-CimInstance -Namespace root\wmi -ClassName MSStorageDriver_FailurePredictThresholds | ForEach-Object {
  [pscustomobject]@{ I=[string]$_.InstanceName; D=@($_.VendorSpecific | ForEach-Object { [int]$_ }) } })
$pred = @(Get-CimInstance -Namespace root\wmi -ClassName MSStorageDriver_FailurePredictStatus | ForEach-Object {
  [pscustomobject]@{ I=[string]$_.InstanceName; P=[bool]$_.PredictFailure } })
$parts = @(Get-Partition | Where-Object { [string]$_.DriveLetter -match '^[A-Za-z]$' } | ForEach-Object {
  $v = Get-Volume -DriveLetter $_.DriveLetter
  [pscustomobject]@{ Disk=[int]$_.DiskNumber; Letter=[string]$_.DriveLetter; Size=[int64]$v.Size;
    Free=[int64]$v.SizeRemaining; Label=[string]$v.FileSystemLabel; FS=[string]$v.FileSystem } })
[pscustomobject]@{ disks=$disks; phys=$phys; smart=$smart; thr=$thr; pred=$pred; parts=$parts } | ConvertTo-Json -Depth 5 -Compress
"""

OS_HEALTH = {"0": "Healthy", "1": "Warning", "2": "Unhealthy", "5": "Unknown"}
OS_HEALTH_PT = {"Healthy": "Saudável", "Warning": "Aviso", "Unhealthy": "Não saudável", "Unknown": "Desconhecido"}


def _list(v):
    if v is None:
        return []
    return v if isinstance(v, list) else [v]


def _enum(num, text, table):
    """Resolve enums que podem vir como número ou como texto."""
    try:
        return table.get(int(num), str(text or num))
    except (TypeError, ValueError):
        return str(text or num or "")


def _nz(v):
    """Converte 0/None em None (contadores não suportados retornam 0)."""
    return v if v not in (None, 0, "0") else None


def _host_bytes(model, attrs, nv):
    """Total gravado/lido pelo host (bytes). SATA: estimativa via atributos do fabricante."""
    if nv:
        return nv["data_units_written"] * 512000, nv["data_units_read"] * 512000
    m = (model or "").upper()
    w = r = None
    if 0xF1 in attrs:
        raw = attrs[0xF1]["raw"]
        if "INTEL" in m and 0xE1 in attrs:
            w = attrs[0xE1]["raw"] * 32 * 1024 * 1024
        elif ("KINGSTON" in m or "SANDFORCE" in m) and raw < 50_000_000:
            w = raw * 1024 ** 3
        else:
            w = raw * 512
    elif 0xF6 in attrs:
        w = attrs[0xF6]["raw"] * 512
    if 0xF2 in attrs:
        raw = attrs[0xF2]["raw"]
        r = raw * 1024 ** 3 if ("KINGSTON" in m and raw < 50_000_000) else raw * 512
    return w, r


def _nvme_details(nv):
    if not nv:
        return []
    gb = lambda u: u * 512000  # noqa: E731
    rows = [
        ("Aviso crítico", f"0x{nv['critical_warning']:02X}" + (" (nenhum)" if nv["critical_warning"] == 0 else ""), "bad" if nv["critical_warning"] else "ok"),
        ("Temperatura composta", f"{nv['temperature']} °C" if nv["temperature"] is not None else "—", ""),
        ("Reserva disponível", f"{nv['available_spare']} %", "bad" if nv["available_spare"] < nv["spare_threshold"] else "ok"),
        ("Limite de reserva", f"{nv['spare_threshold']} %", ""),
        ("Percentual usado (desgaste)", f"{nv['percentage_used']} %", "warn" if nv["percentage_used"] >= 50 else ""),
        ("Dados lidos", ("bytes", gb(nv["data_units_read"])), ""),
        ("Dados gravados", ("bytes", gb(nv["data_units_written"])), ""),
        ("Comandos de leitura do host", f"{nv['host_reads']:,}".replace(",", "."), ""),
        ("Comandos de gravação do host", f"{nv['host_writes']:,}".replace(",", "."), ""),
        ("Tempo ocupado do controlador", f"{nv['busy_time_min']:,} min".replace(",", "."), ""),
        ("Ciclos de energia", f"{nv['power_cycles']:,}".replace(",", "."), ""),
        ("Horas ligado", f"{nv['power_on_hours']:,} h".replace(",", "."), ""),
        ("Desligamentos inseguros", f"{nv['unsafe_shutdowns']:,}".replace(",", "."), ""),
        ("Erros de mídia e integridade", str(nv["media_errors"]), "bad" if nv["media_errors"] else "ok"),
        ("Entradas no log de erros", str(nv["error_log_entries"]), ""),
        ("Tempo em temperatura de aviso", f"{nv['warn_temp_time']} min", "warn" if nv["warn_temp_time"] else ""),
        ("Tempo em temperatura crítica", f"{nv['crit_temp_time']} min", "bad" if nv["crit_temp_time"] else ""),
    ]
    for i, s in enumerate(nv.get("sensors") or []):
        rows.append((f"Sensor de temperatura {i + 1}", f"{s} °C", ""))
    out = []
    for label, val, st in rows:
        if isinstance(val, tuple):
            out.append({"label": label, "bytes": val[1], "status": st})
        else:
            out.append({"label": label, "value": val, "status": st})
    return out


class DiskHealthEngine:
    _cache = None
    _cache_ts = 0.0
    _lock = threading.Lock()

    @classmethod
    def scan(cls, force=False):
        with cls._lock:
            if cls._cache is not None and not force and time.time() - cls._cache_ts < 45:
                return cls._cache
            LogManager.add_log("Lendo S.M.A.R.T., sensores e contadores de confiabilidade dos discos...")
            t0 = time.time()
            raw = run_ps_json(_PS_SCRIPT, timeout=150) or {}
            disks = []
            try:
                disks = cls._build(raw)
            except Exception as ex:  # noqa: BLE001
                LogManager.add_log(f"[ERRO] Falha ao interpretar dados dos discos: {ex}")
            cls._cache, cls._cache_ts = disks, time.time()
            LogManager.add_log(f"[OK] {len(disks)} disco(s) físico(s) analisado(s) em {time.time() - t0:.1f}s.")
            return disks

    @staticmethod
    def _build(raw):
        phys = {str(p.get("DeviceId")): p for p in _list(raw.get("phys"))}
        smart, thr, pred = _list(raw.get("smart")), _list(raw.get("thr")), _list(raw.get("pred"))
        parts = _list(raw.get("parts"))
        out = []
        for dd in sorted(_list(raw.get("disks")), key=lambda x: x.get("Index") or 0):
            idx = int(dd.get("Index") or 0)
            p = phys.get(str(idx), {})
            pnp = (dd.get("PNP") or "").upper()

            def match(lst, pnp=pnp):
                for e in lst:
                    if pnp and (e.get("I") or "").upper().startswith(pnp):
                        return e
                return None

            s, t, pr = match(smart), match(thr), match(pred)
            attrs = parse_smart(s.get("D") or [], (t or {}).get("D")) if s else {}
            bus = _enum(p.get("BusType"), p.get("BusTypeStr"), BUS_TYPES) if p else (dd.get("Interface") or "?")
            mtype = _enum(p.get("MediaType"), p.get("MediaTypeStr"), MEDIA_TYPES) if p else ""
            model = dd.get("Model") or p.get("FriendlyName") or f"Disco {idx}"
            spindle = p.get("Spindle")

            nv = read_nvme_health(idx)
            if nv:
                bus = "NVMe"
                media = "NVMe SSD"
            elif mtype in ("SSD", "HDD"):
                media = mtype
            elif spindle and 0 < spindle < 100000:
                media = "HDD"
            elif "SSD" in model.upper() or "NVME" in model.upper() or any(a in attrs for a in (0xE7, 0xE9, 0xB1, 0xAD)):
                media = "SSD"
            elif 0x03 in attrs:
                media = "HDD"
            else:
                media = mtype or "SSD" if ("KINGSTON" in model.upper() or "SAMSUNG" in model.upper() or "SANDISK" in model.upper() or "CRUCIAL" in model.upper() or "WD" in model.upper()) else "Disco Local"

            temp = (nv or {}).get("temperature") or _temp_from_smart(attrs) or _nz(p.get("Temperature"))
            if nv:
                poh, cycles = nv["power_on_hours"], nv["power_cycles"]
            else:
                poh = _raw32(attrs, 0x09) if 0x09 in attrs else _nz(p.get("PowerOnHours"))
                cycles = _raw32(attrs, 0x0C) if 0x0C in attrs else _nz(p.get("StartStop"))
            writes, reads = _host_bytes(model, attrs, nv)
            os_h = OS_HEALTH.get(str(p.get("Health")), str(p.get("Health") or "Unknown"))

            d = {
                "index": idx, "model": model.strip(), "serial": dd.get("Serial") or p.get("Serial") or "—",
                "firmware": dd.get("Firmware") or p.get("Firmware") or "—",
                "size": dd.get("Size") or p.get("Size") or 0, "bus": bus, "media": media,
                "interface": dd.get("Interface") or "—",
                "rpm": spindle if (spindle and 0 < spindle < 100000) else None,
                "logical_sector": p.get("LogicalSector") or dd.get("BytesPerSector"),
                "physical_sector": p.get("PhysicalSector"),
                "partitions": dd.get("Partitions") or 0,
                "os_health": os_h, "os_health_pt": OS_HEALTH_PT.get(os_h, os_h),
                "operational": p.get("Operational") or dd.get("Status") or "—",
                "temperature": temp, "temperature_max": _nz(p.get("TemperatureMax")),
                "power_on_hours": poh, "power_cycles": cycles,
                "host_writes": writes, "host_reads": reads,
                "rel_wear": p.get("Wear") if p.get("Wear") not in (None,) and (p.get("Wear") or 0) > 0 else None,
                "read_errors": p.get("ReadErrorsTotal"), "write_errors": p.get("WriteErrorsTotal"),
                "read_errors_unc": p.get("ReadErrorsUncorrected"), "write_errors_unc": p.get("WriteErrorsUncorrected"),
                "load_unload": _nz(p.get("LoadUnload")) or (_raw32(attrs, 0xC1) or None),
                "read_latency_max": _nz(p.get("ReadLatencyMax")), "write_latency_max": _nz(p.get("WriteLatencyMax")),
                "predict_failure": bool(pr and pr.get("P")),
                "smart": attrs, "nvme": nv,
                "smart_supported": bool(attrs or nv),
                "volumes": [{"letter": v.get("Letter"), "label": v.get("Label") or "Disco Local", "fs": v.get("FS"),
                             "size": v.get("Size") or 0, "free": v.get("Free") or 0}
                            for v in parts if int(v.get("Disk") if v.get("Disk") is not None else -1) == idx],
            }
            compute_health(d)
            d["smart_list"] = sorted(attrs.values(), key=lambda a: a["id"])
            d["nvme_list"] = _nvme_details(nv)
            d.pop("smart", None)
            out.append(d)
        return out


# Alias proprietário WinShield
DiskGuardEngine = DiskHealthEngine
