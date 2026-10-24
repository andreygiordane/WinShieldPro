        // =====================================================================
        // CENTRAL DE DISPOSITIVOS, DRIVERS OFICIAIS & PAREAMENTO DE HARDWARE
        // =====================================================================
        let allInstalledDevices = [];
        let currentDeviceFilter = 'all';
        let currentDriverVendorFilter = 'all';
        let latestDriverUpdatesData = null;
        let driverDownloadsPollTimer = null;

        async function loadDevicesInfo(force = false) {
            if (!force && allInstalledDevices && allInstalledDevices.length > 0) {
                renderDevicesTable();
                return;
            }

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
                if (!latestDriverUpdatesData) {
                    scanDriverUpdates(false);
                } else {
                    renderDriverUpdates(latestDriverUpdatesData);
                }
            }
            lucide.createIcons();
        }

        async function scanDriverUpdates(force = false) {
            if (!force && latestDriverUpdatesData) {
                renderDriverUpdates(latestDriverUpdatesData);
                return;
            }

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
