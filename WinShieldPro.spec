# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_all

# Janela nativa (pywebview + WebView2 via pythonnet): DLLs e dados precisam ir junto
_extra_datas, _extra_bins, _extra_hidden = [], [], []
for _pkg in ('webview', 'pythonnet', 'clr_loader'):
    _d, _b, _h = collect_all(_pkg)
    _extra_datas += _d
    _extra_bins += _b
    _extra_hidden += _h

a = Analysis(
    ['winshield_app.py'],
    pathex=[],
    binaries=[('backend/bin/DiskSpd64.exe', 'backend/bin')] + _extra_bins,
    datas=[
        ('frontend/winshield_pro_dashboard.html', 'frontend'),
        ('frontend/winshield_pro_dashboard.html', '.'),
        ('frontend/vendor', 'frontend/vendor'),  # tailwind.css + lucide (sem CDN)
        ('backend', 'backend'),
        ('imagens', 'imagens'),
    ] + _extra_datas,
    hiddenimports=[
        'backend',
        'backend.core',
        'backend.process',
        'backend.cmd_engine',
        'backend.log_manager',
        'backend.audit_engine',
        'backend.antivirus_engine',
        'backend.cleaner_engine',
        'backend.power_engine',
        'backend.optimizer_engine',
        'backend.system_engine',
        'backend.disk_health_engine',
        'backend.disk_benchmark_engine',
        'backend.hardware_monitor',
        'backend.disk_scan_engine',
        'backend.app_manager_engine',
        'backend.memory_engine',
        'backend.network_engine',
        'backend.device_engine',
        'backend.stress_engine',
        'backend.stress_bench_engine',
        'backend.telemetry',
        'backend.update_engine',
        'backend.support_engine',
        'numpy',
        'psutil',
        'webview',
        'webview.platforms.edgechromium',
        'webview.platforms.winforms',
        'clr',
    ] + _extra_hidden,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

# Modo pasta (onedir): o instalador copia a pasta pronta, então o app abre direto,
# sem extrair ~28 MB no %TEMP% a cada execução como no modo arquivo único.
# Sem UPX: executáveis comprimidos com UPX disparam muito mais falsos positivos de antivírus.
exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='WinShieldPro',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    uac_admin=True,
    icon='imagens/icone.ico',
    version='version_info.txt',
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    name='WinShieldPro',
)
