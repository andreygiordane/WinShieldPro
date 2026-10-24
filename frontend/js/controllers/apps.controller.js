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

