"""
Camada de Apresentação / REST API (Clean Architecture).
Contém os controladores desacoplados e o roteador central.
"""

from backend.api.controllers import *
from backend.api.router import ApiRouter

__all__ = [
    "ApiRouter",
    "SystemController",
    "DiskController",
    "SecurityController",
    "MaintenanceController",
    "NetworkController",
    "PowerController",
    "AppsController",
    "StressController",
    "LogsController",
]
