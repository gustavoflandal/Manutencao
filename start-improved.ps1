# Script melhorado para inicializar o sistema de manutenção
Write-Host "🔧 Iniciando Sistema de Manutenção (Versão Melhorada)..." -ForegroundColor Cyan
Write-Host ""

# Verificar se o sistema foi inicializado
function Test-SystemInitialized {
    $configExists = Test-Path "backend\config\database.js"
    $modelsExist = Test-Path "backend\models\index.js"
    $initScriptExists = Test-Path "backend\initialize-database.js"
    
    return $configExists -and $modelsExist -and $initScriptExists
}

# Parar processos Node.js existentes
Write-Host "🧹 Limpando processos anteriores..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Verificar inicialização
if (-not (Test-SystemInitialized)) {
    Write-Host "❌ Sistema não foi inicializado!" -ForegroundColor Red
    Write-Host "   Execute primeiro: .\inicializar-sistema.ps1" -ForegroundColor Yellow
    Read-Host "Pressione Enter para continuar"
    exit
}

Write-Host "✅ Sistema verificado!" -ForegroundColor Green
Write-Host ""

# Criar script temporário para backend
$backendScript = @"
Set-Location '$PSScriptRoot\backend'
Write-Host '🚀 Backend iniciando...' -ForegroundColor Green
npm start
Write-Host '❌ Backend parou!' -ForegroundColor Red
Read-Host 'Pressione Enter para fechar'
"@

$backendScript | Out-File -FilePath "temp-backend.ps1" -Encoding UTF8

# Criar script temporário para frontend
$frontendScript = @"
Set-Location '$PSScriptRoot\frontend'
Write-Host '🎨 Frontend iniciando...' -ForegroundColor Green
npm run dev
Write-Host '❌ Frontend parou!' -ForegroundColor Red
Read-Host 'Pressione Enter para fechar'
"@

$frontendScript | Out-File -FilePath "temp-frontend.ps1" -Encoding UTF8

try {
    # Iniciar backend
    Write-Host "🚀 Iniciando Backend..." -ForegroundColor Cyan
    $backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$PSScriptRoot\temp-backend.ps1" -PassThru
    
    # Aguardar backend inicializar
    Start-Sleep -Seconds 6
    
    # Iniciar frontend
    Write-Host "🎨 Iniciando Frontend..." -ForegroundColor Cyan
    $frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$PSScriptRoot\temp-frontend.ps1" -PassThru
    
    # Aguardar frontend inicializar
    Start-Sleep -Seconds 4
    
    Write-Host ""
    Write-Host "🎉 Sistema inicializado!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 URLs de acesso:" -ForegroundColor Cyan
    Write-Host "   🔗 Frontend: http://localhost:3002" -ForegroundColor White
    Write-Host "   🔗 Backend:  http://localhost:3001" -ForegroundColor White
    Write-Host ""
    Write-Host "👤 Credenciais:" -ForegroundColor Cyan
    Write-Host "   📧 Email: admin@sistema.com" -ForegroundColor White
    Write-Host "   🔑 Senha: 123456" -ForegroundColor White
    Write-Host ""
    
    # Verificar se os processos estão rodando
    Start-Sleep -Seconds 2
    $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "✅ Processos Node.js detectados: $($nodeProcesses.Count)" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Nenhum processo Node.js detectado - pode haver problema" -ForegroundColor Yellow
    }
    
    # Abrir navegador
    try {
        Start-Process "http://localhost:3002"
        Write-Host "🌐 Navegador aberto!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Abra manualmente: http://localhost:3002" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "ℹ️ Os serviços estão rodando em janelas separadas do PowerShell" -ForegroundColor Cyan
    Write-Host "   Para parar, feche as janelas ou use Ctrl+C nelas" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Erro ao iniciar serviços: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Limpar scripts temporários após um tempo
    Start-Sleep -Seconds 5
    Remove-Item "temp-backend.ps1" -ErrorAction SilentlyContinue
    Remove-Item "temp-frontend.ps1" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "✅ Script concluído!" -ForegroundColor Green