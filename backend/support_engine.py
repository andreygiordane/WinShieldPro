"""
Ferramentas de Suporte de TI - WinShield Pro.

Pensado para pré-formatação e migração de máquinas, 100% com recursos nativos do Windows
(registro, WMI/CIM, cmdkey, ospp.vbs). Nada aqui lê ou exporta senhas.

Licenças (estilo "recuperar chaves"):
  * Chave OEM gravada na BIOS/UEFI (SoftwareLicensingService.OA3xOriginalProductKey)
  * Chave do Windows decodificada do DigitalProductId + BackupProductKeyDefault
  * Status de ativação do Windows e do Office (SoftwareLicensingProduct e ospp.vbs)
  * Programas instalados (registro de desinstalação)

E-mail:
  * Contas do Outlook (perfis no HKCU), servidores, portas e criptografia
  * Arquivos de dados PST/OST, assinaturas e cache de autocompletar
  * Perfis e contas do Thunderbird (prefs.js)
  * Entradas do Gerenciador de Credenciais (só o destino e o usuário, via cmdkey)

Backup: relatórios TXT/HTML e cópia dos arquivos para um disco que não seja o do sistema.
"""

import glob
import html
import os
import re
import shutil
import socket
import threading
import time
from datetime import datetime

import psutil

from backend.core import IS_WINDOWS
from backend.log_manager import LogManager
from backend.process import run_hidden, run_ps_json

if IS_WINDOWS:
    import winreg

KEY_CHARS = "BCDFGHJKMPQRTVWXY2346789"

# Chaves genéricas públicas da Microsoft: aparecem quando o PC usa licença digital
# (vinculada ao hardware/conta Microsoft) ou ativação por volume (KMS).
GENERIC_KEYS = {
    "VK7JG-NPHTM-C97JM-9MPGT-3V66T": "genérica do Windows Pro",
    "YTMG3-N6DKC-DKB77-7M9GH-8HVX7": "genérica do Windows Home",
    "BT79Q-G7N6G-PGBYW-4YWX6-6F4BT": "genérica do Windows Home Single Language",
    "W269N-WFGWX-YVC9B-4J6C9-T83GX": "cliente KMS do Windows Pro",
    "NPPR9-FWDCX-D2C8J-H872K-2YT43": "cliente KMS do Windows Enterprise",
    "TX9XD-98N7V-6WMQ6-BX7FG-H8Q99": "cliente KMS do Windows Home",
    "YNMGQ-8RYV3-4PGQ3-C8XTP-7CFBY": "genérica do Windows Education",
}

LICENSE_STATUS = {
    0: "Não licenciado", 1: "Ativado", 2: "Período de carência inicial", 3: "Carência (hardware alterado)",
    4: "Carência (não genuíno)", 5: "Notificação (não ativado)", 6: "Carência estendida",
}

WINDOWS_APP_ID = "55c92734-d682-4d71-983e-d6ec3f16059f"
OFFICE_APP_IDS = ("0ff1ce15-a989-479d-af46-f275c6370663", "59a52881-a989-479d-af46-f275c6370663")

# Outlook: chave que guarda as contas dentro de cada perfil
OUTLOOK_ACCOUNTS_KEY = "9375CFF0413111d3B88A00104B2A6676"
SIGNATURES_DIR = r"%APPDATA%\Microsoft\Signatures"
ROAMCACHE_DIR = r"%LOCALAPPDATA%\Microsoft\Outlook\RoamCache"
OUTLOOK_SECURITY = {0: "Nenhuma", 1: "SSL/TLS", 2: "STARTTLS", 3: "Automática"}
THUNDERBIRD_SOCKET = {0: "Nenhuma", 1: "STARTTLS (se disponível)", 2: "STARTTLS", 3: "SSL/TLS"}
DEFAULT_PORTS = {("imap", False): 143, ("imap", True): 993, ("pop3", False): 110, ("pop3", True): 995}


# =============================================================================
# UTILITÁRIOS
# =============================================================================
def decode_product_key(digital_product_id):
    """
    Decodifica a chave de 25 caracteres do DigitalProductId (formato Windows 8 ou mais novo).
    A chave fica codificada em base 24 nos bytes 52..66; o bit 3 do último byte indica o
    formato novo, em que a letra "N" é inserida na posição guardada no primeiro dígito.
    """
    data = bytearray(digital_product_id[52:67])
    if len(data) != 15:
        return ""
    new_format = (data[14] >> 3) & 1
    data[14] &= 0xF7
    digits = []
    for _ in range(25):
        cur = 0
        for j in range(14, -1, -1):
            cur = cur * 256 + data[j]
            data[j], cur = divmod(cur, 24)
        digits.append(cur)
    digits.reverse()
    key = "".join(KEY_CHARS[d] for d in digits)
    if new_format:
        pos = digits[0]
        key = key[1:pos + 1] + "N" + key[pos + 1:]
    return "-".join(key[i:i + 5] for i in range(0, 25, 5))


