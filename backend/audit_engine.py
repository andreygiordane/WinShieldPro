import os
import re
import shutil

from backend.core import IS_WINDOWS
from backend.log_manager import LogManager
from backend.process import launch_gui, run_hidden, run_ps

try:
    import winreg
except ImportError:  # pragma: no cover
    winreg = None


class AuditEngine:
    """Auditoria de softwares instalados, componentes ocultos, AppX, serviços e inicialização."""

    # ------------------------------------------------------------------ registro
    @staticmethod
    def scan_registry():
        LogManager.add_log("Auditando o Registro do Windows (HKLM 64/32-bit e HKCU)...")
        if not IS_WINDOWS or winreg is None:
            return []

        results, seen = [], set()
        targets = [
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall", "HKLM (64-bit)", "HKLM", winreg.KEY_WOW64_64KEY),
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall", "HKLM (32-bit)", "HKLM", winreg.KEY_WOW64_32KEY),
            (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall", "HKCU (Usuário)", "HKCU", 0),
        ]
        hidden = 0
        for root_key, subkey_path, scope, root_name, sam in targets:
            access = winreg.KEY_READ | sam
            try:
                key = winreg.OpenKey(root_key, subkey_path, 0, access)
            except OSError as e:
                LogManager.add_log(f"[AVISO] {scope}: {e}")
                continue
            for i in range(winreg.QueryInfoKey(key)[0]):
                try:
                    sub = winreg.EnumKey(key, i)
                    full = f"{subkey_path}\\{sub}"
                    with winreg.OpenKey(root_key, full, 0, access) as ak:
                        name = AuditEngine._get(ak, "DisplayName")
                        if not name:
                            continue
                        version = AuditEngine._get(ak, "DisplayVersion") or ""
                        dedup = (name.lower(), version, scope)
                        if dedup in seen:
                            continue
                        seen.add(dedup)
                        install_loc = AuditEngine._get(ak, "InstallLocation") or ""
                        uninstall = (AuditEngine._get(ak, "QuietUninstallString") and AuditEngine._get(ak, "UninstallString")) \
                            or AuditEngine._get(ak, "UninstallString") or install_loc or ""
                        is_hidden = AuditEngine._get(ak, "SystemComponent") == 1
                        size_kb = AuditEngine._get(ak, "EstimatedSize")
                        hidden += 1 if is_hidden else 0
                        results.append({
                            "nome": name,
                            "versao": version or "—",
                            "editor": AuditEngine._get(ak, "Publisher") or "—",
                            "instalado": AuditEngine._fmt_date(AuditEngine._get(ak, "InstallDate")),
                            "tamanho": int(size_kb) * 1024 if isinstance(size_kb, int) else 0,
                            "origem": scope,
                            "status": "Oculto (SystemComponent=1)" if is_hidden else "Visível",
                            "caminho": uninstall,
                            "install_location": install_loc,
                            "is_hidden": is_hidden,
                            "root": root_name,
                            "subkey": full,
                            "kind": "registry",
                        })
                except OSError:
                    continue
            winreg.CloseKey(key)
        results.sort(key=lambda r: r["nome"].lower())
        LogManager.add_log(f"[OK] {len(results)} programas mapeados ({hidden} ocultos do Painel de Controle).")
        return results

    # ------------------------------------------------------------------ appx
    @staticmethod
    def scan_appx():
        LogManager.add_log("Consultando pacotes AppX / Microsoft Store...")
        if not IS_WINDOWS:
            return []
        script = (
            "try { $pkgs = Get-AppxPackage -AllUsers -ErrorAction Stop } catch { $pkgs = Get-AppxPackage -ErrorAction SilentlyContinue }; "
            "$pkgs | Where-Object { -not $_.IsFramework } | "
            "ForEach-Object { \"$($_.Name)|$($_.Version)|$($_.NonRemovable)|$($_.PackageFullName)|$($_.Publisher)\" }"
        )
        _, out = run_ps(script, timeout=60)
        results = []
        seen_pkg = set()
        for line in out.splitlines():
            p = line.strip().split("|")
            if len(p) >= 4:
                pkg_full = p[3].strip()
                if not pkg_full or pkg_full in seen_pkg:
                    continue
                seen_pkg.add(pkg_full)
                locked = p[2].lower() == "true"
                results.append({
                    "nome": p[0], "versao": p[1],
                    "editor": (p[4].split(",")[0].replace("CN=", "") if len(p) > 4 else "—"),
                    "instalado": "—", "tamanho": 0,
                    "origem": "AppX / Store",
                    "status": "Sistema (bloqueado)" if locked else "Removível",
                    "caminho": f'try {{ Remove-AppxPackage -Package "{pkg_full}" -AllUsers -ErrorAction Stop }} catch {{ Remove-AppxPackage -Package "{pkg_full}" }}',
                    "is_hidden": False, "kind": "appx", "locked": locked,
                })
        LogManager.add_log(f"[OK] {len(results)} pacotes AppX identificados.")
        return results

    # ------------------------------------------------------------------ serviços
    @staticmethod
    def scan_services():
        LogManager.add_log("Auditando serviços de terceiros (fora de System32)...")
        if not IS_WINDOWS:
            return []
        script = (
            "Get-CimInstance Win32_Service | Where-Object { $_.PathName -and "
            "$_.PathName -notmatch '(?i)\\\\Windows\\\\System32' -and $_.PathName -notmatch '(?i)\\\\Windows\\\\SysWOW64' } | "
            "ForEach-Object { \"$($_.Name)|$($_.State)|$($_.StartMode)|$($_.PathName)|$($_.DisplayName)\" }"
        )
        _, out = run_ps(script, timeout=60)
        results = []
        for line in out.splitlines():
            p = line.strip().split("|")
            if len(p) >= 4:
                low = p[3].lower()
                sus = ("\\temp" in low) or ("\\appdata" in low)
                results.append({
                    "nome": p[4] if len(p) > 4 and p[4] else p[0], "service": p[0],
                    "versao": p[2], "editor": p[1], "instalado": "—", "tamanho": 0,
                    "origem": "Serviço Windows",
                    "status": "Suspeito (AppData/Temp)" if sus else f"Serviço ({p[1]})",
                    "caminho": p[3], "is_hidden": sus, "kind": "service",
                })
        LogManager.add_log(f"[OK] {len(results)} serviços de terceiros mapeados.")
        return results

    # ------------------------------------------------------------------ startup
    @staticmethod
    def scan_startup():
        LogManager.add_log("Verificando programas de inicialização automática...")
        if not IS_WINDOWS or winreg is None:
            return []
        keys = [
            (winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run", "HKCU\\Run"),
            (winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\RunOnce", "HKCU\\RunOnce"),
            (winreg.HKEY_LOCAL_MACHINE, r"Software\Microsoft\Windows\CurrentVersion\Run", "HKLM\\Run"),
            (winreg.HKEY_LOCAL_MACHINE, r"Software\Microsoft\Windows\CurrentVersion\RunOnce", "HKLM\\RunOnce"),
            (winreg.HKEY_LOCAL_MACHINE, r"Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Run", "HKLM32\\Run"),
        ]
        results = []
        for root, subkey, label in keys:
            try:
                with winreg.OpenKey(root, subkey, 0, winreg.KEY_READ) as k:
                    for i in range(winreg.QueryInfoKey(k)[1]):
                        vn, vv, _ = winreg.EnumValue(k, i)
                        low = str(vv).lower()
                        sus = "\\temp" in low or "\\appdata\\local\\temp" in low
                        results.append({
                            "nome": vn, "versao": "Startup", "editor": "—", "instalado": "—", "tamanho": 0,
                            "origem": label,
                            "status": "Suspeito (Temp)" if sus else "Inicialização ativa",
                            "caminho": str(vv), "is_hidden": sus, "kind": "startup",
                            "root": "HKCU" if root == winreg.HKEY_CURRENT_USER else "HKLM", "subkey": subkey,
                        })
            except OSError:
                continue
        # Pastas Startup
        for folder in (os.path.expandvars(r"%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"),
                       os.path.expandvars(r"%ProgramData%\Microsoft\Windows\Start Menu\Programs\StartUp")):
            if os.path.isdir(folder):
                for f in os.listdir(folder):
                    if f.lower() == "desktop.ini":
                        continue
                    results.append({
                        "nome": f, "versao": "Startup", "editor": "—", "instalado": "—", "tamanho": 0,
                        "origem": "Pasta Startup", "status": "Inicialização ativa",
                        "caminho": os.path.join(folder, f), "is_hidden": False, "kind": "startup_file",
                    })
        LogManager.add_log(f"[OK] {len(results)} itens de inicialização mapeados.")
        return results

    # ------------------------------------------------------------------ ações
    @staticmethod
    def unhide_app(root_name, subkey_path):
        if not IS_WINDOWS or winreg is None:
            return False, "Operação disponível apenas no Windows."
        root_key = winreg.HKEY_LOCAL_MACHINE if root_name == "HKLM" else winreg.HKEY_CURRENT_USER
        for sam in (winreg.KEY_WOW64_64KEY, winreg.KEY_WOW64_32KEY):
            try:
                with winreg.OpenKey(root_key, subkey_path, 0, winreg.KEY_SET_VALUE | sam) as key:
                    winreg.SetValueEx(key, "SystemComponent", 0, winreg.REG_DWORD, 0)
                LogManager.add_log(f"[SUCESSO] '{subkey_path}' agora está visível no Painel de Controle.")
                return True, "Programa desocultado! Agora aparece em Aplicativos e Recursos."
            except OSError as ex:
                err = ex
        LogManager.add_log(f"[ERRO] Desocultar: {err}")
        return False, str(err)

    @staticmethod
    def uninstall(item):
        cmd = (item or {}).get("caminho", "")
        kind = (item or {}).get("kind", "registry")
        if not cmd:
            return False, "Nenhum comando de desinstalação disponível."
        LogManager.add_log(f"Iniciando desinstalação: {item.get('nome')}")
        if kind == "appx":
            from backend.cmd_engine import SystemCommandEngine
            SystemCommandEngine.run_powershell(cmd + "; Write-Output '[OK] Pacote removido.'", name=f"Remover {item.get('nome')}")
            return True, "Remoção do pacote AppX iniciada em segundo plano."
        if kind == "service":
            from backend.cmd_engine import SystemCommandEngine
            svc = item.get("service") or item.get("nome")
            SystemCommandEngine.run_cmd(f'sc stop "{svc}" & sc delete "{svc}"', name=f"Remover serviço {svc}")
            return True, f"Serviço '{svc}' sendo parado e removido."
        if kind in ("startup", "startup_file"):
            return AuditEngine.remove_startup(item)
        # Desinstalador oficial (GUI visível, sem console)
        launch_gui(cmd)
        return True, "Desinstalador oficial aberto. Siga as instruções na janela dele."

    @staticmethod
    def remove_startup(item):
        try:
            if item.get("kind") == "startup_file":
                os.remove(item["caminho"])
            else:
                root = winreg.HKEY_CURRENT_USER if item.get("root") == "HKCU" else winreg.HKEY_LOCAL_MACHINE
                with winreg.OpenKey(root, item["subkey"], 0, winreg.KEY_SET_VALUE) as k:
                    winreg.DeleteValue(k, item["nome"])
            LogManager.add_log(f"[OK] '{item['nome']}' removido da inicialização.")
            return True, f"'{item['nome']}' não iniciará mais com o Windows."
        except Exception as ex:  # noqa: BLE001
            return False, str(ex)

    @staticmethod
    def force_shred(name, cmd_path):
        LogManager.add_log(f"=== EXCLUSÃO FORÇADA: {name} ===")
        match = re.search(r'([A-Za-z]:\\[^"\'<>*|?]+?\.exe)', cmd_path or "", re.IGNORECASE)
        target = None
        if match:
            exe = match.group(1).strip()
            run_hidden(f'taskkill /F /T /IM "{os.path.basename(exe)}"')
            folder = os.path.dirname(exe)
            # Nunca apaga pastas raiz críticas
            protected = {os.path.normcase(p) for p in (
                os.environ.get("SystemRoot", r"C:\Windows"), os.environ.get("ProgramFiles", ""),
                os.environ.get("ProgramFiles(x86)", ""), os.environ.get("ProgramData", ""),
                os.path.expandvars("%SystemRoot%\\System32"), os.path.expandvars("%SystemRoot%\\SysWOW64"))}
            if folder and os.path.normcase(folder) not in protected and len(folder) > 3 \
                    and "\\windows\\" not in folder.lower() + "\\":
                target = folder
            else:
                target = exe
        elif cmd_path and os.path.isdir(cmd_path.strip('"')):
            target = cmd_path.strip('"')
        if target and os.path.exists(target):
            try:
                if os.path.isdir(target):
                    shutil.rmtree(target, ignore_errors=True)
                else:
                    os.remove(target)
                LogManager.add_log(f"[SHRED] Removido: {target}")
            except Exception as e:  # noqa: BLE001
                LogManager.add_log(f"[AVISO] {e}")
        else:
            LogManager.add_log("[AVISO] Nenhum arquivo físico localizado para remoção.")
        LogManager.add_log(f"=== EXCLUSÃO FORÇADA DE '{name}' FINALIZADA ===")
        return True, f"Exclusão forçada de '{name}' concluída."

    # ------------------------------------------------------------------ util
    @staticmethod
    def _get(k, v):
        try:
            val, _ = winreg.QueryValueEx(k, v)
            return val.strip() if isinstance(val, str) else val
        except OSError:
            return None

    @staticmethod
    def _fmt_date(s):
        if isinstance(s, str) and len(s) == 8 and s.isdigit():
            return f"{s[6:8]}/{s[4:6]}/{s[0:4]}"
        return "—"
