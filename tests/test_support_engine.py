import os

from backend import support_engine as s


def _encode_product_key(key):
    """Inverso de decode_product_key (formato Windows 8+), só para teste."""
    raw = key.replace("-", "")
    pos = raw.index("N")
    digits = [pos] + [s.KEY_CHARS.index(c) for c in raw[:pos] + raw[pos + 1:]]
    value = 0
    for d in digits:
        value = value * 24 + d
    data = bytearray(value.to_bytes(15, "little"))
    data[14] |= 0x08
    return bytes(52) + bytes(data) + bytes(100)


def test_decode_product_key_roundtrip():
    for key in ("VK7JG-NPHTM-C97JM-9MPGT-3V66T", "YTMG3-N6DKC-DKB77-7M9GH-8HVX7", "NPPR9-FWDCX-D2C8J-H872K-2YT43"):
        assert s.decode_product_key(_encode_product_key(key)) == key


def test_outlook_account_imap_from_registry_values():
    utf16 = lambda t: (t + "\x00").encode("utf-16-le")
    acc = s._outlook_account({
        "Account Name": utf16("joao@empresa.com.br"), "Email": utf16("joao@empresa.com.br"),
        "IMAP Server": utf16("imap.empresa.com.br"), "IMAP Port": 993, "IMAP Use SSL": 1,
        "SMTP Server": utf16("smtp.empresa.com.br"), "SMTP Port": 587, "SMTP Secure Connection": 2,
    })
    assert acc["type"] == "IMAP"
    assert acc["incoming"] == {"host": "imap.empresa.com.br", "port": 993, "security": "SSL/TLS", "user": "joao@empresa.com.br"}
    assert acc["outgoing"]["security"] == "STARTTLS"


def test_outlook_account_exchange_inferred_and_internal_services_skipped():
    acc = s._outlook_account({"Account Name": "maria@empresa.com", "Email": "maria@empresa.com"})
    assert acc["type"].startswith("Exchange")
    assert s._outlook_account({"Account Name": "Catálogo de Endereços do Outlook"}) is None


def test_thunderbird_prefs(tmp_path, monkeypatch):
    profile = tmp_path / "Thunderbird" / "Profiles" / "abc.default-release"
    profile.mkdir(parents=True)
    (profile / "prefs.js").write_text("\n".join([
        'user_pref("mail.accountmanager.accounts", "account1,account2");',
        'user_pref("mail.account.account1.server", "server1");',
        'user_pref("mail.account.account1.identities", "id1");',
        'user_pref("mail.account.account2.server", "server2");',
        'user_pref("mail.server.server1.type", "imap");',
        'user_pref("mail.server.server1.hostname", "imap.gmail.com");',
        'user_pref("mail.server.server1.socketType", 3);',
        'user_pref("mail.server.server1.userName", "ana@gmail.com");',
        'user_pref("mail.server.server2.type", "none");',
        'user_pref("mail.identity.id1.useremail", "ana@gmail.com");',
        'user_pref("mail.identity.id1.smtpServer", "smtp1");',
        'user_pref("mail.smtpserver.smtp1.hostname", "smtp.gmail.com");',
        'user_pref("mail.smtpserver.smtp1.port", 465);',
        'user_pref("mail.smtpserver.smtp1.try_ssl", 3);',
    ]), encoding="utf-8")
    monkeypatch.setenv("APPDATA", str(tmp_path))
    profiles = s._thunderbird()
    assert len(profiles) == 1 and len(profiles[0]["accounts"]) == 1  # "Pastas locais" fica de fora
    acc = profiles[0]["accounts"][0]
    assert acc["incoming"] == {"host": "imap.gmail.com", "port": 993, "security": "SSL/TLS", "user": "ana@gmail.com"}
    assert acc["outgoing"]["host"] == "smtp.gmail.com" and acc["outgoing"]["port"] == 465


def test_reports_are_written(tmp_path):
    d = {"computer": "PC01", "scanned_at": "01/01/2026 10:00"}
    paths = s._write_reports(str(tmp_path / "x"), "rel", "Teste <b>", d, [("Seção", [("Chave", "ABC<script>")])])
    assert all(os.path.isfile(p) for p in paths)
    html_text = open(paths[1], encoding="utf-8").read()
    assert "ABC&lt;script&gt;" in html_text and "<script>" not in html_text


def test_suggest_backup_folder_has_path():
    sug = s.suggest_backup_folder()
    assert os.path.isabs(sug["path"]) and "SuporteTI_Backups" in sug["path"]
