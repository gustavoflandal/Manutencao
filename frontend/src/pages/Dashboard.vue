<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1>Painel de Controle</h1>
      <p>Bem-vindo, {{ authStore.user?.nome }}!</p>
    </header>

    <div class="dashboard-content">
      <div class="dashboard-cards">
        <div class="card">
          <h3>Solicitações</h3>
          <div class="card-stats">
            <span class="stats-number" :class="{ 'loading': loading }">
              {{ loading ? '...' : stats.totalRequests }}
            </span>
            <span class="stats-label">Total</span>
          </div>
        </div>

        <div class="card">
          <h3>Ordens de Serviço</h3>
          <div class="card-stats">
            <span class="stats-number" :class="{ 'loading': loading }">
              {{ loading ? '...' : stats.openWorkOrders }}
            </span>
            <span class="stats-label">Abertas</span>
          </div>
        </div>

        <div class="card" v-if="canManageUsers">
          <h3>Usuários</h3>
          <div class="card-stats">
            <span class="stats-number" :class="{ 'loading': loading }">
              {{ loading ? '...' : stats.activeUsers }}
            </span>
            <span class="stats-label">Ativos</span>
          </div>
        </div>
        
        <div class="card">
          <h3>Departamentos</h3>
          <div class="card-stats">
            <span class="stats-number" :class="{ 'loading': loading }">
              {{ loading ? '...' : stats.departments }}
            </span>
            <span class="stats-label">Cadastrados</span>
          </div>
        </div>
      </div>

      <div class="dashboard-actions">
        <h2>Ações Rápidas</h2>
        <div class="action-buttons">
          <button class="btn btn-primary" @click="$router.push('/solicitacoes/create')">
            Nova Solicitação
          </button>
          
          <button 
            v-if="canManageUsers" 
            class="btn btn-secondary" 
            @click="$router.push('/users')"
          >
            Gerenciar Usuários
          </button>
          
          <button 
            class="btn btn-secondary" 
            @click="$router.push('/departments')"
          >
            Gerenciar Departamentos
          </button>
          
          <button class="btn btn-outline" @click="$router.push('/profile')">
            Meu Perfil
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuthStore()

const stats = ref({
  totalRequests: 0,
  openWorkOrders: 0,
  activeUsers: 0,
  departments: 0
})

const loading = ref(false)

const canManageUsers = computed(() => {
  const roleLevel = {
    'solicitante': 1,
    'tecnico': 2,
    'supervisor': 3,
    'administrador': 4
  }
  
  return roleLevel[authStore.user?.perfil] >= 3
})

const loadStats = async () => {
  try {
    loading.value = true
    
    // Carregar estatísticas em paralelo
    const promises = []
    
    // Solicitações (todos podem ver)
    promises.push(
      api.get('/solicitacoes?limit=1')
        .then(response => {
          stats.value.totalRequests = response.data.data?.pagination?.totalItems || 0
        })
        .catch(() => {
          stats.value.totalRequests = 0
        })
    )
    
    // Ordens de serviço (todos podem ver)
    promises.push(
      api.get('/ordens-servico?limit=1')
        .then(response => {
          stats.value.openWorkOrders = response.data.data?.pagination?.totalItems || 0
        })
        .catch(() => {
          stats.value.openWorkOrders = 0
        })
    )
    
    // Usuários ativos (apenas supervisores e admins)
    if (canManageUsers.value) {
      promises.push(
        api.get('/users?ativo=true&limit=1')
          .then(response => {
            stats.value.activeUsers = response.data.data?.pagination?.totalItems || 0
          })
          .catch(() => {
            stats.value.activeUsers = 0
          })
      )
    }
    
    // Departamentos (todos podem ver via endpoint público)
    promises.push(
      api.get('/public/departments/active')
        .then(response => {
          stats.value.departments = response.data.data?.departments?.length || 0
        })
        .catch(() => {
          stats.value.departments = 0
        })
    )
    
    await Promise.all(promises)
    
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard {
  padding: 2rem;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  color: var(--primary-color);
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.dashboard-header p {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
}

.card h3 {
  color: var(--primary-color);
  font-size: 1.1rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.card-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stats-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--secondary-color);
  line-height: 1;
  transition: opacity 0.3s ease;
}

.stats-number.loading {
  opacity: 0.5;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

.stats-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.dashboard-actions h2 {
  color: var(--primary-color);
  font-size: 1.4rem;
  margin-bottom: 1rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: var(--secondary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--secondary-hover);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--primary-color);
  color: white;
}

.btn-secondary:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.btn-outline {
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.btn-outline:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-1px);
}
</style>
