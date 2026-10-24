"""
Execução de processos 100% invisível (sem janelas de CMD/PowerShell piscando).

Todos os módulos do WinShield Pro DEVEM usar as funções deste arquivo em vez de
chamar ``subprocess`` diretamente. Assim garantimos que nenhuma janela de console
apareça na tela, mesmo quando o aplicativo é compilado com ``--windowed``.
"""
import json
import subprocess
import sys

IS_WINDOWS = (sys.platform == "win32")

CREATE_NO_WINDOW = 0x08000000
SW_HIDE = 0

# Força a saída do PowerShell em UTF-8 (acentuação correta em pt-BR)
PS_PREAMBLE = (
    "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8;"
    "$OutputEncoding=[System.Text.Encoding]::UTF8;"
    "$ProgressPreference='SilentlyContinue';"
)


def hidden_kwargs(hide_window=True):
    """Argumentos para subprocess que impedem a criação de janelas de console."""
    kw = {}
    if IS_WINDOWS:
        kw["creationflags"] = CREATE_NO_WINDOW
        if hide_window:
            si = subprocess.STARTUPINFO()
            si.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            si.wShowWindow = SW_HIDE
            kw["startupinfo"] = si
    return kw


def decode_output(raw):
    """Decodifica bytes vindos do console (UTF-8, OEM cp850 ou ANSI cp1252)."""
    if raw is None:
        return ""
    if isinstance(raw, str):
        return raw
    for enc in ("utf-8", "cp850", "cp1252"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


def ps_command(script):
    """Monta a linha de comando do PowerShell oculto."""
    return [
        "powershell.exe", "-NoLogo", "-NoProfile", "-NonInteractive",
        "-ExecutionPolicy", "Bypass", "-WindowStyle", "Hidden",
        "-Command", PS_PREAMBLE + script,
    ]


def run_hidden(command, timeout=60, shell=None):
    """
    Executa um comando de forma síncrona e invisível.
    Retorna (codigo_saida, saida_texto).
    """
    if shell is None:
        shell = isinstance(command, str)
    try:
        res = subprocess.run(
            command,
            shell=shell,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            timeout=timeout,
            **hidden_kwargs(),
        )
        return res.returncode, decode_output(res.stdout)
    except subprocess.TimeoutExpired:
        return -2, "[TIMEOUT] O comando excedeu o tempo limite."
    except Exception as ex:  # noqa: BLE001
        return -1, f"[ERRO] {ex}"


def run_ps(script, timeout=60):
    """Executa um script PowerShell oculto e retorna (codigo, saida)."""
    return run_hidden(ps_command(script), timeout=timeout, shell=False)


def run_ps_json(script, timeout=60):
    """Executa PowerShell que termina em ConvertTo-Json e devolve o objeto Python."""
    code, out = run_ps(script, timeout=timeout)
    out = (out or "").strip()
    if not out:
        return None
    # Ignora qualquer ruído antes do JSON
    start = min([i for i in (out.find("{"), out.find("[")) if i >= 0], default=-1)
    if start < 0:
        return None
    try:
        return json.loads(out[start:])
    except Exception:  # noqa: BLE001
        return None


def popen_hidden(command, shell=None):
    """Inicia um processo invisível com stdout em streaming (para logs ao vivo)."""
    if shell is None:
        shell = isinstance(command, str)
    return subprocess.Popen(
        command,
        shell=shell,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        **hidden_kwargs(),
    )


def launch_gui(command):
    """
    Lança um programa com interface gráfica (ex.: desinstalador) sem abrir
    janela de console intermediária. A GUI do programa continua visível.
    """
    return subprocess.Popen(
        command,
        shell=True,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        **hidden_kwargs(hide_window=False),
    )
