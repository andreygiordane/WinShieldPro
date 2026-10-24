"""
Controlador REST API: Armazenamento, Saúde S.M.A.R.T., Benchmark e Varredura.
"""

from typing import Dict, Any
from backend.disk_health_engine import DiskHealthEngine
from backend.disk_benchmark_engine import DiskBenchmarkEngine
from backend.disk_scan_engine import SurfaceScanEngine


class DiskController:
    @staticmethod
    def get_health(force: bool = False) -> Dict[str, Any]:
        disks = DiskHealthEngine.scan(force=force)
        return {"status": "success", "disks": disks}

    @staticmethod
    def get_benchmark_status() -> Dict[str, Any]:
        status = DiskBenchmarkEngine.get_status()
        return {"status": "success", "benchmark": status}

    @staticmethod
    def start_benchmark(data: Dict[str, Any]) -> Dict[str, Any]:
        drive = data.get("drive", "C:")
        size = data.get("size", 512)
        ok, msg = DiskBenchmarkEngine.start(drive=drive, size_mb=size)
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def cancel_benchmark() -> Dict[str, Any]:
        ok, msg = DiskBenchmarkEngine.cancel()
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def get_scan_status() -> Dict[str, Any]:
        status = SurfaceScanEngine.get_scan_state()
        return {"status": "success", "scan": status}

    @staticmethod
    def start_scan(data: Dict[str, Any]) -> Dict[str, Any]:
        idx = int(data.get("index", 0))
        quick = bool(data.get("quick", False))
        ok, msg = SurfaceScanEngine.start_scan(drive_index=idx, quick=quick)
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def stop_scan() -> Dict[str, Any]:
        ok, msg = SurfaceScanEngine.stop_scan()
        return {"status": "success" if ok else "error", "message": msg}

    @staticmethod
    def get_features(disk_idx: int = 0) -> Dict[str, Any]:
        feats = HDTuneEngine.get_drive_features(disk_idx)
        return {"status": "success", "features": feats}
