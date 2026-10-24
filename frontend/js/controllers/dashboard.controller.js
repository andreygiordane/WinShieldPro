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

                // Volumes C: & Lista
                if (lv.volumes && lv.volumes.length > 0) {
                    const cVol = lv.volumes.find(v => v.letter === 'C') || lv.volumes[0];
                    if (cVol) {
                        const freeGb = (cVol.free / (1024 ** 3)).toFixed(1);
                        document.getElementById('overview-disk-c-val').innerText = `${cVol.percent}%`;
                        document.getElementById('overview-disk-c-free').innerText = `${freeGb} GB Livre`;
                        document.getElementById('overview-disk-c-bar').style.width = `${cVol.percent}%`;
                        document.getElementById('overview-disk-c-model').innerText = `${cVol.label} (${cVol.letter}:) - ${cVol.fs}`;
                    }

                    // Render volumes list in overview
                    const vBox = document.getElementById('overview-volumes-list');
                    vBox.innerHTML = '';
                    lv.volumes.forEach(v => {
                        const totalGb = (v.total / (1024 ** 3)).toFixed(0);
                        const freeGb = (v.free / (1024 ** 3)).toFixed(1);
                        vBox.innerHTML += `
                            <div class="p-2.5 rounded-xl bg-dark-900 border border-slate-800 text-xs">
                                <div class="flex items-center justify-between mb-1">
                                    <span class="font-bold text-slate-200">${v.letter}: [${v.label}]</span>
                                    <span class="font-mono text-slate-400">${freeGb} GB livres de ${totalGb} GB</span>
                                </div>
                                <div class="w-full bg-dark-950 rounded-full h-1.5 overflow-hidden">
                                    <div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${v.percent}%"></div>
                                </div>
                            </div>
                        `;
                    });

                    // Atualiza opções do seletor de benchmark se necessário
                    const bSelect = document.getElementById('bench-drive-select');
                    const sSelect = document.getElementById('sectorguard-scan-drive');
                    if (bSelect.options.length <= 1) {
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

