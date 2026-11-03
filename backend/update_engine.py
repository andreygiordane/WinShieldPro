"""
Central de Atualizações - WinShield Pro.

Reúne num só lugar tudo o que o PC deveria ter atualizado, sempre de fontes oficiais:
  * Windows Update (servidores da Microsoft): segurança, cumulativas, .NET, Defender e opcionais.
  * Drivers por hardware: drivers WHQL que o Windows Update associa ao ID exato de cada peça.
    Drivers com data igual ou mais antiga que a do driver instalado são ocultados.
  * Driver de vídeo do fabricante: API oficial da NVIDIA (versão real); AMD e Intel não têm
    API pública de versão, então entram os assistentes/sites oficiais deles.
  * Programas instalados (winget): instalador do site do desenvolvedor, conferido por SHA-256.

Fluxo: scan() roda em segundo plano -> status() alimenta a interface ->
install(ids) instala em sequência, com ponto de restauração antes e resultado item a item.
"""

import json
import os
import re
import ssl
import subprocess
import threading
import time
import urllib.request
import webbrowser
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from urllib.parse import urlparse

from backend.core import IS_WINDOWS, app_data_dir
from backend.device_engine import NVIDIA_PFID_MAP, DeviceEngine
from backend.log_manager import LogManager
from backend.process import decode_output, hidden_kwargs, ps_command, run_hidden, run_ps, run_ps_json

# Downloads de executáveis sempre com TLS verificado
_ssl_ctx = ssl.create_default_context()

# Classificações oficiais do Windows Update (IDs fixos, não dependem do idioma do Windows)
WU_CLASSIFICATIONS = {
    "0fa1201d-4330-4fa8-8ae9-b877473b6441": "security",
    "e6cf1350-c01b-414d-a61f-263d14d133b4": "critical",
    "e0789628-ce08-4437-be74-2495b842f43b": "definition",
    "28bc880e-0592-4cbf-8f95-c79b17911d5f": "rollup",
    "cd5ffd1e-e932-4e3a-bf74-18bf0b1bbd83": "update",
    "b54e7d24-7add-428f-8b75-90a396fa584f": "feature",
    "68c5b0a3-d1a6-4553-ae49-01d3a7827828": "feature",
    "3689bdc8-b205-4af4-8d4a-a63924c5e9d5": "feature",
    "b4832bd8-e735-4761-8daf-37f882276dab": "update",
    "ebfc1fc5-71a4-4f7b-9aca-3b9a503104a0": "driver",
}

# (nível, explicação em linguagem simples) por classificação
WU_EXPLANATIONS = {
    "security": ("important", "Corrige falhas de segurança do Windows que já são conhecidas publicamente. "
                              "Sem ela, o PC fica exposto a ataques que exploram essas falhas."),
    "critical": ("important", "Correção crítica de estabilidade ou confiabilidade publicada pela Microsoft."),
    "definition": ("recommended", "Novas assinaturas de vírus do Microsoft Defender. É pequena, segura "
                                  "e não exige reinício."),
    "rollup": ("recommended", "Pacote que junta várias correções do Windows, do .NET ou do Office num só download."),
    "update": ("recommended", "Correção ou melhoria do Windows, do .NET ou de outro produto da Microsoft."),
    "feature": ("optional", "Nova versão de recursos do Windows. É grande e pode demorar bastante; "
                            "instale quando puder deixar o PC trabalhando."),
}
WU_OPTIONAL_NOTE = ("Atualização opcional (prévia): traz correções que só entram oficialmente no pacote do "
                    "mês seguinte. Instale se ela corrigir algum problema que você tem.")

LEVEL_LABELS = {
    "critical": "Crítica",
    "important": "Importante",
    "recommended": "Recomendada",
    "optional": "Opcional",
}

# Ordem de instalação: Windows primeiro, depois drivers, programas e por último vídeo/assistentes
GROUP_ORDER = {"windows": 0, "drivers": 1, "apps": 2, "gpu": 3}

WU_ERRORS = {
    "0x80070422": "o serviço Windows Update está desativado neste PC",
    "0x8024402C": "sem conexão com os servidores da Microsoft",
    "0x80072EFD": "sem conexão com os servidores da Microsoft",
    "0x80072EE2": "a conexão com os servidores da Microsoft expirou",
    "0x8024001E": "o serviço Windows Update foi interrompido",
    "0x80240438": "não foi possível alcançar o Windows Update (proxy ou firewall)",
}

WINGET_NO_UPGRADE = 0x8A15002B  # nenhuma atualização aplicável (já está atualizado)

