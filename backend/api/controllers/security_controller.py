"""
Controlador REST API: Caçador de Ameaças, Microsoft Defender e Auditoria.
"""

from typing import Dict, Any
from backend.antivirus_engine import AntivirusEngine
from backend.audit_engine import AuditEngine


class SecurityController:
    @staticmethod
    def get_defender_status() -> Dict[str, Any]:
        stat = AntivirusEngine.defender_status()
        return {"status": "success", "defender": stat}

    @staticmethod
    def get_scan_status() -> Dict[str, Any]:
        scan_st = AntivirusEngine.get_security_scan_status()
        return {"status": "success", "scan": scan_st}

    @staticmethod
    def scan_threats() -> Dict[str, Any]:
        threats = AntivirusEngine.scan_threats()
        return {"status": "success", "threats": threats}

    @staticmethod
    def start_threat_scan(data: Dict[str, Any]) -> Dict[str, Any]:
        deep = bool(data.get("deep", False))
        ok, msg = AntivirusEngine.start_security_scan(deep=deep)
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def stop_threat_scan() -> Dict[str, Any]:
        ok, msg = AntivirusEngine.stop_security_scan()
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def defender_scan(data: Dict[str, Any]) -> Dict[str, Any]:
        st = data.get("type", "quick")
        ok, msg = AntivirusEngine.defender_scan(st)
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def defender_update() -> Dict[str, Any]:
        ok, msg = AntivirusEngine.defender_update()
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def destroy_threat(data: Dict[str, Any]) -> Dict[str, Any]:
        pid = data.get("pid")
        path = data.get("path")
        quarantine = bool(data.get("quarantine", False))
        ok, msg = AntivirusEngine.destroy_threat(pid=pid, file_path=path, quarantine=quarantine)
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def audit_scan(data: Dict[str, Any]) -> Dict[str, Any]:
        scan_type = data.get("type", "registry")
        if scan_type == "registry":
            items = AuditEngine.scan_registry()
        elif scan_type == "appx":
            items = AuditEngine.scan_appx()
        elif scan_type == "services":
            items = AuditEngine.scan_services()
        elif scan_type == "startup":
            items = AuditEngine.scan_startup()
        else:
            items = []
        return {"status": "success", "items": items}

    @staticmethod
    def audit_uninstall(data: Dict[str, Any]) -> Dict[str, Any]:
        item = data.get("item")
        if not item:
            cmd = data.get("cmd", "")
            kind = data.get("kind", "appx" if "Remove-AppxPackage" in cmd else "registry")
            item = {"caminho": cmd, "kind": kind, "nome": "Aplicativo selecionado"}
        ok, msg = AuditEngine.uninstall(item)
        return {"status": "success" if ok else "error", "message": msg}
