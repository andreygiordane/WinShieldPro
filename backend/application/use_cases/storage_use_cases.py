"""
Casos de Uso da Aplicação: Armazenamento, Saúde S.M.A.R.T. e Benchmarking.
"""

from typing import Dict, Any, List
from backend.disk_health_engine import DiskHealthEngine
from backend.disk_benchmark_engine import DiskBenchmarkEngine
from backend.disk_scan_engine import SurfaceScanEngine


class ScanDisksHealthUseCase:
    @staticmethod
    def execute(force: bool = False) -> List[Dict[str, Any]]:
        return DiskHealthEngine.scan(force=force)


class StartDiskBenchmarkUseCase:
    @staticmethod
    def execute(drive: str, size_mb: int = 512) -> tuple[bool, str]:
        return DiskBenchmarkEngine.start(drive=drive, size_mb=size_mb)


class GetDiskBenchmarkStatusUseCase:
    @staticmethod
    def execute() -> Dict[str, Any]:
        return DiskBenchmarkEngine.get_status()


class CancelDiskBenchmarkUseCase:
    @staticmethod
    def execute() -> tuple[bool, str]:
        return DiskBenchmarkEngine.cancel()


class StartSurfaceScanUseCase:
    @staticmethod
    def execute(drive_index: int = 0) -> tuple[bool, str]:
        return SurfaceScanEngine.start_scan(drive_index=drive_index)


class StopSurfaceScanUseCase:
    @staticmethod
    def execute() -> tuple[bool, str]:
        return SurfaceScanEngine.stop_scan()


class GetSurfaceScanStatusUseCase:
    @staticmethod
    def execute() -> Dict[str, Any]:
        return SurfaceScanEngine.get_status()
