<template>
  <div class="preventiva-container">
    <div class="page-header">
      <h1>Manutenção Preventiva</h1>
      <button class="btn btn-primary" @click="abrirFormulario()">
        <i class="fas fa-plus"></i>
        Novo Plano
      </button>
    </div>

    <!-- Estatísticas -->
    <div class="stats-grid" v-if="estatisticas">
      <div class="stat-card">
        <div class="stat-icon danger">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ estatisticas.vencidos }}</span>
          <span class="stat-label">Vencidos</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon warning">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ estatisticas.proximoVencimento }}</span>
          <span class="stat-label">Próximo Vencimento</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon success">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ estatisticas.ativos }}</span>
          <span class="stat-label">Ativos</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon info">
          <i class="fas fa-cogs"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ estatisticas.total }}</span>
          <span class="stat-label">Total de Planos</span>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-section">
      <div class="filters-row">
        <div class="filter-group">
          <label>Buscar:</label>
          <input 
            type="text" 
            v-model="filtros.search" 
            placeholder="Nome, código ou descrição..."
            @input="debounceSearch"
          />
        </div>

        <div class="filter-group">
          <label>Status:</label>
          <select v-model="filtros.status_vencimento" @change="carregarPlanos">
            <option value="">Todos</option>
            <option value="vencido">Vencidos</option>
            <option value="alerta">Próximo Vencimento</option>
            <option value="normal">Normal</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Prioridade:</label>
          <select v-model="filtros.prioridade" @change="carregarPlanos">
            <option value="">Todas</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Categoria:</label>
          <select v-model="filtros.categoria" @change="carregarPlanos">
            <option value="">Todas</option>
            <option value="mecanica">Mecânica</option>
            <option value="eletrica">Elétrica</option>
            <option value="hidraulica">Hidráulica</option>
            <option value="pneumatica">Pneumática</option>
            <option value="eletronica">Eletrônica</option>
            <option value="lubrificacao">Lubrificação</option>
            <option value="limpeza">Limpeza</option>
            <option value="calibracao">Calibração</option>
            <option value="inspecao">Inspeção</option>
          </select>
        </div>

        <button class="btn btn-secondary" @click="limparFiltros">
          <i class="fas fa-times"></i>
          Limpar
        </button>
      </div>
    </div>

    <!-- Toggle de visualização -->
    <div class="view-toggle">
      <button 
        class="btn"
        :class="{ 'btn-primary': viewMode === 'lista', 'btn-secondary': viewMode !== 'lista' }"
        @click="viewMode = 'lista'"
      >
        <i class="fas fa-list"></i>
        Lista
      </button>
      <button 
        class="btn"
        :class="{ 'btn-primary': viewMode === 'calendario', 'btn-secondary': viewMode !== 'calendario' }"
        @click="viewMode = 'calendario'"
      >
        <i class="fas fa-calendar"></i>
        Calendário
      </button>
    </div>

    <!-- Visualização Lista -->
    <div v-if="viewMode === 'lista'" class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nome</th>
            <th>Ativo</th>
            <th>Periodicidade</th>
            <th>Próxima Execução</th>
            <th>Status</th>
            <th>Prioridade</th>
            <th>Responsável</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="plano in planos" :key="plano.id" :class="getRowClass(plano)">
            <td>{{ plano.codigo }}</td>
            <td>{{ plano.nome }}</td>
            <td>{{ plano.ativoObj?.nome || '-' }}</td>
            <td>{{ formatarPeriodicidade(plano) }}</td>
            <td>{{ formatarData(plano.proxima_execucao) }}</td>
            <td>
              <span class="badge" :class="getBadgeClass(plano.status_vencimento)">
                {{ formatarStatus(plano.status_vencimento) }}
              </span>
            </td>
            <td>
              <span class="badge" :class="getPrioridadeClass(plano.prioridade)">
                {{ formatarPrioridade(plano.prioridade) }}
              </span>
            </td>
            <td>{{ plano.responsavelObj?.nome || '-' }}</td>
            <td class="actions">
              <button 
                class="btn-icon btn-success" 
                @click="marcarExecucao(plano)"
                title="Marcar Execução"
                v-if="plano.status_vencimento === 'vencido' || plano.status_vencimento === 'alerta'"
              >
                <i class="fas fa-check"></i>
              </button>
              <button 
                class="btn-icon btn-primary" 
                @click="editarPlano(plano)"
                title="Editar"
              >
                <i class="fas fa-edit"></i>
              </button>
              <button 
                class="btn-icon btn-info" 
                @click="verDetalhes(plano)"
                title="Ver Detalhes"
              >
                <i class="fas fa-eye"></i>
              </button>
              <button 
                class="btn-icon btn-danger" 
                @click="excluirPlano(plano)"
                title="Excluir"
              >
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Paginação -->
      <div class="pagination" v-if="paginacao.total_pages > 1">
        <button 
          class="btn btn-secondary"
          @click="carregarPagina(paginacao.current_page - 1)"
          :disabled="paginacao.current_page === 1"
        >
          Anterior
        </button>
        
        <span class="pagination-info">
          Página {{ paginacao.current_page }} de {{ paginacao.total_pages }}
          ({{ paginacao.total }} registros)
        </span>
        
        <button 
          class="btn btn-secondary"
          @click="carregarPagina(paginacao.current_page + 1)"
          :disabled="paginacao.current_page === paginacao.total_pages"
        >
          Próxima
        </button>
      </div>
    </div>

    <!-- Visualização Calendário -->
    <div v-if="viewMode === 'calendario'" class="calendario-container">
      <div class="calendario-header">
        <button class="btn btn-secondary" @click="navegarMes(-1)">
          <i class="fas fa-chevron-left"></i>
        </button>
        <h3>{{ formatarMesAno(mesAtual, anoAtual) }}</h3>
        <button class="btn btn-secondary" @click="navegarMes(1)">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      
      <div class="calendario-grid">
        <div class="dia-header" v-for="dia in diasSemana" :key="dia">
          {{ dia }}
        </div>
        
        <div 
          v-for="(dia, index) in diasCalendario" 
          :key="index"
          class="dia-celula"
          :class="{ 
            'outro-mes': dia.outroMes,
            'hoje': dia.hoje,
            'com-eventos': dia.eventos?.length > 0
          }"
        >
          <div class="dia-numero">{{ dia.numero }}</div>
          <div class="eventos" v-if="dia.eventos?.length > 0">
            <div 
              v-for="evento in dia.eventos.slice(0, 2)" 
              :key="evento.id"
              class="evento"
              :class="getBadgeClass(evento.status_vencimento)"
              @click="verDetalhes(evento)"
            >
              {{ evento.nome }}
            </div>
            <div v-if="dia.eventos.length > 2" class="mais-eventos">
              +{{ dia.eventos.length - 2 }} mais
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      Carregando...
    </div>

    <!-- Modal de Formulário -->
    <PlanoForm 
      v-if="mostrarFormulario"
      :plano="planoEdicao"
      @close="fecharFormulario"
      @saved="onPlanoSalvo"
    />

    <!-- Modal de Execução -->
    <div v-if="mostrarExecucao" class="modal-overlay" @click="fecharExecucao">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Marcar Execução - {{ planoExecucao?.nome }}</h3>
          <button class="btn-close" @click="fecharExecucao">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form @submit.prevent="confirmarExecucao" class="modal-body">
          <div class="form-group">
            <label>Data de Execução:</label>
            <input 
              type="date" 
              v-model="execucaoData.data_execucao" 
              :max="new Date().toISOString().split('T')[0]"
              required
            />
          </div>
          
          <div class="form-group">
            <label>Observações:</label>
            <textarea 
              v-model="execucaoData.observacoes_execucao"
              placeholder="Observações sobre a execução..."
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="fecharExecucao">
              Cancelar
            </button>
            <button type="submit" class="btn btn-success">
              Confirmar Execução
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useToast } from '../composables/useToast'
import api from '../services/api'
import PlanoForm from '../components/PlanoForm.vue'

