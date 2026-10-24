"""
WinShield Pro v6.2 Enterprise - Servidor Desktop & API Central.
Gerencia a interface Web Desktop, rotas REST e integra todos os motores de sistema.
"""

import os
import sys
import json
import socket
import threading
import subprocess
import time
from datetime import datetime
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

# Importação dos módulos especializados do WinShield Pro
from backend.api import ApiRouter
from backend.core import is_admin, elevate_privileges, base_dir, resource_path, IS_WINDOWS
from backend.log_manager import LogManager
from backend.process import run_hidden, run_ps
from backend.cmd_engine import SystemCommandEngine, JobManager
from backend.audit_engine import AuditEngine
from backend.antivirus_engine import AntivirusEngine
from backend.cleaner_engine import CleanerEngine
from backend.power_engine import PowerEngine
from backend.optimizer_engine import OptimizerEngine
from backend.system_engine import SystemEngine
from backend.disk_health_engine import DiskHealthEngine
from backend.disk_benchmark_engine import DiskBenchmarkEngine
from backend.hardware_monitor import CoreEngine, CoreBenchmarkEngine, VisionEngine, CoreEngine, CPUBenchmarkEngine, VisionEngine
from backend.disk_scan_engine import SurfaceScanEngine, SurfaceScanEngine
from backend.app_manager_engine import AppsManagerEngine
from backend.memory_engine import MemoryEngine
from backend.network_engine import NetworkEngine
from backend.device_engine import DeviceEngine
from backend.stress_engine import StressEngine


class WinShieldRequestHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Desativa logging padrão do BaseHTTPRequestHandler para manter o console limpo
        pass

    def do_GET(self):
        url_path = self.path.split("?")[0]

        if url_path in ("/", "/index.html"):
            self._serve_file("winshield_pro_dashboard.html", "text/html; charset=utf-8")
            return

        elif url_path in ("/splash_backdrop.webp", "/splash_backdrop.png", "/splash_logo.webp", "/splash_logo.png", "/splash_bg.png", "/splash_bg.webp") or url_path.startswith("/imagens/"):
            fname = url_path.lstrip("/").replace("/", os.sep)
            mime = "image/png"
            if fname.endswith(".ico"):
                mime = "image/x-icon"
            elif fname.endswith(".webp"):
                mime = "image/webp"
            elif fname.endswith(".svg"):
                mime = "image/svg+xml"
            self._serve_file(fname, mime)
            return

        elif url_path.endswith(".css"):
            self._serve_file(url_path.lstrip("/"), "text/css; charset=utf-8")
            return
        elif url_path.endswith(".js"):
            self._serve_file(url_path.lstrip("/"), "application/javascript; charset=utf-8")
            return
        elif url_path.endswith(".html"):
            self._serve_file(url_path.lstrip("/"), "text/html; charset=utf-8")
            return

        elif url_path == "/api/status":
            self._send_json({
                "admin": is_admin(),
                "os": sys.platform,
                "timestamp": datetime.now().strftime("%H:%M:%S")
            })

        elif url_path == "/api/system/info":
            data = SystemEngine.static_info()
            self._send_json({"status": "success", "info": data})

        elif url_path == "/api/system/live":
            data = SystemEngine.live()
            self._send_json({"status": "success", "live": data})

        elif url_path == "/api/disks/health":
            force = any(k in self.path for k in ("force=1", "force=true", "refresh=1", "refresh=true"))
            disks = DiskHealthEngine.scan(force=force)
            self._send_json({"status": "success", "disks": disks})

        elif url_path == "/api/disks/benchmark/status":
            status = DiskBenchmarkEngine.get_status()
            self._send_json({"status": "success", "benchmark": status})

        elif url_path == "/api/power/list":
            schemes = PowerEngine.list_schemes()
            self._send_json({"schemes": schemes})

        elif url_path == "/api/antivirus/status":
            stat = AntivirusEngine.defender_status()
            self._send_json({"status": "success", "defender": stat})

        elif url_path == "/api/antivirus/scan_status":
            scan_st = AntivirusEngine.get_security_scan_status()
            self._send_json({"status": "success", "scan": scan_st})

        elif url_path == "/api/clean/status":
            clean_st = CleanerEngine.get_status()
            self._send_json({"status": "success", "clean": clean_st, "cleaner": clean_st})

        elif url_path == "/api/optimize/profile":
            force = any(k in self.path for k in ("force=1", "force=true", "refresh=1", "refresh=true"))
            prof = OptimizerEngine.get_hardware_profile(force=force)
            self._send_json({"status": "success", "profile": prof})

        elif url_path == "/api/jobs":
            jobs = JobManager.list()
            self._send_json({"status": "success", "jobs": jobs})

        elif url_path == "/api/silicon/info":
            force = any(k in self.path for k in ("force=1", "force=true", "refresh=1", "refresh=true"))
            data = CoreEngine.get_info(force=force)
            self._send_json({"status": "success", "silicon": data})

        elif url_path == "/api/silicon/bench/results":
            data = CPUBenchmarkEngine.get_results()
            self._send_json({"status": "success", "bench": data})

        elif url_path == "/api/vision/info":
            data = VisionEngine.get_info()
            self._send_json({"status": "success", "vision": data})

        elif url_path == "/api/disks/scan/status":
            state = SurfaceScanEngine.get_scan_state()
            self._send_json({"status": "success", "scan": state})

        elif url_path == "/api/disks/features":
            disk_idx = 0
            if "disk=" in self.path:
                try:
                    disk_idx = int(self.path.split("disk=")[1].split("&")[0])
                except Exception:
                    disk_idx = 0
            feat = SurfaceScanEngine.get_drive_features(disk_idx)
            self._send_json({"status": "success", "features": feat})

        elif url_path == "/api/logs":
            idx = 0
            if "since=" in self.path:
                try:
                    idx = int(self.path.split("since=")[1].split("&")[0])
                except Exception:
                    idx = 0
            logs, total = LogManager.get_logs_since(idx)
            self._send_json({"logs": logs, "total": total})

        elif url_path == "/api/apps/running":
            apps = AppsManagerEngine.list_running_apps()
            self._send_json({"status": "success", "apps": apps})

        elif url_path == "/api/memory/info":
            data = MemoryEngine.get_memory_info()
            self._send_json({"status": "success", "memory": data})

        elif url_path == "/api/memory/test/status":
            status = MemoryEngine.get_test_status()
            self._send_json({"status": "success", "test": status})

        # --- REDE & DIAGNÓSTICO ---
        elif url_path == "/api/network/info":
            data = NetworkEngine.get_network_info()
            self._send_json({"status": "success", "network": data})

        elif url_path == "/api/network/speed_test/status":
            speed_st = NetworkEngine.get_speed_test_status()
            self._send_json({"status": "success", "speed": speed_st})

        # --- DISPOSITIVOS & DRIVERS ---
        elif url_path == "/api/devices/list":
            force = any(k in self.path for k in ("force=1", "force=true", "refresh=1", "refresh=true"))
            data = DeviceEngine.get_devices(force=force)
            self._send_json({"status": "success", "devices": data})

        elif url_path == "/api/devices/pairing":
            force = any(k in self.path for k in ("force=1", "force=true", "refresh=1", "refresh=true"))
            paired = DeviceEngine.get_hardware_pairing(force=force)
            self._send_json({"status": "success", "paired_hardware": paired})

        elif url_path == "/api/devices/download_status":
            driver_id = None
            if "id=" in self.path:
                try:
                    driver_id = self.path.split("id=")[1].split("&")[0]
                except Exception:
                    driver_id = None
            status_data = DeviceEngine.get_download_status(driver_id)
            self._send_json({"status": "success", "downloads": status_data})

        # --- TESTE DE ESTABILIDADE DO SISTEMA (STRESSPULSE) ---
        elif url_path == "/api/stress/status":
            st = StressEngine.get_status()
            self._send_json({"status": "success", "stress": st})

        # --- CONTROLE DA APLICAÇÃO ---
        elif url_path == "/api/app/exit":
            self._send_json({"status": "success", "message": "Encerrando WinShield Pro..."})
            def _exit_app():
                time.sleep(0.4)
                os._exit(0)
            threading.Thread(target=_exit_app, daemon=True).start()
            return

        else:
            self.send_error(404, f"Endpoint não encontrado: {url_path}")

    def do_POST(self):
        content_len = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_len).decode('utf-8', errors='replace')
        data = {}
        if body:
            try:
                data = json.loads(body)
            except Exception:
                pass

        url_path = self.path.split("?")[0]

        # --- CONTROLE DA APLICAÇÃO ---
        if url_path == "/api/app/exit":
            self._send_json({"status": "success", "message": "Encerrando WinShield Pro..."})
            def _exit_app():
                time.sleep(0.4)
                os._exit(0)
            threading.Thread(target=_exit_app, daemon=True).start()
            return

        # --- AUDITORIA DE PROGRAMAS ---
        elif url_path == "/api/audit/scan":
            scan_type = data.get("type", "registry")
            if scan_type == "registry":
                items = AuditEngine.scan_registry()
            elif scan_type == "appx":
                items = AuditEngine.scan_appx()
            elif scan_type == "services":
                items = AuditEngine.scan_services()
            elif scan_type == "startup":
                items = AuditEngine.scan_startup()
            else:
                items = []
            self._send_json({"status": "success", "items": items})

        elif url_path == "/api/audit/unhide":
            root = data.get("root", "HKLM")
            subkey = data.get("subkey", "")
            ok, msg = AuditEngine.unhide_app(root, subkey)
            self._send_json({"status": "success" if ok else "error", "message": msg})

        elif url_path == "/api/audit/uninstall":
            item = data.get("item")
            if not item:
                cmd = data.get("cmd", "")
                kind = data.get("kind", "appx" if "Remove-AppxPackage" in cmd else "registry")
                item = {"caminho": cmd, "kind": kind, "nome": "Aplicativo selecionado"}
            ok, msg = AuditEngine.uninstall(item)
            self._send_json({"status": "success" if ok else "error", "message": msg})

        elif url_path == "/api/audit/force_shred":
            name = data.get("name", "")
            cmd_path = data.get("cmd", "")
            ok, msg = AuditEngine.force_shred(name, cmd_path)
            self._send_json({"status": "success" if ok else "error", "message": msg})

        # --- ANTIVÍRUS & CAÇADOR DE AMEAÇAS ---
        elif url_path == "/api/antivirus/scan":
            threats = AntivirusEngine.scan_threats()
            self._send_json({"status": "success", "threats": threats})

        elif url_path == "/api/antivirus/start_scan":
            mode = data.get("mode", "quick")
            ok, msg = AntivirusEngine.start_security_scan(mode=mode)
            self._send_json({"status": "success" if ok else "error", "message": msg})

        elif url_path == "/api/antivirus/stop_scan":
            ok = AntivirusEngine.stop_security_scan()
            self._send_json({"status": "success" if ok else "error", "message": "Parada solicitada."})

        elif url_path == "/api/antivirus/defender_scan":
            mode = data.get("mode", "quick")
            AntivirusEngine.defender_scan(mode)
            self._send_json({"status": "success", "message": f"Varredura {mode.capitalize()} iniciada."})

        elif url_path == "/api/antivirus/defender_update":
            AntivirusEngine.defender_update()
            self._send_json({"status": "success", "message": "Atualização de vacinas solicitada."})

        elif url_path == "/api/antivirus/destroy":
            pid = data.get("pid", "")
            ppath = data.get("path", "")
            quarantine = data.get("quarantine", True)
            ok, msg = AntivirusEngine.destroy_threat(pid, ppath, quarantine=quarantine)
            self._send_json({"status": "success" if ok else "error", "message": msg})

        elif url_path == "/api/antivirus/system32_scan":
            threats = AntivirusEngine.scan_system32_anomalies()
            self._send_json({"status": "success", "threats": threats})

        elif url_path == "/api/antivirus/cloud_scan":
            threats = AntivirusEngine.scan_cloud_threats()
            self._send_json({"status": "success", "threats": threats})

        elif url_path == "/api/antivirus/delete_file":
            path = data.get("path", "")
            pid = data.get("pid")
            permanent = data.get("permanent", True)
            service_name = data.get("service_name")
            ok, msg = AntivirusEngine.delete_threat_file(path, pid=pid, permanent=permanent, service_name=service_name)
            self._send_json({"status": "success" if ok else "error", "message": msg})

        # --- MOTOR DE DIAGNÓSTICO & TESTE DE MEMÓRIA (RAMGUARD MATRIX) ---
        elif url_path == "/api/memory/test/start":
            size_mb = data.get("size_mb", 1024)
            passes = data.get("passes", 1)
            mode = data.get("mode", "quick")
            ok, msg = MemoryEngine.start_memory_test(size_mb=size_mb, passes=passes, mode=mode)
            self._send_json({"status": "success" if ok else "error", "message": msg})

        elif url_path == "/api/memory/test/stop":
            ok, msg = MemoryEngine.stop_memory_test()
            self._send_json({"status": "success" if ok else "error", "message": msg})

        # --- LIMPEZA DE DISCO ---
        elif url_path == "/api/clean/analyze":
            res = CleanerEngine.analyze(data.get("options", {}))
            self._send_json({"status": "success", "result": res})

        elif url_path == "/api/clean/execute":
            res = CleanerEngine.execute(data.get("options", {}))
            self._send_json({"status": "success", "result": res})

        elif url_path == "/api/clean/start_analyze":
            ok, msg = CleanerEngine.start_analyze(data.get("options", {}))
            self._send_json({"status": "success" if ok else "error", "message": msg})

        elif url_path == "/api/clean/start_clean":
            ok, msg = CleanerEngine.start_clean(data.get("options", {}))
            self._send_json({"status": "success" if ok else "error", "message": msg})

        # --- DISK HEALTH (WINSHIELD DISKGUARD) ---
        elif url_path == "/api/disks/health/refresh":
            disks = DiskHealthEngine.scan(force=True)
            self._send_json({"status": "success", "disks": disks})

        # --- DISK SPEED TURBO ---
        elif url_path == "/api/disks/benchmark/start":
            drive = data.get("drive", "C")
            size_mb = data.get("size_mb", 1024)
            passes = data.get("passes", 5)
            test_type = data.get("test_type", "all")
            ok, msg = DiskBenchmarkEngine.start(drive, size_mb, passes, test_type)
            self._send_json({"status": "success" if ok else "error", "message": msg})

        elif url_path == "/api/disks/benchmark/cancel":
            ok = DiskBenchmarkEngine.cancel()
            self._send_json({"status": "success" if ok else "error", "message": "Cancelamento solicitado" if ok else "Nenhum benchmark ativo"})

        # --- WINSHIELD SURFACESCAN ---
        elif url_path == "/api/disks/scan/start":
            drive = data.get("drive", "C")
            mode = data.get("mode", "quick")
            ok, msg = SurfaceScanEngine.start_scan(drive, mode)
            self._send_json({"status": "success" if ok else "error", "message": msg})

        elif url_path == "/api/disks/scan/stop":
            ok = SurfaceScanEngine.stop_scan()
            self._send_json({"status": "success" if ok else "error", "message": "Interrupção solicitada" if ok else "Nenhuma varredura ativa"})

        # --- WINSHIELD CORE-ENGINE BENCHMARK ---
        elif url_path == "/api/silicon/bench/run":
            ok, msg = CoreBenchmarkEngine.run_benchmark()
            self._send_json({"status": "success" if ok else "error", "message": msg})

        # --- PLANOS DE ENERGIA ---
        elif url_path == "/api/power/set":
            plan_type = data.get("plan", "balanced")
            ok, msg = PowerEngine.set_plan(plan_type)
            self._send_json({"status": "success" if ok else "error", "message": msg})

        elif url_path == "/api/power/activate":
            guid = data.get("guid", "")
            ok, msg = PowerEngine.activate_guid(guid)
            self._send_json({"status": "success" if ok else "error", "message": msg})

        elif url_path == "/api/power/delete":
            guid = data.get("guid", "")
            ok, msg = PowerEngine.delete_guid(guid)
            self._send_json({"status": "success" if ok else "error", "message": msg})

        elif url_path == "/api/power/create":
            name = data.get("name", "WinShield Turbo LowLatency")
            mon = data.get("monitor", 0)
            sleep = data.get("standby", 0)
            ok, msg = PowerEngine.create_custom(name, mon, sleep)
            self._send_json({"status": "success" if ok else "error", "message": msg})

        # --- OTIMIZAÇÃO & DEBLOAT ---
        elif url_path == "/api/optimize/run":
            task = data.get("task", "")
            sync = data.get("sync", False)
            if sync:
                ok, title, out, elapsed = OptimizerEngine.run_task_sync(task)
                self._send_json({
                    "status": "success" if ok else "error",
                    "title": title,
                    "output": out,
                    "elapsed": elapsed
                })
            else:
                ok, msg = OptimizerEngine.run(task)
                self._send_json({"status": "success" if ok else "error", "message": msg})

        # --- CONSOLE TERMINAL ---
        elif url_path == "/api/terminal/execute":
            mode = data.get("mode", "POWERSHELL")
            cmd = data.get("cmd", "")
            sync = data.get("sync", True)
            if sync:
                start_t = time.time()
                LogManager.add_log(f"[{mode}/Admin] > {cmd}")
                if mode == "POWERSHELL":
                    code, out = run_ps(cmd, timeout=60)
                else:
                    code, out = run_hidden(cmd, timeout=60)
                elapsed = round(time.time() - start_t, 2)
                self._send_json({
                    "status": "success",
                    "code": code,
                    "output": out.strip() if out else "(Comando executado sem retorno textual)",
                    "elapsed": elapsed,
                    "mode": mode,
                    "cmd": cmd
                })
            else:
                LogManager.add_log(f"[{mode}/Admin] > {cmd}")
                if mode == "POWERSHELL":
                    SystemCommandEngine.run_powershell(cmd, name=cmd[:40])
                else:
                    SystemCommandEngine.run_cmd(cmd, name=cmd[:40])
                self._send_json({"status": "success", "message": "Comando enviado para execução invisível."})

        # --- REDE (PING, VELOCIDADE & REPARO) ---
        elif url_path == "/api/network/ping":
            host = data.get("host", "1.1.1.1")
            count = int(data.get("count", 4))
            res = NetworkEngine.ping_host(host, count=count)
            self._send_json({"status": "success", "result": res})

        elif url_path == "/api/network/ping_all":
            res = NetworkEngine.ping_popular_servers()
            self._send_json({"status": "success", "servers": res})

        elif url_path == "/api/network/speed_test":
            res = NetworkEngine.speed_test()
            self._send_json(res)

        elif url_path == "/api/network/speed_test/start":
            ok, msg = NetworkEngine.start_speed_test()
            self._send_json({"status": "success" if ok else "error", "message": msg})

        elif url_path == "/api/network/repair":
            action = data.get("action", "")
            ok, msg = NetworkEngine.quick_repair(action)
            self._send_json({"status": "success" if ok else "error", "message": msg})

        # --- DISPOSITIVOS & DRIVERS ---
        elif url_path == "/api/devices/check_updates":
            force = bool(data.get("force", False))
            res = DeviceEngine.check_driver_updates(force=force)
            self._send_json(res)

        elif url_path == "/api/devices/pairing":
            force = bool(data.get("force", False))
            paired = DeviceEngine.get_hardware_pairing(force=force)
            self._send_json({"status": "success", "paired_hardware": paired})

        elif url_path == "/api/devices/download":
            ok, msg = DeviceEngine.start_driver_download(
                driver_id=data.get("id"),
                url=data.get("url"),
                filename=data.get("filename"),
                name=data.get("name")
            )
            self._send_json({"status": "success" if ok else "error", "message": msg})

        elif url_path == "/api/devices/install":
            file_path = data.get("file_path")
            ok, msg = DeviceEngine.install_driver(file_path)
            self._send_json({"status": "success" if ok else "error", "message": msg})

        elif url_path == "/api/devices/open_download_folder":
            file_path = data.get("file_path")
            ok, msg = DeviceEngine.open_download_folder(file_path)
            self._send_json({"status": "success" if ok else "error", "message": msg})

        elif url_path == "/api/devices/backup":
            dest = data.get("folder")
            ok, msg = DeviceEngine.backup_drivers(dest)
            self._send_json({"status": "success" if ok else "error", "message": msg})

        # --- TESTE DE ESTABILIDADE DO SISTEMA (STRESSPULSE) ---
        elif url_path == "/api/stress/start":
            ok, msg = StressEngine.start_test(data)
            self._send_json({"status": "success" if ok else "error", "message": msg})

        elif url_path == "/api/stress/stop":
            ok, msg = StressEngine.stop_test()
            self._send_json({"status": "success" if ok else "error", "message": msg})

        elif url_path == "/api/stress/reset":
            ok, msg = StressEngine.reset_stats()
            self._send_json({"status": "success" if ok else "error", "message": msg})

        elif url_path == "/api/logs/clear":
            LogManager.clear()
            self._send_json({"status": "success"})

        # --- GERENCIADOR DE APLICATIVOS (PROGRAMAS ABERTOS & DESINSTALADOR) ---
        elif url_path == "/api/apps/kill":
            pid = data.get("pid")
            exe = data.get("exe")
            ok, msg = AppsManagerEngine.kill_process(pid=pid, exe=exe)
            self._send_json({"status": "success" if ok else "error", "message": msg})

        elif url_path == "/api/apps/uninstall":
            item = data.get("item")
            ok, msg = AppsManagerEngine.uninstall_app(item)
            self._send_json({"status": "success" if ok else "error", "message": msg})

        elif url_path == "/api/apps/open_folder":
            path = data.get("path", "")
            ok, msg = AppsManagerEngine.open_folder(path)
            self._send_json({"status": "success" if ok else "error", "message": msg})

        else:
            self.send_error(404, f"Endpoint POST não encontrado: {url_path}")

    def _send_json(self, data):
        resp = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Content-Length", str(len(resp)))
        self.end_headers()
        self.wfile.write(resp)

    def _resolve_resource(self, filename):
        candidates = [
            resource_path(filename),
            os.path.join(os.getcwd(), filename),
            resource_path("frontend", os.path.basename(filename)),
            os.path.join(os.getcwd(), "frontend", os.path.basename(filename)),
            resource_path("imagens", os.path.basename(filename)),
            os.path.join(os.getcwd(), "imagens", os.path.basename(filename)),
        ]
        for c in candidates:
            if os.path.isfile(c):
                return c
        return None

    def _serve_file(self, filename, content_type):
        target_path = self._resolve_resource(filename)
        if not target_path or not os.path.isfile(target_path):
            self.send_error(404, f"Arquivo {filename} não encontrado.")
            return
        with open(target_path, "rb") as f:
            content = f.read()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)


