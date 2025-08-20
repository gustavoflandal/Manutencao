<template>
  <div class="reports-page">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        Relatórios do Sistema
      </h1>
      <p class="text-gray-600">
        Gere relatórios detalhados e análises para acompanhar a performance do sistema
      </p>
    </div>

    <!-- Filtros Globais -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">
        Filtros Gerais
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <!-- Período -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Período
          </label>
          <select 
            v-model="globalFilters.dateRange" 
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            @change="updateDateRange"
          >
            <option 
              v-for="range in availableFilters.dateRanges" 
              :key="range.value" 
              :value="range.value"
            >
              {{ range.label }}
            </option>
          </select>
        </div>

        <!-- Data Início (quando personalizado) -->
        <div v-if="globalFilters.dateRange === 'custom'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Data Início
          </label>
          <input 
            v-model="globalFilters.startDate" 
            type="date" 
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <!-- Data Fim (quando personalizado) -->
        <div v-if="globalFilters.dateRange === 'custom'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Data Fim
          </label>
          <input 
            v-model="globalFilters.endDate" 
            type="date" 
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select 
            v-model="globalFilters.status" 
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option 
              v-for="status in availableFilters.status" 
              :key="status.value" 
              :value="status.value"
            >
              {{ status.label }}
            </option>
          </select>
        </div>

        <!-- Prioridade -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Prioridade
          </label>
          <select 
            v-model="globalFilters.prioridade" 
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option 
              v-for="prioridade in availableFilters.prioridades" 
              :key="prioridade.value" 
              :value="prioridade.value"
            >
              {{ prioridade.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Grid de Relatórios -->
    <div class="space-y-8">
      <div 
        v-for="(reports, category) in reportsByCategory" 
        :key="category"
        class="reports-category"
      >
        <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Icon :name="getCategoryIcon(category)" class="w-6 h-6 mr-3" />
          {{ category }}
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div 
            v-for="report in reports" 
            :key="report.id"
            class="report-card bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            @click="selectReport(report)"
          >
            <div class="p-6">
              <!-- Header do Card -->
              <div class="flex items-start justify-between mb-4">
                <div 
                  :class="`w-12 h-12 bg-${report.color}-100 rounded-lg flex items-center justify-center`"
                >
                  <Icon 
                    :name="report.icon" 
                    :class="`w-6 h-6 text-${report.color}-600`" 
                  />
                </div>
                
                <div class="flex space-x-2">
                  <button
                    @click.stop="generateReport(report.id, 'json')"
                    :disabled="loading"
                    class="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Visualizar"
                  >
                    <Icon name="eye" class="w-4 h-4" />
                  </button>
                  
                  <button
                    @click.stop="generateReport(report.id, 'excel')"
                    :disabled="loading"
                    class="p-2 text-gray-400 hover:text-green-600 transition-colors"
                    title="Excel"
                  >
                    <Icon name="file-spreadsheet" class="w-4 h-4" />
                  </button>
                  
                  <button
                    @click.stop="generateReport(report.id, 'pdf')"
                    :disabled="loading"
                    class="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="PDF"
                  >
                    <Icon name="file-text" class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Título e Descrição -->
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                {{ report.title }}
              </h3>
              
              <p class="text-sm text-gray-600 mb-4">
                {{ report.description }}
              </p>

              <!-- Badges -->
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="permission in report.permissions" 
                  :key="permission"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {{ getPermissionLabel(permission) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Relatório -->
    <div 
      v-if="selectedReport && data" 
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="closeModal"
    >
      <div 
        class="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white"
        @click.stop
      >
        <!-- Header do Modal -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-2xl font-bold text-gray-900">
            {{ selectedReport.title }}
          </h3>
          
          <div class="flex items-center space-x-4">
            <!-- Botões de Export -->
            <div class="flex space-x-2">
              <button
                @click="generateReport(selectedReport.id, 'excel')"
                :disabled="loading"
                class="flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <Icon name="file-spreadsheet" class="w-4 h-4 mr-2" />
                Excel
              </button>
              
              <button
                @click="generateReport(selectedReport.id, 'pdf')"
                :disabled="loading"
                class="flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                <Icon name="file-text" class="w-4 h-4 mr-2" />
                PDF
              </button>
            </div>
            
            <!-- Botão Fechar -->
            <button
              @click="closeModal"
              class="text-gray-400 hover:text-gray-600"
            >
              <Icon name="x" class="w-6 h-6" />
            </button>
          </div>
        </div>

        <!-- Conteúdo do Relatório -->
        <div class="report-content max-h-[70vh] overflow-y-auto">
          <ReportViewer 
            :report-data="data" 
            :report-type="selectedReport.id"
          />
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div 
      v-if="loading" 
      class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 flex items-center space-x-4">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="text-lg font-medium text-gray-900">Gerando relatório...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReports } from '@/composables/useReports'
import { useAuthStore } from '@/stores/auth'
import Icon from '@/components/Icon.vue'
import ReportViewer from '@/components/reports/ReportViewer.vue'

// Composables
const { 
  loading, 
  data, 
  availableFilters,
  generateReport: generateReportAction,
  getAvailableReportsForUser,
  getReportsByCategory,
  clearData,
  formatDate
} = useReports()

const authStore = useAuthStore()
const user = computed(() => authStore.user)

// Estado local
const selectedReport = ref(null)
const globalFilters = ref({
  dateRange: '30days',
  startDate: '',
  endDate: '',
  status: '',
  prioridade: ''
})

// Computed
const userReports = computed(() => 
  getAvailableReportsForUser(user.value?.permissions || [])
)

const reportsByCategory = computed(() => 
  getReportsByCategory(userReports.value)
)

// Métodos
function updateDateRange() {
  if (globalFilters.value.dateRange !== 'custom') {
    globalFilters.value.startDate = ''
    globalFilters.value.endDate = ''
  }
}

function selectReport(report) {
  selectedReport.value = report
  generateReport(report.id, 'json')
}

async function generateReport(reportId, formato) {
  const filters = {
    ...globalFilters.value,
    formato
  }
  
  // Remover campos vazios
  Object.keys(filters).forEach(key => {
    if (filters[key] === '' || filters[key] === null) {
      delete filters[key]
    }
  })
  
  try {
    await generateReportAction(reportId, filters)
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
  }
}

function closeModal() {
  selectedReport.value = null
  clearData()
}

function getCategoryIcon(category) {
  const icons = {
    'Gerencial': 'briefcase',
    'Operacional': 'activity',
    'Analítico': 'bar-chart',
    'Recursos Humanos': 'users',
    'Estoque': 'package',
    'Patrimônio': 'server',
    'Financeiro': 'dollar-sign',
    'Qualidade': 'heart'
  }
  return icons[category] || 'folder'
}

function getPermissionLabel(permission) {
  const labels = {
    'admin': 'Admin',
    'gestor': 'Gestor',
    'funcionario': 'Funcionário'
  }
  return labels[permission] || permission
}

// Lifecycle
onMounted(() => {
  updateDateRange()
})
</script>

<style scoped>
.report-card {
  border: 1px solid #e5e7eb;
}

.report-card:hover {
  border-color: #d1d5db;
  transform: scale(1.02);
  transition: all 0.2s ease;
}

.reports-category:not(:last-child) {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 2rem;
}

.report-content {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.report-content::-webkit-scrollbar {
  width: 6px;
}

.report-content::-webkit-scrollbar-track {
  background: #f7fafc;
}

.report-content::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}
</style>