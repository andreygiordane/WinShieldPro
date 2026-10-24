"""
Entidades de Domínio: Segurança, Caçador de Ameaças e Auditoria.
"""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class ThreatItem:
    pid: int
    name: str
    path: str
    risk_level: str  # Critical, High, Medium, Low
    reason: str
    is_signed: bool = False
    signer_name: str = ""
    can_quarantine: bool = True


@dataclass
class DefenderStatus:
    antivirus_enabled: bool
    realtime_protection: bool
    signature_version: str
    last_update: str
    full_scan_age_days: int = 0
