import os
from winshield_app import WinShieldRequestHandler


def test_resource_resolution_html_and_images():
    handler = WinShieldRequestHandler

    html_file = handler._resolve_resource(None, "winshield_pro_dashboard.html")
    assert html_file is not None
    assert os.path.isfile(html_file)
    assert html_file.endswith("winshield_pro_dashboard.html")

    img_file = handler._resolve_resource(None, "splash_backdrop.webp")
    assert img_file is not None
    assert os.path.isfile(img_file)
    assert img_file.endswith("splash_backdrop.webp")

    icon_file = handler._resolve_resource(None, "imagens/icone.ico")
    assert icon_file is not None
    assert os.path.isfile(icon_file)


def test_f5_reload_prevention_in_frontend():
    handler = WinShieldRequestHandler
    html_file = handler._resolve_resource(None, "winshield_pro_dashboard.html")
    assert html_file is not None

    with open(html_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Garante que o bloqueio de F5 e atalhos de reload esteja presente
    assert "blockReload" in content
    assert "e.key === 'F5'" in content
    assert "e.preventDefault()" in content
    assert "capture: true" in content

