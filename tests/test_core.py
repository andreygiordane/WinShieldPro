import os
from backend.core import base_dir, resource_path, app_data_dir, APP_NAME, APP_VERSION


def test_app_constants():
    assert APP_NAME == "WinShield Pro"
    assert APP_VERSION == "7.0"


def test_base_dir_exists():
    root = base_dir()
    assert os.path.isdir(root)
    assert os.path.exists(os.path.join(root, "backend"))


def test_resource_path_resolution():
    backend_path = resource_path("backend")
    assert os.path.isdir(backend_path)


def test_app_data_dir_creation():
    data_dir = app_data_dir()
    assert os.path.exists(data_dir)
    assert "WinShieldPro" in data_dir
