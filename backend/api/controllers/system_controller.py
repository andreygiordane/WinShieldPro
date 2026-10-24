"""
Controlador REST API: Métricas do Sistema, Silicon Core™, Vision Engine™ e Gestão de Dispositivos/Drivers Oficiais.
"""

from typing import Dict, Any, Optional
from backend.core import is_admin
import sys
from datetime import datetime
from backend.system_engine import SystemEngine
from backend.hardware_monitor import CoreEngine, VisionEngine, CoreBenchmarkEngine
from backend.device_engine import DeviceEngine


class SystemController:
    @staticmethod
    def get_status() -> Dict[str, Any]:
        return {
            "admin": is_admin(),
            "os": sys.platform,
            "timestamp": datetime.now().strftime("%H:%M:%S")
        }

    @staticmethod
    def get_info() -> Dict[str, Any]:
        return {"status": "success", "info": SystemEngine.static_info()}

    @staticmethod
    def get_live() -> Dict[str, Any]:
        return {"status": "success", "live": SystemEngine.live()}

    @staticmethod
    def get_silicon_info(force: bool = False) -> Dict[str, Any]:
        data = CoreEngine.get_info(force=force)
        return {"status": "success", "silicon": data}

    @staticmethod
    def get_silicon_bench_results() -> Dict[str, Any]:
        return {"status": "success", "bench": CoreBenchmarkEngine.get_results()}

    @staticmethod
    def run_silicon_bench() -> Dict[str, Any]:
        ok, msg = CoreBenchmarkEngine.run_benchmark()
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def get_vision_info() -> Dict[str, Any]:
        data = VisionEngine.get_info()
        return {"status": "success", "vision": data}

    @staticmethod
    def list_devices(force: bool = False) -> Dict[str, Any]:
        data = DeviceEngine.get_devices(force=force)
        return {"status": "success", "devices": data}

    @staticmethod
    def get_hardware_pairing(force: bool = False) -> Dict[str, Any]:
        paired = DeviceEngine.get_hardware_pairing(force=force)
        return {"status": "success", "paired_hardware": paired}

    @staticmethod
    def check_driver_updates(force: bool = False) -> Dict[str, Any]:
        return DeviceEngine.check_driver_updates(force=force)

    @staticmethod
    def start_driver_download(driver_id: str, url: str = None, filename: str = None, name: str = None) -> Dict[str, Any]:
        ok, msg = DeviceEngine.start_driver_download(driver_id, url, filename, name)
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def get_driver_download_status(driver_id: Optional[str] = None) -> Dict[str, Any]:
        status_data = DeviceEngine.get_download_status(driver_id)
        return {"status": "success", "downloads": status_data}

    @staticmethod
    def install_driver(file_path: str) -> Dict[str, Any]:
        ok, msg = DeviceEngine.install_driver(file_path)
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def open_driver_download_folder(file_path: Optional[str] = None) -> Dict[str, Any]:
        ok, msg = DeviceEngine.open_download_folder(file_path)
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def backup_drivers(dest_folder: Optional[str] = None) -> Dict[str, Any]:
        ok, msg = DeviceEngine.backup_drivers(dest_folder)
        return {"status": "success" if ok else "error", "message": msg}

    # Aliases retrocompatíveis
    get_silicon_info = get_silicon_info
    get_silicon_bench_results = get_silicon_bench_results
    run_silicon_bench = run_silicon_bench
    get_vision_info = get_vision_info
