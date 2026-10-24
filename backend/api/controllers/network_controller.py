"""
Controlador REST API: Rede, Velocidade e Reparo.
"""

from typing import Dict, Any
from backend.network_engine import NetworkEngine


class NetworkController:
    @staticmethod
    def get_info() -> Dict[str, Any]:
        info = NetworkEngine.get_network_info()
        return {"status": "success", "network": info}

    @staticmethod
    def get_speed_test_status() -> Dict[str, Any]:
        st = NetworkEngine.get_speed_test_status()
        return {"status": "success", "speed": st}

    @staticmethod
    def ping(data: Dict[str, Any]) -> Dict[str, Any]:
        host = data.get("host", "1.1.1.1")
        count = int(data.get("count", 4))
        res = NetworkEngine.ping_host(host, count=count)
        return {"status": "success", "result": res}

    @staticmethod
    def ping_all() -> Dict[str, Any]:
        res = NetworkEngine.ping_popular_servers()
        return {"status": "success", "servers": res}

    @staticmethod
    def start_speed_test() -> Dict[str, Any]:
        ok, msg = NetworkEngine.start_speed_test()
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def repair(data: Dict[str, Any]) -> Dict[str, Any]:
        action = data.get("action", "")
        ok, msg = NetworkEngine.quick_repair(action)
        return {"status": "success" if ok else "error", "message": msg}
