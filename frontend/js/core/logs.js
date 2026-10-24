        // =====================================================================
        // LOGS EM TEMPO REAL & CONSOLE
        // =====================================================================
        async function pollLogs() {
            try {
                const res = await fetch(`/api/logs?since=${logIndex}`);
                if (!res.ok) return;
                const data = await res.json();
                if (data.logs && data.logs.length > 0) {
                    const box = document.getElementById('console-output');
                    data.logs.forEach(msg => {
                        box.innerHTML += escapeHtml(msg) + "\n";
                    });
                    logIndex = data.total;
                    box.scrollTop = box.scrollHeight;
                }
            } catch (e) { }
        }

        function toggleConsole() {
            const panel = document.getElementById('live-console-panel');
            const barTitle = document.getElementById('console-bar-title');
            if (isConsoleMinimized) {
                panel.style.display = 'flex';
                panel.classList.remove('hidden');
                panel.style.height = '16rem';
                if (barTitle) barTitle.innerText = t('console.title_open');
                isConsoleMinimized = false;
            } else {
                panel.style.display = 'none';
                panel.classList.add('hidden');
                if (barTitle) barTitle.innerText = t('console.title');
                isConsoleMinimized = true;
            }
            lucide.createIcons();
        }

        async function clearConsole() {
            document.getElementById('console-output').innerHTML = '';
            try { await fetch('/api/logs/clear', { method: 'POST' }); } catch (e) { }
        }

        function downloadConsoleLog() {
            const text = document.getElementById('console-output').innerText;
            const blob = new Blob([text], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `winshield_pro_log_${Date.now()}.log`;
            a.click();
        }

