<template>
  <!-- Ícone Lucide (prioridade) -->
  <component 
    v-if="lucideComponent" 
    :is="lucideComponent" 
    :class="iconClasses"
    :style="iconStyles"
    v-bind="$attrs"
  />
  
  <!-- Fallback FontAwesome (deprecado) -->
  <i 
    v-else-if="isFontAwesome" 
    :class="[name, iconClasses]"
    :style="iconStyles"
    v-bind="$attrs"
  />
  
  <!-- Fallback genérico -->
  <span 
    v-else
    :class="['icon-placeholder', iconClasses]"
    :style="iconStyles"
    v-bind="$attrs"
  >
    {{ fallbackText }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { useIcons } from '@/composables/useIcons'

const props = defineProps({
  // Nome do ícone (Lucide, interface, ou FontAwesome)
  name: {
    type: String,
    required: true
  },
  
  // Tamanho do ícone
  size: {
    type: [String, Number],
    default: 16
  },
  
  // Cor do ícone
  color: {
    type: String,
    default: 'currentColor'
  },
  
  // Classes CSS adicionais
  class: {
    type: [String, Array, Object],
    default: ''
  },
  
  // Se deve mostrar aviso de migração no console
  showMigrationWarning: {
    type: Boolean,
    default: false
  },
  
  // Texto fallback se ícone não encontrado
  fallback: {
    type: String,
    default: '?'
  }
})

const emit = defineEmits(['migration-warning'])

const { 
  getIcon, 
  isFontAwesome, 
  getMigrationSuggestion,
  isLucideIcon 
} = useIcons()

// Computadas
const lucideComponent = computed(() => {
  const icon = getIcon(props.name)
  
  // Avisar sobre migração FontAwesome se solicitado
  if (props.showMigrationWarning && isFontAwesome(props.name)) {
    const suggestion = getMigrationSuggestion(props.name)
    if (suggestion) {
      console.warn(`[MIGRAÇÃO] ${suggestion.suggestion}`)
      emit('migration-warning', suggestion)
    }
  }
  
  return icon
})

const iconClasses = computed(() => {
  const classes = ['icon']
  
  // Adicionar classes customizadas
  if (props.class) {
    if (Array.isArray(props.class)) {
      classes.push(...props.class)
    } else if (typeof props.class === 'object') {
      Object.keys(props.class).forEach(key => {
        if (props.class[key]) classes.push(key)
      })
    } else {
      classes.push(props.class)
    }
  }
  
  // Adicionar classes de status
  if (isLucideIcon(props.name)) {
    classes.push('lucide-icon')
  } else if (isFontAwesome(props.name)) {
    classes.push('fontawesome-icon', 'deprecated')
  } else {
    classes.push('unknown-icon')
  }
  
  return classes
})

const iconStyles = computed(() => {
  return {
    color: props.color,
    fontSize: typeof props.size === 'number' ? `${props.size}px` : props.size,
    width: typeof props.size === 'number' ? `${props.size}px` : props.size,
    height: typeof props.size === 'number' ? `${props.size}px` : props.size
  }
})

const fallbackText = computed(() => {
  return props.fallback || props.name.charAt(0).toUpperCase()
})
</script>

<style scoped>
.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.lucide-icon {
  /* Ícones Lucide têm stroke consistente */
  stroke-width: 2;
}

.fontawesome-icon.deprecated {
  /* Indicar ícones FontAwesome como deprecados */
  opacity: 0.8;
  filter: sepia(0.3);
}

.icon-placeholder {
  /* Placeholder para ícones não encontrados */
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  color: #666;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  min-height: 16px;
}

/* Temas */
.icon.primary {
  color: var(--primary-color, #007bff);
}

.icon.secondary {
  color: var(--secondary-color, #6c757d);
}

.icon.success {
  color: var(--success-color, #28a745);
}

.icon.warning {
  color: var(--warning-color, #ffc107);
}

.icon.danger {
  color: var(--danger-color, #dc3545);
}

.icon.info {
  color: var(--info-color, #17a2b8);
}

/* Tamanhos predefinidos */
.icon.xs {
  width: 12px;
  height: 12px;
  font-size: 12px;
}

.icon.sm {
  width: 14px;
  height: 14px;
  font-size: 14px;
}

.icon.md {
  width: 16px;
  height: 16px;
  font-size: 16px;
}

.icon.lg {
  width: 20px;
  height: 20px;
  font-size: 20px;
}

.icon.xl {
  width: 24px;
  height: 24px;
  font-size: 24px;
}

/* Estados */
.icon:hover {
  opacity: 0.8;
}

.icon.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>