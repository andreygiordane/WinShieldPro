"""
Roteador REST Centralizado (Clean Architecture - Presentation Layer).
Mapeia requisições HTTP para os controladores especializados de domínio.
"""

from typing import Dict, Any, Optional
from backend.api.controllers import (
    SystemController,
    DiskController,
    SecurityController,
    MaintenanceController,
    NetworkController,
    PowerController,
    AppsController,
    StressController,
    LogsController,
)


class ApiRouter:
    @classmethod
    def dispatch_get(cls, path: str, full_path: str = "") -> Optional[Dict[str, Any]]:
        # --- SISTEMA & HARDWARE ---
        if path == "/api/status":
            return SystemController.get_status()
        elif path == "/api/system/info":
            return SystemController.get_info()
        elif path == "/api/system/live":
            return SystemController.get_live()
        elif path == "/api/silicon/info":
            force = any(k in full_path for k in ("force=1", "force=true", "refresh=1", "refresh=true"))
            return SystemController.get_silicon_info(force=force)
        elif path == "/api/silicon/bench/results":
            return SystemController.get_silicon_bench_results()
        elif path == "/api/vision/info":
            return SystemController.get_vision_info()
        elif path == "/api/devices/list":
            force = any(k in full_path for k in ("force=1", "force=true", "refresh=1", "refresh=true"))
            return SystemController.list_devices(force=force)
        elif path == "/api/devices/pairing":
            force = any(k in full_path for k in ("force=1", "force=true", "refresh=1", "refresh=true"))
            return SystemController.get_hardware_pairing(force=force)
        elif path == "/api/devices/download_status":
            driver_id = None
            if "id=" in full_path:
                try:
                    driver_id = full_path.split("id=")[1].split("&")[0]
                except Exception:
                    driver_id = None
            return SystemController.get_driver_download_status(driver_id=driver_id)

        # --- ARMAZENAMENTO & DISCOS ---
        elif path == "/api/disks/health":
            force = any(k in full_path for k in ("force=1", "force=true", "refresh=1", "refresh=true"))
            return DiskController.get_health(force=force)
        elif path == "/api/disks/benchmark/status":
            return DiskController.get_benchmark_status()
        elif path == "/api/disks/scan/status":
            return DiskController.get_scan_status()
        elif path == "/api/disks/features":
            disk_idx = 0
            if "disk=" in full_path:
                try:
                    disk_idx = int(full_path.split("disk=")[1].split("&")[0])
                except Exception:
                    disk_idx = 0
            return DiskController.get_features(disk_idx=disk_idx)

        # --- SEGURANÇA & DEFENDER ---
        elif path == "/api/antivirus/status":
            return SecurityController.get_defender_status()
        elif path == "/api/antivirus/scan_status":
            return SecurityController.get_scan_status()

        # --- LIMPEZA & OTIMIZAÇÃO ---
        elif path == "/api/clean/status":
            return MaintenanceController.get_clean_status()
        elif path == "/api/optimize/profile":
            force = any(k in full_path for k in ("force=1", "force=true", "refresh=1", "refresh=true"))
            return MaintenanceController.get_optimize_profile(force=force)

        # --- PLANOS DE ENERGIA ---
        elif path == "/api/power/list":
            return PowerController.list_schemes()

        # --- REDE & INTERNET ---
        elif path == "/api/network/info":
            return NetworkController.get_info()
        elif path == "/api/network/speed_test/status":
            return NetworkController.get_speed_test_status()

        # --- PROCESSOS, MEMÓRIA & APPS ---
        elif path == "/api/apps/running":
            return AppsController.list_running()
        elif path == "/api/memory/info":
            return AppsController.get_memory_info()
        elif path == "/api/memory/test/status":
            return AppsController.get_memory_test_status()

        # --- TESTE DE ESTABILIDADE (WINSHIELD STRESSPULSE) ---
        elif path == "/api/stress/status":
            return StressController.get_status()

        # --- LOGS & TELEMETRIA ---
        elif path == "/api/logs":
            since = 0
            if "since=" in full_path:
                try:
                    since = int(full_path.split("since=")[1].split("&")[0])
                except Exception:
                    since = 0
            return LogsController.get_logs(since=since)

        return None

    @classmethod
    def dispatch_post(cls, path: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        # --- AUDITORIA DE PROGRAMAS ---
        if path == "/api/audit/scan":
            return AppsController.audit_scan(data.get("type", "registry"))
        elif path == "/api/audit/unhide":
            return AppsController.audit_unhide(data.get("root", "HKLM"), data.get("subkey", ""))
        elif path == "/api/audit/uninstall":
            return AppsController.audit_uninstall(data)

        # --- DISPOSITIVOS & DRIVERS ---
        elif path == "/api/devices/check_updates":
            return SystemController.check_driver_updates(force=data.get("force", False))
        elif path == "/api/devices/pairing":
            return SystemController.get_hardware_pairing(force=data.get("force", False))
        elif path == "/api/devices/download":
            return SystemController.start_driver_download(
                driver_id=data.get("id"),
                url=data.get("url"),
                filename=data.get("filename"),
                name=data.get("name")
            )
        elif path == "/api/devices/install":
            return SystemController.install_driver(file_path=data.get("file_path"))
        elif path == "/api/devices/open_download_folder":
            return SystemController.open_driver_download_folder(file_path=data.get("file_path"))
        elif path == "/api/devices/backup":
            return SystemController.backup_drivers(dest_folder=data.get("folder"))

        # --- BENCHMARK DE SILÍCIO ---
        elif path == "/api/silicon/bench/run":
            return SystemController.run_silicon_bench()

        # --- BENCHMARK DE DISCO ---
        elif path == "/api/disks/benchmark/run":
            return DiskController.run_benchmark(data)

        # --- SURFACE SCAN DE DISCO ---
        elif path == "/api/disks/scan/start":
            return DiskController.start_scan(data)
        elif path == "/api/disks/scan/pause":
            return DiskController.pause_scan()
        elif path == "/api/disks/scan/resume":
            return DiskController.resume_scan()
        elif path == "/api/disks/scan/stop":
            return DiskController.stop_scan()
        elif path == "/api/disks/repair":
            return DiskController.repair(data)

        # --- ANTIVÍRUS & DEFENDER ---
        elif path == "/api/antivirus/toggle_rtp":
            return SecurityController.toggle_rtp(data.get("enabled", False))
        elif path == "/api/antivirus/quick_scan":
            return SecurityController.quick_scan()
        elif path == "/api/antivirus/start_threat_scan":
            return SecurityController.start_threat_scan()
        elif path == "/api/antivirus/kill_threat":
            return SecurityController.kill_threat(data)

        # --- LIMPEZA DE TEMPORÁRIOS ---
        elif path == "/api/clean/analyze":
            return MaintenanceController.analyze_clean()
        elif path == "/api/clean/execute":
            return MaintenanceController.execute_clean(data)
        elif path == "/api/clean/start_analyze":
            return MaintenanceController.start_analyze()
        elif path == "/api/clean/start_clean":
            return MaintenanceController.start_clean(data)

        # --- OTIMIZAÇÃO DO WINDOWS ---
        elif path == "/api/optimize/run":
            return MaintenanceController.run_optimization(data)

        # --- PLANOS DE ENERGIA ---
        elif path == "/api/power/set":
            return PowerController.set_plan(data)
        elif path == "/api/power/activate":
            return PowerController.activate_guid(data)
        elif path == "/api/power/delete":
            return PowerController.delete_guid(data)
        elif path == "/api/power/create":
            return PowerController.create_custom(data)

        # --- REDE & REPAROS ---
        elif path == "/api/network/ping":
            return NetworkController.ping(data)
        elif path == "/api/network/ping_all":
            return NetworkController.ping_all()
        elif path == "/api/network/speed_test/start":
            return NetworkController.start_speed_test()
        elif path == "/api/network/repair":
            return NetworkController.repair(data)

        # --- MEMÓRIA & APPS ---
        elif path == "/api/memory/test/start":
            return AppsController.start_memory_test(data)
        elif path == "/api/memory/test/stop":
            return AppsController.stop_memory_test()
        elif path == "/api/apps/kill":
            return AppsController.kill_process(data)
        elif path == "/api/apps/uninstall":
            return AppsController.uninstall_app(data)
        elif path == "/api/apps/open_folder":
            return AppsController.open_folder(data)

        # --- TESTE DE ESTABILIDADE (WINSHIELD STRESSPULSE) ---
        elif path == "/api/stress/start":
            return StressController.start(data)
        elif path == "/api/stress/stop":
            return StressController.stop()
        elif path == "/api/stress/reset":
            return StressController.reset()

        # --- LOGS ---
        elif path == "/api/logs/clear":
            return LogsController.clear()

        return None
