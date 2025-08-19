# Script de Inicialização do Sistema de Manutenção
# Executa a configuração completa do banco de dados e dados iniciais

param(
    [switch]$Force,        # Força reinicialização mesmo se dados existirem
    [switch]$Verbose,      # Mostra logs detalhados
    [switch]$SkipCheck     # Pula verificações iniciais
)

# Configurações
$ErrorActionPreference = "Stop"
$BackendPath = ".\backend"
$LogPath = ".\logs"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Cores para output
function Write-ColorOutput {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

function Write-Success {
    param([string]$Text)
    Write-ColorOutput "✅ $Text" "Green"
}

function Write-Info {
    param([string]$Text)
    Write-ColorOutput "ℹ️  $Text" "Cyan"
}

function Write-Warning {
    param([string]$Text)
    Write-ColorOutput "⚠️  $Text" "Yellow"
}

function Write-Error {
    param([string]$Text)
    Write-ColorOutput "❌ $Text" "Red"
}

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-ColorOutput "=" * 60 "Magenta"
    Write-ColorOutput "🔧 $Text" "Magenta"
    Write-ColorOutput "=" * 60 "Magenta"
}

# Verificar se está no diretório correto
function Test-ProjectStructure {
    Write-Info "Verificando estrutura do projeto..."
    
    $requiredPaths = @(
        ".\backend\package.json",
        ".\backend\server.js",
        ".\backend\models",
        ".\backend\config\database.js"
    )
    
    foreach ($path in $requiredPaths) {
        if (-not (Test-Path $path)) {
            Write-Error "Arquivo/diretório obrigatório não encontrado: $path"
            Write-Error "Certifique-se de estar no diretório raiz do projeto"
            exit 1
        }
    }
    
    Write-Success "Estrutura do projeto verificada"
}

# Verificar Node.js e dependências
function Test-Dependencies {
    Write-Info "Verificando dependências..."
    
    # Verificar Node.js
    try {
        $nodeVersion = node --version 2>$null
        Write-Success "Node.js encontrado: $nodeVersion"
    } catch {
        Write-Error "Node.js não encontrado. Instale o Node.js primeiro."
        exit 1
    }
    
    # Verificar npm
    try {
        $npmVersion = npm --version 2>$null
        Write-Success "npm encontrado: $npmVersion"
    } catch {
        Write-Error "npm não encontrado."
        exit 1
    }
    
    # Verificar se package.json existe
    if (-not (Test-Path ".\backend\package.json")) {
        Write-Error "package.json não encontrado no backend"
        exit 1
    }
    
    Write-Success "Dependências verificadas"
}

# Criar diretórios necessários
function New-RequiredDirectories {
    Write-Info "Criando diretórios necessários..."
    
    $directories = @(
        ".\logs",
        ".\backend\logs",
        ".\uploads",
        ".\temp"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Success "Diretório criado: $dir"
        }
    }
}

# Instalar dependências do backend
function Install-BackendDependencies {
    Write-Info "Instalando dependências do backend..."
    
    Push-Location $BackendPath
    
    try {
        # Verificar se node_modules existe
        if (-not (Test-Path "node_modules") -or $Force) {
            Write-Info "Instalando pacotes npm..."
            npm install
            
            if ($LASTEXITCODE -ne 0) {
                throw "Erro ao instalar dependências"
            }
            
            Write-Success "Dependências do backend instaladas"
        } else {
            Write-Info "Dependências já instaladas (use -Force para reinstalar)"
        }
        
        # Verificar dependências críticas
        $criticalDeps = @("sequelize", "mysql2", "bcryptjs", "express")
        
        foreach ($dep in $criticalDeps) {
            if (-not (Test-Path "node_modules\$dep")) {
                Write-Warning "Dependência crítica não encontrada: $dep"
                npm install $dep --save
            }
        }
        
    } catch {
        Write-Error "Erro ao instalar dependências: $_"
        exit 1
    } finally {
        Pop-Location
    }
}

# Verificar configuração do banco de dados
function Test-DatabaseConfig {
    Write-Info "Verificando configuração do banco de dados..."
    
    # Verificar arquivo .env
    if (Test-Path ".env") {
        Write-Info "Arquivo .env encontrado"
        
        # Ler variáveis do .env
        $envContent = Get-Content ".env" | Where-Object { $_ -match "^[^#].*=" }
        
        $dbVars = @("DB_HOST", "DB_USER", "DB_PASS", "DB_NAME")
        
        foreach ($var in $dbVars) {
            $found = $envContent | Where-Object { $_ -match "^$var=" }
            if ($found) {
                Write-Success "Variável encontrada: $var"
            } else {
                Write-Warning "Variável não encontrada: $var (usando padrão)"
            }
        }
    } else {
        Write-Warning "Arquivo .env não encontrado, usando configurações padrão"
        Write-Info "Criando arquivo .env básico..."
        
        $envContent = @"
# Configuração do Banco de Dados
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=root
DB_NAME=manutencao_db

# Configuração da Aplicação
NODE_ENV=development
PORT=3000
JWT_SECRET=seu_jwt_secret_aqui

# Configuração de Logs
LOG_LEVEL=info
"@
        
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
        Write-Success "Arquivo .env criado com configurações padrão"
        Write-Warning "⚠️  IMPORTANTE: Revise e ajuste as configurações no arquivo .env"
    }
}