def _reg_values(root, path, view=0):
    """Lê todos os valores de uma chave do registro: {nome: valor}. {} se não existir."""
    try:
        with winreg.OpenKey(root, path, 0, winreg.KEY_READ | view) as k:
            out, i = {}, 0
            while True:
                try:
                    name, value, _ = winreg.EnumValue(k, i)
                except OSError:
                    return out
                out[name] = value
                i += 1
    except OSError:
        return {}


def _reg_subkeys(root, path, view=0):
    try:
        with winreg.OpenKey(root, path, 0, winreg.KEY_READ | view) as k:
            out, i = [], 0
            while True:
                try:
                    out.append(winreg.EnumKey(k, i))
                except OSError:
                    return out
                i += 1
    except OSError:
        return []


def _text(value):
    """Valores do Outlook vêm como REG_BINARY em UTF-16; converte para texto legível."""
    if isinstance(value, bytes):
        if len(value) >= 2 and len(value) % 2 == 0:
            try:
                return value.decode("utf-16-le").rstrip("\x00").strip()
            except UnicodeDecodeError:
                pass
        return ""
    if value is None:
        return ""
    return str(value).strip()


def _int(value):
    if isinstance(value, int):
        return value
    if isinstance(value, bytes) and len(value) == 4:
        return int.from_bytes(value, "little")
    try:
        return int(str(value).strip())
    except (TypeError, ValueError):
        return None


def _fmt_size(num):
    num = float(num or 0)
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if num < 1024 or unit == "TB":
            return f"{num:.0f} {unit}" if unit == "B" else f"{num:.1f} {unit}"
        num /= 1024


def _file_info(path, kind):
    try:
        st = os.stat(path)
        return {"path": path, "kind": kind, "size": st.st_size, "size_text": _fmt_size(st.st_size),
                "modified": datetime.fromtimestamp(st.st_mtime).strftime("%d/%m/%Y %H:%M")}
    except OSError:
        return None


def _folder_size(path):
    total = 0
    for root, _, files in os.walk(path):
        for f in files:
            try:
                total += os.path.getsize(os.path.join(root, f))
            except OSError:
                pass
    return total


def suggest_backup_folder():
    """
    Sugere onde salvar o backup: o disco com mais espaço livre que NÃO seja o do Windows
    (pendrive, HD externo, D:). Se só houver o disco do sistema, avisa que formatar apaga.
    """
    system_drive = (os.environ.get("SystemDrive") or "C:").upper().rstrip("\\") + "\\"
    folder = f"{socket.gethostname()}_{datetime.now():%Y-%m-%d}"
    best = None
    for part in psutil.disk_partitions(all=False):
        mount = part.mountpoint.upper()
        if mount == system_drive or "cdrom" in part.opts or not part.fstype:
            continue
        try:
            free = psutil.disk_usage(part.mountpoint).free
        except OSError:
            continue
        if not best or free > best[1]:
            best = (part.mountpoint, free, "removable" in part.opts)
    if best:
        return {"path": os.path.join(best[0], "SuporteTI_Backups", folder), "on_system_drive": False,
                "free_text": _fmt_size(best[1]), "removable": best[2],
                "note": f"Disco {best[0].rstrip(chr(92))} ({_fmt_size(best[1])} livres)."}
    return {"path": os.path.join(system_drive, "SuporteTI_Backups", folder), "on_system_drive": True,
            "free_text": "", "removable": False,
            "note": ("Só foi encontrado o disco do Windows. Copie esta pasta para um pendrive ou HD "
                     "externo ANTES de formatar, ou ela será apagada.")}


def _validate_folder(folder):
    folder = (folder or "").strip().strip('"')
    if not folder or not os.path.isabs(folder):
        raise ValueError("Informe uma pasta completa, ex.: D:\\SuporteTI_Backups\\PC01")
    os.makedirs(folder, exist_ok=True)
    return folder


