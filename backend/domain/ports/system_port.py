"""
Portas de Domínio (Interfaces): Monitoramento e Telemetria de Hardware/Sistema.
"""

from typing import Protocol, Dict, Any, List


class ISystemPort(Protocol):
    def get_static_info(self) -> Dict[str, Any]:
        """Coleta informações estáticas do hardware, CPU, BIOS e SO."""
        ...

    def get_live_telemetry(self) -> Dict[str, Any]:
        """Coleta métricas em tempo real de CPU, RAM, GPU e Discos."""
        ...


class IHardwareMonitorPort(Protocol):
    def get_silicon_data(self) -> Dict[str, Any]:
        """Dados aprofundados do processador (WinShield Silicon Core™)."""
        ...

    def get_vision_data(self) -> Dict[str, Any]:
        """Dados aprofundados e sensores ao vivo da GPU (WinShield Vision Engine™)."""
        ...