def find_free_port(preferred=None):
    if preferred:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            s.bind(('127.0.0.1', preferred))
            s.close()
            return preferred
        except Exception:
            pass
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('127.0.0.1', 0))
    port = s.getsockname()[1]
    s.close()
    return port


def launch_desktop_window(url):
    """
    Abre o aplicativo em uma janela Desktop limpa (Modo App do Edge / Chrome).
    Sem barra de ferramentas, sem abas, parecendo um software nativo premium.
    Executado de forma limpa sem console.
    """
    edge_paths = [
        os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%LocalAppData%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe")
    ]
    for ep in edge_paths:
        if os.path.exists(ep):
            try:
                subprocess.Popen(
                    [
                        ep,
                        f"--app={url}",
                        "--window-size=1400,900",
                        "--start-maximized",
                        "--disable-features=msEdgeWebWidget,msEdgeVisualSearch,msEdgeSidebarV2,msHubWindowDragDrop,msEdgeTranslate",
                        "--disable-context-menu",
                        "--no-first-run",
                        "--no-default-browser-check"
                    ],
                    close_fds=True
                )
                return
            except Exception:
                pass

    import webbrowser
    webbrowser.open(url)


def main():
    if IS_WINDOWS and not is_admin():
        elevate_privileges()

    pref_port = int(os.environ.get("WINSHIELD_PORT", 60321))
    port = find_free_port(pref_port)
    server = ThreadingHTTPServer(('127.0.0.1', port), WinShieldRequestHandler)
    app_url = f"http://127.0.0.1:{port}/"

    LogManager.add_log("=== WINSHIELD PRO v6.2 ENTERPRISE INICIADO ===")
    if is_admin():
        LogManager.add_log("[OK] Executando com Privilégios Totais de Administrador (UAC Elevado).")
    else:
        LogManager.add_log("[AVISO] Rodando em modo restrito. Algumas ações no registro e serviços podem falhar.")
    LogManager.add_log("[OK] Modo invisível ativo: Comandos do sistema executam sem abrir janelas.")

    # Pré-carrega métricas do hardware e discos em background para resposta instantânea na UI
    threading.Thread(target=lambda: SystemEngine.static_info(), daemon=True).start()
    threading.Thread(target=lambda: DiskHealthEngine.scan(), daemon=True).start()

    # Lança a janela desktop
    threading.Thread(target=lambda: launch_desktop_window(app_url), daemon=True).start()

    print(f"[WINSHIELD PRO] Servidor Desktop Ativo em {app_url}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[WINSHIELD PRO] Encerrando aplicação...")
        server.shutdown()


if __name__ == "__main__":
    main()