export default {
  name: 'Preventiva',
  components: {
    PlanoForm
  },
  setup() {
    const { showToast } = useToast()
    
    // Estado reativo
    const loading = ref(false)
    const planos = ref([])
    const estatisticas = ref(null)
    const viewMode = ref('lista')
    const mostrarFormulario = ref(false)
    const mostrarExecucao = ref(false)
    const planoEdicao = ref(null)
    const planoExecucao = ref(null)
    
    // Calendário
    const mesAtual = ref(new Date().getMonth())
    const anoAtual = ref(new Date().getFullYear())
    const calendarioEventos = ref({})
    
    // Paginação
    const paginacao = reactive({
      current_page: 1,
      per_page: 20,
      total: 0,
      total_pages: 0
    })
    
    // Filtros
    const filtros = reactive({
      search: '',
      status_vencimento: '',
      prioridade: '',
      categoria: '',
      ativo_id: '',
      setor_id: '',
      responsavel_id: ''
    })
    
    // Execução
    const execucaoData = reactive({
      data_execucao: new Date().toISOString().split('T')[0],
      observacoes_execucao: ''
    })
    
    // Computed
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    
    const diasCalendario = computed(() => {
      const primeiroDia = new Date(anoAtual.value, mesAtual.value, 1)
      const ultimoDia = new Date(anoAtual.value, mesAtual.value + 1, 0)
      const hoje = new Date()
      
      const dias = []
      
      // Dias do mês anterior
      for (let i = primeiroDia.getDay(); i > 0; i--) {
        const data = new Date(anoAtual.value, mesAtual.value, 1 - i)
        dias.push({
          numero: data.getDate(),
          data: data,
          outroMes: true,
          hoje: false,
          eventos: []
        })
      }
      
      // Dias do mês atual
      for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
        const data = new Date(anoAtual.value, mesAtual.value, dia)
        const dataStr = data.toISOString().split('T')[0]
        const isHoje = data.toDateString() === hoje.toDateString()
        
        dias.push({
          numero: dia,
          data: data,
          outroMes: false,
          hoje: isHoje,
          eventos: calendarioEventos.value[dataStr] || []
        })
      }
      
      // Completar semana com dias do próximo mês
      const totalCelulas = Math.ceil(dias.length / 7) * 7
      for (let i = dias.length; i < totalCelulas; i++) {
        const data = new Date(anoAtual.value, mesAtual.value + 1, i - dias.length + 1)
        dias.push({
          numero: data.getDate(),
          data: data,
          outroMes: true,
          hoje: false,
          eventos: []
        })
      }
      
      return dias
    })
    
    // Métodos
    let searchTimeout = null
    const debounceSearch = () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        carregarPlanos()
      }, 500)
    }
    
    const carregarPlanos = async (page = 1) => {
      try {
        loading.value = true
        
        const params = {
          page,
          limit: paginacao.per_page,
          include_stats: 'true',
          ...filtros
        }
        
        // Remove campos vazios
        Object.keys(params).forEach(key => {
          if (params[key] === '' || params[key] === null) {
            delete params[key]
          }
        })
        
        const response = await api.get('/preventiva', { params })
        
        if (response.data.success) {
          planos.value = response.data.data.planos
          
          // Atualizar paginação
          Object.assign(paginacao, response.data.data.pagination)
          
          // Atualizar estatísticas se incluídas
          if (response.data.data.estatisticas) {
            estatisticas.value = response.data.data.estatisticas
          }
        }
      } catch (error) {
        console.error('Erro ao carregar planos:', error)
        showToast('Erro ao carregar planos preventivos', 'error')
      } finally {
        loading.value = false
      }
    }
    
    const carregarEstatisticas = async () => {
      try {
        const response = await api.get('/preventiva/stats')
        if (response.data.success) {
          estatisticas.value = response.data.data.estatisticas
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      }
    }
    
    const carregarCalendario = async () => {
      try {
        const response = await api.get('/preventiva/calendario', {
          params: {
            mes: mesAtual.value + 1,
            ano: anoAtual.value,
            ...filtros
          }
        })
        
        if (response.data.success) {
          calendarioEventos.value = response.data.data.calendario
        }
      } catch (error) {
        console.error('Erro ao carregar calendário:', error)
      }
    }
    
    const carregarPagina = (page) => {
      if (page >= 1 && page <= paginacao.total_pages) {
        carregarPlanos(page)
      }
    }
    
    const limparFiltros = () => {
      Object.keys(filtros).forEach(key => {
        filtros[key] = ''
      })
      carregarPlanos()
    }
    
    const navegarMes = (direcao) => {
      mesAtual.value += direcao
      if (mesAtual.value > 11) {
        mesAtual.value = 0
        anoAtual.value++
      } else if (mesAtual.value < 0) {
        mesAtual.value = 11
        anoAtual.value--
      }
      carregarCalendario()
    }
    
    const abrirFormulario = (plano = null) => {
      planoEdicao.value = plano
      mostrarFormulario.value = true
    }
    
    const fecharFormulario = () => {
      mostrarFormulario.value = false
      planoEdicao.value = null
    }
    
    const editarPlano = (plano) => {
      abrirFormulario(plano)
    }
    
    const verDetalhes = (plano) => {
      // TODO: Implementar modal de detalhes
      console.log('Ver detalhes:', plano)
    }
    
    const marcarExecucao = (plano) => {
      planoExecucao.value = plano
      execucaoData.data_execucao = new Date().toISOString().split('T')[0]
      execucaoData.observacoes_execucao = ''
      mostrarExecucao.value = true
    }
    
    const fecharExecucao = () => {
      mostrarExecucao.value = false
      planoExecucao.value = null
    }
    
    const confirmarExecucao = async () => {
      try {
        loading.value = true
        
        const response = await api.post(`/preventiva/${planoExecucao.value.id}/executar`, execucaoData)
        
        if (response.data.success) {
          showToast('Execução marcada com sucesso', 'success')
          fecharExecucao()
          carregarPlanos(paginacao.current_page)
          if (viewMode.value === 'calendario') {
            carregarCalendario()
          }
        }
      } catch (error) {
        console.error('Erro ao marcar execução:', error)
        showToast('Erro ao marcar execução', 'error')
      } finally {
        loading.value = false
      }
    }
    
    const excluirPlano = async (plano) => {
      if (confirm(`Tem certeza que deseja excluir o plano "${plano.nome}"?`)) {
        try {
          loading.value = true
          
          const response = await api.delete(`/preventiva/${plano.id}`)
          
          if (response.data.success) {
            showToast('Plano excluído com sucesso', 'success')
            carregarPlanos(paginacao.current_page)
          }
        } catch (error) {
          console.error('Erro ao excluir plano:', error)
          showToast('Erro ao excluir plano', 'error')
        } finally {
          loading.value = false
        }
      }
    }
    
    const salvarPlano = async () => {
      // TODO: Implementar salvamento
      console.log('Salvar plano')
    }
    
    const onPlanoSalvo = (plano) => {
      // Recarregar lista quando um plano for salvo
      carregarPlanos(paginacao.current_page)
      carregarEstatisticas()
      
      if (viewMode.value === 'calendario') {
        carregarCalendario()
      }
    }
    
    // Métodos de formatação
    const formatarData = (data) => {
      if (!data) return '-'
      return new Date(data).toLocaleDateString('pt-BR')
    }
    
    const formatarPeriodicidade = (plano) => {
      const tipos = {
        'diaria': 'Diária',
        'semanal': 'Semanal', 
        'mensal': 'Mensal',
        'anual': 'Anual',
        'horas_funcionamento': 'Por Horas',
        'contador_producao': 'Por Produção'
      }
      
      let texto = tipos[plano.tipo_periodicidade] || plano.tipo_periodicidade
      
      if (plano.intervalo_periodicidade > 1) {
        texto += ` (${plano.intervalo_periodicidade}x)`
      }
      
      return texto
    }
    
    const formatarStatus = (status) => {
      const tipos = {
        'vencido': 'Vencido',
        'alerta': 'Próximo Vencimento',
        'normal': 'Normal'
      }
      return tipos[status] || status
    }
    
    const formatarPrioridade = (prioridade) => {
      const tipos = {
        'baixa': 'Baixa',
        'media': 'Média',
        'alta': 'Alta',
        'critica': 'Crítica'
      }
      return tipos[prioridade] || prioridade
    }
    
    const formatarMesAno = (mes, ano) => {
      const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ]
      return `${meses[mes]} ${ano}`
    }
    
    // Classes CSS dinâmicas
    const getRowClass = (plano) => {
      return {
        'row-vencido': plano.status_vencimento === 'vencido',
        'row-alerta': plano.status_vencimento === 'alerta'
      }
    }
    
    const getBadgeClass = (status) => {
      return {
        'badge-danger': status === 'vencido',
        'badge-warning': status === 'alerta', 
        'badge-success': status === 'normal'
      }
    }
    
    const getPrioridadeClass = (prioridade) => {
      return {
        'badge-secondary': prioridade === 'baixa',
        'badge-info': prioridade === 'media',
        'badge-warning': prioridade === 'alta',
        'badge-danger': prioridade === 'critica'
      }
    }
    
    // Lifecycle
    onMounted(() => {
      carregarPlanos()
      carregarEstatisticas()
    })
    
    // Watch para mudança de modo de visualização
    const watchViewMode = () => {
      if (viewMode.value === 'calendario') {
        carregarCalendario()
      }
    }
    
    return {
      // Estado
      loading,
      planos,
      estatisticas,
      viewMode,
      mostrarFormulario,
      mostrarExecucao,
      planoEdicao,
      planoExecucao,
      mesAtual,
      anoAtual,
      paginacao,
      filtros,
      execucaoData,
      
      // Computed
      diasSemana,
      diasCalendario,
      
      // Métodos
      debounceSearch,
      carregarPlanos,
      carregarPagina,
      limparFiltros,
      navegarMes,
      abrirFormulario,
      fecharFormulario,
      editarPlano,
      verDetalhes,
      marcarExecucao,
      fecharExecucao,
      confirmarExecucao,
      excluirPlano,
      salvarPlano,
      onPlanoSalvo,
      formatarData,
      formatarPeriodicidade,
      formatarStatus,
      formatarPrioridade,
      formatarMesAno,
      getRowClass,
      getBadgeClass,
      getPrioridadeClass,
      
      // Watch
      watchViewMode
    }
  }
}
</script>

