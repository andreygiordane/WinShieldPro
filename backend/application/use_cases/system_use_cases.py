"""
Casos de Uso da Aplicação: Métricas do Sistema e Hardware.
"""

from typing import Dict, Any
from backend.system_engine import SystemEngine
from backend.hardware_monitor import CoreEngine, VisionEngine, CoreBenchmarkEngine
from backend.device_engine import DeviceEngine


class GetSystemOverviewUseCase:
    @staticmethod
    def execute() -> Dict[str, Any]:
        return SystemEngine.static_info()


class GetLiveTelemetryUseCase:
    @staticmethod
    def execute() -> Dict[str, Any]:
        return SystemEngine.live()


class GetSiliconCoreDetailsUseCase:
    @staticmethod
    def execute() -> Dict[str, Any]:
        return CoreEngine.get_info()

GetSiliconCoreDetailsUseCase = GetSiliconCoreDetailsUseCase


class GetVisionEngineDetailsUseCase:
    @staticmethod
    def execute() -> Dict[str, Any]:
        return VisionEngine.get_info()

GetVisionEngineDetailsUseCase = GetVisionEngineDetailsUseCase


class RunCPUBenchmarkUseCase:
    @staticmethod
    def execute() -> tuple[bool, str]:
        return CoreBenchmarkEngine.run_benchmark()


class ListDevicesUseCase:
    @staticmethod
    def execute() -> Dict[str, Any]:
        return DeviceEngine.list_devices()
