@echo off
:: Script de Inicialização do Sistema de Manutenção
:: Versão simplificada para execução rápida

title Sistema de Manutenção - Inicialização

echo.
echo ===============================================================
echo 🔧 SISTEMA DE MANUTENÇÃO - INICIALIZAÇÃO DO BANCO DE DADOS
echo ===============================================================
echo.

:: Verificar se estamos no diretório correto
if not exist "backend\package.json" (
    echo ❌ ERRO: Execute este script no diretório raiz do projeto
    echo    Certifique-se de que existe o arquivo backend\package.json
    pause
    exit /b 1
)

:: Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRO: Node.js não encontrado
    echo    Instale o Node.js antes de continuar
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo.

:: Navegar para o backend
cd backend

:: Verificar se node_modules existe
if not exist "node_modules" (
    echo 📦 Instalando dependências...
    npm install
    if errorlevel 1 (
        echo ❌ ERRO: Falha ao instalar dependências
        pause
        exit /b 1
    )
    echo ✅ Dependências instaladas
) else (
    echo ✅ Dependências já instaladas
)

echo.
echo 🚀 Executando inicialização do banco de dados...
echo.

:: Executar script de inicialização
node initialize-database.js

if errorlevel 1 (
    echo.
    echo ❌ ERRO: Falha na inicialização do banco de dados
    echo    Verifique as configurações de conexão
    pause
    exit /b 1
)

echo.
echo ===============================================================
echo 🎉 INICIALIZAÇÃO CONCLUÍDA COM SUCESSO!
echo ===============================================================
echo.
echo 📋 INFORMAÇÕES DE ACESSO:
echo 🌐 Sistema: http://localhost:3000
echo 👤 Email: admin@sistema.com
echo 🔑 Senha: 123456
echo.
echo ⚠️  IMPORTANTE: Altere a senha padrão após o primeiro login!
echo.
echo 📋 PRÓXIMOS PASSOS:
echo 1. Execute 'start.ps1' ou 'npm start' para iniciar o sistema
echo 2. Acesse http://localhost:3000 no navegador
echo 3. Faça login com as credenciais acima
echo.

:: Voltar ao diretório raiz
cd ..

echo Pressione qualquer tecla para continuar...
pause >nul