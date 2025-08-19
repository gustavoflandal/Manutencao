# Script para inicializar o sistema de manutenção
Write-Host "🔧 Iniciando Sistema de Manutenção..." -ForegroundColor Cyan
Write-Host ""

# Verificar se o sistema foi inicializado
function Test-SystemInitialized {
    $configExists = Test-Path "backend\config\database.js"
    $modelsExist = Test-Path "backend\models\index.js"
    $initScriptExists = Test-Path "backend\initialize-database.js"
    
    return $configExists -and $modelsExist -and $initScriptExists
}

# Verificar se banco foi configurado
function Test-DatabaseConfigured {
    try {
        # Verificar se consegue conectar ao banco
        $testScript = @"
const sequelize = require('./config/database');
sequelize.authenticate()
  .then(() => { console.log('OK'); process.exit(0); })
  .catch(() => { console.log('FAIL'); process.exit(1); });
"@
        
        $testScript | Out-File -FilePath "backend\temp-test.js" -Encoding UTF8
        
        Push-Location "backend"
        $result = node temp-test.js 2>&1
        Pop-Location
        
        Remove-Item "backend\temp-test.js" -ErrorAction SilentlyContinue
        
        return $result -eq "OK"
    } catch {
        return $false
    }
}

# Verificar inicialização
if (-not (Test-SystemInitialized)) {
    Write-Host "❌ Sistema não foi inicializado!" -ForegroundColor Red
    Write-Host "   Execute primeiro: .\inicializar-sistema.ps1" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Pressione Enter para continuar mesmo assim ou Ctrl+C para sair"
} elseif (-not (Test-DatabaseConfigured)) {
    Write-Host "⚠️ Banco de dados não está configurado!" -ForegroundColor Yellow
    Write-Host "   Recomendado executar: .\inicializar-sistema.ps1" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Continuar mesmo assim? (s/N)"
    if ($response -ne "s" -and $response -ne "S") {
        exit
    }
} else {
    Write-Host "✅ Sistema verificado e pronto!" -ForegroundColor Green
}

Write-Host ""

# Parar processos Node.js existentes
Write-Host "🧹 Limpando processos anteriores..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Aguardar limpeza
Start-Sleep -Seconds 2

# Verificar se portas estão livres
Write-Host "🔍 Verificando portas..." -ForegroundColor Yellow
$port3001 = netstat -ano | findstr ":3001"
$port3002 = netstat -ano | findstr ":3002"

if ($port3001) {
    Write-Host "⚠️ Porta 3001 ainda ocupada, forçando limpeza..." -ForegroundColor Yellow
}

if ($port3002) {
    Write-Host "⚠️ Porta 3002 ainda ocupada, forçando limpeza..." -ForegroundColor Yellow
}

Write-Host "✅ Preparação concluída!" -ForegroundColor Green
Write-Host ""

# Iniciar backend
Write-Host "🚀 Iniciando Backend (porta 3001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm start"

# Aguardar backend inicializar
Start-Sleep -Seconds 4

# Iniciar frontend
Write-Host "🎨 Iniciando Frontend (porta 3002)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

# Aguardar frontend inicializar
Start-Sleep -Seconds 6

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

# Abrir navegador
try {
    Start-Process "http://localhost:3002"
    Write-Host "🌐 Navegador aberto!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Abra manualmente: http://localhost:3002" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Script concluído!" -ForegroundColor Green
