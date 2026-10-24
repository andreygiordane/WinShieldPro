"""
Motor de execução de comandos CMD / PowerShell em segundo plano (invisível),
com streaming de saída para o console da interface e rastreamento de tarefas.
"""
import itertools
import threading
import time

from backend.log_manager import LogManager
from backend.process import decode_output, popen_hidden, ps_command


class JobManager:
    """Registro das tarefas em execução (SFC, DISM, Defender, comandos...)."""
    _jobs = {}
    _ids = itertools.count(1)
    _lock = threading.Lock()

    @classmethod
    def start(cls, name):
        jid = next(cls._ids)
        with cls._lock:
            cls._jobs[jid] = {"id": jid, "name": name, "status": "running",
                              "started": time.time(), "ended": None, "code": None}
        return jid

    @classmethod
    def finish(cls, jid, code):
        with cls._lock:
            job = cls._jobs.get(jid)
            if job:
                job["status"] = "done" if code == 0 else "error"
                job["code"] = code
                job["ended"] = time.time()
            # mantém apenas os 30 mais recentes
            if len(cls._jobs) > 30:
                for k in sorted(cls._jobs)[:-30]:
                    cls._jobs.pop(k, None)

    @classmethod
    def list(cls):
        with cls._lock:
            return sorted(cls._jobs.values(), key=lambda j: j["id"], reverse=True)


class SystemCommandEngine:
    """Executa comandos nativos sem abrir nenhuma janela de console."""

    @staticmethod
    def _stream(command, name, shell, on_complete=None):
        def worker():
            jid = JobManager.start(name)
            code = -1
            output = []
            try:
                proc = popen_hidden(command, shell=shell)
                for raw in iter(proc.stdout.readline, b""):
                    line = decode_output(raw).rstrip("\r\n")
                    # alguns utilitários (sfc/dism) usam \r para progresso
                    line = line.split("\r")[-1].replace("\x00", "")
                    if line.strip():
                        output.append(line)
                        LogManager.add_log(line)
                proc.stdout.close()
                code = proc.wait()
                LogManager.add_log(f"[TAREFA] '{name}' finalizada (código {code}).")
            except Exception as ex:  # noqa: BLE001
                LogManager.add_log(f"[ERRO] Falha ao executar '{name}': {ex}")
            finally:
                JobManager.finish(jid, code)
                if on_complete:
                    try:
                        on_complete(code, "\n".join(output))
                    except Exception:  # noqa: BLE001
                        pass

        t = threading.Thread(target=worker, daemon=True)
        t.start()
        return t

    @staticmethod
    def run_cmd(command, name=None, on_complete=None):
        return SystemCommandEngine._stream(command, name or command[:60], True, on_complete)

    @staticmethod
    def run_powershell(script, name=None, on_complete=None):
        return SystemCommandEngine._stream(ps_command(script), name or "PowerShell", False, on_complete)
