"""
Ficha do PC - WinShield Pro.

Reúne a configuração completa da máquina num formato pronto para responder
"qual é a configuração do seu PC?": um resumo de uma linha e uma ficha detalhada
(TXT/HTML). Usa apenas dados lidos pelos motores do app; o que o Windows não
informa fica de fora em vez de ser estimado.

Números de série, MAC e nome do computador só entram se o usuário pedir.
"""

import os
import socket
from datetime import datetime

from backend.core import IS_WINDOWS
from backend.disk_health_engine import DiskHealthEngine
from backend.hardware_monitor import CoreEngine, VisionEngine
from backend.log_manager import LogManager
from backend.process import run_ps_json
from backend.system_engine import SystemEngine

_PS_EXTRA = r"""
$dec = { param($a) if ($a) { (-join ($a | Where-Object { $_ -gt 0 } | ForEach-Object { [char]$_ })).Trim() } else { '' } }
[PSCustomObject]@{
    monitors = @(Get-CimInstance -Namespace root\wmi WmiMonitorID -ErrorAction SilentlyContinue | ForEach-Object {
        [PSCustomObject]@{ maker = (& $dec $_.ManufacturerName); model = (& $dec $_.UserFriendlyName); year = $_.YearOfManufacture }
    })
    network = @(Get-NetAdapter -Physical -ErrorAction SilentlyContinue | Where-Object Status -ne 'Not Present' | ForEach-Object {
        [PSCustomObject]@{ name = $_.InterfaceDescription; media = [string]$_.MediaType; speed = [string]$_.LinkSpeed; status = [string]$_.Status; mac = $_.MacAddress }
    })
    audio = @(Get-CimInstance Win32_SoundDevice -ErrorAction SilentlyContinue | ForEach-Object { $_.Name })
} | ConvertTo-Json -Depth 3 -Compress
"""


def _gb(num_bytes):
    """Capacidade como o fabricante anuncia (base 1000): 1.000.204.886.016 B = 1 TB."""
    gb = (num_bytes or 0) / 1e9
    if gb >= 1000:
        return f"{gb / 1000:.1f} TB".replace(".0 TB", " TB")
    return f"{gb:.0f} GB"


