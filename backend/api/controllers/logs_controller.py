"""
Controlador REST API: Logs do Sistema e Streaming.
"""

from typing import Dict, Any
from backend.log_manager import LogManager


class LogsController:
    @staticmethod
    def get_logs(index: int = 0) -> Dict[str, Any]:
        logs, total = LogManager.get_logs_since(index)
        return {"logs": logs, "total": total}

    @staticmethod
    def clear() -> Dict[str, Any]:
        LogManager.clear()
        return {"status": "success"}
