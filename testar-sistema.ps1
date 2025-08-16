# Script de Teste do Sistema de Manutenção
Write-Host "🧪 Testando Sistema de Manutenção..." -ForegroundColor Cyan
Write-Host ""

# Testar se backend está respondendo
Write-Host "🔍 Testando Backend (porta 3001)..." -ForegroundColor Yellow
try {
    $body = '{"email":"admin@sistema.com","senha":"123456"}'
    $headers = @{"Content-Type" = "application/json"}
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $body -Headers $headers
    
    if ($response.success) {
        Write-Host "✅ Backend funcionando - Login OK" -ForegroundColor Green
        Write-Host "👤 Usuário: $($response.data.user.nome)" -ForegroundColor White
        Write-Host "🔑 Perfil: $($response.data.user.perfil)" -ForegroundColor White
        
        # Testar se usuário é admin
        if ($response.data.user.perfil -eq "administrador") {
            Write-Host "✅ Usuário tem perfil de Administrador - Botão deve aparecer!" -ForegroundColor Green
        } else {
            Write-Host "❌ Usuário NÃO é administrador - Botão não deve aparecer" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Backend com erro no login" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend não está respondendo na porta 3001" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Testar se frontend está respondendo
Write-Host "🔍 Testando Frontend (porta 3002)..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3002" -Method Get -TimeoutSec 5
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend respondendo na porta 3002" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend não está respondendo na porta 3002" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Resumo do Teste:" -ForegroundColor Cyan
Write-Host "   🔗 Frontend: http://localhost:3002" -ForegroundColor White
Write-Host "   🔗 Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "   👤 Login: admin@sistema.com" -ForegroundColor White
Write-Host "   🔑 Senha: 123456" -ForegroundColor White
Write-Host ""
Write-Host "💡 Se o backend está OK mas o frontend não mostra o botão:" -ForegroundColor Yellow
Write-Host "   1. Limpe o cache do navegador (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "   2. Ou teste em modo incógnito (Ctrl+Shift+N)" -ForegroundColor White
Write-Host "   3. Verifique o console do navegador (F12)" -ForegroundColor White
