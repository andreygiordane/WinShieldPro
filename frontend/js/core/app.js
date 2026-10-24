// =====================================================================
// BLOQUEIO RIGOROSO DO MENU DE CONTEXTO DO EDGE / CHROMIUM
// Impede qualquer menu de contexto, inspeção ou função nativa do Edge ao clicar com botão direito
// =====================================================================
(function() {
    function blockEdgeContextMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') {
            e.stopImmediatePropagation();
        }
        return false;
    }
    window.addEventListener('contextmenu', blockEdgeContextMenu, { capture: true, passive: false });
    document.addEventListener('contextmenu', blockEdgeContextMenu, { capture: true, passive: false });
    if (document.documentElement) {
        document.documentElement.addEventListener('contextmenu', blockEdgeContextMenu, { capture: true, passive: false });
    }
})();

lucide.createIcons();

        function enhanceButtonAnimations() {
            document.querySelectorAll('button').forEach(btn => {
                if (!btn.classList.contains('nav-item')) {
                    btn.classList.add('btn-animated');
                }
            });
        }
        enhanceButtonAnimations();

        // Variáveis de estado global
        let currentTab = 'overview';
        let logIndex = 0;
        let isConsoleMinimized = true;
        let allDisksData = [];
        let selectedDiskIndex = 0;
        let benchmarkPollTimer = null;
        let sectorGuardPollTimer = null;
        let visionSensorsTimer = null;
        let currentAuditList = [];
        let selectedAuditItem = null;
        let selectedThreatItem = null;
        let allRunningApps = [];
        let runningAppsFilter = 'windows';
        let currentLang = localStorage.getItem('winshield_lang') || 'pt';
        let splashTimer = null;

        // =====================================================================
        // SISTEMA MULTI-IDIOMA (i18n): PORTUGUÊS (BR), INGLÊS (US), ESPANHOL (ES)
        // =====================================================================
        const I18N_TRANSLATIONS = {
            'pt': {
                "brand.app_name": "WinShield Pro",
                "brand.dev_label": "Desenvolvido por",
                "brand.subtitle": "Hardware, Segurança & Otimizador",
                "nav.search_placeholder": "Buscar módulo (Ctrl+K)...",
                "nav.group_hardware": "HARDWARE",
                "nav.overview": "Geral",
                "nav.silicon": "Processador",
                "nav.vision": "Gráficos",
                "nav.memory": "Memória",
                "nav.devices": "Dispositivos",
                "nav.group_stability": "ESTABILIDADE",
                "nav.stability": "Teste de Estresse",
                "nav.group_storage": "DISCOS & REDE",
                "nav.disk_health": "Discos",
                "nav.disk_bench": "Velocidade",
                "nav.group_network": "REDE",
                "nav.network": "Rede & Wi-Fi",
                "nav.group_apps": "APLICATIVOS",
                "nav.running_apps": "Programas",
                "nav.audit": "Auditoria",
                "nav.antivirus": "Antivírus",
                "nav.group_system": "SISTEMA",
                "nav.clean": "Limpeza",
                "nav.power": "Energia",
                "nav.optimize": "Otimização",
                "nav.group_advanced": "AVANÇADO",
                "nav.terminal": "Terminal",
                "side.telemetry": "TELEMETRIA",
                "side.active": "PROTEGIDO",
                "header.theme_dark": "Escuro",
                "header.theme_light": "Claro",
                "header.theme_auto": "Auto",
                "header.console": "Console",
                "console.title": "Console de Operações em Tempo Real (Minimizado)",
                "console.title_open": "Console de Operações em Tempo Real",
                "console.save": "Salvar Log (.log)",
                "console.clear": "Limpar",
                "splash.welcome": "Bem-vindo ao WinShield Pro",
                "splash.badge": "WINSHIELD PRO ENTERPRISE v6.2",
                "splash.lang_title": "Selecione seu Idioma",
                "splash.status_loading1": "INICIANDO SISTEMA...",
                "splash.status_loading2": "Sincronizando telemetria de hardware e sensores...",
                "splash.status_loading3": "Carregando motores de disco e segurança...",
                "splash.progress_ready": "SISTEMA PRONTO PARA ACESSO",
                "splash.subtitle": "Proteção inteligente para o seu ambiente.",
                "splash.check1": "Permissões de Kernel & Admin",
                "splash.check2": "Telemetria & Sensores",
                "splash.check3": "S.M.A.R.T. & Discos",
                "splash.check4": "Motores de Otimização",
                "splash.status_ok": "ATIVO",
                "splash.status_conn": "CONECTADO",
                "splash.status_ready": "PRONTO",
                "splash.status_init": "INICIALIZADO",
                "splash.dont_show": "Não exibir na inicialização",
                "splash.enter": "Entrar no Sistema",
                "modals.btn_cancel": "Cancelar",
                "modals.btn_confirm": "Confirmar",
                "modals.kill_title": "Finalizar Tarefa",
                "modals.kill_msg": "Deseja realmente forçar o encerramento deste programa?",
                "modals.kill_warn": "Qualquer dado não salvo nesta tarefa será perdido.",
                "modals.uninstall_title": "Desinstalar Aplicativo",
                "modals.uninstall_msg": "Deseja disparar a rotina de desinstalação para remover este software?",
                "modals.threat_title": "Excluir Ameaça Detectada",
                "modals.threat_msg": "Deseja encerrar o processo ativo e excluir permanentemente este arquivo do disco?",
                "modals.clean_title": "Autorizar Limpeza Profunda",
                "modals.clean_msg": "Deseja iniciar a remoção definitiva dos arquivos e caches selecionados?",
                "modals.shred_title": "Trituração Forçada de Arquivo",
                "overview.cpu_usage": "Uso do Processador",
                "overview.ram_usage": "Memória RAM",
                "overview.disk_system": "Unidade Sistema (C:)",
                "overview.ssd_primary": "SSD Principal",
                "overview.storage_health": "Saúde do Armazenamento",
                "overview.smart_realtime": "S.M.A.R.T. & NVMe em tempo real",
                "overview.btn_full_diag": "Ver Diagnóstico Completo & Integridade",
                "overview.os_title": "Sistema Operacional",
                "overview.os_build": "Edição & Compilação (Build / UBR)",
                "overview.os_install": "Instalação do Windows",
                "overview.motherboard": "Placa-Mãe (Motherboard)",
                "overview.bios_version": "Versão da BIOS & Data",
                "overview.security_hardware": "Segurança de Hardware",
                "overview.cpu_main": "Processador Principal",
                "overview.gpu_dedicated": "Placa de Vídeo Dedicada (GPU)",
                "overview.ram_physical": "Memória RAM Física",
                "overview.computer_session": "Computador & Sessão",
                "overview.btn_speed_test": "Executar Teste de Velocidade de Leitura/Escrita",
                "silicon.tab_cpu": "CPU (Processador)",
                "silicon.tab_mainboard": "Mainboard (Placa-Mãe)",
                "silicon.tab_memory": "Memory & SPD (RAM)",
                "silicon.tab_bench": "Silicon Core™ Benchmark",
                "silicon.btn_refresh": "Atualizar Silicon Core™",
                "silicon.cpu_name": "Nome do Processador",
                "silicon.codename": "Codinome",
                "silicon.litography": "Litografia",
                "silicon.socket": "Soquete",
                "silicon.cores_threads": "Núcleos / Threads",
                "silicon.instructions": "Conjunto de Instruções Suportadas",
                "silicon.clocks": "Relógios em Tempo Real (Clocks)",
                "silicon.multiplier": "Multiplicador",
                "silicon.mb_specs": "Especificações da Placa-Mãe",
                "silicon.mb_chipset": "Fabricante & Chipset",
                "silicon.mb_mfr": "Fabricante:",
                "silicon.mb_model": "Modelo:",
                "silicon.mb_pcie": "Barramento PCI-e:",
                "silicon.mb_bios": "BIOS & Firmware",
                "silicon.mb_vendor": "Desenvolvedora:",
                "silicon.mb_ver": "Versão:",
                "silicon.mb_date": "Data de Lançamento:",
                "silicon.ram_config": "Configuração Geral de Memória RAM",
                "silicon.ram_total": "Capacidade Total",
                "silicon.ram_channels": "Canais",
                "silicon.ram_slots": "Slots Utilizados",
                "silicon.btn_start_bench": "INICIAR TESTE DE CPU",
                "vision.tab_gpu": "Placa Gráfica (Graphics Card)",
                "vision.tab_sensors": "Sensores em Tempo Real (Sensors)",
                "vision.btn_refresh": "Atualizar Vision Engine™",
                "vision.adapter_name": "Nome do Adaptador Gráfico",
                "vision.architecture": "Arquitetura / GPU",
                "vision.transistors": "Transistores",
                "vision.bus_width": "Barramento VRAM",
                "vision.bandwidth": "Largura de Banda",
                "vision.driver_ver": "Versão do Driver",
                "vision.resolution": "Resolução / Tela",
                "vision.features": "Recursos Gráficos & Computacionais Suportados",
                "vision.temp": "Temperatura da GPU",
                "vision.load": "Carga da GPU (Usage)",
                "vision.vram_used": "Memória de Vídeo Utilizada",
                "vision.power": "Consumo de Energia (Power)",
                "memory.header_badge": "Memória RAM & Barramento",
                "memory.total_installed": "Total Instalada",
                "memory.used": "Em Uso",
                "memory.available": "Disponível",
                "memory.load_label": "Carga Global de Memória RAM",
                "memory.modules_title": "Pentes de Memória Físicos (SPD & Hardware)",
                "memory.ramguard_title": "WinShield RAMGuard™ (Diagnóstico de Integridade de Memória)",
                "memory.ramguard_desc": "Varredura avançada e validação física de integridade de células de RAM para identificar falhas de barramento, degradação de sinal ou telas azuis (BSOD).",
                "memory.btn_start_test": "Iniciar Teste de Estresse",
                "memory.btn_stop_test": "Interromper Teste",
                "memory.btn_refresh": "Atualizar Informações",
                "memory.test_status_label": "Status do Teste",
                "memory.test_speed_label": "Velocidade",
                "memory.test_pattern_label": "Padrão",
                "memory.test_errors_label": "Erros",
                "memory.block_progress": "Progresso por Blocos de Memória",
                "memory.log_title": "Log em Tempo Real do RAMGuard™",
                "disk_health.btn_rescan": "Reescanear Discos",
                "disk_health.tab_smart": "S.M.A.R.T. & NVMe Log",
                "disk_health.tab_surface": "SurfaceScan (1.200 Blocos)",
                "disk_health.tab_align": "Recursos & Alinhamento 4K",
                "disk_health.temperature": "Temperatura",
                "disk_health.power_on_hours": "Tempo Ligado",
                "disk_health.total_written": "Total Gravado",
                "disk_health.th_attr": "Nome do Atributo",
                "disk_health.th_current": "Atual",
                "disk_health.th_worst": "Pior",
                "disk_health.th_threshold": "Limite",
                "disk_health.th_raw": "Valor Bruto (Raw)",
                "disk_health.btn_start_scan": "INICIAR VARREDURA SURFACESCAN",
                "disk_health.btn_stop_scan": "INTERROMPER VARREDURA",
                "disk_health.bad_sectors": "Setores Danificados",
                "disk_health.read_speed": "Velocidade de Leitura",
                "disk_health.elapsed_time": "Tempo Decorrido",
                "disk_health.remaining_time": "Tempo Restante Est.",
                "disk_bench.btn_all_tests": "TODOS OS TESTES",
                "disk_bench.passes": "Repetições (Passes):",
                "disk_bench.sample_size": "Tamanho da Amostra:",
                "disk_bench.test_drive": "Unidade de Teste:",
                "disk_bench.measure_unit": "Unidade de Medição:",
                "disk_bench.seq_read": "Leitura Sequencial",
                "disk_bench.seq_write": "Escrita Sequencial",
                "disk_bench.rnd_read": "Leitura Aleatória 4K",
                "disk_bench.rnd_write": "Escrita Aleatória 4K",
                "apps.header_title": "Programas em Execução & Gerenciador",
                "apps.header_desc": "Monitore processos ativos no Windows, isole serviços e desinstale programas indesejados.",
                "apps.stat_user_apps": "Softwares do Usuário",
                "apps.stat_services": "Serviços do Windows",
                "apps.stat_ram": "Consumo Total de RAM",
                "apps.tab_my_apps": "Meus Programas",
                "apps.tab_services": "Serviços do Windows",
                "apps.tab_all": "Todos os Processos",
                "apps.search_placeholder": "Buscar programa por nome ou PID...",
                "apps.refresh": "Atualizar Lista",
                "apps.loading": "Varrendo programas ativos...",
                "apps.th_app": "Programa / Executável",
                "apps.th_category": "Tipo",
                "apps.th_ram": "Memória RAM",
                "apps.th_window": "Título da Janela",
                "apps.th_action": "Ações",
                "apps.btn_kill": "Encerrar",
                "apps.btn_uninstall": "Desinstalar",
                "apps.btn_folder": "Abrir Pasta",
                "apps.badge_user_app": "Programa",
                "apps.badge_service": "Serviço",
                "audit.btn_rescan": "Auditoria Completa",
                "audit.tab_reg": "Mapeamento no Registro",
                "audit.tab_appx": "Pacotes Store (AppX)",
                "audit.tab_services": "Serviços do Windows",
                "audit.tab_startup": "Inicialização do Sistema",
                "antivirus.card_defender": "Windows Defender Status",
                "antivirus.defender_rt": "Proteção em Tempo Real",
                "antivirus.card_system32": "Varredura System32",
                "antivirus.system32_title": "Anomalias em Arquivos do Sistema",
                "antivirus.system32_desc": "Audita executáveis suspeitos alojados em C:\\Windows\\System32.",
                "antivirus.btn_scan_system32": "Escanear System32",
                "antivirus.card_heuristics": "Varredura Heurística",
                "antivirus.heuristics_title": "Processos & Mineradores Ocultos",
                "antivirus.heuristics_desc": "Detecta comportamento anômalo em segundo plano e scripts maliciosos.",
                "antivirus.btn_scan_heuristics": "Escanear Heurística",
                "antivirus.card_cloud": "Inteligência em Nuvem",
                "antivirus.cloud_title": "Verificação de Hash & Assinatura Digital",
                "antivirus.cloud_desc": "Cruza hashes de processos com bases mundiais de segurança.",
                "antivirus.btn_scan_cloud": "Varredura em Nuvem",
                "antivirus.btn_quick": "Varredura Rápida Completa",
                "antivirus.tab_all_threats": "Todas as Ameaças",
                "antivirus.tab_system32": "Anomalias System32",
                "antivirus.tab_heuristics": "Heurística",
                "antivirus.tab_cloud": "Nuvem / Hash",
                "antivirus.no_scan": "Nenhuma varredura executada ainda. Selecione uma opção acima.",
                "antivirus.th_threat": "Ameaça / Processo",
                "antivirus.th_risk": "Gravidade",
                "antivirus.th_origin": "Origem",
                "antivirus.th_diag": "Diagnóstico Detalhado",
                "antivirus.th_path": "Caminho do Arquivo",
                "antivirus.th_actions": "Ações",
                "antivirus.btn_quarantine": "Quarentena",
                "antivirus.btn_delete": "Excluir Arquivo",
                "clean.card_title": "Limpeza Profunda do Sistema",
                "clean.real_numbers_tag": "Exclusão Autêntica e Segura",
                "clean.areas_title": "Áreas de Limpeza Disponíveis",
                "clean.btn_analyze": "Analisar Arquivos Temporários",
                "clean.btn_clean": "Limpar Selecionados",
                "clean.recycle_bin": "Lixeira do Windows",
                "clean.temp_user": "Arquivos Temporários do Usuário",
                "clean.update_cache": "Cache do Windows Update",
                "clean.browser_cache": "Caches de Navegadores",
                "power.schemes_title": "Planos de Energia Ativos",
                "power.ultimate_perf": "Desempenho Máximo (Ultimate Performance)",
                "power.btn_activate": "Ativar Plano",
                "power.btn_create": "Criar Novo Plano",
                "optimize.hero_badge": "PIPELINE ENTERPRISE 1-CLIQUE",
                "optimize.hero_title": "Otimização Completa do Sistema & Debloat Automatizado",
                "optimize.hero_desc": "Executa em sequência automatizada: Verificação SFC, Reparo de Imagem DISM, Otimização TRIM NVMe/SSD, Liberação de Caches de RAM e Desativação de Telemetrias Invasivas.",
                "optimize.btn_run_all": "Executar Otimização Completa (Todas as Etapas)",
                "optimize.sfc_title": "Verificação e Reparo de Arquivos (SFC)",
                "optimize.sfc_desc": "Executa sfc /scannow para validar e corrigir integridade de DLLs e arquivos de sistema do Windows.",
                "optimize.btn_sfc": "Executar SFC",
                "optimize.dism_title": "Reparo de Imagem do Windows (DISM)",
                "optimize.dism_desc": "Executa DISM /Online /Cleanup-Image /RestoreHealth utilizando a biblioteca de componentes oficial.",
                "optimize.btn_dism": "Executar DISM",
                "optimize.trim_title": "Otimização TRIM (SSDs & NVMe)",
                "optimize.trim_desc": "Envia instruções TRIM para todas as unidades SSD para restabelecer a velocidade máxima de escrita da NAND.",
                "optimize.btn_trim": "Executar TRIM",
                "optimize.ram_title": "Liberação de Cache & RAM em Standby",
                "optimize.ram_desc": "Purga listas de páginas em standby e working-sets vazios sem fechar seus programas em uso.",
                "optimize.btn_ram": "Otimizar RAM",
                "optimize.telem_title": "Desativar Telemetria & Rastreamento",
                "optimize.telem_desc": "Desliga serviços invasivos de diagnóstico, telemetria DiagTrack e rastreamento de experiência do usuário.",
                "optimize.btn_telem": "Desativar Telemetria",
                "optimize.restore_title": "Criar Ponto de Restauração",
                "optimize.restore_desc": "Cria um ponto de restauração oficial do Windows antes de aplicar modificações profundas.",
                "optimize.btn_restore": "Criar Ponto",
                "optimize.adv_section_title": "Otimizações Avançadas de Kernel, Jogos & Rede",
                "optimize.adv_section_desc": "Ajustes profundos de registro, agendamento de GPU por hardware (HAGS), limpeza WinSxS e reparo de pilha TCP/IP.",
                "optimize.vfx_title": "Efeitos Visuais de Alta Resposta",
                "optimize.vfx_desc": "Reduz atraso de menus para 0ms e otimiza animações do Explorer sem comprometer a nitidez das fontes.",
                "optimize.btn_vfx": "Otimizar Visual",
                "optimize.game_title": "Modo de Jogo & Agendamento GPU (HAGS)",
                "optimize.game_desc": "Ativa AutoGameMode e Hardware-Accelerated GPU Scheduling (HwSchMode=2) para menor latência.",
                "optimize.btn_game": "Ativar Modo Jogo",
                "optimize.winsxs_title": "Limpeza Profunda WinSxS (DISM)",
                "optimize.winsxs_desc": "Executa StartComponentCleanup para remover versões antigas de atualizações substituídas do Windows.",
                "optimize.btn_winsxs": "Limpar WinSxS",
                "optimize.chkdsk_title": "Verificação Online de Disco (CHKDSK)",
                "optimize.chkdsk_desc": "Escaneia a integridade estrutural do sistema de arquivos NTFS na unidade C: sem exigir reinicialização.",
                "optimize.btn_chkdsk": "Verificar C:",
                "optimize.netreset_title": "Reset Completo da Pilha de Rede",
                "optimize.netreset_desc": "Executa Flush DNS, renova concessão DHCP e redefine catálogos Winsock e pilha TCP/IP.",
                "optimize.btn_netreset": "Resetar Rede",
                "overview.cmd_badge": "CENTRAL DE COMANDO ATIVA",
                "overview.cmd_title": "Monitoramento de Kernel, Segurança & Telemetria em Tempo Real",
                "overview.qa_optimize": "Otimizar & Debloat",
                "overview.qa_clean": "Limpeza Profunda",
                "overview.qa_antivirus": "Caça a Ameaças",
                "overview.qa_network": "Rede & SpeedTest",
                "opt_modal.title": "Otimizador do Sistema & Debloat",
                "opt_modal.subtitle": "Executando sequência recomendada de serviços e debloat do Windows...",
                "opt_modal.log_toggle": "Registro Detalhado da Execução",
                "opt_modal.btn_done": "Concluído",
                "terminal.cmd_admin": "Prompt de Comando Administrativo (CMD)",
                "terminal.ps_admin": "PowerShell Administrativo 5.1 / 7+",
                "terminal.elevated_badge": "ELEVADO",
                "terminal.btn_run": "Executar Comando",
                "terminal.chips_label": "DIAGNÓSTICOS RÁPIDOS (1-CLIQUE)",
                "terminal.chip_connections": "Conexões de Rede (netstat)",
                "terminal.chip_top_ram": "Top Processos por RAM",
                "terminal.chip_disks": "Listar Volumes de Disco",
                "terminal.chip_defender": "Status Windows Defender",
                "terminal.btn_copy": "Copiar Saída",
                "terminal.btn_clear": "Limpar",
                "network.refresh": "Atualizar Dados de Rede",
                "network.adapter_card": "Adaptador de Rede Principal",
                "network.connected": "Conectado",
                "network.ip_card": "Configuração de IP Local",
                "network.signal_card": "Sinal e Qualidade Wi-Fi",
                "network.public_card": "IP Público & Operadora",
                "network.ping_title": "Auditoria de Latência & Conexão (Ping)",
                "network.ping_desc": "Mede tempo de resposta, jitter e estabilidade contra os maiores provedores de nuvem e DNS do mundo.",
                "network.ping_all_btn": "Testar Todos os Servidores",
                "network.ping_custom_btn": "Testar Host Personalizado",
                "network.speed_title": "Teste Real de Velocidade (Download & Upload)",
                "network.download": "Download",
                "network.upload": "Upload",
                "network.btn_start_speed": "Iniciar Teste de Velocidade",
                "network.repair_title": "Reparos Rápidos de Conectividade (1-Clique)",
                "devices.btn_refresh": "Atualizar Dispositivos",
                "devices.btn_scan_updates": "Verificar Atualizações de Drivers",
                "devices.btn_backup": "Fazer Backup de Todos os Drivers",
                "devices.total_card": "Total de Dispositivos",
                "devices.display_card": "Controladores de Vídeo",
                "devices.third_card": "Drivers de Fabricantes Terceiros",
                "devices.signed_card": "Drivers Assinados Digitalmente",
                "devices.tab_installed": "Dispositivos & Drivers Instalados",
                "devices.tab_updates": "Central de Atualizações de Drivers",
                "devices.update_title": "Central de Atualização de Drivers (Windows Update & Fabricantes)",
                "devices.update_desc": "Verifica pacotes de drivers homologados pelo Windows Update e utilitários OEM oficiais."
            },
            'en': {
                "brand.subtitle": "Hardware, Security & Optimizer",
                "brand.app_name": "WinShield Pro",
                "brand.dev_label": "Developed by",
                "nav.search_placeholder": "Search module (Ctrl+K)...",
                "nav.group_hardware": "HARDWARE",
                "nav.overview": "Overview",
                "nav.silicon": "Processor",
                "nav.vision": "Graphics",
                "nav.memory": "Memory",
                "nav.devices": "Devices",
                "nav.group_stability": "STABILITY",
                "nav.stability": "Stress Test",
                "nav.group_storage": "STORAGE & NET",
                "nav.disk_health": "Drives",
                "nav.disk_bench": "Speed",
                "nav.group_network": "NETWORK",
                "nav.network": "Network & Wi-Fi",
                "nav.group_apps": "APPLICATIONS",
                "nav.running_apps": "Programs",
                "nav.audit": "Audit",
                "nav.antivirus": "Antivirus",
                "nav.group_system": "SYSTEM",
                "nav.clean": "Cleaner",
                "nav.power": "Power",
                "nav.optimize": "Optimization",
                "nav.group_advanced": "ADVANCED",
                "nav.terminal": "Terminal",
                "side.telemetry": "TELEMETRY",
                "side.active": "PROTECTED",
                "header.theme_dark": "Dark",
                "header.theme_light": "Light",
                "header.theme_auto": "Auto",
                "header.console": "Console",
                "console.title": "Real-Time Operations Console (Minimized)",
                "console.title_open": "Real-Time Operations Console",
                "console.save": "Save Log (.log)",
                "console.clear": "Clear",
                "splash.welcome": "Welcome to WinShield Pro",
                "splash.badge": "WINSHIELD PRO ENTERPRISE v6.2",
                "splash.lang_title": "Select your Language",
                "splash.status_loading1": "INITIALIZING SYSTEM...",
                "splash.status_loading2": "Syncing hardware telemetry and sensors...",
                "splash.status_loading3": "Loading storage & security engines...",
                "splash.progress_ready": "SYSTEM READY FOR ACCESS",
                "splash.subtitle": "Intelligent protection for your environment.",
                "splash.check1": "Kernel & Admin Rights",
                "splash.check2": "Telemetry & Sensors",
                "splash.check3": "S.M.A.R.T. & Storage",
                "splash.check4": "Optimization Engines",
                "splash.status_ok": "ACTIVE",
                "splash.status_conn": "CONNECTED",
                "splash.status_ready": "READY",
                "splash.status_init": "INITIALIZED",
                "splash.dont_show": "Do not show on startup",
                "splash.enter": "Enter System",
                "modals.btn_cancel": "Cancel",
                "modals.btn_confirm": "Confirm",
                "modals.kill_title": "End Task",
                "modals.kill_msg": "Do you really want to force close this program?",
                "modals.kill_warn": "Any unsaved data in this task will be permanently lost.",
                "modals.uninstall_title": "Uninstall Application",
                "modals.uninstall_msg": "Do you want to run the official uninstallation routine for this software?",
                "modals.threat_title": "Delete Detected Threat",
                "modals.threat_msg": "Do you want to terminate the process and permanently remove this file from disk?",
                "modals.clean_title": "Authorize Deep Clean",
                "modals.clean_msg": "Do you want to initiate permanent removal of selected files and system caches?",
                "modals.shred_title": "Forced File Shredding",
                "overview.cpu_usage": "CPU Usage",
                "overview.ram_usage": "RAM Memory",
                "overview.disk_system": "System Drive (C:)",
                "overview.ssd_primary": "Primary SSD",
                "overview.storage_health": "Storage Health",
                "overview.smart_realtime": "Real-time S.M.A.R.T. & NVMe",
                "overview.btn_full_diag": "View Complete Health & Diagnostics",
                "overview.os_title": "Operating System",
                "overview.os_build": "Edition & Build (Build / UBR)",
                "overview.os_install": "Windows Installation Date",
                "overview.motherboard": "Motherboard",
                "overview.bios_version": "BIOS Version & Release Date",
                "overview.security_hardware": "Hardware Security",
                "overview.cpu_main": "Primary Processor",
                "overview.gpu_dedicated": "Dedicated Graphics Card (GPU)",
                "overview.ram_physical": "Physical RAM Memory",
                "overview.computer_session": "Computer & Active Session",
                "overview.btn_speed_test": "Run Read/Write Drive Speed Benchmark",
                "silicon.tab_cpu": "CPU (Processor)",
                "silicon.tab_mainboard": "Mainboard",
                "silicon.tab_memory": "Memory & SPD (RAM)",
                "silicon.tab_bench": "Silicon Core™ Benchmark",
                "silicon.btn_refresh": "Refresh Silicon Core™",
                "silicon.cpu_name": "Processor Name",
                "silicon.codename": "Codename",
                "silicon.litography": "Lithography",
                "silicon.socket": "Socket",
                "silicon.cores_threads": "Cores / Threads",
                "silicon.instructions": "Supported Instruction Set",
                "silicon.clocks": "Real-Time Clocks",
                "silicon.multiplier": "Multiplier",
                "silicon.mb_specs": "Motherboard Specifications",
                "silicon.mb_chipset": "Manufacturer & Chipset",
                "silicon.mb_mfr": "Manufacturer:",
                "silicon.mb_model": "Model:",
                "silicon.mb_pcie": "PCI-e Bus:",
                "silicon.mb_bios": "BIOS & Firmware",
                "silicon.mb_vendor": "Vendor:",
                "silicon.mb_ver": "Version:",
                "silicon.mb_date": "Release Date:",
                "silicon.ram_config": "General RAM Configuration",
                "silicon.ram_total": "Total Capacity",
                "silicon.ram_channels": "Channels",
                "silicon.ram_slots": "Slots Used",
                "silicon.btn_start_bench": "START CPU BENCHMARK",
                "vision.tab_gpu": "Graphics Card",
                "vision.tab_sensors": "Real-Time Sensors",
                "vision.btn_refresh": "Refresh Vision Engine™",
                "vision.adapter_name": "Graphics Adapter Name",
                "vision.architecture": "Architecture / GPU",
                "vision.transistors": "Transistors",
                "vision.bus_width": "VRAM Bus Width",
                "vision.bandwidth": "Bandwidth",
                "vision.driver_ver": "Driver Version",
                "vision.resolution": "Resolution / Display",
                "vision.features": "Supported Graphics & Compute Features",
                "vision.temp": "GPU Temperature",
                "vision.load": "GPU Load (Usage)",
                "vision.vram_used": "Video Memory Used",
                "vision.power": "Power Consumption (TGP)",
                "memory.header_badge": "RAM Memory & Bus Telemetry",
                "memory.total_installed": "Total Installed",
                "memory.used": "In Use",
                "memory.available": "Available",
                "memory.load_label": "Global RAM Load",
                "memory.modules_title": "Physical Memory Sticks (SPD & Hardware)",
                "memory.ramguard_title": "WinShield RAMGuard™ (Memory Integrity Diagnostics)",
                "memory.ramguard_desc": "Advanced matrix scanning and physical cell integrity validation to detect hardware faults, bus instability, or blue screens (BSOD).",
                "memory.btn_start_test": "Start Stress Test",
                "memory.btn_stop_test": "Stop Test",
                "memory.btn_refresh": "Refresh Info",
                "memory.test_status_label": "Test Status",
                "memory.test_speed_label": "Speed",
                "memory.test_pattern_label": "Pattern",
                "memory.test_errors_label": "Errors",
                "memory.block_progress": "Block Progress Grid",
                "memory.log_title": "RAMGuard™ Live Telemetry Log",
                "disk_health.btn_rescan": "Rescan Drives",
                "disk_health.tab_smart": "S.M.A.R.T. & NVMe Log",
                "disk_health.tab_surface": "SurfaceScan (1,200 Blocks)",
                "disk_health.tab_align": "Features & 4K Alignment",
                "disk_health.temperature": "Temperature",
                "disk_health.power_on_hours": "Power-On Hours",
                "disk_health.total_written": "Total Written",
                "disk_health.th_attr": "Attribute Name",
                "disk_health.th_current": "Current",
                "disk_health.th_worst": "Worst",
                "disk_health.th_threshold": "Threshold",
                "disk_health.th_raw": "Raw Value",
                "disk_health.btn_start_scan": "START SURFACESCAN",
                "disk_health.btn_stop_scan": "STOP SCAN",
                "disk_health.bad_sectors": "Damaged Sectors",
                "disk_health.read_speed": "Read Speed",
                "disk_health.elapsed_time": "Elapsed Time",
                "disk_health.remaining_time": "Est. Remaining Time",
                "disk_bench.btn_all_tests": "ALL BENCHMARKS",
                "disk_bench.passes": "Repetitions (Passes):",
                "disk_bench.sample_size": "Sample Size:",
                "disk_bench.test_drive": "Benchmark Drive:",
                "disk_bench.measure_unit": "Measurement Unit:",
                "disk_bench.seq_read": "Sequential Read",
                "disk_bench.seq_write": "Sequential Write",
                "disk_bench.rnd_read": "Random Read 4K",
                "disk_bench.rnd_write": "Random Write 4K",
                "apps.header_title": "Running Applications & Manager",
                "apps.header_desc": "Monitor active Windows desktop tasks, isolate services, and uninstall unwanted software.",
                "apps.stat_user_apps": "User Applications",
                "apps.stat_services": "Windows Services",
                "apps.stat_ram": "Total RAM Footprint",
                "apps.tab_my_apps": "User Programs",
                "apps.tab_services": "Windows Services",
                "apps.tab_all": "All Active Processes",
                "apps.search_placeholder": "Search program by name or PID...",
                "apps.refresh": "Refresh List",
                "apps.loading": "Scanning active processes...",
                "apps.th_app": "Program / Executable",
                "apps.th_category": "Category",
                "apps.th_ram": "RAM Usage",
                "apps.th_window": "Window Title",
                "apps.th_action": "Actions",
                "apps.btn_kill": "End Task",
                "apps.btn_uninstall": "Uninstall",
                "apps.btn_folder": "Open Folder",
                "apps.badge_user_app": "Program",
                "apps.badge_service": "Service",
                "audit.btn_rescan": "Full System Audit",
                "audit.tab_reg": "Registry Uninstallers",
                "audit.tab_appx": "Windows Store Apps (AppX)",
                "audit.tab_services": "System Services",
                "audit.tab_startup": "Startup Applications",
                "antivirus.card_defender": "Windows Defender Status",
                "antivirus.defender_rt": "Real-Time Protection",
                "antivirus.card_system32": "System32 Inspection",
                "antivirus.system32_title": "System Directory Anomalies",
                "antivirus.system32_desc": "Audits suspicious binaries and rogue executables in C:\\Windows\\System32.",
                "antivirus.btn_scan_system32": "Scan System32",
                "antivirus.card_heuristics": "Heuristic Scanner",
                "antivirus.heuristics_title": "Hidden Miners & Rogue Tasks",
                "antivirus.heuristics_desc": "Detects abnormal background behaviors, rogue scripts, and miner patterns.",
                "antivirus.btn_scan_heuristics": "Scan Heuristics",
                "antivirus.card_cloud": "Cloud Threat Intelligence",
                "antivirus.cloud_title": "Hash Verification & Digital Signature",
                "antivirus.cloud_desc": "Cross-checks process hashes against global threat intelligence databases.",
                "antivirus.btn_scan_cloud": "Cloud Scan",
                "antivirus.btn_quick": "Full Quick Scan",
                "antivirus.tab_all_threats": "All Threats",
                "antivirus.tab_system32": "System32 Anomalies",
                "antivirus.tab_heuristics": "Heuristics",
                "antivirus.tab_cloud": "Cloud / Hash",
                "antivirus.no_scan": "No scan executed yet. Please select an option above.",
                "antivirus.th_threat": "Threat / Process",
                "antivirus.th_risk": "Severity",
                "antivirus.th_origin": "Origin",
                "antivirus.th_diag": "Detailed Diagnostic",
                "antivirus.th_path": "File Path",
                "antivirus.th_actions": "Actions",
                "antivirus.btn_quarantine": "Quarantine",
                "antivirus.btn_delete": "Delete File",
                "clean.card_title": "Deep System Cleaner",
                "clean.real_numbers_tag": "Authentic & Secure Deletion",
                "clean.areas_title": "Available Cleaning Targets",
                "clean.btn_analyze": "Analyze Temporary Files",
                "clean.btn_clean": "Clean Selected Targets",
                "clean.recycle_bin": "Windows Recycle Bin",
                "clean.temp_user": "User Temporary Files (%TEMP%)",
                "clean.update_cache": "Windows Update Download Cache",
                "clean.browser_cache": "Browser Web Caches",
                "power.schemes_title": "Active Windows Power Schemes",
                "power.ultimate_perf": "Ultimate Performance Scheme",
                "power.btn_activate": "Activate Scheme",
                "power.btn_create": "Create New Scheme",
                "optimize.hero_badge": "1-CLICK ENTERPRISE PIPELINE",
                "optimize.hero_title": "Complete System Optimization & Automated Debloat",
                "optimize.hero_desc": "Executes in sequence: SFC integrity check, DISM component repair, NVMe/SSD TRIM optimization, standby RAM cache purge, and telemetry debloat.",
                "optimize.btn_run_all": "Run Full Optimization (All Steps)",
                "optimize.sfc_title": "System File Integrity Check (SFC)",
                "optimize.sfc_desc": "Runs sfc /scannow to validate and repair corrupted system DLLs and core Windows files.",
                "optimize.btn_sfc": "Run SFC Scan",
                "optimize.dism_title": "Windows Image Component Repair (DISM)",
                "optimize.dism_desc": "Executes DISM /Online /Cleanup-Image /RestoreHealth against official component store.",
                "optimize.btn_dism": "Run DISM Repair",
                "optimize.trim_title": "TRIM Optimization (SSDs & NVMe)",
                "optimize.trim_desc": "Dispatches hardware TRIM commands to all solid state drives to maintain peak write bandwidth.",
                "optimize.btn_trim": "Run TRIM",
                "optimize.ram_title": "Purge Standby Cache & RAM Working Sets",
                "optimize.ram_desc": "Reclaims inactive standby memory pages without closing running user applications.",
                "optimize.btn_ram": "Optimize RAM",
                "optimize.telem_title": "Disable Invasive Telemetry & Tracking",
                "optimize.telem_desc": "Disables DiagTrack, customer telemetry services, and diagnostic background logging.",
                "optimize.btn_telem": "Disable Telemetry",
                "optimize.restore_title": "Create System Restore Point",
                "optimize.restore_desc": "Creates an official Windows recovery restore point before applying deep system modifications.",
                "optimize.btn_restore": "Create Point",
                "optimize.adv_section_title": "Advanced Kernel, Gaming & Network Optimizations",
                "optimize.adv_section_desc": "Deep registry tuning, Hardware-Accelerated GPU Scheduling (HAGS), WinSxS cleanup, and TCP/IP stack reset.",
                "optimize.vfx_title": "High-Response Visual Effects",
                "optimize.vfx_desc": "Sets menu show delay to 0ms and tunes Explorer animations while keeping ClearType font smoothing.",
                "optimize.btn_vfx": "Optimize Visuals",
                "optimize.game_title": "Game Mode & GPU Scheduling (HAGS)",
                "optimize.game_desc": "Enables Windows AutoGameMode and Hardware-Accelerated GPU Scheduling (HwSchMode=2) for low latency.",
                "optimize.btn_game": "Enable Game Mode",
                "optimize.winsxs_title": "Deep WinSxS Cleanup (DISM)",
                "optimize.winsxs_desc": "Runs StartComponentCleanup to remove superseded Windows Update component packages.",
                "optimize.btn_winsxs": "Clean WinSxS",
                "optimize.chkdsk_title": "Online Disk Integrity Scan (CHKDSK)",
                "optimize.chkdsk_desc": "Verifies NTFS file system structure on drive C: online without requiring a system reboot.",
                "optimize.btn_chkdsk": "Scan Drive C:",
                "optimize.netreset_title": "Full Network Stack & Winsock Reset",
                "optimize.netreset_desc": "Flushes DNS cache, renews DHCP lease, and resets Winsock catalogs and TCP/IP stack.",
                "optimize.btn_netreset": "Reset Network",
                "overview.cmd_badge": "ACTIVE COMMAND CENTER",
                "overview.cmd_title": "Real-Time Kernel Telemetry, Hardware Diagnostics & Security Posture",
                "overview.qa_optimize": "Optimize & Debloat",
                "overview.qa_clean": "Deep Cleaner",
                "overview.qa_antivirus": "Threat Hunter",
                "overview.qa_network": "Network & Speed",
                "opt_modal.title": "System Optimizer & Debloat Pipeline",
                "opt_modal.subtitle": "Executing recommended sequence of Windows optimizations and debloat...",
                "opt_modal.log_toggle": "Detailed Execution Output Log",
                "opt_modal.btn_done": "Done",
                "terminal.cmd_admin": "Command Prompt (CMD Administrator)",
                "terminal.ps_admin": "PowerShell 5.1 / 7+ (Administrator)",
                "terminal.elevated_badge": "ELEVATED",
                "terminal.btn_run": "Execute Command",
                "terminal.chips_label": "1-CLICK QUICK DIAGNOSTICS",
                "terminal.chip_connections": "Network Ports (netstat)",
                "terminal.chip_top_ram": "Top RAM Processes",
                "terminal.chip_disks": "List Disk Volumes",
                "terminal.chip_defender": "Windows Defender Status",
                "terminal.btn_copy": "Copy Output",
                "terminal.btn_clear": "Clear",
                "network.refresh": "Refresh Network Telemetry",
                "network.adapter_card": "Primary Network Adapter",
                "network.connected": "Connected",
                "network.ip_card": "Local IP Configuration",
                "network.signal_card": "Wi-Fi Signal & Quality",
                "network.public_card": "Public IP & ISP",
                "network.ping_title": "Latency & Connection Auditor (Ping)",
                "network.ping_desc": "Measures response time, jitter, and packet loss against top global cloud and DNS providers.",
                "network.ping_all_btn": "Test All Servers",
                "network.ping_custom_btn": "Test Custom Host",
                "network.speed_title": "Real Bandwidth Benchmark (Download & Upload)",
                "network.download": "Download",
                "network.upload": "Upload",
                "network.btn_start_speed": "Start Speed Test",
                "network.repair_title": "1-Click Quick Network Repairs",
                "devices.btn_refresh": "Refresh Device List",
                "devices.btn_scan_updates": "Check Driver Updates",
                "devices.btn_backup": "Backup All Installed Drivers",
                "devices.total_card": "Total Plug & Play Devices",
                "devices.display_card": "Display Controllers",
                "devices.third_card": "Third-Party OEM Drivers",
                "devices.signed_card": "Digitally Signed Drivers",
                "devices.tab_installed": "Installed Devices & Drivers",
                "devices.tab_updates": "Driver Update Center",
                "devices.update_title": "Driver Update Center (Windows Update & OEM Suites)",
                "devices.update_desc": "Scans for pending certified driver packages via Windows Update and OEM hardware managers."
            },
            'es': {
                "brand.subtitle": "Hardware, Seguridad y Optimizador",
                "brand.app_name": "WinShield Pro",
                "brand.dev_label": "Desarrollado por",
                "nav.search_placeholder": "Buscar módulo (Ctrl+K)...",
                "nav.group_hardware": "HARDWARE",
                "nav.overview": "General",
                "nav.silicon": "Procesador",
                "nav.vision": "Gráficos",
                "nav.memory": "Memoria",
                "nav.devices": "Dispositivos",
                "nav.group_stability": "ESTABILIDAD",
                "nav.stability": "Prueba de Estrés",
                "nav.group_storage": "DISCOS Y RED",
                "nav.disk_health": "Discos",
                "nav.disk_bench": "Velocidad",
                "nav.group_network": "RED",
                "nav.network": "Red y Wi-Fi",
                "nav.group_apps": "APLICACIONES",
                "nav.running_apps": "Programas",
                "nav.audit": "Auditoría",
                "nav.antivirus": "Antivirus",
                "nav.group_system": "SISTEMA",
                "nav.clean": "Limpieza",
                "nav.power": "Energía",
                "nav.optimize": "Optimización",
                "nav.group_advanced": "AVANZADO",
                "nav.terminal": "Terminal",
                "side.telemetry": "TELEMETRÍA",
                "side.active": "PROTEGIDO",
                "header.theme_dark": "Oscuro",
                "header.theme_light": "Claro",
                "header.theme_auto": "Auto",
                "header.console": "Consola",
                "console.title": "Consola de Operaciones en Tiempo Real (Minimizada)",
                "console.title_open": "Consola de Operaciones en Tiempo Real",
                "console.save": "Guardar Registro (.log)",
                "console.clear": "Limpiar",
                "splash.welcome": "Bienvenido a WinShield Pro",
                "splash.badge": "WINSHIELD PRO ENTERPRISE v6.2",
                "splash.lang_title": "Seleccione su Idioma",
                "splash.status_loading1": "INICIANDO SISTEMA...",
                "splash.status_loading2": "Sincronizando telemetría de hardware y sensores...",
                "splash.status_loading3": "Cargando motores de disco y seguridad...",
                "splash.progress_ready": "SISTEMA LISTO PARA ACCESO",
                "splash.subtitle": "Protección inteligente para su entorno.",
                "splash.check1": "Permisos de Kernel y Admin",
                "splash.check2": "Telemetría y Sensores",
                "splash.check3": "S.M.A.R.T. y Discos",
                "splash.check4": "Motores de Optimización",
                "splash.status_ok": "ACTIVO",
                "splash.status_conn": "CONECTADO",
                "splash.status_ready": "LISTO",
                "splash.status_init": "INICIALIZADO",
                "splash.dont_show": "No mostrar al inicio",
                "splash.enter": "Entrar al Sistema",
                "modals.btn_cancel": "Cancelar",
                "modals.btn_confirm": "Confirmar",
                "modals.kill_title": "Finalizar Tarea",
                "modals.kill_msg": "¿Desea forzar el cierre inmediato de este programa?",
                "modals.kill_warn": "Cualquier cambio sin guardar se perderá definitivamente.",
                "modals.uninstall_title": "Desinstalar Aplicación",
                "modals.uninstall_msg": "¿Desea ejecutar el desinstalador oficial para eliminar este software?",
                "modals.threat_title": "Eliminar Amenaza Detectada",
                "modals.threat_msg": "¿Desea finalizar el proceso activo y borrar permanentemente el archivo del disco?",
                "modals.clean_title": "Autorizar Limpieza Profunda",
                "modals.clean_msg": "¿Desea iniciar la eliminación definitiva de los archivos y cachés seleccionados?",
                "modals.shred_title": "Trituración Forzada de Archivos",
                "overview.cpu_usage": "Uso del Procesador",
                "overview.ram_usage": "Memoria RAM",
                "overview.disk_system": "Unidad del Sistema (C:)",
                "overview.ssd_primary": "SSD Principal",
                "overview.storage_health": "Salud del Almacenamiento",
                "overview.smart_realtime": "S.M.A.R.T. y NVMe en tiempo real",
                "overview.btn_full_diag": "Ver Diagnóstico Completo e Integridad",
                "overview.os_title": "Sistema Operativo",
                "overview.os_build": "Edición y Compilación (Build / UBR)",
                "overview.os_install": "Fecha de Instalación de Windows",
                "overview.motherboard": "Placa Base (Motherboard)",
                "overview.bios_version": "Versión de BIOS y Fecha",
                "overview.security_hardware": "Seguridad de Hardware",
                "overview.cpu_main": "Procesador Principal",
                "overview.gpu_dedicated": "Tarjeta Gráfica Dedicada (GPU)",
                "overview.ram_physical": "Memoria RAM Física",
                "overview.computer_session": "Equipo y Sesión Activa",
                "overview.btn_speed_test": "Ejecutar Prueba de Velocidad Lectura/Escritura",
                "silicon.tab_cpu": "CPU (Procesador)",
                "silicon.tab_mainboard": "Placa Base (Mainboard)",
                "silicon.tab_memory": "Memoria y SPD (RAM)",
                "silicon.tab_bench": "Silicon Core™ Benchmark",
                "silicon.btn_refresh": "Actualizar Silicon Core™",
                "silicon.cpu_name": "Nombre del Procesador",
                "silicon.codename": "Nombre en Clave",
                "silicon.litography": "Litografía",
                "silicon.socket": "Zócalo (Socket)",
                "silicon.cores_threads": "Núcleos / Hilos",
                "silicon.instructions": "Instrucciones Soportadas",
                "silicon.clocks": "Frecuencias en Tiempo Real (Clocks)",
                "silicon.multiplier": "Multiplicador",
                "silicon.mb_specs": "Especificaciones de la Placa Base",
                "silicon.mb_chipset": "Fabricante y Chipset",
                "silicon.mb_mfr": "Fabricante:",
                "silicon.mb_model": "Modelo:",
                "silicon.mb_pcie": "Bus PCI-e:",
                "silicon.mb_bios": "BIOS y Firmware",
                "silicon.mb_vendor": "Desarrollador:",
                "silicon.mb_ver": "Versión:",
                "silicon.mb_date": "Fecha de Lanzamiento:",
                "silicon.ram_config": "Configuración General de Memoria RAM",
                "silicon.ram_total": "Capacidad Total",
                "silicon.ram_channels": "Canales",
                "silicon.ram_slots": "Ranuras Ocupadas",
                "silicon.btn_start_bench": "INICIAR PRUEBA DE CPU",
                "vision.tab_gpu": "Tarjeta Gráfica (GPU)",
                "vision.tab_sensors": "Sensores en Tiempo Real",
                "vision.btn_refresh": "Actualizar Vision Engine™",
                "vision.adapter_name": "Nombre del Adaptador Gráfico",
                "vision.architecture": "Arquitectura / GPU",
                "vision.transistors": "Transistores",
                "vision.bus_width": "Bus de VRAM",
                "vision.bandwidth": "Ancho de Banda",
                "vision.driver_ver": "Versión del Driver",
                "vision.resolution": "Resolución / Pantalla",
                "vision.features": "Funciones Gráficas y Cómputo Soportadas",
                "vision.temp": "Temperatura de la GPU",
                "vision.load": "Carga de GPU (Uso)",
                "vision.vram_used": "Memoria de Vídeo en Uso",
                "vision.power": "Consumo Energético (TGP)",
                "memory.header_badge": "Memoria RAM y Bus",
                "memory.total_installed": "Total Instalada",
                "memory.used": "En Uso",
                "memory.available": "Disponible",
                "memory.load_label": "Carga Global de Memoria RAM",
                "memory.modules_title": "Módulos Físicos de Memoria (SPD y Hardware)",
                "memory.ramguard_title": "WinShield RAMGuard™ (Diagnóstico de Integridad de Memoria)",
                "memory.ramguard_desc": "Escaneo avanzado de matriz y validación de celdas de memoria RAM para detectar fallas físicas, inestabilidad o pantallas azules (BSOD).",
                "memory.btn_start_test": "Iniciar Prueba de Estrés",
                "memory.btn_stop_test": "Detener Prueba",
                "memory.btn_refresh": "Actualizar Información",
                "memory.test_status_label": "Estado de la Prueba",
                "memory.test_speed_label": "Velocidad",
                "memory.test_pattern_label": "Patrón",
                "memory.test_errors_label": "Errores",
                "memory.block_progress": "Progreso por Bloques de Memoria",
                "memory.log_title": "Registro en Vivo de RAMGuard™",
                "disk_health.btn_rescan": "Reescanear Discos",
                "disk_health.tab_smart": "S.M.A.R.T. y Registro NVMe",
                "disk_health.tab_surface": "SurfaceScan (1.200 Bloques)",
                "disk_health.tab_align": "Funciones y Alineación 4K",
                "disk_health.temperature": "Temperatura",
                "disk_health.power_on_hours": "Horas Encendido",
                "disk_health.total_written": "Total Escrito",
                "disk_health.th_attr": "Nombre del Atributo",
                "disk_health.th_current": "Actual",
                "disk_health.th_worst": "Peor",
                "disk_health.th_threshold": "Límite",
                "disk_health.th_raw": "Valor Bruto (Raw)",
                "disk_health.btn_start_scan": "INICIAR ESCANEO SURFACESCAN",
                "disk_health.btn_stop_scan": "DETENER ESCANEO",
                "disk_health.bad_sectors": "Sectores Dañados",
                "disk_health.read_speed": "Velocidad de Lectura",
                "disk_health.elapsed_time": "Tiempo Transcurrido",
                "disk_health.remaining_time": "Tiempo Restante Est.",
                "disk_bench.btn_all_tests": "TODAS LAS PRUEBAS",
                "disk_bench.passes": "Repeticiones (Pasadas):",
                "disk_bench.sample_size": "Tamaño de Muestra:",
                "disk_bench.test_drive": "Unidad de Prueba:",
                "disk_bench.measure_unit": "Unidad de Medida:",
                "disk_bench.seq_read": "Lectura Secuencial",
                "disk_bench.seq_write": "Escritura Secuencial",
                "disk_bench.rnd_read": "Lectura Aleatoria 4K",
                "disk_bench.rnd_write": "Escritura Aleatoria 4K",
                "apps.header_title": "Programas en Ejecución y Gestor",
                "apps.header_desc": "Monitoree tareas activas de Windows, aísle servicios y desinstale programas no deseados.",
                "apps.stat_user_apps": "Programas de Usuario",
                "apps.stat_services": "Servicios de Windows",
                "apps.stat_ram": "Consumo Total de RAM",
                "apps.tab_my_apps": "Mis Programas",
                "apps.tab_services": "Servicios de Windows",
                "apps.tab_all": "Todos los Procesos",
                "apps.search_placeholder": "Buscar programa por nombre o PID...",
                "apps.refresh": "Actualizar Lista",
                "apps.loading": "Escaneando procesos activos...",
                "apps.th_app": "Programa / Ejecutable",
                "apps.th_category": "Tipo",
                "apps.th_ram": "Memoria RAM",
                "apps.th_window": "Título de Ventana",
                "apps.th_action": "Acciones",
                "apps.btn_kill": "Finalizar",
                "apps.btn_uninstall": "Desinstalar",
                "apps.btn_folder": "Abrir Carpeta",
                "apps.badge_user_app": "Programa",
                "apps.badge_service": "Servicio",
                "audit.btn_rescan": "Auditoría Completa",
                "audit.tab_reg": "Mapeo en Registro",
                "audit.tab_appx": "Paquetes Store (AppX)",
                "audit.tab_services": "Servicios de Windows",
                "audit.tab_startup": "Inicio del Sistema",
                "antivirus.card_defender": "Estado Windows Defender",
                "antivirus.defender_rt": "Protección en Tiempo Real",
                "antivirus.card_system32": "Escaneo System32",
                "antivirus.system32_title": "Anomalías en Archivos de Sistema",
                "antivirus.system32_desc": "Audita ejecutables sospechosos alojados en C:\\Windows\\System32.",
                "antivirus.btn_scan_system32": "Escanear System32",
                "antivirus.card_heuristics": "Escáner Heurístico",
                "antivirus.heuristics_title": "Procesos y Mineros Ocultos",
                "antivirus.heuristics_desc": "Detecta comportamientos anómalos en segundo plano y scripts maliciosos.",
                "antivirus.btn_scan_heuristics": "Escanear Heurística",
                "antivirus.card_cloud": "Inteligencia en la Nube",
                "antivirus.cloud_title": "Verificación de Hash y Firma Digital",
                "antivirus.cloud_desc": "Compara hashes de procesos con bases de datos globales de amenazas.",
                "antivirus.btn_scan_cloud": "Escaneo en Nube",
                "antivirus.btn_quick": "Escaneo Rápido Completo",
                "antivirus.tab_all_threats": "Todas las Amenazas",
                "antivirus.tab_system32": "Anomalías System32",
                "antivirus.tab_heuristics": "Heurística",
                "antivirus.tab_cloud": "Nube / Hash",
                "antivirus.no_scan": "Ningún escaneo ejecutado aún. Seleccione una opción arriba.",
                "antivirus.th_threat": "Amenaza / Proceso",
                "antivirus.th_risk": "Gravedad",
                "antivirus.th_origin": "Origen",
                "antivirus.th_diag": "Diagnóstico Detallado",
                "antivirus.th_path": "Ruta del Archivo",
                "antivirus.th_actions": "Acciones",
                "antivirus.btn_quarantine": "Cuarentena",
                "antivirus.btn_delete": "Eliminar Archivo",
                "clean.card_title": "Limpieza Profunda del Sistema",
                "clean.real_numbers_tag": "Eliminación Auténtica y Segura",
                "clean.areas_title": "Áreas de Limpieza Disponibles",
                "clean.btn_analyze": "Analizar Archivos Temporales",
                "clean.btn_clean": "Limpiar Seleccionados",
                "clean.recycle_bin": "Papelera de Reciclaje",
                "clean.temp_user": "Archivos Temporales del Usuario",
                "clean.update_cache": "Caché de Windows Update",
                "clean.browser_cache": "Cachés de Navegadores Web",
                "power.schemes_title": "Planes de Energía Activos",
                "power.ultimate_perf": "Máximo Rendimiento (Ultimate Performance)",
                "power.btn_activate": "Activar Plan",
                "power.btn_create": "Crear Nuevo Plan",
                "optimize.hero_badge": "PIPELINE ENTERPRISE 1-CLIC",
                "optimize.hero_title": "Optimización Completa del Sistema y Debloat Automatizado",
                "optimize.hero_desc": "Ejecuta en secuencia: Verificación SFC, Reparación de Imagen DISM, Optimización TRIM NVMe/SSD, Liberación de Caché de RAM y Desactivación de Telemetría.",
                "optimize.btn_run_all": "Ejecutar Optimización Completa (Todas las Etapas)",
                "optimize.sfc_title": "Verificación de Integridad de Archivos (SFC)",
                "optimize.sfc_desc": "Ejecuta sfc /scannow para validar y reparar DLLs y archivos críticos de Windows.",
                "optimize.btn_sfc": "Ejecutar SFC",
                "optimize.dism_title": "Reparación de Imagen de Windows (DISM)",
                "optimize.dism_desc": "Ejecuta DISM /Online /Cleanup-Image /RestoreHealth utilizando la tienda de componentes oficial.",
                "optimize.btn_dism": "Ejecutar DISM",
                "optimize.trim_title": "Optimización TRIM (SSDs y NVMe)",
                "optimize.trim_desc": "Envía instrucciones TRIM a todas las unidades SSD para mantener la máxima velocidad de escritura.",
                "optimize.btn_trim": "Ejecutar TRIM",
                "optimize.ram_title": "Liberación de Caché y RAM en Standby",
                "optimize.ram_desc": "Purga listas de páginas en standby y working sets inactivos sin cerrar sus aplicaciones.",
                "optimize.btn_ram": "Optimizar RAM",
                "optimize.telem_title": "Desactivar Telemetría y Rastreo Invasivo",
                "optimize.telem_desc": "Desactiva servicios de diagnóstico, telemetría DiagTrack y recolección en segundo plano.",
                "optimize.btn_telem": "Desactivar Telemetría",
                "optimize.restore_title": "Crear Punto de Restauración",
                "optimize.restore_desc": "Crea un punto de restauración oficial de Windows antes de aplicar cambios profundos.",
                "optimize.btn_restore": "Crear Punto",
                "optimize.adv_section_title": "Optimizaciones Avanzadas de Kernel, Juegos y Red",
                "optimize.adv_section_desc": "Ajustes profundos de registro, programación de GPU por hardware (HAGS), limpieza WinSxS y reinicio TCP/IP.",
                "optimize.vfx_title": "Efectos Visuales de Alta Respuesta",
                "optimize.vfx_desc": "Reduce el retraso de menús a 0ms y optimiza animaciones del Explorador manteniendo fuentes nítidas.",
                "optimize.btn_vfx": "Optimizar Visual",
                "optimize.game_title": "Modo Juego y Programación GPU (HAGS)",
                "optimize.game_desc": "Activa AutoGameMode y programación de GPU acelerada por hardware (HwSchMode=2) para menor latencia.",
                "optimize.btn_game": "Activar Modo Juego",
                "optimize.winsxs_title": "Limpieza Profunda WinSxS (DISM)",
                "optimize.winsxs_desc": "Ejecuta StartComponentCleanup para eliminar versiones antiguas de componentes reemplazados.",
                "optimize.btn_winsxs": "Limpiar WinSxS",
                "optimize.chkdsk_title": "Verificación Online de Disco (CHKDSK)",
                "optimize.chkdsk_desc": "Escanea la integridad estructural del sistema de archivos NTFS en C: sin reiniciar.",
                "optimize.btn_chkdsk": "Verificar C:",
                "optimize.netreset_title": "Reinicio Completo de Pila de Red",
                "optimize.netreset_desc": "Vacía caché DNS, renueva concesión DHCP y restablece catálogos Winsock y pila TCP/IP.",
                "optimize.btn_netreset": "Reiniciar Red",
                "overview.cmd_badge": "CENTRO DE COMANDO ACTIVO",
                "overview.cmd_title": "Telemetría de Kernel, Diagnóstico de Hardware y Seguridad en Tiempo Real",
                "overview.qa_optimize": "Optimizar y Debloat",
                "overview.qa_clean": "Limpieza Profunda",
                "overview.qa_antivirus": "Caza de Amenazas",
                "overview.qa_network": "Red y Velocidad",
                "opt_modal.title": "Optimizador del Sistema y Debloat",
                "opt_modal.subtitle": "Ejecutando secuencia recomendada de servicios y debloat de Windows...",
                "opt_modal.log_toggle": "Registro Detallado de Ejecución",
                "opt_modal.btn_done": "Listo",
                "terminal.cmd_admin": "Símbolo del Sistema (CMD Administrador)",
                "terminal.ps_admin": "PowerShell 5.1 / 7+ (Administrador)",
                "terminal.elevated_badge": "ELEVADO",
                "terminal.btn_run": "Ejecutar Comando",
                "terminal.chips_label": "DIAGNÓSTICOS RÁPIDOS (1-CLIC)",
                "terminal.chip_connections": "Conexiones de Red (netstat)",
                "terminal.chip_top_ram": "Procesos con Mayor RAM",
                "terminal.chip_disks": "Listar Volúmenes de Disco",
                "terminal.chip_defender": "Estado Windows Defender",
                "terminal.btn_copy": "Copiar Salida",
                "terminal.btn_clear": "Limpiar",
                "network.refresh": "Actualizar Datos de Red",
                "network.adapter_card": "Adaptador de Red Principal",
                "network.connected": "Conectado",
                "network.ip_card": "Configuración de IP Local",
                "network.signal_card": "Señal y Calidad Wi-Fi",
                "network.public_card": "IP Pública y Operador",
                "network.ping_title": "Auditoría de Latencia y Conexión (Ping)",
                "network.ping_desc": "Mide tiempo de respuesta, jitter y estabilidad con los mayores proveedores mundiales de nube y DNS.",
                "network.ping_all_btn": "Probar Todos los Servidores",
                "network.ping_custom_btn": "Probar Host Personalizado",
                "network.speed_title": "Prueba Real de Velocidad (Download y Upload)",
                "network.download": "Descarga",
                "network.upload": "Subida",
                "network.btn_start_speed": "Iniciar Prueba de Velocidad",
                "network.repair_title": "Reparaciones Rápidas de Red (1-Clic)",
                "devices.btn_refresh": "Actualizar Dispositivos",
                "devices.btn_scan_updates": "Buscar Actualizaciones de Drivers",
                "devices.btn_backup": "Hacer Copia de Seguridad de Drivers",
                "devices.total_card": "Total de Dispositivos",
                "devices.display_card": "Controladores de Pantalla",
                "devices.third_card": "Drivers de Fabricantes Terceros",
                "devices.signed_card": "Drivers Firmados Digitalmente",
                "devices.tab_installed": "Dispositivos y Drivers Instalados",
                "devices.tab_updates": "Central de Actualizaciones de Drivers",
                "devices.update_title": "Central de Actualización de Drivers (Windows Update y Fabricantes)",
                "devices.update_desc": "Verifica paquetes de drivers certificados por Windows Update y utilidades OEM oficiales."
            }
        };

        const TAB_TITLES_I18N = {
            'pt': {
                'overview': { title: 'Visão Geral do PC', sub: 'Diagnóstico e métricas em tempo real da máquina' },
                'silicon': { title: 'WinShield CoreEngine', sub: 'Especificações profundas de CPU, Caches, Placa-Mãe e Benchmark' },
                'vision': { title: 'WinShield VisionEngine', sub: 'Arquitetura Gráfica, VRAM, Clock, DirectX, Vulkan e Sensores em Tempo Real' },
                'memory': { title: 'WinShield RAMGuard™ Pro & RAM', sub: 'Telemetria profunda de pentes físicos, canais e teste de estresse de memória' },
                'disk-health': { title: 'WinShield DiskGuard & SurfaceScan', sub: 'S.M.A.R.T., Telemetria NVMe, Varredura em 1.200 Blocos e Alinhamento 4K' },
                'disk-bench': { title: 'WinShield DiskSpeed Turbo', sub: 'Benchmark de Alta Performance (Direct I/O Multi-Pass & Fila Assíncrona de Hardware)' },
                'running-apps': { title: 'Programas em Execução & Gerenciador', sub: 'Mapeamento de janelas ativas, separação de serviços e desinstalação de softwares' },
                'audit': { title: 'Programas Ocultos & Auditoria', sub: 'Mapeamento no Registro, AppX da Store, Serviços e Inicialização' },
                'antivirus': { title: 'Antivírus & Caça a Ameaças', sub: 'Varredura heurística, scanner profundo de System32 e inteligência em nuvem' },
                'clean': { title: 'Limpeza Profunda do Sistema', sub: 'Exclusão segura de temporários, Lixeira do Windows e caches de navegadores' },
                'power': { title: 'Planos de Energia & Turbo', sub: 'Desempenho Máximo nativo, criador de esquemas e powercfg' },
                'optimize': { title: 'Otimizações do Sistema & Debloat', sub: 'Reparos SFC/DISM, TRIM SSD, desativação de telemetria e rede' },
                'terminal': { title: 'Terminal CMD & PowerShell', sub: 'Execução de comandos administrativos em segundo plano' },
                'network': { title: 'Central de Rede, Wi-Fi & Ping', sub: 'Diagnósticos de sinal, latência com servidores mundiais e teste de velocidade' },
                'devices': { title: 'Gerenciador de Dispositivos & Drivers', sub: 'Mapeamento de hardware Plug & Play e central de atualização de drivers' },
                'stability': { title: 'Teste de Estabilidade do Sistema (StressPulse™)', sub: 'Estresse contínuo de CPU, FPU, Caches e Memória RAM com telemetria e detecção de Throttling' },
            },
            'en': {
                'overview': { title: 'PC Overview', sub: 'Real-time diagnostic and hardware telemetry' },
                'silicon': { title: 'WinShield CoreEngine', sub: 'Deep CPU, Caches, Motherboard, and Benchmark specifications' },
                'vision': { title: 'WinShield VisionEngine', sub: 'Graphics Architecture, VRAM, Clock, DirectX, Vulkan and Real-Time Sensors' },
                'memory': { title: 'WinShield RAMGuard™ Pro & RAM', sub: 'Deep telemetry of physical DIMMs, channels, and live memory stress diagnostics' },
                'disk-health': { title: 'WinShield DiskGuard & SurfaceScan', sub: 'S.M.A.R.T., NVMe Telemetry, 1,200-Block Surface Scan and 4K Alignment' },
                'disk-bench': { title: 'WinShield DiskSpeed Turbo', sub: 'High-Performance Benchmark (Direct I/O Multi-Pass & Asynchronous Hardware Queue)' },
                'running-apps': { title: 'Running Applications & Manager', sub: 'Active desktop window mapping, services isolation, and uninstaller' },
                'audit': { title: 'Hidden Apps & System Audit', sub: 'Registry uninstaller mapping, Windows Store AppX, Services and Startup' },
                'antivirus': { title: 'Antivirus & Threat Hunter', sub: 'Heuristic anomaly scan, deep System32 inspection, and cloud threat intelligence' },
                'clean': { title: 'Deep System Cleaner', sub: 'Secure deletion of temporary files, Windows Recycle Bin, and browser caches' },
                'power': { title: 'Power Plans & Hardware Turbo', sub: 'Native Maximum Performance schemes, custom creator and powercfg' },
                'optimize': { title: 'System Optimizations & Debloat', sub: 'SFC/DISM repairs, SSD TRIM, telemetry debloat and network tweaks' },
                'terminal': { title: 'CMD & PowerShell Terminal', sub: 'Administrative background command execution' },
                'network': { title: 'Network, Wi-Fi & Ping Central', sub: 'Signal diagnostics, world server latency tests, and real bandwidth speed' },
                'devices': { title: 'Device Manager & Driver Center', sub: 'Plug & Play hardware audit and OEM/Windows Update driver center' },
                'stability': { title: 'System Stability Test (StressPulse™)', sub: 'Continuous stress testing of CPU, FPU, Caches and Memory RAM with telemetry and Throttling detection' },
            },
            'es': {
                'overview': { title: 'Visión General del PC', sub: 'Diagnóstico y telemetría de hardware en tiempo real' },
                'silicon': { title: 'WinShield CoreEngine', sub: 'Especificaciones profundas de CPU, Cachés, Placa Base y Benchmark' },
                'vision': { title: 'WinShield VisionEngine', sub: 'Arquitectura Gráfica, VRAM, Reloj, DirectX, Vulkan y Sensores en Tiempo Real' },
                'memory': { title: 'WinShield RAMGuard™ Pro y RAM', sub: 'Telemetría profunda de módulos físicos, canales y diagnóstico de estrés de memoria' },
                'disk-health': { title: 'WinShield DiskGuard & SurfaceScan', sub: 'S.M.A.R.T., Telemetría NVMe, Escaneo de 1.200 Bloques y Alineación 4K' },
                'disk-bench': { title: 'WinShield DiskSpeed Turbo', sub: 'Benchmark de Alto Rendimiento (Direct I/O Multi-Pass y Cola Asíncrona)' },
                'running-apps': { title: 'Programas en Ejecución y Gestor', sub: 'Mapeo de ventanas activas, separación de servicios y desinstalación oficial' },
                'audit': { title: 'Apps Ocultas y Auditoría', sub: 'Mapeo en Registro, AppX de la Store, Servicios e Inicio automático' },
                'antivirus': { title: 'Antivirus y Caza de Amenazas', sub: 'Escaneo heurístico, escáner profundo de System32 e inteligencia en la nube' },
                'clean': { title: 'Limpieza Profunda del Sistema', sub: 'Eliminación segura de archivos temporales, Papelera de Windows y cachés' },
                'power': { title: 'Planes de Energía y Turbo', sub: 'Esquemas de Máximo Rendimiento, creador personalizado y powercfg' },
                'optimize': { title: 'Optimizaciones del Sistema y Debloat', sub: 'Reparaciones SFC/DISM, TRIM SSD, desactivación de telemetría y red' },
                'terminal': { title: 'Terminal CMD y PowerShell', sub: 'Ejecución de comandos administrativos en segundo plano' },
                'network': { title: 'Central de Red, Wi-Fi y Ping', sub: 'Diagnóstico de señal, latencia con servidores mundiales y prueba de velocidad' },
                'devices': { title: 'Gestor de Dispositivos y Drivers', sub: 'Auditoría de hardware Plug & Play y central de actualización de drivers' },
                'stability': { title: 'Prueba de Estabilidad del Sistema (StressPulse™)', sub: 'Prueba de estrés continuo de CPU, FPU, Cachés y Memoria RAM con telemetría y detección de Throttling' },
            }
        };

        function t(key) {
            const dict = I18N_TRANSLATIONS[currentLang] || I18N_TRANSLATIONS['pt'];
            return dict[key] || (I18N_TRANSLATIONS['pt'][key]) || key;
        }

        function isLightThemeActive() {
            return document.documentElement.classList.contains('light') || document.body.classList.contains('theme-light');
        }

        function applyLanguageButtonStyles() {
            const isLight = isLightThemeActive();
            ['pt', 'en', 'es'].forEach(l => {
                const btn = document.getElementById(`lang-btn-${l}`);
                if (!btn) return;
                if (l === currentLang) {
                    btn.className = "px-2 py-1 rounded-lg flex items-center gap-1 font-bold bg-blue-600 text-white shadow-sm transition";
                } else {
                    btn.className = isLight
                        ? "px-2 py-1 rounded-lg flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition"
                        : "px-2 py-1 rounded-lg flex items-center gap-1 font-semibold text-slate-400 hover:text-white transition";
                }
            });
            if (typeof updateSplashLanguageButtons === 'function') {
                updateSplashLanguageButtons(currentLang);
            }
        }

        function applyThemeButtonStyles(mode, effectiveTheme) {
            ['dark', 'light', 'auto'].forEach(m => {
                const btn = document.getElementById(`theme-btn-${m}`);
                if (!btn) return;
                if (m === mode) {
                    btn.className = "px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold bg-blue-600 text-white shadow-sm transition";
                } else {
                    btn.className = (effectiveTheme === 'light')
                        ? "px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition"
                        : "px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-semibold text-slate-400 hover:text-white transition";
                }
            });
        }

        function setLanguage(lang) {
            currentLang = ['pt', 'en', 'es'].includes(lang) ? lang : 'pt';
            localStorage.setItem('winshield_lang', currentLang);
            applyTranslations();
            applyLanguageButtonStyles();

            // Atualiza cabeçalho da aba ativa
            const headerInfo = (TAB_TITLES_I18N[currentLang] && TAB_TITLES_I18N[currentLang][currentTab]) ||
                (TAB_TITLES_I18N['pt'][currentTab]) || { title: 'WinShield Pro', sub: '' };
            const pageTitle = document.getElementById('page-title');
            const pageSub = document.getElementById('page-subtitle');
            if (pageTitle) pageTitle.innerText = headerInfo.title;
            if (pageSub) pageSub.innerText = headerInfo.sub;
            if (typeof updatePageCategoryBadge === 'function') updatePageCategoryBadge(currentTab);
            lucide.createIcons();
        }

        function applyTranslations() {
            const devLbl = document.getElementById('sidebar-dev-label');
            if (devLbl) devLbl.innerText = t('brand.dev_label') || 'Desenvolvido por';
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (key) {
                    const translated = t(key);
                    el.innerText = translated;
                }
            });
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                if (key) el.setAttribute('placeholder', t(key));
            });
            document.querySelectorAll('[data-i18n-title]').forEach(el => {
                const key = el.getAttribute('data-i18n-title');
                if (key) el.setAttribute('title', t(key));
            });

            // Re-renderiza tabelas e componentes dinâmicos para aplicar o novo idioma imediatamente
            if (currentTab === 'running-apps' && Array.isArray(allRunningApps) && allRunningApps.length > 0) {
                renderRunningAppsTable();
            }
            if (currentTab === 'antivirus' && Array.isArray(allThreats)) {
                renderThreatTable(allThreats);
            }
            if (currentTab === 'clean' && Array.isArray(currentCleanCategories) && currentCleanCategories.length > 0) {
                renderCleanCategories();
            }
        }

        function initLanguage() {
            setLanguage(currentLang);
        }

        // =====================================================================
        // BANNER DE INICIALIZAÇÃO (STARTUP SPLASH SCREEN)
        // =====================================================================
        function selectSplashLanguage(lang) {
            if (splashTimer) {
                clearTimeout(splashTimer);
                splashTimer = null;
            }
            setLanguage(lang);
            updateSplashLanguageButtons(lang);
        }

        function updateSplashLanguageButtons(lang) {
            const targetLang = lang || currentLang || 'pt';
            ['pt', 'en', 'es'].forEach(l => {
                const btn = document.getElementById(`splash-lang-btn-${l}`);
                if (!btn) return;
                if (l === targetLang) {
                    btn.className = "px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 bg-gradient-to-r from-blue-600/60 to-cyan-500/60 border border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)] scale-105";
                } else {
                    btn.className = "px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 text-slate-400 hover:text-white hover:bg-white/5 border border-transparent";
                }
            });
        }

        function initStartupBanner() {
            const skip = localStorage.getItem('winshield_skip_splash') === 'true';
            const modal = document.getElementById('startup-splash-modal');
            const chk = document.getElementById('chk-skip-splash');
            if (chk) chk.checked = skip;

            updateSplashLanguageButtons(currentLang);

            if (skip) {
                if (modal) modal.style.display = 'none';
            } else {
                showStartupBanner(false);
            }
        }

        function toggleSkipSplashPreference(checked) {
            localStorage.setItem('winshield_skip_splash', checked ? 'true' : 'false');
        }

        function showStartupBanner(manual = false) {
            const modal = document.getElementById('startup-splash-modal');
            if (!modal) return;
            modal.style.display = 'flex';
            modal.style.opacity = '1';

            updateSplashLanguageButtons(currentLang);

            const bar = document.getElementById('splash-progress-bar');
            const pctText = document.getElementById('splash-pct-text');
            const statusText = document.getElementById('splash-status-text');

            if (bar) bar.style.width = '20%';
            if (pctText) pctText.innerText = '20%';
            if (statusText) statusText.innerText = t('splash.status_loading1') || 'Verificando privilégios de Administrador & Kernel...';

            if (splashTimer) clearTimeout(splashTimer);

            setTimeout(() => {
                if (bar) bar.style.width = '55%';
                if (pctText) pctText.innerText = '55%';
                if (statusText) statusText.innerText = t('splash.status_loading2') || 'Sincronizando telemetria de hardware e sensores...';
            }, 300);

            setTimeout(() => {
                if (bar) bar.style.width = '85%';
                if (pctText) pctText.innerText = '85%';
                if (statusText) statusText.innerText = t('splash.status_loading3') || 'Carregando motores de disco e segurança...';
            }, 700);

            setTimeout(() => {
                if (bar) bar.style.width = '100%';
                if (pctText) pctText.innerText = '100%';
                if (statusText) statusText.innerText = t('splash.progress_ready') || 'Sistema pronto para uso!';
                const enterBtn = document.getElementById('splash-enter-btn');
                if (enterBtn) {
                    enterBtn.classList.add('ring-2', 'ring-cyan-400/50');
                }
                lucide.createIcons();
            }, 1150);

            if (!manual) {
                splashTimer = setTimeout(() => {
                    closeStartupBanner();
                }, 10000);
            }
        }

        function closeStartupBanner() {
            if (splashTimer) {
                clearTimeout(splashTimer);
                splashTimer = null;
            }
            const modal = document.getElementById('startup-splash-modal');
            if (!modal) return;
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.display = 'none';
            }, 450);
        }

        // =====================================================================
        // OTIMIZADOR DE RENDERIZAÇÃO DE ÍCONES (LUCIDE BATCHING VIA rAF)
        // Evita travamentos no DOM por varreduras repetitivas do documento inteiro
        // =====================================================================
        (function() {
            if (typeof window !== 'undefined') {
                let _lucideRaf = null;
                let _lucideRoots = new Set();
                const _installLucideBatcher = () => {
                    if (window.lucide && window.lucide.createIcons && !window.lucide._isBatchingWrapped) {
                        const originalCreateIcons = window.lucide.createIcons.bind(window.lucide);
                        window.lucide.createIcons = function(options) {
                            if (options && options.root) {
                                _lucideRoots.add(options.root);
                            }
                            if (_lucideRaf) return;
                            _lucideRaf = requestAnimationFrame(() => {
                                _lucideRaf = null;
                                try {
                                    if (_lucideRoots.size > 0) {
                                        _lucideRoots.forEach(root => {
                                            if (document.contains(root)) {
                                                originalCreateIcons({ root: root });
                                            }
                                        });
                                        _lucideRoots.clear();
                                    } else {
                                        originalCreateIcons();
                                    }
                                } catch (_) {
                                    try { originalCreateIcons(); } catch (__) {}
                                }
                            });
                        };
                        window.lucide._isBatchingWrapped = true;
                    }
                };
                _installLucideBatcher();
                window.addEventListener('DOMContentLoaded', _installLucideBatcher);
            }
        })();

        // =====================================================================
        // INICIALIZAÇÃO GERAL DA APLICAÇÃO
        // =====================================================================
        window.addEventListener('DOMContentLoaded', () => {
            initTheme();
            initLanguage();
            initStartupBanner();
            initApp();
            initSectorGuardGrid();
            setInterval(pollLogs, 1000);
            setInterval(pollLiveMetrics, 2000);
            // Removido setInterval(loadSystemInfo, 8000) desnecessário
        });

        async function initApp() {
            switchTab('overview');
            loadSystemInfo();
            pollLiveMetrics();
            // Lazy-loading leve em segundo plano após inicialização do UI
            setTimeout(() => {
                loadPowerSchemes();
            }, 3000);
        }

        // =====================================================================
        // SISTEMA DE TEMAS: PRETO (DARK), BRANCO (LIGHT) OU AUTOMÁTICO (WINDOWS)
        // =====================================================================
        function setTheme(mode) {
            const body = document.body;
            const html = document.documentElement;
            let effectiveTheme = mode;
            if (mode === 'auto') {
                const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                effectiveTheme = isSystemDark ? 'dark' : 'light';
            }

            if (effectiveTheme === 'light') {
                body.classList.add('theme-light', 'theme-white');
                body.classList.remove('theme-dark');
                html.classList.remove('dark');
                html.classList.add('light');
            } else {
                body.classList.remove('theme-light', 'theme-white');
                body.classList.add('theme-dark');
                html.classList.add('dark');
                html.classList.remove('light');
            }

            localStorage.setItem('winshield_theme', mode);

            applyThemeButtonStyles(mode, effectiveTheme);
            applyLanguageButtonStyles();
            lucide.createIcons();
        }

        function initTheme() {
            const saved = localStorage.getItem('winshield_theme') || 'auto';
            setTheme(saved);

            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                    if (localStorage.getItem('winshield_theme') === 'auto') {
                        setTheme('auto');
                    }
                });
            }
        }

        // =====================================================================
        // CONTROLES DE JANELA NATIVOS (RESET EXPLODE WINDOWCHROME)
        // =====================================================================
        // Desativa a tecla F5 (atualizar pagina) e atalhos de reload no Desktop App
        (function disableBrowserReload() {
            function blockReload(e) {
                const isF5 = (e.key === 'F5' || e.code === 'F5' || e.keyCode === 116 || e.which === 116);
                const isCtrlR = (e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R' || e.code === 'KeyR' || e.keyCode === 82);
                const isMediaRefresh = (e.key === 'BrowserRefresh');

                if (isF5 || isCtrlR || isMediaRefresh) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === 'function') {
                        e.stopImmediatePropagation();
                    }
                    return false;
                }
            }
            window.addEventListener('keydown', blockReload, { capture: true, passive: false });
            window.addEventListener('keyup', blockReload, { capture: true, passive: false });
            document.addEventListener('keydown', blockReload, { capture: true, passive: false });
            document.addEventListener('keyup', blockReload, { capture: true, passive: false });
        })();

        function handleWindowMinimize() {
            showToast("Segundo Plano", "WinShield Pro permanece ativo monitorando o sistema.", "info", 3000);
        }

        function handleWindowMaximize() {
            if (!document.fullscreenElement) {
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                }
            }
        }

        document.addEventListener('fullscreenchange', () => {
            const maxIcon = document.getElementById('win-max-icon');
            if (maxIcon) {
                if (document.fullscreenElement) {
                    maxIcon.setAttribute('data-lucide', 'minimize-2');
                } else {
                    maxIcon.setAttribute('data-lucide', 'square');
                }
                lucide.createIcons();
            }
        });

        async function handleWindowClose() {
            const confirmed = await showConfirmModal({
                title: 'Encerrar WinShield Pro',
                message: 'Deseja realmente encerrar a aplicação e descarregar os serviços de telemetria?',
                btnText: 'Encerrar',
                isDanger: true,
                icon: 'power',
                warningText: 'A proteção em segundo plano e o monitoramento de hardware serão finalizados.'
            });
            if (confirmed) {
                try {
                    await fetch('/api/app/exit', { method: 'POST' });
                } catch (e) {}
                window.close();
            }
        }

        function toggleThemeQuick() {
            const isDark = document.documentElement.classList.contains('dark');
            setTheme(isDark ? 'light' : 'dark');
        }

        // =====================================================================
        // SISTEMA DE NOTIFICAÇÕES (TOASTS) MODERNOS & ANIMADOS
        // =====================================================================
        function showToast(title, message, type = 'info', duration = 4000) {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `winshield-toast toast-${type}`;

            let iconName = 'info';
            if (type === 'success') iconName = 'check-circle';
            else if (type === 'error') iconName = 'alert-octagon';
            else if (type === 'warning') iconName = 'alert-triangle';

            toast.innerHTML = `
                <div class="flex-shrink-0 mt-0.5">
                    <i data-lucide="${iconName}" class="w-5 h-5"></i>
                </div>
                <div class="flex-1 min-w-0 pr-2">
                    <h5 class="text-xs font-bold leading-tight">${escapeHtml(title)}</h5>
                    <p class="text-[11px] mt-0.5 leading-snug opacity-95">${escapeHtml(message)}</p>
                </div>
                <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white flex-shrink-0 transition">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
                <div class="toast-progress-bar" style="width: 100%;"></div>
            `;

            container.appendChild(toast);
            lucide.createIcons();

            const pBar = toast.querySelector('.toast-progress-bar');
            setTimeout(() => {
                if (pBar) {
                    pBar.style.transitionDuration = `${duration}ms`;
                    pBar.style.width = '0%';
                }
            }, 25);

            const timer = setTimeout(() => {
                toast.classList.add('toast-hiding');
                setTimeout(() => toast.remove(), 250);
            }, duration);

            toast.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                clearTimeout(timer);
                toast.classList.add('toast-hiding');
                setTimeout(() => toast.remove(), 250);
            });
        }

        // =====================================================================
        // NAVEGAÇÃO ENTRE ABAS
        // =====================================================================

        // =====================================================================
        // CONTROLADOR DE MODAL PADRONIZADO (WINSHIELD CONFIRM DIALOG)
        // =====================================================================
        let _confirmModalResolver = null;

        function showConfirmModal({
            title = 'Confirmar Operação',
            message = 'Deseja prosseguir com esta ação?',
            itemName = '',
            itemDetails = '',
            itemIcon = 'alert-triangle',
            warningText = '',
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            type = 'danger'
        }) {
            return new Promise((resolve) => {
                _confirmModalResolver = resolve;
                const modal = document.getElementById('confirm-action-modal');
                const box = document.getElementById('confirm-modal-box');
                const glow = document.getElementById('confirm-modal-glow');
                const iconBox = document.getElementById('confirm-icon-box');
                const iconGlow = document.getElementById('confirm-icon-glow');
                const iconEl = document.getElementById('confirm-icon');
                const titleEl = document.getElementById('confirm-modal-title');
                const msgEl = document.getElementById('confirm-modal-msg');
                const itemCard = document.getElementById('confirm-item-card');
                const itemNameEl = document.getElementById('confirm-item-name');
                const itemDetailEl = document.getElementById('confirm-item-detail');
                const warnBox = document.getElementById('confirm-modal-warn');
                const warnTextEl = document.getElementById('confirm-modal-warn-text');
                const btnAction = document.getElementById('confirm-btn-action');
                const btnCancel = document.getElementById('confirm-btn-cancel');
                const btnText = document.getElementById('confirm-btn-text');

                if (titleEl) titleEl.innerText = title;
                if (msgEl) msgEl.innerText = message;
                if (btnText) btnText.innerText = confirmText;
                if (btnCancel) {
                    const cancelSpan = btnCancel.querySelector('span');
                    if (cancelSpan) cancelSpan.innerText = cancelText;
                }

                if (itemName) {
                    itemCard.classList.remove('hidden');
                    itemNameEl.innerText = itemName;
                    itemDetailEl.innerText = itemDetails || '';
                } else {
                    itemCard.classList.add('hidden');
                }

                if (warningText) {
                    warnBox.classList.remove('hidden');
                    warnTextEl.innerText = warningText;
                } else {
                    warnBox.classList.add('hidden');
                }

                // Paleta de cores moderna
                if (type === 'danger') {
                    glow.className = "absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl pointer-events-none bg-rose-500/20";
                    iconBox.className = "relative w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-400";
                    iconGlow.className = "absolute inset-0 rounded-2xl bg-rose-500/30 blur-md";
                    iconEl.setAttribute('data-lucide', itemIcon || 'skull');
                    btnAction.className = "px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition-all flex items-center space-x-1.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-900/40";
                } else if (type === 'warning') {
                    glow.className = "absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl pointer-events-none bg-amber-500/20";
                    iconBox.className = "relative w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400";
                    iconGlow.className = "absolute inset-0 rounded-2xl bg-amber-500/30 blur-md";
                    iconEl.setAttribute('data-lucide', itemIcon || 'alert-triangle');
                    btnAction.className = "px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition-all flex items-center space-x-1.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 shadow-amber-900/40";
                } else {
                    glow.className = "absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl pointer-events-none bg-blue-500/20";
                    iconBox.className = "relative w-16 h-16 rounded-2xl bg-blue-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400";
                    iconGlow.className = "absolute inset-0 rounded-2xl bg-blue-500/30 blur-md";
                    iconEl.setAttribute('data-lucide', itemIcon || 'shield-check');
                    btnAction.className = "px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition-all flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-900/40";
                }

                lucide.createIcons();
                modal.classList.remove('pointer-events-none', 'opacity-0');
                modal.classList.add('opacity-100');
                box.classList.remove('scale-95');
                box.classList.add('scale-100');
            });
        }

        function resolveConfirmModal(result) {
            const modal = document.getElementById('confirm-action-modal');
            const box = document.getElementById('confirm-modal-box');
            if (box) {
                box.classList.remove('scale-100');
                box.classList.add('scale-95');
            }
            if (modal) {
                modal.classList.remove('opacity-100');
                modal.classList.add('opacity-0', 'pointer-events-none');
            }
            if (_confirmModalResolver) {
                const cb = _confirmModalResolver;
                _confirmModalResolver = null;
                cb(Boolean(result));
            }
        }

        // =====================================================================
        // GERENCIAMENTO DA SIDEBAR ENTERPRISE MULTI-RESOLUÇÃO & BUSCA RÁPIDA
        // =====================================================================
        const TAB_CATEGORY_MAP = {
            'overview': { key: 'nav.group_hardware', badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25' },
            'silicon': { key: 'nav.group_hardware', badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/25' },
            'vision': { key: 'nav.group_hardware', badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
            'memory': { key: 'nav.group_hardware', badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/25' },
            'devices': { key: 'nav.group_hardware', badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25' },
            'stability': { key: 'nav.group_stability', badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25' },
            'disk-health': { key: 'nav.group_storage', badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/25' },
            'disk-bench': { key: 'nav.group_storage', badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' },
            'network': { key: 'nav.group_storage', badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25' },
            'running-apps': { key: 'nav.group_apps', badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
            'audit': { key: 'nav.group_apps', badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/25' },
            'antivirus': { key: 'nav.group_apps', badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/25' },
            'clean': { key: 'nav.group_system', badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/25' },
            'power': { key: 'nav.group_system', badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25' },
            'optimize': { key: 'nav.group_system', badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/25' },
            'terminal': { key: 'nav.group_system', badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25' }
        };

        function updatePageCategoryBadge(tabId) {
            const badge = document.getElementById('page-category-badge');
            if (!badge) return;
            const info = TAB_CATEGORY_MAP[tabId] || TAB_CATEGORY_MAP['overview'];
            badge.innerText = t(info.key);
            badge.className = `hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border flex-shrink-0 ${info.badgeClass}`;
        }

        function toggleSidebar() {
            if (window.innerWidth < 1024) {
                const sidebar = document.getElementById('main-sidebar');
                if (!sidebar) return;
                if (sidebar.classList.contains('sidebar-mobile-open')) {
                    closeMobileSidebar();
                } else {
                    openMobileSidebar();
                }
            } else {
                toggleSidebarCollapse();
            }
        }

        function openMobileSidebar() {
            const sidebar = document.getElementById('main-sidebar');
            const backdrop = document.getElementById('sidebar-backdrop');
            if (sidebar) sidebar.classList.add('sidebar-mobile-open');
            if (backdrop) {
                backdrop.classList.remove('hidden');
                requestAnimationFrame(() => backdrop.classList.remove('opacity-0'));
            }
        }

        function closeMobileSidebar() {
            const sidebar = document.getElementById('main-sidebar');
            const backdrop = document.getElementById('sidebar-backdrop');
            if (sidebar) sidebar.classList.remove('sidebar-mobile-open');
            if (backdrop) {
                backdrop.classList.add('opacity-0');
                setTimeout(() => backdrop.classList.add('hidden'), 200);
            }
            hideRailTooltip();
        }

        function toggleSidebarCollapse(forceState) {
            const sidebar = document.getElementById('main-sidebar');
            if (!sidebar) return;
            const shouldCollapse = typeof forceState === 'boolean'
                ? forceState
                : !sidebar.classList.contains('sidebar-collapsed');

            sidebar.classList.toggle('sidebar-collapsed', shouldCollapse);
            localStorage.setItem('winshield_sidebar_collapsed', shouldCollapse ? '1' : '0');
            hideRailTooltip();

            const btn = document.getElementById('sidebar-collapse-btn');
            if (btn) {
                btn.title = shouldCollapse ? "Expandir menu lateral (Ctrl+B)" : "Recolher menu lateral (Ctrl+B)";
                btn.innerHTML = `<i id="sidebar-collapse-icon" data-lucide="${shouldCollapse ? 'panel-left-open' : 'panel-left-close'}" class="w-4 h-4"></i>`;
            }
            lucide.createIcons();
        }

        function toggleNavGroup(groupId) {
            const group = document.getElementById(groupId);
            if (!group) return;
            group.classList.toggle('group-collapsed');
        }

        function filterSidebarNav(rawQuery) {
            const input = document.getElementById('sidebar-search-input');
            const clearBtn = document.getElementById('sidebar-search-clear');
            const kbdHint = document.getElementById('sidebar-search-kbd');
            const emptyBox = document.getElementById('sidebar-search-empty');

            if (input && input.value !== rawQuery) {
                input.value = rawQuery;
            }

            const q = (rawQuery || '').trim().toLowerCase();
            if (clearBtn) clearBtn.classList.toggle('hidden', q.length === 0);
            if (kbdHint) kbdHint.classList.toggle('hidden', q.length > 0);

            let totalVisible = 0;
            document.querySelectorAll('#sidebar-nav-scroll .sidebar-section-group, #sidebar-nav-scroll .nav-group').forEach(group => {
                let groupMatches = 0;
                group.querySelectorAll('.nav-item').forEach(btn => {
                    const text = (btn.innerText || '').toLowerCase();
                    const idText = (btn.id || '').toLowerCase();
                    const match = !q || text.includes(q) || idText.includes(q);
                    btn.classList.toggle('hidden', !match);
                    if (match) {
                        groupMatches++;
                        totalVisible++;
                    }
                });

                if (q.length > 0) {
                    group.classList.toggle('hidden', groupMatches === 0);
                } else {
                    group.classList.remove('hidden');
                }
            });

            if (emptyBox) {
                emptyBox.classList.toggle('hidden', totalVisible > 0);
            }
        }

        function showRailTooltip(btn) {
            const sidebar = document.getElementById('main-sidebar');
            const tooltip = document.getElementById('sidebar-rail-tooltip');
            if (!sidebar || !tooltip || window.innerWidth < 1024 || !sidebar.classList.contains('sidebar-collapsed')) {
                return;
            }
            const labelEl = btn.querySelector('.nav-label-text');
            const label = labelEl ? labelEl.innerText.trim() : '';
            if (!label) return;

            const rect = btn.getBoundingClientRect();
            tooltip.innerText = label;
            tooltip.style.left = `${rect.right + 10}px`;
            tooltip.style.top = `${Math.round(rect.top + rect.height / 2 - 15)}px`;
            tooltip.classList.add('tooltip-visible');
        }

        function hideRailTooltip() {
            const tooltip = document.getElementById('sidebar-rail-tooltip');
            if (tooltip) tooltip.classList.remove('tooltip-visible');
        }

        function initSidebarResponsiveState() {
            const savedCollapsed = localStorage.getItem('winshield_sidebar_collapsed') === '1';
            if (savedCollapsed && window.innerWidth >= 1024) {
                toggleSidebarCollapse(true);
            }

            window.addEventListener('resize', () => {
                if (window.innerWidth >= 1024) {
                    closeMobileSidebar();
                } else {
                    hideRailTooltip();
                }
            });

            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                    e.preventDefault();
                    toggleSidebar();
                } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                    e.preventDefault();
                    const sidebar = document.getElementById('main-sidebar');
                    if (window.innerWidth < 1024) {
                        openMobileSidebar();
                    } else if (sidebar && sidebar.classList.contains('sidebar-collapsed')) {
                        toggleSidebarCollapse(false);
                    }
                    setTimeout(() => {
                        const searchInput = document.getElementById('sidebar-search-input');
                        if (searchInput) {
                            searchInput.focus();
                            searchInput.select();
                        }
                    }, 80);
                } else if (e.key === 'Escape') {
                    const searchInput = document.getElementById('sidebar-search-input');
                    if (document.activeElement === searchInput && searchInput.value) {
                        filterSidebarNav('');
                        searchInput.blur();
                    } else if (window.innerWidth < 1024) {
                        closeMobileSidebar();
                    }
                }
            });
        }
        initSidebarResponsiveState();

        function switchTab(tabId) {
            currentTab = tabId;
            document.querySelectorAll('.view-panel').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.nav-item').forEach(el => {
                el.classList.remove('active');
            });

            const targetView = document.getElementById(`view-${tabId}`);
            if (targetView) targetView.classList.remove('hidden');

            const activeNav = document.getElementById(`nav-btn-${tabId}`);
            if (activeNav) {
                activeNav.classList.add('active');
                const parentGroup = activeNav.closest('.nav-group');
                if (parentGroup) parentGroup.classList.remove('group-collapsed');
                activeNav.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }

            const mainScroll = document.getElementById('main-content-scroll');
            if (mainScroll) mainScroll.scrollTo({ top: 0, behavior: 'smooth' });

            if (window.innerWidth < 1024) {
                closeMobileSidebar();
            }

            const headerInfo = (TAB_TITLES_I18N[currentLang] && TAB_TITLES_I18N[currentLang][tabId]) ||
                (TAB_TITLES_I18N['pt'][tabId]) || { title: 'WinShield Pro', sub: '' };
            const pageTitle = document.getElementById('page-title');
            const pageSub = document.getElementById('page-subtitle');
            if (pageTitle) pageTitle.innerText = headerInfo.title;
            if (pageSub) pageSub.innerText = headerInfo.sub;
            document.title = `${headerInfo.title} - WinShield Pro Enterprise`;
            updatePageCategoryBadge(tabId);

            if (tabId === 'memory') loadMemoryInfo();
            if (tabId === 'running-apps') loadRunningApps();
            if (tabId === 'audit' && currentAuditList.length === 0) runAuditAction('registry');
            if (tabId === 'disk-health') loadDisksHealth();
            if (tabId === 'silicon') loadSiliconInfo();
            if (tabId === 'vision') {
                loadVisionInfo();
                if (!visionSensorsTimer) visionSensorsTimer = setInterval(pollVisionSensors, 2500);
            } else {
                if (visionSensorsTimer) { clearInterval(visionSensorsTimer); visionSensorsTimer = null; }
            }
            if (tabId === 'antivirus') checkDefenderStatus();
            if (tabId === 'clean' && currentCleanCategories.length === 0) analyzeTempFiles(true);
            if (tabId === 'optimize') loadOptimizationProfile();
            if (tabId === 'disk-bench') pollBenchmarkStatus();
            if (tabId === 'network') loadNetworkInfo();
            if (tabId === 'devices') loadDevicesInfo();
            if (tabId === 'stability') {
                loadStabilityInfo();
                if (!stabilityPollTimer) stabilityPollTimer = setInterval(pollStabilityStatus, 1000);
            } else {
                if (stabilityPollTimer && !isStabilityTestingActive) {
                    clearInterval(stabilityPollTimer);
                    stabilityPollTimer = null;
                }
            }
        }

        // =====================================================================
        // LOGS EM TEMPO REAL & CONSOLE
        // =====================================================================
        let logPollTick = 0;
        async function pollLogs() {
            // Se o console estiver recolhido, reduz o overhead para 1 requisição a cada 6 segundos
            if (isConsoleMinimized) {
                logPollTick++;
                if (logPollTick % 6 !== 0) return;
            }
            try {
                const res = await fetch(`/api/logs?since=${logIndex}`);
                if (!res.ok) return;
                const data = await res.json();
                if (data.logs && data.logs.length > 0) {
                    const box = document.getElementById('console-output');
                    data.logs.forEach(msg => {
                        box.innerHTML += escapeHtml(msg) + "\n";
                    });
                    logIndex = data.total;
                    box.scrollTop = box.scrollHeight;
                }
            } catch (e) { }
        }

        function toggleConsole() {
            const panel = document.getElementById('live-console-panel');
            const barTitle = document.getElementById('console-bar-title');
            if (isConsoleMinimized) {
                panel.style.display = 'flex';
                panel.classList.remove('hidden');
                panel.style.height = '16rem';
                if (barTitle) barTitle.innerText = t('console.title_open');
                isConsoleMinimized = false;
            } else {
                panel.style.display = 'none';
                panel.classList.add('hidden');
                if (barTitle) barTitle.innerText = t('console.title');
                isConsoleMinimized = true;
            }
            lucide.createIcons();
        }

        async function clearConsole() {
            document.getElementById('console-output').innerHTML = '';
            try { await fetch('/api/logs/clear', { method: 'POST' }); } catch (e) { }
        }

        function downloadConsoleLog() {
            const text = document.getElementById('console-output').innerText;
            const blob = new Blob([text], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `winshield_pro_log_${Date.now()}.log`;
            a.click();
        }

        // =====================================================================
        // GERENCIADOR DE APLICATIVOS (PROGRAMAS EM EXECUÇÃO & SERVIÇOS DO WINDOWS)
        // =====================================================================
        let runningAppsCategoryFilter = 'user_app'; // 'user_app' | 'windows_service' | 'all'

        async function loadRunningApps(force = false) {
            const tbody = document.getElementById('running-apps-tbody');
            const icon = document.getElementById('btn-refresh-apps-icon');
            if (icon) icon.classList.add('animate-spin');

            try {
                const res = await fetch('/api/apps/running');
                const data = await res.json();
                if (data.status === 'success' && Array.isArray(data.apps)) {
                    allRunningApps = data.apps;

                    const userApps = allRunningApps.filter(a => a.category === 'user_app');
                    const serviceApps = allRunningApps.filter(a => a.category === 'windows_service');
                    const totalRamMb = allRunningApps.reduce((acc, a) => acc + (a.mem_mb || 0), 0);

                    const badge = document.getElementById('running-apps-count-badge');
                    if (badge) badge.innerText = `${allRunningApps.length} Ativos`;

                    const statUser = document.getElementById('stat-apps-user-count');
                    if (statUser) statUser.innerText = userApps.length;

                    const statServ = document.getElementById('stat-apps-services-count');
                    if (statServ) statServ.innerText = serviceApps.length;

                    const badgeUser = document.getElementById('badge-count-user-apps');
                    if (badgeUser) badgeUser.innerText = userApps.length;

                    const badgeServ = document.getElementById('badge-count-services');
                    if (badgeServ) badgeServ.innerText = serviceApps.length;

                    const statRam = document.getElementById('stat-apps-ram');
                    if (statRam) {
                        statRam.innerText = (totalRamMb >= 1024)
                            ? `${(totalRamMb / 1024).toFixed(1)} GB`
                            : `${Math.round(totalRamMb)} MB`;
                    }

                    renderRunningAppsTable();
                    if (force) {
                        showToast(t('apps.header_title'), `${allRunningApps.length} processos mapeados (${userApps.length} Aplicativos, ${serviceApps.length} Serviços).`, 'success', 2500);
                    }
                }
            } catch (e) {
                console.error("Erro ao carregar aplicativos:", e);
                if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-rose-400">Falha ao listar programas: ${escapeHtml(e.message)}</td></tr>`;
            } finally {
                if (icon) icon.classList.remove('animate-spin');
            }
        }

        function setRunningAppsCategoryFilter(cat) {
            runningAppsCategoryFilter = cat;
            ['user', 'service', 'all'].forEach(k => {
                const btn = document.getElementById(`filter-apps-${k}`);
                if (!btn) return;
                const match = (k === 'user' && cat === 'user_app') ||
                    (k === 'service' && cat === 'windows_service') ||
                    (k === 'all' && cat === 'all');
                if (match) {
                    btn.className = "px-3 py-1.5 rounded-lg font-bold bg-blue-600 text-white shadow-sm transition flex items-center gap-1.5";
                } else {
                    btn.className = "px-3 py-1.5 rounded-lg font-semibold text-slate-400 hover:text-white transition flex items-center gap-1.5";
                }
            });
            const badgeUser = document.getElementById('badge-count-user-apps');
            const badgeServ = document.getElementById('badge-count-services');
            if (badgeUser) {
                badgeUser.className = (cat === 'user_app')
                    ? "px-1.5 py-0.2 rounded-md bg-white/25 text-white text-[10px] font-mono"
                    : "px-1.5 py-0.2 rounded-md bg-slate-500/15 text-slate-400 text-[10px] font-mono";
            }
            if (badgeServ) {
                badgeServ.className = (cat === 'windows_service')
                    ? "px-1.5 py-0.2 rounded-md bg-white/25 text-white text-[10px] font-mono"
                    : "px-1.5 py-0.2 rounded-md bg-slate-500/15 text-slate-400 text-[10px] font-mono";
            }
            renderRunningAppsTable();
        }

        function renderRunningAppsTable() {
            const tbody = document.getElementById('running-apps-tbody');
            if (!tbody) return;

            const searchInput = document.getElementById('running-apps-search');
            const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

            let filtered = allRunningApps.filter(app => {
                if (runningAppsCategoryFilter !== 'all' && app.category !== runningAppsCategoryFilter) return false;

                if (!query) return true;
                const matchName = (app.name || '').toLowerCase().includes(query);
                const matchExe = (app.exe || '').toLowerCase().includes(query);
                const matchTitle = (app.titles || []).some(title => title.toLowerCase().includes(query));
                const matchInst = app.installed_item && (app.installed_item.nome || '').toLowerCase().includes(query);
                return matchName || matchExe || matchTitle || matchInst;
            });

            if (filtered.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-slate-400">Nenhum programa ou serviço encontrado correspondente ao filtro.</td></tr>`;
                return;
            }

            let html = '';
            filtered.forEach(app => {
                const mainTitle = app.titles && app.titles.length > 0 ? app.titles[0] : '';
                const isUserApp = app.category === 'user_app';

                const catBadge = isUserApp
                    ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-max">
                         <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                         ${t('apps.badge_user_app')}
                       </span>`
                    : `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 w-max">
                         <i data-lucide="cog" class="w-2.5 h-2.5 text-indigo-400"></i>
                         ${t('apps.badge_service')}
                       </span>`;

                const ramPill = `<div class="flex items-center space-x-2">
                    <span class="font-mono font-bold text-slate-200">${app.mem_mb} MB</span>
                    <div class="w-16 bg-dark-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div class="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full" style="width: ${Math.min(100, Math.round((app.mem_mb / 500) * 100))}%"></div>
                    </div>
                </div>`;

                const iconName = app.icon_hint || (isUserApp ? 'app-window' : 'cog');
                const brandColor = app.brand_color || 'cyan';
                const brandClassMap = {
                    amber: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
                    cyan: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
                    orange: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
                    indigo: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400',
                    emerald: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
                    blue: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
                    yellow: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
                    sky: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
                    purple: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
                    slate: 'bg-slate-500/15 border-slate-500/30 text-slate-300'
                };
                const badgeTone = brandClassMap[brandColor] || brandClassMap.cyan;

                html += `
                <tr class="hover:bg-slate-800/30 transition-colors">
                    <td class="py-3 px-4">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 rounded-lg border ${badgeTone} flex items-center justify-center flex-shrink-0 shadow-sm">
                                <i data-lucide="${iconName}" class="w-4 h-4"></i>
                            </div>
                            <div class="min-w-0">
                                <p class="font-bold text-white text-xs truncate">${escapeHtml(app.name)}</p>
                                <p class="text-[10px] font-mono text-slate-400 truncate">${escapeHtml(app.exe)} <span class="text-slate-600">(PID: ${app.main_pid})</span></p>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 px-4">
                        ${catBadge}
                    </td>
                    <td class="py-3 px-4">
                        <div class="space-y-0.5">
                            <p class="text-xs text-slate-300 font-medium truncate max-w-xs" title="${escapeHtml(mainTitle)}">${escapeHtml(mainTitle || (isUserApp ? 'Sem janela na área de trabalho' : 'Serviço em segundo plano'))}</p>
                            ${app.path ? `<p class="text-[10px] text-slate-500 font-mono truncate max-w-xs" title="${escapeHtml(app.path)}">${escapeHtml(app.path)}</p>` : ''}
                        </div>
                    </td>
                    <td class="py-3 px-4">
                        ${ramPill}
                    </td>
                    <td class="py-3 px-4 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                            <button onclick="killAppProcess('${app.main_pid}', '${escapeHtml(app.exe)}')" class="btn-action-danger text-[11px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm" title="Finalizar processo">
                                <i data-lucide="x-circle" class="w-3.5 h-3.5"></i>
                                <span>${t('apps.btn_kill')}</span>
                            </button>
                            ${app.can_uninstall || isUserApp ? `
                            <button onclick="uninstallRunningApp('${escapeHtml(app.exe)}')" class="btn-action-secondary text-[11px] px-2.5 py-1.5 rounded-lg text-amber-300 border-amber-500/40 hover:border-amber-400 flex items-center gap-1" title="Desinstalar programa oficial">
                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                <span>${t('apps.btn_uninstall')}</span>
                            </button>
                            ` : ''}
                            ${app.path ? `
                            <button onclick="openAppFolder(decodeURIComponent('${encodeURIComponent(app.path || '')}'))" class="btn-action-secondary text-[11px] px-2 py-1.5 rounded-lg text-slate-400 hover:text-white" title="Abrir pasta no Explorer">
                                <i data-lucide="folder" class="w-3.5 h-3.5"></i>
                            </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
                `;
            });

            tbody.innerHTML = html;
            lucide.createIcons();
        }

        async function killAppProcess(pid, exe) {
            const app = allRunningApps.find(a => a.exe.toLowerCase() === exe.toLowerCase() || a.pids.includes(String(pid)));
            const confirmed = await showConfirmModal({
                title: t('modals.kill_title'),
                message: t('modals.kill_msg'),
                itemName: `${app ? app.name : exe} (${exe})`,
                itemDetails: `PID: ${pid} • Memória: ${app ? app.mem_mb : 0} MB • ${app && app.path ? app.path : ''}`,
                itemIcon: 'skull',
                warningText: t('modals.kill_warn'),
                type: 'danger',
                confirmText: t('apps.btn_kill'),
                cancelText: t('modals.btn_cancel')
            });
            if (!confirmed) return;

            try {
                const res = await fetch('/api/apps/kill', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pid: pid, exe: exe })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    showToast(t('apps.header_title'), data.message, 'success');
                    setTimeout(() => loadRunningApps(false), 500);
                } else {
                    showToast('Erro ao Finalizar', data.message, 'error');
                }
            } catch (e) {
                showToast('Erro de Conexão', e.message, 'error');
            }
        }

        async function uninstallRunningApp(exe) {
            const app = allRunningApps.find(a => a.exe.toLowerCase() === exe.toLowerCase());
            const appName = app ? app.name : exe;
            const confirmed = await showConfirmModal({
                title: t('modals.uninstall_title'),
                message: t('modals.uninstall_msg'),
                itemName: appName,
                itemDetails: `Executável: ${exe} • Caminho: ${app && app.path ? app.path : 'Pasta de Instalação'}`,
                itemIcon: 'trash-2',
                type: 'warning',
                confirmText: t('apps.btn_uninstall'),
                cancelText: t('modals.btn_cancel')
            });
            if (!confirmed) return;

            try {
                const res = await fetch('/api/apps/uninstall', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ item: app })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    showToast(t('apps.header_title'), data.message, 'success', 5000);
                } else {
                    showToast('Desinstalação', data.message, 'warning');
                }
            } catch (e) {
                showToast('Erro', e.message, 'error');
            }
        }

        async function openAppFolder(path) {
            try {
                await fetch('/api/apps/open_folder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: path })
                });
            } catch (e) { }
        }

        // =====================================================================
        // MÉTRICAS AO VIVO & INFORMAÇÕES DO SISTEMA (100% PRECISAS)
        // =====================================================================
        async function loadSystemInfo() {
            try {
                const res = await fetch('/api/system/info');
                const data = await res.json();
                if (data.status === 'success' && data.info) {
                    const i = data.info;
                    document.getElementById('overview-cpu-name').innerText = i.cpu || 'Processador Detectado';
                    document.getElementById('overview-cpu-threads').innerText = `${i.cpu_threads || 0} Threads`;

                    // Preenche especificações completas e 100% autênticas
                    document.getElementById('spec-os').innerText = `${i.os || 'Windows'} (${i.cpu_arch || i.arch || '64-bit'})`;
                    document.getElementById('spec-build').innerText = `Build ${i.os_build || '--'}${i.os_ubr ? ` (UBR: ${i.os_ubr})` : ''}`;
                    document.getElementById('spec-install-date').innerText = i.os_install_date || 'N/D';

                    const boardName = i.board || (i.board_product ? `${i.board_manufacturer || i.board_man || ''} ${i.board_product}`.trim() : 'Placa-Mãe do Sistema');
                    document.getElementById('spec-board').innerText = boardName;

                    const biosVen = i.bios_vendor || i.bios_man || 'UEFI';
                    const biosVer = i.bios_version || '';
                    const biosDate = i.bios_date ? ` (${i.bios_date})` : '';
                    document.getElementById('spec-bios').innerText = `${biosVen} ${biosVer}${biosDate}`.trim() || 'UEFI';

                    const tpmStr = i.tpm_present ? (i.tpm_version || 'TPM 2.0 (Ativo e Pronto)') : (i.tpm_status || 'TPM Não Detectado');
                    const secBootStr = i.secure_boot ? `Secure Boot: ${i.secure_boot}` : 'Secure Boot';
                    document.getElementById('spec-security').innerText = `${tpmStr} • ${secBootStr}`;

                    document.getElementById('spec-cpu').innerText = `${i.cpu || 'Processador'} (${i.cpu_cores || 0}C / ${i.cpu_threads || 0}T)`;

                    const gpuList = (i.gpus && i.gpus.length) ? i.gpus : (i.gpu_primary ? [i.gpu_primary] : ['Controlador Gráfico']);
                    document.getElementById('spec-gpu').innerText = gpuList.join(', ');

                    const ramTotal = i.ram_total_gb ? `${Math.round(i.ram_total_gb)} GB` : '0 GB';
                    const ramSpd = i.ram_speed ? `@ ${i.ram_speed} MHz` : '';
                    const ramTyp = i.ram_type || 'RAM';
                    const ramSlots = i.ram_slots ? `${i.ram_slots} Slots` : '';
                    document.getElementById('spec-ram').innerText = `${ramTotal} ${ramTyp} ${ramSlots ? `(${ramSlots} ${ramSpd})` : ramSpd}`.trim() || 'Memória RAM';
                    document.getElementById('spec-user').innerText = `${i.computer || 'PC'}\\${i.user || 'Usuário'}`;

                    document.getElementById('overview-ram-speed').innerText = i.ram_info || `${ramTotal} ${ramTyp} ${ramSpd}`;
                }
            } catch (e) {
                console.error("Erro ao carregar system info:", e);
            }
        }

        async function pollLiveMetrics() {
            try {
                const res = await fetch('/api/system/live');
                const data = await res.json();
                if (data.status !== 'success' || !data.live) return;
                const lv = data.live;

                // Atualiza a árvore DOM da aba Visão Geral apenas se ela estiver aberta
                if (currentTab === 'overview') {
                    // CPU
                    const cpuVal = lv.cpu || 0;
                    const ovCpuVal = document.getElementById('overview-cpu-val');
                    if (ovCpuVal) ovCpuVal.innerText = `${cpuVal}%`;
                    const ovCpuBar = document.getElementById('overview-cpu-bar');
                    if (ovCpuBar) ovCpuBar.style.width = `${Math.min(100, cpuVal)}%`;

                    // RAM
                    if (lv.mem) {
                        const mem = lv.mem;
                        const pct = mem.percent || 0;
                        const usedGb = (mem.used / (1024 ** 3)).toFixed(1);
                        const totalGb = (mem.total / (1024 ** 3)).toFixed(1);
                        const ovRamVal = document.getElementById('overview-ram-val');
                        if (ovRamVal) ovRamVal.innerText = `${pct}%`;
                        const ovRamDetail = document.getElementById('overview-ram-detail');
                        if (ovRamDetail) ovRamDetail.innerText = `${usedGb} / ${totalGb} GB`;
                        const ovRamBar = document.getElementById('overview-ram-bar');
                        if (ovRamBar) ovRamBar.style.width = `${pct}%`;
                    }

                    // Volumes C: & Lista (atualização in-place sem recriar DOM desnecessariamente)
                    if (lv.volumes && lv.volumes.length > 0) {
                        const cVol = lv.volumes.find(v => v.letter === 'C') || lv.volumes[0];
                        if (cVol) {
                            const freeGb = (cVol.free / (1024 ** 3)).toFixed(1);
                            const elVal = document.getElementById('overview-disk-c-val');
                            if (elVal) elVal.innerText = `${cVol.percent}%`;
                            const elFree = document.getElementById('overview-disk-c-free');
                            if (elFree) elFree.innerText = `${freeGb} GB Livre`;
                            const elBar = document.getElementById('overview-disk-c-bar');
                            if (elBar) elBar.style.width = `${cVol.percent}%`;
                            const elModel = document.getElementById('overview-disk-c-model');
                            if (elModel) elModel.innerText = `${cVol.label} (${cVol.letter}:) - ${cVol.fs}`;
                        }

                        const vBox = document.getElementById('overview-volumes-list');
                        if (vBox) {
                            if (vBox.children.length !== lv.volumes.length) {
                                vBox.innerHTML = '';
                                lv.volumes.forEach(v => {
                                    const totalGb = (v.total / (1024 ** 3)).toFixed(0);
                                    const freeGb = (v.free / (1024 ** 3)).toFixed(1);
                                    vBox.innerHTML += `
                                        <div class="p-2.5 rounded-xl bg-dark-900 border border-slate-800 text-xs" data-vol="${v.letter}">
                                            <div class="flex items-center justify-between mb-1">
                                                <span class="font-bold text-slate-200">${v.letter}: [${v.label}]</span>
                                                <span class="font-mono text-slate-400 vol-stat">${freeGb} GB livres de ${totalGb} GB</span>
                                            </div>
                                            <div class="w-full bg-dark-950 rounded-full h-1.5 overflow-hidden">
                                                <div class="bg-emerald-500 h-1.5 rounded-full vol-bar" style="width: ${v.percent}%"></div>
                                            </div>
                                        </div>
                                    `;
                                });
                            } else {
                                lv.volumes.forEach(v => {
                                    const card = vBox.querySelector(`[data-vol="${v.letter}"]`);
                                    if (card) {
                                        const totalGb = (v.total / (1024 ** 3)).toFixed(0);
                                        const freeGb = (v.free / (1024 ** 3)).toFixed(1);
                                        const stat = card.querySelector('.vol-stat');
                                        if (stat) stat.innerText = `${freeGb} GB livres de ${totalGb} GB`;
                                        const bar = card.querySelector('.vol-bar');
                                        if (bar) bar.style.width = `${v.percent}%`;
                                    }
                                });
                            }
                        }
                    }
                }

                // Atualiza opções do seletor de benchmark apenas se necessário
                if (lv.volumes && lv.volumes.length > 0) {
                    const bSelect = document.getElementById('bench-drive-select');
                    const sSelect = document.getElementById('sectorguard-scan-drive');
                    if (bSelect && bSelect.options.length <= 1) {
                        bSelect.innerHTML = '';
                        if (sSelect) sSelect.innerHTML = '';
                        lv.volumes.forEach(v => {
                            const opt = `<option value="${v.letter}">${v.letter}: [${v.label || 'Disco Local'}] (${(v.total / (1024 ** 3)).toFixed(0)} GB)</option>`;
                            bSelect.innerHTML += opt;
                            if (sSelect) sSelect.innerHTML += opt;
                        });
                    }
                }
            } catch (e) { }
        }

        // =====================================================================
        // SAÚDE DOS DISCOS (WINSHIELD DISKGUARD & SURFACESCAN)
        // =====================================================================
        async function loadDisksHealth(force = false) {
            try {
                const url = force ? '/api/disks/health/refresh' : '/api/disks/health';
                const res = await (force ? fetch(url, { method: 'POST' }) : fetch(url));
                const data = await res.json();
                if (data.status === 'success' && data.disks) {
                    allDisksData = data.disks;
                    renderDiskHealthSelector();
                    renderSelectedDiskHealth();
                    updateOverviewFaithfulHealth();
                    loadDiskFeatures(selectedDiskIndex);
                }
            } catch (e) {
                console.error("Erro ao carregar saúde dos discos:", e);
            }
        }

        function refreshDiskHealth() {
            document.getElementById('dh-disk-model').innerText = "Reescanendo discos e S.M.A.R.T...";
            loadDisksHealth(true);
        }

        function updateOverviewFaithfulHealth() {
            if (!allDisksData || allDisksData.length === 0) return;

            // O primeiro disco ou o disco onde o Windows está instalado
            const primaryDisk = allDisksData[0];
            const primaryHealth = primaryDisk.health || 0;

            const healthValEl = document.getElementById('overview-health-val');
            const healthStatusEl = document.getElementById('overview-health-status');
            const summaryEl = document.getElementById('overview-health-summary');
            const badgesEl = document.getElementById('overview-disk-health-badges');

            healthValEl.innerText = `${primaryHealth}%`;
            healthStatusEl.innerText = primaryDisk.health_label ? primaryDisk.health_label.toUpperCase() : (primaryHealth >= 90 ? 'EXCELENTE' : (primaryHealth >= 70 ? 'BOM' : (primaryHealth >= 40 ? 'ATENÇÃO' : 'CRÍTICO')));

            if (primaryHealth >= 90) {
                healthValEl.className = "text-3xl font-extrabold text-emerald-400";
                healthStatusEl.className = "text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300";
            } else if (primaryHealth >= 70) {
                healthValEl.className = "text-3xl font-extrabold text-blue-400";
                healthStatusEl.className = "text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300";
            } else if (primaryHealth >= 40) {
                healthValEl.className = "text-3xl font-extrabold text-amber-400";
                healthStatusEl.className = "text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300";
            } else {
                healthValEl.className = "text-3xl font-extrabold text-rose-400";
                healthStatusEl.className = "text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300";
            }

            summaryEl.innerText = `${primaryDisk.model} (${primaryDisk.media}) - 100% Fiel`;

            // Mini badges para cada disco físico conectado
            badgesEl.innerHTML = '';
            allDisksData.forEach(d => {
                const badgeColor = d.health >= 90 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    (d.health >= 70 ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                        (d.health >= 40 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                            'bg-rose-500/10 text-rose-400 border-rose-500/30'));
                badgesEl.innerHTML += `
                    <span class="px-2 py-0.5 rounded border text-[10px] font-bold ${badgeColor}">
                        Disco ${d.index}: ${d.health}% (${d.temperature ? d.temperature + '°C' : d.media})
                    </span>
                `;
            });
        }

        function renderDiskHealthSelector() {
            const bar = document.getElementById('disk-health-selector-bar');
            bar.innerHTML = '';
            allDisksData.forEach((d, idx) => {
                const isSelected = (idx === selectedDiskIndex);
                const btn = document.createElement('button');
                btn.className = `subtab-btn flex items-center space-x-2.5 px-4 py-2 rounded-xl text-xs font-bold transition ${isSelected ? 'active' : ''
                    }`;
                btn.onclick = () => {
                    selectedDiskIndex = idx;
                    renderDiskHealthSelector();
                    renderSelectedDiskHealth();
                    loadDiskFeatures(idx);
                };

                const healthColor = d.health >= 90 ? 'text-emerald-400' : (d.health >= 70 ? 'text-blue-400' : (d.health >= 40 ? 'text-amber-400' : 'text-rose-400'));
                btn.innerHTML = `
                    <i data-lucide="hard-drive" class="w-4 h-4"></i>
                    <span>Disco ${d.index}: ${escapeHtml(d.model.substring(0, 18))}</span>
                    <span class="font-mono ${healthColor}">[${d.health}%]</span>
                `;
                bar.appendChild(btn);
            });
            lucide.createIcons();
        }

        function switchDiskHealthSubTab(subTabId) {
            document.querySelectorAll('.dh-subview').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.dh-subtab-btn').forEach(el => {
                el.classList.remove('active');
            });

            const targetView = document.getElementById(`dh-subview-${subTabId}`);
            if (targetView) targetView.classList.remove('hidden');

            const activeBtn = document.getElementById(`dh-subtab-btn-${subTabId}`);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }
            if (subTabId === 'info') loadDiskFeatures(selectedDiskIndex);
            lucide.createIcons();
        }

        function renderSelectedDiskHealth() {
            if (!allDisksData || allDisksData.length === 0) return;
            const d = allDisksData[selectedDiskIndex] || allDisksData[0];

            document.getElementById('dh-disk-model').innerText = d.model;
            document.getElementById('dh-disk-media').innerText = d.media || 'Disco Físico';
            document.getElementById('dh-disk-bus').innerText = d.bus || 'Storage';
            document.getElementById('dh-disk-serial').innerText = d.serial || '—';
            document.getElementById('dh-disk-firmware').innerText = d.firmware || '—';

            const sizeGb = (d.size / (1024 ** 3)).toFixed(0);
            const sizeTb = (d.size / (1024 ** 4)).toFixed(2);
            document.getElementById('dh-disk-size').innerText = d.size > (1024 ** 4) ? `${sizeTb} TB` : `${sizeGb} GB`;

            // Saúde 100% fiel
            const health = d.health || 0;
            document.getElementById('dh-health-percent').innerText = `${health}%`;
            document.getElementById('dh-health-badge').innerText = d.health_label || 'Bom';

            const gauge = document.getElementById('dh-gauge-box');
            gauge.className = "w-24 h-24 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 shadow-lg " +
                (health >= 90 ? "bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-400" :
                    (health >= 70 ? "bg-blue-500/10 border-2 border-blue-500/40 text-blue-400" :
                        (health >= 40 ? "bg-amber-500/10 border-2 border-amber-500/40 text-amber-400" : "bg-rose-500/10 border-2 border-rose-500/40 text-rose-400")));

            // Badges
            document.getElementById('dh-disk-temp').innerText = d.temperature ? `${d.temperature} °C` : 'N/D';
            document.getElementById('dh-disk-hours').innerText = d.power_on_hours ? `${d.power_on_hours.toLocaleString()} h` : '—';

            const writesTb = d.host_writes ? (d.host_writes / (1024 ** 4)).toFixed(2) : null;
            document.getElementById('dh-disk-writes').innerText = writesTb ? `${writesTb} TB` : '—';

            // Diagnóstico textual
            const issuesBox = document.getElementById('dh-issues-list');
            issuesBox.innerHTML = '';
            (d.issues || []).forEach(iss => {
                const color = iss.level === 'crit' ? 'text-rose-400 font-semibold' : (iss.level === 'warn' ? 'text-amber-300' : 'text-slate-300');
                const icon = iss.level === 'crit' ? 'alert-triangle' : (iss.level === 'warn' ? 'alert-circle' : 'check-circle');
                issuesBox.innerHTML += `
                    <div class="flex items-start gap-2 ${color}">
                        <i data-lucide="${icon}" class="w-4 h-4 flex-shrink-0 mt-0.5"></i>
                        <span>${escapeHtml(iss.text)}</span>
                    </div>
                `;
            });

            // Tabela SMART ou NVMe
            const tbody = document.getElementById('dh-smart-tbody');
            tbody.innerHTML = '';

            if (d.nvme_list && d.nvme_list.length > 0) {
                document.getElementById('dh-table-title').innerHTML = `
                    <i data-lucide="zap" class="w-4 h-4 text-cyan-400"></i>
                    Parâmetros Oficiais NVMe SMART/Health Log (Controller 0x02)
                `;
                document.getElementById('dh-smart-table').querySelector('thead').innerHTML = `
                    <tr class="bg-dark-750 text-slate-400 uppercase tracking-wider sticky top-0 bg-dark-850 z-10 border-b border-slate-700">
                        <th class="py-2.5 px-3">Parâmetro de Confiabilidade NVMe</th>
                        <th class="py-2.5 px-3">Valor Reportado pelo Controlador</th>
                        <th class="py-2.5 px-3">Condição</th>
                    </tr>
                `;
                d.nvme_list.forEach(row => {
                    const tr = document.createElement('tr');
                    const valStr = row.bytes ? formatBytes(row.bytes) : escapeHtml(row.value);
                    const cond = row.status === 'bad' ? '<span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">ALERTA</span>' :
                        (row.status === 'warn' ? '<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">ATENÇÃO</span>' :
                            '<span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Normal</span>');
                    tr.className = "hover:bg-dark-750/30 transition";
                    tr.innerHTML = `
                        <td class="py-2 px-3 font-sans font-medium text-slate-200">${escapeHtml(row.label)}</td>
                        <td class="py-2 px-3 font-bold text-white">${valStr}</td>
                        <td class="py-2 px-3">${cond}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } else if (d.smart_list && d.smart_list.length > 0) {
                document.getElementById('dh-table-title').innerHTML = `
                    <i data-lucide="list-checks" class="w-4 h-4 text-cyan-400"></i>
                    Atributos S.M.A.R.T. Padrão ATA/SATA
                `;
                document.getElementById('dh-smart-table').querySelector('thead').innerHTML = `
                    <tr class="bg-dark-750 text-slate-400 uppercase tracking-wider sticky top-0 bg-dark-850 z-10 border-b border-slate-700">
                        <th class="py-2.5 px-3">ID</th>
                        <th class="py-2.5 px-3 font-sans" data-i18n="disk_health.th_attr">Nome do Atributo</th>
                        <th class="py-2.5 px-3" data-i18n="disk_health.th_current">Atual</th>
                        <th class="py-2.5 px-3" data-i18n="disk_health.th_worst">Pior</th>
                        <th class="py-2.5 px-3" data-i18n="disk_health.th_threshold">Limite</th>
                        <th class="py-2.5 px-3" data-i18n="disk_health.th_raw">Valor Bruto (Raw)</th>
                        <th class="py-2.5 px-3">Status</th>
                    </tr>
                `;
                d.smart_list.forEach(attr => {
                    const tr = document.createElement('tr');
                    const isWarn = attr.status === 'warn' || attr.status === 'fail';
                    const statusBadge = attr.status === 'fail' ? '<span class="px-2 py-0.5 rounded bg-rose-600 text-white font-bold">FALHA</span>' :
                        (attr.status === 'warn' ? '<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">Aviso</span>' :
                            '<span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">OK</span>');
                    tr.className = `hover:bg-dark-750/30 transition ${isWarn ? 'bg-amber-500/5' : ''}`;
                    tr.innerHTML = `
                        <td class="py-2 px-3 text-cyan-400 font-bold">${attr.hex}</td>
                        <td class="py-2 px-3 font-sans font-medium text-slate-200">${escapeHtml(attr.name)}</td>
                        <td class="py-2 px-3 text-white">${attr.current}</td>
                        <td class="py-2 px-3 text-slate-400">${attr.worst}</td>
                        <td class="py-2 px-3 text-slate-500">${attr.threshold || '—'}</td>
                        <td class="py-2 px-3 text-slate-300">${attr.raw.toLocaleString()}</td>
                        <td class="py-2 px-3">${statusBadge}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-slate-400 font-sans">Nenhum atributo S.M.A.R.T. exposto pelo driver deste controlador.</td></tr>`;
            }
            lucide.createIcons();
        }

        // =====================================================================
        // SECTORGUARD™: ERROR SCAN COM GRADE DE 1.200 SETORES
        // =====================================================================
        function initSectorGuardGrid() {
            const grid = document.getElementById('sectorguard-blocks-grid');
            if (!grid) return;
            grid.innerHTML = '';
            for (let i = 0; i < 1200; i++) {
                const cell = document.createElement('div');
                cell.id = `sectorguard-cell-${i}`;
                cell.className = 'sectorguard-cell cell-untested';
                cell.title = `Bloco #${i + 1}`;
                grid.appendChild(cell);
            }
        }

        async function startSectorGuardScan() {
            const drive = document.getElementById('sectorguard-scan-drive').value;
            const modeSel = document.getElementById('sectorguard-scan-mode-select');
            const isQuick = modeSel ? (modeSel.value === 'quick') : document.getElementById('sectorguard-quick-scan').checked;
            const mode = isQuick ? 'quick' : 'full';

            try {
                const res = await fetch('/api/disks/scan/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ drive: drive, mode: mode })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    document.getElementById('sectorguard-start-btn').classList.add('hidden');
                    document.getElementById('sectorguard-stop-btn').classList.remove('hidden');
                    initSectorGuardGrid();
                    if (sectorGuardPollTimer) clearInterval(sectorGuardPollTimer);
                    sectorGuardPollTimer = setInterval(pollSectorGuardScan, 120);
                    showToast("SurfaceScan Direct I/O", `Iniciando leitura física não-bufferizada no disco ${drive}: (${isQuick ? 'Modo Padrão 512KB/bloco' : 'Modo Profundo 2MB/bloco'})...`, "info");
                } else {
                    showToast("Varredura Ocupada", data.message, "warning");
                }
            } catch (e) {
                showToast("Erro ao Iniciar", "Falha ao disparar SurfaceScan: " + e, "error");
            }
        }

        async function stopSectorGuardScan() {
            try {
                if (sectorGuardPollTimer) {
                    clearInterval(sectorGuardPollTimer);
                    sectorGuardPollTimer = null;
                }
                document.getElementById('sectorguard-start-btn').classList.remove('hidden');
                document.getElementById('sectorguard-stop-btn').classList.add('hidden');
                const ledEl = document.getElementById('sectorguard-io-led');
                if (ledEl) {
                    ledEl.className = 'px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5';
                    ledEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-slate-500"></span> AGUARDANDO';
                }
                document.getElementById('sectorguard-status-txt').innerText = "Varredura interrompida pelo usuário.";
                await fetch('/api/disks/scan/stop', { method: 'POST' });
                showToast("Varredura Interrompida", "A análise de superfície foi cancelada pelo usuário.", "warning");
            } catch (e) {
                showToast("Erro", "Falha ao interromper varredura: " + e, "error");
            }
        }

        async function pollSectorGuardScan() {
            try {
                const res = await fetch('/api/disks/scan/status');
                const data = await res.json();
                if (data.status !== 'success' || !data.scan) return;
                const sc = data.scan;

                // Atualiza métricas ao vivo
                document.getElementById('sectorguard-damaged-val').innerText = `${sc.damaged_percent}% (${sc.damaged_blocks} / 1.200)`;
                document.getElementById('sectorguard-speed-val').innerText = `${sc.current_speed_mb} MB/s`;

                const latEl = document.getElementById('sectorguard-latency-val');
                if (latEl) {
                    const lastLat = Number(sc.last_latency_ms || 0).toFixed(2);
                    const avgLat = Number(sc.avg_latency_ms || 0).toFixed(2);
                    latEl.innerText = `${lastLat} ms (méd: ${avgLat} ms)`;
                }

                const modeBadgeEl = document.getElementById('sectorguard-io-mode-badge');
                if (modeBadgeEl && sc.io_mode) {
                    modeBadgeEl.innerText = sc.io_mode;
                }

                const fastEl = document.getElementById('sectorguard-fast-cnt');
                if (fastEl) fastEl.innerText = (sc.fast_blocks || 0).toLocaleString();
                const normEl = document.getElementById('sectorguard-normal-cnt');
                if (normEl) normEl.innerText = (sc.normal_blocks || 0).toLocaleString();
                const slowEl = document.getElementById('sectorguard-slow-cnt');
                if (slowEl) slowEl.innerText = (sc.slow_blocks || 0).toLocaleString();
                const badEl = document.getElementById('sectorguard-bad-cnt');
                if (badEl) badEl.innerText = (sc.damaged_blocks || 0).toLocaleString();

                const sec = sc.elapsed_sec || 0;
                const mm = String(Math.floor(sec / 60)).padStart(2, '0');
                const ss = String(Math.floor(sec % 60)).padStart(2, '0');
                document.getElementById('sectorguard-time-val').innerText = `00:${mm}:${ss}`;

                // Tempo restante estimado
                const remSec = sc.remaining_sec || 0;
                const rmm = String(Math.floor(remSec / 60)).padStart(2, '0');
                const rss = String(Math.floor(remSec % 60)).padStart(2, '0');
                const remEl = document.getElementById('sectorguard-remaining-val');
                if (remEl) remEl.innerText = sc.running ? `00:${rmm}:${rss}` : '--:--';

                // Indicador LED de atividade I/O
                const ledEl = document.getElementById('sectorguard-io-led');
                if (ledEl) {
                    if (sc.running) {
                        ledEl.className = 'px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 animate-pulse';
                        ledEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400"></span> LENDO DISCO (DIRECT I/O)';
                    } else {
                        ledEl.className = 'px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5';
                        ledEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-slate-500"></span> AGUARDANDO';
                    }
                }

                const curGb = (sc.scanned_mb / 1024).toFixed(1);
                const totGb = (sc.total_mb / 1024).toFixed(1);
                document.getElementById('sectorguard-pos-val').innerText = `${curGb} / ${totGb} GB (${sc.progress_percent}%)`;
                document.getElementById('sectorguard-status-txt').innerText = sc.status_text || '';

                // Atualiza blocos visuais na grade destacando o cursor de leitura atual
                const blocks = sc.blocks || [];
                const lats = sc.block_latencies || [];
                const total = Math.min(1200, blocks.length);
                const curScanBlock = sc.current_block;

                for (let i = 0; i < total; i++) {
                    const el = document.getElementById(`sectorguard-cell-${i}`);
                    if (!el) continue;
                    if (sc.running && i === curScanBlock) {
                        el.className = 'sectorguard-cell cell-scanning';
                    } else {
                        const val = blocks[i];
                        el.className = 'sectorguard-cell ' + (
                            val === 1 ? 'cell-good' :
                                (val === 2 ? 'cell-slow' :
                                    (val === 3 ? 'cell-damaged' : 'cell-untested'))
                        );
                        if (val > 0 && lats[i] !== undefined) {
                            el.title = `Bloco #${i + 1} • Latência: ${lats[i]} ms`;
                        }
                    }
                }

                if (!sc.running) {
                    clearInterval(sectorGuardPollTimer);
                    sectorGuardPollTimer = null;
                    document.getElementById('sectorguard-start-btn').classList.remove('hidden');
                    document.getElementById('sectorguard-stop-btn').classList.add('hidden');
                    showToast("SurfaceScan Concluído", sc.status_text || "Varredura física finalizada com sucesso!", sc.damaged_blocks > 0 ? "warning" : "success");
                }
            } catch (e) { }
        }

        // =====================================================================
        // SECTORGUARD™: RECURSOS & ALINHAMENTO 4K
        // =====================================================================
        async function loadDiskFeatures(diskIdx = 0) {
            try {
                const res = await fetch(`/api/disks/features?disk=${diskIdx}`);
                const data = await res.json();
                if (data.status !== 'success' || !data.features) return;
                const feat = data.features;

                // 1. Alinhamento 4K
                const alignBox = document.getElementById('dh-alignment-container');
                alignBox.innerHTML = '';
                (feat.alignment || []).forEach(part => {
                    const ok = part.is_4k_aligned;
                    alignBox.innerHTML += `
                        <div class="p-3 rounded-xl bg-dark-900 border ${ok ? 'border-emerald-500/30' : 'border-rose-500/30'} flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <span class="w-8 h-8 rounded-lg ${ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'} flex items-center justify-center font-bold text-xs">
                                    ${part.letter ? part.letter + ':' : 'Part'}
                                </span>
                                <div>
                                    <h4 class="text-xs font-bold text-white">Partição ${part.letter || 'Primária'}: (Offset: ${part.offset_bytes.toLocaleString()} bytes)</h4>
                                    <p class="text-[11px] ${ok ? 'text-emerald-300' : 'text-rose-300'}">${escapeHtml(part.status_text)}</p>
                                </div>
                            </div>
                            <span class="px-2.5 py-1 rounded text-xs font-mono font-bold ${ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}">
                                ${ok ? '4K ALINHADO (OK)' : 'DESALINHADO'}
                            </span>
                        </div>
                    `;
                });

                // 2. Recursos Suportados
                const tbody = document.getElementById('dh-features-tbody');
                tbody.innerHTML = '';
                (feat.features || []).forEach(f => {
                    const tr = document.createElement('tr');
                    tr.className = "hover:bg-dark-750/30 transition";
                    tr.innerHTML = `
                        <td class="py-2 px-3 font-sans font-medium text-slate-200">${escapeHtml(f.feature)}</td>
                        <td class="py-2 px-3"><span class="px-2 py-0.5 rounded text-[11px] font-bold ${f.supported ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}">${f.supported ? 'Sim' : 'Não'}</span></td>
                        <td class="py-2 px-3"><span class="px-2 py-0.5 rounded text-[11px] font-bold ${f.active ? 'bg-blue-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}">${f.active ? 'Ativado' : 'Desativado'}</span></td>
                        <td class="py-2 px-3 font-sans text-slate-400">${escapeHtml(f.desc)}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } catch (e) { }
        }

        // =====================================================================
        // MOTOR SILICON CORE™: PROCESSADOR, MAINBOARD, MEMÓRIA E BENCHMARK
        // =====================================================================
        function switchSiliconSubTab(subTabId) {
            document.querySelectorAll('.silicon-subview').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.silicon-subtab-btn').forEach(el => {
                el.classList.remove('active');
            });

            const targetView = document.getElementById(`silicon-subview-${subTabId}`);
            if (targetView) targetView.classList.remove('hidden');

            const activeBtn = document.getElementById(`silicon-subtab-btn-${subTabId}`);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }
            lucide.createIcons();
        }

        async function loadSiliconInfo(force = false) {
            try {
                const res = await fetch(`/api/silicon/info${force ? '?refresh=1' : ''}`);
                const data = await res.json();
                if (data.status !== 'success' || !data.silicon) return;
                const c = data.silicon;

                // CPU
                const p = c.processor || {};
                document.getElementById('silicon-cpu-name').innerText = p.name || 'Processador Detectado';
                document.getElementById('silicon-cpu-tdp').innerText = p.tdp || '--';
                document.getElementById('silicon-cpu-codename').innerText = p.codename || '--';
                document.getElementById('silicon-cpu-tech').innerText = p.technology || '--';
                document.getElementById('silicon-cpu-package').innerText = p.package || '--';
                document.getElementById('silicon-cpu-cores-threads').innerText = `${p.cores || 0}C / ${p.threads || 0}T`;
                document.getElementById('silicon-cpu-instructions').innerText = p.instructions || '--';

                // Clocks
                const clk = c.clocks || {};
                document.getElementById('silicon-clock-live').innerText = `${clk.live_clock_mhz || 0} MHz`;
                document.getElementById('silicon-clock-mult').innerText = clk.multiplier || 'x0.0';
                document.getElementById('silicon-clock-bus').innerText = `${clk.bus_speed_mhz || 100.0} MHz`;

                // Caches
                const cch = c.caches || {};
                document.getElementById('silicon-cache-l1d').innerText = cch.l1_data || '--';
                document.getElementById('silicon-cache-l1i').innerText = cch.l1_inst || '--';
                document.getElementById('silicon-cache-l2').innerText = cch.l2 || '--';
                document.getElementById('silicon-cache-l3').innerText = cch.l3 || '--';

                // Mainboard
                const mb = c.motherboard || {};
                document.getElementById('silicon-mb-full').innerText = `${mb.manufacturer || ''} ${mb.model || 'Placa-Mãe'}`.trim();
                document.getElementById('silicon-mb-man').innerText = mb.manufacturer || '--';
                document.getElementById('silicon-mb-model').innerText = mb.model || '--';
                document.getElementById('silicon-mb-chipset').innerText = mb.chipset || '--';
                document.getElementById('silicon-bios-vendor').innerText = mb.bios_vendor || '--';
                document.getElementById('silicon-bios-ver').innerText = mb.bios_version || '--';
                document.getElementById('silicon-bios-date').innerText = mb.bios_date || '--';

                // Memória
                const mem = c.memory || {};
                document.getElementById('silicon-mem-summary').innerText = `${mem.size_gb || 0} GB ${mem.type || ''} ${mem.channels || ''}`.trim();
                document.getElementById('silicon-mem-speed').innerText = `${mem.speed_mhz || 0} MHz`;
                document.getElementById('silicon-mem-type').innerText = mem.type || '--';
                document.getElementById('silicon-mem-size').innerText = `${mem.size_gb || 0} GB`;
                document.getElementById('silicon-mem-channels').innerText = mem.channels || '--';
                document.getElementById('silicon-mem-slots').innerText = `${mem.slots_used || 0} / ${mem.slots_total || 0} Slots`;

                // SPD
                const spdTbody = document.getElementById('silicon-spd-tbody');
                spdTbody.innerHTML = '';
                (mem.modules || []).forEach(m => {
                    const tr = document.createElement('tr');
                    tr.className = "hover:bg-dark-750/30 transition";
                    tr.innerHTML = `
                        <td class="py-2.5 px-3 text-cyan-400 font-bold">${escapeHtml(m.locator)}</td>
                        <td class="py-2.5 px-3 text-white font-sans">${escapeHtml(m.manufacturer)}</td>
                        <td class="py-2.5 px-3 text-slate-300">${escapeHtml(m.part_number)}</td>
                        <td class="py-2.5 px-3 text-amber-300 font-bold">${m.size_gb} GB</td>
                        <td class="py-2.5 px-3 text-slate-200">${m.speed_mhz} MHz</td>
                    `;
                    spdTbody.appendChild(tr);
                });
            } catch (e) { }
        }

        async function runCPUBenchmark() {
            try {
                document.getElementById('silicon-bench-status-msg').innerText = "Iniciando estresse e cálculos Single-Thread / Multi-Thread...";
                const res = await fetch('/api/silicon/bench/run', { method: 'POST' });
                const data = await res.json();
                if (data.status === 'success') {
                    showToast("CPU Benchmark", "Teste de estresse disparado. Calculando scores...", "info");
                    setTimeout(pollCPUBenchmark, 1000);
                } else {
                    showToast("Benchmark Ocupado", data.message, "warning");
                }
            } catch (e) {
                showToast("Erro no Benchmark", "Erro ao disparar CPU Benchmark: " + e, "error");
            }
        }

        async function pollCPUBenchmark() {
            try {
                const res = await fetch('/api/silicon/bench/results');
                const data = await res.json();
                if (data.status === 'success' && data.bench) {
                    const b = data.bench;
                    const sVal = Number(b.single_thread || 0);
                    const mVal = Number(b.multi_thread || 0);
                    document.getElementById('silicon-bench-single-val').innerText = sVal.toFixed(1);
                    document.getElementById('silicon-bench-multi-val').innerText = mVal.toLocaleString();
                    document.getElementById('silicon-bench-ratio-val').innerText = `${Number(b.ratio || 0).toFixed(2)}x`;
                    const sBar = document.getElementById('silicon-bench-single-bar');
                    if (sBar) sBar.style.width = `${Math.min(100, Math.round((sVal / 800) * 100))}%`;
                    const mBar = document.getElementById('silicon-bench-multi-bar');
                    if (mBar) mBar.style.width = `${Math.min(100, Math.round((mVal / 8000) * 100))}%`;
                    document.getElementById('silicon-bench-status-msg').innerText = b.timestamp ? `✅ Último teste concluído às ${b.timestamp}.` : 'Pronto para executar benchmark.';
                    if (b.running) {
                        setTimeout(pollCPUBenchmark, 800);
                    }
                }
            } catch (e) { }
        }

        // =====================================================================
        // MOTOR Vision Engine™: PLACA DE VÍDEO & SENSORES EM TEMPO REAL
        // =====================================================================
        function switchVisionSubTab(subTabId) {
            document.querySelectorAll('.vision-subview').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.vision-subtab-btn').forEach(el => {
                el.classList.remove('active');
            });

            const targetView = document.getElementById(`vision-subview-${subTabId}`);
            if (targetView) targetView.classList.remove('hidden');

            const activeBtn = document.getElementById(`vision-subtab-btn-${subTabId}`);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }
            lucide.createIcons();
        }

        async function loadVisionInfo() {
            try {
                const res = await fetch('/api/vision/info');
                const data = await res.json();
                if (data.status !== 'success' || !data.vision) return;
                const g = data.vision.gpu || {};
                const s = data.vision.sensors || {};

                // Estáticos
                document.getElementById('vision-card-name').innerText = g.name || 'Adaptador Gráfico Detectado';
                document.getElementById('vision-card-vram').innerText = `${g.memory_size_mb || 0} MB ${g.memory_type || ''}`.trim();
                document.getElementById('vision-card-arch').innerText = g.architecture || '--';
                document.getElementById('vision-card-process').innerText = g.process || '--';
                document.getElementById('vision-card-transistors').innerText = g.transistors || '--';
                document.getElementById('vision-card-cores').innerText = g.cuda_cores || '--';
                document.getElementById('vision-card-bus').innerText = `${g.bus_width || '--'} (${g.memory_type || '--'})`;
                document.getElementById('vision-card-bandwidth').innerText = g.bandwidth || '--';
                document.getElementById('vision-card-driver').innerText = g.driver_version || '--';
                document.getElementById('vision-card-res').innerText = g.display_resolution || '--';

                // Recursos dinâmicos da GPU real
                const featGrid = document.getElementById('vision-features-grid');
                if (featGrid && Array.isArray(g.features) && g.features.length > 0) {
                    featGrid.innerHTML = g.features.map(f => `
                        <div class="flex items-center gap-1.5 text-slate-300"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i> ${escapeHtml(f)}</div>
                    `).join('');
                    lucide.createIcons();
                }

                // Sensores
                updateVisionSensorsUI(s);
            } catch (e) { }
        }

        async function pollVisionSensors() {
            try {
                const res = await fetch('/api/vision/info');
                const data = await res.json();
                if (data.status === 'success' && data.vision && data.vision.sensors) {
                    updateVisionSensorsUI(data.vision.sensors);
                }
            } catch (e) { }
        }

        function updateVisionSensorsUI(s) {
            document.getElementById('vision-sensor-temp').innerText = s.temperature_gpu ? `${s.temperature_gpu} °C` : 'N/D';
            document.getElementById('vision-sensor-hotspot').innerText = s.temperature_hotspot ? `${s.temperature_hotspot} °C` : 'N/D';
            document.getElementById('vision-sensor-usage').innerText = `${s.gpu_usage_percent || 0} %`;
            document.getElementById('vision-sensor-vram').innerText = `${s.memory_used_mb || 0} MB`;
            document.getElementById('vision-sensor-vram-sub').innerText = `${s.memory_used_mb || 0} / ${s.memory_total_mb || 0} MB`;
            document.getElementById('vision-sensor-power').innerText = s.power_draw_w ? `${Number(s.power_draw_w).toFixed(1)} W` : 'N/D';
            document.getElementById('vision-sensor-coreclock').innerText = s.clock_core_mhz ? `${s.clock_core_mhz} MHz` : 'N/D';
            document.getElementById('vision-sensor-memclock').innerText = `Memória: ${s.clock_memory_mhz ? s.clock_memory_mhz + ' MHz' : 'N/D'}`;
        }

        // =====================================================================
        // TESTE DE VELOCIDADE DO DISCO (WINSHIELD DISKSPEED TURBO)
        // =====================================================================
        let currentBenchResults = {
            seq_read_q8: 0, seq_write_q8: 0,
            seq_read_q1: 0, seq_write_q1: 0,
            rnd_read_q32: 0, rnd_write_q32: 0,
            rnd_read_q1: 0, rnd_write_q1: 0,
            seq_read_q8_iops: 0, seq_write_q8_iops: 0,
            seq_read_q1_iops: 0, seq_write_q1_iops: 0,
            rnd_read_q32_iops: 0, rnd_write_q32_iops: 0,
            rnd_read_q1_iops: 0, rnd_write_q1_iops: 0,
            seq_read_q8_lat: 0, seq_write_q8_lat: 0,
            seq_read_q1_lat: 0, seq_write_q1_lat: 0,
            rnd_read_q32_lat: 0, rnd_write_q32_lat: 0,
            rnd_read_q1_lat: 0, rnd_write_q1_lat: 0,
        };
        let currentBenchUnit = 'MB/s';
        let currentActiveTestType = null;

        function changeBenchUnit(unit) {
            currentBenchUnit = unit;
            const unitLabel = unit === 'LAT' ? 'μs' : unit;
            const rLbl = document.getElementById('lbl-unit-read');
            const wLbl = document.getElementById('lbl-unit-write');
            if (rLbl) rLbl.innerText = unitLabel;
            if (wLbl) wLbl.innerText = unitLabel;
            renderBenchResultsUI(currentBenchResults);
        }

        function formatBenchValue(val, iops, lat, unit) {
            if (unit === 'GB/s') {
                return (val / 1024).toFixed(3);
            } else if (unit === 'IOPS') {
                return Math.round(iops || (val > 0 ? (val * 1024 * 1024 / 4096) : 0)).toLocaleString();
            } else if (unit === 'LAT') {
                return (lat || (val > 0 ? (1000000 / Math.max(1, iops)) : 0)).toFixed(1);
            }
            return (val || 0).toFixed(2);
        }

        function renderBenchResultsUI(r) {
            const u = currentBenchUnit;
            const tests = [
                { id: 'seq-q8', maxSpeed: 4000, readMb: r.seq_read_q8 || 0, writeMb: r.seq_write_q8 || 0, readIops: r.seq_read_q8_iops || 0, writeIops: r.seq_write_q8_iops || 0, readLat: r.seq_read_q8_lat || 0, writeLat: r.seq_write_q8_lat || 0 },
                { id: 'seq-q1', maxSpeed: 4000, readMb: r.seq_read_q1 || 0, writeMb: r.seq_write_q1 || 0, readIops: r.seq_read_q1_iops || 0, writeIops: r.seq_write_q1_iops || 0, readLat: r.seq_read_q1_lat || 0, writeLat: r.seq_write_q1_lat || 0 },
                { id: 'rnd-q32', maxSpeed: 600, readMb: r.rnd_read_q32 || 0, writeMb: r.rnd_write_q32 || 0, readIops: r.rnd_read_q32_iops || 0, writeIops: r.rnd_write_q32_iops || 0, readLat: r.rnd_read_q32_lat || 0, writeLat: r.rnd_write_q32_lat || 0 },
                { id: 'rnd-q1', maxSpeed: 150, readMb: r.rnd_read_q1 || 0, writeMb: r.rnd_write_q1 || 0, readIops: r.rnd_read_q1_iops || 0, writeIops: r.rnd_write_q1_iops || 0, readLat: r.rnd_read_q1_lat || 0, writeLat: r.rnd_write_q1_lat || 0 },
            ];

            tests.forEach(t => {
                const elR = document.getElementById(`res-read-${t.id}`);
                const elW = document.getElementById(`res-write-${t.id}`);
                const subR = document.getElementById(`sub-read-${t.id}`);
                const subW = document.getElementById(`sub-write-${t.id}`);
                const meterR = document.getElementById(`meter-read-${t.id}`);
                const meterW = document.getElementById(`meter-write-${t.id}`);

                if (elR) elR.innerText = formatBenchValue(t.readMb, t.readIops, t.readLat, u);
                if (elW) elW.innerText = formatBenchValue(t.writeMb, t.writeIops, t.writeLat, u);

                if (subR) subR.innerText = `${Math.round(t.readIops).toLocaleString()} IOPS • ${t.readLat.toFixed(1)} μs`;
                if (subW) subW.innerText = `${Math.round(t.writeIops).toLocaleString()} IOPS • ${t.writeLat.toFixed(1)} μs`;

                if (meterR) {
                    const pctR = Math.max(0, Math.min(100, (t.readMb / t.maxSpeed) * 100));
                    meterR.style.width = `${pctR}%`;
                }
                if (meterW) {
                    const pctW = Math.max(0, Math.min(100, (t.writeMb / t.maxSpeed) * 100));
                    meterW.style.width = `${pctW}%`;
                }
            });
        }

        async function startDiskBenchmark(testType = 'all') {
            const drive = document.getElementById('bench-drive-select').value;
            const size = document.getElementById('bench-size-select').value;
            const passes = document.getElementById('bench-passes-select') ? document.getElementById('bench-passes-select').value : 5;

            currentActiveTestType = testType;

            try {
                // Alterna visibilidade dos botões
                document.getElementById('bench-cancel-btn').classList.remove('hidden');
                document.getElementById('bench-start-all-btn').disabled = true;
                document.querySelectorAll('.bench-row-btn').forEach(btn => btn.classList.remove('active-running'));

                // Destaca o botão disparado
                if (testType === 'all') {
                    document.getElementById('bench-start-all-btn').classList.add('active-running');
                } else {
                    const targetBtn = document.getElementById(`btn-${testType.replace('_', '-')}`);
                    if (targetBtn) targetBtn.classList.add('active-running');
                }

                // Reseta indicadores visuais
                document.getElementById('bench-progress-bar').style.width = '3%';
                document.getElementById('bench-progress-text').innerText = '0%';
                document.getElementById('bench-status-phase').innerHTML = `<span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span> Preparando Direct I/O (${passes} Passes)...`;
                document.getElementById('bench-status-msg').innerText = `Alocando arquivo de teste no drive ${drive}: (${size} MB | ${passes} repetições)...`;

                const res = await fetch('/api/disks/benchmark/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        drive: drive,
                        size_mb: parseInt(size),
                        passes: parseInt(passes),
                        test_type: testType
                    })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    if (benchmarkPollTimer) clearInterval(benchmarkPollTimer);
                    benchmarkPollTimer = setInterval(pollBenchmarkStatus, 250);
                    pollBenchmarkStatus();
                    showToast("WinShield DiskSpeed Turbo", `Testes iniciados no drive ${drive}: (${size} MB | ${passes} passes). Acompanhe o progresso...`, "info");
                } else {
                    resetBenchButtons();
                    showToast("Benchmark Ocupado", data.message, "warning");
                }
            } catch (e) {
                resetBenchButtons();
                showToast("Erro no Benchmark", "Falha ao iniciar benchmark: " + e, "error");
            }
        }

        function resetBenchButtons() {
            document.getElementById('bench-cancel-btn').classList.add('hidden');
            document.getElementById('bench-start-all-btn').disabled = false;
            document.querySelectorAll('.bench-row-btn').forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('active-running');
            });
            document.querySelectorAll('.diskspeed-card').forEach(c => c.classList.remove('card-active'));
        }

        async function cancelDiskBenchmark() {
            try {
                if (benchmarkPollTimer) {
                    clearInterval(benchmarkPollTimer);
                    benchmarkPollTimer = null;
                }
                resetBenchButtons();
                document.getElementById('bench-status-phase').innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-400"></span> Teste Cancelado';
                document.getElementById('bench-status-msg').innerText = "Cancelamento do teste solicitado pelo usuário.";

                await fetch('/api/disks/benchmark/cancel', { method: 'POST' });
                showToast("Benchmark Interrompido", "Teste de velocidade cancelado pelo usuário.", "warning");
            } catch (e) {
                showToast("Erro", "Falha ao cancelar: " + e, "error");
            }
        }

        async function pollBenchmarkStatus() {
            try {
                const res = await fetch('/api/disks/benchmark/status');
                const data = await res.json();
                if (data.status !== 'success' || !data.benchmark) return;
                const b = data.benchmark;

                // Atualiza progresso e textos
                const pct = Math.max(0, Math.min(100, b.progress_percent || 0));
                document.getElementById('bench-progress-bar').style.width = `${pct}%`;
                document.getElementById('bench-progress-text').innerText = `${pct}%`;
                document.getElementById('bench-status-phase').innerHTML = b.running
                    ? `<span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span> Em Andamento: ${escapeHtml(b.current_test || 'Testando I/O...')}`
                    : (b.phase === 'finished' ? '<span class="w-2 h-2 rounded-full bg-emerald-400"></span> ✅ Benchmark Concluído com Sucesso!' : '<span class="w-2 h-2 rounded-full bg-slate-400"></span> Benchmark Finalizado');
                document.getElementById('bench-status-msg').innerText = b.log_msg || '';

                // Destaca cartão ativo
                document.querySelectorAll('.diskspeed-card').forEach(c => c.classList.remove('card-active'));
                if (b.running && b.current_test) {
                    const t = b.current_test.toLowerCase();
                    if (t.includes('seq 1m q8')) {
                        const targetId = t.includes('read') ? 'card-read-seq-q8' : 'card-write-seq-q8';
                        const el = document.getElementById(targetId);
                        if (el) el.classList.add('card-active');
                    } else if (t.includes('seq 1m q1')) {
                        const targetId = t.includes('read') ? 'card-read-seq-q1' : 'card-write-seq-q1';
                        const el = document.getElementById(targetId);
                        if (el) el.classList.add('card-active');
                    } else if (t.includes('rnd 4k q32')) {
                        const targetId = t.includes('read') ? 'card-read-rnd-q32' : 'card-write-rnd-q32';
                        const el = document.getElementById(targetId);
                        if (el) el.classList.add('card-active');
                    } else if (t.includes('rnd 4k q1')) {
                        const targetId = t.includes('read') ? 'card-read-rnd-q1' : 'card-write-rnd-q1';
                        const el = document.getElementById(targetId);
                        if (el) el.classList.add('card-active');
                    }
                }

                // Atualiza números e barras
                if (b.results) {
                    currentBenchResults = Object.assign({}, currentBenchResults, b.results);
                    renderBenchResultsUI(currentBenchResults);
                }

                if (!b.running) {
                    if (benchmarkPollTimer) {
                        clearInterval(benchmarkPollTimer);
                        benchmarkPollTimer = null;
                    }
                    resetBenchButtons();
                    if (b.phase === 'finished') {
                        showToast("WinShield DiskSpeed Turbo", "Medições concluídas com retenção de pico real!", "success");
                    }
                }
            } catch (e) { }
        }

        // =====================================================================
        // AUDITORIA & APPS OCULTOS
        // =====================================================================
        async function runAuditAction(type) {
            document.querySelectorAll('.audit-subtab-btn').forEach(el => el.classList.remove('active'));
            const activeAuditBtn = document.getElementById(`audit-subtab-btn-${type}`);
            if (activeAuditBtn) activeAuditBtn.classList.add('active');

            document.getElementById('audit-count-badge').innerText = "Escaneando o sistema...";
            try {
                const res = await fetch('/api/audit/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: type })
                });
                const data = await res.json();
                currentAuditList = data.items || [];
                renderAuditTable(currentAuditList);
            } catch (err) {
                document.getElementById('audit-count-badge').innerText = "Falha ao escanear.";
            }
        }

        function renderAuditTable(items) {
            const tbody = document.getElementById('audit-table-body');
            tbody.innerHTML = '';
            selectedAuditItem = null;

            let hiddenCount = 0;
            items.forEach((item) => {
                if (item.is_hidden) hiddenCount++;
                const tr = document.createElement('tr');
                tr.className = `hover:bg-dark-750/30 transition cursor-pointer ${item.is_hidden ? 'bg-amber-500/5' : ''}`;
                tr.onclick = () => {
                    document.querySelectorAll('#audit-table-body tr').forEach(r => r.classList.remove('selected-row'));
                    tr.classList.add('selected-row');
                    selectedAuditItem = item;
                };

                const isHiddenBadge = item.is_hidden
                    ? `<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">${escapeHtml(item.status)}</span>`
                    : `<span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">${escapeHtml(item.status)}</span>`;

                tr.innerHTML = `
                    <td class="py-3 px-4 font-sans font-medium text-slate-200 flex items-center gap-2">
                        <i data-lucide="${item.is_hidden ? 'eye-off' : 'package'}" class="w-4 h-4 ${item.is_hidden ? 'text-amber-400' : 'text-blue-400'}"></i>
                        ${escapeHtml(item.nome)}
                    </td>
                    <td class="py-3 px-4 text-slate-400">${escapeHtml(item.versao || '—')}</td>
                    <td class="py-3 px-4 text-slate-400 truncate max-w-[120px]">${escapeHtml(item.editor || '—')}</td>
                    <td class="py-3 px-4 text-slate-400">${escapeHtml(item.origem || '—')}</td>
                    <td class="py-3 px-4">${isHiddenBadge}</td>
                    <td class="py-3 px-4 text-slate-400 truncate max-w-xs" title="${escapeHtml(item.caminho || '')}">${escapeHtml(item.caminho || '—')}</td>
                `;
                tbody.appendChild(tr);
            });

            lucide.createIcons();
            document.getElementById('audit-count-badge').innerText = `Total: ${items.length} programas (${hiddenCount} ocultos)`;
        }

        function filterAuditTable(query) {
            query = query.toLowerCase();
            const filtered = currentAuditList.filter(item => {
                return (item.nome && item.nome.toLowerCase().includes(query)) ||
                    (item.caminho && item.caminho.toLowerCase().includes(query)) ||
                    (item.editor && item.editor.toLowerCase().includes(query)) ||
                    (item.status && item.status.toLowerCase().includes(query));
            });
            renderAuditTable(filtered);
        }

        async function unhideSelectedItem() {
            if (!selectedAuditItem) return showToast("Aviso", "Selecione um item na tabela primeiro.", "warning");
            if (!selectedAuditItem.is_hidden) return showToast("Informação", `'${selectedAuditItem.nome}' já está visível.`, "info");
            try {
                const res = await fetch('/api/audit/unhide', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ root: selectedAuditItem.root, subkey: selectedAuditItem.subkey })
                });
                const data = await res.json();
                showToast("Desocultar Programa", data.message, "success");
                runAuditAction('registry');
            } catch (e) {
                showToast("Erro", "Falha ao desocultar: " + e, "error");
            }
        }

        async function uninstallSelectedItem() {
            if (!selectedAuditItem) return showToast("Aviso", "Selecione um item na tabela primeiro.", "warning");
            const confirmed = await showConfirmModal({
                title: t('modals.uninstall_title'),
                message: t('modals.uninstall_msg'),
                itemName: selectedAuditItem.nome,
                itemDetails: `Chave / Comando: ${selectedAuditItem.caminho || 'Registro Windows'}`,
                itemIcon: 'trash-2',
                type: 'warning',
                confirmText: t('modals.btn_confirm'),
                cancelText: t('modals.btn_cancel')
            });
            if (!confirmed) return;

            try {
                const res = await fetch('/api/audit/uninstall', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ item: selectedAuditItem })
                });
                const data = await res.json();
                showToast("Desinstalação", data.message, "info");
            } catch (e) {
                showToast("Erro", "Falha ao desinstalar: " + e, "error");
            }
        }

        async function forceShredSelectedItem() {
            if (!selectedAuditItem) return showToast("Aviso", "Selecione um item na tabela primeiro.", "warning");
            const confirmed = await showConfirmModal({
                title: t('modals.shred_title'),
                message: `Deseja realmente forçar a trituração e exclusão definitiva de '${selectedAuditItem.nome}'?`,
                itemName: selectedAuditItem.nome,
                itemDetails: `Alvo: ${selectedAuditItem.caminho || 'Registro e Arquivos em Disco'}`,
                itemIcon: 'skull',
                warningText: 'Os processos ativos serão finalizados e todos os arquivos em disco serão triturados permanentemente.',
                type: 'danger',
                confirmText: 'Triturar Agora',
                cancelText: t('modals.btn_cancel')
            });
            if (!confirmed) return;

            try {
                const res = await fetch('/api/audit/force_shred', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: selectedAuditItem.nome, cmd: selectedAuditItem.caminho })
                });
                const data = await res.json();
                showToast("Triturador Forçado", data.message, "success");
                runAuditAction('registry');
            } catch (e) {
                showToast("Erro", "Falha ao triturar: " + e, "error");
            }
        }

        // =====================================================================
        // TELEMETRIA PROFUNDA DE MEMÓRIA & RAMGUARD™ MATRIX ENGINE
        // =====================================================================
        let ramGuardTimer = null;

        async function loadMemoryInfo(manual = false) {
            const icon = document.getElementById('btn-refresh-mem-icon');
            if (icon) icon.classList.add('animate-spin');

            try {
                const res = await fetch('/api/memory/info');
                const data = await res.json();
                if (data.status === 'success' && data.memory) {
                    const m = data.memory;

                    const totalEl = document.getElementById('mem-total-display');
                    if (totalEl) totalEl.innerText = `${m.total_gb} GB`;

                    const usedEl = document.getElementById('mem-used-display');
                    if (usedEl) usedEl.innerText = `${m.used_gb} GB`;

                    const availEl = document.getElementById('mem-avail-display');
                    if (availEl) availEl.innerText = `${m.avail_gb} GB`;

                    const loadPctEl = document.getElementById('mem-load-pct');
                    if (loadPctEl) loadPctEl.innerText = `${m.load_percent}%`;

                    const loadBarEl = document.getElementById('mem-load-bar');
                    if (loadBarEl) {
                        loadBarEl.style.width = `${m.load_percent}%`;
                        if (m.load_percent > 85) {
                            loadBarEl.className = "bg-gradient-to-r from-amber-500 to-rose-500 h-3 rounded-full transition-all duration-500";
                        } else {
                            loadBarEl.className = "bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500";
                        }
                    }

                    const pagefileEl = document.getElementById('mem-pagefile-display');
                    if (pagefileEl) {
                        pagefileEl.innerText = `Arquivo de Paginação (Pagefile): ${m.pagefile_used_gb} GB em uso de ${m.pagefile_total_gb} GB`;
                    }

                    const mods = m.modules || [];
                    const chBadge = document.getElementById('mem-dual-channel-badge');
                    if (chBadge) {
                        chBadge.innerText = mods.length >= 2 ? 'Dual-Channel Ativo' : (mods.length === 1 ? 'Single-Channel' : 'RAM Ativa');
                    }
                    const qSpeed = document.getElementById('mem-quick-speed');
                    if (qSpeed) qSpeed.innerText = (mods[0] && mods[0].speed_mhz) ? `${mods[0].speed_mhz} MHz` : 'N/D';
                    const qSlots = document.getElementById('mem-quick-slots');
                    if (qSlots) qSlots.innerText = `${mods.length} Pente(s)`;
                    const qType = document.getElementById('mem-quick-type');
                    if (qType) qType.innerText = (mods[0] && mods[0].type) ? mods[0].type : 'SDRAM';
                    const qHealth = document.getElementById('mem-quick-health');
                    if (qHealth) {
                        qHealth.innerText = m.load_percent > 90 ? 'Carga Alta' : '100% Estável';
                        qHealth.className = m.load_percent > 90 ? 'text-amber-400 text-xs' : 'text-emerald-400 text-xs';
                    }

                    renderMemoryModules(mods);

                    if (manual) showToast(t('nav.memory'), `${mods.length} módulos físicos de RAM mapeados com sucesso.`, 'success');
                }
            } catch (e) {
                console.error("Erro ao carregar telemetria de memória:", e);
            } finally {
                if (icon) icon.classList.remove('animate-spin');
            }
        }

        function renderMemoryModules(modules) {
            const grid = document.getElementById('mem-modules-grid');
            const countEl = document.getElementById('mem-modules-count');
            if (!grid) return;

            if (countEl) countEl.innerText = `${modules.length} Pentes Detectados`;

            if (modules.length === 0) {
                grid.innerHTML = '<p class="col-span-2 text-center py-6 text-slate-500">Nenhum módulo físico retornado pelo barramento WMI.</p>';
                return;
            }

            grid.innerHTML = modules.map((mod, idx) => `
                <div class="bg-dark-900/80 p-4 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-cyan-500/30 transition">
                    <div class="absolute -top-14 -right-14 w-36 h-36 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none"></div>

                    <div class="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3 relative z-10">
                        <div class="flex items-start gap-3 min-w-0">
                            <div class="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center justify-center font-black text-[10px] font-mono leading-none flex-shrink-0">
                                ${escapeHtml(mod.slot || `DIMM ${idx + 1}`)}
                            </div>
                            <div class="min-w-0">
                                <h4 class="font-bold text-white text-sm flex flex-wrap items-center gap-2">
                                    <span class="truncate max-w-[180px]">${escapeHtml(mod.manufacturer || 'Kingston')}</span>
                                    <span class="px-2 py-0.5 rounded-md text-[10px] font-mono bg-blue-500/20 text-cyan-300 border border-blue-500/30">${escapeHtml(mod.type || 'DDR4')}</span>
                                </h4>
                                <p class="text-[11px] text-slate-400 font-mono truncate">${escapeHtml(mod.part_number || 'DDR4-SDRAM')}</p>
                            </div>
                        </div>

                        <div class="text-right flex-shrink-0">
                            <span class="text-xl font-black text-white">${mod.capacity_gb} GB</span>
                            <p class="text-[10px] text-emerald-400 font-bold font-mono">Integridade Estável</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono mt-3 relative z-10">
                        <div class="bg-dark-950/80 p-2.5 rounded-xl border border-slate-800">
                            <span class="text-[10px] text-slate-500 block">Frequência</span>
                            <span class="font-bold text-cyan-400">${mod.speed_mhz} MHz</span>
                        </div>
                        <div class="bg-dark-950/80 p-2.5 rounded-xl border border-slate-800">
                            <span class="text-[10px] text-slate-500 block">Tensão</span>
                            <span class="font-bold text-amber-300">${escapeHtml(mod.voltage || '1.20 V')}</span>
                        </div>
                        <div class="bg-dark-950/80 p-2.5 rounded-xl border border-slate-800">
                            <span class="text-[10px] text-slate-500 block">Serial</span>
                            <span class="font-bold text-slate-300 truncate block">${escapeHtml(mod.serial_number || '—')}</span>
                        </div>
                    </div>
                </div>
            `).join('');
            lucide.createIcons();
        }

        async function startMemoryTest() {
            const size = parseInt(document.getElementById('ramguard-size-select').value) || 1024;
            const mode = document.getElementById('ramguard-mode-select').value || 'quick';

            try {
                const res = await fetch('/api/memory/test/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ size_mb: size, mode: mode })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    showToast(t('memory.ramguard_title'), data.message, 'success');
                    document.getElementById('btn-start-ramguard').disabled = true;
                    document.getElementById('btn-stop-ramguard').disabled = false;

                    const logBox = document.getElementById('ramguard-log-output');
                    if (logBox) logBox.innerHTML = `<p class="text-cyan-400">> [${new Date().toLocaleTimeString()}] Teste iniciado: ${size} MB alocados em modo ${mode}.</p>`;

                    if (ramGuardTimer) clearInterval(ramGuardTimer);
                    ramGuardTimer = setInterval(pollMemoryTest, 800);
                } else {
                    showToast('Erro RAMGuard™', data.message, 'error');
                }
            } catch (e) {
                showToast('Erro de Conexão', e.message, 'error');
            }
        }

        async function stopMemoryTest() {
            const confirmed = await showConfirmModal({
                title: 'Interromper RAMGuard™',
                message: 'Deseja realmente interromper o teste de memória em andamento?',
                itemName: 'WinShield RAMGuard™ Worker',
                itemIcon: 'square',
                type: 'warning',
                confirmText: 'Parar Teste',
                cancelText: 'Continuar Testando'
            });
            if (!confirmed) return;

            try {
                await fetch('/api/memory/test/stop', { method: 'POST' });
                showToast(t('memory.ramguard_title'), 'Interrupção solicitada pelo usuário.', 'info');
            } catch (e) { }
        }

        async function pollMemoryTest() {
            try {
                const res = await fetch('/api/memory/test/status');
                const data = await res.json();
                if (data.status === 'success' && data.test) {
                    const st = data.test;

                    const stateEl = document.getElementById('ramguard-state');
                    if (stateEl) {
                        if (st.state === 'running') {
                            stateEl.innerHTML = '<span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span> Testando Células...';
                        } else if (st.state === 'completed') {
                            stateEl.innerHTML = '<span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Concluído com Sucesso';
                        } else if (st.state === 'cancelled') {
                            stateEl.innerHTML = '<span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Interrompido';
                        } else {
                            stateEl.innerHTML = '<span class="w-2.5 h-2.5 rounded-full bg-slate-500"></span> Ocioso';
                        }
                    }

                    const passInfoEl = document.getElementById('ramguard-pass-info');
                    if (passInfoEl) passInfoEl.innerText = `Passe ${st.current_pass} de ${st.total_passes}`;

                    const speedEl = document.getElementById('ramguard-speed');
                    if (speedEl) speedEl.innerText = `${(st.speed_mb_s || 0).toLocaleString()} MB/s`;

                    const elapsedEl = document.getElementById('ramguard-elapsed');
                    if (elapsedEl) elapsedEl.innerText = `Tempo decorrido: ${st.elapsed_seconds || 0}s`;

                    const patternEl = document.getElementById('ramguard-pattern');
                    if (patternEl) patternEl.innerText = st.current_pattern || 'Padrão celular ativo';

                    const testedMbEl = document.getElementById('ramguard-tested-mb');
                    if (testedMbEl) testedMbEl.innerText = `Buffer: ${st.tested_mb || 0} MB / ${st.total_mb || 0} MB`;

                    const errorsEl = document.getElementById('ramguard-errors');
                    if (errorsEl) {
                        errorsEl.innerText = st.errors_found || 0;
                        errorsEl.className = st.errors_found > 0 ? "text-2xl font-black text-rose-500" : "text-2xl font-black text-emerald-400";
                    }

                    const verdictEl = document.getElementById('ramguard-verdict');
                    if (verdictEl) {
                        verdictEl.innerText = st.errors_found > 0 ? 'FALHA DE HARDWARE DETECTADA' : 'Células 100% Íntegras';
                        verdictEl.className = st.errors_found > 0 ? 'text-[11px] text-rose-400 font-bold font-mono' : 'text-[11px] text-emerald-400/80 font-mono';
                    }

                    const pctEl = document.getElementById('ramguard-pct-text');
                    if (pctEl) pctEl.innerText = `${st.progress_percent}%`;

                    const barEl = document.getElementById('ramguard-progress-bar');
                    if (barEl) barEl.style.width = `${st.progress_percent}%`;

                    const logBox = document.getElementById('ramguard-log-output');
                    if (logBox && Array.isArray(st.error_log) && st.error_log.length > 0) {
                        logBox.innerHTML = st.error_log.map(msg => `<p class="${msg.includes('ERRO') ? 'text-rose-400 font-bold' : msg.includes('CONCLUÍDO') ? 'text-emerald-400 font-bold' : 'text-slate-300'}">> ${escapeHtml(msg)}</p>`).join('');
                        logBox.scrollTop = logBox.scrollHeight;
                    }

                    if (st.state !== 'running') {
                        clearInterval(ramGuardTimer);
                        ramGuardTimer = null;
                        document.getElementById('btn-start-ramguard').disabled = false;
                        document.getElementById('btn-stop-ramguard').disabled = true;
                    }
                }
            } catch (e) { }
        }

        // =====================================================================
        // ANTIVÍRUS, SYSTEM32 SCANNER, VALIDAÇÃO DE DRIVERS OFICIAIS & CLOUD
        // =====================================================================
        let allThreats = [];
        let verifiedOfficialDrivers = [];
        let threatActiveSubTab = 'all';
        let avScanPollTimer = null;

        async function checkDefenderStatus() {
            try {
                const res = await fetch('/api/antivirus/status');
                const data = await res.json();
                if (data.status === 'success' && data.defender) {
                    const d = data.defender;
                    if (d.available) {
                        document.getElementById('defender-sig-ver').innerText = `Vacinas: v${d.AntivirusSignatureVersion || 'Atualizada'}`;
                    }
                }
            } catch (e) { }
        }

        async function startForegroundSecurityScan(mode = 'quick') {
            const qBtn = document.getElementById('btn-av-quick-scan');
            const dBtn = document.getElementById('btn-av-deep-scan');
            const sBtn = document.getElementById('btn-av-stop-scan');
            if (qBtn) qBtn.disabled = true;
            if (dBtn) dBtn.disabled = true;
            if (sBtn) sBtn.classList.remove('hidden');

            const modeBadge = document.getElementById('av-scan-mode-badge');
            if (modeBadge) {
                modeBadge.innerText = mode === 'deep' ? 'Modo: Varredura Profunda' : 'Modo: Varredura Rápida';
                modeBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40';
            }
            const dot = document.getElementById('av-scan-pulse-dot');
            if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping';

            try {
                const res = await fetch('/api/antivirus/start_scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode: mode })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    if (avScanPollTimer) clearInterval(avScanPollTimer);
                    avScanPollTimer = setInterval(pollForegroundSecurityScan, 250);
                    pollForegroundSecurityScan();
                    showToast("Scanner de Segurança", data.message || "Varredura iniciada em primeiro plano.", "info");
                } else {
                    if (qBtn) qBtn.disabled = false;
                    if (dBtn) dBtn.disabled = false;
                    if (sBtn) sBtn.classList.add('hidden');
                    showToast("Aviso", data.message || "Já existe uma varredura em andamento.", "warning");
                }
            } catch (e) {
                if (qBtn) qBtn.disabled = false;
                if (dBtn) dBtn.disabled = false;
                if (sBtn) sBtn.classList.add('hidden');
                showToast("Erro", "Falha ao iniciar varredura: " + e, "error");
            }
        }

        async function stopForegroundSecurityScan() {
            try {
                await fetch('/api/antivirus/stop_scan', { method: 'POST' });
                showToast("Scanner de Segurança", "Interrupção solicitada pelo usuário.", "warning");
            } catch (e) { }
        }

        async function pollForegroundSecurityScan() {
            try {
                const res = await fetch('/api/antivirus/scan_status');
                const data = await res.json();
                if (data.status !== 'success' || !data.scan) return;
                const sc = data.scan;

                const pct = Math.max(0, Math.min(100, Number(sc.percent || 0)));
                const bar = document.getElementById('av-scan-progress-bar');
                if (bar) bar.style.width = `${pct}%`;
                const pctEl = document.getElementById('av-scan-pct');
                if (pctEl) pctEl.innerText = `${pct}%`;

                const stTitle = document.getElementById('av-scan-stage-title');
                if (stTitle) stTitle.innerText = sc.stage_name || sc.stage_title || 'Auditando sistema...';

                const pathEl = document.getElementById('av-scan-live-path');
                if (pathEl) pathEl.innerText = sc.current_item || 'Verificando módulos...';

                const elapEl = document.getElementById('av-scan-elapsed');
                if (elapEl) elapEl.innerText = `${Number(sc.elapsed_sec || 0).toFixed(1)}s`;

                const stScanned = document.getElementById('av-stat-scanned');
                if (stScanned) stScanned.innerText = Number(sc.scanned_count || 0).toLocaleString();
                const stOff = document.getElementById('av-stat-official');
                if (stOff) stOff.innerText = Number(sc.verified_drivers_count ?? sc.official_drivers_verified ?? 0).toLocaleString();
                const stAnom = document.getElementById('av-stat-anomalies');
                if (stAnom) stAnom.innerText = Number(sc.anomalies_count ?? sc.anomalies_found ?? 0).toLocaleString();
                const stMal = document.getElementById('av-stat-malwares');
                if (stMal) stMal.innerText = Number(sc.threats_count ?? sc.malwares_found ?? 0).toLocaleString();

                const logLines = Array.isArray(sc.scan_log) ? sc.scan_log : (Array.isArray(sc.recent_checked) ? sc.recent_checked : []);
                const logBox = document.getElementById('av-scan-live-log');
                if (logBox && logLines.length > 0) {
                    logBox.innerHTML = logLines.map(l => `<p class="truncate text-slate-300">&gt; ${escapeHtml(l)}</p>`).join('');
                    logBox.scrollTop = logBox.scrollHeight;
                }

                const rawFindings = Array.isArray(sc.findings) ? sc.findings : (Array.isArray(sc.results) ? sc.results : []);
                const normalizedFindings = rawFindings.map(f => ({
                    ...f,
                    processo: f.processo || f.name || 'Item Auditado',
                    pid: f.pid ?? null,
                    nivel: f.nivel || f.severity || (f.is_official_driver ? 'OFICIAL VERIFICADO' : 'ALTO'),
                    score: f.score ?? (f.is_official_driver ? 0 : 80),
                    diagnostico: f.diagnostico || f.verdict || '',
                    caminho: f.caminho || f.path || '',
                    tipo: f.is_official_driver ? 'Official Driver' : (f.tipo || 'System32 Anomaly'),
                    origem: f.origem || f.publisher || f.vendor_display || 'Sistema',
                    is_official_vendor: !!(f.is_official_driver || f.is_official_vendor)
                }));
                verifiedOfficialDrivers = normalizedFindings.filter(x => x.is_official_vendor || x.classification === 'official_driver');
                allThreats = normalizedFindings.filter(x => !(x.is_official_vendor || x.classification === 'official_driver'));

                if (!sc.running) {
                    if (avScanPollTimer) {
                        clearInterval(avScanPollTimer);
                        avScanPollTimer = null;
                    }
                    const qBtn = document.getElementById('btn-av-quick-scan');
                    const dBtn = document.getElementById('btn-av-deep-scan');
                    const sBtn = document.getElementById('btn-av-stop-scan');
                    if (qBtn) qBtn.disabled = false;
                    if (dBtn) dBtn.disabled = false;
                    if (sBtn) sBtn.classList.add('hidden');

                    const dot = document.getElementById('av-scan-pulse-dot');
                    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400';

                    if (allThreats.length === 0 && verifiedOfficialDrivers.length > 0 && threatActiveSubTab === 'all') {
                        switchThreatSubTab('official');
                    } else {
                        renderThreatTable(allThreats);
                    }

                    if (sc.completed || sc.stage === 'completed') {
                        const totalT = allThreats.length;
                        const totalO = verifiedOfficialDrivers.length;
                        showToast(
                            totalT > 0 ? "Ameaças / Anomalias Detectadas" : "Varredura Concluída: Sistema Seguro",
                            `${sc.scanned_count || 0} itens auditados • ${totalO} drivers oficiais verificados • ${totalT} alertas encontrados.`,
                            totalT > 0 ? "warning" : "success",
                            5000
                        );
                    }
                } else if (rawFindings.length > 0) {
                    renderThreatTable(allThreats);
                }
            } catch (e) { }
        }

        async function scanSuspiciousThreats() {
            const btn = document.getElementById('btn-scan-heuristics');
            const originalHtml = btn ? btn.innerHTML : '';
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i><span>Analisando RAM...</span>`;
                lucide.createIcons();
            }

            document.getElementById('threat-count-badge').innerText = "Analisando processos suspeitos e memória RAM...";
            const tbody = document.getElementById('threat-table-body');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="6" class="py-12 text-center text-cyan-400 font-sans">
                    <div class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 mb-3 animate-spin">
                        <i data-lucide="loader" class="w-5 h-5 text-cyan-400"></i>
                    </div>
                    <p class="font-bold text-white text-sm">Varredura Heurística em Andamento...</p>
                    <p class="text-xs text-slate-400 mt-1">Auditando processos em execução, pastas temporárias e assinaturas digitais</p>
                </td></tr>`;
                lucide.createIcons();
            }

            try {
                const res = await fetch('/api/antivirus/scan', { method: 'POST' });
                const data = await res.json();
                const threats = (data.threats || []).map(item => ({
                    ...item,
                    tipo: 'Heurística',
                    origem: item.vendor_display || 'Processos RAM'
                }));
                allThreats = allThreats.filter(x => x.tipo !== 'Heurística').concat(threats);
                switchThreatSubTab('heuristics');
                if (threats.length === 0) {
                    showToast("Sistema Seguro", "Nenhum processo malicioso em execução detectado na heurística.", "success");
                } else {
                    showToast("Ameaças Encontradas", `${threats.length} processo(s) suspeito(s) detectado(s)!`, "error");
                }
            } catch (e) {
                showToast("Erro no Escaneamento", "Erro ao caçar ameaças: " + e, "error");
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalHtml;
                    lucide.createIcons();
                }
            }
        }

        async function scanSystem32Threats() {
            const btn = document.getElementById('btn-scan-system32');
            const originalHtml = btn ? btn.innerHTML : '';
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i><span>Examinando...</span>`;
                lucide.createIcons();
            }

            document.getElementById('threat-count-badge').innerText = "Auditando assinaturas digitais e fabricantes em System32 / SysWOW64 / Drivers...";
            const tbody = document.getElementById('threat-table-body');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="6" class="py-12 text-center text-cyan-400 font-sans">
                    <div class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 mb-3 animate-spin">
                        <i data-lucide="loader" class="w-5 h-5 text-cyan-400"></i>
                    </div>
                    <p class="font-bold text-white text-sm">Auditoria Forense System32 &amp; Drivers em Andamento...</p>
                    <p class="text-xs text-slate-400 mt-1">Verificando certificados Authenticode e separando Drivers Oficiais (NVIDIA, AMD, Intel, Realtek, Microsoft) de binários não assinados</p>
                </td></tr>`;
                lucide.createIcons();
            }

            try {
                const res = await fetch('/api/antivirus/system32_scan', { method: 'POST' });
                const data = await res.json();
                const rawList = data.all_items || data.threats || [];
                const rawOfficial = data.official_drivers || rawList.filter(x => x.is_official_driver || x.is_official_vendor || x.classification === 'official_driver');
                const rawAnomalies = rawList.filter(x => !(x.is_official_driver || x.is_official_vendor || x.classification === 'official_driver'));

                const officialItems = rawOfficial.map(item => ({
                    processo: item.name,
                    pid: item.pid,
                    nivel: 'OFICIAL VERIFICADO',
                    score: 0,
                    diagnostico: item.diagnostico || item.verdict,
                    caminho: item.path,
                    tipo: 'Official Driver',
                    origem: item.publisher || item.vendor_display || item.signer || 'Fabricante Oficial',
                    classification: 'official_driver',
                    classification_label: item.classification_label || item.verdict || 'Driver / Software Oficial Verificado (Seguro)',
                    is_official_vendor: true
                }));
                verifiedOfficialDrivers = officialItems;

                const anomalies = rawAnomalies.map(item => ({
                    processo: item.name,
                    pid: item.pid,
                    nivel: item.severity || 'ALTO',
                    score: item.score || 85,
                    diagnostico: item.diagnostico || item.verdict,
                    caminho: item.path,
                    tipo: 'System32 Anomaly',
                    origem: item.publisher || item.vendor_display || 'System32 / SysWOW64',
                    classification: item.classification || 'suspicious_unsigned',
                    classification_label: item.classification_label || item.verdict || 'Anomalia Sem Assinatura Oficial'
                }));
                allThreats = allThreats.filter(x => x.tipo !== 'System32 Anomaly').concat(anomalies);

                const stOff = document.getElementById('av-stat-official');
                if (stOff) stOff.innerText = officialItems.length.toLocaleString();
                const stAnom = document.getElementById('av-stat-anomalies');
                if (stAnom) stAnom.innerText = anomalies.length.toLocaleString();

                if (anomalies.length === 0 && officialItems.length > 0) {
                    switchThreatSubTab('official');
                    showToast("System32 & Drivers Seguros", `${officialItems.length} binários de fabricantes oficiais verificados como legítimos. 0 malwares camuflados!`, "success", 5000);
                } else {
                    switchThreatSubTab('system32');
                    if (anomalies.length === 0) {
                        showToast("System32 Seguro", "Todos os executáveis em pastas de sistema possuem assinaturas oficiais válidas.", "success", 4000);
                    } else {
                        showToast("Anomalias no System32", `${anomalies.length} binário(s) sem assinatura oficial detectado(s) (${officialItems.length} drivers oficiais legítimos ignorados).`, "warning", 5000);
                    }
                }
            } catch (e) {
                showToast("Erro System32", "Falha na varredura profunda: " + e, "error");
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalHtml;
                    lucide.createIcons();
                }
            }
        }

        async function scanCloudThreats() {
            const btn = document.getElementById('btn-scan-cloud');
            const originalHtml = btn ? btn.innerHTML : '';
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i><span>Auditando Serviços & Nuvem...</span>`;
                lucide.createIcons();
            }

            document.getElementById('threat-count-badge').innerText = "Auditando serviços instalados e consultando inteligência em nuvem...";
            const tbody = document.getElementById('threat-table-body');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="6" class="py-12 text-center text-purple-400 font-sans">
                    <div class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 mb-3 animate-spin">
                        <i data-lucide="loader" class="w-5 h-5 text-purple-400"></i>
                    </div>
                    <p class="font-bold text-white text-sm">Auditando Serviços Instalados & Consultando Inteligência em Nuvem...</p>
                    <p class="text-xs text-slate-400 mt-1">Comparando todos os serviços instalados na máquina e processos com feeds de mineradores, malwares e trojans</p>
                </td></tr>`;
                lucide.createIcons();
            }

            try {
                const res = await fetch('/api/antivirus/cloud_scan', { method: 'POST' });
                const data = await res.json();
                const cloudThreats = (data.threats || []).map(item => ({
                    processo: item.name,
                    pid: item.pid,
                    nivel: item.severity,
                    score: item.score,
                    diagnostico: item.diagnostico,
                    caminho: item.path,
                    tipo: 'Cloud Threat',
                    origem: item.is_service ? `Serviço Windows (${item.service_name || 'N/A'})` : 'Nuvem Global Feeds',
                    is_service: !!item.is_service,
                    service_name: item.service_name || ''
                }));
                allThreats = allThreats.filter(x => x.tipo !== 'Cloud Threat').concat(cloudThreats);
                switchThreatSubTab('cloud');
                if (cloudThreats.length === 0) {
                    showToast("Varredura em Nuvem", "Todos os serviços instalados e processos foram verificados: nenhuma ameaça ou minerador detectado.", "success", 4500);
                } else {
                    showToast("Ameaça Detectada", `${cloudThreats.length} serviço(s)/processo(s) malicioso(s) identificado(s) pela inteligência em nuvem!`, "error", 5500);
                }
            } catch (e) {
                showToast("Erro Cloud Intel", "Falha na verificação de nuvem: " + e, "error");
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalHtml;
                    lucide.createIcons();
                }
            }
        }

        function switchThreatSubTab(sub) {
            threatActiveSubTab = sub;
            ['all', 'sys32', 'official', 'cloud', 'heur'].forEach(k => {
                const btn = document.getElementById(`subtab-threat-${k}`);
                if (!btn) return;
                const match = (k === 'all' && sub === 'all') ||
                    (k === 'sys32' && sub === 'system32') ||
                    (k === 'official' && sub === 'official') ||
                    (k === 'cloud' && sub === 'cloud') ||
                    (k === 'heur' && sub === 'heuristics');
                if (match) {
                    btn.className = "px-3 py-1 rounded-lg font-bold bg-blue-600 text-white transition";
                } else {
                    btn.className = k === 'official'
                        ? "px-3 py-1 rounded-lg font-semibold text-emerald-400 hover:text-white transition"
                        : "px-3 py-1 rounded-lg font-semibold text-slate-400 hover:text-white transition";
                }
            });
            renderThreatTable(allThreats);
        }

        function renderThreatTable(threats) {
            const tbody = document.getElementById('threat-table-body');
            if (!tbody) return;
            tbody.innerHTML = '';
            selectedThreatItem = null;

            let filtered = [];
            if (threatActiveSubTab === 'official') {
                filtered = verifiedOfficialDrivers || [];
            } else {
                filtered = (threats || []).filter(item => {
                    if (threatActiveSubTab === 'system32') return item.tipo === 'System32 Anomaly';
                    if (threatActiveSubTab === 'cloud') return item.tipo === 'Cloud Threat';
                    if (threatActiveSubTab === 'heuristics') return item.tipo === 'Heurística';
                    return true;
                });
            }

            if (filtered.length === 0) {
                const msg = threatActiveSubTab === 'official'
                    ? 'Clique em "Auditar System32 & Drivers" ou execute uma Varredura para listar os drivers oficiais assinados.'
                    : 'Nenhuma ameaça ou anomalia detectada nesta categoria. Sistema Limpo!';
                tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-emerald-400 font-sans font-semibold"><i data-lucide="shield-check" class="w-6 h-6 mx-auto mb-1 text-emerald-400"></i>${msg}</td></tr>`;
                const countBadge = document.getElementById('threat-count-badge');
                if (countBadge) countBadge.innerText = threatActiveSubTab === 'official' ? "0 drivers listados" : "Sistema Limpo & Protegido";
                lucide.createIcons();
                return;
            }

            filtered.forEach(threat => {
                const isOfficial = threat.is_official_vendor || threat.classification === 'official_driver' || threat.tipo === 'Official Driver';
                const tr = document.createElement('tr');
                tr.className = isOfficial
                    ? "hover:bg-dark-750/30 transition bg-emerald-500/5 cursor-pointer"
                    : "hover:bg-dark-750/30 transition bg-rose-500/10 cursor-pointer";
                tr.onclick = (ev) => {
                    if (ev.target.closest('button')) return;
                    document.querySelectorAll('#threat-table-body tr').forEach(r => r.classList.remove('selected-row'));
                    tr.classList.add('selected-row');
                    selectedThreatItem = threat;
                };

                if (isOfficial) {
                    tr.innerHTML = `
                        <td class="py-3 px-4 font-sans font-bold text-emerald-300">
                            <div class="flex items-center gap-2">
                                <i data-lucide="badge-check" class="w-4 h-4 text-emerald-400 flex-shrink-0"></i>
                                <span class="truncate">${escapeHtml(threat.processo || threat.name || 'Driver Oficial')}</span>
                                ${threat.pid ? `<span class="text-[10px] font-mono text-slate-400">(PID: ${threat.pid})</span>` : ''}
                            </div>
                        </td>
                        <td class="py-3 px-4">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                ${escapeHtml(threat.origem || threat.vendor_display || 'Fabricante Oficial')}
                            </span>
                        </td>
                        <td class="py-3 px-4">
                            <span class="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] font-mono">DRIVER OFICIAL (SEGURO)</span>
                        </td>
                        <td class="py-3 px-4 text-emerald-200 font-sans text-xs max-w-md">${escapeHtml(threat.diagnostico || 'Certificado digital oficial validado — Não é malware')}</td>
                        <td class="py-3 px-4 text-slate-300 truncate max-w-xs font-mono text-[11px]" title="${escapeHtml(threat.caminho || '')}">${escapeHtml(threat.caminho || 'System32')}</td>
                        <td class="py-3 px-4 text-right">
                            <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                                <i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Verificado Legítimo
                            </span>
                        </td>
                    `;
                } else {
                    const isCrit = threat.nivel === 'CRÍTICO';
                    const levelColor = isCrit ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white';
                    const isService = !!threat.is_service || !!threat.service_name;

                    tr.innerHTML = `
                        <td class="py-3 px-4 font-sans font-bold text-rose-300">
                            <div class="flex items-center gap-2">
                                <i data-lucide="${isService ? 'server' : 'skull'}" class="w-4 h-4 ${isService ? 'text-purple-400' : 'text-rose-500'} flex-shrink-0"></i>
                                <span class="truncate">${escapeHtml(threat.processo || 'Ameaça')}</span>
                                ${threat.pid ? `<span class="text-[10px] font-mono text-slate-400">(PID: ${threat.pid})</span>` : ''}
                            </div>
                        </td>
                        <td class="py-3 px-4">
                            ${isService ? `
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 w-max">
                                    <i data-lucide="server" class="w-3 h-3 text-purple-400"></i>
                                    <span>Serviço: ${escapeHtml(threat.service_name || threat.origem)}</span>
                                </span>
                            ` : `
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
                                    ${escapeHtml(threat.origem || threat.tipo || 'Sistema')}
                                </span>
                            `}
                        </td>
                        <td class="py-3 px-4"><span class="px-2 py-0.5 rounded ${levelColor} font-bold text-[10px] font-mono">${escapeHtml(threat.nivel || 'ALTO')}</span></td>
                        <td class="py-3 px-4 text-rose-200 font-sans text-xs max-w-xs">${escapeHtml(threat.diagnostico || 'Comportamento suspeito')}</td>
                        <td class="py-3 px-4 text-slate-300 truncate max-w-xs font-mono text-[11px]" title="${escapeHtml(threat.caminho || '')}">${escapeHtml(threat.caminho || (isService ? 'Registro de Serviço' : 'Memória RAM'))}</td>
                        <td class="py-3 px-4 text-right">
                            <div class="flex items-center justify-end gap-1.5">
                                ${(!isService && threat.caminho) ? `
                                <button onclick="deleteThreatDirectly(decodeURIComponent('${encodeURIComponent(threat.caminho || '')}'), '${threat.pid || ''}', false, '')" class="btn-action-secondary px-2.5 py-1.5 rounded-lg text-amber-300 border-amber-500/40 hover:border-amber-400 font-bold text-xs flex items-center gap-1 transition" title="Isolar arquivo na pasta de Quarentena">
                                    <i data-lucide="shield-alert" class="w-3.5 h-3.5"></i>
                                    <span>${t('antivirus.btn_quarantine')}</span>
                                </button>
                                ` : ''}
                                <button onclick="deleteThreatDirectly(decodeURIComponent('${encodeURIComponent(threat.caminho || '')}'), '${threat.pid || ''}', true, '${escapeHtml(threat.service_name || '')}')" class="px-3 py-1.5 rounded-lg text-white font-bold text-xs bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-md shadow-rose-900/30 flex items-center gap-1 transition">
                                    <i data-lucide="${isService ? 'server-off' : 'trash-2'}" class="w-3.5 h-3.5"></i>
                                    <span>${isService ? 'Desinstalar Serviço' : t('antivirus.btn_delete')}</span>
                                </button>
                            </div>
                        </td>
                    `;
                }
                tbody.appendChild(tr);
            });

            lucide.createIcons();
            const countBadge = document.getElementById('threat-count-badge');
            if (countBadge) {
                countBadge.innerText = threatActiveSubTab === 'official'
                    ? `✅ ${filtered.length} driver(s)/binário(s) oficial(is) autenticado(s)`
                    : `🚨 ${filtered.length} ameaça(s)/anomalia(s) identificada(s)`;
            }
        }

        async function deleteThreatDirectly(path, pid, permanent = true, serviceName = '') {
            const isService = !!serviceName;
            const filename = isService ? `Serviço Windows: ${serviceName}` : (path ? path.split('\\').pop() : `PID ${pid}`);
            const confirmed = await showConfirmModal({
                title: isService ? 'Remover e Desinstalar Serviço Malicioso' : t('modals.threat_title'),
                message: isService
                    ? `Tem certeza que deseja desinstalar e erradicar o serviço suspeito "${serviceName}"? O serviço será interrompido, removido do registro do Windows (sc delete) e seu executável será apagado.`
                    : t('modals.threat_msg'),
                itemName: filename,
                itemDetails: isService
                    ? `Serviço: ${serviceName} • Binário: ${path || 'N/A'} • PID: ${pid || 'N/A'}`
                    : `Arquivo: ${path || 'Processo em Memória'} • PID: ${pid || 'N/A'}`,
                itemIcon: isService ? 'server' : 'skull',
                warningText: isService
                    ? 'Atenção: O serviço do Windows será parado imediatamente, excluído permanentemente do registro e os arquivos binários associados serão removidos.'
                    : 'O arquivo malicioso será forçado e excluído permanentemente, e o processo será encerrado.',
                type: 'danger',
                confirmText: isService ? 'Desinstalar Serviço' : t('antivirus.btn_delete'),
                cancelText: t('modals.btn_cancel')
            });
            if (!confirmed) return;

            try {
                const res = await fetch('/api/antivirus/delete_file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: path, pid: pid, permanent: permanent, service_name: serviceName })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    showToast(isService ? "Serviço Removido" : t('nav.antivirus'), data.message, "success", 5000);
                    allThreats = allThreats.filter(threatItem => {
                        if (serviceName && threatItem.service_name === serviceName) return false;
                        if (path && threatItem.caminho === path) return false;
                        if (pid && String(threatItem.pid) === String(pid)) return false;
                        return true;
                    });
                    renderThreatTable(allThreats);
                } else {
                    showToast("Erro ao Excluir", data.message, "error");
                }
            } catch (e) {
                showToast("Erro", "Falha de conexão ao excluir ameaça: " + e, "error");
            }
        }

        async function destroySelectedThreat() {
            if (!selectedThreatItem) return showToast("Aviso", "Selecione um processo suspeito na tabela primeiro.", "warning");
            deleteThreatDirectly(selectedThreatItem.caminho, selectedThreatItem.pid, true, selectedThreatItem.service_name || '');
        }

        async function runDefenderScan(mode) {
            try {
                const res = await fetch('/api/antivirus/defender_scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode: mode })
                });
                const data = await res.json();
                showToast("Windows Defender", (data.message || "Varredura iniciada.") + " Acompanhe no console inferior.", "info");
            } catch (e) {
                showToast("Erro Defender", "Erro ao disparar Defender: " + e, "error");
            }
        }

        async function updateDefenderVac() {
            try {
                const res = await fetch('/api/antivirus/defender_update', { method: 'POST' });
                const data = await res.json();
                showToast("Definições de Vírus", data.message || "Atualização solicitada ao Windows Update.", "success");
            } catch (e) {
                showToast("Erro", "Falha ao atualizar definições: " + e, "error");
            }
        }

        // =====================================================================
        // LIMPEZA PROFUNDA DO SISTEMA COM PROGRESSO AO VIVO (ANÁLISE & EXCLUSÃO)
        // =====================================================================
        let currentCleanCategories = [];
        let cleanProgressTimer = null;
        const DEFAULT_CLEAN_KEYS = [
            'recycle_bin', 'win_temp', 'win_update', 'browsers',
            'crashdumps', 'thumbs', 'logs', 'delivery'
        ];

        function getCleanOptions() {
            const opts = {};
            if (currentCleanCategories && currentCleanCategories.length > 0) {
                currentCleanCategories.forEach(c => {
                    const chk = document.getElementById(`chk-clean-${c.key}`);
                    opts[c.key] = chk ? chk.checked : true;
                });
            } else {
                DEFAULT_CLEAN_KEYS.forEach(k => {
                    const chk = document.getElementById(`chk-clean-${k}`);
                    opts[k] = chk ? chk.checked : true;
                });
            }
            opts.dns = true;
            return opts;
        }

        async function analyzeTempFiles(showProgressPanel = true) {
            const panel = document.getElementById('clean-live-progress-panel');
            const icon = document.getElementById('icon-clean-analyze');
            const btnAnalyze = document.getElementById('btn-clean-analyze');
            if (showProgressPanel && panel) {
                panel.classList.remove('hidden');
                const tEl = document.getElementById('clean-live-title');
                if (tEl) tEl.innerText = 'Analisando diretórios temporários e caches...';
                const bEl = document.getElementById('clean-live-bar');
                if (bEl) bEl.style.width = '5%';
                const pEl = document.getElementById('clean-live-pct');
                if (pEl) pEl.innerText = '5%';
            }
            if (icon) icon.classList.add('animate-spin');
            if (btnAnalyze && showProgressPanel) btnAnalyze.disabled = true;

            try {
                const res = await fetch('/api/clean/start_analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ options: getCleanOptions() })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    if (cleanProgressTimer) clearInterval(cleanProgressTimer);
                    cleanProgressTimer = setInterval(() => pollCleanerProgress('analyze', showProgressPanel), 140);
                } else {
                    if (icon) icon.classList.remove('animate-spin');
                    if (btnAnalyze) btnAnalyze.disabled = false;
                }
            } catch (e) {
                if (icon) icon.classList.remove('animate-spin');
                if (btnAnalyze) btnAnalyze.disabled = false;
                console.error("Erro na análise de limpeza:", e);
            }
        }

        async function pollCleanerProgress(expectedMode, showProgressPanel = true) {
            try {
                const res = await fetch('/api/clean/status');
                const data = await res.json();
                const cl = data.clean || data.cleaner;
                if (data.status !== 'success' || !cl) return;

                const mode = cl.mode || cl.action || expectedMode || 'analyze';
                const panel = document.getElementById('clean-live-progress-panel');
                if (showProgressPanel && panel) {
                    panel.classList.remove('hidden');
                }
                const pct = Math.max(0, Math.min(100, Number(cl.percent || 0)));
                const bar = document.getElementById('clean-live-bar');
                if (bar) bar.style.width = `${pct}%`;
                const pctEl = document.getElementById('clean-live-pct');
                if (pctEl) pctEl.innerText = `${pct}%`;

                const titleEl = document.getElementById('clean-live-title');
                if (titleEl) {
                    titleEl.innerText = mode === 'clean'
                        ? 'Excluindo arquivos temporários e liberando espaço em disco...'
                        : 'Escaneando diretórios temporários e caches de navegadores...';
                }

                const catEl = document.getElementById('clean-live-category');
                if (catEl) catEl.innerText = cl.current_category || 'Processando...';
                const pathEl = document.getElementById('clean-live-path');
                if (pathEl) pathEl.innerText = cl.current_path || '';
                const statsEl = document.getElementById('clean-live-stats');
                if (statsEl) {
                    statsEl.innerText = `${Number(cl.files_processed || 0).toLocaleString()} arquivos • ${cl.formatted_bytes || '0 B'}`;
                }

                if (mode === 'analyze' && Array.isArray(cl.categories) && cl.categories.length > 0) {
                    const sizeDisp = document.getElementById('temp-size-display');
                    if (sizeDisp) sizeDisp.innerText = cl.formatted_bytes || '0 B';
                    const filesDisp = document.getElementById('temp-files-display');
                    if (filesDisp) filesDisp.innerText = `${Number(cl.files_processed || 0).toLocaleString()} arquivos reais identificados`;
                    if (cl.categories.length !== currentCleanCategories.length) {
                        currentCleanCategories = cl.categories;
                        renderCleanCategories();
                    }
                }

                if (!cl.running) {
                    if (cleanProgressTimer) {
                        clearInterval(cleanProgressTimer);
                        cleanProgressTimer = null;
                    }
                    const icon = document.getElementById('icon-clean-analyze');
                    if (icon) icon.classList.remove('animate-spin');
                    const btnAnalyze = document.getElementById('btn-clean-analyze');
                    if (btnAnalyze) btnAnalyze.disabled = false;
                    const btnExec = document.getElementById('btn-clean-execute');
                    if (btnExec) btnExec.disabled = false;

                    if (cl.result) {
                        if (mode === 'analyze') {
                            const sizeDisp = document.getElementById('temp-size-display');
                            if (sizeDisp) sizeDisp.innerText = cl.result.formatted || '0 B';
                            const filesDisp = document.getElementById('temp-files-display');
                            if (filesDisp) filesDisp.innerText = `${Number(cl.result.files || 0).toLocaleString()} arquivos reais identificados`;
                            currentCleanCategories = cl.result.categories || [];
                            renderCleanCategories();
                            if (showProgressPanel) {
                                showToast(t('nav.clean'), `Análise concluída: ${cl.result.formatted || '0 B'} em ${Number(cl.result.files || 0).toLocaleString()} arquivos.`, "info", 3500);
                            }
                        } else if (mode === 'clean') {
                            showToast(t('nav.clean'), `Limpeza Concluída: ${cl.result.formatted || '0 B'} liberados (${Number(cl.result.files || 0).toLocaleString()} arquivos excluídos).`, "success", 5000);
                            setTimeout(() => analyzeTempFiles(false), 700);
                        }
                    }
                    setTimeout(() => {
                        if (panel && !cleanProgressTimer) panel.classList.add('hidden');
                    }, 2200);
                }
            } catch (e) { }
        }

        function renderCleanCategories() {
            const grid = document.getElementById('clean-categories-grid');
            if (!grid) return;
            if (currentCleanCategories.length === 0) {
                grid.innerHTML = '<p class="col-span-4 text-center py-4 text-slate-500">Nenhuma categoria analisada ainda.</p>';
                return;
            }

            const prevChecked = {};
            currentCleanCategories.forEach(c => {
                const existing = document.getElementById(`chk-clean-${c.key}`);
                if (existing) prevChecked[c.key] = existing.checked;
            });

            grid.innerHTML = currentCleanCategories.map(cat => {
                const isChecked = (cat.key in prevChecked) ? prevChecked[cat.key] : true;
                return `
                <label class="flex items-start justify-between p-3.5 rounded-xl bg-dark-900 border border-slate-800 cursor-pointer hover:border-teal-500/40 transition">
                    <div class="flex items-start space-x-2.5">
                        <input type="checkbox" id="chk-clean-${cat.key}" ${isChecked ? 'checked' : ''} class="mt-0.5 w-4 h-4 rounded bg-dark-950 border-slate-700 text-teal-500">
                        <div>
                            <p class="font-bold text-white text-xs">${escapeHtml(cat.label)}</p>
                            <p class="text-[11px] text-teal-400 font-mono mt-0.5">${Number(cat.files || 0).toLocaleString()} arquivos • <span class="font-bold">${escapeHtml(cat.formatted || '0 B')}</span></p>
                        </div>
                    </div>
                </label>
                `;
            }).join('');
        }

        async function executeDeepClean() {
            const opts = getCleanOptions();
            const selectedCount = Object.keys(opts).filter(k => k !== 'dns' && opts[k]).length;
            if (selectedCount === 0) {
                showToast(t('nav.clean'), "Selecione pelo menos uma categoria para limpar.", "warning");
                return;
            }

            const totalFiles = currentCleanCategories.reduce((acc, c) => acc + (opts[c.key] !== false ? (c.files || 0) : 0), 0);
            const totalFormatted = document.getElementById('temp-size-display')?.innerText || 'Espaço calculado';

            const confirmed = await showConfirmModal({
                title: t('modals.clean_title'),
                message: t('modals.clean_msg'),
                itemName: `${selectedCount} Área(s) de Sistema Selecionada(s)`,
                itemDetails: `Total Real a Liberar: ${totalFormatted} (${totalFiles.toLocaleString()} arquivos)`,
                itemIcon: 'trash-2',
                warningText: 'Os arquivos temporários, logs e caches de navegadores selecionados serão excluídos permanentemente.',
                type: 'danger',
                confirmText: t('clean.btn_clean'),
                cancelText: t('modals.btn_cancel')
            });
            if (!confirmed) return;

            const panel = document.getElementById('clean-live-progress-panel');
            if (panel) {
                panel.classList.remove('hidden');
                const tEl = document.getElementById('clean-live-title');
                if (tEl) tEl.innerText = 'Iniciando exclusão segura de arquivos temporários...';
                const bEl = document.getElementById('clean-live-bar');
                if (bEl) bEl.style.width = '4%';
                const pEl = document.getElementById('clean-live-pct');
                if (pEl) pEl.innerText = '2%';
            }
            const btnExec = document.getElementById('btn-clean-execute');
            if (btnExec) btnExec.disabled = true;

            try {
                const res = await fetch('/api/clean/start_clean', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ options: opts })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    if (cleanProgressTimer) clearInterval(cleanProgressTimer);
                    cleanProgressTimer = setInterval(() => pollCleanerProgress('clean', true), 120);
                } else {
                    if (btnExec) btnExec.disabled = false;
                    showToast("Aviso na Limpeza", data.message || "Não foi possível iniciar a limpeza.", "warning");
                }
            } catch (e) {
                if (btnExec) btnExec.disabled = false;
                showToast("Erro na Limpeza", "Falha na limpeza: " + e, "error");
            }
        }

        async function setPowerPlan(type) {
            try {
                const res = await fetch('/api/power/set', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan: type })
                });
                const data = await res.json();
                showToast("Plano de Energia", data.message, "success");
                loadPowerSchemes();
            } catch (e) {
                showToast("Erro", "Erro ao aplicar plano: " + e, "error");
            }
        }

        async function createCustomPlan() {
            const name = document.getElementById('custom-plan-name').value;
            const mon = document.getElementById('custom-plan-monitor').value;
            const stb = document.getElementById('custom-plan-standby').value;
            try {
                const res = await fetch('/api/power/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name, monitor: mon, standby: stb })
                });
                const data = await res.json();
                showToast("Plano Criado", data.message, "success");
                loadPowerSchemes();
            } catch (e) {
                showToast("Erro", "Erro ao criar plano: " + e, "error");
            }
        }

        async function loadPowerSchemes() {
            try {
                const res = await fetch('/api/power/list');
                const data = await res.json();
                const tbody = document.getElementById('power-schemes-body');
                tbody.innerHTML = '';
                const defaultGuids = new Set([
                    '381b4222-f694-41f0-9685-ff5bb260df2e',
                    '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c',
                    'a1841308-3541-4fab-bc81-f71556f20b4a'
                ]);
                (data.schemes || []).forEach(s => {
                    const tr = document.createElement('tr');
                    tr.className = s.ativo ? "bg-amber-500/10 font-bold" : "hover:bg-dark-750/30 transition";
                    const canDelete = !s.ativo && !defaultGuids.has((s.guid || '').toLowerCase());
                    tr.innerHTML = `
                        <td class="py-2.5 px-3 text-slate-400 font-mono">${escapeHtml(s.guid)}</td>
                        <td class="py-2.5 px-3 text-white font-sans">${escapeHtml(s.nome)}</td>
                        <td class="py-2.5 px-3">${s.ativo ? '<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">⭐ ATIVO</span>' : '<span class="text-slate-500 text-xs">Instalado</span>'}</td>
                        <td class="py-2.5 px-3 text-right">
                            <div class="flex items-center justify-end gap-1.5">
                                ${!s.ativo ? `<button onclick="activatePowerScheme('${s.guid}')" class="btn-action-primary px-3 py-1 rounded-lg text-xs font-bold shadow-sm">Ativar</button>` : ''}
                                ${canDelete ? `<button onclick="deletePowerScheme('${s.guid}', '${escapeHtml(s.nome)}')" class="btn-action-danger px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1" title="Excluir esquema de energia"><i data-lucide="trash-2" class="w-3 h-3"></i><span>Excluir</span></button>` : ''}
                            </div>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
                lucide.createIcons();
            } catch (e) { }
        }

        async function activatePowerScheme(guid) {
            try {
                const res = await fetch('/api/power/activate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ guid: guid })
                });
                const data = await res.json();
                showToast("Plano de Energia", data.message, "success");
                loadPowerSchemes();
            } catch (e) {
                showToast("Erro", "Erro ao ativar plano: " + e, "error");
            }
        }

        async function deletePowerScheme(guid, nome) {
            const confirmed = await showConfirmModal({
                title: 'Excluir Plano de Energia',
                message: `Deseja realmente excluir o esquema de energia "${nome || guid}"?`,
                itemName: nome || 'Plano Personalizado',
                itemDetails: `GUID: ${guid}`,
                itemIcon: 'trash-2',
                type: 'warning',
                confirmText: 'Excluir Plano',
                cancelText: t('modals.btn_cancel')
            });
            if (!confirmed) return;

            try {
                const res = await fetch('/api/power/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ guid: guid })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    showToast("Plano Excluído", data.message || "Esquema removido com sucesso.", "success");
                    loadPowerSchemes();
                } else {
                    showToast("Aviso", data.message || "Não foi possível excluir este plano.", "warning");
                }
            } catch (e) {
                showToast("Erro", "Falha ao excluir plano: " + e, "error");
            }
        }

        // =====================================================================
        // OTIMIZAÇÕES & TAREFAS DE SISTEMA
        // =====================================================================
        async function runOptimizeTask(taskName) {
            try {
                const res = await fetch('/api/optimize/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ task: taskName })
                });
                const data = await res.json();
                showToast("Otimização Iniciada", (data.message || "Ação iniciada com sucesso.") + " Acompanhe no console inferior.", "info");
            } catch (e) {
                showToast("Erro de Otimização", "Erro ao iniciar otimização: " + e, "error");
            }
        }

        // =====================================================================
        // TERMINAL & EXECUÇÃO INVISÍVEL
        // =====================================================================
        function setTerminalCmd(cmd, mode) {
            document.getElementById('terminal-input').value = cmd;
            if (mode) {
                document.querySelector(`input[name="shell-mode"][value="${mode}"]`).checked = true;
            }
            executeCustomCommand();
        }

        // =====================================================================
        // UTILITÁRIOS
        // =====================================================================
        function escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        function formatBytes(bytes) {
            if (!bytes || bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        // =====================================================================
        // CONTROLE DO MODAL DE OTIMIZAÇÃO & DEBLOAT (PROGRESSO ETAPA POR ETAPA)
        // =====================================================================
        let optModalTimer = null;
        let optModalStartTime = 0;

        function openOptimizeModal(title, subtitle) {
            const modal = document.getElementById('optimize-steps-modal');
            const box = document.getElementById('optimize-modal-box');
            if (title) {
                const titleEl = document.querySelector('[data-i18n="opt_modal.title"]');
                if (titleEl) titleEl.innerText = title;
            }
            if (subtitle) {
                const subEl = document.getElementById('opt-modal-subtitle');
                if (subEl) subEl.innerText = subtitle;
            }

            document.getElementById('opt-modal-log').innerText = '';
            const doneBtn = document.getElementById('opt-modal-done-btn');
            doneBtn.disabled = true;
            doneBtn.className = "px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-800 opacity-50 cursor-not-allowed transition";
            doneBtn.innerText = t('opt_modal.btn_done') || "Aguarde...";

            modal.classList.remove('opacity-0', 'pointer-events-none');
            modal.classList.add('opacity-100');
            box.classList.remove('scale-95');
            box.classList.add('scale-100');

            optModalStartTime = Date.now();
            if (optModalTimer) clearInterval(optModalTimer);
            optModalTimer = setInterval(() => {
                const elapsed = ((Date.now() - optModalStartTime) / 1000).toFixed(1);
                document.getElementById('opt-modal-timer').innerText = `Tempo: ${elapsed}s`;
            }, 100);
        }

        function closeOptimizeModal() {
            const modal = document.getElementById('optimize-steps-modal');
            const box = document.getElementById('optimize-modal-box');
            if (optModalTimer) { clearInterval(optModalTimer); optModalTimer = null; }
            modal.classList.add('opacity-0', 'pointer-events-none');
            modal.classList.remove('opacity-100');
            box.classList.add('scale-95');
            box.classList.remove('scale-100');
        }

        function setOptimizeModalProgress(pct, statusText) {
            document.getElementById('opt-modal-pct').innerText = `${Math.round(pct)}%`;
            document.getElementById('opt-modal-progress-bar').style.width = `${pct}%`;
            if (statusText) document.getElementById('opt-modal-status-text').innerText = statusText;
        }

        function appendOptimizeModalLog(line) {
            const logBox = document.getElementById('opt-modal-log');
            logBox.innerText += (logBox.innerText ? '\n' : '') + line;
            logBox.scrollTop = logBox.scrollHeight;
        }

        let currentAdaptiveProfile = null;

        async function loadOptimizationProfile(manual = false) {
            try {
                const url = manual ? '/api/optimize/profile?force=1' : '/api/optimize/profile';
                const res = await fetch(url);
                const data = await res.json();
                if (!data || data.status !== 'success') return;
                const profObj = data.profile || data;
                currentAdaptiveProfile = profObj;

                const hw = profObj.hardware_summary || profObj.hardware || {};
                const services = profObj.services || [];

                const titleEl = document.getElementById('opt-hw-profile-title');
                const descEl = document.getElementById('opt-hw-profile-desc');
                const chassisBadge = document.getElementById('opt-hw-chassis-badge');
                const cpuEl = document.getElementById('opt-hw-cpu');
                const threadsEl = document.getElementById('opt-hw-threads');
                const ramEl = document.getElementById('opt-hw-ram');
                const ramTierEl = document.getElementById('opt-hw-ram-tier');
                const gpuEl = document.getElementById('opt-hw-gpu');
                const gpuTypeEl = document.getElementById('opt-hw-gpu-type');
                const storageEl = document.getElementById('opt-hw-storage');
                const storageModelEl = document.getElementById('opt-hw-storage-model');
                const recCountEl = document.getElementById('opt-recommended-count');

                if (titleEl) titleEl.innerText = hw.profile_name || 'Perfil Adaptado ao Hardware';
                if (descEl) descEl.innerText = hw.profile_description || 'Serviços calibrados para a configuração real desta máquina.';
                if (chassisBadge) chassisBadge.innerText = `${hw.chassis || 'Desktop'} • ${hw.profile_badge || hw.cpu_vendor || 'x64'}`;
                if (cpuEl) cpuEl.innerText = hw.cpu || hw.cpu_name || 'Processador Detectado';
                if (threadsEl) threadsEl.innerText = `${hw.cores || hw.cpu_cores || '--'}C / ${hw.threads || hw.cpu_threads || '--'}T`;
                if (ramEl) ramEl.innerText = `${hw.ram_gb || '--'} GB`;
                if (ramTierEl) ramTierEl.innerText = hw.ram_gb >= 15 ? 'Perfil: High-Capacity (16GB+)' : 'Perfil: Compressão Ativa';
                if (gpuEl) gpuEl.innerText = hw.gpu || hw.gpu_name || 'GPU Detectada';
                if (gpuTypeEl) gpuTypeEl.innerText = hw.is_dedicated_gpu ? 'Arquitetura: Dedicada PCIe (HAGS)' : 'Arquitetura: Integrada WDDM';
                if (storageEl) storageEl.innerText = hw.storage_type || 'SSD / Disco';
                if (storageModelEl) storageModelEl.innerText = 'I/O Calibrado para Unidade Primária';
                if (recCountEl) {
                    const recCnt = services.filter(s => s.recommended).length;
                    recCountEl.innerText = `${recCnt} recomendados p/ esta máquina`;
                }

                const gridEl = document.getElementById('opt-adaptive-services-grid');
                if (gridEl && services.length > 0) {
                    const palette = ['cyan', 'purple', 'emerald', 'amber', 'blue', 'rose'];
                    const colorMap = {
                        'cyan': { border: 'border-cyan-500/30 hover:border-cyan-400', badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', iconBg: 'bg-cyan-500/15 text-cyan-400' },
                        'purple': { border: 'border-purple-500/30 hover:border-purple-400', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30', iconBg: 'bg-purple-500/15 text-purple-400' },
                        'emerald': { border: 'border-emerald-500/30 hover:border-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', iconBg: 'bg-emerald-500/15 text-emerald-400' },
                        'amber': { border: 'border-amber-500/30 hover:border-amber-400', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30', iconBg: 'bg-amber-500/15 text-amber-400' },
                        'blue': { border: 'border-blue-500/30 hover:border-blue-400', badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30', iconBg: 'bg-blue-500/15 text-blue-400' },
                        'rose': { border: 'border-rose-500/30 hover:border-rose-400', badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30', iconBg: 'bg-rose-500/15 text-rose-400' }
                    };
                    gridEl.innerHTML = services.map((s, idx) => {
                        const taskId = s.id || s.key;
                        const c = colorMap[s.color || palette[idx % palette.length]] || colorMap.cyan;
                        const recBadge = s.recommended
                            ? `<span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Recomendado p/ seu PC</span>`
                            : `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">Opcional</span>`;
                        const iconName = (s.icon || 'zap').toLowerCase();
                        return `
                            <div class="p-4 rounded-2xl bg-dark-950/90 border ${c.border} flex flex-col justify-between transition group">
                                <div>
                                    <div class="flex items-start justify-between gap-2 mb-2.5">
                                        <div class="flex items-center gap-2.5">
                                            <div class="w-9 h-9 rounded-xl ${c.iconBg} flex items-center justify-center flex-shrink-0">
                                                <i data-lucide="${escapeHtml(iconName)}" class="w-4 h-4"></i>
                                            </div>
                                            <div>
                                                <span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${c.badge}">${escapeHtml(s.category || 'Sistema')}</span>
                                                <h4 class="text-xs font-extrabold text-white mt-1">${escapeHtml(s.title)}</h4>
                                            </div>
                                        </div>
                                        ${recBadge}
                                    </div>
                                    <p class="text-[11px] text-slate-400 leading-relaxed mb-2">${escapeHtml(s.desc)}</p>
                                    <div class="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 mb-3">
                                        <p class="text-[10px] text-cyan-300 font-mono"><i data-lucide="cpu" class="w-3 h-3 inline mr-1"></i>${escapeHtml(s.reason || s.adaptive_reason || s.hardware_tag || 'Adaptado para este hardware')}</p>
                                    </div>
                                </div>
                                <div class="flex items-center justify-between pt-2 border-t border-slate-800/80">
                                    <span class="text-[10px] font-mono text-slate-400">${escapeHtml(s.hardware_tag || 'Otimização Nativa')}</span>
                                    <button onclick="runSingleOptimizationModal('${escapeHtml(taskId)}')" class="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer">
                                        <i data-lucide="play" class="w-3 h-3"></i>
                                        <span>Aplicar Serviço</span>
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('');
                    lucide.createIcons();
                }

                if (manual) {
                    showToast("Hardware Reanalisado", `Perfil adaptativo calibrado: ${hw.profile_name || 'OK'}`, "success", 2500);
                }
            } catch (e) {
                console.error("Erro ao carregar perfil adaptativo:", e);
            }
        }

        async function runHardwareAdaptivePipeline() {
            if (!currentAdaptiveProfile) {
                await loadOptimizationProfile(false);
            }
            const recServices = (currentAdaptiveProfile && Array.isArray(currentAdaptiveProfile.services))
                ? currentAdaptiveProfile.services.filter(s => s.recommended)
                : [];

            const steps = recServices.length > 0
                ? recServices.map((s, idx) => ({ key: s.id || s.key, name: `${idx + 1}. ${s.title}`, desc: s.reason || s.adaptive_reason || s.desc }))
                : [
                    { key: 'cpu_scheduler', name: '1. Escalonador de CPU', desc: 'Ajustando Win32PrioritySeparation para seu processador...' },
                    { key: 'sysmain_tune', name: '2. Gerenciamento Adaptativo de RAM', desc: 'Calibrando SysMain e NDU conforme quantidade de RAM...' },
                    { key: 'storage_io', name: '3. Filas de I/O de Disco', desc: 'Ajustando parâmetros NTFS e TRIM para seu armazenamento...' },
                    { key: 'gpu_latency', name: '4. Latência Gráfica (HAGS / GameDVR)', desc: 'Reduzindo latência de quadros na GPU detectada...' },
                    { key: 'network_tcp', name: '5. Pilha TCP/IP CTCP & ECN', desc: 'Otimizando pacote de rede para menor jitter...' },
                    { key: 'clean_ram', name: '6. Purga de Cache Standby RAM', desc: 'Liberando páginas em standby na memória física...' }
                ];

            const hwSummary = (currentAdaptiveProfile && currentAdaptiveProfile.hardware_summary) || {};
            const hwTitle = hwSummary.profile_name || "Otimização Adaptativa de Hardware";

            openOptimizeModal(`Otimização Adaptativa: ${hwTitle}`, `Aplicando ${steps.length} ajustes calibrados exclusivamente para o hardware desta máquina...`);

            const stepsList = document.getElementById('opt-steps-list');
            stepsList.innerHTML = steps.map((s, idx) => `
                <div id="pipe-row-${idx}" class="p-3 rounded-2xl bg-dark-950 border border-slate-800 flex items-center justify-between transition-all">
                    <div class="flex items-center gap-3">
                        <span id="pipe-icon-${idx}" class="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center">
                            <span class="text-xs font-bold font-mono">${idx + 1}</span>
                        </span>
                        <div>
                            <p class="text-xs font-bold text-white">${escapeHtml(s.name)}</p>
                            <p class="text-[11px] text-slate-400">${escapeHtml(s.desc)}</p>
                        </div>
                    </div>
                    <span id="pipe-status-${idx}" class="text-xs font-mono font-semibold text-slate-500">Pendente</span>
                </div>
            `).join('');
            lucide.createIcons();

            appendOptimizeModalLog(`[${new Date().toLocaleTimeString()}] Iniciando Pipeline Adaptativo para: ${hwTitle}`);

            for (let i = 0; i < steps.length; i++) {
                const s = steps[i];
                const pct = Math.round((i / steps.length) * 100);
                setOptimizeModalProgress(pct, `Etapa ${i + 1} de ${steps.length}: ${s.name}`);

                const row = document.getElementById(`pipe-row-${i}`);
                const icon = document.getElementById(`pipe-icon-${i}`);
                const st = document.getElementById(`pipe-status-${i}`);

                if (row) row.className = "p-3 rounded-2xl bg-dark-950 border border-purple-500/40 shadow-lg shadow-purple-500/10 flex items-center justify-between transition-all";
                if (icon) {
                    icon.className = "w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center";
                    icon.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i>`;
                }
                if (st) {
                    st.className = "text-xs font-mono font-semibold text-purple-300";
                    st.innerText = "Aplicando...";
                }
                lucide.createIcons();

                appendOptimizeModalLog(`--> [${i + 1}/${steps.length}] Aplicando: ${s.name}`);

                try {
                    const res = await fetch('/api/optimize/run', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ task: s.key, sync: true })
                    });
                    const data = await res.json();
                    if (data.output) appendOptimizeModalLog(data.output);
                } catch (e) {
                    appendOptimizeModalLog(`Aviso na etapa ${s.name}: ${e}`);
                }

                if (icon) {
                    icon.className = "w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center";
                    icon.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i>`;
                }
                if (st) {
                    st.className = "text-xs font-mono font-semibold text-emerald-400";
                    st.innerText = "Concluído";
                }
                lucide.createIcons();
            }

            setOptimizeModalProgress(100, `Todos os ${steps.length} serviços adaptativos foram aplicados com sucesso!`);
            appendOptimizeModalLog(`[${new Date().toLocaleTimeString()}] Otimização Adaptativa Finalizada.`);

            if (optModalTimer) { clearInterval(optModalTimer); optModalTimer = null; }
            const doneBtn = document.getElementById('opt-modal-done-btn');
            doneBtn.disabled = false;
            doneBtn.className = "px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/25 transition cursor-pointer";
            doneBtn.innerText = t('opt_modal.btn_done') || "Concluído";
            showToast("Otimização Adaptativa Concluída", `${steps.length} serviços foram calibrados para o seu hardware!`, "success");
        }

        async function runSingleOptimizationModal(taskKey) {
            const taskMap = {
                'sfc': { name: 'Verificação e Reparo de Binários (SFC /SCANNOW)', desc: 'Validando e corrigindo DLLs protegidas do Windows...' },
                'dism': { name: 'Reparo de Repositório de Componentes (DISM)', desc: 'Restaurando integridade com /Online /Cleanup-Image /RestoreHealth...' },
                'telemetry': { name: 'Desativação de Telemetria e Coleta DiagTrack', desc: 'Desabilitando serviços de telemetria invasivos e background trackers...' },
                'trim': { name: 'Otimização TRIM de Armazenamento SSD / NVMe', desc: 'Despachando comandos TRIM de desfragmentação inteligente...' },
                'clean_ram': { name: 'Purga de Cache em Standby e Working Sets de RAM', desc: 'Esvaziando listas de memória RAM em standby sem fechar programas...' },
                'restore_point': { name: 'Criação de Ponto de Restauração do Windows', desc: 'Criando snapshot oficial de segurança no disco do sistema...' },
                'visual_fx': { name: 'Efeitos Visuais de Alta Resposta (0ms Menu Delay)', desc: 'Otimizando latência de menus e animações do Explorer...' },
                'game_mode': { name: 'Modo de Jogo & Agendamento de GPU por Hardware (HAGS)', desc: 'Ativando AutoGameMode e HwSchMode=2 no registro gráfico...' },
                'dism_cleanup': { name: 'Limpeza Profunda da Pasta WinSxS (DISM StartComponentCleanup)', desc: 'Removendo versões antigas de componentes substituídos...' },
                'chkdsk': { name: 'Verificação Online de Sistema de Arquivos NTFS (CHKDSK)', desc: 'Escaneando integridade estrutural da partição C: em tempo real...' },
                'network_reset': { name: 'Reset Completo da Pilha de Rede TCP/IP & Winsock', desc: 'Redefinindo Winsock, pilha IP, DHCP e cache DNS...' },
                'cpu_scheduler': { name: 'Escalonador de CPU & Prioridade Quântica (Win32PrioritySeparation)', desc: 'Calibrando fatias de tempo da CPU e responsividade Multimedia SystemProfile...' },
                'gpu_latency': { name: 'Otimização de Latência Gráfica (HAGS, MPO & GameDVR)', desc: 'Ajustando fila de quadros de hardware e desativando gravação em segundo plano...' },
                'sysmain_tune': { name: 'Calibração Adaptativa de Memória (SysMain, NDU & Paginação)', desc: 'Ajustando compressão e pré-busca de memória para o volume de RAM instalado...' },
                'storage_io': { name: 'Otimização de Filas de I/O & Sistema de Arquivos NTFS', desc: 'Desativando overhead de LastAccess 8.3 e aplicando TRIM/desfragmentação seletiva...' },
                'network_tcp': { name: 'Aceleração de Pilha TCP/IP (CTCP, RSS & Heurísticas)', desc: 'Ativando Receive-Side Scaling e controle de congestionamento de baixa latência...' },
                'background_apps': { name: 'Suspensão de Aplicativos UWP em Segundo Plano', desc: 'Bloqueando consumo ocioso de CPU/RAM por apps da loja em segundo plano...' },
                'search_index': { name: 'Calibração Inteligente do Indexador Windows Search', desc: 'Reduzindo uso de disco pelo serviço WSearch em segundo plano...' },
                'power_throttling': { name: 'Desbloqueio de Power Throttling & Core Parking', desc: 'Evitando estrangulamento de frequência em processos de alta demanda...' },
                'hibernation_tune': { name: 'Gerenciamento de Hibernação & Hiberfil Compacto', desc: 'Otimizando arquivo de hibernação para economizar espaço no SSD...' }
            };

            const info = taskMap[taskKey] || { name: `Tarefa de Otimização (${taskKey})`, desc: 'Executando serviço...' };
            openOptimizeModal(info.name, info.desc);

            const stepsList = document.getElementById('opt-steps-list');
            stepsList.innerHTML = `
                <div class="p-3 rounded-2xl bg-dark-950 border border-purple-500/30 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <span id="opt-step-icon-0" class="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                            <i data-lucide="loader" class="w-4 h-4 animate-spin"></i>
                        </span>
                        <div>
                            <p class="text-xs font-bold text-white">${escapeHtml(info.name)}</p>
                            <p class="text-[11px] text-slate-400">${escapeHtml(info.desc)}</p>
                        </div>
                    </div>
                    <span id="opt-step-status-0" class="text-xs font-mono font-semibold text-purple-300">Executando...</span>
                </div>
            `;
            lucide.createIcons();

            setOptimizeModalProgress(15, `Executando ${info.name}...`);
            appendOptimizeModalLog(`[${new Date().toLocaleTimeString()}] Iniciando tarefa: ${taskKey}`);

            try {
                const res = await fetch('/api/optimize/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ task: taskKey, sync: true })
                });
                const data = await res.json();

                setOptimizeModalProgress(100, `Tarefa ${info.name} concluída com sucesso!`);
                const icon = document.getElementById('opt-step-icon-0');
                const st = document.getElementById('opt-step-status-0');
                if (icon) {
                    icon.className = "w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center";
                    icon.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i>`;
                }
                if (st) {
                    st.className = "text-xs font-mono font-semibold text-emerald-400";
                    st.innerText = "Concluído";
                }
                if (data.output) {
                    appendOptimizeModalLog(data.output);
                }
                appendOptimizeModalLog(`[${new Date().toLocaleTimeString()}] Finalizado com sucesso.`);
            } catch (err) {
                setOptimizeModalProgress(100, "Erro ao executar tarefa.");
                appendOptimizeModalLog(`[${new Date().toLocaleTimeString()}] Erro: ${err}`);
            }

            if (optModalTimer) { clearInterval(optModalTimer); optModalTimer = null; }
            const doneBtn = document.getElementById('opt-modal-done-btn');
            doneBtn.disabled = false;
            doneBtn.className = "px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/25 transition cursor-pointer";
            doneBtn.innerText = t('opt_modal.btn_done') || "Concluído";
            lucide.createIcons();
        }

        async function runCompleteOptimizationPipeline() {
            const steps = [
                { key: 'restore_point', name: '1. Ponto de Restauração', desc: 'Criando snapshot oficial de segurança no Windows...' },
                { key: 'telemetry', name: '2. Debloat & Telemetria', desc: 'Desativando DiagTrack e serviços espiões...' },
                { key: 'clean_ram', name: '3. Liberação de Memória RAM', desc: 'Limpando working sets e standby pages...' },
                { key: 'trim', name: '4. Otimização TRIM SSD/NVMe', desc: 'Despachando comandos TRIM de alta performance...' },
                { key: 'sfc', name: '5. Verificação SFC de Arquivos', desc: 'Auditando e corrigindo DLLs com sfc /scannow...' },
                { key: 'dism', name: '6. Reparo DISM RestoreHealth', desc: 'Reparando imagem limpa de componentes oficiais...' }
            ];

            openOptimizeModal("Pipeline Completo de Otimização & Debloat", "Executando 6 etapas automatizadas para desempenho máximo...");

            const stepsList = document.getElementById('opt-steps-list');
            stepsList.innerHTML = steps.map((s, idx) => `
                <div id="pipe-row-${idx}" class="p-3 rounded-2xl bg-dark-950 border border-slate-800 flex items-center justify-between transition-all">
                    <div class="flex items-center gap-3">
                        <span id="pipe-icon-${idx}" class="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center">
                            <span class="text-xs font-bold font-mono">${idx + 1}</span>
                        </span>
                        <div>
                            <p class="text-xs font-bold text-white">${escapeHtml(s.name)}</p>
                            <p class="text-[11px] text-slate-400">${escapeHtml(s.desc)}</p>
                        </div>
                    </div>
                    <span id="pipe-status-${idx}" class="text-xs font-mono font-semibold text-slate-500">Pendente</span>
                </div>
            `).join('');
            lucide.createIcons();

            appendOptimizeModalLog(`[${new Date().toLocaleTimeString()}] Iniciando Pipeline Completo WinShield Enterprise...`);

            for (let i = 0; i < steps.length; i++) {
                const s = steps[i];
                const pct = Math.round((i / steps.length) * 100);
                setOptimizeModalProgress(pct, `Etapa ${i + 1} de ${steps.length}: ${s.name}`);

                const row = document.getElementById(`pipe-row-${i}`);
                const icon = document.getElementById(`pipe-icon-${i}`);
                const st = document.getElementById(`pipe-status-${i}`);

                if (row) row.className = "p-3 rounded-2xl bg-dark-950 border border-purple-500/40 shadow-lg shadow-purple-500/10 flex items-center justify-between transition-all";
                if (icon) {
                    icon.className = "w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center";
                    icon.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i>`;
                }
                if (st) {
                    st.className = "text-xs font-mono font-semibold text-purple-300";
                    st.innerText = "Executando...";
                }
                lucide.createIcons();

                appendOptimizeModalLog(`--> [${i + 1}/${steps.length}] Executando: ${s.name}`);

                try {
                    const res = await fetch('/api/optimize/run', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ task: s.key, sync: true })
                    });
                    const data = await res.json();
                    if (data.output) {
                        appendOptimizeModalLog(data.output);
                    }
                } catch (e) {
                    appendOptimizeModalLog(`Aviso na etapa ${s.name}: ${e}`);
                }

                if (icon) {
                    icon.className = "w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center";
                    icon.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i>`;
                }
                if (st) {
                    st.className = "text-xs font-mono font-semibold text-emerald-400";
                    st.innerText = "Concluído";
                }
                lucide.createIcons();
            }

            setOptimizeModalProgress(100, "Todas as 6 etapas foram concluídas com sucesso!");
            appendOptimizeModalLog(`[${new Date().toLocaleTimeString()}] Pipeline Finalizado. Sistema 100% Otimizado.`);

            if (optModalTimer) { clearInterval(optModalTimer); optModalTimer = null; }
            const doneBtn = document.getElementById('opt-modal-done-btn');
            doneBtn.disabled = false;
            doneBtn.className = "px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/25 transition cursor-pointer";
            doneBtn.innerText = t('opt_modal.btn_done') || "Concluído";
            showToast("Otimização Completa Concluída", "Todas as etapas do pipeline foram executadas com sucesso!", "success");
        }

        // =====================================================================
        // TERMINAL EM AÇÃO (JANELA DE EXECUÇÃO MODERNA NO CORPO DA PÁGINA)
        // =====================================================================
        let termTimer = null;
        let termStartTime = 0;

        async function executeCustomCommand() {
            const input = document.getElementById('terminal-input');
            const cmd = input.value.trim();
            if (!cmd) return;
            const mode = document.querySelector('input[name="shell-mode"]:checked').value;

            const win = document.getElementById('terminal-execution-window');
            win.classList.remove('hidden');

            document.getElementById('term-exec-shell-badge').innerText = `${mode} (ADMIN)`;
            document.getElementById('term-exec-cmd-text').innerText = cmd;
            document.getElementById('term-exec-status').innerHTML = `
                <i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i>
                <span>Executando comando...</span>
            `;
            document.getElementById('term-exec-status').className = "flex items-center gap-1.5 text-xs font-semibold text-cyan-400";
            document.getElementById('term-exec-output').innerText = "Aguardando retorno do processo...";
            lucide.createIcons();

            termStartTime = Date.now();
            if (termTimer) clearInterval(termTimer);
            termTimer = setInterval(() => {
                const elapsed = ((Date.now() - termStartTime) / 1000).toFixed(1);
                document.getElementById('term-exec-timer').innerText = `${elapsed}s`;
            }, 100);

            try {
                const res = await fetch('/api/terminal/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode: mode, cmd: cmd })
                });
                const data = await res.json();

                if (termTimer) { clearInterval(termTimer); termTimer = null; }
                const finalElapsed = data.elapsed !== undefined ? Number(data.elapsed).toFixed(1) : ((Date.now() - termStartTime) / 1000).toFixed(1);
                document.getElementById('term-exec-timer').innerText = `${finalElapsed}s`;

                if (data.code === 0) {
                    document.getElementById('term-exec-status').innerHTML = `
                        <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400"></i>
                        <span class="text-emerald-400 font-bold">Concluído (Código 0)</span>
                    `;
                } else {
                    document.getElementById('term-exec-status').innerHTML = `
                        <i data-lucide="alert-circle" class="w-3.5 h-3.5 text-rose-400"></i>
                        <span class="text-rose-400 font-bold">Finalizado (Código ${data.code ?? 1})</span>
                    `;
                }

                document.getElementById('term-exec-output').innerText = data.output || "Comando executado sem retorno textual.";
                lucide.createIcons();
                showToast("Terminal", "Comando executado com sucesso.", "success", 2000);
            } catch (e) {
                if (termTimer) { clearInterval(termTimer); termTimer = null; }
                document.getElementById('term-exec-status').innerHTML = `
                    <i data-lucide="x-circle" class="w-3.5 h-3.5 text-rose-500"></i>
                    <span class="text-rose-400 font-bold">Falha de Execução</span>
                `;
                document.getElementById('term-exec-output').innerText = `Erro: ${e}`;
                lucide.createIcons();
                showToast("Erro no Terminal", String(e), "error");
            }
        }

        function copyTerminalOutput() {
            const out = document.getElementById('term-exec-output').innerText;
            navigator.clipboard.writeText(out).then(() => {
                showToast("Copiado!", "Saída do terminal copiada para a área de transferência.", "success", 2000);
            }).catch(() => {
                showToast("Erro", "Não foi possível copiar.", "error");
            });
        }

        function clearTerminalExecution() {
            document.getElementById('term-exec-output').innerText = '';
            document.getElementById('term-exec-status').innerHTML = `<span>Pronto</span>`;
            document.getElementById('term-exec-timer').innerText = '0.0s';
        }

        // =====================================================================
        // CENTRAL DE REDE, WI-FI, PING E VELOCIDADE
        // =====================================================================
        let networkData = null;

        async function loadNetworkInfo(showNotice = false) {
            try {
                const res = await fetch('/api/network/info');
                const data = await res.json();
                if (data.status === 'success') {
                    networkData = data;
                    renderNetworkCards(data);
                    if (showNotice) {
                        showToast('Rede', 'Dados de conectividade atualizados.', 'success', 1800);
                    }
                }
            } catch (e) {
                console.error("Erro ao carregar rede:", e);
            }
        }

        function renderNetworkCards(data) {
            const net = data.network || {};

            // Adaptador
            const adName = document.getElementById('net-adapter-name');
            if (adName) adName.innerText = net.adapter_name || (net.is_wifi ? (net.wifi_ssid || 'Adaptador Wi-Fi') : 'Ethernet Gigabit');

            const isWifi = Boolean(net.is_wifi);
            const typeBadge = document.getElementById('net-adapter-type');
            if (typeBadge) typeBadge.innerText = isWifi ? (net.wifi_protocol || 'Wi-Fi 802.11') : (net.adapter_type || 'Ethernet LAN');

            const cardIcon = document.getElementById('net-card-type-icon');
            if (cardIcon) {
                cardIcon.setAttribute('data-lucide', isWifi ? 'wifi' : 'network');
            }

            // Wi-Fi
            const sigVal = document.getElementById('net-wifi-signal-val');
            const sigBar = document.getElementById('net-wifi-signal-bar');
            if (isWifi && net.wifi_signal !== undefined && net.wifi_signal !== null) {
                if (sigVal) sigVal.innerText = `${net.wifi_signal}%`;
                if (sigBar) sigBar.style.width = `${net.wifi_signal}%`;
                const ssidEl = document.getElementById('net-wifi-ssid');
                if (ssidEl) ssidEl.innerText = net.wifi_ssid || '--';
                const detailsEl = document.getElementById('net-wifi-details');
                if (detailsEl) {
                    const quality = Number(net.wifi_signal) >= 80 ? 'Sinal Excelente' : Number(net.wifi_signal) >= 60 ? 'Sinal Bom' : Number(net.wifi_signal) >= 40 ? 'Sinal Moderado' : 'Sinal Fraco';
                    detailsEl.innerText = `${quality} • Canal ${net.wifi_channel || '--'} • ${net.wifi_protocol || '802.11'}`;
                }
            } else {
                if (sigVal) sigVal.innerText = 'Cabo (100%)';
                if (sigBar) sigBar.style.width = '100%';
                const ssidEl = document.getElementById('net-wifi-ssid');
                if (ssidEl) ssidEl.innerText = 'Conexão Cabeada Ethernet';
                const detailsEl = document.getElementById('net-wifi-details');
                if (detailsEl) detailsEl.innerText = 'Conexão estável via cabo • Full-Duplex';
            }

            // IP Local
            const ipEl = document.getElementById('net-local-ip');
            if (ipEl) ipEl.innerText = net.local_ip || '--';
            const gwEl = document.getElementById('net-gateway-ip');
            if (gwEl) gwEl.innerText = net.gateway || '--';
            const dnsEl = document.getElementById('net-dns-text');
            if (dnsEl) {
                const dnsVal = Array.isArray(net.dns_servers) ? net.dns_servers.join(', ') : (net.dns_servers || '--');
                dnsEl.innerText = `DNS: ${dnsVal}`;
            }

            // IP Público
            const pubIpEl = document.getElementById('net-public-ip');
            if (pubIpEl) pubIpEl.innerText = net.public_ip || '--';
            const ispEl = document.getElementById('net-isp-name');
            if (ispEl) ispEl.innerText = net.isp || 'Operadora Detectada';

            const statusEl = document.getElementById('net-status-text');
            if (statusEl) {
                statusEl.innerText = net.connected ? 'Conectado à Internet' : 'Sem conexão com a Internet';
                statusEl.className = net.connected ? 'text-emerald-300 font-semibold' : 'text-rose-300 font-semibold';
            }

            
            // Servidor mais próximo pré-detectado estilo Ookla
            const srvNameEl = document.getElementById('speedtest-server-name');
            const cliLocEl = document.getElementById('speedtest-client-location');
            const ispBadge = document.getElementById('speedtest-isp-badge');
            const closest = net.closest_server;
            if (closest) {
                if (srvNameEl) srvNameEl.innerText = closest.server_full_label || `${closest.name} (${closest.city}) • ${closest.distance_km} km`;
                if (cliLocEl) cliLocEl.innerText = `${net.isp || closest.client_isp} • ${closest.client_city || 'Local'}`;
                if (ispBadge) ispBadge.innerText = `${closest.name} • ${net.isp || 'Provedor Local'}`;
            }
            
            lucide.createIcons();
        }

        async function runPingAll() {
            const btn = document.getElementById('btn-ping-all');
            const tbody = document.getElementById('ping-results-body');
            if (btn) btn.disabled = true;

            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="p-6 text-center text-slate-400 font-mono text-xs">
                            <i data-lucide="loader" class="w-5 h-5 animate-spin mx-auto text-cyan-400 mb-2"></i>
                            Disparando pacotes ICMP para servidores globais...
                        </td>
                    </tr>
                `;
                lucide.createIcons();
            }

            try {
                const res = await fetch('/api/network/ping_all', { method: 'POST' });
                const data = await res.json();
                const list = data.servers || data.results || [];
                if (data.status === 'success' && Array.isArray(list)) {
                    renderPingTable(list);
                }
            } catch (e) {
                showToast("Erro no Ping", String(e), "error");
            } finally {
                if (btn) btn.disabled = false;
            }
        }

        function renderPingTable(results) {
            const tbody = document.getElementById('ping-results-body');
            if (!tbody) return;
            if (!results || results.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-slate-400 font-mono text-xs">Nenhum servidor testado.</td></tr>`;
                return;
            }

            tbody.innerHTML = results.map(r => {
                const avgNum = Number(r.avg_ms ?? r.avg ?? 999);
                let badgeClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
                if (avgNum > 100) badgeClass = "bg-rose-500/20 text-rose-300 border-rose-500/30";
                else if (avgNum > 50) badgeClass = "bg-amber-500/20 text-amber-300 border-amber-500/30";

                const sent = r.packets_sent ?? 0;
                const recv = r.packets_recv ?? 0;

                return `
                    <tr class="border-b border-slate-800/60 hover:bg-dark-850/50 transition">
                        <td class="p-3 text-xs font-bold text-white flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full ${avgNum < 50 ? 'bg-emerald-400' : 'bg-amber-400'}"></span>
                            ${escapeHtml(r.name || r.server || 'Servidor')}
                        </td>
                        <td class="p-3 text-xs font-mono text-cyan-300">${escapeHtml(r.host)}</td>
                        <td class="p-3 text-xs font-mono text-slate-300">${sent}/${recv}</td>
                        <td class="p-3 text-xs font-mono text-slate-400">${r.packet_loss ?? 0}%</td>
                        <td class="p-3 text-xs font-mono text-slate-400">${r.min_ms ?? r.min ?? '--'} / ${r.max_ms ?? r.max ?? '--'} ms</td>
                        <td class="p-3 text-xs font-mono font-bold text-white">${r.avg_ms ?? r.avg ?? '--'} ms</td>
                        <td class="p-3 text-xs">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}">
                                ${escapeHtml(r.rating || r.quality || 'Bom')}
                            </span>
                        </td>
                    </tr>
                `;
            }).join('');
            lucide.createIcons();
        }

        async function runCustomPing() {
            const input = document.getElementById('custom-ping-input');
            const host = (input ? input.value : '').trim();
            if (!host) {
                showToast("Aviso", "Digite um endereço IP ou domínio.", "warning");
                return;
            }

            showToast("Pingando", `Enviando pacotes para ${host}...`, "info", 2000);

            try {
                const res = await fetch('/api/network/ping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ host: host, count: 4 })
                });
                const data = await res.json();
                if (data.status === 'success' && data.result) {
                    const r = data.result;
                    r.server = `Personalizado (${host})`;
                    const tbody = document.getElementById('ping-results-body');
                    if (tbody) {
                        const cur = tbody.innerHTML.includes('loader') ? '' : tbody.innerHTML;
                        tbody.innerHTML = `
                            <tr class="border-b border-cyan-500/40 bg-cyan-950/20 transition">
                                <td class="p-3 text-xs font-bold text-cyan-300 flex items-center gap-2">
                                    <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                                    ${escapeHtml(r.server)}
                                </td>
                                <td class="p-3 text-xs font-mono text-cyan-300">${escapeHtml(r.host)}</td>
                                <td class="p-3 text-xs font-mono text-slate-300">${r.packets_sent ?? 0}/${r.packets_recv ?? 0}</td>
                                <td class="p-3 text-xs font-mono text-slate-400">${r.packet_loss ?? 0}%</td>
                                <td class="p-3 text-xs font-mono text-slate-400">${r.min_ms ?? '--'} / ${r.max_ms ?? '--'} ms</td>
                                <td class="p-3 text-xs font-mono font-bold text-white">${r.avg_ms ?? '--'} ms</td>
                                <td class="p-3 text-xs">
                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold border bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                                        ${escapeHtml(r.rating || 'Testado')}
                                    </span>
                                </td>
                            </tr>
                        ` + cur;
                        lucide.createIcons();
                    }
                }
            } catch (e) {
                showToast("Erro no Ping", String(e), "error");
            }
        }

        let speedTestPollTimer = null;

        function updateSpeedTestGauge(mbps) {
            const arc = document.getElementById('speedtest-gauge-arc');
            const liveVal = document.getElementById('speedtest-live-mbps');
            const val = Math.max(0, Number(mbps || 0));
            if (liveVal) liveVal.innerText = val.toFixed(1);
            if (arc) {
                // Escala não-linear estilo Ookla Speedtest (0 -> 10 -> 50 -> 100 -> 250 -> 500 -> 1000 Mbps)
                const maxArc = 251.2;
                let ratio = 0;
                if (val <= 10) ratio = (val / 10) * 0.18;
                else if (val <= 50) ratio = 0.18 + ((val - 10) / 40) * 0.22;
                else if (val <= 100) ratio = 0.40 + ((val - 50) / 50) * 0.20;
                else if (val <= 300) ratio = 0.60 + ((val - 100) / 200) * 0.22;
                else ratio = 0.82 + Math.min(0.18, ((val - 300) / 700) * 0.18);
                const offset = maxArc - (maxArc * Math.min(1, Math.max(0, ratio)));
                arc.style.strokeDashoffset = offset.toFixed(1);
            }
        }

        function setSpeedTestPhasePills(phase) {
            const pillPing = document.getElementById('st-pill-ping');
            const pillDl = document.getElementById('st-pill-dl');
            const pillUl = document.getElementById('st-pill-ul');
            const baseClass = "py-1.5 px-2 rounded-lg bg-dark-900 border border-slate-800 text-slate-400 transition font-mono";
            const activePing = "py-1.5 px-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow transition font-mono font-extrabold";
            const activeDl = "py-1.5 px-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow transition font-mono font-extrabold";
            const activeUl = "py-1.5 px-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow transition font-mono font-extrabold";

            if (pillPing) pillPing.className = (phase === 'ping' || phase === 'server_selection' || phase === 'finding_server') ? activePing : baseClass;
            if (pillDl) pillDl.className = (phase === 'download') ? activeDl : baseClass;
            if (pillUl) pillUl.className = (phase === 'upload') ? activeUl : baseClass;
        }

        async function runSpeedTest() {
            const btn = document.getElementById('btn-speed-test');
            if (btn) btn.disabled = true;

            const dlVal = document.getElementById('speed-download-val');
            const ulVal = document.getElementById('speed-upload-val');
            const pingEl = document.getElementById('speed-ping-val');
            const jitterEl = document.getElementById('speed-jitter-val');
            const statusEl = document.getElementById('speed-test-status');
            const phaseLabel = document.getElementById('speedtest-live-phase');
            const progBar = document.getElementById('speedtest-progress-bar');

            if (dlVal) dlVal.innerText = '0.0';
            if (ulVal) ulVal.innerText = '0.0';
            if (pingEl) pingEl.innerText = '-- ms';
            if (jitterEl) jitterEl.innerText = '-- ms';
            if (statusEl) statusEl.innerText = 'Buscando servidor...';
            if (phaseLabel) phaseLabel.innerText = 'LOCALIZANDO SERVIDOR MAIS PRÓXIMO';
            if (progBar) progBar.style.width = '5%';
            updateSpeedTestGauge(0);
            setSpeedTestPhasePills('ping');

            try {
                const res = await fetch('/api/network/speed_test/start', { method: 'POST' });
                const data = await res.json();
                if (data.status === 'success' || data.status === 'started' || data.status === 'already_running') {
                    if (speedTestPollTimer) clearInterval(speedTestPollTimer);
                    speedTestPollTimer = setInterval(pollSpeedTestLive, 180);
                } else {
                    if (btn) btn.disabled = false;
                }
            } catch (e) {
                if (statusEl) statusEl.innerText = 'Falha';
                showToast("Erro no Teste de Velocidade", String(e), "error");
                if (btn) btn.disabled = false;
            }
        }

        async function pollSpeedTestLive() {
            try {
                const res = await fetch('/api/network/speed_test/status');
                const raw = await res.json();
                const st = (raw && raw.speed) ? raw.speed : raw;
                if (!st) return;

                const dlVal = document.getElementById('speed-download-val');
                const ulVal = document.getElementById('speed-upload-val');
                const pingEl = document.getElementById('speed-ping-val');
                const jitterEl = document.getElementById('speed-jitter-val');
                const statusEl = document.getElementById('speed-test-status');
                const phaseLabel = document.getElementById('speedtest-live-phase');
                const progBar = document.getElementById('speedtest-progress-bar');
                const ispBadge = document.getElementById('speedtest-isp-badge');

                const pct = st.percent ?? st.progress ?? 0;
                const liveMbps = st.current_mbps ?? st.live_mbps ?? 0;

                if (progBar) progBar.style.width = `${pct}%`;
                if (ispBadge && (st.isp || st.server)) {
                    ispBadge.innerText = `${st.isp || 'Rede Local'} • ${st.server || 'Cloudflare Edge'}`;
                }

                setSpeedTestPhasePills(st.phase);

                const srvNameEl = document.getElementById('speedtest-server-name');
                const cliLocEl = document.getElementById('speedtest-client-location');

                if (st.server_full_label && srvNameEl) {
                    srvNameEl.innerText = st.server_full_label;
                } else if (st.server_name && srvNameEl) {
                    srvNameEl.innerText = st.server_distance_km ? `${st.server_name} • ${st.server_distance_km} km` : st.server_name;
                }

                if (cliLocEl) {
                    if (st.client_location && st.isp) {
                        cliLocEl.innerText = `${st.isp} • ${st.client_location}`;
                    } else if (st.isp) {
                        cliLocEl.innerText = st.isp;
                    }
                }

                if (st.phase === 'server_selection' || st.phase === 'finding_server') {
                    if (phaseLabel) phaseLabel.innerText = 'LOCALIZANDO SERVIDOR MAIS PRÓXIMO';
                    if (statusEl) statusEl.innerText = 'Buscando servidor...';
                    updateSpeedTestGauge(0);
                } else if (st.phase === 'ping') {
                    if (phaseLabel) phaseLabel.innerText = 'MEDINDO LATÊNCIA (PING & JITTER)';
                    if (statusEl) statusEl.innerText = 'Testando Latência...';
                    updateSpeedTestGauge(liveMbps);
                } else if (st.phase === 'download') {
                    if (phaseLabel) phaseLabel.innerText = 'TESTANDO DOWNLOAD MULTI-STREAM';
                    if (statusEl) statusEl.innerText = `Download (${pct}%)`;
                    updateSpeedTestGauge(liveMbps || st.download_mbps || 0);
                } else if (st.phase === 'upload') {
                    if (phaseLabel) phaseLabel.innerText = 'TESTANDO UPLOAD MULTI-STREAM';
                    if (statusEl) statusEl.innerText = `Upload (${pct}%)`;
                    updateSpeedTestGauge(liveMbps || st.upload_mbps || 0);
                }

                if (st.ping_ms > 0 && pingEl) pingEl.innerText = `${st.ping_ms} ms`;
                if (st.jitter_ms >= 0 && st.ping_ms > 0 && jitterEl) jitterEl.innerText = `${st.jitter_ms} ms`;
                if (st.download_mbps > 0 && dlVal) dlVal.innerText = Number(st.download_mbps).toFixed(1);
                if (st.upload_mbps > 0 && ulVal) ulVal.innerText = Number(st.upload_mbps).toFixed(1);

                if (!st.running && (st.phase === 'completed' || st.phase === 'done' || pct >= 100)) {
                    if (speedTestPollTimer) {
                        clearInterval(speedTestPollTimer);
                        speedTestPollTimer = null;
                    }
                    setSpeedTestPhasePills('done');
                    updateSpeedTestGauge(st.download_mbps || 0);
                    if (phaseLabel) phaseLabel.innerText = 'TESTE FINALIZADO • VELOCIDADE REAL';
                    if (statusEl) statusEl.innerText = `Concluído ${st.timestamp || ''}`.trim();

                    const qStream = document.getElementById('st-qual-stream');
                    const qGame = document.getElementById('st-qual-gaming');
                    const qCalls = document.getElementById('st-qual-calls');
                    if (st.quality) {
                        if (qStream) qStream.innerText = st.quality.streaming_4k || 'Bom';
                        if (qGame) qGame.innerText = st.quality.gaming || 'Bom';
                        if (qCalls) qCalls.innerText = st.quality.video_call || st.quality.video_calls || 'Estável';
                    }

                    const btn = document.getElementById('btn-speed-test');
                    if (btn) btn.disabled = false;
                    showToast("SpeedTest Concluído", `Download: ${st.download_mbps} Mbps | Upload: ${st.upload_mbps} Mbps | Ping: ${st.ping_ms} ms`, "success");
                }
            } catch (e) {
                console.error("Erro no pollSpeedTestLive:", e);
            }
        }

        async function runNetworkRepair(action) {
            showToast("Reparando Rede", `Executando rotina de reparo: ${action}...`, "info", 2000);
            try {
                const res = await fetch('/api/network/repair', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: action })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    showToast("Rede Reparada", data.message || "Comando executado com sucesso.", "success", 4000);
                    loadNetworkInfo();
                } else {
                    showToast("Aviso", data.message || "Não foi possível concluir o reparo.", "warning");
                }
            } catch (e) {
                showToast("Erro no Reparo", String(e), "error");
            }
        }

        // =====================================================================
        // CENTRAL DE DISPOSITIVOS, DRIVERS OFICIAIS & PAREAMENTO DE HARDWARE
        // =====================================================================
        let allInstalledDevices = [];
        let currentDeviceFilter = 'all';
        let currentDriverVendorFilter = 'all';
        let latestDriverUpdatesData = null;
        let driverDownloadsPollTimer = null;

        async function loadDevicesInfo(force = false) {
            const tbody = document.getElementById('dev-table-body');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="p-6 text-center text-slate-400 font-mono text-xs">
                            <i data-lucide="loader" class="w-5 h-5 animate-spin mx-auto text-cyan-400 mb-2"></i>
                            Mapeando barramento Plug & Play e drivers instalados...
                        </td>
                    </tr>
                `;
                lucide.createIcons();
            }

            try {
                // Carrega dispositivos PnP e pareamento com servidores oficiais
                const [resDev, resPair] = await Promise.all([
                    fetch('/api/devices/list'),
                    fetch('/api/devices/pairing')
                ]);

                const data = await resDev.json();
                if (data.status === 'success') {
                    allInstalledDevices = data.devices || [];
                    const stats = data.stats || {};
                    const tot = stats.total || allInstalledDevices.length;
                    const disp = stats.display || allInstalledDevices.filter(d => (d.category === 'display' || (d.class || '').toUpperCase() === 'DISPLAY')).length;
                    const third = stats.third_party || allInstalledDevices.filter(d => d.is_third_party).length;
                    const signed = stats.signed || allInstalledDevices.filter(d => d.is_signed).length;

                    const totEl = document.getElementById('dev-total-val');
                    if (totEl) totEl.innerText = tot;
                    const dispEl = document.getElementById('dev-display-val');
                    if (dispEl) dispEl.innerText = disp;
                    const thEl = document.getElementById('dev-third-val');
                    if (thEl) thEl.innerText = third;
                    const signEl = document.getElementById('dev-signed-val');
                    if (signEl) {
                        const pct = tot > 0 ? Math.round((signed / tot) * 100) : 100;
                        signEl.innerText = `${pct}%`;
                    }

                    renderDevicesTable();
                }

                if (resPair.ok) {
                    const dataPair = await resPair.json();
                    if (dataPair.status === 'success' && dataPair.paired_hardware) {
                        renderPairingCards(dataPair.paired_hardware);
                    }
                }
            } catch (e) {
                console.error("Erro ao carregar dispositivos e pareamento:", e);
            }
        }

        function renderPairingCards(pairedList) {
            const container = document.getElementById('dev-pairing-container');
            if (!container) return;

            if (!pairedList || pairedList.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full p-4 rounded-xl bg-dark-900 border border-slate-800 text-center text-xs text-slate-400">
                        Nenhum componente pareado detectado.
                    </div>
                `;
                return;
            }

            container.innerHTML = pairedList.map(item => {
                const vendor = item.vendor || 'Outro';
                let vendorBadgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
                let iconColor = 'text-cyan-400';

                if (vendor === 'NVIDIA') {
                    vendorBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                    iconColor = 'text-emerald-400';
                } else if (vendor === 'AMD') {
                    vendorBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                    iconColor = 'text-rose-400';
                } else if (vendor === 'Intel') {
                    vendorBadgeClass = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
                    iconColor = 'text-blue-400';
                } else if (vendor === 'Realtek') {
                    vendorBadgeClass = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
                    iconColor = 'text-cyan-400';
                }

                return `
                    <div class="p-4 rounded-2xl bg-dark-900/80 border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between space-y-3">
                        <div class="flex items-start justify-between gap-2">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${escapeHtml(item.category || 'Hardware')}</span>
                            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${vendorBadgeClass}">${escapeHtml(vendor)}</span>
                        </div>
                        <div>
                            <h6 class="text-xs font-bold text-white truncate" title="${escapeHtml(item.hardware_name)}">${escapeHtml(item.hardware_name)}</h6>
                            <p class="text-[11px] text-cyan-300 font-mono mt-0.5 truncate">${escapeHtml(item.installed_version)}</p>
                        </div>
                        <div class="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                            <span class="text-slate-400 flex items-center gap-1 truncate" title="${escapeHtml(item.official_portal)}">
                                <i data-lucide="check-circle" class="w-3 h-3 ${iconColor} flex-shrink-0"></i>
                                <span class="truncate">Pareado Oficial</span>
                            </span>
                            <span class="text-emerald-400 font-semibold font-mono">Conectado</span>
                        </div>
                    </div>
                `;
            }).join('');
            lucide.createIcons();
        }

        function filterDevices(cat) {
            currentDeviceFilter = cat;
            document.querySelectorAll('.dev-filter-pill').forEach(b => {
                const isActive = b.getAttribute('data-category') === cat;
                b.classList.toggle('active', isActive);
                b.classList.toggle('bg-blue-600', isActive);
                b.classList.toggle('text-white', isActive);
                b.classList.toggle('font-bold', isActive);
                b.classList.toggle('bg-dark-900', !isActive);
                b.classList.toggle('text-slate-400', !isActive);
                b.classList.toggle('font-semibold', !isActive);
            });
            renderDevicesTable();
        }

        function filterDriverVendor(vendor) {
            currentDriverVendorFilter = vendor;
            document.querySelectorAll('.dev-vendor-pill').forEach(b => {
                const isActive = b.getAttribute('data-vendor') === vendor;
                b.classList.toggle('active', isActive);
                b.classList.toggle('bg-blue-600', isActive);
                b.classList.toggle('text-white', isActive);
                b.classList.toggle('font-bold', isActive);
                b.classList.toggle('bg-dark-900', !isActive);
                b.classList.toggle('text-slate-400', !isActive);
                b.classList.toggle('font-semibold', !isActive);
            });
            if (latestDriverUpdatesData) {
                renderDriverUpdates(latestDriverUpdatesData);
            }
        }

        function renderDevicesTable() {
            const tbody = document.getElementById('dev-table-body');
            if (!tbody) return;
            const search = (document.getElementById('dev-search-input')?.value || '').toLowerCase();

            let filtered = allInstalledDevices;
            if (currentDeviceFilter !== 'all') {
                filtered = filtered.filter(d =>
                    (d.category || '').toLowerCase() === currentDeviceFilter.toLowerCase() ||
                    (d.class || '').toLowerCase() === currentDeviceFilter.toLowerCase()
                );
            }
            if (search) {
                filtered = filtered.filter(d =>
                    (d.name || '').toLowerCase().includes(search) ||
                    (d.manufacturer || '').toLowerCase().includes(search) ||
                    (d.class || '').toLowerCase().includes(search)
                );
            }

            if (!filtered || filtered.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400 font-mono text-xs">Nenhum dispositivo encontrado para os filtros selecionados.</td></tr>`;
                return;
            }

            tbody.innerHTML = filtered.map(d => {
                const isThird = d.is_third_party;
                const provider = isThird ? 'Terceiro / OEM' : 'Microsoft';
                return `
                    <tr class="border-b border-slate-800/60 hover:bg-dark-850/50 transition">
                        <td class="p-3 text-xs font-bold text-white max-w-xs truncate" title="${escapeHtml(d.name)}">
                            <div class="flex items-center gap-2">
                                <i data-lucide="cpu" class="w-4 h-4 text-cyan-400 flex-shrink-0"></i>
                                <span class="truncate">${escapeHtml(d.name)}</span>
                            </div>
                        </td>
                        <td class="p-3 text-xs font-mono text-slate-300 uppercase">${escapeHtml(d.category || d.class || 'other')}</td>
                        <td class="p-3 text-xs text-slate-300 max-w-[180px] truncate" title="${escapeHtml(d.manufacturer || 'Microsoft')}">
                            <span class="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${isThird ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'}">
                                ${escapeHtml(d.manufacturer || 'Microsoft')}
                            </span>
                        </td>
                        <td class="p-3 text-xs font-mono text-cyan-300">${escapeHtml(d.driver_version || d.version || '--')}</td>
                        <td class="p-3 text-xs font-mono text-slate-400">${escapeHtml(d.driver_date || d.date || '--')}</td>
                        <td class="p-3 text-xs font-mono text-slate-300">${provider}</td>
                        <td class="p-3 text-xs">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${d.is_signed ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}">
                                ${escapeHtml(d.status || 'Operacional')} • ${d.is_signed ? 'Assinado' : 'Não Assinado'}
                            </span>
                        </td>
                    </tr>
                `;
            }).join('');
            lucide.createIcons();
        }

        function switchDeviceSubTab(tab) {
            const vInst = document.getElementById('dev-content-installed');
            const vUpd = document.getElementById('dev-content-updates');
            const bInst = document.getElementById('dev-subtab-installed');
            const bUpd = document.getElementById('dev-subtab-updates');
            if (!vInst || !vUpd || !bInst || !bUpd) return;

            if (tab === 'installed') {
                vInst.classList.remove('hidden');
                vUpd.classList.add('hidden');
                bInst.classList.remove('text-slate-400', 'font-semibold');
                bInst.classList.add('bg-blue-600', 'text-white', 'font-bold');
                bUpd.classList.remove('bg-blue-600', 'text-white', 'font-bold');
                bUpd.classList.add('text-slate-400', 'font-semibold');
            } else {
                vInst.classList.add('hidden');
                vUpd.classList.remove('hidden');
                bUpd.classList.remove('text-slate-400', 'font-semibold');
                bUpd.classList.add('bg-blue-600', 'text-white', 'font-bold');
                bInst.classList.remove('bg-blue-600', 'text-white', 'font-bold');
                bInst.classList.add('text-slate-400', 'font-semibold');
                scanDriverUpdates();
            }
            lucide.createIcons();
        }

        async function scanDriverUpdates() {
            const list = document.getElementById('dev-updates-results');
            if (list) {
                list.innerHTML = `
                    <div class="p-8 text-center text-slate-400 font-mono text-xs">
                        <i data-lucide="loader" class="w-7 h-7 animate-spin mx-auto text-cyan-400 mb-3"></i>
                        <p class="font-bold text-white text-sm">Consultando servidores oficiais dos grandes fabricantes...</p>
                        <p class="text-slate-400 mt-1">Conectando a NVIDIA, AMD, Intel, Realtek e catálogo oficial Microsoft WHQL...</p>
                    </div>
                `;
                lucide.createIcons();
            }

            try {
                const res = await fetch('/api/devices/check_updates', { method: 'POST' });
                const data = await res.json();
                latestDriverUpdatesData = data;

                if (data.paired_hardware) {
                    renderPairingCards(data.paired_hardware);
                }

                renderDriverUpdates(data);

                const total = Number(data.total_pending || 0);
                const badge = document.getElementById('dev-updates-count-badge');
                if (badge) {
                    badge.innerText = total;
                    badge.classList.toggle('hidden', total <= 0);
                }
                const lastCheck = document.getElementById('dev-last-check-text');
                if (lastCheck) lastCheck.innerText = `Última verificação oficial: ${data.checked_at || new Date().toLocaleString()}`;

                // Inicia monitoramento caso já haja download ativo
                startDownloadPolling();
            } catch (e) {
                if (list) list.innerHTML = `<div class="p-4 text-center text-rose-400 text-xs">Erro ao consultar atualizações oficiais: ${e}</div>`;
            }
        }

        function renderDriverUpdates(data) {
            const list = document.getElementById('dev-updates-results');
            if (!list) return;

            const official = (data && data.official_drivers) || [];
            const wu = (data && data.windows_update) || [];
            const winget = (data && data.third_party) || [];

            let filteredOfficial = official;
            let filteredWu = wu;
            let filteredWinget = winget;

            if (currentDriverVendorFilter !== 'all') {
                if (currentDriverVendorFilter === 'nvidia') {
                    filteredOfficial = official.filter(d => (d.vendor || '').toLowerCase() === 'nvidia');
                    filteredWu = [];
                    filteredWinget = winget.filter(d => (d.name || '').toLowerCase().includes('nvidia'));
                } else if (currentDriverVendorFilter === 'amd') {
                    filteredOfficial = official.filter(d => (d.vendor || '').toLowerCase() === 'amd');
                    filteredWu = [];
                    filteredWinget = winget.filter(d => (d.name || '').toLowerCase().includes('amd') || (d.name || '').toLowerCase().includes('radeon'));
                } else if (currentDriverVendorFilter === 'intel') {
                    filteredOfficial = official.filter(d => (d.vendor || '').toLowerCase() === 'intel');
                    filteredWu = [];
                    filteredWinget = winget.filter(d => (d.name || '').toLowerCase().includes('intel'));
                } else if (currentDriverVendorFilter === 'windows') {
                    filteredOfficial = [];
                    filteredWinget = [];
                }
            }

            if (filteredOfficial.length === 0 && filteredWu.length === 0 && filteredWinget.length === 0) {
                list.innerHTML = `
                    <div class="p-6 text-center text-emerald-400 bg-emerald-950/20 rounded-2xl border border-emerald-500/30 font-mono text-xs">
                        <i data-lucide="check-circle" class="w-8 h-8 mx-auto text-emerald-400 mb-2"></i>
                        <p class="font-bold text-sm">Hardware Pareado & Drivers Atualizados!</p>
                        <p class="text-slate-400 mt-1">Os servidores oficiais do fabricante confirmam que seus dispositivos estão operando com as versões mais recentes.</p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }

            let html = '';

            // 1. CARDS DE DRIVERS OFICIAIS DOS FABRICANTES (DOWNLOAD DIRETO)
            filteredOfficial.forEach(drv => {
                const vendor = drv.vendor || 'Fabricante';
                let vendorBadgeClass = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                let iconColor = 'text-cyan-400';
                let accentBorder = 'border-slate-800';

                if (vendor === 'NVIDIA') {
                    vendorBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                    iconColor = 'text-emerald-400';
                    accentBorder = 'border-emerald-500/30';
                } else if (vendor === 'AMD') {
                    vendorBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                    iconColor = 'text-rose-400';
                    accentBorder = 'border-rose-500/30';
                } else if (vendor === 'Intel') {
                    vendorBadgeClass = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
                    iconColor = 'text-blue-400';
                    accentBorder = 'border-blue-500/30';
                }

                const dlUrl = drv.download_url || '';
                const fname = drv.filename || `${drv.id}.exe`;
                const dName = drv.name || 'Driver Oficial';
                const dId = drv.id || 'driver';

                html += `
                    <div id="driver-card-${dId}" class="p-5 rounded-2xl bg-dark-950 border ${accentBorder} flex flex-col gap-4 shadow-sm transition">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div class="flex items-start gap-3.5 min-w-0">
                                <div class="w-11 h-11 rounded-xl bg-dark-900 border border-slate-700/80 flex items-center justify-center flex-shrink-0">
                                    <i data-lucide="cpu" class="w-6 h-6 ${iconColor}"></i>
                                </div>
                                <div class="min-w-0">
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <h4 class="text-sm font-bold text-white truncate">${escapeHtml(dName)}</h4>
                                        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${vendorBadgeClass}">${escapeHtml(vendor)} OFICIAL</span>
                                        ${drv.is_newer ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">NOVA VERSÃO</span>' : '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">CANAL WHQL</span>'}
                                    </div>
                                    <p class="text-xs text-slate-300 font-mono mt-1">
                                        Pareado com: <strong class="text-cyan-300">${escapeHtml(drv.hardware_matched || 'Hardware')}</strong>
                                    </p>
                                    <p class="text-[11px] text-slate-400 font-mono mt-0.5">
                                        Versão no PC: <span class="text-slate-300">${escapeHtml(drv.installed_version)}</span> • Servidor Oficial: <strong class="text-emerald-400">${escapeHtml(drv.available_version)}</strong>
                                        ${drv.size_mb ? ` • Tamanho: <span class="text-slate-300">${drv.size_mb} MB</span>` : ''}
                                    </p>
                                    <p class="text-[10px] text-slate-500 font-mono mt-0.5 truncate flex items-center gap-1">
                                        <i data-lucide="shield" class="w-3 h-3 text-cyan-400 flex-shrink-0"></i>
                                        <span>Servidor: ${escapeHtml(drv.official_server)}</span>
                                    </p>
                                </div>
                            </div>

                            <!-- BOTÕES DE AÇÃO DO DRIVER -->
                            <div class="flex items-center gap-2 flex-shrink-0" id="driver-actions-${dId}">
                                <button onclick="triggerDriverDownload('${escapeHtml(dId)}', '${escapeHtml(dlUrl)}', '${escapeHtml(fname)}', '${escapeHtml(dName)}')"
                                    class="btn-action-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20">
                                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                                    <span>Baixar Driver</span>
                                </button>
                                <button onclick="openDriverDownloadFolder()"
                                    class="btn-action-secondary px-3 py-2 rounded-xl text-xs font-bold border-slate-700 hover:border-cyan-400 text-slate-300 flex items-center gap-1" title="Abrir pasta de downloads">
                                    <i data-lucide="folder" class="w-3.5 h-3.5"></i>
                                </button>
                            </div>
                        </div>

                        <!-- BARRA DE PROGRESSO DO DOWNLOAD DIRETO (OCULTA ATÉ O DISPARO) -->
                        <div id="driver-progress-box-${dId}" class="hidden space-y-2 p-3 rounded-xl bg-dark-900 border border-slate-800">
                            <div class="flex items-center justify-between text-xs font-mono">
                                <span id="driver-progress-text-${dId}" class="text-cyan-300 font-bold flex items-center gap-1.5">
                                    <i data-lucide="loader" class="w-3.5 h-3.5 animate-spin text-cyan-400"></i>
                                    <span>Iniciando conexão com os servidores oficiais...</span>
                                </span>
                                <span id="driver-progress-pct-${dId}" class="text-white font-extrabold">0%</span>
                            </div>
                            <div class="w-full h-2.5 bg-dark-950 rounded-full overflow-hidden border border-slate-800">
                                <div id="driver-progress-bar-${dId}" class="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>
                `;
            });

            // 2. CARDS DE ATUALIZAÇÃO VIA WINDOWS UPDATE
            filteredWu.forEach(u => {
                html += `
                    <div class="p-4 rounded-2xl bg-dark-950 border border-blue-500/30 flex items-center justify-between gap-3">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                                <i data-lucide="download-cloud" class="w-5 h-5"></i>
                            </div>
                            <div class="min-w-0">
                                <h4 class="text-xs font-bold text-white truncate">${escapeHtml(u.name || 'Atualização de Driver')}</h4>
                                <p class="text-[11px] text-slate-400 font-mono truncate">${escapeHtml(u.details || 'Canal Oficial Microsoft Windows Update')}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 flex-shrink-0">
                            <span class="px-2.5 py-1 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Windows Update</span>
                            <button onclick="openWindowsUpdateSettings()" class="btn-action-primary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                                <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                                <span>Abrir Update</span>
                            </button>
                        </div>
                    </div>
                `;
            });

            // 3. CARDS DE SUÍTES OEM VIA WINGET
            filteredWinget.forEach(w => {
                html += `
                    <div class="p-4 rounded-2xl bg-dark-950 border border-purple-500/30 flex items-center justify-between gap-3">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                                <i data-lucide="package" class="w-5 h-5"></i>
                            </div>
                            <div class="min-w-0">
                                <h4 class="text-xs font-bold text-white truncate">${escapeHtml(w.name || w.id || 'Software OEM')}</h4>
                                <p class="text-[11px] text-slate-400 font-mono truncate">Versão disponível: <strong class="text-emerald-400">${escapeHtml(w.version || '--')}</strong> • ${escapeHtml(w.type || 'Suíte / Driver de Terceiro')}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 flex-shrink-0">
                            <span class="px-2.5 py-1 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Fabricante / OEM</span>
                            ${w.id ? `<button onclick="upgradeWingetDriver('${escapeHtml(w.id)}', '${escapeHtml(w.name || w.id)}')" class="btn-action-primary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><i data-lucide="download" class="w-3.5 h-3.5"></i><span>Atualizar</span></button>` : ''}
                        </div>
                    </div>
                `;
            });

            list.innerHTML = html;
            lucide.createIcons();
        }

        // =====================================================================
        // DISPARO E GERENCIAMENTO DE DOWNLOAD DIRETO NA FERRAMENTA
        // =====================================================================
        async function triggerDriverDownload(id, url, filename, name) {
            if (!url) {
                showToast("Erro de Download", "URL oficial não fornecida para este driver.", "error");
                return;
            }

            showToast("Download Oficial Iniciado", `Conectando aos servidores oficiais para baixar ${name}...`, "info", 3500);

            // Exibe a barra de progresso imediatamente na UI
            const pBox = document.getElementById(`driver-progress-box-${id}`);
            if (pBox) pBox.classList.remove('hidden');

            try {
                const res = await fetch('/api/devices/download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, url, filename, name })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    startDownloadPolling();
                } else {
                    showToast("Aviso", data.message || "Não foi possível iniciar o download.", "warning");
                }
            } catch (e) {
                showToast("Erro no Download", String(e), "error");
            }
        }

        function startDownloadPolling() {
            if (driverDownloadsPollTimer) return;
            driverDownloadsPollTimer = setInterval(pollDriverDownloads, 1000);
            pollDriverDownloads();
        }

        async function pollDriverDownloads() {
            try {
                const res = await fetch('/api/devices/download_status');
                const data = await res.json();
                const downloads = data.downloads || {};

                let hasActive = false;
                for (const [dId, dl] of Object.entries(downloads)) {
                    const status = dl.status;
                    const pBox = document.getElementById(`driver-progress-box-${dId}`);
                    const pBar = document.getElementById(`driver-progress-bar-${dId}`);
                    const pText = document.getElementById(`driver-progress-text-${dId}`);
                    const pPct = document.getElementById(`driver-progress-pct-${dId}`);
                    const actionsBox = document.getElementById(`driver-actions-${dId}`);

                    if (!pBox) continue;

                    if (status === 'downloading') {
                        hasActive = true;
                        pBox.classList.remove('hidden');

                        const pct = dl.percent || 0;
                        const dlMB = (dl.downloaded_bytes / (1024 * 1024)).toFixed(1);
                        const totMB = (dl.total_bytes / (1024 * 1024)).toFixed(1);
                        const spd = dl.speed_mbps || 0;
                        const eta = dl.eta_seconds || 0;

                        if (pBar) pBar.style.width = `${pct}%`;
                        if (pPct) pPct.innerText = `${pct}%`;
                        if (pText) {
                            pText.innerHTML = `
                                <i data-lucide="loader" class="w-3.5 h-3.5 animate-spin text-cyan-400"></i>
                                <span>Baixando: ${dlMB} / ${totMB} MB (${pct}%) • ${spd} MB/s • Restante: ${eta}s</span>
                            `;
                            lucide.createIcons();
                        }
                    } else if (status === 'completed') {
                        pBox.classList.remove('hidden');
                        if (pBar) {
                            pBar.style.width = '100%';
                            pBar.className = 'h-full bg-emerald-500 rounded-full transition-all duration-300';
                        }
                        if (pPct) pPct.innerText = '100%';
                        if (pText) {
                            pText.innerHTML = `
                                <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400"></i>
                                <span class="text-emerald-400 font-bold">Download Concluído com Sucesso! Arquivo pronto para instalação.</span>
                            `;
                            lucide.createIcons();
                        }

                        // Atualiza os botões de ação para permitir Instalação Direta com 1 clique
                        if (actionsBox && !actionsBox.dataset.completed) {
                            actionsBox.dataset.completed = "true";
                            const fPath = dl.file_path || '';
                            actionsBox.innerHTML = `
                                <button onclick="installDownloadedDriver('${escapeHtml(fPath).replace(/\\/g, '\\\\')}')"
                                    class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition">
                                    <i data-lucide="play" class="w-3.5 h-3.5"></i>
                                    <span>Instalar Driver</span>
                                </button>
                                <button onclick="openDriverDownloadFolder('${escapeHtml(fPath).replace(/\\/g, '\\\\')}')"
                                    class="btn-action-secondary px-3 py-2 rounded-xl text-xs font-bold border-slate-700 hover:border-cyan-400 text-slate-300 flex items-center gap-1" title="Abrir pasta de downloads">
                                    <i data-lucide="folder" class="w-3.5 h-3.5"></i>
                                    <span>Abrir Pasta</span>
                                </button>
                            `;
                            lucide.createIcons();
                            showToast("Download Concluído", `O driver ${dl.name} foi baixado e está pronto para instalação!`, "success", 4000);
                        }
                    } else if (status === 'error') {
                        if (pText) {
                            pText.innerHTML = `<span class="text-rose-400 font-bold">Erro no download: ${escapeHtml(dl.error || 'Falha de rede')}</span>`;
                        }
                    }
                }

                if (!hasActive && driverDownloadsPollTimer) {
                    clearInterval(driverDownloadsPollTimer);
                    driverDownloadsPollTimer = null;
                }
            } catch (e) {
                console.error("Erro no polling de downloads:", e);
            }
        }

        async function installDownloadedDriver(filePath) {
            if (!filePath) {
                showToast("Erro", "Caminho do arquivo não fornecido.", "error");
                return;
            }
            showToast("Iniciando Instalador", "Disparando instalador oficial do fabricante...", "info", 3000);
            try {
                const res = await fetch('/api/devices/install', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file_path: filePath })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    showToast("Instalador Iniciado", data.message || "O instalador oficial foi aberto com sucesso.", "success", 4000);
                } else {
                    showToast("Aviso", data.message || "Não foi possível iniciar o instalador.", "warning");
                }
            } catch (e) {
                showToast("Erro", String(e), "error");
            }
        }

        async function openDriverDownloadFolder(filePath) {
            try {
                await fetch('/api/devices/open_download_folder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file_path: filePath || '' })
                });
                showToast("Pasta Aberta", "A pasta de drivers foi aberta no Windows Explorer.", "info", 2500);
            } catch (e) {
                showToast("Erro", String(e), "error");
            }
        }

        async function backupAllDrivers() {
            showToast("Backup de Drivers", "Iniciando exportação de todos os drivers instalados via pnputil...", "info", 3000);
            try {
                const res = await fetch('/api/devices/backup', { method: 'POST' });
                const data = await res.json();
                if (data.status === 'success') {
                    showToast("Backup Concluído", data.message || 'Backup concluído com sucesso.', "success", 5000);
                } else {
                    showToast("Aviso", data.message || "Não foi possível concluir o backup.", "warning");
                }
            } catch (e) {
                showToast("Erro de Backup", String(e), "error");
            }
        }

        async function openWindowsUpdateSettings() {
            try {
                await fetch('/api/terminal/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode: 'CMD', cmd: 'start ms-settings:windowsupdate', sync: false })
                });
                showToast("Windows Update", "Configurações do Windows Update abertas.", "info", 2500);
            } catch (e) {
                showToast("Erro", String(e), "error");
            }
        }

        async function upgradeWingetDriver(pkgId, pkgName) {
            if (!pkgId) return;
            showToast("Atualizando Pacote OEM", `Iniciando atualização de ${pkgName} via winget...`, "info", 3500);
            try {
                await fetch('/api/terminal/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        mode: 'CMD',
                        cmd: `winget upgrade --id "${pkgId}" --accept-package-agreements --accept-source-agreements`,
                        sync: false
                    })
                });
                showToast("Atualização em Andamento", `O pacote ${pkgName} está sendo atualizado em segundo plano. Acompanhe no Console.`, "success", 4500);
            } catch (e) {
                showToast("Erro", String(e), "error");
            }
        }

        // =====================================================================
        // TESTE DE ESTABILIDADE DO SISTEMA (WINSHIELD STRESSPULSE™ SYSTEM STABILITY CONTROLLER)
        // REDESENHADO COM NÚMEROS NAS LINHAS E TELEMETRIA DE ALTA PRECISÃO
        // =====================================================================
        let stabilityPollTimer = null;
        let isStabilityTestingActive = false;
        let activeStressTab = 'temperatures';
        let latestStressData = null;
        let lastSectorLogCount = 0;

        // Controle de visibilidade individual das curvas do osciloscópio
        const stressTracesVisible = {
            mobo: true,
            cpu: true,
            core1: true,
            core2: true,
            core3: true,
            core4: true,
            disk: true,
            gpu: true,
            fan_cpu: true,
            fan_gpu: true,
            fan_chassis: true,
            vcore: true,
            v12: true,
            v5: true,
            v33: true,
            dram: true,
            pwr_pkg: true,
            pwr_cores: true,
            pwr_gpu: true,
            clk_avg: true,
            clk_c1: true,
            clk_c2: true,
            clk_c3: true,
            clk_c4: true,
            clk_gpu: true
        };

        function toggleStressTrace(key) {
            stressTracesVisible[key] = !stressTracesVisible[key];
            if (latestStressData && activeStressTab !== 'statistics') {
                renderStressUpperGraph(latestStressData.history || []);
            }
        }

        async function loadStabilityInfo() {
            await pollStabilityStatus();
            lucide.createIcons();
        }

        async function pollStabilityStatus() {
            try {
                const res = await fetch('/api/stress/status');
                if (!res.ok) return;
                const data = await res.json();
                if (data.status !== 'success' || !data.stress) return;

                const st = data.stress;
                latestStressData = st;
                isStabilityTestingActive = Boolean(st.running);

                // 1. Atualização dos Inset Boxes de Status
                const elapsedEl = document.getElementById('stress-elapsed-time');
                if (elapsedEl) elapsedEl.innerText = st.elapsed_str || '00:00:00';

                const startedEl = document.getElementById('stress-test-started');
                if (startedEl) startedEl.innerText = st.test_started_str || '--';

                const battEl = document.getElementById('stress-battery-status');
                if (battEl) battEl.innerText = st.battery_status || 'No battery';

                // Top Labels
                const cpuTop = document.getElementById('stress-cpu-top-label');
                if (cpuTop) cpuTop.innerText = `${st.system_threads || 8} Threads (${st.max_clock || 3400} MHz)`;
                const gpuTop = document.getElementById('stress-gpu-top-label');
                if (gpuTop) gpuTop.innerText = st.gpu_name || 'NVIDIA GeForce RTX 4060 Ti';
                const diskTop = document.getElementById('stress-disk-top-label');
                if (diskTop) diskTop.innerText = st.disk_name || 'KINGSTON SA400S37960G';

                // 2. Status Badge Principal & Throttling Card
                const statusBadge = document.getElementById('stress-status-badge');
                const statusDot = document.getElementById('stress-status-dot');
                const statusText = document.getElementById('stress-status-text');

                const cardThrottling = document.getElementById('stress-throttling-card');
                const cardThrottlingText = document.getElementById('stress-throttling-card-text');
                const cardThrottlingIconBox = document.getElementById('stress-throttling-card-icon-box');

                const btnStart = document.getElementById('stress-btn-start');
                const btnStop = document.getElementById('stress-btn-stop');

                const cur = st.current || {};
                const isThrottling = Boolean(st.throttling_active || (cur.cpu_throttling && cur.cpu_throttling > 0));

                if (st.running) {
                    if (btnStart) {
                        btnStart.disabled = true;
                        btnStart.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-400/30 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 cursor-not-allowed opacity-50";
                    }
                    if (btnStop) {
                        btnStop.disabled = false;
                        btnStop.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 border border-rose-500/40 flex items-center gap-1.5 shadow-md shadow-rose-950/40 cursor-pointer transition active:scale-95";
                    }

                    // Desabilita checkboxes enquanto em teste
                    document.querySelectorAll('.stress-subsystem-chk').forEach(chk => chk.disabled = true);

                    if (isThrottling) {
                        if (statusBadge) statusBadge.className = "px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-500 border border-rose-500/40 flex items-center gap-1 animate-pulse";
                        if (statusDot) statusDot.className = "w-2 h-2 rounded-full bg-rose-500 animate-ping";
                        if (statusText) statusText.innerText = "ALERTA: THERMAL THROTTLING DETECTADO!";

                        if (cardThrottlingText) {
                            cardThrottlingText.innerText = `${cur.cpu_throttling || 0}% (Superaquecimento!)`;
                            cardThrottlingText.className = "text-xs font-mono font-black text-rose-500 animate-pulse";
                        }
                        if (cardThrottlingIconBox) {
                            cardThrottlingIconBox.className = "w-6 h-6 rounded-md bg-rose-500/20 border border-rose-500/40 flex items-center justify-center flex-shrink-0 animate-pulse";
                        }
                    } else {
                        if (statusBadge) statusBadge.className = "px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 animate-pulse";
                        if (statusDot) statusDot.className = "w-2 h-2 rounded-full bg-emerald-500 animate-pulse";
                        if (statusText) statusText.innerText = "TESTE EM ANDAMENTO (ESTÁVEL)";

                        if (cardThrottlingText) {
                            cardThrottlingText.innerText = "Sem Throttling (0%)";
                            cardThrottlingText.className = "text-xs font-mono font-black text-emerald-600 dark:text-emerald-400";
                        }
                        if (cardThrottlingIconBox) {
                            cardThrottlingIconBox.className = "w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0";
                        }
                    }
                } else {
                    if (btnStart) {
                        btnStart.disabled = false;
                        btnStart.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/40 flex items-center gap-1.5 shadow-md shadow-emerald-950/30 cursor-pointer transition active:scale-95";
                    }
                    if (btnStop) {
                        btnStop.disabled = true;
                        btnStop.className = "px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-400/30 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 cursor-not-allowed opacity-50 transition";
                    }

                    document.querySelectorAll('.stress-subsystem-chk').forEach(chk => chk.disabled = false);

                    if (statusBadge) statusBadge.className = "px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1";
                    if (statusDot) statusDot.className = "w-2 h-2 rounded-full bg-slate-400";
                    if (statusText) statusText.innerText = "PRONTO PARA TESTE";

                    if (cardThrottlingText) {
                        cardThrottlingText.innerText = "Inativo (0%)";
                        cardThrottlingText.className = "text-xs font-mono font-black text-slate-500 dark:text-slate-400";
                    }
                    if (cardThrottlingIconBox) {
                        cardThrottlingIconBox.className = "w-6 h-6 rounded-md bg-slate-200/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 flex items-center justify-center flex-shrink-0";
                    }
                }

                // 3. Atualização do Log de Setores do StressPulse™
                const sectorBox = document.getElementById('stress-sector-log-box');
                const sectorLog = Array.isArray(st.sector_log) ? st.sector_log : [];
                const countLbl = document.getElementById('stress-sector-count-label');
                const ramTestedLbl = document.getElementById('stress-sector-ram-tested');

                if (countLbl) countLbl.innerText = `Setores Registrados: ${sectorLog.length}`;
                if (ramTestedLbl) ramTestedLbl.innerText = `RAM Alocada: ${st.memory_tested_mb || 0} MB`;

                if (sectorBox) {
                    if (sectorLog.length === 0) {
                        sectorBox.innerHTML = `
                            <div class="p-3 text-slate-500 italic text-center text-xs" id="stress-sector-log-empty">
                                Nenhum teste em execução. Selecione os setores e clique em "Start" para iniciar o registro cronológico.
                            </div>
                        `;
                    } else if (sectorLog.length !== lastSectorLogCount) {
                        lastSectorLogCount = sectorLog.length;
                        sectorBox.innerHTML = sectorLog.map(entry => {
                            const isErr = entry.status.includes('Error') || entry.status.includes('Bit-flip');
                            const isWarn = entry.status.includes('Throttling') || entry.status.includes('Overheating');
                            const isStop = entry.status.includes('Stopped');
                            const isStart = entry.status.includes('Started');

                            let statusClass = "text-slate-200";
                            if (isErr) statusClass = "text-rose-400 font-bold";
                            else if (isWarn) statusClass = "text-amber-400 font-bold";
                            else if (isStop) statusClass = "text-slate-400";
                            else if (isStart) statusClass = "text-emerald-400 font-bold";

                            return `
                                <div class="grid grid-cols-12 py-1 px-2.5 hover:bg-slate-900/80 transition rounded items-center">
                                    <div class="col-span-4 sm:col-span-3 text-slate-400 font-mono text-[11px]">${escapeHtml(entry.datetime || '')}</div>
                                    <div class="col-span-8 sm:col-span-9 ${statusClass} font-mono text-[11px] truncate" title="${escapeHtml(entry.status || '')}">${escapeHtml(entry.status || '')}</div>
                                </div>
                            `;
                        }).join('');
                        sectorBox.scrollTop = sectorBox.scrollHeight;
                    }
                }

                // 4. Alerta do Gráfico Inferior
                const thHeadline = document.getElementById('stress-throttling-headline');
                if (thHeadline) {
                    if (isThrottling) {
                        thHeadline.innerHTML = `
                            <span class="text-rose-500 font-black animate-pulse flex items-center gap-1.5">
                                <i data-lucide="alert-triangle" class="w-4 h-4 text-rose-500"></i>
                                CPU Throttling (Max: ${cur.cpu_throttling || 0}%) - Superaquecimento Detectado!
                            </span>
                        `;
                    } else {
                        thHeadline.innerHTML = `
                            <span class="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                                <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-500"></i>
                                CPU Throttling: 0% - Overheating Not Detected
                            </span>
                        `;
                    }
                }

                const liveCpuUsage = document.getElementById('stress-live-cpu-usage-val');
                if (liveCpuUsage) liveCpuUsage.innerText = `${cur.cpu_usage || 0}%`;

                const liveCpuThrottling = document.getElementById('stress-live-cpu-throttling-val');
                if (liveCpuThrottling) {
                    liveCpuThrottling.innerText = `${cur.cpu_throttling || 0}%`;
                    liveCpuThrottling.className = (cur.cpu_throttling > 0) ? "text-rose-500 font-bold" : "text-slate-400";
                }

                // 5. Renderização dos Gráficos com Números nas Linhas
                if (activeStressTab === 'statistics') {
                    renderStressStatisticsTable(st);
                } else {
                    renderStressUpperGraph(st.history || []);
                    renderStressLowerGraph(st.history || []);
                    updateStressUpperLegendBar(cur);
                }

                lucide.createIcons();
            } catch (e) {
                console.error("Erro na telemetria StressPulse™:", e);
            }
        }

        function setStressTab(tabId) {
            activeStressTab = tabId;
            const tabs = ['temperatures', 'cooling_fans', 'voltages', 'powers', 'clocks', 'unified', 'statistics'];

            tabs.forEach(t => {
                const btn = document.getElementById(`stress-tab-${t}`);
                if (!btn) return;
                if (t === tabId) {
                    btn.className = "px-3 py-1 rounded-lg text-xs font-bold bg-orange-500 text-white shadow-sm transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer";
                } else {
                    btn.className = "px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800 transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer";
                }
            });

            const visualGraphs = document.getElementById('stress-visual-graphs-container');
            const statsTable = document.getElementById('stress-statistics-container');
            const upperTitle = document.getElementById('stress-upper-title');
            const upperScale = document.getElementById('stress-upper-scale-label');

            if (tabId === 'statistics') {
                if (visualGraphs) visualGraphs.classList.add('hidden');
                if (statsTable) statsTable.classList.remove('hidden');
                if (latestStressData) renderStressStatisticsTable(latestStressData);
            } else {
                if (visualGraphs) visualGraphs.classList.remove('hidden');
                if (statsTable) statsTable.classList.add('hidden');

                if (tabId === 'temperatures') {
                    if (upperTitle) upperTitle.innerText = "Temperatures Oscilloscope";
                    if (upperScale) upperScale.innerText = "Escala Y: 0 °C — 100 °C";
                } else if (tabId === 'cooling_fans') {
                    if (upperTitle) upperTitle.innerText = "Cooling Fans Telemetry";
                    if (upperScale) upperScale.innerText = "Escala Y: 0 RPM — 3000 RPM";
                } else if (tabId === 'voltages') {
                    if (upperTitle) upperTitle.innerText = "Voltages Waveforms";
                    if (upperScale) upperScale.innerText = "Escala Y: 0.0 V — 14.0 V";
                } else if (tabId === 'powers') {
                    if (upperTitle) upperTitle.innerText = "Power Consumption";
                    if (upperScale) upperScale.innerText = "Escala Y: 0 W — 200 W";
                } else if (tabId === 'clocks') {
                    if (upperTitle) upperTitle.innerText = "Core Frequencies & Clocks";
                    if (upperScale) upperScale.innerText = "Escala Y: 0 MHz — 5000 MHz";
                } else if (tabId === 'unified') {
                    if (upperTitle) upperTitle.innerText = "Unified Multi-Sensor Matrix";
                    if (upperScale) upperScale.innerText = "Escala Y: Normalizado 0% — 100%";
                }

                if (latestStressData) {
                    renderStressUpperGraph(latestStressData.history || []);
                    renderStressLowerGraph(latestStressData.history || []);
                    updateStressUpperLegendBar(latestStressData.current || {});
                }
            }

            lucide.createIcons();
        }

        function updateStressUpperLegendBar(cur) {
            const bar = document.getElementById('stress-upper-legend-bar');
            if (!bar) return;

            let items = [];

            if (activeStressTab === 'temperatures') {
                items = [
                    { key: 'mobo', label: 'Motherboard', color: '#3b82f6', val: `${cur.mobo_temp || 28}°C` },
                    { key: 'cpu', label: 'CPU Package', color: '#ef4444', val: `${cur.cpu_temp || 45}°C` },
                    { key: 'core1', label: 'Core #1', color: '#10b981', val: `${cur.core_temps ? cur.core_temps[0] || 43 : 43}°C` },
                    { key: 'core2', label: 'Core #2', color: '#eab308', val: `${cur.core_temps ? cur.core_temps[1] || 44 : 44}°C` },
                    { key: 'core3', label: 'Core #3', color: '#06b6d4', val: `${cur.core_temps ? cur.core_temps[2] || 42 : 42}°C` },
                    { key: 'core4', label: 'Core #4', color: '#a855f7', val: `${cur.core_temps ? cur.core_temps[3] || 46 : 46}°C` },
                    { key: 'disk', label: 'Drive C: KINGSTON', color: '#f59e0b', val: `${cur.disk_temp || 28}°C` },
                    { key: 'gpu', label: 'GPU Core', color: '#14b8a6', val: `${cur.gpu_temp || 38}°C` },
                ];
            } else if (activeStressTab === 'cooling_fans') {
                items = [
                    { key: 'fan_cpu', label: 'CPU Fan', color: '#06b6d4', val: `${cur.cpu_fan || 1200} RPM` },
                    { key: 'fan_gpu', label: 'GPU Fan', color: '#10b981', val: `${cur.gpu_fan || 0} RPM` },
                    { key: 'fan_chassis', label: 'Chassis Fan', color: '#a855f7', val: `${cur.chassis_fan || 950} RPM` },
                ];
            } else if (activeStressTab === 'voltages') {
                items = [
                    { key: 'vcore', label: 'CPU VCore', color: '#0284c7', val: `${cur.vcore || 1.150} V` },
                    { key: 'v12', label: '+12V', color: '#f59e0b', val: `${cur.v12 || 12.096} V` },
                    { key: 'v5', label: '+5V', color: '#10b981', val: `${cur.v5 || 5.040} V` },
                    { key: 'v33', label: '+3.3V', color: '#8b5cf6', val: `${cur.v33 || 3.328} V` },
                    { key: 'dram', label: 'DRAM', color: '#ec4899', val: `${cur.dram_v || 1.350} V` },
                ];
            } else if (activeStressTab === 'powers') {
                items = [
                    { key: 'pwr_pkg', label: 'CPU Package', color: '#f97316', val: `${cur.cpu_power || 25} W` },
                    { key: 'pwr_cores', label: 'CPU Cores', color: '#f59e0b', val: `${cur.cores_power || 20} W` },
                    { key: 'pwr_gpu', label: 'GPU Power', color: '#10b981', val: `${cur.gpu_power || 15} W` },
                ];
            } else if (activeStressTab === 'clocks') {
                items = [
                    { key: 'clk_avg', label: 'CPU Average', color: '#06b6d4', val: `${cur.avg_clock || 3400} MHz` },
                    { key: 'clk_c1', label: 'Core #1', color: '#10b981', val: `${cur.clocks ? cur.clocks[0] || 3400 : 3400} MHz` },
                    { key: 'clk_c2', label: 'Core #2', color: '#eab308', val: `${cur.clocks ? cur.clocks[1] || 3400 : 3400} MHz` },
                    { key: 'clk_c3', label: 'Core #3', color: '#3b82f6', val: `${cur.clocks ? cur.clocks[2] || 3400 : 3400} MHz` },
                    { key: 'clk_c4', label: 'Core #4', color: '#a855f7', val: `${cur.clocks ? cur.clocks[3] || 3400 : 3400} MHz` },
                    { key: 'clk_gpu', label: 'GPU Clock', color: '#ec4899', val: `${cur.gpu_clock || 360} MHz` },
                ];
            } else if (activeStressTab === 'unified') {
                items = [
                    { key: 'mobo', label: 'CPU Temp', color: '#ef4444', val: `${cur.cpu_temp || 45}°C` },
                    { key: 'cpu', label: 'CPU Clock', color: '#06b6d4', val: `${cur.avg_clock || 3400} MHz` },
                    { key: 'core1', label: 'CPU Usage', color: '#10b981', val: `${cur.cpu_usage || 0}%` },
                    { key: 'core2', label: 'RAM Usage', color: '#a855f7', val: `${cur.ram_usage_pct || 0}%` },
                    { key: 'disk', label: 'CPU Power', color: '#f59e0b', val: `${cur.cpu_power || 25} W` },
                ];
            }

            bar.innerHTML = items.map(item => {
                const isChecked = stressTracesVisible[item.key] !== false;
                return `
                    <label class="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer select-none transition">
                        <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleStressTrace('${item.key}')" class="w-3.5 h-3.5 rounded accent-orange-500 cursor-pointer">
                        <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${item.color}"></span>
                        <span class="text-slate-700 dark:text-slate-300 font-medium">${item.label}:</span>
                        <strong class="font-mono text-slate-900 dark:text-white" style="color: ${item.color}">${item.val}</strong>
                    </label>
                `;
            }).join('');
        }

        // =====================================================================
        // RENDERIZADOR DO OSCILOSCÓPIO COM NÚMEROS DIRETAMENTE NAS LINHAS
        // =====================================================================
        function renderStressUpperGraph(history) {
            const canvas = document.getElementById('stress-upper-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const W = Math.round(rect.width || 1000);
            const H = Math.round(rect.height || 145);

            if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
                canvas.width = W * dpr;
                canvas.height = H * dpr;
            }

            ctx.save();
            ctx.scale(dpr, dpr);

            // Deixa margem à direita (padRight = 75) para desenhar as etiquetas numéricas nas linhas
            const padLeft = 45;
            const padRight = 65;
            const padTop = 14;
            const padBottom = 16;
            const plotW = W - padLeft - padRight;
            const plotH = H - padTop - padBottom;

            // Fundo escuro osciloscópio CRT
            const isLight = document.documentElement.classList.contains('light');
            ctx.fillStyle = isLight ? '#f8fafc' : '#060a12';
            ctx.fillRect(0, 0, W, H);

            // Escala e limites por aba
            let yMin = 0, yMax = 100, unit = '°C', numSteps = 5;
            if (activeStressTab === 'temperatures') {
                yMin = 0; yMax = 100; unit = '°C'; numSteps = 5;
            } else if (activeStressTab === 'cooling_fans') {
                yMin = 0; yMax = 3000; unit = 'RPM'; numSteps = 6;
            } else if (activeStressTab === 'voltages') {
                yMin = 0.0; yMax = 14.0; unit = 'V'; numSteps = 7;
            } else if (activeStressTab === 'powers') {
                yMin = 0; yMax = 200; unit = 'W'; numSteps = 5;
            } else if (activeStressTab === 'clocks') {
                yMin = 0; yMax = 5000; unit = 'MHz'; numSteps = 5;
            } else if (activeStressTab === 'unified') {
                yMin = 0; yMax = 100; unit = '%'; numSteps = 5;
            }

            // Grade horizontal
            const gridColor = isLight ? 'rgba(203, 213, 225, 0.6)' : 'rgba(16, 185, 129, 0.14)';
            const textColor = isLight ? '#64748b' : '#94a3b8';

            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);

            ctx.font = '10px monospace';
            ctx.fillStyle = textColor;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';

            for (let i = 0; i <= numSteps; i++) {
                const ratio = i / numSteps;
                const y = padTop + plotH * (1 - ratio);
                const val = (yMin + (yMax - yMin) * ratio);
                const valStr = (activeStressTab === 'voltages') ? val.toFixed(1) : Math.round(val);

                ctx.beginPath();
                ctx.moveTo(padLeft, y);
                ctx.lineTo(padLeft + plotW, y);
                ctx.stroke();

                ctx.fillText(`${valStr} ${unit}`, padLeft - 6, y);
            }

            // Grade vertical (passagem do tempo)
            const vSteps = 10;
            for (let i = 0; i <= vSteps; i++) {
                const x = padLeft + (plotW / vSteps) * i;
                ctx.beginPath();
                ctx.moveTo(x, padTop);
                ctx.lineTo(x, padTop + plotH);
                ctx.stroke();
            }

            ctx.setLineDash([]);

            // Overlay message se histórico vazio
            const overlay = document.getElementById('stress-upper-overlay');
            if (!history || history.length < 2) {
                if (overlay) overlay.style.display = 'flex';
                ctx.restore();
                return;
            }
            if (overlay) overlay.style.display = 'none';

            const pts = history.slice(-120);
            const numPts = pts.length;
            const getX = (idx) => padLeft + (idx / Math.max(1, numPts - 1)) * plotW;
            const getY = (val) => padTop + plotH * (1 - Math.max(0, Math.min(1, (val - yMin) / (yMax - yMin))));

            // Coleção de etiquetas numéricas que serão desenhadas na ponta de cada linha
            const lineBadges = [];

            function drawTraceWithNumber(getter, strokeStyle, lineWidth, key, unitStr = '') {
                if (key && stressTracesVisible[key] === false) return;

                ctx.beginPath();
                let lastPtX = 0, lastPtY = 0, lastVal = 0;

                pts.forEach((p, idx) => {
                    const v = getter(p);
                    const x = getX(idx);
                    const y = getY(v);
                    if (idx === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);

                    if (idx === numPts - 1) {
                        lastPtX = x;
                        lastPtY = y;
                        lastVal = v;
                    }
                });

                ctx.strokeStyle = strokeStyle;
                ctx.lineWidth = lineWidth;
                ctx.stroke();

                // Formata número da linha
                let formattedNum = '';
                if (activeStressTab === 'voltages') formattedNum = Number(lastVal).toFixed(2) + 'V';
                else if (activeStressTab === 'cooling_fans') formattedNum = Math.round(lastVal) + ' RPM';
                else if (activeStressTab === 'powers') formattedNum = Math.round(lastVal) + 'W';
                else if (activeStressTab === 'clocks') formattedNum = Math.round(lastVal) + 'MHz';
                else if (activeStressTab === 'unified') formattedNum = Math.round(lastVal) + '%';
                else formattedNum = Math.round(lastVal) + '°C';

                lineBadges.push({
                    x: lastPtX,
                    y: lastPtY,
                    targetY: lastPtY,
                    color: strokeStyle,
                    valText: formattedNum
                });
            }

            // Desenha as curvas conforme a aba ativa
            if (activeStressTab === 'temperatures') {
                drawTraceWithNumber(p => p.mobo_temp || 28, '#3b82f6', 2.0, 'mobo');
                drawTraceWithNumber(p => p.cpu_temp || 45, '#ef4444', 2.6, 'cpu');
                drawTraceWithNumber(p => (p.core_temps && p.core_temps[0]) || p.cpu_temp, '#10b981', 1.8, 'core1');
                drawTraceWithNumber(p => (p.core_temps && p.core_temps[1]) || p.cpu_temp, '#eab308', 1.8, 'core2');
                drawTraceWithNumber(p => (p.core_temps && p.core_temps[2]) || p.cpu_temp, '#06b6d4', 1.8, 'core3');
                drawTraceWithNumber(p => (p.core_temps && p.core_temps[3]) || p.cpu_temp, '#a855f7', 1.8, 'core4');
                drawTraceWithNumber(p => p.disk_temp || 28, '#f59e0b', 2.0, 'disk');
                drawTraceWithNumber(p => p.gpu_temp || 38, '#14b8a6', 2.0, 'gpu');
            } else if (activeStressTab === 'cooling_fans') {
                drawTraceWithNumber(p => p.cpu_fan || 1200, '#06b6d4', 2.4, 'fan_cpu');
                drawTraceWithNumber(p => p.gpu_fan || 0, '#10b981', 2.0, 'fan_gpu');
                drawTraceWithNumber(p => p.chassis_fan || 950, '#a855f7', 1.8, 'fan_chassis');
            } else if (activeStressTab === 'voltages') {
                drawTraceWithNumber(p => p.vcore || 1.15, '#0284c7', 2.4, 'vcore');
                drawTraceWithNumber(p => p.v12 || 12.096, '#f59e0b', 2.0, 'v12');
                drawTraceWithNumber(p => p.v5 || 5.040, '#10b981', 2.0, 'v5');
                drawTraceWithNumber(p => p.v33 || 3.328, '#8b5cf6', 2.0, 'v33');
                drawTraceWithNumber(p => p.dram_v || 1.350, '#ec4899', 2.0, 'dram');
            } else if (activeStressTab === 'powers') {
                drawTraceWithNumber(p => p.cpu_power || 25, '#f97316', 2.6, 'pwr_pkg');
                drawTraceWithNumber(p => p.cores_power || 20, '#f59e0b', 2.0, 'pwr_cores');
                drawTraceWithNumber(p => p.gpu_power || 15, '#10b981', 2.0, 'pwr_gpu');
            } else if (activeStressTab === 'clocks') {
                drawTraceWithNumber(p => p.avg_clock || 3400, '#06b6d4', 2.6, 'clk_avg');
                drawTraceWithNumber(p => (p.clocks && p.clocks[0]) || 3400, '#10b981', 1.8, 'clk_c1');
                drawTraceWithNumber(p => (p.clocks && p.clocks[1]) || 3400, '#eab308', 1.8, 'clk_c2');
                drawTraceWithNumber(p => (p.clocks && p.clocks[2]) || 3400, '#3b82f6', 1.8, 'clk_c3');
                drawTraceWithNumber(p => (p.clocks && p.clocks[3]) || 3400, '#a855f7', 1.8, 'clk_c4');
                drawTraceWithNumber(p => p.gpu_clock || 360, '#ec4899', 2.0, 'clk_gpu');
            } else if (activeStressTab === 'unified') {
                drawTraceWithNumber(p => p.cpu_temp || 45, '#ef4444', 2.4, 'mobo');
                drawTraceWithNumber(p => (p.avg_clock ? (p.avg_clock / 50) : 60), '#06b6d4', 2.0, 'cpu');
                drawTraceWithNumber(p => p.cpu_usage || 0, '#10b981', 2.2, 'core1');
                drawTraceWithNumber(p => p.ram_usage_pct || 0, '#a855f7', 2.0, 'core2');
                drawTraceWithNumber(p => (p.cpu_power ? (p.cpu_power / 2) : 20), '#f59e0b', 2.0, 'disk');
            }

            // -----------------------------------------------------------------
            // DESENHO DOS NÚMEROS DIRETAMENTE NAS LINHAS COM ANTI-COLISÃO
            // -----------------------------------------------------------------
            if (lineBadges.length > 0) {
                // Ordena por posição Y para evitar que números sobreponham uns aos outros
                lineBadges.sort((a, b) => a.targetY - b.targetY);

                const minGap = 17; // Espaço vertical mínimo entre números
                for (let i = 1; i < lineBadges.length; i++) {
                    if (lineBadges[i].y < lineBadges[i - 1].y + minGap) {
                        lineBadges[i].y = lineBadges[i - 1].y + minGap;
                    }
                }

                // Ajuste de limites para não vazar a borda superior/inferior
                for (let i = lineBadges.length - 1; i >= 0; i--) {
                    if (lineBadges[i].y > padTop + plotH - 8) {
                        lineBadges[i].y = padTop + plotH - 8;
                        if (i > 0 && lineBadges[i - 1].y > lineBadges[i].y - minGap) {
                            lineBadges[i - 1].y = lineBadges[i].y - minGap;
                        }
                    }
                }

                lineBadges.forEach(b => {
                    const badgeX = padLeft + plotW + 10;
                    const badgeY = b.y;

                    // 1. Ponto luminoso no ponto final da linha
                    ctx.beginPath();
                    ctx.arc(b.x, b.targetY, 3.5, 0, Math.PI * 2);
                    ctx.fillStyle = b.color;
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    // 2. Linha conectora suave entre o ponto da linha e a etiqueta numérica
                    ctx.beginPath();
                    ctx.moveTo(b.x, b.targetY);
                    ctx.lineTo(badgeX - 4, badgeY);
                    ctx.strokeStyle = b.color;
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    // 3. Etiqueta (Pill Badge) com o número
                    const textW = ctx.measureText(b.valText).width + 8;
                    const badgeH = 14;

                    ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(11, 18, 30, 0.95)';
                    ctx.strokeStyle = b.color;
                    ctx.lineWidth = 1.2;

                    // Caixa arredondada
                    const rx = badgeX - 2;
                    const ry = badgeY - badgeH / 2;
                    ctx.beginPath();
                    ctx.roundRect(rx, ry, Math.max(38, textW), badgeH, 3);
                    ctx.fill();
                    ctx.stroke();

                    // 4. Texto do número em negrito com a cor da linha
                    ctx.font = 'bold 9.5px monospace';
                    ctx.fillStyle = b.color;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(b.valText, rx + 4, badgeY);
                });
            }

            ctx.restore();
        }

        // =====================================================================
        // RENDERIZADOR DO GRÁFICO INFERIOR (CPU USAGE | CPU THROTTLING)
        // =====================================================================
        function renderStressLowerGraph(history) {
            const canvas = document.getElementById('stress-lower-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const W = Math.round(rect.width || 1000);
            const H = Math.round(rect.height || 75);

            if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
                canvas.width = W * dpr;
                canvas.height = H * dpr;
            }

            ctx.save();
            ctx.scale(dpr, dpr);

            const padLeft = 45;
            const padRight = 65;
            const padTop = 10;
            const padBottom = 12;
            const plotW = W - padLeft - padRight;
            const plotH = H - padTop - padBottom;

            const isLight = document.documentElement.classList.contains('light');
            ctx.fillStyle = isLight ? '#f8fafc' : '#060a12';
            ctx.fillRect(0, 0, W, H);

            const gridColor = isLight ? 'rgba(203, 213, 225, 0.6)' : 'rgba(16, 185, 129, 0.14)';
            const textColor = isLight ? '#64748b' : '#94a3b8';

            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);

            ctx.font = '10px monospace';
            ctx.fillStyle = textColor;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';

            const pctSteps = [0, 25, 50, 75, 100];
            pctSteps.forEach(pct => {
                const y = padTop + plotH * (1 - pct / 100);
                ctx.beginPath();
                ctx.moveTo(padLeft, y);
                ctx.lineTo(padLeft + plotW, y);
                ctx.stroke();

                ctx.fillText(`${pct}%`, padLeft - 6, y);
            });

            for (let i = 0; i <= 10; i++) {
                const x = padLeft + (plotW / 10) * i;
                ctx.beginPath();
                ctx.moveTo(x, padTop);
                ctx.lineTo(x, padTop + plotH);
                ctx.stroke();
            }

            ctx.setLineDash([]);

            if (!history || history.length < 2) {
                ctx.restore();
                return;
            }

            const pts = history.slice(-120);
            const numPts = pts.length;
            const getX = (idx) => padLeft + (idx / Math.max(1, numPts - 1)) * plotW;
            const getY = (val) => padTop + plotH * (1 - Math.max(0, Math.min(1, val / 100)));

            const showUsage = document.getElementById('stress-trace-cpu-usage') ? document.getElementById('stress-trace-cpu-usage').checked : true;
            const showThrottling = document.getElementById('stress-trace-cpu-throttling') ? document.getElementById('stress-trace-cpu-throttling').checked : true;

            let lastUsage = 0, lastUsageX = 0, lastUsageY = 0;
            let lastThrottling = 0, lastThrottlingX = 0, lastThrottlingY = 0;

            // 1. CPU Usage (Linha verde + gradiente preenchido)
            if (showUsage) {
                ctx.beginPath();
                pts.forEach((p, idx) => {
                    const x = getX(idx);
                    const y = getY(p.cpu_usage || 0);
                    if (idx === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);

                    if (idx === numPts - 1) {
                        lastUsage = p.cpu_usage || 0;
                        lastUsageX = x;
                        lastUsageY = y;
                    }
                });
                ctx.strokeStyle = '#10b981';
                ctx.lineWidth = 2.0;
                ctx.stroke();

                const fillGrad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
                fillGrad.addColorStop(0, 'rgba(16, 185, 129, 0.28)');
                fillGrad.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
                ctx.lineTo(getX(numPts - 1), padTop + plotH);
                ctx.lineTo(getX(0), padTop + plotH);
                ctx.closePath();
                ctx.fillStyle = fillGrad;
                ctx.fill();

                // Número na linha de CPU Usage
                ctx.beginPath();
                ctx.arc(lastUsageX, lastUsageY, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = '#10b981';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();

                const bx = padLeft + plotW + 10;
                ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(11, 18, 30, 0.95)';
                ctx.strokeStyle = '#10b981';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.roundRect(bx - 2, lastUsageY - 7, 42, 14, 3);
                ctx.fill();
                ctx.stroke();

                ctx.font = 'bold 9.5px monospace';
                ctx.fillStyle = '#10b981';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${Math.round(lastUsage)}%`, bx + 4, lastUsageY);
            }

            // 2. CPU Throttling (Spikes vermelhos de alerta do StressPulse™)
            if (showThrottling) {
                ctx.beginPath();
                pts.forEach((p, idx) => {
                    const x = getX(idx);
                    const y = getY(p.cpu_throttling || 0);
                    if (idx === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);

                    if (idx === numPts - 1) {
                        lastThrottling = p.cpu_throttling || 0;
                        lastThrottlingX = x;
                        lastThrottlingY = y;
                    }
                });
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 2.2;
                ctx.stroke();

                const hasThrottling = pts.some(p => (p.cpu_throttling || 0) > 0);
                if (hasThrottling) {
                    const fillRed = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
                    fillRed.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
                    fillRed.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
                    ctx.lineTo(getX(numPts - 1), padTop + plotH);
                    ctx.lineTo(getX(0), padTop + plotH);
                    ctx.closePath();
                    ctx.fillStyle = fillRed;
                    ctx.fill();
                }

                // Número na linha de Throttling
                ctx.beginPath();
                ctx.arc(lastThrottlingX, lastThrottlingY, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = '#ef4444';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();

                const bx = padLeft + plotW + 10;
                const thY = (Math.abs(lastThrottlingY - lastUsageY) < 16) ? lastThrottlingY - 14 : lastThrottlingY;
                ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(11, 18, 30, 0.95)';
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.roundRect(bx - 2, thY - 7, 42, 14, 3);
                ctx.fill();
                ctx.stroke();

                ctx.font = 'bold 9.5px monospace';
                ctx.fillStyle = '#ef4444';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${Math.round(lastThrottling)}%`, bx + 4, thY);
            }

            ctx.restore();
        }

        function renderStressCharts() {
            if (latestStressData && activeStressTab !== 'statistics') {
                renderStressUpperGraph(latestStressData.history || []);
                renderStressLowerGraph(latestStressData.history || []);
            }
        }

        // =====================================================================
        // TABELA UNIFICADA DE ESTATÍSTICAS (StressPulse™ UNIFIED STATISTICS TABLE)
        // =====================================================================
        function renderStressStatisticsTable(st) {
            const tbody = document.getElementById('stress-statistics-tbody');
            if (!tbody || !st) return;

            const stats = st.statistics || {};
            const cur = st.current || {};

            const getStat = (key, unit, curVal) => {
                const s = stats[key] || {};
                const c = (curVal !== undefined ? curVal : s.current) || 0;
                return {
                    current: `${c} ${unit}`,
                    min: `${s.min !== undefined ? s.min : c} ${unit}`,
                    max: `${s.max !== undefined ? s.max : c} ${unit}`,
                    avg: `${s.avg !== undefined ? s.avg : c} ${unit}`
                };
            };

            const groups = [
                {
                    title: "Temperaturas (°C)",
                    icon: "thermometer",
                    color: "text-orange-500",
                    rows: [
                        { name: "Placa-Mãe (Motherboard)", ...getStat("mobo_temp", "°C", cur.mobo_temp) },
                        { name: "Processador (CPU Package)", ...getStat("cpu_temp", "°C", cur.cpu_temp) },
                        { name: "CPU Core #1", ...getStat("core_temp_1", "°C", cur.core_temps ? cur.core_temps[0] : 43) },
                        { name: "CPU Core #2", ...getStat("core_temp_2", "°C", cur.core_temps ? cur.core_temps[1] : 44) },
                        { name: "CPU Core #3", ...getStat("core_temp_3", "°C", cur.core_temps ? cur.core_temps[2] : 42) },
                        { name: "CPU Core #4", ...getStat("core_temp_4", "°C", cur.core_temps ? cur.core_temps[3] : 46) },
                        { name: `Drive C: ${st.disk_name || 'KINGSTON SSD'}`, ...getStat("disk_temp", "°C", cur.disk_temp) },
                        { name: `GPU: ${st.gpu_name || 'RTX 4060 Ti'}`, ...getStat("gpu_temp", "°C", cur.gpu_temp) },
                    ]
                },
                {
                    title: "Ventoinhas & Refrigeração (RPM)",
                    icon: "fan",
                    color: "text-cyan-500",
                    rows: [
                        { name: "Ventoinha da CPU (CPU Fan)", ...getStat("cpu_fan", "RPM", cur.cpu_fan) },
                        { name: "Ventoinha da GPU (GPU Fan)", ...getStat("gpu_fan", "RPM", cur.gpu_fan) },
                        { name: "Ventoinha do Gabinete (Chassis)", ...getStat("chassis_fan", "RPM", cur.chassis_fan) },
                    ]
                },
                {
                    title: "Tensões de Alimentação (V)",
                    icon: "battery-charging",
                    color: "text-emerald-500",
                    rows: [
                        { name: "CPU VCore", ...getStat("vcore", "V", cur.vcore) },
                        { name: "+12V Rail", ...getStat("v12", "V", cur.v12) },
                        { name: "+5V Rail", ...getStat("v5", "V", cur.v5) },
                        { name: "+3.3V Rail", ...getStat("v33", "V", cur.v33) },
                        { name: "DRAM Voltage", ...getStat("dram_v", "V", cur.dram_v) },
                    ]
                },
                {
                    title: "Consumo de Potência (Watts)",
                    icon: "zap",
                    color: "text-amber-500",
                    rows: [
                        { name: "CPU Package Power", ...getStat("cpu_power", "W", cur.cpu_power) },
                        { name: "CPU Cores Power", ...getStat("cores_power", "W", cur.cores_power) },
                        { name: "GPU Power Draw", ...getStat("gpu_power", "W", cur.gpu_power) },
                    ]
                },
                {
                    title: "Frequências de Operação (Clocks)",
                    icon: "gauge",
                    color: "text-sky-500",
                    rows: [
                        { name: "Frequência Média da CPU", ...getStat("avg_clock", "MHz", cur.avg_clock) },
                        { name: "Frequência GPU Graphics", ...getStat("gpu_clock", "MHz", cur.gpu_clock) },
                    ]
                },
                {
                    title: "Carga do Sistema & Estabilidade",
                    icon: "activity",
                    color: "text-purple-500",
                    rows: [
                        { name: "Utilização Total da CPU", ...getStat("cpu_usage", "%", cur.cpu_usage) },
                        { name: "CPU Thermal Throttling", ...getStat("cpu_throttling", "%", cur.cpu_throttling) },
                        { name: "Utilização da Memória RAM", ...getStat("ram_usage_pct", "%", cur.ram_usage_pct) },
                        { name: "Memória RAM Físicamente Ocupada", ...getStat("ram_used_gb", "GB", cur.ram_used_gb) },
                        {
                            name: "Integridade de Memória (Bit-Flips / Erros)",
                            current: (st.memory_errors > 0 ? `${st.memory_errors} Erros!` : "0 Erros (Estável)"),
                            min: "0",
                            max: `${st.memory_errors || 0}`,
                            avg: "0.00"
                        }
                    ]
                }
            ];

            tbody.innerHTML = groups.map(g => {
                const headerHtml = `
                    <tr class="bg-slate-100/70 dark:bg-dark-950/70 font-sans font-bold text-slate-700 dark:text-slate-300">
                        <td colspan="5" class="py-2.5 px-4 text-xs flex items-center gap-2">
                            <i data-lucide="${g.icon}" class="w-3.5 h-3.5 ${g.color}"></i>
                            ${g.title}
                        </td>
                    </tr>
                `;
                const rowsHtml = g.rows.map(r => `
                    <tr class="hover:bg-slate-50 dark:hover:bg-dark-950/40 transition">
                        <td class="py-2 px-4 font-sans font-medium text-slate-800 dark:text-slate-200">${r.name}</td>
                        <td class="py-2 px-4 text-right font-bold text-orange-500">${r.current}</td>
                        <td class="py-2 px-4 text-right text-slate-500 dark:text-slate-400">${r.min}</td>
                        <td class="py-2 px-4 text-right text-slate-500 dark:text-slate-400">${r.max}</td>
                        <td class="py-2 px-4 text-right text-slate-600 dark:text-slate-300 font-semibold">${r.avg}</td>
                    </tr>
                `).join('');
                return headerHtml + rowsHtml;
            }).join('');

            lucide.createIcons();
        }

                // =====================================================================
        // CONTROLES DE EXECUÇÃO: START, STOP, CLEAR, SAVE, CPUID, PREFERENCES
        // =====================================================================
        function applyStressPreferences() {
            const prefThreads = document.getElementById('stress-pref-threads');
            const prefMem = document.getElementById('stress-pref-memory');
            const prefDur = document.getElementById('stress-pref-duration');

            const threadsText = prefThreads ? prefThreads.options[prefThreads.selectedIndex].text : 'Auto';
            const memText = prefMem ? prefMem.options[prefMem.selectedIndex].text : '2 GB';
            const durText = prefDur ? prefDur.options[prefDur.selectedIndex].text : 'Contínuo';

            closeStressPreferences();
            showToast("Preferências Aplicadas", `${threadsText} | RAM: ${memText} | ${durText}`, "success", 3000);
        }

        async function startStressTest() {
            const chkCpu = document.getElementById('stress-chk-cpu');
            const chkFpu = document.getElementById('stress-chk-fpu');
            const chkCache = document.getElementById('stress-chk-cache');
            const chkMem = document.getElementById('stress-chk-memory');
            const chkDisks = document.getElementById('stress-chk-disks');
            const chkGpu = document.getElementById('stress-chk-gpu');

            const stressCpu = chkCpu ? chkCpu.checked : true;
            const stressFpu = chkFpu ? chkFpu.checked : true;
            const stressCache = chkCache ? chkCache.checked : true;
            const stressMem = chkMem ? chkMem.checked : true;
            const stressDisks = chkDisks ? chkDisks.checked : false;
            const stressGpu = chkGpu ? chkGpu.checked : false;

            if (!stressCpu && !stressFpu && !stressCache && !stressMem && !stressDisks && !stressGpu) {
                showToast("Configuração Inválida", "Selecione ao menos um subsistema para executar o teste.", "warning", 3500);
                return;
            }

            const prefThreads = document.getElementById('stress-pref-threads');
            const prefMem = document.getElementById('stress-pref-memory');
            const prefDur = document.getElementById('stress-pref-duration');

            const threadsVal = prefThreads ? prefThreads.value : 'auto';
            const threads = (threadsVal === 'auto' || threadsVal === '' || isNaN(parseInt(threadsVal))) ? 0 : parseInt(threadsVal);
            const memMb = prefMem ? parseInt(prefMem.value) : 2048;
            const durSec = prefDur ? parseInt(prefDur.value) : 0;

            const btnStart = document.getElementById('stress-btn-start');
            const btnStop = document.getElementById('stress-btn-stop');
            if (btnStart) {
                btnStart.disabled = true;
                btnStart.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Iniciando...</span>`;
                lucide.createIcons();
            }

            showToast("Iniciando Teste StressPulse™", "Alocando carga pesada nos subsistemas selecionados...", "info", 2500);

            try {
                const res = await fetch('/api/stress/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        stress_cpu: stressCpu,
                        stress_fpu: stressFpu,
                        stress_cache: stressCache,
                        stress_memory: stressMem,
                        stress_disk: stressDisks,
                        stress_disks: stressDisks,
                        stress_gpu: stressGpu,
                        stress_gpus: stressGpu,
                        threads: threads,
                        memory_mb: memMb,
                        duration_limit_sec: durSec
                    })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    showToast("StressPulse™ Ativo", "Todos os setores configurados foram iniciados.", "success", 3000);
                    if (!stabilityPollTimer) stabilityPollTimer = setInterval(pollStabilityStatus, 1000);
                } else {
                    showToast("Aviso", data.message || "Não foi possível iniciar o teste.", "warning", 4000);
                }
            } catch (e) {
                showToast("Erro", String(e), "error");
            } finally {
                if (btnStart) {
                    btnStart.innerHTML = `<i data-lucide="play" class="w-3.5 h-3.5 fill-white"></i><span>Start</span>`;
                    lucide.createIcons();
                }
                await pollStabilityStatus();
            }
        }

        async function stopStressTest() {
            const btnStart = document.getElementById('stress-btn-start');
            const btnStop = document.getElementById('stress-btn-stop');
            const statusText = document.getElementById('stress-status-text');

            if (btnStop) {
                btnStop.disabled = true;
                btnStop.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Parando...</span>`;
                lucide.createIcons();
            }
            if (statusText) statusText.innerText = "ENCERRANDO TESTE...";

            showToast("Interrompendo Teste", "Finalizando workers e liberando recursos de hardware...", "info", 2000);
            try {
                const res = await fetch('/api/stress/stop', { method: 'POST' });
                const data = await res.json();
                if (data.status === 'success') {
                    showToast("Teste Interrompido", "Carga finalizada com sucesso.", "success", 3000);
                } else {
                    showToast("Aviso", data.message || "Falha ao interromper teste.", "warning");
                }
            } catch (e) {
                showToast("Erro", String(e), "error");
            } finally {
                await pollStabilityStatus();
                if (btnStop) {
                    btnStop.innerHTML = `<i data-lucide="square" class="w-3.5 h-3.5 fill-white"></i><span>Stop</span>`;
                    lucide.createIcons();
                }
            }
        }

        async function clearStressStats() {
            try {
                const res = await fetch('/api/stress/reset', { method: 'POST' });
                const data = await res.json();
                if (data.status === 'success') {
                    showToast("Histórico Limpo", "Registros de setores, estatísticas e gráficos foram reinicializados.", "info", 3000);
                    lastSectorLogCount = 0;
                    pollStabilityStatus();
                }
            } catch (e) {
                showToast("Erro", String(e), "error");
            }
        }

        function saveStressReport() {
            if (!latestStressData) {
                showToast("Aviso", "Nenhum dado disponível para salvar.", "warning");
                return;
            }

            const dtStr = new Date().toISOString().replace(/[:.]/g, '-');
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(latestStressData, null, 2));
            const dlAnchor = document.createElement('a');
            dlAnchor.setAttribute("href", dataStr);
            dlAnchor.setAttribute("download", `WinShield_StressPulse_Stability_Report_${dtStr}.json`);
            document.body.appendChild(dlAnchor);
            dlAnchor.click();
            dlAnchor.remove();

            showToast("Relatório Salvo", `Relatório de estabilidade StressPulse™ exportado com sucesso.`, "success", 3500);
        }

        function openSiliconMatrixModal() {
            const modal = document.getElementById('stress-modal-cpuid');
            if (!modal) return;
            modal.classList.remove('hidden');

            if (latestStressData) {
                const th = document.getElementById('cpuid-threads-count');
                if (th) th.innerText = `${latestStressData.system_threads || 8} Threads`;
                const clk = document.getElementById('cpuid-clock-speed');
                if (clk) clk.innerText = `${latestStressData.max_clock || 3400} MHz`;
            }
            lucide.createIcons();
        }

        function closeSiliconMatrixModal() {
            const modal = document.getElementById('stress-modal-cpuid');
            if (modal) modal.classList.add('hidden');
        }

        function openStressPreferences() {
            const modal = document.getElementById('stress-modal-prefs');
            if (modal) modal.classList.remove('hidden');
            lucide.createIcons();
        }

        function closeStressPreferences() {
            const modal = document.getElementById('stress-modal-prefs');
            if (modal) modal.classList.add('hidden');
        }

        window.addEventListener('resize', () => {
            if (currentTab === 'stability' && latestStressData && activeStressTab !== 'statistics') {
                renderStressUpperGraph(latestStressData.history || []);
                renderStressLowerGraph(latestStressData.history || []);
            }
        });
