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

            document.getElementById('term-exec-shell-badge').innerText = `${mode} (ADMIN)`;
            document.getElementById('term-exec-cmd-text').innerText = cmd;
            document.getElementById('term-exec-status').innerHTML = `
                <i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i>
                <span>Executando comando...</span>
            `;
            document.getElementById('term-exec-status').className = "flex items-center gap-1.5 text-xs font-semibold text-cyan-400";
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

                if (data.code === 0) {
                    document.getElementById('term-exec-status').innerHTML = `
                        <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400"></i>
                        <span class="text-emerald-400 font-bold">Concluído (Código 0)</span>
                    `;
                } else {
                    document.getElementById('term-exec-status').innerHTML = `
                        <i data-lucide="alert-circle" class="w-3.5 h-3.5 text-rose-400"></i>
                        <span class="text-rose-400 font-bold">Finalizado (Código ${data.code ?? 1})</span>
                    `;
                }

                document.getElementById('term-exec-output').innerText = data.output || "Comando executado sem retorno textual.";
                lucide.createIcons();
                showToast("Terminal", "Comando executado com sucesso.", "success", 2000);
            } catch (e) {
                if (termTimer) { clearInterval(termTimer); termTimer = null; }
                document.getElementById('term-exec-status').innerHTML = `
                    <i data-lucide="x-circle" class="w-3.5 h-3.5 text-rose-500"></i>
                    <span class="text-rose-400 font-bold">Falha de Execução</span>
                `;
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

