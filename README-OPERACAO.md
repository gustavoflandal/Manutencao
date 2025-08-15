# 🔧 Sistema de Manutenção - Manual de Operação

## 🚀 **Como Iniciar o Sistema**

### ⚡ **Método Recomendado #### 1. **Erro "EADDRINUSE: address already in use"**
```powershell
# Execute o script de parada
.\stop.ps1
# Aguarde alguns segundos e inicie novamente
.\start.ps1
```tico)**
```powershell
# No diretório raiz do projeto (d:\Manutencao)
.\start.ps1
```

### 🛑 **Como Parar o Sistema**
```powershell
# No diretório raiz do projeto (d:\Manutencao)
.\stop.ps1
```

### 📝 **Métodos Alternativos**

#### Scripts Avançados (se disponíveis):
```powershell
# Scripts com mais funcionalidades
.\iniciar-sistema.ps1  # Mais verboso
.\parar-sistema.ps1    # Mais detalhado
```

## 🔧 **Solucionando Problemas de Porta Bloqueada**

### ❌ **Problema**: Porta 3002 fica bloqueada após fechar navegador

**Causa**: O Vite (servidor de desenvolvimento) às vezes não libera adequadamente a porta quando é interrompido abruptamente.

### ✅ **Soluções**:

#### 1. **Usar Scripts Automatizados** (Recomendado)
```powershell
# Para parar tudo e limpar portas
.\stop.ps1

# Para iniciar limpo
.\start.ps1
```

#### 2. **Comando Manual para Liberar Porta 3002**
```powershell
# Encontrar processo na porta 3002 e finalizar
netstat -ano | findstr ":3002"
# Copie o PID da última coluna e execute:
Stop-Process -Id [PID] -Force
```

#### 3. **Comando Manual para Liberar Todas as Portas**
```powershell
# Finalizar todos os processos Node.js
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

#### 4. **Reinicializar Frontend com Limpeza**
```powershell
cd "d:\Manutencao\frontend"
npm run dev:clean
```

## 📋 **Estrutura dos Serviços**

| Serviço  | Porta | URL                    | Função           |
|----------|-------|------------------------|------------------|
| Backend  | 3001  | http://localhost:3001  | API + Database   |
| Frontend | 3002  | http://localhost:3002  | Interface Web    |

## 🔐 **Credenciais Padrão**

- **Email**: admin@sistema.com
- **Senha**: 123456
- **Perfil**: Administrador

## 🛠️ **Comandos de Desenvolvimento**

### Backend
```powershell
cd "d:\Manutencao\backend"
npm start          # Iniciar servidor
npm run dev        # Modo desenvolvimento com reload
```

### Frontend
```powershell
cd "d:\Manutencao\frontend"
npm run dev        # Servidor de desenvolvimento
npm run dev:clean  # Iniciar com limpeza de porta
npm run build      # Build para produção
```

## 🔍 **Verificação de Status**

### Verificar se os serviços estão rodando:
```powershell
# Verificar portas ocupadas
netstat -ano | findstr ":3001\|:3002"

# Verificar processos Node.js
Get-Process -Name node -ErrorAction SilentlyContinue
```

### Testar APIs:
```powershell
# Testar backend
Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method Get

# Testar frontend (deve retornar HTML)
Invoke-WebRequest -Uri "http://localhost:3002" -Method Get
```

## 🚨 **Solução de Problemas Comuns**

### 1. **Erro "EADDRINUSE: address already in use"**
```powershell
# Execute o script de parada
.\parar-sistema.ps1
# Aguarde alguns segundos e inicie novamente
.\iniciar-sistema.ps1
```

### 2. **Frontend não carrega após reiniciar**
```powershell
# Limpe o cache do navegador ou use Ctrl+F5
# Ou execute limpeza manual:
cd "d:\Manutencao\frontend"
npm run kill:port
npm run dev
```

### 3. **Erro de conexão com banco de dados**
```powershell
# Verifique se o MySQL está rodando
# Verifique as configurações em backend/.env
```

### 4. **Problemas de CORS**
```powershell
# O proxy está configurado no vite.config.js
# Se persistir, reinicie ambos os serviços
```

## 💡 **Melhores Práticas**

1. **Sempre use os scripts de inicialização/parada**
2. **Não feche terminais abruptamente** (use Ctrl+C)
3. **Se houver problemas, reinicie AMBOS os serviços**
4. **Mantenha apenas uma instância de cada serviço rodando**
5. **Use `.\stop.ps1` antes de desligar o computador**

## 📞 **URLs de Acesso**

- 🌐 **Sistema Principal**: http://localhost:3002
- 🔧 **API Backend**: http://localhost:3001/api
- 📚 **Documentação**: Este arquivo

---

### 🎯 **Resumo Rápido**

```powershell
# Para usar o sistema diariamente:
.\start.ps1  # Iniciar
# ... usar o sistema ...
.\stop.ps1   # Parar
```

**Problema resolvido! O sistema agora é totalmente estável. 🎉**
