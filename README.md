# Sistema de Gestão de Manutenção

Sistema completo de gestão de manutenção desenvolvido com Vue.js 3 + Node.js/Express, focado em controle de ativos, estoque, ordens de serviço e manutenção preventiva.

## 📋 Visão Geral

Este sistema foi desenvolvido para gerenciar de forma integrada todos os aspectos da manutenção industrial/empresarial, incluindo:

- **Gestão de Usuários e Permissões** - Sistema completo de autenticação e autorização
- **Controle de Ativos** - Cadastro e acompanhamento de equipamentos e ativos
- **Gestão de Estoque** - Controle completo de materiais, fornecedores e movimentações
- **Ordens de Serviço** - Criação, acompanhamento e finalização de OS
- **Manutenção Preventiva** - Programação e controle de manutenções preventivas
- **Relatórios e Dashboards** - Análises e relatórios gerenciais
- **Gestão de Setores** - Organização departamental
- **Solicitações** - Sistema de solicitações internas

## 🚀 Tecnologias Utilizadas

### Frontend
- **Vue.js 3** - Framework JavaScript progressivo
- **Vue Router** - Roteamento SPA
- **Pinia** - Gerenciamento de estado
- **Vite** - Build tool e desenvolvimento
- **Axios** - Cliente HTTP
- **FontAwesome** - Ícones
- **CSS3** - Estilização responsiva

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Sequelize** - ORM para banco de dados
- **MySQL** - Banco de dados relacional
- **JWT** - Autenticação via tokens
- **bcrypt** - Criptografia de senhas
- **Winston** - Sistema de logs
- **Multer** - Upload de arquivos

## 📁 Estrutura do Projeto

