# 🧹 Como Limpar Cache do Navegador - Sistema de Manutenção

## Problema Identificado
O sistema funciona no navegador simples do VS Code, mas pode não funcionar no navegador principal devido ao cache mantido.

## Soluções por Navegador

### 🔥 Firefox
1. Pressione `Ctrl + Shift + R` (recarregar sem cache)
2. Ou abra `Ferramentas > Ferramentas de Desenvolver > Console`
3. Clique com botão direito no ícone de recarregar e escolha "Recarregar sem cache"

### 🌐 Chrome/Edge
1. Pressione `Ctrl + Shift + R` (recarregar sem cache)
2. Ou pressione `F12` para abrir DevTools
3. Clique com botão direito no ícone de recarregar e escolha "Limpar cache e recarregar"

### 🧹 Limpeza Completa (Todos os navegadores)
1. Pressione `Ctrl + Shift + Delete`
2. Selecione "Cookies e dados de sites"
3. Selecione "Imagens e arquivos em cache"
4. Escolha período: "Última hora" ou "Todo o período"
5. Clique em "Limpar dados"

### 🔄 Modo Incógnito/Privado
- **Chrome**: `Ctrl + Shift + N`
- **Firefox**: `Ctrl + Shift + P`
- **Edge**: `Ctrl + Shift + N`

## 🎯 URL para Teste
- **Frontend**: http://localhost:3002
- **Credenciais**: admin@sistema.com / 123456

## ✅ Verificar se Funciona
1. Abra o navegador em modo incógnito
2. Acesse http://localhost:3002
3. Faça login com admin@sistema.com / 123456
4. Vá para "Usuários" no menu
5. Verifique se o botão "Novo Usuário" aparece no canto superior direito

Se funcionar em modo incógnito mas não no modo normal, é definitivamente problema de cache!