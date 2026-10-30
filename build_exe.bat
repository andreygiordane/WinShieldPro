@echo off
:: ============================================================================
:: WinShield Pro v7.0 Enterprise - Compilador Executável Standalone (.EXE)
:: Inclui Manifesto de Administrador Nativo (--uac-admin) e Modo 100% Windowed
:: ============================================================================
title Compilando WinShield Pro v7.0 para Executável Standalone (.exe)...

cd /d "%~dp0"
set "PROJECT_DIR=%~dp0"
set "BUILD_ROOT=%TEMP%\WinShieldProBuild"
set "TEMP_DIST=%BUILD_ROOT%\dist"
set "TEMP_WORK=%BUILD_ROOT%\build"
set "FINAL_EXE=%PROJECT_DIR%dist\WinShieldPro.exe"

:: Garante que pastas de scripts do Python estejam no PATH da sessão
set "PATH=%APPDATA%\Python\Python315\Scripts;%LOCALAPPDATA%\Programs\Python\Python315\Scripts;%PATH%"

echo =====================================================================
echo       COMPILADOR WINSHIELD PRO v7.0 ENTERPRISE PARA WINDOWS
echo =====================================================================
echo.

:: 1. Verificar se o Python está presente
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Python nao foi localizado no PATH do sistema.
    echo Instale o Python 3.8+ em https://www.python.org/
    pause
    exit /b
)

:: 2. Instalar PyInstaller se nao estiver presente
echo [1/4] Verificando instalacao do PyInstaller...
python -m pip install pyinstaller

:: 3. Encerrar instâncias anteriores em execução para liberar o arquivo final
echo Encerrando possiveis instancias ativas do WinShieldPro...
for /f "skip=1" %%P in ('wmic process where "name='WinShieldPro.exe'" get processid 2^>nul') do (
    taskkill /PID %%P /F /T >nul 2>&1
)
taskkill /F /IM WinShieldPro.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

if exist "%FINAL_EXE%" (
    attrib -h -s -r "%FINAL_EXE%" >nul 2>&1
    del /f /q "%FINAL_EXE%" >nul 2>&1
)
if exist "%BUILD_ROOT%" (
    rmdir /s /q "%BUILD_ROOT%" >nul 2>&1
)
if not exist "%PROJECT_DIR%dist" mkdir "%PROJECT_DIR%dist"

:: 4. Compilar em um diretório temporário estável para evitar bloqueios do arquivo final
echo.
echo [2/4] Recompilando frontend modular (HTML/JS/CSS)...
python "%PROJECT_DIR%scripts\build_frontend.py"

echo.
echo [3/4] Compilando WinShieldPro.exe via WinShieldPro.spec...
echo       Modo Janela Puro (sem console) + UAC Admin embutido.
echo.

python -m PyInstaller --noconfirm --clean --distpath "%TEMP_DIST%" --workpath "%TEMP_WORK%" WinShieldPro.spec

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Ocorreu uma falha durante a compilacao com PyInstaller.
    pause
    exit /b
)

copy /Y "%TEMP_DIST%\WinShieldPro.exe" "%FINAL_EXE%" >nul
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao copiar o executavel final para a pasta dist.
    pause
    exit /b
)

rmdir /s /q "%BUILD_ROOT%" >nul 2>&1

:: 5. Assinar digitalmente com o Certificado Oficial de Andrey Giordane
echo.
echo [4/4] Assinando digitalmente com Andrey Giordane...
set "SIGN_SCRIPT=%PROJECT_DIR%scripts\sign_app.ps1"
if not exist "%SIGN_SCRIPT%" set "SIGN_SCRIPT=%PROJECT_DIR%sign_app.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -File "%SIGN_SCRIPT%" -TargetExe "%FINAL_EXE%"

echo.
echo =====================================================================
echo SUCESSO! Executavel oficial v7.0 gerado e assinado em:
echo       %FINAL_EXE%
echo =====================================================================
echo.
echo O arquivo "WinShieldPro.exe" agora possui todos os modulos integrados (v7.0)
echo e esta assinado digitalmente por Andrey Giordane (Sem alertas de Fornecedor Desconhecido).
echo.
pause
