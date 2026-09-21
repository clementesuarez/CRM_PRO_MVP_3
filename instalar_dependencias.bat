@echo off
title AutoCRM PRO MVP 3 - Instalacion de Dependencias

echo ==============================================================================
echo              AUTOCRM PRO MVP 3 - INSTALACION DE DEPENDENCIAS
echo ==============================================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 goto :NODE_OK

echo.
echo ATENCION: Node.js no se encuentra instalado en este equipo.
echo Se abrira el navegador para descargar Node.js LTS.
echo Por favor instalelo y vuelva a ejecutar este archivo.
echo.
start https://nodejs.org/
pause
exit /b 1

:NODE_OK
echo [1/4] Node.js detectado correctamente.
echo [2/4] Instalando dependencias y compilando SQLite...
call npm install
if %ERRORLEVEL% NEQ 0 goto :NPM_ERROR

echo [3/4] Generando compilacion de produccion...
call npm run build
if %ERRORLEVEL% NEQ 0 goto :BUILD_ERROR

echo [4/4] Verificando base de datos SQLite...
node --input-type=module -e "import './server/db.js'; console.log('[SQLite] Base de datos verificada correctamente.');"
if %ERRORLEVEL% NEQ 0 goto :DB_ERROR

echo.
echo ==============================================================================
echo  INSTALACION COMPLETADA CON EXITO.
echo  Puedes iniciar el CRM ejecutando "iniciar_crm.bat"
echo ==============================================================================
echo.
pause
goto :END

:NPM_ERROR
echo Error al instalar dependencias de npm.
pause
exit /b 1

:BUILD_ERROR
echo Error al compilar el proyecto Vite.
pause
exit /b 1

:DB_ERROR
echo Error al verificar la base de datos SQLite.
pause
exit /b 1

:END
