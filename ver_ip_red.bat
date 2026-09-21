@echo off
chcp 65001 > nul
title AutoCRM PRO MVP 3 - Configuración de Red Local (LAN)

echo ==============================================================================
echo             AUTOCRM PRO MVP 3 - DETECTOR DE IP EN RED LOCAL (LAN)
echo ==============================================================================
echo.

:: Obtener la IP IPv4 activa mediante PowerShell
for /f "tokens=*" %%a in ('powershell -Command "(Get-NetIPAddress -AddressFamily IPv4 -Type Unicast | Where-Object { $_.InterfaceAlias -notlike '*Loopback*' -and $_.InterfaceAlias -notlike '*vEthernet*' -and $_.IPAddress -notlike '169.254*' }).IPAddress | Select-Object -First 1"') do (
    set LOCAL_IP=%%a
)

if "%LOCAL_IP%"=="" (
    set LOCAL_IP=192.168.1.X
)

echo 📌 IP de esta computadora Servidor: %LOCAL_IP%
echo.
echo ------------------------------------------------------------------------------
echo 🌐 URL PARA CONECTAR DESDE OTRAS COMPUTADORAS O TABLETS EN LA MISMA RED LAN:
echo.
echo     👉 http://%LOCAL_IP%:5173
echo ------------------------------------------------------------------------------
echo.
echo (Ingresa esa dirección desde el navegador Chrome/Edge en las terminales de los vendedores)
echo.

echo ==============================================================================
echo HABILITAR REGLA EN FIREWALL DE WINDOWS
echo ==============================================================================
echo Si las otras computadoras no pueden conectarse, es necesario abrir el puerto 5173.
echo.
set /p ABRIR_FIREWALL="¿Desea agregar la regla de permiso en el Firewall de Windows ahora? (S/N): "

if /i "%ABRIR_FIREWALL%"=="S" (
    echo.
    echo Intentando agregar regla en Firewall (se requerirán permisos de Administrador)...
    powershell -Command "Start-Process netsh -ArgumentList 'advfirewall firewall add rule name=\"AutoCRM_PRO_5173\" dir=in action=allow protocol=TCP localport=5173' -Verb RunAs"
    echo.
    echo ✅ Solicitud enviada. Si aceptó el cartel de Administrador, el puerto 5173 ya está abierto.
)

echo.
pause
