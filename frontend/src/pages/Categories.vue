<template>
  <div class="categories-page">
    <header class="page-header">
      <h1>Gerenciamento de Categorias</h1>
      <button @click="showCreateForm = true" class="btn btn-create">
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
                <!-- Componente Lucide para ícones da galeria -->
                <component 
                  v-if="getIconFromGallery(categoria.icone)?.component" 
                  :is="getIconFromGallery(categoria.icone).component" 
                  class="icon-component" 
                  :size="20" 
                  color="white" 
                />
                <!-- FontAwesome para ícones tradicionais -->
                <i v-else :class="categoria.icone || 'fas fa-folder'" class="icon"></i>
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
              <button @click="editCategory(categoria)" class="btn-icon btn-edit btn-sm" title="Editar">
                <i class="fas fa-edit"></i>
              </button>
              <button @click="viewSubcategories(categoria)" class="btn-icon btn-view btn-sm" title="Ver Subcategorias">
                <i class="fas fa-list"></i>
              </button>
              <button 
                @click="deleteCategory(categoria)" 
                class="btn-icon btn-delete btn-sm"
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
        <button @click="showCreateForm = true" class="btn btn-create">
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
          <h4>{{ showEditForm ? 'Editar' : 'Nova' }} Categoria</h4>
          <button class="btn-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form @submit.prevent="saveCategory">
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
              placeholder="Nome da categoria"
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
              placeholder="Descrição da categoria (opcional)"
              @blur="validateDescricao"
              @input="errors.descricao && validateDescricao()"
            ></textarea>
            <div v-if="errors.descricao" class="invalid-feedback">{{ errors.descricao }}</div>
          </div>

          <div class="form-row">
            <div class="form-group col-6">
              <label for="cor">Cor</label>
              <div class="color-input-wrapper">
                <input
                  type="color"
                  id="cor"
                  v-model="form.cor"
                  class="form-control color-picker"
                  :class="{ 'is-invalid': errors.cor }"
                  @change="validateCor"
                />
                <span class="color-preview" :style="{ backgroundColor: form.cor }"></span>
              </div>
              <div v-if="errors.cor" class="invalid-feedback">{{ errors.cor }}</div>
            </div>

            <div class="form-group col-6">
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
                    :icon-color="form.cor || '#6c757d'"
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
                    <span class="icon-preview" :style="{ color: form.cor }">
                      <i :class="form.icone || 'fas fa-folder'"></i>
                    </span>
                  </div>
                  <small class="form-text">Ex: fas fa-tools, fas fa-computer, etc.</small>
                </div>
              </div>
              <div v-if="errors.icone" class="invalid-feedback">{{ errors.icone }}</div>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="form.ativo"
              />
              Categoria ativa
            </label>
          </div>

          <!-- Preview da categoria -->
          <div class="form-group">
            <label>Preview</label>
            <div class="category-preview">
              <div class="preview-icon" :style="{ backgroundColor: form.cor || '#6c757d' }">
                <!-- Componente Lucide para ícones da galeria -->
                <component 
                  v-if="selectedIconFromGallery?.component" 
                  :is="selectedIconFromGallery.component" 
                  class="preview-component" 
                  :size="24" 
                  color="white" 
                />
                <!-- FontAwesome para ícones tradicionais -->
                <i v-else :class="form.icone || 'fas fa-folder'" class="preview-fontawesome"></i>
              </div>
              <div class="preview-info">
                <h5>{{ form.nome || 'Nome da categoria' }}</h5>
                <p>{{ form.descricao || 'Descrição da categoria aparecerá aqui' }}</p>
                <span class="preview-status" :class="form.ativo ? 'active' : 'inactive'">
                  {{ form.ativo ? 'Ativo' : 'Inativo' }}
                </span>
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
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import Toast from '@/components/Toast.vue'
import IconPicker from '@/components/IconPicker.vue'
import { systemIcons } from '@/assets/icons'

