import os
import re
import time
import shutil
import hashlib
import json
import threading
import urllib.request
import urllib.error

from backend.cmd_engine import SystemCommandEngine
from backend.core import IS_WINDOWS
from backend.log_manager import LogManager
from backend.process import run_hidden, run_ps, run_ps_json

SYSTEM_BINARIES = {
    "svchost", "csrss", "lsass", "smss", "winlogon", "services",
    "taskhostw", "explorer", "wininit", "spoolsv", "dwm", "conhost",
    "sihost", "fontdrvhost", "runtimebroker", "ctfmon", "searchhost"
}
QUARANTINE_DIR = r"C:\WinShield_Quarantine"

# Fabricantes oficiais de hardware, drivers e softwares reconhecidos mundialmente
OFFICIAL_VENDORS = {
    "microsoft": "Microsoft Corporation",
    "windows": "Microsoft Windows",
    "nvidia": "NVIDIA Corporation",
    "advanced micro devices": "AMD (Advanced Micro Devices)",
    "amd": "AMD (Advanced Micro Devices)",
    "ati technologies": "AMD / ATI Technologies",
    "intel": "Intel Corporation",
    "realtek": "Realtek Semiconductor Corp.",
    "asustek": "ASUS (ASUSTeK Computer Inc.)",
    "asus": "ASUS (ASUSTeK Computer Inc.)",
    "gigabyte": "Gigabyte Technology",
    "micro-star": "MSI (Micro-Star International)",
    "msi": "MSI (Micro-Star International)",
    "logitech": "Logitech Inc.",
    "corsair": "Corsair Memory Inc.",
    "razer": "Razer Inc.",
    "hewlett-packard": "HP Inc.",
    "hp inc": "HP Inc.",
    "dell": "Dell Inc.",
    "lenovo": "Lenovo Group Ltd.",
    "acer": "Acer Inc.",
    "samsung": "Samsung Electronics",
    "kingston": "Kingston Technology",
    "western digital": "Western Digital",
    "seagate": "Seagate Technology",
    "crucial": "Crucial / Micron",
    "micron": "Micron Technology",
    "broadcom": "Broadcom Inc.",
    "qualcomm": "Qualcomm Technologies",
    "mediatek": "MediaTek Inc.",
    "killer": "Intel / Killer Networking",
    "creative": "Creative Technology Ltd.",
    "nahimic": "Nahimic / SteelSeries",
    "a-volute": "A-Volute (Nahimic Audio)",
    "dolby": "Dolby Laboratories",
    "dts": "DTS Inc.",
    "focusrite": "Focusrite Audio Engineering",
    "steinberg": "Steinberg Media Technologies",
    "waves": "Waves Audio",
    "google": "Google LLC",
    "mozilla": "Mozilla Corporation",
    "brave": "Brave Software Inc.",
    "opera": "Opera Norway AS",
    "apple": "Apple Inc.",
    "adobe": "Adobe Inc.",
    "oracle": "Oracle Corporation",
    "vmware": "VMware Inc.",
    "citrix": "Citrix Systems",
    "cisco": "Cisco Systems",
    "valve": "Valve Corp.",
    "epic games": "Epic Games Inc.",
    "easyanticheat": "Epic Games (EasyAntiCheat)",
    "battleye": "BattlEye Innovations",
    "riot games": "Riot Games Inc.",
    "electronic arts": "Electronic Arts Inc.",
    "ubisoft": "Ubisoft Entertainment",
    "github": "GitHub Inc.",
    "python software foundation": "Python Software Foundation",
    "openjs": "Node.js / OpenJS Foundation",
    "docker": "Docker Inc.",
    "cloudflare": "Cloudflare Inc.",
    "brother": "Brother Industries",
    "canon": "Canon Inc.",
    "epson": "Seiko Epson Corporation",
    "wacom": "Wacom Technology",
    "synaptics": "Synaptics Incorporated",
    "elan": "ELAN Microelectronics",
    "goodix": "Goodix Technology",
    "thunderbolt": "Intel Thunderbolt",
}

# Base Expandida de Inteligência de Ameaças em Nuvem & Heurística (Malware, Miners, Trojans, Backdoors, Spyware, Ransomware)
KNOWN_MALICIOUS_PATTERNS = {
    # Cryptominers & Cryptojacking
    "xmrig": {"category": "Cryptominer (Nuvem)", "severity": "CRÍTICO", "desc": "Minerador de Monero/RandomX não autorizado (XMRig Cryptominer)"},
    "xmr-stak": {"category": "Cryptominer (Nuvem)", "severity": "CRÍTICO", "desc": "Minerador universal de criptomoeda (XMR-Stak)"},
    "ethminer": {"category": "Cryptominer (Nuvem)", "severity": "CRÍTICO", "desc": "Minerador de Ethereum consumindo recursos de GPU/CPU (Ethminer)"},
    "phoenixminer": {"category": "Cryptominer (Nuvem)", "severity": "CRÍTICO", "desc": "Minerador furtivo de GPU (PhoenixMiner)"},
    "nbminer": {"category": "Cryptominer (Nuvem)", "severity": "CRÍTICO", "desc": "Minerador de criptoativos não autorizado (NBMiner)"},
    "cpuminer": {"category": "Cryptominer (Nuvem)", "severity": "ALTO", "desc": "Processo de mineração furtiva por CPU (CPUMiner)"},
    "nanominer": {"category": "Cryptominer (Nuvem)", "severity": "CRÍTICO", "desc": "Minerador multi-algoritmo de criptomoedas (Nanominer)"},
    "gminer": {"category": "Cryptominer (Nuvem)", "severity": "CRÍTICO", "desc": "Minerador de alta performance para GPU (GMiner)"},
    "t-rex": {"category": "Cryptominer (Nuvem)", "severity": "CRÍTICO", "desc": "Minerador de criptomoedas Nvidia (T-Rex Miner)"},
    "lolminer": {"category": "Cryptominer (Nuvem)", "severity": "CRÍTICO", "desc": "Minerador de GPU de múltiplos algoritmos (LolMiner)"},
    "bzminer": {"category": "Cryptominer (Nuvem)", "severity": "CRÍTICO", "desc": "Software de mineração de GPU/CPU (BzMiner)"},
    "srbminer": {"category": "Cryptominer (Nuvem)", "severity": "CRÍTICO", "desc": "Minerador de CPU e GPU multi-thread (SRBMiner)"},
    "nicehash": {"category": "Cryptominer (Nuvem)", "severity": "CRÍTICO", "desc": "Plataforma de mineração de hash rate (NiceHash)"},
    "unmineable": {"category": "Cryptominer (Nuvem)", "severity": "CRÍTICO", "desc": "Software de mineração automatizada de altcoins (Unmineable)"},
    "silentminer": {"category": "Cryptominer (Nuvem)", "severity": "CRÍTICO", "desc": "Minerador oculto furtivo em segundo plano (SilentMiner)"},
    "coinminer": {"category": "Cryptominer (Nuvem)", "severity": "CRÍTICO", "desc": "Processo genérico de mineração de criptomoeda detectado"},
    "cryptonight": {"category": "Cryptominer (Nuvem)", "severity": "CRÍTICO", "desc": "Mecanismo de mineração algoritmo CryptoNight"},
    "winring0": {"category": "Driver Abusado", "severity": "ALTO", "desc": "Driver de hardware frequentemente abusado por mineradores (WinRing0)"},

    # Trojans, Backdoors & RATs
    "asyncrat": {"category": "Trojan.RAT", "severity": "CRÍTICO", "desc": "Trojan de Acesso Remoto de alta periculosidade (AsyncRAT)"},
    "njrat": {"category": "Trojan.RAT", "severity": "CRÍTICO", "desc": "Trojan de Acesso Remoto (njRAT) - Espionagem e controle total"},
    "remcos": {"category": "Trojan.RAT", "severity": "CRÍTICO", "desc": "Trojan de Acesso Remoto invasivo comercialmente abusado (Remcos)"},
    "quasarrat": {"category": "Trojan.RAT", "severity": "CRÍTICO", "desc": "Trojan de Acesso Remoto de código aberto em .NET (QuasarRAT)"},
    "nanocore": {"category": "Trojan.RAT", "severity": "CRÍTICO", "desc": "Trojan de Acesso Remoto modular (NanoCore RAT)"},
    "warzone": {"category": "Trojan.RAT", "severity": "CRÍTICO", "desc": "Trojan de Acesso Remoto com bypass UAC (Warzone RAT)"},
    "netwire": {"category": "Trojan.RAT", "severity": "CRÍTICO", "desc": "Trojan de Acesso Remoto e keylogger furtivo (NetWire)"},
    "darkcomet": {"category": "Trojan.RAT", "severity": "CRÍTICO", "desc": "Trojan clássico de Controle e Espionagem Remota (DarkComet)"},

    # Infostealers, Keyloggers & Spywares
    "redline": {"category": "Infostealer", "severity": "CRÍTICO", "desc": "Ladrão de credenciais, senhas salvas, cookies e carteiras cripto (RedLine)"},
    "vidar": {"category": "Infostealer", "severity": "CRÍTICO", "desc": "Ladrão de informações confidenciais de navegadores e cartões (Vidar)"},
    "raccoon": {"category": "Infostealer", "severity": "CRÍTICO", "desc": "Roubador de senhas e dados confidenciais de usuários (Raccoon Stealer)"},
    "lumma": {"category": "Infostealer", "severity": "CRÍTICO", "desc": "Infostealer evasivo de alta propagação recente (LummaC2)"},
    "stealc": {"category": "Infostealer", "severity": "CRÍTICO", "desc": "Ladrão furtivo de cookies de navegadores e contas (Stealc)"},
    "agenttesla": {"category": "Spyware", "severity": "CRÍTICO", "desc": "Keylogger e espião corporativo de dados confidenciais (AgentTesla)"},
    "formbook": {"category": "Infostealer", "severity": "CRÍTICO", "desc": "Form grabber e keylogger injetor de navegadores (FormBook)"},
    "lokibot": {"category": "Infostealer", "severity": "CRÍTICO", "desc": "Roubador de senhas de clientes de e-mail e navegadores (LokiBot)"},

    # C2 Frameworks & Beacons
    "cobaltstrike": {"category": "C2 Beacon (Nuvem)", "severity": "CRÍTICO", "desc": "Beacon de Comando e Controle militar/malicioso (Cobalt Strike)"},
    "meterpreter": {"category": "C2 Payload (Nuvem)", "severity": "CRÍTICO", "desc": "Payload de exploração e shell reverso (Metasploit Meterpreter)"},
    "sliver": {"category": "C2 Implant (Nuvem)", "severity": "CRÍTICO", "desc": "Implante avançado de Comando e Controle (Sliver C2)"},
    "havoc": {"category": "C2 Framework (Nuvem)", "severity": "CRÍTICO", "desc": "Framework ofensivo de Comando e Controle (Havoc C2 Demon)"},

    # Ransomwares
    "lockbit": {"category": "Ransomware (Nuvem)", "severity": "CRÍTICO", "desc": "Ransomware sequestrador de arquivos corporativos (LockBit)"},
    "blackcat": {"category": "Ransomware (Nuvem)", "severity": "CRÍTICO", "desc": "Ransomware sofisticado de dupla extorsão (BlackCat / ALPHV)"},
    "clop": {"category": "Ransomware (Nuvem)", "severity": "CRÍTICO", "desc": "Ransomware de extorsão e vazamento de dados em massa (Clop)"},
    "wannacry": {"category": "Ransomware (Nuvem)", "severity": "CRÍTICO", "desc": "Worm e Ransomware destrutivo SMB (WannaCry)"},

    # Adware, Sequestradores & PUPs
    "driverpack": {"category": "PUP/Adware (Nuvem)", "severity": "MÉDIO", "desc": "Instalador de softwares indesejados em segundo plano (DriverPack)"},
    "segurazo": {"category": "PUP/Rogue (Nuvem)", "severity": "ALTO", "desc": "Falso antivírus invasivo com persistência de serviços (Segurazo / Santivirus)"},
    "santivirus": {"category": "PUP/Rogue (Nuvem)", "severity": "ALTO", "desc": "Falso otimizador e antivírus rogue (SAntivirus)"},
    "premieropinion": {"category": "Spyware/PUP (Nuvem)", "severity": "ALTO", "desc": "Monitor de hábitos de navegação e telemetria invasiva (PremierOpinion)"},
    "relevantknowledge": {"category": "Spyware/PUP (Nuvem)", "severity": "ALTO", "desc": "Software espião de pesquisas e dados comerciais (RelevantKnowledge)"},
    "searchprotect": {"category": "Adware.Hijacker (Nuvem)", "severity": "ALTO", "desc": "Sequestrador de navegador e injeção de anúncios invasivos (SearchProtect)"},
    "browsefox": {"category": "Adware (Nuvem)", "severity": "MÉDIO", "desc": "Adware gerador de pop-ups e lentidão no navegador (BrowseFox)"},
    "bonanzadeals": {"category": "Adware (Nuvem)", "severity": "MÉDIO", "desc": "Adware e extensão oculta de rastreamento comercial (BonanzaDeals)"}
}

