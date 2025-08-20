<template>
  <div class="chart-component">
    <!-- Gráfico de Barras -->
    <div v-if="chartType === 'bar'" class="bar-chart">
      <div class="chart-container" style="height: 300px; position: relative;">
        <svg 
          :width="chartWidth" 
          :height="chartHeight" 
          class="w-full h-full"
        >
          <!-- Eixos -->
          <g class="axes">
            <!-- Eixo Y -->
            <line 
              :x1="margin.left" 
              :y1="margin.top" 
              :x2="margin.left" 
              :y2="chartHeight - margin.bottom" 
              stroke="#e5e7eb" 
              stroke-width="1"
            />
            
            <!-- Eixo X -->
            <line 
              :x1="margin.left" 
              :y1="chartHeight - margin.bottom" 
              :x2="chartWidth - margin.right" 
              :y2="chartHeight - margin.bottom" 
              stroke="#e5e7eb" 
              stroke-width="1"
            />
          </g>

          <!-- Barras -->
          <g class="bars">
            <rect
              v-for="(item, index) in processedData"
              :key="index"
              :x="item.x"
              :y="item.y"
              :width="barWidth"
              :height="item.height"
              :fill="getBarColor(index)"
              class="hover:opacity-80 transition-opacity cursor-pointer"
              @mouseover="showTooltip($event, item)"
              @mouseout="hideTooltip"
            />
          </g>

          <!-- Labels do eixo X -->
          <g class="x-labels">
            <text
              v-for="(item, index) in processedData"
              :key="index"
              :x="item.x + barWidth / 2"
              :y="chartHeight - margin.bottom + 20"
              text-anchor="middle"
              class="fill-gray-600 text-xs"
            >
              {{ truncateLabel(item.label) }}
            </text>
          </g>

          <!-- Labels do eixo Y -->
          <g class="y-labels">
            <text
              v-for="tick in yTicks"
              :key="tick"
              :x="margin.left - 10"
              :y="getYPosition(tick)"
              text-anchor="end"
              class="fill-gray-600 text-xs"
              dy="0.35em"
            >
              {{ formatYValue(tick) }}
            </text>
          </g>
        </svg>
      </div>
    </div>

    <!-- Gráfico de Pizza -->
    <div v-else-if="chartType === 'pie'" class="pie-chart">
      <div class="flex items-center justify-center" style="height: 300px;">
        <svg :width="pieSize" :height="pieSize" class="overflow-visible">
          <g :transform="`translate(${pieSize/2}, ${pieSize/2})`">
            <!-- Fatias -->
            <path
              v-for="(slice, index) in pieSlices"
              :key="index"
              :d="slice.path"
              :fill="getBarColor(index)"
              class="hover:opacity-80 transition-opacity cursor-pointer"
              @mouseover="showTooltip($event, slice)"
              @mouseout="hideTooltip"
            />
            
            <!-- Labels -->
            <text
              v-for="(slice, index) in pieSlices"
              :key="`label-${index}`"
              :x="slice.labelX"
              :y="slice.labelY"
              text-anchor="middle"
              class="fill-gray-700 text-xs font-medium"
              dy="0.35em"
            >
              {{ slice.percentage > 5 ? `${slice.percentage.toFixed(1)}%` : '' }}
            </text>
          </g>
        </svg>
      </div>
      
      <!-- Legenda -->
      <div class="flex flex-wrap justify-center gap-4 mt-4">
        <div 
          v-for="(item, index) in processedData" 
          :key="index"
          class="flex items-center space-x-2"
        >
          <div 
            :style="`background-color: ${getBarColor(index)}`"
            class="w-3 h-3 rounded-full"
          ></div>
          <span class="text-sm text-gray-600">{{ item.label }}</span>
        </div>
      </div>
    </div>

    <!-- Gráfico de Linha -->
    <div v-else-if="chartType === 'line'" class="line-chart">
      <div class="chart-container" style="height: 300px; position: relative;">
        <svg 
          :width="chartWidth" 
          :height="chartHeight" 
          class="w-full h-full"
        >
          <!-- Grid -->
          <g class="grid">
            <line
              v-for="tick in yTicks"
              :key="`grid-y-${tick}`"
              :x1="margin.left"
              :y1="getYPosition(tick)"
              :x2="chartWidth - margin.right"
              :y2="getYPosition(tick)"
              stroke="#f3f4f6"
              stroke-width="1"
            />
          </g>

          <!-- Eixos -->
          <g class="axes">
            <line 
              :x1="margin.left" 
              :y1="margin.top" 
              :x2="margin.left" 
              :y2="chartHeight - margin.bottom" 
              stroke="#e5e7eb" 
              stroke-width="1"
            />
            <line 
              :x1="margin.left" 
              :y1="chartHeight - margin.bottom" 
              :x2="chartWidth - margin.right" 
              :y2="chartHeight - margin.bottom" 
              stroke="#e5e7eb" 
              stroke-width="1"
            />
          </g>

          <!-- Linha -->
          <g class="line">
            <path
              :d="linePath"
              fill="none"
              stroke="#3b82f6"
              stroke-width="2"
              class="drop-shadow-sm"
            />
          </g>

          <!-- Pontos -->
          <g class="points">
            <circle
              v-for="(point, index) in linePoints"
              :key="index"
              :cx="point.x"
              :cy="point.y"
              r="4"
              fill="#3b82f6"
              class="hover:r-6 transition-all cursor-pointer"
              @mouseover="showTooltip($event, point)"
              @mouseout="hideTooltip"
            />
          </g>

          <!-- Labels -->
          <g class="x-labels">
            <text
              v-for="(point, index) in linePoints"
              :key="index"
              :x="point.x"
              :y="chartHeight - margin.bottom + 20"
              text-anchor="middle"
              class="fill-gray-600 text-xs"
            >
              {{ truncateLabel(point.label) }}
            </text>
          </g>

          <g class="y-labels">
            <text
              v-for="tick in yTicks"
              :key="tick"
              :x="margin.left - 10"
              :y="getYPosition(tick)"
              text-anchor="end"
              class="fill-gray-600 text-xs"
              dy="0.35em"
            >
              {{ formatYValue(tick) }}
            </text>
          </g>
        </svg>
      </div>
    </div>

    <!-- Tooltip -->
    <div
      v-if="tooltip.show"
      :style="`left: ${tooltip.x}px; top: ${tooltip.y}px`"
      class="absolute bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg z-10 pointer-events-none text-sm"
    >
      <div class="font-medium">{{ tooltip.label }}</div>
      <div>{{ formatTooltipValue(tooltip.value) }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

// Props
const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

// Estado local
const chartWidth = ref(800)
const chartHeight = ref(300)
const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  label: '',
  value: 0
})

