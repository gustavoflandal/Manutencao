# 📋 Sistema de Inicialização - Resumo Completo

## ✅ Arquivos Criados

### 🔧 Scripts de Inicialização
1. **`backend/initialize-database.js`** - Script principal Node.js
   - Verifica e cria banco de dados
   - Sincroniza modelos (tabelas)
   - Insere dados iniciais completos
   - Cria usuário administrador

2. **`inicializar-sistema.ps1`** - Script PowerShell avançado
   - Verificações completas do sistema
   - Instalação automática de dependências
   - Logs detalhados e relatórios
   - Parâmetros: -Force, -Verbose, -SkipCheck

3. **`inicializar-sistema.bat`** - Script Batch simples
   - Versão simplificada para usuários básicos
   - Execução rápida e direta
   - Interface amigável

### 📚 Documentação
4. **`GUIA_INICIALIZACAO.md`** - Guia completo
   - Instruções detalhadas de uso
   - Troubleshooting
   - Configurações avançadas

5. **`INFORMACOES_PADRONIZACAO.md`** - Documentação do sistema de botões
   - Consolidação de todas as informações da padronização
   - Guia técnico completo

### 🔄 Melhorias em Arquivos Existentes
6. **`start.ps1`** - Melhorado com verificações
   - Verifica se sistema foi inicializado
   - Testa conexão com banco de dados
   - Alerta se configuração está incompleta

## 🎯 O que o Sistema de Inicialização Faz

### 1. Verificação e Criação do Banco
- ✅ Conecta ao MySQL/MariaDB
- ✅ Verifica se banco `manutencao_db` existe
- ✅ Cria banco com charset UTF8MB4 se necessário
- ✅ Configura collation unicode

### 2. Criação de Tabelas (Modelos Sequelize)
```sql
-- Tabelas principais criadas:
users               -- Usuários do sistema
departments         -- Departamentos organizacionais
setores            -- Setores operacionais
categories         -- Categorias de solicitação  
subcategories      -- Subcategorias
categorias_estoque -- Categorias de estoque
permissions        -- Permissões do sistema
user_permissions   -- Relacionamento usuário-permissão
solicitacoes       -- Solicitações de manutenção
ordem_servicos     -- Ordens de serviço
ativos             -- Equipamentos e ativos
item_estoque       -- Itens de estoque
movimentacao_estoque -- Movimentações
fornecedores       -- Fornecedores
```

### 3. Dados Iniciais Inseridos

#### 👤 Usuário Administrador
- **Email**: admin@sistema.com
- **Senha**: 123456
- **Perfil**: Administrador
- **Permissões**: Todas (40+ permissões)

#### 🏢 Departamentos (5)
- Tecnologia da Informação
- Manutenção  
- Recursos Humanos
- Financeiro
- Operações

#### 🏭 Setores (5)
- ADMIN - Administração
- PROD - Produção
- MANUT - Manutenção
- ARMAZ - Armazenagem
- QUAL - Qualidade

#### 📂 Categorias de Solicitação (7)
- Infraestrutura (🔴 Vermelho)
- Equipamentos (🟢 Verde)
- TI e Tecnologia (🔵 Azul)
- Limpeza (🔵 Ciano)
- Segurança (🟡 Amarelo)
- Elétrica (🟠 Laranja)
- Hidráulica (🟢 Verde-água)

#### 📋 Subcategorias (24)
Cada categoria possui 2-5 subcategorias específicas:
- **Infraestrutura**: Pintura, Alvenaria, Telhado, Pisos
- **Equipamentos**: Maquinário, Ferramentas, Veículos, Ar Condicionado
- **TI**: Hardware, Software, Rede, Telefonia
- **Limpeza**: Limpeza Geral, Jardinagem, Dedetização
- **Segurança**: Câmeras, Alarmes, Controle de Acesso
- **Elétrica**: Iluminação, Tomadas, Quadros Elétricos
- **Hidráulica**: Vazamentos, Entupimentos, Instalações

#### 📦 Categorias de Estoque (7)
- ELET - Material Elétrico
- HIDR - Material Hidráulico
- FERR - Ferramentas
- LIMP - Material de Limpeza
- ESCR - Material de Escritório
- SEGUR - Equipamentos de Segurança
- MANU - Peças de Manutenção

