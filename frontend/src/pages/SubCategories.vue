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
        <button @click="openCreateForm" class="btn btn-create">
          <i class="fas fa-plus"></i>
          Nova Subcategoria
        </button>
      </div>
    </header>

    <div class="page-content">
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
            <option value="">Todos os status</option>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </div>
      </div>

      <!-- Lista de Subcategorias -->
      <div class="subcategories-grid">
        <div 
          v-for="subcategoria in subcategorias" 
          :key="subcategoria.id" 
          class="subcategory-card"
          :class="{ 'inactive': !subcategoria.ativo }"
        >
          <div class="card-content">
            <div class="subcategory-info">
              <div class="subcategory-icon" :style="{ backgroundColor: subcategoria.categoria?.cor || '#6c757d' }">
                <!-- Componente Lucide para ícones da galeria (subcategoria ou categoria) -->
                <component 
                  v-if="getIconFromGallery(subcategoria.icone || subcategoria.categoria?.icone)?.component" 
                  :is="getIconFromGallery(subcategoria.icone || subcategoria.categoria?.icone).component" 
                  class="icon-component" 
                  :size="20" 
                  color="white" 
                />
                <!-- FontAwesome para ícones tradicionais -->
                <i v-else :class="subcategoria.icone || subcategoria.categoria?.icone || 'fas fa-folder'" class="icon"></i>
              </div>
              <div class="subcategory-details">
                <h3>{{ subcategoria.nome }}</h3>
                <p v-if="subcategoria.descricao" class="description">{{ subcategoria.descricao }}</p>
                <div class="subcategory-meta">
                  <span class="category-tag">
                    {{ subcategoria.categoria?.nome }}
                  </span>
                  <span class="status-badge" :class="subcategoria.ativo ? 'active' : 'inactive'">
                    {{ subcategoria.ativo ? 'Ativo' : 'Inativo' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="card-actions">
              <button @click="editSubcategory(subcategoria)" class="btn-icon btn-edit btn-sm" title="Editar">
                <i class="fas fa-edit"></i>
              </button>
              <button 
                @click="deleteSubcategory(subcategoria)" 
                class="btn-icon btn-delete btn-sm"
                title="Excluir"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vazio -->
      <div v-if="!loading && subcategorias.length === 0" class="empty-state">
        <i class="fas fa-tags"></i>
        <h3>Nenhuma subcategoria encontrada</h3>
        <p>Crie a primeira subcategoria para organizar melhor as solicitações.</p>
        <button @click="openCreateForm" class="btn btn-create">
          <i class="fas fa-plus"></i>
          Nova Subcategoria
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando subcategorias...</p>
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
          <h4>{{ showEditForm ? 'Editar' : 'Nova' }} Subcategoria</h4>
          <button class="btn-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form @submit.prevent="saveSubcategory">
          <div class="form-group">
            <label for="category_id">Categoria *</label>
            <select
              id="category_id"
              v-model="form.category_id"
              class="form-control"
              :class="{ 'is-invalid': errors.category_id }"
              required
              @blur="validateCategoryId"
              @change="errors.category_id && validateCategoryId()"
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
            <label for="nome">Nome *</label>
            <input
              type="text"
              id="nome"
              v-model="form.nome"
              class="form-control"
              :class="{ 'is-invalid': errors.nome }"
              required
              maxlength="100"
              placeholder="Nome da subcategoria"
              @blur="validateNome"
              @input="errors.nome && validateNome()"
            />
            <div v-if="errors.nome" class="invalid-feedback">{{ errors.nome }}</div>
          </div>

          <div class="form-group">
            <label for="descricao">Descrição</label>
            <textarea
              id="descricao"
              v-model="form.descricao"
              class="form-control"
              :class="{ 'is-invalid': errors.descricao }"
              rows="3"
              maxlength="500"
              placeholder="Descrição da subcategoria (opcional)"
              @blur="validateDescricao"
              @input="errors.descricao && validateDescricao()"
            ></textarea>
            <div v-if="errors.descricao" class="invalid-feedback">{{ errors.descricao }}</div>
          </div>

          <div class="form-group">
            <label for="icone">Ícone</label>
            <div class="icon-selection-tabs">
              <!-- Abas de seleção -->
              <div class="icon-tabs">
                <button
                  type="button"
                  class="tab-btn"
                  :class="{ 'active': iconSelectionMode === 'picker' }"
                  @click="iconSelectionMode = 'picker'"
                >
                  <i class="fas fa-th"></i>
                  Galeria
                </button>
                <button
                  type="button"
                  class="tab-btn"
                  :class="{ 'active': iconSelectionMode === 'fontawesome' }"
                  @click="iconSelectionMode = 'fontawesome'"
                >
                  <i class="fab fa-font-awesome"></i>
                  FontAwesome
                </button>
              </div>

              <!-- Seletor de ícones -->
              <div v-if="iconSelectionMode === 'picker'" class="icon-picker-container">
                <IconPicker
                  v-model="selectedIconName"
                  :icon-color="previewCategory?.cor || '#6c757d'"
                  @update:modelValue="updateIconFromPicker"
                />
              </div>

              <!-- Input FontAwesome -->
              <div v-else class="fontawesome-input">
                <div class="icon-input-wrapper">
                  <input
                    type="text"
                    id="icone"
                    v-model="form.icone"
                    class="form-control"
                    :class="{ 'is-invalid': errors.icone }"
                    placeholder="fas fa-tools"
                    @blur="validateIcone"
                    @input="errors.icone && validateIcone()"
                  />
                  <span class="icon-preview" :style="{ color: previewCategory?.cor || '#6c757d' }">
                    <i :class="form.icone || 'fas fa-folder'"></i>
                  </span>
                </div>
                <small class="form-text">Ex: fas fa-tools, fas fa-computer, etc.</small>
              </div>
            </div>
            <div v-if="errors.icone" class="invalid-feedback">{{ errors.icone }}</div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="form.ativo"
              />
              Subcategoria ativa
            </label>
          </div>

          <!-- Preview da subcategoria -->
          <div class="form-group">
            <label>Preview</label>
            <div class="subcategory-preview">
              <div class="preview-icon" :style="{ backgroundColor: previewCategory?.cor || '#6c757d' }">
                <!-- Componente Lucide para ícones da galeria -->
                <component 
                  v-if="selectedIconFromGallery?.component" 
                  :is="selectedIconFromGallery.component" 
                  class="preview-component" 
                  :size="24" 
                  color="white" 
                />
                <!-- FontAwesome para ícones tradicionais -->
                <i v-else :class="form.icone || previewCategory?.icone || 'fas fa-folder'" class="preview-fontawesome"></i>
              </div>
              <div class="preview-info">
                <h5>{{ form.nome || 'Nome da subcategoria' }}</h5>
                <p>{{ form.descricao || 'Descrição da subcategoria aparecerá aqui' }}</p>
                <div class="preview-meta">
                  <span class="preview-category">{{ previewCategory?.nome || 'Categoria' }}</span>
                  <span class="preview-status" :class="form.ativo ? 'active' : 'inactive'">
                    {{ form.ativo ? 'Ativo' : 'Inativo' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-outline" @click="closeModal">
              <i class="fas fa-times"></i>
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <i v-if="loading" class="fas fa-spinner fa-spin"></i>
              <i v-else :class="showEditForm ? 'fas fa-save' : 'fas fa-plus'"></i>
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
import IconPicker from '@/components/IconPicker.vue'
import { systemIcons } from '@/assets/icons'

export default {
  name: 'SubCategories',
  components: {
    Toast,
    IconPicker
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
      icone: '',
      ativo: true
    })

    const errors = ref({})

    // Seleção de ícone
    const iconSelectionMode = ref('picker') // 'picker' ou 'fontawesome'
    const selectedIconName = ref('')
    const selectedIconFromGallery = ref(null)

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

    // Categoria para preview
    const previewCategory = computed(() => {
      return categorias.value.find(cat => cat.id === form.category_id)
    })

    // Função para obter ícone da galeria
    const getIconFromGallery = (iconName) => {
      return systemIcons.find(icon => icon.name === iconName)
    }

    // Funções do seletor de ícone
    const updateIconFromPicker = (iconName) => {
      selectedIconName.value = iconName
      selectedIconFromGallery.value = getIconFromGallery(iconName)
      form.icone = iconName
    }

    const validateIcone = () => {
      errors.value.icone = ''
      if (form.icone && form.icone.length > 50) {
        errors.value.icone = 'Ícone deve ter no máximo 50 caracteres'
      }
      return !errors.value.icone
    }

    // Métodos
    const loadCategorias = async () => {
      try {
        const response = await api.get('/categories/active')
        categorias.value = response.data.categorias || response.data.data?.categorias || []
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
        subcategorias.value = response.data.data?.subcategorias || response.data.subcategorias || []
        
        // Atualizar paginação
        const paginationData = response.data.data?.pagination || response.data.pagination || {}
        Object.assign(pagination, paginationData)
        
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
        icone: '',
        ativo: true
      })
      errors.value = {}
      
      // Reset seleção de ícone
      selectedIconName.value = ''
      selectedIconFromGallery.value = null
      iconSelectionMode.value = 'picker'
    }

    // Validações
    const validateCategoryId = () => {
      if (!form.category_id) {
        errors.value.category_id = 'Categoria é obrigatória'
        return false
      }
      delete errors.value.category_id
      return true
    }

    const validateNome = () => {
      if (!form.nome || form.nome.trim().length < 2) {
        errors.value.nome = 'Nome deve ter pelo menos 2 caracteres'
        return false
      }
      if (form.nome.trim().length > 100) {
        errors.value.nome = 'Nome deve ter no máximo 100 caracteres'
        return false
      }
      delete errors.value.nome
      return true
    }

    const validateDescricao = () => {
      if (form.descricao && form.descricao.length > 500) {
        errors.value.descricao = 'Descrição deve ter no máximo 500 caracteres'
        return false
      }
      delete errors.value.descricao
      return true
    }

    const validateForm = () => {
      let isValid = true
      isValid = validateCategoryId() && isValid
      isValid = validateNome() && isValid
      isValid = validateDescricao() && isValid
      return isValid
    }

    const openCreateForm = () => {
      resetForm()
      showCreateForm.value = true
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
        icone: subcategoria.icone || '',
        ativo: subcategoria.ativo
      })
      
      // Configurar seleção de ícone
      if (subcategoria.icone) {
        const iconFromGallery = getIconFromGallery(subcategoria.icone)
        if (iconFromGallery) {
          iconSelectionMode.value = 'picker'
          selectedIconName.value = subcategoria.icone
          selectedIconFromGallery.value = iconFromGallery
        } else {
          iconSelectionMode.value = 'fontawesome'
          selectedIconName.value = ''
          selectedIconFromGallery.value = null
        }
      }
      
      showEditForm.value = true
    }

    const saveSubcategory = async () => {
      try {
        loading.value = true
        
        // Validar formulário antes de enviar
        if (!validateForm()) {
          showToast('Por favor, corrija os erros no formulário', 'error')
          return
        }

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
          // Mapear erros de validação do backend
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
      previewCategory,
      getIconFromGallery,
      iconSelectionMode,
      selectedIconName,
      selectedIconFromGallery,
      updateIconFromPicker,
      validateIcone,
      loadSubcategories,
      debouncedSearch,
      changePage,
      openCreateForm,
      closeModal,
      editSubcategory,
      saveSubcategory,
      deleteSubcategory,
      validateCategoryId,
      validateNome,
      validateDescricao,
      validateForm
    }
  }
}
</script>

