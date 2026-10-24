from backend.domain.entities.system import CPUInfo, MemoryMetrics, LiveTelemetry
from backend.domain.entities.storage import SmartAttribute, DiskHealthInfo, BenchmarkResult
from backend.domain.entities.security import ThreatItem, DefenderStatus
from backend.domain.entities.maintenance import JunkCategory, OptimizationTaskResult

__all__ = [
    "CPUInfo",
    "MemoryMetrics",
    "LiveTelemetry",
    "SmartAttribute",
    "DiskHealthInfo",
    "BenchmarkResult",
    "ThreatItem",
    "DefenderStatus",
    "JunkCategory",
    "OptimizationTaskResult",
]
