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

