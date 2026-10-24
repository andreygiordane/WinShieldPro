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
        // Aliases retrocompatíveis para chamadas de interface e automação
        const activeStressTab = activeStressTab;
        const stressTracesVisible = stressTracesVisible;
        const toggleStressTrace = toggleStressTrace;
        const setStressTab = setStressTab;
        const renderStressCharts = renderStressCharts;
        const renderStressUpperGraph = renderStressUpperGraph;
        const renderStressLowerGraph = renderStressLowerGraph;
        const startStressTest = startStressTest;
        const stopStressTest = stopStressTest;
        const clearStressStats = clearStressStats;
        const saveStressReport = saveStressReport;
        const openStressCpuid = openSiliconMatrixModal;
        const closeStressCpuid = closeSiliconMatrixModal;
        const openStressPreferences = openStressPreferences;
        const closeStressPreferences = closeStressPreferences;