// Configurações
const margin = { top: 20, right: 30, bottom: 60, left: 60 }
const pieSize = 250
const colors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'
]

// Computed
const chartType = computed(() => props.data.type || 'bar')

const rawData = computed(() => {
  if (Array.isArray(props.data.data)) {
    return props.data.data
  }
  if (Array.isArray(props.data.datasets)) {
    return props.data.datasets[0]?.data || []
  }
  return []
})

const processedData = computed(() => {
  return rawData.value.map((item, index) => {
    if (typeof item === 'object') {
      return {
        label: item.label || item.name || `Item ${index + 1}`,
        value: item.value || item.y || 0,
        originalData: item
      }
    }
    return {
      label: `Item ${index + 1}`,
      value: item,
      originalData: item
    }
  })
})

const maxValue = computed(() => {
  const values = processedData.value.map(item => item.value)
  return Math.max(...values, 0)
})

const yTicks = computed(() => {
  const ticks = []
  const step = maxValue.value / 5
  for (let i = 0; i <= 5; i++) {
    ticks.push(i * step)
  }
  return ticks
})

const barWidth = computed(() => {
  const availableWidth = chartWidth.value - margin.left - margin.right
  const spacing = 10
  return Math.max(
    (availableWidth - (processedData.value.length - 1) * spacing) / processedData.value.length,
    20
  )
})

