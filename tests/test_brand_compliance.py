"""
Teste de Conformidade de Marca e Propriedade Intelectual - WinShield Pro Enterprise.
Garante que nenhum nome de software de terceiros ou referências de inspiração
permaneçam no código-fonte, endpoints ou interface compilada.
"""

import os
import re
from backend.api import ApiRouter


FORBIDDEN_NAMES = [
    r"\bcpuz\b",
    r"\bcpu-z\b",
    r"\bgpuz\b",
    r"\bgpu-z\b",
    r"\baida64\b",
    r"\baida\b",
    r"\bhdtune\b",
    r"\bhd\s+tune\b",
    r"\bmemtest\b",
    r"\bmemtest86\b",
]


def test_compiled_dashboard_has_no_third_party_names():
    dashboard_path = "winshield_pro_dashboard.html"
    assert os.path.exists(dashboard_path), "Dashboard raiz compilado deve existir"

    with open(dashboard_path, "r", encoding="utf-8") as f:
        content = f.read()

    for pattern in FORBIDDEN_NAMES:
        matches = re.findall(pattern, content, re.IGNORECASE)
        assert len(matches) == 0, f"Encontrado termo proibido no dashboard: {matches}"


def test_proprietary_routes_dispatched():
    silicon_res = ApiRouter.dispatch_get("/api/silicon/info")
    assert silicon_res is not None
    assert silicon_res.get("status") == "success"
    assert "silicon" in silicon_res

    vision_res = ApiRouter.dispatch_get("/api/vision/info")
    assert vision_res is not None
    assert vision_res.get("status") == "success"
    assert "vision" in vision_res