NVIDIA_DRIVERS_PAGE = "https://www.nvidia.com/pt-br/drivers/"
AMD_DRIVERS_PAGE = "https://www.amd.com/pt/support/download/drivers.html"
INTEL_DSA_URL = "https://dsadata.intel.com/installer"
INTEL_DSA_PAGE = "https://www.intel.com.br/content/www/br/pt/support/intel-driver-support-assistant.html"
NVIDIA_RECENT_PFID = NVIDIA_PFID_MAP["RTX 4060 Ti"]  # qualquer RTX desktop recebe o mesmo pacote Game Ready


def _updates_dir():
    path = os.path.join(app_data_dir(), "Updates")
    os.makedirs(path, exist_ok=True)
    return path


def _fmt_size(num_bytes):
    if not num_bytes:
        return ""
    mb = num_bytes / (1024 * 1024)
    return f"{mb / 1024:.1f} GB" if mb >= 1024 else f"{max(mb, 0.1):.1f} MB"


def _version_tuple(text):
    return tuple(int(p) for p in re.findall(r"\d+", str(text or "")))


def _ps_quote(text):
    return "'" + str(text).replace("'", "''") + "'"


# =============================================================================
# CONVERSÃO DOS DADOS BRUTOS EM ITENS EXPLICADOS
# =============================================================================
def wu_item(raw):
    """Converte uma atualização do Windows Update (JSON do PowerShell) num item da central."""
    categories = [str(c).lower() for c in (raw.get("categories") or [])]
    kinds = [WU_CLASSIFICATIONS[c] for c in categories if c in WU_CLASSIFICATIONS]
    is_driver = int(raw.get("type") or 1) == 2 or "driver" in kinds
    recommended = bool(raw.get("auto"))
    size = float(raw.get("size") or 0)
    kb = (raw.get("kb") or "").strip(",")
    item = {
        "id": f"wu:{raw.get('id')}",
        "title": (raw.get("title") or "Atualização do Windows").strip(),
        "size_bytes": size,
        "reboot": int(raw.get("reboot") or 0) > 0,
        "selectable": True,
        "action": "install",
    }

    if is_driver:
        device = (raw.get("device_name") or raw.get("driver_model") or "um dispositivo").strip()
        why = (f"Driver certificado pela Microsoft (WHQL) para {device}. O Windows Update escolhe este "
               f"driver pelo ID exato do hardware, por isso ele é compatível com esta peça.")
        compared = bool(raw.get("installed_date") and raw.get("driver_date"))
        if compared:
            why += f" O driver instalado é de {raw['installed_date']}; este é de {raw['driver_date']}."
        else:
            why += (" Não foi possível comparar com o driver instalado (o dispositivo pode estar "
                    "desconectado agora).")
        if not recommended:
            why += (" É opcional: o Windows não instala sozinho. Vale instalar se o dispositivo tiver "
                    "algum problema ou se o driver atual for antigo.")
        item.update({
            "group": "drivers",
            "level": "recommended" if recommended else "optional",
            "why": why,
            "source": "Windows Update (servidores da Microsoft)",
            "from_version": raw.get("installed_version") or "",
            "to_version": raw.get("driver_date") or "",
            "subtitle": " · ".join(p for p in [raw.get("driver_vendor"), raw.get("driver_class"), _fmt_size(size)] if p),
            # Opcional só vem marcado se confirmamos que é mais novo que o instalado
            "selected": recommended or compared,
        })
        return item

    kind = next((k for k in ("security", "critical", "definition", "rollup", "feature", "update") if k in kinds), "update")
    level, why = WU_EXPLANATIONS[kind]
    if kind == "security" and str(raw.get("severity") or "").lower() == "critical":
        level = "critical"
    if "890830" in kb:
        # A Microsoft classifica a MSRT como "rollup", mas ela é outra coisa
        why = ("Ferramenta mensal da Microsoft que procura e remove malwares comuns. Roda uma vez "
               "durante a instalação e não fica instalada nem substitui o antivírus.")
    if not recommended and kind != "definition":
        level, why = "optional", why + " " + WU_OPTIONAL_NOTE
    item.update({
        "group": "windows",
        "level": level,
        "why": why,
        "source": "Windows Update (servidores da Microsoft)",
        "from_version": "",
        "to_version": "",
        "subtitle": " · ".join(p for p in [f"KB{kb}" if kb else "", _fmt_size(size),
                                           "pode pedir reinício" if item["reboot"] else ""] if p),
        "selected": level != "optional",
    })
    return item


def winget_item(row):
    return {
        "id": f"app:{row['id']}",
        "group": "apps",
        "title": row["name"],
        "subtitle": f"{row['id']} · {row['version']} → {row['available']}",
        "level": "recommended",
        "why": ("Nova versão do programa. O winget (gerenciador oficial de pacotes da Microsoft) baixa o "
                "instalador do site do desenvolvedor e confere o hash SHA-256 publicado antes de instalar."),
        "source": f"winget ({row.get('source') or 'winget'})",
        "from_version": row["version"],
        "to_version": row["available"],
        "size_bytes": 0,
        "reboot": False,
        "selected": True,
        "selectable": True,
        "action": "install",
    }


