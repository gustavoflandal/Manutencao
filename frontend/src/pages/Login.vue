<template>
  <div class="login-container min-h-screen flex items-center justify-center bg-light">
    <div class="login-card card shadow-xl" style="width: 100%; max-width: 400px;">
      <div class="card-header text-center">
        <div class="logo mb-4">
          <i class="fas fa-tools text-4xl text-primary mb-2"></i>
          <h1 class="text-2xl font-bold text-primary">UpKeep Pró 1.0</h1>
          <p class="text-sm text-gray-600 mt-1">Sistema de Manutenção</p>
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
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 15% 30%, rgba(173, 181, 189, 0.04) 0%, transparent 50%),
    radial-gradient(circle at 85% 70%, rgba(108, 117, 125, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 50% 10%, rgba(173, 181, 189, 0.025) 0%, transparent 50%),
    linear-gradient(45deg, transparent 30%, rgba(173, 181, 189, 0.015) 50%, transparent 70%);
  background-size: 400px 400px, 500px 500px, 300px 300px, 200px 200px;
  animation: backgroundFloat 20s ease-in-out infinite;
  z-index: 0;
}

.login-container::after {
  content: '⚙️';
  position: absolute;
  top: 10%;
  right: 15%;
  font-size: 5rem;
  opacity: 0.015;
  z-index: 0;
  animation: rotate 30s linear infinite;
}

@keyframes backgroundFloat {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-10px) rotate(1deg);
  }
  66% {
    transform: translateY(5px) rotate(-1deg);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.login-card {
  animation: slideUp 0.8s ease-out;
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(173, 181, 189, 0.2);
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.logo i {
  animation: pulse 3s infinite;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

.logo h1 {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
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
