@echo off
echo Compiling Smart Waste Collection C Backend Server...
gcc -O2 server.c router.c db.c cJSON.c -o server.exe -lws2_32
if %errorlevel% equ 0 (
    echo Compilation Successful! Server binary generated: server.exe
) else (
    echo Compilation Failed! Please check gcc errors above.
)
