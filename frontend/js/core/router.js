        // =====================================================================
        // NAVEGAÇÃO ENTRE ABAS
        // =====================================================================

        // =====================================================================
        // CONTROLADOR DE MODAL PADRONIZADO (WINSHIELD CONFIRM DIALOG)
        // =====================================================================
        let _confirmModalResolver = null;

        function showConfirmModal({
            title = 'Confirmar Operação',
            message = 'Deseja prosseguir com esta ação?',
            itemName = '',
            itemDetails = '',
            itemIcon = 'alert-triangle',
            warningText = '',
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            type = 'danger'
        }) {
            return new Promise((resolve) => {
                _confirmModalResolver = resolve;
                const modal = document.getElementById('confirm-action-modal');
                const box = document.getElementById('confirm-modal-box');
                const glow = document.getElementById('confirm-modal-glow');
                const iconBox = document.getElementById('confirm-icon-box');
                const iconGlow = document.getElementById('confirm-icon-glow');
                const iconEl = document.getElementById('confirm-icon');
                const titleEl = document.getElementById('confirm-modal-title');
                const msgEl = document.getElementById('confirm-modal-msg');
                const itemCard = document.getElementById('confirm-item-card');
                const itemNameEl = document.getElementById('confirm-item-name');
                const itemDetailEl = document.getElementById('confirm-item-detail');
                const warnBox = document.getElementById('confirm-modal-warn');
                const warnTextEl = document.getElementById('confirm-modal-warn-text');
                const btnAction = document.getElementById('confirm-btn-action');
                const btnCancel = document.getElementById('confirm-btn-cancel');
                const btnText = document.getElementById('confirm-btn-text');

                if (titleEl) titleEl.innerText = title;
                if (msgEl) msgEl.innerText = message;
                if (btnText) btnText.innerText = confirmText;
                if (btnCancel) {
                    const cancelSpan = btnCancel.querySelector('span');
                    if (cancelSpan) cancelSpan.innerText = cancelText;
                }

                if (itemName) {
                    itemCard.classList.remove('hidden');
                    itemNameEl.innerText = itemName;
                    itemDetailEl.innerText = itemDetails || '';
                } else {
                    itemCard.classList.add('hidden');
                }

                if (warningText) {
                    warnBox.classList.remove('hidden');
                    warnTextEl.innerText = warningText;
                } else {
                    warnBox.classList.add('hidden');
                }

                // Paleta de cores moderna
                if (type === 'danger') {
                    glow.className = "absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl pointer-events-none bg-rose-500/20";
                    iconBox.className = "relative w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-400";
                    iconGlow.className = "absolute inset-0 rounded-2xl bg-rose-500/30 blur-md";
                    iconEl.setAttribute('data-lucide', itemIcon || 'skull');
                    btnAction.className = "px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition-all flex items-center space-x-1.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-900/40";
                } else if (type === 'warning') {
                    glow.className = "absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl pointer-events-none bg-amber-500/20";
                    iconBox.className = "relative w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400";
                    iconGlow.className = "absolute inset-0 rounded-2xl bg-amber-500/30 blur-md";
                    iconEl.setAttribute('data-lucide', itemIcon || 'alert-triangle');
                    btnAction.className = "px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition-all flex items-center space-x-1.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 shadow-amber-900/40";
                } else {
                    glow.className = "absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl pointer-events-none bg-blue-500/20";
                    iconBox.className = "relative w-16 h-16 rounded-2xl bg-blue-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400";
                    iconGlow.className = "absolute inset-0 rounded-2xl bg-blue-500/30 blur-md";
                    iconEl.setAttribute('data-lucide', itemIcon || 'shield-check');
                    btnAction.className = "px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition-all flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-900/40";
                }

                lucide.createIcons();
                modal.classList.remove('pointer-events-none', 'opacity-0');
                modal.classList.add('opacity-100');
                box.classList.remove('scale-95');
                box.classList.add('scale-100');
            });
        }

        function resolveConfirmModal(result) {
            const modal = document.getElementById('confirm-action-modal');
            const box = document.getElementById('confirm-modal-box');
            if (box) {
                box.classList.remove('scale-100');
                box.classList.add('scale-95');
            }
            if (modal) {
                modal.classList.remove('opacity-100');
                modal.classList.add('opacity-0', 'pointer-events-none');
            }
            if (_confirmModalResolver) {
                const cb = _confirmModalResolver;
                _confirmModalResolver = null;
                cb(Boolean(result));
            }
        }

