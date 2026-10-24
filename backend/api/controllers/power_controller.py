"""
Controlador REST API: Planos de Energia.
"""

from typing import Dict, Any
from backend.power_engine import PowerEngine


class PowerController:
    @staticmethod
    def list_schemes() -> Dict[str, Any]:
        schemes = PowerEngine.list_schemes()
        return {"schemes": schemes}

    @staticmethod
    def set_plan(data: Dict[str, Any]) -> Dict[str, Any]:
        plan_type = data.get("plan", "balanced")
        ok, msg = PowerEngine.set_plan(plan_type)
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def activate_guid(data: Dict[str, Any]) -> Dict[str, Any]:
        guid = data.get("guid", "")
        ok, msg = PowerEngine.activate_guid(guid)
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def delete_guid(data: Dict[str, Any]) -> Dict[str, Any]:
        guid = data.get("guid", "")
        ok, msg = PowerEngine.delete_guid(guid)
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def create_custom(data: Dict[str, Any]) -> Dict[str, Any]:
        name = data.get("name", "WinShield Turbo LowLatency")
        mon = data.get("monitor", 0)
        sleep = data.get("standby", 0)
        ok, msg = PowerEngine.create_custom(name, mon, sleep)
        return {"status": "success" if ok else "error", "message": msg}
