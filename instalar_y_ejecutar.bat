@echo off
setlocal EnableDelayedExpansion
title CRM Agencia - Servidor Local
chcp 65001 >nul
cls

echo ======================================================
echo           INICIANDO CRM AGENCIA VERSION 1.0
echo ======================================================
echo.

:: 1. Verificacion limpia de Node.js
where node >nul 2>nul
if !ERRORLEVEL! NEQ 0 (
    echo [ERROR CRITICO] Node.js no se detecto en el sistema.
    echo Por favor instale Node.js LTS desde https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Verificacion de node_modules precompilados (Zero-Compile / Zero-Setup)
if exist "node_modules\" (
    echo [1/2] Modulos de ejecucion detectados (Ejecucion directa sin compilacion).
) else (
    echo [1/2] Instalando modulos de produccion (Fallback)...
    call npm install --omit=dev --no-audit --no-fund
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Fallo npm install. Verifique la conexion a Internet.
        pause
        exit /b 1
    )
)

:: 3. Lanzar navegador y levantar servidor
echo [2/2] Levantando aplicacion...
start "" http://localhost:5173

echo.
echo ======================================================
echo   CRM Agencia en ejecucion. Mantenga esta ventana abierta.
echo ======================================================
echo.

if exist "server\server.js" (
    node server/server.js
) else if exist "server\index.js" (
    node server/index.js
) else (
    echo [ERROR] No se encontro el archivo de entrada del servidor.
)
pause
