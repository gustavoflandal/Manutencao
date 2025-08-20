# Script de Monitoramento e Auto-Restart
Write-Host "🔍 Iniciando Monitoramento do Sistema..." -ForegroundColor Cyan

function Test-ServiceRunning {
    param($Port, $ServiceName)
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
        return $true
    } catch {
        return $false
    }
}

function Start-Backend {
    Write-Host "🚀 Iniciando Backend..." -ForegroundColor Yellow
    $backendScript = @"
Set-Location '$PSScriptRoot\backend'
npm start
"@
    $backendScript | Out-File -FilePath "temp-backend-monitor.ps1" -Encoding UTF8
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$PSScriptRoot\temp-backend-monitor.ps1"
}

function Start-Frontend {
    Write-Host "🎨 Iniciando Frontend..." -ForegroundColor Yellow
    $frontendScript = @"
Set-Location '$PSScriptRoot\frontend'
npm run dev
"@
    $frontendScript | Out-File -FilePath "temp-frontend-monitor.ps1" -Encoding UTF8
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$PSScriptRoot\temp-frontend-monitor.ps1"
}

# Iniciar serviços se não estiverem rodando
if (-not (Test-ServiceRunning 3001 "Backend")) {
    Write-Host "❌ Backend não está rodando - iniciando..." -ForegroundColor Red
    Start-Backend
    Start-Sleep -Seconds 8
}

if (-not (Test-ServiceRunning 3003 "Frontend")) {
    Write-Host "❌ Frontend não está rodando - iniciando..." -ForegroundColor Red
    Start-Frontend
    Start-Sleep -Seconds 5
}

# Loop de monitoramento
$checkCount = 0
while ($true) {
    $checkCount++
    Clear-Host
    
    Write-Host "🔍 Monitoramento Sistema - Verificação #$checkCount" -ForegroundColor Cyan
    Write-Host "⏰ $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
    Write-Host ""
    
    # Verificar Backend
    if (Test-ServiceRunning 3001 "Backend") {
        Write-Host "✅ Backend (3001): ATIVO" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend (3001): INATIVO - Reiniciando..." -ForegroundColor Red
        Start-Backend
        Start-Sleep -Seconds 8
    }
    
    # Verificar Frontend
    if (Test-ServiceRunning 3003 "Frontend") {
        Write-Host "✅ Frontend (3003): ATIVO" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend (3003): INATIVO - Reiniciando..." -ForegroundColor Red
        Start-Frontend
        Start-Sleep -Seconds 5
    }
    
    # Verificar processos Node
    $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
    Write-Host "📊 Processos Node ativos: $($nodeProcesses.Count)" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "💡 URLs do Sistema:" -ForegroundColor Yellow
    Write-Host "   🔗 Frontend: http://localhost:3003" -ForegroundColor White
    Write-Host "   🔗 Backend:  http://localhost:3001" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️ Pressione Ctrl+C para parar o monitoramento" -ForegroundColor Yellow
    
    # Aguardar 30 segundos antes da próxima verificação
    Start-Sleep -Seconds 30
}