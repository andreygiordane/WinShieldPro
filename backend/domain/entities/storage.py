"""
Entidades de Domínio: Armazenamento, S.M.A.R.T. e Benchmarks de Disco.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any


@dataclass
class SmartAttribute:
    id_hex: str
    name: str
    current: int
    worst: int
    threshold: int
    raw_value: int
    status: str = "OK"


@dataclass
class DiskHealthInfo:
    index: int
    model: str
    interface: str  # NVMe, SATA, USB
    health_score: int
    health_status: str
    temperature: Optional[int] = None
    power_on_hours: Optional[int] = None
    total_written_tb: Optional[float] = None
    serial_number: str = ""
    firmware: str = ""
    partitions: List[str] = field(default_factory=list)
    attributes: List[SmartAttribute] = field(default_factory=list)


@dataclass
class BenchmarkResult:
    drive_letter: str
    seq_read_mbps: float
    seq_write_mbps: float
    rnd_read_iops: float
    rnd_write_iops: float
    status: str = "Completed"
    elapsed_seconds: float = 0.0