<style scoped>
.preventiva-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  color: #333;
}

/* Estatísticas */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.stat-icon.danger { background: #dc3545; }
.stat-icon.warning { background: #ffc107; }
.stat-icon.success { background: #28a745; }
.stat-icon.info { background: #17a2b8; }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

/* Filtros */
.filters-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.filters-row {
  display: flex;
  gap: 15px;
  align-items: end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 150px;
}

.filter-group label {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.filter-group input,
.filter-group select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

/* Toggle de visualização */
.view-toggle {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

/* Tabela */
.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 1px solid #ddd;
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.data-table tbody tr:hover {
  background-color: #f8f9fa;
}

.row-vencido {
  background-color: #ffe6e6 !important;
}

.row-alerta {
  background-color: #fff3cd !important;
}

.actions {
  display: flex;
  gap: 5px;
}

.btn-icon {
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

/* Badges */
.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-success { background: #d4edda; color: #155724; }
.badge-warning { background: #fff3cd; color: #856404; }
.badge-danger { background: #f8d7da; color: #721c24; }
.badge-info { background: #d1ecf1; color: #0c5460; }
.badge-secondary { background: #e2e3e5; color: #383d41; }

/* Paginação */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 20px;
  background: #f8f9fa;
}

.pagination-info {
  font-size: 14px;
  color: #666;
}

/* Calendário */
.calendario-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.calendario-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.calendario-header h3 {
  margin: 0;
  color: #333;
}

.calendario-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.dia-header {
  background: #007bff;
  color: white;
  padding: 10px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
}

.dia-celula {
  background: white;
  min-height: 100px;
  padding: 8px;
  position: relative;
}

.dia-celula.outro-mes {
  background: #f8f9fa;
  color: #999;
}

.dia-celula.hoje {
  background: #e3f2fd;
}

.dia-celula.com-eventos {
  background: #fff3e0;
}

.dia-numero {
  font-weight: 600;
  margin-bottom: 4px;
}

.eventos {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.evento {
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 10px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mais-eventos {
  font-size: 10px;
  color: #666;
  font-style: italic;
}

/* Modal */
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
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ddd;
}

.modal-header h3 {
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  justify-content: end;
  gap: 10px;
  margin-top: 20px;
}

/* Loading */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px;
  color: #666;
}

/* Botões */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn:hover {
  opacity: 0.9;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>