import os
import sys

try:
    import ctypes
except ImportError:  # pragma: no cover
    ctypes = None

IS_WINDOWS = (sys.platform == "win32")
APP_NAME = "WinShield Pro"
APP_VERSION = "6.2"


def is_admin():
    """Verifica se o processo possui privilégios de Administrador no Windows."""
    if not IS_WINDOWS or ctypes is None:
        return False
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except Exception:  # noqa: BLE001
        return False


def elevate_privileges():
    """
    Solicita elevação UAC relançando o processo como Administrador.
    Quando executado via Python, usa ``pythonw.exe`` para não abrir console.
    """
    if not (IS_WINDOWS and ctypes is not None) or is_admin():
        return

    script = os.path.abspath(sys.argv[0])
    params = " ".join([f'"{arg}"' for arg in sys.argv[1:]])

    python_exe = sys.executable
    pythonw_candidate = os.path.join(os.path.dirname(python_exe), "pythonw.exe")
    if os.path.exists(pythonw_candidate):
        python_exe = pythonw_candidate

    params = f'"{script}" {params}'.strip()

    try:
        ctypes.windll.shell32.ShellExecuteW(
            None,
            "runas",
            python_exe,
            params,
            None,
            0,
        )
        sys.exit(0)
    except Exception as e:
        print(f"[ERRO] Falha ao solicitar privilégios de administrador: {e}")


def base_dir():
    """Retorna o diretório base do projeto (funciona tanto em dev quanto congelado com PyInstaller)."""
    if getattr(sys, "frozen", False):
        return getattr(sys, "_MEIPASS", os.path.dirname(sys.executable))
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def resource_path(*rel_path):
    """Resolve caminhos relativos ao diretório base de recursos."""
    return os.path.join(base_dir(), *rel_path)


def app_data_dir():
    """Diretório seguro para logs, caches e relatórios do usuário."""
    base = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
    target = os.path.join(base, "WinShieldPro")
    os.makedirs(target, exist_ok=True)
    return target