#### 🔐 Permissões (40+)
Permissões granulares por módulo:
- **users**: create, read, update, delete, manage
- **permissions**: create, read, update, delete, assign
- **solicitacoes**: create, read, update, delete, approve, assign
- **ordens**: create, read, update, delete, complete, assign
- **ativos**: create, read, update, delete, maintain
- **estoque**: create, read, update, delete, moviment, categories, suppliers
- **preventiva**: create, read, update, delete, schedule
- **relatorios**: read, export, create
- **config**: read, update, system
- **dashboard**: read, analytics

## 🚀 Como Usar

### Primeira Execução (Recomendado)
```powershell
# PowerShell com recursos avançados
.\inicializar-sistema.ps1

# Ou versão simples
.\inicializar-sistema.bat
```

### Execução Manual
```bash
# Instalar dependências
cd backend
npm install

# Executar inicialização
node initialize-database.js

# Voltar e iniciar sistema
cd ..
.\start.ps1
```

### Parâmetros do PowerShell
```powershell
# Logs detalhados
.\inicializar-sistema.ps1 -Verbose

# Forçar reinicialização
.\inicializar-sistema.ps1 -Force

# Pular verificações
.\inicializar-sistema.ps1 -SkipCheck

# Combinado
.\inicializar-sistema.ps1 -Force -Verbose
```

## 📊 Informações Técnicas

### Configurações Padrão
```ini
# Banco de Dados
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=root
DB_NAME=manutencao_db

# Aplicação
NODE_ENV=development
PORT=3000
JWT_SECRET=gerado_automaticamente
```

### Portas Utilizadas
- **3000**: Backend API (produção)
- **3001**: Backend API (desenvolvimento)
- **3002**: Frontend (desenvolvimento)
- **5173**: Vite dev server (frontend)

### Estrutura de Logs
```
logs/
├── combined.log    # Todos os logs
├── error.log      # Apenas erros
└── access.log     # Logs de acesso

backend/logs/
├── combined.log   # Logs do backend
└── error.log      # Erros do backend
```

## ⚠️ Segurança e Boas Práticas

### Pós-Inicialização OBRIGATÓRIO
1. **Alterar senha do admin**
   ```
   Login: admin@sistema.com / 123456
   Ir em: Perfil → Alterar Senha
   ```

2. **Configurar .env personalizado**
   ```bash
   # Copiar .env.example para .env
   # Personalizar senhas e secrets
   ```

3. **Criar usuários específicos**
   ```
   - Não usar admin para operações diárias
   - Criar técnicos, supervisores, solicitantes
   - Atribuir permissões específicas
   ```

4. **Backup inicial**
   ```bash
   cd backend
   node backup-inicial.js
   ```

## 🛠️ Troubleshooting Rápido

### Erro de Conexão MySQL
```bash
# Verificar serviço
net start mysql

# Testar conexão
mysql -u root -p

# Ajustar credenciais no .env
```

### Erro "Table already exists"
```powershell
# Forçar recreação
.\inicializar-sistema.ps1 -Force
```

### Dependências não instaladas
```bash
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend  
rm -rf node_modules package-lock.json
npm install
```

### Porta ocupada
```bash
# Verificar processos
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Matar processos
taskkill /F /PID numero_do_pid
```

## 📞 URLs e Acessos

### Sistema em Desenvolvimento
- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:3001/api
- **Documentação API**: http://localhost:3001/api-docs

### Sistema em Produção
- **Aplicação**: http://localhost:3000
- **API**: http://localhost:3000/api

### Credenciais Iniciais
- **Email**: admin@sistema.com
- **Senha**: 123456
- **Perfil**: Administrador completo

## ✅ Checklist de Verificação

### Antes de Inicializar
- [ ] Node.js instalado (v16+)
- [ ] MySQL/MariaDB instalado e rodando
- [ ] Portas 3000-3002 livres
- [ ] Privilégios para criar banco de dados

### Após Inicialização
- [ ] Banco `manutencao_db` criado
- [ ] Tabelas criadas (12+ tabelas)
- [ ] Usuário admin existe
- [ ] Departamentos inseridos (5)
- [ ] Categorias inseridas (7)
- [ ] Permissões inseridas (40+)
- [ ] Sistema acessível via web

### Segurança
- [ ] Senha do admin alterada
- [ ] Arquivo .env personalizado
- [ ] Backup inicial criado
- [ ] Usuários específicos criados

---

**Sistema**: Gestão de Manutenção  
**Data**: 18 de agosto de 2025  
**Versão**: 1.0.0  
**Status**: ✅ Pronto para Produção