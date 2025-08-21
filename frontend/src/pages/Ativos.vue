<template>
  <div class="ativos-page">
    <header class="page-header">
      <h1>Gestão de Ativos</h1>
      
      <button 
        v-if="podeGerenciarAtivos" 
        class="btn btn-create" 
        @click="abrirModalCadastro()"
      >
        <i class="fas fa-plus"></i>
        Novo Ativo
      </button>
    </header>

    <!-- Dashboard de Estatísticas -->
    <div class="dashboard-cards">
      <div class="card">
        <h3>Total de Ativos</h3>
        <div class="card-stats">
          <span class="stats-number" :class="{ 'loading': carregando }">
            {{ carregando ? '...' : stats.total }}
          </span>
          <span class="stats-label">Cadastrados</span>
        </div>
      </div>

      <div class="card">
        <h3>Operacionais</h3>
        <div class="card-stats">
          <span class="stats-number text-success" :class="{ 'loading': carregando }">
            {{ carregando ? '...' : stats.operacional }}
          </span>
          <span class="stats-label">Em funcionamento</span>
        </div>
      </div>

      <div class="card">
        <h3>Em Manutenção</h3>
        <div class="card-stats">
          <span class="stats-number text-warning" :class="{ 'loading': carregando }">
            {{ carregando ? '...' : stats.manutencao }}
          </span>
          <span class="stats-label">Sendo reparados</span>
        </div>
      </div>

      <div class="card">
        <h3>Criticidade Alta</h3>
        <div class="card-stats">
          <span class="stats-number text-danger" :class="{ 'loading': carregando }">
            {{ carregando ? '...' : stats.critica }}
          </span>
          <span class="stats-label">Requer atenção</span>
        </div>
      </div>
    </div>

    <div class="ativos-content">
      <!-- Filtros -->
      <div class="ativos-filters">
        <input 
          v-model="filtros.busca" 
          type="text" 
          placeholder="Buscar por código ou nome..."
          class="form-input"
        />
        
        <select v-model="filtros.estado" class="form-select">
          <option value="">Todos os estados</option>
          <option value="operacional">Operacional</option>
          <option value="manutencao">Em Manutenção</option>
          <option value="parado">Parado</option>
          <option value="descartado">Descartado</option>
        </select>
        
        <select v-model="filtros.criticidade" class="form-select">
          <option value="">Todas as criticidades</option>
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select>
        
        <select v-model="filtros.setor_id" class="form-select">
          <option value="">Todos os setores</option>
          <option v-for="setor in setores" :key="setor.id" :value="setor.id">
            {{ setor.codigo }} - {{ setor.nome }}
          </option>
        </select>
      </div>

      <!-- Tabela de Ativos -->
      <div class="ativos-table">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Setor</th>
              <th>Localização</th>
              <th>Estado</th>
              <th>Criticidade</th>
              <th v-if="podeGerenciarAtivos">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ativo in ativosFiltrados" :key="ativo.id">
              <td>
                <strong>{{ ativo.codigo_patrimonio }}</strong>
              </td>
              <td>{{ ativo.nome }}</td>
              <td>
                <span v-if="ativo.setor" class="setor-badge">
                  {{ ativo.setor.codigo }}
                </span>
                <span v-else class="text-gray">Sem setor</span>
              </td>
              <td>{{ ativo.localizacao || 'Não informado' }}</td>
              <td>
                <span class="status-badge" :class="getEstadoClass(ativo.estado)">
                  {{ formatarEstado(ativo.estado) }}
                </span>
              </td>
              <td>
                <span class="criticidade-badge" :class="getCriticidadeClass(ativo.criticidade)">
                  {{ formatarCriticidade(ativo.criticidade) }}
                </span>
              </td>
              <td v-if="podeGerenciarAtivos">
                <div class="action-buttons">
                  <button 
                    class="btn btn-edit btn-sm" 
                    @click="editarAtivo(ativo)"
                    title="Editar ativo"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button 
                    class="btn btn-view btn-sm" 
                    @click="visualizarAtivo(ativo)"
                    title="Visualizar ativo"
                  >
                    <i class="fas fa-eye"></i>
                  </button>
                  <button 
                    v-if="podeExcluirAtivos"
                    class="btn btn-delete btn-sm" 
                    @click="excluirAtivo(ativo)"
                    title="Excluir ativo"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="ativosFiltrados.length === 0">
              <td :colspan="podeGerenciarAtivos ? 7 : 6" class="no-data">
                {{ carregando ? 'Carregando ativos...' : 'Nenhum ativo encontrado' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Cadastro/Edição -->
    <div v-if="modalAberto" class="modal-overlay" @click="fecharModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>{{ ativoEdicao ? 'Editar Ativo' : 'Novo Ativo' }}</h2>
          <button @click="fecharModal" class="modal-close">&times;</button>
        </div>
        
        <form @submit.prevent="salvarAtivo" class="modal-form">
          <div class="form-sections">
            <!-- Seção 1: Identificação -->
            <div class="form-section">
              <h3 class="section-title">
                <i class="fas fa-id-card"></i>
                Identificação do Ativo
              </h3>
              
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Código Patrimonial*</label>
                  <input 
                    v-model="formulario.codigo_patrimonio" 
                    type="text" 
                    required 
                    class="form-input"
                    placeholder="Ex: EQP-001-2024"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Nome do Ativo*</label>
                  <input 
                    v-model="formulario.nome" 
                    type="text" 
                    required 
                    class="form-input"
                    placeholder="Nome do equipamento"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Categoria</label>
                  <select v-model="formulario.categoria_id" class="form-input">
                    <option value="">Selecione a categoria</option>
                    <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
                      {{ categoria.nome }}
                    </option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Setor*</label>
                  <select v-model="formulario.setor_id" required class="form-input">
                    <option value="">Selecione o setor</option>
                    <option v-for="setor in setores" :key="setor.id" :value="setor.id">
                      {{ setor.nome }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Seção 2: Dados do Fabricante -->
            <div class="form-section">
              <h3 class="section-title">
                <i class="fas fa-industry"></i>
                Dados do Fabricante
              </h3>
              
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Fabricante</label>
                  <input 
                    v-model="formulario.fabricante" 
                    type="text" 
                    class="form-input"
                    placeholder="Nome do fabricante"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Modelo</label>
                  <input 
                    v-model="formulario.modelo" 
                    type="text" 
                    class="form-input"
                    placeholder="Modelo do equipamento"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Número de Série</label>
                  <input 
                    v-model="formulario.numero_serie" 
                    type="text" 
                    class="form-input"
                    placeholder="Número de série"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Ano de Fabricação</label>
                  <input 
                    v-model.number="formulario.ano_fabricacao" 
                    type="number" 
                    class="form-input"
                    :min="1900"
                    :max="new Date().getFullYear() + 1"
                    placeholder="2024"
                  />
                </div>
              </div>
            </div>

            <!-- Seção 3: Localização -->
            <div class="form-section">
              <h3 class="section-title">
                <i class="fas fa-map-marker-alt"></i>
                Localização
              </h3>
              
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Localização Completa</label>
                  <input 
                    v-model="formulario.localizacao_completa" 
                    type="text" 
                    class="form-input"
                    placeholder="Ex: Setor A - Linha 1 - Posição 3"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Prédio</label>
                  <input 
                    v-model="formulario.predio" 
                    type="text" 
                    class="form-input"
                    placeholder="Prédio/Galpão"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Andar</label>
                  <input 
                    v-model="formulario.andar" 
                    type="text" 
                    class="form-input"
                    placeholder="Térreo, 1º, 2º..."
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Sala/Área</label>
                  <input 
                    v-model="formulario.sala" 
                    type="text" 
                    class="form-input"
                    placeholder="Sala ou área específica"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Posição</label>
                  <input 
                    v-model="formulario.posicao" 
                    type="text" 
                    class="form-input"
                    placeholder="Posição específica"
                  />
                </div>
              </div>
            </div>

            <!-- Seção 4: Estado e Criticidade -->
            <div class="form-section">
              <h3 class="section-title">
                <i class="fas fa-exclamation-triangle"></i>
                Estado e Criticidade
              </h3>
              
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Estado*</label>
                  <select v-model="formulario.estado" required class="form-input">
                    <option value="">Selecione o estado</option>
                    <option value="operacional">Operacional</option>
                    <option value="manutencao">Em Manutenção</option>
                    <option value="parado">Parado</option>
                    <option value="inativo">Inativo</option>
                    <option value="baixado">Baixado</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Criticidade*</label>
                  <select v-model="formulario.criticidade" required class="form-input">
                    <option value="">Selecione a criticidade</option>
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Responsável</label>
                  <select v-model="formulario.responsavel_id" class="form-input">
                    <option value="">Selecione o responsável</option>
                    <option v-for="usuario in usuarios" :key="usuario.id" :value="usuario.id">
                      {{ usuario.nome }}
                    </option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Vida Útil (anos)</label>
                  <input 
                    v-model.number="formulario.vida_util_anos" 
                    type="number" 
                    class="form-input"
                    min="1"
                    placeholder="10"
                  />
                </div>
              </div>
            </div>

            <!-- Seção 5: Características Técnicas -->
            <div class="form-section">
              <h3 class="section-title">
                <i class="fas fa-cogs"></i>
                Características Técnicas
              </h3>
              
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Potência</label>
                  <input 
                    v-model="formulario.potencia" 
                    type="text" 
                    class="form-input"
                    placeholder="Ex: 5 kW, 220 HP"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Tensão</label>
                  <input 
                    v-model="formulario.tensao" 
                    type="text" 
                    class="form-input"
                    placeholder="Ex: 220V, 380V, 440V"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Frequência</label>
                  <input 
                    v-model="formulario.frequencia" 
                    type="text" 
                    class="form-input"
                    placeholder="Ex: 60Hz, 50Hz"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Peso (kg)</label>
                  <input 
                    v-model.number="formulario.peso" 
                    type="number" 
                    step="0.01"
                    min="0"
                    class="form-input"
                    placeholder="0.00"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Dimensões</label>
                  <input 
                    v-model="formulario.dimensoes" 
                    type="text" 
                    class="form-input"
                    placeholder="Ex: 100x50x30 cm"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Capacidade</label>
                  <input 
                    v-model="formulario.capacidade" 
                    type="text" 
                    class="form-input"
                    placeholder="Ex: 1000 L/h, 50 ton"
                  />
                </div>
              </div>
            </div>

            <!-- Seção 6: Informações Financeiras -->
            <div class="form-section">
              <h3 class="section-title">
                <i class="fas fa-dollar-sign"></i>
                Informações Financeiras
              </h3>
              
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Data de Aquisição</label>
                  <input 
                    v-model="formulario.data_aquisicao" 
                    type="date" 
                    class="form-input"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Valor de Aquisição (R$)</label>
                  <input 
                    v-model.number="formulario.valor_aquisicao" 
                    type="number" 
                    step="0.01"
                    min="0"
                    class="form-input"
                    placeholder="0.00"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Valor Atual (R$)</label>
                  <input 
                    v-model.number="formulario.valor_atual" 
                    type="number" 
                    step="0.01"
                    min="0"
                    class="form-input"
                    placeholder="0.00"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Fornecedor</label>
                  <input 
                    v-model="formulario.fornecedor" 
                    type="text" 
                    class="form-input"
                    placeholder="Nome do fornecedor"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Garantia até</label>
                  <input 
                    v-model="formulario.garantia_ate" 
                    type="date" 
                    class="form-input"
                  />
                </div>
              </div>
            </div>

            <!-- Seção 7: Manutenção -->
            <div class="form-section">
              <h3 class="section-title">
                <i class="fas fa-wrench"></i>
                Informações de Manutenção
              </h3>
              
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Próxima Inspeção</label>
                  <input 
                    v-model="formulario.data_proxima_inspecao" 
                    type="date" 
                    class="form-input"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Horas de Funcionamento</label>
                  <input 
                    v-model.number="formulario.horas_funcionamento" 
                    type="number" 
                    step="0.01"
                    min="0"
                    class="form-input"
                    placeholder="0.00"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Contador de Produção</label>
                  <input 
                    v-model.number="formulario.contador_producao" 
                    type="number" 
                    min="0"
                    class="form-input"
                    placeholder="0"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Última Manutenção</label>
                  <input 
                    v-model="formulario.ultima_manutencao" 
                    type="date" 
                    class="form-input"
                  />
                </div>
              </div>
            </div>

            <!-- Seção 8: Documentação e Observações -->
            <div class="form-section">
              <h3 class="section-title">
                <i class="fas fa-file-alt"></i>
                Documentação e Observações
              </h3>
              
              <div class="form-group">
                <label class="form-label">Especificações Técnicas</label>
                <textarea 
                  v-model="formulario.especificacoes_tecnicas" 
                  class="form-input"
                  rows="3"
                  placeholder="Especificações técnicas detalhadas do equipamento..."
                ></textarea>
              </div>
              
              <div class="form-group">
                <label class="form-label">Manual de Operação</label>
                <textarea 
                  v-model="formulario.manual_operacao" 
                  class="form-input"
                  rows="3"
                  placeholder="Procedimentos de operação, instruções de uso..."
                ></textarea>
              </div>
              
              <div class="form-group">
                <label class="form-label">Manual de Manutenção</label>
                <textarea 
                  v-model="formulario.manual_manutencao" 
                  class="form-input"
                  rows="3"
                  placeholder="Procedimentos de manutenção, frequências, peças..."
                ></textarea>
              </div>
              
              <div class="form-group">
                <label class="form-label">Observações Gerais</label>
                <textarea 
                  v-model="formulario.observacoes" 
                  class="form-input"
                  rows="3"
                  placeholder="Observações gerais, histórico, informações adicionais..."
                ></textarea>
              </div>
            </div>

            <!-- Imagens só aparecem na edição -->
            <div v-if="ativoEdicao" class="form-section">
              <h3 class="section-title">
                <i class="fas fa-images"></i>
                Imagens do Ativo
              </h3>
              <ImagensAtivo
                :ativo-id="ativoEdicao.id"
                :editavel="true"
              />
            </div>
          </div>          <div class="modal-actions">
            <button type="button" @click="fecharModal" class="btn btn-outline">
              <i class="fas fa-times"></i>
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="salvando">
              <i class="fas fa-save"></i>
              {{ salvando ? 'Salvando...' : 'Salvar Ativo' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import api from '@/services/api'
import ImagensAtivo from '@/components/ativos/ImagensAtivo.vue'

const authStore = useAuthStore()
const { success, error } = useToast()

// Estados reativos
const ativos = ref([])
const setores = ref([])
const categorias = ref([])
const usuarios = ref([])
const stats = ref({
  total: 0,
  operacional: 0,
  manutencao: 0,
  critica: 0
})
const carregando = ref(false)
const modalAberto = ref(false)
const ativoEdicao = ref(null)
const salvando = ref(false)

// Filtros
const filtros = ref({
  busca: '',
  estado: '',
  criticidade: '',
  setor_id: ''
})

// Formulário
const formulario = ref({
  // Identificação
  codigo_patrimonio: '',
  nome: '',
  categoria_id: '',
  setor_id: '',
  
  // Fabricante
  fabricante: '',
  modelo: '',
  numero_serie: '',
  ano_fabricacao: null,
  
  // Localização
  localizacao_completa: '',
  predio: '',
  andar: '',
  sala: '',
  posicao: '',
  
  // Estado e Criticidade
  estado: '',
  criticidade: '',
  responsavel_id: '',
  vida_util_anos: null,
  
  // Características Técnicas
  potencia: '',
  tensao: '',
  frequencia: '',
  peso: null,
  dimensoes: '',
  capacidade: '',
  
  // Financeiro
  data_aquisicao: '',
  valor_aquisicao: null,
  valor_atual: null,
  fornecedor: '',
  garantia_ate: '',
  
  // Manutenção
  data_proxima_inspecao: '',
  horas_funcionamento: null,
  contador_producao: null,
  ultima_manutencao: '',
  
  // Documentação
  especificacoes_tecnicas: '',
  manual_operacao: '',
  manual_manutencao: '',
  observacoes: '',
  
  // Referências
  department_id: 1,
  ativo: true
})

// Computed properties
const podeGerenciarAtivos = computed(() => {
  const nivel = {
    'solicitante': 1,
    'tecnico': 2,
    'supervisor': 3,
    'administrador': 4
  }
  return nivel[authStore.user?.perfil] >= 2
})

const podeExcluirAtivos = computed(() => {
  const nivel = {
    'solicitante': 1,
    'tecnico': 2,
    'supervisor': 3,
    'administrador': 4
  }
  return nivel[authStore.user?.perfil] >= 3
})

const ativosFiltrados = computed(() => {
  let filtrados = ativos.value

  if (filtros.value.busca) {
    const busca = filtros.value.busca.toLowerCase()
    filtrados = filtrados.filter(ativo => 
      ativo.codigo_patrimonio.toLowerCase().includes(busca) ||
      ativo.nome.toLowerCase().includes(busca)
    )
  }

  if (filtros.value.estado) {
    filtrados = filtrados.filter(ativo => ativo.estado === filtros.value.estado)
  }

  if (filtros.value.criticidade) {
    filtrados = filtrados.filter(ativo => ativo.criticidade === filtros.value.criticidade)
  }

  if (filtros.value.setor_id) {
    filtrados = filtrados.filter(ativo => ativo.setor_id == filtros.value.setor_id)
  }

  return filtrados
})

// Métodos
const carregarAtivos = async () => {
  try {
    carregando.value = true
    const response = await api.get('/ativos')
    
    if (response.data.success) {
      ativos.value = response.data.data.ativos || []
      calcularEstatisticas()
    }
  } catch (err) {
    console.error('Erro ao carregar ativos:', err)
    error('Erro', 'Não foi possível carregar os ativos')
  } finally {
    carregando.value = false
  }
}

const carregarSetores = async () => {
  try {
    const response = await api.get('/setores/ativos')
    if (response.data.success) {
      setores.value = response.data.data.setores || []
    }
  } catch (err) {
    console.error('Erro ao carregar setores:', err)
  }
}

const carregarCategorias = async () => {
  try {
    const response = await api.get('/categories')
    if (response.data.success) {
      categorias.value = response.data.data.categories || []
    }
  } catch (err) {
    console.error('Erro ao carregar categorias:', err)
  }
}

const carregarUsuarios = async () => {
  try {
    const response = await api.get('/users')
    if (response.data.success) {
      usuarios.value = response.data.data.users || []
    }
  } catch (err) {
    console.error('Erro ao carregar usuários:', err)
  }
}

const calcularEstatisticas = () => {
  const total = ativos.value.length
  const operacional = ativos.value.filter(a => a.estado === 'operacional').length
  const manutencao = ativos.value.filter(a => a.estado === 'manutencao').length
  const critica = ativos.value.filter(a => a.criticidade === 'critica' || a.criticidade === 'alta').length

  stats.value = { total, operacional, manutencao, critica }
}

const formatarEstado = (estado) => {
  const estados = {
    'operacional': 'Operacional',
    'manutencao': 'Em Manutenção',
    'parado': 'Parado',
    'descartado': 'Descartado'
  }
  return estados[estado] || estado
}

const formatarCriticidade = (criticidade) => {
  const criticidades = {
    'baixa': 'Baixa',
    'media': 'Média',
    'alta': 'Alta',
    'critica': 'Crítica'
  }
  return criticidades[criticidade] || criticidade
}

const getEstadoClass = (estado) => {
  return {
    'operacional': 'active',
    'manutencao': 'warning',
    'parado': 'danger',
    'descartado': 'inactive'
  }[estado] || ''
}

const getCriticidadeClass = (criticidade) => {
  return criticidade
}

const abrirModalCadastro = () => {
  ativoEdicao.value = null
  formulario.value = {
    // Identificação
    codigo_patrimonio: '',
    nome: '',
    categoria_id: '',
    setor_id: '',
    
    // Fabricante
    fabricante: '',
    modelo: '',
    numero_serie: '',
    ano_fabricacao: null,
    
    // Localização
    localizacao_completa: '',
    predio: '',
    andar: '',
    sala: '',
    posicao: '',
    
    // Estado e Criticidade
    estado: '',
    criticidade: '',
    responsavel_id: '',
    vida_util_anos: null,
    
    // Características Técnicas
    potencia: '',
    tensao: '',
    frequencia: '',
    peso: null,
    dimensoes: '',
    capacidade: '',
    
    // Financeiro
    data_aquisicao: '',
    valor_aquisicao: null,
    valor_atual: null,
    fornecedor: '',
    garantia_ate: '',
    
    // Manutenção
    data_proxima_inspecao: '',
    horas_funcionamento: null,
    contador_producao: null,
    ultima_manutencao: '',
    
    // Documentação
    especificacoes_tecnicas: '',
    manual_operacao: '',
    manual_manutencao: '',
    observacoes: '',
    
    // Referências
    department_id: 1,
    ativo: true
  }
  modalAberto.value = true
}

const editarAtivo = (ativo) => {
  ativoEdicao.value = ativo
  formulario.value = {
    // Identificação
    codigo_patrimonio: ativo.codigo_patrimonio || '',
    nome: ativo.nome || '',
    categoria_id: ativo.categoria_id || '',
    setor_id: ativo.setor_id || '',
    
    // Fabricante
    fabricante: ativo.fabricante || '',
    modelo: ativo.modelo || '',
    numero_serie: ativo.numero_serie || '',
    ano_fabricacao: ativo.ano_fabricacao || null,
    
    // Localização
    localizacao_completa: ativo.localizacao_completa || '',
    predio: ativo.predio || '',
    andar: ativo.andar || '',
    sala: ativo.sala || '',
    posicao: ativo.posicao || '',
    
    // Estado e Criticidade
    estado: ativo.estado || '',
    criticidade: ativo.criticidade || '',
    responsavel_id: ativo.responsavel_id || '',
    vida_util_anos: ativo.vida_util_anos || null,
    
    // Características Técnicas
    potencia: ativo.potencia || '',
    tensao: ativo.tensao || '',
    frequencia: ativo.frequencia || '',
    peso: ativo.peso || null,
    dimensoes: ativo.dimensoes || '',
    capacidade: ativo.capacidade || '',
    
    // Financeiro
    data_aquisicao: ativo.data_aquisicao ? ativo.data_aquisicao.split('T')[0] : '',
    valor_aquisicao: ativo.valor_aquisicao || null,
    valor_atual: ativo.valor_atual || null,
    fornecedor: ativo.fornecedor || '',
    garantia_ate: ativo.garantia_ate ? ativo.garantia_ate.split('T')[0] : '',
    
    // Manutenção
    data_proxima_inspecao: ativo.data_proxima_inspecao ? ativo.data_proxima_inspecao.split('T')[0] : '',
    horas_funcionamento: ativo.horas_funcionamento || null,
    contador_producao: ativo.contador_producao || null,
    ultima_manutencao: ativo.ultima_manutencao ? ativo.ultima_manutencao.split('T')[0] : '',
    
    // Documentação
    especificacoes_tecnicas: ativo.especificacoes_tecnicas || '',
    manual_operacao: ativo.manual_operacao || '',
    manual_manutencao: ativo.manual_manutencao || '',
    observacoes: ativo.observacoes || '',
    
    // Referências
    department_id: ativo.department_id || 1,
    ativo: ativo.ativo !== undefined ? ativo.ativo : true
  }
  modalAberto.value = true
}

const visualizarAtivo = (ativo) => {
  alert(`Ativo: ${ativo.codigo_patrimonio}\nNome: ${ativo.nome}\nEstado: ${formatarEstado(ativo.estado)}\nCriticidade: ${formatarCriticidade(ativo.criticidade)}`)
}

const excluirAtivo = async (ativo) => {
  if (!confirm(`Deseja realmente excluir o ativo ${ativo.codigo_patrimonio}?`)) {
    return
  }

  try {
    await api.delete(`/ativos/${ativo.id}`)
    success('Sucesso', 'Ativo excluído com sucesso')
    await carregarAtivos()
  } catch (err) {
    console.error('Erro ao excluir ativo:', err)
    error('Erro', 'Não foi possível excluir o ativo')
  }
}

const salvarAtivo = async () => {
  try {
    salvando.value = true
    
    if (ativoEdicao.value) {
      await api.put(`/ativos/${ativoEdicao.value.id}`, formulario.value)
      success('Sucesso', 'Ativo atualizado com sucesso')
    } else {
      await api.post('/ativos', formulario.value)
      success('Sucesso', 'Ativo cadastrado com sucesso')
    }
    
    fecharModal()
    await carregarAtivos()
  } catch (err) {
    console.error('Erro ao salvar ativo:', err)
    error('Erro', 'Não foi possível salvar o ativo')
  } finally {
    salvando.value = false
  }
}

const fecharModal = () => {
  modalAberto.value = false
  ativoEdicao.value = null
}

// Watchers para filtros
watch([() => filtros.value.busca, () => filtros.value.estado, () => filtros.value.criticidade], () => {
  // Os filtros são reativos através do computed ativosFiltrados
}, { deep: true })

// Lifecycle
onMounted(() => {
  carregarAtivos()
  carregarSetores()
  carregarCategorias()
  carregarUsuarios()
})
</script>

<style scoped>
.ativos-page {
  padding: 2rem;
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

.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.card {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-light-gray);
}

.card h3 {
  color: var(--color-primary);
  font-size: 1.1rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.card-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stats-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-secondary);
  line-height: 1;
  transition: opacity 0.3s ease;
}

.stats-number.loading {
  opacity: 0.5;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

.stats-label {
  color: var(--color-dark-gray);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.ativos-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.form-input,
.form-select {
  padding: 0.75rem 1rem;
  border: 2px solid var(--color-light-gray);
  border-radius: var(--border-radius-md);
  font-size: 1rem;
  background: var(--color-white);
}

.form-input {
  min-width: 300px;
  flex: 1;
}

.form-select {
  min-width: 200px;
}

.ativos-table {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-light-gray);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: var(--color-primary);
  color: var(--color-white);
  padding: 1rem;
  text-align: left;
  font-weight: 600;
}

td {
  padding: 1rem;
  border-bottom: 1px solid var(--color-light-gray);
}

tr:last-child td {
  border-bottom: none;
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

.status-badge.warning {
  background: #fff3e0;
  color: #f57c00;
}

.status-badge.danger {
  background: #ffebee;
  color: #d32f2f;
}

.status-badge.inactive {
  background: #f5f5f5;
  color: #666;
}

.criticidade-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.criticidade-badge.baixa {
  background: #e8f5e8;
  color: #2e7d32;
}

.criticidade-badge.media {
  background: #e3f2fd;
  color: #1976d2;
}

.criticidade-badge.alta {
  background: #fff3e0;
  color: #f57c00;
}

.criticidade-badge.critica {
  background: #ffebee;
  color: #d32f2f;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.no-data {
  text-align: center;
  color: var(--color-dark-gray);
  padding: 2rem;
  font-style: italic;
}

.setor-badge {
  padding: 0.2rem 0.6rem;
  background: var(--color-light);
  color: var(--color-primary);
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

/* Botões */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-create,
.btn-primary {
  background: #3498db;
  color: white;
}

.btn-create:hover,
.btn-primary:hover {
  background: #28a745;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-outline {
  background: transparent;
  color: #3498db;
  border: 2px solid #3498db;
}

.btn-outline:hover {
  background: #3498db;
  color: white;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
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

.modal-container {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  width: 95%;
  max-width: 900px;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-light-gray);
}

.modal-header h2 {
  color: var(--color-primary);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-dark-gray);
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: var(--color-light-gray);
}

.modal-form {
  padding: 1.5rem 2rem;
  box-sizing: border-box;
  overflow-y: auto;
  flex: 1;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 0.75rem;
  width: 100%;
  box-sizing: border-box;
}

.form-group {
  margin-bottom: 0.75rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-dark);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding: 1rem 2rem;
  border-top: 1px solid var(--color-light-gray);
  background: var(--color-white);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .ativos-page {
    padding: 1rem;
  }
  
  .dashboard-cards {
    grid-template-columns: 1fr;
  }
  
  .ativos-filters {
    flex-direction: column;
  }
  
  .form-input {
    min-width: auto;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-container {
    width: 95%;
    max-width: 95vw;
    max-height: 95vh;
    margin: 0.5rem;
  }
  
  .modal-form {
    padding: 1rem;
  }
  
  .modal-actions {
    padding: 1rem;
    flex-direction: column;
  }
  
  .modal-actions .btn {
    width: 100%;
    justify-content: center;
  }
}

.imagens-placeholder {
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  color: #6c757d;
  font-style: italic;
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.form-group:has(.imagens-ativo) {
  grid-column: 1 / -1;
}

/* Estilos para seções do formulário */
.form-sections {
  padding: 20px;
}

.form-section {
  margin-bottom: 2rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.section-title {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 1rem 1.5rem;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title i {
  color: #6366f1;
  font-size: 1.1rem;
}

.form-section .form-grid,
.form-section .form-group {
  padding: 1.5rem;
  padding-bottom: 0;
}

.form-section .form-group:last-child {
  padding-bottom: 1.5rem;
}
</style>