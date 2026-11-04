@echo off
:: ============================================================================
:: WinShield Pro - Build: frontend -> PyInstaller -> dist\WinShieldPro.exe
:: Gera um executavel unico e portatil (nao precisa instalar).
:: ============================================================================
setlocal
cd /d "%~dp0"
set "PROJECT_DIR=%~dp0"
set "BUILD_ROOT=%TEMP%\WinShieldProBuild"
set "TEMP_DIST=%BUILD_ROOT%\dist"
set "TEMP_WORK=%BUILD_ROOT%\build"
set "FINAL_EXE=%PROJECT_DIR%dist\WinShieldPro.exe"

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
echo       COMPILADOR WINSHIELD PRO v%APP_VERSION% (EXECUTAVEL PORTATIL)
echo =====================================================================
echo.

echo [1/3] Verificando instalacao do PyInstaller...
python -m pip install --quiet pyinstaller

echo Encerrando possiveis instancias ativas do WinShieldPro...
taskkill /F /IM WinShieldPro.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
if exist "%FINAL_EXE%" del /f /q "%FINAL_EXE%" >nul 2>&1
if exist "%BUILD_ROOT%" rmdir /s /q "%BUILD_ROOT%" >nul 2>&1
if not exist "%PROJECT_DIR%dist" mkdir "%PROJECT_DIR%dist"

echo.
echo [2/3] Recompilando frontend modular (HTML/JS/CSS)...
python "%PROJECT_DIR%scripts\build_frontend.py"
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha no build do frontend. Rode: python scripts\fetch_vendor.py
    pause
    exit /b 1
)

echo.
echo [3/3] Compilando WinShieldPro.exe (arquivo unico, sem console, UAC embutido)...
python -m PyInstaller --noconfirm --clean --distpath "%TEMP_DIST%" --workpath "%TEMP_WORK%" WinShieldPro.spec
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Ocorreu uma falha durante a compilacao com PyInstaller.
    pause
    exit /b 1
)
copy /Y "%TEMP_DIST%\WinShieldPro.exe" "%FINAL_EXE%" >nul
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao copiar o executavel final para a pasta dist.
    pause
    exit /b 1
)
rmdir /s /q "%BUILD_ROOT%" >nul 2>&1

echo.
echo =====================================================================
echo SUCESSO! WinShield Pro v%APP_VERSION%
echo   Executavel portatil: %FINAL_EXE%
echo =====================================================================
echo.
pause