# =============================================================================
# MÓDULO 1 - LICENÇAS
# =============================================================================
_PS_LICENSES = r"""
$svc = Get-CimInstance SoftwareLicensingService
$prods = @(Get-CimInstance SoftwareLicensingProduct -Filter "PartialProductKey IS NOT NULL" |
    Select-Object Name, Description, ApplicationID, LicenseStatus, PartialProductKey, ProductKeyChannel)
[PSCustomObject]@{
    oem_key = $svc.OA3xOriginalProductKey
    oem_description = $svc.OA3xOriginalProductKeyDescription
    products = $prods
} | ConvertTo-Json -Depth 3 -Compress
"""


def _windows_registry_keys():
    nt = r"SOFTWARE\Microsoft\Windows NT\CurrentVersion"
    view = winreg.KEY_WOW64_64KEY
    cur = _reg_values(winreg.HKEY_LOCAL_MACHINE, nt, view)
    spp = _reg_values(winreg.HKEY_LOCAL_MACHINE, nt + r"\SoftwareProtectionPlatform", view)
    info = {
        "edition": cur.get("ProductName", ""),
        "edition_id": cur.get("EditionID", ""),
        "display_version": cur.get("DisplayVersion", ""),
        "build": f"{cur.get('CurrentBuild', '')}.{cur.get('UBR', '')}".strip("."),
        "product_id": cur.get("ProductId", ""),
        "registered_owner": cur.get("RegisteredOwner", ""),
        "installed_key": "",
        "backup_key": _text(spp.get("BackupProductKeyDefault")),
    }
    # O Windows 11 mostra "Windows 10" em ProductName; o build diz a verdade
    if info["edition"].startswith("Windows 10") and str(cur.get("CurrentBuild", "0")).isdigit() \
            and int(cur["CurrentBuild"]) >= 22000:
        info["edition"] = info["edition"].replace("Windows 10", "Windows 11")
    dpid = cur.get("DigitalProductId")
    if isinstance(dpid, bytes):
        info["installed_key"] = decode_product_key(dpid)
    return info


def _key_note(key):
    if not key:
        return ""
    if key in GENERIC_KEYS:
        return (f"Chave {GENERIC_KEYS[key]}: este PC usa licença digital ou ativação por volume. "
                "Após formatar com a mesma edição, o Windows reativa sozinho pela internet.")
    return "Chave de produto específica. Guarde-a para reativar após formatar."


def _office_ospp():
    """Office MSI/volume: ospp.vbs informa status e os 5 últimos caracteres da chave."""
    results = []
    scripts = []
    for base in (os.environ.get("ProgramFiles", r"C:\Program Files"), os.environ.get("ProgramFiles(x86)", "")):
        if base:
            scripts += glob.glob(os.path.join(base, "Microsoft Office", "Office1*", "OSPP.VBS"))
    for script in scripts:
        code, out = run_hidden(["cscript.exe", "//Nologo", script, "/dstatus"], timeout=60)
        current = {}
        for line in (out or "").splitlines():
            if ":" not in line:
                continue
            k, v = (p.strip() for p in line.split(":", 1))
            ku = k.upper()
            if ku == "LICENSE NAME":
                if current:
                    results.append(current)
                current = {"name": v, "source": "ospp.vbs"}
            elif ku == "LICENSE STATUS":
                current["status"] = v.strip("- ")
            elif ku.startswith("LAST 5 CHARACTERS"):
                current["partial_key"] = v
        if current:
            results.append(current)
    return results


