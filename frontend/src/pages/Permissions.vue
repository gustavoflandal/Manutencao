<template>
  <div class="permissions-page">
    <header class="page-header">
      <h1>Gerenciamento de Permissões</h1>
      <div class="header-actions">
        <button 
          v-if="canCreatePermissions" 
          class="btn btn-secondary" 
          @click="showCreatePermissionModal = true"
        >
          Nova Permissão
        </button>
        <button class="btn btn-outline" @click="$router.push('/users')">
          Voltar para Usuários
        </button>
      </div>
    </header>

    <div class="permissions-content">
      <!-- Seção de Usuários e suas Permissões -->
      <div class="users-permissions-section">
        <h2>Permissões por Usuário</h2>
        
        <div class="user-selector">
          <select v-model="selectedUserId" @change="loadUserPermissions" class="form-select">
            <option value="">Selecione um usuário</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.nome }} ({{ user.email }}) - {{ getRoleLabel(user.perfil) }}
            </option>
          </select>
        </div>

        <div v-if="selectedUser" class="user-permissions-manager">
          <div class="user-info">
            <h3>{{ selectedUser.nome }}</h3>
            <p>{{ selectedUser.email }} - {{ getRoleLabel(selectedUser.perfil) }}</p>
          </div>

          <div class="permissions-grid">
            <div class="permissions-available">
              <h4>Permissões Disponíveis</h4>
              <div class="permissions-list">
                <div 
                  v-for="permission in availablePermissions" 
                  :key="permission.id"
                  class="permission-item"
                  :class="{ 'module-header': isModuleHeader(permission) }"
                >
                  <div v-if="isModuleHeader(permission)" class="module-title">
                    {{ permission.module.toUpperCase() }}
                  </div>
                  <div v-else class="permission-card">
                    <div class="permission-info">
                      <div class="permission-name">{{ permission.name }}</div>
                      <div class="permission-description">{{ permission.description }}</div>
                    </div>
                    <button 
                      class="btn btn-sm btn-primary"
                      @click="grantPermission(permission.id)"
                      :disabled="loading"
                    >
                      Conceder
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="permissions-granted">
              <h4>Permissões Concedidas</h4>
              <div class="permissions-list">
                <div 
                  v-for="permission in grantedPermissions" 
                  :key="permission.id"
                  class="permission-item"
                  :class="{ 'module-header': isModuleHeader(permission) }"
                >
                  <div v-if="isModuleHeader(permission)" class="module-title">
                    {{ permission.module.toUpperCase() }}
                  </div>
                  <div v-else class="permission-card granted">
                    <div class="permission-info">
                      <div class="permission-name">{{ permission.name }}</div>
                      <div class="permission-description">{{ permission.description }}</div>
                      <div class="permission-meta">
                        Concedida em: {{ formatDate(permission.userPermission.granted_at) }}
                      </div>
                    </div>
                    <button 
                      class="btn btn-sm btn-danger"
                      @click="revokePermission(permission.id)"
                      :disabled="loading"
                    >
                      Revogar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Seção de Todas as Permissões -->
      <div class="all-permissions-section">
        <h2>Todas as Permissões do Sistema</h2>
        
        <div class="permissions-filters">
          <select v-model="selectedModule" class="form-select">
            <option value="">Todos os módulos</option>
            <option v-for="module in modules" :key="module" :value="module">
              {{ module.toUpperCase() }}
            </option>
          </select>
        </div>

        <div class="permissions-table">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Módulo</th>
                <th>Ação</th>
                <th>Recurso</th>
                <th>Descrição</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="permission in filteredAllPermissions" :key="permission.id">
                <td class="permission-name-cell">{{ permission.name }}</td>
                <td>
                  <span class="module-badge">{{ permission.module }}</span>
                </td>
                <td>
                  <span class="action-badge" :class="permission.action">{{ permission.action }}</span>
                </td>
                <td>{{ permission.resource || '-' }}</td>
                <td class="description-cell">{{ permission.description }}</td>
                <td>
                  <span class="status-badge" :class="{ active: permission.active, inactive: !permission.active }">
                    {{ permission.active ? 'Ativa' : 'Inativa' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal para criar nova permissão -->
    <div v-if="showCreatePermissionModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal-content" @click.stop>
        <header class="modal-header">
          <h3>Nova Permissão</h3>
          <button class="modal-close" @click="closeCreateModal">&times;</button>
        </header>
        
        <form @submit.prevent="createPermission" class="permission-form">
          <div class="form-group">
            <label for="permissionName">Nome *</label>
            <input
              id="permissionName"
              v-model="newPermission.name"
              type="text"
              class="form-input"
              required
              placeholder="ex: users.create"
            />
          </div>

          <div class="form-group">
            <label for="permissionModule">Módulo *</label>
            <input
              id="permissionModule"
              v-model="newPermission.module"
              type="text"
              class="form-input"
              required
              placeholder="ex: users, maintenance, reports"
            />
          </div>

          <div class="form-group">
            <label for="permissionAction">Ação *</label>
            <select id="permissionAction" v-model="newPermission.action" class="form-select" required>
              <option value="">Selecione uma ação</option>
              <option value="view">Visualizar</option>
              <option value="create">Criar</option>
              <option value="edit">Editar</option>
              <option value="delete">Deletar</option>
              <option value="manage">Gerenciar</option>
              <option value="approve">Aprovar</option>
              <option value="execute">Executar</option>
              <option value="export">Exportar</option>
            </select>
          </div>

          <div class="form-group">
            <label for="permissionResource">Recurso</label>
            <input
              id="permissionResource"
              v-model="newPermission.resource"
              type="text"
              class="form-input"
              placeholder="ex: permissions, advanced (opcional)"
            />
          </div>

          <div class="form-group">
            <label for="permissionDescription">Descrição *</label>
            <textarea
              id="permissionDescription"
              v-model="newPermission.description"
              class="form-textarea"
              required
              placeholder="Descreva o que esta permissão permite fazer"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-outline" @click="closeCreateModal">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Criando...' : 'Criar Permissão' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useRoute } from 'vue-router'
import api from '@/services/api'

const authStore = useAuthStore()
const { success, error } = useToast()
const route = useRoute()

// Estado
const users = ref([])
const permissions = ref([])
const modules = ref([])
const selectedUserId = ref('')
const selectedUser = ref(null)
const userPermissions = ref([])
const selectedModule = ref('')
const loading = ref(false)
const showCreatePermissionModal = ref(false)

// Novo formulário de permissão
const newPermission = ref({
  name: '',
  module: '',
  action: '',
  resource: '',
  description: ''
})

// Computed
const canCreatePermissions = computed(() => {
  return authStore.user?.perfil === 'administrador'
})

const availablePermissions = computed(() => {
  const granted = new Set(userPermissions.value.map(p => p.id))
  const available = permissions.value.filter(p => !granted.has(p.id) && p.active)
  return groupPermissionsByModule(available)
})

const grantedPermissions = computed(() => {
  return groupPermissionsByModule(userPermissions.value.filter(p => p.userPermission?.active))
})

const filteredAllPermissions = computed(() => {
  if (!selectedModule.value) return permissions.value
  return permissions.value.filter(p => p.module === selectedModule.value)
})

// Métodos
const getRoleLabel = (role) => {
  const labels = {
    'solicitante': 'Solicitante',
    'tecnico': 'Técnico',
    'supervisor': 'Supervisor',
    'administrador': 'Administrador'
  }
  return labels[role] || role
}

const groupPermissionsByModule = (permissionsList) => {
  const grouped = []
  const modules = [...new Set(permissionsList.map(p => p.module))]
  
  modules.forEach(module => {
    grouped.push({ isModuleHeader: true, module })
    const modulePermissions = permissionsList.filter(p => p.module === module)
    grouped.push(...modulePermissions)
  })
  
  return grouped
}

const isModuleHeader = (item) => {
  return item.isModuleHeader === true
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadUsers = async () => {
  try {
    const response = await api.get('/users')
    if (response.data.success) {
      users.value = response.data.data.users
    }
  } catch (err) {
    error('Erro', 'Não foi possível carregar a lista de usuários')
  }
}

const loadPermissions = async () => {
  try {
    const response = await api.get('/permissions')
    if (response.data.success) {
      permissions.value = response.data.data.permissions
    }
  } catch (err) {
    error('Erro', 'Não foi possível carregar as permissões')
  }
}

const loadModules = async () => {
  try {
    const response = await api.get('/permissions/modules')
    if (response.data.success) {
      modules.value = response.data.data.modules
    }
  } catch (err) {
    error('Erro', 'Não foi possível carregar os módulos')
  }
}

const loadUserPermissions = async () => {
  if (!selectedUserId.value) {
    selectedUser.value = null
    userPermissions.value = []
    return
  }

  try {
    loading.value = true
    const response = await api.get(`/permissions/users/${selectedUserId.value}`)
    if (response.data.success) {
      selectedUser.value = response.data.data.user
      userPermissions.value = response.data.data.permissions || []
    }
  } catch (err) {
    console.error('Erro ao carregar permissões:', err)
    // Se for erro 404 (usuário sem permissões), não mostrar erro
    if (err.response?.status !== 404) {
      error('Erro', 'Não foi possível carregar as permissões do usuário')
    }
    userPermissions.value = []
  } finally {
    loading.value = false
  }
}

const grantPermission = async (permissionId) => {
  try {
    loading.value = true
    const response = await api.post(`/permissions/users/${selectedUserId.value}/grant`, {
      permissionId
    })
    
    if (response.data.success) {
      success('Permissão concedida', 'A permissão foi concedida com sucesso')
      await loadUserPermissions()
    }
  } catch (err) {
    error('Erro', 'Não foi possível conceder a permissão')
  } finally {
    loading.value = false
  }
}

const revokePermission = async (permissionId) => {
  try {
    loading.value = true
    const response = await api.delete(`/permissions/users/${selectedUserId.value}/${permissionId}`)
    
    if (response.data.success) {
      success('Permissão revogada', 'A permissão foi revogada com sucesso')
      await loadUserPermissions()
    }
  } catch (err) {
    error('Erro', 'Não foi possível revogar a permissão')
  } finally {
    loading.value = false
  }
}

const createPermission = async () => {
  try {
    loading.value = true
    const response = await api.post('/permissions', newPermission.value)
    
    if (response.data.success) {
      success('Permissão criada', 'A nova permissão foi criada com sucesso')
      closeCreateModal()
      await loadPermissions()
      await loadModules()
    }
  } catch (err) {
    error('Erro', 'Não foi possível criar a permissão')
  } finally {
    loading.value = false
  }
}

const closeCreateModal = () => {
  showCreatePermissionModal.value = false
  newPermission.value = {
    name: '',
    module: '',
    action: '',
    resource: '',
    description: ''
  }
}

onMounted(async () => {
  await Promise.all([
    loadUsers(),
    loadPermissions(),
    loadModules()
  ])
  
  // Se há um usuário especificado na query, selecioná-lo
  if (route.query.user) {
    selectedUserId.value = route.query.user
    await loadUserPermissions()
  }
})
</script>

<style scoped>
.permissions-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
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

.header-actions {
  display: flex;
  gap: 1rem;
}

.permissions-content {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.users-permissions-section,
.all-permissions-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
}

.users-permissions-section h2,
.all-permissions-section h2 {
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.user-selector {
  margin-bottom: 2rem;
}

.form-select {
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  min-width: 400px;
}

.user-permissions-manager {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.user-info h3 {
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
}

.user-info p {
  color: var(--text-secondary);
  margin: 0;
}

.permissions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.permissions-available,
.permissions-granted {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.permissions-available h4,
.permissions-granted h4 {
  background: var(--primary-color);
  color: white;
  margin: 0;
  padding: 1rem;
  font-size: 1.1rem;
}

.permissions-list {
  max-height: 600px;
  overflow-y: auto;
}

.permission-item.module-header {
  background: #f8f9fa;
  border-bottom: 1px solid var(--border-color);
}

.module-title {
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: var(--primary-color);
  font-size: 0.9rem;
  letter-spacing: 0.5px;
}

.permission-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
}

.permission-card:hover {
  background: #f8f9fa;
}

.permission-card.granted {
  background: #f0f8f0;
}

.permission-info {
  flex: 1;
}

.permission-name {
  font-weight: 600;
  color: var(--primary-color);
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.permission-description {
  color: var(--text-secondary);
  font-size: 0.85rem;
  line-height: 1.4;
}

.permission-meta {
  color: #666;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.permissions-filters {
  margin-bottom: 1.5rem;
}

.permissions-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow);
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

.permission-name-cell {
  font-weight: 600;
  color: var(--primary-color);
}

.description-cell {
  max-width: 200px;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.module-badge {
  background: var(--secondary-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.action-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}

.action-badge.view { background: #e3f2fd; color: #1976d2; }
.action-badge.create { background: #e8f5e8; color: #2e7d32; }
.action-badge.edit { background: #fff3e0; color: #f57c00; }
.action-badge.delete { background: #ffebee; color: #d32f2f; }
.action-badge.manage { background: #f3e5f5; color: #7b1fa2; }
.action-badge.approve { background: #e0f2f1; color: #00695c; }
.action-badge.execute { background: #fce4ec; color: #c2185b; }
.action-badge.export { background: #e8eaf6; color: #3f51b5; }

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

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
}

.btn-primary {
  background: var(--secondary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--secondary-hover);
}

.btn-secondary {
  background: var(--primary-color);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-danger {
  background: #d32f2f;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #b71c1c;
}

.btn-outline {
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.btn-outline:hover {
  background: var(--primary-color);
  color: white;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--primary-color);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f0f0f0;
  color: var(--primary-color);
}

.permission-form {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: var(--primary-color);
  font-size: 0.95rem;
}

.form-input,
.form-textarea {
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: var(--secondary-color);
}

.form-textarea {
  min-height: 100px;
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

@media (max-width: 1200px) {
  .permissions-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .permissions-page {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .form-select {
    min-width: 100%;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
}
</style>
