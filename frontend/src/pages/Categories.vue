<template>
  <div class="categories-page">
    <header class="page-header">
      <h1>Gerenciamento de Categorias</h1>
      <button @click="showCreateForm = true" class="btn btn-primary">
        <i class="fas fa-plus"></i>
        Nova Categoria
      </button>
    </header>

    <div class="page-content">
      <!-- Filtros -->
      <div class="content-card">
        <div class="filters">
          <input 
            v-model="filters.search" 
            @input="debouncedSearch"
            type="text" 
            placeholder="Buscar categorias..." 
            class="form-input"
          >
          <select v-model="filters.ativo" @change="loadCategories" class="form-select">
            <option value="">Todos os status</option>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </div>
      </div>

      <!-- Lista de Categorias -->
      <div class="categories-grid">
        <div 
          v-for="categoria in categorias" 
          :key="categoria.id" 
          class="category-card"
          :class="{ 'inactive': !categoria.ativo }"
        >
          <div class="card-content">
            <div class="category-info">
              <div class="category-icon" :style="{ backgroundColor: categoria.cor || '#6c757d' }">
                <i :class="categoria.icone || 'fas fa-folder'" class="icon"></i>
              </div>
              <div class="category-details">
                <h3>{{ categoria.nome }}</h3>
                <p v-if="categoria.descricao" class="description">{{ categoria.descricao }}</p>
                <div class="category-meta">
                  <span class="status-badge" :class="categoria.ativo ? 'active' : 'inactive'">
                    {{ categoria.ativo ? 'Ativo' : 'Inativo' }}
                  </span>
                  <span class="subcategory-count">
                    {{ categoria.subcategorias?.length || 0 }} subcategorias
                  </span>
                </div>
              </div>
            </div>
            <div class="card-actions">
              <button @click="editCategory(categoria)" class="btn btn-sm btn-outline" title="Editar">
                <i class="fas fa-edit"></i>
              </button>
              <button @click="viewSubcategories(categoria)" class="btn btn-sm btn-outline" title="Ver Subcategorias">
                <i class="fas fa-list"></i>
              </button>
              <button 
                @click="deleteCategory(categoria)" 
                class="btn btn-sm btn-danger"
                title="Excluir"
                :disabled="categoria.subcategorias?.length > 0"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vazio -->
      <div v-if="!loading && categorias.length === 0" class="empty-state">
        <i class="fas fa-folder-open"></i>
        <h3>Nenhuma categoria encontrada</h3>
        <p>Crie a primeira categoria para começar a organizar as solicitações.</p>
        <button @click="showCreateForm = true" class="btn btn-primary">
          <i class="fas fa-plus"></i>
          Nova Categoria
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando categorias...</p>
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
          <h2>{{ showEditForm ? 'Editar Categoria' : 'Nova Categoria' }}</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        <form @submit.prevent="saveCategory" class="modal-body">
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

          <div class="form-row">
            <div class="form-group col-md-6">
              <label>Cor</label>
              <input 
                v-model="form.cor" 
                type="color" 
                class="form-control color-picker"
                :class="{ 'is-invalid': errors.cor }"
              >
              <div v-if="errors.cor" class="invalid-feedback">{{ errors.cor }}</div>
            </div>

            <div class="form-group col-md-6">
              <label>Ícone (FontAwesome)</label>
              <input 
                v-model="form.icone" 
                type="text" 
                class="form-control" 
                placeholder="fas fa-tools"
                :class="{ 'is-invalid': errors.icone }"
              >
              <small class="form-text text-muted">Ex: fas fa-tools, fas fa-computer, etc.</small>
              <div v-if="errors.icone" class="invalid-feedback">{{ errors.icone }}</div>
            </div>
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
                Categoria ativa
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
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import Toast from '@/components/Toast.vue'

