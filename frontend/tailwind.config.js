// Configuração do Tailwind (antes embutida no HTML e processada pela CDN em tempo real).
// Agora o CSS é gerado no build por scripts/build_frontend.py -> frontend/vendor/tailwind.css
module.exports = {
    darkMode: 'class',
    content: {
        relative: true,
        // O dashboard compilado já contém o shell, todas as páginas e o app.js
        files: ['./winshield_pro_dashboard.html'],
    },
    theme: {
        extend: {
            fontFamily: {
                sans: ['Segoe UI Variable Text', 'Segoe UI', 'Plus Jakarta Sans', 'Inter', 'sans-serif'],
                mono: ['Cascadia Mono', 'JetBrains Mono', 'Consolas', 'monospace'],
            },
            colors: {
                dark: {
                    950: 'rgb(var(--c-dark-950) / <alpha-value>)',
                    900: 'rgb(var(--c-dark-900) / <alpha-value>)',
                    850: 'rgb(var(--c-dark-850) / <alpha-value>)',
                    800: 'rgb(var(--c-dark-800) / <alpha-value>)',
                    750: 'rgb(var(--c-dark-750) / <alpha-value>)',
                    700: 'rgb(var(--c-dark-700) / <alpha-value>)',
                    600: 'rgb(var(--c-dark-600) / <alpha-value>)',
                    500: 'rgb(var(--c-dark-500) / <alpha-value>)',
                }
            }
        }
    }
};
