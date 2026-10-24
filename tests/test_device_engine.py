"""
Testes Unitários para o Gerenciador de Dispositivos e Atualização de Drivers Oficiais.
Valida o pareamento de hardware (NVIDIA, AMD, Intel, Realtek), canais oficiais e downloads.
"""

import os
from backend.device_engine import DeviceEngine, NVIDIA_PFID_MAP
from backend.api import ApiRouter


def test_nvidia_pfid_map_exists():
    assert isinstance(NVIDIA_PFID_MAP, dict)
    assert "RTX 4060 Ti" in NVIDIA_PFID_MAP
    assert NVIDIA_PFID_MAP["RTX 4060 Ti"] == 1022
    assert NVIDIA_PFID_MAP["RTX 4090"] == 1018


def test_get_hardware_pairing():
    paired = DeviceEngine.get_hardware_pairing()
    assert isinstance(paired, list)
    if paired:
        for item in paired:
            assert "hardware_name" in item
            assert "vendor" in item
            assert "category" in item
            assert "official_portal" in item
            assert item.get("paired") is True


def test_check_driver_updates_structure():
    updates = DeviceEngine.check_driver_updates()
    assert isinstance(updates, dict)
    assert updates.get("status") == "success"
    assert "paired_hardware" in updates
    assert "official_drivers" in updates
    assert "windows_update" in updates
    assert "total_pending" in updates
    assert "checked_at" in updates


def test_download_status_idle():
    status = DeviceEngine.get_download_status("non_existent_driver")
    assert isinstance(status, dict)
    assert status.get("status") == "idle"


def test_api_router_device_pairing_get():
    res = ApiRouter.dispatch_get("/api/devices/pairing")
    assert res is not None
    assert res.get("status") == "success"
    assert "paired_hardware" in res


def test_api_router_device_download_status_get():
    res = ApiRouter.dispatch_get("/api/devices/download_status")
    assert res is not None
    assert res.get("status") == "success"
    assert "downloads" in res


def test_api_router_device_updates_post():
    res = ApiRouter.dispatch_post("/api/devices/check_updates", {})
    assert res is not None
    assert res.get("status") == "success"
    assert "official_drivers" in res
