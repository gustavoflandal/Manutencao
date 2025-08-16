<template>
  <div class="users-page">
    <header class="page-header">
      <h1>Gerenciamento de Usuários</h1>
      
      <button 
        v-if="canCreateUsers" 
        class="btn btn-primary" 
        @click="$router.push('/users/create')"
      >
        Novo Usuário
      </button>
    </header>

    <div class="users-content">
      <div class="users-filters">
        <input 
          v-model="searchTerm" 
          type="text" 
          placeholder="Buscar usuários..."
          class="form-input"
        >
        
        <select v-model="selectedRole" class="form-select">
          <option value="">Todos os perfis</option>
          <option value="solicitante">Solicitante</option>
          <option value="tecnico">Técnico</option>
          <option value="supervisor">Supervisor</option>
          <option value="administrador">Administrador</option>
        </select>
      </div>

      <div class="users-table">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Perfil</th>
              <th>Departamento</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>{{ user.nome }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span class="role-badge" :class="user.perfil">
                  {{ getRoleLabel(user.perfil) }}
                </span>
              </td>
              <td>{{ user.departamento || '-' }}</td>
              <td>
                <span class="status-badge" :class="{ active: user.ativo, inactive: !user.ativo }">
                  {{ user.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button 
                    class="btn btn-sm btn-secondary" 
                    @click="editUser(user)"
                  >
                    Editar
                  </button>
                  <button 
                    v-if="canManagePermissions" 
                    class="btn btn-sm btn-info" 
                    @click="managePermissions(user)"
                  >
                    Permissões
                  </button>
                  <button 
                    v-if="canDeactivateUser(user)" 
                    class="btn btn-sm btn-danger" 
                    @click="deactivateUser(user)"
                  >
                    Desativar
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="6" class="no-data">
                Nenhum usuário encontrado
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import api from '@/services/api'

const authStore = useAuthStore()
const router = useRouter()
const { success, error } = useToast()

const users = ref([])
const searchTerm = ref('')
const selectedRole = ref('')
const loading = ref(false)

const canCreateUsers = computed(() => {
  return authStore.user?.perfil === 'administrador'
})

const canManagePermissions = computed(() => {
  return authStore.user?.perfil === 'administrador' || authStore.user?.perfil === 'supervisor'
})

const filteredUsers = computed(() => {
  let filtered = users.value

  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(user => 
      user.nome.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      (user.departamento && user.departamento.toLowerCase().includes(search))
    )
  }

  if (selectedRole.value) {
    filtered = filtered.filter(user => user.perfil === selectedRole.value)
  }

  return filtered
})

const getRoleLabel = (role) => {
  const labels = {
    'solicitante': 'Solicitante',
    'tecnico': 'Técnico',
    'supervisor': 'Supervisor',
    'administrador': 'Administrador'
  }
  return labels[role] || role
}

const canDeactivateUser = (user) => {
  return authStore.user?.perfil === 'administrador' && 
         user.id !== authStore.user.id &&
         user.ativo
}

const loadUsers = async () => {
  try {
    loading.value = true
    const response = await api.get('/users')
    if (response.data.success) {
      users.value = response.data.data.users
    }
  } catch (err) {
    console.error('Erro ao carregar usuários:', err)
    error('Erro ao carregar usuários', 'Não foi possível carregar a lista de usuários')
  } finally {
    loading.value = false
  }
}

const editUser = (user) => {
  router.push(`/users/${user.id}/edit`)
}

const managePermissions = (user) => {
  router.push(`/permissions?user=${user.id}`)
}

const deactivateUser = async (user) => {
  if (!confirm(`Deseja realmente desativar o usuário ${user.nome}?`)) {
    return
  }

  try {
    await api.delete(`/users/${user.id}`)
    success('Usuário desativado', `${user.nome} foi desativado com sucesso`)
    await loadUsers() // Recarregar lista
  } catch (err) {
    console.error('Erro ao desativar usuário:', err)
    error('Erro ao desativar', 'Não foi possível desativar o usuário')
  }
}

const verificarToken = async () => {
  try {
    await authStore.verifyToken()
  } catch (error) {
    console.error('Erro ao verificar token:', error)
  }
}

onMounted(() => {
  // Verificar se o usuário está autenticado
  if (!authStore.user && authStore.token) {
    authStore.verifyToken().catch(error => {
      console.error('Erro ao verificar token:', error)
    })
  }
  
  loadUsers()
})
</script>

<style scoped>
.users-page {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  color: var(--primary-color);
  font-size: 2rem;
  margin: 0;
}

.users-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.form-input,
.form-select {
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  background: white;
}

.form-input {
  min-width: 300px;
  flex: 1;
}

.form-select {
  min-width: 200px;
}

.users-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: var(--primary-color);
  color: white;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
}

td {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

tr:last-child td {
  border-bottom: none;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: capitalize;
}

.role-badge.solicitante {
  background: #e3f2fd;
  color: #1976d2;
}

.role-badge.tecnico {
  background: #f3e5f5;
  color: #7b1fa2;
}

.role-badge.supervisor {
  background: #fff3e0;
  color: #f57c00;
}

.role-badge.administrador {
  background: #ffebee;
  color: #d32f2f;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.active {
  background: #e8f5e8;
  color: #2e7d32;
}

.status-badge.inactive {
  background: #ffebee;
  color: #d32f2f;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
}

.btn-primary {
  background: var(--secondary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--secondary-hover);
}

.btn-secondary {
  background: var(--primary-color);
  color: white;
}

.btn-secondary:hover {
  background: var(--primary-hover);
}

.btn-info {
  background: #1976d2;
  color: white;
}

.btn-info:hover {
  background: #1565c0;
}

.btn-danger {
  background: #d32f2f;
  color: white;
}

.btn-danger:hover {
  background: #b71c1c;
}

.no-data {
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem;
  font-style: italic;
}
</style>
