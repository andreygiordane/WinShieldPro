@echo off
:: ============================================================================
:: WinShield Pro - Build completo: frontend -> PyInstaller (pasta) -> Instalador
:: Resultado:
::   dist\WinShieldPro\                     app pronto (pasta, modo onedir)
::   dist\WinShieldPro-Setup.exe             instalador (se o Inno Setup estiver instalado)
:: ============================================================================
setlocal
cd /d "%~dp0"
set "PROJECT_DIR=%~dp0"
set "BUILD_ROOT=%TEMP%\WinShieldProBuild"
set "TEMP_DIST=%BUILD_ROOT%\dist"
set "TEMP_WORK=%BUILD_ROOT%\build"
set "APP_DIR=%PROJECT_DIR%dist\WinShieldPro"

:: Garante que pastas de scripts do Python estejam no PATH da sessão
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

echo [1/4] Verificando instalacao do PyInstaller...
python -m pip install --quiet pyinstaller

echo Encerrando possiveis instancias ativas do WinShieldPro...
taskkill /F /IM WinShieldPro.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
if exist "%BUILD_ROOT%" rmdir /s /q "%BUILD_ROOT%" >nul 2>&1
if not exist "%PROJECT_DIR%dist" mkdir "%PROJECT_DIR%dist"

echo.
echo [2/4] Recompilando frontend modular (HTML/JS/CSS)...
python "%PROJECT_DIR%scripts\build_frontend.py"
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha no build do frontend. Rode: python scripts\fetch_vendor.py
    pause
    exit /b 1
)

echo.
echo [3/4] Compilando o app com PyInstaller (modo pasta, sem console, UAC embutido)...
python -m PyInstaller --noconfirm --clean --distpath "%TEMP_DIST%" --workpath "%TEMP_WORK%" WinShieldPro.spec
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Ocorreu uma falha durante a compilacao com PyInstaller.
    pause
    exit /b 1
)
:: Espelha a pasta gerada em dist\WinShieldPro (remove arquivos de builds antigos)
robocopy "%TEMP_DIST%\WinShieldPro" "%APP_DIR%" /MIR /NFL /NDL /NJH /NJS /NP >nul
if %errorlevel% geq 8 (
    echo.
    echo [ERRO] Falha ao copiar o app para %APP_DIR%.
    pause
    exit /b 1
)
rmdir /s /q "%BUILD_ROOT%" >nul 2>&1

echo.
echo [4/4] Gerando o instalador com Inno Setup...
set "ISCC="
for %%P in ("%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" "%ProgramFiles%\Inno Setup 6\ISCC.exe" "%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe") do (
    if exist %%P set "ISCC=%%~P"
)
if not defined ISCC (
    echo [AVISO] Inno Setup 6 nao encontrado. O app foi gerado em:
    echo       %APP_DIR%
    echo Para gerar o instalador, instale o Inno Setup e rode este script de novo:
    echo       winget install JRSoftware.InnoSetup
    pause
    exit /b 0
)
"%ISCC%" /Q /DAppVersion=%APP_VERSION% "%PROJECT_DIR%installer\WinShieldPro.iss"
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao gerar o instalador.
    pause
    exit /b 1
)

echo.
echo =====================================================================
echo SUCESSO! WinShield Pro v%APP_VERSION%
echo   Instalador: %PROJECT_DIR%dist\WinShieldPro-Setup.exe
echo   App (pasta): %APP_DIR%
echo =====================================================================
echo.
pause
