"""
Casos de Uso da Aplicação: Limpeza de Arquivos, Otimizações do SO e Rede.
"""

from typing import Dict, Any, List, Optional
from backend.cleaner_engine import CleanerEngine
from backend.optimizer_engine import OptimizerEngine
from backend.network_engine import NetworkEngine
from backend.memory_engine import MemoryEngine


class AnalyzeJunkFilesUseCase:
    @staticmethod
    def execute() -> Dict[str, Any]:
        return CleanerEngine.analyze()


class ExecuteCleanerUseCase:
    @staticmethod
    def execute(categories: Optional[List[str]] = None) -> Dict[str, Any]:
        return CleanerEngine.clean(selected_categories=categories)


class RunSystemOptimizationUseCase:
    @staticmethod
    def execute(task: str) -> tuple[bool, str]:
        return OptimizerEngine.run(task)


class OptimizeMemoryUseCase:
    @staticmethod
    def execute() -> Dict[str, Any]:
        return MemoryEngine.optimize()


class PingNetworkUseCase:
    @staticmethod
    def execute(host: str = "1.1.1.1", count: int = 4) -> Dict[str, Any]:
        return NetworkEngine.ping_host(host=host, count=count)


class QuickNetworkRepairUseCase:
    @staticmethod
    def execute(action: str = "") -> tuple[bool, str]:
        return NetworkEngine.quick_repair(action=action)
