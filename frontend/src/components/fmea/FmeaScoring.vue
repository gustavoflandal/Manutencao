<template>
  <div class="fmea-scoring">
    <!-- Guia de Pontuação -->
    <div class="bg-white shadow rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Guia de Pontuação FMEA</h3>
      
      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="currentTab = tab.id"
            :class="[
              'py-2 px-1 border-b-2 font-medium text-sm',
              currentTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Conteúdo das Tabs -->
      <div class="mt-6">
        <!-- Severidade -->
        <div v-if="currentTab === 'severity'" class="space-y-4">
          <p class="text-sm text-gray-500 mb-4">
            A severidade avalia o impacto da falha no sistema, processo ou usuário.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              v-for="level in severityLevels"
              :key="level.value"
              class="p-4 rounded-lg border"
              :class="{
                'border-red-200 bg-red-50': level.value >= 9,
                'border-orange-200 bg-orange-50': level.value >= 7 && level.value < 9,
                'border-yellow-200 bg-yellow-50': level.value >= 5 && level.value < 7,
                'border-green-200 bg-green-50': level.value < 5
              }"
            >
              <div class="flex items-start">
                <span 
                  class="inline-flex items-center justify-center h-6 w-6 rounded-full text-sm font-medium"
                  :class="{
                    'bg-red-100 text-red-800': level.value >= 9,
                    'bg-orange-100 text-orange-800': level.value >= 7 && level.value < 9,
                    'bg-yellow-100 text-yellow-800': level.value >= 5 && level.value < 7,
                    'bg-green-100 text-green-800': level.value < 5
                  }"
                >
                  {{ level.value }}
                </span>
                <div class="ml-3">
                  <h4 class="text-sm font-medium text-gray-900">{{ level.name }}</h4>
                  <p class="mt-1 text-sm text-gray-500">{{ level.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Ocorrência -->
        <div v-if="currentTab === 'occurrence'" class="space-y-4">
          <p class="text-sm text-gray-500 mb-4">
            A ocorrência avalia a frequência ou probabilidade da falha acontecer.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              v-for="level in occurrenceLevels"
              :key="level.value"
              class="p-4 rounded-lg border"
              :class="{
                'border-red-200 bg-red-50': level.value >= 9,
                'border-orange-200 bg-orange-50': level.value >= 7 && level.value < 9,
                'border-yellow-200 bg-yellow-50': level.value >= 5 && level.value < 7,
                'border-green-200 bg-green-50': level.value < 5
              }"
            >
              <div class="flex items-start">
                <span 
                  class="inline-flex items-center justify-center h-6 w-6 rounded-full text-sm font-medium"
                  :class="{
                    'bg-red-100 text-red-800': level.value >= 9,
                    'bg-orange-100 text-orange-800': level.value >= 7 && level.value < 9,
                    'bg-yellow-100 text-yellow-800': level.value >= 5 && level.value < 7,
                    'bg-green-100 text-green-800': level.value < 5
                  }"
                >
                  {{ level.value }}
                </span>
                <div class="ml-3">
                  <h4 class="text-sm font-medium text-gray-900">{{ level.name }}</h4>
                  <p class="mt-1 text-sm text-gray-500">{{ level.description }}</p>
                  <p class="mt-1 text-xs text-gray-400">{{ level.frequency }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Detecção -->
        <div v-if="currentTab === 'detection'" class="space-y-4">
          <p class="text-sm text-gray-500 mb-4">
            A detecção avalia a capacidade de identificar a falha antes que ela afete o sistema.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              v-for="level in detectionLevels"
              :key="level.value"
              class="p-4 rounded-lg border"
              :class="{
                'border-red-200 bg-red-50': level.value >= 9,
                'border-orange-200 bg-orange-50': level.value >= 7 && level.value < 9,
                'border-yellow-200 bg-yellow-50': level.value >= 5 && level.value < 7,
                'border-green-200 bg-green-50': level.value < 5
              }"
            >
              <div class="flex items-start">
                <span 
                  class="inline-flex items-center justify-center h-6 w-6 rounded-full text-sm font-medium"
                  :class="{
                    'bg-red-100 text-red-800': level.value >= 9,
                    'bg-orange-100 text-orange-800': level.value >= 7 && level.value < 9,
                    'bg-yellow-100 text-yellow-800': level.value >= 5 && level.value < 7,
                    'bg-green-100 text-green-800': level.value < 5
                  }"
                >
                  {{ level.value }}
                </span>
                <div class="ml-3">
                  <h4 class="text-sm font-medium text-gray-900">{{ level.name }}</h4>
                  <p class="mt-1 text-sm text-gray-500">{{ level.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RPN -->
        <div v-if="currentTab === 'rpn'" class="space-y-4">
          <p class="text-sm text-gray-500 mb-4">
            O RPN (Risk Priority Number) é calculado multiplicando os valores de Severidade, Ocorrência e Detecção.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              v-for="level in rpnLevels"
              :key="level.range"
              class="p-4 rounded-lg border"
              :class="{
                'border-red-200 bg-red-50': level.priority === 'Crítico',
                'border-orange-200 bg-orange-50': level.priority === 'Alto',
                'border-yellow-200 bg-yellow-50': level.priority === 'Médio',
                'border-green-200 bg-green-50': level.priority === 'Baixo'
              }"
            >
              <div class="flex items-start">
                <div class="ml-3">
                  <h4 class="text-sm font-medium text-gray-900">{{ level.priority }}</h4>
                  <p class="mt-1 text-sm text-gray-500">RPN: {{ level.range }}</p>
                  <p class="mt-1 text-sm text-gray-500">{{ level.description }}</p>
                  <p class="mt-1 text-sm font-medium" :class="{
                    'text-red-600': level.priority === 'Crítico',
                    'text-orange-600': level.priority === 'Alto',
                    'text-yellow-600': level.priority === 'Médio',
                    'text-green-600': level.priority === 'Baixo'
                  }">
                    {{ level.action }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const currentTab = ref('severity');

const tabs = [
  { id: 'severity', name: 'Severidade' },
  { id: 'occurrence', name: 'Ocorrência' },
  { id: 'detection', name: 'Detecção' },
  { id: 'rpn', name: 'RPN' }
];

const severityLevels = [
  {
    value: 10,
    name: 'Perigoso sem aviso',
    description: 'Falha compromete a segurança sem aviso prévio'
  },
  {
    value: 9,
    name: 'Perigoso com aviso',
    description: 'Falha compromete a segurança com aviso'
  },
  {
    value: 8,
    name: 'Muito Alto',
    description: 'Sistema totalmente inoperável'
  },
  {
    value: 7,
    name: 'Alto',
    description: 'Sistema com performance severamente reduzida'
  },
  {
    value: 6,
    name: 'Moderado',
    description: 'Sistema operável com performance reduzida'
  },
  {
    value: 5,
    name: 'Baixo',
    description: 'Sistema operável com alguma degradação'
  },
  {
    value: 4,
    name: 'Muito Baixo',
    description: 'Sistema operável com mínima interferência'
  },
  {
    value: 3,
    name: 'Menor',
    description: 'Efeito notado mas sem impacto significativo'
  },
  {
    value: 2,
    name: 'Muito Menor',
    description: 'Efeito negligenciável no sistema'
  },
  {
    value: 1,
    name: 'Nenhum',
    description: 'Sem efeito perceptível'
  }
];

const occurrenceLevels = [
  {
    value: 10,
    name: 'Muito Alta',
    description: 'Falha quase inevitável',
    frequency: '> 1 em 2'
  },
  {
    value: 9,
    name: 'Alta',
    description: 'Falhas frequentes',
    frequency: '1 em 3'
  },
  {
    value: 8,
    name: 'Alta',
    description: 'Falhas repetidas',
    frequency: '1 em 8'
  },
  {
    value: 7,
    name: 'Moderada Alta',
    description: 'Falhas ocasionais',
    frequency: '1 em 20'
  },
  {
    value: 6,
    name: 'Moderada',
    description: 'Falhas moderadas',
    frequency: '1 em 80'
  },
  {
    value: 5,
    name: 'Moderada',
    description: 'Falhas ocasionais',
    frequency: '1 em 400'
  },
  {
    value: 4,
    name: 'Moderada Baixa',
    description: 'Poucas falhas',
    frequency: '1 em 2000'
  },
  {
    value: 3,
    name: 'Baixa',
    description: 'Falhas raras',
    frequency: '1 em 15000'
  },
  {
    value: 2,
    name: 'Muito Baixa',
    description: 'Falhas isoladas',
    frequency: '1 em 150000'
  },
  {
    value: 1,
    name: 'Remota',
    description: 'Falha improvável',
    frequency: '< 1 em 1500000'
  }
];

const detectionLevels = [
  {
    value: 10,
    name: 'Impossível',
    description: 'Não é possível detectar a falha'
  },
  {
    value: 9,
    name: 'Muito Remota',
    description: 'Controles provavelmente não detectarão'
  },
  {
    value: 8,
    name: 'Remota',
    description: 'Controles têm baixa chance de detecção'
  },
  {
    value: 7,
    name: 'Muito Baixa',
    description: 'Controles têm baixa eficácia'
  },
  {
    value: 6,
    name: 'Baixa',
    description: 'Controles podem detectar'
  },
  {
    value: 5,
    name: 'Moderada',
    description: 'Controles podem detectar com tempo'
  },
  {
    value: 4,
    name: 'Moderada Alta',
    description: 'Controles têm boa chance de detectar'
  },
  {
    value: 3,
    name: 'Alta',
    description: 'Controles provavelmente detectarão'
  },
  {
    value: 2,
    name: 'Muito Alta',
    description: 'Controles quase certamente detectarão'
  },
  {
    value: 1,
    name: 'Quase Certa',
    description: 'Controles certamente detectarão'
  }
];

const rpnLevels = [
  {
    priority: 'Crítico',
    range: '200-1000',
    description: 'Risco inaceitável que requer ação imediata',
    action: 'Ação corretiva imediata obrigatória'
  },
  {
    priority: 'Alto',
    range: '100-199',
    description: 'Risco significativo que requer atenção',
    action: 'Plano de ação necessário em curto prazo'
  },
  {
    priority: 'Médio',
    range: '50-99',
    description: 'Risco moderado que deve ser monitorado',
    action: 'Monitorar e implementar melhorias quando possível'
  },
  {
    priority: 'Baixo',
    range: '1-49',
    description: 'Risco aceitável com controles atuais',
    action: 'Manter controles existentes'
  }
];
</script>

<style scoped>
.fmea-scoring {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6;
}
</style>