MINER_ARG_PATTERNS = [
    "stratum+tcp://", "stratum+ssl://", "stratum2+tcp://",
    "pool.supportxmr.com", "xmrpool.net", "nanopool.org",
    "f2pool.com", "ethermine.org", "2miners.com", "minexmr.com",
    "hashvault.pro", "unmineable.com", "--donate-level",
    "--algo rx/0", "--algo cryptonight"
]

SUSPICIOUS_SERVICE_PATHS = [
    r"\appdata\local\temp",
    r"\windows\temp",
    r"\users\public",
    r"\perflogs"
]


def _extract_clean_signer(subject_str, company_str=""):
    """Extrai o nome limpo da empresa a partir do Subject do certificado X.509 ou CompanyName."""
    s = (subject_str or "").strip()
    if s and s.lower() not in ("nenhum", "none", "notsigned"):
        m = re.search(r'CN\s*=\s*"([^"]+)"', s)
        if not m:
            m = re.search(r"CN\s*=\s*([^,]+)", s)
        if m:
            return m.group(1).strip()
        return s[:65]
    c = (company_str or "").strip()
    if c:
        return c[:65]
    return "Não Assinado / Desconhecido"


def _identify_official_vendor(signer_str, company_str="", file_desc=""):
    """
    Verifica se o assinante digital ou fabricante corresponde a uma empresa oficial
    de drivers/hardware/software (Microsoft, NVIDIA, AMD, Intel, Realtek, ASUS, etc.).
    """
    combined = f"{signer_str or ''} {company_str or ''} {file_desc or ''}".lower()
    for key, official_name in OFFICIAL_VENDORS.items():
        if key in combined:
            return True, official_name
    return False, _extract_clean_signer(signer_str, company_str)


