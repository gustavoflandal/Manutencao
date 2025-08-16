# Script para inicializar o sistema de manutenção de forma limpa
# Resolve problemas de portas bloqueadas

Write-Host "🔧 Iniciando Sistema de Manutenção..." -ForegroundColor Cyan
Write-Host ""

# Função para matar processos em uma porta específica
function Kill-ProcessOnPort {
    param([int]$Port)
    
    $processes = netstat -ano | findstr ":$Port"
    if ($processes) {
        Write-Host "🔍 Encontrados processos na porta $Port, finalizando..." -ForegroundColor Yellow
        foreach ($line in $processes) {
            $trimmed = $line.Trim()
            if ($trimmed -match '\s+(\d+)$') {
                $pid = $matches[1]
                try {
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                    Write-Host "  ✅ Processo $pid finalizado" -ForegroundColor Green
                } catch {
                    Write-Host "  ⚠️  Não foi possível finalizar processo $pid" -ForegroundColor Red
                }
            }
        }
        Start-Sleep -Seconds 2
    }
}

# Matar processos nas portas 3001 e 3002
Write-Host "🧹 Limpando portas..." -ForegroundColor Yellow
Kill-ProcessOnPort -Port 3001
Kill-ProcessOnPort -Port 3002

# Verificar se as portas estão livres
Write-Host "🔍 Verificando portas..." -ForegroundColor Yellow
$port3001 = netstat -ano | findstr ":3001"
$port3002 = netstat -ano | findstr ":3002"

if ($port3001) {
    Write-Host "❌ Porta 3001 ainda ocupada!" -ForegroundColor Red
    exit 1
}

if ($port3002) {
    Write-Host "❌ Porta 3002 ainda ocupada!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Portas livres!" -ForegroundColor Green
Write-Host ""

# Iniciar backend
Write-Host "🚀 Iniciando Backend (porta 3001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm start" -WindowStyle Normal

# Aguardar um pouco para o backend inicializar
Start-Sleep -Seconds 3

# Iniciar frontend
Write-Host "🎨 Iniciando Frontend (porta 3002)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev" -WindowStyle Normal

# Aguardar inicialização
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🎉 Sistema inicializado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 URLs de acesso:" -ForegroundColor Cyan
Write-Host "   🔗 Frontend: http://localhost:3002" -ForegroundColor White
Write-Host "   🔗 Backend:  http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "👤 Credenciais de Administrador:" -ForegroundColor Cyan
Write-Host "   📧 Email: admin@sistema.com" -ForegroundColor White
Write-Host "   🔑 Senha: 123456" -ForegroundColor White
Write-Host ""
Write-Host "💡 Dica: Para parar o sistema, feche as janelas do PowerShell dos serviços." -ForegroundColor Yellow
Write-Host ""

# Tentar abrir o navegador
try {
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:3002"
    Write-Host "🌐 Navegador aberto automaticamente!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Abra manualmente: http://localhost:3002" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Script concluído! Sistema rodando..." -ForegroundColor Green
