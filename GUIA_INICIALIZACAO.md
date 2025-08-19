# 🚀 Guia de Inicialização do Sistema

Este documento explica como configurar e inicializar o Sistema de Gestão de Manutenção pela primeira vez.

## 📋 Pré-requisitos

### Software Necessário
- **Node.js** (versão 16+) - [Download](https://nodejs.org/)
- **MySQL** (versão 8.0+) - [Download](https://dev.mysql.com/downloads/)
- **Git** (opcional) - [Download](https://git-scm.com/)

### Configuração do MySQL
1. Instale o MySQL Server
2. Configure usuário root com senha
3. Certifique-se de que o serviço está rodando (porta 3306)

## 🔧 Métodos de Inicialização

### Método 1: Script Automático (Recomendado)

#### Windows - PowerShell
```powershell
# Execução básica
.\inicializar-sistema.ps1

# Com logs detalhados
.\inicializar-sistema.ps1 -Verbose

# Forçar reinicialização
.\inicializar-sistema.ps1 -Force

# Pular verificações
.\inicializar-sistema.ps1 -SkipCheck
```

#### Windows - Batch
```cmd
# Duplo clique no arquivo ou execute:
inicializar-sistema.bat
```

### Método 2: Manual

#### 1. Preparar Ambiente
```bash
# Instalar dependências do backend
cd backend
npm install

# Voltar ao diretório raiz
cd ..
```

#### 2. Configurar Variáveis (Opcional)
```bash
# Criar arquivo .env na raiz do projeto
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=sua_senha_mysql
DB_NAME=manutencao_db
NODE_ENV=development
PORT=3000
JWT_SECRET=seu_jwt_secret_aqui
```

#### 3. Executar Inicialização
```bash
cd backend
node initialize-database.js
```

## 📊 O que o Script Faz

### 1. Verificação do Banco de Dados
- ✅ Conecta ao MySQL
- ✅ Verifica se o banco `manutencao_db` existe
- ✅ Cria o banco se não existir

### 2. Criação das Tabelas
- ✅ Users (usuários)
- ✅ Departments (departamentos)
- ✅ Setores (setores operacionais)
- ✅ Categories (categorias de solicitação)
- ✅ SubCategories (subcategorias)
- ✅ CategoriaEstoque (categorias de estoque)
- ✅ Permissions (permissões do sistema)
- ✅ UserPermissions (relação usuário-permissão)
- ✅ Solicitacoes (solicitações de manutenção)
- ✅ OrdemServico (ordens de serviço)
- ✅ Ativos (equipamentos e ativos)
- ✅ ItemEstoque (itens de estoque)
- ✅ MovimentacaoEstoque (movimentações)
- ✅ Fornecedores (fornecedores)

### 3. Inserção de Dados Iniciais

#### Usuário Administrador
- **Email**: admin@sistema.com
- **Senha**: 123456
- **Perfil**: Administrador
- **Departamento**: TI
- **Permissões**: Todas as permissões do sistema

#### Departamentos (5)
- Tecnologia da Informação
- Manutenção
- Recursos Humanos
- Financeiro
- Operações

#### Setores (5)
- ADMIN - Administração
- PROD - Produção
- MANUT - Manutenção
- ARMAZ - Armazenagem
- QUAL - Qualidade

#### Categorias de Solicitação (7)
- Infraestrutura
- Equipamentos
- TI e Tecnologia
- Limpeza
- Segurança
- Elétrica
- Hidráulica

#### Subcategorias (24)
- Cada categoria possui 2-5 subcategorias específicas

#### Categorias de Estoque (7)
- Material Elétrico
- Material Hidráulico
- Ferramentas
- Material de Limpeza
- Material de Escritório
- Equipamentos de Segurança
- Peças de Manutenção

#### Permissões (40+)
- Permissões granulares por módulo
- Create, Read, Update, Delete para cada entidade
- Permissões especiais (approve, assign, manage)

## 🔐 Informações de Acesso Inicial

### Usuário Administrador
```
Email: admin@sistema.com
Senha: 123456
```

### Banco de Dados
```
Host: localhost
Porta: 3306
Banco: manutencao_db
Usuário: root (configurável)
```

### Sistema Web
```
URL: http://localhost:3000
Frontend: http://localhost:5173 (desenvolvimento)
Backend API: http://localhost:3000/api
```

## ⚠️ Importante - Segurança

### Após a Primeira Inicialização:

1. **Altere a senha do administrador**
   - Faça login no sistema
   - Vá em Perfil → Alterar Senha
   - Use uma senha forte

2. **Configure variáveis de ambiente**
   - Crie arquivo `.env` personalizado
   - Use senhas seguras para banco
   - Configure JWT_SECRET único

3. **Revise permissões**
   - Crie usuários específicos para cada função
   - Atribua apenas permissões necessárias
   - Desative o usuário admin padrão se necessário

## 🛠️ Troubleshooting

### Erro: "Access denied for user"
```bash
# Verifique credenciais do MySQL
mysql -u root -p

# Ou ajuste no .env:
DB_USER=seu_usuario
DB_PASS=sua_senha
```

### Erro: "Database does not exist"
```bash
# O script cria automaticamente, mas você pode criar manualmente:
mysql -u root -p
CREATE DATABASE manutencao_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Erro: "Cannot find module"
```bash
# Reinstalar dependências
cd backend
rm -rf node_modules
npm install
```

### Erro: "Port 3306 is not accessible"
```bash
# Verificar se MySQL está rodando
# Windows:
net start mysql

# Ou via Services.msc
```

### Erro: "Table already exists"
```bash
# Executar com force (apaga dados existentes):
.\inicializar-sistema.ps1 -Force

# Ou limpar manualmente:
mysql -u root -p
DROP DATABASE manutencao_db;
```

## 📁 Estrutura de Arquivos Criados

Após a inicialização, a estrutura será:

```
projeto/
├── .env                           # Variáveis de ambiente
├── inicializar-sistema.ps1        # Script PowerShell de inicialização
├── inicializar-sistema.bat        # Script Batch de inicialização
├── backend/
│   ├── initialize-database.js     # Script principal de inicialização
│   ├── backup-inicial.js          # Script de backup (criado automaticamente)
│   ├── node_modules/              # Dependências instaladas
│   └── logs/                      # Logs da aplicação
├── logs/                          # Logs gerais
├── uploads/                       # Arquivos enviados
└── temp/                          # Arquivos temporários
```

## 🔄 Reinicializando o Sistema

Se precisar reinicializar completamente:

### Método 1: Usando Force
```powershell
.\inicializar-sistema.ps1 -Force
```

### Método 2: Manual
```bash
# 1. Apagar banco existente
mysql -u root -p
DROP DATABASE manutencao_db;
exit

# 2. Executar inicialização
cd backend
node initialize-database.js
```

## 📞 Suporte

### Logs
- Logs da aplicação: `backend/logs/`
- Logs de erro: `backend/logs/error.log`
- Logs combinados: `backend/logs/combined.log`

### Verificação de Status
```bash
cd backend
node test-connection.js
```

### Backup dos Dados Iniciais
```bash
cd backend
node backup-inicial.js
```

---

**Data de Criação**: 18 de agosto de 2025  
**Sistema**: Gestão de Manutenção  
**Versão**: 1.0.0