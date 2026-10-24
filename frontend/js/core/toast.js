        // =====================================================================
        // SISTEMA DE NOTIFICAÇÕES (TOASTS) MODERNOS & ANIMADOS
        // =====================================================================
        function showToast(title, message, type = 'info', duration = 4000) {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `winshield-toast toast-${type}`;

            let iconName = 'info';
            if (type === 'success') iconName = 'check-circle';
            else if (type === 'error') iconName = 'alert-octagon';
            else if (type === 'warning') iconName = 'alert-triangle';

            toast.innerHTML = `
                <div class="flex-shrink-0 mt-0.5">
                    <i data-lucide="${iconName}" class="w-5 h-5"></i>
                </div>
                <div class="flex-1 min-w-0 pr-2">
                    <h5 class="text-xs font-bold leading-tight">${escapeHtml(title)}</h5>
                    <p class="text-[11px] mt-0.5 leading-snug opacity-95">${escapeHtml(message)}</p>
                </div>
                <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white flex-shrink-0 transition">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
                <div class="toast-progress-bar" style="width: 100%;"></div>
            `;

            container.appendChild(toast);
            lucide.createIcons();

            const pBar = toast.querySelector('.toast-progress-bar');
            setTimeout(() => {
                if (pBar) {
                    pBar.style.transitionDuration = `${duration}ms`;
                    pBar.style.width = '0%';
                }
            }, 25);

            const timer = setTimeout(() => {
                toast.classList.add('toast-hiding');
                setTimeout(() => toast.remove(), 250);
            }, duration);

            toast.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                clearTimeout(timer);
                toast.classList.add('toast-hiding');
                setTimeout(() => toast.remove(), 250);
            });
        }

