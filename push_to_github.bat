@echo off
chcp 65001 >nul
title WinShield Pro - Publicar no GitHub
echo =====================================================================
echo       WINSHIELD PRO ENTERPRISE - SINCRONIZACAO COM GITHUB
echo =====================================================================
echo.
echo Repositorio Remoto: https://github.com/andreygiordane/WinShieldPro.git
echo Branch: main
echo Arquivos a enviar: Codigo fonte completo + README.md + dist/WinShieldPro.exe
echo.
echo Se o navegador abrir solicitando autorizacao do GitHub, clique em "Authorize git-ecosystem".
echo.
git push -u origin main
if %errorlevel% equ 0 (
    echo.
    echo =====================================================================
    echo [SUCESSO] Projeto e executavel publicados com sucesso no GitHub!
    echo Acesse: https://github.com/andreygiordane/WinShieldPro
    echo =====================================================================
) else (
    echo.
    echo =====================================================================
    echo [ERRO] Ocorreu uma falha ao enviar. Verifique suas credenciais do GitHub.
    echo =====================================================================
)
echo.
pause
