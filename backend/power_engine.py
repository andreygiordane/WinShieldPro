import re

from backend.core import IS_WINDOWS
from backend.log_manager import LogManager
from backend.process import run_hidden, run_ps

PLANS = {
    "ultimate":  ("e9a42b02-d5df-448d-aa00-03f14749eb61", "Desempenho Máximo"),
    "high":      ("8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c", "Alto Desempenho"),
    "balanced":  ("381b4222-f694-41f0-9685-ff5bb260df2e", "Equilibrado"),
    "powersave": ("a1841308-3541-4fab-bc81-f71556f20b4a", "Economia de Energia"),
}
GUID_RE = re.compile(r"([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})", re.I)


class PowerEngine:
    @staticmethod
    def set_plan(plan_type):
        if plan_type not in PLANS:
            return False, "Plano inválido."
        guid, title = PLANS[plan_type]
        LogManager.add_log(f"Ativando plano de energia: {title}...")

        # Verifica se já existe um esquema com esse GUID ou nome instalado para evitar duplicatas
        existing = PowerEngine.list_schemes()
        target_guid = guid
        for s in existing:
            if s["guid"].lower() == guid.lower() or s["nome"].strip().lower() == title.strip().lower():
                target_guid = s["guid"]
                break

        code, _ = run_hidden(f"powercfg /setactive {target_guid}")
        if code != 0:
            # Esquema oculto/ausente: duplica a partir do modelo e ativa a cópia
            _, out = run_hidden(f"powercfg -duplicatescheme {guid}")
            m = GUID_RE.search(out)
            if not m:
                LogManager.add_log(f"[ERRO] Não foi possível criar o plano '{title}'.")
                return False, f"Falha ao ativar '{title}'."
            run_hidden(f"powercfg /setactive {m.group(1)}")
        LogManager.add_log(f"[SUCESSO] Plano '{title}' ativado.")
        return True, f"Plano '{title}' ativado."

    @staticmethod
    def activate_guid(guid):
        if not GUID_RE.fullmatch(guid or ""):
            return False, "GUID inválido."
        code, out = run_hidden(f"powercfg /setactive {guid}")
        LogManager.add_log(f"[POWERCFG] setactive {guid} -> {code}")
        return code == 0, "Plano ativado." if code == 0 else out.strip()

    @staticmethod
    def delete_guid(guid):
        if not GUID_RE.fullmatch(guid or ""):
            return False, "GUID inválido."
        code, out = run_hidden(f"powercfg /delete {guid}")
        LogManager.add_log(f"[POWERCFG] delete {guid} -> {code}")
        return code == 0, "Plano excluído." if code == 0 else (out.strip() or "Não é possível excluir o plano ativo.")

    @staticmethod
    def create_custom(name, monitor_timeout, standby_timeout):
        name = re.sub(r'["`$]', "", str(name))[:60] or "WinShield Turbo"
        mon, stb = int(monitor_timeout or 0), int(standby_timeout or 0)
        LogManager.add_log(f"Criando plano personalizado '{name}'...")
        ps = f"""
        $dup = powercfg -duplicatescheme 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c
        if ($dup -match '([a-fA-F0-9-]{{36}})') {{
            $g = $matches[1]
            powercfg -changename $g "{name}" "Plano de baixa latência criado pelo WinShield Pro" | Out-Null
            powercfg -setactive $g
            powercfg -change -monitor-timeout-ac {mon}
            powercfg -change -standby-timeout-ac {stb}
            powercfg -change -disk-timeout-ac 0
            powercfg -setacvalueindex $g SUB_PROCESSOR PROCTHROTTLEMIN 100
            powercfg -setacvalueindex $g SUB_PROCESSOR PROCTHROTTLEMAX 100
            powercfg -setactive $g
            Write-Output "[SUCESSO] Plano '{name}' criado e ativado ($g)"
        }}
        """
        _, out = run_ps(ps)
        LogManager.add_log(out.strip() or "[AVISO] Nenhuma saída do powercfg.")
        return True, f"Plano '{name}' criado e ativado."

    @staticmethod
    def list_schemes():
        if not IS_WINDOWS:
            return []
        _, out = run_hidden("powercfg /list")
        schemes = []
        pat = re.compile(r"GUID.*?:\s+([a-f0-9\-]{36})\s+\((.*?)\)(\s*\*?)", re.I)
        for line in out.splitlines():
            m = pat.search(line)
            if m:
                schemes.append({"guid": m.group(1), "nome": m.group(2), "ativo": bool(m.group(3).strip())})
        return schemes
