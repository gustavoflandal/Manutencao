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
            <span class="stats-number">0</span>
            <span class="stats-label">Total</span>
          </div>
        </div>

        <div class="card">
          <h3>Ordens de Serviço</h3>
          <div class="card-stats">
            <span class="stats-number">0</span>
            <span class="stats-label">Abertas</span>
          </div>
        </div>

        <div class="card" v-if="canManageUsers">
          <h3>Usuários</h3>
          <div class="card-stats">
            <span class="stats-number">1</span>
            <span class="stats-label">Ativos</span>
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
          
          <button class="btn btn-outline" @click="$router.push('/profile')">
            Meu Perfil
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const canManageUsers = computed(() => {
  const roleLevel = {
    'solicitante': 1,
    'tecnico': 2,
    'supervisor': 3,
    'administrador': 4
  }
  
  return roleLevel[authStore.user?.perfil] >= 3
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
