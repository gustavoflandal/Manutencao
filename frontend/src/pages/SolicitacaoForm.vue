<template>
  <div class="solicitacao-form-page">
    <header class="page-header">
      <h1>{{ isEdit ? 'Editar Solicitação' : 'Nova Solicitação' }}</h1>
      <button class="btn btn-outline" @click="$router.push('/solicitacoes')">
        Voltar
      </button>
    </header>

    <div class="form-container">
      <form @submit.prevent="submitForm" class="solicitacao-form">
        <!-- Título -->
        <div class="form-group">
          <label for="titulo">Título da Solicitação *</label>
          <input
            id="titulo"
            v-model="form.titulo"
            type="text"
            class="form-input"
            required
            placeholder="Descreva brevemente o problema ou necessidade"
            maxlength="200"
          />
          <span class="char-count">{{ form.titulo.length }}/200</span>
        </div>

        <!-- Categoria e Subcategoria -->
        <div class="form-row">
          <div class="form-group">
            <label for="categoria">Categoria *</label>
            <select 
              id="categoria" 
              v-model="form.category_id" 
              class="form-select" 
              required
              @change="onCategoryChange"
            >
              <option value="">Selecione a categoria</option>
              <option 
                v-for="categoria in categorias" 
                :key="categoria.id" 
                :value="categoria.id"
              >
                {{ categoria.nome }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="subcategoria">Subcategoria</label>
            <select 
              id="subcategoria" 
              v-model="form.subcategory_id" 
              class="form-select"
              :disabled="!form.category_id || subcategorias.length === 0"
            >
              <option value="">Selecione a subcategoria</option>
              <option 
                v-for="subcategoria in subcategorias" 
                :key="subcategoria.id" 
                :value="subcategoria.id"
              >
                {{ subcategoria.nome }}
              </option>
            </select>
            <small class="form-hint" v-if="!form.category_id">
              Selecione uma categoria primeiro
            </small>
            <small class="form-hint" v-else-if="form.category_id && subcategorias.length === 0">
              Nenhuma subcategoria disponível para esta categoria
            </small>
          </div>
        </div>

        <!-- Prioridade e Departamento -->
        <div class="form-row">
          <div class="form-group">
            <label for="prioridade">Prioridade</label>
            <select id="prioridade" v-model="form.prioridade" class="form-select">
              <option value="baixa">Baixa</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>

          <div class="form-group">
            <label for="department_id">Departamento</label>
            <select 
              id="department_id" 
              v-model="form.department_id" 
              class="form-select"
              @change="onDepartmentChange"
            >
              <option value="">Selecione um departamento</option>
              <option 
                v-for="dept in departments" 
                :key="dept.id" 
                :value="dept.id"
              >
                {{ dept.nome }}
              </option>
            </select>
          </div>
        </div>

        <!-- Localização -->
        <div class="form-group">
          <label for="localizacao">Localização *</label>
          <input
            id="localizacao"
            v-model="form.localizacao"
            type="text"
            class="form-input"
            required
            placeholder="Ex: Sala 203, Galpão 2, Laboratório A..."
            maxlength="200"
          />
        </div>

        <!-- Descrição -->
        <div class="form-group">
          <label for="descricao">Descrição Detalhada *</label>
          <textarea
            id="descricao"
            v-model="form.descricao"
            class="form-textarea"
            required
            placeholder="Descreva o problema em detalhes, incluindo sintomas, quando ocorreu, etc."
            rows="6"
          ></textarea>
        </div>

        <!-- Data Prevista -->
        <div class="form-group">
          <label for="data_prevista">Data Prevista para Resolução</label>
          <input
            id="data_prevista"
            v-model="form.data_prevista"
            type="datetime-local"
            class="form-input"
            :min="minDate"
          />
          <small class="form-hint">
            Opcional. Quando você gostaria que este serviço fosse realizado?
          </small>
        </div>

        <!-- Observações -->
        <div class="form-group">
          <label for="observacoes">Observações Adicionais</label>
          <textarea
            id="observacoes"
            v-model="form.observacoes"
            class="form-textarea"
            placeholder="Informações complementares, horários preferenciais, contatos..."
            rows="3"
          ></textarea>
        </div>

        <!-- Campos administrativos (apenas para supervisores/admins) -->
        <div v-if="canManageStatus" class="admin-section">
          <h3>Gerenciamento da Solicitação</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label for="status">Status</label>
              <select id="status" v-model="form.status" class="form-select">
                <option value="aberta">Aberta</option>
                <option value="em_analise">Em Análise</option>
                <option value="aprovada">Aprovada</option>
                <option value="em_execucao">Em Execução</option>
                <option value="fechada">Fechada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div class="form-group">
              <label for="responsavel_id">Responsável</label>
              <select id="responsavel_id" v-model="form.responsavel_id" class="form-select">
                <option value="">Não atribuído</option>
                <option 
                  v-for="user in technicians" 
                  :key="user.id" 
                  :value="user.id"
                >
                  {{ user.nome }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Botões -->
        <div class="form-actions">
          <button type="button" class="btn btn-outline" @click="$router.push('/solicitacoes')">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading">Salvando...</span>
            <span v-else>{{ isEdit ? 'Salvar Alterações' : 'Criar Solicitação' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { success, error } = useToast()

const form = reactive({
  titulo: '',
  category_id: '',
  subcategory_id: '',
  prioridade: 'normal',
  localizacao: '',
  descricao: '',
  observacoes: '',
  data_prevista: '',
  department_id: '',
  status: 'aberta',
  responsavel_id: ''
})

const loading = ref(false)
const departments = ref([])
const technicians = ref([])
const categorias = ref([])
const subcategorias = ref([])

const isEdit = computed(() => !!route.params.id)

const canManageStatus = computed(() => {
  return ['supervisor', 'administrador'].includes(authStore.user?.perfil)
})

const minDate = computed(() => {
  const now = new Date()
  return now.toISOString().slice(0, 16)
})

const loadDepartments = async () => {
  try {
    const response = await api.get('/public/departments/active')
    departments.value = response.data.data.departments
  } catch (err) {
    console.error('Erro ao carregar departamentos:', err)
  }
}

const loadCategorias = async () => {
  try {
    const response = await api.get('/categories/active')
    categorias.value = response.data.categorias
  } catch (err) {
    console.error('Erro ao carregar categorias:', err)
  }
}

const loadSubcategorias = async (categoryId) => {
  if (!categoryId) {
    subcategorias.value = []
    return
  }

  try {
    const response = await api.get(`/subcategories/by-category/${categoryId}`)
    subcategorias.value = response.data.subcategorias
  } catch (err) {
    console.error('Erro ao carregar subcategorias:', err)
    subcategorias.value = []
  }
}

const onCategoryChange = () => {
  // Limpar subcategoria quando a categoria mudar
  form.subcategory_id = ''
  loadSubcategorias(form.category_id)
}

const onDepartmentChange = () => {
  // Preencher automaticamente a localização baseada no departamento
  const selectedDept = departments.value.find(dept => dept.id == form.department_id)
  if (selectedDept && selectedDept.localizacao) {
    form.localizacao = selectedDept.localizacao
  }
}

const loadTechnicians = async () => {
  if (!canManageStatus.value) return
  
  try {
    const response = await api.get('/users?perfil=tecnico&ativo=true')
    technicians.value = response.data.data.users
  } catch (err) {
    console.error('Erro ao carregar técnicos:', err)
  }
}

const loadSolicitacao = async () => {
  if (!isEdit.value) return

  try {
    loading.value = true
    const response = await api.get(`/solicitacoes/${route.params.id}`)
    
    if (response.data.success) {
      const solicitacao = response.data.data.solicitacao
      
      Object.assign(form, {
        titulo: solicitacao.titulo,
        category_id: solicitacao.category_id,
        subcategory_id: solicitacao.subcategory_id || '',
        prioridade: solicitacao.prioridade,
        localizacao: solicitacao.localizacao,
        descricao: solicitacao.descricao,
        observacoes: solicitacao.observacoes || '',
        data_prevista: solicitacao.data_prevista ? 
          new Date(solicitacao.data_prevista).toISOString().slice(0, 16) : '',
        department_id: solicitacao.department_id || '',
        status: solicitacao.status,
        responsavel_id: solicitacao.responsavel_id || ''
      })
      
      // Carregar subcategorias se uma categoria estiver selecionada
      if (solicitacao.category_id) {
        await loadSubcategorias(solicitacao.category_id)
      }
    }
  } catch (err) {
    console.error('Erro ao carregar solicitação:', err)
    error('Erro ao carregar solicitação', 'Não foi possível carregar os dados da solicitação')
    router.push('/solicitacoes')
  } finally {
    loading.value = false
  }
}

const submitForm = async () => {
  try {
    loading.value = true

    const data = {
      titulo: form.titulo.trim(),
      categoria: form.categoria,
      subcategoria: form.subcategoria?.trim(),
      prioridade: form.prioridade,
      localizacao: form.localizacao.trim(),
      descricao: form.descricao.trim(),
      observacoes: form.observacoes?.trim(),
      data_prevista: form.data_prevista || null,
      department_id: form.department_id || null
    }

    // Campos administrativos
    if (canManageStatus.value) {
      data.status = form.status
      data.responsavel_id = form.responsavel_id || null
    }

    let response
    if (isEdit.value) {
      response = await api.put(`/solicitacoes/${route.params.id}`, data)
    } else {
      response = await api.post('/solicitacoes', data)
    }

    if (response.data.success) {
      success(
        `Solicitação ${isEdit.value ? 'atualizada' : 'criada'}`,
        `${form.titulo} foi ${isEdit.value ? 'atualizada' : 'criada'} com sucesso`
      )
      router.push('/solicitacoes')
    }
  } catch (err) {
    console.error('Erro ao salvar solicitação:', err)
    const message = err.response?.data?.message || 'Erro ao salvar solicitação'
    error('Erro ao salvar', message)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    loadDepartments(),
    loadCategorias(),
    loadTechnicians(),
    loadSolicitacao()
  ])
})
</script>

<style scoped>
.solicitacao-form-page {
  padding: 2rem;
  max-width: 800px;
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

.form-container {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: var(--shadow);
}

.solicitacao-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.form-input,
.form-select,
.form-textarea {
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.char-count {
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-align: right;
}

.form-hint {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-style: italic;
}

.admin-section {
  border-top: 2px solid var(--border-color);
  padding-top: 1.5rem;
  margin-top: 1rem;
}

.admin-section h3 {
  color: var(--primary-color);
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1.5rem;
  border-top: 2px solid var(--border-color);
  margin-top: 1rem;
}

.form-hint {
  color: #666;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: var(--secondary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--secondary-hover);
  transform: translateY(-1px);
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 768px) {
  .solicitacao-form-page {
    padding: 1rem;
  }
  
  .form-container {
    padding: 1.5rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>