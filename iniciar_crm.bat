@echo off
chcp 65001 > nul
title AutoCRM PRO MVP 3 - Servidor Comercial de Agencia

echo ==============================================================================
echo                 AUTOCRM PRO MVP 3 - LANZADOR EN UN CLIC
echo ==============================================================================
echo.

:: Verificar si el bundle de producción existe
if not exist "dist" (
    echo ⚠️  No se encontró la carpeta /dist compilada. Generando paquete de producción...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Falló la compilación de producción. Ejecute "instalar_dependencias.bat" primero.
        pause
        exit /b 1
    )
)

echo 🚀 Iniciando Servidor Local CRM (SQLite WAL)...
echo 🌐 Abriendo navegador predeterminado en http://localhost:5173 ...
echo.

:: Abrir navegador tras 2 segundos de espera para dar tiempo al inicio del servidor
start "" /b cmd /c "timeout /t 2 >nul && start http://localhost:5173"

:: Ejecutar servidor Node/Express en primer plano
node server/server.js

pause
