..# Script de limpeza do sistema - Remove arquivos desnecessários
Write-Host "🧹 LIMPEZA DO SISTEMA" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

$cleanupItems = @()

# 1. Arquivos de teste duplicados e desnecessários
Write-Host "📂 Removendo arquivos de teste desnecessários..." -ForegroundColor Yellow

$testFiles = @(
    "test-preventiva.js",
    "test-debug.html", 
    "test-api.html",
    "testar-sistema.ps1",
    "limpar-cache-navegador.md",
    "backend\test-setores.js",
    "backend\test-estoque.js", 
    "backend\test-connection.js",
    "backend\test-api.sh",
    "backend\test-api.js",
    "backend\reset-database.js"
)

foreach ($file in $testFiles) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        $cleanupItems += "❌ $file"
        Write-Host "   ❌ Removido: $file" -ForegroundColor Red
    }
}

# 2. Scripts de inicialização duplicados
Write-Host "📂 Removendo scripts duplicados..." -ForegroundColor Yellow

$duplicateScripts = @(
    "iniciar-sistema.ps1",
    "iniciar-sistema.bat", 
    "parar-sistema.ps1"
)

foreach ($script in $duplicateScripts) {
    $fullPath = Join-Path $PSScriptRoot $script
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        $cleanupItems += "❌ $script"
        Write-Host "   ❌ Removido: $script" -ForegroundColor Red
    }
}

# 3. Páginas Vue.js desnecessárias/backup
Write-Host "📂 Removendo páginas Vue.js desnecessárias..." -ForegroundColor Yellow

$unnecessaryPages = @(
    "frontend\src\pages\Ativos_backup.vue",
    "frontend\src\pages\Ativos_novo.vue",
    "frontend\src\pages\Departments.vue",
    "frontend\src\pages\DepartmentForm.vue",
    "frontend\src\pages\Categories.vue",
    "frontend\src\pages\SubCategories.vue"
)

foreach ($page in $unnecessaryPages) {
    $fullPath = Join-Path $PSScriptRoot $page
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        $cleanupItems += "❌ $page"
        Write-Host "   ❌ Removido: $page" -ForegroundColor Red
    }
}

# 4. Models desnecessários (departamentos antigos)
Write-Host "📂 Removendo models desnecessários..." -ForegroundColor Yellow

$unnecessaryModels = @(
    "backend\models\Department.js",
    "backend\models\Category.js", 
    "backend\models\SubCategory.js"
)

foreach ($model in $unnecessaryModels) {
    $fullPath = Join-Path $PSScriptRoot $model
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        $cleanupItems += "❌ $model"
        Write-Host "   ❌ Removido: $model" -ForegroundColor Red
    }
}

# 5. Controllers desnecessários
Write-Host "📂 Removendo controllers desnecessários..." -ForegroundColor Yellow

$unnecessaryControllers = @(
    "backend\controllers\DepartmentController.js",
    "backend\controllers\CategoryController.js",
    "backend\controllers\SubCategoryController.js"
)

foreach ($controller in $unnecessaryControllers) {
    $fullPath = Join-Path $PSScriptRoot $controller
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        $cleanupItems += "❌ $controller"
        Write-Host "   ❌ Removido: $controller" -ForegroundColor Red
    }
}

# 6. Rotas desnecessárias
Write-Host "📂 Removendo rotas desnecessárias..." -ForegroundColor Yellow

$unnecessaryRoutes = @(
    "backend\routes\departments.js",
    "backend\routes\categories.js",
    "backend\routes\subcategories.js",
    "backend\routes\PaletaCores.txt"
)

foreach ($route in $unnecessaryRoutes) {
    $fullPath = Join-Path $PSScriptRoot $route
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        $cleanupItems += "❌ $route"
        Write-Host "   ❌ Removido: $route" -ForegroundColor Red
    }
}

# 7. Migrações duplicadas/desnecessárias
Write-Host "📂 Removendo migrações desnecessárias..." -ForegroundColor Yellow

$unnecessaryMigrations = @(
    "backend\database\migrations\20250815-create-permissions.js",
    "backend\database\migrations\20250816120000-create-departments.js",
    "backend\database\migrations\20250816130000-add-department-id-to-users.js",
    "backend\database\migrations\20250816150000-add-localizacao-to-departments.js",
    "backend\database\migrations\20250816151000-create-categories.js",
    "backend\database\migrations\20250816152000-create-subcategories.js",
    "backend\database\migrations\20250816153000-add-categories-to-solicitacoes.js"
)

foreach ($migration in $unnecessaryMigrations) {
    $fullPath = Join-Path $PSScriptRoot $migration
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        $cleanupItems += "❌ $migration"
        Write-Host "   ❌ Removido: $migration" -ForegroundColor Red
    }
}

# 8. Componentes Vue.js desnecessários
Write-Host "📂 Removendo componentes Vue.js desnecessários..." -ForegroundColor Yellow

$unnecessaryComponents = @(
    "frontend\src\components\PlanoForm.vue",
    "frontend\src\components\EstoqueItens.vue"
)

foreach ($component in $unnecessaryComponents) {
    $fullPath = Join-Path $PSScriptRoot $component
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        $cleanupItems += "❌ $component"
        Write-Host "   ❌ Removido: $component" -ForegroundColor Red
    }
}

# 9. Logs duplicados na raiz
Write-Host "📂 Removendo logs duplicados..." -ForegroundColor Yellow

$duplicateLogs = @(
    "logs\error.log",
    "logs\combined.log"
)

foreach ($log in $duplicateLogs) {
    $fullPath = Join-Path $PSScriptRoot $log
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        $cleanupItems += "❌ $log"
        Write-Host "   ❌ Removido: $log" -ForegroundColor Red
    }
}

# Remover pasta logs da raiz se estiver vazia
$logsFolder = Join-Path $PSScriptRoot "logs"
if (Test-Path $logsFolder) {
    $logContents = Get-ChildItem $logsFolder
    if ($logContents.Count -eq 0) {
        Remove-Item $logsFolder -Force
        $cleanupItems += "❌ logs\"
        Write-Host "   ❌ Removido: logs\" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ LIMPEZA CONCLUÍDA!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 RESUMO DA LIMPEZA:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

if ($cleanupItems.Count -gt 0) {
    foreach ($item in $cleanupItems) {
        Write-Host "   $item" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "📈 Total de itens removidos: $($cleanupItems.Count)" -ForegroundColor Green
} else {
    Write-Host "   ℹ️ Nenhum arquivo desnecessário encontrado" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 ARQUIVOS PRINCIPAIS MANTIDOS:" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host "   ✅ start.ps1 - Script principal de inicialização" -ForegroundColor Green
Write-Host "   ✅ stop.ps1 - Script para parar o sistema" -ForegroundColor Green
Write-Host "   ✅ Backend completo (servidor, APIs, banco)" -ForegroundColor Green
Write-Host "   ✅ Frontend Vue.js (páginas principais)" -ForegroundColor Green
Write-Host "   ✅ Sistema de autenticação e permissões" -ForegroundColor Green
Write-Host "   ✅ Módulo de ativos completo" -ForegroundColor Green
Write-Host "   ✅ Módulo de solicitações completo" -ForegroundColor Green
Write-Host "   ✅ Módulo de estoque completo" -ForegroundColor Green
Write-Host "   ✅ Módulo de manutenção preventiva" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Sistema limpo e otimizado!" -ForegroundColor Green