@echo off
:: ============================================================================
:: WinShield Pro v7.0 - Launcher com Auto-Elevação UAC (Privilégios de Administrador)
:: Execução 100% invisível sem janelas de console persistentes
:: ============================================================================
title WinShield Pro - Verificando Privilégios de Administrador...

:: Verifica se já estamos rodando como Administrador
net session >nul 2>&1
if %errorlevel% == 0 (
    goto :run_app
) else (
    goto :elevate
)

:elevate
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs -WindowStyle Hidden"
exit /b

:run_app
cd /d "%~dp0"

:: Registra o Certificado Oficial de Andrey Giordane como Raiz e Fornecedor Confiavel
set "ROOT_CER=%~dp0certificates\AndreyGiordane_PublicKey.cer"
if not exist "%ROOT_CER%" set "ROOT_CER=%~dp0AndreyGiordane_PublicKey.cer"
if exist "%ROOT_CER%" (
    certutil -addstore -f "Root" "%ROOT_CER%" >nul 2>&1
    certutil -addstore -f "TrustedPublisher" "%ROOT_CER%" >nul 2>&1
)

:: 1. Se o executável compilado existir, roda diretamente em modo janela
if exist "%~dp0dist\WinShieldPro.exe" (
    start "" "%~dp0dist\WinShieldPro.exe"
    exit /b
)

:: 2. Procura pythonw (execução sem console CMD)
where pythonw >nul 2>&1
if %errorlevel% == 0 (
    start "" pythonw winshield_app.py
    exit /b
)

:: 3. Procura python padrão
where python >nul 2>&1
if %errorlevel% == 0 (
    start "" python winshield_app.py
    exit /b
)

where py >nul 2>&1
if %errorlevel% == 0 (
    start "" py winshield_app.py
    exit /b
)

echo [ERRO] Python nao foi encontrado no sistema!
echo Por favor, instale o Python 3.8+ em https://www.python.org/
echo Ou utilize o executavel compilado (dist\WinShieldPro.exe).
pause