def parse_winget_upgrade(text):
    """
    Lê a tabela do `winget upgrade` (em qualquer idioma) pelas posições das colunas do cabeçalho.
    Linhas com ID truncado ("…") são descartadas: instalar com ID cortado falharia.
    """
    lines = (text or "").replace("\r\n", "\n").replace("\r", "\n").split("\n")
    rows, cols, seen = [], None, set()
    for i, line in enumerate(lines):
        if re.fullmatch(r"-{10,}", line.strip()):
            starts = [m.start() for m in re.finditer(r"\S+", lines[i - 1])] if i > 0 else []
            cols = starts if len(starts) >= 4 else None
            continue
        if not cols or not line.strip() or len(line) <= cols[3]:
            continue
        bounds = cols + [None]
        fields = [line[bounds[k]:bounds[k + 1]].strip() for k in range(len(cols))]
        name, pkg_id, version, available = fields[:4]
        source = fields[4] if len(fields) > 4 else ""
        if (not pkg_id or " " in pkg_id or pkg_id.endswith("…") or not available
                or (source and source.lower() not in ("winget", "msstore"))):
            continue
        if pkg_id in seen:
            continue
        seen.add(pkg_id)
        rows.append({"name": name or pkg_id, "id": pkg_id, "version": version,
                     "available": available, "source": source})
    return rows


# =============================================================================
# SCRIPTS POWERSHELL (Windows Update Agent via COM)
# =============================================================================
_PS_WU_SCAN = r"""
try {
    $session = New-Object -ComObject Microsoft.Update.Session
    $session.ClientApplicationID = 'WinShield Pro'
    $result = $session.CreateUpdateSearcher().Search("IsInstalled=0 and IsHidden=0")
} catch {
    [PSCustomObject]@{ error = $_.Exception.Message; hresult = ('0x{0:X8}' -f $_.Exception.HResult) } | ConvertTo-Json -Compress
    return
}
$map = $null
$items = foreach ($u in $result.Updates) {
    $o = [ordered]@{
        id = $u.Identity.UpdateID; title = $u.Title
        kb = (@($u.KBArticleIDs) -join ','); severity = $u.MsrcSeverity
        categories = @($u.Categories | ForEach-Object { $_.CategoryID })
        auto = [bool]$u.AutoSelectOnWebSites; size = [double]$u.MaxDownloadSize
        type = [int]$u.Type; reboot = [int]$u.InstallationBehavior.RebootBehavior
    }
    if ($u.Type -eq 2) {
        if ($null -eq $map) {
            # ID de hardware -> driver instalado, para comparar datas
            $map = @{}; $drv = @{}
            Get-CimInstance Win32_PnPSignedDriver | Where-Object DeviceID | ForEach-Object { $drv[$_.DeviceID] = $_ }
            Get-CimInstance Win32_PnPEntity | ForEach-Object {
                $d = $drv[$_.PNPDeviceID]
                if ($d) { foreach ($h in @($_.HardwareID) + @($_.CompatibleID)) { if ($h) { $map[$h.ToUpper()] = $d } } }
            }
        }
        $o.driver_model = $u.DriverModel; $o.driver_class = $u.DriverClass; $o.driver_vendor = $u.DriverManufacturer
        $o.driver_date = if ($u.DriverVerDate) { ([datetime]$u.DriverVerDate).ToString('yyyy-MM-dd') } else { '' }
        $inst = if ($u.DriverHardwareID) { $map[([string]$u.DriverHardwareID).ToUpper()] } else { $null }
        if ($inst) {
            $o.device_name = $inst.DeviceName; $o.installed_version = $inst.DriverVersion
            $o.installed_date = if ($inst.DriverDate) { ([datetime]$inst.DriverDate).ToString('yyyy-MM-dd') } else { '' }
        }
    }
    [PSCustomObject]$o
}
[PSCustomObject]@{ updates = @($items) } | ConvertTo-Json -Depth 4 -Compress
"""

