"""
Entidades de Domínio: Métricas e Telemetria do Sistema e Hardware.
Independente de frameworks e bibliotecas externas de SO.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List


@dataclass
class CPUInfo:
    name: str
    cores: int
    threads: int
    clock_mhz: float
    usage_percent: float = 0.0
    temperature_celsius: Optional[float] = None


@dataclass
class MemoryMetrics:
    total_bytes: int
    available_bytes: int
    used_bytes: int
    percent_used: float
    cached_bytes: int = 0


@dataclass
class LiveTelemetry:
    cpu_percent: float
    ram_percent: float
    ram_used_gb: float
    ram_total_gb: float
    disk_active_percent: float = 0.0
    net_sent_kbps: float = 0.0
    net_recv_kbps: float = 0.0
    timestamp: str = ""
    extra: Dict[str, Any] = field(default_factory=dict)
