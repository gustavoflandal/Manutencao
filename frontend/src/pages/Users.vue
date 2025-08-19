<template>
  <div class="users-page">
    <header class="page-header">
      <h1>Gerenciamento de Usuários</h1>
      
            <div class="header-actions">
        <button 
        @click="showCreateForm = true"
        class="btn btn-create" 
        >
          <i class="fas fa-user-plus"></i>
          Novo Usuário
        </button>
      </div>
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
                    class="btn btn-edit btn-sm" 
                    @click="editUser(user)"
                    title="Editar usuário"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button 
                    v-if="canManagePermissions" 
                    class="btn btn-view btn-sm" 
                    @click="managePermissions(user)"
                    title="Gerenciar permissões"
                  >
                    <i class="fas fa-key"></i>
                  </button>
                  <button 
                    v-if="canDeactivateUser(user)" 
                    class="btn btn-delete btn-sm" 
                    @click="deactivateUser(user)"
                    title="Desativar usuário"
                  >
                    <i class="fas fa-ban"></i>
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

    <!-- Modal de Cadastro de Usuário -->
    <div v-if="showCreateForm" class="modal-overlay" @click="closeCreateForm">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>
            <i class="fas fa-user-plus"></i>
            Novo Usuário
          </h2>
          <button @click="closeCreateForm" class="modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form @submit.prevent="createUser" class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label for="nome">Nome Completo *</label>
              <input
                id="nome"
                v-model="createForm.nome"
                type="text"
                class="form-input"
                placeholder="Digite o nome completo"
                required
              />
            </div>

            <div class="form-group">
              <label for="email">Email *</label>
              <input
                id="email"
                v-model="createForm.email"
                type="email"
                class="form-input"
                placeholder="Digite o email"
                required
              />
            </div>

            <div class="form-group">
              <label for="perfil">Perfil *</label>
              <select
                id="perfil"
                v-model="createForm.perfil"
                class="form-input"
                required
              >
                <option value="">Selecione o perfil</option>
                <option value="solicitante">Solicitante</option>
                <option value="tecnico">Técnico</option>
                <option value="supervisor">Supervisor</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>

            <div class="form-group">
              <label for="departamento">Departamento</label>
              <input
                id="departamento"
                v-model="createForm.departamento"
                type="text"
                class="form-input"
                placeholder="Digite o departamento"
              />
            </div>

            <div class="form-group">
              <label for="senha">Senha *</label>
              <input
                id="senha"
                v-model="createForm.senha"
                type="password"
                class="form-input"
                placeholder="Digite a senha"
                required
                minlength="6"
              />
            </div>

            <div class="form-group">
              <label for="confirmSenha">Confirmar Senha *</label>
              <input
                id="confirmSenha"
                v-model="createForm.confirmSenha"
                type="password"
                class="form-input"
                placeholder="Confirme a senha"
                required
                minlength="6"
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeCreateForm" class="btn btn-secondary">
              <i class="fas fa-times"></i>
              Cancelar
            </button>
            <button type="submit" :disabled="isCreating" class="btn btn-primary">
              <i class="fas fa-save"></i>
              {{ isCreating ? 'Criando...' : 'Criar Usuário' }}
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

// Modal de cadastro
const showCreateForm = ref(false)
const isCreating = ref(false)
const createForm = ref({
  nome: '',
  email: '',
  perfil: '',
  departamento: '',
  senha: '',
  confirmSenha: ''
})

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

// Funções do modal
const closeCreateForm = () => {
  showCreateForm.value = false
  resetCreateForm()
}

const resetCreateForm = () => {
  createForm.value = {
    nome: '',
    email: '',
    perfil: '',
    departamento: '',
    senha: '',
    confirmSenha: ''
  }
}

const createUser = async () => {
  // Validar se as senhas coincidem
  if (createForm.value.senha !== createForm.value.confirmSenha) {
    error('Erro de validação', 'As senhas não coincidem')
    return
  }

  try {
    isCreating.value = true
    
    const userData = {
      nome: createForm.value.nome,
      email: createForm.value.email,
      perfil: createForm.value.perfil,
      departamento: createForm.value.departamento,
      senha: createForm.value.senha
    }

    const response = await api.post('/users', userData)
    
    if (response.data.success) {
      success('Usuário criado', 'Usuário criado com sucesso')
      closeCreateForm()
      await loadUsers() // Recarregar lista
    }
  } catch (err) {
    console.error('Erro ao criar usuário:', err)
    if (err.response?.data?.message) {
      error('Erro ao criar usuário', err.response.data.message)
    } else {
      error('Erro ao criar usuário', 'Não foi possível criar o usuário')
    }
  } finally {
    isCreating.value = false
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

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.btn-create {
  background: #3498db;
  color: white;
}

.btn-create:hover {
  background: #28a745;
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
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #28a745;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-edit {
  background: #3498db;
  color: white;
}

.btn-edit:hover {
  background: #28a745;
}

.btn-view {
  background: #17a2b8;
  color: white;
}

.btn-view:hover {
  background: #138496;
}

.btn-delete {
  background: #dc3545;
  color: white;
}

.btn-delete:hover {
  background: #c82333;
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

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-body {
  padding: 2rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
  font-size: 0.95rem;
}

.form-group .form-input {
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: white;
}

.form-group .form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.form-actions .btn {
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .modal-header {
    padding: 1rem;
  }
  
  .modal-body {
    padding: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
