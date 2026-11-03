@echo off
echo ============================================
echo  EcoDrop-CA — Firewall Setup (Run as Admin)
echo ============================================
echo.

REM Allow Web App (Vite dev server)
netsh advfirewall firewall delete rule name="EcoDrop App Port 5173" >nul 2>&1
netsh advfirewall firewall add rule name="EcoDrop App Port 5173" dir=in action=allow protocol=TCP localport=5173
echo [OK] Port 5173 (Web App) opened

REM Allow Mock Pi Server
netsh advfirewall firewall delete rule name="EcoDrop Pi Port 8000" >nul 2>&1
netsh advfirewall firewall add rule name="EcoDrop Pi Port 8000" dir=in action=allow protocol=TCP localport=8000
echo [OK] Port 8000 (Pi Server) opened

echo.
echo ============================================
echo  Done! Now open on your phone:
echo  http://172.20.157.59:5173
echo ============================================
pause
