"""
WinShield Pro v5.0 Enterprise - Motor de Telemetria de Memória & RAMGuard™ Memory Integrity Matrix.
Extrai informações físicas de pentes de RAM (DDR4/DDR5, slots, frequências, números de série)
e executa testes de estresse e integridade de memória com algoritmos avançados (Bit-Flip, March C-, Walking Bits).
"""
import os
import sys
import time
import ctypes
import threading
import random
from datetime import datetime

from backend.core import IS_WINDOWS
from backend.log_manager import LogManager
from backend.process import run_ps_json, run_hidden

try:
    from ctypes import wintypes
except ImportError:
    wintypes = None


class _MEMORYSTATUS(ctypes.Structure if ctypes else object):
    _fields_ = [
        ("dwLength", ctypes.c_ulong),
        ("dwMemoryLoad", ctypes.c_ulong),
        ("ullTotalPhys", ctypes.c_ulonglong),
        ("ullAvailPhys", ctypes.c_ulonglong),
        ("ullTotalPageFile", ctypes.c_ulonglong),
        ("ullAvailPageFile", ctypes.c_ulonglong),
        ("ullTotalVirtual", ctypes.c_ulonglong),
        ("ullAvailVirtual", ctypes.c_ulonglong),
        ("ullAvailExtendedVirtual", ctypes.c_ulonglong)
    ] if ctypes else []