export default {
  name: 'Categories',
  components: {
    Toast
  },
  setup() {
    const router = useRouter()
    const { showToast } = useToast()

    // Estado reativo
    const categorias = ref([])
    const loading = ref(false)
    const showCreateForm = ref(false)
    const showEditForm = ref(false)
    const editingCategory = ref(null)

    // Filtros
    const filters = reactive({
      search: '',
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
      cor: '#6c757d',
      icone: 'fas fa-folder',
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
    const loadCategories = async () => {
      try {
        loading.value = true
        const params = {
          page: filters.page,
          limit: filters.limit,
          search: filters.search,
          ativo: filters.ativo,
          orderBy: 'nome',
          orderDirection: 'ASC'
        }

        const response = await api.get('/categories', { params })
        categorias.value = response.data.categorias
        
        // Atualizar paginação
        Object.assign(pagination, response.data.pagination)
        
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
        showToast('Erro ao carregar categorias', 'error')
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
        loadCategories()
      }, 500)
    }

    const changePage = (page) => {
      if (page >= 1 && page <= pagination.totalPages) {
        filters.page = page
        pagination.currentPage = page
        loadCategories()
      }
    }

    const resetForm = () => {
      Object.assign(form, {
        nome: '',
        descricao: '',
        cor: '#6c757d',
        icone: 'fas fa-folder',
        ativo: true
      })
      errors.value = {}
    }

    const closeModal = () => {
      showCreateForm.value = false
      showEditForm.value = false
      editingCategory.value = null
      resetForm()
    }

    const editCategory = (categoria) => {
      editingCategory.value = categoria
      Object.assign(form, {
        nome: categoria.nome,
        descricao: categoria.descricao || '',
        cor: categoria.cor || '#6c757d',
        icone: categoria.icone || 'fas fa-folder',
        ativo: categoria.ativo
      })
      showEditForm.value = true
    }

    const saveCategory = async () => {
      try {
        loading.value = true
        errors.value = {}

        if (showEditForm.value) {
          await api.put(`/categories/${editingCategory.value.id}`, form)
          showToast('Categoria atualizada com sucesso!')
        } else {
          await api.post('/categories', form)
          showToast('Categoria criada com sucesso!')
        }

        closeModal()
        loadCategories()
        
      } catch (error) {
        console.error('Erro ao salvar categoria:', error)
        
        if (error.response?.data?.errors) {
          // Mapear erros de validação
          error.response.data.errors.forEach(err => {
            errors.value[err.field] = err.message
          })
        } else {
          showToast(error.response?.data?.message || 'Erro ao salvar categoria', 'error')
        }
      } finally {
        loading.value = false
      }
    }

    const deleteCategory = async (categoria) => {
      if (!confirm(`Tem certeza que deseja excluir a categoria "${categoria.nome}"?`)) {
        return
      }

      try {
        await api.delete(`/categories/${categoria.id}`)
        showToast('Categoria excluída com sucesso!')
        loadCategories()
      } catch (error) {
        console.error('Erro ao excluir categoria:', error)
        showToast(error.response?.data?.message || 'Erro ao excluir categoria', 'error')
      }
    }

    const viewSubcategories = (categoria) => {
      router.push({ 
        name: 'SubCategories', 
        query: { categoryId: categoria.id, categoryName: categoria.nome }
      })
    }

    // Lifecycle
    onMounted(() => {
      loadCategories()
    })

    return {
      categorias,
      loading,
      showCreateForm,
      showEditForm,
      filters,
      pagination,
      form,
      errors,
      visiblePages,
      loadCategories,
      debouncedSearch,
      changePage,
      closeModal,
      editCategory,
      saveCategory,
      deleteCategory,
      viewSubcategories
    }
  }
}
</script>

<style scoped>
.categories-page {
  padding: var(--spacing-xl);
  background-color: var(--color-light);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  color: var(--color-primary);
  font-size: 2rem;
  margin: 0;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
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

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.category-card {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  transition: var(--transition-normal);
  overflow: hidden;
  border: 1px solid var(--color-light-gray);
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.category-card.inactive {
  opacity: 0.6;
}

.card-content {
  padding: var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.category-info {
  display: flex;
  gap: var(--spacing-md);
  flex: 1;
}

.category-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.category-details h3 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-primary);
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.description {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-dark-gray);
  font-size: var(--font-size-sm);
  line-height: 1.4;
}

.category-meta {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  flex-wrap: wrap;
}

.status-badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-xs);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.active {
  background-color: var(--color-success);
  color: white;
}

.status-badge.inactive {
  background-color: var(--color-gray);
  color: white;
}

.subcategory-count {
  color: var(--color-dark-gray);
  font-size: var(--font-size-xs);
}

.card-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: none;
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  text-decoration: none;
}

.btn-primary {
  background-color: var(--color-secondary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-secondary-dark);
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
}

.btn-outline {
  background-color: transparent;
  color: var(--color-dark-gray);
  border: 1px solid var(--color-gray);
}

.btn-outline:hover {
  background-color: var(--color-light-gray);
  color: var(--color-primary);
}

.btn-danger {
  background-color: var(--color-danger);
  color: white;
}

.btn-danger:hover {
  background-color: #c0392b;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
}

.empty-state i {
  font-size: 48px;
  margin-bottom: var(--spacing-lg);
  color: var(--color-gray);
}

.empty-state h3 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-primary);
}

.empty-state p {
  margin: 0 0 var(--spacing-lg) 0;
  color: var(--color-dark-gray);
}

.loading-state {
  text-align: center;
  padding: var(--spacing-3xl);
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-light-gray);
  border-left: 4px solid var(--color-secondary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-md);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.category-info {
  display: flex;
  gap: 15px;
  flex: 1;
}

.category-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.category-details h3 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 18px;
}

.category-details p {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.category-meta {
  display: flex;
  gap: 10px;
  align-items: center;
}

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-success {
  background-color: #d4edda;
  color: #155724;
}

.badge-secondary {
  background-color: #e2e3e5;
  color: #383d41;
}

.subcategory-count {
  font-size: 12px;
  color: #666;
}

.category-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.color-picker {
  height: 45px;
  padding: 5px;
  border: 1px solid #ddd;
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
  max-width: 600px;
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
  color: #2c3e50;
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

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 30px;
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

@media (max-width: 768px) {
  .categories-grid {
    grid-template-columns: 1fr;
  }
  
  .filters {
    grid-template-columns: 1fr;
  }
  
  .category-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .category-actions {
    align-self: flex-end;
  }
}
</style>