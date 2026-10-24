        // =====================================================================
        // GERENCIAMENTO DA SIDEBAR ENTERPRISE MULTI-RESOLUÇÃO & BUSCA RÁPIDA
        // =====================================================================
        const TAB_CATEGORY_MAP = {
            'overview': { key: 'nav.group_hardware', badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25' },
            'silicon': { key: 'nav.group_hardware', badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/25' },
            'vision': { key: 'nav.group_hardware', badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
            'memory': { key: 'nav.group_hardware', badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/25' },
            'devices': { key: 'nav.group_hardware', badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25' },
            'stability': { key: 'nav.group_stability', badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25' },
            'disk-health': { key: 'nav.group_storage', badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/25' },
            'disk-bench': { key: 'nav.group_storage', badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' },
            'network': { key: 'nav.group_storage', badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25' },
            'running-apps': { key: 'nav.group_apps', badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
            'audit': { key: 'nav.group_apps', badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/25' },
            'antivirus': { key: 'nav.group_apps', badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/25' },
            'clean': { key: 'nav.group_system', badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/25' },
            'power': { key: 'nav.group_system', badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25' },
            'optimize': { key: 'nav.group_system', badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/25' },
            'terminal': { key: 'nav.group_system', badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25' }
        };

        function updatePageCategoryBadge(tabId) {
            const badge = document.getElementById('page-category-badge');
            if (!badge) return;
            const info = TAB_CATEGORY_MAP[tabId] || TAB_CATEGORY_MAP['overview'];
            badge.innerText = t(info.key);
            badge.className = `hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border flex-shrink-0 ${info.badgeClass}`;
        }

        function toggleSidebar() {
            if (window.innerWidth < 1024) {
                const sidebar = document.getElementById('main-sidebar');
                if (!sidebar) return;
                if (sidebar.classList.contains('sidebar-mobile-open')) {
                    closeMobileSidebar();
                } else {
                    openMobileSidebar();
                }
            } else {
                toggleSidebarCollapse();
            }
        }

        function openMobileSidebar() {
            const sidebar = document.getElementById('main-sidebar');
            const backdrop = document.getElementById('sidebar-backdrop');
            if (sidebar) sidebar.classList.add('sidebar-mobile-open');
            if (backdrop) {
                backdrop.classList.remove('hidden');
                requestAnimationFrame(() => backdrop.classList.remove('opacity-0'));
            }
        }

        function closeMobileSidebar() {
            const sidebar = document.getElementById('main-sidebar');
            const backdrop = document.getElementById('sidebar-backdrop');
            if (sidebar) sidebar.classList.remove('sidebar-mobile-open');
            if (backdrop) {
                backdrop.classList.add('opacity-0');
                setTimeout(() => backdrop.classList.add('hidden'), 200);
            }
            hideRailTooltip();
        }

        function toggleSidebarCollapse(forceState) {
            const sidebar = document.getElementById('main-sidebar');
            if (!sidebar) return;
            const shouldCollapse = typeof forceState === 'boolean'
                ? forceState
                : !sidebar.classList.contains('sidebar-collapsed');

            sidebar.classList.toggle('sidebar-collapsed', shouldCollapse);
            localStorage.setItem('winshield_sidebar_collapsed', shouldCollapse ? '1' : '0');
            hideRailTooltip();

            const btn = document.getElementById('sidebar-collapse-btn');
            if (btn) {
                btn.title = shouldCollapse ? "Expandir menu lateral (Ctrl+B)" : "Recolher menu lateral (Ctrl+B)";
                btn.innerHTML = `<i id="sidebar-collapse-icon" data-lucide="${shouldCollapse ? 'panel-left-open' : 'panel-left-close'}" class="w-4 h-4"></i>`;
            }
            lucide.createIcons();
        }

        function toggleNavGroup(groupId) {
            const group = document.getElementById(groupId);
            if (!group) return;
            group.classList.toggle('group-collapsed');
        }

        function filterSidebarNav(rawQuery) {
            const input = document.getElementById('sidebar-search-input');
            const clearBtn = document.getElementById('sidebar-search-clear');
            const kbdHint = document.getElementById('sidebar-search-kbd');
            const emptyBox = document.getElementById('sidebar-search-empty');

            if (input && input.value !== rawQuery) {
                input.value = rawQuery;
            }

            const q = (rawQuery || '').trim().toLowerCase();
            if (clearBtn) clearBtn.classList.toggle('hidden', q.length === 0);
            if (kbdHint) kbdHint.classList.toggle('hidden', q.length > 0);

            let totalVisible = 0;
            document.querySelectorAll('#sidebar-nav-scroll .sidebar-section-group, #sidebar-nav-scroll .nav-group').forEach(group => {
                let groupMatches = 0;
                group.querySelectorAll('.nav-item').forEach(btn => {
                    const text = (btn.innerText || '').toLowerCase();
                    const idText = (btn.id || '').toLowerCase();
                    const match = !q || text.includes(q) || idText.includes(q);
                    btn.classList.toggle('hidden', !match);
                    if (match) {
                        groupMatches++;
                        totalVisible++;
                    }
                });

                if (q.length > 0) {
                    group.classList.toggle('hidden', groupMatches === 0);
                } else {
                    group.classList.remove('hidden');
                }
            });

            if (emptyBox) {
                emptyBox.classList.toggle('hidden', totalVisible > 0);
            }
        }

        function showRailTooltip(btn) {
            const sidebar = document.getElementById('main-sidebar');
            const tooltip = document.getElementById('sidebar-rail-tooltip');
            if (!sidebar || !tooltip || window.innerWidth < 1024 || !sidebar.classList.contains('sidebar-collapsed')) {
                return;
            }
            const labelEl = btn.querySelector('.nav-label-text');
            const label = labelEl ? labelEl.innerText.trim() : '';
            if (!label) return;

            const rect = btn.getBoundingClientRect();
            tooltip.innerText = label;
            tooltip.style.left = `${rect.right + 10}px`;
            tooltip.style.top = `${Math.round(rect.top + rect.height / 2 - 15)}px`;
            tooltip.classList.add('tooltip-visible');
        }

        function hideRailTooltip() {
            const tooltip = document.getElementById('sidebar-rail-tooltip');
            if (tooltip) tooltip.classList.remove('tooltip-visible');
        }

        function initSidebarResponsiveState() {
            const savedCollapsed = localStorage.getItem('winshield_sidebar_collapsed') === '1';
            if (savedCollapsed && window.innerWidth >= 1024) {
                toggleSidebarCollapse(true);
            }

            window.addEventListener('resize', () => {
                if (window.innerWidth >= 1024) {
                    closeMobileSidebar();
                } else {
                    hideRailTooltip();
                }
            });

            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                    e.preventDefault();
                    toggleSidebar();
                } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                    e.preventDefault();
                    const sidebar = document.getElementById('main-sidebar');
                    if (window.innerWidth < 1024) {
                        openMobileSidebar();
                    } else if (sidebar && sidebar.classList.contains('sidebar-collapsed')) {
                        toggleSidebarCollapse(false);
                    }
                    setTimeout(() => {
                        const searchInput = document.getElementById('sidebar-search-input');
                        if (searchInput) {
                            searchInput.focus();
                            searchInput.select();
                        }
                    }, 80);
                } else if (e.key === 'Escape') {
                    const searchInput = document.getElementById('sidebar-search-input');
                    if (document.activeElement === searchInput && searchInput.value) {
                        filterSidebarNav('');
                        searchInput.blur();
                    } else if (window.innerWidth < 1024) {
                        closeMobileSidebar();
                    }
                }
            });
        }
        initSidebarResponsiveState();

        function switchTab(tabId) {
            currentTab = tabId;
            document.querySelectorAll('.view-panel').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.nav-item').forEach(el => {
                el.classList.remove('active');
            });

            const targetView = document.getElementById(`view-${tabId}`);
            if (targetView) targetView.classList.remove('hidden');

            const activeNav = document.getElementById(`nav-btn-${tabId}`);
            if (activeNav) {
                activeNav.classList.add('active');
                const parentGroup = activeNav.closest('.nav-group');
                if (parentGroup) parentGroup.classList.remove('group-collapsed');
                activeNav.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }

            const mainScroll = document.getElementById('main-content-scroll');
            if (mainScroll) mainScroll.scrollTo({ top: 0, behavior: 'smooth' });

            if (window.innerWidth < 1024) {
                closeMobileSidebar();
            }

            const headerInfo = (TAB_TITLES_I18N[currentLang] && TAB_TITLES_I18N[currentLang][tabId]) ||
                (TAB_TITLES_I18N['pt'][tabId]) || { title: 'WinShield Pro', sub: '' };
            const pageTitle = document.getElementById('page-title');
            const pageSub = document.getElementById('page-subtitle');
            if (pageTitle) pageTitle.innerText = headerInfo.title;
            if (pageSub) pageSub.innerText = headerInfo.sub;
            document.title = `${headerInfo.title} - WinShield Pro Enterprise`;
            updatePageCategoryBadge(tabId);

            if (tabId === 'memory') loadMemoryInfo();
            if (tabId === 'running-apps') loadRunningApps();
            if (tabId === 'audit' && currentAuditList.length === 0) runAuditAction('registry');
            if (tabId === 'disk-health') loadDisksHealth();
            if (tabId === 'silicon') loadSiliconInfo();
            if (tabId === 'vision') {
                loadVisionInfo();
                if (!visionSensorsTimer) visionSensorsTimer = setInterval(pollVisionSensors, 1500);
            } else {
                if (visionSensorsTimer) { clearInterval(visionSensorsTimer); visionSensorsTimer = null; }
            }
            if (tabId === 'antivirus') checkDefenderStatus();
            if (tabId === 'clean' && currentCleanCategories.length === 0) analyzeTempFiles(true);
            if (tabId === 'optimize') loadOptimizationProfile();
            if (tabId === 'disk-bench') pollBenchmarkStatus();
            if (tabId === 'network') loadNetworkInfo();
            if (tabId === 'devices') loadDevicesInfo();
            if (tabId === 'stability') {
                loadStabilityInfo();
                if (!stabilityPollTimer) stabilityPollTimer = setInterval(pollStabilityStatus, 1000);
            } else {
                if (stabilityPollTimer && !isStabilityTestingActive) {
                    clearInterval(stabilityPollTimer);
                    stabilityPollTimer = null;
                }
            }
        }

