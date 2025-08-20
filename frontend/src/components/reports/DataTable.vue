<template>
  <div class="data-table">
    <!-- Cabeçalho da Tabela (se houver dados) -->
    <div v-if="tableData.length > 0" class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <!-- Cabeçalho -->
        <thead class="bg-gray-50">
          <tr>
            <th 
              v-for="column in columns" 
              :key="column.key"
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              @click="sortBy(column.key)"
            >
              <div class="flex items-center space-x-1">
                <span>{{ column.label }}</span>
                <Icon 
                  v-if="sortColumn === column.key"
                  :name="sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'"
                  class="w-4 h-4"
                />
                <Icon 
                  v-else
                  name="chevrons-up-down"
                  class="w-4 h-4 opacity-0 group-hover:opacity-100"
                />
              </div>
            </th>
          </tr>
        </thead>

        <!-- Corpo da Tabela -->
        <tbody class="bg-white divide-y divide-gray-200">
          <tr 
            v-for="(row, index) in paginatedData" 
            :key="index"
            class="hover:bg-gray-50"
          >
            <td 
              v-for="column in columns" 
              :key="column.key"
              class="px-6 py-4 whitespace-nowrap"
            >
              <!-- Formatação especial por tipo -->
              <div v-if="column.type === 'status'" class="flex items-center">
                <span 
                  :class="getStatusClass(getCellValue(row, column.key))"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ formatCellValue(getCellValue(row, column.key), column) }}
                </span>
              </div>

              <div v-else-if="column.type === 'priority'" class="flex items-center">
                <Icon 
                  :name="getPriorityIcon(getCellValue(row, column.key))"
                  :class="getPriorityClass(getCellValue(row, column.key))"
                  class="w-4 h-4 mr-2"
                />
                <span>{{ formatCellValue(getCellValue(row, column.key), column) }}</span>
              </div>

              <div v-else-if="column.type === 'user'" class="flex items-center">
                <div class="flex-shrink-0 h-8 w-8">
                  <div class="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <Icon name="user" class="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-900">
                    {{ formatCellValue(getCellValue(row, column.key), column) }}
                  </p>
                </div>
              </div>

              <div v-else-if="column.type === 'currency'" class="text-right">
                <span class="text-sm font-medium text-gray-900">
                  {{ formatCellValue(getCellValue(row, column.key), column) }}
                </span>
              </div>

              <div v-else-if="column.type === 'percentage'" class="text-center">
                <div class="flex items-center">
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      :style="`width: ${Math.min(getCellValue(row, column.key), 100)}%`"
                      :class="getPercentageClass(getCellValue(row, column.key))"
                      class="h-2 rounded-full"
                    ></div>
                  </div>
                  <span class="ml-2 text-sm text-gray-900">
                    {{ formatCellValue(getCellValue(row, column.key), column) }}
                  </span>
                </div>
              </div>

              <div v-else-if="column.type === 'date'" class="text-sm text-gray-900">
                {{ formatCellValue(getCellValue(row, column.key), column) }}
              </div>

              <div v-else-if="column.type === 'badge'" class="flex flex-wrap gap-1">
                <span 
                  v-for="badge in getCellValue(row, column.key)" 
                  :key="badge"
                  class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {{ badge }}
                </span>
              </div>

              <div v-else class="text-sm text-gray-900">
                {{ formatCellValue(getCellValue(row, column.key), column) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Estado vazio -->
    <div v-else class="text-center py-12">
      <Icon name="database" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">Nenhum dado encontrado</h3>
      <p class="text-gray-500">Não há dados para exibir com os filtros aplicados.</p>
    </div>

    <!-- Paginação -->
    <div v-if="totalPages > 1" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <div class="flex-1 flex justify-between sm:hidden">
        <button
          @click="previousPage"
          :disabled="currentPage === 1"
          class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <button
          @click="nextPage"
          :disabled="currentPage === totalPages"
          class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Próximo
        </button>
      </div>
      
      <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700">
            Mostrando
            <span class="font-medium">{{ startIndex + 1 }}</span>
            até
            <span class="font-medium">{{ Math.min(endIndex, sortedData.length) }}</span>
            de
            <span class="font-medium">{{ sortedData.length }}</span>
            resultados
          </p>
        </div>
        
        <div>
          <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginação">
            <button
              @click="previousPage"
              :disabled="currentPage === 1"
              class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="chevron-left" class="w-5 h-5" />
            </button>
            
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="goToPage(page)"
              :class="[
                'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                page === currentPage
                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
              ]"
            >
              {{ page }}
            </button>
            
            <button
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="chevron-right" class="w-5 h-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Icon from '@/components/Icon.vue'

// Props
const props = defineProps({
  data: {
    type: [Array, Object],
    required: true
  },
  pageSize: {
    type: Number,
    default: 10
  }
})

// Estado local
const currentPage = ref(1)
const sortColumn = ref('')
const sortDirection = ref('asc')

// Computed
const tableData = computed(() => {
  if (Array.isArray(props.data)) {
    return props.data
  }
  if (props.data.dados && Array.isArray(props.data.dados)) {
    return props.data.dados
  }
  if (props.data.items && Array.isArray(props.data.items)) {
    return props.data.items
  }
  return []
})

const columns = computed(() => {
  if (tableData.value.length === 0) return []
  
  // Se há configuração de colunas no objeto data
  if (props.data.colunas) {
    return props.data.colunas
  }
  
  // Gerar colunas automaticamente baseado no primeiro item
  const firstItem = tableData.value[0]
  return Object.keys(firstItem).map(key => ({
    key,
    label: formatColumnLabel(key),
    type: inferColumnType(key, firstItem[key])
  }))
})

const sortedData = computed(() => {
  if (!sortColumn.value) return tableData.value
  
  return [...tableData.value].sort((a, b) => {
    const aVal = getCellValue(a, sortColumn.value)
    const bVal = getCellValue(b, sortColumn.value)
    
    let comparison = 0
    if (aVal > bVal) comparison = 1
    if (aVal < bVal) comparison = -1
    
    return sortDirection.value === 'asc' ? comparison : -comparison
  })
})

const totalPages = computed(() => 
  Math.ceil(sortedData.value.length / props.pageSize)
)

const startIndex = computed(() => 
  (currentPage.value - 1) * props.pageSize
)

const endIndex = computed(() => 
  startIndex.value + props.pageSize
)

const paginatedData = computed(() => 
  sortedData.value.slice(startIndex.value, endIndex.value)
)

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, start + 4)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Métodos
function getCellValue(row, key) {
  return key.split('.').reduce((obj, k) => obj?.[k], row)
}

function formatColumnLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ')
}

function inferColumnType(key, value) {
  const lowerKey = key.toLowerCase()
  
  if (lowerKey.includes('status')) return 'status'
  if (lowerKey.includes('prioridade') || lowerKey.includes('priority')) return 'priority'
  if (lowerKey.includes('user') || lowerKey.includes('usuario')) return 'user'
  if (lowerKey.includes('data') || lowerKey.includes('date')) return 'date'
  if (lowerKey.includes('valor') || lowerKey.includes('preco') || lowerKey.includes('price')) return 'currency'
  if (lowerKey.includes('percent') || lowerKey.includes('taxa')) return 'percentage'
  if (Array.isArray(value)) return 'badge'
  
  return 'text'
}

function formatCellValue(value, column) {
  if (value == null) return '-'
  
  switch (column.type) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    
    case 'percentage':
      return `${value.toFixed(1)}%`
    
    case 'date':
      return new Date(value).toLocaleDateString('pt-BR')
    
    case 'status':
      return getStatusLabel(value)
    
    case 'priority':
      return getPriorityLabel(value)
    
    default:
      return value
  }
}

function getStatusLabel(status) {
  const labels = {
    'pending': 'Pendente',
    'in_progress': 'Em Andamento',
    'completed': 'Concluído',
    'cancelled': 'Cancelado',
    'active': 'Ativo',
    'inactive': 'Inativo'
  }
  return labels[status] || status
}

function getStatusClass(status) {
  const classes = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'in_progress': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800',
    'active': 'bg-green-100 text-green-800',
    'inactive': 'bg-gray-100 text-gray-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

function getPriorityLabel(priority) {
  const labels = {
    'low': 'Baixa',
    'medium': 'Média',
    'high': 'Alta',
    'urgent': 'Urgente'
  }
  return labels[priority] || priority
}

function getPriorityIcon(priority) {
  const icons = {
    'low': 'arrow-down',
    'medium': 'minus',
    'high': 'arrow-up',
    'urgent': 'alert-triangle'
  }
  return icons[priority] || 'minus'
}

function getPriorityClass(priority) {
  const classes = {
    'low': 'text-green-600',
    'medium': 'text-yellow-600',
    'high': 'text-orange-600',
    'urgent': 'text-red-600'
  }
  return classes[priority] || 'text-gray-600'
}

function getPercentageClass(percentage) {
  if (percentage >= 80) return 'bg-green-500'
  if (percentage >= 60) return 'bg-yellow-500'
  if (percentage >= 40) return 'bg-orange-500'
  return 'bg-red-500'
}

function sortBy(column) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

function goToPage(page) {
  currentPage.value = page
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// Lifecycle
onMounted(() => {
  // Reset da página quando dados mudam
  currentPage.value = 1
})
</script>

<style scoped>
.data-table {
  overflow-x: auto;
}

table {
  min-width: 600px;
}

@media (max-width: 768px) {
  table {
    font-size: 0.875rem;
  }
  
  .px-6 {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .py-4 {
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
  }
}
</style>