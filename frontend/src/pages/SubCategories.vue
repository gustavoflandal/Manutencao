<template>
  <div class="subcategories-page">
    <header class="page-header">
      <div>
        <h1>Gerenciamento de Subcategorias</h1>
        <p v-if="categoryName" class="category-info">
          Categoria: <strong>{{ categoryName }}</strong>
        </p>
      </div>
      <div class="header-actions">
        <button @click="$router.back()" class="btn btn-outline">
          <i class="fas fa-arrow-left"></i>
          Voltar
        </button>
        <button @click="showCreateForm = true" class="btn btn-primary">
          <i class="fas fa-plus"></i>
          Nova Subcategoria
        </button>
      </div>
    </header>

    <!-- Filtros -->
    <div class="content-card">
      <div class="filters">
        <input 
          v-model="filters.search" 
          @input="debouncedSearch"
          type="text" 
          placeholder="Buscar subcategorias..." 
          class="form-input"
        >
        <select v-model="filters.category_id" @change="loadSubcategories" class="form-select">
          <option value="">Todas as categorias</option>
          <option 
            v-for="categoria in categorias" 
            :key="categoria.id" 
            :value="categoria.id"
          >
            {{ categoria.nome }}
          </option>
        </select>
        <select v-model="filters.ativo" @change="loadSubcategories" class="form-select">
          <option value="">Todos os Status</option>
          <option value="true">Ativo</option>
          <option value="false">Inativo</option>
        </select>
      </div>
    </div>

    <!-- Lista de Subcategorias -->
    <div class="content-card">
      <div class="subcategories-table">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Descrição</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="subcategoria in subcategorias" :key="subcategoria.id">
              <td>{{ subcategoria.nome }}</td>
              <td>
                <div class="category-info">
                  <div 
                    class="category-badge" 
                    :style="{ backgroundColor: subcategoria.categoria?.cor || '#6c757d' }"
                  >
                    <i :class="subcategoria.categoria?.icone || 'fas fa-folder'"></i>
                  </div>
                  {{ subcategoria.categoria?.nome }}
                </div>
              </td>
              <td>{{ subcategoria.descricao || '-' }}</td>
              <td>
                <span class="status-badge" :class="{ active: subcategoria.ativo, inactive: !subcategoria.ativo }">
                  {{ subcategoria.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button 
                    class="btn btn-sm btn-secondary" 
                    @click="editSubcategory(subcategoria)"
                    title="Editar"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button 
                    class="btn btn-sm btn-danger" 
                    @click="deleteSubcategory(subcategoria)"
                    title="Excluir"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="subcategorias.length === 0 && !loading">
              <td colspan="5" class="no-data">
                Nenhuma subcategoria encontrada
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Paginação -->
    <div class="pagination-wrapper" v-if="pagination.totalPages > 1">
      <nav>
        <ul class="pagination">
          <li class="page-item" :class="{ disabled: pagination.currentPage === 1 }">
            <button @click="changePage(pagination.currentPage - 1)" class="page-link">Anterior</button>
          </li>
          <li 
            v-for="page in visiblePages" 
            :key="page" 
            class="page-item" 
            :class="{ active: page === pagination.currentPage }"
          >
            <button @click="changePage(page)" class="page-link">{{ page }}</button>
          </li>
          <li class="page-item" :class="{ disabled: pagination.currentPage === pagination.totalPages }">
            <button @click="changePage(pagination.currentPage + 1)" class="page-link">Próximo</button>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Modal de Formulário -->
    <div v-if="showCreateForm || showEditForm" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ showEditForm ? 'Editar Subcategoria' : 'Nova Subcategoria' }}</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        <form @submit.prevent="saveSubcategory" class="modal-body">
          <div class="form-group">
            <label>Categoria *</label>
            <select 
              v-model="form.category_id" 
              class="form-control" 
              :class="{ 'is-invalid': errors.category_id }"
              required
            >
              <option value="">Selecione uma categoria</option>
              <option 
                v-for="categoria in categorias" 
                :key="categoria.id" 
                :value="categoria.id"
              >
                {{ categoria.nome }}
              </option>
            </select>
            <div v-if="errors.category_id" class="invalid-feedback">{{ errors.category_id }}</div>
          </div>

          <div class="form-group">
            <label>Nome *</label>
            <input 
              v-model="form.nome" 
              type="text" 
              class="form-control" 
              :class="{ 'is-invalid': errors.nome }"
              required
            >
            <div v-if="errors.nome" class="invalid-feedback">{{ errors.nome }}</div>
          </div>

          <div class="form-group">
            <label>Descrição</label>
            <textarea 
              v-model="form.descricao" 
              class="form-control" 
              rows="3"
              :class="{ 'is-invalid': errors.descricao }"
            ></textarea>
            <div v-if="errors.descricao" class="invalid-feedback">{{ errors.descricao }}</div>
          </div>

          <div class="form-group">
            <div class="form-check">
              <input 
                v-model="form.ativo" 
                type="checkbox" 
                class="form-check-input" 
                id="ativo"
              >
              <label class="form-check-label" for="ativo">
                Subcategoria ativa
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" @click="closeModal" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <i v-if="loading" class="fas fa-spinner fa-spin"></i>
              {{ showEditForm ? 'Atualizar' : 'Criar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Toast -->
    <Toast />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import Toast from '@/components/Toast.vue'

export default {
  name: 'SubCategories',
  components: {
    Toast
  },
  setup() {
    const route = useRoute()
    const { showToast } = useToast()

    // Estado reativo
    const subcategorias = ref([])
    const categorias = ref([])
    const loading = ref(false)
    const showCreateForm = ref(false)
    const showEditForm = ref(false)
    const editingSubcategory = ref(null)
    const categoryName = ref('')

    // Filtros
    const filters = reactive({
      search: '',
      category_id: '',
      ativo: '',
      page: 1,
      limit: 12
    })

    // Paginação
    const pagination = reactive({
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 12
    })

    // Formulário
    const form = reactive({
      nome: '',
      descricao: '',
      category_id: '',
      ativo: true
    })

    const errors = ref({})

    // Computadas
    const visiblePages = computed(() => {
      const pages = []
      const start = Math.max(1, pagination.currentPage - 2)
      const end = Math.min(pagination.totalPages, pagination.currentPage + 2)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      return pages
    })

    // Métodos
    const loadCategorias = async () => {
      try {
        const response = await api.get('/categories/active')
        categorias.value = response.data.categorias
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
        showToast('Erro ao carregar categorias', 'error')
      }
    }

    const loadSubcategories = async () => {
      try {
        loading.value = true
        const params = {
          page: filters.page,
          limit: filters.limit,
          search: filters.search,
          category_id: filters.category_id,
          ativo: filters.ativo,
          orderBy: 'nome',
          orderDirection: 'ASC'
        }

        const response = await api.get('/subcategories', { params })
        subcategorias.value = response.data.subcategorias
        
        // Atualizar paginação
        Object.assign(pagination, response.data.pagination)
        
      } catch (error) {
        console.error('Erro ao carregar subcategorias:', error)
        showToast('Erro ao carregar subcategorias', 'error')
      } finally {
        loading.value = false
      }
    }

    // Busca com debounce
    let searchTimeout
    const debouncedSearch = () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        filters.page = 1
        loadSubcategories()
      }, 500)
    }

    const changePage = (page) => {
      if (page >= 1 && page <= pagination.totalPages) {
        filters.page = page
        pagination.currentPage = page
        loadSubcategories()
      }
    }

    const resetForm = () => {
      Object.assign(form, {
        nome: '',
        descricao: '',
        category_id: filters.category_id || '',
        ativo: true
      })
      errors.value = {}
    }

    const closeModal = () => {
      showCreateForm.value = false
      showEditForm.value = false
      editingSubcategory.value = null
      resetForm()
    }

    const editSubcategory = (subcategoria) => {
      editingSubcategory.value = subcategoria
      Object.assign(form, {
        nome: subcategoria.nome,
        descricao: subcategoria.descricao || '',
        category_id: subcategoria.category_id,
        ativo: subcategoria.ativo
      })
      showEditForm.value = true
    }

    const saveSubcategory = async () => {
      try {
        loading.value = true
        errors.value = {}

        if (showEditForm.value) {
          await api.put(`/subcategories/${editingSubcategory.value.id}`, form)
          showToast('Subcategoria atualizada com sucesso!')
        } else {
          await api.post('/subcategories', form)
          showToast('Subcategoria criada com sucesso!')
        }

        closeModal()
        loadSubcategories()
        
      } catch (error) {
        console.error('Erro ao salvar subcategoria:', error)
        
        if (error.response?.data?.errors) {
          // Mapear erros de validação
          error.response.data.errors.forEach(err => {
            errors.value[err.field] = err.message
          })
        } else {
          showToast(error.response?.data?.message || 'Erro ao salvar subcategoria', 'error')
        }
      } finally {
        loading.value = false
      }
    }

    const deleteSubcategory = async (subcategoria) => {
      if (!confirm(`Tem certeza que deseja excluir a subcategoria "${subcategoria.nome}"?`)) {
        return
      }

      try {
        await api.delete(`/subcategories/${subcategoria.id}`)
        showToast('Subcategoria excluída com sucesso!')
        loadSubcategories()
      } catch (error) {
        console.error('Erro ao excluir subcategoria:', error)
        showToast(error.response?.data?.message || 'Erro ao excluir subcategoria', 'error')
      }
    }

    // Lifecycle
    onMounted(() => {
      // Verificar se veio de uma categoria específica
      if (route.query.categoryId) {
        filters.category_id = route.query.categoryId
        categoryName.value = route.query.categoryName || ''
      }
      
      loadCategorias()
      loadSubcategories()
    })

    return {
      subcategorias,
      categorias,
      loading,
      showCreateForm,
      showEditForm,
      categoryName,
      filters,
      pagination,
      form,
      errors,
      visiblePages,
      loadSubcategories,
      debouncedSearch,
      changePage,
      closeModal,
      editSubcategory,
      saveSubcategory,
      deleteSubcategory
    }
  }
}
</script>