export default {
  name: 'Categories',
  components: {
    Toast,
    IconPicker
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

    // Seletor de ícones
    const iconSelectionMode = ref('picker') // 'picker' ou 'fontawesome'
    const selectedIconName = ref('')

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

    // Ícone selecionado da galeria
    const selectedIconFromGallery = computed(() => {
      if (iconSelectionMode.value === 'picker' && selectedIconName.value) {
        return systemIcons.find(icon => icon.name === selectedIconName.value)
      }
      return null
    })

    // Função para obter ícone da galeria
    const getIconFromGallery = (iconName) => {
      return systemIcons.find(icon => icon.name === iconName)
    }

    // Métodos do seletor de ícones
    const updateIconFromPicker = (iconName) => {
      selectedIconName.value = iconName
      form.icone = iconName // Armazenar nome do ícone da galeria
    }

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
        categorias.value = response.data.data.categorias
        
        // Atualizar paginação
        Object.assign(pagination, response.data.data.pagination)
        
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
      // Reset do seletor de ícones
      selectedIconName.value = ''
      iconSelectionMode.value = 'picker'
      errors.value = {}
    }

    // Validação em tempo real
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

    const validateCor = () => {
      const colorRegex = /^#[0-9A-F]{6}$/i
      if (form.cor && !colorRegex.test(form.cor)) {
        errors.value.cor = 'Cor deve estar no formato hexadecimal #FFFFFF'
        return false
      }
      delete errors.value.cor
      return true
    }

    const validateIcone = () => {
      if (form.icone && form.icone.length > 50) {
        errors.value.icone = 'Nome do ícone deve ter no máximo 50 caracteres'
        return false
      }
      delete errors.value.icone
      return true
    }

    const validateForm = () => {
      let isValid = true
      isValid = validateNome() && isValid
      isValid = validateDescricao() && isValid
      isValid = validateCor() && isValid
      isValid = validateIcone() && isValid
      return isValid
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
      
      // Verificar se é um ícone da galeria
      const iconFromGallery = getIconFromGallery(categoria.icone)
      if (iconFromGallery) {
        iconSelectionMode.value = 'picker'
        selectedIconName.value = categoria.icone
      } else {
        iconSelectionMode.value = 'fontawesome'
        selectedIconName.value = ''
      }
      
      showEditForm.value = true
    }

    const saveCategory = async () => {
      try {
        loading.value = true
        
        // Validar formulário antes de enviar
        if (!validateForm()) {
          showToast('Por favor, corrija os erros no formulário', 'error')
          return
        }

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
          // Mapear erros de validação do backend
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
      // Seletor de ícones
      iconSelectionMode,
      selectedIconName,
      selectedIconFromGallery,
      getIconFromGallery,
      updateIconFromPicker,
      // Métodos
      loadCategories,
      debouncedSearch,
      changePage,
      closeModal,
      editCategory,
      saveCategory,
      deleteCategory,
      viewSubcategories,
      validateNome,
      validateDescricao,
      validateCor,
      validateIcone,
      validateForm
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
  border-color: var(--btn-primary);
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-control.is-invalid {
  border-color: var(--btn-delete);
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
  color: var(--btn-delete);
}

.form-row {
  display: flex;
  gap: 16px;
  margin: 0;
}

.form-row .form-group {
  flex: 1;
  margin: 0 0 20px 0;
}

.col-6 {
  flex: 0 0 calc(50% - 8px);
}

.color-input-wrapper,
.icon-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.color-picker {
  padding: 4px 8px;
  height: 44px;
  cursor: pointer;
}

.color-preview {
  position: absolute;
  right: 12px;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

.icon-preview {
  position: absolute;
  right: 12px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  pointer-events: none;
}

.form-text {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #6c757d;
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

.category-preview {
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

.preview-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-status.active {
  background-color: var(--btn-success-light);
  color: var(--btn-success);
}

.preview-status.inactive {
  background-color: var(--btn-secondary-light);
  color: var(--btn-secondary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e1e5e9;
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
    flex-direction: column;
  }
  
  .form-input {
    min-width: unset;
  }
  
  .category-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .category-actions {
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
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .col-6 {
    flex: 1;
  }
  
  .category-preview {
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

/* === SELETOR DE ÍCONES === */
.icon-selection-tabs {
  width: 100%;
}

.icon-tabs {
  display: flex;
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e1e5e9;
}

.tab-btn {
  flex: 1;
  padding: 8px 12px;
  background: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #6c757d;
}

.tab-btn:hover {
  background: #f8f9fa;
}

.tab-btn.active {
  background: var(--btn-primary);
  color: white;
}

.tab-btn i {
  font-size: 14px;
}

.icon-picker-container {
  width: 100%;
}

.fontawesome-input {
  width: 100%;
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

/* Grid Icons */
.category-icon .icon-component {
  width: 20px;
  height: 20px;
  color: white;
}

.category-icon .icon {
  color: white;
  font-size: 20px;
}
</style>