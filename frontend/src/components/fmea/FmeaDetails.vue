<template>
  <div v-if="currentAnalysis" class="fmea-details space-y-6">
    <!-- Cabeçalho -->
    <div class="bg-white shadow rounded-lg p-6">
      <div class="flex justify-between items-start">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">
            Análise FMEA - {{ currentAnalysis.equipment?.name }}
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            Componente: {{ currentAnalysis.component }}
          </p>
        </div>
        <span 
          class="px-3 py-1 text-sm font-semibold rounded-full"
          :class="{
            'bg-gray-100 text-gray-800': currentAnalysis.status === 'open',
            'bg-blue-100 text-blue-800': currentAnalysis.status === 'in_progress',
            'bg-green-100 text-green-800': currentAnalysis.status === 'completed',
            'bg-red-100 text-red-800': currentAnalysis.status === 'cancelled'
          }"
        >
          {{ statusText[currentAnalysis.status] }}
        </span>
      </div>
    </div>

    <!-- Informações Principais -->
    <div class="bg-white shadow rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Informações da Análise</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="text-sm font-medium text-gray-500">Função</h4>
          <p class="mt-1 text-sm text-gray-900">{{ currentAnalysis.function }}</p>
        </div>
        
        <div>
          <h4 class="text-sm font-medium text-gray-500">Modo de Falha</h4>
          <p class="mt-1 text-sm text-gray-900">{{ currentAnalysis.failure_mode }}</p>
        </div>
        
        <div>
          <h4 class="text-sm font-medium text-gray-500">Efeito da Falha</h4>
          <p class="mt-1 text-sm text-gray-900">{{ currentAnalysis.failure_effect }}</p>
        </div>
        
        <div>
          <h4 class="text-sm font-medium text-gray-500">Causa da Falha</h4>
          <p class="mt-1 text-sm text-gray-900">{{ currentAnalysis.failure_cause }}</p>
        </div>
      </div>

      <!-- Pontuação -->
      <div class="mt-6 grid grid-cols-4 gap-4">
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-500">Severidade</h4>
          <p class="mt-1 text-2xl font-semibold text-gray-900">
            {{ currentAnalysis.severity }}
          </p>
        </div>
        
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-500">Ocorrência</h4>
          <p class="mt-1 text-2xl font-semibold text-gray-900">
            {{ currentAnalysis.occurrence }}
          </p>
        </div>
        
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-500">Detecção</h4>
          <p class="mt-1 text-2xl font-semibold text-gray-900">
            {{ currentAnalysis.detection }}
          </p>
        </div>
        
        <div 
          class="rounded-lg p-4"
          :class="{
            'bg-red-50': currentAnalysis.rpn >= 200,
            'bg-yellow-50': currentAnalysis.rpn >= 100 && currentAnalysis.rpn < 200,
            'bg-green-50': currentAnalysis.rpn < 100
          }"
        >
          <h4 class="text-sm font-medium text-gray-500">RPN</h4>
          <p 
            class="mt-1 text-2xl font-semibold"
            :class="{
              'text-red-700': currentAnalysis.rpn >= 200,
              'text-yellow-700': currentAnalysis.rpn >= 100 && currentAnalysis.rpn < 200,
              'text-green-700': currentAnalysis.rpn < 100
            }"
          >
            {{ currentAnalysis.rpn }}
          </p>
        </div>
      </div>
    </div>

    <!-- Ações Recomendadas -->
    <div class="bg-white shadow rounded-lg p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-900">Ações Recomendadas</h3>
        <button
          @click="showAddActionModal = true"
          class="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
        >
          Adicionar Ação
        </button>
      </div>

      <div class="space-y-4">
        <div v-for="action in currentAnalysis.actions" :key="action.id" class="border-l-4 border-primary-500 pl-4 py-2">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm text-gray-900">{{ action.action_taken }}</p>
              <p class="text-xs text-gray-500">
                Completado por {{ action.completedByUser?.name }} em 
                {{ new Date(action.completed_date).toLocaleDateString() }}
              </p>
            </div>
            <div class="text-sm">
              Novo RPN: 
              <span 
                class="font-semibold"
                :class="{
                  'text-red-600': action.new_rpn >= 200,
                  'text-yellow-600': action.new_rpn >= 100 && action.new_rpn < 200,
                  'text-green-600': action.new_rpn < 100
                }"
              >
                {{ action.new_rpn }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Adicionar Ação -->
    <div v-if="showAddActionModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 max-w-lg w-full">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Adicionar Nova Ação</h3>
        
        <form @submit.prevent="submitAction" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Ação Tomada</label>
            <textarea
              v-model="newAction.action_taken"
              rows="3"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            ></textarea>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Nova Severidade</label>
              <input
                type="number"
                v-model="newAction.new_severity"
                min="1"
                max="10"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Nova Ocorrência</label>
              <input
                type="number"
                v-model="newAction.new_occurrence"
                min="1"
                max="10"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Nova Detecção</label>
              <input
                type="number"
                v-model="newAction.new_detection"
                min="1"
                max="10"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>

          <div class="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              @click="showAddActionModal = false"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useFmeaStore } from '@/stores/fmea';
import { storeToRefs } from 'pinia';

const route = useRoute();
const fmeaStore = useFmeaStore();
const { currentAnalysis } = storeToRefs(fmeaStore);

const showAddActionModal = ref(false);
const newAction = ref({
  action_taken: '',
  new_severity: null,
  new_occurrence: null,
  new_detection: null
});

const statusText = {
  open: 'Em Aberto',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado'
};

const submitAction = async () => {
  try {
    await fmeaStore.addAction(currentAnalysis.value.id, newAction.value);
    showAddActionModal.value = false;
    newAction.value = {
      action_taken: '',
      new_severity: null,
      new_occurrence: null,
      new_detection: null
    };
  } catch (error) {
    console.error('Erro ao adicionar ação:', error);
  }
};

onMounted(() => {
  fmeaStore.fetchAnalysis(route.params.id);
});
</script>

<style scoped>
.fmea-details {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6;
}
</style>
