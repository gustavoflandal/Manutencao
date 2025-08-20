<template>
  <div class="workflow-form-page">
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <button class="btn-back" @click="handleBack">
            <i class="lucide-arrow-left"></i>
          </button>
          <div>
            <h1>{{ isEditing ? 'Editar Workflow' : 'Novo Workflow' }}</h1>
            <p class="subtitle">{{ templateData ? `Baseado no template: ${templateData.nome}` : 'Criar workflow personalizado' }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button 
            class="btn btn-outline"
            @click="saveAsDraft"
            :disabled="saving"
          >
            <i class="lucide-save"></i>
            Salvar Rascunho
          </button>
          <button 
            class="btn btn-primary"
            @click="saveWorkflow"
            :disabled="saving || !isFormValid"
          >
            <i class="lucide-check"></i>
            {{ saving ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar') }}
          </button>
        </div>
      </div>
    </header>

    <div class="page-content">
      <!-- Progress Steps -->
      <div class="steps-progress">
        <div 
          v-for="(step, index) in steps" 
          :key="step.key"
          class="step"
          :class="{ 
            'active': currentStep === index,
            'completed': currentStep > index,
            'disabled': currentStep < index && !step.optional
          }"
          @click="goToStep(index)"
        >
          <div class="step-number">
            <i v-if="currentStep > index" class="lucide-check"></i>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div class="step-info">
            <h4>{{ step.title }}</h4>
            <p>{{ step.description }}</p>
          </div>
        </div>
      </div>

      <!-- Form Content -->
      <div class="form-section">
        <!-- Passo 1: Informações Básicas -->
        <div v-if="currentStep === 0" class="step-content">
          <h2>Informações Básicas</h2>
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Nome do Workflow *</label>
              <input 
                type="text" 
                v-model="form.nome" 
                placeholder="Ex: Aprovação de Ordem de Serviço"
                required
              />
              <div class="field-hint">Nome identificador único para este workflow</div>
            </div>
            
            <div class="form-group full-width">
              <label>Descrição</label>
              <textarea 
                v-model="form.descricao" 
                rows="3"
                placeholder="Descreva o propósito e funcionamento deste workflow..."
              ></textarea>
            </div>
            
            <div class="form-group">
              <label>Categoria *</label>
              <select v-model="form.categoria" required>
                <option value="">Selecione uma categoria</option>
                <option value="operacional">Operacional</option>
                <option value="financeiro">Financeiro</option>
                <option value="emergencial">Emergencial</option>
                <option value="administrativo">Administrativo</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Tipo</label>
              <input 
                type="text" 
                v-model="form.tipo" 
                placeholder="Ex: aprovacao_ordem_servico"
              />
            </div>
            
            <div class="form-group">
              <label>Prazo Máximo (horas) *</label>
              <input 
                type="number" 
                v-model.number="form.prazo_maximo" 
                min="1"
                max="720"
                required
              />
            </div>
            
            <div class="form-group">
              <label>Prioridade Padrão</label>
              <select v-model="form.prioridade_padrao">
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Evento Disparador</label>
              <select v-model="form.trigger_evento">
                <option value="manual">Manual</option>
                <option value="criacao_ordem">Criação de Ordem</option>
                <option value="valor_limite">Valor Limite</option>
                <option value="mudanca_status">Mudança de Status</option>
                <option value="prazo_vencimento">Prazo de Vencimento</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.publico" />
                <span class="checkmark"></span>
                Workflow Público (outros usuários podem usar)
              </label>
            </div>
          </div>
        </div>

        <!-- Passo 2: Estados do Workflow -->
        <div v-if="currentStep === 1" class="step-content">
          <div class="section-header">
            <h2>Estados do Workflow</h2>
            <button class="btn btn-outline" @click="addEstado">
              <i class="lucide-plus"></i>
              Adicionar Estado
            </button>
          </div>
          
          <div class="estados-list">
            <div 
              v-for="(estado, index) in form.estados" 
              :key="estado.tempId"
              class="estado-item"
              :class="{ 
                'initial': estado.id === form.estado_inicial,
                'final': form.estados_finais.includes(estado.id)
              }"
            >
              <div class="estado-header">
                <div class="estado-icon">
                  <i class="lucide-circle" v-if="estado.id === form.estado_inicial"></i>
                  <i class="lucide-check-circle" v-else-if="form.estados_finais.includes(estado.id)"></i>
                  <i class="lucide-circle-dot" v-else></i>
                </div>
                <div class="estado-info">
                  <input 
                    v-model="estado.nome" 
                    placeholder="Nome do estado"
                    class="estado-nome"
                  />
                  <input 
                    v-model="estado.descricao" 
                    placeholder="Descrição (opcional)"
                    class="estado-descricao"
                  />
                </div>
                <div class="estado-actions">
                  <button 
                    class="btn-icon"
                    @click="setEstadoInicial(estado.id)"
                    :class="{ active: estado.id === form.estado_inicial }"
                    title="Marcar como estado inicial"
                  >
                    <i class="lucide-play-circle"></i>
                  </button>
                  <button 
                    class="btn-icon"
                    @click="toggleEstadoFinal(estado.id)"
                    :class="{ active: form.estados_finais.includes(estado.id) }"
                    title="Marcar como estado final"
                  >
                    <i class="lucide-check-circle"></i>
                  </button>
                  <button 
                    class="btn-icon danger"
                    @click="removeEstado(index)"
                    v-if="form.estados.length > 2"
                    title="Remover estado"
                  >
                    <i class="lucide-trash-2"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="estados-help">
            <div class="help-item">
              <i class="lucide-info"></i>
              <span>Você precisa de pelo menos 2 estados: um inicial e um final</span>
            </div>
            <div class="help-item">
              <i class="lucide-play-circle"></i>
              <span>Estado inicial: por onde o workflow sempre começa</span>
            </div>
            <div class="help-item">
              <i class="lucide-check-circle"></i>
              <span>Estados finais: onde o workflow pode terminar</span>
            </div>
          </div>
        </div>

        <!-- Passo 3: Transições -->
        <div v-if="currentStep === 2" class="step-content">
          <div class="section-header">
            <h2>Transições entre Estados</h2>
            <button class="btn btn-outline" @click="addTransicao">
              <i class="lucide-plus"></i>
              Adicionar Transição
            </button>
          </div>
          
          <div class="transicoes-list">
            <div 
              v-for="(transicao, index) in form.transicoes" 
              :key="transicao.tempId"
              class="transicao-item"
            >
              <div class="transicao-flow">
                <select v-model="transicao.de" class="estado-select">
                  <option value="">Estado origem</option>
                  <option 
                    v-for="estado in form.estados" 
                    :key="estado.id"
                    :value="estado.id"
                  >
                    {{ estado.nome || `Estado ${estado.id}` }}
                  </option>
                </select>
                
                <div class="arrow">
                  <i class="lucide-arrow-right"></i>
                </div>
                
                <select v-model="transicao.para" class="estado-select">
                  <option value="">Estado destino</option>
                  <option 
                    v-for="estado in form.estados" 
                    :key="estado.id"
                    :value="estado.id"
                    :disabled="estado.id === transicao.de"
                  >
                    {{ estado.nome || `Estado ${estado.id}` }}
                  </option>
                </select>
              </div>
              
              <div class="transicao-details">
                <div class="form-row">
                  <div class="form-group">
                    <label>Nome da Transição</label>
                    <input 
                      v-model="transicao.nome" 
                      placeholder="Ex: Aprovar, Rejeitar, Revisar"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label>Condição (opcional)</label>
                    <input 
                      v-model="transicao.condicao" 
                      placeholder="Ex: valor > 1000"
                    />
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="transicao.requer_aprovacao" />
                      <span class="checkmark"></span>
                      Requer Aprovação
                    </label>
                  </div>
                  
                  <div class="form-group">
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="transicao.automatica" />
                      <span class="checkmark"></span>
                      Transição Automática
                    </label>
                  </div>
                  
                  <div class="form-group">
                    <button 
                      class="btn btn-outline btn-sm"
                      @click="removeTransicao(index)"
                      title="Remover transição"
                    >
                      <i class="lucide-trash-2"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Passo 4: Configurações Avançadas -->
        <div v-if="currentStep === 3" class="step-content">
          <h2>Configurações Avançadas</h2>
          
          <!-- Níveis de Aprovação -->
          <div class="config-section">
            <h3>Níveis de Aprovação</h3>
            <div class="niveis-aprovacao">
              <div 
                v-for="(nivel, index) in form.niveis_aprovacao" 
                :key="index"
                class="nivel-item"
              >
                <div class="nivel-number">{{ index + 1 }}</div>
                <div class="nivel-content">
                  <div class="form-row">
                    <div class="form-group">
                      <label>Nome do Nível</label>
                      <input v-model="nivel.nome" placeholder="Ex: Supervisor, Gerente" />
                    </div>
                    <div class="form-group">
                      <label>Perfil Requerido</label>
                      <select v-model="nivel.perfil_requerido">
                        <option value="">Qualquer perfil</option>
                        <option value="tecnico">Técnico</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="administrador">Administrador</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Valor Limite (R$)</label>
                      <input 
                        type="number" 
                        v-model.number="nivel.valor_limite" 
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                    <div class="form-group">
                      <button 
                        class="btn btn-outline btn-sm"
                        @click="removeNivelAprovacao(index)"
                        title="Remover nível"
                      >
                        <i class="lucide-trash-2"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <button class="btn btn-outline" @click="addNivelAprovacao">
                <i class="lucide-plus"></i>
                Adicionar Nível
              </button>
            </div>
          </div>
          
          <!-- Configuração de Escalação -->
          <div class="config-section">
            <h3>Escalação Automática</h3>
            <div class="form-row">
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="escalacaoEnabled" />
                  <span class="checkmark"></span>
                  Habilitar escalação automática
                </label>
              </div>
            </div>
            
            <div v-if="escalacaoEnabled" class="escalacao-config">
              <div class="form-row">
                <div class="form-group">
                  <label>Tempo para Escalação (horas)</label>
                  <input 
                    type="number" 
                    v-model.number="form.escalacao_config.tempo_escalacao" 
                    min="1"
                    max="72"
                  />
                </div>
                <div class="form-group">
                  <label>Escalar Para</label>
                  <select v-model="form.escalacao_config.escalar_para">
                    <option value="supervisor">Supervisor</option>
                    <option value="administrador">Administrador</option>
                    <option value="setor_responsavel">Setor Responsável</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Configuração de Notificações -->
          <div class="config-section">
            <h3>Notificações</h3>
            <div class="form-row">
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="notificacoesEnabled" />
                  <span class="checkmark"></span>
                  Habilitar notificações
                </label>
              </div>
            </div>
            
            <div v-if="notificacoesEnabled" class="notificacoes-config">
              <div class="form-row">
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="form.notificacoes_config.email" />
                    <span class="checkmark"></span>
                    Notificações por Email
                  </label>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="form.notificacoes_config.sistema" />
                    <span class="checkmark"></span>
                    Notificações no Sistema
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="form-navigation">
          <button 
            class="btn btn-outline"
            @click="previousStep"
            :disabled="currentStep === 0"
          >
            <i class="lucide-chevron-left"></i>
            Anterior
          </button>
          
          <div class="step-indicator">
            Passo {{ currentStep + 1 }} de {{ steps.length }}
          </div>
          
          <button 
            class="btn btn-primary"
            @click="nextStep"
            :disabled="currentStep === steps.length - 1 || !canProceed"
          >
            Próximo
            <i class="lucide-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Estado reativo
const currentStep = ref(0)
const saving = ref(false)
const templateData = ref(null)
const isEditing = ref(false)
const workflowId = ref(null)

// Configurações avançadas
const escalacaoEnabled = ref(false)
const notificacoesEnabled = ref(false)

// Passos do wizard
const steps = ref([
  {
    key: 'basic',
    title: 'Informações Básicas',
    description: 'Nome, categoria e configurações gerais',
    optional: false
  },
  {
    key: 'states',
    title: 'Estados',
    description: 'Definir estados do workflow',
    optional: false
  },
  {
    key: 'transitions',
    title: 'Transições',
    description: 'Conectar estados com transições',
    optional: false
  },
  {
    key: 'advanced',
    title: 'Configurações',
    description: 'Aprovações, escalação e notificações',
    optional: true
  }
])

// Formulário
const form = ref({
  nome: '',
  descricao: '',
  categoria: '',
  tipo: '',
  trigger_evento: 'manual',
  prazo_maximo: 24,
  prioridade_padrao: 'normal',
  publico: false,
  ativo: true,
  template: false,
  estado_inicial: '',
  estados_finais: [],
  estados: [],
  transicoes: [],
  niveis_aprovacao: [],
  escalacao_config: {
    tempo_escalacao: 24,
    escalar_para: 'supervisor'
  },
  notificacoes_config: {
    email: true,
    sistema: true
  }
})

// Computed
const isFormValid = computed(() => {
  const basic = form.value.nome && form.value.categoria && form.value.prazo_maximo
  const states = form.value.estados.length >= 2 && form.value.estado_inicial && form.value.estados_finais.length > 0
  const transitions = form.value.transicoes.length > 0
  
  return basic && states && transitions
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0: // Informações básicas
      return form.value.nome && form.value.categoria && form.value.prazo_maximo
    case 1: // Estados
      return form.value.estados.length >= 2 && form.value.estado_inicial && form.value.estados_finais.length > 0
    case 2: // Transições
      return form.value.transicoes.length > 0
    case 3: // Configurações avançadas
      return true // Sempre pode prosseguir pois é opcional
    default:
      return false
  }
})

