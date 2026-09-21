@echo off
chcp 65001 > nul
title AutoCRM PRO MVP 3 - Asistente de Instalación Autónoma

echo ==============================================================================
echo              AUTOCRM PRO MVP 3 - INSTALACIÓN DE DEPENDENCIAS
echo ==============================================================================
echo.

:: 1. Verificación de Node.js
echo [1/4] Comprobando la presencia de Node.js en el sistema...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ATENCIÓN: Node.js no se encuentra instalado en este equipo.
    echo.
    echo Se abrirá el navegador para descargar la versión oficial Node.js LTS.
    echo Por favor instálelo y luego vuelva a ejecutar este archivo script.
    echo.
    start https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo ✅ Node.js detectado exitosamente: %NODE_VERSION%
echo.

:: 2. Instalación de Librerías y Módulos Nativo (better-sqlite3)
echo [2/4] Instalando dependencias de Node.js y compilando binarios nativos...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: Ocurrió un fallo durante la instalación de paquetes de npm.
    echo Revisa tu conexión a internet o los permisos de Windows.
    pause
    exit /b 1
)
echo ✅ Dependencias instaladas correctamente.
echo.

:: 3. Compilación del Frontend (Vite Dist)
echo [3/4] Generando compilación de producción optimizada (Vite Build)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: Falló la compilación del bundle de producción.
    pause
    exit /b 1
)
echo ✅ Frontend compilado y listo en directorio /dist.
echo.

:: 4. Inicialización y Verificación de Base de Datos SQLite WAL
echo [4/4] Inicializando y verificando base de datos SQLite (crm_local.db)...
node --input-type=module -e "import './server/db.js'; console.log('[SQLite] Conexión y tablas creadas exitosamente.');"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: No se pudo verificar la base de datos local SQLite.
    pause
    exit /b 1
)
echo.

echo ==============================================================================
echo  🎉 ¡INSTALACIÓN COMPLETADA CON ÉXITO!
echo  Puedes iniciar el CRM en cualquier momento ejecutando "iniciar_crm.bat"
echo ==============================================================================
echo.
pause
