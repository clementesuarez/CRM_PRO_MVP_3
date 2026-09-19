@echo off
chcp 65001 > nul
title RESTAURACIÓN DE BASE DE DATOS LOCAL SQL - AUTOCRM PRO MVP 3
color 0B

echo ==============================================================================
echo       AUTOCRM PRO MVP 3 - SCRIPT OFICIAL DE RESTAURACIÓN DE BASE DE DATOS
echo ==============================================================================
echo.
echo [1/3] AVISO IMPORTANTE:
echo Asegurate de que el servidor Node (PRENDER_SERVIDOR.bat) este APAGADO
echo antes de proceder para evitar bloqueos de archivos en SQLite.
echo.
echo ==============================================================================
echo.

set /p BACKUP_FILE="Ingresa o arrastra la ruta completa del archivo de respaldo (.db): "

:: Remove quotes if drag and dropped
set BACKUP_FILE=%BACKUP_FILE:"=%

if not exist "%BACKUP_FILE%" (
    color 0C
    echo.
    echo [ERROR] El archivo de respaldo especificado no existe:
    echo "%BACKUP_FILE%"
    echo.
    pause
    exit /b 1
)

echo.
echo [2/3] Confirmar Restauracion:
echo Archivo Origen  : "%BACKUP_FILE%"
echo Archivo Destino : "%~dp0crm_local.db"
echo.
set /p CONFIRM="¿Deseas reemplazar la base de datos activa crm_local.db? (S/N): "

if /i not "%CONFIRM%"=="S" (
    echo.
    echo Operación cancelada por el usuario.
    pause
    exit /b 0
)

echo.
echo [3/3] Copiando base de datos y reemplazando crm_local.db...
copy /Y "%BACKUP_FILE%" "%~dp0crm_local.db" > nul

if %ERRORLEVEL% EQU 0 (
    color 0A
    echo.
    echo ==============================================================================
    echo ¡RESTAURACIÓN COMPLETADA CON ÉXITO!
    echo.
    echo La base de datos crm_local.db ha sido restaurada correctamente desde:
    echo "%BACKUP_FILE%"
    echo.
    echo Puedes volver a encender el sistema ejecutando PRENDER_SERVIDOR.bat
    echo ==============================================================================
) else (
    color 0C
    echo.
    echo [ERROR] No se pudo copiar la base de datos. Verifica que el servidor este apagado.
)

echo.
pause
