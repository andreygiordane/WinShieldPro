"""
Testes Unitários da Clean Architecture (Hexagonal / Ports & Adapters).
Valida entidades de domínio, casos de uso, adaptadores e roteador REST.
"""

from backend.domain.entities import (
    CPUInfo,
    MemoryMetrics,
    LiveTelemetry,
    DiskHealthInfo,
    ThreatItem,
    JunkCategory,
)
from backend.application.use_cases import (
    GetSystemOverviewUseCase,
    GetLiveTelemetryUseCase,
    ScanThreatsUseCase,
    GetDefenderStatusUseCase,
    AnalyzeJunkFilesUseCase,
)
from backend.infrastructure.adapters import LoggingAdapter, ProcessAdapter
from backend.api import ApiRouter


def test_domain_entities_instantiation():
    cpu = CPUInfo(name="AMD Ryzen 7", cores=8, threads=16, clock_mhz=3800.0)
    assert cpu.name == "AMD Ryzen 7"
    assert cpu.cores == 8

    mem = MemoryMetrics(
        total_bytes=16_000_000_000,
        available_bytes=8_000_000_000,
        used_bytes=8_000_000_000,
        percent_used=50.0,
    )
    assert mem.percent_used == 50.0

    threat = ThreatItem(pid=1234, name="unknown.exe", path="C:\\Temp", risk_level="High", reason="Unsigned")
    assert threat.risk_level == "High"

    junk = JunkCategory(id="temp", name="Arquivos Temporários", description="Cache", size_bytes=1024, count_files=10)
    assert junk.count_files == 10


def test_logging_adapter():
    adapter = LoggingAdapter()
    adapter.clear()
    logs, _ = adapter.get_logs_since(0)
    assert len(logs) == 0

    adapter.add_log("Teste Clean Architecture Adapter")
    logs, last_idx = adapter.get_logs_since(0)
    assert len(logs) == 1
    assert "Clean Architecture" in logs[0]
    adapter.clear()


def test_api_router_dispatch_get_status():
    res = ApiRouter.dispatch_get("/api/status")
    assert res is not None
    assert "admin" in res
    assert "os" in res


def test_api_router_dispatch_system_info():
    res = ApiRouter.dispatch_get("/api/system/info")
    assert res is not None
    assert res.get("status") == "success"
    assert "info" in res


def test_api_router_dispatch_clean_status():
    res = ApiRouter.dispatch_get("/api/clean/status")
    assert res is not None
    assert res.get("status") == "success"


def test_use_cases_execution():
    overview = GetSystemOverviewUseCase.execute()
    assert isinstance(overview, dict)

    live = GetLiveTelemetryUseCase.execute()
    assert isinstance(live, dict)

    threats = ScanThreatsUseCase.execute()
    assert isinstance(threats, list)
