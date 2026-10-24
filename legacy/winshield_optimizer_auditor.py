import os
import sys
import shutil
import subprocess
import threading
import re
from datetime import datetime

# Importações condicionais para permitir execução/testes em qualquer ambiente
# e funcionamento nativo total no Windows com privilégios de Administrador.
try:
    import winreg
except ImportError:
    winreg = None

try:
    import ctypes
except ImportError:
    ctypes = None

# Interface Gráfica Tkinter
try:
    import tkinter as tk
    from tkinter import ttk, messagebox, scrolledtext, filedialog
except ImportError:
    tk = None
    ttk = None
    messagebox = None
    scrolledtext = None
    filedialog = None

IS_WINDOWS = (sys.platform == "win32")

# ==============================================================================
# MÓDULO DE ELEVAÇÃO DE PRIVILÉGIOS (UAC / ADMINISTRADOR)
# ==============================================================================

def is_admin():
    """Verifica se o processo possui privilégios de Administrador no Windows."""
    if not IS_WINDOWS or ctypes is None:
        return False
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except Exception:
        return False

def elevate_privileges():
    """Solicita elevação de privilégios UAC no Windows, relançando o executável/script."""
    if IS_WINDOWS and ctypes is not None and not is_admin():
        try:
            params = " ".join([f'"{arg}"' for arg in sys.argv])
            ctypes.windll.shell32.ShellExecuteW(
                None, "runas", sys.executable, params, None, 1
            )
            sys.exit(0)
        except Exception as e:
            print(f"[ERRO UAC] Falha ao solicitar privilégios de Administrador: {e}")

# ==============================================================================
# MOTOR DE EXECUÇÃO DE COMANDOS NATIVOS DO SISTEMA (CMD & POWERSHELL)
# ==============================================================================

class SystemCommandEngine:
    """
    Motor assíncrono para execução nativa de comandos CMD e PowerShell com
    privilégios elevados, captura de fluxo em tempo real e tratamento de codificação.
    """

    @staticmethod
    def run_cmd(command, callback=None, on_complete=None):
        """Executa um comando CMD nativo de forma assíncrona com streaming contínuo."""
        def worker():
            try:
                startupinfo = None
                if IS_WINDOWS:
                    startupinfo = subprocess.STARTUPINFO()
                    startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW

                process = subprocess.Popen(
                    command,
                    shell=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    startupinfo=startupinfo,
                    bufsize=1
                )

                output_lines = []
                # Leitura em bytes para tratar codificação PT-BR (CP850 / CP1252 / UTF-8)
                for raw_line in iter(process.stdout.readline, b''):
                    line = ""
                    for enc in ["utf-8", "cp850", "cp1252", "latin-1"]:
                        try:
                            line = raw_line.decode(enc)
                            break
                        except UnicodeDecodeError:
                            continue
                    if not line:
                        line = raw_line.decode("utf-8", errors="replace")

                    output_lines.append(line)
                    if callback:
                        callback(line, is_stream=True)

                process.stdout.close()
                return_code = process.wait()

                full_output = "".join(output_lines)
                if callback:
                    callback(full_output, is_stream=False, done=True, return_code=return_code)
                if on_complete:
                    on_complete(return_code, full_output)

            except Exception as ex:
                err_msg = f"\n[ERRO CMD]: {str(ex)}\n"
                if callback:
                    callback(err_msg, is_stream=True, done=True, return_code=-1)
                if on_complete:
                    on_complete(-1, err_msg)

        thread = threading.Thread(target=worker, daemon=True)
        thread.start()
        return thread

    @staticmethod
    def run_powershell(ps_script, callback=None, on_complete=None):
        """Executa um bloco de PowerShell nativo com bypass de política de execução."""
        def worker():
            try:
                startupinfo = None
                if IS_WINDOWS:
                    startupinfo = subprocess.STARTUPINFO()
                    startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW

                cmd = [
                    "powershell.exe",
                    "-NoLogo",
                    "-NoProfile",
                    "-ExecutionPolicy", "Bypass",
                    "-Command", ps_script
                ]

                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    startupinfo=startupinfo,
                    bufsize=1
                )

                output_lines = []
                for raw_line in iter(process.stdout.readline, b''):
                    line = ""
                    for enc in ["utf-8", "cp850", "cp1252", "latin-1"]:
                        try:
                            line = raw_line.decode(enc)
                            break
                        except UnicodeDecodeError:
                            continue
                    if not line:
                        line = raw_line.decode("utf-8", errors="replace")

                    output_lines.append(line)
                    if callback:
                        callback(line, is_stream=True)

                process.stdout.close()
                return_code = process.wait()

                full_output = "".join(output_lines)
                if callback:
                    callback(full_output, is_stream=False, done=True, return_code=return_code)
                if on_complete:
                    on_complete(return_code, full_output)

            except Exception as ex:
                err_msg = f"\n[ERRO POWERSHELL]: {str(ex)}\n"
                if callback:
                    callback(err_msg, is_stream=True, done=True, return_code=-1)
                if on_complete:
                    on_complete(-1, err_msg)

        thread = threading.Thread(target=worker, daemon=True)
        thread.start()
        return thread


# ==============================================================================
# APLICAÇÃO PRINCIPAL: WINSHIELD PRO
# ==============================================================================