# Instala na ordem recebida; cada etapa vira uma linha "@@{json}" lida em tempo real pelo Python
_PS_WU_INSTALL = r"""
$ids = @(%IDS% | ConvertFrom-Json)
$cancelFile = %CANCEL%
function Emit($h) { [Console]::Out.WriteLine('@@' + ($h | ConvertTo-Json -Compress)); [Console]::Out.Flush() }
try {
    $session = New-Object -ComObject Microsoft.Update.Session
    $session.ClientApplicationID = 'WinShield Pro'
    $found = @{}
    foreach ($u in $session.CreateUpdateSearcher().Search("IsInstalled=0 and IsHidden=0").Updates) { $found[$u.Identity.UpdateID] = $u }
} catch {
    Emit @{ phase = 'fatal'; error = $_.Exception.Message; hresult = ('0x{0:X8}' -f $_.Exception.HResult) }
    return
}
foreach ($id in $ids) {
    if (Test-Path -LiteralPath $cancelFile) { break }
    $u = $found[$id]
    if (-not $u) { Emit @{ id = $id; phase = 'done'; ok = $true; skipped = $true }; continue }
    try {
        if (-not $u.EulaAccepted) { $u.AcceptEula() }
        $coll = New-Object -ComObject Microsoft.Update.UpdateColl
        [void]$coll.Add($u)
        if (-not $u.IsDownloaded) {
            Emit @{ id = $id; phase = 'download' }
            $dl = $session.CreateUpdateDownloader(); $dl.Updates = $coll
            $dr = $dl.Download()
            if ($dr.ResultCode -ne 2 -and $dr.ResultCode -ne 3) {
                Emit @{ id = $id; phase = 'done'; ok = $false; hresult = ('0x{0:X8}' -f $dr.HResult); step = 'download' }
                continue
            }
        }
        Emit @{ id = $id; phase = 'install' }
        $ins = $session.CreateUpdateInstaller(); $ins.Updates = $coll
        try { $ins.ForceQuiet = $true } catch {}
        $ir = $ins.Install()
        Emit @{ id = $id; phase = 'done'; ok = ($ir.ResultCode -eq 2 -or $ir.ResultCode -eq 3);
                hresult = ('0x{0:X8}' -f $ir.HResult); reboot = [bool]$ir.RebootRequired; step = 'install' }
    } catch {
        Emit @{ id = $id; phase = 'done'; ok = $false; error = $_.Exception.Message }
    }
}
"""

_PS_RESTORE_POINT = r"""
$k = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\SystemRestore'
$old = (Get-ItemProperty -Path $k -Name SystemRestorePointCreationFrequency -ErrorAction SilentlyContinue).SystemRestorePointCreationFrequency
try {
    # O Windows só cria 1 ponto a cada 24 h por padrão; libera temporariamente
    New-ItemProperty -Path $k -Name SystemRestorePointCreationFrequency -Value 0 -PropertyType DWord -Force | Out-Null
    Checkpoint-Computer -Description 'WinShield Pro - antes das atualizacoes' -RestorePointType MODIFY_SETTINGS -ErrorAction Stop
    'OK'
} catch {
    'ERRO: ' + $_.Exception.Message
} finally {
    if ($null -eq $old) { Remove-ItemProperty -Path $k -Name SystemRestorePointCreationFrequency -ErrorAction SilentlyContinue }
    else { Set-ItemProperty -Path $k -Name SystemRestorePointCreationFrequency -Value $old }
}
"""


def _wu_error_text(hresult, message=""):
    friendly = WU_ERRORS.get(str(hresult or "").upper().replace("0X", "0x"))
    return f"{friendly} ({hresult})" if friendly else (message or f"erro {hresult}")


