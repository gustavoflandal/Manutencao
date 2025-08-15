# Script para parar o sistema de manutenção
Write-Host "🛑 Parando Sistema de Manutenção..." -ForegroundColor Red
Write-Host ""

# Parar todos os processos Node.js
Write-Host "🧹 Finalizando processos Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    foreach ($process in $nodeProcesses) {
        try {
            Write-Host "  🔪 Finalizando processo Node.js (PID: $($process.Id))" -ForegroundColor Yellow
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        } catch {
            # Ignorar erros
        }
    }
    Write-Host "✅ Processos finalizados!" -ForegroundColor Green
} else {
    Write-Host "ℹ️ Nenhum processo Node.js encontrado" -ForegroundColor Cyan
}

# Aguardar
Start-Sleep -Seconds 2

# Verificar se portas foram liberadas
Write-Host ""
Write-Host "🔍 Verificando portas..." -ForegroundColor Cyan
$port3001 = netstat -ano | findstr ":3001"
$port3002 = netstat -ano | findstr ":3002"

if (-not $port3001 -and -not $port3002) {
    Write-Host "✅ Sistema parado com sucesso!" -ForegroundColor Green
    Write-Host "✅ Todas as portas liberadas!" -ForegroundColor Green
} else {
    if ($port3001) {
        Write-Host "⚠️ Porta 3001 ainda ocupada" -ForegroundColor Yellow
    }
    if ($port3002) {
        Write-Host "⚠️ Porta 3002 ainda ocupada" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎯 Para reiniciar: .\start.ps1" -ForegroundColor Cyan
