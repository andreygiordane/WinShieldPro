        // =====================================================================
        // CONTROLES DE JANELA NATIVOS (RESET EXPLODE WINDOWCHROME)
        // =====================================================================
        // Desativa a tecla F5 (atualizar pagina) e atalhos de reload no Desktop App
        (function disableBrowserReload() {
            function blockReload(e) {
                const isF5 = (e.key === 'F5' || e.code === 'F5' || e.keyCode === 116 || e.which === 116);
                const isCtrlR = (e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R' || e.code === 'KeyR' || e.keyCode === 82);
                const isMediaRefresh = (e.key === 'BrowserRefresh');

                if (isF5 || isCtrlR || isMediaRefresh) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof e.stopImmediatePropagation === 'function') {
                        e.stopImmediatePropagation();
                    }
                    return false;
                }
            }
            window.addEventListener('keydown', blockReload, { capture: true, passive: false });
            window.addEventListener('keyup', blockReload, { capture: true, passive: false });
            document.addEventListener('keydown', blockReload, { capture: true, passive: false });
            document.addEventListener('keyup', blockReload, { capture: true, passive: false });
        })();

        function handleWindowMinimize() {
            showToast("Segundo Plano", "WinShield Pro permanece ativo monitorando o sistema.", "info", 3000);
        }

        function handleWindowMaximize() {
            if (!document.fullscreenElement) {
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                }
            }
        }

        document.addEventListener('fullscreenchange', () => {
            const maxIcon = document.getElementById('win-max-icon');
            if (maxIcon) {
                if (document.fullscreenElement) {
                    maxIcon.setAttribute('data-lucide', 'minimize-2');
                } else {
                    maxIcon.setAttribute('data-lucide', 'square');
                }
                lucide.createIcons();
            }
        });

        async function handleWindowClose() {
            const confirmed = await showConfirmModal({
                title: 'Encerrar WinShield Pro',
                message: 'Deseja realmente encerrar a aplicação e descarregar os serviços de telemetria?',
                btnText: 'Encerrar',
                isDanger: true,
                icon: 'power',
                warningText: 'A proteção em segundo plano e o monitoramento de hardware serão finalizados.'
            });
            if (confirmed) {
                try {
                    await fetch('/api/app/exit', { method: 'POST' });
                } catch (e) {}
                window.close();
            }
        }

        function toggleThemeQuick() {
            const isDark = document.documentElement.classList.contains('dark');
            setTheme(isDark ? 'light' : 'dark');
        }

