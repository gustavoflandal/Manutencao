import { ref } from 'vue'

const toasts = ref([])

export const useToast = () => {
  const addToast = (toast) => {
    const id = Date.now() + Math.random()
    toasts.value.push({ ...toast, id })
    
    // Auto remover após duração especificada
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 4000)
    }
    
    return id
  }

  const removeToast = (id) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (title, message = '', duration = 4000) => {
    return addToast({ type: 'success', title, message, duration })
  }

  const error = (title, message = '', duration = 6000) => {
    return addToast({ type: 'error', title, message, duration })
  }

  const warning = (title, message = '', duration = 5000) => {
    return addToast({ type: 'warning', title, message, duration })
  }

  const info = (title, message = '', duration = 4000) => {
    return addToast({ type: 'info', title, message, duration })
  }

  const clear = () => {
    toasts.value = []
  }

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clear
  }
}
