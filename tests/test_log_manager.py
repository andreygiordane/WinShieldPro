from backend.log_manager import LogManager


def test_log_manager_lifecycle():
    LogManager.clear()
    logs, seq = LogManager.get_logs_since(0)
    assert len(logs) == 0

    LogManager.add_log("Teste de Inicialização de Testes")
    logs, seq = LogManager.get_logs_since(0)
    assert len(logs) == 1
    assert "Teste de Inicialização de Testes" in logs[0]

    LogManager.clear()
    logs, seq = LogManager.get_logs_since(0)
    assert len(logs) == 0
