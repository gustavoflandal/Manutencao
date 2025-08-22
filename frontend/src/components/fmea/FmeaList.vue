<template>
  <div class="fmea-list">
    <!-- Filtros -->
    <div class="filters bg-white p-4 rounded-lg shadow mb-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Status</label>
          <select 
            v-model="filters.status"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">Todos</option>
            <option value="open">Em Aberto</option>
            <option value="in_progress">Em Andamento</option>
            <option value="completed">Concluído</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Equipamento</label>
          <select 
            v-model="filters.equipment_id"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">Todos</option>
            <option v-for="eq in equipments" :key="eq.id" :value="eq.id">
              {{ eq.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">RPN Mínimo</label>
          <input 
            type="number" 
            v-model="filters.rpn_min"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">RPN Máximo</label>
          <input 
            type="number" 
            v-model="filters.rpn_max"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
      </div>

      <div class="mt-4 flex justify-end space-x-3">
        <button
          @click="resetFilters"
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Limpar Filtros
        </button>
        <button
          @click="applyFilters"
          class="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
        >
          Aplicar Filtros
        </button>
      </div>
    </div>

    <!-- Tabela de Análises -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
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
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Responsável
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="analysis in analyses" :key="analysis.id" :class="{'bg-red-50': analysis.rpn >= 200}">
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
              <span 
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                :class="{
                  'bg-red-100 text-red-800': analysis.rpn >= 200,
                  'bg-yellow-100 text-yellow-800': analysis.rpn >= 100 && analysis.rpn < 200,
                  'bg-green-100 text-green-800': analysis.rpn < 100
                }"
              >
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
            <td class="px-6 py-4 whitespace-nowrap">
              {{ analysis.responsibleUser?.name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <router-link 
                :to="{ name: 'fmea-details', params: { id: analysis.id }}"
                class="text-primary-600 hover:text-primary-900 mr-3"
              >
                Detalhes
              </router-link>
              <button
                @click="editAnalysis(analysis)"
                class="text-primary-600 hover:text-primary-900"
              >
                Editar
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Paginação -->
      <div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-700">
            Mostrando {{ (pagination.current_page - 1) * 10 + 1 }} a 
            {{ Math.min(pagination.current_page * 10, pagination.total) }}
            de {{ pagination.total }} resultados
          </div>
          
          <div class="flex space-x-2">
            <button
              v-for="page in pagination.pages"
              :key="page"
              @click="changePage(page)"
              :class="[
                'px-3 py-1 rounded-md text-sm',
                page === pagination.current_page
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              ]"
            >
              {{ page }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useFmeaStore } from '@/stores/fmea';
import { storeToRefs } from 'pinia';

const fmeaStore = useFmeaStore();
const { analyses, pagination, filters } = storeToRefs(fmeaStore);

// Mock data para equipamentos - substituir por dados reais
const equipments = ref([
  { id: 1, name: 'Equipamento 1' },
  { id: 2, name: 'Equipamento 2' },
  // ... mais equipamentos
]);

const statusText = {
  open: 'Em Aberto',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado'
};

// Métodos
const applyFilters = () => {
  fmeaStore.updateFilters(filters.value);
};

const resetFilters = () => {
  fmeaStore.resetFilters();
};

const changePage = (page) => {
  fmeaStore.fetchAnalyses(page);
};

const editAnalysis = (analysis) => {
  // Implementar lógica de edição
  console.log('Editar análise:', analysis);
};

// Lifecycle
onMounted(() => {
  fmeaStore.fetchAnalyses();
});
</script>

<style scoped>
.fmea-list {
  @apply space-y-4;
}
</style>
