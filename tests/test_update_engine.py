from backend.update_engine import UpdateEngine, parse_winget_upgrade, wu_item

WINGET_PT = (
    "   - \r   \\ \r"
    "Nome                       ID                          Versão        Disponível    Origem\r\n"
    "-----------------------------------------------------------------------------------------\r\n"
    "Mozilla Firefox (x64 pt-BR) Mozilla.Firefox.pt-BR       128.0         129.0.1       winget\r\n"
    "7-Zip 23.01 (x64)          7zip.7zip                   23.01         24.08         winget\r\n"
    "Programa Com Nome Longo    Fornecedor.Programa.Com.Id… 1.0           2.0           winget\r\n"
    "3 atualizações disponíveis.\r\n"
)


def test_parse_winget_reads_columns_and_skips_truncated_ids():
    rows = parse_winget_upgrade(WINGET_PT)
    assert [r["id"] for r in rows] == ["Mozilla.Firefox.pt-BR", "7zip.7zip"]
    assert rows[1]["version"] == "23.01" and rows[1]["available"] == "24.08"


def test_parse_winget_empty_output():
    assert parse_winget_upgrade("Nenhum pacote instalado encontrado.") == []


def test_wu_security_update_is_preselected():
    item = wu_item({"id": "abc", "title": "Atualização de segurança", "kb": "5031455", "severity": "Critical",
                    "categories": ["0FA1201D-4330-4FA8-8AE9-B877473B6441"], "auto": True, "type": 1,
                    "size": 650 * 1024 * 1024, "reboot": 1})
    assert item["group"] == "windows" and item["level"] == "critical"
    assert item["selected"] and item["reboot"] and "KB5031455" in item["subtitle"]


def test_wu_optional_preview_is_not_preselected():
    item = wu_item({"id": "x", "title": "Prévia cumulativa", "categories": ["cd5ffd1e-e932-4e3a-bf74-18bf0b1bbd83"],
                    "auto": False, "type": 1})
    assert item["level"] == "optional" and not item["selected"]


def test_wu_driver_goes_to_drivers_group():
    item = wu_item({"id": "d", "title": "Realtek - Net", "type": 2, "auto": False,
                    "driver_date": "2026-05-01", "installed_date": "2024-01-10", "device_name": "Placa de rede"})
    assert item["group"] == "drivers" and item["level"] == "optional"
    assert "Placa de rede" in item["why"] and "2024-01-10" in item["why"]


def test_install_rejects_unknown_ids():
    ok, _ = UpdateEngine.install(["wu:nao-existe"])
    assert not ok


def test_status_structure():
    st = UpdateEngine.status()
    assert st["status"] == "success"
    for key in ("phase", "items", "pending", "source_errors", "results"):
        assert key in st
