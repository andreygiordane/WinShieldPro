@echo off
:: ============================================================================
:: WinShield Pro - Instalador do Certificado Oficial de Andrey Giordane
:: Instala o certificado como Autoridade Raiz Confiavel e Fornecedor Confiavel
:: ============================================================================
title Instalando Certificado Oficial de Andrey Giordane...

cd /d "%~dp0"

:: 1. Auto-elevacao para Administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo =====================================================================
    echo   SOLICITANDO PRIVILEGIOS DE ADMINISTRADOR...
    echo =====================================================================
    echo.
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

echo =====================================================================
echo    INSTALADOR DO CERTIFICADO OFICIAL - ANDREY GIORDANE
echo =====================================================================
echo.

set "ROOT_DIR=%~dp0..\"
set "CER_FILE=%ROOT_DIR%certificates\AndreyGiordane_PublicKey.cer"
if not exist "%CER_FILE%" set "CER_FILE=%ROOT_DIR%AndreyGiordane_PublicKey.cer"
if not exist "%CER_FILE%" set "CER_FILE=%~dp0AndreyGiordane_PublicKey.cer"
set "TARGET_EXE=%ROOT_DIR%dist\WinShieldPro.exe"

if not exist "%CER_FILE%" (
    echo [ERRO] O arquivo "%CER_FILE%" nao foi encontrado.
    echo Execute "sign_app.ps1" primeiro para gerar o certificado.
    pause
    exit /b 1
)

echo [1/3] Adicionando "Andrey Giordane" as Autoridades Raiz Confiaveis (Root)...
certutil -addstore -f "Root" "%CER_FILE%"
if %errorlevel% neq 0 (
    echo [AVISO] Falha ao adicionar ao repositorio Root do computador.
)

echo.
echo [2/3] Adicionando "Andrey Giordane" aos Fornecedores Confiaveis (TrustedPublisher)...
certutil -addstore -f "TrustedPublisher" "%CER_FILE%"
if %errorlevel% neq 0 (
    echo [AVISO] Falha ao adicionar aos Fornecedores Confiaveis.
)

echo.
echo [3/3] Removendo bloqueio Mark-of-the-Web (Zone.Identifier / SmartScreen)...
if exist "%TARGET_EXE%" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Unblock-File -Path '%TARGET_EXE%'"
    echo [OK] WinShieldPro.exe desbloqueado no SmartScreen com sucesso!
)

echo.
echo =====================================================================
echo   SUCESSO! O CERTIFICADO FOI INSTALADO COM EXITO NO WINDOWS.
echo =====================================================================
echo.
echo O Windows agora reconhece "Andrey Giordane" como Fornecedor Oficial.
echo O alerta azul do SmartScreen nao sera mais exibido neste computador.
echo.
pause
