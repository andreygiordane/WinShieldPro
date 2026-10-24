"""
WinShield Pro v5.0 Enterprise - Gerenciador de Aplicativos em Execução & Desinstalador.
Permite visualizar todos os programas abertos, janelas ativas, consumo de memória,
separar entre Aplicativos do Usuário e Serviços do Windows, com ícones e desinstalação integrada.
"""
import os
import re
import csv
import io
import time
import shutil
import subprocess

try:
    import psutil
except ImportError:
    psutil = None

try:
    import ctypes
except ImportError:
    ctypes = None

from backend.core import IS_WINDOWS
from backend.log_manager import LogManager
from backend.process import run_hidden, run_ps, run_ps_json, launch_gui
from backend.audit_engine import AuditEngine

SYSTEM_EXES = {
    "system idle process", "system", "registry", "smss.exe", "csrss.exe", "wininit.exe",
    "services.exe", "lsass.exe", "svchost.exe", "dwm.exe", "taskhostw.exe", "conhost.exe",
    "fontdrvhost.exe", "sihost.exe", "runtimebroker.exe", "ctfmon.exe", "shellexperiencehost.exe",
    "searchhost.exe", "startmenuexperiencehost.exe", "lockapp.exe", "textinputhost.exe",
    "applicationframehost.exe", "systemsettings.exe", "wmiprvse.exe", "spoolsv.exe"
}


def _get_window_titles():
    """Captura rápida (< 1ms) de títulos de janelas visíveis mapeados por PID."""
    titles = {}
    if not (IS_WINDOWS and ctypes):
        return titles
    try:
        user32 = ctypes.windll.user32
        hdesk = user32.OpenInputDesktop(0, False, 0x01FF)

        def cb(hwnd, lparam):
            if user32.IsWindowVisible(hwnd):
                length = user32.GetWindowTextLengthW(hwnd)
                if length > 0:
                    buf = ctypes.create_unicode_buffer(length + 1)
                    user32.GetWindowTextW(hwnd, buf, length + 1)
                    pid = ctypes.c_ulong()
                    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
                    val = buf.value.strip()
                    if val and pid.value not in titles:
                        titles[pid.value] = val
            return True

        DESKTOPENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)
        if hdesk:
            user32.EnumDesktopWindows(hdesk, DESKTOPENUMPROC(cb), 0)
            user32.CloseDesktop(hdesk)
        else:
            user32.EnumWindows(DESKTOPENUMPROC(cb), 0)
    except Exception:
        pass
    return titles


def _resolve_icon_and_category(exe_name, path, session, user, has_window, is_matched):
    low = exe_name.lower()
    p_low = (path or "").lower()
    u_low = (user or "").lower()

    # Deteção de Categoria: Serviços do Windows vs Meus Aplicativos
    is_service = (
        session == "Services" or
        "nt authority" in u_low or
        "system" in u_low or
        "local service" in u_low or
        "network service" in u_low or
        ("system32" in p_low and not has_window and not is_matched) or
        ("syswow64" in p_low and not has_window and not is_matched) or
        low in ("svchost.exe", "services.exe", "lsass.exe", "csrss.exe", "smss.exe", "wininit.exe", "spoolsv.exe", "dwm.exe")
    )
    category = "windows_service" if is_service else "user_app"

    # Mapeamento Inteligente de Ícones Modernos
    icon = "box"
    brand_color = "slate"
    if "chrome" in low:
        icon = "chrome"
        brand_color = "amber"
    elif "msedge" in low or "edge" in low:
        icon = "globe"
        brand_color = "cyan"
    elif "brave" in low:
        icon = "shield"
        brand_color = "orange"
    elif "firefox" in low:
        icon = "flame"
        brand_color = "orange"
    elif "discord" in low:
        icon = "message-square"
        brand_color = "indigo"
    elif "spotify" in low:
        icon = "music"
        brand_color = "emerald"
    elif "steam" in low:
        icon = "gamepad-2"
        brand_color = "blue"
    elif "code" in low or "cursor" in low or "antigravity" in low or "pycharm" in low or "idea" in low:
        icon = "code"
        brand_color = "cyan"
    elif "powershell" in low or "pwsh" in low or "cmd.exe" in low or "windowsterminal" in low or "wt.exe" in low:
        icon = "terminal"
        brand_color = "blue"
    elif "explorer" in low:
        icon = "folder"
        brand_color = "yellow"
    elif "notepad" in low:
        icon = "file-text"
        brand_color = "sky"
    elif "vlc" in low or "wmplayer" in low:
        icon = "video"
        brand_color = "amber"
    elif "whatsapp" in low:
        icon = "message-circle"
        brand_color = "emerald"
    elif "telegram" in low:
        icon = "send"
        brand_color = "sky"
    elif "python" in low:
        icon = "cpu"
        brand_color = "yellow"
    elif "excel" in low or "calc" in low or "calc.exe" in low:
        icon = "calculator"
        brand_color = "emerald"
    elif "winshield" in low:
        icon = "shield-check"
        brand_color = "blue"
    elif is_service:
        icon = "cog"
        brand_color = "indigo"
    else:
        icon = "app-window"
        brand_color = "slate"

    return category, icon, brand_color