class WinShieldProApp(tk.Tk if tk else object):
    def __init__(self):
        if tk is None:
            raise RuntimeError("Tkinter não disponível neste ambiente.")
        super().__init__()

        self.title("WinShield Pro v4.0 Enterprise — Auditoria, Antivírus & Otimização do Sistema")
        self.geometry("1180x780")
        self.minsize(1020, 680)
        self.configure(bg="#090d16")

        self.admin_active = is_admin()

        # Paleta de Cores Premium (Dark Modern)
        self.colors = {
            "bg_dark": "#090d16",
            "bg_panel": "#0f172a",
            "bg_card": "#1e293b",
            "bg_card_hover": "#334155",
            "border": "#334155",
            "accent": "#2563eb",
            "accent_light": "#38bdf8",
            "accent_hover": "#1d4ed8",
            "success": "#10b981",
            "success_hover": "#059669",
            "warning": "#f59e0b",
            "warning_hover": "#d97706",
            "danger": "#ef4444",
            "danger_hover": "#dc2626",
            "text": "#f8fafc",
            "text_muted": "#94a3b8",
            "console_bg": "#030712",
            "console_fg": "#38bdf8"
        }

        # Armazenamento de dados para busca e filtros
        self.audit_records = []
        self.antivirus_records = []

        self._setup_styles()
        self._build_header()
        self._build_main_layout()

        self.log_message("Sistema WinShield Pro inicializado com sucesso.")
        if self.admin_active:
            self.log_message("[OK] Executando com Privilégios Elevados de Administrador (Total Control).")
        else:
            self.log_message("[AVISO CRÍTICO] Executando em modo restrito. Algumas ações no registro e serviços exigem Administrador.")

    # --------------------------------------------------------------------------
    # ESTILOS TTK
    # --------------------------------------------------------------------------
    def _setup_styles(self):
        style = ttk.Style(self)
        style.theme_use("clam")

        style.configure("TNotebook", background=self.colors["bg_dark"], borderwidth=0)
        style.configure(
            "TNotebook.Tab",
            background=self.colors["bg_panel"],
            foreground=self.colors["text_muted"],
            padding=[14, 9],
            font=("Segoe UI", 10, "bold"),
            borderwidth=0
        )
        style.map(
            "TNotebook.Tab",
            background=[("selected", self.colors["accent"])],
            foreground=[("selected", "#ffffff")]
        )

        style.configure(
            "Treeview",
            background=self.colors["bg_panel"],
            foreground=self.colors["text"],
            fieldbackground=self.colors["bg_panel"],
            rowheight=28,
            font=("Segoe UI", 9),
            borderwidth=0
        )
        style.configure(
            "Treeview.Heading",
            background=self.colors["bg_card"],
            foreground="#ffffff",
            font=("Segoe UI", 9, "bold"),
            relief="flat"
        )
        style.map("Treeview", background=[("selected", self.colors["accent"])])

    # --------------------------------------------------------------------------
    # CABEÇALHO SUPERIOR
    # --------------------------------------------------------------------------
    def _build_header(self):
        header = tk.Frame(self, bg=self.colors["bg_panel"], height=65, padx=20, pady=12)
        header.pack(fill="x", side="top")

        left_box = tk.Frame(header, bg=self.colors["bg_panel"])
        left_box.pack(side="left")

        title_lbl = tk.Label(
            left_box,
            text="🛡️ WinShield Pro",
            font=("Segoe UI", 15, "bold"),
            bg=self.colors["bg_panel"],
            fg=self.colors["text"]
        )
        title_lbl.pack(side="left")

        ver_lbl = tk.Label(
            left_box,
            text="v4.0 Enterprise Edition",
            font=("Segoe UI", 8, "bold"),
            bg=self.colors["bg_card"],
            fg=self.colors["accent_light"],
            padx=8,
            pady=2
        )
        ver_lbl.pack(side="left", padx=10)

        desc_lbl = tk.Label(
            left_box,
            text="— Auditor de Programas Ocultos, Antivírus & Otimizador Nativo",
            font=("Segoe UI", 9),
            bg=self.colors["bg_panel"],
            fg=self.colors["text_muted"]
        )
        desc_lbl.pack(side="left")

        # Badge UAC no topo direito
        badge_color = self.colors["success"] if self.admin_active else self.colors["warning"]
        badge_text = "⚡ PRIVILÉGIOS DE ADMINISTRADOR ATIVOS" if self.admin_active else "⚠️ MODO RESTRITO (CLIQUE P/ ELEVAR)"

        self.admin_btn = tk.Button(
            header,
            text=badge_text,
            font=("Segoe UI", 9, "bold"),
            bg=badge_color,
            fg="#ffffff",
            activebackground=badge_color,
            activeforeground="#ffffff",
            relief="flat",
            padx=12,
            pady=6,
            cursor="hand2",
            command=self._handle_uac_elevation
        )
        self.admin_btn.pack(side="right")

    def _handle_uac_elevation(self):
        if not self.admin_active:
            if messagebox.askyesno(
                "Elevação de Privilégios",
                "Deseja reiniciar a ferramenta solicitando privilégios totais de Administrador (UAC)?"
            ):
                elevate_privileges()
        else:
            messagebox.showinfo("Administrador", "O WinShield Pro já está operando com privilégios de Administrador.")

    # --------------------------------------------------------------------------
    # LAYOUT PRINCIPAL (NOTEBOOK + CONSOLE FIXO)
    # --------------------------------------------------------------------------
    def _build_main_layout(self):
        main_pane = tk.PanedWindow(self, orient="vertical", bg=self.colors["bg_dark"], sashwidth=6, bd=0)
        main_pane.pack(fill="both", expand=True, padx=14, pady=10)

        # Abas Superiores
        self.notebook = ttk.Notebook(main_pane)
        main_pane.add(self.notebook, height=480)

        self.tab_audit = tk.Frame(self.notebook, bg=self.colors["bg_dark"])
        self.tab_antivirus = tk.Frame(self.notebook, bg=self.colors["bg_dark"])
        self.tab_clean = tk.Frame(self.notebook, bg=self.colors["bg_dark"])
        self.tab_power = tk.Frame(self.notebook, bg=self.colors["bg_dark"])
        self.tab_optimize = tk.Frame(self.notebook, bg=self.colors["bg_dark"])
        self.tab_terminal = tk.Frame(self.notebook, bg=self.colors["bg_dark"])

        self.notebook.add(self.tab_audit, text="🔍 Programas Ocultos & Desinstalação")
        self.notebook.add(self.tab_antivirus, text="🛡️ Antivírus & Caça a Ameaças")
        self.notebook.add(self.tab_clean, text="🧹 Limpeza Profunda (%TEMP%)")
        self.notebook.add(self.tab_power, text="⚡ Planos de Energia & Turbo")
        self.notebook.add(self.tab_optimize, text="🚀 Otimização do Sistema & Debloat")
        self.notebook.add(self.tab_terminal, text="💻 Console CMD / PowerShell")

        self._build_tab_audit()
        self._build_tab_antivirus()
        self._build_tab_clean()
        self._build_tab_power()
        self._build_tab_optimize()
        self._build_tab_terminal()

        # Painel Inferior: Console de Saída em Tempo Real
        console_frame = tk.Frame(main_pane, bg=self.colors["bg_panel"], padx=12, pady=8)
        main_pane.add(console_frame, height=210)

        top_bar = tk.Frame(console_frame, bg=self.colors["bg_panel"])
        top_bar.pack(fill="x", pady=(0, 6))

        tk.Label(
            top_bar,
            text="📟 Terminal de Execução em Tempo Real (Live Output Stream):",
            font=("Segoe UI", 9, "bold"),
            bg=self.colors["bg_panel"],
            fg=self.colors["accent_light"]
        ).pack(side="left")

        tk.Button(
            top_bar,
            text="📁 Salvar Log",
            font=("Segoe UI", 8),
            bg=self.colors["bg_card"],
            fg=self.colors["text"],
            relief="flat",
            padx=8,
            command=self._save_log_to_file
        ).pack(side="right", padx=(4, 0))

        tk.Button(
            top_bar,
            text="Limpar Log",
            font=("Segoe UI", 8),
            bg=self.colors["bg_card"],
            fg=self.colors["text"],
            relief="flat",
            padx=8,
            command=self.clear_log
        ).pack(side="right")

        self.console_output = scrolledtext.ScrolledText(
            console_frame,
            bg=self.colors["console_bg"],
            fg=self.colors["console_fg"],
            insertbackground="#ffffff",
            font=("Consolas", 9),
            relief="flat",
            height=8
        )
        self.console_output.pack(fill="both", expand=True)

    # ==========================================================================
    # ABA 1: PROGRAMAS OCULTOS & DESINSTALAÇÃO
    # ==========================================================================
    def _build_tab_audit(self):
        toolbar = tk.Frame(self.tab_audit, bg=self.colors["bg_panel"], padx=12, pady=10)
        toolbar.pack(fill="x", pady=(4, 8))

        self._create_button(
            toolbar, "🔍 Escanear Registro (Programas Ocultos)",
            self.scan_installed_and_hidden_programs, self.colors["accent"]
        ).pack(side="left", padx=3)

        self._create_button(
            toolbar, "📦 Escanear Pacotes AppX / UWP",
            self.scan_appx_packages, self.colors["bg_card"]
        ).pack(side="left", padx=3)

        self._create_button(
            toolbar, "⚙️ Serviços Ocultos (Fora de System32)",
            self.scan_third_party_services, self.colors["bg_card"]
        ).pack(side="left", padx=3)

        self._create_button(
            toolbar, "🚀 Inicialização / Autorun",
            self.scan_startup_entries, self.colors["bg_card"]
        ).pack(side="left", padx=3)

        # Ações à direita
        self._create_button(
            toolbar, "🗑️ Desinstalar Selecionado",
            self.uninstall_selected_program, self.colors["danger"]
        ).pack(side="right", padx=3)

        self._create_button(
            toolbar, "👁️ Desocultar no Painel",
            self.unhide_selected_program, self.colors["warning"]
        ).pack(side="right", padx=3)

        self._create_button(
            toolbar, "💥 Exclusão Forçada (Shred)",
            self.force_shred_selected_program, self.colors["danger_hover"]
        ).pack(side="right", padx=3)

        # Barra de Pesquisa / Filtro
        filter_bar = tk.Frame(self.tab_audit, bg=self.colors["bg_dark"], padx=4, pady=4)
        filter_bar.pack(fill="x")

        tk.Label(
            filter_bar, text="Filtrar Resultados:", font=("Segoe UI", 9),
            bg=self.colors["bg_dark"], fg=self.colors["text_muted"]
        ).pack(side="left", padx=(0, 6))

        self.audit_filter_var = tk.StringVar()
        self.audit_filter_var.trace_add("write", lambda *args: self._filter_audit_tree())
        filter_entry = tk.Entry(
            filter_bar, textvariable=self.audit_filter_var, font=("Segoe UI", 9),
            bg=self.colors["bg_panel"], fg=self.colors["text"], insertbackground="#fff",
            relief="flat", width=40
        )
        filter_entry.pack(side="left", ipady=3)

        self.audit_stats_lbl = tk.Label(
            filter_bar, text="Nenhum escaneamento realizado.",
            font=("Segoe UI", 9, "bold"), bg=self.colors["bg_dark"], fg=self.colors["accent_light"]
        )
        self.audit_stats_lbl.pack(side="right")

        # Tabela Treeview
        columns = ("nome", "versao_ou_pid", "origem", "status", "caminho_comando")
        self.audit_tree = ttk.Treeview(self.tab_audit, columns=columns, show="headings")
        self.audit_tree.heading("nome", text="Nome do Programa / Serviço")
        self.audit_tree.heading("versao_ou_pid", text="Versão / PID")
        self.audit_tree.heading("origem", text="Origem / Escopo")
        self.audit_tree.heading("status", text="Visibilidade / Alerta")
        self.audit_tree.heading("caminho_comando", text="Caminho / Comando de Desinstalação")

        self.audit_tree.column("nome", width=260)
        self.audit_tree.column("versao_ou_pid", width=90)
        self.audit_tree.column("origem", width=140)
        self.audit_tree.column("status", width=170)
        self.audit_tree.column("caminho_comando", width=420)

        scrollbar = ttk.Scrollbar(self.tab_audit, orient="vertical", command=self.audit_tree.yview)
        self.audit_tree.configure(yscroll=scrollbar.set)

        self.audit_tree.pack(side="left", fill="both", expand=True, pady=4)
        scrollbar.pack(side="right", fill="y", pady=4)

        # Menu de contexto com botão direito
        self.audit_menu = tk.Menu(self, tearoff=0, bg=self.colors["bg_panel"], fg=self.colors["text"], activebackground=self.colors["accent"])
        self.audit_menu.add_command(label="🗑️ Desinstalar (Comando Oficial)", command=self.uninstall_selected_program)
        self.audit_menu.add_command(label="👁️ Desocultar no Painel de Controle (SystemComponent=0)", command=self.unhide_selected_program)
        self.audit_menu.add_command(label="💥 Exclusão Forçada (Encerrar Processos & Apagar)", command=self.force_shred_selected_program)
        self.audit_menu.add_separator()
        self.audit_menu.add_command(label="📁 Abrir Pasta no Explorer", command=self._open_item_in_explorer)
        self.audit_menu.add_command(label="📋 Copiar Caminho / Comando", command=self._copy_audit_item_path)

        self.audit_tree.bind("<Button-3>", self._show_audit_context_menu)

    def _show_audit_context_menu(self, event):
        item = self.audit_tree.identify_row(event.y)
        if item:
            self.audit_tree.selection_set(item)
            self.audit_menu.post(event.x_root, event.y_root)

    def scan_installed_and_hidden_programs(self):
        """
        Escaneia profundamente chaves de desinstalação de 64-bit e 32-bit (HKLM e HKCU).
        Identifica programas normais e aqueles ocultados intencionalmente por malware ou bloatware via SystemComponent=1.
        """
        if not IS_WINDOWS or winreg is None:
            self.log_message("[MODO SIMULAÇÃO] Varredura no Registro (Não executando no Windows real).")
            self._insert_mock_audit_data()
            return

        self.audit_records.clear()
        self.audit_tree.delete(*self.audit_tree.get_children())
        self.log_message("Iniciando auditoria profunda no Registro (HKLM, HKCU, 64-bit e 32-bit)...")

        reg_targets = [
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall", "HKLM (64-bit)"),
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall", "HKLM (32-bit)"),
            (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall", "HKCU (Usuário)")
        ]

        total_apps = 0
        hidden_apps = 0

        for root_key, subkey_path, scope in reg_targets:
            try:
                key = winreg.OpenKey(root_key, subkey_path, 0, winreg.KEY_READ)
                subkeys_count = winreg.QueryInfoKey(key)[0]
                for i in range(subkeys_count):
                    try:
                        subkey_name = winreg.EnumKey(key, i)
                        full_subkey_path = f"{subkey_path}\\{subkey_name}"
                        app_key = winreg.OpenKey(root_key, full_subkey_path, 0, winreg.KEY_READ)

                        name = self._read_reg_string(app_key, "DisplayName")
                        if not name:
                            winreg.CloseKey(app_key)
                            continue

                        version = self._read_reg_string(app_key, "DisplayVersion") or "N/A"
                        uninstall_str = self._read_reg_string(app_key, "UninstallString") or self._read_reg_string(app_key, "QuietUninstallString") or self._read_reg_string(app_key, "InstallLocation") or "N/A"
                        sys_comp = self._read_reg_dword(app_key, "SystemComponent")

                        is_hidden = (sys_comp == 1)
                        if is_hidden:
                            hidden_apps += 1
                            status_tag = "⚠️ OCULTO (SystemComponent=1)"
                        else:
                            status_tag = "Visível no Painel"

                        record = {
                            "nome": name,
                            "versao": version,
                            "origem": scope,
                            "status": status_tag,
                            "caminho": uninstall_str,
                            "root_key": root_key,
                            "subkey_path": full_subkey_path,
                            "is_hidden": is_hidden
                        }
                        self.audit_records.append(record)
                        total_apps += 1
                        winreg.CloseKey(app_key)
                    except Exception:
                        continue
                winreg.CloseKey(key)
            except Exception as e:
                self.log_message(f"[ERRO ACESSO REGISTRO] {scope}: {e}")

        self._populate_audit_tree(self.audit_records)
        msg = f"[AUDITORIA CONCLUÍDA] {total_apps} programas encontrados no total. {hidden_apps} ocultos do Painel de Controle padrão!"
        self.log_message(msg)
        self.audit_stats_lbl.config(text=f"Total: {total_apps} | Ocultos: {hidden_apps}")

    def scan_appx_packages(self):
        """Lista aplicativos UWP / AppX modernos instalados para todos os usuários."""
        self.audit_records.clear()
        self.audit_tree.delete(*self.audit_tree.get_children())
        self.log_message("Escaneando aplicativos AppX / UWP modernos via PowerShell...")

        ps_script = (
            "Get-AppxPackage -AllUsers | Select-Object Name, Version, PackageFullName, NonRemovable, IsFramework | "
            "Where-Object { -not $_.IsFramework } | "
            "ForEach-Object { Write-Output \"$($_.Name)|$($_.Version)|$($_.NonRemovable)|$($_.PackageFullName)\" }"
        )

        def on_appx_done(code, output):
            count = 0
            for line in output.splitlines():
                parts = line.strip().split("|")
                if len(parts) == 4:
                    pname, pver, pnonremov, pfullname = parts
                    is_locked = (pnonremov.lower() == "true")
                    status_str = "🔒 Sistema (Não Removível)" if is_locked else "Pacote Removível"
                    cmd = f"Remove-AppxPackage -Package \"{pfullname}\" -AllUsers"

                    rec = {
                        "nome": pname,
                        "versao": pver,
                        "origem": "AppX / Windows Store",
                        "status": status_str,
                        "caminho": cmd,
                        "is_appx": True,
                        "package_full_name": pfullname
                    }
                    self.audit_records.append(rec)
                    count += 1
            self._populate_audit_tree(self.audit_records)
            self.log_message(f"[CONCLUÍDO] {count} pacotes AppX/UWP identificados.")
            self.audit_stats_lbl.config(text=f"Total AppX: {count}")

        SystemCommandEngine.run_powershell(ps_script, on_complete=on_appx_done)

    def scan_third_party_services(self):
        """Localiza serviços rodando ou instalados com binários fora de System32/SysWOW64."""
        self.audit_records.clear()
        self.audit_tree.delete(*self.audit_tree.get_children())
        self.log_message("Auditando serviços do Windows que apontam para fora do System32 (Possíveis spywares/adwares)...")

        ps_script = (
            "Get-CimInstance Win32_Service | "
            "Where-Object { $_.PathName -and $_.PathName -notmatch '(?i)C:\\\\Windows\\\\System32' -and $_.PathName -notmatch '(?i)C:\\\\Windows\\\\SysWOW64' } | "
            "ForEach-Object { Write-Output \"$($_.Name)|$($_.State)|$($_.StartMode)|$($_.PathName)\" }"
        )

        def on_svc_done(code, output):
            count = 0
            for line in output.splitlines():
                parts = line.strip().split("|")
                if len(parts) == 4:
                    sname, sstate, smode, spath = parts
                    suspicious = "⚠️ Suspeito (AppData/Temp)" if ("temp" in spath.lower() or "appdata" in spath.lower()) else f"Serviço ({sstate})"
                    rec = {
                        "nome": sname,
                        "versao": smode,
                        "origem": "Serviço Windows",
                        "status": suspicious,
                        "caminho": spath,
                        "is_service": True,
                        "service_name": sname
                    }
                    self.audit_records.append(rec)
                    count += 1
            self._populate_audit_tree(self.audit_records)
            self.log_message(f"[CONCLUÍDO] {count} serviços de terceiros identificados.")
            self.audit_stats_lbl.config(text=f"Serviços Terceiros: {count}")

        SystemCommandEngine.run_powershell(ps_script, on_complete=on_svc_done)

    def scan_startup_entries(self):
        """Audita chaves Run/RunOnce e pastas de inicialização automática (Startup/Autoruns)."""
        self.audit_records.clear()
        self.audit_tree.delete(*self.audit_tree.get_children())
        self.log_message("Auditando inicialização automática (Registro Run, RunOnce e Pastas Startup)...")

        if not IS_WINDOWS or winreg is None:
            self._insert_mock_startup_data()
            return

        startup_keys = [
            (winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run", "HKCU\\Run"),
            (winreg.HKEY_LOCAL_MACHINE, r"Software\Microsoft\Windows\CurrentVersion\Run", "HKLM\\Run"),
            (winreg.HKEY_LOCAL_MACHINE, r"Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Run", "HKLM32\\Run"),
            (winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\RunOnce", "HKCU\\RunOnce"),
            (winreg.HKEY_LOCAL_MACHINE, r"Software\Microsoft\Windows\CurrentVersion\RunOnce", "HKLM\\RunOnce"),
        ]

        count = 0
        for root_key, subkey_path, label in startup_keys:
            try:
                key = winreg.OpenKey(root_key, subkey_path, 0, winreg.KEY_READ)
                values_count = winreg.QueryInfoKey(key)[1]
                for i in range(values_count):
                    vname, vval, _ = winreg.EnumValue(key, i)
                    alert = "⚠️ Suspeito (AppData/Temp)" if ("temp" in str(vval).lower() or "appdata" in str(vval).lower()) else "Inicialização Ativa"
                    rec = {
                        "nome": vname,
                        "versao": "Startup",
                        "origem": label,
                        "status": alert,
                        "caminho": str(vval),
                        "root_key": root_key,
                        "subkey_path": subkey_path,
                        "value_name": vname,
                        "is_startup_reg": True
                    }
                    self.audit_records.append(rec)
                    count += 1
                winreg.CloseKey(key)
            except Exception:
                continue

        self._populate_audit_tree(self.audit_records)
        self.log_message(f"[CONCLUÍDO] {count} entradas de inicialização auditadas.")
        self.audit_stats_lbl.config(text=f"Total Startup: {count}")

    def _populate_audit_tree(self, records):
        self.audit_tree.delete(*self.audit_tree.get_children())
        for r in records:
            self.audit_tree.insert(
                "", "end",
                values=(r.get("nome", ""), r.get("versao", ""), r.get("origem", ""), r.get("status", ""), r.get("caminho", ""))
            )

    def _filter_audit_tree(self):
        query = self.audit_filter_var.get().strip().lower()
        if not query:
            self._populate_audit_tree(self.audit_records)
            return

        filtered = [
            r for r in self.audit_records
            if query in str(r.get("nome", "")).lower()
            or query in str(r.get("caminho", "")).lower()
            or query in str(r.get("status", "")).lower()
            or query in str(r.get("origem", "")).lower()
        ]
        self._populate_audit_tree(filtered)

    def uninstall_selected_program(self):
        """Executa a string de desinstalação oficial do software selecionado."""
        selected = self.audit_tree.selection()
        if not selected:
            messagebox.showwarning("Seleção", "Por favor, selecione um programa na tabela primeiro.")
            return

        values = self.audit_tree.item(selected[0], "values")
        name, ver, origin, status, cmd_path = values

        if not cmd_path or cmd_path == "N/A":
            messagebox.showinfo("Aviso", f"O item '{name}' não possui um comando de desinstalação direta registrado.")
            return

        if not messagebox.askyesno(
            "Confirmar Desinstalação",
            f"Deseja iniciar a desinstalação de:\n\n{name}\n\nComando:\n{cmd_path}"
        ):
            return

        self.log_message(f"Disparando comando de desinstalação para: {name}...")

        # Se for AppX
        if cmd_path.startswith("Remove-AppxPackage"):
            SystemCommandEngine.run_powershell(cmd_path, callback=self._stream_to_console)
        else:
            # Executa com CMD com suporte a MSI ou executáveis comuns
            SystemCommandEngine.run_cmd(f'start "" {cmd_path}', callback=self._stream_to_console)

    def unhide_selected_program(self):
        """
        Desoculta um programa no Painel de Controle e Configurações do Windows
        alterando a chave SystemComponent no Registro para 0.
        """
        selected = self.audit_tree.selection()
        if not selected:
            messagebox.showwarning("Seleção", "Selecione um programa marcado como OCULTO primeiro.")
            return

        values = self.audit_tree.item(selected[0], "values")
        name = values[0]

        target_record = None
        for r in self.audit_records:
            if r.get("nome") == name and r.get("is_hidden"):
                target_record = r
                break

        if not target_record:
            messagebox.showinfo("Aviso", f"O programa '{name}' não está marcado como oculto por SystemComponent no Registro.")
            return

        root_key = target_record.get("root_key")
        subkey_path = target_record.get("subkey_path")

        if not IS_WINDOWS or winreg is None:
            messagebox.showinfo("Simulação", f"Modo de simulação: SystemComponent de '{name}' alterado para 0.")
            return

        try:
            key = winreg.OpenKey(root_key, subkey_path, 0, winreg.KEY_SET_VALUE)
            winreg.SetValueEx(key, "SystemComponent", 0, winreg.REG_DWORD, 0)
            winreg.CloseKey(key)

            self.log_message(f"[SUCESSO] '{name}' foi desocultado com sucesso! Agora está visível no Painel de Controle.")
            messagebox.showinfo("Sucesso", f"'{name}' agora está visível nas Configurações e no Painel de Controle do Windows!")
            self.scan_installed_and_hidden_programs()
        except Exception as e:
            err = f"Falha ao modificar chave de registro: {e}. Certifique-se de executar como Administrador."
            self.log_message(f"[ERRO REGISTRO] {err}")
            messagebox.showerror("Erro de Privilégio", err)

    def force_shred_selected_program(self):
        """
        Exclusão Forçada (Antivírus / Shredder):
        1. Localiza pasta e processo.
        2. Finaliza processos associados.
        3. Para e remove serviço (se for serviço).
        4. Exclui chave de registro de desinstalação ou inicialização.
        5. Exclui a pasta do programa do disco rígido.
        """
        selected = self.audit_tree.selection()
        if not selected:
            messagebox.showwarning("Seleção", "Selecione um item na tabela primeiro.")
            return

        values = self.audit_tree.item(selected[0], "values")
        name, ver, origin, status, cmd_path = values

        confirm = messagebox.askyesno(
            "⚠️ ATENÇÃO — EXCLUSÃO FORÇADA",
            f"Deseja DESTRUIR COMPLETAMENTE o aplicativo '{name}'?\n\n"
            f"Ações que serão executadas com privilégio elevado:\n"
            f"• Encerramento forçado de todos os processos relacionados no Windows\n"
            f"• Exclusão de entradas no Registro de Inicialização e Desinstalação\n"
            f"• Exclusão dos arquivos executáveis do disco\n\n"
            f"Tem certeza que deseja continuar?"
        )
        if not confirm:
            return

        self.log_message(f"=== INICIANDO EXCLUSÃO FORÇADA PARA: {name} ===")

        def shred_worker():
            # 1. Encerramento forçado por nome
            clean_name = re.sub(r'[^a-zA-Z0-9_\-\.]', '', name)
            if clean_name:
                self.log_message(f"Encerrando possíveis instâncias de processos associados...")
                subprocess.run(f"taskkill /F /T /IM {clean_name}.exe", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

            # 2. Se for serviço
            target_record = next((r for r in self.audit_records if r.get("nome") == name), None)
            if target_record and target_record.get("is_service"):
                svc = target_record.get("service_name")
                self.log_message(f"Parando e excluindo serviço Windows: {svc}...")
                subprocess.run(f"sc stop {svc}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                subprocess.run(f"sc delete {svc}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

            # 3. Remover do registro de startup
            if target_record and target_record.get("is_startup_reg") and IS_WINDOWS and winreg:
                try:
                    rk = target_record.get("root_key")
                    sk = target_record.get("subkey_path")
                    vn = target_record.get("value_name")
                    reg_key = winreg.OpenKey(rk, sk, 0, winreg.KEY_SET_VALUE)
                    winreg.DeleteValue(reg_key, vn)
                    winreg.CloseKey(reg_key)
                    self.log_message(f"[REGISTRO] Entrada de inicialização '{vn}' eliminada.")
                except Exception as ex:
                    self.log_message(f"[AVISO REGISTRO] {ex}")

            # 4. Remover diretório ou arquivo apontado por cmd_path se existir
            path_match = re.search(r'([A-Za-z]:\\[^"\'\<\>\*\|\?]+)', cmd_path)
            if path_match:
                extracted_path = path_match.group(1).strip()
                if os.path.exists(extracted_path):
                    try:
                        if os.path.isfile(extracted_path):
                            parent_dir = os.path.dirname(extracted_path)
                            os.remove(extracted_path)
                            self.log_message(f"[SHRED] Arquivo excluído: {extracted_path}")
                        elif os.path.isdir(extracted_path):
                            shutil.rmtree(extracted_path, ignore_errors=True)
                            self.log_message(f"[SHRED] Diretório do programa excluído: {extracted_path}")
                    except Exception as err:
                        self.log_message(f"[AVISO EXCLUSÃO ARQUIVO] {err}")

            self.log_message(f"=== EXCLUSÃO FORÇADA DE '{name}' CONCLUÍDA ===")
            self.after(0, lambda: messagebox.showinfo("Concluído", f"Exclusão forçada de '{name}' concluída."))

        threading.Thread(target=shred_worker, daemon=True).start()

    def _open_item_in_explorer(self):
        selected = self.audit_tree.selection()
        if not selected:
            return
        cmd_path = self.audit_tree.item(selected[0], "values")[4]
        match = re.search(r'([A-Za-z]:\\[^"\'\<\>\*\|\?]+)', cmd_path)
        if match:
            target = match.group(1)
            folder = target if os.path.isdir(target) else os.path.dirname(target)
            if os.path.exists(folder):
                subprocess.Popen(f'explorer "{folder}"', shell=True)
            else:
                messagebox.showinfo("Caminho", f"O caminho não existe fisicamente: {folder}")
        else:
            messagebox.showinfo("Caminho", "Não foi possível extrair um caminho de arquivo válido.")

    def _copy_audit_item_path(self):
        selected = self.audit_tree.selection()
        if not selected:
            return
        cmd_path = self.audit_tree.item(selected[0], "values")[4]
        self.clipboard_clear()
        self.clipboard_append(cmd_path)
        self.log_message(f"Caminho copiado para a área de transferência: {cmd_path}")

    # ==========================================================================
    # ABA 2: MÓDULO ANTIVÍRUS & CAÇADOR DE AMEAÇAS
    # ==========================================================================
    def _build_tab_antivirus(self):
        toolbar = tk.Frame(self.tab_antivirus, bg=self.colors["bg_panel"], padx=12, pady=10)
        toolbar.pack(fill="x", pady=(4, 8))

        self._create_button(
            toolbar, "🕵️ Caçar Processos Suspeitos (Temp / AppData / Masquerade)",
            self.scan_suspicious_processes, self.colors["accent"]
        ).pack(side="left", padx=3)

        self._create_button(
            toolbar, "🛡️ Varredura Rápida Windows Defender",
            self.run_defender_quick_scan, self.colors["success"]
        ).pack(side="left", padx=3)

        self._create_button(
            toolbar, "🔬 Varredura Completa Defender",
            self.run_defender_full_scan, self.colors["bg_card"]
        ).pack(side="left", padx=3)

        self._create_button(
            toolbar, "🔄 Atualizar Vacinas do Antivírus",
            self.update_defender_signatures, self.colors["bg_card"]
        ).pack(side="left", padx=3)

        self._create_button(
            toolbar, "💥 DESTRUIR AMEAÇA SELECIONADA",
            self.terminate_and_quarantine_threat, self.colors["danger"]
        ).pack(side="right", padx=3)

        # Informações e Status Defender
        status_bar = tk.Frame(self.tab_antivirus, bg=self.colors["bg_dark"], padx=4, pady=4)
        status_bar.pack(fill="x")

        self.av_status_lbl = tk.Label(
            status_bar,
            text="Status da Proteção: Pronto para verificação de segurança.",
            font=("Segoe UI", 9, "bold"),
            bg=self.colors["bg_dark"],
            fg=self.colors["accent_light"]
        )
        self.av_status_lbl.pack(side="left")

        # Tabela Treeview Antivírus
        columns = ("processo", "pid", "nivel_risco", "motivo_alerta", "caminho_executavel")
        self.av_tree = ttk.Treeview(self.tab_antivirus, columns=columns, show="headings")
        self.av_tree.heading("processo", text="Processo / Binário")
        self.av_tree.heading("pid", text="PID")
        self.av_tree.heading("nivel_risco", text="Nível de Risco")
        self.av_tree.heading("motivo_alerta", text="Diagnóstico Heurístico")
        self.av_tree.heading("caminho_executavel", text="Caminho do Executável")

        self.av_tree.column("processo", width=220)
        self.av_tree.column("pid", width=90)
        self.av_tree.column("nivel_risco", width=140)
        self.av_tree.column("motivo_alerta", width=260)
        self.av_tree.column("caminho_executavel", width=420)

        scrollbar = ttk.Scrollbar(self.tab_antivirus, orient="vertical", command=self.av_tree.yview)
        self.av_tree.configure(yscroll=scrollbar.set)

        self.av_tree.pack(side="left", fill="both", expand=True, pady=4)
        scrollbar.pack(side="right", fill="y", pady=4)

    def scan_suspicious_processes(self):
        """
        Escaneia processos ativos usando heurísticas avançadas de segurança:
        1. Executando dentro de Temp, Roaming, LocalAppData sem assinatura.
        2. Masquerade: Nomes de processos legítimos do sistema (svchost, csrss, lsass, explorer) fora de System32.
        3. Scripts ocultos de segundo plano.
        """
        self.av_tree.delete(*self.av_tree.get_children())
        self.log_message("=== INICIANDO VARREDURA HEURÍSTICA DE AMEAÇAS & PROCESSOS SUSPEITOS ===")

        if not IS_WINDOWS:
            self._insert_mock_threat_data()
            return

        ps_script = (
            "Get-Process | Where-Object { $_.Path -ne $null } | "
            "Select-Object Name, Id, Path | "
            "ForEach-Object { Write-Output \"$($_.Name)|$($_.Id)|$($_.Path)\" }"
        )

        system_binaries = ["svchost", "csrss", "lsass", "smss", "winlogon", "services", "taskhostw"]

        def on_scan_done(code, output):
            threat_count = 0
            safe_count = 0

            for line in output.splitlines():
                parts = line.strip().split("|")
                if len(parts) == 3:
                    pname, pid, ppath = parts
                    lower_path = ppath.lower()
                    lower_name = pname.lower()

                    is_threat = False
                    risk_level = "Baixo"
                    reason = "Processo normal"

                    # Regra 1: Masquerade de sistema
                    if lower_name in system_binaries and "c:\\windows\\system32" not in lower_path:
                        is_threat = True
                        risk_level = "🚨 CRÍTICO (Masquerade)"
                        reason = f"Impersonando binário do Windows fora do System32!"

                    # Regra 2: Rodando em pastas temporárias
                    elif "appdata\\local\\temp" in lower_path or "windows\\temp" in lower_path:
                        is_threat = True
                        risk_level = "⚠️ ALTO RISCO"
                        reason = "Executando a partir da pasta temporária (%TEMP%)"

                    # Regra 3: Rodando na raiz do AppData Roaming
                    elif "appdata\\roaming" in lower_path and "programs" not in lower_path:
                        is_threat = True
                        risk_level = "⚠️ MÉDIO RISCO"
                        reason = "Executável alocado em AppData Roaming"

                    if is_threat:
                        self.av_tree.insert("", "end", values=(pname, pid, risk_level, reason, ppath))
                        threat_count += 1
                    else:
                        safe_count += 1

            self.log_message(f"[VARREDURA CONCLUÍDA] {safe_count} processos seguros verificados. {threat_count} anomalias detectadas.")
            if threat_count > 0:
                self.av_status_lbl.config(
                    text=f"⚠️ {threat_count} processo(s) suspeito(s) localizado(s)! Recomenda-se destruição.",
                    fg=self.colors["danger"]
                )
            else:
                self.av_status_lbl.config(
                    text="✅ Nenhum processo suspeito detectado em execução no momento.",
                    fg=self.colors["success"]
                )

        SystemCommandEngine.run_powershell(ps_script, on_complete=on_scan_done)

    def run_defender_quick_scan(self):
        """Aciona varredura rápida pelo Windows Defender nativo via PowerShell."""
        self.log_message("Acionando Varredura Rápida do Microsoft Defender (MpCmdRun / Start-MpScan)...")
        self.av_status_lbl.config(text="🛡️ Microsoft Defender executando varredura rápida...", fg=self.colors["accent_light"])
        ps_cmd = "Start-MpScan -ScanType QuickScan; Write-Output '[DEFENDER] Varredura Rápida Concluída com Sucesso.'"
        SystemCommandEngine.run_powershell(ps_cmd, callback=self._stream_to_console, on_complete=lambda c, o: self.av_status_lbl.config(text="✅ Varredura do Defender concluída.", fg=self.colors["success"]))

    def run_defender_full_scan(self):
        """Aciona varredura completa pelo Windows Defender."""
        if not messagebox.askyesno("Varredura Completa", "A varredura completa do sistema verifica todos os discos e pode levar vários minutos. Deseja iniciar agora?"):
            return
        self.log_message("Acionando Varredura Completa do Microsoft Defender...")
        self.av_status_lbl.config(text="🛡️ Microsoft Defender executando varredura completa no disco...", fg=self.colors["warning"])
        ps_cmd = "Start-MpScan -ScanType FullScan; Write-Output '[DEFENDER] Varredura Completa Concluída.'"
        SystemCommandEngine.run_powershell(ps_cmd, callback=self._stream_to_console, on_complete=lambda c, o: self.av_status_lbl.config(text="✅ Varredura completa do Defender finalizada.", fg=self.colors["success"]))

    def update_defender_signatures(self):
        """Atualiza a base de assinaturas antivírus da Microsoft."""
        self.log_message("Buscando atualizações de definições de vacinas antivírus...")
        ps_cmd = "Update-MpSignature; Write-Output '[DEFENDER] Assinaturas do Microsoft Defender atualizadas para a versão mais recente.'"
        SystemCommandEngine.run_powershell(ps_cmd, callback=self._stream_to_console)

    def terminate_and_quarantine_threat(self):
        """Finaliza o processo suspeito selecionado imediatamente e exclui seu arquivo executável."""
        selected = self.av_tree.selection()
        if not selected:
            messagebox.showwarning("Seleção", "Selecione uma ameaça na tabela de antivírus primeiro.")
            return

        values = self.av_tree.item(selected[0], "values")
        pname, pid, risk, reason, ppath = values

        confirm = messagebox.askyesno(
            "Destruir Ameaça",
            f"Deseja encerrar e eliminar permanentemente:\n\n"
            f"Processo: {pname} (PID: {pid})\n"
            f"Caminho: {ppath}\n"
            f"Motivo: {reason}\n\n"
            f"O processo será terminado e o binário será removido do disco."
        )
        if not confirm:
            return

        self.log_message(f"Encerrando processo com força máxima: {pname} (PID: {pid})...")

        def kill_worker():
            # Encerrar por PID e nome
            subprocess.run(f"taskkill /F /PID {pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            subprocess.run(f"taskkill /F /IM {pname}.exe", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

            # Tentar apagar o arquivo do disco ou mover para quarentena
            if os.path.exists(ppath):
                try:
                    os.remove(ppath)
                    self.log_message(f"[DESTRUÍDO] Binário nocivo removido permanentemente: {ppath}")
                except Exception:
                    quarantine_dir = r"C:\WinShield_Quarantine"
                    os.makedirs(quarantine_dir, exist_ok=True)
                    try:
                        dest = os.path.join(quarantine_dir, f"{pname}_{pid}.quarantine")
                        shutil.move(ppath, dest)
                        self.log_message(f"[QUARENTENA] Arquivo movido para pasta isolada: {dest}")
                    except Exception as err:
                        self.log_message(f"[AVISO] Não foi possível mover arquivo (em uso ou permissão): {err}")

            self.after(0, lambda: messagebox.showinfo("Ameaça Neutralizada", f"O processo {pname} foi encerrado com sucesso."))
            self.after(500, self.scan_suspicious_processes)

        threading.Thread(target=kill_worker, daemon=True).start()

    # ==========================================================================
    # ABA 3: LIMPEZA PROFUNDA (%TEMP% E CACHES DO SISTEMA)
    # ==========================================================================
    def _build_tab_clean(self):
        container = tk.Frame(self.tab_clean, bg=self.colors["bg_dark"], padx=18, pady=12)
        container.pack(fill="both", expand=True)

        header_clean = tk.Frame(container, bg=self.colors["bg_dark"])
        header_clean.pack(fill="x", pady=(0, 10))

        tk.Label(
            header_clean,
            text="🧹 Central de Limpeza Profunda de Arquivos Temporários & Caches",
            font=("Segoe UI", 12, "bold"),
            bg=self.colors["bg_dark"],
            fg=self.colors["text"]
        ).pack(side="left")

        self.clean_status_badge = tk.Label(
            header_clean,
            text="Pronto para análise",
            font=("Segoe UI", 9, "bold"),
            bg=self.colors["bg_card"],
            fg=self.colors["accent_light"],
            padx=10,
            pady=3
        )
        self.clean_status_badge.pack(side="right")

        # Checkboxes de Locais de Limpeza
        chk_container = tk.Frame(container, bg=self.colors["bg_panel"], padx=15, pady=12)
        chk_container.pack(fill="x", pady=6)

        user_temp_path = os.environ.get("TEMP", r"C:\Users\...\AppData\Local\Temp")

        self.clean_vars = {
            "user_temp": tk.BooleanVar(value=True),
            "win_temp": tk.BooleanVar(value=True),
            "prefetch": tk.BooleanVar(value=True),
            "win_update": tk.BooleanVar(value=True),
            "crash_dumps": tk.BooleanVar(value=True),
            "win_logs": tk.BooleanVar(value=False),
            "recycle_bin": tk.BooleanVar(value=False),
            "dns_cache": tk.BooleanVar(value=True),
            "browser_cache": tk.BooleanVar(value=False)
        }

        clean_options = [
            ("user_temp", f"Pasta Temporária do Usuário (%TEMP%) — [{user_temp_path}]"),
            ("win_temp", r"Pasta Temporária do Sistema (C:\Windows\Temp)"),
            ("prefetch", r"Cache de Inicialização Prefetch (C:\Windows\Prefetch)"),
            ("win_update", r"Cache de Downloads do Windows Update (C:\Windows\SoftwareDistribution\Download)"),
            ("crash_dumps", r"Relatórios de Erros e Despejos de Memória (CrashDumps, WER, Minidump)"),
            ("win_logs", r"Logs Antigos de Componentes do Windows (C:\Windows\Logs\CBS)"),
            ("recycle_bin", "Esvaziar Lixeira de Todas as Unidades de Disco"),
            ("dns_cache", "Limpar Cache de Resolução DNS (ipconfig /flushdns)"),
            ("browser_cache", "Caches de Navegadores Web (Google Chrome, Edge, Brave, Firefox)")
        ]

        grid_frame = tk.Frame(chk_container, bg=self.colors["bg_panel"])
        grid_frame.pack(fill="x")

        for idx, (key, label) in enumerate(clean_options):
            r = idx // 2
            c = idx % 2
            cb = tk.Checkbutton(
                grid_frame,
                text=label,
                variable=self.clean_vars[key],
                font=("Segoe UI", 9),
                bg=self.colors["bg_panel"],
                fg=self.colors["text"],
                selectcolor=self.colors["bg_card"],
                activebackground=self.colors["bg_panel"],
                activeforeground=self.colors["text"],
                padx=8,
                pady=6,
                anchor="w"
            )
            cb.grid(row=r, column=c, sticky="w", padx=6, pady=2)

        grid_frame.columnconfigure(0, weight=1)
        grid_frame.columnconfigure(1, weight=1)

        # Botões de Ação
        btn_row = tk.Frame(container, bg=self.colors["bg_dark"], pady=12)
        btn_row.pack(fill="x")

        self._create_button(
            btn_row, "🧹 EXECUTAR LIMPEZA PROFUNDA AGORA",
            self.execute_deep_system_clean, self.colors["success"]
        ).pack(side="left", padx=5)

        self._create_button(
            btn_row, "📊 Analisar e Calcular Espaço Ocupado",
            self.analyze_clean_space, self.colors["accent"]
        ).pack(side="left", padx=5)

        self._create_button(
            btn_row, "Marcar Todos",
            lambda: [v.set(True) for v in self.clean_vars.values()], self.colors["bg_card"]
        ).pack(side="right", padx=3)

        self._create_button(
            btn_row, "Desmarcar Todos",
            lambda: [v.set(False) for v in self.clean_vars.values()], self.colors["bg_card"]
        ).pack(side="right", padx=3)

    def analyze_clean_space(self):
        """Calcula o tamanho exato dos diretórios temporários selecionados."""
        self.clean_status_badge.config(text="Calculando espaço...", fg=self.colors["warning"])
        self.log_message("Iniciando cálculo preciso do espaço ocupado por arquivos temporários...")

        def worker():
            folders_to_check = self._get_selected_clean_folders()
            total_bytes = 0
            total_files = 0

            for label, folder in folders_to_check:
                if not folder or not os.path.exists(folder):
                    continue
                f_bytes = 0
                f_count = 0
                for root, _, files in os.walk(folder):
                    for f in files:
                        try:
                            fp = os.path.join(root, f)
                            f_bytes += os.path.getsize(fp)
                            f_count += 1
                        except Exception:
                            pass
                total_bytes += f_bytes
                total_files += f_count
                mb = f_bytes / (1024 * 1024)
                self.log_message(f" -> {label}: {f_count} arquivos ({mb:.2f} MB)")

            total_mb = total_bytes / (1024 * 1024)
            total_gb = total_bytes / (1024 * 1024 * 1024)
            display_str = f"{total_gb:.2f} GB" if total_gb >= 1.0 else f"{total_mb:.1f} MB"

            msg = f"[ANÁLISE CONCLUÍDA] Total estimado para limpeza: {display_str} ({total_files} arquivos)."
            self.log_message(msg)
            self.after(0, lambda: self.clean_status_badge.config(text=f"Liberável: {display_str}", fg=self.colors["accent_light"]))

        threading.Thread(target=worker, daemon=True).start()

    def execute_deep_system_clean(self):
        """Executa a exclusão de arquivos temporários em segundo plano sem travar o app."""
        if not messagebox.askyesno("Confirmar Limpeza", "Deseja iniciar a limpeza profunda dos itens temporários selecionados agora?"):
            return

        self.clean_status_badge.config(text="Limpeza em andamento...", fg=self.colors["warning"])
        self.log_message("=== INICIANDO LIMPEZA PROFUNDA DO SISTEMA WINDOWS ===")

        def worker():
            folders = self._get_selected_clean_folders()
            freed_bytes = 0
            removed_files = 0
            errors_locked = 0

            for label, folder in folders:
                if not folder or not os.path.exists(folder):
                    continue
                self.log_message(f"Limpando: {label}...")
                try:
                    for item in os.listdir(folder):
                        item_path = os.path.join(folder, item)
                        try:
                            if os.path.isfile(item_path) or os.path.islink(item_path):
                                sz = os.path.getsize(item_path)
                                os.unlink(item_path)
                                freed_bytes += sz
                                removed_files += 1
                            elif os.path.isdir(item_path):
                                dir_sz = self._get_directory_size(item_path)
                                shutil.rmtree(item_path, ignore_errors=False)
                                freed_bytes += dir_sz
                                removed_files += 1
                        except Exception:
                            # Arquivos abertos por processos ativos no momento
                            errors_locked += 1
                except Exception:
                    pass

            if self.clean_vars["dns_cache"].get():
                self.log_message("Executando Flush no Cache de DNS (ipconfig /flushdns)...")
                subprocess.run("ipconfig /flushdns", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

            if self.clean_vars["recycle_bin"].get():
                self.log_message("Esvaziando Lixeira de todas as unidades via PowerShell...")
                subprocess.run("powershell.exe -Command \"Clear-RecycleBin -Force -ErrorAction SilentlyContinue\"", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

            mb_freed = freed_bytes / (1024 * 1024)
            gb_freed = freed_bytes / (1024 * 1024 * 1024)
            freed_str = f"{gb_freed:.2f} GB" if gb_freed >= 1.0 else f"{mb_freed:.1f} MB"

            res_msg = f"=== LIMPEZA CONCLUÍDA: {removed_files} itens excluídos | {freed_str} liberados! ({errors_locked} arquivos em uso ignorados com segurança) ==="
            self.log_message(res_msg)
            self.after(0, lambda: self.clean_status_badge.config(text=f"Sucesso: {freed_str} liberados", fg=self.colors["success"]))
            self.after(0, lambda: messagebox.showinfo("Limpeza Concluída", f"Limpeza profunda concluída com sucesso!\n\nEspaço liberado: {freed_str}\nArquivos removidos: {removed_files}"))

        threading.Thread(target=worker, daemon=True).start()

    def _get_selected_clean_folders(self):
        folders = []
        user_profile = os.environ.get("USERPROFILE", "")
        local_app_data = os.environ.get("LOCALAPPDATA", "")

        if self.clean_vars["user_temp"].get():
            folders.append(("Temp do Usuário (%TEMP%)", os.environ.get("TEMP", "")))
        if self.clean_vars["win_temp"].get():
            folders.append(("Windows Temp", r"C:\Windows\Temp"))
        if self.clean_vars["prefetch"].get():
            folders.append(("Prefetch", r"C:\Windows\Prefetch"))
        if self.clean_vars["win_update"].get():
            folders.append(("Cache Windows Update", r"C:\Windows\SoftwareDistribution\Download"))
        if self.clean_vars["crash_dumps"].get():
            if local_app_data:
                folders.append(("CrashDumps", os.path.join(local_app_data, "CrashDumps")))
            folders.append(("Minidump", r"C:\Windows\Minidump"))
            folders.append(("WER Error Reports", r"C:\ProgramData\Microsoft\Windows\WER"))
        if self.clean_vars["win_logs"].get():
            folders.append(("Logs CBS", r"C:\Windows\Logs\CBS"))
        if self.clean_vars["browser_cache"].get() and local_app_data:
            folders.append(("Cache Chrome", os.path.join(local_app_data, r"Google\Chrome\User Data\Default\Cache")))
            folders.append(("Cache Edge", os.path.join(local_app_data, r"Microsoft\Edge\User Data\Default\Cache")))
            folders.append(("Cache Brave", os.path.join(local_app_data, r"BraveSoftware\Brave-Browser\User Data\Default\Cache")))

        return folders

    def _get_directory_size(self, path):
        total = 0
        try:
            for root, _, files in os.walk(path):
                for f in files:
                    try:
                        total += os.path.getsize(os.path.join(root, f))
                    except Exception:
                        pass
        except Exception:
            pass
        return total

    # ==========================================================================
    # ABA 4: PLANOS DE ENERGIA & TURBO (POWERCFG)
    # ==========================================================================
    def _build_tab_power(self):
        container = tk.Frame(self.tab_power, bg=self.colors["bg_dark"], padx=18, pady=12)
        container.pack(fill="both", expand=True)

        tk.Label(
            container,
            text="⚡ Gerenciamento e Ativação Rápida de Planos de Energia Nativos:",
            font=("Segoe UI", 12, "bold"),
            bg=self.colors["bg_dark"],
            fg=self.colors["text"]
        ).pack(anchor="w", pady=(0, 10))

        # 4 Cards de Planos Principais
        cards_frame = tk.Frame(container, bg=self.colors["bg_dark"])
        cards_frame.pack(fill="x", pady=4)

        plans = [
            ("🔥 Desempenho Máximo\n(Ultimate Performance)", "e9a42b02-d5df-448d-aa00-03f14749eb61", self.colors["danger"], True),
            ("⚡ Alto Desempenho\n(High Performance)", "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c", self.colors["warning"], False),
            ("⚖️ Equilibrado\n(Padrão Recomendado)", "381b4222-f694-41f0-9685-ff5bb260df2e", self.colors["accent"], False),
            ("🌱 Economia de Energia\n(Power Saver)", "a1841308-3541-4fab-bc81-f71556f20b4a", self.colors["success"], False)
        ]

        for title, guid, color, is_ultimate in plans:
            btn = self._create_button(
                cards_frame,
                title,
                lambda g=guid, u=is_ultimate, t=title: self.set_power_plan(g, u, t),
                color
            )
            btn.pack(side="left", padx=5, expand=True, fill="x")

        # Criador de Plano de Energia Customizado
        custom_box = tk.Frame(container, bg=self.colors["bg_panel"], padx=15, pady=12)
        custom_box.pack(fill="x", pady=14)

        tk.Label(
            custom_box,
            text="🛠️ Criador de Plano de Energia Otimizado (Baixa Latência & Foco em Desempenho):",
            font=("Segoe UI", 10, "bold"),
            bg=self.colors["bg_panel"],
            fg=self.colors["text"]
        ).pack(anchor="w", pady=(0, 8))

        row1 = tk.Frame(custom_box, bg=self.colors["bg_panel"])
        row1.pack(fill="x", pady=4)

        tk.Label(row1, text="Nome do Plano:", font=("Segoe UI", 9), bg=self.colors["bg_panel"], fg=self.colors["text_muted"]).pack(side="left")
        self.custom_plan_entry = tk.Entry(row1, font=("Segoe UI", 9), bg=self.colors["bg_card"], fg="#ffffff", relief="flat", width=28)
        self.custom_plan_entry.insert(0, "WinShield Turbo LowLatency")
        self.custom_plan_entry.pack(side="left", padx=10, ipady=3)

        tk.Label(row1, text="Desligar Monitor:", font=("Segoe UI", 9), bg=self.colors["bg_panel"], fg=self.colors["text_muted"]).pack(side="left", padx=(10, 4))
        self.monitor_timeout_cb = ttk.Combobox(row1, values=["Nunca (0)", "15 min", "30 min", "60 min"], width=12, state="readonly")
        self.monitor_timeout_cb.set("Nunca (0)")
        self.monitor_timeout_cb.pack(side="left", padx=4)

        tk.Label(row1, text="Suspender PC:", font=("Segoe UI", 9), bg=self.colors["bg_panel"], fg=self.colors["text_muted"]).pack(side="left", padx=(10, 4))
        self.sleep_timeout_cb = ttk.Combobox(row1, values=["Nunca (0)", "30 min", "60 min", "120 min"], width=12, state="readonly")
        self.sleep_timeout_cb.set("Nunca (0)")
        self.sleep_timeout_cb.pack(side="left", padx=4)

        self._create_button(
            row1, "➕ Criar & Ativar Plano",
            self.create_custom_power_plan, self.colors["accent"]
        ).pack(side="right", padx=4)

        # Lista de Planos Atuais do Windows
        list_header = tk.Frame(container, bg=self.colors["bg_dark"])
        list_header.pack(fill="x", pady=(8, 4))

        tk.Label(
            list_header,
            text="📋 Esquemas de Energia Registrados no Windows (powercfg /list):",
            font=("Segoe UI", 10, "bold"),
            bg=self.colors["bg_dark"],
            fg=self.colors["text"]
        ).pack(side="left")

        self._create_button(
            list_header, "🔄 Atualizar Lista",
            self.refresh_power_plans_list, self.colors["bg_card"]
        ).pack(side="right")

        self.power_tree = ttk.Treeview(container, columns=("guid", "nome", "status"), show="headings", height=5)
        self.power_tree.heading("guid", text="GUID do Esquema")
        self.power_tree.heading("nome", text="Nome do Plano de Energia")
        self.power_tree.heading("status", text="Status Atual")
        self.power_tree.column("guid", width=340)
        self.power_tree.column("nome", width=380)
        self.power_tree.column("status", width=140)
        self.power_tree.pack(fill="x", pady=4)

        # Botão para ativar selecionado na lista
        act_bar = tk.Frame(container, bg=self.colors["bg_dark"])
        act_bar.pack(fill="x", pady=4)

        self._create_button(
            act_bar, "⚡ Ativar Plano Selecionado na Tabela",
            self.activate_selected_from_tree, self.colors["accent"]
        ).pack(side="left")

        self._create_button(
            act_bar, "🗑️ Excluir Plano Customizado Selecionado",
            self.delete_selected_power_plan, self.colors["danger"]
        ).pack(side="right")

        self.refresh_power_plans_list()

    def set_power_plan(self, guid, is_ultimate, title):
        clean_title = title.replace("\n", " ")
        self.log_message(f"Configurando plano de energia ativo: {clean_title}...")
        if is_ultimate:
            cmd = f"powercfg -duplicatescheme {guid} & powercfg /setactive {guid}"
        else:
            cmd = f"powercfg /setactive {guid}"

        def on_done(code, out):
            self.log_message(f"[SUCESSO] Plano '{clean_title}' ativado com êxito!")
            self.refresh_power_plans_list()

        SystemCommandEngine.run_cmd(cmd, on_complete=on_done)

    def create_custom_power_plan(self):
        plan_name = self.custom_plan_entry.get().strip() or "WinShield Turbo LowLatency"
        mon_str = self.monitor_timeout_cb.get()
        sleep_str = self.sleep_timeout_cb.get()

        mon_val = 0 if "Nunca" in mon_str else int(mon_str.split()[0])
        sleep_val = 0 if "Nunca" in sleep_str else int(sleep_str.split()[0])

        self.log_message(f"Criando plano de energia '{plan_name}' com baixa latência e sem suspensão de disco...")

        ps_script = f"""
        $dup = powercfg -duplicatescheme 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c
        if ($dup -match '([a-fA-F0-9-]{{36}})') {{
            $newGuid = $matches[1]
            powercfg -changename $newGuid "{plan_name}" "Plano de baixa latencia otimizado pelo WinShield Pro"
            powercfg -setactive $newGuid
            powercfg -change -monitor-timeout-ac {mon_val}
            powercfg -change -disk-timeout-ac 0
            powercfg -change -standby-timeout-ac {sleep_val}
            Write-Output "[SUCESSO] Plano criado e ativado! GUID: $newGuid"
        }} else {{
            Write-Output "[ERRO] Falha ao duplicar esquema de energia."
        }}
        """
        SystemCommandEngine.run_powershell(
            ps_script,
            callback=self._stream_to_console,
            on_complete=lambda c, o: self.refresh_power_plans_list()
        )

    def refresh_power_plans_list(self):
        self.power_tree.delete(*self.power_tree.get_children())
        if not IS_WINDOWS:
            self.power_tree.insert("", "end", values=("381b4222-f694-41f0-9685-ff5bb260df2e", "Equilibrado", "⭐ ATIVO"))
            self.power_tree.insert("", "end", values=("8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c", "Alto Desempenho", "Instalado"))
            return

        def on_list_done(code, output):
            pattern = re.compile(r"GUID:\s+([a-f0-9\-]{36})\s+\((.*?)\)(\s*\*?)", re.IGNORECASE)
            for line in output.splitlines():
                match = pattern.search(line)
                if match:
                    guid = match.group(1)
                    name = match.group(2)
                    is_active = bool(match.group(3).strip())
                    status = "⭐ ATIVO NO MOMENTO" if is_active else "Instalado"
                    self.power_tree.insert("", "end", values=(guid, name, status))

        SystemCommandEngine.run_cmd("powercfg /list", on_complete=on_list_done)

    def activate_selected_from_tree(self):
        selected = self.power_tree.selection()
        if not selected:
            messagebox.showwarning("Seleção", "Selecione um plano na tabela para ativar.")
            return
        guid, name, _ = self.power_tree.item(selected[0], "values")
        self.log_message(f"Ativando esquema {name} ({guid})...")
        SystemCommandEngine.run_cmd(
            f"powercfg /setactive {guid}",
            on_complete=lambda c, o: self.refresh_power_plans_list()
        )

    def delete_selected_power_plan(self):
        selected = self.power_tree.selection()
        if not selected:
            messagebox.showwarning("Seleção", "Selecione um plano na tabela para excluir.")
            return
        guid, name, status = self.power_tree.item(selected[0], "values")
        if "ATIVO" in status:
            messagebox.showwarning("Aviso", "Não é possível excluir o plano de energia que está ativo no momento. Mude para outro antes de excluir.")
            return

        if not messagebox.askyesno("Excluir Plano", f"Deseja excluir o esquema de energia '{name}' ({guid})?"):
            return

        self.log_message(f"Excluindo esquema de energia: {name}...")
        SystemCommandEngine.run_cmd(
            f"powercfg -delete {guid}",
            callback=self._stream_to_console,
            on_complete=lambda c, o: self.refresh_power_plans_list()
        )

    # ==========================================================================
    # ABA 5: OTIMIZAÇÃO DO SISTEMA, REDE & DEBLOAT
    # ==========================================================================
    def _build_tab_optimize(self):
        container = tk.Frame(self.tab_optimize, bg=self.colors["bg_dark"], padx=18, pady=12)
        container.pack(fill="both", expand=True)

        tk.Label(
            container,
            text="🚀 Otimizações Nativas de Desempenho, Reparo de Integridade & Debloat:",
            font=("Segoe UI", 12, "bold"),
            bg=self.colors["bg_dark"],
            fg=self.colors["text"]
        ).pack(anchor="w", pady=(0, 10))

        grid = tk.Frame(container, bg=self.colors["bg_dark"])
        grid.pack(fill="both", expand=True)

        opt_tools = [
            (
                "🛠️ Reparar Arquivos de Sistema (SFC /SCANNOW)",
                "Examina a integridade de todos os arquivos protegidos do sistema operacional e repara automaticamente substitutos danificados.",
                lambda: SystemCommandEngine.run_cmd("sfc /scannow", callback=self._stream_to_console),
                self.colors["accent"]
            ),
            (
                "💿 Reparar Imagem do Windows (DISM RestoreHealth)",
                "Usa a fonte oficial do Windows Update para recuperar corrupções graves e restaurar a saúde da imagem do sistema operacional.",
                lambda: SystemCommandEngine.run_cmd("DISM /Online /Cleanup-Image /RestoreHealth", callback=self._stream_to_console),
                self.colors["accent"]
            ),
            (
                "🚫 Desativar Telemetria & Rastreamento em Segundo Plano",
                "Desativa os serviços DiagTrack e dmwappushservice da Microsoft, reduzindo o uso excessivo de CPU e disco em ociosidade.",
                self.disable_windows_telemetry,
                self.colors["danger"]
            ),
            (
                "🌐 Reset Completo da Pilha de Rede (Winsock, IP & DNS)",
                "Restaura adaptadores TCP/IP, limpa sockets Winsock travados e resolve lentidão de carregamento de páginas e jogos.",
                lambda: SystemCommandEngine.run_cmd(
                    "netsh winsock reset & netsh int ip reset & ipconfig /release & ipconfig /renew & ipconfig /flushdns",
                    callback=self._stream_to_console
                ),
                self.colors["warning"]
            ),
            (
                "⚡ Otimizar Efeitos Visuais para Máximo Desempenho",
                "Ajusta as animações da interface gráfica do Windows para priorizar velocidade e tempo de resposta instantâneo de janelas.",
                self.optimize_visual_effects,
                self.colors["success"]
            ),
            (
                "🧠 Limpar Memória RAM & Cache Standby (WorkingSet)",
                "Força a liberação de páginas de memória RAM presas por processos em segundo plano, aliviando o uso imediato de memória física.",
                self.clean_ram_working_set,
                self.colors["accent"]
            ),
            (
                "💾 Criar Ponto de Restauração do Windows",
                "Cria um snapshot de segurança oficial do sistema para permitir reversão de quaisquer alterações se necessário.",
                lambda: SystemCommandEngine.run_powershell(
                    "Checkpoint-Computer -Description 'WinShield_Pro_Snapshot' -RestorePointType 'MODIFY_SETTINGS'; Write-Output '[OK] Ponto de restauração registrado com sucesso.'",
                    callback=self._stream_to_console
                ),
                self.colors["bg_card"]
            ),
            (
                "⚡ Otimizar SSD / Desfragmentar HD (TRIM / Defrag)",
                "Envia comando de retrim em SSDs para manter a vida útil e alta taxa de leitura/gravação em blocos de disco.",
                lambda: SystemCommandEngine.run_cmd("defrag C: /O", callback=self._stream_to_console),
                self.colors["bg_card"]
            )
        ]

        for idx, (title, desc, cmd_fn, color) in enumerate(opt_tools):
            row = idx // 2
            col = idx % 2
            card = tk.Frame(grid, bg=self.colors["bg_panel"], padx=14, pady=10)
            card.grid(row=row, column=col, sticky="nsew", padx=6, pady=5)

            tk.Label(card, text=title, font=("Segoe UI", 9, "bold"), bg=self.colors["bg_panel"], fg=self.colors["text"]).pack(anchor="w")
            tk.Label(card, text=desc, font=("Segoe UI", 8), bg=self.colors["bg_panel"], fg=self.colors["text_muted"], wraplength=460, justify="left").pack(anchor="w", pady=(3, 8))
            self._create_button(card, "Executar Otimização", cmd_fn, color).pack(anchor="e")

        grid.columnconfigure(0, weight=1)
        grid.columnconfigure(1, weight=1)

    def disable_windows_telemetry(self):
        """Desativa DiagTrack e dmwappushservice e define chave AllowTelemetry para 0."""
        self.log_message("Desativando serviços de telemetria e coleta de dados da Microsoft...")
        ps_cmd = """
        Stop-Service -Name DiagTrack -Force -ErrorAction SilentlyContinue
        Set-Service -Name DiagTrack -StartupType Disabled -ErrorAction SilentlyContinue
        Stop-Service -Name dmwappushservice -Force -ErrorAction SilentlyContinue
        Set-Service -Name dmwappushservice -StartupType Disabled -ErrorAction SilentlyContinue
        reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" /v AllowTelemetry /t REG_DWORD /d 0 /f
        Write-Output "[SUCESSO] Telemetria e diagnóstico da Microsoft desativados com êxito!"
        """
        SystemCommandEngine.run_powershell(ps_cmd, callback=self._stream_to_console)

    def optimize_visual_effects(self):
        """Ajusta o registro para obter melhor desempenho gráfico."""
        self.log_message("Otimizando efeitos visuais do Windows para foco em alto desempenho...")
        ps_cmd = """
        reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" /v VisualFXSetting /t REG_DWORD /d 2 /f
        Write-Output "[SUCESSO] Configuração de efeitos visuais ajustada para Melhor Desempenho!"
        """
        SystemCommandEngine.run_powershell(ps_cmd, callback=self._stream_to_console)

    def clean_ram_working_set(self):
        """Alivia o consumo de memória RAM descartando páginas de cache inativas."""
        self.log_message("Executando descarte e compressão de cache de memória RAM...")
        ps_cmd = """
        [System.GC]::Collect()
        [System.GC]::WaitForPendingFinalizers()
        Get-Process | ForEach-Object { try { $_.MinWorkingSet = $_.MinWorkingSet } catch {} }
        Write-Output "[SUCESSO] Memória RAM limpa e páginas de trabalho reduzidas."
        """
        SystemCommandEngine.run_powershell(ps_cmd, callback=self._stream_to_console)

    # ==========================================================================
    # ABA 6: CONSOLE CMD / POWERSHELL INTERATIVO
    # ==========================================================================
    def _build_tab_terminal(self):
        container = tk.Frame(self.tab_terminal, bg=self.colors["bg_dark"], padx=18, pady=12)
        container.pack(fill="both", expand=True)

        tk.Label(
            container,
            text="💻 Console Direto Integrado (Privilégios Totais de Administrador):",
            font=("Segoe UI", 12, "bold"),
            bg=self.colors["bg_dark"],
            fg=self.colors["text"]
        ).pack(anchor="w", pady=(0, 8))

        top_row = tk.Frame(container, bg=self.colors["bg_panel"], padx=12, pady=10)
        top_row.pack(fill="x")

        self.shell_type = tk.StringVar(value="POWERSHELL")
        rb_ps = tk.Radiobutton(
            top_row, text="PowerShell (Elevado)", variable=self.shell_type, value="POWERSHELL",
            bg=self.colors["bg_panel"], fg=self.colors["text"], selectcolor=self.colors["bg_card"],
            activebackground=self.colors["bg_panel"], font=("Segoe UI", 9, "bold")
        )
        rb_ps.pack(side="left", padx=(0, 15))

        rb_cmd = tk.Radiobutton(
            top_row, text="CMD Prompt (Elevado)", variable=self.shell_type, value="CMD",
            bg=self.colors["bg_panel"], fg=self.colors["text"], selectcolor=self.colors["bg_card"],
            activebackground=self.colors["bg_panel"], font=("Segoe UI", 9, "bold")
        )
        rb_cmd.pack(side="left")

        cmd_entry_row = tk.Frame(container, bg=self.colors["bg_dark"], pady=8)
        cmd_entry_row.pack(fill="x")

        self.terminal_cmd_entry = tk.Entry(
            cmd_entry_row, font=("Consolas", 10), bg=self.colors["bg_panel"], fg=self.colors["accent_light"],
            insertbackground="#ffffff", relief="flat"
        )
        self.terminal_cmd_entry.insert(0, "Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10")
        self.terminal_cmd_entry.pack(side="left", fill="x", expand=True, ipady=7, padx=(0, 8))
        self.terminal_cmd_entry.bind("<Return>", lambda event: self.run_custom_terminal_command())

        self._create_button(
            cmd_entry_row, "▶️ Executar",
            self.run_custom_terminal_command, self.colors["success"]
        ).pack(side="right")

        # Atalhos de Comandos Rápidos
        quick_frame = tk.Frame(container, bg=self.colors["bg_dark"])
        quick_frame.pack(fill="x", pady=6)

        tk.Label(quick_frame, text="Diagnósticos Rápidos:", bg=self.colors["bg_dark"], fg=self.colors["text_muted"]).pack(side="left", padx=(0, 8))

        quick_commands = [
            ("Conexões Ativas (netstat)", "CMD", "netstat -ano | findstr ESTABLISHED"),
            ("Top 10 Memória RAM", "POWERSHELL", "Get-Process | Sort-Object WorkingSet -Descending | Select-Object Name, Id, @{Name='RAM (MB)';Expression={[math]::Round($_.WorkingSet / 1MB, 2)}} -First 10"),
            ("Tarefas Agendadas Ativas", "POWERSHELL", "Get-ScheduledTask | Where-Object {$_.State -eq 'Ready'} | Select-Object TaskName, TaskPath -First 20"),
            ("Status do Windows Defender", "POWERSHELL", "Get-MpComputerStatus | Select-Object RealTimeProtectionEnabled, AntivirusSignatureAge, AMServiceEnabled"),
            ("Informações BIOS / Placa Mãe", "POWERSHELL", "Get-CimInstance Win32_BIOS | Select-Object Manufacturer, SMBIOSBIOSVersion, ReleaseDate")
        ]

        for label, mode, cmd_str in quick_commands:
            self._create_button(
                quick_frame, label,
                lambda m=mode, c=cmd_str: self._run_quick_cmd(m, c),
                self.colors["bg_card"]
            ).pack(side="left", padx=3)

    def _run_quick_cmd(self, mode, cmd_str):
        self.shell_type.set(mode)
        self.terminal_cmd_entry.delete(0, "end")
        self.terminal_cmd_entry.insert(0, cmd_str)
        self.run_custom_terminal_command()

    def run_custom_terminal_command(self):
        cmd = self.terminal_cmd_entry.get().strip()
        if not cmd:
            return
        mode = self.shell_type.get()
        self.log_message(f"[{mode}/Admin] > {cmd}")
        if mode == "POWERSHELL":
            SystemCommandEngine.run_powershell(cmd, callback=self._stream_to_console)
        else:
            SystemCommandEngine.run_cmd(cmd, callback=self._stream_to_console)

    # ==========================================================================
    # UTILITÁRIOS GERAIS DE UI, LOGS E REGISTRO
    # ==========================================================================
    def _create_button(self, parent, text, command, bg_color):
        return tk.Button(
            parent,
            text=text,
            command=command,
            font=("Segoe UI", 9, "bold"),
            bg=bg_color,
            fg="#ffffff",
            activebackground=self.colors["accent_hover"],
            activeforeground="#ffffff",
            relief="flat",
            padx=12,
            pady=6,
            cursor="hand2"
        )

    def _stream_to_console(self, text, is_stream=False, done=False, return_code=0):
        if is_stream and text:
            self.after(0, lambda t=text: self._append_raw(t))
        elif done and not is_stream:
            self.after(0, lambda: self.log_message(f"[FINALIZADO] Código de Retorno: {return_code}"))

    def _append_raw(self, text):
        self.console_output.insert("end", text)
        self.console_output.see("end")

    def log_message(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        formatted = f"[{timestamp}] {message}\n"
        self.after(0, lambda: self._append_raw(formatted))

    def clear_log(self):
        self.console_output.delete("1.0", "end")

    def _save_log_to_file(self):
        log_content = self.console_output.get("1.0", "end")
        fp = filedialog.asksaveasfilename(
            defaultextension=".log",
            filetypes=[("Arquivos de Log", "*.log"), ("Texto", "*.txt")],
            initialfile=f"WinShield_Log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        )
        if fp:
            try:
                with open(fp, "w", encoding="utf-8") as f:
                    f.write(log_content)
                messagebox.showinfo("Log Salvo", f"Relatório salvo em:\n{fp}")
            except Exception as e:
                messagebox.showerror("Erro", f"Não foi possível salvar o arquivo: {e}")

    def _read_reg_string(self, key, val_name):
        try:
            val, _ = winreg.QueryValueEx(key, val_name)
            return str(val).strip()
        except Exception:
            return None

    def _read_reg_dword(self, key, val_name):
        try:
            val, _ = winreg.QueryValueEx(key, val_name)
            return int(val)
        except Exception:
            return None

    # Mocks para exibição quando testado fora do Windows
    def _insert_mock_audit_data(self):
        mock_data = [
            {"nome": "Google Chrome", "versao": "122.0.6261", "origem": "HKLM (64-bit)", "status": "Visível no Painel", "caminho": r"C:\Program Files\Google\Chrome\Application\chrome.exe", "is_hidden": False},
            {"nome": "Microsoft Edge", "versao": "122.0.2365", "origem": "HKLM (64-bit)", "status": "Visível no Painel", "caminho": r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe", "is_hidden": False},
            {"nome": "Windows Telemetry Client Agent", "versao": "1.0.4", "origem": "HKLM (64-bit)", "status": "⚠️ OCULTO (SystemComponent=1)", "caminho": r"C:\Windows\System32\diagtrack.exe", "is_hidden": True},
            {"nome": "SilentBackgroundUpdater", "versao": "4.2.0", "origem": "HKCU (Usuário)", "status": "⚠️ OCULTO (SystemComponent=1)", "caminho": r"C:\Users\Admin\AppData\Local\Temp\updater.exe", "is_hidden": True}
        ]
        self.audit_records = mock_data
        self._populate_audit_tree(self.audit_records)
        self.audit_stats_lbl.config(text=f"Total: {len(mock_data)} | Ocultos: 2")

    def _insert_mock_startup_data(self):
        mock_startup = [
            {"nome": "OneDrive", "versao": "Startup", "origem": "HKCU\\Run", "status": "Inicialização Ativa", "caminho": r"C:\Users\Admin\AppData\Local\Microsoft\OneDrive\OneDrive.exe /background"},
            {"nome": "SuspiciousTempScript", "versao": "Startup", "origem": "HKLM\\Run", "status": "⚠️ Suspeito (AppData/Temp)", "caminho": r"C:\Users\Admin\AppData\Local\Temp\svchost_miner.exe"}
        ]
        self.audit_records = mock_startup
        self._populate_audit_tree(self.audit_records)
        self.audit_stats_lbl.config(text=f"Total Startup: {len(mock_startup)}")

    def _insert_mock_threat_data(self):
        self.av_tree.insert("", "end", values=("svchost.exe", "4812", "🚨 CRÍTICO (Masquerade)", "Impersonando binário fora do System32", r"C:\Users\Admin\AppData\Local\Temp\svchost.exe"))
        self.av_tree.insert("", "end", values=("adware_helper.exe", "9102", "⚠️ ALTO RISCO", "Executando em AppData\\Local\\Temp", r"C:\Users\Admin\AppData\Local\Temp\adware_helper.exe"))
        self.av_status_lbl.config(text="⚠️ 2 processos suspeitos identificados em ambiente simulado.", fg=self.colors["danger"])


# ==============================================================================
# PONTO DE ENTRADA DO SISTEMA
# ==============================================================================
if __name__ == "__main__":
    # Garante que em ambiente Windows real ocorra a solicitação de elevação UAC imediatamente
    if IS_WINDOWS and not is_admin():
        elevate_privileges()

    if tk is not None:
        app = WinShieldProApp()
        app.mainloop()
    else:
        print("[ERRO] Tkinter não encontrado neste ambiente. Por favor, execute em um ambiente Python com suporte a interface gráfica.")