@echo off
title AutoCRM PRO MVP 3 - Detector de IP Red Local

echo ==============================================================================
echo             AUTOCRM PRO MVP 3 - DETECTOR DE IP EN RED LOCAL (LAN)
echo ==============================================================================
echo.

for /f "tokens=*" %%a in ('powershell -Command "(Get-NetIPAddress -AddressFamily IPv4 -Type Unicast | Where-Object { $_.InterfaceAlias -notlike '*Loopback*' -and $_.InterfaceAlias -notlike '*vEthernet*' -and $_.IPAddress -notlike '169.254*' }).IPAddress | Select-Object -First 1"') do (
    set LOCAL_IP=%%a
)

if "%LOCAL_IP%"=="" set LOCAL_IP=192.168.1.X

echo IP de esta computadora Servidor: %LOCAL_IP%
echo.
echo ------------------------------------------------------------------------------
echo URL PARA CONECTAR DESDE OTRAS COMPUTADORAS EN LA MISMA RED LAN:
echo.
echo     http://%LOCAL_IP%:5173
echo ------------------------------------------------------------------------------
echo.

set /p ABRIR_FIREWALL="Desea agregar la regla de permiso en el Firewall de Windows? (S/N): "

if /i "%ABRIR_FIREWALL%"=="S" (
    echo Intentando agregar regla en Firewall de Windows...
    powershell -Command "Start-Process netsh -ArgumentList 'advfirewall firewall add rule name=\"AutoCRM_PRO_5173\" dir=in action=allow protocol=TCP localport=5173' -Verb RunAs"
    echo Solicitud enviada al Firewall.
)

echo.
pause
