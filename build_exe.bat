@echo off
:: ============================================================================
:: WinShield Pro - Build completo
:: Resultado:
::   dist\WinShieldPro\              app em modo pasta (abre rapido)
::   dist\WinShieldPro-Setup.exe     instalador (escolha da pasta de instalacao)
::   dist\WinShieldPro.exe           executavel portatil (arquivo unico)
:: ============================================================================
setlocal
cd /d "%~dp0"
set "PROJECT_DIR=%~dp0"
set "BUILD_ROOT=%TEMP%\WinShieldProBuild"
set "TEMP_DIST=%BUILD_ROOT%\dist"
set "TEMP_WORK=%BUILD_ROOT%\build"
set "APP_DIR=%PROJECT_DIR%dist\WinShieldPro"
set "PORTABLE_EXE=%PROJECT_DIR%dist\WinShieldPro.exe"

:: Garante que pastas de scripts do Python estejam no PATH da sessao
set "PATH=%APPDATA%\Python\Python315\Scripts;%LOCALAPPDATA%\Programs\Python\Python315\Scripts;%PATH%"

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Python nao foi localizado no PATH do sistema.
    pause
    exit /b 1
)
for /f "delims=" %%V in ('python -c "from backend.core import APP_VERSION; print(APP_VERSION)"') do set "APP_VERSION=%%V"
title Compilando WinShield Pro v%APP_VERSION%...

echo =====================================================================
echo       COMPILADOR WINSHIELD PRO v%APP_VERSION%
echo =====================================================================
echo.

echo [1/5] Verificando instalacao do PyInstaller...
python -m pip install --quiet pyinstaller

echo Encerrando possiveis instancias ativas do WinShieldPro...
taskkill /F /IM WinShieldPro.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
if exist "%BUILD_ROOT%" rmdir /s /q "%BUILD_ROOT%" >nul 2>&1
if not exist "%PROJECT_DIR%dist" mkdir "%PROJECT_DIR%dist"

echo.
echo [2/5] Recompilando frontend modular (HTML/JS/CSS)...
python "%PROJECT_DIR%scripts\build_frontend.py"
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha no build do frontend. Rode: python scripts\fetch_vendor.py
    pause
    exit /b 1
)

echo.
echo [3/5] Compilando o app em modo pasta (usado pelo instalador)...
set "WINSHIELD_PORTABLE="
python -m PyInstaller --noconfirm --clean --distpath "%TEMP_DIST%" --workpath "%TEMP_WORK%" WinShieldPro.spec
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha na compilacao com PyInstaller - modo pasta.
    pause
    exit /b 1
)
:: Espelha a pasta gerada em dist\WinShieldPro (remove arquivos de builds antigos)
robocopy "%TEMP_DIST%\WinShieldPro" "%APP_DIR%" /MIR /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 (
    echo.
    echo [ERRO] Falha ao copiar o app para %APP_DIR%.
    pause
    exit /b 1
)

echo.
echo [4/5] Gerando o instalador com Inno Setup...
set "ISCC="
for %%P in ("%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" "%ProgramFiles%\Inno Setup 6\ISCC.exe" "%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe") do (
    if exist %%P set "ISCC=%%~P"
)
if not defined ISCC (
    echo [AVISO] Inno Setup 6 nao encontrado; instalador nao gerado.
    echo         Instale com: winget install JRSoftware.InnoSetup
) else (
    "%ISCC%" /Q /DAppVersion=%APP_VERSION% "%PROJECT_DIR%installer\WinShieldPro.iss"
    if errorlevel 1 (
        echo.
        echo [ERRO] Falha ao gerar o instalador.
        pause
        exit /b 1
    )
)

echo.
echo [5/5] Compilando o executavel portatil (arquivo unico)...
set "WINSHIELD_PORTABLE=1"
python -m PyInstaller --noconfirm --distpath "%TEMP_DIST%\portable" --workpath "%TEMP_WORK%\portable" WinShieldPro.spec
if errorlevel 1 (
    echo.
    echo [ERRO] Falha na compilacao com PyInstaller - portatil.
    pause
    exit /b 1
)
set "WINSHIELD_PORTABLE="
copy /Y "%TEMP_DIST%\portable\WinShieldPro.exe" "%PORTABLE_EXE%" >nul
rmdir /s /q "%BUILD_ROOT%" >nul 2>&1

echo.
echo =====================================================================
echo SUCESSO! WinShield Pro v%APP_VERSION%
echo   Instalador (recomendado): %PROJECT_DIR%dist\WinShieldPro-Setup.exe
echo   Portatil:                 %PORTABLE_EXE%
echo   App (pasta):              %APP_DIR%
echo =====================================================================
echo.
pause