// Watchers
watch(escalacaoEnabled, (value) => {
  if (!value) {
    form.value.escalacao_config = null
  } else {
    form.value.escalacao_config = {
      tempo_escalacao: 24,
      escalar_para: 'supervisor'
    }
  }
})

watch(notificacoesEnabled, (value) => {
  if (!value) {
    form.value.notificacoes_config = null
  } else {
    form.value.notificacoes_config = {
      email: true,
      sistema: true
    }
  }
})

// Métodos
const loadTemplate = async (templateId) => {
  try {
    const response = await api.get(`/workflows/templates/${templateId}`)
    templateData.value = response.data.template
    
    // Preencher formulário com dados do template
    Object.assign(form.value, {
      ...templateData.value,
      nome: `${templateData.value.nome} - Cópia`,
      template: false,
      publico: false,
      id: undefined // Remover ID para criar novo
    })
    
    // Configurar flags de configurações avançadas
    escalacaoEnabled.value = !!form.value.escalacao_config
    notificacoesEnabled.value = !!form.value.notificacoes_config
    
  } catch (error) {
    console.error('Erro ao carregar template:', error)
  }
}

const loadWorkflow = async (id) => {
  try {
    const response = await api.get(`/workflows/${id}`)
    const workflow = response.data.workflow
    
    Object.assign(form.value, workflow)
    
    escalacaoEnabled.value = !!workflow.escalacao_config
    notificacoesEnabled.value = !!workflow.notificacoes_config
    
  } catch (error) {
    console.error('Erro ao carregar workflow:', error)
  }
}

