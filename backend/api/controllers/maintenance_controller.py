"""
Controlador REST API: Limpeza de Disco e Otimizações do Windows.
"""

from typing import Dict, Any
from backend.cleaner_engine import CleanerEngine
from backend.optimizer_engine import OptimizerEngine


class MaintenanceController:
    @staticmethod
    def get_clean_status() -> Dict[str, Any]:
        st = CleanerEngine.get_status()
        return {"status": "success", "clean": st, "cleaner": st}

    @staticmethod
    def analyze_clean() -> Dict[str, Any]:
        res = CleanerEngine.analyze()
        return {"status": "success", "results": res}

    @staticmethod
    def start_analyze() -> Dict[str, Any]:
        ok, msg = CleanerEngine.start_analyze()
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def start_clean(data: Dict[str, Any]) -> Dict[str, Any]:
        cats = data.get("categories", None)
        ok, msg = CleanerEngine.start_clean(cats)
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def execute_clean(data: Dict[str, Any]) -> Dict[str, Any]:
        cats = data.get("categories", None)
        res = CleanerEngine.clean(cats)
        return {"status": "success", "results": res}

    @staticmethod
    def get_optimize_profile(force: bool = False) -> Dict[str, Any]:
        p = OptimizerEngine.get_hardware_profile(force=force)
        return {"status": "success", "profile": p}

    @staticmethod
    def run_optimization(data: Dict[str, Any]) -> Dict[str, Any]:
        task = data.get("task", "")
        sync = data.get("sync", False)
        if sync:
            ok, title, out, elapsed = OptimizerEngine.run_task_sync(task)
            return {
                "status": "success" if ok else "error",
                "title": title,
                "output": out,
                "elapsed": elapsed
            }
        else:
            ok, msg = OptimizerEngine.run(task)
            return {"status": "success" if ok else "error", "message": msg}
