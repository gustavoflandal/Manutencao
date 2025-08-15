@echo off
echo ========================================
echo  INICIANDO SISTEMA DE MANUTENCAO
echo ========================================
echo.

echo 🛑 Parando processos anteriores...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo 🚀 Iniciando Backend (porta 3001)...
cd /d "d:\Manutencao\backend"
start "Backend" cmd /k "npm start"
timeout /t 5

echo 🌐 Iniciando Frontend (porta 3002)...
cd /d "d:\Manutencao\frontend"
start "Frontend" cmd /k "npm run dev"
timeout /t 3

echo.
echo ✅ Sistema iniciado com sucesso!
echo.
echo 📋 Credenciais de Administrador:
echo    Email: admin@sistema.com
echo    Senha: 123456
echo.
echo 🌐 Aguarde alguns segundos e acesse:
echo    http://localhost:3002
echo.
echo ⚠️  Mantenha as janelas do Backend e Frontend abertas!
echo.
pause
