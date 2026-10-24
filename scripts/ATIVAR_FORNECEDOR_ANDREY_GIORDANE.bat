@echo off
:: ============================================================================
:: ATIVADOR OFICIAL DE FORNECEDOR: ANDREY GIORDANE
:: Registra a assinatura digital no Windows para exibir "Fornecedor Verificado"
:: ============================================================================
title Ativando Fornecedor Oficial: Andrey Giordane...

cd /d "%~dp0"

:: 1. Auto-elevacao para Administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo =====================================================================
    echo   SOLICITANDO AUTORIZACAO PARA REGISTRAR O FORNECEDOR OFICIAL...
    echo =====================================================================
    echo.
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

echo =====================================================================
echo    REGISTRANDO ANDREY GIORDANE COMO FORNECEDOR VERIFICADO
echo =====================================================================
echo.

set "ROOT_DIR=%~dp0..\"
set "CER_FILE=%ROOT_DIR%certificates\AndreyGiordane_PublicKey.cer"
if not exist "%CER_FILE%" set "CER_FILE=%ROOT_DIR%AndreyGiordane_PublicKey.cer"
if not exist "%CER_FILE%" set "CER_FILE=%~dp0AndreyGiordane_PublicKey.cer"
set "TARGET_EXE=%ROOT_DIR%dist\WinShieldPro.exe"

if not exist "%CER_FILE%" (
    echo [ERRO] O arquivo "%CER_FILE%" nao foi encontrado.
    echo Gerando certificado agora via PowerShell...
    if exist "%~dp0sign_app.ps1" (
        powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sign_app.ps1"
    ) else (
        powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT_DIR%scripts\sign_app.ps1"
    )
)

echo [1/4] Adicionando "Andrey Giordane" as Autoridades Raiz Confiaveis (Root)...
certutil -addstore -f "Root" "%CER_FILE%"

echo.
echo [2/4] Adicionando "Andrey Giordane" aos Fornecedores Confiaveis (TrustedPublisher)...
certutil -addstore -f "TrustedPublisher" "%CER_FILE%"

echo.
echo [3/4] Adicionando ao repositorio de Usuario...
certutil -addstore -user "TrustedPublisher" "%CER_FILE%" >nul 2>&1

echo.
echo [4/4] Removendo bloqueio do Windows SmartScreen (Zone.Identifier)...
if exist "%TARGET_EXE%" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Unblock-File -Path '%TARGET_EXE%'"
)

echo.
echo =====================================================================
echo   SUCESSO TOTAL! ANDREY GIORDANE AGORA E FORNECEDOR VERIFICADO!
echo =====================================================================
echo.
echo A partir de agora, o Windows UAC exibira:
echo.
echo   ===========================================================
echo   [Escudo Azul de Seguranca]
echo   Deseja permitir que este aplicativo faca alteracoes no seu dispositivo?
echo.
echo   WinShieldPro.exe
echo   Fornecedor verificado: Andrey Giordane
echo   ===========================================================
echo.
pause