# Executar inicialização do banco
function Start-DatabaseInitialization {
    Write-Header "INICIALIZAÇÃO DO BANCO DE DADOS"
    
    Push-Location $BackendPath
    
    try {
        Write-Info "Executando script de inicialização..."
        
        # Executar script de inicialização
        $output = node initialize-database.js 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Inicialização do banco concluída com sucesso!"
            
            if ($Verbose) {
                Write-Info "Output da inicialização:"
                Write-Host $output -ForegroundColor Gray
            }
            
            # Extrair informações importantes do output
            $adminEmail = "admin@sistema.com"
            $adminPassword = "123456"
            
            Write-Header "INFORMAÇÕES DE ACESSO"
            Write-ColorOutput "🌐 Sistema: http://localhost:3000" "Green"
            Write-ColorOutput "👤 Email Admin: $adminEmail" "Yellow"
            Write-ColorOutput "🔑 Senha Admin: $adminPassword" "Yellow"
            Write-ColorOutput "" "White"
            Write-Warning "⚠️  IMPORTANTE: Altere a senha do administrador após o primeiro login!"
            
        } else {
            Write-Error "Erro na inicialização do banco de dados"
            Write-Host $output -ForegroundColor Red
            exit 1
        }
        
    } catch {
        Write-Error "Erro ao executar inicialização: $_"
        exit 1
    } finally {
        Pop-Location
    }
}

# Executar testes básicos
function Test-SystemHealth {
    Write-Info "Executando testes básicos do sistema..."
    
    Push-Location $BackendPath
    
    try {
        # Testar conexão com banco
        Write-Info "Testando conexão com banco de dados..."
        
        $testScript = @"
const { initializeDatabase } = require('./initialize-database.js');
const sequelize = require('./config/database');

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexão com banco de dados OK');
        
        // Testar alguns modelos
        const models = require('./models');
        
        const userCount = await models.User.count();
        const departmentCount = await models.Department.count();
        const permissionCount = await models.Permission.count();
        
        console.log(`📊 Usuários: ${userCount}`);
        console.log(`🏢 Departamentos: ${departmentCount}`);
        console.log(`🔐 Permissões: ${permissionCount}`);
        
        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro nos testes:', error.message);
        process.exit(1);
    }
}

testConnection();
"@
        
        $testScript | Out-File -FilePath "test-connection.js" -Encoding UTF8
        
        $testOutput = node test-connection.js 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Testes básicos concluídos"
            if ($Verbose) {
                Write-Host $testOutput -ForegroundColor Gray
            }
        } else {
            Write-Warning "Alguns testes falharam:"
            Write-Host $testOutput -ForegroundColor Yellow
        }
        
        # Limpar arquivo de teste
        Remove-Item "test-connection.js" -ErrorAction SilentlyContinue
        
    } catch {
        Write-Warning "Erro ao executar testes: $_"
    } finally {
        Pop-Location
    }
}

# Criar script de backup dos dados iniciais
function New-BackupScript {
    Write-Info "Criando script de backup..."
    
    $backupScript = @"
#!/usr/bin/env node
/**
 * Script de Backup dos Dados Iniciais
 * Gera backup dos dados configurados na inicialização
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'root',
  database: process.env.DB_NAME || 'manutencao_db'
};

async function createBackup() {
  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup_inicial_${timestamp}.sql`;
    
    console.log('📦 Criando backup dos dados iniciais...');
    
    // Executar mysqldump (se disponível)
    const { exec } = require('child_process');
    const command = `mysqldump -h ${DB_CONFIG.host} -u ${DB_CONFIG.user} -p${DB_CONFIG.password} ${DB_CONFIG.database} > ${backupFile}`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log('⚠️  mysqldump não disponível, criando backup manual...');
        // Implementar backup manual se necessário
      } else {
        console.log(`✅ Backup criado: ${backupFile}`);
      }
    });
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error.message);
  }
}

if (require.main === module) {
  createBackup();
}

module.exports = { createBackup };
"@
    
    $backupScript | Out-File -FilePath ".\backend\backup-inicial.js" -Encoding UTF8
    Write-Success "Script de backup criado: .\backend\backup-inicial.js"
}

# Função principal
function Main {
    Write-Header "INICIALIZAÇÃO DO SISTEMA DE MANUTENÇÃO"
    
    Write-Info "Data/Hora: $(Get-Date)"
    Write-Info "Usuário: $env:USERNAME"
    Write-Info "Diretório: $(Get-Location)"
    
    if ($Verbose) {
        Write-Info "Modo verbose ativado"
    }
    
    if ($Force) {
        Write-Warning "Modo force ativado - dados existentes podem ser sobrescritos"
    }
    
    try {
        # Verificações iniciais
        if (-not $SkipCheck) {
            Test-ProjectStructure
            Test-Dependencies
        }
        
        # Preparação
        New-RequiredDirectories
        Test-DatabaseConfig
        Install-BackendDependencies
        
        # Inicialização
        Start-DatabaseInitialization
        
        # Testes
        Test-SystemHealth
        
        # Utilitários adicionais
        New-BackupScript
        
        # Conclusão
        Write-Header "INICIALIZAÇÃO CONCLUÍDA"
        Write-Success "Sistema de Manutenção inicializado com sucesso!"
        Write-Info ""
        Write-Info "📋 Próximos passos:"
        Write-Info "1. Inicie o backend: cd backend && npm start"
        Write-Info "2. Inicie o frontend: cd frontend && npm run dev"
        Write-Info "3. Acesse: http://localhost:3000"
        Write-Info "4. Login: admin@sistema.com / 123456"
        Write-Info ""
        Write-Warning "⚠️  Lembre-se de alterar a senha padrão do administrador!"
        
    } catch {
        Write-Error "Erro durante inicialização: $_"
        exit 1
    }
}

# Executar função principal
Main