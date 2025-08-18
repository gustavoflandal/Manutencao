<template>
  <div id="app">
    <!-- Navegação superior quando autenticado -->
    <nav v-if="authStore.isAuthenticated" class="navbar">
      <div class="navbar-brand">
        <router-link to="/dashboard" class="brand-link">
          🔧 Sistema de Manutenção
        </router-link>
      </div>
      
      <div class="navbar-menu">
        <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
        <router-link to="/solicitacoes" class="nav-link">Solicitações</router-link>
        <router-link to="/ativos" class="nav-link">Ativos</router-link>
        <router-link v-if="authStore.hasRole('tecnico')" to="/setores" class="nav-link">Setores</router-link>
        <router-link v-if="authStore.hasRole('tecnico')" to="/preventiva" class="nav-link">Preventiva</router-link>
        <router-link v-if="authStore.hasRole('tecnico')" to="/estoque" class="nav-link">Estoque</router-link>
        <router-link v-if="authStore.hasRole('supervisor')" to="/users" class="nav-link">Usuários</router-link>
        <router-link to="/departments" class="nav-link">Departamentos</router-link>
        <router-link v-if="authStore.hasRole('administrador')" to="/categories" class="nav-link">Categorias</router-link>
        <router-link v-if="authStore.hasRole('supervisor')" to="/permissions" class="nav-link">Permissões</router-link>
        <router-link to="/profile" class="nav-link">Perfil</router-link>
        <button @click="handleLogout" class="nav-button">Sair</button>
      </div>
      
      <div class="navbar-user">
        <span class="user-name">{{ authStore.userName }}</span>
        <span class="user-role">{{ getRoleLabel(authStore.userRole) }}</span>
      </div>
    </nav>

    <!-- Conteúdo principal -->
    <main :class="{ 'with-navbar': authStore.isAuthenticated }">
      <router-view />
    </main>

    <!-- Notificações Toast -->
    <div class="toast-container">
      <Toast
        v-for="toast in toasts"
        :key="toast.id"
        :type="toast.type"
        :title="toast.title"
        :message="toast.message"
        :duration="0"
        @close="removeToast(toast.id)"
      />
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import Toast from '@/components/Toast.vue'

const authStore = useAuthStore()
const router = useRouter()
const { toasts, removeToast } = useToast()

const getRoleLabel = (role) => {
  const labels = {
    'solicitante': 'Solicitante',
    'tecnico': 'Técnico', 
    'supervisor': 'Supervisor',
    'administrador': 'Administrador'
  }
  return labels[role] || role
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #f8f9fa;
}

/* Variáveis CSS locais para compatibilidade */
:root {
  --primary-color: #2c3e50;
  --secondary-color: #3498db;
  --primary-hover: #34495e;
  --secondary-hover: #2980b9;
  --border-color: #e9ecef;
  --text-secondary: #6c757d;
  --shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.navbar {
  background: var(--primary-color);
  color: white;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.navbar-brand .brand-link {
  color: white;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: 700;
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: rgba(255,255,255,0.1);
}

.nav-button {
  background: transparent;
  color: white;
  border: 2px solid rgba(255,255,255,0.3);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-button:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.5);
}

.navbar-user {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 0.9rem;
}

.user-name {
  font-weight: 600;
}

.user-role {
  opacity: 0.8;
  font-size: 0.8rem;
}

main {
  min-height: calc(100vh);
}

main.with-navbar {
  min-height: calc(100vh - 80px);
}

.toast-container {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1000;
  pointer-events: none;
}

.toast-container > * {
  pointer-events: all;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .navbar {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .navbar-menu {
    gap: 1rem;
  }
  
  .toast-container {
    left: 1rem;
    right: 1rem;
    top: 1rem;
  }
}
</style>
