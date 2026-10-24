"""
Portas de Domínio (Interfaces): Limpeza de Disco e Otimização do Sistema.
"""

from typing import Protocol, Dict, Any, List, Optional


class ICleanerPort(Protocol):
    def analyze(self) -> Dict[str, Any]:
        """Calcula o volume de arquivos temporários e caches a liberar."""
        ...

    def clean(self, categories: Optional[List[str]] = None) -> Dict[str, Any]:
        """Executa a destruição segura de arquivos temporários e caches."""
        ...


class IOptimizerPort(Protocol):
    def run_task(self, task_name: str) -> tuple[bool, str]:
        """Dispara rotinas de otimização (SFC, DISM, TRIM, Telemetria)."""
        ...
