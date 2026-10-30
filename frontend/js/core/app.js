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
                "nav.search_placeholder": "Buscar (Ctrl+K)",
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
                "nav.maintenance": "Manutenção",
                "nav.group_advanced": "AVANÇADO",
                "nav.terminal": "Terminal",
                "side.telemetry": "TELEMETRIA",
                "side.active": "PROTEGIDO",
                "header.theme_dark": "Escuro",
                "header.theme_light": "Claro",
                "header.theme_auto": "Auto",
                "header.console": "Console",
                "console.title": "Registro de operações",
                "console.title_open": "Console de Operações em Tempo Real",
                "console.save": "Salvar .log",
                "console.clear": "Limpar",
                "splash.welcome": "Bem-vindo ao WinShield Pro",
                "splash.badge": "WINSHIELD PRO ENTERPRISE v7.0",
                "splash.lang_title": "Selecione seu Idioma",
                "splash.status_loading1": "INICIANDO SISTEMA...",
                "splash.status_loading2": "Sincronizando telemetria de hardware e sensores...",
                "splash.status_loading3": "Carregando motores de disco e segurança...",
                "splash.progress_ready": "SISTEMA PRONTO PARA ACESSO",
                "splash.subtitle": "Diagnóstico, benchmark e manutenção do Windows",
                "splash.check1": "Permissões de Kernel & Admin",
                "splash.check2": "Telemetria & Sensores",
                "splash.check3": "S.M.A.R.T. & Discos",
                "splash.check4": "Motores de Otimização",
                "splash.status_ok": "ATIVO",
                "splash.status_conn": "CONECTADO",
                "splash.status_ready": "PRONTO",
                "splash.status_init": "INICIALIZADO",
                "splash.dont_show": "Não exibir na inicialização",
                "splash.enter": "Entrar",
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
                "silicon.tab_cpu": "Processador",
                "silicon.tab_mainboard": "Placa-mãe",
                "silicon.tab_memory": "Memória e SPD",
                "silicon.tab_bench": "Benchmark",
                "silicon.btn_refresh": "Atualizar",
                "silicon.cpu_name": "Processador",
                "silicon.codename": "Codinome",
                "silicon.litography": "Litografia",
                "silicon.socket": "Soquete",
                "silicon.cores_threads": "Núcleos / threads",
                "silicon.instructions": "Instruções suportadas",
                "silicon.clocks": "Relógios em Tempo Real (Clocks)",
                "silicon.multiplier": "Multiplicador",
                "silicon.mb_specs": "Placa-mãe",
                "silicon.mb_chipset": "Fabricante e chipset",
                "silicon.mb_mfr": "Fabricante",
                "silicon.mb_model": "Modelo",
                "silicon.mb_pcie": "Barramento PCI-e:",
                "silicon.mb_bios": "BIOS / UEFI",
                "silicon.mb_vendor": "Fornecedor",
                "silicon.mb_ver": "Versão",
                "silicon.mb_date": "Data",
                "silicon.ram_config": "Configuração de memória",
                "silicon.ram_total": "Capacidade",
                "silicon.ram_channels": "Canais",
                "silicon.ram_slots": "Slots ocupados",
                "silicon.btn_start_bench": "Iniciar benchmark",
                "vision.tab_gpu": "Especificações",
                "vision.tab_sensors": "Sensores",
                "vision.btn_refresh": "Atualizar",
                "vision.adapter_name": "Adaptador de vídeo",
                "vision.architecture": "Arquitetura",
                "vision.transistors": "Transistores",
                "vision.bus_width": "Barramento de memória",
                "vision.bandwidth": "Largura de banda",
                "vision.driver_ver": "Versão do driver",
                "vision.resolution": "Resolução",
                "vision.features": "Recursos suportados",
                "vision.temp": "Temperatura",
                "vision.load": "Uso da GPU",
                "vision.vram_used": "Memória de vídeo em uso",
                "vision.power": "Consumo",
                "memory.header_badge": "Memória instalada",
                "memory.total_installed": "total",
                "memory.used": "Em uso",
                "memory.available": "Disponível",
                "memory.load_label": "Em uso agora",
                "memory.modules_title": "Módulos instalados",
                "memory.ramguard_title": "Teste de integridade da memória",
                "memory.ramguard_desc": "Grava e confere padrões em 100% das palavras de 64 bits da área testada. Um único erro indica defeito ou instabilidade.",
                "memory.btn_start_test": "Iniciar teste",
                "memory.btn_stop_test": "Parar",
                "memory.btn_refresh": "Atualizar",
                "memory.test_status_label": "Estado",
                "memory.test_speed_label": "Vazão",
                "memory.test_pattern_label": "Algoritmo atual",
                "memory.test_errors_label": "Erros",
                "memory.block_progress": "Progresso",
                "memory.log_title": "Registro",
                "disk_health.btn_rescan": "Reler discos",
                "disk_health.tab_smart": "Atributos S.M.A.R.T.",
                "disk_health.tab_surface": "Varredura de superfície",
                "disk_health.tab_align": "Recursos e alinhamento",
                "disk_health.temperature": "Temperatura",
                "disk_health.power_on_hours": "Horas ligado",
                "disk_health.total_written": "Total gravado",
                "disk_health.th_attr": "Atributo",
                "disk_health.th_current": "Atual",
                "disk_health.th_worst": "Pior",
                "disk_health.th_threshold": "Limite",
                "disk_health.th_raw": "Valor bruto",
                "disk_health.btn_start_scan": "Iniciar varredura",
                "disk_health.btn_stop_scan": "Parar",
                "disk_health.bad_sectors": "Regiões com erro",
                "disk_health.read_speed": "Leitura",
                "disk_health.elapsed_time": "Decorrido",
                "disk_health.remaining_time": "Restante",
                "disk_bench.btn_all_tests": "Executar todos",
                "disk_bench.passes": "Passes",
                "disk_bench.sample_size": "Tamanho do arquivo",
                "disk_bench.test_drive": "Unidade",
                "disk_bench.measure_unit": "Exibir em",
                "disk_bench.seq_read": "Leitura Sequencial",
                "disk_bench.seq_write": "Escrita Sequencial",
                "disk_bench.rnd_read": "Leitura Aleatória 4K",
                "disk_bench.rnd_write": "Escrita Aleatória 4K",
                "apps.header_title": "Programas em Execução & Gerenciador",
                "apps.header_desc": "Separe aplicativos instalados de serviços do sistema, visualize consumo e encerre processos com segurança.",
                "apps.stat_user_apps": "Aplicativos abertos",
                "apps.stat_services": "Processos do Windows",
                "apps.stat_ram": "Memória dos aplicativos",
                "apps.tab_my_apps": "Aplicativos",
                "apps.tab_services": "Sistema",
                "apps.tab_all": "Todos",
                "apps.search_placeholder": "Buscar programa por nome ou PID...",
                "apps.refresh": "Atualizar",
                "apps.loading": "Lendo processos em execução…",
                "apps.th_app": "Processo",
                "apps.th_category": "Tipo",
                "apps.th_ram": "Memória",
                "apps.th_window": "Janela / caminho",
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
                "antivirus.card_defender": "Microsoft Defender",
                "antivirus.defender_rt": "Executa a verificação do próprio Defender e atualiza as definições.",
                "antivirus.card_system32": "Anti-Camuflagem & Drivers",
                "antivirus.system32_title": "System32 e drivers",
                "antivirus.system32_desc": "Binários em System32 e drivers: separa os assinados por fabricantes dos que não têm assinatura.",
                "antivirus.btn_scan_system32": "Auditar System32",
                "antivirus.card_heuristics": "Heurística & RAM",
                "antivirus.heuristics_title": "Processos suspeitos",
                "antivirus.heuristics_desc": "Processos ativos rodando de AppData, Temp e pastas públicas.",
                "antivirus.btn_scan_heuristics": "Analisar processos",
                "antivirus.card_cloud": "Nuvem Global",
                "antivirus.cloud_title": "Serviços e processos",
                "antivirus.cloud_desc": "Auditoria local de todos os serviços instalados e processos: caminho, assinatura e nomes conhecidos de malware.",
                "antivirus.btn_scan_cloud": "Auditar serviços",
                "antivirus.btn_quick": "Verificar",
                "antivirus.tab_all_threats": "Itens suspeitos",
                "antivirus.tab_system32": "System32",
                "antivirus.tab_heuristics": "Processos",
                "antivirus.tab_cloud": "Serviços",
                "antivirus.no_scan": "Execute uma varredura para listar os resultados.",
                "antivirus.th_threat": "Arquivo / processo",
                "antivirus.th_risk": "Nível",
                "antivirus.th_origin": "Origem",
                "antivirus.th_diag": "Diagnóstico",
                "antivirus.th_path": "Caminho",
                "antivirus.th_actions": "Ações",
                "antivirus.btn_quarantine": "Quarentena",
                "antivirus.btn_delete": "Excluir Arquivo",
                "clean.card_title": "Espaço recuperável",
                "clean.real_numbers_tag": "Valores medidos",
                "clean.areas_title": "Categorias",
                "clean.btn_analyze": "Analisar",
                "clean.btn_clean": "Limpar selecionados",
                "clean.recycle_bin": "Lixeira do Windows",
                "clean.temp_user": "Arquivos Temporários do Usuário",
                "clean.update_cache": "Cache do Windows Update",
                "clean.browser_cache": "Caches de Navegadores",
                "power.schemes_title": "Planos de Energia Ativos",
                "power.ultimate_perf": "Desempenho Máximo (Ultimate Performance)",
                "power.btn_activate": "Ativar Plano",
                "power.btn_create": "Criar Novo Plano",
                "optimize.hero_badge": "Rotina completa",
                "optimize.hero_title": "Manutenção completa do sistema",
                "optimize.hero_desc": "Executa em sequência: ponto de restauração, desativação de telemetria, liberação de RAM, TRIM, SFC e DISM.",
                "optimize.btn_run_all": "Iniciar rotina completa",
                "optimize.sfc_title": "SFC /SCANNOW",
                "optimize.sfc_desc": "Executa sfc /scannow para validar e corrigir integridade de DLLs e arquivos de sistema do Windows.",
                "optimize.btn_sfc": "Executar SFC",
                "optimize.dism_title": "DISM RestoreHealth",
                "optimize.dism_desc": "Executa DISM /Online /Cleanup-Image /RestoreHealth utilizando a biblioteca de componentes oficial.",
                "optimize.btn_dism": "Executar DISM",
                "optimize.trim_title": "TRIM dos SSDs",
                "optimize.trim_desc": "Envia instruções TRIM para todas as unidades SSD para restabelecer a velocidade máxima de escrita da NAND.",
                "optimize.btn_trim": "Executar TRIM",
                "optimize.ram_title": "Liberar memória RAM",
                "optimize.ram_desc": "Purga listas de páginas em standby e working-sets vazios sem fechar seus programas em uso.",
                "optimize.btn_ram": "Otimizar RAM",
                "optimize.telem_title": "Desativar Telemetria & Rastreamento",
                "optimize.telem_desc": "Desliga serviços invasivos de diagnóstico, telemetria DiagTrack e rastreamento de experiência do usuário.",
                "optimize.btn_telem": "Desativar Telemetria",
                "optimize.restore_title": "Ponto de restauração",
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
                "optimize.winsxs_title": "Limpeza do WinSxS",
                "optimize.winsxs_desc": "Executa StartComponentCleanup para remover versões antigas de atualizações substituídas do Windows.",
                "optimize.btn_winsxs": "Limpar WinSxS",
                "optimize.chkdsk_title": "CHKDSK online (C:)",
                "optimize.chkdsk_desc": "Escaneia a integridade estrutural do sistema de arquivos NTFS na unidade C: sem exigir reinicialização.",
                "optimize.btn_chkdsk": "Verificar C:",
                "optimize.netreset_title": "Redefinir pilha de rede",
                "optimize.netreset_desc": "Executa Flush DNS, renova concessão DHCP e redefine catálogos Winsock e pilha TCP/IP.",
                "optimize.btn_netreset": "Resetar Rede",
                "overview.cmd_badge": "CENTRAL DE COMANDO ATIVA",
                "overview.cmd_title": "Monitoramento de Kernel, Segurança & Telemetria em Tempo Real",
                "overview.qa_optimize": "Otimizar & Debloat",
                "overview.qa_clean": "Limpeza Profunda",
                "overview.qa_antivirus": "Caça a Ameaças",
                "overview.qa_network": "Rede & SpeedTest",
                "opt_modal.title": "{ const elapsed = ((Date.now() - optModalStartTime) / 1000).toFixed(1); document.getElementById('opt-modal-timer').innerText = `Tempo: ${elapsed}s`; }, 100); } function closeOptimizeModal() { const modal = document.getElementById('optimize-steps-modal'); const box = document.getElementById('optimize-modal-box'); if (optModalTimer) { clearInterval(optModalTimer); optModalTimer = null; } modal.classList.add('opacity-0', 'pointer-events-none'); modal.classList.remove('opacity-100'); box.classList.add('scale-95'); box.classList.remove('scale-100'); } function setOptimizeModalProgress(pct, statusText) { document.getElementById('opt-modal-pct').innerText = `${Math.round(pct)}%`; document.getElementById('opt-modal-progress-bar').style.width = `${pct}%`; if (statusText) document.getElementById('opt-modal-status-text').innerText = statusText; } function appendOptimizeModalLog(line) { const logBox = document.getElementById('opt-modal-log'); logBox.innerText += (logBox.innerText ? '\\n' : '') + line; logBox.scrollTop = logBox.scrollHeight; } let currentAdaptiveProfile = null; async function loadOptimizationProfile(manual = false) { try { const url = manual ? '/api/optimize/profile?force=1' : '/api/optimize/profile'; const res = await fetch(url); const data = await res.json(); if (!data || data.status !== 'success') return; const profObj = data.profile || data; currentAdaptiveProfile = profObj; const hw = profObj.hardware_summary || profObj.hardware || {}; const services = profObj.services || []; const titleEl = document.getElementById('opt-hw-profile-title'); const descEl = document.getElementById('opt-hw-profile-desc'); const chassisBadge = document.getElementById('opt-hw-chassis-badge'); const cpuEl = document.getElementById('opt-hw-cpu'); const threadsEl = document.getElementById('opt-hw-threads'); const ramEl = document.getElementById('opt-hw-ram'); const ramTierEl = document.getElementById('opt-hw-ram-tier'); const gpuEl = document.getElementById('opt-hw-gpu'); const gpuTypeEl = document.getElementById('opt-hw-gpu-type'); const storageEl = document.getElementById('opt-hw-storage'); const storageModelEl = document.getElementById('opt-hw-storage-model'); const recCountEl = document.getElementById('opt-recommended-count'); if (titleEl) titleEl.innerText = hw.profile_name || 'Perfil Adaptado ao Hardware'; if (descEl) descEl.innerText = hw.profile_description || 'Serviços calibrados para a configuração real desta máquina.'; if (chassisBadge) chassisBadge.innerText = `${hw.chassis || 'Desktop'} • ${hw.profile_badge || hw.cpu_vendor || 'x64'}`; if (cpuEl) cpuEl.innerText = hw.cpu || hw.cpu_name || 'Processador Detectado'; if (threadsEl) threadsEl.innerText = `${hw.cores || hw.cpu_cores || '--'} núcleos · ${hw.threads || hw.cpu_threads || '--'} threads`; if (ramEl) ramEl.innerText = `${hw.ram_gb || '--'} GB`; if (ramTierEl) ramTierEl.innerText = hw.ram_gb >= 15 ? 'Alta capacidade (16 GB+)' : 'Capacidade moderada'; if (gpuEl) gpuEl.innerText = hw.gpu || hw.gpu_name || 'GPU Detectada'; if (gpuTypeEl) gpuTypeEl.innerText = hw.is_dedicated_gpu ? 'Dedicada (PCIe)' : 'Integrada'; if (storageEl) storageEl.innerText = hw.storage_type || 'SSD / Disco'; if (storageModelEl) storageModelEl.innerText = 'Unidade do sistema'; if (recCountEl) { const recCnt = services.filter(s => s.recommended && !MAINTENANCE_TASKS.has(s.id || s.key)).length; recCountEl.innerText = `· ${recCnt} recomendados para esta máquina`; } await loadOptimizeStates(); renderOptimizeServices(); if (manual) { showToast(\"Hardware Reanalisado\", `Perfil adaptativo calibrado: ${hw.profile_name || 'OK'}`, \"success\", 2500); } } catch (e) { console.error(\"Erro ao carregar perfil adaptativo:\", e); } } // Ações pontuais (sem configuração gravada) ficam na página Manutenção const MAINTENANCE_TASKS = new Set(['clean_ram', 'trim', 'sfc', 'dism', 'dism_cleanup', 'chkdsk', 'restore_point', 'network_reset']); let optimizeStates = {}; let optimizeFilter = 'all'; async function loadOptimizeStates() { try { const res = await fetch('/api/optimize/state'); const data = await res.json(); optimizeStates = (data && data.state) || {}; } catch (e) { optimizeStates = {}; } } function setOptimizeFilter(f) { optimizeFilter = f; document.querySelectorAll('#opt-filter [data-filter]').forEach(b => b.classList.toggle('active', b.dataset.filter === f)); renderOptimizeServices(); } function renderOptimizeServices() { const gridEl = document.getElementById('opt-adaptive-services-grid'); const services = ((currentAdaptiveProfile && currentAdaptiveProfile.services) || []).filter(x => !MAINTENANCE_TASKS.has(x.id || x.key)); if (!gridEl || services.length === 0) return; const stateOf = s => (optimizeStates[s.id || s.key] || {}); const verifiable = services.filter(s => stateOf(s).applied === true || stateOf(s).applied === false); const applied = verifiable.filter(s => stateOf(s).applied === true); const pending = services.filter(s => stateOf(s).applied === false); const counts = { all: services.length, recommended: services.filter(s => s.recommended).length, pending: pending.length, applied: applied.length }; document.querySelectorAll('#opt-filter [data-count]').forEach(el => { el.innerText = counts[el.dataset.count] ?? 0; }); // Placar: ajustes verificáveis aplicados / total verificável const total = verifiable.length; const ratio = total ? applied.length / total : 0; const arc = document.getElementById('opt-score-arc'); if (arc) arc.style.strokeDashoffset = String(452.4 * (1 - ratio)); const sv = document.getElementById('opt-score-value'); if (sv) sv.innerText = total ? `${applied.length}/${total}` : '—'; const sf = document.getElementById('opt-score-foot'); if (sf) sf.innerText = total ? 'ajustes aplicados' : 'estado indisponível'; const list = services.filter(s => { const ap = stateOf(s).applied; if (optimizeFilter === 'recommended') return s.recommended; if (optimizeFilter === 'pending') return ap === false; if (optimizeFilter === 'applied') return ap === true; return true; }); if (list.length === 0) { gridEl.innerHTML = `",
                "opt_modal.subtitle": "Executando sequência recomendada de serviços e debloat do Windows...",
                "opt_modal.log_toggle": "Saída dos comandos",
                "opt_modal.btn_done": "Aguarde…",
                "terminal.cmd_admin": "CMD",
                "terminal.ps_admin": "PowerShell",
                "terminal.elevated_badge": "Executado de forma oculta, com os privilégios do WinShield · limite de 60 s",
                "terminal.btn_run": "Executar",
                "terminal.chips_label": "Atalhos",
                "terminal.chip_connections": "Conexões ativas",
                "terminal.chip_top_ram": "Top 10 em memória",
                "terminal.chip_disks": "Discos físicos",
                "terminal.chip_defender": "Status do Defender",
                "terminal.btn_copy": "Copiar",
                "terminal.btn_clear": "Limpar",
                "network.refresh": "Atualizar",
                "network.adapter_card": "Adaptador",
                "network.connected": "Conectado",
                "network.ip_card": "Endereçamento",
                "network.signal_card": "Sinal",
                "network.public_card": "IP público",
                "network.ping_title": "Latência",
                "network.ping_desc": "Ping ICMP: mínimo, máximo, média e perda de pacotes.",
                "network.ping_all_btn": "Testar servidores",
                "network.ping_custom_btn": "Testar host",
                "network.speed_title": "Teste de velocidade",
                "network.download": "Download",
                "network.upload": "Upload",
                "network.btn_start_speed": "Iniciar teste (~35 s)",
                "network.repair_title": "Reparos de conexão",
                "devices.btn_refresh": "Atualizar",
                "devices.btn_scan_updates": "Verificar agora",
                "devices.btn_backup": "Backup (.inf)",
                "devices.total_card": "Dispositivos",
                "devices.display_card": "Adaptadores de vídeo",
                "devices.third_card": "Drivers de terceiros",
                "devices.signed_card": "Drivers assinados",
                "devices.tab_installed": "Instalados",
                "devices.tab_updates": "Atualizações",
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
                "nav.maintenance": "Maintenance",
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
                "splash.badge": "WINSHIELD PRO ENTERPRISE v7.0",
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
                "nav.maintenance": "Mantenimiento",
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
                "splash.badge": "WINSHIELD PRO ENTERPRISE v7.0",
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
                'overview': { title: 'Visão geral', sub: 'Diagnóstico e métricas em tempo real da máquina' },
                'silicon': { title: 'Processador', sub: 'Especificações profundas de CPU, Caches, Placa-Mãe e Benchmark' },
                'vision': { title: 'Placa de vídeo', sub: 'Arquitetura Gráfica, VRAM, Clock, DirectX, Vulkan e Sensores em Tempo Real' },
                'memory': { title: 'Memória RAM', sub: 'Telemetria profunda de pentes físicos, canais e teste de estresse de memória' },
                'disk-health': { title: 'Saúde dos discos', sub: 'S.M.A.R.T., Telemetria NVMe, Varredura em 1.200 Blocos e Alinhamento 4K' },
                'disk-bench': { title: 'Velocidade dos discos', sub: 'Benchmark de Alta Performance (Direct I/O Multi-Pass & Fila Assíncrona de Hardware)' },
                'running-apps': { title: 'Programas em execução', sub: 'Mapeamento de janelas ativas, separação de serviços e desinstalação de softwares' },
                'audit': { title: 'Auditoria de software', sub: 'Mapeamento no Registro, AppX da Store, Serviços e Inicialização' },
                'antivirus': { title: 'Antivírus', sub: 'Varredura heurística, scanner profundo de System32 e inteligência em nuvem' },
                'clean': { title: 'Limpeza', sub: 'Exclusão segura de temporários, Lixeira do Windows e caches de navegadores' },
                'power': { title: 'Energia', sub: 'Desempenho Máximo nativo, criador de esquemas e powercfg' },
                'optimize': { title: 'Otimização', sub: 'Reparos SFC/DISM, TRIM SSD, desativação de telemetria e rede' },
                'maintenance': { title: 'Manutenção', sub: 'Reparo do Windows, TRIM, liberação de RAM e rede' },
                'terminal': { title: 'Terminal', sub: 'Execução de comandos administrativos em segundo plano' },
                'network': { title: 'Rede', sub: 'Diagnósticos de sinal, latência com servidores mundiais e teste de velocidade' },
                'devices': { title: 'Dispositivos e drivers', sub: 'Mapeamento de hardware Plug & Play e central de atualização de drivers' },
                'stability': { title: 'Teste de estresse', sub: 'Estresse contínuo de CPU, FPU, Caches e Memória RAM com telemetria e detecção de Throttling' },
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
                'maintenance': { title: 'Maintenance', sub: 'Windows repair, TRIM, memory release and network' },
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
                'maintenance': { title: 'Mantenimiento', sub: 'Reparación de Windows, TRIM, liberación de RAM y red' },
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
            ['pt', 'en', 'es'].forEach(l => {
                const btn = document.getElementById(`lang-btn-${l}`);
                if (btn) btn.classList.toggle('active', l === currentLang);
            });
            if (typeof updateSplashLanguageButtons === 'function') {
                updateSplashLanguageButtons(currentLang);
            }
        }

        function applyThemeButtonStyles(mode, effectiveTheme) {
            ['dark', 'light', 'auto'].forEach(m => {
                const btn = document.getElementById(`theme-btn-${m}`);
                if (btn) btn.classList.toggle('active', m === mode);
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
                if (btn) btn.classList.toggle('active', l === targetLang);
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

            runSplashChecks();

            if (!manual) {
                splashTimer = setTimeout(() => {
                    closeStartupBanner();
                }, 10000);
            }
        }


        // Tela de abertura: cada linha mostra um dado REAL lido do backend
        async function runSplashChecks() {
            const bar = document.getElementById('splash-progress-bar');
            const pctText = document.getElementById('splash-pct-text');
            const statusText = document.getElementById('splash-status-text');
            const total = 5;
            let done = 0;
            const mark = (id, state, value) => {
                const row = document.getElementById(id);
                if (!row) return;
                row.className = `ws-splash-step is-done ${state}`;
                row.querySelector('.st').innerHTML = `<span class="ws-dot" style="margin:0;background:var(--${state === 'ok' ? 'ok' : state === 'warn' ? 'warn' : 'bad'})"></span>`;
                row.querySelector('.val').innerText = value;
                row.querySelector('.val').title = value;
                done++;
                const pct = Math.round(done / total * 100);
                if (bar) bar.style.width = `${pct}%`;
                if (pctText) pctText.innerText = `${pct}%`;
                if (window.lucide) lucide.createIcons();
            };
            if (bar) bar.style.width = '0%';
            if (statusText) statusText.innerText = 'Lendo informações do sistema…';

            try {
                const st = await (await fetch('/api/status')).json();
                mark('splash-step-admin', st.admin ? 'ok' : 'warn', st.admin ? 'Administrador' : 'Usuário comum — alguns módulos ficam limitados');
            } catch (e) {
                mark('splash-step-admin', 'bad', 'Serviço local indisponível');
            }
            try {
                const info = (await (await fetch('/api/system/info')).json()).info || {};
                mark('splash-step-os', info.os ? 'ok' : 'warn', info.os ? `${info.os} · build ${info.os_build || '—'}` : 'Não identificado');
                mark('splash-step-cpu', info.cpu ? 'ok' : 'warn', info.cpu ? `${info.cpu} · ${info.cpu_cores || '?'}C/${info.cpu_threads || '?'}T` : 'Não identificado');
                mark('splash-step-ram', info.ram_total_gb ? 'ok' : 'warn', info.ram_total_gb ? `${info.ram_total_gb} GB instalados` : 'Não identificada');
                mark('splash-step-gpu', info.gpu_primary ? 'ok' : 'warn', info.gpu_primary || 'Não identificada');
            } catch (e) {
                ['splash-step-os', 'splash-step-cpu', 'splash-step-ram', 'splash-step-gpu'].forEach(id => mark(id, 'bad', 'Falha na leitura'));
            }
            if (statusText) statusText.innerText = 'Pronto';
        }

        async function loadSidebarAdminStatus() {
            try {
                const st = await (await fetch('/api/status')).json();
                if (st.version) document.querySelectorAll('.ws-app-version').forEach(el => { el.innerText = st.version; });
            } catch (e) { }
        }

        function closeStartupBanner() {
            if (splashTimer) {
                clearTimeout(splashTimer);
                splashTimer = null;
            }
            const modal = document.getElementById('startup-splash-modal');
            if (!modal) return;
            modal.classList.add('is-leaving');
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.display = 'none';
                modal.classList.remove('is-leaving');
            }, 500);
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
            loadSidebarAdminStatus();
            loadSystemInfo();
            loadOverviewDiskHealth();
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

            html.style.colorScheme = effectiveTheme;
            localStorage.setItem('winshield_theme', mode);
            // Canvas não herdam CSS: redesenha os gráficos com as cores do novo tema
            setTimeout(() => {
                try { if (typeof renderStressCharts === 'function') renderStressCharts(); } catch (e) { }
                try { if (window.__lastSectorScan && typeof drawSectorGuardSpeedCurve === 'function') drawSectorGuardSpeedCurve(window.__lastSectorScan); } catch (e) { }
            }, 30);

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
                const tone = type === 'danger' ? 'bad' : (type === 'warning' ? 'warn' : 'brand');
                iconBox.className = `ws-icon lg ${tone}`;
                iconEl.setAttribute('data-lucide', itemIcon || (type === 'danger' ? 'skull' : (type === 'warning' ? 'alert-triangle' : 'shield-check')));
                btnAction.className = type === 'danger' ? 'ws-btn danger' : 'ws-btn primary';

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
            'maintenance': { key: 'nav.group_system', badgeClass: '' },
            'terminal': { key: 'nav.group_system', badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25' }
        };

        function updatePageCategoryBadge(tabId) {
            const badge = document.getElementById('page-category-badge');
            if (!badge) return;
            const info = TAB_CATEGORY_MAP[tabId] || TAB_CATEGORY_MAP['overview'];
            const label = String(t(info.key) || '').toLowerCase();
            badge.innerText = label.charAt(0).toUpperCase() + label.slice(1);
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
            document.title = `${headerInfo.title} — WinShield Pro`;
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
            if (tabId === 'power') loadPowerSchemes();
            if (tabId === 'disk-bench') pollBenchmarkStatus();
            if (tabId === 'network') loadNetworkInfo();
            if (tabId === 'devices') loadDevicesInfo();
            if (tabId === 'stability') {
                loadStabilityInfo();
                if (stabilityMode === 'bench') switchStabilityMode('bench');
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
                btn.classList.toggle('active', match);
            });
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
                tbody.innerHTML = `<tr><td colspan="5" class="ws-empty">Nenhum processo corresponde ao filtro.</td></tr>`;
                return;
            }

            let html = '';
            filtered.forEach(app => {
                const mainTitle = app.titles && app.titles.length > 0 ? app.titles[0] : '';
                const isUserApp = app.category === 'user_app';

                const catBadge = `<span class="ws-badge">${isUserApp ? t('apps.badge_user_app') : t('apps.badge_service')}</span>`;
                const ramPct = Math.min(100, Math.round((app.mem_mb / 1024) * 100));
                const iconName = app.icon_hint || (isUserApp ? 'app-window' : 'cog');
                html += `
                <tr>
                    <td>
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="ws-icon"><i data-lucide="${iconName}"></i></div>
                            <div class="min-w-0">
                                <div class="ws-strong truncate">${escapeHtml(app.name)}</div>
                                <div class="ws-mono text-[11.5px] ws-faint truncate">${escapeHtml(app.exe)} · PID ${app.main_pid}</div>
                            </div>
                        </div>
                    </td>
                    <td>${catBadge}</td>
                    <td class="max-w-[360px]">
                        <div class="truncate" title="${escapeHtml(mainTitle)}">${escapeHtml(mainTitle || (isUserApp ? 'Sem janela visível' : 'Segundo plano'))}</div>
                        ${app.path ? `<div class="ws-mono text-[11px] ws-faint truncate" title="${escapeHtml(app.path)}">${escapeHtml(app.path)}</div>` : ''}
                    </td>
                    <td>
                        <div class="flex items-center gap-2">
                            <span class="ws-mono ws-strong w-16 text-right">${app.mem_mb} MB</span>
                            <div class="ws-meter thin w-16"><span style="width:${ramPct}%"></span></div>
                        </div>
                    </td>
                    <td class="text-right">
                        <div class="flex items-center justify-end gap-1.5">
                            ${app.path ? `<button onclick="openAppFolder(decodeURIComponent('${encodeURIComponent(app.path || '')}'))" class="ws-btn sm ghost" title="Abrir pasta no Explorer">Pasta</button>` : ''}
                            ${app.can_uninstall || isUserApp ? `<button onclick="uninstallRunningApp('${escapeHtml(app.exe)}')" class="ws-btn sm" title="Desinstalar"><i data-lucide="package-x"></i>${t('apps.btn_uninstall')}</button>` : ''}
                            <button onclick="killAppProcess('${app.main_pid}', '${escapeHtml(app.exe)}')" class="ws-btn sm danger" title="Finalizar processo"><i data-lucide="x"></i>${t('apps.btn_kill')}</button>
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
                    document.getElementById('overview-cpu-threads').innerText = `${i.cpu_cores || 0}C / ${i.cpu_threads || 0}T`;

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
                            if (elFree) elFree.innerText = `${freeGb} GB livres`;
                            const elBar = document.getElementById('overview-disk-c-bar');
                            if (elBar) elBar.style.width = `${cVol.percent}%`;
                            const elModel = document.getElementById('overview-disk-c-model');
                            if (elModel) elModel.innerText = `${cVol.label || 'Disco local'} · ${cVol.fs} · ${(cVol.total / (1024 ** 3)).toFixed(0)} GB`;
                        }

                        const vBox = document.getElementById('overview-volumes-list');
                        if (vBox) {
                            if (vBox.children.length !== lv.volumes.length) {
                                vBox.innerHTML = '';
                                lv.volumes.forEach(v => {
                                    const totalGb = (v.total / (1024 ** 3)).toFixed(0);
                                    const freeGb = (v.free / (1024 ** 3)).toFixed(1);
                                    const tone = v.percent >= 90 ? 'bad' : (v.percent >= 75 ? 'warn' : '');
                                    vBox.innerHTML += `
                                        <div data-vol="${v.letter}">
                                            <div class="flex items-center justify-between text-[12.5px] mb-1.5 gap-3">
                                                <span class="truncate" style="color:var(--text-primary);font-weight:600">${v.letter}: <span class="ws-muted" style="font-weight:400">${escapeHtml(v.label || 'Disco local')} · ${escapeHtml(v.fs || '')}</span></span>
                                                <span class="ws-mono ws-muted vol-stat whitespace-nowrap">${freeGb} GB livres de ${totalGb} GB</span>
                                            </div>
                                            <div class="ws-meter ${tone}"><span class="vol-bar" style="width: ${v.percent}%"></span></div>
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
        async function loadOverviewDiskHealth() {
            try {
                const data = await (await fetch('/api/disks/health')).json();
                if (data.status === 'success' && data.disks) {
                    allDisksData = data.disks;
                    updateOverviewFaithfulHealth();
                }
            } catch (e) { }
        }

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

            const tone = h => h >= 90 ? 'ok' : (h >= 70 ? 'info' : (h >= 40 ? 'warn' : 'bad'));
            healthValEl.innerText = `${primaryHealth}%`;
            healthValEl.className = 'ws-stat-value text-[26px]';
            healthValEl.style.color = `var(--${tone(primaryHealth)})`;
            const label = primaryDisk.health_label || (primaryHealth >= 90 ? 'Excelente' : (primaryHealth >= 70 ? 'Bom' : (primaryHealth >= 40 ? 'Atenção' : 'Crítico')));
            healthStatusEl.className = `ws-badge ${tone(primaryHealth)}`;
            healthStatusEl.innerHTML = `<span class="dot"></span>${escapeHtml(label)}`;

            summaryEl.innerText = `${primaryDisk.model} · ${primaryDisk.media}`;

            badgesEl.innerHTML = allDisksData.map(d =>
                `<span class="ws-badge ${tone(d.health)}" title="${escapeHtml(d.model || '')}">Disco ${d.index}: ${d.health}%${d.temperature ? ` · ${d.temperature} °C` : ''}</span>`
            ).join('');
        }

        function renderDiskHealthSelector() {
            const bar = document.getElementById('disk-health-selector-bar');
            bar.innerHTML = '';
            allDisksData.forEach((d, idx) => {
                const isSelected = (idx === selectedDiskIndex);
                const btn = document.createElement('button');
                btn.className = `ws-chip-btn ${isSelected ? 'active' : ''}`;
                btn.onclick = () => {
                    selectedDiskIndex = idx;
                    renderDiskHealthSelector();
                    renderSelectedDiskHealth();
                    loadDiskFeatures(idx);
                };
                const tone = d.health >= 90 ? 'ok' : (d.health >= 70 ? 'info' : (d.health >= 40 ? 'warn' : 'bad'));
                btn.innerHTML = `<i data-lucide="hard-drive" class="w-3.5 h-3.5"></i>Disco ${d.index} · ${escapeHtml(d.model.substring(0, 22))} <span class="ws-mono" style="color:var(--${tone})">${d.health}%</span>`;
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

            const tone = health >= 90 ? 'ok' : (health >= 70 ? 'info' : (health >= 40 ? 'warn' : 'bad'));
            const gauge = document.getElementById('dh-gauge-box');
            gauge.className = `ws-ring ${tone === 'info' ? '' : tone}`;
            const arc = document.getElementById('dh-health-arc');
            if (arc) arc.style.strokeDashoffset = String(452.4 * (1 - health / 100));
            const hb = document.getElementById('dh-health-badge');
            hb.className = `ws-badge ${tone}`;
            hb.innerHTML = `<span class="dot"></span>${escapeHtml(d.health_label || 'Bom')}`;

            // Badges
            const setT = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
            const fmtInt = n => Number(n).toLocaleString('pt-BR');
            const fmtTB = b => b >= 1024 ** 4 ? `${(b / 1024 ** 4).toFixed(2)} TB` : `${(b / 1024 ** 3).toFixed(0)} GB`;
            const hours = d.power_on_hours;
            const daysTxt = (() => {
                if (!hours) return null;
                const days = Math.floor(hours / 24);
                const y = Math.floor(days / 365), rest = days % 365;
                return y > 0 ? `${fmtInt(days)} dias (${y} ano${y > 1 ? 's' : ''} e ${rest} dias)` : `${fmtInt(days)} dias`;
            })();
            const vendor = d.manufacturer || 'Não informado pelo disco';

            setT('dh-disk-temp', d.temperature ? `${d.temperature} °C` : 'N/D');
            setT('dh-disk-days', hours ? `${fmtInt(Math.floor(hours / 24))} dias` : 'N/D');
            setT('dh-disk-hours', hours ? `${fmtInt(hours)} horas ligado` : 'horas ligado: N/D');
            setT('dh-disk-writes', d.host_writes ? fmtTB(d.host_writes) : 'N/D');
            setT('dh-disk-reads', `lido: ${d.host_reads ? fmtTB(d.host_reads) : 'N/D'}`);
            setT('dh-disk-cycles', d.power_cycles ? fmtInt(d.power_cycles) : 'N/D');
            setT('dh-disk-unsafe', `desligamentos inesperados: ${d.unsafe_shutdowns !== null && d.unsafe_shutdowns !== undefined ? fmtInt(d.unsafe_shutdowns) : 'N/D'}`);
            setT('dh-disk-vendor', vendor);
            setT('dh-disk-vendor-top', vendor);
            setT('dh-disk-model-kv', d.model || '—');
            setT('dh-disk-type', [d.media, d.bus, d.rpm ? `${d.rpm} RPM` : null].filter(Boolean).join(' · ') || '—');
            setT('dh-disk-hours-kv', hours ? `${fmtInt(hours)} h` : 'N/D');
            setT('dh-disk-days-kv', daysTxt || 'N/D');
            setT('dh-disk-wear', d.life !== undefined && d.life !== null ? `${100 - d.life}% usado · fonte: ${d.wear_source || 'S.M.A.R.T.'}` : 'N/D');
            setT('dh-disk-life', d.life_remaining_days ? `≈ ${fmtInt(d.life_remaining_days)} dias (≈ ${(d.life_remaining_days / 365).toFixed(1)} anos)` : 'N/D');
            setT('dh-disk-volumes', (d.volumes || []).map(v => `${v.letter}: ${v.label || ''} (${v.fs || ''})`).join(' · ') || '—');

            // Diagnóstico textual
            const issuesBox = document.getElementById('dh-issues-list');
            issuesBox.innerHTML = '';
            (d.issues || []).forEach(iss => {
                const color = iss.level === 'crit' ? 'var(--bad)' : (iss.level === 'warn' ? 'var(--warn)' : 'var(--ok)');
                const icon = iss.level === 'crit' ? 'alert-triangle' : (iss.level === 'warn' ? 'alert-circle' : 'check-circle');
                issuesBox.innerHTML += `
                    <div class="flex items-start gap-2.5">
                        <span class="ws-dot" style="background:${color}"></span>
                        <span style="color:var(--text-secondary)">${escapeHtml(iss.text)}</span>
                    </div>
                `;
            });

            // Tabela SMART ou NVMe
            const tbody = document.getElementById('dh-smart-tbody');
            tbody.innerHTML = '';

            if (d.nvme_list && d.nvme_list.length > 0) {
                document.getElementById('dh-table-title').innerText = 'NVMe SMART / Health Log (página 0x02)';
                document.getElementById('dh-smart-table').querySelector('thead').innerHTML = `<tr><th>Parâmetro</th><th>Valor do controlador</th><th>Condição</th></tr>`;
                d.nvme_list.forEach(row => {
                    const tr = document.createElement('tr');
                    const valStr = row.bytes ? formatBytes(row.bytes) : escapeHtml(row.value);
                    const cond = row.status === 'bad' ? '<span class="ws-badge bad">Alerta</span>' :
                        (row.status === 'warn' ? '<span class="ws-badge warn">Atenção</span>' : '<span class="ws-badge ok">Normal</span>');
                    tr.innerHTML = `<td>${escapeHtml(row.label)}</td><td class="ws-mono ws-strong">${valStr}</td><td>${cond}</td>`;
                    tbody.appendChild(tr);
                });
            } else if (d.smart_list && d.smart_list.length > 0) {
                document.getElementById('dh-table-title').innerText = 'Atributos S.M.A.R.T. (ATA/SATA)';
                document.getElementById('dh-smart-table').querySelector('thead').innerHTML = `<tr><th>ID</th><th>Atributo</th><th>Atual</th><th>Pior</th><th>Limite</th><th>Valor bruto</th><th>Estado</th></tr>`;
                d.smart_list.forEach(attr => {
                    const tr = document.createElement('tr');
                    const isWarn = attr.status === 'warn' || attr.status === 'fail';
                    const statusBadge = attr.status === 'fail' ? '<span class="ws-badge bad">Falha</span>' :
                        (attr.status === 'warn' ? '<span class="ws-badge warn">Aviso</span>' : '<span class="ws-badge ok">OK</span>');
                    if (isWarn) tr.className = 'is-active';
                    tr.innerHTML = `
                        <td class="ws-mono ws-strong">${attr.hex}</td>
                        <td>${escapeHtml(attr.name)}</td>
                        <td class="ws-mono">${attr.current}</td>
                        <td class="ws-mono">${attr.worst}</td>
                        <td class="ws-mono">${attr.threshold || '—'}</td>
                        <td class="ws-mono">${attr.raw.toLocaleString()}</td>
                        <td>${statusBadge}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="7" class="ws-empty">O driver deste controlador não expõe atributos S.M.A.R.T.</td></tr>`;
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
                    sectorGuardPollTimer = setInterval(pollSectorGuardScan, 500);
                    showToast("SurfaceScan", `Leitura física direta do disco de ${drive}: — ${isQuick ? 'modo rápido (32 MiB × 1.200 regiões)' : 'modo completo (100% dos setores; pode levar horas em HDs grandes)'}.`, "info", 5000);
                } else {
                    showToast("Varredura Ocupada", data.message, "warning");
                }
            } catch (e) {
                showToast("Erro ao Iniciar", "Falha ao disparar SurfaceScan: " + e, "error");
            }
        }

        function drawSectorGuardSpeedCurve(sc) {
            const canvas = document.getElementById('sectorguard-speed-canvas');
            if (!canvas) return;
            const curve = sc.speed_curve || [];
            const sum = document.getElementById('sectorguard-speed-summary');
            if (sum) sum.innerText = sc.avg_speed_mb != null ? `mín ${sc.min_speed_mb} · méd ${sc.avg_speed_mb} · máx ${sc.max_speed_mb} MB/s` : 'mín — · méd — · máx — MB/s';
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const W = Math.max(200, Math.round(rect.width)), H = Math.max(80, Math.round(rect.height));
            if (canvas.width !== W * dpr || canvas.height !== H * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
            const ctx = canvas.getContext('2d');
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const cs = getComputedStyle(document.documentElement);
            const grid = cs.getPropertyValue('--border-default').trim() || '#334155';
            const txt = cs.getPropertyValue('--text-muted').trim() || '#94a3b8';
            ctx.clearRect(0, 0, W, H);
            const pl = 48, pr = 8, pt = 8, pb = 18, pw = W - pl - pr, ph = H - pt - pb;
            const vals = curve.filter(v => v != null);
            const maxV = Math.max(50, ...vals) * 1.12;
            ctx.font = '10px "Cascadia Mono", Consolas, monospace'; ctx.fillStyle = txt; ctx.strokeStyle = grid; ctx.lineWidth = 1;
            ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            for (let i = 0; i <= 4; i++) {
                const y = pt + ph * (1 - i / 4);
                ctx.beginPath(); ctx.moveTo(pl, y); ctx.lineTo(pl + pw, y); ctx.stroke();
                ctx.fillText(`${Math.round(maxV * i / 4)}`, pl - 6, y);
            }
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ['0%', '25%', '50%', '75%', '100%'].forEach((l, i) => ctx.fillText(l, pl + pw * i / 4, pt + ph + 4));
            if (!vals.length) return;
            const n = curve.length || 1200;
            ctx.beginPath();
            let started = false;
            curve.forEach((v, i) => {
                if (v == null) { started = false; return; }
                const x = pl + pw * i / (n - 1), y = pt + ph * (1 - v / maxV);
                if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
            });
            ctx.strokeStyle = cs.getPropertyValue('--brand').trim() || '#5b9bff'; ctx.lineWidth = 1.6; ctx.stroke();
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
                    ledEl.className = 'ws-badge';
                    ledEl.innerHTML = '<span class="dot"></span>Parado';
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
                const hms = (sec) => { sec = Math.max(0, Math.round(sec || 0)); return [Math.floor(sec / 3600), Math.floor((sec % 3600) / 60), sec % 60].map(v => String(v).padStart(2, '0')).join(':'); };
                document.getElementById('sectorguard-damaged-val').innerText = `${sc.read_errors || 0} erro(s) em ${sc.damaged_blocks} região(ões)`;
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

                document.getElementById('sectorguard-time-val').innerText = hms(sc.elapsed_sec);

                // Tempo restante estimado
                const remEl = document.getElementById('sectorguard-remaining-val');
                if (remEl) remEl.innerText = sc.running ? hms(sc.remaining_sec) : '--:--';

                // Indicador LED de atividade I/O
                const ledEl = document.getElementById('sectorguard-io-led');
                if (ledEl) {
                    if (sc.running) {
                        ledEl.className = 'ws-badge brand live';
                        ledEl.innerHTML = '<span class="dot"></span>Lendo disco';
                    } else {
                        ledEl.className = 'ws-badge';
                        ledEl.innerHTML = '<span class="dot"></span>Parado';
                    }
                }

                const readGb = ((sc.bytes_read_actual_mb || 0) / 1024).toFixed(1);
                const planGb = ((sc.planned_mb || 0) / 1024).toFixed(1);
                const totGb = (sc.total_mb / 1024).toFixed(1);
                document.getElementById('sectorguard-pos-val').innerText = `${readGb} / ${planGb} GiB lidos de ${totGb} GiB (${Number(sc.progress_percent || 0).toFixed(1)}%)`;
                window.__lastSectorScan = sc;
                drawSectorGuardSpeedCurve(sc);
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
                                (val === 4 ? 'cell-normal' :
                                    (val === 2 ? 'cell-slow' :
                                        (val === 3 ? 'cell-damaged' : 'cell-untested')))
                        );
                        if (val > 0 && sc.speed_curve && sc.speed_curve[i] != null) {
                            el.title = `Região #${i + 1} • ${sc.speed_curve[i]} MB/s`;
                        }
                    }
                }

                if (!sc.running) {
                    clearInterval(sectorGuardPollTimer);
                    sectorGuardPollTimer = null;
                    document.getElementById('sectorguard-start-btn').classList.remove('hidden');
                    document.getElementById('sectorguard-stop-btn').classList.add('hidden');
                    if (sc.error) showToast("SurfaceScan", sc.error, "error", 7000);
                    else showToast("SurfaceScan concluído", sc.status_text || "Varredura finalizada.", sc.damaged_blocks > 0 || sc.slow_blocks > 0 ? "warning" : "success", 6000);
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
                        <div class="ws-tile flex items-center justify-between gap-3">
                            <div class="min-w-0">
                                <div class="ws-strong text-[13px]">Partição ${part.letter ? part.letter + ':' : '(sem letra)'} <span class="ws-mono ws-muted" style="font-weight:400">offset ${Number(part.offset_bytes || 0).toLocaleString('pt-BR')} bytes</span></div>
                                <div class="ws-stat-foot mt-0.5">${escapeHtml(part.status_text)}</div>
                            </div>
                            <span class="ws-badge ${ok ? 'ok' : 'bad'}">${ok ? 'Alinhada (4K)' : 'Desalinhada'}</span>
                        </div>
                    `;
                });

                // 2. Recursos Suportados
                const tbody = document.getElementById('dh-features-tbody');
                tbody.innerHTML = '';
                (feat.features || []).forEach(f => {
                    const tr = document.createElement('tr');
                    const yn = (v, y, n) => v === null || v === undefined ? '<span class="ws-badge">N/D</span>' : `<span class="ws-badge ${v ? 'ok' : ''}">${v ? y : n}</span>`;
                    tr.innerHTML = `
                        <td class="ws-strong">${escapeHtml(f.feature)}</td>
                        <td>${yn(f.supported, 'Sim', 'Não')}</td>
                        <td>${yn(f.active, 'Ativo', 'Inativo')}</td>
                        <td class="ws-muted">${escapeHtml(f.desc)}</td>
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
                document.getElementById('silicon-cpu-tdp').innerText = p.tdp ? `TDP ${p.tdp}` : 'TDP N/D';
                document.getElementById('silicon-cpu-codename').innerText = p.codename || '--';
                document.getElementById('silicon-cpu-tech').innerText = p.technology || '--';
                document.getElementById('silicon-cpu-package').innerText = p.package || '--';
                document.getElementById('silicon-cpu-cores-threads').innerText = `${p.cores || 0}C / ${p.threads || 0}T`;
                document.getElementById('silicon-cpu-instructions').innerText = p.instructions || '--';

                // Clocks
                const clk = c.clocks || {};
                document.getElementById('silicon-clock-live').innerText = clk.live_clock_mhz ? `${clk.live_clock_mhz} MHz` : 'N/D';
                document.getElementById('silicon-clock-mult').innerText = clk.multiplier || 'N/D';
                document.getElementById('silicon-clock-bus').innerText = clk.bus_speed_mhz ? `${clk.bus_speed_mhz} MHz` : 'N/D';

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
                document.getElementById('silicon-mem-slots').innerText = `${mem.slots_used || 0} / ${mem.slots_total || 0}`;

                // SPD
                const spdTbody = document.getElementById('silicon-spd-tbody');
                spdTbody.innerHTML = (mem.modules || []).length ? '' : '<tr><td colspan="5" class="ws-empty">O firmware não informou os módulos.</td></tr>';
                (mem.modules || []).forEach(m => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="ws-mono ws-strong">${escapeHtml(m.locator)}</td>
                        <td>${escapeHtml(m.manufacturer)}</td>
                        <td class="ws-mono">${escapeHtml(m.part_number)}</td>
                        <td class="ws-mono">${m.size_gb} GB</td>
                        <td class="ws-mono">${m.speed_mhz} MHz</td>
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
                    document.getElementById('silicon-bench-single-val').innerText = sVal ? sVal.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '—';
                    document.getElementById('silicon-bench-multi-val').innerText = mVal ? mVal.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '—';
                    document.getElementById('silicon-bench-ratio-val').innerText = b.ratio ? `${Number(b.ratio).toFixed(2)}×` : '—';
                    const sBar = document.getElementById('silicon-bench-single-bar');
                    if (sBar) sBar.style.width = `${Math.min(100, Math.round((sVal / Math.max(sVal, mVal, 1)) * 100))}%`;
                    const mBar = document.getElementById('silicon-bench-multi-bar');
                    if (mBar) mBar.style.width = `${mVal > 0 ? 100 : 0}%`;
                    const d = b.details || {};
                    const det = (x) => x ? `${x.threads}T · SHA-256 ${x.sha256_mb_s} MB/s · zlib ${x.zlib_mb_s} MB/s · FPU ${x.fpu_melem_s} Melem/s (${x.seconds}s medidos${x.variation_pct !== null && x.variation_pct !== undefined ? `, variação ${x.variation_pct}%` : ''})` : '';
                    let msg = 'Pronto para executar (3 s de aquecimento + 20 s medidos por fase, ≈ 50 s no total).';
                    if (b.running) msg = `Executando fase ${b.phase === 'multi' ? 'multi-thread' : 'single-thread'}… ${b.progress || 0}%`;
                    else if (b.phase === 'error') msg = 'O benchmark falhou — veja o console de registros.';
                    else if (b.timestamp) msg = `Concluído em ${b.timestamp}. Single: ${det(d.single)} | Multi: ${det(d.multi)}`;
                    document.getElementById('silicon-bench-status-msg').innerText = msg;
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
                        <span class="ws-badge">${escapeHtml(f)}</span>
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
                    ? `<span class="ws-badge brand live"><span class="dot"></span>Em execução</span> ${escapeHtml(b.current_test || '')}`
                    : (b.phase === 'finished' ? '<span class="ws-badge ok"><span class="dot"></span>Concluído</span>' : '<span class="ws-badge">Parado</span>');
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
                tr.className = 'cursor-pointer';
                tr.onclick = () => {
                    document.querySelectorAll('#audit-table-body tr').forEach(r => r.classList.remove('selected-row'));
                    tr.classList.add('selected-row');
                    selectedAuditItem = item;
                };

                const isHiddenBadge = `<span class="ws-badge ${item.is_hidden ? 'warn' : ''}">${escapeHtml(item.status)}</span>`;

                tr.innerHTML = `
                    <td class="ws-strong">${item.is_hidden ? '<i data-lucide="eye-off" class="w-3.5 h-3.5 inline mr-1.5" style="color:var(--warn)"></i>' : ''}${escapeHtml(item.nome)}</td>
                    <td class="ws-mono">${escapeHtml(item.versao || '—')}</td>
                    <td class="truncate max-w-[180px]">${escapeHtml(item.editor || '—')}</td>
                    <td>${escapeHtml(item.origem || '—')}</td>
                    <td>${isHiddenBadge}</td>
                    <td class="ws-mono text-[11.5px] truncate max-w-[340px]" title="${escapeHtml(item.caminho || '')}">${escapeHtml(item.caminho || '—')}</td>
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
                        loadBarEl.parentElement.className = `ws-meter ${m.load_percent > 90 ? 'bad' : (m.load_percent > 80 ? 'warn' : '')}`;
                    }

                    const pagefileEl = document.getElementById('mem-pagefile-display');
                    if (pagefileEl) {
                        pagefileEl.innerText = `Arquivo de paginação: ${m.pagefile_used_gb} GB em uso de ${m.pagefile_total_gb} GB`;
                    }

                    const mods = m.modules || [];
                    const chBadge = document.getElementById('mem-dual-channel-badge');
                    if (chBadge) {
                        chBadge.innerText = mods.length ? `${mods.length} módulo(s)` : 'Módulos não informados';
                    }
                    const qSpeed = document.getElementById('mem-quick-speed');
                    if (qSpeed) qSpeed.innerText = (mods[0] && mods[0].speed_mhz) ? `${mods[0].speed_mhz} MHz` : 'N/D';
                    const qSlots = document.getElementById('mem-quick-slots');
                    if (qSlots) qSlots.innerText = `${mods.length}`;
                    const qType = document.getElementById('mem-quick-type');
                    if (qType) qType.innerText = (mods[0] && mods[0].type) ? mods[0].type : 'N/D';
                    const qHealth = document.getElementById('mem-quick-health');
                    if (qHealth) {
                        qHealth.innerText = m.load_percent > 90 ? 'Alta' : (m.load_percent > 80 ? 'Elevada' : 'Normal');
                        qHealth.style.color = m.load_percent > 90 ? 'var(--bad)' : (m.load_percent > 80 ? 'var(--warn)' : 'var(--ok)');
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

            if (countEl) countEl.innerText = `${modules.length} módulo(s) · dados do SMBIOS`;

            if (modules.length === 0) {
                grid.innerHTML = '<div class="ws-empty">O firmware não informou os módulos de memória (WMI/SMBIOS).</div>';
                return;
            }

            const speed = mod => {
                const cfg = mod.configured_speed_mhz || mod.speed_mhz;
                const rated = mod.rated_speed_mhz;
                if (!cfg) return 'N/D';
                return rated && rated !== cfg ? `${cfg} MT/s <span class="ws-faint">(nominal ${rated})</span>` : `${cfg} MT/s`;
            };
            grid.innerHTML = `
                <table class="ws-table">
                    <thead><tr><th>Slot</th><th>Fabricante</th><th>Part number</th><th>Capacidade</th><th>Tipo</th><th>Velocidade</th><th>Tensão</th><th>Serial</th></tr></thead>
                    <tbody>${modules.map((mod, idx) => `
                        <tr>
                            <td class="ws-mono ws-strong">${escapeHtml(mod.slot || `DIMM ${idx + 1}`)}</td>
                            <td>${escapeHtml(mod.manufacturer || 'Não informado')}</td>
                            <td class="ws-mono">${escapeHtml(mod.part_number || '—')}</td>
                            <td class="ws-mono ws-strong">${mod.capacity_gb} GB</td>
                            <td>${escapeHtml(mod.type || '—')}${mod.form_factor ? ` <span class="ws-faint">${escapeHtml(mod.form_factor)}</span>` : ''}${mod.ecc ? ' <span class="ws-badge">ECC</span>' : ''}</td>
                            <td class="ws-mono">${speed(mod)}</td>
                            <td class="ws-mono">${escapeHtml(mod.voltage || 'N/D')}</td>
                            <td class="ws-mono ws-faint">${escapeHtml(mod.serial_number || '—')}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>`;
        }

        async function startMemoryTest() {
            const sizeRaw = parseInt(document.getElementById('ramguard-size-select').value);
            const size = Number.isNaN(sizeRaw) ? 0 : sizeRaw;
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
                    if (logBox) logBox.innerHTML = `<p style="color:var(--brand)">[${new Date().toLocaleTimeString()}] ${escapeHtml(data.message)}</p>`;

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
                        const map = { running: ['var(--brand)', 'Em execução'], completed: [st.errors_found ? 'var(--bad)' : 'var(--ok)', 'Concluído'], cancelled: ['var(--warn)', 'Interrompido'] };
                        const [col, txt] = map[st.state] || ['var(--text-faint)', 'Ocioso'];
                        stateEl.innerHTML = `<span class="w-2 h-2 rounded-full" style="background:${col}"></span>${txt}`;
                    }

                    const passInfoEl = document.getElementById('ramguard-pass-info');
                    if (passInfoEl) passInfoEl.innerText = `Passe ${st.current_pass} de ${st.total_passes}`;

                    const speedEl = document.getElementById('ramguard-speed');
                    if (speedEl) speedEl.innerText = `${(st.speed_mb_s || 0).toLocaleString()} MB/s`;

                    const elapsedEl = document.getElementById('ramguard-elapsed');
                    const fmtT = (sec) => { sec = Math.max(0, Math.round(sec || 0)); const m = Math.floor(sec / 60), s2 = sec % 60; return m > 0 ? `${m} min ${String(s2).padStart(2, '0')} s` : `${s2} s`; };
                    if (elapsedEl) elapsedEl.innerText = `Decorrido: ${fmtT(st.elapsed_seconds)}${st.state === 'running' && st.eta_seconds != null ? ` · restante ≈ ${fmtT(st.eta_seconds)}` : ''}`;

                    const patternEl = document.getElementById('ramguard-pattern');
                    if (patternEl) patternEl.innerText = st.current_pattern || 'Padrão celular ativo';

                    const testedMbEl = document.getElementById('ramguard-tested-mb');
                    if (testedMbEl) testedMbEl.innerText = `${(st.tested_mb || 0).toLocaleString('pt-BR')} / ${(st.total_mb || 0).toLocaleString('pt-BR')} MB · ${st.bytes_verified_gb || 0} GB conferidos${st.capped_by_free_memory ? ' · limitado pela RAM livre' : ''}`;

                    const errorsEl = document.getElementById('ramguard-errors');
                    if (errorsEl) {
                        errorsEl.innerText = st.errors_found || 0;
                        errorsEl.style.color = st.errors_found > 0 ? 'var(--bad)' : (st.state === 'completed' ? 'var(--ok)' : '');
                    }

                    const verdictEl = document.getElementById('ramguard-verdict');
                    if (verdictEl) {
                        verdictEl.innerText = st.errors_found > 0 ? 'Falha de memória detectada' : (st.state === 'completed' ? 'Nenhum erro — 100% das palavras conferidas' : (st.state === 'running' ? 'Nenhum erro até agora' : 'Aguardando teste'));
                        verdictEl.style.color = st.errors_found > 0 ? 'var(--bad)' : '';
                    }

                    const pctEl = document.getElementById('ramguard-pct-text');
                    if (pctEl) pctEl.innerText = `${st.progress_percent}%`;

                    const barEl = document.getElementById('ramguard-progress-bar');
                    if (barEl) barEl.style.width = `${st.progress_percent}%`;

                    const logBox = document.getElementById('ramguard-log-output');
                    if (logBox && (Array.isArray(st.results) || Array.isArray(st.error_log))) {
                        const lines = [];
                        (st.results || []).forEach(r => lines.push(`<p style="color:${r.errors ? 'var(--bad)' : 'var(--text-secondary)'}">Passe ${r.pass} · ${escapeHtml(r.algorithm)} — ${r.errors ? r.errors + ' erro(s)' : 'OK'} (${r.seconds} s)</p>`));
                        (st.error_log || []).forEach(msg => lines.push(`<p style="color:var(--bad)">! ${escapeHtml(msg)}</p>`));
                        if (st.state === 'running' && st.current_algorithm) lines.push(`<p style="color:var(--brand)">Executando: ${escapeHtml(st.current_pattern || st.current_algorithm)}</p>`);
                        if (st.state !== 'running' && st.current_pattern) lines.push(`<p style="color:${st.errors_found ? 'var(--bad)' : 'var(--ok)'};font-weight:600">${escapeHtml(st.current_pattern)}</p>`);
                        if (lines.length) {
                            logBox.innerHTML = lines.join('');
                            logBox.scrollTop = logBox.scrollHeight;
                        }
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
                        const upd = (() => {
                            const v = d.AntivirusSignatureLastUpdated;
                            if (!v) return '';
                            const m = String(v).match(/(\d{9,13})/);
                            if (!m) return String(v);
                            const n = Number(m[1]);
                            return new Date(n > 1e11 ? n : n * 1000).toLocaleString('pt-BR');
                        })();
                        document.getElementById('defender-sig-ver').innerText = `Definições ${d.AntivirusSignatureVersion || 'N/D'}${upd ? ' · ' + upd : ''}`;
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
                modeBadge.innerText = mode === 'deep' ? 'Completa' : 'Rápida';
                modeBadge.className = 'ws-badge brand';
            }
            const dot = document.getElementById('av-scan-pulse-dot');
            if (dot) { dot.className = 'w-2 h-2 rounded-full flex-shrink-0'; dot.style.background = 'var(--brand)'; }

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
                    logBox.innerHTML = logLines.map(l => `<p class="truncate">${escapeHtml(l)}</p>`).join('');
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
                    if (dot) { dot.className = 'w-2 h-2 rounded-full flex-shrink-0'; dot.style.background = 'var(--ok)'; }

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
                tbody.innerHTML = `<tr><td colspan="6" class="ws-empty">Varredura Heurística em Andamento...</td></tr>`;
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
                tbody.innerHTML = `<tr><td colspan="6" class="ws-empty">Auditoria Forense System32 &amp; Drivers em Andamento...</td></tr>`;
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
                btn.innerHTML = `<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i><span>Auditando serviços…</span>`;
                lucide.createIcons();
            }

            document.getElementById('threat-count-badge').innerText = "Auditando serviços instalados e consultando inteligência em nuvem...";
            const tbody = document.getElementById('threat-table-body');
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="6" class="ws-empty">Auditando serviços instalados e processos…</td></tr>`;
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
                    origem: item.is_service ? `Serviço Windows (${item.service_name || 'N/A'})` : 'Processo',
                    is_service: !!item.is_service,
                    service_name: item.service_name || ''
                }));
                allThreats = allThreats.filter(x => x.tipo !== 'Cloud Threat').concat(cloudThreats);
                switchThreatSubTab('cloud');
                if (cloudThreats.length === 0) {
                    showToast("Serviços e processos", "Todos os serviços e processos foram verificados: nenhum item suspeito pela lista local de assinaturas.", "success", 4500);
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
                btn.classList.toggle('active', match);
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
                    ? 'Execute "Auditar System32" ou uma varredura para listar os binários assinados.'
                    : 'Nenhum item suspeito encontrado nesta categoria.';
                tbody.innerHTML = `<tr><td colspan="6" class="ws-empty">${msg}</td></tr>`;
                const countBadge = document.getElementById('threat-count-badge');
                if (countBadge) countBadge.innerText = threatActiveSubTab === 'official' ? "0 itens" : "0 itens suspeitos";
                lucide.createIcons();
                return;
            }

            filtered.forEach(threat => {
                const isOfficial = threat.is_official_vendor || threat.classification === 'official_driver' || threat.tipo === 'Official Driver';
                const tr = document.createElement('tr');
                tr.className = 'cursor-pointer';
                tr.onclick = (ev) => {
                    if (ev.target.closest('button')) return;
                    document.querySelectorAll('#threat-table-body tr').forEach(r => r.classList.remove('selected-row'));
                    tr.classList.add('selected-row');
                    selectedThreatItem = threat;
                };

                if (isOfficial) {
                    tr.innerHTML = `
                        <td class="ws-strong">${escapeHtml(threat.processo || threat.name || 'Driver')}${threat.pid ? ` <span class="ws-mono ws-faint" style="font-weight:400">PID ${threat.pid}</span>` : ''}</td>
                        <td>${escapeHtml(threat.origem || threat.vendor_display || 'Fabricante')}</td>
                        <td><span class="ws-badge ok">Assinado</span></td>
                        <td class="ws-muted max-w-[360px]">${escapeHtml(threat.diagnostico || 'Assinatura digital válida do fabricante')}</td>
                        <td class="ws-mono text-[11.5px] truncate max-w-[300px]" title="${escapeHtml(threat.caminho || '')}">${escapeHtml(threat.caminho || '—')}</td>
                        <td class="text-right"><span class="ws-badge ok">Verificado</span></td>
                    `;
                } else {
                    const isCrit = threat.nivel === 'CRÍTICO';
                    const isService = !!threat.is_service || !!threat.service_name;
                    tr.innerHTML = `
                        <td class="ws-strong">${escapeHtml(threat.processo || 'Item')}${threat.pid ? ` <span class="ws-mono ws-faint" style="font-weight:400">PID ${threat.pid}</span>` : ''}</td>
                        <td>${isService ? `Serviço: <span class="ws-mono">${escapeHtml(threat.service_name || threat.origem)}</span>` : escapeHtml(threat.origem || threat.tipo || 'Sistema')}</td>
                        <td><span class="ws-badge ${isCrit ? 'bad' : 'warn'}">${escapeHtml(threat.nivel || 'ALTO')}</span></td>
                        <td class="max-w-[360px]">${escapeHtml(threat.diagnostico || 'Comportamento suspeito')}</td>
                        <td class="ws-mono text-[11.5px] truncate max-w-[300px]" title="${escapeHtml(threat.caminho || '')}">${escapeHtml(threat.caminho || (isService ? 'Registro de serviço' : 'Memória'))}</td>
                        <td class="text-right">
                            <div class="flex items-center justify-end gap-1.5">
                                ${(!isService && threat.caminho) ? `<button onclick="deleteThreatDirectly(decodeURIComponent('${encodeURIComponent(threat.caminho || '')}'), '${threat.pid || ''}', false, '')" class="ws-btn sm" title="Mover para a quarentena"><i data-lucide="archive"></i>${t('antivirus.btn_quarantine')}</button>` : ''}
                                <button onclick="deleteThreatDirectly(decodeURIComponent('${encodeURIComponent(threat.caminho || '')}'), '${threat.pid || ''}', true, '${escapeHtml(threat.service_name || '')}')" class="ws-btn sm danger"><i data-lucide="${isService ? 'server-off' : 'trash-2'}"></i>${isService ? 'Remover serviço' : t('antivirus.btn_delete')}</button>
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
                    ? `${filtered.length} binário(s) com assinatura válida`
                    : `${filtered.length} item(ns) suspeito(s)`;
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
                grid.innerHTML = '<div class="ws-empty sm:col-span-2 xl:col-span-4">Nenhuma análise nesta sessão.</div>';
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
                <label class="ws-option !items-start">
                    <input type="checkbox" id="chk-clean-${cat.key}" ${isChecked ? 'checked' : ''} class="mt-0.5">
                    <div class="min-w-0 flex-1">
                        <div class="t">${escapeHtml(cat.label)}</div>
                        <div class="d ws-mono">${Number(cat.files || 0).toLocaleString('pt-BR')} arquivos · <b style="color:var(--text-primary)">${escapeHtml(cat.formatted || '0 B')}</b></div>
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
            const card = document.querySelector(`#pw-plan-grid [data-plan="${type}"]`);
            if (card) card.style.opacity = '0.6';
            try {
                const res = await fetch('/api/power/set', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan: type })
                });
                const data = await res.json();
                showToast("Plano de Energia", data.message, data.status === 'success' ? "success" : "error");
            } catch (e) {
                showToast("Erro", "Erro ao aplicar plano: " + e, "error");
            }
            if (card) card.style.opacity = '';
            loadPowerSchemes();
        }

        async function createCustomPlan() {
            const name = document.getElementById('custom-plan-name').value;
            const mon = document.getElementById('custom-plan-monitor').value;
            const stb = document.getElementById('custom-plan-standby').value;
            const minEl = document.getElementById('custom-plan-min');
            const maxEl = document.getElementById('custom-plan-max');
            const cpuMin = minEl ? Number(minEl.value) : 100;
            const cpuMax = maxEl ? Number(maxEl.value) : 100;
            if (cpuMin > cpuMax) {
                showToast("Valores inválidos", "A CPU mínima não pode ser maior que a máxima.", "warning");
                return;
            }
            try {
                const res = await fetch('/api/power/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name, monitor: mon, standby: stb, cpu_min: cpuMin, cpu_max: cpuMax })
                });
                const data = await res.json();
                showToast(data.status === 'success' ? "Plano Criado" : "Falha ao criar plano", data.message, data.status === 'success' ? "success" : "error");
                loadPowerSchemes();
            } catch (e) {
                showToast("Erro", "Erro ao criar plano: " + e, "error");
            }
        }


        // Preenchimento dos sliders ws-range (CSS var --p = posição atual)
        function updateRangeFill(el) {
            if (!el) return;
            const min = Number(el.min || 0), max = Number(el.max || 100);
            el.style.setProperty('--p', `${((Number(el.value) - min) / Math.max(1, max - min)) * 100}%`);
        }
        document.addEventListener('input', e => { if (e.target.classList && e.target.classList.contains('ws-range')) updateRangeFill(e.target); });
        window.addEventListener('DOMContentLoaded', () => document.querySelectorAll('.ws-range').forEach(updateRangeFill));

        const POWER_DEFAULT_GUIDS = new Set([
            '381b4222-f694-41f0-9685-ff5bb260df2e',
            '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c',
            'a1841308-3541-4fab-bc81-f71556f20b4a'
        ]);
        const POWER_PLAN_MATCH = {
            ultimate: { guids: ['e9a42b02-d5df-448d-aa00-03f14749eb61'], names: ['desempenho máximo', 'ultimate performance', 'máximo rendimiento'] },
            high: { guids: ['8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c'], names: ['alto desempenho', 'high performance', 'alto rendimiento'] },
            balanced: { guids: ['381b4222-f694-41f0-9685-ff5bb260df2e'], names: ['equilibrado', 'balanced'] },
            powersave: { guids: ['a1841308-3541-4fab-bc81-f71556f20b4a'], names: ['economia de energia', 'power saver', 'economizador'] }
        };

        async function loadPowerSchemes() {
            try {
                const res = await fetch('/api/power/list');
                const data = await res.json();
                const tbody = document.getElementById('power-schemes-body');
                tbody.innerHTML = '';
                (data.schemes || []).forEach(s => {
                    const tr = document.createElement('tr');
                    if (s.ativo) tr.className = 'is-active';
                    const canDelete = !s.ativo && !POWER_DEFAULT_GUIDS.has((s.guid || '').toLowerCase());
                    tr.innerHTML = `
                        <td><span class="font-semibold" style="color:var(--text-primary)">${escapeHtml(s.nome)}</span></td>
                        <td class="ws-mono text-[11.5px]" style="color:var(--text-muted)">${escapeHtml(s.guid)}</td>
                        <td>${s.ativo ? '<span class="ws-badge ok"><span class="dot"></span>Ativo</span>' : '<span class="ws-badge">Instalado</span>'}</td>
                        <td class="text-right">
                            <div class="flex items-center justify-end gap-1.5">
                                ${!s.ativo ? `<button onclick="activatePowerScheme('${s.guid}')" class="ws-btn sm">Ativar</button>` : ''}
                                ${canDelete ? `<button onclick="deletePowerScheme('${s.guid}', '${escapeHtml(s.nome)}')" class="ws-btn sm danger" title="Excluir esquema de energia">Excluir</button>` : ''}
                            </div>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
                lucide.createIcons();
            } catch (e) { }
            if (currentTab === 'power') loadPowerDetails(true);
        }

        async function loadPowerDetails(force = false) {
            try {
                const res = await fetch('/api/power/details' + (force ? '?force=1' : ''));
                const data = await res.json();
                if (data && data.details) renderPowerDetails(data.details);
            } catch (e) {
                const badge = document.getElementById('pw-source-badge');
                if (badge) { badge.className = 'ws-badge bad'; badge.innerHTML = '<span class="dot"></span>Falha ao ler powercfg'; }
            }
        }

        function renderPowerDetails(d) {
            const st = d.settings || {};
            const pct = v => (v === null || v === undefined) ? 'N/D' : `${v}%`;
            const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.innerText = txt; };

            setText('pw-active-name', d.active_name || 'Plano desconhecido');
            setText('pw-active-guid', d.active_guid || '—');
            const badge = document.getElementById('pw-source-badge');
            if (badge) { badge.className = 'ws-badge ok'; badge.innerHTML = `<span class="dot"></span>Lido às ${escapeHtml(d.read_at || '')}`; }
            const bat = document.getElementById('pw-battery');
            if (bat) bat.innerText = d.battery ? `· Bateria ${d.battery.percent}% ${d.battery.plugged ? '(na tomada)' : '(descarregando)'}` : '· Desktop (sem bateria)';

            setText('pw-stat-min', pct(st.cpu_min && st.cpu_min.ac));
            setText('pw-stat-max', pct(st.cpu_max && st.cpu_max.ac));
            setText('pw-stat-boost', (st.boost && st.boost.label) || 'N/D');
            setText('pw-stat-park', pct(st.core_parking && st.core_parking.ac));

            const slider = (id, s) => {
                const el = document.getElementById(id);
                if (!el || !s || s.ac === null || s.ac === undefined) return;
                if (document.activeElement !== el) el.value = s.ac;
                updateRangeFill(el);
                setText(id + '-val', `${s.ac}%`);
            };
            slider('pw-cpu-min', st.cpu_min);
            slider('pw-cpu-max', st.cpu_max);
            slider('pw-park', st.core_parking);

            const fillSelect = (id, names, s) => {
                const el = document.getElementById(id);
                if (!el || !names) return;
                if (el.options.length !== names.length) el.innerHTML = names.map((n, i) => `<option value="${i}">${escapeHtml(n)}</option>`).join('');
                if (s && s.ac !== null && s.ac !== undefined) el.value = String(s.ac);
            };
            fillSelect('pw-boost', d.boost_modes, st.boost);
            fillSelect('pw-aspm', d.aspm_modes, st.aspm);

            const timeSelect = (id, s) => {
                const el = document.getElementById(id);
                if (!el || !s || s.ac === null || s.ac === undefined) return;
                const val = String(s.ac);
                if (![...el.options].some(o => o.value === val)) {
                    const m = Math.round(s.ac / 60);
                    el.insertAdjacentHTML('beforeend', `<option value="${val}">${m >= 60 ? (m / 60).toFixed(1) + ' h' : m + ' min'} (atual)</option>`);
                }
                el.value = val;
            };
            timeSelect('pw-monitor', st.monitor);
            timeSelect('pw-sleep', st.sleep);
            timeSelect('pw-disk', st.disk);

            const name = (d.active_name || '').toLowerCase();
            const guid = (d.active_guid || '').toLowerCase();
            document.querySelectorAll('#pw-plan-grid [data-plan]').forEach(card => {
                const m = POWER_PLAN_MATCH[card.dataset.plan];
                const active = m && (m.guids.includes(guid) || m.names.some(n => name === n || name.startsWith(n)));
                card.classList.toggle('is-active', !!active);
                const b = card.querySelector('[data-active-badge]');
                if (b) b.classList.toggle('hidden', !active);
            });
        }

        async function setPowerSetting(key, value) {
            try {
                const res = await fetch('/api/power/setting', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: key, value: Number(value) })
                });
                const data = await res.json();
                showToast(data.status === 'success' ? "Ajuste confirmado" : "Ajuste não aplicado", data.message, data.status === 'success' ? "success" : "error", 2600);
                if (data.details) renderPowerDetails(data.details);
            } catch (e) {
                showToast("Erro", "Falha ao alterar configuração: " + e, "error");
                loadPowerDetails(true);
            }
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
            doneBtn.className = "ws-btn";
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
                if (threadsEl) threadsEl.innerText = `${hw.cores || hw.cpu_cores || '--'} núcleos · ${hw.threads || hw.cpu_threads || '--'} threads`;
                if (ramEl) ramEl.innerText = `${hw.ram_gb || '--'} GB`;
                if (ramTierEl) ramTierEl.innerText = hw.ram_gb >= 15 ? 'Alta capacidade (16 GB+)' : 'Capacidade moderada';
                if (gpuEl) gpuEl.innerText = hw.gpu || hw.gpu_name || 'GPU Detectada';
                if (gpuTypeEl) gpuTypeEl.innerText = hw.is_dedicated_gpu ? 'Dedicada (PCIe)' : 'Integrada';
                if (storageEl) storageEl.innerText = hw.storage_type || 'SSD / Disco';
                if (storageModelEl) storageModelEl.innerText = 'Unidade do sistema';
                if (recCountEl) {
                    const recCnt = services.filter(s => s.recommended && !MAINTENANCE_TASKS.has(s.id || s.key)).length;
                    recCountEl.innerText = `· ${recCnt} recomendados para esta máquina`;
                }

                await loadOptimizeStates();
                renderOptimizeServices();

                if (manual) {
                    showToast("Hardware Reanalisado", `Perfil adaptativo calibrado: ${hw.profile_name || 'OK'}`, "success", 2500);
                }
            } catch (e) {
                console.error("Erro ao carregar perfil adaptativo:", e);
            }
        }


        // Ações pontuais (sem configuração gravada) ficam na página Manutenção
        const MAINTENANCE_TASKS = new Set(['clean_ram', 'trim', 'sfc', 'dism', 'dism_cleanup', 'chkdsk', 'restore_point', 'network_reset']);
        let optimizeStates = {};
        let optimizeFilter = 'all';

        async function loadOptimizeStates() {
            try {
                const res = await fetch('/api/optimize/state');
                const data = await res.json();
                optimizeStates = (data && data.state) || {};
            } catch (e) {
                optimizeStates = {};
            }
        }

        function setOptimizeFilter(f) {
            optimizeFilter = f;
            document.querySelectorAll('#opt-filter [data-filter]').forEach(b => b.classList.toggle('active', b.dataset.filter === f));
            renderOptimizeServices();
        }

        function renderOptimizeServices() {
            const gridEl = document.getElementById('opt-adaptive-services-grid');
            const services = ((currentAdaptiveProfile && currentAdaptiveProfile.services) || []).filter(x => !MAINTENANCE_TASKS.has(x.id || x.key));
            if (!gridEl || services.length === 0) return;

            const stateOf = s => (optimizeStates[s.id || s.key] || {});
            const verifiable = services.filter(s => stateOf(s).applied === true || stateOf(s).applied === false);
            const applied = verifiable.filter(s => stateOf(s).applied === true);
            const pending = services.filter(s => stateOf(s).applied === false);
            const counts = { all: services.length, recommended: services.filter(s => s.recommended).length, pending: pending.length, applied: applied.length };
            document.querySelectorAll('#opt-filter [data-count]').forEach(el => { el.innerText = counts[el.dataset.count] ?? 0; });

            // Placar: ajustes verificáveis aplicados / total verificável
            const total = verifiable.length;
            const ratio = total ? applied.length / total : 0;
            const arc = document.getElementById('opt-score-arc');
            if (arc) arc.style.strokeDashoffset = String(452.4 * (1 - ratio));
            const sv = document.getElementById('opt-score-value');
            if (sv) sv.innerText = total ? `${applied.length}/${total}` : '—';
            const sf = document.getElementById('opt-score-foot');
            if (sf) sf.innerText = total ? 'ajustes aplicados' : 'estado indisponível';

            const list = services.filter(s => {
                const ap = stateOf(s).applied;
                if (optimizeFilter === 'recommended') return s.recommended;
                if (optimizeFilter === 'pending') return ap === false;
                if (optimizeFilter === 'applied') return ap === true;
                return true;
            });
            if (list.length === 0) {
                gridEl.innerHTML = `<div class="ws-empty md:col-span-2 2xl:col-span-3">${optimizeFilter === 'pending' ? 'Nenhum ajuste pendente — tudo o que é verificável já está aplicado.' : 'Nenhum ajuste nesta categoria.'}</div>`;
                return;
            }
            gridEl.innerHTML = list.map(s => {
                const taskId = s.id || s.key;
                const st = stateOf(s);
                const ap = st.applied;
                const stateBadge = ap === true ? '<span class="ws-badge ok"><span class="dot"></span>Aplicado</span>'
                    : ap === false ? '<span class="ws-badge warn"><span class="dot"></span>Pendente</span>'
                        : '<span class="ws-badge">Ação pontual</span>';
                const rec = s.recommended ? '<span class="ws-badge brand">Recomendado</span>' : '';
                const iconName = (s.icon || 'zap').toLowerCase();
                return `
                    <div class="ws-tweak ws-fade-in ${ap === true ? 'is-applied' : ''}">
                        <div class="flex items-start gap-3">
                            <div class="ws-icon ${ap === true ? 'ok' : ''}"><i data-lucide="${escapeHtml(iconName)}"></i></div>
                            <div class="min-w-0 flex-1">
                                <span class="ws-kicker">${escapeHtml(s.category || 'Sistema')}</span>
                                <div class="ws-tweak-title mt-0.5">${escapeHtml(s.title)}</div>
                            </div>
                        </div>
                        <p class="ws-tweak-desc">${escapeHtml(s.desc)}</p>
                        <div class="ws-tweak-state" title="Estado lido do Windows">${escapeHtml(st.detail || s.hardware_tag || '—')}</div>
                        <div class="ws-tweak-foot">
                            <div class="flex flex-wrap gap-1.5">${stateBadge}${rec}</div>
                            <button onclick="runSingleOptimizationModal('${escapeHtml(taskId)}')" class="ws-btn sm ${ap === true ? 'ghost' : ''}">
                                <i data-lucide="${ap === true ? 'rotate-cw' : 'play'}"></i>${ap === true ? 'Reaplicar' : 'Aplicar'}
                            </button>
                        </div>
                    </div>`;
            }).join('');
            lucide.createIcons();
        }

        // Marca uma etapa do modal conforme o resultado REAL devolvido pelo backend
        function markOptimizeStep(iconEl, statusEl, data) {
            const ok = data && data.status === 'success';
            const verified = data && data.state && data.state.applied === true;
            if (iconEl) {
                iconEl.className = `ws-step-icon ${ok ? 'ok' : 'bad'}`;
                iconEl.innerHTML = `<i data-lucide="${ok ? 'check' : 'x'}" class="w-4 h-4"></i>`;
                const row = iconEl.closest('.ws-step');
                if (row) row.className = 'ws-step';
            }
            if (statusEl) {
                statusEl.className = 'ws-mono text-[11.5px] flex-shrink-0';
                statusEl.style.color = ok ? 'var(--ok)' : 'var(--bad)';
                const secs = data && data.elapsed !== undefined ? ` · ${data.elapsed}s` : '';
                statusEl.innerText = ok ? (verified ? `Verificado${secs}` : `Concluído${secs}`) : (data && data.state && data.state.applied === false ? 'Não confirmado' : 'Falhou');
            }
            return ok;
        }

        async function runHardwareAdaptivePipeline() {
            if (!currentAdaptiveProfile) {
                await loadOptimizationProfile(false);
            }
            const recServices = (currentAdaptiveProfile && Array.isArray(currentAdaptiveProfile.services))
                ? currentAdaptiveProfile.services.filter(s => s.recommended && !MAINTENANCE_TASKS.has(s.id || s.key) && (optimizeStates[s.id || s.key] || {}).applied !== true)
                : [];
            if (currentAdaptiveProfile && recServices.length === 0) {
                showToast("Nada a aplicar", "Todos os ajustes recomendados já estão aplicados e verificados neste PC.", "success");
                return;
            }

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
                <div id="pipe-row-${idx}" class="ws-step">
                    <div class="flex items-center gap-3 min-w-0">
                        <span id="pipe-icon-${idx}" class="ws-step-icon"><span class="ws-mono">${idx + 1}</span></span>
                        <div class="min-w-0">
                            <p class="ws-strong text-[12.5px] truncate">${escapeHtml(s.name)}</p>
                            <p class="ws-stat-foot truncate">${escapeHtml(s.desc)}</p>
                        </div>
                    </div>
                    <span id="pipe-status-${idx}" class="ws-mono text-[11.5px] ws-faint flex-shrink-0">Pendente</span>
                </div>
            `).join('');
            lucide.createIcons();

            appendOptimizeModalLog(`[${new Date().toLocaleTimeString()}] Iniciando Pipeline Adaptativo para: ${hwTitle}`);
            let failed = 0;

            for (let i = 0; i < steps.length; i++) {
                const s = steps[i];
                const pct = Math.round((i / steps.length) * 100);
                setOptimizeModalProgress(pct, `Etapa ${i + 1} de ${steps.length}: ${s.name}`);

                const row = document.getElementById(`pipe-row-${i}`);
                const icon = document.getElementById(`pipe-icon-${i}`);
                const st = document.getElementById(`pipe-status-${i}`);

                if (row) row.className = "ws-step is-running";
                if (icon) {
                    icon.className = "ws-step-icon";
                    icon.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 ws-spin"></i>`;
                }
                if (st) {
                    st.className = "ws-mono text-[11.5px] flex-shrink-0";
                    st.innerText = "Aplicando...";
                }
                lucide.createIcons();

                appendOptimizeModalLog(`--> [${i + 1}/${steps.length}] Aplicando: ${s.name}`);

                let data = null;
                try {
                    const res = await fetch('/api/optimize/run', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ task: s.key, sync: true })
                    });
                    data = await res.json();
                    if (data.output) appendOptimizeModalLog(data.output);
                } catch (e) {
                    appendOptimizeModalLog(`Aviso na etapa ${s.name}: ${e}`);
                }
                if (!markOptimizeStep(icon, st, data)) failed++;
                lucide.createIcons();
            }

            setOptimizeModalProgress(100, failed ? `${steps.length - failed} de ${steps.length} ajustes aplicados — ${failed} não confirmado(s).` : `Todos os ${steps.length} ajustes foram aplicados e verificados.`);
            appendOptimizeModalLog(`[${new Date().toLocaleTimeString()}] Otimização Adaptativa Finalizada.`);

            if (optModalTimer) { clearInterval(optModalTimer); optModalTimer = null; }
            const doneBtn = document.getElementById('opt-modal-done-btn');
            doneBtn.disabled = false;
            doneBtn.className = "ws-btn primary";
            doneBtn.innerText = t('opt_modal.btn_done') || "Concluído";
            showToast("Otimização Adaptativa", failed ? `${failed} ajuste(s) não confirmado(s). Execute o WinShield como administrador.` : `${steps.length} ajustes aplicados e verificados.`, failed ? "warning" : "success");
            loadOptimizeStates().then(renderOptimizeServices);
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
                <div class="ws-step is-running">
                    <div class="flex items-center gap-3 min-w-0">
                        <span id="opt-step-icon-0" class="ws-step-icon"><i data-lucide="loader-2" class="w-4 h-4 ws-spin"></i></span>
                        <div class="min-w-0">
                            <p class="ws-strong text-[12.5px] truncate">${escapeHtml(info.name)}</p>
                            <p class="ws-stat-foot truncate">${escapeHtml(info.desc)}</p>
                        </div>
                    </div>
                    <span id="opt-step-status-0" class="ws-mono text-[11.5px] flex-shrink-0">Executando…</span>
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

                const ok = markOptimizeStep(document.getElementById('opt-step-icon-0'), document.getElementById('opt-step-status-0'), data);
                setOptimizeModalProgress(100, ok ? `${info.name}: concluído.` : `${info.name}: não foi possível confirmar a execução.`);
                if (data.output) {
                    appendOptimizeModalLog(data.output);
                }
                appendOptimizeModalLog(`[${new Date().toLocaleTimeString()}] ${ok ? 'Finalizado.' : 'Finalizado com falha (código de saída ou verificação).'}`);
                loadOptimizeStates().then(renderOptimizeServices);
            } catch (err) {
                setOptimizeModalProgress(100, "Erro ao executar tarefa.");
                appendOptimizeModalLog(`[${new Date().toLocaleTimeString()}] Erro: ${err}`);
            }

            if (optModalTimer) { clearInterval(optModalTimer); optModalTimer = null; }
            const doneBtn = document.getElementById('opt-modal-done-btn');
            doneBtn.disabled = false;
            doneBtn.className = "ws-btn primary";
            doneBtn.innerText = t('opt_modal.btn_done') || "Concluído";
            lucide.createIcons();
        }

        async function runCompleteOptimizationPipeline() {
            const steps = [
                { key: 'restore_point', name: '1. Ponto de restauração', desc: 'Checkpoint-Computer' },
                { key: 'clean_ram', name: '2. Liberar memória RAM', desc: 'EmptyWorkingSet em todos os processos' },
                { key: 'trim', name: '3. TRIM dos SSDs', desc: 'Optimize-Volume -ReTrim' },
                { key: 'sfc', name: '4. SFC /SCANNOW', desc: 'Verificação de arquivos protegidos' },
                { key: 'dism', name: '5. DISM RestoreHealth', desc: 'Reparo da imagem de componentes' }
            ];

            openOptimizeModal("Rotina de manutenção completa", `${steps.length} etapas em sequência`);

            const stepsList = document.getElementById('opt-steps-list');
            stepsList.innerHTML = steps.map((s, idx) => `
                <div id="pipe-row-${idx}" class="ws-step">
                    <div class="flex items-center gap-3 min-w-0">
                        <span id="pipe-icon-${idx}" class="ws-step-icon"><span class="ws-mono">${idx + 1}</span></span>
                        <div class="min-w-0">
                            <p class="ws-strong text-[12.5px] truncate">${escapeHtml(s.name)}</p>
                            <p class="ws-stat-foot truncate">${escapeHtml(s.desc)}</p>
                        </div>
                    </div>
                    <span id="pipe-status-${idx}" class="ws-mono text-[11.5px] ws-faint flex-shrink-0">Pendente</span>
                </div>
            `).join('');
            lucide.createIcons();

            appendOptimizeModalLog(`[${new Date().toLocaleTimeString()}] Iniciando Pipeline Completo WinShield Enterprise...`);
            let fullFailed = 0;

            for (let i = 0; i < steps.length; i++) {
                const s = steps[i];
                const pct = Math.round((i / steps.length) * 100);
                setOptimizeModalProgress(pct, `Etapa ${i + 1} de ${steps.length}: ${s.name}`);

                const row = document.getElementById(`pipe-row-${i}`);
                const icon = document.getElementById(`pipe-icon-${i}`);
                const st = document.getElementById(`pipe-status-${i}`);

                if (row) row.className = "ws-step is-running";
                if (icon) {
                    icon.className = "ws-step-icon";
                    icon.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 ws-spin"></i>`;
                }
                if (st) {
                    st.className = "ws-mono text-[11.5px] flex-shrink-0";
                    st.innerText = "Executando...";
                }
                lucide.createIcons();

                appendOptimizeModalLog(`--> [${i + 1}/${steps.length}] Executando: ${s.name}`);

                let data = null;
                try {
                    const res = await fetch('/api/optimize/run', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ task: s.key, sync: true })
                    });
                    data = await res.json();
                    if (data.output) {
                        appendOptimizeModalLog(data.output);
                    }
                } catch (e) {
                    appendOptimizeModalLog(`Aviso na etapa ${s.name}: ${e}`);
                }
                if (!markOptimizeStep(icon, st, data)) fullFailed++;
                lucide.createIcons();
            }

            setOptimizeModalProgress(100, fullFailed ? `${steps.length - fullFailed} de ${steps.length} etapas concluídas — ${fullFailed} com falha.` : `As ${steps.length} etapas foram concluídas.`);
            appendOptimizeModalLog(`[${new Date().toLocaleTimeString()}] Rotina finalizada: ${steps.length - fullFailed}/${steps.length} etapas com sucesso.`);
            loadOptimizeStates().then(renderOptimizeServices);

            if (optModalTimer) { clearInterval(optModalTimer); optModalTimer = null; }
            const doneBtn = document.getElementById('opt-modal-done-btn');
            doneBtn.disabled = false;
            doneBtn.className = "ws-btn primary";
            doneBtn.innerText = t('opt_modal.btn_done') || "Concluído";
            showToast("Rotina completa", fullFailed ? `${fullFailed} etapa(s) falharam — veja o registro.` : "Todas as etapas foram concluídas.", fullFailed ? "warning" : "success");
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

            document.getElementById('term-exec-shell-badge').innerText = mode;
            document.getElementById('term-exec-cmd-text').innerText = cmd;
            document.getElementById('term-exec-status').innerHTML = `<span class="ws-badge brand live"><span class="dot"></span>Executando</span>`;
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

                const ok = data.code === 0;
                document.getElementById('term-exec-status').innerHTML = `<span class="ws-badge ${ok ? 'ok' : 'bad'}"><span class="dot"></span>${ok ? 'Concluído' : 'Falhou'} · código ${data.code ?? '?'}</span>`;
                document.getElementById('term-exec-output').innerText = data.output || "(sem saída de texto)";
                lucide.createIcons();
                showToast("Terminal", ok ? "Comando concluído (código 0)." : `O comando terminou com código ${data.code ?? '?'}.`, ok ? "success" : "warning", 2500);
            } catch (e) {
                if (termTimer) { clearInterval(termTimer); termTimer = null; }
                document.getElementById('term-exec-status').innerHTML = `<span class="ws-badge bad"><span class="dot"></span>Falha de execução</span>`;
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
                if (sigBar) { sigBar.parentElement.style.display = ''; sigBar.style.width = `${net.wifi_signal}%`; }
                const ssidEl = document.getElementById('net-wifi-ssid');
                if (ssidEl) ssidEl.innerText = net.wifi_ssid || '--';
                const detailsEl = document.getElementById('net-wifi-details');
                if (detailsEl) {
                    const quality = Number(net.wifi_signal) >= 80 ? 'Sinal Excelente' : Number(net.wifi_signal) >= 60 ? 'Sinal Bom' : Number(net.wifi_signal) >= 40 ? 'Sinal Moderado' : 'Sinal Fraco';
                    detailsEl.innerText = `${quality} • Canal ${net.wifi_channel || '--'} • ${net.wifi_protocol || '802.11'}`;
                }
            } else {
                if (sigVal) sigVal.innerText = 'Cabeada';
                if (sigBar) sigBar.parentElement.style.display = 'none';
                const ssidEl = document.getElementById('net-wifi-ssid');
                if (ssidEl) ssidEl.innerText = 'Ethernet';
                const detailsEl = document.getElementById('net-wifi-details');
                if (detailsEl) detailsEl.innerText = 'Sem medição de sinal (conexão por cabo)';
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
                statusEl.className = 'text-[12px]'; statusEl.style.color = net.connected ? 'var(--ok)' : 'var(--bad)';
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
                tbody.innerHTML = `<tr><td colspan="7" class="ws-empty">Enviando pacotes ICMP…</td></tr>`;
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
                tbody.innerHTML = `<tr><td colspan="7" class="ws-empty">Nenhum servidor testado.</td></tr>`;
                return;
            }

            tbody.innerHTML = results.map(r => pingRowHtml(r)).join('');
        }

        function pingRowHtml(r, highlight = false) {
            const avgNum = Number(r.avg_ms ?? r.avg ?? 999);
            const offline = (r.packets_recv ?? 0) === 0;
            const tone = offline ? 'bad' : (avgNum > 100 ? 'bad' : (avgNum > 50 ? 'warn' : 'ok'));
            return `
                <tr${highlight ? ' class="is-active"' : ''}>
                    <td class="ws-strong">${escapeHtml(r.name || r.server || 'Servidor')}</td>
                    <td class="ws-mono">${escapeHtml(r.host)}</td>
                    <td class="ws-mono">${r.packets_recv ?? 0}/${r.packets_sent ?? 0}</td>
                    <td class="ws-mono">${r.packet_loss ?? 0}%</td>
                    <td class="ws-mono">${r.min_ms ?? r.min ?? '—'} / ${r.max_ms ?? r.max ?? '—'} ms</td>
                    <td class="ws-mono ws-strong">${offline ? '—' : `${r.avg_ms ?? r.avg ?? '—'} ms`}</td>
                    <td><span class="ws-badge ${tone}">${escapeHtml(r.rating || r.quality || '—')}</span></td>
                </tr>`;
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
                        const cur = tbody.querySelector('.ws-empty') ? '' : tbody.innerHTML;
                        tbody.innerHTML = pingRowHtml(r, true) + cur;
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
            const baseClass = "ws-phase";
            const activePing = "ws-phase active";
            const activeDl = "ws-phase active";
            const activeUl = "ws-phase active";

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
            if (phaseLabel) phaseLabel.innerText = 'Localizando servidor';
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
                    if (phaseLabel) phaseLabel.innerText = 'Localizando servidor';
                    if (statusEl) statusEl.innerText = 'Buscando servidor...';
                    updateSpeedTestGauge(0);
                } else if (st.phase === 'ping') {
                    if (phaseLabel) phaseLabel.innerText = 'Medindo latência';
                    if (statusEl) statusEl.innerText = 'Testando Latência...';
                    updateSpeedTestGauge(liveMbps);
                } else if (st.phase === 'download') {
                    if (phaseLabel) phaseLabel.innerText = 'Download';
                    if (statusEl) statusEl.innerText = `Download (${pct}%)`;
                    updateSpeedTestGauge(liveMbps || st.download_mbps || 0);
                } else if (st.phase === 'upload') {
                    if (phaseLabel) phaseLabel.innerText = 'Upload';
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
                    if (phaseLabel) phaseLabel.innerText = 'Resultado (download)';
                    if (!(st.upload_mbps > 0) && ulVal) ulVal.innerText = 'N/D';
                    if (!(st.download_mbps > 0) && dlVal) dlVal.innerText = 'N/D';
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
                    showToast("Teste de velocidade concluído", `Download ${st.download_mbps || 'N/D'} Mbps · Upload ${st.upload_mbps || 'N/D'} Mbps · Latência ${st.ping_ms} ms`, "success");
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
                tbody.innerHTML = `<tr><td colspan="7" class="ws-empty">Lendo dispositivos Plug and Play e drivers…</td></tr>`;
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
                        const pct = tot > 0 ? Math.round((signed / tot) * 100) : 0;
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
                container.innerHTML = `<div class="ws-card ws-empty sm:col-span-2 xl:col-span-4">Nenhum componente com canal oficial identificado.</div>`;
                return;
            }
            container.innerHTML = pairedList.map(item => `
                <div class="ws-card ws-card-tight flex flex-col gap-2 min-w-0">
                    <div class="flex items-center justify-between gap-2">
                        <span class="ws-kicker">${escapeHtml(item.category || 'Hardware')}</span>
                        <span class="ws-badge">${escapeHtml(item.vendor || 'Outro')}</span>
                    </div>
                    <div class="ws-strong text-[13px] truncate" title="${escapeHtml(item.hardware_name)}">${escapeHtml(item.hardware_name)}</div>
                    <div class="ws-mono text-[12px] ws-muted truncate">Instalado: ${escapeHtml(item.installed_version || '—')}</div>
                    <div class="ws-stat-foot truncate" title="${escapeHtml(item.official_portal || '')}">${escapeHtml(item.official_portal || '')}</div>
                </div>
            `).join('');
        }

        function filterDevices(cat) {
            currentDeviceFilter = cat;
            document.querySelectorAll('.dev-filter-pill').forEach(b => b.classList.toggle('active', b.getAttribute('data-category') === cat));
            renderDevicesTable();
        }

        function filterDriverVendor(vendor) {
            currentDriverVendorFilter = vendor;
            document.querySelectorAll('.dev-vendor-pill').forEach(b => b.classList.toggle('active', b.getAttribute('data-vendor') === vendor));
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
                tbody.innerHTML = `<tr><td colspan="7" class="ws-empty">Nenhum dispositivo para os filtros selecionados.</td></tr>`;
                return;
            }
            tbody.innerHTML = filtered.map(d => {
                const ok = !d.status || /ok|operacional|funcionando/i.test(d.status);
                return `
                    <tr>
                        <td class="ws-strong max-w-[320px] truncate" title="${escapeHtml(d.name)}">${escapeHtml(d.name)}</td>
                        <td class="ws-mono text-[11.5px]">${escapeHtml(d.class || d.category || '—')}</td>
                        <td class="max-w-[200px] truncate" title="${escapeHtml(d.manufacturer || '')}">${escapeHtml(d.manufacturer || '—')}</td>
                        <td class="ws-mono">${escapeHtml(d.driver_version || d.version || '—')}</td>
                        <td class="ws-mono">${escapeHtml(d.driver_date || d.date || '—')}</td>
                        <td>${d.is_third_party ? 'Terceiro' : 'Microsoft'}</td>
                        <td>
                            <div class="flex gap-1.5">
                                <span class="ws-badge ${ok ? '' : 'warn'}">${escapeHtml(d.status || 'OK')}</span>
                                ${d.is_signed ? '' : '<span class="ws-badge warn">Sem assinatura</span>'}
                            </div>
                        </td>
                    </tr>`;
            }).join('');
        }

        function switchDeviceSubTab(tab) {
            const vInst = document.getElementById('dev-content-installed');
            const vUpd = document.getElementById('dev-content-updates');
            if (!vInst || !vUpd) return;
            vInst.classList.toggle('hidden', tab !== 'installed');
            vUpd.classList.toggle('hidden', tab === 'installed');
            document.getElementById('dev-subtab-installed').classList.toggle('active', tab === 'installed');
            document.getElementById('dev-subtab-updates').classList.toggle('active', tab !== 'installed');
            if (tab !== 'installed' && !latestDriverUpdatesData) scanDriverUpdates();
        }

        async function scanDriverUpdates() {
            const list = document.getElementById('dev-updates-results');
            if (list) {
                list.innerHTML = `<div class="ws-card ws-empty">Consultando NVIDIA, AMD, Intel, Realtek, Windows Update e winget…</div>`;
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
                if (lastCheck) lastCheck.innerText = `Última verificação: ${data.checked_at || new Date().toLocaleString()}`;

                // Inicia monitoramento caso já haja download ativo
                startDownloadPolling();
            } catch (e) {
                if (list) list.innerHTML = `<div class="ws-note warn"><i data-lucide="alert-triangle"></i><span>Falha ao consultar atualizações: ${escapeHtml(String(e))}</span></div>`;
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
                list.innerHTML = `<div class="ws-note"><i data-lucide="check-circle"></i><span><b>Nenhuma atualização encontrada.</b> As versões instaladas são iguais ou mais novas que as publicadas nos canais consultados.</span></div>`;
                lucide.createIcons();
                return;
            }

            const row = (icon, title, meta, side) => `
                <div class="ws-card ws-card-tight flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="flex items-start gap-3 min-w-0">
                        <div class="ws-icon"><i data-lucide="${icon}"></i></div>
                        <div class="min-w-0">${title}${meta}</div>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0">${side}</div>
                </div>`;

            let html = '';
            filteredOfficial.forEach(drv => {
                const dlUrl = drv.download_url || '';
                const fname = drv.filename || `${drv.id}.exe`;
                const dName = drv.name || 'Driver';
                const dId = drv.id || 'driver';
                html += `
                    <div id="driver-card-${dId}" class="ws-card ws-card-tight flex flex-col gap-3">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div class="flex items-start gap-3 min-w-0">
                                <div class="ws-icon"><i data-lucide="cpu"></i></div>
                                <div class="min-w-0">
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <span class="ws-strong text-[13px] truncate">${escapeHtml(dName)}</span>
                                        <span class="ws-badge">${escapeHtml(drv.vendor || 'Fabricante')}</span>
                                        ${drv.is_newer ? '<span class="ws-badge warn">Versão mais nova</span>' : ''}
                                    </div>
                                    <div class="ws-mono text-[12px] ws-muted mt-1">Instalado ${escapeHtml(drv.installed_version || '—')} → disponível <span class="ws-strong">${escapeHtml(drv.available_version || '—')}</span>${drv.size_mb ? ` · ${drv.size_mb} MB` : ''}</div>
                                    <div class="ws-stat-foot mt-0.5 truncate">${escapeHtml(drv.hardware_matched || '')} · ${escapeHtml(drv.official_server || '')}</div>
                                </div>
                            </div>
                            <div class="flex items-center gap-2 flex-shrink-0" id="driver-actions-${dId}">
                                <button onclick="triggerDriverDownload('${escapeHtml(dId)}', '${escapeHtml(dlUrl)}', '${escapeHtml(fname)}', '${escapeHtml(dName)}')" class="ws-btn sm primary"><i data-lucide="download"></i>Baixar</button>
                                <button onclick="openDriverDownloadFolder()" class="ws-btn sm" title="Abrir pasta de downloads">Pasta</button>
                            </div>
                        </div>
                        <div id="driver-progress-box-${dId}" class="hidden">
                            <div class="flex items-center justify-between text-[12px] mb-1.5">
                                <span id="driver-progress-text-${dId}" class="ws-muted flex items-center gap-1.5">Conectando…</span>
                                <span id="driver-progress-pct-${dId}" class="ws-mono ws-strong">0%</span>
                            </div>
                            <div class="ws-meter"><span id="driver-progress-bar-${dId}" style="width:0%"></span></div>
                        </div>
                    </div>`;
            });
            filteredWu.forEach(u => {
                html += row('download-cloud',
                    `<div class="ws-strong text-[13px] truncate">${escapeHtml(u.name || 'Atualização de driver')}</div>`,
                    `<div class="ws-stat-foot truncate">${escapeHtml(u.details || 'Windows Update')}</div>`,
                    `<span class="ws-badge">Windows Update</span><button onclick="openWindowsUpdateSettings()" class="ws-btn sm"><i data-lucide="external-link"></i>Abrir</button>`);
            });
            filteredWinget.forEach(w => {
                html += row('package',
                    `<div class="ws-strong text-[13px] truncate">${escapeHtml(w.name || w.id || 'Pacote')}</div>`,
                    `<div class="ws-mono text-[12px] ws-muted">Disponível ${escapeHtml(w.version || '—')} · ${escapeHtml(w.type || 'winget')}</div>`,
                    `<span class="ws-badge">winget</span>${w.id ? `<button onclick="upgradeWingetDriver('${escapeHtml(w.id)}', '${escapeHtml(w.name || w.id)}')" class="ws-btn sm primary"><i data-lucide="download"></i>Atualizar</button>` : ''}`);
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
                            pText.innerHTML = `<span>Baixando ${dlMB} / ${totMB} MB · ${spd} MB/s · restante ${eta} s</span>`;
                            lucide.createIcons();
                        }
                    } else if (status === 'completed') {
                        pBox.classList.remove('hidden');
                        if (pBar) {
                            pBar.style.width = '100%';
                            pBar.parentElement.className = 'ws-meter ok';
                        }
                        if (pPct) pPct.innerText = '100%';
                        if (pText) {
                            pText.innerHTML = `<span style="color:var(--ok);font-weight:600">Download concluído — pronto para instalar.</span>`;
                            lucide.createIcons();
                        }

                        // Atualiza os botões de ação para permitir Instalação Direta com 1 clique
                        if (actionsBox && !actionsBox.dataset.completed) {
                            actionsBox.dataset.completed = "true";
                            const fPath = dl.file_path || '';
                            actionsBox.innerHTML = `
                                <button onclick="installDownloadedDriver('${escapeHtml(fPath).replace(/\\/g, '\\\\')}')" class="ws-btn sm primary"><i data-lucide="play"></i>Instalar</button>
                                <button onclick="openDriverDownloadFolder('${escapeHtml(fPath).replace(/\\/g, '\\\\')}')" class="ws-btn sm" title="Abrir pasta de downloads"><i data-lucide="folder-open"></i>Pasta</button>
                            `;
                            lucide.createIcons();
                            showToast("Download Concluído", `O driver ${dl.name} foi baixado e está pronto para instalação!`, "success", 4000);
                        }
                    } else if (status === 'error') {
                        if (pText) {
                            pText.innerHTML = `<span style="color:var(--bad);font-weight:600">Erro no download: ${escapeHtml(dl.error || 'falha de rede')}</span>`;
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
        let activeStressTab = 'components';
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

        // Formata um sensor: null/undefined => "N/D" (nunca inventa valores)
        function fmtSensor(v, unit, dec = 0) {
            if (v === null || v === undefined || Number.isNaN(Number(v))) return 'N/D';
            const n = Number(v);
            return `${dec > 0 ? n.toFixed(dec) : Math.round(n).toLocaleString('pt-BR')}${unit ? ' ' + unit : ''}`;
        }

        // ---------------------------------------------------------------------
        // CARGA REAL DE GPU VIA WebGL2 (shader de fragmento pesado, 1920x1080)
        // ---------------------------------------------------------------------
        const gpuLoad = { running: false, gl: null, canvas: null, prog: null, frames: 0, t0: 0, fps: null, raf: null, renderer: null, reportTimer: null };

        function startGpuLoad() {
            if (gpuLoad.running) return true;
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 1920; canvas.height = 1080;
                canvas.style.cssText = 'position:fixed;left:-10000px;top:0;width:2px;height:2px;pointer-events:none;';
                document.body.appendChild(canvas);
                const gl = canvas.getContext('webgl2', { powerPreference: 'high-performance', antialias: false, preserveDrawingBuffer: false });
                if (!gl) { canvas.remove(); showToast('GPU', 'WebGL2 indisponível: a carga de GPU não pode ser gerada.', 'warning', 5000); return false; }
                const vs = `#version 300 es
                in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
                const fs = `#version 300 es
                precision highp float; uniform float t; uniform vec2 r; out vec4 o;
                void main(){
                    vec2 uv = (gl_FragCoord.xy / r) * 3.0 - vec2(2.0, 1.5);
                    vec2 z = vec2(0.0); float acc = 0.0;
                    for (int i = 0; i < 384; i++) {
                        z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + uv + 0.0001*sin(t + float(i));
                        acc += exp(-dot(z,z)) + sin(z.x * 1.7 + t) * cos(z.y * 1.3);
                        if (dot(z,z) > 64.0) z *= 0.125;
                    }
                    o = vec4(fract(acc * 0.01), fract(acc * 0.013), fract(acc * 0.017), 1.0);
                }`;
                const mk = (type, src) => { const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
                const prog = gl.createProgram();
                gl.attachShader(prog, mk(gl.VERTEX_SHADER, vs));
                gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, fs));
                gl.linkProgram(prog);
                if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
                gl.useProgram(prog);
                const buf = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buf);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
                const loc = gl.getAttribLocation(prog, 'p');
                gl.enableVertexAttribArray(loc);
                gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
                gl.viewport(0, 0, canvas.width, canvas.height);
                const dbg = gl.getExtension('WEBGL_debug_renderer_info');
                gpuLoad.renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
                Object.assign(gpuLoad, { running: true, gl, canvas, prog, frames: 0, t0: performance.now(), fps: null,
                    uT: gl.getUniformLocation(prog, 't'), uR: gl.getUniformLocation(prog, 'r') });
                gl.uniform2f(gpuLoad.uR, canvas.width, canvas.height);
                const loop = () => {
                    if (!gpuLoad.running) return;
                    const g = gpuLoad.gl;
                    for (let k = 0; k < 3; k++) {
                        g.uniform1f(gpuLoad.uT, performance.now() / 1000 + k);
                        g.drawArrays(g.TRIANGLES, 0, 3);
                        gpuLoad.frames++;
                    }
                    g.finish();
                    gpuLoad.raf = requestAnimationFrame(loop);
                };
                gpuLoad.raf = requestAnimationFrame(loop);
                gpuLoad.reportTimer = setInterval(() => {
                    const now = performance.now();
                    gpuLoad.fps = gpuLoad.frames / ((now - gpuLoad.t0) / 1000);
                    gpuLoad.frames = 0; gpuLoad.t0 = now;
                    fetch('/api/stress/gpu_report', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fps: gpuLoad.fps, renderer: gpuLoad.renderer }) }).catch(() => {});
                }, 1000);
                return true;
            } catch (e) {
                console.error('GPU load', e);
                showToast('GPU', 'Falha ao iniciar a carga WebGL2: ' + e.message, 'warning', 5000);
                stopGpuLoad();
                return false;
            }
        }

        function stopGpuLoad() {
            gpuLoad.running = false;
            if (gpuLoad.raf) cancelAnimationFrame(gpuLoad.raf);
            if (gpuLoad.reportTimer) clearInterval(gpuLoad.reportTimer);
            try { const ext = gpuLoad.gl && gpuLoad.gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); } catch (e) { }
            if (gpuLoad.canvas) gpuLoad.canvas.remove();
            Object.assign(gpuLoad, { gl: null, canvas: null, prog: null, raf: null, reportTimer: null, fps: null });
        }

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
                if (battEl) battEl.innerText = st.battery_status || 'Sem bateria';
                if (!st.running && gpuLoad.running) stopGpuLoad();
                renderStressHealthStrip(st);

                // Top Labels
                const cpuTop = document.getElementById('stress-cpu-top-label');
                if (cpuTop) cpuTop.innerText = `${st.system_threads || '—'} threads · ${fmtSensor(st.max_clock, 'MHz')} nominal`;
                const gpuTop = document.getElementById('stress-gpu-top-label');
                if (gpuTop) gpuTop.innerText = st.gpu_renderer || st.gpu_name || 'GPU não identificada';
                const diskTop = document.getElementById('stress-disk-top-label');
                if (diskTop) diskTop.innerText = st.disk_name || 'Disco do sistema';

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

                const setStatus = (tone, text) => {
                    if (statusBadge) statusBadge.className = `ws-badge ${tone}${st.running ? ' live' : ''}`;
                    if (statusDot) statusDot.className = 'dot';
                    if (statusText) statusText.innerText = text;
                };
                const setThrottle = (tone, text) => {
                    if (cardThrottlingText) { cardThrottlingText.innerText = text; cardThrottlingText.style.color = tone ? `var(--${tone})` : ''; }
                    if (cardThrottlingIconBox) cardThrottlingIconBox.className = `ws-icon ${tone || ''}`;
                };
                if (btnStart) btnStart.disabled = !!st.running;
                if (btnStop) btnStop.disabled = !st.running;
                document.querySelectorAll('.stress-subsystem-chk').forEach(chk => chk.disabled = !!st.running);

                if (st.running) {
                    const errN = st.errors_total || 0;
                    if (errN > 0) setStatus('bad', `Instável — ${errN} erro(s)`);
                    else if (isThrottling) setStatus('warn', cur.thermal_throttling ? 'Em execução — limitação térmica' : 'Em execução — clock limitado');
                    else setStatus('brand', 'Em execução — 0 erros');
                    if (isThrottling) setThrottle('warn', `${fmtSensor(cur.cpu_throttling, '%', 1)} abaixo do nominal`);
                    else setThrottle('ok', cur.cpu_throttling === null || cur.cpu_throttling === undefined ? 'Sem dados do Windows' : `Nenhuma (${fmtSensor(cur.performance_limit_pct, '%', 0)} do clock)`);
                } else {
                    const errN = st.errors_total || 0;
                    setStatus(errN > 0 ? 'bad' : '', errN > 0 ? `Último teste: ${errN} erro(s)` : 'Pronto para testar');
                    setThrottle('', 'Aguardando teste');
                }

                // 3. Atualização do Log de Setores do StressPulse™
                const sectorBox = document.getElementById('stress-sector-log-box');
                const sectorLog = Array.isArray(st.sector_log) ? st.sector_log : [];
                const countLbl = document.getElementById('stress-sector-count-label');
                const ramTestedLbl = document.getElementById('stress-sector-ram-tested');

                if (countLbl) countLbl.innerText = `${sectorLog.length} eventos`;
                if (ramTestedLbl) ramTestedLbl.innerText = `RAM: ${st.memory_tested_mb || 0} MB · ${((st.work && st.work.mem_verified_bytes) ? (st.work.mem_verified_bytes / 1e9).toFixed(1) : '0.0')} GB conferidos`;

                if (sectorBox) {
                    if (sectorLog.length === 0) {
                        sectorBox.innerHTML = `<div class="ws-empty" id="stress-sector-log-empty">Nenhum teste em execução.</div>`;
                    } else if (sectorLog.length !== lastSectorLogCount) {
                        lastSectorLogCount = sectorLog.length;
                        sectorBox.innerHTML = sectorLog.map(entry => {
                            const isErr = entry.level === 'error' || entry.status.includes('ERRO');
                            const isWarn = entry.level === 'warn';
                            const isStop = /encerrad|interrompid|concluíd/i.test(entry.status);
                            const isStart = /iniciad|thread|alocad|verificação/i.test(entry.status);

                            const color = isErr ? 'var(--bad)' : isWarn ? 'var(--warn)' : isStop ? 'var(--text-muted)' : isStart ? 'var(--text-primary)' : 'var(--text-secondary)';
                            return `
                                <div class="flex gap-3 px-3 py-1" style="border-bottom:1px solid var(--border-subtle)">
                                    <span class="ws-faint flex-shrink-0">${escapeHtml(entry.datetime || '')}</span>
                                    <span class="truncate" style="color:${color};${isErr || isWarn ? 'font-weight:600' : ''}" title="${escapeHtml(entry.status || '')}">${escapeHtml(entry.status || '')}</span>
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
                        thHeadline.innerHTML = `<span class="ws-badge warn"><span class="dot"></span>Limitação ${fmtSensor(cur.cpu_throttling, '%', 1)} ${cur.thermal_throttling ? '(térmica)' : '(energia/temperatura)'}</span>`;
                    } else {
                        thHeadline.innerHTML = `<span class="ws-muted">Limitação: ${cur.cpu_throttling === null || cur.cpu_throttling === undefined ? 'N/D' : 'nenhuma'} · fonte: contadores do Windows</span>`;
                    }
                }

                const liveCpuUsage = document.getElementById('stress-live-cpu-usage-val');
                if (liveCpuUsage) liveCpuUsage.innerText = `${cur.cpu_usage || 0}%`;

                const liveCpuThrottling = document.getElementById('stress-live-cpu-throttling-val');
                if (liveCpuThrottling) {
                    liveCpuThrottling.innerText = fmtSensor(cur.cpu_throttling, '%', 1);
                    liveCpuThrottling.style.color = (cur.cpu_throttling > 0) ? 'var(--warn)' : '';
                }

                // 5. Renderização dos Gráficos com Números nas Linhas
                updateStressFansNotice(st);
                if (activeStressTab === 'components') {
                    renderStressComponents(st);
                    renderStressLowerGraph(st.history || []);
                } else if (activeStressTab === 'statistics') {
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

        function renderStressHealthStrip(st) {
            const el = document.getElementById('stress-health-strip');
            if (!el) return;
            const cur = st.current || {};
            const src = cur.sensor_sources || {};
            const r = st.rates || {};
            const errs = st.errors_total || 0;
            const noBoard = !src.board;
            const chip = (label, val, tone) => `<div class="ws-chip ws-chip-${tone}"><span>${label}</span><strong>${val}</strong></div>`;
            el.innerHTML = [
                chip('Erros detectados', errs > 0 ? `${errs}` : '0', errs > 0 ? 'bad' : 'ok'),
                chip('CPU', r.cpu_mb_s != null ? `${r.cpu_mb_s} MB/s` : '—', 'info'),
                chip('FPU', r.fpu_mops != null ? `${r.fpu_mops} Mops/s` : '—', 'info'),
                chip('RAM conferida', r.mem_gb_s != null ? `${r.mem_gb_s} GB/s` : '—', 'info'),
                chip('Disco', r.disk_w_mb_s != null ? `${r.disk_w_mb_s} / ${r.disk_r_mb_s} MB/s` : '—', 'info'),
                chip('GPU (WebGL2)', cur.gpu_fps != null ? `${cur.gpu_fps} quadros/s` : '—', 'info'),
                chip('Sensores', src.board ? 'LibreHardwareMonitor' : (src.temperatures || 'Windows'), noBoard ? 'warn' : 'ok'),
            ].join('') + (noBoard ? `<div class="ws-hint">Ventoinhas, tensões e potência só aparecem com o LibreHardwareMonitor aberto (o Windows não expõe o chip Super I/O). Sem ele, esses campos ficam como <b>N/D</b> — nenhum valor é estimado.</div>` : '');
        }


        // =====================================================================
        // STRESSPULSE — VISÃO POR COMPONENTE (o que está em carga e como está indo)
        // =====================================================================
        const STRESS_COMPONENTS = [
            { key: 'cpu', cfg: 'stress_cpu', chk: 'stress-chk-cpu', name: 'CPU — inteiros', color: 'var(--chart-1)', unit: 'MB/s', stat: 'rate_cpu_mb_s', err: 'cpu',
              method: () => 'SHA-256 e BLAKE2b sobre 1 MiB; cada hash é comparado com a referência', series: h => h.rates && h.rates.cpu_mb_s,
              work: w => `${((w.cpu_bytes || 0) / 1e9).toFixed(1)} GB processados` },
            { key: 'fpu', cfg: 'stress_fpu', chk: 'stress-chk-fpu', name: 'FPU — ponto flutuante', color: 'var(--chart-5)', unit: 'Mops/s', stat: 'rate_fpu_mops', err: 'fpu',
              method: () => 'Kernel float64 (sin, cos, sqrt, exp) comparado bit a bit', series: h => h.rates && h.rates.fpu_mops,
              work: w => `${((w.fpu_ops || 0) / 1e9).toFixed(1)} bilhões de operações` },
            { key: 'cache', cfg: 'stress_cache', chk: 'stress-chk-cache', name: 'Cache', color: 'var(--chart-2)', unit: 'Mops/s', stat: 'rate_cache_mops', err: 'cache',
              method: () => 'Leitura aleatória em 8 MiB com soma de verificação', series: h => h.rates && h.rates.cache_mops,
              work: w => `${((w.cache_ops || 0) / 1e9).toFixed(1)} bilhões de leituras` },
            { key: 'memory', cfg: 'stress_memory', chk: 'stress-chk-memory', name: 'Memória RAM', color: 'var(--chart-3)', unit: 'GB/s', stat: 'rate_mem_gb_s', err: 'memory',
              method: st => `Padrões fixos, endereço e aleatório em ${st.memory_tested_mb || (st.config && st.config.memory_mb) || 0} MB; 100% das palavras conferidas`, series: h => h.rates && h.rates.mem_gb_s, variesByDesign: 'A vazão muda com o padrão testado (padrões aleatórios são mais lentos); variação alta é esperada.',
              work: w => `${((w.mem_verified_bytes || 0) / 1e9).toFixed(1)} GB conferidos` },
            { key: 'disk', cfg: 'stress_disk', chk: 'stress-chk-disks', name: 'Disco', color: 'var(--info)', unit: 'MB/s', stat: 'rate_disk_mb_s', err: 'disk',
              method: st => `Grava e relê 256 MiB sem cache, hash por bloco (${st.disk_name || 'unidade do sistema'})`,
              series: h => h.rates && h.rates.disk_w_mb_s != null ? (h.rates.disk_w_mb_s + (h.rates.disk_r_mb_s || 0)) : null, variesByDesign: 'Alterna fases de gravação e leitura; variação alta é esperada.',
              work: w => `${(((w.disk_written_bytes || 0) + (w.disk_read_bytes || 0)) / 1e9).toFixed(1)} GB gravados + lidos` },
            { key: 'gpu', cfg: 'stress_gpu', chk: 'stress-chk-gpu', name: 'GPU', color: 'var(--chart-4)', unit: 'quadros/s', stat: 'rate_gpu_fps', err: null,
              method: st => `Shader WebGL2 em 1920×1080 (${st.gpu_name || 'GPU'}); carga sem verificação de resultado`, series: h => h.gpu_fps,
              work: () => '' },
        ];

        function stressSparkline(values, color) {
            const pts = values.filter(v => v !== null && v !== undefined);
            if (pts.length < 2) return '<div class="ws-stat-foot">sem dados</div>';
            const W = 220, H = 34, mx = Math.max(...pts) || 1;
            const n = values.length;
            let d = '';
            values.forEach((v, i) => {
                if (v === null || v === undefined) return;
                const x = (i / Math.max(1, n - 1)) * W, y = H - 2 - (v / mx) * (H - 4);
                d += `${d ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
            });
            return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:${H}px;display:block"><path d="${d}" fill="none" stroke="${color}" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`;
        }

        function renderStressComponents(st) {
            const body = document.getElementById('stress-components-body');
            if (!body) return;
            st = st || {};
            const hist = st.history || [];
            const stats = st.statistics || {};
            const errs = st.errors || {};
            const work = st.work || {};
            const useCfg = st.running || hist.length > 0;
            const fmt = v => v === null || v === undefined ? '—' : (v >= 100 ? Math.round(v).toLocaleString('pt-BR') : Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 }));

            const head = `
                <div class="ws-comp-row ws-comp-head">
                    <span>Componente</span><span>Estado</span><span class="text-right">Agora</span><span class="text-right">Mín · Média · Máx</span><span class="text-right">Variação</span><span class="text-right">Erros</span><span>Vazão ao longo do teste</span>
                </div>`;
            const rows = STRESS_COMPONENTS.map(c => {
                const chk = document.getElementById(c.chk);
                const selected = useCfg ? !!(st.config && st.config[c.cfg]) : !!(chk && chk.checked);
                const s = stats[c.stat];
                const series = hist.slice(-120).map(c.series);
                const nowV = series.length ? series[series.length - 1] : null;
                const errN = c.err ? (errs[c.err] || 0) : null;
                const cv = s && s.avg > 0 ? (s.std / s.avg * 100) : null;
                let state;
                if (!selected) state = '<span class="ws-badge">Não selecionado</span>';
                else if (errN > 0) state = `<span class="ws-badge bad">${errN} erro(s)</span>`;
                else if (st.running) state = '<span class="ws-badge brand live"><span class="dot"></span>Em carga</span>';
                else if (s) state = '<span class="ws-badge ok">Concluído sem erros</span>';
                else state = '<span class="ws-badge">Aguardando</span>';
                const errTxt = errN === null ? '<span class="ws-faint">n/a</span>' : `<span style="color:${errN > 0 ? 'var(--bad)' : 'var(--ok)'};font-weight:600">${errN}</span>`;
                return `
                    <div class="ws-comp-row ${selected ? '' : 'is-off'}">
                        <div class="min-w-0">
                            <div class="flex items-center gap-2"><span class="ws-dot" style="margin-top:0;background:${c.color}"></span><span class="ws-strong">${c.name}</span></div>
                            <div class="ws-stat-foot truncate" title="${escapeHtml(c.method(st))}">${escapeHtml(c.method(st))}</div>
                            ${selected && c.work(work) ? `<div class="ws-stat-foot ws-mono">${c.work(work)}</div>` : ''}
                        </div>
                        <div>${state}</div>
                        <div class="text-right ws-mono ws-strong">${selected ? `${fmt(nowV)} <span class="ws-faint" style="font-weight:400">${c.unit}</span>` : '—'}</div>
                        <div class="text-right ws-mono">${s ? `${fmt(s.min)} · ${fmt(s.avg)} · ${fmt(s.max)}` : '—'}</div>
                        <div class="text-right ws-mono" title="${c.variesByDesign || 'Desvio padrão ÷ média da vazão'}" style="color:${cv === null ? '' : (cv > 15 && !c.variesByDesign ? 'var(--warn)' : 'var(--text-secondary)')}">${cv === null ? '—' : `±${cv.toFixed(1)}%`}${c.variesByDesign && cv !== null ? '*' : ''}</div>
                        <div class="text-right ws-mono">${selected ? errTxt : '—'}</div>
                        <div>${selected ? stressSparkline(series, errN > 0 ? 'var(--bad)' : c.color) : ''}</div>
                    </div>`;
            }).join('');
            body.innerHTML = head + rows;
        }

        function updateStressFansNotice(st) {
            const box = document.getElementById('stress-fans-notice');
            if (!box) return;
            const cur = (st && st.current) || {};
            const hasBoard = !!(cur.sensor_sources && cur.sensor_sources.board);
            const show = activeStressTab === 'cooling_fans' && !hasBoard;
            box.classList.toggle('hidden', !show);
            if (!show) return;
            const gpuTxt = cur.gpu_fan_pct !== null && cur.gpu_fan_pct !== undefined ? ` A ventoinha da GPU é lida pelo driver NVIDIA (${cur.gpu_fan_pct}% agora; 0% = parada em repouso).` : '';
            const lhm = (st && st.lhm) || {};
            document.getElementById('stress-fans-notice-text').innerHTML =
                `<b>Ventoinhas da placa-mãe indisponíveis.</b> O Windows não expõe o chip de controle (Super I/O); a leitura exige o LibreHardwareMonitor aberto como administrador.${gpuTxt}` +
                (lhm.installed_path ? ` <span class="ws-mono">Encontrado: ${escapeHtml(lhm.installed_path)}</span>` : ' Não foi encontrado instalado neste PC.');
            const btn = document.getElementById('stress-lhm-start-btn');
            if (btn) btn.classList.toggle('hidden', !lhm.installed_path);
        }

        async function startLibreHardwareMonitor() {
            try {
                const data = await (await fetch('/api/sensors/lhm/start', { method: 'POST' })).json();
                showToast('LibreHardwareMonitor', data.message, data.status === 'success' ? 'success' : 'warning', 5000);
            } catch (e) { showToast('Erro', String(e), 'error'); }
        }

        async function openLibreHardwareMonitorSite() {
            try { await fetch('/api/sensors/lhm/site', { method: 'POST' }); } catch (e) { }
        }

        function setStressTab(tabId) {
            activeStressTab = tabId;
            const tabs = ['components', 'temperatures', 'cooling_fans', 'voltages', 'powers', 'clocks', 'unified', 'statistics'];

            tabs.forEach(t => {
                const btn = document.getElementById(`stress-tab-${t}`);
                if (!btn) return;
                btn.classList.toggle('active', t === tabId);
            });

            const visualGraphs = document.getElementById('stress-visual-graphs-container');
            const statsTable = document.getElementById('stress-statistics-container');
            const upperTitle = document.getElementById('stress-upper-title');
            const upperScale = document.getElementById('stress-upper-scale-label');

            const compBox = document.getElementById('stress-components-container');
            if (compBox) compBox.classList.toggle('hidden', tabId !== 'components');
            updateStressFansNotice(latestStressData);
            if (tabId === 'components') {
                if (visualGraphs) visualGraphs.classList.add('hidden');
                if (statsTable) statsTable.classList.add('hidden');
                renderStressComponents(latestStressData);
            } else if (tabId === 'statistics') {
                if (visualGraphs) visualGraphs.classList.add('hidden');
                if (statsTable) statsTable.classList.remove('hidden');
                if (latestStressData) renderStressStatisticsTable(latestStressData);
            } else {
                if (visualGraphs) visualGraphs.classList.remove('hidden');
                if (statsTable) statsTable.classList.add('hidden');

                if (tabId === 'temperatures') {
                    if (upperTitle) upperTitle.innerText = "Temperaturas";
                    if (upperScale) upperScale.innerText = "Escala Y: 0 °C — 100 °C";
                } else if (tabId === 'cooling_fans') {
                    if (upperTitle) upperTitle.innerText = "Ventoinhas";
                    if (upperScale) upperScale.innerText = "Escala Y: 0 RPM — 3000 RPM";
                } else if (tabId === 'voltages') {
                    if (upperTitle) upperTitle.innerText = "Tensões";
                    if (upperScale) upperScale.innerText = "Escala Y: 0.0 V — 14.0 V";
                } else if (tabId === 'powers') {
                    if (upperTitle) upperTitle.innerText = "Consumo de potência";
                    if (upperScale) upperScale.innerText = "Escala Y: 0 W — 200 W";
                } else if (tabId === 'clocks') {
                    if (upperTitle) upperTitle.innerText = "Frequências (clock efetivo)";
                    if (upperScale) upperScale.innerText = "Escala Y: automática";
                } else if (tabId === 'unified') {
                    if (upperTitle) upperTitle.innerText = "Visão unificada (normalizada)";
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

            const ct = cur.core_temps || [];
            const ck = cur.clocks || [];
            if (activeStressTab === 'temperatures') {
                items = [
                    { key: 'cpu', label: `CPU (${cur.temp_source || 'sem sensor'})`, color: '#ef4444', val: fmtSensor(cur.cpu_temp, '°C', 1) },
                    { key: 'mobo', label: 'Placa-mãe', color: '#3b82f6', val: fmtSensor(cur.mobo_temp, '°C', 1) },
                    ...[0, 1, 2, 3].filter(i => ct[i] !== undefined).map(i => ({ key: `core${i + 1}`, label: `Núcleo #${i + 1}`, color: ['#10b981', '#eab308', '#06b6d4', '#a855f7'][i], val: fmtSensor(ct[i], '°C', 1) })),
                    { key: 'disk', label: cur.disk_name ? `Disco ${String(cur.disk_name).slice(0, 18)}` : 'Disco', color: '#f59e0b', val: fmtSensor(cur.disk_temp, '°C') },
                    { key: 'gpu', label: 'GPU', color: '#14b8a6', val: fmtSensor(cur.gpu_temp, '°C') },
                ];
            } else if (activeStressTab === 'cooling_fans') {
                items = [
                    { key: 'fan_cpu', label: 'Ventoinha CPU', color: '#06b6d4', val: fmtSensor(cur.cpu_fan, 'RPM') },
                    { key: 'fan_gpu', label: cur.gpu_fan != null ? 'Ventoinha GPU' : 'Ventoinha GPU (driver)', color: '#10b981', val: cur.gpu_fan != null ? fmtSensor(cur.gpu_fan, 'RPM') : fmtSensor(cur.gpu_fan_pct, '%') },
                    ...((cur.fans || []).filter(f => !f.gpu).slice(3).map((f, i) => ({ key: `fan_extra${i}`, label: f.name, color: ['#f59e0b', '#ec4899', '#84cc16'][i % 3], val: fmtSensor(f.rpm, 'RPM') }))),
                    { key: 'fan_chassis', label: 'Gabinete', color: '#a855f7', val: fmtSensor(cur.chassis_fan, 'RPM') },
                ];
            } else if (activeStressTab === 'voltages') {
                items = [
                    { key: 'vcore', label: 'VCore', color: '#0284c7', val: fmtSensor(cur.vcore, 'V', 3) },
                    { key: 'v12', label: '+12V', color: '#f59e0b', val: fmtSensor(cur.v12, 'V', 3) },
                    { key: 'v5', label: '+5V', color: '#10b981', val: fmtSensor(cur.v5, 'V', 3) },
                    { key: 'v33', label: '+3.3V', color: '#8b5cf6', val: fmtSensor(cur.v33, 'V', 3) },
                    { key: 'dram', label: 'DRAM', color: '#ec4899', val: fmtSensor(cur.dram_v, 'V', 3) },
                ];
            } else if (activeStressTab === 'powers') {
                items = [
                    { key: 'pwr_pkg', label: 'CPU Package', color: '#f97316', val: fmtSensor(cur.cpu_power, 'W', 1) },
                    { key: 'pwr_cores', label: 'Núcleos CPU', color: '#f59e0b', val: fmtSensor(cur.cores_power, 'W', 1) },
                    { key: 'pwr_gpu', label: 'GPU', color: '#10b981', val: fmtSensor(cur.gpu_power, 'W', 1) },
                ];
            } else if (activeStressTab === 'clocks') {
                items = [
                    { key: 'clk_avg', label: 'CPU (efetivo)', color: '#06b6d4', val: fmtSensor(cur.avg_clock, 'MHz') },
                    ...[0, 1, 2, 3].filter(i => ck[i] !== undefined).map(i => ({ key: `clk_c${i + 1}`, label: `Núcleo #${i + 1}`, color: ['#10b981', '#eab308', '#3b82f6', '#a855f7'][i], val: fmtSensor(ck[i], 'MHz') })),
                    { key: 'clk_gpu', label: 'GPU', color: '#ec4899', val: fmtSensor(cur.gpu_clock, 'MHz') },
                ];
            } else if (activeStressTab === 'unified') {
                items = [
                    { key: 'mobo', label: 'Temp. CPU', color: '#ef4444', val: fmtSensor(cur.cpu_temp, '°C', 1) },
                    { key: 'cpu', label: 'Clock CPU', color: '#06b6d4', val: fmtSensor(cur.avg_clock, 'MHz') },
                    { key: 'core1', label: 'Uso CPU', color: '#10b981', val: fmtSensor(cur.cpu_usage, '%') },
                    { key: 'core2', label: 'Uso RAM', color: '#a855f7', val: fmtSensor(cur.ram_usage_pct, '%') },
                    { key: 'disk', label: 'Potência CPU', color: '#f59e0b', val: fmtSensor(cur.cpu_power, 'W') },
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
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-surface-deep').trim() || (isLight ? '#f8fafc' : '#0b0e13');
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
                const mx = Math.max(1000, ...(history || []).map(p => Math.max(p.avg_clock || 0, ...(p.clocks || [0]), p.gpu_clock || 0)));
                yMin = 0; yMax = Math.ceil(mx * 1.15 / 500) * 500; unit = 'MHz'; numSteps = 5;
            } else if (activeStressTab === 'unified') {
                yMin = 0; yMax = 100; unit = '%'; numSteps = 5;
            }

            // Grade horizontal
            const gridColor = isLight ? 'rgba(148, 163, 184, 0.35)' : 'rgba(148, 163, 184, 0.12)';
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
                let lastPtX = 0, lastPtY = 0, lastVal = null, penDown = false;

                pts.forEach((p, idx) => {
                    const v = getter(p);
                    if (v === null || v === undefined || Number.isNaN(Number(v))) { penDown = false; return; }
                    const x = getX(idx);
                    const y = getY(v);
                    if (!penDown) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                    penDown = true;
                    lastPtX = x; lastPtY = y; lastVal = v;
                });
                if (lastVal === null) return;  // sensor sem dados: não desenha linha inventada

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
            const nz = (v) => (v === null || v === undefined) ? null : v;
            const idxv = (arr, i) => (Array.isArray(arr) && arr[i] !== undefined) ? arr[i] : null;
            if (activeStressTab === 'temperatures') {
                drawTraceWithNumber(p => nz(p.mobo_temp), '#3b82f6', 2.0, 'mobo');
                drawTraceWithNumber(p => nz(p.cpu_temp), '#ef4444', 2.6, 'cpu');
                drawTraceWithNumber(p => idxv(p.core_temps, 0), '#10b981', 1.8, 'core1');
                drawTraceWithNumber(p => idxv(p.core_temps, 1), '#eab308', 1.8, 'core2');
                drawTraceWithNumber(p => idxv(p.core_temps, 2), '#06b6d4', 1.8, 'core3');
                drawTraceWithNumber(p => idxv(p.core_temps, 3), '#a855f7', 1.8, 'core4');
                drawTraceWithNumber(p => nz(p.disk_temp), '#f59e0b', 2.0, 'disk');
                drawTraceWithNumber(p => nz(p.gpu_temp), '#14b8a6', 2.0, 'gpu');
            } else if (activeStressTab === 'cooling_fans') {
                drawTraceWithNumber(p => nz(p.cpu_fan), '#06b6d4', 2.4, 'fan_cpu');
                drawTraceWithNumber(p => nz(p.gpu_fan), '#10b981', 2.0, 'fan_gpu');
                drawTraceWithNumber(p => nz(p.chassis_fan), '#a855f7', 1.8, 'fan_chassis');
            } else if (activeStressTab === 'voltages') {
                drawTraceWithNumber(p => nz(p.vcore), '#0284c7', 2.4, 'vcore');
                drawTraceWithNumber(p => nz(p.v12), '#f59e0b', 2.0, 'v12');
                drawTraceWithNumber(p => nz(p.v5), '#10b981', 2.0, 'v5');
                drawTraceWithNumber(p => nz(p.v33), '#8b5cf6', 2.0, 'v33');
                drawTraceWithNumber(p => nz(p.dram_v), '#ec4899', 2.0, 'dram');
            } else if (activeStressTab === 'powers') {
                drawTraceWithNumber(p => nz(p.cpu_power), '#f97316', 2.6, 'pwr_pkg');
                drawTraceWithNumber(p => nz(p.cores_power), '#f59e0b', 2.0, 'pwr_cores');
                drawTraceWithNumber(p => nz(p.gpu_power), '#10b981', 2.0, 'pwr_gpu');
            } else if (activeStressTab === 'clocks') {
                drawTraceWithNumber(p => nz(p.avg_clock), '#06b6d4', 2.6, 'clk_avg');
                drawTraceWithNumber(p => idxv(p.clocks, 0), '#10b981', 1.8, 'clk_c1');
                drawTraceWithNumber(p => idxv(p.clocks, 1), '#eab308', 1.8, 'clk_c2');
                drawTraceWithNumber(p => idxv(p.clocks, 2), '#3b82f6', 1.8, 'clk_c3');
                drawTraceWithNumber(p => idxv(p.clocks, 3), '#a855f7', 1.8, 'clk_c4');
                drawTraceWithNumber(p => nz(p.gpu_clock), '#ec4899', 2.0, 'clk_gpu');
            } else if (activeStressTab === 'unified') {
                drawTraceWithNumber(p => nz(p.cpu_temp), '#ef4444', 2.4, 'mobo');
                drawTraceWithNumber(p => (p.avg_clock && p.nominal_clock) ? Math.min(100, p.avg_clock * 100 / (p.nominal_clock * 1.6)) : null, '#06b6d4', 2.0, 'cpu');
                drawTraceWithNumber(p => nz(p.cpu_usage), '#10b981', 2.2, 'core1');
                drawTraceWithNumber(p => nz(p.ram_usage_pct), '#a855f7', 2.0, 'core2');
                drawTraceWithNumber(p => p.cpu_power != null ? Math.min(100, p.cpu_power / 2) : null, '#f59e0b', 2.0, 'disk');
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

                    ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(19, 23, 30, 0.96)';
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
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-surface-deep').trim() || (isLight ? '#f8fafc' : '#0b0e13');
            ctx.fillRect(0, 0, W, H);

            const gridColor = isLight ? 'rgba(148, 163, 184, 0.35)' : 'rgba(148, 163, 184, 0.12)';
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
                ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(19, 23, 30, 0.96)';
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
                ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(19, 23, 30, 0.96)';
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
                const s = stats[key];
                const c = (curVal !== undefined && curVal !== null) ? curVal : (s ? s.current : null);
                const dec = (unit === 'V') ? 3 : ((unit === 'GB' || unit === '°C' || unit === 'W') ? 1 : 0);
                return {
                    current: fmtSensor(c, unit, dec),
                    min: s ? fmtSensor(s.min, unit, dec) : 'N/D',
                    max: s ? fmtSensor(s.max, unit, dec) : 'N/D',
                    avg: s ? fmtSensor(s.avg, unit, dec) : 'N/D'
                };
            };
            const errs = st.errors || {};
            const rates = st.rates || {};
            const errRow = (name, k, rateTxt) => ({
                name, current: (errs[k] || 0) > 0 ? `${errs[k]} ERRO(S)` : '0 erros', min: rateTxt || '—', max: '—', avg: '—'
            });
            const coreRows = (cur.core_temps || []).slice(0, 16).map((v, i) => ({ name: `Núcleo #${i + 1}`, ...getStat(`core_temp_${i + 1}`, '°C', v) }));

            const groups = [
                {
                    title: "Temperaturas (°C)",
                    icon: "thermometer",
                    color: "text-orange-500",
                    rows: [
                        { name: `Processador (${cur.temp_source || 'sem sensor'})`, ...getStat("cpu_temp", "°C", cur.cpu_temp) },
                        { name: "Placa-mãe", ...getStat("mobo_temp", "°C", cur.mobo_temp) },
                        ...coreRows,
                        { name: `Disco: ${st.disk_name || 'sistema'}`, ...getStat("disk_temp", "°C", cur.disk_temp) },
                        { name: `GPU: ${st.gpu_name || 'não identificada'}`, ...getStat("gpu_temp", "°C", cur.gpu_temp) },
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
                        { name: "Limitação de clock (Windows)", ...getStat("cpu_throttling", "%", cur.cpu_throttling) },
                        { name: "Utilização da Memória RAM", ...getStat("ram_usage_pct", "%", cur.ram_usage_pct) },
                        { name: "Memória RAM Físicamente Ocupada", ...getStat("ram_used_gb", "GB", cur.ram_used_gb) },
                    ]
                },
                {
                    title: "Verificação de Erros (Atual = erros · Mín = taxa de trabalho)",
                    icon: "shield-check",
                    color: "text-emerald-500",
                    rows: [
                        errRow("CPU — hashes SHA-256/BLAKE2b conferidos", "cpu", rates.cpu_mb_s != null ? `${rates.cpu_mb_s} MB/s` : null),
                        errRow("FPU — resultados float64 conferidos", "fpu", rates.fpu_mops != null ? `${rates.fpu_mops} Mops/s` : null),
                        errRow("Cache — somas de verificação", "cache", rates.cache_mops != null ? `${rates.cache_mops} Macessos/s` : null),
                        errRow("RAM — palavras de 64 bits conferidas", "memory", rates.mem_gb_s != null ? `${rates.mem_gb_s} GB/s` : null),
                        errRow("Disco — blocos relidos e comparados", "disk", rates.disk_r_mb_s != null ? `${rates.disk_w_mb_s}/${rates.disk_r_mb_s} MB/s` : null),
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
                    if (stressGpu) startGpuLoad();
                    showToast("StressPulse™ Ativo", "Carga real aplicada. Erros de cálculo e de memória são verificados continuamente.", "success", 3500);
                    if (!stabilityPollTimer) stabilityPollTimer = setInterval(pollStabilityStatus, 1000);
                } else {
                    showToast("Aviso", data.message || "Não foi possível iniciar o teste.", "warning", 4000);
                }
            } catch (e) {
                showToast("Erro", String(e), "error");
            } finally {
                if (btnStart) {
                    btnStart.innerHTML = `<i data-lucide="play" class="w-3.5 h-3.5 fill-white"></i><span>Iniciar</span>`;
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
            stopGpuLoad();

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
                    btnStop.innerHTML = `<i data-lucide="square" class="w-3.5 h-3.5 fill-white"></i><span>Parar</span>`;
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

            fetch('/api/silicon/info').then(r => r.json()).then(d => {
                const p = (d && d.silicon && d.silicon.processor) || {};
                const nm = document.getElementById('cpuid-proc-name');
                if (nm) nm.innerText = p.name || '—';
                const ins = document.getElementById('cpuid-instructions');
                if (ins) ins.innerText = p.instructions || 'N/D';
            }).catch(() => { });
            if (latestStressData) {
                const th = document.getElementById('cpuid-threads-count');
                if (th) th.innerText = `${latestStressData.system_threads || '—'} threads`;
                const clk = document.getElementById('cpuid-clock-speed');
                if (clk) clk.innerText = fmtSensor(latestStressData.max_clock, 'MHz');
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

        // =====================================================================
        // STRESSBENCH — BENCHMARK DE ESTRESSE EM LOOPS
        // =====================================================================
        let stressBenchPreset = 'padrao';
        let stressBenchTimer = null;
        let stabilityMode = 'pulse';
        const STRESSBENCH_PRESET_DESC = {
            rapido: '10 loops × 30 s · aprovação com estabilidade ≥ 97%',
            padrao: '20 loops × 60 s · aprovação com estabilidade ≥ 97%',
            extremo: '40 loops × 60 s · aprovação com estabilidade ≥ 97%'
        };

        function switchStabilityMode(mode) {
            stabilityMode = mode;
            document.querySelectorAll('#stab-mode-seg [data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
            document.getElementById('stab-mode-pulse').classList.toggle('hidden', mode !== 'pulse');
            document.getElementById('stab-mode-bench').classList.toggle('hidden', mode !== 'bench');
            const hint = document.getElementById('stab-mode-hint');
            if (hint) hint.innerText = mode === 'bench'
                ? 'Mede se o desempenho se mantém sob carga máxima contínua — pontuação, estabilidade e histórico.'
                : 'Carga contínua com verificação de erros em CPU, FPU, cache, RAM, disco e GPU.';
            if (mode === 'bench') {
                pollStressBench();
                if (!stressBenchTimer) stressBenchTimer = setInterval(pollStressBench, 1000);
            }
        }

        function selectStressBenchPreset(p) {
            stressBenchPreset = p;
            document.querySelectorAll('#sb-preset-seg [data-preset]').forEach(b => b.classList.toggle('active', b.dataset.preset === p));
            const d = document.getElementById('sb-preset-desc');
            if (d) d.innerText = STRESSBENCH_PRESET_DESC[p] || '';
        }

        async function startStressBench() {
            const btn = document.getElementById('sb-start-btn');
            if (btn) btn.disabled = true;
            try {
                const res = await fetch('/api/stressbench/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ preset: stressBenchPreset })
                });
                const data = await res.json();
                showToast(data.status === 'success' ? 'StressBench iniciado' : 'Não foi possível iniciar', data.message, data.status === 'success' ? 'success' : 'warning');
            } catch (e) {
                showToast('Erro', 'Falha ao iniciar o benchmark: ' + e, 'error');
            }
            if (btn) btn.disabled = false;
            if (!stressBenchTimer) stressBenchTimer = setInterval(pollStressBench, 1000);
            pollStressBench();
        }

        async function stopStressBench() {
            try {
                const res = await fetch('/api/stressbench/stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                const data = await res.json();
                showToast('StressBench', data.message, 'info');
            } catch (e) { }
        }

        async function pollStressBench() {
            try {
                const res = await fetch('/api/stressbench/status');
                const data = await res.json();
                if (data && data.bench) renderStressBench(data.bench);
                const running = data && data.bench && data.bench.running;
                const visible = currentTab === 'stability' && stabilityMode === 'bench';
                if (!running && !visible && stressBenchTimer) { clearInterval(stressBenchTimer); stressBenchTimer = null; }
            } catch (e) { }
        }

        function fmtDuration(sec) {
            sec = Math.max(0, Math.round(sec || 0));
            const m = Math.floor(sec / 60), s = sec % 60;
            return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min` : `${m}:${String(s).padStart(2, '0')}`;
        }

        function renderStressBench(b) {
            const set = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
            const live = b.live || {};
            const running = !!b.running;

            set('sb-threads', `${b.threads || '—'}`);
            document.getElementById('sb-start-btn').classList.toggle('hidden', running);
            document.getElementById('sb-stop-btn').classList.toggle('hidden', !running);
            document.querySelectorAll('#sb-preset-seg button').forEach(x => x.disabled = running);

            const badge = document.getElementById('sb-status-badge');
            const phaseTxt = { idle: 'Pronto', warmup: 'Aquecendo', running: 'Em execução', completed: 'Concluído', stopped: 'Interrompido', error: 'Falha' }[b.phase] || 'Pronto';
            const phaseCls = { warmup: 'warn live', running: 'brand live', completed: 'ok', stopped: 'warn', error: 'bad' }[b.phase] || '';
            if (badge) { badge.className = `ws-badge ${phaseCls}`; badge.innerHTML = `<span class="dot"></span>${phaseTxt}`; }

            // Ao vivo
            set('sb-live-loop', b.loops_total ? `${b.current_loop || 0}/${b.loops_total}` : '—');
            const lb = document.getElementById('sb-live-loop-bar');
            if (lb) lb.style.width = `${running ? Math.round((b.loop_progress || 0) * 100) : 0}%`;
            set('sb-live-score', running && live.score ? Math.round(live.score).toLocaleString('pt-BR') : '—');
            set('sb-live-temp', live.temp !== null && live.temp !== undefined ? `${live.temp} °C` : 'N/D');
            set('sb-live-temp-src', `fonte: ${live.temp_source || 'indisponível'}`);
            set('sb-live-clock', live.clock ? `${(live.clock / 1000).toFixed(2)} GHz` : 'N/D');
            set('sb-live-usage', `uso da CPU: ${live.usage !== null && live.usage !== undefined ? live.usage + '%' : '—'}`);

            const pb = document.getElementById('sb-progress-bar');
            if (pb) pb.style.width = `${b.progress_pct || 0}%`;
            set('sb-progress-text', running ? `${b.message || ''} · ${Math.round(b.progress_pct || 0)}%` : (b.message || 'Progresso total'));
            set('sb-eta', running ? `decorrido ${fmtDuration(b.elapsed_sec)} · restante ${fmtDuration(b.eta_sec)}` : '—');

            renderStressBenchChart(b.loops || []);
            renderStressBenchLoops(b.loops || []);
            renderStressBenchResult(b);
            renderStressBenchHistory(b.history || []);
        }

        function renderStressBenchChart(loops) {
            const svg = document.getElementById('sb-chart');
            const empty = document.getElementById('sb-chart-empty');
            if (!svg) return;
            if (!loops.length) { svg.innerHTML = ''; svg.style.display = 'none'; if (empty) empty.style.display = ''; return; }
            svg.style.display = ''; if (empty) empty.style.display = 'none';

            const W = 800, H = 220, padL = 46, padR = 40, padT = 12, padB = 24;
            const scores = loops.map(l => l.score);
            const best = Math.max(...scores), worst = Math.min(...scores);
            const yMax = best * 1.08, yMin = Math.max(0, worst * 0.85);
            const y = v => padT + (H - padT - padB) * (1 - (v - yMin) / Math.max(1, yMax - yMin));
            const n = loops.length, slot = (W - padL - padR) / n, bw = Math.max(3, Math.min(28, slot * 0.62));
            let out = '<g class="grid">';
            for (let i = 0; i <= 4; i++) {
                const v = yMin + (yMax - yMin) * i / 4;
                out += `<line x1="${padL}" x2="${W - padR}" y1="${y(v)}" y2="${y(v)}"></line><text x="${padL - 6}" y="${y(v) + 3}" text-anchor="end">${Math.round(v)}</text>`;
            }
            out += '</g>';
            loops.forEach((l, i) => {
                const x = padL + slot * i + (slot - bw) / 2;
                const cls = l.errors ? 'bar err' : (l.score === worst && n > 1 ? 'bar worst' : 'bar');
                out += `<rect class="${cls}" x="${x}" y="${y(l.score)}" width="${bw}" height="${H - padB - y(l.score)}" rx="3"><title>Loop ${l.n}: ${l.score} pts</title></rect>`;
                if (n <= 20 || i % Math.ceil(n / 20) === 0) out += `<text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${l.n}</text>`;
            });
            const thr = y(best * 0.97);
            out += `<line class="thr" x1="${padL}" x2="${W - padR}" y1="${thr}" y2="${thr}"></line>`;
            const temps = loops.filter(l => l.temp_avg !== null && l.temp_avg !== undefined);
            if (temps.length >= 2) {
                const tMin = Math.min(...temps.map(l => l.temp_avg)) - 3, tMax = Math.max(...temps.map(l => l.temp_avg)) + 3;
                const ty = t => padT + (H - padT - padB) * (1 - (t - tMin) / Math.max(1, tMax - tMin));
                const pts = loops.map((l, i) => l.temp_avg === null || l.temp_avg === undefined ? null : `${padL + slot * i + slot / 2},${ty(l.temp_avg)}`).filter(Boolean).join(' ');
                out += `<polyline class="temp" points="${pts}"></polyline>`;
                out += `<text x="${W - padR + 6}" y="${ty(tMax - 3) + 3}">${Math.round(tMax - 3)}°</text><text x="${W - padR + 6}" y="${ty(tMin + 3) + 3}">${Math.round(tMin + 3)}°</text>`;
            }
            svg.innerHTML = out;
        }

        function renderStressBenchLoops(loops) {
            const tb = document.getElementById('sb-loops-body');
            if (!tb) return;
            if (!loops.length) { tb.innerHTML = '<tr><td colspan="7" class="ws-empty">Nenhum loop concluído ainda.</td></tr>'; return; }
            const best = Math.max(...loops.map(l => l.score));
            const nd = (v, u) => v === null || v === undefined ? '<span class="ws-muted">N/D</span>' : `${v}${u}`;
            tb.innerHTML = loops.slice().reverse().map(l => `
                <tr>
                    <td class="ws-mono">${l.n}</td>
                    <td class="ws-mono" style="color:var(--text-primary)">${Math.round(l.score).toLocaleString('pt-BR')} <span class="ws-muted text-[11px]">(${(l.score / best * 100).toFixed(1)}%)</span></td>
                    <td class="ws-mono">${nd(l.temp_avg, ' °C')}</td>
                    <td class="ws-mono">${nd(l.temp_max, ' °C')}</td>
                    <td class="ws-mono">${l.clock_avg ? (l.clock_avg / 1000).toFixed(2) + ' GHz' : '<span class="ws-muted">N/D</span>'}</td>
                    <td class="ws-mono">${nd(l.throttle_max, '%')}</td>
                    <td>${l.errors ? `<span class="ws-badge bad">${l.errors}</span>` : '<span class="ws-badge ok">0</span>'}</td>
                </tr>`).join('');
        }

        function renderStressBenchResult(b) {
            const set = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
            const loops = b.loops || [];
            const r = b.result;
            // Durante a execução, mostra a estabilidade parcial dos loops já concluídos
            let stab = null, best = null, worst = null;
            if (r) { stab = r.stability; best = r.best; worst = r.worst; }
            else if (loops.length) {
                const sc = loops.map(l => l.score);
                best = Math.max(...sc); worst = Math.min(...sc); stab = +(worst / best * 100).toFixed(1);
            }
            set('sb-stability', stab !== null ? `${stab}%` : '—');
            const arc = document.getElementById('sb-ring-arc');
            if (arc) arc.style.strokeDashoffset = String(452.4 * (1 - (stab || 0) / 100));
            set('sb-best', best !== null ? Math.round(best).toLocaleString('pt-BR') : '—');
            set('sb-worst', worst !== null ? Math.round(worst).toLocaleString('pt-BR') : '—');
            set('sb-errors', String(b.errors || 0));
            const drop = r ? r.clock_drop_pct : (loops.length >= 2 && loops[0].clock_avg && loops[loops.length - 1].clock_avg
                ? +((1 - loops[loops.length - 1].clock_avg / loops[0].clock_avg) * 100).toFixed(1) : null);
            set('sb-clockdrop', drop !== null && drop !== undefined ? `${drop}%` : '—');

            const v = document.getElementById('sb-verdict');
            if (!v) return;
            if (b.running) { v.className = 'ws-badge brand live'; v.innerHTML = '<span class="dot"></span>Parcial — em execução'; }
            else if (r && r.complete) {
                v.className = `ws-badge ${r.passed ? 'ok' : 'bad'}`;
                v.innerHTML = `<span class="dot"></span>${r.passed ? 'APROVADO' : 'REPROVADO'}${!r.passed ? (r.errors ? ' · erros de cálculo' : ' · estabilidade < 97%') : ''}`;
            } else if (r) { v.className = 'ws-badge warn'; v.innerHTML = `<span class="dot"></span>Incompleto (${r.loops_done}/${r.loops_total} loops)`; }
            else { v.className = 'ws-badge'; v.innerText = 'Aguardando execução'; }
        }

        function renderStressBenchHistory(hist) {
            const tb = document.getElementById('sb-history-body');
            if (!tb) return;
            if (!hist.length) { tb.innerHTML = '<tr><td colspan="6" class="ws-empty">Sem execuções anteriores.</td></tr>'; return; }
            tb.innerHTML = hist.map(h => `
                <tr>
                    <td class="ws-mono text-[11.5px]">${escapeHtml(h.timestamp || '')}</td>
                    <td>${escapeHtml(h.preset || '')} <span class="ws-muted text-[11px]">${h.loops_total}×${h.loop_sec}s</span></td>
                    <td class="ws-mono" style="color:var(--text-primary)">${Math.round(h.average).toLocaleString('pt-BR')}</td>
                    <td class="ws-mono">${h.stability}%</td>
                    <td class="ws-mono">${h.temp_max !== null && h.temp_max !== undefined ? h.temp_max + ' °C' : '<span class="ws-muted">N/D</span>'}</td>
                    <td>${h.passed ? '<span class="ws-badge ok">Aprovado</span>' : '<span class="ws-badge bad">Reprovado</span>'}</td>
                </tr>`).join('');
        }
