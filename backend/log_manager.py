import threading
from collections import deque
from datetime import datetime


class LogManager:
    """
    Buffer de logs em tempo real para streaming contínuo para a interface.

    Usa um contador sequencial global (``_seq``) para que o cliente possa pedir
    "logs desde o número N" mesmo depois que entradas antigas forem descartadas.
    """
    _MAX = 3000
    _logs = deque(maxlen=_MAX)
    _seq = 0
    _lock = threading.Lock()

    @classmethod
    def add_log(cls, message):
        clean_msg = str(message).rstrip()
        if not clean_msg:
            return
        timestamp = datetime.now().strftime("%H:%M:%S")
        entry = f"[{timestamp}] {clean_msg}"
        with cls._lock:
            cls._seq += 1
            cls._logs.append((cls._seq, entry))
        try:
            print(entry)
        except Exception:  # noqa: BLE001 - sem console no modo janela
            pass

    @classmethod
    def get_logs_since(cls, index):
        """Retorna (lista_de_logs, ultimo_seq)."""
        with cls._lock:
            if index > cls._seq:  # buffer limpo / reiniciado
                index = 0
            out = [e for s, e in cls._logs if s > index]
            return out, cls._seq

    @classmethod
    def clear(cls):
        with cls._lock:
            cls._logs.clear()