def _as_list(value):
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def build_sheet(include_private=False):
    if not IS_WINDOWS:
        return {"status": "error", "message": "Disponível apenas no Windows."}
    LogManager.add_log("[FICHA] Montando a ficha de configuração do PC...")
    st = SystemEngine.static_info()
    core = CoreEngine.get_info()
    cpu, caches, clocks = core.get("processor", {}), core.get("caches", {}), core.get("clocks", {})
    board, mem = core.get("motherboard", {}), core.get("memory", {})
    gpu = VisionEngine.get_info().get("gpu", {})
    disks = DiskHealthEngine.scan()
    disks = disks.get("disks", disks) if isinstance(disks, dict) else disks
    extra = run_ps_json(_PS_EXTRA, timeout=30) or {}

    sections = []

    # Sistema
    rows = [("Sistema operacional", st.get("os_caption") or st.get("os")),
            ("Versão", f"{st.get('os_version', '')} (build {st.get('os_build', '')})"),
            ("Instalado em", st.get("os_install_date")),
            ("TPM", " · ".join(dict.fromkeys(v for v in (st.get("tpm_version"), st.get("tpm_status")) if v)) or "Presente"
                    if st.get("tpm_present") else "Não encontrado"),
            ("Secure Boot", st.get("secure_boot"))]
    if include_private:
        rows.insert(0, ("Nome do computador", st.get("computer") or socket.gethostname()))
    sections.append(("Sistema", rows))

    # Processador
    sections.append(("Processador", [
        ("Modelo", cpu.get("name")),
        ("Codinome", cpu.get("codename")),
        ("Litografia", cpu.get("technology")),
        ("Núcleos / threads", f"{cpu.get('cores', '—')} / {cpu.get('threads', '—')}"),
        ("Clock base", f"{clocks.get('base_clock_mhz')} MHz" if clocks.get("base_clock_mhz") else None),
        ("Cache L2 / L3", f"{caches.get('l2', '—')} / {caches.get('l3', '—')}"),
        ("Soquete", cpu.get("package")),
        ("Virtualização", "Suportada" if cpu.get("virtualization") else "Não informada"),
    ]))

    # Placa-mãe
    rows = [("Fabricante", board.get("manufacturer")), ("Modelo", board.get("model")),
            ("Chipset", board.get("chipset")),
            ("BIOS", f"{board.get('bios_vendor', '')} {board.get('bios_version', '')} ({board.get('bios_date', '')})".strip())]
    if include_private and st.get("board_serial") not in (None, "", "—"):
        rows.append(("Número de série", st.get("board_serial")))
    sections.append(("Placa-mãe", rows))

    # Memória
    modules = mem.get("modules") or []
    rows = [("Total", f"{mem.get('size_gb', st.get('ram_total_gb', '—'))} GB {mem.get('type', '')}".strip()),
            ("Velocidade", f"{mem.get('speed_mhz')} MHz" if mem.get("speed_mhz") else None),
            ("Canais", mem.get("channels")),
            ("Slots usados", f"{mem.get('slots_used', '—')} de {mem.get('slots_total', '—')}")]
    for m in modules:
        rows.append((f"{m.get('locator', 'Pente')} ({m.get('bank', '')})".replace(" ()", ""),
                     f"{m.get('size_gb', '—')} GB · {m.get('manufacturer', '—')} {m.get('part_number', '')} · {m.get('speed_mhz', '—')} MHz".strip()))
    sections.append(("Memória RAM", rows))

    # Vídeo e monitores
    rows = [("Placa de vídeo", gpu.get("name")),
            ("Memória de vídeo", f"{gpu.get('memory_size_mb')} MB" if gpu.get("memory_size_mb") else None)]
    rows += [(r["label"], r["value"]) for r in gpu.get("display") or [] if r["label"] in ("Versão do driver", "Resolução")]
    for name in st.get("gpus") or []:
        if name != gpu.get("name"):
            rows.append(("Outro adaptador", name))
    for i, mon in enumerate(_as_list(extra.get("monitors")), 1):
        label = " ".join(p for p in (mon.get("maker"), mon.get("model")) if p) or "Monitor"
        rows.append((f"Monitor {i}", f"{label} (fabricado em {mon['year']})" if mon.get("year") else label))
    sections.append(("Vídeo", rows))

    # Armazenamento
    rows = []
    for d in disks or []:
        media = d.get("media") if d.get("media") and "identificado" not in d.get("media", "") else "tipo não informado"
        info = f"{_gb(d.get('size'))} · {media}"
        if d.get("health") is not None and d.get("health_source") != "limited":
            info += f" · saúde {d['health']}%"
        if d.get("power_on_hours"):
            info += f" · {d['power_on_hours']:,} h ligado".replace(",", ".")
        if include_private and d.get("serial"):
            info += f" · S/N {str(d['serial']).strip('.')}"
        rows.append((d.get("model") or f"Disco {d.get('index')}", info))
    sections.append(("Armazenamento", rows or [("—", "Nenhum disco encontrado")]))

    # Rede e áudio
    seen, rows = set(), []
    for n in _as_list(extra.get("network")):
        if n.get("name") in seen:
            continue
        seen.add(n.get("name"))
        kind = "Wi-Fi" if "802.11" in (n.get("media") or "") else "Cabeada"
        info = f"{kind} · {n['speed']}" if n.get("status") == "Up" and n.get("speed") else f"{kind} · desconectada"
        if include_private and n.get("mac"):
            info += f" · MAC {n['mac']}"
        rows.append((n.get("name"), info))
    sections.append(("Rede", rows or [("—", "Nenhuma placa física encontrada")]))
    audio = sorted({a for a in _as_list(extra.get("audio")) if a and "virtual" not in a.lower()})
    sections.append(("Áudio", [(f"Dispositivo {i}", a) for i, a in enumerate(audio, 1)] or [("—", "Nenhum")]))

    # Remove linhas sem valor real
    sections = [(t, [(k, str(v)) for k, v in rows if v not in (None, "", "—", "None")]) for t, rows in sections]

    # Resumo de uma linha
    def _disk_kind(d):
        media = d.get("media") or ""
        return "NVMe" if "NVMe" in media else (media if media in ("SSD", "HDD") else "Disco")
    total_disks = " + ".join(f"{_disk_kind(d)} {_gb(d.get('size'))}" for d in disks or [])
    channels = (mem.get("channels") or "").lower()
    ram = f"{round(mem.get('size_gb') or st.get('ram_total_gb') or 0)} GB {mem.get('type', '')}".strip()
    if mem.get("speed_mhz"):
        ram += f" {mem['speed_mhz']} MHz"
    if modules:
        ram += f" ({len(modules)}x{round(modules[0].get('size_gb') or 0)} GB{', ' + channels if channels else ''})"
    vram = f" {round(gpu['memory_size_mb'] / 1024)} GB" if gpu.get("memory_size_mb") else ""
    summary = " · ".join(p for p in (
        f"{cpu.get('name', '')} ({cpu.get('cores', '?')}C/{cpu.get('threads', '?')}T)",
        ram,
        f"{gpu.get('name', '')}{vram}" if gpu.get("name") else "",
        board.get("model") or "",
        total_disks,
        st.get("os_caption") or st.get("os") or "",
    ) if p and p.strip())

    return {"status": "success", "summary": summary, "sections": sections,
            "computer": st.get("computer") if include_private else "",
            "scanned_at": datetime.now().strftime("%d/%m/%Y %H:%M"), "include_private": include_private}


def _documents_folder():
    try:
        import ctypes
        from ctypes import wintypes
        buf = ctypes.create_unicode_buffer(wintypes.MAX_PATH)
        ctypes.windll.shell32.SHGetFolderPathW(None, 5, None, 0, buf)  # CSIDL_PERSONAL (Documentos)
        if buf.value:
            return buf.value
    except Exception:
        pass
    return os.path.join(os.path.expanduser("~"), "Documents")


def export_sheet(include_private=False):
    from backend.support_engine import _write_reports
    sheet = build_sheet(include_private)
    if sheet.get("status") != "success":
        raise ValueError(sheet.get("message"))
    folder = os.path.join(_documents_folder(), "WinShield Pro", "Fichas")
    stamp = datetime.now().strftime("%Y-%m-%d_%H%M")
    sections = [("Resumo", [("", sheet["summary"])])] + sheet["sections"]
    files = _write_reports(folder, f"ficha_do_pc_{stamp}", "Ficha do PC", sheet, sections)
    LogManager.add_log(f"[FICHA] Ficha salva em {folder}")
    return files, folder
