# Guia de Padronização de Botões

## 📋 Visão Geral

Este documento define o padrão de botões para todo o sistema de manutenção. O objetivo é manter consistência visual e funcional em toda a aplicação.

## 🎨 Sistema de Cores

### Cores por Ação Específica
- **Criar/Adicionar**: `btn-create` - Verde (#28a745)
- **Editar**: `btn-edit` - Azul claro (#17a2b8)  
- **Visualizar**: `btn-view` - Cinza (#6c757d)
- **Deletar**: `btn-delete` - Vermelho (#dc3545)

### Cores por Contexto
- **Primário**: `btn-primary` - Azul (#007bff)
- **Secundário**: `btn-secondary` - Cinza (#6c757d)
- **Sucesso**: `btn-success` - Verde (#28a745)
- **Perigo**: `btn-danger` - Vermelho (#dc3545)
- **Aviso**: `btn-warning` - Amarelo (#ffc107)
- **Informação**: `btn-info` - Azul claro (#17a2b8)

## 📏 Tamanhos de Botões

```html
<!-- Extra Pequeno -->
<button class="btn btn-primary btn-xs">XS</button>

<!-- Pequeno -->
<button class="btn btn-primary btn-sm">SM</button>

<!-- Médio (padrão) -->
<button class="btn btn-primary">MD</button>

<!-- Grande -->
<button class="btn btn-primary btn-lg">LG</button>

<!-- Extra Grande -->
<button class="btn btn-primary btn-xl">XL</button>
```

## 🎯 Exemplos de Uso por Funcionalidade

### Botões de Ação Principal

#### Criar/Adicionar Novos Itens
```html
<!-- Correto -->
<button class="btn btn-create">
  <i class="fas fa-plus"></i>
  Novo Item
</button>

<!-- Alternativa com outline -->
<button class="btn btn-outline-create">
  <i class="fas fa-plus"></i>
  Adicionar
</button>
```

#### Editar Registros
```html
<!-- Correto -->
<button class="btn btn-edit btn-sm" title="Editar">
  <i class="fas fa-edit"></i>
</button>

<!-- Com texto -->
<button class="btn btn-edit">
  <i class="fas fa-edit"></i>
  Editar
</button>
```

#### Visualizar Detalhes
```html
<!-- Correto -->
<button class="btn btn-view btn-sm" title="Visualizar">
  <i class="fas fa-eye"></i>
</button>

<!-- Com texto -->
<button class="btn btn-view">
  <i class="fas fa-eye"></i>
  Ver Detalhes
</button>
```

#### Deletar/Excluir
```html
<!-- Correto -->
<button class="btn btn-delete btn-sm" title="Excluir">
  <i class="fas fa-trash"></i>
</button>

<!-- Com confirmação -->
<button class="btn btn-outline-delete" @click="confirmarExclusao">
  <i class="fas fa-trash"></i>
  Excluir
</button>
```

### Botões de Formulário

#### Salvar/Enviar
```html
<!-- Primário para ação principal -->
<button type="submit" class="btn btn-primary" :disabled="loading">
  <i class="fas fa-save"></i>
  {{ editando ? 'Atualizar' : 'Salvar' }}
</button>
```

#### Cancelar
```html
<!-- Secundário ou outline para cancelar -->
<button type="button" class="btn btn-secondary" @click="cancelar">
  Cancelar
</button>

<!-- Ou outline -->
<button type="button" class="btn btn-outline" @click="cancelar">
  Cancelar
</button>
```

### Botões de Navegação

#### Voltar
```html
<button class="btn btn-outline" @click="$router.back()">
  <i class="fas fa-arrow-left"></i>
  Voltar
</button>
```

#### Links/Navegação
```html
<button class="btn btn-secondary" @click="$router.push('/path')">
  <i class="fas fa-external-link-alt"></i>
  Ir para Página
</button>
```

### Botões Especiais

#### Botões de Ícone (sem texto)
```html
<!-- Para ações em tabelas -->
<button class="btn-icon btn-edit btn-sm" title="Editar">
  <i class="fas fa-edit"></i>
</button>

<button class="btn-icon btn-view btn-sm" title="Ver">
  <i class="fas fa-eye"></i>
</button>

<button class="btn-icon btn-delete btn-sm" title="Excluir">
  <i class="fas fa-trash"></i>
</button>
```

#### Botões Flutuantes
```html
<!-- Botão de criar flutuante -->
<button class="floating-btn floating-create-btn" @click="criarItem">
  <i class="fas fa-plus"></i>
</button>

<!-- Botão de alertas flutuante -->
<button class="floating-btn floating-alerts-btn" @click="verAlertas">
  <i class="fas fa-bell"></i>
</button>
```

#### Grupos de Botões
```html
<div class="btn-group">
  <button class="btn btn-view">Lista</button>
  <button class="btn btn-secondary">Grade</button>
  <button class="btn btn-secondary">Mapa</button>
</div>
```

## ❌ O Que NÃO Fazer

### Cores Incorretas
```html
<!-- ❌ Errado: cores inconsistentes -->
<button class="btn btn-info" @click="editar">Editar</button>
<button class="btn btn-warning" @click="deletar">Excluir</button>
<button class="btn btn-success" @click="visualizar">Ver</button>

<!-- ✅ Correto: cores por ação -->
<button class="btn btn-edit" @click="editar">Editar</button>
<button class="btn btn-delete" @click="deletar">Excluir</button>
<button class="btn btn-view" @click="visualizar">Ver</button>
```

### Tamanhos Inconsistentes
```html
<!-- ❌ Errado: tamanhos misturados em contexto similar -->
<button class="btn btn-edit btn-lg">Editar</button>
<button class="btn btn-delete btn-sm">Excluir</button>

<!-- ✅ Correto: tamanhos consistentes -->
<button class="btn btn-edit btn-sm">Editar</button>
<button class="btn btn-delete btn-sm">Excluir</button>
```

### Ícones Sem Sentido
```html
<!-- ❌ Errado: ícones que não fazem sentido -->
<button class="btn btn-create">
  <i class="fas fa-trash"></i>
  Criar
</button>

<!-- ✅ Correto: ícones apropriados -->
<button class="btn btn-create">
  <i class="fas fa-plus"></i>
  Criar
</button>
```

## 🔧 Estados de Botão

### Loading
```html
<button class="btn btn-primary loading" :disabled="salvando">
  Salvando...
</button>
```

### Desabilitado
```html
<button class="btn btn-edit" :disabled="!permissaoEditar">
  Editar
</button>
```

### Com Tooltip
```html
<button class="btn btn-view btn-sm" title="Visualizar detalhes do item">
  <i class="fas fa-eye"></i>
</button>
```

## 📱 Responsividade

### Mobile First
```html
<!-- Botões ficam full-width em mobile automaticamente -->
<button class="btn btn-primary">
  Botão Responsivo
</button>

<!-- Para forçar largura total -->
<button class="btn btn-primary btn-block">
  Botão Largura Total
</button>
```

## 🎨 Customizações Permitidas

### Variações de Estilo
```html
<!-- Sem sombra -->
<button class="btn btn-primary btn-shadow-none">Sem Sombra</button>

<!-- Arredondado -->
<button class="btn btn-primary btn-rounded">Arredondado</button>

<!-- Quadrado -->
<button class="btn btn-primary btn-square">Quadrado</button>
```

## 📋 Checklist de Implementação

Ao implementar botões, verifique:

- [ ] A cor está de acordo com a ação (criar=verde, editar=azul, etc.)
- [ ] O tamanho é consistente com outros botões similares na mesma tela
- [ ] O ícone faz sentido para a ação
- [ ] Há tooltip quando necessário (especialmente botões só com ícone)
- [ ] Estados de loading/disabled são tratados
- [ ] É responsivo para mobile
- [ ] Segue as convenções de texto (Criar, Editar, Visualizar, Excluir)

## 🔄 Migração de Botões Existentes

### Mapeamento de Classes Antigas para Novas

| Antiga | Nova | Uso |
|--------|------|-----|
| `btn-secondary` (para editar) | `btn-edit` | Ações de edição |
| `btn-info` (para visualizar) | `btn-view` | Ações de visualização |
| `btn-success` (para criar) | `btn-create` | Ações de criação |
| `btn-danger` (para excluir) | `btn-delete` | Ações de exclusão |

### Script de Busca e Substituição

Para ajudar na migração, use estas expressões regulares:

```bash
# Buscar botões de edição inconsistentes
grep -r "btn.*btn-secondary.*edit\|btn.*btn-info.*edit" src/

# Buscar botões de exclusão inconsistentes  
grep -r "btn.*btn-warning.*delete\|btn.*btn-danger.*(?!delete)" src/
```

## 📚 Exemplos Completos

### Tabela com Ações
```html
<td class="actions">
  <button class="btn-icon btn-view btn-sm" @click="visualizar(item)" title="Visualizar">
    <i class="fas fa-eye"></i>
  </button>
  <button class="btn-icon btn-edit btn-sm" @click="editar(item)" title="Editar">
    <i class="fas fa-edit"></i>
  </button>
  <button class="btn-icon btn-delete btn-sm" @click="excluir(item)" title="Excluir">
    <i class="fas fa-trash"></i>
  </button>
</td>
```

### Header de Página
```html
<header class="page-header">
  <h1>Gerenciar Usuários</h1>
  <button class="btn btn-create" @click="criarUsuario">
    <i class="fas fa-plus"></i>
    Novo Usuário
  </button>
</header>
```

### Formulário
```html
<div class="form-actions">
  <button type="button" class="btn btn-outline" @click="cancelar">
    Cancelar
  </button>
  <button type="submit" class="btn btn-primary" :disabled="!formularioValido">
    <i class="fas fa-save"></i>
    {{ editando ? 'Atualizar' : 'Criar' }}
  </button>
</div>
```

---

**Importante**: Este padrão deve ser seguido por toda a equipe para manter a consistência visual e de UX em todo o sistema.