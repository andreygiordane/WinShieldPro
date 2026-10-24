"""
Casos de Uso da Aplicação: Caçador de Ameaças, Defender e Auditoria.
"""

from typing import Dict, Any, List
from backend.antivirus_engine import AntivirusEngine
from backend.audit_engine import AuditEngine


class ScanThreatsUseCase:
    @staticmethod
    def execute() -> List[Dict[str, Any]]:
        return AntivirusEngine.scan_threats()


class GetDefenderStatusUseCase:
    @staticmethod
    def execute() -> Dict[str, Any]:
        return AntivirusEngine.defender_status()


class TriggerDefenderScanUseCase:
    @staticmethod
    def execute(scan_type: str = "quick") -> tuple[bool, str]:
        return AntivirusEngine.defender_scan(scan_type=scan_type)


class UpdateDefenderSignaturesUseCase:
    @staticmethod
    def execute() -> tuple[bool, str]:
        return AntivirusEngine.defender_update()


class AuditRegistryAppsUseCase:
    @staticmethod
    def execute() -> List[Dict[str, Any]]:
        return AuditEngine.scan_registry()


class AuditAppxPackagesUseCase:
    @staticmethod
    def execute() -> List[Dict[str, Any]]:
        return AuditEngine.scan_appx()


class UninstallApplicationUseCase:
    @staticmethod
    def execute(item: Dict[str, Any]) -> tuple[bool, str]:
        return AuditEngine.uninstall(item)
