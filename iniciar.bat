@echo off
chcp 65001 >nul
title Cafetería CLEO - Iniciador

:: Ir al directorio del script
cd /d "%~dp0"

echo ========================================
echo    Cafetería CLEO - Iniciando sistema
echo ========================================
echo.

:: Iniciar backend (la ventana hereda el directorio backend)
cd /d "%~dp0backend"
echo [1/2] Iniciando Backend (FastAPI en http://localhost:8000)...
start "Cafetería CLEO - Backend" cmd /k "python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Pequeña pausa para que el backend arranque primero
timeout /t 3 /nobreak >nul

:: Iniciar frontend (la ventana hereda el directorio frontend)
cd /d "%~dp0frontend"
echo [2/2] Iniciando Frontend (Vite en http://localhost:5173)...
start "Cafetería CLEO - Frontend" cmd /k "npm run dev 2>nul || npx vite"

echo.
echo ========================================
echo   Sistema iniciado correctamente
echo ========================================
echo.
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo   Frontend: http://localhost:5173
echo.
echo   Usuario: admin@cafeteria.local
echo   Clave:   admin123
echo.
echo   Cierra las ventanas del backend y frontend
echo   para detener el sistema.
echo ========================================
pause
