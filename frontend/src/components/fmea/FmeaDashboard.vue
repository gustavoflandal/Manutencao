<template>
  <div class="fmea-dashboard">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Card de Total de Análises -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="rounded-md bg-primary-100 p-3">
              <svg class="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <h2 class="text-lg font-medium text-gray-900">Total de Análises</h2>
            <p class="mt-1 text-3xl font-semibold text-gray-900">{{ statistics.total_analyses }}</p>
          </div>
        </div>
      </div>

      <!-- Card de Análises Críticas -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="rounded-md bg-red-100 p-3">
              <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <h2 class="text-lg font-medium text-gray-900">Análises Críticas</h2>
            <p class="mt-1 text-3xl font-semibold text-red-600">{{ statistics.critical_analyses }}</p>
          </div>
        </div>
      </div>

      <!-- Card de RPN Médio -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="rounded-md bg-yellow-100 p-3">
              <svg class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <h2 class="text-lg font-medium text-gray-900">RPN Médio</h2>
            <p class="mt-1 text-3xl font-semibold text-yellow-600">{{ Math.round(statistics.average_rpn) }}</p>
          </div>
        </div>
      </div>

      <!-- Card de Status -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="rounded-md bg-green-100 p-3">
              <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <h2 class="text-lg font-medium text-gray-900">Concluídas</h2>
            <p class="mt-1 text-3xl font-semibold text-green-600">
              {{ statistics.status_distribution?.completed || 0 }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Gráficos -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Distribuição de RPN -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Distribuição de RPN</h3>
        <div class="h-64">
          <canvas ref="rpnChart"></canvas>
        </div>
      </div>

      <!-- Status das Análises -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Status das Análises</h3>
        <div class="h-64">
          <canvas ref="statusChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Tabela de Análises Críticas -->
    <div class="mt-8 bg-white rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Análises Críticas (RPN > 200)</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Equipamento
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Componente
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Modo de Falha
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                RPN
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="analysis in criticalAnalyses" :key="analysis.id">
              <td class="px-6 py-4 whitespace-nowrap">
                {{ analysis.equipment?.name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ analysis.component }}
              </td>
              <td class="px-6 py-4">
                {{ analysis.failure_mode }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                  {{ analysis.rpn }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="{
                    'bg-gray-100 text-gray-800': analysis.status === 'open',
                    'bg-blue-100 text-blue-800': analysis.status === 'in_progress',
                    'bg-green-100 text-green-800': analysis.status === 'completed',
                    'bg-red-100 text-red-800': analysis.status === 'cancelled'
                  }"
                >
                  {{ statusText[analysis.status] }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <router-link 
                  :to="{ name: 'fmea-details', params: { id: analysis.id }}"
                  class="text-primary-600 hover:text-primary-900"
                >
                  Ver Detalhes
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useFmeaStore } from '@/stores/fmea';
import { storeToRefs } from 'pinia';
import Chart from 'chart.js/auto';

const fmeaStore = useFmeaStore();
const { statistics, criticalAnalyses } = storeToRefs(fmeaStore);

const rpnChart = ref(null);
const statusChart = ref(null);
let rpnChartInstance = null;
let statusChartInstance = null;

const statusText = {
  open: 'Em Aberto',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado'
};

// Inicializa os gráficos
const initCharts = () => {
  // Gráfico de distribuição RPN
  const rpnCtx = rpnChart.value.getContext('2d');
  rpnChartInstance = new Chart(rpnCtx, {
    type: 'bar',
    data: {
      labels: ['1-49', '50-99', '100-199', '200+'],
      datasets: [{
        label: 'Quantidade de Análises',
        data: calculateRpnDistribution(),
        backgroundColor: [
          'rgba(34, 197, 94, 0.5)',  // Verde
          'rgba(234, 179, 8, 0.5)',  // Amarelo
          'rgba(249, 115, 22, 0.5)', // Laranja
          'rgba(239, 68, 68, 0.5)'   // Vermelho
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(234, 179, 8)',
          'rgb(249, 115, 22)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });

  // Gráfico de status
  const statusCtx = statusChart.value.getContext('2d');
  statusChartInstance = new Chart(statusCtx, {
    type: 'doughnut',
    data: {
      labels: ['Em Aberto', 'Em Andamento', 'Concluído', 'Cancelado'],
      datasets: [{
        data: [
          statistics.value.status_distribution?.open || 0,
          statistics.value.status_distribution?.in_progress || 0,
          statistics.value.status_distribution?.completed || 0,
          statistics.value.status_distribution?.cancelled || 0
        ],
        backgroundColor: [
          'rgba(107, 114, 128, 0.5)', // Cinza
          'rgba(59, 130, 246, 0.5)',  // Azul
          'rgba(34, 197, 94, 0.5)',   // Verde
          'rgba(239, 68, 68, 0.5)'    // Vermelho
        ],
        borderColor: [
          'rgb(107, 114, 128)',
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  });
};

// Calcula a distribuição de RPN
const calculateRpnDistribution = () => {
  const analyses = criticalAnalyses.value;
  const distribution = [0, 0, 0, 0]; // [1-49, 50-99, 100-199, 200+]

  analyses.forEach(analysis => {
    if (analysis.rpn < 50) distribution[0]++;
    else if (analysis.rpn < 100) distribution[1]++;
    else if (analysis.rpn < 200) distribution[2]++;
    else distribution[3]++;
  });

  return distribution;
};

// Atualiza os gráficos quando os dados mudam
const updateCharts = () => {
  if (rpnChartInstance) {
    rpnChartInstance.data.datasets[0].data = calculateRpnDistribution();
    rpnChartInstance.update();
  }

  if (statusChartInstance) {
    statusChartInstance.data.datasets[0].data = [
      statistics.value.status_distribution?.open || 0,
      statistics.value.status_distribution?.in_progress || 0,
      statistics.value.status_distribution?.completed || 0,
      statistics.value.status_distribution?.cancelled || 0
    ];
    statusChartInstance.update();
  }
};

onMounted(async () => {
  await fmeaStore.fetchStatistics();
  await fmeaStore.fetchAnalyses();
  initCharts();
});

// Watch para mudanças nos dados
watch([statistics, criticalAnalyses], () => {
  updateCharts();
});
</script>

<style scoped>
.fmea-dashboard {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6;
}
</style>
