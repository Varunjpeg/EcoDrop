@echo off
REM ════════════════════════════════════════════════════════════
REM  EcoDrop-CA — Build app + package everything for Pi
REM  Run this on LAPTOP. Then copy the pi\ folder to Pi.
REM ════════════════════════════════════════════════════════════

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   EcoDrop-CA — Deploy Builder            ║
echo  ╚══════════════════════════════════════════╝
echo.

REM Step 1: Build React app (Pi URL doesn't matter — BLE is primary)
echo [1/3] Building React app (PWA)...
cd mobile
call npm run build
if errorlevel 1 (
    echo BUILD FAILED! Check errors above.
    pause
    exit /b 1
)
cd ..
echo       ✅ Build complete!

REM Step 2: Copy dist/ into pi/dist/
echo [2/3] Copying dist/ into pi\dist\...
if exist "pi\dist" rmdir /s /q "pi\dist"
xcopy /E /I /Q "mobile\dist" "pi\dist"
echo       ✅ Web app ready in pi\dist\

REM Step 3: Print instructions
echo [3/3] Done!
echo.
echo  ════════════════════════════════════════════════════════════
echo   Next: Copy the pi\ folder to your Raspberry Pi 5
echo.
echo   Option A — USB Drive:
echo     Copy pi\ folder to USB, plug into Pi
echo     cd /media/pi/USBDRIVE/pi
echo     bash start.sh
echo.
echo   Option B — SSH (Pi on same WiFi as laptop):
echo     scp -r pi\ pi@^<PI_IP^>:~/ecodrop
echo     ssh pi@^<PI_IP^> "bash ~/ecodrop/start.sh"
echo.
echo   Option C — Git:
echo     git add . ^&^& git commit -m "deploy" ^&^& git push
echo     (on Pi) git pull ^&^& bash start.sh
echo.
echo   ════════════════════════════════════════════════════════════
echo   PHONE SETUP (one-time):
echo   1. Open Chrome on Android
echo   2. Go to chrome://flags
echo   3. Search "Experimental Web Platform features" → Enable
echo   4. Relaunch Chrome
echo   5. Open EcoDrop app → Scan → Connect via Bluetooth
echo   6. Select "EcoDrop-Machine" from picker
echo  ════════════════════════════════════════════════════════════
echo.
pause
