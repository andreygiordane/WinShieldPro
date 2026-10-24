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

