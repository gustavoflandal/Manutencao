import { ref, computed, reactive, readonly } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

/**
 * Composable para gerenciamento de relatórios
 * Fornece funcionalidades para geração, visualização e exportação
 */
export function useReports() {
  const { showToast } = useToast()

  // Estado reativo
  const loading = ref(false)
  const data = ref(null)
  const error = ref(null)

  // Filtros disponíveis
  const availableFilters = reactive({
    dateRanges: [
      { label: 'Últimos 7 dias', value: '7days' },
      { label: 'Últimos 30 dias', value: '30days' },
      { label: 'Últimos 90 dias', value: '90days' },
      { label: 'Este mês', value: 'thisMonth' },
      { label: 'Mês anterior', value: 'lastMonth' },
      { label: 'Este ano', value: 'thisYear' },
      { label: 'Personalizado', value: 'custom' }
    ],
    formats: [
      { label: 'Visualizar', value: 'json', icon: 'eye' },
      { label: 'Excel', value: 'excel', icon: 'file-spreadsheet' },
      { label: 'PDF', value: 'pdf', icon: 'file-text' }
    ],
    status: [
      { label: 'Todas', value: '' },
      { label: 'Abertas', value: 'aberta' },
      { label: 'Em Andamento', value: 'em_andamento' },
      { label: 'Concluídas', value: 'concluida' },
      { label: 'Canceladas', value: 'cancelada' }
    ],
    prioridades: [
      { label: 'Todas', value: '' },
      { label: 'Crítica', value: 'critica' },
      { label: 'Alta', value: 'alta' },
      { label: 'Normal', value: 'normal' },
      { label: 'Baixa', value: 'baixa' }
    ]
  })

  // Relatórios disponíveis
  const availableReports = computed(() => [
    {
      id: 'dashboard-executivo',
      title: 'Dashboard Executivo',
      description: 'Visão geral do sistema com métricas principais',
      category: 'Gerencial',
      permissions: ['admin', 'gestor'],
      icon: 'dashboard',
      color: 'blue'
    },
    {
      id: 'solicitacoes',
      title: 'Relatório de Solicitações',
      description: 'Listagem detalhada de solicitações com filtros',
      category: 'Operacional',
      permissions: ['admin', 'gestor', 'funcionario'],
      icon: 'clipboard-list',
      color: 'green'
    },
    {
      id: 'performance-departamentos',
      title: 'Performance por Departamento',
      description: 'Análise de eficiência por departamento',
      category: 'Gerencial',
      permissions: ['admin', 'gestor'],
      icon: 'building',
      color: 'purple'
    },
    {
      id: 'analise-sla',
      title: 'Análise de SLA',
      description: 'Cumprimento de SLA por prioridade',
      category: 'Operacional',
      permissions: ['admin', 'gestor'],
      icon: 'clock',
      color: 'orange'
    },
    {
      id: 'tendencias',
      title: 'Tendências e Evolução',
      description: 'Análise de tendências ao longo do tempo',
      category: 'Analítico',
      permissions: ['admin', 'gestor'],
      icon: 'trending-up',
      color: 'teal'
    },
    {
      id: 'produtividade-usuarios',
      title: 'Produtividade de Usuários',
      description: 'Performance individual dos usuários',
      category: 'Recursos Humanos',
      permissions: ['admin', 'gestor'],
      icon: 'users',
      color: 'indigo'
    },
    {
      id: 'movimentacao-estoque',
      title: 'Movimentação de Estoque',
      description: 'Entradas e saídas de itens do estoque',
      category: 'Estoque',
      permissions: ['admin', 'gestor', 'funcionario'],
      icon: 'package',
      color: 'amber'
    },
    {
      id: 'inventario',
      title: 'Inventário Atual',
      description: 'Situação atual do estoque',
      category: 'Estoque',
      permissions: ['admin', 'gestor', 'funcionario'],
      icon: 'archive',
      color: 'cyan'
    },
    {
      id: 'ativos',
      title: 'Controle de Ativos',
      description: 'Listagem e controle de ativos',
      category: 'Patrimônio',
      permissions: ['admin', 'gestor'],
      icon: 'server',
      color: 'slate'
    },
    {
      id: 'estoque-baixo',
      title: 'Itens com Estoque Baixo',
      description: 'Itens que precisam de reposição',
      category: 'Estoque',
      permissions: ['admin', 'gestor', 'funcionario'],
      icon: 'alert-triangle',
      color: 'red'
    },
    {
      id: 'ativos-depreciacao',
      title: 'Ativos Próximos da Depreciação',
      description: 'Ativos que precisam ser renovados',
      category: 'Patrimônio',
      permissions: ['admin', 'gestor'],
      icon: 'calendar-x',
      color: 'rose'
    },
    {
      id: 'dashboard-kpis',
      title: 'Dashboard de KPIs',
      description: 'Indicadores chave de performance',
      category: 'Analítico',
      permissions: ['admin', 'gestor'],
      icon: 'bar-chart',
      color: 'emerald'
    },
    {
      id: 'performance-operacional',
      title: 'Performance Operacional',
      description: 'Análise detalhada da operação',
      category: 'Analítico',
      permissions: ['admin', 'gestor'],
      icon: 'activity',
      color: 'violet'
    },
    {
      id: 'custos-operacionais',
      title: 'Custos Operacionais',
      description: 'Análise de custos e ROI',
      category: 'Financeiro',
      permissions: ['admin', 'gestor'],
      icon: 'dollar-sign',
      color: 'lime'
    },
    {
      id: 'satisfacao',
      title: 'Análise de Satisfação',
      description: 'Índices de satisfação simulados',
      category: 'Qualidade',
      permissions: ['admin', 'gestor'],
      icon: 'heart',
      color: 'pink'
    }
  ])

  /**
   * Calcula range de datas baseado no tipo selecionado
   */
  function getDateRange(rangeType) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (rangeType) {
      case '7days':
        return {
          startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: now.toISOString()
        }
      
      case '30days':
        return {
          startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: now.toISOString()
        }
      
      case '90days':
        return {
          startDate: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: now.toISOString()
        }
      
      case 'thisMonth':
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
          endDate: now.toISOString()
        }
      
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        return {
          startDate: lastMonth.toISOString(),
          endDate: lastMonthEnd.toISOString()
        }
      
      case 'thisYear':
        return {
          startDate: new Date(now.getFullYear(), 0, 1).toISOString(),
          endDate: now.toISOString()
        }
      
      default:
        return {
          startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: now.toISOString()
        }
    }
  }

  /**
   * Gera relatório
   */
  async function generateReport(reportId, filters = {}) {
    loading.value = true
    error.value = null
    
    try {
      // Processar filtros de data
      if (filters.dateRange && filters.dateRange !== 'custom') {
        const { startDate, endDate } = getDateRange(filters.dateRange)
        filters.startDate = startDate
        filters.endDate = endDate
        delete filters.dateRange
      }

      // Se formato não é JSON, fazer download direto
      if (filters.formato && filters.formato !== 'json') {
        await downloadReport(reportId, filters)
        return null
      }

      const response = await api.get(`/reports/${reportId}`, { params: filters })
      
      data.value = response.data.data
      
      showToast({
        type: 'success',
        title: 'Relatório gerado',
        message: 'Relatório gerado com sucesso!'
      })
      
      return response.data.data
      
    } catch (err) {
      error.value = err.message
      showToast({
        type: 'error',
        title: 'Erro ao gerar relatório',
        message: err.message
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Download de relatório em formato Excel/PDF
   */
  async function downloadReport(reportId, filters = {}) {
    try {
      const response = await api.get(`/reports/${reportId}`, {
        params: filters,
        responseType: 'blob'
      })

      // Criar blob e fazer download
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      
      link.href = url
      
      // Extrair nome do arquivo do header Content-Disposition
      const contentDisposition = response.headers['content-disposition']
      let fileName = `relatorio_${reportId}_${Date.now()}.${filters.formato || 'xlsx'}`
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/)
        if (fileNameMatch) {
          fileName = fileNameMatch[1]
        }
      }
      
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      showToast({
        type: 'success',
        title: 'Download iniciado',
        message: `Download do arquivo ${fileName} iniciado`
      })
      
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro no download',
        message: 'Erro ao fazer download do relatório'
      })
      throw err
    }
  }

  /**
   * Gera relatório comparativo
   */
  async function generateComparativeReport(filters) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get('/reports/comparativo-periodos', { params: filters })
      
      data.value = response.data.data
      
      showToast({
        type: 'success',
        title: 'Relatório comparativo gerado',
        message: 'Relatório comparativo gerado com sucesso!'
      })
      
      return response.data.data
      
    } catch (err) {
      error.value = err.message
      showToast({
        type: 'error',
        title: 'Erro ao gerar relatório comparativo',
        message: err.message
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Formata valor para moeda
   */
  function formatCurrency(value) {
    if (value == null) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  /**
   * Formata número
   */
  function formatNumber(value) {
    if (value == null) return '0'
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  /**
   * Formata percentual
   */
  function formatPercentage(value) {
    if (value == null) return '0%'
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 2
    }).format(value / 100)
  }

  /**
   * Formata data
   */
  function formatDate(value) {
    if (!value) return '-'
    return new Date(value).toLocaleDateString('pt-BR')
  }

  /**
   * Formata data e hora
   */
  function formatDateTime(value) {
    if (!value) return '-'
    return new Date(value).toLocaleString('pt-BR')
  }

  /**
   * Obtém cor baseada no valor
   */
  function getVariationColor(value) {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  /**
   * Obtém ícone baseado no valor
   */
  function getVariationIcon(value) {
    if (value > 0) return 'trending-up'
    if (value < 0) return 'trending-down'
    return 'minus'
  }

  /**
   * Limpa dados do relatório
   */
  function clearData() {
    data.value = null
    error.value = null
  }

  /**
   * Filtra relatórios por permissão do usuário
   */
  function getAvailableReportsForUser(userPermissions) {
    return availableReports.value.filter(report => 
      report.permissions.some(permission => 
        userPermissions.includes(permission)
      )
    )
  }

  /**
   * Agrupa relatórios por categoria
   */
  function getReportsByCategory(reports = availableReports.value) {
    const grouped = {}
    
    reports.forEach(report => {
      if (!grouped[report.category]) {
        grouped[report.category] = []
      }
      grouped[report.category].push(report)
    })
    
    return grouped
  }

  return {
    // Estado
    loading: readonly(loading),
    data: readonly(data),
    error: readonly(error),
    
    // Dados estáticos
    availableFilters,
    availableReports,
    
    // Métodos
    generateReport,
    downloadReport,
    generateComparativeReport,
    getDateRange,
    clearData,
    getAvailableReportsForUser,
    getReportsByCategory,
    
    // Formatadores
    formatCurrency,
    formatNumber,
    formatPercentage,
    formatDate,
    formatDateTime,
    getVariationColor,
    getVariationIcon
  }
}