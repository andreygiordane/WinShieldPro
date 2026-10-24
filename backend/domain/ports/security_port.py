"""
Portas de Domínio (Interfaces): Caçador de Ameaças, Defender e Auditoria.
"""

from typing import Protocol, Dict, Any, List


class ISecurityPort(Protocol):
    def scan_threats(self) -> List[Dict[str, Any]]:
        """Executa varredura heurística por masquerades e binários não assinados."""
        ...

    def get_defender_status(self) -> Dict[str, Any]:
        """Consulta telemetria do Microsoft Defender."""
        ...

    def trigger_defender_scan(self, scan_type: str = "quick") -> tuple[bool, str]:
        """Dispara varredura rápida ou completa via Defender."""
        ...


class IAuditPort(Protocol):
    def scan_registry(self) -> List[Dict[str, Any]]:
        """Mapeia programas instalados (inclusive SystemComponent=1 ocultos)."""
        ...

    def scan_appx(self) -> List[Dict[str, Any]]:
        """Mapeia pacotes UWP / AppX da Microsoft Store."""
        ...

    def uninstall_item(self, item: Dict[str, Any]) -> tuple[bool, str]:
        """Desinstala ou remove com segurança o software alvo."""
        ...