<style scoped>
.subcategories-page {
  padding: var(--spacing-xl);
  background-color: var(--color-light);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.page-header h1 {
  color: var(--color-primary);
  font-size: 2rem;
  margin: 0;
}

.category-info {
  margin: 5px 0 0 0;
  color: var(--color-dark-gray);
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
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
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.subcategories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.subcategory-card {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  transition: var(--transition-normal);
  overflow: hidden;
  border: 1px solid var(--color-light-gray);
}

.subcategory-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.subcategory-card.inactive {
  opacity: 0.6;
}

.card-content {
  padding: var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.subcategory-info {
  display: flex;
  gap: var(--spacing-md);
  flex: 1;
}

.subcategory-icon {
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

.subcategory-details h3 {
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

.subcategory-meta {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  flex-wrap: wrap;
}

.category-tag {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-xs);
  font-weight: 500;
  background-color: var(--color-light-gray);
  color: var(--color-dark-gray);
  border: 1px solid #e1e5e9;
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

.btn-create {
  background-color: #3498db;
  color: white;
}

.btn-create:hover {
  background-color: #28a745;
  transform: translateY(-1px);
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #28a745;
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

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.btn-edit {
  background-color: var(--color-warning);
  color: white;
}

.btn-edit:hover {
  background-color: #e0a800;
}

.btn-delete {
  background-color: var(--color-danger);
  color: white;
}

.btn-delete:hover {
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
  width: 95%;
  max-width: 600px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e1e5e9;
  background: #f8f9fa;
  border-radius: 12px 12px 0 0;
}

.modal-header h4 {
  margin: 0;
  color: var(--color-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #6c757d;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-close:hover {
  color: #dc3545;
  background: #f8d7da;
}

.modal-content form {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  max-height: calc(85vh - 120px);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-control.is-invalid {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-danger);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: 500;
  color: #2c3e50;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin: 0;
}

.subcategory-preview {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border: 2px dashed #e1e5e9;
  border-radius: 8px;
  margin-top: 8px;
}

.preview-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.preview-info {
  flex: 1;
}

.preview-info h5 {
  margin: 0 0 4px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.preview-info p {
  margin: 0 0 8px 0;
  color: #6c757d;
  font-size: 14px;
  line-height: 1.4;
}

.preview-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.preview-category {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background-color: #e9ecef;
  color: #495057;
}

.preview-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-status.active {
  background-color: #d4edda;
  color: #155724;
}

.preview-status.inactive {
  background-color: #f8d7da;
  color: #721c24;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e1e5e9;
}

/* Componentes Lucide */
.icon-component {
  width: 20px;
  height: 20px;
  color: white;
  flex-shrink: 0;
}

.preview-component {
  width: 24px;
  height: 24px;
  color: white;
  flex-shrink: 0;
}

.preview-fontawesome {
  font-size: 20px;
  color: white;
}

.preview-fontawesome {
  font-size: 20px;
  color: white;
}

/* Seletor de ícone */
.icon-selection-tabs {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
}

.icon-tabs {
  display: flex;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e1e5e9;
}

.tab-btn {
  flex: 1;
  background: none;
  border: none;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tab-btn:hover {
  background-color: #e9ecef;
}

.tab-btn.active {
  background-color: #007bff;
  color: white;
}

.icon-picker-container {
  padding: 16px;
  background-color: white;
}

.fontawesome-input {
  padding: 16px;
  background-color: white;
}

.icon-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.icon-input-wrapper input {
  padding-right: 50px;
}

.icon-preview {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  pointer-events: none;
}

.form-text {
  color: #6c757d;
  font-size: 12px;
  margin-top: 4px;
}

/* Grid Icons */
.subcategory-icon .icon-component {
  width: 20px;
  height: 20px;
  color: white;
}

.subcategory-icon .icon {
  color: white;
  font-size: 20px;
}

@media (max-width: 768px) {
  .subcategories-page {
    padding: 1rem;
  }
  
  .subcategories-grid {
    grid-template-columns: 1fr;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .form-input {
    min-width: unset;
  }
  
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: space-between;
  }
  
  .card-content {
    flex-direction: column;
    gap: 15px;
  }
  
  .card-actions {
    align-self: flex-end;
  }
  
  .modal-content {
    width: 95%;
    max-width: none;
    margin: 10px;
  }
  
  .modal-header {
    padding: 16px;
  }
  
  .modal-content form {
    padding: 16px;
  }
  
  .subcategory-preview {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .form-actions {
    flex-direction: column-reverse;
    gap: 8px;
  }
  
  .form-actions .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>