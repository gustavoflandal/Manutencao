<template>
  <div class="fmea-form bg-white shadow rounded-lg p-6">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Informações Básicas -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700">Equipamento</label>
            <select
              v-model="formData.equipment_id"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">Selecione um equipamento</option>
              <option v-for="eq in equipments" :key="eq.id" :value="eq.id">
                {{ eq.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Componente</label>
            <input
              type="text"
              v-model="formData.component"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      <!-- Análise de Falha -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-4">Análise de Falha</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Função</label>
            <textarea
              v-model="formData.function"
              required
              rows="2"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Modo de Falha</label>
            <textarea
              v-model="formData.failure_mode"
              required
              rows="2"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Efeito da Falha</label>
            <textarea
              v-model="formData.failure_effect"
              required
              rows="2"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Causa da Falha</label>
            <textarea
              v-model="formData.failure_cause"
              required
              rows="2"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Controles Atuais</label>
            <textarea
              v-model="formData.current_controls"
              rows="2"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Avaliação de Risco -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-4">Avaliação de Risco</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Severidade (1-10)
              <span 
                class="ml-1 text-xs text-gray-500 cursor-help"
                title="1: Mínima - 10: Catastrófica"
              >
                ℹ️
              </span>
            </label>
            <input
              type="number"
              v-model="formData.severity"
              required
              min="1"
              max="10"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">
              Ocorrência (1-10)
              <span 
                class="ml-1 text-xs text-gray-500 cursor-help"
                title="1: Remota - 10: Muito Alta"
              >
                ℹ️
              </span>
            </label>
            <input
              type="number"
              v-model="formData.occurrence"
              required
              min="1"
              max="10"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">
              Detecção (1-10)
              <span 
                class="ml-1 text-xs text-gray-500 cursor-help"
                title="1: Muito Alta - 10: Impossível"
              >
                ℹ️
              </span>
            </label>
            <input
              type="number"
              v-model="formData.detection"
              required
              min="1"
              max="10"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
        </div>

        <div class="mt-4">
          <p class="text-sm text-gray-500">
            RPN (Risk Priority Number): 
            <span 
              class="font-semibold"
              :class="{
                'text-red-600': rpn >= 200,
                'text-yellow-600': rpn >= 100 && rpn < 200,
                'text-green-600': rpn < 100
              }"
            >
              {{ rpn }}
            </span>
          </p>
        </div>
      </div>

      <!-- Ações e Responsabilidades -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-4">Ações e Responsabilidades</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700">Ações Recomendadas</label>
            <textarea
              v-model="formData.recommended_actions"
              rows="3"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            ></textarea>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Responsável</label>
              <select
                v-model="formData.responsible"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Selecione um responsável</option>
                <option v-for="user in users" :key="user.id" :value="user.id">
                  {{ user.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Data Alvo</label>
              <input
                type="date"
                v-model="formData.target_date"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Status</label>
              <select
                v-model="formData.status"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="open">Em Aberto</option>
                <option value="in_progress">Em Andamento</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Botões de Ação -->
      <div class="flex justify-end space-x-3">
        <button
          type="button"
          @click="$router.back()"
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
          :disabled="loading"
        >
          {{ loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFmeaStore } from '@/stores/fmea';

const props = defineProps({
  isEdit: {
    type: Boolean,
    default: false
  }
});

const route = useRoute();
const router = useRouter();
const fmeaStore = useFmeaStore();
const loading = ref(false);

// Mock data - substituir por dados reais
const equipments = ref([
  { id: 1, name: 'Equipamento 1' },
  { id: 2, name: 'Equipamento 2' }
]);

const users = ref([
  { id: 1, name: 'Usuário 1' },
  { id: 2, name: 'Usuário 2' }
]);

const formData = ref({
  equipment_id: '',
  component: '',
  function: '',
  failure_mode: '',
  failure_effect: '',
  failure_cause: '',
  current_controls: '',
  severity: null,
  occurrence: null,
  detection: null,
  recommended_actions: '',
  responsible: '',
  target_date: '',
  status: 'open'
});

const rpn = computed(() => {
  if (formData.value.severity && formData.value.occurrence && formData.value.detection) {
    return formData.value.severity * formData.value.occurrence * formData.value.detection;
  }
  return 0;
});

const handleSubmit = async () => {
  try {
    loading.value = true;
    if (props.isEdit) {
      await fmeaStore.updateAnalysis(route.params.id, formData.value);
    } else {
      await fmeaStore.createAnalysis(formData.value);
    }
    router.push({ name: 'fmea-list' });
  } catch (error) {
    console.error('Erro ao salvar análise:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (props.isEdit && route.params.id) {
    const analysis = await fmeaStore.fetchAnalysis(route.params.id);
    if (analysis) {
      formData.value = { ...analysis };
    }
  }
  // TODO: Carregar lista de equipamentos e usuários
});
</script>

<style scoped>
.fmea-form {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6;
}
</style>

