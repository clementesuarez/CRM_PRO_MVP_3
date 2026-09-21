@echo off
chcp 65001 > nul
title RESTAURACIÓN SEGURA DE BASE DE DATOS - AUTOCRM PRO
color 0B

echo ==============================================================================
echo        AUTOCRM PRO - SCRIPT DE RESTAURACIÓN SEGURA DE BASE SQLITE
echo ==============================================================================
echo.

:: 1. Verificación de proceso activo
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    color 0C
    echo [ALERTA] Se detecto que el servidor Node.js sigue en ejecucion.
    echo Por favor, cierra la ventana de PRENDER_SERVIDOR.bat antes de continuar.
    echo.
    pause
    exit /b 1
)

:: 2. Captura y limpieza de ruta del archivo
set "BACKUP_FILE="
set /p BACKUP_FILE="Arrastra aqui el archivo de respaldo (.db) o pega su ruta: "

:: Remover comillas iniciales/finales
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

:: Verificar extensión .db
if /i not "%BACKUP_FILE:~-3%"==".db" (
    color 0E
    echo.
    echo [ADVERTENCIA] El archivo no tiene extension .db. Asegurate de que sea un respaldo valido.
    echo.
)

echo.
echo ==============================================================================
echo [RESUMEN DE OPERACION]
echo  - Archivo Origen (Copia) : "%BACKUP_FILE%"
echo  - Base Destino (Activa)  : "%~dp0crm_local.db"
echo ==============================================================================
echo.
set /p CONFIRM="¿Deseas proceder con el reemplazo de la base de datos? (S/N): "

if /i not "%CONFIRM%"=="S" (
    echo.
    echo Operacion cancelada por el usuario. No se realizo ningun cambio.
    pause
    exit /b 0
)

:: 3. Backup de rescate preventivo (Safety Net)
if exist "%~dp0crm_local.db" (
    if not exist "%~dp0backups" mkdir "%~dp0backups"
    set "STAMP=%DATE:~6,4%%DATE:~3,2%%DATE:~0,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%"
    set "STAMP=%STAMP: =0%"
    copy /Y "%~dp0crm_local.db" "%~dp0backups\pre_restore_backup_%STAMP%.db" > nul
    echo.
    echo [*] Copia de seguridad preventiva creada en carpeta /backups.
)

:: 4. Limpieza de archivos temporales SQLite (WAL / Journal)
if exist "%~dp0crm_local.db-wal" del /F /Q "%~dp0crm_local.db-wal" > nul 2>&1
if exist "%~dp0crm_local.db-shm" del /F /Q "%~dp0crm_local.db-shm" > nul 2>&1
if exist "%~dp0crm_local.db-journal" del /F /Q "%~dp0crm_local.db-journal" > nul 2>&1

:: 5. Copia definitiva
copy /Y "%BACKUP_FILE%" "%~dp0crm_local.db" > nul

if %ERRORLEVEL% EQU 0 (
    color 0A
    echo.
    echo ==============================================================================
    echo ¡RESTAURACIÓN COMPLETADA CON ÉXITO!
    echo.
    echo La base crm_local.db ha sido restaurada correctamente.
    echo Ya puedes volver a iniciar el sistema con PRENDER_SERVIDOR.bat.
    echo ==============================================================================
) else (
    color 0C
    echo.
    echo [ERROR CRITICO] Fallo la copia del archivo.
    echo Verifica permisos de Windows o si otro programa tiene abierto crm_local.db.
)

echo.
pause