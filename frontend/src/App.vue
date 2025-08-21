<template>
  <div id="app">
    <!-- Navegação superior quando autenticado -->
    <nav v-if="authStore.isAuthenticated" class="navbar">
      <div class="navbar-brand">
        <router-link to="/dashboard" class="brand-link">
          <span class="brand-text">UpKeep Pró 1.0</span>
        </router-link>
      </div>
      
      <div class="navbar-menu">
        <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
        <router-link to="/solicitacoes" class="nav-link">Solicitações</router-link>
        <router-link v-if="authStore.hasRole('tecnico')" to="/ordens-servico" class="nav-link">Ordens de Serviço</router-link>
        <router-link to="/ativos" class="nav-link">Ativos</router-link>
        <router-link v-if="authStore.hasRole('tecnico')" to="/preventiva" class="nav-link">Preventiva</router-link>
        <router-link v-if="authStore.hasRole('tecnico')" to="/estoque" class="nav-link">Estoque</router-link>
        <router-link v-if="authStore.hasRole('tecnico')" to="/workflows" class="nav-link">Workflows</router-link>
        <router-link v-if="authStore.hasRole('tecnico')" to="/setores" class="nav-link">Setores</router-link>
        <router-link to="/departments" class="nav-link">Departamentos</router-link>
        <router-link to="/reports" class="nav-link">Relatórios</router-link>
        <router-link v-if="authStore.hasRole('supervisor')" to="/users" class="nav-link">Usuários</router-link>
        <router-link v-if="authStore.hasRole('supervisor')" to="/permissions" class="nav-link">Permissões</router-link>
        <router-link to="/profile" class="nav-link">Perfil</router-link>
        <router-link to="/help" class="nav-link">Ajuda</router-link>
        <button @click="handleLogout" class="nav-button logout-button">
          <Icon name="logout" size="16" />
          Sair
        </button>
      </div>
      
      <div class="navbar-user">
        <span class="user-name">{{ authStore.userName }}</span>
        <span class="user-role">{{ getRoleLabel(authStore.userRole) }}</span>
      </div>
    </nav>

    <!-- Conteúdo principal -->
    <main :class="{ 'with-navbar': authStore.isAuthenticated }">
      <router-view />
      
      <!-- Botão de ajuda flutuante (apenas quando autenticado e não na página de ajuda) -->
      <HelpButton 
        v-if="authStore.isAuthenticated && !isHelpPage" 
        position="fixed"
      />
    </main>
    
    <!-- Toast Notifications -->
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
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from '@/composables/useToast'
import Toast from '@/components/Toast.vue'
import Icon from '@/components/Icon.vue'
import HelpButton from '@/components/help/HelpButton.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const { toasts, removeToast } = useToast()

// Computed
const isHelpPage = computed(() => route.path === '/help')

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
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  position: relative;
}

#app::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 80%, rgba(173, 181, 189, 0.015) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(108, 117, 125, 0.01) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(173, 181, 189, 0.01) 0%, transparent 50%);
  background-size: 600px 600px, 500px 500px, 400px 400px;
  background-attachment: fixed;
  z-index: -1;
  pointer-events: none;
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
  padding: 0.75rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 60px;
}

.navbar-brand .brand-link {
  color: white;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-icon {
  font-size: 1.8rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.brand-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.brand-text {
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex: 1;
  justify-content: center;
  margin: 0 2rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  transition: background-color 0.2s;
  font-size: 0.875rem;
  white-space: nowrap;
  letter-spacing: -0.2px;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-button:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.5);
}

.logout-button {
  background: rgba(220, 53, 69, 0.1);
  border-color: rgba(220, 53, 69, 0.3);
  color: #ff6b7a;
}

.logout-button:hover {
  background: rgba(220, 53, 69, 0.2);
  border-color: rgba(220, 53, 69, 0.5);
  color: #fff;
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
  min-height: calc(100vh - 60px);
  margin-top: 60px;
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
