"""
Portas de Domínio (Interfaces): Armazenamento, Saúde S.M.A.R.T. e Benchmarking.
"""

from typing import Protocol, Dict, Any, List


class IDiskHealthPort(Protocol):
    def scan_disks(self, force: bool = False) -> List[Dict[str, Any]]:
        """Varre e calcula a saúde dos discos físicos via SMART e IOCTL NVMe."""
        ...


class IDiskBenchmarkPort(Protocol):
    def start_benchmark(self, drive: str, sample_mb: int = 512) -> tuple[bool, str]:
        """Inicia teste físico de velocidade Direct I/O."""
        ...

    def get_status(self) -> Dict[str, Any]:
        """Retorna o estado atual do benchmark e métricas parciais."""
        ...

    def cancel(self) -> tuple[bool, str]:
        """Interrompe o benchmark em andamento com segurança."""
        ...
