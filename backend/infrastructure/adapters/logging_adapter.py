"""
Adaptador de Infraestrutura: Implementação de ILogPort via LogManager.
"""

from typing import List, Tuple
from backend.log_manager import LogManager
from backend.domain.ports.logging_port import ILogPort


class LoggingAdapter(ILogPort):
    def add_log(self, message: str) -> None:
        LogManager.add_log(message)

    def get_logs_since(self, index: int) -> Tuple[List[str], int]:
        return LogManager.get_logs_since(index)

    def clear(self) -> None:
        LogManager.clear()
