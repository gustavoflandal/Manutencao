<template>
  <div v-if="visible" class="toast" :class="type">
    <div class="toast-icon">
      <svg v-if="type === 'success'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
      </svg>
      <svg v-else-if="type === 'error'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
      </svg>
      <svg v-else-if="type === 'warning'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>
    </div>
    <div class="toast-content">
      <div class="toast-title">{{ title }}</div>
      <div v-if="message" class="toast-message">{{ message }}</div>
    </div>
    <button class="toast-close" @click="close">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'success',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 4000
  }
})

const emit = defineEmits(['close'])

const visible = ref(false)

const close = () => {
  visible.value = false
  emit('close')
}

onMounted(() => {
  visible.value = true
  
  if (props.duration > 0) {
    setTimeout(() => {
      close()
    }, props.duration)
  }
})
</script>

<style scoped>
.toast {
  position: fixed;
  top: 2rem;
  right: 2rem;
  min-width: 300px;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-left: 4px solid;
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  gap: 0.75rem;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast.success {
  border-left-color: #2e7d32;
}

.toast.error {
  border-left-color: #d32f2f;
}

.toast.warning {
  border-left-color: #f57c00;
}

.toast.info {
  border-left-color: #1976d2;
}

.toast-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.toast.success .toast-icon {
  color: #2e7d32;
}

.toast.error .toast-icon {
  color: #d32f2f;
}

.toast.warning .toast-icon {
  color: #f57c00;
}

.toast.info .toast-icon {
  color: #1976d2;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
}

.toast-message {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.4;
}

.toast-close {
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.toast-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--primary-color);
}
</style>
