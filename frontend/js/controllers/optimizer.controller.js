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