const chartArea = computed(() => ({
  width: chartWidth.value - margin.left - margin.right,
  height: chartHeight.value - margin.top - margin.bottom
}))

// Dados processados para barras
const processedBarData = computed(() => {
  const spacing = 10
  return processedData.value.map((item, index) => {
    const x = margin.left + index * (barWidth.value + spacing)
    const height = (item.value / maxValue.value) * chartArea.value.height
    const y = chartHeight.value - margin.bottom - height
    
    return {
      ...item,
      x,
      y,
      height
    }
  })
})

// Dados para gráfico de pizza
const pieSlices = computed(() => {
  const total = processedData.value.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = 0
  const radius = pieSize / 2 - 20
  
  return processedData.value.map((item, index) => {
    const percentage = (item.value / total) * 100
    const angle = (item.value / total) * 2 * Math.PI
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    
    // Calcular path do arco
    const x1 = radius * Math.cos(startAngle)
    const y1 = radius * Math.sin(startAngle)
    const x2 = radius * Math.cos(endAngle)
    const y2 = radius * Math.sin(endAngle)
    const largeArcFlag = angle > Math.PI ? 1 : 0
    
    const path = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
    
    // Posição do label
    const labelAngle = startAngle + angle / 2
    const labelRadius = radius * 0.7
    const labelX = labelRadius * Math.cos(labelAngle)
    const labelY = labelRadius * Math.sin(labelAngle)
    
    currentAngle += angle
    
    return {
      ...item,
      path,
      labelX,
      labelY,
      percentage,
      startAngle,
      endAngle
    }
  })
})

// Dados para gráfico de linha
const linePoints = computed(() => {
  const spacing = chartArea.value.width / (processedData.value.length - 1 || 1)
  
  return processedData.value.map((item, index) => {
    const x = margin.left + index * spacing
    const y = chartHeight.value - margin.bottom - 
             (item.value / maxValue.value) * chartArea.value.height
    
    return {
      ...item,
      x,
      y
    }
  })
})

const linePath = computed(() => {
  if (linePoints.value.length === 0) return ''
  
  let path = `M ${linePoints.value[0].x} ${linePoints.value[0].y}`
  
  for (let i = 1; i < linePoints.value.length; i++) {
    path += ` L ${linePoints.value[i].x} ${linePoints.value[i].y}`
  }
  
  return path
})

// Métodos
function getBarColor(index) {
  return colors[index % colors.length]
}

function getYPosition(value) {
  return chartHeight.value - margin.bottom - 
         (value / maxValue.value) * chartArea.value.height
}

function formatYValue(value) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toFixed(0)
}

function formatTooltipValue(value) {
  if (props.data.format === 'currency') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  if (props.data.format === 'percentage') {
    return `${value.toFixed(1)}%`
  }
  return value.toLocaleString('pt-BR')
}

function truncateLabel(label) {
  return label.length > 10 ? `${label.substring(0, 10)}...` : label
}

function showTooltip(event, item) {
  tooltip.value = {
    show: true,
    x: event.clientX + 10,
    y: event.clientY - 10,
    label: item.label,
    value: item.value
  }
}

function hideTooltip() {
  tooltip.value.show = false
}

function updateDimensions() {
  nextTick(() => {
    const container = document.querySelector('.chart-container')
    if (container) {
      chartWidth.value = container.clientWidth
    }
  })
}

// Lifecycle
onMounted(() => {
  updateDimensions()
  window.addEventListener('resize', updateDimensions)
})
</script>

<style scoped>
.chart-component {
  position: relative;
  width: 100%;
}

.chart-container {
  overflow: visible;
}

svg {
  overflow: visible;
}

.hover\:r-6:hover {
  r: 6;
}

@media (max-width: 768px) {
  .chart-container {
    height: 250px !important;
  }
}
</style>