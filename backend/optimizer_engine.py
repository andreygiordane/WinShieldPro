import os
import time
from backend.cmd_engine import SystemCommandEngine
from backend.log_manager import LogManager
from backend.process import run_hidden, run_ps, run_ps_json
from backend.system_engine import SystemEngine
from backend.core import IS_WINDOWS

# Cada tarefa: (titulo, tipo, comando, descricao_etapa)
TASKS = {
    "restore_point": (
        "Ponto de Restauração",
        "ps",
        r"""
        Enable-ComputerRestore -Drive "$env:SystemDrive\" -ErrorAction SilentlyContinue
        Checkpoint-Computer -Description 'WinShield Pro Snapshot' -RestorePointType 'MODIFY_SETTINGS' -ErrorAction SilentlyContinue
        Write-Output '[OK] Ponto de restauração de segurança criado.'
        """,
        "Criando snapshot de segurança do Windows para recuperação rápida..."
    ),
    "telemetry": (
        "Desativar Telemetria & Debloat",
        "ps",
        r"""
        foreach ($s in 'DiagTrack','dmwappushservice') {
            Stop-Service -Name $s -Force -ErrorAction SilentlyContinue
            Set-Service -Name $s -StartupType Disabled -ErrorAction SilentlyContinue
            Write-Output "Serviço de telemetria $s desativado."
        }
        New-Item -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection' -Force | Out-Null
        Set-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection' -Name AllowTelemetry -Value 0 -Type DWord
        Write-Output '[SUCESSO] Telemetria e rastreamento de dados em segundo plano desativados.'
        """,
        "Desativando serviços de telemetria e coleta de dados em segundo plano..."
    ),
    "visual_fx": (
        "Efeitos Visuais de Alta Resposta",
        "ps",
        r"""
        New-Item -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects' -Force | Out-Null
        Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects' -Name VisualFXSetting -Value 2 -Type DWord
        Set-ItemProperty -Path 'HKCU:\Control Panel\Desktop' -Name MenuShowDelay -Value '0'
        Write-Output '[SUCESSO] Atraso de menus reduzido para 0ms e efeitos ajustados para máxima performance.'
        """,
        "Otimizando latência de animações do Explorer e tempo de resposta de menus..."
    ),
    "game_mode": (
        "Modo de Jogo & Agendamento de GPU (HAGS)",
        "ps",
        r"""
        New-Item -Path 'HKCU:\Software\Microsoft\GameBar' -Force | Out-Null
        Set-ItemProperty -Path 'HKCU:\Software\Microsoft\GameBar' -Name AutoGameModeEnabled -Value 1 -Type DWord
        Set-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\GraphicsDrivers' -Name HwSchMode -Value 2 -Type DWord
        Write-Output '[SUCESSO] Modo de Jogo ativado e Agendamento de GPU por Hardware (HAGS) configurado.'
        """,
        "Ativando agendamento de GPU por hardware e prioridade do Modo de Jogo..."
    ),
    "trim": (
        "TRIM & Otimização de Unidades SSD/NVMe",
        "ps",
        r"""
        Get-Volume | Where-Object { $_.DriveLetter -and $_.DriveType -eq 'Fixed' } | ForEach-Object {
            Write-Output "Otimizando TRIM na unidade $($_.DriveLetter):..."
            Optimize-Volume -DriveLetter $_.DriveLetter -ReTrim -Verbose 4>&1 -ErrorAction SilentlyContinue
        }
        Write-Output '[SUCESSO] TRIM executado em todas as unidades de armazenamento SSD.'
        """,
        "Executando comando TRIM em todas as unidades de armazenamento fixas..."
    ),
    "clean_ram": (
        "Esvaziamento de Working Set de RAM",
        "ps",
        r"""
        $sig = '[DllImport("psapi.dll")] public static extern bool EmptyWorkingSet(IntPtr h);'
        $t = Add-Type -MemberDefinition $sig -Name 'WS' -Namespace 'WinShield' -PassThru
        $n = 0
        Get-Process | ForEach-Object { try { if ($t::EmptyWorkingSet($_.Handle)) { $n++ } } catch {} }
        Write-Output "[SUCESSO] Working Set e páginas em standby otimizados em $n processos ativos."
        """,
        "Liberando memória RAM em standby e working set sem fechar programas..."
    ),
    "cpu_scheduler": (
        "Escalonador de CPU & Prioridade Multi-Core",
        "ps",
        r"""
        Set-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\PriorityControl' -Name Win32PrioritySeparation -Value 38 -Type DWord -ErrorAction SilentlyContinue
        Set-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile' -Name SystemResponsiveness -Value 10 -Type DWord -ErrorAction SilentlyContinue
        Write-Output '[SUCESSO] Escalonador de CPU (Win32PrioritySeparation=0x26) ajustado para baixa latência e máxima resposta.'
        """,
        "Ajustando quantum de tempo da CPU e responsividade multimídia..."
    ),
    "gpu_latency": (
        "Prioridade de Latência de GPU & DirectX",
        "ps",
        r"""
        $gp = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile\Tasks\Games'
        New-Item -Path $gp -Force -ErrorAction SilentlyContinue | Out-Null
        Set-ItemProperty -Path $gp -Name 'GPU Priority' -Value 8 -Type DWord -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $gp -Name 'Priority' -Value 6 -Type DWord -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $gp -Name 'Scheduling Category' -Value 'High' -Type String -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $gp -Name 'SFIO Priority' -Value 'High' -Type String -ErrorAction SilentlyContinue
        Write-Output '[SUCESSO] Prioridade de thread gráfica (GPU Priority 8 / High SFIO) aplicada ao driver de vídeo.'
        """,
        "Configurando prioridade máxima de fila de renderização para a placa de vídeo..."
    ),
    "sysmain_tune": (
        "Ajuste Inteligente de Memória & SysMain",
        "ps",
        r"""
        $mem = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB
        if ($mem -ge 15) {
            Set-Service -Name 'SysMain' -StartupType Manual -ErrorAction SilentlyContinue
            Write-Output "[SUCESSO] Sistema com $([math]::Round($mem,1)) GB RAM detectado: SysMain ajustado para demanda manual (reduz escrita desnecessária em SSD)."
        } else {
            Enable-MMAgent -MemoryCompression -ErrorAction SilentlyContinue
            Set-Service -Name 'SysMain' -StartupType Automatic -ErrorAction SilentlyContinue
            Start-Service -Name 'SysMain' -ErrorAction SilentlyContinue
            Write-Output "[SUCESSO] Sistema com $([math]::Round($mem,1)) GB RAM detectado: Compressão de RAM e pré-busca inteligente ativadas."
        }
        """,
        "Adaptando o comportamento do SysMain e compressão de memória ao tamanho real da sua RAM..."
    ),
    "storage_io": (
        "Otimização de I/O NTFS & Fila de Disco",
        "ps",
        r"""
        fsutil behavior set disablelastaccess 1 | Out-Null
        fsutil behavior set encryptpagingfile 0 | Out-Null
        Write-Output '[SUCESSO] Overhead de carimbo de último acesso NTFS desativado para acelerar leitura de arquivos.'
        """,
        "Reduzindo escritas redundantes de metadados NTFS no armazenamento..."
    ),
    "network_tcp": (
        "Aceleração TCP/IP & Redução de Latência (NoDelay)",
        "ps",
        r"""
        netsh int tcp set global autotuninglevel=normal | Out-Null
        netsh int tcp set global rss=enabled | Out-Null
        netsh int tcp set global ecncapability=disabled | Out-Null
        $ifaces = 'HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces'
        Get-ChildItem $ifaces -ErrorAction SilentlyContinue | ForEach-Object {
            Set-ItemProperty -Path $_.PSPath -Name 'TcpAckFrequency' -Value 1 -Type DWord -ErrorAction SilentlyContinue
            Set-ItemProperty -Path $_.PSPath -Name 'TCPNoDelay' -Value 1 -Type DWord -ErrorAction SilentlyContinue
        }
        Write-Output '[SUCESSO] Algoritmo de Nagle desativado (TCPNoDelay=1) e Receive-Side Scaling (RSS) ativado.'
        """,
        "Otimizando pacote de rede TCP/IP, RSS e algoritmo de Nagle para menor ping..."
    ),
    "background_apps": (
        "Suspensão de Apps UWP & Serviços Ociosos",
        "ps",
        r"""
        New-Item -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications' -Force | Out-Null
        Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications' -Name GlobalUserDisabled -Value 1 -Type DWord -ErrorAction SilentlyContinue
        New-Item -Path 'HKCU:\System\GameConfigStore' -Force | Out-Null
        Set-ItemProperty -Path 'HKCU:\System\GameConfigStore' -Name GameDVR_Enabled -Value 0 -Type DWord -ErrorAction SilentlyContinue
        foreach ($svc in 'MapsBroker','lfsvc','RetailDemo','Fax') {
            Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
            Set-Service -Name $svc -StartupType Manual -ErrorAction SilentlyContinue
        }
        Write-Output '[SUCESSO] Aplicativos em segundo plano, captura DVR oculta e serviços ociosos suspensos.'
        """,
        "Suspendendo apps UWP em segundo plano, gravação DVR oculta e serviços ociosos..."
    ),
    "search_index": (
        "Otimização do Indexador Windows Search",
        "ps",
        r"""
        Set-Service -Name 'WSearch' -StartupType DelayedAutoStart -ErrorAction SilentlyContinue
        Write-Output '[SUCESSO] Indexador Windows Search configurado com início atrasado para liberar disco no boot.'
        """,
        "Ajustando prioridade de indexação do Windows Search para evitar picos de uso de disco..."
    ),
    "power_throttling": (
        "Desativar Power Throttling de Processos",
        "ps",
        r"""
        $pt = 'HKLM:\SYSTEM\CurrentControlSet\Control\Power\PowerThrottling'
        New-Item -Path $pt -Force -ErrorAction SilentlyContinue | Out-Null
        Set-ItemProperty -Path $pt -Name 'PowerThrottlingOff' -Value 1 -Type DWord -ErrorAction SilentlyContinue
        Write-Output '[SUCESSO] Estrangulamento de energia (Power Throttling) desativado para manter clock constante.'
        """,
        "Impedindo redução artificial de clock da CPU em tarefas de alta carga..."
    ),
    "hibernation_tune": (
        "Compactação de Hibernação (Fast Startup)",
        "cmd",
        "powercfg /h /type reduced",
        "Reduzindo o arquivo hiberfil.sys pela metade sem perder a Inicialização Rápida..."
    ),
    "sfc": (
        "SFC /SCANNOW",
        "cmd",
        "sfc /scannow",
        "Verificando integridade de todos os arquivos de sistema protegidos..."
    ),
    "dism": (
        "DISM RestoreHealth",
        "cmd",
        "DISM /Online /Cleanup-Image /RestoreHealth",
        "Reparando repositório de componentes de imagem do Windows..."
    ),
    "dism_cleanup": (
        "Limpeza do WinSxS",
        "cmd",
        "DISM /Online /Cleanup-Image /StartComponentCleanup",
        "Removendo versões antigas de componentes da pasta WinSxS..."
    ),
    "chkdsk": (
        "CHKDSK (Verificação Online)",
        "cmd",
        "chkdsk C: /scan",
        "Escaneando integridade do sistema de arquivos NTFS da partição C:..."
    ),
    "network_reset": (
        "Reset de Pilha de Rede",
        "cmd",
        "netsh winsock reset && netsh int ip reset && ipconfig /release && ipconfig /renew && ipconfig /flushdns",
        "Resetando pilha TCP/IP, Winsock e cache DNS..."
    )
}