```
Manutencao/
├── backend/                    # API Backend
│   ├── config/                # Configurações
│   │   ├── auth.js            # Configuração JWT
│   │   ├── config.json        # Configurações gerais
│   │   ├── database.js        # Configuração do banco
│   │   └── logger.js          # Sistema de logs
│   ├── controllers/           # Controladores
│   │   ├── AuthController.js  # Autenticação
│   │   ├── PermissionController.js # Permissões
│   │   └── UserController.js  # Usuários
│   ├── database/             # Migrações do banco
│   │   └── migrations/
│   ├── middleware/           # Middlewares
│   │   ├── auth.js           # Autenticação
│   │   ├── errorHandler.js   # Tratamento de erros
│   │   └── permissions.js    # Controle de permissões
│   ├── models/               # Modelos do banco
│   │   ├── index.js          # Configuração Sequelize
│   │   ├── User.js           # Modelo de usuários
│   │   ├── Permission.js     # Modelo de permissões
│   │   ├── UserPermission.js # Relacionamento usuário-permissão
│   │   ├── OrdemServico.js   # Modelo de ordens de serviço
│   │   ├── Solicitacao.js    # Modelo de solicitações
│   │   ├── Department.js     # Modelo de departamentos
│   │   ├── Category.js       # Modelo de categorias
│   │   ├── SubCategory.js    # Modelo de subcategorias
│   │   └── MovimentacaoEstoque.js # Modelo de movimentações
│   ├── routes/               # Rotas da API
│   │   ├── index.js          # Roteador principal
│   │   ├── auth.js           # Rotas de autenticação
│   │   ├── users.js          # Rotas de usuários
│   │   ├── permissions.js    # Rotas de permissões
│   │   ├── ativos.js         # Rotas de ativos
│   │   ├── estoque.js        # Rotas de estoque
│   │   ├── ordens-servico.js # Rotas de OS
│   │   ├── preventiva.js     # Rotas de manutenção preventiva
│   │   ├── relatorios.js     # Rotas de relatórios
│   │   ├── solicitacoes.js   # Rotas de solicitações
│   │   └── upload.js         # Rotas de upload
│   ├── services/             # Serviços
│   │   └── AuthService.js    # Serviços de autenticação
│   ├── logs/                 # Arquivos de log
│   ├── package.json          # Dependências backend
│   └── server.js             # Servidor principal
├── frontend/                  # Interface Frontend
│   ├── src/
│   │   ├── components/       # Componentes Vue
│   │   │   ├── Toast.vue     # Componente de notificações
│   │   │   ├── EstoqueCategorias.vue # Gestão de categorias
│   │   │   ├── EstoqueFornecedores.vue # Gestão de fornecedores
│   │   │   ├── EstoqueMovimentacoes.vue # Movimentações
│   │   │   └── EstoqueRelatorios.vue # Relatórios de estoque
│   │   ├── pages/            # Páginas principais
│   │   │   ├── Login.vue     # Página de login
│   │   │   ├── Dashboard.vue # Dashboard principal
│   │   │   ├── Users.vue     # Gestão de usuários
│   │   │   ├── UserForm.vue  # Formulário de usuário
│   │   │   ├── Permissions.vue # Gestão de permissões
│   │   │   └── Profile.vue   # Perfil do usuário
│   │   ├── router/           # Configuração de rotas
│   │   │   └── index.js      # Roteador Vue
│   │   ├── services/         # Serviços
│   │   │   └── api.js        # Cliente API
│   │   ├── stores/           # Gerenciamento de estado
│   │   │   └── auth.js       # Store de autenticação
│   │   ├── composables/      # Composables Vue
│   │   │   └── useToast.js   # Composable de notificações
│   │   ├── styles/           # Estilos globais
│   │   │   └── global.css    # CSS global
│   │   ├── App.vue           # Componente raiz
│   │   └── main.js           # Ponto de entrada
│   ├── package.json          # Dependências frontend
│   └── vite.config.js        # Configuração Vite
├── scripts/                   # Scripts de execução
│   ├── iniciar-sistema.bat   # Script Windows batch
│   ├── iniciar-sistema.ps1   # Script PowerShell
│   ├── parar-sistema.ps1     # Script para parar sistema
│   ├── start.ps1             # Script de inicialização
│   └── stop.ps1              # Script de parada
├── documentacao/             # Documentação do sistema
│   ├── README-OPERACAO.md    # Manual de operação
│   └── SISTEMA_USUARIOS_PERMISSOES.md # Documentação de usuários
└── test-api.html             # Página de teste da API
```

## 🔧 Funcionalidades Implementadas

### ✅ Sistema de Autenticação e Autorização
- Login/logout com JWT
- Controle de sessões
- Middleware de autenticação
- Sistema de permissões granulares
- Níveis de acesso (admin, gestor, técnico, operador)

### ✅ Gestão de Usuários
- CRUD completo de usuários
- Atribuição de permissões
- Perfis de usuário
- Validação de dados
- Criptografia de senhas

### ✅ Módulo de Estoque
- **Categorias**: Gestão completa de categorias de materiais
- **Fornecedores**: Cadastro de fornecedores com validação CNPJ
- **Movimentações**: Controle de entradas e saídas
- **Relatórios**: Análises e relatórios em PDF
- **Alertas**: Notificações de estoque baixo
- **Valorização**: Controle de valor do estoque

### ✅ Sistema de Rotas e Navegação
- Roteamento SPA completo
- Proteção de rotas por permissão
- Navegação responsiva
- Breadcrumbs e navegação contextual

### ✅ Interface de Usuário
- Design responsivo e moderno
- Componentes reutilizáveis
- Sistema de notificações (toasts)
- Formulários com validação
- Modais e overlays
- Tabelas com paginação e filtros

### ✅ Sistema de Logs e Monitoramento
- Logs estruturados com Winston
- Separação de logs por nível
- Rastreamento de erros
- Monitoramento de performance

## 🗄️ Banco de Dados

