"""
Entidades de Domínio: Limpeza de Arquivos, Otimização e Desempenho.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any


@dataclass
class JunkCategory:
    id: str
    name: str
    description: str
    size_bytes: int
    count_files: int
    paths: List[str] = field(default_factory=list)


@dataclass
class OptimizationTaskResult:
    task_id: str
    name: str
    success: bool
    output: str
    elapsed_seconds: float
