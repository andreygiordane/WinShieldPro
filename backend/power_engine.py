import re
import time
from concurrent.futures import ThreadPoolExecutor

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
HEX_RE = re.compile(r"0x([0-9a-f]{8})", re.I)

# Configurações do plano ativo expostas na interface: chave -> (subgrupo, alias, unidade)
SETTINGS = {
    "cpu_min":      ("SUB_PROCESSOR", "PROCTHROTTLEMIN", "%"),
    "cpu_max":      ("SUB_PROCESSOR", "PROCTHROTTLEMAX", "%"),
    "boost":        ("SUB_PROCESSOR", "PERFBOOSTMODE", "idx"),
    "core_parking": ("SUB_PROCESSOR", "CPMINCORES", "%"),
    "monitor":      ("SUB_VIDEO", "VIDEOIDLE", "s"),
    "sleep":        ("SUB_SLEEP", "STANDBYIDLE", "s"),
    "disk":         ("SUB_DISK", "DISKIDLE", "s"),
    "aspm":         ("SUB_PCIEXPRESS", "ASPM", "idx"),
}
BOOST_MODES = ["Desabilitado", "Habilitado", "Agressivo", "Eficiente", "Eficiente agressivo",
               "Agressivo (garantido)", "Eficiente agressivo (garantido)"]
ASPM_MODES = ["Desligado", "Economia moderada", "Economia máxima"]


class PowerEngine:
    _details_cache = None
    _details_ts = 0.0

    @staticmethod
    def set_plan(plan_type):
        if plan_type not in PLANS:
            return False, "Plano inválido."
        guid, title = PLANS[plan_type]
        LogManager.add_log(f"Ativando plano de energia: {title}...")
        PowerEngine._details_cache = None

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
        PowerEngine._details_cache = None
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
    def create_custom(name, monitor_timeout, standby_timeout, cpu_min=100, cpu_max=100):
        name = re.sub(r'["`$]', "", str(name))[:60] or "WinShield Turbo"
        mon, stb = int(monitor_timeout or 0), int(standby_timeout or 0)
        cpu_min = max(0, min(100, int(cpu_min if cpu_min is not None else 100)))
        cpu_max = max(cpu_min, min(100, int(cpu_max if cpu_max is not None else 100)))
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
            powercfg -setacvalueindex $g SUB_PROCESSOR PROCTHROTTLEMIN {cpu_min}
            powercfg -setacvalueindex $g SUB_PROCESSOR PROCTHROTTLEMAX {cpu_max}
            powercfg -setactive $g
            Write-Output "[SUCESSO] Plano '{name}' criado e ativado ($g)"
        }}
        """
        _, out = run_ps(ps)
        LogManager.add_log(out.strip() or "[AVISO] Nenhuma saída do powercfg.")
        PowerEngine._details_cache = None
        if "[SUCESSO]" not in (out or ""):
            return False, f"Não foi possível criar o plano '{name}' (execute como administrador)."
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

    # ------------------------------------------------------------------
    # DETALHES DO PLANO ATIVO (lidos do powercfg, independentes do idioma)
    # ------------------------------------------------------------------
    @staticmethod
    def _query(sub, alias):
        """Retorna (valor_AC, valor_DC): são sempre os dois últimos valores hex da saída."""
        _, out = run_hidden(["powercfg", "/qh", "SCHEME_CURRENT", sub, alias], timeout=10, shell=False)
        vals = HEX_RE.findall(out or "")
        if len(vals) < 2:
            return None, None
        return int(vals[-2], 16), int(vals[-1], 16)

    @staticmethod
    def get_details(force=False):
        if not IS_WINDOWS:
            return {}
        if not force and PowerEngine._details_cache and time.time() - PowerEngine._details_ts < 4:
            return PowerEngine._details_cache
        _, out = run_hidden(["powercfg", "/getactivescheme"], timeout=10, shell=False)
        m = re.search(r"([a-f0-9\-]{36})\s+\((.*?)\)", out or "", re.I)
        with ThreadPoolExecutor(max_workers=len(SETTINGS)) as ex:
            futs = {k: ex.submit(PowerEngine._query, sub, alias) for k, (sub, alias, _u) in SETTINGS.items()}
            raw = {k: f.result() for k, f in futs.items()}

        settings = {}
        for key, (ac, dc) in raw.items():
            settings[key] = {"ac": ac, "dc": dc, "unit": SETTINGS[key][2]}
        for key, names in (("boost", BOOST_MODES), ("aspm", ASPM_MODES)):
            ac = settings[key]["ac"]
            if ac is not None:
                settings[key]["label"] = names[ac] if ac < len(names) else str(ac)

        battery = None
        try:
            import psutil
            b = psutil.sensors_battery()
            if b is not None:
                battery = {"percent": round(b.percent), "plugged": bool(b.power_plugged)}
        except Exception:
            battery = None

        details = {
            "active_guid": m.group(1) if m else None,
            "active_name": m.group(2) if m else None,
            "settings": settings,
            "boost_modes": BOOST_MODES,
            "aspm_modes": ASPM_MODES,
            "battery": battery,
            "read_at": time.strftime("%H:%M:%S"),
        }
        PowerEngine._details_cache = details
        PowerEngine._details_ts = time.time()
        return details

    @staticmethod
    def set_setting(key, value, apply_dc=False):
        """Altera uma configuração do plano ATIVO e confirma relendo o valor do Windows."""
        if key not in SETTINGS:
            return False, "Configuração inválida."
        sub, alias, unit = SETTINGS[key]
        try:
            value = int(value)
        except (TypeError, ValueError):
            return False, "Valor inválido."
        hi_idx = len(BOOST_MODES) - 1 if key == "boost" else len(ASPM_MODES) - 1
        lo, hi = {"%": (0, 100), "s": (0, 18000), "idx": (0, hi_idx)}[unit]
        if not lo <= value <= hi:
            return False, f"Valor fora do intervalo permitido ({lo}–{hi})."
        cmds = [["powercfg", "/setacvalueindex", "SCHEME_CURRENT", sub, alias, str(value)]]
        if apply_dc:
            cmds.append(["powercfg", "/setdcvalueindex", "SCHEME_CURRENT", sub, alias, str(value)])
        for c in cmds:
            code, out = run_hidden(c, timeout=10, shell=False)
            if code != 0:
                LogManager.add_log(f"[POWERCFG] Falha ao alterar {alias}: {out.strip()}")
                return False, out.strip() or "O Windows recusou a alteração (execute como administrador)."
        run_hidden(["powercfg", "/setactive", "SCHEME_CURRENT"], timeout=10, shell=False)
        ac, _dc = PowerEngine._query(sub, alias)
        PowerEngine._details_cache = None
        if ac != value:
            return False, "O Windows não confirmou a alteração."
        LogManager.add_log(f"[POWERCFG] {alias} = {value} (confirmado por releitura)")
        return True, "Configuração aplicada e confirmada no plano ativo."
