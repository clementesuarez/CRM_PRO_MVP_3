@echo off
title AutoCRM PRO MVP 3 - Servidor Comercial

echo ==============================================================================
echo                 AUTOCRM PRO MVP 3 - SERVIDOR COMERCIAL
echo ==============================================================================
echo.

REM Verificar si la carpeta dist existe
if exist dist goto :START_SERVER

echo Generando paquete de produccion en carpeta /dist...
call npm run build
if %ERRORLEVEL% NEQ 0 goto :BUILD_ERROR

:START_SERVER
echo.
echo Iniciando Servidor Local CRM en http://localhost:5173 ...
echo Abriendo navegador en http://localhost:5173 ...
echo.

start "" http://localhost:5173
node server/server.js
goto :END

:BUILD_ERROR
echo.
echo Error: Fallo la compilacion de produccion.
pause
exit /b 1

:END
pause
