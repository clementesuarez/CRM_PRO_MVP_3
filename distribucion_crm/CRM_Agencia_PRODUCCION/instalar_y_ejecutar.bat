@echo off
chcp 65001 > nul
title CRM Agencia Automotor - Servidor Comercial
echo ==============================================================================
echo                AUTOCRM PRO MVP 3 - SERVIDOR LOCAL COMERCIAL
echo ==============================================================================
echo.
echo Verificando instalación de Node.js en el sistema...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR CRÍTICO] Node.js no se encuentra instalado en esta computadora.
    echo Por favor descargue e instale Node.js LTS desde https://nodejs.org/ antes de continuar.
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js detectado correctamente.
echo.
if not exist node_modules (
    echo [NPM] Instalando dependencias de producción...
    call npm install --omit=dev
    echo.
)

echo Iniciando Servidor Local CRM en http://localhost:5173 ...
echo Abriendo navegador en http://localhost:5173 ...
echo.
start http://localhost:5173
node server/server.js
pause
