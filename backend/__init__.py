# WinShield Pro - Backend Package (Clean Architecture)
# Camadas da Clean Architecture / Hexagonal Architecture
from backend.domain import *
from backend.application import *
from backend.infrastructure import *
from backend.api import ApiRouter

# Compatibilidade total com módulos e motores existentes
from backend.core import is_admin, elevate_privileges, base_dir, resource_path, IS_WINDOWS
from backend.log_manager import LogManager
from backend.process import run_hidden, run_ps, run_ps_json, popen_hidden, launch_gui
from backend.cmd_engine import SystemCommandEngine, JobManager
from backend.audit_engine import AuditEngine
from backend.antivirus_engine import AntivirusEngine
from backend.cleaner_engine import CleanerEngine
from backend.power_engine import PowerEngine
from backend.optimizer_engine import OptimizerEngine
from backend.system_engine import SystemEngine
from backend.disk_health_engine import DiskHealthEngine
from backend.disk_benchmark_engine import DiskBenchmarkEngine
from backend.disk_scan_engine import SurfaceScanEngine
from backend.hardware_monitor import CoreEngine, CoreBenchmarkEngine, VisionEngine
from backend.stress_engine import StressEngine