class UpdateEngine:
    _lock = threading.Lock()
    _cancel = threading.Event()
    _items = {}        # id -> item público
    _private = {}      # id -> dados internos (URLs etc.), nunca enviados à interface
    _state = {
        "phase": "idle",  # idle | scanning | ready | installing | needs_confirmation | done
        "message": "",
        "scanned_at": None,
        "source_errors": {},
        "hidden_older_drivers": 0,
        "progress": None,
        "results": {},
        "reboot_required": False,
        "restore_point": None,
    }

    # -------------------------------------------------------------------------
    # ESTADO
    # -------------------------------------------------------------------------
    @classmethod
    def status(cls):
        with cls._lock:
            state = json.loads(json.dumps(cls._state))
            items = sorted(cls._items.values(), key=lambda it: (GROUP_ORDER.get(it["group"], 9), it["title"].lower()))
            state["items"] = [dict(it) for it in items]
        state["status"] = "success"
        state["pending"] = sum(1 for it in state["items"] if it["selectable"])
        return state

    @classmethod
    def _set(cls, **kw):
        with cls._lock:
            cls._state.update(kw)

    @classmethod
    def _busy(cls):
        return cls._state["phase"] in ("scanning", "installing")

    # -------------------------------------------------------------------------
    # VERIFICAÇÃO
    # -------------------------------------------------------------------------
    @classmethod
    def scan(cls):
        with cls._lock:
            if cls._busy():
                return False, "Já existe uma verificação ou instalação em andamento."
            cls._state.update(phase="scanning", message="Consultando Windows Update, winget e fabricantes…",
                              source_errors={}, results={}, progress=None, hidden_older_drivers=0)
        threading.Thread(target=cls._scan_worker, daemon=True, name="update-scan").start()
        return True, "Verificação iniciada."

    @classmethod
    def _scan_worker(cls):
        LogManager.add_log("[ATUALIZAÇÕES] Verificando Windows Update, drivers, programas e vídeo...")
        items, private, errors, hidden = {}, {}, {}, 0
        with ThreadPoolExecutor(max_workers=3) as pool:
            futures = {
                "windows": pool.submit(cls._scan_windows_update),
                "apps": pool.submit(cls._scan_winget),
                "gpu": pool.submit(cls._scan_gpu),
            }
            for source, fut in futures.items():
                try:
                    found, extra = fut.result()
                except Exception as ex:  # noqa: BLE001
                    errors[source] = str(ex)
                    continue
                for it, priv in found:
                    items[it["id"]] = it
                    if priv:
                        private[it["id"]] = priv
                if source == "windows":
                    hidden = extra
        with cls._lock:
            cls._items, cls._private = items, private
            cls._state.update(phase="ready", message="", source_errors=errors, hidden_older_drivers=hidden,
                              scanned_at=datetime.now().strftime("%d/%m/%Y %H:%M"))
        LogManager.add_log(f"[ATUALIZAÇÕES] {len(items)} item(ns) encontrado(s)"
                           + (f"; fontes com falha: {', '.join(errors)}" if errors else "") + ".")

    @staticmethod
    def _scan_windows_update():
        if not IS_WINDOWS:
            return [], 0
        data = run_ps_json(_PS_WU_SCAN, timeout=600)
        if not isinstance(data, dict):
            raise RuntimeError("o Windows Update não respondeu")
        if data.get("error"):
            raise RuntimeError(_wu_error_text(data.get("hresult"), data.get("error")))
        raws = data.get("updates") or []
        if isinstance(raws, dict):
            raws = [raws]
        found, hidden = [], 0
        for raw in raws:
            # Driver com data igual/mais antiga que o instalado: o Windows às vezes oferece versões
            # antigas do fabricante do PC; instalar isso seria regredir. Fica oculto.
            if int(raw.get("type") or 1) == 2 and raw.get("installed_date") and raw.get("driver_date") \
                    and raw["driver_date"] <= raw["installed_date"]:
                hidden += 1
                continue
            found.append((wu_item(raw), {"update_id": raw.get("id")}))
        return found, hidden

    @staticmethod
    def _scan_winget():
        if not IS_WINDOWS:
            return [], None
        code, out = run_hidden(["winget", "upgrade", "--include-unknown", "--accept-source-agreements",
                                "--disable-interactivity"], timeout=180)
        # -1/-2 = run_hidden não conseguiu executar ou estourou o tempo. Outros códigos podem
        # significar só "nenhuma atualização", então a tabela (ou a falta dela) decide.
        if code == -1:
            raise RuntimeError("winget indisponível neste PC (instale o \"Instalador de Aplicativo\" pela Microsoft Store)")
        if code == -2:
            raise RuntimeError("o winget não respondeu em 3 minutos")
        return [(winget_item(row), {"winget_id": row["id"]}) for row in parse_winget_upgrade(out)], None

    @classmethod
    def _scan_gpu(cls):
        if not IS_WINDOWS:
            return [], None
        gpus = run_ps_json("Get-CimInstance Win32_VideoController | Select-Object Name, DriverVersion | ConvertTo-Json -Compress",
                           timeout=30) or []
        if isinstance(gpus, dict):
            gpus = [gpus]
        found, vendors = [], set()
        for g in gpus:
            name = (g.get("Name") or "").strip()
            low = name.lower()
            if ("nvidia" in low or "geforce" in low) and "nvidia" not in vendors:
                vendors.add("nvidia")
                found.append(cls._nvidia_entry(name, g.get("DriverVersion") or ""))
            elif ("amd" in low or "radeon" in low) and "amd" not in vendors:
                vendors.add("amd")
                found.append(({
                    "id": "gpu:amd", "group": "gpu", "title": f"Driver de vídeo AMD ({name})",
                    "subtitle": "amd.com", "level": "recommended",
                    "why": ("A AMD não oferece consulta pública da versão mais nova, então o WinShield não "
                            "compara versões aqui. O botão abre a página oficial da AMD, onde a ferramenta "
                            "de detecção automática dela indica o driver exato da sua placa."),
                    "source": "Site oficial da AMD", "from_version": "", "to_version": "",
                    "size_bytes": 0, "reboot": True, "selected": False, "selectable": False,
                    "action": "open_page",
                }, {"page": AMD_DRIVERS_PAGE}))
            elif "intel" in low and "intel" not in vendors:
                vendors.add("intel")
                found.append(({
                    "id": "gpu:intel", "group": "gpu", "title": "Intel Driver & Support Assistant",
                    "subtitle": "dsadata.intel.com · assinatura digital da Intel conferida",
                    "level": "optional",
                    "why": (f"Detectamos vídeo Intel ({name}). A Intel não oferece consulta pública de versão, "
                            "então o WinShield baixa o assistente oficial dela, confere a assinatura digital "
                            "e o abre. O assistente compara os drivers Intel do PC e instala os que faltarem; "
                            "siga as telas dele."),
                    "source": "Servidor oficial da Intel", "from_version": "", "to_version": "",
                    "size_bytes": 0, "reboot": False, "selected": False, "selectable": True,
                    "action": "assistant",
                }, {"url": INTEL_DSA_URL, "domain": "intel.com", "signer": "Intel Corporation",
                    "filename": "Intel-Driver-and-Support-Assistant-Installer.exe", "args": [],
                    "page": INTEL_DSA_PAGE}))
        return found, None

    @staticmethod
    def _nvidia_entry(gpu_name, raw_version):
        installed = DeviceEngine._normalize_driver_version(gpu_name, raw_version)
        low = gpu_name.lower()
        pf_id = next((v for k, v in NVIDIA_PFID_MAP.items() if k.lower() in low), None)
        # O pacote Game Ready de desktop serve para todas as RTX; GTX antigas e notebooks têm pacotes próprios
        if pf_id is None and "rtx" in low and "laptop" not in low:
            pf_id = NVIDIA_RECENT_PFID
        base = {
            "id": "gpu:nvidia", "group": "gpu", "title": f"Driver NVIDIA Game Ready ({gpu_name})",
            "source": "Servidor oficial da NVIDIA", "from_version": installed,
            "size_bytes": 0, "reboot": True,
        }
        manual = dict(base, subtitle="nvidia.com", level="optional", to_version="", selected=False,
                      selectable=False, action="open_page",
                      why=("Não foi possível identificar automaticamente o pacote certo para esta placa "
                           "(notebooks e modelos antigos têm pacotes próprios). O botão abre a busca oficial "
                           "de drivers da NVIDIA."))
        if pf_id is None or "laptop" in low:
            return manual, {"page": NVIDIA_DRIVERS_PAGE}
        url = ("https://gfwsl.geforce.com/services_toolkit/services/com/nvidia/services/AjaxDriverService.php"
               f"?func=DriverManualLookup&pfid={pf_id}&osID=57&is64bit=1&dch=1&numberOfResults=1")
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            with urllib.request.urlopen(req, context=_ssl_ctx, timeout=15) as r:
                info = json.loads(r.read().decode("utf-8"))["IDS"][0]["downloadInfo"]
            online, dl_url = str(info["Version"]), info["DownloadURL"]
            size_mb = float(re.sub(r"[^\d.]", "", str(info.get("DownloadURLFileSize", ""))) or 0)
        except Exception as ex:  # noqa: BLE001
            LogManager.add_log(f"[AVISO] Consulta à NVIDIA falhou: {ex}")
            return manual, {"page": NVIDIA_DRIVERS_PAGE}
        if _version_tuple(online) <= _version_tuple(installed):
            up_to_date = dict(base, subtitle=f"versão {installed} já é a mais recente", level="recommended",
                              to_version=online, selected=False, selectable=False, action="none",
                              why="O driver de vídeo instalado já é a versão mais recente publicada pela NVIDIA.")
            return up_to_date, None
        item = dict(base, subtitle=f"{installed} → {online} · instalação silenciosa · assinatura da NVIDIA conferida",
                    level="recommended", to_version=online, size_bytes=size_mb * 1024 * 1024,
                    selected=False, selectable=True, action="install",
                    why=("Versão mais nova do driver de vídeo, direto da NVIDIA. Melhora desempenho e corrige "
                         "problemas em jogos recentes. Vem desmarcada porque troca o driver da placa de vídeo: "
                         "a tela pisca durante a instalação e é melhor não estar jogando ou gravando."))
        private = {"url": dl_url, "domain": "nvidia.com", "signer": "NVIDIA Corporation",
                   "filename": os.path.basename(urlparse(dl_url).path) or f"nvidia-{online}.exe",
                   "args": ["-s", "-noreboot"]}
        return item, private

    # -------------------------------------------------------------------------
    # INSTALAÇÃO
    # -------------------------------------------------------------------------
    @classmethod
    def install(cls, ids, skip_restore_point=False):
        with cls._lock:
            if cls._busy():
                return False, "Já existe uma verificação ou instalação em andamento."
            chosen = [cls._items[i] for i in (ids or []) if i in cls._items and cls._items[i]["selectable"]]
            if not chosen:
                return False, "Nenhuma atualização válida selecionada."
            chosen.sort(key=lambda it: GROUP_ORDER.get(it["group"], 9))
            cls._cancel.clear()
            cls._state.update(phase="installing", message="Preparando…", results={},
                              progress={"done": 0, "total": len(chosen), "current": "", "step": "", "percent": None})
        threading.Thread(target=cls._install_worker, args=([it["id"] for it in chosen], skip_restore_point),
                         daemon=True, name="update-install").start()
        return True, f"Instalando {len(chosen)} atualização(ões)."

    @classmethod
    def cancel(cls):
        cls._cancel.set()
        return True, "A instalação para depois do item atual (interromper no meio pode corromper o sistema)."

    @classmethod
    def _progress(cls, **kw):
        with cls._lock:
            if cls._state["progress"] is not None:
                cls._state["progress"].update(kw)

    @classmethod
    def _result(cls, item_id, ok, message, reboot=False):
        with cls._lock:
            cls._state["results"][item_id] = {"ok": ok, "message": message}
            cls._state["progress"]["done"] = len(cls._state["results"])
            if reboot:
                cls._state["reboot_required"] = True
            if ok:
                cls._items.pop(item_id, None)
        LogManager.add_log(f"[ATUALIZAÇÕES] {'OK' if ok else 'FALHA'}: {item_id} - {message}")

    @classmethod
    def _install_worker(cls, ids, skip_restore_point):
        if not skip_restore_point:
            cls._set(message="Criando ponto de restauração do sistema…")
            cls._progress(current="Ponto de restauração", step="Criando ponto de restauração")
            code, out = run_ps(_PS_RESTORE_POINT, timeout=300)
            ok = "OK" in (out or "")
            cls._set(restore_point={"ok": ok, "message": (out or "").strip()[-300:]})
            if not ok:
                cls._set(phase="needs_confirmation", progress=None,
                         message=("Não foi possível criar o ponto de restauração "
                                  "(a Proteção do Sistema pode estar desativada no disco C:)."))
                return
        groups = {}
        for i in ids:
            groups.setdefault(i.split(":", 1)[0], []).append(i)
        try:
            if groups.get("wu"):
                cls._install_windows_update(groups["wu"])
            for i in groups.get("app", []):
                if cls._cancel.is_set():
                    break
                cls._install_winget(i)
            for i in groups.get("gpu", []):
                if cls._cancel.is_set():
                    break
                cls._install_download(i)
        except Exception as ex:  # noqa: BLE001
            LogManager.add_log(f"[ERRO] Instalação de atualizações interrompida: {ex}")
            cls._set(message=f"Erro inesperado: {ex}")
        with cls._lock:
            results = cls._state["results"]
            failed = sum(1 for r in results.values() if not r["ok"])
            cancelled = cls._cancel.is_set()
            cls._state.update(phase="done", progress=None, message=(
                ("Instalação cancelada. " if cancelled else "")
                + f"{len(results) - failed} instalada(s), {failed} com falha."))

    @classmethod
    def _install_windows_update(cls, ids):
        cancel_file = os.path.join(_updates_dir(), "cancel.flag")
        if os.path.exists(cancel_file):
            os.remove(cancel_file)
        update_ids = [i.split(":", 1)[1] for i in ids]
        script = (_PS_WU_INSTALL
                  .replace("%IDS%", _ps_quote(json.dumps(update_ids)))
                  .replace("%CANCEL%", _ps_quote(cancel_file)))
        titles = {i: cls._items[i]["title"] for i in ids if i in cls._items}
        cls._progress(current="Windows Update", step="Consultando os servidores da Microsoft")
        proc = subprocess.Popen(ps_command(script), stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                                stderr=subprocess.STDOUT, **hidden_kwargs())

        def _watch_cancel():
            while proc.poll() is None:
                if cls._cancel.wait(1.0):
                    open(cancel_file, "w").close()
                    return
        threading.Thread(target=_watch_cancel, daemon=True).start()

        for raw in proc.stdout:
            line = decode_output(raw).strip()
            if not line.startswith("@@"):
                continue
            try:
                ev = json.loads(line[2:])
            except ValueError:
                continue
            item_id = f"wu:{ev.get('id')}"
            phase = ev.get("phase")
            if phase == "fatal":
                for i in ids:
                    cls._result(i, False, _wu_error_text(ev.get("hresult"), ev.get("error")))
                break
            if phase in ("download", "install"):
                cls._progress(current=titles.get(item_id, ""), step="Baixando" if phase == "download" else "Instalando")
            elif phase == "done":
                if ev.get("skipped"):
                    cls._result(item_id, True, "Já estava instalada.")
                elif ev.get("ok"):
                    cls._result(item_id, True, "Instalada" + (" (requer reinício)" if ev.get("reboot") else "."),
                                reboot=bool(ev.get("reboot")))
                else:
                    step = "no download" if ev.get("step") == "download" else "na instalação"
                    cls._result(item_id, False, f"Falhou {step}: {_wu_error_text(ev.get('hresult'), ev.get('error'))}")
        proc.wait()
        if os.path.exists(cancel_file):
            os.remove(cancel_file)

    @classmethod
    def _install_winget(cls, item_id):
        item = cls._items.get(item_id, {})
        pkg = cls._private.get(item_id, {}).get("winget_id")
        cls._progress(current=item.get("title", pkg), step="Baixando e instalando pelo winget")
        code, out = run_hidden(["winget", "upgrade", "--id", pkg, "--exact", "--silent", "--include-unknown",
                                "--accept-package-agreements", "--accept-source-agreements",
                                "--disable-interactivity"], timeout=1800)
        if code == 0:
            cls._result(item_id, True, "Atualizado.")
        elif code & 0xFFFFFFFF == WINGET_NO_UPGRADE:
            cls._result(item_id, True, "Já estava na versão mais recente.")
        elif code == -2:
            cls._result(item_id, False, "O instalador demorou mais de 30 minutos e foi abandonado.")
        else:
            tail = (out or "").strip().splitlines()[-1:] or [""]
            cls._result(item_id, False, f"winget retornou 0x{code & 0xFFFFFFFF:08X}. {tail[0][:160]}")

    @classmethod
    def _install_download(cls, item_id):
        item = cls._items.get(item_id, {})
        priv = cls._private.get(item_id) or {}
        cls._progress(current=item.get("title", item_id), step="Baixando do servidor oficial", percent=0)
        try:
            path = cls._download(priv["url"], priv["domain"], priv["filename"])
        except Exception as ex:  # noqa: BLE001
            cls._result(item_id, False, f"Falha no download: {ex}")
            return
        cls._progress(step="Conferindo a assinatura digital", percent=None)
        sig = run_ps_json(f"$s = Get-AuthenticodeSignature -LiteralPath {_ps_quote(path)}; "
                          "[PSCustomObject]@{ status = [string]$s.Status; subject = [string]$s.SignerCertificate.Subject } "
                          "| ConvertTo-Json -Compress", timeout=60) or {}
        if sig.get("status") != "Valid" or priv["signer"].lower() not in (sig.get("subject") or "").lower():
            try:
                os.remove(path)
            except OSError:
                pass
            cls._result(item_id, False, f"Arquivo descartado: assinatura digital inválida ou de outro fornecedor "
                                        f"({sig.get('status') or 'desconhecida'}).")
            return
        if item.get("action") == "assistant":
            # Assistente oficial: abre normalmente para o usuário seguir as telas dele
            os.startfile(path)
            cls._result(item_id, True, "Assistente oficial aberto. Siga as instruções na janela dele.")
            return
        cls._progress(step="Instalando (a tela pode piscar)")
        code, _ = run_hidden([path] + priv["args"], timeout=1800)
        if code == 0:
            cls._result(item_id, True, "Driver instalado. Reinicie para concluir.", reboot=True)
        elif code == -2:
            cls._result(item_id, False, f"O instalador passou de 30 minutos e foi abandonado. O arquivo ficou em {path}.")
        else:
            cls._result(item_id, False, f"O instalador retornou o código {code}. O arquivo ficou em {path}.")

    @classmethod
    def _download(cls, url, domain, filename):
        def _allowed(u):
            host = (urlparse(u).hostname or "").lower()
            return urlparse(u).scheme == "https" and (host == domain or host.endswith("." + domain))
        if not _allowed(url):
            raise RuntimeError(f"endereço fora do domínio oficial {domain}")
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, context=_ssl_ctx, timeout=30) as r:
            if not _allowed(r.geturl()):
                raise RuntimeError(f"redirecionado para fora de {domain}")
            total = int(r.headers.get("Content-Length") or 0)
            safe_name = re.sub(r"[^\w.\-]", "_", filename)
            path = os.path.join(_updates_dir(), safe_name)
            done = 0
            with open(path, "wb") as f:
                while True:
                    if cls._cancel.is_set():
                        raise RuntimeError("cancelado")
                    chunk = r.read(1024 * 256)
                    if not chunk:
                        break
                    f.write(chunk)
                    done += len(chunk)
                    if total:
                        cls._progress(percent=round(done * 100 / total, 1))
        return path

    # -------------------------------------------------------------------------
    # AÇÕES AUXILIARES
    # -------------------------------------------------------------------------
    @classmethod
    def open_page(cls, item_id):
        page = (cls._private.get(item_id) or {}).get("page")
        if not page:
            return False, "Item sem página oficial."
        webbrowser.open(page)
        return True, "Página oficial aberta no navegador."

    @staticmethod
    def reboot():
        code, out = run_hidden(["shutdown", "/r", "/t", "30", "/c",
                                "WinShield Pro: reiniciando para concluir as atualizações."], timeout=15)
        if code != 0:
            return False, out or "Não foi possível agendar o reinício."
        return True, "O PC vai reiniciar em 30 segundos. Salve seus arquivos."