class AppsManagerEngine:
    """Gerenciamento de programas abertos e desinstalação integrada."""
    _cached_installed_index = None
    _cached_installed_time = 0.0

    @classmethod
    def list_running_apps(cls):
        """Lista aplicativos interativos e processos em execução com janelas, memória e categorias."""
        LogManager.add_log("Mapeando programas em execução e separando serviços de aplicativos...")
        if not IS_WINDOWS:
            return []

        # 1. Carrega banco de dados de softwares instalados para associação automática (com cache de 60s)
        now = time.time()
        if cls._cached_installed_index is not None and (now - cls._cached_installed_time < 60.0):
            installed_index = cls._cached_installed_index
        else:
            installed_list = []
            try:
                installed_list = AuditEngine.scan_registry()
            except Exception as e:
                LogManager.add_log(f"[AVISO] Falha ao carregar registro para associação: {e}")

            installed_index = {}
            for item in installed_list:
                norm_name = re.sub(r'[^a-z0-9]', '', (item.get("nome") or "").lower())
                if norm_name:
                    installed_index[norm_name] = item
            cls._cached_installed_index = installed_index
            cls._cached_installed_time = now

        # 2. Caminho de Altíssimo Desempenho (< 0.15s) via psutil nativo + Win32 EnumWindows
        if psutil is not None:
            window_titles = _get_window_titles()
            apps_dict = {}

            for p in psutil.process_iter(['pid', 'name', 'exe', 'memory_info', 'username']):
                try:
                    info = p.info
                    exe_name = info.get('name') or ''
                    if not exe_name:
                        continue
                    pid = str(info['pid'])
                    path = info.get('exe') or ''
                    mem_kb = (info['memory_info'].rss // 1024) if info.get('memory_info') else 0
                    user = info.get('username') or ''
                    title = window_titles.get(info['pid'], '')
                    lower_exe = exe_name.lower()

                    if lower_exe in SYSTEM_EXES and not title:
                        continue

                    u_low = user.lower()
                    session = "Services" if any(k in u_low for k in ["nt authority", "system", "local service", "network service"]) else "Console"
                    if session == "Services" and not title and lower_exe in ("svchost.exe", "conhost.exe"):
                        continue

                    has_valid_window = bool(title and title not in ("N/A", "", "OleMainThreadWndName", "Default IME", "MSCTFIME UI"))

                    matched_app = None
                    clean_exe_base = re.sub(r'[^a-z0-9]', '', lower_exe.replace(".exe", ""))
                    exe_dir_low = os.path.dirname(path).lower() if path else ""

                    for k, inst in installed_index.items():
                        inst_loc = (inst.get("install_location") or "").strip('" ').rstrip("\\/").lower()
                        inst_path = (inst.get("caminho") or "").lower()
                        if exe_dir_low and inst_loc and len(inst_loc) > 3 and exe_dir_low.startswith(inst_loc):
                            matched_app = inst
                            break
                        if path and path.lower() in inst_path:
                            matched_app = inst
                            break
                        if len(clean_exe_base) >= 4 and len(k) >= 4 and (clean_exe_base in k or k in clean_exe_base):
                            matched_app = inst
                            break

                    app_key = lower_exe
                    category, icon_hint, brand_color = _resolve_icon_and_category(
                        exe_name, path, session, user, has_valid_window, bool(matched_app)
                    )

                    if app_key not in apps_dict:
                        display_name = matched_app.get("nome") if matched_app else exe_name.replace(".exe", "").capitalize()
                        apps_dict[app_key] = {
                            "exe": exe_name,
                            "name": display_name,
                            "pids": [pid],
                            "main_pid": pid,
                            "titles": [title] if has_valid_window else [],
                            "mem_kb": mem_kb,
                            "mem_mb": round(mem_kb / 1024, 1),
                            "path": path,
                            "user": user,
                            "has_window": has_valid_window,
                            "category": category,
                            "icon_hint": icon_hint,
                            "brand_color": brand_color,
                            "installed_item": matched_app,
                            "can_uninstall": bool(matched_app and matched_app.get("caminho")),
                        }
                    else:
                        apps_dict[app_key]["pids"].append(pid)
                        apps_dict[app_key]["mem_kb"] += mem_kb
                        apps_dict[app_key]["mem_mb"] = round(apps_dict[app_key]["mem_kb"] / 1024, 1)
                        if has_valid_window and title not in apps_dict[app_key]["titles"]:
                            apps_dict[app_key]["titles"].append(title)
                            apps_dict[app_key]["has_window"] = True
                        if not apps_dict[app_key]["path"] and path:
                            apps_dict[app_key]["path"] = path
                        if apps_dict[app_key]["category"] == "windows_service" and category == "user_app":
                            apps_dict[app_key]["category"] = "user_app"
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue

            results = list(apps_dict.values())
            results.sort(key=lambda x: (x["category"] != "user_app", not x["has_window"], -x["mem_kb"]))
            user_apps_count = sum(1 for x in results if x["category"] == "user_app")
            services_count = sum(1 for x in results if x["category"] == "windows_service")
            LogManager.add_log(f"[OK] {len(results)} processos mapeados via psutil ({user_apps_count} Aplicativos, {services_count} Serviços).")
            return results

        # 3. Fallback clássico via PowerShell + tasklist (se psutil não estiver disponível)
        path_map = {}
        try:
            ps_paths = (
                "Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | "
                "Where-Object { $_.ExecutablePath } | "
                "ForEach-Object { \"$($_.ProcessId)|$($_.ExecutablePath)\" }"
            )
            code, out = run_ps(ps_paths, timeout=15)
            if code == 0 and out:
                for line in out.splitlines():
                    if "|" in line:
                        p_pid, p_path = line.strip().split("|", 1)
                        if p_pid.strip().isdigit() and p_path.strip():
                            path_map[p_pid.strip()] = p_path.strip()
        except Exception:
            pass
        if not path_map:
            try:
                ps_fallback = (
                    "Get-Process -ErrorAction SilentlyContinue | "
                    "Where-Object { $_.Path } | "
                    "ForEach-Object { \"$($_.Id)|$($_.Path)\" }"
                )
                code, out = run_ps(ps_fallback, timeout=15)
                if code == 0 and out:
                    for line in out.splitlines():
                        if "|" in line:
                            p_pid, p_path = line.strip().split("|", 1)
                            if p_pid.strip().isdigit() and p_path.strip():
                                path_map[p_pid.strip()] = p_path.strip()
            except Exception:
                pass

        # 3. Mapeamento de Janelas e Memória via tasklist /V /FO CSV
        code, out = run_hidden("tasklist /V /FO CSV", timeout=20)
        if code != 0 or not out:
            return []

        reader = csv.reader(io.StringIO(out.strip()))
        rows = list(reader)
        if not rows:
            return []

        def clean_mem_kb(mem_str):
            clean = re.sub(r'[^\d]', '', mem_str or "")
            return int(clean) if clean else 0

        apps_dict = {}

        for r in rows[1:]:
            if len(r) < 9:
                continue

            exe_name = r[0].strip()
            pid = r[1].strip()
            session = r[2].strip()
            mem_str = r[4].strip()
            user = r[6].strip()
            title = r[8].strip()

            lower_exe = exe_name.lower()
            if lower_exe in SYSTEM_EXES and title in ("N/A", ""):
                continue
            if session == "Services" and title in ("N/A", "") and lower_exe in ("svchost.exe", "conhost.exe"):
                continue

            has_valid_window = (title not in ("N/A", "", "OleMainThreadWndName", "Default IME", "MSCTFIME UI"))
            path = path_map.get(pid, "")

            # Associação com o software instalado
            matched_app = None
            clean_exe_base = re.sub(r'[^a-z0-9]', '', lower_exe.replace(".exe", ""))
            exe_dir_low = os.path.dirname(path).lower() if path else ""

            for k, inst in installed_index.items():
                inst_loc = (inst.get("install_location") or "").strip('" ').rstrip("\\/").lower()
                inst_path = (inst.get("caminho") or "").lower()
                if exe_dir_low and inst_loc and len(inst_loc) > 3 and exe_dir_low.startswith(inst_loc):
                    matched_app = inst
                    break
                if path and path.lower() in inst_path:
                    matched_app = inst
                    break
                if len(clean_exe_base) >= 4 and len(k) >= 4 and (clean_exe_base in k or k in clean_exe_base):
                    matched_app = inst
                    break

            app_key = lower_exe
            mem_kb = clean_mem_kb(mem_str)

            category, icon_hint, brand_color = _resolve_icon_and_category(
                exe_name, path, session, user, has_valid_window, bool(matched_app)
            )

            if app_key not in apps_dict:
                display_name = matched_app.get("nome") if matched_app else exe_name.replace(".exe", "").capitalize()
                apps_dict[app_key] = {
                    "exe": exe_name,
                    "name": display_name,
                    "pids": [pid],
                    "main_pid": pid,
                    "titles": [title] if has_valid_window else [],
                    "mem_kb": mem_kb,
                    "mem_mb": round(mem_kb / 1024, 1),
                    "path": path,
                    "user": user,
                    "has_window": has_valid_window,
                    "category": category,
                    "icon_hint": icon_hint,
                    "brand_color": brand_color,
                    "installed_item": matched_app,
                    "can_uninstall": bool(matched_app and matched_app.get("caminho")),
                }
            else:
                apps_dict[app_key]["pids"].append(pid)
                apps_dict[app_key]["mem_kb"] += mem_kb
                apps_dict[app_key]["mem_mb"] = round(apps_dict[app_key]["mem_kb"] / 1024, 1)
                if has_valid_window and title not in apps_dict[app_key]["titles"]:
                    apps_dict[app_key]["titles"].append(title)
                    apps_dict[app_key]["has_window"] = True
                if not apps_dict[app_key]["path"] and path:
                    apps_dict[app_key]["path"] = path
                if apps_dict[app_key]["category"] == "windows_service" and category == "user_app":
                    apps_dict[app_key]["category"] = "user_app"

        results = list(apps_dict.values())
        # Ordena: Meus Aplicativos primeiro, depois janelas ativas, depois RAM
        results.sort(key=lambda x: (x["category"] != "user_app", not x["has_window"], -x["mem_kb"]))
        user_apps_count = sum(1 for x in results if x["category"] == "user_app")
        services_count = sum(1 for x in results if x["category"] == "windows_service")
        LogManager.add_log(f"[OK] {len(results)} processos mapeados ({user_apps_count} Aplicativos, {services_count} Serviços).")
        return results

    @classmethod
    def kill_process(cls, pid=None, exe=None):
        """Finaliza um processo pelo PID ou nome de imagem."""
        if not IS_WINDOWS:
            return False, "Disponível apenas no Windows."

        if pid:
            LogManager.add_log(f"Encerrando processo PID {pid}...")
            code, out = run_hidden(f"taskkill /F /PID {pid} /T")
            if code == 0:
                LogManager.add_log(f"[OK] Processo PID {pid} encerrado com sucesso.")
                return True, f"Processo (PID: {pid}) finalizado com sucesso."
            else:
                return False, f"Falha ao encerrar PID {pid}: {out}"
        elif exe:
            clean_exe = os.path.basename(exe)
            LogManager.add_log(f"Encerrando instâncias de {clean_exe}...")
            code, out = run_hidden(f'taskkill /F /IM "{clean_exe}" /T')
            if code == 0:
                LogManager.add_log(f"[OK] Instâncias de '{clean_exe}' encerradas com sucesso.")
                return True, f"Programa '{clean_exe}' finalizado."
            else:
                return False, f"Falha ao encerrar '{clean_exe}': {out}"

        return False, "Nenhum identificador fornecido."

    @classmethod
    def uninstall_app(cls, item):
        """Dispara a desinstalação de um programa aberto ou selecionado."""
        if not item:
            return False, "Nenhum aplicativo informado."

        # Se temos o item do Registro vinculado
        inst_item = item.get("installed_item")
        if inst_item and inst_item.get("caminho"):
            return AuditEngine.uninstall(inst_item)

        # Se temos o caminho do executável, procura por unins000.exe ou uninstall.exe na pasta
        exe_path = item.get("path") or ""
        if exe_path and os.path.exists(exe_path):
            folder = os.path.dirname(exe_path)
            for fname in ("unins000.exe", "uninstall.exe", "setup.exe"):
                candidate = os.path.join(folder, fname)
                if os.path.exists(candidate):
                    LogManager.add_log(f"Desinstalador detectado na pasta: {candidate}")
                    launch_gui(f'"{candidate}"')
                    return True, f"Desinstalador oficial iniciado ({fname}). Siga as etapas na tela."

        # Tenta abrir o desinstalador oficial nas configurações do Windows ou Painel de Controle
        LogManager.add_log("Abrindo Central de Desinstalação do Windows (appwiz.cpl)...")
        launch_gui("control.exe appwiz.cpl")
        return True, "Desinstalador oficial do Windows aberto para remoção do aplicativo."

    @classmethod
    def open_folder(cls, path):
        """Abre o Windows Explorer com o executável selecionado."""
        if not path or not os.path.exists(path):
            return False, "Caminho do arquivo não localizado."
        launch_gui(f'explorer.exe /select,"{path}"')
        return True, "Pasta do programa aberta no Windows Explorer."