def installed_programs():
    programs, seen = [], set()
    roots = [
        (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall", winreg.KEY_WOW64_64KEY),
        (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall", winreg.KEY_WOW64_32KEY),
        (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall", 0),
    ]
    for root, path, view in roots:
        for sub in _reg_subkeys(root, path, view):
            v = _reg_values(root, f"{path}\\{sub}", view)
            name = _text(v.get("DisplayName"))
            if not name or v.get("SystemComponent") == 1 or v.get("ParentKeyName"):
                continue
            key = (name.lower(), _text(v.get("DisplayVersion")))
            if key in seen:
                continue
            seen.add(key)
            date = _text(v.get("InstallDate"))
            if re.fullmatch(r"\d{8}", date):
                date = f"{date[6:]}/{date[4:6]}/{date[:4]}"
            programs.append({"name": name, "version": _text(v.get("DisplayVersion")),
                             "publisher": _text(v.get("Publisher")), "install_date": date})
    programs.sort(key=lambda p: p["name"].lower())
    return programs


def scan_licenses():
    if not IS_WINDOWS:
        return {"status": "error", "message": "Disponível apenas no Windows."}
    LogManager.add_log("[SUPORTE] Lendo licenças do Windows, Office e programas instalados...")
    win = _windows_registry_keys()
    data = run_ps_json(_PS_LICENSES, timeout=90) or {}
    products = data.get("products") or []
    if isinstance(products, dict):
        products = [products]

    activation = []
    office = []
    for p in products:
        entry = {
            "name": p.get("Name") or "",
            "description": p.get("Description") or "",
            "channel": p.get("ProductKeyChannel") or "",
            "status": LICENSE_STATUS.get(p.get("LicenseStatus"), str(p.get("LicenseStatus"))),
            "activated": p.get("LicenseStatus") == 1,
            "partial_key": p.get("PartialProductKey") or "",
            "source": "Plataforma de Proteção de Software",
        }
        app_id = str(p.get("ApplicationID") or "").lower()
        if app_id == WINDOWS_APP_ID:
            activation.append(entry)
        elif app_id in OFFICE_APP_IDS:
            office.append(entry)
    # ospp.vbs só acrescenta o que a plataforma do Windows ainda não listou
    known = {o["partial_key"] for o in office}
    office += [o for o in _office_ospp() if o.get("partial_key") not in known]

    programs = installed_programs()
    office_installs = [p for p in programs if re.search(r"microsoft (office|365)|^microsoft (word|excel|outlook|project|visio)", p["name"], re.I)]

    oem_key = (data.get("oem_key") or "").strip()
    result = {
        "status": "success",
        "computer": socket.gethostname(),
        "scanned_at": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "windows": dict(win, installed_key_note=_key_note(win["installed_key"]),
                        backup_key_note=_key_note(win["backup_key"]) if win["backup_key"] != win["installed_key"] else ""),
        "oem": {"key": oem_key, "description": data.get("oem_description") or "",
                "note": ("Chave gravada pelo fabricante na placa-mãe. O Windows a usa sozinho ao ser reinstalado "
                         "nesta máquina com a mesma edição.") if oem_key else
                        "Nenhuma chave OEM na BIOS/UEFI (comum em PCs montados ou com licença de varejo)."},
        "activation": activation,
        "office": office,
        "office_installs": office_installs,
        "programs": programs,
    }
    LogManager.add_log(f"[SUPORTE] Licenças lidas: {len(activation)} Windows, {len(office)} Office, {len(programs)} programas.")
    return result


# =============================================================================
# MÓDULO 2 - E-MAIL
# =============================================================================
def _outlook_profiles():
    """Contas e arquivos de dados dos perfis do Outlook do usuário atual (2013+ e legados)."""
    roots = [rf"Software\Microsoft\Office\{v}\Outlook\Profiles" for v in ("16.0", "15.0")]
    roots.append(r"Software\Microsoft\Windows NT\CurrentVersion\Windows Messaging Subsystem\Profiles")
    profiles = []
    for base in roots:
        for profile in _reg_subkeys(winreg.HKEY_CURRENT_USER, base):
            ppath = f"{base}\\{profile}"
            accounts = []
            for sub in _reg_subkeys(winreg.HKEY_CURRENT_USER, f"{ppath}\\{OUTLOOK_ACCOUNTS_KEY}"):
                v = _reg_values(winreg.HKEY_CURRENT_USER, f"{ppath}\\{OUTLOOK_ACCOUNTS_KEY}\\{sub}")
                acc = _outlook_account(v)
                if acc:
                    accounts.append(acc)
            data_files = []
            for sub in _reg_subkeys(winreg.HKEY_CURRENT_USER, ppath):
                v = _reg_values(winreg.HKEY_CURRENT_USER, f"{ppath}\\{sub}")
                for value_name, kind in (("001f6700", "PST"), ("001f6610", "OST")):
                    path = _text(v.get(value_name))
                    if path and path not in [d["path"] for d in data_files]:
                        info = _file_info(os.path.expandvars(path), kind) or {"path": path, "kind": kind,
                                                                               "size": 0, "size_text": "arquivo não encontrado",
                                                                               "modified": ""}
                        data_files.append(info)
            if accounts or data_files:
                version = base.split("\\")[3] if "Office" in base else "legado"
                profiles.append({"name": profile, "outlook_version": version,
                                 "accounts": accounts, "data_files": data_files})
    return profiles


def _outlook_account(v):
    name = _text(v.get("Account Name"))
    email = _text(v.get("Email"))
    if not name and not email:
        return None

    def server(prefix):
        host = _text(v.get(f"{prefix} Server"))
        if not host:
            return None
        ssl_flag = _int(v.get(f"{prefix} Use SSL"))
        secure = _int(v.get(f"{prefix} Secure Connection"))
        security = OUTLOOK_SECURITY.get(secure) if secure is not None else ("SSL/TLS" if ssl_flag else "Nenhuma")
        port = _int(v.get(f"{prefix} Port"))
        if port is None:
            port = {"IMAP": 993 if ssl_flag else 143, "POP3": 995 if ssl_flag else 110,
                    "SMTP": 587}.get(prefix)
        return {"host": host, "port": port, "security": security,
                "user": _text(v.get(f"{prefix} User")) or email}

    incoming = server("IMAP") or server("POP3")
    kind = "IMAP" if _text(v.get("IMAP Server")) else ("POP3" if _text(v.get("POP3 Server")) else "")
    if not kind:
        if "@" not in (email or name):
            return None  # catálogo de endereços e outros serviços internos
        kind = "Exchange / Microsoft 365"
    return {"name": name or email, "email": email, "display_name": _text(v.get("Display Name")),
            "type": kind, "incoming": incoming, "outgoing": server("SMTP"),
            "note": ("Servidor configurado automaticamente (Autodiscover): após formatar, basta entrar com o "
                     "e-mail e a senha.") if kind.startswith("Exchange") else ""}


def _outlook_loose_files():
    """PST/OST nas pastas padrão, mesmo que não estejam ligados a um perfil."""
    patterns = [
        os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Outlook\*.ost"),
        os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Outlook\*.pst"),
        os.path.expandvars(r"%USERPROFILE%\Documents\Outlook Files\*.pst"),
        os.path.expandvars(r"%USERPROFILE%\Documents\Arquivos do Outlook\*.pst"),
        os.path.expandvars(r"%USERPROFILE%\OneDrive\Documents\Outlook Files\*.pst"),
        os.path.expandvars(r"%USERPROFILE%\OneDrive\Documentos\Arquivos do Outlook\*.pst"),
    ]
    files = []
    for pattern in patterns:
        for path in glob.glob(pattern):
            info = _file_info(path, path.rsplit(".", 1)[-1].upper())
            if info:
                files.append(info)
    return files


def _thunderbird():
    base = os.path.expandvars(r"%APPDATA%\Thunderbird")
    profiles = []
    for prefs in glob.glob(os.path.join(base, "Profiles", "*", "prefs.js")):
        folder = os.path.dirname(prefs)
        try:
            with open(prefs, encoding="utf-8", errors="replace") as f:
                text = f.read()
        except OSError:
            continue
        pref = {}
        for m in re.finditer(r'user_pref\("([^"]+)",\s*(.+?)\);', text):
            raw = m.group(2).strip()
            pref[m.group(1)] = raw[1:-1].replace('\\"', '"') if raw.startswith('"') else raw

        def smtp(sid):
            if not sid:
                sid = (pref.get("mail.smtpservers") or "").split(",")[0]
            if not sid:
                return None
            p = f"mail.smtpserver.{sid}."
            host = pref.get(p + "hostname")
            if not host:
                return None
            return {"host": host, "port": _int(pref.get(p + "port")) or 587,
                    "security": THUNDERBIRD_SOCKET.get(_int(pref.get(p + "try_ssl")) or 0, "?"),
                    "user": pref.get(p + "username", "")}

        accounts = []
        for acc in filter(None, (pref.get("mail.accountmanager.accounts") or "").split(",")):
            sid = pref.get(f"mail.account.{acc}.server")
            s = f"mail.server.{sid}."
            kind = pref.get(s + "type", "")
            if kind in ("none", "rss", "nntp", ""):
                continue  # Pastas locais, feeds e newsgroups
            ident = (pref.get(f"mail.account.{acc}.identities") or "").split(",")[0]
            i = f"mail.identity.{ident}."
            socket_type = _int(pref.get(s + "socketType")) or 0
            port = _int(pref.get(s + "port")) or DEFAULT_PORTS.get((kind, socket_type == 3))
            accounts.append({
                "name": pref.get(s + "name") or pref.get(i + "useremail", ""),
                "email": pref.get(i + "useremail", ""),
                "display_name": pref.get(i + "fullName", ""),
                "type": kind.upper(),
                "incoming": {"host": pref.get(s + "hostname", ""), "port": port,
                             "security": THUNDERBIRD_SOCKET.get(socket_type, "?"), "user": pref.get(s + "userName", "")},
                "outgoing": smtp(pref.get(i + "smtpServer")),
                "note": "",
            })
        size = _folder_size(folder)
        profiles.append({"name": os.path.basename(folder), "path": folder, "size": size,
                         "size_text": _fmt_size(size), "accounts": accounts})
    return profiles


def credential_entries():
    """Destinos salvos no Gerenciador de Credenciais (cmdkey nunca mostra senhas)."""
    code, out = run_hidden(["cmdkey", "/list"], timeout=30)
    entries, cur = [], {}
    for line in (out or "").splitlines():
        if ":" not in line:
            continue
        k, v = (p.strip() for p in line.split(":", 1))
        kl = k.lower()
        if kl in ("destino", "target", "objetivo"):
            if cur:
                entries.append(cur)
            cur = {"target": v, "type": "", "user": ""}
        elif kl in ("tipo", "type") and cur:
            cur["type"] = v
        elif kl in ("usuário", "usuario", "user", "utilisateur") and cur:
            cur["user"] = v
    if cur:
        entries.append(cur)
    for e in entries:
        t = e["target"].lower()
        name = t.split("target=", 1)[-1]
        if any(w in t for w in ("office", "outlook", "mail", "imap", "smtp", "exchange", "microsoftaccount")):
            e["category"] = "E-mail / Office"
        elif "termsrv/" in name:
            e["category"] = "Área de trabalho remota"
        elif t.startswith("domain:") or e["type"].lower().startswith(("dom", "domain")) or name.startswith("\\\\"):
            # Senhas de domínio: compartilhamentos de rede, impressoras e servidores
            e["category"] = "Rede / compartilhamentos"
        else:
            e["category"] = "Outros aplicativos"
    return entries


def scan_email():
    if not IS_WINDOWS:
        return {"status": "error", "message": "Disponível apenas no Windows."}
    LogManager.add_log("[SUPORTE] Mapeando contas de e-mail, PST/OST, Thunderbird e credenciais...")
    profiles = _outlook_profiles()
    linked = {d["path"].lower() for p in profiles for d in p["data_files"]}
    loose = [f for f in _outlook_loose_files() if f["path"].lower() not in linked]
    signatures = os.path.expandvars(SIGNATURES_DIR)
    roamcache = os.path.expandvars(ROAMCACHE_DIR)

    def folder_info(path, label, why):
        exists = os.path.isdir(path)
        size = _folder_size(path) if exists else 0
        return {"path": path, "label": label, "exists": exists, "size": size, "size_text": _fmt_size(size), "why": why}

    result = {
        "status": "success",
        "computer": socket.gethostname(),
        "user": os.environ.get("USERNAME", ""),
        "scanned_at": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "outlook_profiles": profiles,
        "outlook_loose_files": loose,
        "outlook_running": _is_running("outlook.exe"),
        "folders": [
            folder_info(signatures, "Assinaturas do Outlook", "Assinaturas de e-mail (texto e imagens)."),
            folder_info(roamcache, "Autocompletar do Outlook (RoamCache)",
                        "Sugestões de destinatários ao digitar. Contas Exchange/M365 recuperam isso da nuvem."),
        ],
        "thunderbird": _thunderbird(),
        "thunderbird_running": _is_running("thunderbird.exe"),
        "credentials": credential_entries(),
    }
    LogManager.add_log(f"[SUPORTE] {sum(len(p['accounts']) for p in profiles)} conta(s) Outlook, "
                       f"{len(result['thunderbird'])} perfil(is) Thunderbird, {len(result['credentials'])} credencial(is).")
    return result


def _is_running(exe):
    exe = exe.lower()
    for p in psutil.process_iter(["name"]):
        try:
            if (p.info["name"] or "").lower() == exe:
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    return False


# =============================================================================
# RELATÓRIOS (TXT + HTML)
# =============================================================================
def _license_sections(d):
    w = d["windows"]
    sections = [
        ("Windows instalado", [
            ("Edição", w["edition"]), ("Versão", f"{w['display_version']} (build {w['build']})"),
            ("ID do produto", w["product_id"]), ("Proprietário registrado", w["registered_owner"]),
            ("Chave instalada (registro)", w["installed_key"]), ("Observação", w["installed_key_note"]),
            ("Chave de backup (SPP)", w["backup_key"]), ("Observação ", w.get("backup_key_note", "")),
        ]),
        ("Chave OEM da BIOS/UEFI", [("Chave", d["oem"]["key"] or "—"), ("Descrição", d["oem"]["description"]),
                                   ("Observação", d["oem"]["note"])]),
    ]
    for title, items in (("Ativação do Windows", d["activation"]), ("Licenças do Office", d["office"])):
        rows = []
        for it in items:
            rows += [("Produto", it.get("name", "")), ("Status", it.get("status", "")),
                     ("Canal", it.get("channel", "")), ("5 últimos caracteres da chave", it.get("partial_key", "")),
                     ("Fonte", it.get("source", "")), ("", "")]
        sections.append((title, rows or [("—", "Nenhuma licença encontrada.")]))
    sections.append(("Office instalado", [(p["name"], p["version"]) for p in d["office_installs"]] or [("—", "Nenhum.")]))
    sections.append((f"Programas instalados ({len(d['programs'])})",
                     [(p["name"], " · ".join(x for x in (p["version"], p["publisher"], p["install_date"]) if x))
                      for p in d["programs"]]))
    return sections


def _email_sections(d):
    sections = []

    def server_txt(s):
        if not s:
            return "—"
        return f"{s['host']}:{s['port']} · {s['security']} · usuário: {s['user'] or '—'}"

    def account_rows(a):
        return [("Conta", a["name"]), ("E-mail", a["email"]), ("Nome exibido", a["display_name"]),
                ("Tipo", a["type"]), ("Entrada", server_txt(a["incoming"])), ("Saída (SMTP)", server_txt(a["outgoing"])),
                ("Observação", a["note"]), ("", "")]

    for p in d["outlook_profiles"]:
        rows = []
        for a in p["accounts"]:
            rows += account_rows(a)
        for f in p["data_files"]:
            rows.append((f"Arquivo {f['kind']}", f"{f['path']} ({f['size_text']})"))
        sections.append((f"Outlook — perfil \"{p['name']}\" (Office {p['outlook_version']})", rows))
    if d["outlook_loose_files"]:
        sections.append(("Outros arquivos PST/OST encontrados",
                         [(f["kind"], f"{f['path']} ({f['size_text']})") for f in d["outlook_loose_files"]]))
    sections.append(("Pastas do Outlook", [(f["label"], f"{f['path']} ({f['size_text'] if f['exists'] else 'não existe'})")
                                           for f in d["folders"]]))
    for t in d["thunderbird"]:
        rows = [("Pasta do perfil", f"{t['path']} ({t['size_text']})"), ("", "")]
        for a in t["accounts"]:
            rows += account_rows(a)
        sections.append((f"Thunderbird — perfil {t['name']}", rows))
    sections.append(("Gerenciador de Credenciais (reautenticar após formatar)",
                     [(c["target"], f"{c['category']} · {c['type']} · usuário: {c['user'] or '—'}") for c in d["credentials"]]
                     or [("—", "Nenhuma credencial salva.")]))
    return sections


def _write_reports(folder, basename, title, d, sections):
    folder = _validate_folder(folder)
    header = f"{title}\nComputador: {d.get('computer', '')}   Gerado em: {d.get('scanned_at', '')}   WinShield Pro\n"
    txt = [header, "=" * 78]
    for name, rows in sections:
        txt.append(f"\n[{name}]")
        for k, v in rows:
            if k or v:
                txt.append(f"  {k}: {v}" if k else f"  {v}")
    txt_path = os.path.join(folder, basename + ".txt")
    with open(txt_path, "w", encoding="utf-8-sig") as f:
        f.write("\n".join(txt) + "\n")

    e = html.escape
    body = []
    for name, rows in sections:
        trs = "".join(f"<tr><th>{e(str(k))}</th><td>{e(str(v))}</td></tr>" for k, v in rows if k or v)
        body.append(f"<h2>{e(name)}</h2><table>{trs}</table>")
    page = f"""<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>{e(title)}</title>
<style>body{{font-family:Segoe UI,Arial,sans-serif;margin:32px;color:#1f2328}}h1{{font-size:22px;margin:0}}
.meta{{color:#666;margin:4px 0 24px}}h2{{font-size:15px;margin:26px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}}
table{{border-collapse:collapse;width:100%;font-size:13px}}th{{text-align:left;width:32%;color:#555;font-weight:600;vertical-align:top}}
th,td{{padding:4px 8px;border-bottom:1px solid #f0f0f0;word-break:break-all}}</style></head><body>
<h1>{e(title)}</h1><div class="meta">Computador: {e(d.get('computer', ''))} · Gerado em {e(d.get('scanned_at', ''))} · WinShield Pro</div>
{''.join(body)}</body></html>"""
    html_path = os.path.join(folder, basename + ".html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(page)
    return [txt_path, html_path]


def export_licenses(folder):
    d = scan_licenses()
    return _write_reports(os.path.join(folder, "Licencas"), "relatorio_licencas",
                          "Relatório de licenças (pré-formatação)", d, _license_sections(d))


def export_email(folder):
    d = scan_email()
    return _write_reports(os.path.join(folder, "Email"), "relatorio_email",
                          "Relatório de contas de e-mail (pré-formatação)", d, _email_sections(d))


# =============================================================================
# BACKUP DOS ARQUIVOS DE E-MAIL (em segundo plano, com progresso)
# =============================================================================
class SupportBackupJob:
    _lock = threading.Lock()
    _state = {"running": False, "done_bytes": 0, "total_bytes": 0, "current": "", "message": "",
              "ok": None, "destination": "", "errors": []}

    @classmethod
    def status(cls):
        with cls._lock:
            return dict(cls._state, errors=list(cls._state["errors"]), status="success")

    @classmethod
    def start(cls, folder, include):
        include = set(include or [])
        if not include:
            return False, "Selecione o que copiar."
        with cls._lock:
            if cls._state["running"]:
                return False, "Já existe um backup em andamento."
        try:
            dest = _validate_folder(os.path.join(folder, "Email"))
        except (ValueError, OSError) as ex:
            return False, str(ex)
        if {"outlook_data", "signatures", "roamcache"} & include and _is_running("outlook.exe"):
            return False, "Feche o Outlook antes de copiar (os arquivos PST/OST ficam travados enquanto ele está aberto)."
        if "thunderbird" in include and _is_running("thunderbird.exe"):
            return False, "Feche o Thunderbird antes de copiar o perfil."

        d = scan_email()
        jobs = []  # (origem, destino)
        if "outlook_data" in include:
            files = [f for p in d["outlook_profiles"] for f in p["data_files"]] + d["outlook_loose_files"]
            for f in files:
                if os.path.isfile(f["path"]):
                    jobs.append((f["path"], os.path.join(dest, "Outlook_Dados", os.path.basename(f["path"]))))
        for key, src, sub in (("signatures", SIGNATURES_DIR, "Outlook_Assinaturas"),
                              ("roamcache", ROAMCACHE_DIR, "Outlook_RoamCache")):
            if key in include:
                jobs += cls._folder_jobs(os.path.expandvars(src), os.path.join(dest, sub))
        if "thunderbird" in include:
            for t in d["thunderbird"]:
                jobs += cls._folder_jobs(t["path"], os.path.join(dest, "Thunderbird", t["name"]))
            ini = os.path.expandvars(r"%APPDATA%\Thunderbird\profiles.ini")
            if os.path.isfile(ini):
                jobs.append((ini, os.path.join(dest, "Thunderbird", "profiles.ini")))
        if not jobs:
            return False, "Nada para copiar: nenhum arquivo encontrado nos itens selecionados."
        total = sum(os.path.getsize(s) for s, _ in jobs if os.path.isfile(s))
        with cls._lock:
            cls._state.update(running=True, done_bytes=0, total_bytes=total, current="", ok=None,
                              message="Copiando…", destination=dest, errors=[])
        threading.Thread(target=cls._worker, args=(jobs,), daemon=True, name="support-backup").start()
        return True, f"Copiando {len(jobs)} arquivo(s), {_fmt_size(total)}."

    @staticmethod
    def _folder_jobs(src, dst):
        jobs = []
        if not os.path.isdir(src):
            return jobs
        for root, _, files in os.walk(src):
            for name in files:
                s = os.path.join(root, name)
                jobs.append((s, os.path.join(dst, os.path.relpath(s, src))))
        return jobs

    @classmethod
    def _worker(cls, jobs):
        LogManager.add_log(f"[SUPORTE] Backup de e-mail iniciado: {len(jobs)} arquivo(s).")
        for src, dst in jobs:
            with cls._lock:
                cls._state["current"] = src
            try:
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                with open(src, "rb") as fi, open(dst, "wb") as fo:
                    while True:
                        chunk = fi.read(4 * 1024 * 1024)
                        if not chunk:
                            break
                        fo.write(chunk)
                        with cls._lock:
                            cls._state["done_bytes"] += len(chunk)
                shutil.copystat(src, dst)
            except OSError as ex:
                with cls._lock:
                    cls._state["errors"].append(f"{src}: {ex.strerror or ex}")
        with cls._lock:
            errs = len(cls._state["errors"])
            cls._state.update(running=False, current="", ok=errs == 0,
                              message=(f"Backup concluído em {cls._state['destination']}" if not errs
                                       else f"Backup concluído com {errs} arquivo(s) não copiado(s)."))
        LogManager.add_log(f"[SUPORTE] {cls._state['message']}")
