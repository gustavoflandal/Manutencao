<template>
  <div class="departments-page">
    <header class="page-header">
      <h1>Gerenciamento de Departamentos</h1>
      
      <button 
        v-if="canCreateDepartments" 
        class="btn btn-primary" 
        @click="$router.push('/departments/create')"
      >
        Novo Departamento
      </button>
    </header>

    <div class="departments-content">
      <div class="departments-filters">
        <input 
          v-model="searchTerm" 
          type="text" 
          placeholder="Buscar departamentos..."
          class="form-input"
        >
        
        <select v-model="statusFilter" class="form-select">
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>

        <select v-model="sortBy" class="form-select">
          <option value="nome">Ordenar por Nome</option>
          <option value="created_at">Ordenar por Data de Criação</option>
          <option value="updated_at">Ordenar por Última Atualização</option>
        </select>
      </div>

      <div class="departments-table" v-if="!loading">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Responsável</th>
              <th>Localização</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="department in filteredDepartments" :key="department.id">
              <td>
                <strong>{{ department.nome }}</strong>
              </td>
              <td>
                <span class="description">
                  {{ department.descricao || '-' }}
                </span>
              </td>
              <td>{{ department.responsavel || '-' }}</td>
              <td>{{ department.localizacao || '-' }}</td>
              <td>
                <span class="status-badge" :class="{ active: department.ativo, inactive: !department.ativo }">
                  {{ department.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button 
                    v-if="canEditDepartments"
                    class="btn btn-sm btn-secondary" 
                    @click="editDepartment(department)"
                  >
                    Editar
                  </button>
                  <button 
                    v-if="canActivateDeactivate && department.ativo"
                    class="btn btn-sm btn-danger" 
                    @click="deactivateDepartment(department)"
                  >
                    Desativar
                  </button>
                  <button 
                    v-if="canActivateDeactivate && !department.ativo"
                    class="btn btn-sm btn-success" 
                    @click="activateDepartment(department)"
                  >
                    Reativar
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredDepartments.length === 0">
              <td colspan="6" class="no-data">
                Nenhum departamento encontrado
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="loading" class="loading">
        <p>Carregando departamentos...</p>
      </div>

      <!-- Paginação -->
      <div v-if="pagination.pages > 1" class="pagination">
        <button 
          v-for="page in pagination.pages" 
          :key="page"
          :class="{ active: page === currentPage }"
          class="btn btn-sm"
          @click="loadPage(page)"
        >
          {{ page }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import api from '@/services/api'

const authStore = useAuthStore()
const router = useRouter()
const { success, error } = useToast()

const departments = ref([])
const searchTerm = ref('')
const statusFilter = ref('all')
const sortBy = ref('nome')
const loading = ref(false)
const currentPage = ref(1)
const pagination = ref({
  total: 0,
  page: 1,
  limit: 10,
  pages: 1
})

const canCreateDepartments = computed(() => {
  return authStore.user?.perfil === 'supervisor' || authStore.user?.perfil === 'administrador'
})

const canEditDepartments = computed(() => {
  return authStore.user?.perfil === 'supervisor' || authStore.user?.perfil === 'administrador'
})

const canActivateDeactivate = computed(() => {
  return authStore.user?.perfil === 'administrador'
})

const filteredDepartments = computed(() => {
  let filtered = departments.value

  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(dept => 
      dept.nome.toLowerCase().includes(search) ||
      (dept.descricao && dept.descricao.toLowerCase().includes(search)) ||
      (dept.responsavel && dept.responsavel.toLowerCase().includes(search)) ||
      (dept.localizacao && dept.localizacao.toLowerCase().includes(search))
    )
  }

  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(dept => {
      if (statusFilter.value === 'active') return dept.ativo
      if (statusFilter.value === 'inactive') return !dept.ativo
      return true
    })
  }

  // Ordenação local
  filtered.sort((a, b) => {
    const aValue = a[sortBy.value] || ''
    const bValue = b[sortBy.value] || ''
    
    if (sortBy.value === 'created_at' || sortBy.value === 'updated_at') {
      return new Date(bValue) - new Date(aValue) // Mais recente primeiro
    }
    
    return aValue.localeCompare(bValue)
  })

  return filtered
})

const loadDepartments = async (page = 1) => {
  try {
    loading.value = true
    const response = await api.get('/departments', {
      params: {
        page,
        limit: 10,
        orderBy: sortBy.value,
        orderDirection: 'ASC'
      }
    })
    
    if (response.data.success) {
      departments.value = response.data.data.departments
      pagination.value = response.data.data.pagination
      currentPage.value = page
    }
  } catch (err) {
    console.error('Erro ao carregar departamentos:', err)
    error('Erro ao carregar', 'Não foi possível carregar a lista de departamentos')
  } finally {
    loading.value = false
  }
}

const loadPage = (page) => {
  loadDepartments(page)
}

const editDepartment = (department) => {
  router.push(`/departments/${department.id}/edit`)
}

const deactivateDepartment = async (department) => {
  if (!confirm(`Deseja realmente desativar o departamento "${department.nome}"?`)) {
    return
  }

  try {
    await api.delete(`/departments/${department.id}`)
    success('Departamento desativado', `${department.nome} foi desativado com sucesso`)
    await loadDepartments(currentPage.value)
  } catch (err) {
    console.error('Erro ao desativar departamento:', err)
    error('Erro ao desativar', 'Não foi possível desativar o departamento')
  }
}

const activateDepartment = async (department) => {
  try {
    await api.patch(`/departments/${department.id}/activate`)
    success('Departamento reativado', `${department.nome} foi reativado com sucesso`)
    await loadDepartments(currentPage.value)
  } catch (err) {
    console.error('Erro ao reativar departamento:', err)
    error('Erro ao reativar', 'Não foi possível reativar o departamento')
  }
}

// Watchers para recarregar quando filtros mudarem
watch([statusFilter, sortBy], () => {
  loadDepartments(1) // Voltar para primeira página quando filtros mudarem
})

onMounted(() => {
  loadDepartments()
})
</script>

<style scoped>
.departments-page {
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

.departments-filters {
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

.departments-table {
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

.description {
  color: var(--text-secondary);
  font-style: italic;
  max-width: 200px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  flex-wrap: wrap;
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

.btn-danger {
  background: #d32f2f;
  color: white;
}

.btn-danger:hover {
  background: #b71c1c;
}

.btn-success {
  background: #2e7d32;
  color: white;
}

.btn-success:hover {
  background: #1b5e20;
}

.no-data {
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem;
  font-style: italic;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.pagination .btn {
  background: white;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.pagination .btn.active {
  background: var(--primary-color);
  color: white;
}

.pagination .btn:hover {
  background: var(--primary-color);
  color: white;
}
</style>