<style scoped>
.subcategories-page {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0;
  color: var(--color-primary);
  font-size: 2rem;
}

.category-info {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.content-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.form-input,
.form-select {
  padding: 0.75rem 1rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: border-color 0.2s ease;
}

.form-input {
  min-width: 300px;
  flex: 1;
}

.form-select {
  min-width: 200px;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.subcategories-table {
  overflow-x: auto;
}

.subcategories-table table {
  width: 100%;
  border-collapse: collapse;
}

.subcategories-table th,
.subcategories-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e1e5e9;
}

.subcategories-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: var(--color-primary);
}

.category-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category-badge {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background: #f8d7da;
  color: #721c24;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.no-data {
  text-align: center;
  color: #666;
  font-style: italic;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.pagination {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  gap: 5px;
}

.page-item {
  border-radius: 6px;
  overflow: hidden;
}

.page-link {
  display: block;
  padding: 10px 15px;
  border: 1px solid #ddd;
  background: white;
  color: #007bff;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

.page-item.active .page-link {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.page-item.disabled .page-link {
  color: #ccc;
  cursor: not-allowed;
}

.page-link:hover:not(.disabled) {
  background: #e9ecef;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: var(--color-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #666;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-primary);
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.form-check {
  display: flex;
  align-items: center;
}

.form-check-input {
  margin-right: 0.5rem;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .subcategories-page {
    padding: 1rem;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: space-between;
  }
  
  .form-input {
    min-width: auto;
  }
}
</style>