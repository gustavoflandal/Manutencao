@echo off
echo === INICIANDO SERVIDOR BACKEND ===
cd /d "c:\Manutencao\backend"
echo Verificando se porta 3000 esta livre...
netstat -ano | findstr :3000
echo.
echo Iniciando node server.js na porta 3000...
node server.js
pause