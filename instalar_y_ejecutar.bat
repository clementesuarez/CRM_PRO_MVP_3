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

:: 2. Instalacion de dependencias si falta node_modules
if not exist "node_modules\" (
    echo [1/2] Primera ejecucion detectada. Instalando modulos necesarios...
    call npm install --omit=dev
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Fallo npm install. Verifique la conexion a Internet.
        pause
        exit /b 1
    )
)

:: 3. Lanzar navegador al iniciar
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
