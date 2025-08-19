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
  position: relative;
  min-height: calc(100vh - 80px);
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.dashboard::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(173, 181, 189, 0.02) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(108, 117, 125, 0.015) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(173, 181, 189, 0.02) 0%, transparent 50%),
    linear-gradient(45deg, transparent 40%, rgba(173, 181, 189, 0.01) 50%, transparent 60%);
  background-size: 500px 500px, 400px 400px, 300px 300px, 150px 150px;
  z-index: 0;
  pointer-events: none;
}

.dashboard::after {
  content: 'UpKeep Pró 1.0';
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  font-size: 2rem;
  font-weight: 300;
  color: rgba(108, 117, 125, 0.04);
  z-index: 0;
  pointer-events: none;
  transform: rotate(-15deg);
  letter-spacing: 2px;
}

.dashboard-header,
.dashboard-content {
  position: relative;
  z-index: 1;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  color: var(--primary-color);
  font-size: 2rem;
  margin-bottom: 0.5rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.07),
    0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(173, 181, 189, 0.2);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.1),
    0 4px 10px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
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
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background: rgba(52, 152, 219, 0.9);
  color: white;
  border: 1px solid rgba(52, 152, 219, 0.3);
}

.btn-primary:hover {
  background: rgba(41, 128, 185, 0.95);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-secondary {
  background: rgba(44, 62, 80, 0.9);
  color: white;
  border: 1px solid rgba(44, 62, 80, 0.3);
}

.btn-secondary:hover {
  background: rgba(52, 73, 94, 0.95);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-outline {
  background: rgba(255, 255, 255, 0.8);
  color: var(--primary-color);
  border: 2px solid rgba(44, 62, 80, 0.3);
}

.btn-outline:hover {
  background: rgba(44, 62, 80, 0.9);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
  .dashboard::after {
    font-size: 1.5rem;
    bottom: 1rem;
    right: 1rem;
  }
  
  .dashboard {
    padding: 1rem;
  }
  
  .dashboard-cards {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>
