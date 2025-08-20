<template>
  <div class="form-group" :class="{ error: shouldShowError }">
    <!-- Label -->
    <label v-if="label" :for="inputId" class="form-label">
      {{ label }}
      <span v-if="required" class="required-indicator">*</span>
    </label>

    <!-- Input field -->
    <div class="input-wrapper">
      <!-- Ícone à esquerda -->
      <div v-if="leftIcon" class="input-icon left">
        <Icon :name="leftIcon" size="16" />
      </div>

      <!-- Campo de input -->
      <input
        :id="inputId"
        ref="inputRef"
        :type="inputType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :autocomplete="autocomplete"
        :maxlength="maxlength"
        :min="min"
        :max="max"
        :step="step"
        :class="inputClasses"
        v-bind="$attrs"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        @keydown="handleKeydown"
      />

      <!-- Ícone à direita -->
      <div v-if="rightIcon || showPasswordToggle" class="input-icon right">
        <!-- Toggle de senha -->
        <button
          v-if="showPasswordToggle"
          type="button"
          class="password-toggle"
          @click="togglePasswordVisibility"
          :title="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
        >
          <Icon :name="showPassword ? 'eye-off' : 'eye'" size="16" />
        </button>
        
        <!-- Ícone customizado -->
        <Icon v-else-if="rightIcon" :name="rightIcon" size="16" />
      </div>

      <!-- Indicador de loading -->
      <div v-if="loading" class="input-icon right">
        <Icon name="refresh" size="16" class="rotating" />
      </div>
    </div>

    <!-- Mensagem de erro -->
    <div v-if="shouldShowError" class="form-error">
      <Icon name="warning" size="14" />
      {{ errorMessage }}
    </div>

    <!-- Texto de ajuda -->
    <div v-if="helpText && !shouldShowError" class="form-help">
      {{ helpText }}
    </div>

    <!-- Contador de caracteres -->
    <div v-if="maxlength && showCounter" class="form-counter">
      {{ characterCount }} / {{ maxlength }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import Icon from '@/components/Icon.vue'

const props = defineProps({
  // Valor do input (v-model)
  modelValue: {
    type: [String, Number],
    default: ''
  },
  
  // Configurações básicas
  type: {
    type: String,
    default: 'text'
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  helpText: {
    type: String,
    default: ''
  },
  
  // Estados
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  
  // Validação
  error: {
    type: String,
    default: ''
  },
  
  // Ícones
  leftIcon: {
    type: String,
    default: ''
  },
  rightIcon: {
    type: String,
    default: ''
  },
  
  // Configurações HTML
  autocomplete: {
    type: String,
    default: ''
  },
  maxlength: {
    type: Number,
    default: null
  },
  min: {
    type: [String, Number],
    default: null
  },
  max: {
    type: [String, Number],
    default: null
  },
  step: {
    type: [String, Number],
    default: null
  },
  
  // Recursos extras
  showCounter: {
    type: Boolean,
    default: false
  },
  autofocus: {
    type: Boolean,
    default: false
  },
  
  // Tamanhos
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  
  // Variantes
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'filled', 'outlined'].includes(value)
  }
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'enter', 'input'])

// Estado interno
const inputRef = ref(null)
const isFocused = ref(false)
const showPassword = ref(false)

// ID único para acessibilidade
const inputId = computed(() => {
  return `input-${Math.random().toString(36).substr(2, 9)}`
})

// Tipo do input (com toggle de senha)
const inputType = computed(() => {
  if (props.type === 'password' && showPassword.value) {
    return 'text'
  }
  return props.type
})

// Mostrar toggle de senha
const showPasswordToggle = computed(() => {
  return props.type === 'password' && !props.readonly
})

