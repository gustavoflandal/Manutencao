# 📋 Guia de Migração de Ícones - Sistema de Manutenção

## 🎯 Objetivo

Migrar gradualmente todos os ícones FontAwesome para **Lucide React** usando o sistema unificado de ícones implementado.

## 🛠️ Como Usar o Novo Sistema

### 1. Componente Icon.vue

```vue
<template>
  <!-- ✅ NOVO: Usando componente unificado -->
  <Icon name="add" size="16" class="primary" />
  
  <!-- ❌ ANTIGO: FontAwesome direto -->
  <i class="fas fa-plus"></i>
</template>

<script setup>
import Icon from '@/components/Icon.vue'
</script>
```

### 2. Composable useIcons()

```javascript
import { useIcons } from '@/composables/useIcons'

const { getIcon, getIconFromGallery } = useIcons()

// Obter ícone da galeria do sistema
const icon = getIconFromGallery('wrench')

// Obter qualquer ícone (interface, galeria, ou FontAwesome)
const anyIcon = getIcon('add')
```

## 📊 Mapeamento de Migração

### ✅ Já Migrados

| Página | Status | Ícones Convertidos |
|--------|--------|-------------------|
| Login.vue | ✅ Completo | `fas fa-check-circle` → `success`, `fas fa-exclamation-circle` → `warning` |
| App.vue | ✅ Completo | `fas fa-sign-out-alt` → `logout` |

### 🔄 Em Progresso

| Arquivo | FontAwesome Encontrado | Sugestão Lucide | Prioridade |
|---------|------------------------|-----------------|------------|
| Users.vue | `fas fa-user-plus` | `add` ou `users` | Alta |
| Users.vue | `fas fa-edit` | `edit` | Alta |
| Users.vue | `fas fa-key` | `key` | Alta |
| Users.vue | `fas fa-ban` | `ban` ou `error` | Alta |
| Users.vue | `fas fa-times` | `close` ou `cancel` | Alta |
| Users.vue | `fas fa-save` | `save` | Alta |
| SubCategories.vue | `fas fa-arrow-left` | `back` | Média |
| SubCategories.vue | `fas fa-plus` | `add` | Média |
| SubCategories.vue | `fas fa-edit` | `edit` | Média |
| SubCategories.vue | `fas fa-trash` | `delete` | Média |

## 🎨 Ícones de Interface Mais Comuns

### Ações Básicas
```javascript
// Adicionar/Criar
<Icon name="add" />       // Plus
<Icon name="create" />    // Plus
<Icon name="plus" />      // Plus

// Editar/Configurar
<Icon name="edit" />      // Edit
<Icon name="settings" />  // Settings
<Icon name="config" />    // Settings

// Remover/Cancelar
<Icon name="delete" />    // Trash2
<Icon name="remove" />    // Minus
<Icon name="cancel" />    // X
<Icon name="close" />     // X

// Confirmar/Salvar
<Icon name="save" />      // Save
<Icon name="confirm" />   // Check
<Icon name="check" />     // Check
```

### Navegação
```javascript
<Icon name="back" />      // ChevronLeft
<Icon name="forward" />   // ChevronRight
<Icon name="up" />        // ArrowUp
<Icon name="down" />      // ArrowDown
<Icon name="left" />      // ArrowLeft
<Icon name="right" />     // ArrowRight
```

### Status e Alertas
```javascript
<Icon name="success" />   // CheckCircle
<Icon name="error" />     // XCircle
<Icon name="warning" />   // AlertTriangle
<Icon name="info" />      // Info
```

### Usuários e Autenticação
```javascript
<Icon name="user" />      // User
<Icon name="users" />     // Users
<Icon name="profile" />   // User
<Icon name="login" />     // Key
<Icon name="logout" />    // Lock
<Icon name="password" />  // Key
<Icon name="security" />  // Shield
```

## 🔧 Ícones da Galeria do Sistema

### Ferramentas
```javascript
<Icon name="wrench" />    // Chave inglesa
<Icon name="hammer" />    // Martelo
<Icon name="drill" />     // Furadeira
<Icon name="tool-case" /> // Caixa de ferramentas
<Icon name="settings" />  // Configurações
```