const goToStep = (step) => {
  if (step <= currentStep.value || steps.value[step].optional) {
    currentStep.value = step
  }
}

const nextStep = () => {
  if (currentStep.value < steps.length - 1 && canProceed.value) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const addEstado = () => {
  const newEstado = {
    id: `estado_${Date.now()}`,
    tempId: Date.now(),
    nome: '',
    descricao: ''
  }
  form.value.estados.push(newEstado)
}

const removeEstado = (index) => {
  const estado = form.value.estados[index]
  
  // Remover das listas de inicial e finais
  if (form.value.estado_inicial === estado.id) {
    form.value.estado_inicial = ''
  }
  
  form.value.estados_finais = form.value.estados_finais.filter(id => id !== estado.id)
  
  // Remover transições relacionadas
  form.value.transicoes = form.value.transicoes.filter(
    t => t.de !== estado.id && t.para !== estado.id
  )
  
  form.value.estados.splice(index, 1)
}

const setEstadoInicial = (estadoId) => {
  form.value.estado_inicial = estadoId
}

const toggleEstadoFinal = (estadoId) => {
  const index = form.value.estados_finais.indexOf(estadoId)
  if (index > -1) {
    form.value.estados_finais.splice(index, 1)
  } else {
    form.value.estados_finais.push(estadoId)
  }
}

const addTransicao = () => {
  const newTransicao = {
    tempId: Date.now(),
    de: '',
    para: '',
    nome: '',
    condicao: '',
    requer_aprovacao: false,
    automatica: false
  }
  form.value.transicoes.push(newTransicao)
}

const removeTransicao = (index) => {
  form.value.transicoes.splice(index, 1)
}

const addNivelAprovacao = () => {
  form.value.niveis_aprovacao.push({
    nome: '',
    perfil_requerido: '',
    valor_limite: null
  })
}

const removeNivelAprovacao = (index) => {
  form.value.niveis_aprovacao.splice(index, 1)
}

const saveAsDraft = async () => {
  await saveWorkflow(false)
}

const saveWorkflow = async (activate = true) => {
  try {
    saving.value = true
    
    const payload = {
      ...form.value,
      ativo: activate,
      user_id: authStore.user?.id
    }
    
    let response
    if (isEditing.value) {
      response = await api.put(`/workflows/${workflowId.value}`, payload)
    } else {
      response = await api.post('/workflows', payload)
    }
    
    if (response.data.success) {
      router.push('/workflows')
    }
    
  } catch (error) {
    console.error('Erro ao salvar workflow:', error)
  } finally {
    saving.value = false
  }
}

const handleBack = () => {
  if (route.query.template) {
    router.push('/workflows/templates')
  } else {
    router.push('/workflows')
  }
}

// Lifecycle
onMounted(() => {
  // Verificar se é edição
  if (route.params.id && route.params.id !== 'create') {
    isEditing.value = true
    workflowId.value = route.params.id
    loadWorkflow(route.params.id)
  }
  
  // Verificar se é baseado em template
  if (route.query.template) {
    loadTemplate(route.query.template)
  }
  
  // Adicionar estados iniciais se necessário
  if (form.value.estados.length === 0) {
    addEstado() // Estado inicial
    addEstado() // Estado final
  }
})
</script>

<style scoped>
.workflow-form-page {
  padding: 2rem;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.page-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.btn-back {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.header-left h1 {
  color: var(--primary-color);
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.steps-progress {
  display: flex;
  gap: 2rem;
  margin-bottom: 3rem;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.step {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
}

.step.active {
  background: rgba(52, 152, 219, 0.1);
  border: 2px solid #3498db;
}

.step.completed {
  background: rgba(46, 204, 113, 0.1);
}

.step.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--text-secondary);
}

.step.active .step-number {
  background: #3498db;
  color: white;
}

.step.completed .step-number {
  background: #2ecc71;
  color: white;
}

.step-info h4 {
  color: var(--primary-color);
  margin-bottom: 0.25rem;
  font-size: 1rem;
}

.step-info p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0;
}

.form-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.step-content h2 {
  color: var(--primary-color);
  margin-bottom: 2rem;
  font-size: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
}

.field-hint {
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.8;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 4px;
  position: relative;
  transition: all 0.3s ease;
}

.checkbox-label input:checked + .checkmark {
  background: #3498db;
  border-color: #3498db;
}

.checkbox-label input:checked + .checkmark::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.estados-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.estado-item {
  padding: 1.5rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.estado-item.initial {
  border-color: #3498db;
  background: rgba(52, 152, 219, 0.05);
}

.estado-item.final {
  border-color: #2ecc71;
  background: rgba(46, 204, 113, 0.05);
}

.estado-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.estado-icon {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.estado-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.estado-nome {
  font-size: 1.1rem;
  font-weight: 500;
  border: none;
  background: transparent;
  color: var(--primary-color);
}

.estado-nome:focus {
  outline: 1px solid #3498db;
  border-radius: 4px;
  padding: 0.25rem;
}

.estado-descricao {
  font-size: 0.9rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
}

.estado-descricao:focus {
  outline: 1px solid #3498db;
  border-radius: 4px;
  padding: 0.25rem;
}

.estado-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  padding: 0.5rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: rgba(0, 0, 0, 0.05);
}

.btn-icon.active {
  background: var(--primary-color);
  color: white;
}

.btn-icon.danger:hover {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.estados-help {
  background: rgba(52, 152, 219, 0.05);
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.help-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.help-item:last-child {
  margin-bottom: 0;
}

.transicoes-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.transicao-item {
  padding: 1.5rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.02);
}

.transicao-flow {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.estado-select {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

.arrow {
  color: var(--primary-color);
  font-size: 1.2rem;
}

.transicao-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
}

.config-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e9ecef;
}

.config-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.config-section h3 {
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.niveis-aprovacao {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.nivel-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.nivel-number {
  width: 40px;
  height: 40px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.nivel-content {
  flex: 1;
}

.escalacao-config,
.notificacoes-config {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(52, 152, 219, 0.05);
  border-radius: 8px;
}

.form-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e9ecef;
}

.step-indicator {
  color: var(--text-secondary);
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .workflow-form-page {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .steps-progress {
    flex-direction: column;
    gap: 1rem;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .transicao-flow {
    flex-direction: column;
  }
  
  .arrow {
    transform: rotate(90deg);
  }
  
  .nivel-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .form-navigation {
    flex-direction: column;
    gap: 1rem;
  }
}

/* Utility classes */
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-outline {
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.btn-outline:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
}
</style>