// Classes do input
const inputClasses = computed(() => {
  const classes = ['form-input']
  
  // Tamanho
  classes.push(`size-${props.size}`)
  
  // Variante
  classes.push(`variant-${props.variant}`)
  
  // Estados
  if (shouldShowError.value) classes.push('error')
  if (props.disabled) classes.push('disabled')
  if (props.readonly) classes.push('readonly')
  if (isFocused.value) classes.push('focused')
  if (props.leftIcon) classes.push('has-left-icon')
  if (props.rightIcon || showPasswordToggle.value || props.loading) classes.push('has-right-icon')
  
  return classes
})

// Mensagem de erro
const errorMessage = computed(() => {
  return props.error
})

// Mostrar erro
const shouldShowError = computed(() => {
  return !!props.error
})

// Contador de caracteres
const characterCount = computed(() => {
  return props.modelValue ? props.modelValue.toString().length : 0
})

// Métodos
const handleInput = (event) => {
  const value = event.target.value
  emit('update:modelValue', value)
  emit('input', value)
}

const handleBlur = (event) => {
  isFocused.value = false
  emit('blur', event)
}

const handleFocus = (event) => {
  isFocused.value = true
  emit('focus', event)
}

const handleKeydown = (event) => {
  if (event.key === 'Enter') {
    emit('enter', event)
  }
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const focus = () => {
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const blur = () => {
  inputRef.value?.blur()
}

const select = () => {
  inputRef.value?.select()
}

// Autofocus
watch(() => props.autofocus, (newValue) => {
  if (newValue) {
    nextTick(() => {
      focus()
    })
  }
}, { immediate: true })

// Expor métodos para o componente pai
defineExpose({
  focus,
  blur,
  select,
  inputRef
})
</script>

<style scoped>
.form-group {
  margin-bottom: 1rem;
}

.form-group.error .form-label {
  color: var(--color-error, #dc3545);
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-text-primary, #333);
  font-size: 0.875rem;
}

.required-indicator {
  color: var(--color-error, #dc3545);
  margin-left: 2px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border, #ddd);
  border-radius: 6px;
  font-size: 0.875rem;
  line-height: 1.5;
  background-color: var(--color-background, #fff);
  color: var(--color-text-primary, #333);
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary, #007bff);
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-input.error {
  border-color: var(--color-error, #dc3545);
}

.form-input.error:focus {
  border-color: var(--color-error, #dc3545);
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

.form-input.disabled {
  background-color: var(--color-background-disabled, #f8f9fa);
  color: var(--color-text-disabled, #6c757d);
  cursor: not-allowed;
}

.form-input.readonly {
  background-color: var(--color-background-readonly, #f8f9fa);
}

/* Tamanhos */
.form-input.size-sm {
  padding: 0.5rem;
  font-size: 0.75rem;
}

.form-input.size-lg {
  padding: 1rem;
  font-size: 1rem;
}

/* Variantes */
.form-input.variant-filled {
  background-color: var(--color-background-filled, #f8f9fa);
  border-color: transparent;
}

.form-input.variant-outlined {
  background-color: transparent;
  border-width: 2px;
}

/* Com ícones */
.form-input.has-left-icon {
  padding-left: 2.5rem;
}

.form-input.has-right-icon {
  padding-right: 2.5rem;
}

.input-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary, #6c757d);
  pointer-events: none;
  z-index: 1;
}

.input-icon.left {
  left: 0.75rem;
}

.input-icon.right {
  right: 0.75rem;
}

.password-toggle {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--color-text-secondary, #6c757d);
  pointer-events: all;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.password-toggle:hover {
  color: var(--color-text-primary, #333);
}

.form-error {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-error, #dc3545);
}

.form-help {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary, #6c757d);
}

.form-counter {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary, #6c757d);
  text-align: right;
}

/* Animações */
.rotating {
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

/* Estados de foco */
.form-input.focused {
  border-color: var(--color-primary, #007bff);
}

/* Responsividade */
@media (max-width: 768px) {
  .form-input {
    font-size: 16px; /* Evita zoom no iOS */
  }
}
</style>