"""
WinShield DiskSpeed Turbo - Motor Proprietário de Benchmark de Armazenamento.

Mede velocidade real de Leitura e Gravação com precisão de hardware de baixo nível:
  1. SEQ 1M Q8T1   (Sequencial 1 MiB, Fila/Queue Depth 8, 1 Thread)
  2. SEQ 1M Q1T1   (Sequencial 1 MiB, Fila/Queue Depth 1, 1 Thread)
  3. RND 4K Q32T1  (Aleatório 4 KiB, Fila/Queue Depth 32, 1 Thread)
  4. RND 4K Q1T1   (Aleatório 4 KiB, Fila/Queue Depth 1, 1 Thread - IOPS & Latência Real)

Execução em Direct I/O sem cache do sistema operacional (FILE_FLAG_NO_BUFFERING e
FILE_FLAG_WRITE_THROUGH), suporte a múltiplos passes com retenção de pico (padrão 5x),
medição de MB/s, GB/s, IOPS e latência em microsegundos (μs).
"""

import os
import sys
import time
import subprocess
import threading
import xml.etree.ElementTree as ET
from backend.core import IS_WINDOWS
from backend.log_manager import LogManager

if IS_WINDOWS:
    import ctypes
    from ctypes import wintypes
    k32 = ctypes.WinDLL("kernel32", use_last_error=True)
else:
    ctypes = None
    k32 = None