### Eletrônicos
```javascript
<Icon name="monitor" />   // Monitor
<Icon name="laptop" />    // Notebook
<Icon name="server" />    // Servidor
<Icon name="printer" />   // Impressora
```

### Veículos
```javascript
<Icon name="truck" />     // Caminhão
<Icon name="car" />       // Automóvel
<Icon name="bus" />       // Ônibus
```

## 📋 Lista de Tarefas de Migração

### Prioridade Alta 🔴
- [ ] Users.vue - 7 ícones FontAwesome
- [ ] SubCategories.vue - 4 ícones FontAwesome
- [ ] Categories.vue - Verificar se há ícones FontAwesome

### Prioridade Média 🟡
- [ ] WorkflowTemplates.vue - Misto Lucide/FontAwesome
- [ ] Dashboard.vue - Verificar ícones
- [ ] Solicitacoes.vue - Verificar ícones
- [ ] OrdemServico.vue - Verificar ícones

### Prioridade Baixa 🟢
- [ ] Componentes auxiliares
- [ ] Páginas de configuração
- [ ] Modais e popups

## 🔍 Script de Auditoria

Para identificar todos os ícones FontAwesome no projeto:

```bash
# Buscar ícones FontAwesome
grep -r "fas fa-\|far fa-\|fab fa-" frontend/src --include="*.vue"

# Buscar ícones Lucide já implementados
grep -r "lucide-" frontend/src --include="*.vue"
```

## 🎨 Estilos e Classes

O componente Icon.vue suporta:

```vue
<!-- Tamanhos predefinidos -->
<Icon name="add" class="xs" />   <!-- 12px -->
<Icon name="add" class="sm" />   <!-- 14px -->
<Icon name="add" class="md" />   <!-- 16px -->
<Icon name="add" class="lg" />   <!-- 20px -->
<Icon name="add" class="xl" />   <!-- 24px -->

<!-- Tamanho customizado -->
<Icon name="add" size="18" />
<Icon name="add" size="1.5rem" />

<!-- Cores temáticas -->
<Icon name="add" class="primary" />
<Icon name="add" class="success" />
<Icon name="add" class="warning" />
<Icon name="add" class="danger" />

<!-- Cor customizada -->
<Icon name="add" color="#ff6b6b" />

<!-- Estados -->
<Icon name="add" class="disabled" />
<Icon name="add" class="rotating" />
```

## 🚀 Benefícios da Migração

1. **Consistência Visual**: Todos os ícones seguem o mesmo estilo Lucide
2. **Performance**: Lucide é mais leve que FontAwesome
3. **Manutenibilidade**: Sistema centralizado de ícones
4. **Flexibilidade**: Fácil customização de tamanhos e cores
5. **Tree-shaking**: Apenas ícones usados são incluídos no bundle
6. **Tipagem**: Melhor suporte TypeScript (futuro)

## 📝 Convenções

### Nomenclatura
- Use nomes em inglês simples: `add`, `edit`, `delete`
- Para ações: use verbos: `save`, `cancel`, `confirm`
- Para objetos: use substantivos: `user`, `file`, `folder`
- Para estados: use adjetivos: `success`, `error`, `warning`

### Tamanhos
- **16px**: Padrão para interfaces
- **14px**: Botões pequenos, inputs
- **20px**: Botões principais
- **24px**: Headers, destaque

### Cores
- Use as classes temáticas quando possível
- Para cores específicas, use a prop `color`
- Mantenha contraste adequado para acessibilidade

## 🔄 Processo de Migração

1. **Identificar** ícones FontAwesome na página
2. **Mapear** para equivalentes Lucide usando este guia
3. **Substituir** `<i class="fas fa-*">` por `<Icon name="*">`
4. **Importar** o componente Icon.vue
5. **Testar** visualmente
6. **Remover** classes FontAwesome não utilizadas
7. **Documentar** no checklist acima

## 🎯 Meta Final

**100% dos ícones migrados para Lucide até o final do refinamento do sistema.**

Atualmente: **2/15+ páginas migradas (≈13%)**