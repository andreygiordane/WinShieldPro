"""
Controlador REST API: Gerenciamento de Processos, Apps e Memória.
"""

from typing import Dict, Any
from backend.app_manager_engine import AppsManagerEngine
from backend.memory_engine import MemoryEngine


class AppsController:
    @staticmethod
    def list_running() -> Dict[str, Any]:
        apps = AppsManagerEngine.list_running_apps()
        return {"status": "success", "apps": apps}

    @staticmethod
    def kill_process(data: Dict[str, Any]) -> Dict[str, Any]:
        pid = data.get("pid")
        exe = data.get("exe")
        ok, msg = AppsManagerEngine.kill_process(pid=pid, exe=exe)
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def uninstall_app(data: Dict[str, Any]) -> Dict[str, Any]:
        item = data.get("item")
        ok, msg = AppsManagerEngine.uninstall_app(item)
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def open_folder(data: Dict[str, Any]) -> Dict[str, Any]:
        path = data.get("path", "")
        ok, msg = AppsManagerEngine.open_folder(path)
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def get_memory_info() -> Dict[str, Any]:
        mem = MemoryEngine.get_memory_info()
        return {"status": "success", "memory": mem}

    @staticmethod
    def start_memory_test(data: Dict[str, Any]) -> Dict[str, Any]:
        pct = int(data.get("percent", 80))
        ok, msg = MemoryEngine.start_memory_test(percent=pct)
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def stop_memory_test() -> Dict[str, Any]:
        ok, msg = MemoryEngine.stop_memory_test()
        return {"status": "success" if ok else "error", "message": msg}
