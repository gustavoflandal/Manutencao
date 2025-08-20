<template>
  <div class="report-viewer">
    <!-- Dashboard Executivo -->
    <div v-if="reportType === 'dashboard-executivo'" class="dashboard-executivo">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- KPIs -->
        <div 
          v-for="(kpi, index) in reportData.kpis" 
          :key="index"
          class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Icon :name="kpi.icon" class="w-8 h-8 text-blue-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">{{ kpi.label }}</p>
              <p class="text-2xl font-bold text-gray-900">{{ formatValue(kpi.value, kpi.type) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráficos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div 
          v-for="(chart, index) in reportData.charts" 
          :key="index"
          class="bg-white rounded-lg shadow p-6"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ chart.title }}</h3>
          <ChartComponent :data="chart" />
        </div>
      </div>

      <!-- Tabelas de Resumo -->
      <div v-if="reportData.tables" class="space-y-8">
        <div 
          v-for="(table, index) in reportData.tables" 
          :key="index"
          class="bg-white rounded-lg shadow"
        >
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">{{ table.title }}</h3>
          </div>
          <DataTable :data="table" />
        </div>
      </div>
    </div>

    <!-- Relatório de Solicitações -->
    <div v-else-if="reportType === 'relatorio-solicitacoes'" class="relatorio-solicitacoes">
      <!-- Resumo -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Resumo do Período</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div 
            v-for="(item, key) in reportData.resumo" 
            :key="key"
            class="text-center"
          >
            <p class="text-2xl font-bold text-gray-900">{{ item.valor }}</p>
            <p class="text-sm text-gray-600">{{ item.label }}</p>
          </div>
        </div>
      </div>

      <!-- Filtros Aplicados -->
      <div v-if="reportData.filtros" class="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 class="font-medium text-gray-900 mb-2">Filtros Aplicados:</h4>
        <div class="flex flex-wrap gap-2">
          <span 
            v-for="(filtro, key) in reportData.filtros" 
            :key="key"
            class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
          >
            {{ key }}: {{ filtro }}
          </span>
        </div>
      </div>

      <!-- Dados Detalhados -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Solicitações Detalhadas</h3>
        </div>
        <DataTable :data="reportData.dados" />
      </div>
    </div>

    <!-- Relatório de Inventário -->
    <div v-else-if="reportType === 'relatorio-inventario'" class="relatorio-inventario">
      <!-- Status do Inventário -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div 
          v-for="(status, index) in reportData.statusInventario" 
          :key="index"
          class="bg-white rounded-lg shadow p-6"
        >
          <div class="flex items-center">
            <div :class="`w-12 h-12 bg-${status.color}-100 rounded-lg flex items-center justify-center`">
              <Icon :name="status.icon" :class="`w-6 h-6 text-${status.color}-600`" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">{{ status.label }}</p>
              <p class="text-2xl font-bold text-gray-900">{{ status.quantidade }}</p>
              <p class="text-sm text-gray-500">{{ formatCurrency(status.valor) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Itens Críticos -->
      <div v-if="reportData.itensCriticos?.length" class="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
        <h3 class="text-lg font-semibold text-red-900 mb-4 flex items-center">
          <Icon name="alert-triangle" class="w-5 h-5 mr-2" />
          Itens Críticos - Estoque Baixo
        </h3>
        <div class="space-y-2">
          <div 
            v-for="item in reportData.itensCriticos" 
            :key="item.id"
            class="flex justify-between items-center py-2 border-b border-red-200 last:border-b-0"
          >
            <span class="font-medium text-red-900">{{ item.nome }}</span>
            <span class="text-sm text-red-600">{{ item.quantidade }} unidades</span>
          </div>
        </div>
      </div>

      <!-- Tabela Principal -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Inventário Completo</h3>
        </div>
        <DataTable :data="reportData.dados" />
      </div>
    </div>

    <!-- Relatório de Performance -->
    <div v-else-if="reportType === 'relatorio-performance-operacional'" class="relatorio-performance">
      <!-- Métricas de Performance -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div 
          v-for="(metrica, index) in reportData.metricas" 
          :key="index"
          class="bg-white rounded-lg shadow p-6"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">{{ metrica.nome }}</p>
              <p class="text-2xl font-bold text-gray-900">{{ formatValue(metrica.valor, metrica.tipo) }}</p>
              <p :class="`text-sm ${metrica.tendencia >= 0 ? 'text-green-600' : 'text-red-600'}`">
                {{ metrica.tendencia >= 0 ? '+' : '' }}{{ metrica.tendencia }}%
              </p>
            </div>
            <Icon :name="metrica.icon" :class="`w-8 h-8 ${getMetricColor(metrica.status)}`" />
          </div>
        </div>
      </div>

      <!-- Gráfico de Tendências -->
      <div v-if="reportData.graficos" class="bg-white rounded-lg shadow p-6 mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Tendências de Performance</h3>
        <ChartComponent :data="reportData.graficos" />
      </div>

      <!-- Ranking de Departamentos -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Performance por Departamento</h3>
        </div>
        <DataTable :data="reportData.ranking" />
      </div>
    </div>

    <!-- Outros tipos de relatório (genérico) -->
    <div v-else class="relatorio-generico">
      <!-- Resumo (se disponível) -->
      <div v-if="reportData.resumo" class="bg-white rounded-lg shadow p-6 mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Resumo</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            v-for="(item, key) in reportData.resumo" 
            :key="key"
            class="text-center p-4 bg-gray-50 rounded-lg"
          >
            <p class="text-2xl font-bold text-gray-900">{{ formatValue(item.valor, item.tipo) }}</p>
            <p class="text-sm text-gray-600">{{ item.label || key }}</p>
          </div>
        </div>
      </div>

      <!-- Gráficos (se disponível) -->
      <div v-if="reportData.graficos" class="bg-white rounded-lg shadow p-6 mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Análise Gráfica</h3>
        <ChartComponent :data="reportData.graficos" />
      </div>

      <!-- Dados Principais -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Dados Detalhados</h3>
        </div>
        <DataTable :data="reportData.dados || reportData" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Icon from '@/components/Icon.vue'
import DataTable from '@/components/reports/DataTable.vue'
import ChartComponent from '@/components/reports/ChartComponent.vue'

// Props
const props = defineProps({
  reportData: {
    type: Object,
    required: true
  },
  reportType: {
    type: String,
    required: true
  }
})

// Métodos de formatação
function formatValue(value, type) {
  if (typeof value !== 'number') return value

  switch (type) {
    case 'currency':
      return formatCurrency(value)
    case 'percentage':
      return `${value.toFixed(1)}%`
    case 'decimal':
      return value.toFixed(2)
    case 'time':
      return `${value}h`
    default:
      return value.toLocaleString('pt-BR')
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

function getMetricColor(status) {
  const colors = {
    'excellent': 'text-green-600',
    'good': 'text-blue-600',
    'warning': 'text-yellow-600',
    'critical': 'text-red-600'
  }
  return colors[status] || 'text-gray-600'
}
</script>

<style scoped>
.report-viewer {
  max-width: 100%;
  overflow-x: auto;
}

.dashboard-executivo .grid {
  min-width: 800px;
}

@media (max-width: 768px) {
  .dashboard-executivo .grid {
    min-width: 100%;
    grid-template-columns: 1fr;
  }
}
</style>