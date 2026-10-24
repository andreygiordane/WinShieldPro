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
            document.querySelectorAll('.silicon-subview, .silicon-subview').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.silicon-subtab-btn, .silicon-subtab-btn').forEach(el => {
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
                const c = data.silicon || {};

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
            document.querySelectorAll('.vision-subview, .vision-subview').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.vision-subtab-btn, .vision-subtab-btn').forEach(el => {
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
