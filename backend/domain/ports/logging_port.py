"""
Portas de Domínio (Interfaces): Gestão e Streaming de Logs.
"""

from typing import Protocol, List, Tuple


class ILogPort(Protocol):
    def add_log(self, message: str) -> None:
        """Adiciona uma entrada ao buffer com timestamp."""
        ...

    def get_logs_since(self, index: int) -> Tuple[List[str], int]:
        """Recupera logs incrementais para streaming contínuo."""
        ...

    def clear(self) -> None:
        """Limpa o buffer de logs."""
        ...
