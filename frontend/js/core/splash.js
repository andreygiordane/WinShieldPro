        // =====================================================================
        // BANNER DE INICIALIZAÇÃO (STARTUP SPLASH SCREEN)
        // =====================================================================
        function selectSplashLanguage(lang) {
            if (splashTimer) {
                clearTimeout(splashTimer);
                splashTimer = null;
            }
            setLanguage(lang);
            updateSplashLanguageButtons(lang);
        }

        function updateSplashLanguageButtons(lang) {
            const targetLang = lang || currentLang || 'pt';
            ['pt', 'en', 'es'].forEach(l => {
                const btn = document.getElementById(`splash-lang-btn-${l}`);
                if (!btn) return;
                if (l === targetLang) {
                    btn.className = "px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 bg-gradient-to-r from-blue-600/60 to-cyan-500/60 border border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)] scale-105";
                } else {
                    btn.className = "px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 text-slate-400 hover:text-white hover:bg-white/5 border border-transparent";
                }
            });
        }

        function initStartupBanner() {
            const skip = localStorage.getItem('winshield_skip_splash') === 'true';
            const modal = document.getElementById('startup-splash-modal');
            const chk = document.getElementById('chk-skip-splash');
            if (chk) chk.checked = skip;

            updateSplashLanguageButtons(currentLang);

            if (skip) {
                if (modal) modal.style.display = 'none';
            } else {
                showStartupBanner(false);
            }
        }

        function toggleSkipSplashPreference(checked) {
            localStorage.setItem('winshield_skip_splash', checked ? 'true' : 'false');
        }

        function showStartupBanner(manual = false) {
            const modal = document.getElementById('startup-splash-modal');
            if (!modal) return;
            modal.style.display = 'flex';
            modal.style.opacity = '1';

            updateSplashLanguageButtons(currentLang);

            const bar = document.getElementById('splash-progress-bar');
            const pctText = document.getElementById('splash-pct-text');
            const statusText = document.getElementById('splash-status-text');

            if (bar) bar.style.width = '20%';
            if (pctText) pctText.innerText = '20%';
            if (statusText) statusText.innerText = t('splash.status_loading1') || 'Verificando privilégios de Administrador & Kernel...';

            if (splashTimer) clearTimeout(splashTimer);

            setTimeout(() => {
                if (bar) bar.style.width = '55%';
                if (pctText) pctText.innerText = '55%';
                if (statusText) statusText.innerText = t('splash.status_loading2') || 'Sincronizando telemetria de hardware e sensores...';
            }, 300);

            setTimeout(() => {
                if (bar) bar.style.width = '85%';
                if (pctText) pctText.innerText = '85%';
                if (statusText) statusText.innerText = t('splash.status_loading3') || 'Carregando motores de disco e segurança...';
            }, 700);

            setTimeout(() => {
                if (bar) bar.style.width = '100%';
                if (pctText) pctText.innerText = '100%';
                if (statusText) statusText.innerText = t('splash.progress_ready') || 'Sistema pronto para uso!';
                const enterBtn = document.getElementById('splash-enter-btn');
                if (enterBtn) {
                    enterBtn.classList.add('ring-2', 'ring-cyan-400/50');
                }
                lucide.createIcons();
            }, 1150);

            if (!manual) {
                splashTimer = setTimeout(() => {
                    closeStartupBanner();
                }, 10000);
            }
        }

        function closeStartupBanner() {
            if (splashTimer) {
                clearTimeout(splashTimer);
                splashTimer = null;
            }
            const modal = document.getElementById('startup-splash-modal');
            if (!modal) return;
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.display = 'none';
            }, 450);
        }

