"""
Adaptador de Infraestrutura: Execução de Processos e Scripts Invisíveis no Windows.
"""

from typing import Tuple, Any, Optional
from backend.process import run_hidden, run_ps, run_ps_json, popen_hidden, launch_gui


class ProcessAdapter:
    @staticmethod
    def execute_hidden(cmd: str, timeout: int = 60) -> Tuple[int, str]:
        return run_hidden(cmd, timeout=timeout)

    @staticmethod
    def execute_powershell(script: str, timeout: int = 60) -> Tuple[int, str]:
        return run_ps(script, timeout=timeout)

    @staticmethod
    def execute_powershell_json(script: str, timeout: int = 60) -> Tuple[int, Any]:
        return run_ps_json(script, timeout=timeout)

    @staticmethod
    def launch(cmd: str) -> None:
        launch_gui(cmd)