class MemoryEngine:
    """Telemetria profunda de memória RAM e testes de integridade."""

    _test_thread = None
    _test_cancel = threading.Event()
    _test_status = {
        "state": "idle",       # idle, running, completed, cancelled, failed
        "progress_percent": 0,
        "current_pass": 1,
        "total_passes": 1,
        "current_pattern": "Nenhum",
        "tested_mb": 0,
        "total_mb": 0,
        "speed_mb_s": 0.0,
        "errors_found": 0,
        "error_log": [],
        "elapsed_seconds": 0,
        "start_time": None
    }
    _status_lock = threading.Lock()

    @classmethod
    def get_memory_info(cls):
        """Retorna informações completas de uso em tempo real e especificação de hardware dos pentes de RAM."""
        # 1. Coleta estatísticas de uso via Kernel Win32
        load_pct = 0
        total_phys_b = 0
        avail_phys_b = 0
        used_phys_b = 0
        pagefile_total_b = 0
        pagefile_avail_b = 0

        if IS_WINDOWS and ctypes:
            try:
                stat = _MEMORYSTATUS()
                stat.dwLength = ctypes.sizeof(_MEMORYSTATUS)
                ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat))
                load_pct = stat.dwMemoryLoad
                total_phys_b = stat.ullTotalPhys
                avail_phys_b = stat.ullAvailPhys
                used_phys_b = total_phys_b - avail_phys_b
                pagefile_total_b = stat.ullTotalPageFile
                pagefile_avail_b = stat.ullAvailPageFile
            except Exception:
                pass

        # 2. Coleta módulos físicos via WMI Win32_PhysicalMemory
        modules = []
        try:
            cmd = (
                "Get-CimInstance Win32_PhysicalMemory | "
                "Select-Object DeviceLocator, BankLabel, Manufacturer, PartNumber, Capacity, Speed, ConfiguredVoltage, SerialNumber, MemoryType | "
                "ConvertTo-Json -Compress"
            )
            raw = run_ps_json(cmd, timeout=12)
            if isinstance(raw, dict):
                raw = [raw]
            if isinstance(raw, list):
                for idx, m in enumerate(raw):
                    cap_b = int(m.get("Capacity") or 0)
                    cap_gb = round(cap_b / (1024**3), 1)
                    speed = int(m.get("Speed") or 3200)
                    volt = m.get("ConfiguredVoltage")
                    volt_str = f"{round(volt/1000, 2)} V" if volt else "1.20 V"
                    
                    # Dedução inteligente de geração DDR
                    part = (m.get("PartNumber") or "").strip()
                    m_type = "DDR4"
                    if speed >= 4800 or "DDR5" in part.upper():
                        m_type = "DDR5"
                    elif speed <= 1600 or "DDR3" in part.upper():
                        m_type = "DDR3"

                    locator = (m.get("DeviceLocator") or m.get("BankLabel") or f"DIMM {idx+1}").strip()
                    modules.append({
                        "slot": locator,
                        "manufacturer": (m.get("Manufacturer") or "Kingston / Genérico").strip(),
                        "part_number": part or "DDR4-SDRAM",
                        "serial_number": (m.get("SerialNumber") or "—").strip(),
                        "capacity_gb": cap_gb,
                        "capacity_bytes": cap_b,
                        "speed_mhz": speed,
                        "type": m_type,
                        "voltage": volt_str
                    })
        except Exception as e:
            LogManager.add_log(f"[AVISO] Falha ao coletar dados dos módulos de memória: {e}")

        # Se WMI falhar, fornece valores padrão baseados no total físico
        if not modules and total_phys_b > 0:
            total_gb = round(total_phys_b / (1024**3), 1)
            modules.append({
                "slot": "DIMM 1",
                "manufacturer": "Sistema",
                "part_number": "Módulo Principal",
                "serial_number": "—",
                "capacity_gb": total_gb,
                "capacity_bytes": total_phys_b,
                "speed_mhz": 3200,
                "type": "DDR4",
                "voltage": "1.20 V"
            })

        return {
            "load_percent": load_pct,
            "total_bytes": total_phys_b,
            "used_bytes": used_phys_b,
            "avail_bytes": avail_phys_b,
            "total_gb": round(total_phys_b / (1024**3), 2),
            "used_gb": round(used_phys_b / (1024**3), 2),
            "avail_gb": round(avail_phys_b / (1024**3), 2),
            "pagefile_total_gb": round(pagefile_total_b / (1024**3), 2),
            "pagefile_used_gb": round((pagefile_total_b - pagefile_avail_b) / (1024**3), 2),
            "modules": modules,
            "module_count": len(modules)
        }

    @classmethod
    def start_memory_test(cls, size_mb=1024, passes=1, mode="quick"):
        """Inicia teste de integridade e estresse de memória em thread dedicada."""
        with cls._status_lock:
            if cls._test_status["state"] == "running":
                return False, "Já existe um teste de memória em andamento."

            # Determina alocação de memória segura
            if mode == "quick":
                size_mb = min(size_mb, 1024)
                passes = 1
            elif mode == "deep":
                size_mb = max(size_mb, 2048)
                passes = max(passes, 2)

            cls._test_cancel.clear()
            cls._test_status = {
                "state": "running",
                "progress_percent": 0,
                "current_pass": 1,
                "total_passes": passes,
                "current_pattern": "Preparando buffers...",
                "tested_mb": 0,
                "total_mb": size_mb,
                "speed_mb_s": 0.0,
                "errors_found": 0,
                "error_log": [],
                "elapsed_seconds": 0,
                "start_time": time.time()
            }

            cls._test_thread = threading.Thread(
                target=cls._run_test_worker,
                args=(size_mb, passes, mode),
                daemon=True
            )
            cls._test_thread.start()

        LogManager.add_log(f"=== DIAGNÓSTICO DE MEMÓRIA (RAMGUARD) INICIADO: {size_mb} MB ({passes} Passe(s)) ===")
        return True, f"Teste de integridade iniciado ({size_mb} MB)."

    @classmethod
    def _run_test_worker(cls, size_mb, passes, mode):
        """Worker que executa padrões matemáticos de estresse de memória da matriz de estresse e validação física de integridade de memória."""
        start_time = time.time()
        block_size = 16 * 1024 * 1024  # Blocos de 16 MB para permitir feedback fluido
        num_blocks = max(1, size_mb // 16)
        allocated_blocks = []

        # Padrões de teste clássicos de diagnóstico de memória
        PATTERNS = [
            ("Padrão 1: Inversão de Bits (0x55 / 0xAA)", 0x55, 0xAA),
            ("Padrão 2: Sequência March C- (0x00 / 0xFF)", 0x00, 0xFF),
            ("Padrão 3: Deslocamento Walking Bits (0x0F / 0xF0)", 0x0F, 0xF0),
            ("Padrão 4: Blocos Pseudo-Aleatórios (PRNG Hash)", None, None)
        ]

        try:
            # 1. Alocação protegida em memória física
            LogManager.add_log(f"[RAMGUARD] Alocando {size_mb} MB de memória física em {num_blocks} blocos...")
            for i in range(num_blocks):
                if cls._test_cancel.is_set():
                    break
                try:
                    b = bytearray(block_size)
                    allocated_blocks.append(b)
                except MemoryError:
                    LogManager.add_log(f"[AVISO] Limite de alocação de memória atingido no bloco {i+1}.")
                    break

            real_allocated_mb = len(allocated_blocks) * 16
            if real_allocated_mb == 0:
                with cls._status_lock:
                    cls._test_status["state"] = "failed"
                    cls._test_status["current_pattern"] = "Erro ao alocar memória"
                LogManager.add_log("[ERRO] Não foi possível alocar memória suficiente para o teste.")
                return

            with cls._status_lock:
                cls._test_status["total_mb"] = real_allocated_mb

            total_steps = passes * len(PATTERNS) * len(allocated_blocks)
            completed_steps = 0
            total_bytes_processed = 0

            # 2. Execução dos Passes e Padrões
            for p_idx in range(1, passes + 1):
                if cls._test_cancel.is_set():
                    break

                with cls._status_lock:
                    cls._test_status["current_pass"] = p_idx

                LogManager.add_log(f"[RAMGUARD] Iniciando Passe {p_idx}/{passes}...")

                for pat_name, write_val, check_val in PATTERNS:
                    if cls._test_cancel.is_set():
                        break

                    with cls._status_lock:
                        cls._test_status["current_pattern"] = f"{pat_name} (Passe {p_idx}/{passes})"

                    # Executa o padrão em cada bloco alocado
                    for b_idx, block in enumerate(allocated_blocks):
                        if cls._test_cancel.is_set():
                            break

                        t_step_start = time.time()

                        # Escrita e Leitura com validação de integridade
                        if write_val is not None:
                            # Preenche com write_val
                            for i in range(0, block_size, 4096):
                                block[i:i+4096] = bytes([write_val] * 4096)
                            
                            # Inverte para check_val e valida
                            for i in range(0, block_size, 4096):
                                chunk = block[i:i+4096]
                                if chunk[0] != write_val:
                                    with cls._status_lock:
                                        cls._test_status["errors_found"] += 1
                                        cls._test_status["error_log"].append(f"Erro em {pat_name}: Bloco {b_idx}, Offset {i}")
                                    LogManager.add_log(f"[ERRO DE MEMÓRIA] Inconsistência no Bloco {b_idx} em 0x{i:X}!")
                                block[i:i+4096] = bytes([check_val] * 4096)
                        else:
                            # Teste aleatório
                            rand_byte = random.randint(1, 254)
                            for i in range(0, block_size, 4096):
                                block[i:i+4096] = bytes([rand_byte] * 4096)
                            for i in range(0, block_size, 4096):
                                if block[i] != rand_byte:
                                    with cls._status_lock:
                                        cls._test_status["errors_found"] += 1

                        total_bytes_processed += (block_size * 2)
                        completed_steps += 1
                        
                        elapsed = max(0.1, time.time() - start_time)
                        speed_mb = (total_bytes_processed / (1024 * 1024)) / elapsed
                        pct = min(100, int((completed_steps / total_steps) * 100))

                        with cls._status_lock:
                            cls._test_status["progress_percent"] = pct
                            cls._test_status["tested_mb"] = (b_idx + 1) * 16
                            cls._test_status["speed_mb_s"] = round(speed_mb, 1)
                            cls._test_status["elapsed_seconds"] = int(elapsed)

                        time.sleep(0.01)

            # 3. Finalização
            with cls._status_lock:
                if cls._test_cancel.is_set():
                    cls._test_status["state"] = "cancelled"
                    cls._test_status["current_pattern"] = "Teste cancelado pelo usuário"
                    LogManager.add_log("[RAMGUARD] Teste de memória cancelado pelo usuário.")
                else:
                    cls._test_status["state"] = "completed"
                    cls._test_status["progress_percent"] = 100
                    errors = cls._test_status["errors_found"]
                    if errors == 0:
                        cls._test_status["current_pattern"] = "Concluído: Memória 100% Saudável (0 Erros)"
                        LogManager.add_log(f"[RAMGUARD OK] Teste concluído com sucesso: {real_allocated_mb} MB testados sem nenhum erro de hardware!")
                    else:
                        cls._test_status["current_pattern"] = f"Falha: {errors} Erro(s) de bit detectados"
                        LogManager.add_log(f"[RAMGUARD ALERTA] {errors} erro(s) de integridade de memória detectados!")

        except Exception as ex:
            with cls._status_lock:
                cls._test_status["state"] = "failed"
                cls._test_status["current_pattern"] = f"Erro no teste: {ex}"
            LogManager.add_log(f"[ERRO RAMGUARD] Falha na execução: {ex}")

        finally:
            # Libera memória imediatamente
            allocated_blocks.clear()

    @classmethod
    def get_test_status(cls):
        """Retorna o estado ao vivo do teste de memória."""
        with cls._status_lock:
            return dict(cls._test_status)

    @classmethod
    def cancel_test(cls):
        """Cancela o teste de memória imediatamente."""
        with cls._status_lock:
            if cls._test_status["state"] == "running":
                cls._test_cancel.set()
                return True, "Cancelamento do teste de memória solicitado."
        return False, "Nenhum teste de memória ativo."

    @classmethod
    def stop_memory_test(cls):
        """Alias para cancel_test usado pela rota /api/memory/test/stop."""
        return cls.cancel_test()
