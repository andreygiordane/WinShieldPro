"""
Utilitário de Build do Frontend - WinShield Pro Enterprise.
Recompila o arquivo autônomo 'frontend/winshield_pro_dashboard.html' a partir
dos módulos, páginas (HTML), estilos (CSS) e scripts (JS) organizados.
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
PAGES_DIR = os.path.join(FRONTEND_DIR, "pages")
CSS_DIR = os.path.join(FRONTEND_DIR, "css")
JS_DIR = os.path.join(FRONTEND_DIR, "js")
OUTPUT_HTML = os.path.join(FRONTEND_DIR, "winshield_pro_dashboard.html")

PAGE_ORDER = [
    "overview.html",
    "silicon.html",
    "vision.html",
    "memory.html",
    "disk_health.html",
    "disk_bench.html",
    "running_apps.html",
    "audit.html",
    "antivirus.html",
    "clean.html",
    "power.html",
    "optimize.html",
    "terminal.html",
    "network.html",
    "devices.html",
    "stability.html",
]


def build_dashboard():
    print("[BUILD] Iniciando compilação modular do frontend...")

    # Lê o arquivo original para obter o shell inicial (antes de <style>)
    if not os.path.exists(OUTPUT_HTML):
        print(f"[ERRO] {OUTPUT_HTML} não encontrado para referência de shell.")
        return False

    with open(OUTPUT_HTML, "r", encoding="utf-8") as f:
        full_content = f.read()

    # Partes do Shell:
    # Parte 1: Início até antes de <style>
    style_start = full_content.find("<style>")
    style_end = full_content.find("</style>") + len("</style>")
    header_part = full_content[:style_start]

    # Parte 2: CSS compilado
    css_file = os.path.join(CSS_DIR, "main.css")
    with open(css_file, "r", encoding="utf-8") as f:
        css_content = f.read()

    # Parte 3: Do fim de </style> até <main ...>
    main_start_tag = '<main id="main-content-scroll"'
    main_start_idx = full_content.find(main_start_tag)
    # Encontra o fim da tag de abertura <main ...>
    main_body_idx = full_content.find(">", main_start_idx) + 1
    shell_before_pages = full_content[style_end:main_body_idx]

    # Parte 4: Conteúdo de todas as páginas em PAGES_DIR
    pages_content = "\n\n"
    for page_name in PAGE_ORDER:
        page_path = os.path.join(PAGES_DIR, page_name)
        if os.path.exists(page_path):
            with open(page_path, "r", encoding="utf-8") as pf:
                pages_content += pf.read().strip() + "\n\n"
        else:
            print(f"[AVISO] Página {page_name} não encontrada em {PAGES_DIR}")

    # Parte 5: Do fechamento de </main> até o último <script>
    main_end_idx = full_content.find("</main>")
    last_script_start = full_content.rfind("<script>")
    shell_between_main_and_script = full_content[main_end_idx:last_script_start + len("<script>")]

    # Parte 6: Conteúdo do script
    app_js_path = os.path.join(JS_DIR, "core", "app.js")
    with open(app_js_path, "r", encoding="utf-8") as jf:
        js_content = jf.read()

    # Parte 7: Fim do documento HTML
    tail_part = "\n    </script>\n</body>\n</html>\n"

    # Monta o arquivo compilado
    rebuilt_html = (
        header_part
        + "<style>\n"
        + css_content
        + "\n    </style>"
        + shell_before_pages
        + pages_content
        + "        "
        + shell_between_main_and_script
        + "\n        "
        + js_content
        + tail_part
    )

    with open(OUTPUT_HTML, "w", encoding="utf-8") as out:
        out.write(rebuilt_html)

    root_html = os.path.join(BASE_DIR, "winshield_pro_dashboard.html")
    with open(root_html, "w", encoding="utf-8") as out_root:
        out_root.write(rebuilt_html)

    print(f"[OK] Dashboard compilado com sucesso em: {OUTPUT_HTML} e {root_html} ({len(rebuilt_html):,} bytes)")
    return True


if __name__ == "__main__":
    build_dashboard()
