        // =====================================================================
        // SISTEMA DE TEMAS: PRETO (DARK), BRANCO (LIGHT) OU AUTOMÁTICO (WINDOWS)
        // =====================================================================
        function setTheme(mode) {
            const body = document.body;
            const html = document.documentElement;
            let effectiveTheme = mode;
            if (mode === 'auto') {
                const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                effectiveTheme = isSystemDark ? 'dark' : 'light';
            }

            if (effectiveTheme === 'light') {
                body.classList.add('theme-light', 'theme-white');
                body.classList.remove('theme-dark');
                html.classList.remove('dark');
                html.classList.add('light');
            } else {
                body.classList.remove('theme-light', 'theme-white');
                body.classList.add('theme-dark');
                html.classList.add('dark');
                html.classList.remove('light');
            }

            localStorage.setItem('winshield_theme', mode);

            applyThemeButtonStyles(mode, effectiveTheme);
            applyLanguageButtonStyles();
            lucide.createIcons();
        }

        function initTheme() {
            const saved = localStorage.getItem('winshield_theme') || 'auto';
            setTheme(saved);

            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                    if (localStorage.getItem('winshield_theme') === 'auto') {
                        setTheme('auto');
                    }
                });
            }
        }

