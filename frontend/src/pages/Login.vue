<template>
  <div class="login-container min-h-screen flex items-center justify-center bg-light">
    <div class="login-card card shadow-xl" style="width: 100%; max-width: 400px;">
      <div class="card-header text-center">
        <div class="logo mb-4">
          <i class="fas fa-tools text-4xl text-primary mb-2"></i>
          <h1 class="text-2xl font-bold text-primary">Sistema de Manutenção</h1>
        </div>
        <p class="text-gray font-medium">Faça login para continuar</p>
      </div>
      
      <div class="card-body">
        <!-- Alerta de erro -->
        <div v-if="error" class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i>
          {{ error }}
        </div>
        
        <!-- Formulário de login -->
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="email" class="form-label">
              <i class="fas fa-envelope"></i>
              Email
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="form-input"
              :class="{ error: errors.email }"
              placeholder="Digite seu email"
              required
              autocomplete="email"
            >
            <div v-if="errors.email" class="form-error">
              {{ errors.email }}
            </div>
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">
              <i class="fas fa-lock"></i>
              Senha
            </label>
            <div class="password-input-container" style="position: relative;">
              <input
                id="password"
                v-model="form.senha"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                :class="{ error: errors.senha }"
                placeholder="Digite sua senha"
                required
                autocomplete="current-password"
              >
              <button
                type="button"
                class="password-toggle"
                @click="togglePassword"
                style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--color-gray); cursor: pointer;"
              >
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
            <div v-if="errors.senha" class="form-error">
              {{ errors.senha }}
            </div>
          </div>
          
          <div class="form-group">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.rememberMe"
                type="checkbox"
                style="margin: 0;"
              >
              <span class="text-sm text-gray">Lembrar de mim</span>
            </label>
          </div>
          
          <button
            type="submit"
            class="btn btn-primary btn-lg w-full"
            :disabled="loading"
          >
            <div v-if="loading" class="loading"></div>
            <i v-else class="fas fa-sign-in-alt"></i>
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>
      </div>
      
      <div class="card-footer text-center">
        <p class="text-sm text-gray">
          Problemas para acessar? 
          <a href="#" class="text-secondary font-medium">Contate o administrador</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    // Estado do formulário
    const form = reactive({
      email: '',
      senha: '',
      rememberMe: false
    })
    
    const errors = ref({})
    const loading = ref(false)
    const error = ref('')
    const showPassword = ref(false)
    
    // Validar formulário
    const validateForm = () => {
      errors.value = {}
      
      if (!form.email) {
        errors.value.email = 'Email é obrigatório'
      } else if (!/\S+@\S+\.\S+/.test(form.email)) {
        errors.value.email = 'Email inválido'
      }
      
      if (!form.senha) {
        errors.value.senha = 'Senha é obrigatória'
      } else if (form.senha.length < 6) {
        errors.value.senha = 'Senha deve ter pelo menos 6 caracteres'
      }
      
      return Object.keys(errors.value).length === 0
    }
    
    // Submeter formulário
    const handleSubmit = async () => {
      if (!validateForm()) return
      
      loading.value = true
      error.value = ''
      
      try {
        console.log('🔐 Tentando fazer login...')
        const result = await authStore.login({
          email: form.email,
          senha: form.senha
        })
        
        console.log('🔐 Resultado do login:', result)
        console.log('🔐 Usuário após login:', authStore.user)
        
        if (result.success) {
          // Login bem-sucedido, redirecionar
          console.log('🔐 Login bem-sucedido, redirecionando...')
          router.push('/dashboard')
        } else {
          error.value = result.message || 'Erro no login'
        }
      } catch (err) {
        console.error('🔐 Erro no login:', err)
        error.value = 'Erro inesperado. Tente novamente.'
      } finally {
        loading.value = false
      }
    }
    
    // Alternar visibilidade da senha
    const togglePassword = () => {
      showPassword.value = !showPassword.value
    }
    
    return {
      form,
      errors,
      loading,
      error,
      showPassword,
      handleSubmit,
      togglePassword
    }
  }
}
</script>

<style scoped>
.login-container {
  background: linear-gradient(135deg, var(--color-light) 0%, var(--color-light-gray) 100%);
}

.login-card {
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo i {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.password-input-container {
  position: relative;
}

.password-toggle:hover {
  color: var(--color-primary) !important;
}

.form-input:focus + .password-toggle {
  color: var(--color-secondary) !important;
}

/* Responsividade */
@media (max-width: 768px) {
  .login-container {
    padding: var(--spacing-md);
  }
  
  .login-card {
    margin: 0;
  }
  
  .card-header h1 {
    font-size: var(--font-size-xl);
  }
}
</style>