### Tabelas Principais
- **users** - Usuários do sistema
- **permissions** - Permissões disponíveis
- **user_permissions** - Relacionamento usuário-permissão
- **departments** - Departamentos/setores
- **categories** - Categorias de materiais
- **subcategories** - Subcategorias
- **movimentacao_estoques** - Movimentações de estoque
- **ordem_servicos** - Ordens de serviço
- **solicitacoes** - Solicitações internas

### Relacionamentos
- Usuários ↔ Permissões (N:N)
- Departamentos → Usuários (1:N)
- Categorias → Subcategorias (1:N)
- Usuários → Movimentações (1:N)

## 🚦 Como Executar

### Pré-requisitos
- Node.js 16+ 
- MySQL 8.0+
- Git

### Instalação

1. **Clone o repositório**
```bash
git clone [URL_DO_REPOSITORIO]
cd Manutencao
```

2. **Configure o banco de dados**
```sql
CREATE DATABASE manutencao;
```

3. **Configure as variáveis de ambiente**
Edite `backend/config/config.json` com suas configurações de banco.

4. **Instale as dependências**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

5. **Execute as migrações**
```bash
cd backend
npx sequelize-cli db:migrate
```

6. **Inicie o sistema**

**Opção 1: Scripts automatizados**
```powershell
# PowerShell (Windows)
.\iniciar-sistema.ps1

# Ou batch
.\iniciar-sistema.bat
```

**Opção 2: Manual**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Acesso ao Sistema
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Usuário admin padrão**: Criado via script `create-admin.js`

## 📊 Status do Desenvolvimento

### ✅ Concluído
- [x] Estrutura básica do projeto
- [x] Sistema de autenticação JWT
- [x] CRUD de usuários e permissões
- [x] Módulo completo de estoque
- [x] Interface responsiva
- [x] Sistema de rotas protegidas
- [x] Logs e monitoramento
- [x] Scripts de inicialização

### 🔄 Em Desenvolvimento
- [ ] Módulo de Ativos
- [ ] Ordens de Serviço
- [ ] Manutenção Preventiva
- [ ] Sistema de Solicitações
- [ ] Dashboard com métricas
- [ ] Relatórios avançados

### 📋 Planejado
- [ ] Sistema de notificações em tempo real
- [ ] App mobile
- [ ] Integração com sistemas externos
- [ ] Backup automático
- [ ] Auditoria completa

## 🛠️ Melhorias Implementadas

### Performance
- Lazy loading de componentes
- Paginação em tabelas grandes
- Cache de consultas frequentes
- Otimização de queries SQL

### Segurança
- Sanitização de inputs
- Validação de permissões
- Proteção contra SQL injection
- Headers de segurança

### UX/UI
- Interface intuitiva e moderna
- Feedback visual consistente
- Responsividade em todos os dispositivos
- Acessibilidade básica

## 📝 Configurações Importantes

### Backend (config.json)
```json
{
  "development": {
    "username": "root",
    "password": "password",
    "database": "manutencao",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
}
```

### Frontend (vite.config.js)
```javascript
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
```

## 🔧 Comandos Úteis

### Backend
```bash
# Executar migrações
npx sequelize-cli db:migrate

# Criar usuário admin
node create-admin.js

# Testar conexão com banco
node test-connection.js

# Executar em modo desenvolvimento
npm run dev
```

### Frontend
```bash
# Desenvolvimento com hot reload
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 📋 Logs e Monitoramento

### Arquivos de Log
- `backend/logs/combined.log` - Todos os logs
- `backend/logs/error.log` - Apenas erros

### Monitoramento
- Logs estruturados com timestamps
- Rastreamento de requests HTTP
- Monitoramento de erros de banco
- Performance tracking

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para detalhes.

---

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o sistema:
- Documentação: Veja os arquivos em `/documentacao/`
- Issues: Use o sistema de issues do repositório
- Email: [seu-email@empresa.com]

---

**Última atualização**: 17 de agosto de 2025
**Versão**: 1.0.0
**Status**: Em desenvolvimento ativo