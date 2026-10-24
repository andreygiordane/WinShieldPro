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

