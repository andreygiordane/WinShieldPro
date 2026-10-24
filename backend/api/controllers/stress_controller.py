"""
Controlador REST API: Teste de Estabilidade do Sistema (WinShield StressPulse™).
"""

from typing import Dict, Any
from backend.stress_engine import StressEngine


class StressController:
    @staticmethod
    def get_status() -> Dict[str, Any]:
        st = StressEngine.get_status()
        return {"status": "success", "stress": st}

    @staticmethod
    def start(data: Dict[str, Any]) -> Dict[str, Any]:
        ok, msg = StressEngine.start_test(data)
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def stop() -> Dict[str, Any]:
        ok, msg = StressEngine.stop_test()
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def reset() -> Dict[str, Any]:
        ok, msg = StressEngine.reset_stats()
        return {"status": "success" if ok else "error", "message": msg}