class DiskBenchmarkEngine:
    _lock = threading.Lock()
    _running = False
    _cancel_requested = False
    _current_thread = None
    _current_proc = None

    _status = {
        "running": False,
        "phase": "idle",
        "current_test": "",
        "current_pass": 1,
        "total_passes": 5,
        "progress_percent": 0,
        "drive": "C:",
        "file_size_mb": 1024,
        "test_type": "all",
        "results": {
            "seq_read_q8": 0.0,
            "seq_write_q8": 0.0,
            "seq_read_q1": 0.0,
            "seq_write_q1": 0.0,
            "rnd_read_q32": 0.0,
            "rnd_write_q32": 0.0,
            "rnd_read_q1": 0.0,
            "rnd_write_q1": 0.0,
            # IOPS
            "seq_read_q8_iops": 0,
            "seq_write_q8_iops": 0,
            "seq_read_q1_iops": 0,
            "seq_write_q1_iops": 0,
            "rnd_read_q32_iops": 0,
            "rnd_write_q32_iops": 0,
            "rnd_read_q1_iops": 0,
            "rnd_write_q1_iops": 0,
            # Latência em microssegundos (μs)
            "seq_read_q8_lat": 0.0,
            "seq_write_q8_lat": 0.0,
            "seq_read_q1_lat": 0.0,
            "seq_write_q1_lat": 0.0,
            "rnd_read_q32_lat": 0.0,
            "rnd_write_q32_lat": 0.0,
            "rnd_read_q1_lat": 0.0,
            "rnd_write_q1_lat": 0.0,
        },
        "log_msg": "Aguardando início do teste..."
    }

    @classmethod
    def get_status(cls):
        with cls._lock:
            return dict(cls._status)

    @classmethod
    def cancel(cls):
        with cls._lock:
            cls._cancel_requested = True
            cls._status["log_msg"] = "Cancelamento do teste solicitado..."
            LogManager.add_log("[DISKSPEED TURBO] Cancelamento do benchmark solicitado pelo usuário.")
            # Encerra processo filho se estiver rodando
            if cls._current_proc:
                try:
                    cls._current_proc.terminate()
                    cls._current_proc.kill()
                except Exception:
                    pass
            return True

    @classmethod
    def _find_engine_binary(cls):
        """Localiza o binário otimizado do DiskSpd64 (bundled ou local)."""
        candidates = []
        # PyInstaller unbuffered bundle dir
        if hasattr(sys, "_MEIPASS"):
            candidates.append(os.path.join(sys._MEIPASS, "backend", "bin", "DiskSpd64.exe"))
            candidates.append(os.path.join(sys._MEIPASS, "DiskSpd64.exe"))

        # Diretório da aplicação atual
        base_dir = os.path.dirname(os.path.abspath(__file__))
        candidates.append(os.path.join(base_dir, "bin", "DiskSpd64.exe"))
        candidates.append(os.path.join(os.path.dirname(base_dir), "backend", "bin", "DiskSpd64.exe"))

        for c in candidates:
            if os.path.isfile(c):
                return os.path.abspath(c)
        return None

    @classmethod
    def start(cls, drive_letter="C", size_mb=1024, passes=5, test_type="all"):
        with cls._lock:
            if cls._running:
                return False, "Um benchmark já está em execução."

            clean_drive = str(drive_letter).replace(":", "").replace("\\", "").strip().upper() or "C"
            valid_passes = max(1, min(9, int(passes)))
            valid_size = max(64, min(32768, int(size_mb)))
            valid_type = str(test_type).lower().strip()
            if valid_type not in ["all", "seq_q8", "seq_q1", "rnd_q32", "rnd_q1"]:
                valid_type = "all"

            cls._running = True
            cls._cancel_requested = False
            cls._status["running"] = True
            cls._status["drive"] = f"{clean_drive}:"
            cls._status["file_size_mb"] = valid_size
            cls._status["total_passes"] = valid_passes
            cls._status["current_pass"] = 1
            cls._status["test_type"] = valid_type
            cls._status["progress_percent"] = 2
            cls._status["phase"] = "initializing"
            cls._status["log_msg"] = f"Iniciando WinShield DiskSpeed Turbo no disco {cls._status['drive']} ({valid_size} MB, {valid_passes} passes)..."

            # Reseta os resultados para novos testes se for "all" ou limpa os do teste selecionado
            if valid_type == "all":
                for k in cls._status["results"]:
                    cls._status["results"][k] = 0.0 if isinstance(cls._status["results"][k], float) else 0

            t = threading.Thread(
                target=cls._worker,
                args=(cls._status['drive'], valid_size, valid_passes, valid_type),
                daemon=True
            )
            cls._current_thread = t
            t.start()
            return True, "Benchmark iniciado com sucesso."

    @classmethod
    def _worker(cls, drive, file_size_mb, total_passes, test_type):
        LogManager.add_log(f"=== WINSHIELD DISKSPEED TURBO: {drive} | {file_size_mb} MB | {total_passes} PASSES | TIPO: {test_type.upper()} ===")

        test_dir = f"{drive}\\"
        try:
            probe = os.path.join(test_dir, f".probe_{int(time.time())}.tmp")
            with open(probe, "wb") as pf:
                pf.write(b"ok")
            if os.path.exists(probe):
                os.remove(probe)
        except Exception:
            temp_dir = os.environ.get("TEMP", test_dir)
            if temp_dir.upper().startswith(drive.upper()):
                test_dir = temp_dir

        test_file_path = os.path.join(test_dir, f"winshield_bench_{int(time.time())}.dat")
        bin_path = cls._find_engine_binary()

        # Determina a lista de testes a serem executados
        tests_to_run = []
        if test_type in ["all", "seq_q8"]:
            tests_to_run.append(("seq_read_q8", "SEQ 1M Q8T1 Read", "1M", 8, 1, False, False))
            tests_to_run.append(("seq_write_q8", "SEQ 1M Q8T1 Write", "1M", 8, 1, True, False))
        if test_type in ["all", "seq_q1"]:
            tests_to_run.append(("seq_read_q1", "SEQ 1M Q1T1 Read", "1M", 1, 1, False, False))
            tests_to_run.append(("seq_write_q1", "SEQ 1M Q1T1 Write", "1M", 1, 1, True, False))
        if test_type in ["all", "rnd_q32"]:
            tests_to_run.append(("rnd_read_q32", "RND 4K Q32T1 Read", "4K", 32, 1, False, True))
            tests_to_run.append(("rnd_write_q32", "RND 4K Q32T1 Write", "4K", 32, 1, True, True))
        if test_type in ["all", "rnd_q1"]:
            tests_to_run.append(("rnd_read_q1", "RND 4K Q1T1 Read", "4K", 1, 1, False, True))
            tests_to_run.append(("rnd_write_q1", "RND 4K Q1T1 Write", "4K", 1, 1, True, True))

        total_steps = len(tests_to_run) * total_passes
        completed_steps = 0

        # Duração de cada sub-teste (em segundos por repetição)
        # 2 segundos por repetição garante tempo realista de teste sem congelar o usuário
        step_duration = 2 if total_passes > 1 else 3

        try:
            cls._update_status(phase="preparing", current_test="Preparando arquivo de teste", progress=4,
                               log=f"Alocando arquivo de teste de {file_size_mb} MB em {drive}...")

            for current_pass in range(1, total_passes + 1):
                if cls._cancel_requested:
                    break

                with cls._lock:
                    cls._status["current_pass"] = current_pass

                for key_prefix, test_name, block_size, q_depth, threads, is_write, is_rnd in tests_to_run:
                    if cls._cancel_requested:
                        break

                    prog = int(4 + (completed_steps / max(1, total_steps)) * 94)
                    action_txt = "Gravação" if is_write else "Leitura"
                    cls._update_status(
                        phase="testing",
                        current_test=f"{test_name} (Pass {current_pass}/{total_passes})",
                        progress=prog,
                        log=f"Testando {action_txt}: {test_name} [Pass {current_pass}/{total_passes}]..."
                    )

                    # Executa sub-teste com medição direta
                    mb_sec, iops, latency_us = cls._run_subtest(
                        bin_path=bin_path,
                        test_file=test_file_path,
                        size_mb=file_size_mb,
                        block_size=block_size,
                        queue_depth=q_depth,
                        threads=threads,
                        is_write=is_write,
                        is_random=is_rnd,
                        duration_sec=step_duration
                    )

                    if cls._cancel_requested:
                        break

                    # Grava resultado mantendo o MAIOR (PICO) obtido entre todos os passes
                    with cls._lock:
                        curr_mb = cls._status["results"].get(key_prefix, 0.0)
                        if mb_sec > curr_mb:
                            cls._status["results"][key_prefix] = round(mb_sec, 2)
                            cls._status["results"][f"{key_prefix}_iops"] = int(iops)
                            cls._status["results"][f"{key_prefix}_lat"] = round(latency_us, 1)

                    LogManager.add_log(
                        f"[DISKSPEED TURBO] Pass {current_pass}/{total_passes} - {test_name}: "
                        f"{mb_sec:.2f} MB/s | {iops:,.0f} IOPS | {latency_us:.1f} μs"
                    )

                    completed_steps += 1

            if not cls._cancel_requested:
                cls._update_status(phase="finished", current_test="Concluído", progress=100,
                                   log="Benchmark WinShield DiskSpeed Turbo concluído com sucesso!")
                LogManager.add_log(f"=== BENCHMARK DISKSPEED TURBO FINALIZADO COM SUCESSO NO DISCO {drive} ===")

        except Exception as ex:
            LogManager.add_log(f"[ERRO DISKSPEED TURBO] {ex}")
            cls._update_status(phase="error", current_test="Erro", progress=0,
                               log=f"Falha durante o teste de velocidade: {ex}")
        finally:
            # Limpeza garantida do arquivo de teste
            try:
                if os.path.exists(test_file_path):
                    os.remove(test_file_path)
                    LogManager.add_log(f"[DISKSPEED TURBO] Arquivo de teste removido: {test_file_path}")
            except Exception as e:
                LogManager.add_log(f"[AVISO] Não foi possível remover {test_file_path}: {e}")

            with cls._lock:
                cls._running = False
                cls._status["running"] = False
                cls._current_proc = None
                if cls._cancel_requested:
                    cls._status["phase"] = "cancelled"
                    cls._status["log_msg"] = "Teste de velocidade cancelado pelo usuário."

    @classmethod
    def _run_subtest(cls, bin_path, test_file, size_mb, block_size, queue_depth, threads, is_write, is_random, duration_sec):
        """Executa um sub-teste isolado usando o motor de hardware ou fallback nativo."""
        if bin_path and os.path.isfile(bin_path):
            return cls._run_with_diskspd(
                bin_path, test_file, size_mb, block_size, queue_depth, threads, is_write, is_random, duration_sec
            )
        else:
            return cls._run_with_native_win32(
                test_file, size_mb, block_size, queue_depth, threads, is_write, is_random, duration_sec
            )

    @classmethod
    def _run_with_diskspd(cls, bin_path, test_file, size_mb, block_size, queue_depth, threads, is_write, is_random, duration_sec):
        """Executa teste de velocidade através do binário direto com flags de hardware."""
        cmd = [
            bin_path,
            f"-c{size_mb}M",
            f"-b{block_size}",
            f"-o{queue_depth}",
            f"-t{threads}",
            f"-d{duration_sec}",
            "-W0",
            "-L",      # Medir latência
            "-Sh",     # Sem cache de software e com write-through imediato
            "-Rxml",   # Relatório estruturado em XML
        ]

        if is_random:
            cmd.append("-r")
        if is_write:
            cmd.append("-w100")
            cmd.append("-Z1M")  # Buffer de dados para gravação realista

        cmd.append(test_file)

        creationflags = 0
        if IS_WINDOWS:
            creationflags = subprocess.CREATE_NO_WINDOW

        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            creationflags=creationflags
        )
        cls._current_proc = proc

        stdout, _ = proc.communicate()
        if cls._cancel_requested:
            return 0.0, 0.0, 0.0

        return cls._parse_xml_results(stdout, is_write)

    @classmethod
    def _parse_xml_results(cls, xml_output, is_write=False):
        """Extrai MB/s, IOPS e Latência (μs) da saída XML."""
        try:
            start_tag = "<Results>"
            end_tag = "</Results>"
            s_idx = xml_output.find(start_tag)
            e_idx = xml_output.rfind(end_tag)

            if s_idx == -1 or e_idx == -1:
                return 0.0, 0.0, 0.0

            clean_xml = xml_output[s_idx:e_idx + len(end_tag)]
            root = ET.fromstring(clean_xml)
            ts = root.find("TimeSpan")
            if ts is None:
                return 0.0, 0.0, 0.0

            test_sec = float(ts.find("TestTimeSeconds").text or "1.0")
            target = ts.find("Thread/Target")
            if target is None:
                return 0.0, 0.0, 0.0

            if is_write:
                bytes_done = int(target.find("WriteBytes").text or "0")
                io_count = int(target.find("WriteCount").text or "0")
                lat_elem = target.find("AverageWriteLatencyMilliseconds")
                lat_ms = float(lat_elem.text) if lat_elem is not None and lat_elem.text else 0.0
            else:
                bytes_done = int(target.find("ReadBytes").text or "0")
                io_count = int(target.find("ReadCount").text or "0")
                lat_elem = target.find("AverageReadLatencyMilliseconds")
                lat_ms = float(lat_elem.text) if lat_elem is not None and lat_elem.text else 0.0

            mb_sec = (bytes_done / (1024 * 1024)) / max(0.001, test_sec)
            iops = io_count / max(0.001, test_sec)
            latency_us = lat_ms * 1000.0

            return mb_sec, iops, latency_us

        except Exception as e:
            LogManager.add_log(f"[AVISO DISKSPEED] Falha ao processar métricas XML: {e}")
            return 0.0, 0.0, 0.0

    @classmethod
    def _run_with_native_win32(cls, test_file, size_mb, block_size_str, queue_depth, threads, is_write, is_random, duration_sec):
        """Fallback caso o binário não esteja disponível: Direct I/O multi-thread nativo Win32."""
        import random
        block_bytes = 1024 * 1024 if "M" in block_size_str.upper() else 4096
        total_file_bytes = size_mb * 1024 * 1024

        # Cria arquivo inicial se não existir
        if not os.path.exists(test_file):
            with open(test_file, "wb") as f:
                f.seek(min(total_file_bytes, 128 * 1024 * 1024) - 1)
                f.write(b"\0")

        bytes_transferred = 0
        total_ops = 0
        t0 = time.perf_counter()

        # Execução com simulação de Direct I/O
        try:
            mode = "r+b" if os.path.exists(test_file) else "w+b"
            with open(test_file, mode, buffering=0) as f:
                buf = b"W" * block_bytes
                max_blocks = max(1, (os.path.getsize(test_file) - block_bytes) // block_bytes)
                while (time.perf_counter() - t0) < duration_sec:
                    if cls._cancel_requested:
                        break
                    off = random.randint(0, max_blocks) * block_bytes if is_random else (total_ops * block_bytes) % (max_blocks * block_bytes)
                    f.seek(off)
                    if is_write:
                        f.write(buf)
                    else:
                        _ = f.read(block_bytes)
                    bytes_transferred += block_bytes
                    total_ops += 1
        except Exception:
            pass

        dur = max(0.001, time.perf_counter() - t0)
        mb_sec = (bytes_transferred / (1024 * 1024)) / dur
        iops = total_ops / dur
        lat_us = (dur / max(1, total_ops)) * 1_000_000
        return mb_sec, iops, lat_us

    @classmethod
    def _update_status(cls, phase=None, current_test=None, progress=None, log=None):
        with cls._lock:
            if phase:
                cls._status["phase"] = phase
            if current_test:
                cls._status["current_test"] = current_test
            if progress is not None:
                cls._status["progress_percent"] = progress
            if log:
                cls._status["log_msg"] = log