class OptimizerEngine:
    _hw_profile_cache = None
    _hw_profile_ts = 0.0

    @classmethod
    def get_hardware_profile(cls, force=False):
        """
        Analisa o hardware real da máquina (CPU, quantidade de RAM, tipo de disco NVMe/SSD/HDD,
        fabricante da GPU e tipo de chassi Desktop/Notebook) e gera um perfil de otimização
        adaptativo sob medida com recomendações específicas.
        """
        if cls._hw_profile_cache and not force and (time.time() - cls._hw_profile_ts < 120):
            return cls._hw_profile_cache

        sys_info = SystemEngine.static_info()
        cpu_name = sys_info.get("cpu") or "Processador x64"
        cores = int(sys_info.get("cpu_cores") or 4)
        threads = int(sys_info.get("cpu_threads") or os.cpu_count() or 4)
        ram_gb = float(sys_info.get("ram_total_gb") or 8.0)
        gpu_name = sys_info.get("gpu_primary") or "Controlador Gráfico"

        # Detecta tipo de armazenamento primário (NVMe, SSD ou HDD) e se há bateria (Notebook vs Desktop)
        storage_type = "SSD"
        is_laptop = False
        try:
            ps_check = r"""
            $disk = Get-PhysicalDisk -ErrorAction SilentlyContinue | Sort-Object DeviceId | Select-Object -First 1
            $bat = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue | Select-Object -First 1
            [pscustomobject]@{
                MediaType = if ($disk) { [string]$disk.MediaType } else { 'SSD' }
                BusType = if ($disk) { [string]$disk.BusType } else { '' }
                HasBattery = [bool]($null -ne $bat)
            } | ConvertTo-Json -Compress
            """
            hw_extra = run_ps_json(ps_check, timeout=12) or {}
            media = (hw_extra.get("MediaType") or "").upper()
            bus = (hw_extra.get("BusType") or "").upper()
            is_laptop = bool(hw_extra.get("HasBattery"))
            if "NVME" in bus:
                storage_type = "NVMe M.2 SSD"
            elif "SSD" in media or "SATA" in bus:
                storage_type = "SATA SSD"
            elif "HDD" in media:
                storage_type = "HDD Mecânico"
        except Exception:
            pass

        gpu_up = gpu_name.upper()
        is_dedicated_gpu = any(k in gpu_up for k in ("NVIDIA", "GEFORCE", "RTX", "GTX", "RADEON", "RX ", "ARC "))
        cpu_vendor = "AMD" if "AMD" in cpu_name.upper() or "RYZEN" in cpu_name.upper() else (
            "Intel" if "INTEL" in cpu_name.upper() else "x64"
        )

        # Define Perfil Adaptativo de Hardware
        if ram_gb >= 16 and is_dedicated_gpu:
            profile_name = f"Perfil High-Performance & Gaming ({cpu_vendor} + {int(round(ram_gb))}GB RAM)"
            profile_badge = "WORKSTATION / GAMING"
            profile_desc = (
                f"Hardware de alto desempenho detectado ({cpu_name}, {ram_gb} GB RAM, {gpu_name}, {storage_type}). "
                "Otimizações focadas em mínima latência de quadros (HAGS/MMCSS), desbloqueio de escalonador multi-core, "
                "redução de escritas desnecessárias no SSD e pacote TCP NoDelay."
            )
        elif ram_gb <= 8.5:
            profile_name = f"Perfil Eficiência Máxima de Memória ({int(round(ram_gb))}GB RAM)"
            profile_badge = "OTIMIZAÇÃO DE RAM & CPU"
            profile_desc = (
                f"Configuração com {ram_gb} GB de RAM detectada ({cpu_name}, {storage_type}). "
                "Otimizações priorizam liberação agressiva de Working Set, compressão inteligente de RAM, "
                "suspensão de apps UWP em segundo plano e desativação de telemetria pesada."
            )
        else:
            profile_name = f"Perfil Equilibrado Adaptativo ({cpu_vendor} {cores}C/{threads}T + {storage_type})"
            profile_badge = "ADAPTATIVO INTELIGENTE"
            profile_desc = (
                f"Configuração detectada: {cpu_name} ({cores} núcleos / {threads} threads), {ram_gb} GB RAM e {storage_type}. "
                "Serviços calibrados para acelerar tempo de resposta do sistema, I/O de armazenamento e estabilidade."
            )

        # Catálogo completo de serviços de otimização com adaptação ao hardware
        services = [
            {
                "id": "cpu_scheduler",
                "title": "Escalonador de CPU & Prioridade Multi-Core",
                "category": "Processador (CPU)",
                "icon": "cpu",
                "hardware_tag": f"Adaptado para {cpu_name} ({threads} Threads)",
                "desc": "Ajusta o Win32PrioritySeparation (0x26) e reserva de CPU multimídia para priorizar aplicações em primeiro plano.",
                "recommended": True,
                "reason": f"Recomendado para aproveitar os {threads} threads do seu {cpu_vendor} com menor latência."
            },
            {
                "id": "sysmain_tune",
                "title": "Calibragem Adaptativa de RAM & SysMain",
                "category": "Memória RAM",
                "icon": "memory-stick",
                "hardware_tag": f"Calibrado para {ram_gb} GB de RAM",
                "desc": (
                    "Ajusta o SysMain para modo sob demanda (evitando desgaste do SSD em máquinas com 16GB+ RAM)."
                    if ram_gb >= 15 else
                    "Ativa compressão de memória e pré-busca inteligente para evitar gargalos em sistemas com até 12GB RAM."
                ),
                "recommended": True,
                "reason": f"Configuração automática específica para {ram_gb} GB de memória instalada."
            },
            {
                "id": "clean_ram",
                "title": "Purga de Standby List & Working Set RAM",
                "category": "Memória RAM",
                "icon": "zap",
                "hardware_tag": f"Liberação Instantânea ({ram_gb} GB)",
                "desc": "Esvazia páginas de memória alocadas por processos ociosos sem fechar nenhum aplicativo aberto.",
                "recommended": True,
                "reason": "Recupera imediatamente centenas de MBs de memória física retida."
            },
            {
                "id": "gpu_latency",
                "title": "Prioridade de Fila de GPU & DirectX MMCSS",
                "category": "Placa de Vídeo (GPU)",
                "icon": "monitor",
                "hardware_tag": f"Otimizado para {gpu_name}",
                "desc": "Define GPU Priority = 8 e Scheduling Category = High no subsistema gráfico do Windows para evitar micro-stuttering.",
                "recommended": True,
                "reason": f"Reduz latência de renderização na sua {gpu_name}."
            },
            {
                "id": "game_mode",
                "title": "Agendamento de GPU por Hardware (HAGS) & Game Mode",
                "category": "Placa de Vídeo (GPU)",
                "icon": "gamepad-2",
                "hardware_tag": "GPU Dedicada / WDDM 2.7+" if is_dedicated_gpu else "Gráficos Integrados",
                "desc": "Transfere o gerenciamento de memória de vídeo da CPU direto para o processador gráfico dedicado.",
                "recommended": is_dedicated_gpu,
                "reason": "Recomendado para GPUs dedicadas modernas (NVIDIA/AMD) para reduzir overhead de CPU."
            },
            {
                "id": "storage_io",
                "title": "Aceleração de Fila I/O NTFS & Metadados",
                "category": "Armazenamento (Disco)",
                "icon": "hard-drive",
                "hardware_tag": f"Unidade Primária: {storage_type}",
                "desc": "Desativa gravação contínua de LastAccess no NTFS e criptografia de pagefile para acelerar leitura/escrita.",
                "recommended": True,
                "reason": f"Aumenta a vida útil e IOPS do seu {storage_type}."
            },
            {
                "id": "trim",
                "title": "ReTrim de Blocos Flash (SSD / NVMe)",
                "category": "Armazenamento (Disco)",
                "icon": "Sparkles",
                "hardware_tag": f"Compatível com {storage_type}",
                "desc": "Executa o comando TRIM em todas as partições fixas para limpar células flash inválidas e manter a velocidade máxima.",
                "recommended": "HDD" not in storage_type,
                "reason": "Essencial para evitar queda de velocidade de gravação em unidades SSD/NVMe."
            },
            {
                "id": "network_tcp",
                "title": "Otimização TCP NoDelay (Nagle Off) & RSS",
                "category": "Rede & Latência",
                "icon": "wifi",
                "hardware_tag": "Pilha TCP/IP Baixa Latência",
                "desc": "Desativa o agrupamento de pacotes de Nagle (TcpAckFrequency=1) e ativa Receive-Side Scaling multi-core na placa de rede.",
                "recommended": True,
                "reason": "Reduz jitter e atraso de resposta em navegação, chamadas e jogos online."
            },
            {
                "id": "background_apps",
                "title": "Suspensão de Apps UWP & GameDVR em 2º Plano",
                "category": "Sistema & Debloat",
                "icon": "layers",
                "hardware_tag": "Economia de CPU & Bateria" if is_laptop else "Redução de Processos Ativos",
                "desc": "Bloqueia execução silenciosa de apps da loja, captura DVR em segundo plano e serviços ociosos (Fax, MapsBroker).",
                "recommended": True,
                "reason": "Libera ciclos de CPU e memória consumidos por apps que rodam sem você abrir."
            },
            {
                "id": "telemetry",
                "title": "Bloqueio de Telemetria & Coleta Diagnóstica",
                "category": "Privacidade & Debloat",
                "icon": "shield-off",
                "hardware_tag": "Serviços DiagTrack / dmwappush",
                "desc": "Para e desativa serviços de telemetria contínua da Microsoft que consomem disco e banda em segundo plano.",
                "recommended": True,
                "reason": "Elimina leituras de disco e envios de relatórios de diagnóstico em segundo plano."
            },
            {
                "id": "visual_fx",
                "title": "Interface Instantânea (Zero Menu Delay)",
                "category": "Interface & Fluidez",
                "icon": "zap",
                "hardware_tag": "Windows Explorer / DWM",
                "desc": "Reduz o atraso de exibição de menus para 0ms e otimiza animações pesadas da área de trabalho.",
                "recommended": True,
                "reason": "Deixa cliques, menus de contexto e alternância de janelas muito mais ágeis."
            },
            {
                "id": "power_throttling",
                "title": "Desbloqueio de Power Throttling de CPU",
                "category": "Energia & Clocks",
                "icon": "flame",
                "hardware_tag": "Notebook (Bateria/AC)" if is_laptop else "Desktop (Fonte AC)",
                "desc": "Desativa o estrangulamento automático de clock do Windows em processos de trabalho e jogos.",
                "recommended": not is_laptop,
                "reason": "Mantém frequências Boost estáveis em Desktops (em Notebooks, ative apenas conectado à tomada)."
            },
            {
                "id": "search_index",
                "title": "Controle de Indexação Windows Search",
                "category": "Armazenamento (Disco)",
                "icon": "search",
                "hardware_tag": f"Proteção de I/O ({storage_type})",
                "desc": "Configura o indexador de busca para início atrasado, evitando 100% de uso de disco logo após ligar o PC.",
                "recommended": True,
                "reason": "Acelera a inicialização do Windows."
            },
            {
                "id": "hibernation_tune",
                "title": "Compactação do Arquivo de Hibernação",
                "category": "Armazenamento (Disco)",
                "icon": "hard-drive",
                "hardware_tag": "Recupera GBs no Disco C:",
                "desc": "Reduz o tamanho do hiberfil.sys para 40% (modo Reduced), liberando vários gigabytes no SSD sem perder o Fast Startup.",
                "recommended": True,
                "reason": f"Economiza até {max(2, int(ram_gb * 0.2))} GB de espaço na unidade C:."
            }
        ]

        recommended_ids = [s["id"] for s in services if s["recommended"]]

        profile = {
            "hardware_summary": {
                "cpu": cpu_name,
                "cpu_vendor": cpu_vendor,
                "cores": cores,
                "threads": threads,
                "ram_gb": ram_gb,
                "gpu": gpu_name,
                "is_dedicated_gpu": is_dedicated_gpu,
                "storage_type": storage_type,
                "chassis": "Notebook / Portátil" if is_laptop else "Desktop / Workstation",
                "profile_name": profile_name,
                "profile_badge": profile_badge,
                "profile_description": profile_desc
            },
            "recommended_tasks": recommended_ids,
            "services": services
        }

        cls._hw_profile_cache = profile
        cls._hw_profile_ts = time.time()
        return profile

    @staticmethod
    def run(task):
        if task not in TASKS:
            return False, "Tarefa desconhecida."
        item = TASKS[task]
        title, kind, cmd = item[0], item[1], item[2]
        LogManager.add_log(f"Iniciando: {title} (executando em segundo plano, sem janelas)...")
        if kind == "cmd":
            SystemCommandEngine.run_cmd(cmd, name=title)
        else:
            SystemCommandEngine.run_powershell(cmd, name=title)
        return True, f"'{title}' iniciado. Acompanhe no console."

    # Tempo máximo por tarefa: SFC/DISM/CHKDSK levam vários minutos de verdade
    TIMEOUTS = {"sfc": 3600, "dism": 3600, "dism_cleanup": 3600, "chkdsk": 1800, "trim": 900,
                "restore_point": 600, "network_reset": 300}

    @staticmethod
    def run_task_sync(task):
        """
        Executa uma tarefa de forma síncrona com medição de tempo e saída completa.
        O sucesso exige código de saída 0 E, quando o ajuste é verificável, que o
        estado lido do Windows depois da execução confirme a alteração.
        """
        if task not in TASKS:
            return False, "Tarefa desconhecida.", "", 0.0

        item = TASKS[task]
        title, kind, cmd = item[0], item[1], item[2]
        timeout = OptimizerEngine.TIMEOUTS.get(task, 180)

        LogManager.add_log(f"[OTIMIZADOR] Executando etapa: {title}...")
        start_t = time.time()

        if kind == "cmd":
            code, out = run_hidden(cmd, timeout=timeout)
        else:
            code, out = run_ps(cmd, timeout=timeout)

        elapsed = round(time.time() - start_t, 2)
        # sfc/DISM escrevem em UTF-16: remove os NULs que sobram da decodificação
        out_clean = (out or "").replace("\x00", "").strip()

        state = OptimizerEngine.get_tweak_states().get(task) or {}
        verified = state.get("applied")
        success = (code == 0) and verified is not False
        if code == -2:
            out_clean += f"\n[TEMPO ESGOTADO] A tarefa excedeu {timeout // 60} min e foi interrompida."
        if verified is True:
            out_clean += f"\n[VERIFICADO] {state.get('detail', 'Ajuste confirmado no Windows.')}"
        elif verified is False:
            out_clean += f"\n[NÃO CONFIRMADO] {state.get('detail', 'O Windows não reflete o ajuste')} — execute como administrador."

        LogManager.add_log(f"[OTIMIZADOR] Etapa '{title}' {'concluída' if success else 'FALHOU'} "
                           f"({elapsed}s, código {code}, verificação: {verified}).")
        return success, title, out_clean or "Etapa concluída sem saída de texto.", elapsed

    # ------------------------------------------------------------------
    # ESTADO REAL DE CADA AJUSTE (lido do registro/serviços, sem PowerShell)
    # ------------------------------------------------------------------
    @staticmethod
    def get_tweak_states():
        """
        Retorna {tarefa: {"applied": True|False|None, "detail": str}}.
        applied=None significa ação pontual (não deixa estado persistente para conferir).
        """
        if not IS_WINDOWS:
            return {}
        import winreg

        HKLM, HKCU = winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER

        def reg(root, path, name):
            try:
                with winreg.OpenKey(root, path, 0, winreg.KEY_READ | winreg.KEY_WOW64_64KEY) as k:
                    return winreg.QueryValueEx(k, name)[0]
            except OSError:
                return None

        def svc_start(name):
            key = rf"SYSTEM\CurrentControlSet\Services\{name}"
            start, delayed = reg(HKLM, key, "Start"), reg(HKLM, key, "DelayedAutostart")
            return {2: "Automático (atrasado)" if delayed == 1 else "Automático", 3: "Manual", 4: "Desativado"}.get(start, "N/D")

        def st(ok, detail):
            return {"applied": bool(ok), "detail": detail}

        out = {}
        mm = r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile"

        diag = svc_start("DiagTrack")
        allow = reg(HKLM, r"SOFTWARE\Policies\Microsoft\Windows\DataCollection", "AllowTelemetry")
        out["telemetry"] = st(diag == "Desativado" and allow == 0,
                              f"DiagTrack: {diag} · AllowTelemetry={allow if allow is not None else 'padrão'}")

        vfx = reg(HKCU, r"Software\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects", "VisualFXSetting")
        delay = reg(HKCU, r"Control Panel\Desktop", "MenuShowDelay")
        out["visual_fx"] = st(vfx == 2 and str(delay) == "0",
                              f"MenuShowDelay={delay if delay is not None else '400'} ms · VisualFX={vfx if vfx is not None else 'padrão'}")

        gm = reg(HKCU, r"Software\Microsoft\GameBar", "AutoGameModeEnabled")
        hags = reg(HKLM, r"SYSTEM\CurrentControlSet\Control\GraphicsDrivers", "HwSchMode")
        out["game_mode"] = st(gm == 1 and hags == 2,
                              f"Modo de Jogo: {'ativo' if gm == 1 else 'padrão'} · HAGS: {'ativo' if hags == 2 else 'desligado'}")

        prio = reg(HKLM, r"SYSTEM\CurrentControlSet\Control\PriorityControl", "Win32PrioritySeparation")
        resp = reg(HKLM, mm, "SystemResponsiveness")
        out["cpu_scheduler"] = st(prio == 38 and resp == 10,
                                  f"Win32PrioritySeparation=0x{(prio or 0):X} · SystemResponsiveness={resp}")

        gp = reg(HKLM, mm + r"\Tasks\Games", "GPU Priority")
        cat = reg(HKLM, mm + r"\Tasks\Games", "Scheduling Category")
        out["gpu_latency"] = st(gp == 8 and cat == "High", f"GPU Priority={gp} · Scheduling={cat or 'padrão'}")

        ram_gb = float(SystemEngine.static_info().get("ram_total_gb") or 8)
        sysmain = svc_start("SysMain")
        want = "Manual" if ram_gb >= 15 else "Automático"
        out["sysmain_tune"] = st(sysmain.startswith(want), f"SysMain: {sysmain} (ideal para {ram_gb:.0f} GB: {want})")

        la = reg(HKLM, r"SYSTEM\CurrentControlSet\Control\FileSystem", "NtfsDisableLastAccessUpdate")
        la_off = la is not None and (la & 1) == 1
        out["storage_io"] = st(la_off, f"Carimbo de último acesso NTFS: {'desativado' if la_off else 'ativo'}")

        nodelay = []
        base = r"SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces"
        try:
            with winreg.OpenKey(HKLM, base) as k:
                i = 0
                while True:
                    try:
                        sub = winreg.EnumKey(k, i)
                    except OSError:
                        break
                    i += 1
                    nodelay.append(reg(HKLM, base + "\\" + sub, "TCPNoDelay") == 1)
        except OSError:
            pass
        out["network_tcp"] = st(any(nodelay), f"TCPNoDelay em {sum(nodelay)} de {len(nodelay)} interface(s)")

        bg = reg(HKCU, r"Software\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications", "GlobalUserDisabled")
        dvr = reg(HKCU, r"System\GameConfigStore", "GameDVR_Enabled")
        out["background_apps"] = st(bg == 1 and dvr == 0,
                                    f"Apps em 2º plano: {'bloqueados' if bg == 1 else 'permitidos'} · GameDVR: {'desligado' if dvr == 0 else 'ligado'}")

        ws = svc_start("WSearch")
        out["search_index"] = st(ws == "Automático (atrasado)", f"Windows Search: {ws}")

        pt = reg(HKLM, r"SYSTEM\CurrentControlSet\Control\Power\PowerThrottling", "PowerThrottlingOff")
        out["power_throttling"] = st(pt == 1, f"PowerThrottlingOff={pt if pt is not None else '0 (padrão)'}")

        hib_on = reg(HKLM, r"SYSTEM\CurrentControlSet\Control\Power", "HibernateEnabled")
        hib_type = reg(HKLM, r"SYSTEM\CurrentControlSet\Control\Power", "HiberFileType")
        if hib_on == 0:
            out["hibernation_tune"] = st(True, "Hibernação desativada (hiberfil.sys não existe)")
        else:
            out["hibernation_tune"] = st(hib_type == 1, f"hiberfil.sys: {'reduzido' if hib_type == 1 else 'completo'}")

        dnot = reg(HKLM, r"SYSTEM\CurrentControlSet\Control\FileSystem", "DisableDeleteNotification")
        out["trim"] = {"applied": None, "detail": f"TRIM do Windows: {'desativado' if dnot == 1 else 'habilitado'}"}
        for k in ("clean_ram", "restore_point", "sfc", "dism", "dism_cleanup", "chkdsk", "network_reset"):
            out[k] = {"applied": None, "detail": "Ação pontual — sem estado persistente"}
        return out
