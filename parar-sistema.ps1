#!/usr/bin/env pwsh

# Script para parar o sistema de manutenção completamente

Write-Host "🛑 Parando Sistema de Manutenção..." -ForegroundColor Red
Write-Host ""

# Função para matar processos em uma porta específica
function Kill-ProcessOnPort {
    param([int]$Port, [string]$ServiceName)
    
    Write-Host "🔍 Verificando $ServiceName (porta $Port)..." -ForegroundColor Yellow
    $processes = netstat -ano | findstr ":$Port"
    if ($processes) {
        Write-Host "  📍 Encontrados processos na porta $Port" -ForegroundColor Cyan
        $processes | ForEach-Object {
            $line = $_.Trim()
            if ($line -match '\s+(\d+)$') {
                $pid = $matches[1]
                try {
                    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-Host "  🔪 Finalizando processo: $($process.ProcessName) (PID: $pid)" -ForegroundColor Yellow
                        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                        Write-Host "  ✅ Processo finalizado com sucesso" -ForegroundColor Green
                    }
                } catch {
                    Write-Host "  ⚠️  Erro ao finalizar processo $pid" -ForegroundColor Red
                }
            }
        }
    } else {
        Write-Host "  ✅ Nenhum processo encontrado na porta $Port" -ForegroundColor Green
    }
}

# Matar todos os processos Node.js relacionados
Write-Host "🧹 Finalizando todos os processos Node.js do sistema..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | ForEach-Object {
        try {
            Write-Host "  🔪 Finalizando Node.js (PID: $($_.Id))" -ForegroundColor Yellow
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        } catch {
            # Ignorar erros
        }
    }
}

# Verificar e parar processos específicos nas portas
Kill-ProcessOnPort -Port 3001 -ServiceName "Backend"
Kill-ProcessOnPort -Port 3002 -ServiceName "Frontend"

# Aguardar um momento
Start-Sleep -Seconds 2

# Verificação final
Write-Host ""
Write-Host "🔍 Verificação final..." -ForegroundColor Cyan
$port3001 = netstat -ano | findstr ":3001"
$port3002 = netstat -ano | findstr ":3002"

if (-not $port3001 -and -not $port3002) {
    Write-Host "✅ Sistema parado com sucesso!" -ForegroundColor Green
    Write-Host "✅ Todas as portas foram liberadas!" -ForegroundColor Green
} else {
    if ($port3001) {
        Write-Host "⚠️  Porta 3001 ainda ocupada" -ForegroundColor Yellow
    }
    if ($port3002) {
        Write-Host "⚠️  Porta 3002 ainda ocupada" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "💡 Se o problema persistir, reinicie o computador." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 Para reiniciar o sistema, execute: .\iniciar-sistema.ps1" -ForegroundColor Cyan
Write-Host ""
