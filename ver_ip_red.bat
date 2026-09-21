@echo off
title AutoCRM PRO MVP 3 - Detector de IP Red Local

echo ==============================================================================
echo             AUTOCRM PRO MVP 3 - DETECTOR DE IP EN RED LOCAL (LAN)
echo ==============================================================================
echo.

for /f "tokens=*" %%a in ('powershell -Command "(Test-Connection -ComputerName $env:COMPUTERNAME -Count 1).IPV4Address.IPAddressToString"') do (
    set LOCAL_IP=%%a
)

if "%LOCAL_IP%"=="" set LOCAL_IP=192.168.1.73

echo IP Real de tu Computadora en la Red Wi-Fi: %LOCAL_IP%
echo.
echo ------------------------------------------------------------------------------
echo INGRESA ESTA DIRECCION EXACTA EN SAFARI / CHROME DE TU CELULAR (MISMO WI-FI):
echo.
echo     http://%LOCAL_IP%:5173
echo ------------------------------------------------------------------------------
echo.

pause