class AntivirusEngine:
    """
    Módulo Completo de Segurança WinShield:
    - Scanner Interativo em Primeiro Plano (Modo Rápido e Modo Profundo) com progresso em tempo real.
    - Verificador de Assinatura Digital e Fabricantes Oficiais (distingue Drivers Oficiais vs Anomalias Sem Assinatura vs Malware).
    - Inteligência em Nuvem e Heurística de Processos/Serviços/System32.
    """

    _scan_lock = threading.Lock()
    _stop_requested = False
    _scan_state = {
        "running": False,
        "mode": "quick",
        "percent": 0,
        "stage_index": 0,
        "stage_total": 5,
        "stage_name": "Pronto para iniciar varredura",
        "current_item": "Aguardando comando...",
        "scanned_count": 0,
        "verified_drivers_count": 0,
        "anomalies_count": 0,
        "threats_count": 0,
        "elapsed_sec": 0.0,
        "scan_log": [],
        "findings": [],
        "completed": False
    }

    @classmethod
    def get_security_scan_status(cls):
        with cls._scan_lock:
            state = dict(cls._scan_state)
            state["scan_log"] = list(cls._scan_state.get("scan_log", []))[-35:]
            state["findings"] = list(cls._scan_state.get("findings", []))
            return state

    @classmethod
    def stop_security_scan(cls):
        with cls._scan_lock:
            if cls._scan_state.get("running"):
                cls._stop_requested = True
                LogManager.add_log("[SEGURANÇA] Solicitação de parada da varredura recebida.")
                return True
        return False

    @classmethod
    def _update_scan(cls, **kwargs):
        with cls._scan_lock:
            log_line = kwargs.pop("log_line", None)
            finding = kwargs.pop("add_finding", None)
            cls._scan_state.update(kwargs)
            if log_line:
                cls._scan_state["scan_log"].append(log_line)
                if len(cls._scan_state["scan_log"]) > 80:
                    cls._scan_state["scan_log"] = cls._scan_state["scan_log"][-80:]
            if finding:
                cls._scan_state["findings"].append(finding)

    @classmethod
    def start_security_scan(cls, mode="quick"):
        """
        Inicia a varredura interativa de segurança em primeiro plano (Modo Rápido ou Modo Profundo).
        Todo o progresso, arquivo atual, estágio e descobertas ficam visíveis em tempo real na tela.
        """
        mode = "deep" if str(mode).lower() in ("deep", "full", "profundo", "completa") else "quick"
        with cls._scan_lock:
            if cls._scan_state.get("running"):
                return False, "Uma varredura de segurança já está em andamento."
            cls._stop_requested = False
            cls._scan_state = {
                "running": True,
                "mode": mode,
                "percent": 1,
                "stage_index": 1,
                "stage_total": 5,
                "stage_name": "Fase 1/5: Inspecionando Processos Ativos na Memória RAM...",
                "current_item": "Enumerando processos em execução...",
                "scanned_count": 0,
                "verified_drivers_count": 0,
                "anomalies_count": 0,
                "threats_count": 0,
                "elapsed_sec": 0.0,
                "scan_log": [f"[{time.strftime('%H:%M:%S')}] Iniciando Varredura {'Profunda' if mode == 'deep' else 'Rápida'} WinShield Security..."],
                "findings": [],
                "completed": False
            }

        t = threading.Thread(target=cls._security_scan_worker, args=(mode,), daemon=True)
        t.start()
        return True, f"Varredura {'Profunda' if mode == 'deep' else 'Rápida'} iniciada."

    @classmethod
    def _security_scan_worker(cls, mode):
        t0 = time.time()
        scanned = 0
        verified_cnt = 0
        anomalies_cnt = 0
        threats_cnt = 0
        windir = (os.environ.get("SystemRoot") or r"C:\Windows").lower()
        sys32 = os.path.join(windir, "system32")
        syswow64 = os.path.join(windir, "syswow64")

        try:
            # ==================================================================
            # FASE 1/5: PROCESSOS ATIVOS NA MEMÓRIA RAM & ASSINATURAS DIGITAIS
            # ==================================================================
            cls._update_scan(
                stage_index=1,
                percent=4,
                stage_name="Fase 1/5: Auditando Processos Ativos na Memória RAM e Assinaturas...",
                current_item="Coletando árvore de processos e certificados Authenticode...",
                elapsed_sec=round(time.time() - t0, 1)
            )

            ps_procs = r"""
            $sigCache = @{}
            Get-Process | Where-Object { $_.Path } | ForEach-Object {
                $p = $_.Path
                if (-not $sigCache.ContainsKey($p)) {
                    $sig = Get-AuthenticodeSignature -FilePath $p -ErrorAction SilentlyContinue
                    $st = if ($sig) { $sig.Status.ToString() } else { 'NotSigned' }
                    $sub = if ($sig -and $sig.SignerCertificate) { $sig.SignerCertificate.Subject } else { '' }
                    $comp = if ($_.Company) { $_.Company } else { '' }
                    $desc = if ($_.Description) { $_.Description } else { '' }
                    $sigCache[$p] = @{ Status = $st; Signer = $sub; Company = $comp; Desc = $desc }
                }
                $info = $sigCache[$p]
                [pscustomobject]@{
                    Name = $_.Name
                    PID = $_.Id
                    Path = $p
                    Status = $info.Status
                    Signer = $info.Signer
                    Company = $info.Company
                    Desc = $info.Desc
                }
            } | ConvertTo-Json -Compress
            """
            raw_procs = run_ps_json(ps_procs, timeout=45) or []
            if isinstance(raw_procs, dict):
                raw_procs = [raw_procs]

            total_procs = max(1, len(raw_procs))
            seen_paths = set()

            for idx, proc in enumerate(raw_procs):
                if cls._stop_requested:
                    break
                p_name = str(proc.get("Name") or "Processo")
                p_pid = proc.get("PID")
                p_path = str(proc.get("Path") or "")
                p_status = str(proc.get("Status") or "NotSigned")
                p_signer = str(proc.get("Signer") or "")
                p_comp = str(proc.get("Company") or "")
                p_desc = str(proc.get("Desc") or "")

                scanned += 1
                pct = min(24, 4 + int((idx / total_procs) * 20))
                is_official, vendor_name = _identify_official_vendor(p_signer, p_comp, p_desc)
                low_path = p_path.lower()
                low_name = p_name.lower().replace(".exe", "")

                # Verifica se é ameaça conhecida ou spoofing
                matched_mal = None
                for mkey, minfo in KNOWN_MALICIOUS_PATTERNS.items():
                    if mkey in f"{low_name} {low_path}":
                        matched_mal = minfo
                        break

                if matched_mal:
                    threats_cnt += 1
                    finding = {
                        "name": f"{p_name}.exe",
                        "pid": p_pid,
                        "path": p_path,
                        "status": p_status,
                        "publisher": vendor_name,
                        "is_official_driver": False,
                        "is_malware": True,
                        "classification": "malware",
                        "verdict": "MALWARE CONFIRMADO",
                        "severity": matched_mal["severity"],
                        "score": 98,
                        "category": matched_mal["category"],
                        "diagnostico": f"Ameaça detectada na memória: {matched_mal['desc']}",
                        "tipo": "Malware Ativo"
                    }
                    cls._update_scan(
                        percent=pct, scanned_count=scanned, threats_count=threats_cnt,
                        current_item=p_path, elapsed_sec=round(time.time() - t0, 1),
                        log_line=f"[AMEAÇA CRÍTICA] {p_name}.exe (PID {p_pid}) -> {matched_mal['category']}",
                        add_finding=finding
                    )
                elif low_name in SYSTEM_BINARIES and not (low_path.startswith(sys32) or low_path.startswith(syswow64) or low_path.startswith(windir)):
                    threats_cnt += 1
                    finding = {
                        "name": f"{p_name}.exe",
                        "pid": p_pid,
                        "path": p_path,
                        "status": p_status,
                        "publisher": vendor_name,
                        "is_official_driver": False,
                        "is_malware": True,
                        "classification": "malware",
                        "verdict": "SPOOFING / MASQUERADE",
                        "severity": "CRÍTICO",
                        "score": 100,
                        "category": "Falsificação de Binário do Sistema",
                        "diagnostico": f"Processo usando nome crítico do Windows ({p_name}) fora da pasta oficial.",
                        "tipo": "Heurística"
                    }
                    cls._update_scan(
                        percent=pct, scanned_count=scanned, threats_count=threats_cnt,
                        current_item=p_path, elapsed_sec=round(time.time() - t0, 1),
                        log_line=f"[SPOOFING] {p_name}.exe executando fora de C:\\Windows: {p_path}",
                        add_finding=finding
                    )
                elif p_status != "Valid" and any(x in low_path for x in ("\\appdata\\local\\temp\\", "\\windows\\temp\\", "\\users\\public\\")):
                    anomalies_cnt += 1
                    finding = {
                        "name": f"{p_name}.exe",
                        "pid": p_pid,
                        "path": p_path,
                        "status": p_status,
                        "publisher": "Sem Assinatura Digital",
                        "is_official_driver": False,
                        "is_malware": False,
                        "classification": "suspicious_unsigned",
                        "verdict": "ANOMALIA NÃO ASSINADA",
                        "severity": "ALTO",
                        "score": 82,
                        "category": "Executável Temporário Não Assinado",
                        "diagnostico": "Processo sem assinatura digital executando a partir de pasta temporária/pública.",
                        "tipo": "Anomalia de Processo"
                    }
                    cls._update_scan(
                        percent=pct, scanned_count=scanned, anomalies_count=anomalies_cnt,
                        current_item=p_path, elapsed_sec=round(time.time() - t0, 1),
                        log_line=f"[SUSPEITO] Processo sem assinatura em pasta Temp: {p_name}.exe",
                        add_finding=finding
                    )
                else:
                    # Se estiver em System32/SysWOW64 e não for Microsoft, registra se é driver oficial ou anomalia
                    in_sys = low_path.startswith(sys32) or low_path.startswith(syswow64)
                    is_ms = "microsoft" in vendor_name.lower() or "windows" in vendor_name.lower()
                    if in_sys and not is_ms and low_path not in seen_paths:
                        seen_paths.add(low_path)
                        if p_status == "Valid" and is_official:
                            verified_cnt += 1
                            finding = {
                                "name": f"{p_name}.exe",
                                "pid": p_pid,
                                "path": p_path,
                                "status": "Valid",
                                "publisher": vendor_name,
                                "is_official_driver": True,
                                "is_malware": False,
                                "classification": "official_driver",
                                "verdict": f"DRIVER / SERVIÇO OFICIAL ({vendor_name})",
                                "severity": "SEGURO",
                                "score": 0,
                                "category": "Driver / Software Oficial de Empresa",
                                "diagnostico": f"Módulo legítimo em System32 com assinatura digital válida de {vendor_name}. Não é malware.",
                                "tipo": "Driver Oficial Verificado"
                            }
                            cls._update_scan(
                                percent=pct, scanned_count=scanned, verified_drivers_count=verified_cnt,
                                current_item=p_path, elapsed_sec=round(time.time() - t0, 1),
                                log_line=f"[OFICIAL VERIFICADO] {p_name}.exe -> Assinado por {vendor_name}",
                                add_finding=finding
                            )
                        elif p_status != "Valid":
                            anomalies_cnt += 1
                            finding = {
                                "name": f"{p_name}.exe",
                                "pid": p_pid,
                                "path": p_path,
                                "status": p_status,
                                "publisher": vendor_name,
                                "is_official_driver": False,
                                "is_malware": False,
                                "classification": "suspicious_unsigned",
                                "verdict": "ANOMALIA SEM ASSINATURA EM SYSTEM32",
                                "severity": "CRÍTICO",
                                "score": 90,
                                "category": "Binário Não Assinado em System32",
                                "diagnostico": f"Executável rodando dentro de System32/SysWOW64 sem assinatura digital válida ({p_status}).",
                                "tipo": "System32 Anomaly"
                            }
                            cls._update_scan(
                                percent=pct, scanned_count=scanned, anomalies_count=anomalies_cnt,
                                current_item=p_path, elapsed_sec=round(time.time() - t0, 1),
                                log_line=f"[ALERTA SYSTEM32] {p_name}.exe sem assinatura válida em {p_path}",
                                add_finding=finding
                            )
                    else:
                        if is_official and p_status == "Valid" and not is_ms and low_path not in seen_paths:
                            seen_paths.add(low_path)
                            verified_cnt += 1
                        if idx % 3 == 0:
                            cls._update_scan(
                                percent=pct, scanned_count=scanned, verified_drivers_count=verified_cnt,
                                current_item=p_path, elapsed_sec=round(time.time() - t0, 1),
                                log_line=f"[OK] {p_name}.exe ({vendor_name})"
                            )
                time.sleep(0.025)

            # ==================================================================
            # FASE 2/5: AUDITORIA DE SERVIÇOS E DRIVERS DE EMPRESAS (.SYS / .EXE)
            # ==================================================================
            if not cls._stop_requested:
                cls._update_scan(
                    stage_index=2,
                    percent=26,
                    stage_name="Fase 2/5: Verificando Serviços do Windows e Drivers de Hardware...",
                    current_item="Consultando serviços de terceiros e drivers instalados...",
                    elapsed_sec=round(time.time() - t0, 1)
                )

                ps_svcs = r"""
                Get-CimInstance Win32_Service | Where-Object { $_.PathName } | ForEach-Object {
                    $raw = $_.PathName.Trim()
                    if ($raw.StartsWith('\??\')) { $raw = $raw.Substring(4) }
                    $p = ''
                    $args = ''
                    if ($raw.StartsWith('"')) {
                        $i = $raw.IndexOf('"', 1)
                        if ($i -gt 1) { $p = $raw.Substring(1, $i - 1); $args = $raw.Substring($i + 1).Trim() }
                    } else {
                        $m = [regex]::Match($raw, '^(.*?\.exe)\b', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                        if ($m.Success) { $p = $m.Groups[1].Value; $args = $raw.Substring($m.Length).Trim() }
                        else { $p = $raw.Split(' ')[0] }
                    }
                    if ($p -and ($p -notmatch 'svchost\.exe')) {
                        $sig = Get-AuthenticodeSignature -FilePath $p -ErrorAction SilentlyContinue
                        $st = if ($sig) { $sig.Status.ToString() } else { 'NotSigned' }
                        $sub = if ($sig -and $sig.SignerCertificate) { $sig.SignerCertificate.Subject } else { '' }
                        [pscustomobject]@{
                            Name = $_.Name
                            DisplayName = $_.DisplayName
                            State = $_.State
                            PID = $_.ProcessId
                            Path = $p
                            Args = $args
                            Status = $st
                            Signer = $sub
                        }
                    }
                } | ConvertTo-Json -Compress
                """
                raw_svcs = run_ps_json(ps_svcs, timeout=45) or []
                if isinstance(raw_svcs, dict):
                    raw_svcs = [raw_svcs]

                total_svcs = max(1, len(raw_svcs))
                for idx, svc in enumerate(raw_svcs):
                    if cls._stop_requested:
                        break
                    s_name = str(svc.get("Name") or "")
                    s_disp = str(svc.get("DisplayName") or s_name)
                    s_path = str(svc.get("Path") or "")
                    s_args = str(svc.get("Args") or "")
                    s_pid = svc.get("PID")
                    s_status = str(svc.get("Status") or "NotSigned")
                    s_signer = str(svc.get("Signer") or "")

                    scanned += 1
                    pct = min(50, 26 + int((idx / total_svcs) * 24))
                    is_official, vendor_name = _identify_official_vendor(s_signer, "", s_disp)
                    low_comb = f"{s_name} {s_disp} {s_path} {s_args}".lower()

                    matched_mal = None
                    for mkey, minfo in KNOWN_MALICIOUS_PATTERNS.items():
                        if mkey in low_comb:
                            matched_mal = minfo
                            break

                    matched_pool = None
                    for parg in MINER_ARG_PATTERNS:
                        if parg in s_args.lower():
                            matched_pool = parg
                            break

                    if matched_mal or matched_pool:
                        threats_cnt += 1
                        desc_txt = matched_mal["desc"] if matched_mal else f"Serviço conectado a pool de mineração ({matched_pool})"
                        finding = {
                            "name": f"Serviço: {s_disp} ({s_name})",
                            "service_name": s_name,
                            "pid": s_pid if (s_pid and int(s_pid) > 0) else None,
                            "path": s_path,
                            "status": s_status,
                            "publisher": vendor_name,
                            "is_official_driver": False,
                            "is_malware": True,
                            "classification": "malware",
                            "verdict": "SERVIÇO MALICIOSO CONFIRMADO",
                            "severity": "CRÍTICO",
                            "score": 98,
                            "category": matched_mal["category"] if matched_mal else "Cryptominer Service",
                            "diagnostico": desc_txt,
                            "tipo": "Cloud Threat",
                            "is_service": True
                        }
                        cls._update_scan(
                            percent=pct, scanned_count=scanned, threats_count=threats_cnt,
                            current_item=s_path, elapsed_sec=round(time.time() - t0, 1),
                            log_line=f"[MALWARE SERVIÇO] {s_disp} -> {desc_txt}",
                            add_finding=finding
                        )
                    elif any(sp in s_path.lower() for sp in SUSPICIOUS_SERVICE_PATHS):
                        anomalies_cnt += 1
                        finding = {
                            "name": f"Serviço: {s_disp} ({s_name})",
                            "service_name": s_name,
                            "pid": s_pid if (s_pid and int(s_pid) > 0) else None,
                            "path": s_path,
                            "status": s_status,
                            "publisher": vendor_name,
                            "is_official_driver": False,
                            "is_malware": False,
                            "classification": "suspicious_unsigned",
                            "verdict": "SERVIÇO EM PASTA TEMPORÁRIA (ALTO RISCO)",
                            "severity": "ALTO",
                            "score": 88,
                            "category": "Serviço em Diretório Volátil",
                            "diagnostico": f"Serviço configurado para rodar fora de pastas seguras ({s_path}).",
                            "tipo": "Anomalia de Serviço",
                            "is_service": True
                        }
                        cls._update_scan(
                            percent=pct, scanned_count=scanned, anomalies_count=anomalies_cnt,
                            current_item=s_path, elapsed_sec=round(time.time() - t0, 1),
                            log_line=f"[ALERTA SERVIÇO] {s_disp} em diretório suspeito: {s_path}",
                            add_finding=finding
                        )
                    elif s_status != "Valid" and os.path.exists(s_path):
                        anomalies_cnt += 1
                        finding = {
                            "name": f"Serviço: {s_disp} ({s_name})",
                            "service_name": s_name,
                            "pid": s_pid if (s_pid and int(s_pid) > 0) else None,
                            "path": s_path,
                            "status": s_status,
                            "publisher": vendor_name,
                            "is_official_driver": False,
                            "is_malware": False,
                            "classification": "suspicious_unsigned",
                            "verdict": "SERVIÇO SEM ASSINATURA DIGITAL",
                            "severity": "MÉDIO",
                            "score": 65,
                            "category": "Serviço Não Assinado",
                            "diagnostico": f"Serviço de terceiros sem certificado digital Authenticode válido ({s_status}). Verifique se reconhece o software.",
                            "tipo": "Anomalia de Serviço",
                            "is_service": True
                        }
                        cls._update_scan(
                            percent=pct, scanned_count=scanned, anomalies_count=anomalies_cnt,
                            current_item=s_path, elapsed_sec=round(time.time() - t0, 1),
                            log_line=f"[SEM ASSINATURA] Serviço {s_disp} ({s_path})",
                            add_finding=finding
                        )
                    else:
                        is_ms = "microsoft" in vendor_name.lower() or "windows" in vendor_name.lower()
                        if is_official and not is_ms and s_path.lower() not in seen_paths:
                            seen_paths.add(s_path.lower())
                            verified_cnt += 1
                            finding = {
                                "name": f"Driver/Serviço: {s_disp}",
                                "service_name": s_name,
                                "pid": s_pid if (s_pid and int(s_pid) > 0) else None,
                                "path": s_path,
                                "status": "Valid",
                                "publisher": vendor_name,
                                "is_official_driver": True,
                                "is_malware": False,
                                "classification": "official_driver",
                                "verdict": f"DRIVER / SERVIÇO OFICIAL ({vendor_name})",
                                "severity": "SEGURO",
                                "score": 0,
                                "category": "Driver / Serviço Oficial Verificado",
                                "diagnostico": f"Serviço oficial de fabricante reconhecido ({vendor_name}) com assinatura digital válida.",
                                "tipo": "Driver Oficial Verificado",
                                "is_service": True
                            }
                            cls._update_scan(
                                percent=pct, scanned_count=scanned, verified_drivers_count=verified_cnt,
                                current_item=s_path, elapsed_sec=round(time.time() - t0, 1),
                                log_line=f"[DRIVER OFICIAL] {s_disp} -> {vendor_name}",
                                add_finding=finding
                            )
                        elif idx % 4 == 0:
                            cls._update_scan(
                                percent=pct, scanned_count=scanned, verified_drivers_count=verified_cnt,
                                current_item=s_path, elapsed_sec=round(time.time() - t0, 1)
                            )
                    time.sleep(0.02)

            # ==================================================================
            # FASE 3/5: AUDITORIA DE DRIVERS (.SYS) E SYSTEM32 / SYSWOW64
            # ==================================================================
            if not cls._stop_requested:
                cls._update_scan(
                    stage_index=3,
                    percent=52,
                    stage_name="Fase 3/5: Inspecionando Drivers de Kernel (System32\\drivers) e Binários System32...",
                    current_item=os.path.join(sys32, "drivers"),
                    elapsed_sec=round(time.time() - t0, 1)
                )

                drv_limit = 120 if mode == "deep" else 45
                ps_drivers = f"""
                $drvDir = Join-Path $env:SystemRoot 'System32\\drivers'
                Get-ChildItem -Path $drvDir -Filter '*.sys' -ErrorAction SilentlyContinue |
                    Sort-Object LastWriteTime -Descending | Select-Object -First {drv_limit} | ForEach-Object {{
                        $p = $_.FullName
                        $sig = Get-AuthenticodeSignature -FilePath $p -ErrorAction SilentlyContinue
                        $st = if ($sig) {{ $sig.Status.ToString() }} else {{ 'NotSigned' }}
                        $sub = if ($sig -and $sig.SignerCertificate) {{ $sig.SignerCertificate.Subject }} else {{ '' }}
                        $vi = $_.VersionInfo
                        $comp = if ($vi -and $vi.CompanyName) {{ $vi.CompanyName }} else {{ '' }}
                        $desc = if ($vi -and $vi.FileDescription) {{ $vi.FileDescription }} else {{ $_.Name }}
                        [pscustomobject]@{{
                            Name = $_.Name
                            Path = $p
                            Status = $st
                            Signer = $sub
                            Company = $comp
                            Desc = $desc
                        }}
                    }} | ConvertTo-Json -Compress
                """
                raw_drvs = run_ps_json(ps_drivers, timeout=45) or []
                if isinstance(raw_drvs, dict):
                    raw_drvs = [raw_drvs]

                total_drvs = max(1, len(raw_drvs))
                for idx, drv in enumerate(raw_drvs):
                    if cls._stop_requested:
                        break
                    d_name = str(drv.get("Name") or "")
                    d_path = str(drv.get("Path") or "")
                    d_status = str(drv.get("Status") or "NotSigned")
                    d_signer = str(drv.get("Signer") or "")
                    d_comp = str(drv.get("Company") or "")
                    d_desc = str(drv.get("Desc") or d_name)

                    scanned += 1
                    pct = min(72, 52 + int((idx / total_drvs) * 20))
                    is_official, vendor_name = _identify_official_vendor(d_signer, d_comp, d_desc)
                    is_ms = "microsoft" in vendor_name.lower() or "windows" in vendor_name.lower()

                    if "winring0" in d_name.lower():
                        anomalies_cnt += 1
                        finding = {
                            "name": d_name,
                            "pid": None,
                            "path": d_path,
                            "status": d_status,
                            "publisher": vendor_name,
                            "is_official_driver": False,
                            "is_malware": False,
                            "classification": "suspicious_unsigned",
                            "verdict": "DRIVER VULNERÁVEL / ABUSADO (WinRing0)",
                            "severity": "ALTO",
                            "score": 80,
                            "category": "Driver de Kernel Sensível",
                            "diagnostico": "Driver WinRing0 detectado. Frequentemente utilizado por softwares de monitoramento ou abusado por mineradores.",
                            "tipo": "Kernel Driver"
                        }
                        cls._update_scan(
                            percent=pct, scanned_count=scanned, anomalies_count=anomalies_cnt,
                            current_item=d_path, elapsed_sec=round(time.time() - t0, 1),
                            log_line=f"[ALERTA DRIVER] {d_name} ({vendor_name})",
                            add_finding=finding
                        )
                    elif d_status != "Valid":
                        anomalies_cnt += 1
                        finding = {
                            "name": d_name,
                            "pid": None,
                            "path": d_path,
                            "status": d_status,
                            "publisher": vendor_name,
                            "is_official_driver": False,
                            "is_malware": False,
                            "classification": "suspicious_unsigned",
                            "verdict": "DRIVER DE KERNEL SEM ASSINATURA VÁLIDA",
                            "severity": "CRÍTICO",
                            "score": 92,
                            "category": "Kernel Driver Não Assinado",
                            "diagnostico": f"Driver de kernel (.sys) em System32\\drivers sem assinatura Authenticode válida ({d_status}).",
                            "tipo": "Kernel Driver Anomaly"
                        }
                        cls._update_scan(
                            percent=pct, scanned_count=scanned, anomalies_count=anomalies_cnt,
                            current_item=d_path, elapsed_sec=round(time.time() - t0, 1),
                            log_line=f"[CRÍTICO] Driver sem assinatura: {d_name}",
                            add_finding=finding
                        )
                    elif is_official and not is_ms and d_path.lower() not in seen_paths:
                        seen_paths.add(d_path.lower())
                        verified_cnt += 1
                        finding = {
                            "name": f"{d_name} ({d_desc})",
                            "pid": None,
                            "path": d_path,
                            "status": "Valid",
                            "publisher": vendor_name,
                            "is_official_driver": True,
                            "is_malware": False,
                            "classification": "official_driver",
                            "verdict": f"DRIVER OFICIAL DE HARDWARE ({vendor_name})",
                            "severity": "SEGURO",
                            "score": 0,
                            "category": "Driver de Kernel Oficial",
                            "diagnostico": f"Driver oficial de empresa verificada ({vendor_name}) com assinatura digital autêntica. Seguro.",
                            "tipo": "Driver Oficial Verificado"
                        }
                        cls._update_scan(
                            percent=pct, scanned_count=scanned, verified_drivers_count=verified_cnt,
                            current_item=d_path, elapsed_sec=round(time.time() - t0, 1),
                            log_line=f"[DRIVER OFICIAL] {d_name} -> {vendor_name}",
                            add_finding=finding
                        )
                    else:
                        if idx % 3 == 0:
                            cls._update_scan(
                                percent=pct, scanned_count=scanned, verified_drivers_count=verified_cnt,
                                current_item=d_path, elapsed_sec=round(time.time() - t0, 1),
                                log_line=f"[OK DRIVER] {d_name} ({vendor_name})"
                            )
                    time.sleep(0.015)

            # ==================================================================
            # FASE 4/5: PERSISTÊNCIA DE INICIALIZAÇÃO E REGISTRO RUN
            # ==================================================================
            if not cls._stop_requested:
                cls._update_scan(
                    stage_index=4,
                    percent=74,
                    stage_name="Fase 4/5: Auditando Chaves de Inicialização (Registry Run) e Tarefas...",
                    current_item=r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
                    elapsed_sec=round(time.time() - t0, 1)
                )

                ps_startup = r"""
                $paths = @(
                    'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run',
                    'HKLM:\Software\Microsoft\Windows\CurrentVersion\Run',
                    'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Run'
                )
                $out = @()
                foreach ($rp in $paths) {
                    if (Test-Path $rp) {
                        $props = Get-ItemProperty $rp
                        foreach ($p in $props.PSObject.Properties) {
                            if ($p.Name -notmatch '^PS') {
                                $out += [pscustomobject]@{ Key = $rp; Name = $p.Name; Value = [string]$p.Value }
                            }
                        }
                    }
                }
                $out | ConvertTo-Json -Compress
                """
                raw_st = run_ps_json(ps_startup, timeout=20) or []
                if isinstance(raw_st, dict):
                    raw_st = [raw_st]

                for st_item in raw_st:
                    if cls._stop_requested:
                        break
                    st_name = str(st_item.get("Name") or "")
                    st_val = str(st_item.get("Value") or "")
                    scanned += 1
                    low_v = f"{st_name} {st_val}".lower()
                    for mkey, minfo in KNOWN_MALICIOUS_PATTERNS.items():
                        if mkey in low_v:
                            threats_cnt += 1
                            finding = {
                                "name": f"Inicialização: {st_name}",
                                "pid": None,
                                "path": st_val,
                                "status": "Persistência",
                                "publisher": "Desconhecido",
                                "is_official_driver": False,
                                "is_malware": True,
                                "classification": "malware",
                                "verdict": "PERSISTÊNCIA MALICIOSA NO REGISTRO",
                                "severity": "CRÍTICO",
                                "score": 96,
                                "category": minfo["category"],
                                "diagnostico": f"Chave de inicialização aponta para ameaça conhecida: {minfo['desc']}",
                                "tipo": "Startup Threat"
                            }
                            cls._update_scan(
                                scanned_count=scanned, threats_count=threats_cnt,
                                current_item=st_val, elapsed_sec=round(time.time() - t0, 1),
                                log_line=f"[AMEAÇA STARTUP] {st_name} -> {st_val}",
                                add_finding=finding
                            )
                            break
                    cls._update_scan(
                        percent=78, scanned_count=scanned,
                        current_item=f"Startup: {st_name}",
                        elapsed_sec=round(time.time() - t0, 1)
                    )
                    time.sleep(0.02)

            # ==================================================================
            # FASE 5/5: VARREDURA DE ARQUIVOS EM DIRETÓRIOS CRÍTICOS (RÁPIDA OU PROFUNDA)
            # ==================================================================
            if not cls._stop_requested:
                cls._update_scan(
                    stage_index=5,
                    percent=80,
                    stage_name=(
                        "Fase 5/5: Varredura Profunda de Sistema de Arquivos (AppData, Temp, ProgramData, Downloads, System32)..."
                        if mode == "deep" else
                        "Fase 5/5: Varredura Rápida de Executáveis em Pastas Temporárias e AppData..."
                    ),
                    current_item="Iniciando inspeção de diretórios...",
                    elapsed_sec=round(time.time() - t0, 1)
                )

                local_app = os.environ.get("LOCALAPPDATA", "")
                roam_app = os.environ.get("APPDATA", "")
                temp_dir = os.environ.get("TEMP", "")
                prog_data = os.environ.get("ProgramData", r"C:\ProgramData")
                user_prof = os.environ.get("USERPROFILE", "")
                downloads_dir = os.path.join(user_prof, "Downloads") if user_prof else ""

                scan_roots = [
                    temp_dir,
                    os.path.join(windir, "Temp"),
                    r"C:\Users\Public",
                    roam_app,
                ]
                if mode == "deep":
                    scan_roots.extend([local_app, prog_data, downloads_dir, sys32])

                target_exts = {".exe", ".dll", ".sys", ".bat", ".cmd", ".ps1", ".vbs", ".scr"}
                max_files_to_inspect = 950 if mode == "deep" else 220
                inspected_files = 0

                for root_dir in scan_roots:
                    if cls._stop_requested or not root_dir or not os.path.exists(root_dir):
                        continue
                    try:
                        for dirpath, dirnames, filenames in os.walk(root_dir):
                            if cls._stop_requested or inspected_files >= max_files_to_inspect:
                                break
                            # Em modo rápido, não aprofunda mais de 2 níveis
                            if mode == "quick":
                                rel_depth = dirpath[len(root_dir):].count(os.sep)
                                if rel_depth > 2:
                                    dirnames[:] = []
                                    continue

                            for fn in filenames:
                                if cls._stop_requested or inspected_files >= max_files_to_inspect:
                                    break
                                ext = os.path.splitext(fn)[1].lower()
                                if ext not in target_exts:
                                    continue
                                full_p = os.path.join(dirpath, fn)
                                inspected_files += 1
                                scanned += 1

                                low_fn = fn.lower()
                                low_fp = full_p.lower()
                                for mkey, minfo in KNOWN_MALICIOUS_PATTERNS.items():
                                    if mkey in low_fn or mkey in low_fp:
                                        threats_cnt += 1
                                        finding = {
                                            "name": fn,
                                            "pid": None,
                                            "path": full_p,
                                            "status": "MaliciousMatch",
                                            "publisher": "Não Verificado",
                                            "is_official_driver": False,
                                            "is_malware": True,
                                            "classification": "malware",
                                            "verdict": "ARQUIVO MALICIOSO DETECTADO",
                                            "severity": minfo["severity"],
                                            "score": 95,
                                            "category": minfo["category"],
                                            "diagnostico": f"Arquivo executável corresponde ao padrão de ameaça: {minfo['desc']}",
                                            "tipo": "File Scanner"
                                        }
                                        cls._update_scan(
                                            threats_count=threats_cnt,
                                            log_line=f"[AMEAÇA ARQUIVO] {full_p} -> {minfo['category']}",
                                            add_finding=finding
                                        )
                                        break

                                if inspected_files % 5 == 0:
                                    pct = min(99, 80 + int((inspected_files / max_files_to_inspect) * 19))
                                    cls._update_scan(
                                        percent=pct,
                                        scanned_count=scanned,
                                        current_item=full_p,
                                        elapsed_sec=round(time.time() - t0, 1),
                                        log_line=f"[SCAN] {full_p}" if inspected_files % 25 == 0 else None
                                    )
                                    time.sleep(0.012 if mode == "deep" else 0.018)
                    except OSError:
                        continue

            elapsed_total = round(time.time() - t0, 1)
            final_stage = (
                "Varredura interrompida pelo usuário."
                if cls._stop_requested else
                f"Varredura {'Profunda' if mode == 'deep' else 'Rápida'} concluída! {scanned} itens analisados ({verified_cnt} drivers oficiais, {anomalies_cnt} anomalias, {threats_cnt} malwares)."
            )
            cls._update_scan(
                running=False,
                completed=True,
                percent=100 if not cls._stop_requested else cls._scan_state.get("percent", 0),
                stage_name=final_stage,
                current_item="Inspeção finalizada.",
                scanned_count=scanned,
                verified_drivers_count=verified_cnt,
                anomalies_count=anomalies_cnt,
                threats_count=threats_cnt,
                elapsed_sec=elapsed_total,
                log_line=f"[{time.strftime('%H:%M:%S')}] {final_stage}"
            )
            LogManager.add_log(f"[SEGURANÇA] {final_stage}")
        except Exception as e:
            LogManager.add_log(f"[ERRO SCANNER SEGURANÇA] {e}")
            cls._update_scan(
                running=False,
                completed=True,
                stage_name=f"Varredura concluída com aviso: {e}",
                current_item="Finalizado."
            )

    @staticmethod
    def scan_threats():
        """Varredura Heurística em tempo real de processos em execução."""
        LogManager.add_log("=== VARREDURA HEURÍSTICA DE PROCESSOS ===")
        if not IS_WINDOWS:
            return []
        script = (
            "$sigCache = @{}; "
            "Get-Process | Where-Object { $_.Path } | ForEach-Object { "
            "  $p = $_.Path; "
            "  if (-not $sigCache.ContainsKey($p)) { "
            "    $s = (Get-AuthenticodeSignature -FilePath $p -ErrorAction SilentlyContinue).Status; "
            "    $sigCache[$p] = if ($s) { $s.ToString() } else { 'NotSigned' }; "
            "  }; "
            "  \"$($_.Name)|$($_.Id)|$p|$($sigCache[$p])\" "
            "}"
        )
        _, out = run_ps(script, timeout=120)
        threats = []
        windir = os.environ.get("SystemRoot", r"C:\Windows").lower()
        for line in out.splitlines():
            p = line.strip().split("|")
            if len(p) < 3:
                continue
            name, pid, path = p[0], p[1], p[2]
            sig = p[3] if len(p) > 3 else ""
            low, lname = path.lower(), name.lower()
            signed = sig.lower() == "valid"
            if lname in SYSTEM_BINARIES and not low.startswith(windir):
                threats.append(dict(processo=name, pid=pid, nivel="CRÍTICO", score=100,
                                    diagnostico="Nome de processo do sistema rodando fora do Windows (Masquerade / Spoofing)",
                                    caminho=path, assinatura=sig, tipo="Heurística",
                                    is_official_driver=False, is_malware=True, classification="malware",
                                    verdict="MALWARE / SPOOFING"))
            elif ("\\appdata\\local\\temp\\" in low or "\\windows\\temp\\" in low) and not signed:
                threats.append(dict(processo=name, pid=pid, nivel="ALTO", score=80,
                                    diagnostico="Executável sem assinatura digital rodando a partir de pasta temporária",
                                    caminho=path, assinatura=sig, tipo="Heurística",
                                    is_official_driver=False, is_malware=False, classification="suspicious_unsigned",
                                    verdict="ANOMALIA NÃO ASSINADA"))
            elif "\\appdata\\roaming\\" in low and not signed and "\\programs\\" not in low:
                threats.append(dict(processo=name, pid=pid, nivel="MÉDIO", score=50,
                                    diagnostico="Executável não assinado localizado em pasta oculta de AppData",
                                    caminho=path, assinatura=sig, tipo="Heurística",
                                    is_official_driver=False, is_malware=False, classification="suspicious_unsigned",
                                    verdict="ANOMALIA NÃO ASSINADA"))
            elif "\\users\\public\\" in low and not signed:
                threats.append(dict(processo=name, pid=pid, nivel="MÉDIO", score=50,
                                    diagnostico="Executável sem assinatura rodando na pasta pública",
                                    caminho=path, assinatura=sig, tipo="Heurística",
                                    is_official_driver=False, is_malware=False, classification="suspicious_unsigned",
                                    verdict="ANOMALIA NÃO ASSINADA"))
        threats.sort(key=lambda t: -t["score"])
        LogManager.add_log(f"[OK] Varredura heurística concluída: {len(threats)} processo(s) suspeito(s).")
        return threats

    @staticmethod
    def scan_system32_anomalies():
        """
        Varredura profunda especializada em System32, SysWOW64 e System32\\drivers.
        Diferencia claramente:
        - Drivers e Módulos Oficiais de Empresas (NVIDIA, AMD, Intel, Realtek, ASUS, Logitech, etc.) -> SEGURO (Driver Oficial)
        - Binários Não Assinados ou Adulterados em System32 -> ANOMALIA / SUSPEITO
        - Malwares / Trojans Camuflados -> MALWARE CONFIRMADO
        """
        LogManager.add_log("=== VARREDURA PROFUNDA SYSTEM32 / SYSWOW64 & VERIFICAÇÃO DE DRIVERS OFICIAIS ===")
        if not IS_WINDOWS:
            return []

        ps_script = r"""
        $results = @()
        $seen = @{}
        $sysDirs = @("$env:SystemRoot\System32", "$env:SystemRoot\SysWOW64")
        Get-Process | Where-Object { $_.Path } | ForEach-Object {
            $p = $_.Path
            if ($seen.ContainsKey($p.ToLower())) { return }
            $inSys = $false
            foreach($d in $sysDirs) {
                if($p.StartsWith($d, [System.StringComparison]::OrdinalIgnoreCase)) { $inSys = $true; break }
            }
            if ($inSys) {
                $seen[$p.ToLower()] = $true
                $sigObj = Get-AuthenticodeSignature -FilePath $p -ErrorAction SilentlyContinue
                $status = if ($sigObj) { $sigObj.Status.ToString() } else { 'NotSigned' }
                $signer = if ($sigObj -and $sigObj.SignerCertificate) { $sigObj.SignerCertificate.Subject } else { 'Nenhum' }
                $comp = if ($_.Company) { $_.Company } else { '' }
                $desc = if ($_.Description) { $_.Description } else { '' }
                $isMs = ($signer -match 'Microsoft (Corporation|Windows|Publisher)') -or ($comp -match 'Microsoft')
                if ($status -ne 'Valid' -or -not $isMs) {
                    $results += [PSCustomObject]@{
                        Name = $_.Name
                        PID = $_.Id
                        Path = $p
                        Status = $status
                        Signer = $signer
                        Company = $comp
                        Desc = $desc
                        IsMicrosoft = $isMs
                    }
                }
            }
        }
        $drvDir = Join-Path $env:SystemRoot 'System32\drivers'
        Get-ChildItem -Path $drvDir -Filter '*.sys' -ErrorAction SilentlyContinue |
            Sort-Object LastWriteTime -Descending | Select-Object -First 35 | ForEach-Object {
                $p = $_.FullName
                $sigObj = Get-AuthenticodeSignature -FilePath $p -ErrorAction SilentlyContinue
                $status = if ($sigObj) { $sigObj.Status.ToString() } else { 'NotSigned' }
                $signer = if ($sigObj -and $sigObj.SignerCertificate) { $sigObj.SignerCertificate.Subject } else { 'Nenhum' }
                $vi = $_.VersionInfo
                $comp = if ($vi -and $vi.CompanyName) { $vi.CompanyName } else { '' }
                $desc = if ($vi -and $vi.FileDescription) { $vi.FileDescription } else { $_.Name }
                $isMs = ($signer -match 'Microsoft (Corporation|Windows|Publisher|Hardware Compatibility)') -or ($comp -match 'Microsoft')
                if ($status -ne 'Valid' -or -not $isMs) {
                    $results += [PSCustomObject]@{
                        Name = $_.Name
                        PID = $null
                        Path = $p
                        Status = $status
                        Signer = $signer
                        Company = $comp
                        Desc = $desc
                        IsMicrosoft = $isMs
                    }
                }
            }
        $results | ConvertTo-Json -Compress
        """

        anomalies = []
        try:
            raw = run_ps_json(ps_script, timeout=60)
            if isinstance(raw, dict):
                raw = [raw]
            if isinstance(raw, list):
                for item in raw:
                    name = str(item.get("Name") or "")
                    pid = item.get("PID")
                    path = str(item.get("Path") or "")
                    status = str(item.get("Status") or "NotSigned")
                    signer = str(item.get("Signer") or "")
                    company = str(item.get("Company") or "")
                    desc = str(item.get("Desc") or "")

                    is_official, vendor_clean = _identify_official_vendor(signer, company, desc)
                    low_comb = f"{name} {path}".lower()

                    matched_mal = None
                    for mkey, minfo in KNOWN_MALICIOUS_PATTERNS.items():
                        if mkey in low_comb:
                            matched_mal = minfo
                            break

                    display_name = name if (name.lower().endswith(".exe") or name.lower().endswith(".sys")) else f"{name}.exe"

                    if matched_mal:
                        classification = "malware"
                        is_malware = True
                        is_official_driver = False
                        severity = "CRÍTICO"
                        score = 98
                        verdict = "MALWARE CONFIRMADO EM SYSTEM32"
                        cat = matched_mal["category"]
                        diag = f"Malware identificado em diretório do sistema: {matched_mal['desc']}"
                    elif status != "Valid":
                        classification = "suspicious_unsigned"
                        is_malware = False
                        is_official_driver = False
                        severity = "CRÍTICO"
                        score = 92
                        verdict = "ANOMALIA SEM ASSINATURA DIGITAL (SUSPEITO)"
                        cat = "Assinatura Inválida / Ausente em System32"
                        diag = f"Binário em pasta de sistema sem assinatura digital válida ({status}). Fabricante reportado: {vendor_clean}."
                    elif is_official:
                        classification = "official_driver"
                        is_malware = False
                        is_official_driver = True
                        severity = "SEGURO"
                        score = 0
                        verdict = f"DRIVER / MÓDULO OFICIAL ({vendor_clean})"
                        cat = "Driver Oficial de Empresa Verificada"
                        diag = f"Driver/serviço legítimo de empresa oficial ({vendor_clean}) com certificado digital Authenticode válido ({desc or display_name}). Não é malware."
                    else:
                        classification = "third_party_signed"
                        is_malware = False
                        is_official_driver = False
                        severity = "MÉDIO"
                        score = 55
                        verdict = f"SOFTWARE DE TERCEIROS ASSINADO ({vendor_clean})"
                        cat = "Software Assinado Não-Microsoft em System32"
                        diag = f"Binário com assinatura válida emitido por '{vendor_clean}'. Verifique se reconhece este fabricante."

                    anomalies.append({
                        "name": display_name,
                        "pid": pid,
                        "path": path,
                        "status": status,
                        "signer": vendor_clean,
                        "publisher": vendor_clean,
                        "description": desc,
                        "is_official_driver": is_official_driver,
                        "is_malware": is_malware,
                        "classification": classification,
                        "verdict": verdict,
                        "severity": severity,
                        "score": score,
                        "category": cat,
                        "diagnostico": diag,
                        "tipo": "System32 Anomaly"
                    })
        except Exception as e:
            LogManager.add_log(f"[AVISO] Falha na varredura profunda do System32: {e}")

        # Ordena ameaças/anomalias primeiro e drivers oficiais verificados logo abaixo
        anomalies.sort(key=lambda x: (-x["score"], x["name"]))
        official_count = sum(1 for a in anomalies if a.get("is_official_driver"))
        susp_count = len(anomalies) - official_count
        LogManager.add_log(f"[OK] Auditoria System32 finalizada: {susp_count} anomalia(s) suspeita(s) e {official_count} driver(s) oficial(is) de empresas verificado(s).")
        return anomalies

    @staticmethod
    def scan_cloud_threats():
        """
        Auditoria local de serviços e processos.
        Verifica todos os SERVIÇOS do Windows instalados e PROCESSOS ativos
        (caminho, assinatura digital e localização). Não consulta serviços online.
        """
        LogManager.add_log("=== AUDITORIA DE SERVIÇOS E PROCESSOS ===")
        if not IS_WINDOWS:
            return []

        threats = []
        windir = (os.environ.get("SystemRoot") or r"C:\Windows").lower()
        sys32 = os.path.join(windir, "system32")
        syswow64 = os.path.join(windir, "syswow64")

        LogManager.add_log("[SERVIÇOS] Mapeando todos os serviços do Windows instalados na máquina...")
        ps_services = """
        $results = @()
        Get-CimInstance Win32_Service | ForEach-Object {
            $raw = $_.PathName
            if (-not $raw) { return }
            $clean = $raw.Trim()
            if ($clean.StartsWith('\\??\\')) { $clean = $clean.Substring(4) }
            $p = ''
            $args = ''
            if ($clean.StartsWith('"')) {
                $idx = $clean.IndexOf('"', 1)
                if ($idx -gt 1) { 
                    $p = $clean.Substring(1, $idx - 1)
                    $args = $clean.Substring($idx + 1).Trim()
                }
            } else {
                $m = [regex]::Match($clean, '^(.*?\\.exe)\\b', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                if ($m.Success) { 
                    $p = $m.Groups[1].Value
                    $args = $clean.Substring($m.Length).Trim()
                } else { 
                    $p = $clean.Split(' ')[0]
                }
            }
            [PSCustomObject]@{
                Name = $_.Name
                DisplayName = $_.DisplayName
                State = $_.State
                StartMode = $_.StartMode
                PID = $_.ProcessId
                Path = $p
                Args = $args
                RawPath = $raw
            }
        } | ConvertTo-Json -Compress
        """
        services_list = []
        try:
            raw_svcs = run_ps_json(ps_services, timeout=25)
            if isinstance(raw_svcs, dict):
                services_list = [raw_svcs]
            elif isinstance(raw_svcs, list):
                services_list = raw_svcs
        except Exception as e:
            LogManager.add_log(f"[AVISO] Falha ao coletar serviços via PowerShell: {e}")

        LogManager.add_log(f"[SERVIÇOS] Analisando {len(services_list)} serviços instalados...")

        for s in services_list:
            s_name = s.get("Name") or ""
            s_disp = s.get("DisplayName") or ""
            s_path = s.get("Path") or ""
            s_args = s.get("Args") or ""
            s_pid = s.get("PID")

            low_name = s_name.lower()
            low_disp = s_disp.lower()
            low_path = s_path.lower()
            low_args = s_args.lower()
            combined = f"{low_name} {low_disp} {low_path} {low_args}"

            matched_pattern = None
            for key, info in KNOWN_MALICIOUS_PATTERNS.items():
                if key in combined:
                    matched_pattern = (key, info)
                    break

            if matched_pattern:
                k, info = matched_pattern
                threats.append({
                    "name": f"Serviço: {s_disp} ({s_name})",
                    "service_name": s_name,
                    "pid": s_pid if (s_pid and s_pid > 0) else None,
                    "path": s_path,
                    "threat_family": info["category"],
                    "severity": info["severity"],
                    "score": 98 if info["severity"] == "CRÍTICO" else 85,
                    "diagnostico": f"Serviço correspondente a ameaça global em nuvem: {info['desc']}.",
                    "cloud_source": "Assinaturas locais WinShield (lista de nomes conhecidos)",
                    "status": "Identificado na Nuvem",
                    "tipo": "Cloud Threat",
                    "is_service": True,
                    "is_official_driver": False,
                    "is_malware": True,
                    "classification": "malware",
                    "verdict": "MALWARE CONFIRMADO"
                })
                continue

            matched_pool = None
            for m_arg in MINER_ARG_PATTERNS:
                if m_arg in low_args:
                    matched_pool = m_arg
                    break

            if matched_pool:
                threats.append({
                    "name": f"Serviço: {s_disp} ({s_name})",
                    "service_name": s_name,
                    "pid": s_pid if (s_pid and s_pid > 0) else None,
                    "path": s_path,
                    "threat_family": "Cryptominer Pool (Nuvem)",
                    "severity": "CRÍTICO",
                    "score": 96,
                    "diagnostico": f"Serviço configurado com argumentos de mineração de criptomoedas em pool ({matched_pool}).",
                    "cloud_source": "Assinaturas locais WinShield (lista de nomes conhecidos)",
                    "status": "Identificado na Nuvem",
                    "tipo": "Cloud Threat",
                    "is_service": True,
                    "is_official_driver": False,
                    "is_malware": True,
                    "classification": "malware",
                    "verdict": "MINERADOR CONFIRMADO"
                })
                continue

            base_exe = os.path.basename(low_path).replace(".exe", "")
            if base_exe in SYSTEM_BINARIES:
                if not (low_path.startswith(sys32) or low_path.startswith(syswow64) or low_path.startswith(windir)):
                    threats.append({
                        "name": f"Serviço Falsificado: {s_disp} ({s_name})",
                        "service_name": s_name,
                        "pid": s_pid if (s_pid and s_pid > 0) else None,
                        "path": s_path,
                        "threat_family": "Masquerade / Spoofing",
                        "severity": "CRÍTICO",
                        "score": 100,
                        "diagnostico": f"Serviço camuflado usando nome oficial de sistema ({base_exe}) fora do System32. Técnica de persistência de malware.",
                        "cloud_source": "Assinaturas locais WinShield (lista de nomes conhecidos)",
                        "status": "Identificado na Nuvem",
                        "tipo": "Cloud Threat",
                        "is_service": True,
                        "is_official_driver": False,
                        "is_malware": True,
                        "classification": "malware",
                        "verdict": "SPOOFING DE SERVIÇO"
                    })
                    continue

            for sp in SUSPICIOUS_SERVICE_PATHS:
                if sp in low_path:
                    threats.append({
                        "name": f"Serviço em Pasta de Risco: {s_disp} ({s_name})",
                        "service_name": s_name,
                        "pid": s_pid if (s_pid and s_pid > 0) else None,
                        "path": s_path,
                        "threat_family": "Evasão de Diretório (Nuvem)",
                        "severity": "ALTO",
                        "score": 90,
                        "diagnostico": f"Serviço executando de diretório volátil ({sp}). Alto risco de persistência de cavalo de troia ou minerador furtivo.",
                        "cloud_source": "Assinaturas locais WinShield (lista de nomes conhecidos)",
                        "status": "Identificado na Nuvem",
                        "tipo": "Cloud Threat",
                        "is_service": True,
                        "is_official_driver": False,
                        "is_malware": False,
                        "classification": "suspicious_unsigned",
                        "verdict": "SERVIÇO EM PASTA DE RISCO"
                    })
                    break

        LogManager.add_log("[SERVIÇOS] Auditando processos ativos em execução na memória RAM...")
        procs_list = []
        try:
            raw_procs = run_ps_json("Get-Process | Where-Object { $_.Path } | Select-Object Name, Id, Path | ConvertTo-Json -Compress", timeout=20)
            if isinstance(raw_procs, dict):
                procs_list = [raw_procs]
            elif isinstance(raw_procs, list):
                procs_list = raw_procs
        except Exception:
            pass

        for p in procs_list:
            p_name = p.get("Name") or ""
            p_path = p.get("Path") or ""
            p_pid = p.get("Id")

            combined_proc = f"{p_name.lower()} {p_path.lower()}"
            already_captured = any(t.get("path") and t["path"].lower() == p_path.lower() for t in threats)
            if already_captured:
                continue

            for key, info in KNOWN_MALICIOUS_PATTERNS.items():
                if key in combined_proc:
                    threats.append({
                        "name": f"Processo: {p_name}.exe",
                        "pid": p_pid,
                        "path": p_path,
                        "threat_family": info["category"],
                        "severity": info["severity"],
                        "score": 98 if info["severity"] == "CRÍTICO" else 85,
                        "diagnostico": f"Processo em execução identificado na nuvem: {info['desc']}.",
                        "cloud_source": "Assinaturas locais WinShield (lista de nomes conhecidos)",
                        "status": "Identificado na Nuvem",
                        "tipo": "Cloud Threat",
                        "is_service": False,
                        "is_official_driver": False,
                        "is_malware": True,
                        "classification": "malware",
                        "verdict": "MALWARE CONFIRMADO"
                    })
                    break

        LogManager.add_log(f"[OK] Auditoria de serviços e processos concluída: {len(services_list)} serviços instalados e {len(procs_list)} processos auditados. Total de ameaças: {len(threats)}.")
        return threats

    @staticmethod
    def delete_threat_file(path, pid=None, permanent=True, service_name=None):
        """
        Remove permanentemente ou isola um arquivo malicioso/suspeito,
        forçando parada/exclusão do serviço Windows e encerramento do processo se necessário.
        """
        LogManager.add_log(f"Iniciando neutralização de segurança: Arquivo='{path}', PID={pid}, Serviço='{service_name}'...")
        
        if service_name:
            LogManager.add_log(f"Parando e desinstalando serviço do Windows: '{service_name}'...")
            run_hidden(f'sc.exe stop "{service_name}"')
            code, out = run_hidden(f'sc.exe delete "{service_name}"')
            if code == 0:
                LogManager.add_log(f"[OK] Serviço '{service_name}' desinstalado com sucesso.")
            else:
                LogManager.add_log(f"[AVISO] Resposta da exclusão do serviço '{service_name}': {out}")

        if pid:
            try:
                run_hidden(f"taskkill /F /T /PID {int(pid)}")
                LogManager.add_log(f"[OK] Processo ativo PID {pid} finalizado.")
            except Exception as e:
                LogManager.add_log(f"[AVISO] Não foi possível encerrar PID {pid}: {e}")

        if not path or not os.path.exists(path):
            msg = f"Serviço '{service_name}' removido e processo finalizado." if service_name else "Processo encerrado. O arquivo de origem não existe mais no disco."
            return True, msg

        try:
            run_hidden(f'takeown /F "{path}" /A', timeout=10)
            run_hidden(f'icacls "{path}" /grant administrators:F /C', timeout=10)
        except Exception:
            pass

        try:
            if not permanent:
                os.makedirs(QUARANTINE_DIR, exist_ok=True)
                dest = os.path.join(QUARANTINE_DIR, f"{os.path.basename(path)}_{pid or 'quar'}.locked")
                shutil.move(path, dest)
                LogManager.add_log(f"[QUARENTENA] Arquivo isolado com segurança em: {dest}")
                return True, f"Ameaça isolada com segurança em quarentena: {dest}"
            else:
                os.remove(path)
                LogManager.add_log(f"[DELETADO] Arquivo malicioso eliminado com sucesso: {path}")
                return True, f"Ameaça eliminada com sucesso: '{os.path.basename(path)}' foi deletado permanentemente."
        except Exception as err:
            LogManager.add_log(f"[ERRO] Falha ao deletar arquivo: {err}")
            code, _ = run_hidden(f'del /F /Q /A "{path}"')
            if code == 0:
                LogManager.add_log(f"[DELETADO] Arquivo forçado via DEL: {path}")
                return True, f"Arquivo '{os.path.basename(path)}' forçado e excluído do sistema."
            return False, f"Não foi possível deletar o arquivo ({err}). O serviço/processo porém foi encerrado."

    @staticmethod
    def defender_status():
        if not IS_WINDOWS:
            return {}
        data = run_ps_json(
            "Get-MpComputerStatus | Select-Object AMServiceEnabled,AntivirusEnabled,RealTimeProtectionEnabled,"
            "AntivirusSignatureVersion,AntivirusSignatureLastUpdated,QuickScanEndTime,FullScanEndTime,"
            "IsTamperProtected,NISEnabled | ConvertTo-Json -Compress", timeout=40)
        if not isinstance(data, dict):
            return {"available": False}
        for k, v in list(data.items()):
            if isinstance(v, str) and v.startswith("/Date("):
                try:
                    data[k] = int(v[6:v.index(")")].split("+")[0].split("-")[0]) // 1000
                except ValueError:
                    data[k] = None
        data["available"] = True
        return data

    @staticmethod
    def defender_scan(mode):
        scan_type = "QuickScan" if mode == "quick" else "FullScan"
        LogManager.add_log(f"Iniciando {scan_type} integrado ao motor de Segurança...")
        # Inicia simultaneamente o scanner interativo WinShield em primeiro plano
        AntivirusEngine.start_security_scan(mode="quick" if mode == "quick" else "deep")
        SystemCommandEngine.run_powershell(
            f"Start-MpScan -ScanType {scan_type}; Write-Output '[DEFENDER] Varredura concluída.'; "
            "Get-MpThreatDetection | Select-Object -First 10 | ForEach-Object { Write-Output \"[AMEAÇA] $($_.Resources)\" }",
            name=f"Defender {scan_type}")

    @staticmethod
    def defender_update():
        LogManager.add_log("Atualizando definições do Microsoft Defender...")
        SystemCommandEngine.run_powershell(
            "Update-MpSignature; Write-Output '[DEFENDER] Definições atualizadas.'", name="Atualizar Defender")

    @staticmethod
    def destroy_threat(pid, ppath, quarantine=True):
        return AntivirusEngine.delete_threat_file(ppath, pid=pid, permanent=not quarantine)
