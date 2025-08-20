<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Área esquerda - Welcome Section -->
      <div class="welcome-section">
        <div class="welcome-content">
          <div class="logo-container-welcome">
            <img src="/UpKeep.png" alt="UpKeep Pró 1.0" class="logo-image-welcome">
          </div>
          <h1 class="welcome-title">BEM-VINDO</h1>
          <h2 class="welcome-subtitle">SISTEMA DE MANUTENÇÃO</h2>
          <p class="welcome-description">
            Gerencie suas operações de manutenção de forma eficiente e organizada. 
            Controle ativos, solicitações, estoque e muito mais em uma plataforma integrada.
          </p>
        </div>
      </div>

      <!-- Área direita - Login Form -->
      <div class="login-section">
        <div class="login-card">
          <h2 class="login-title">Login</h2>
          <p class="login-subtitle">Acesse sua conta para continuar</p>
          
          <!-- Alerta de sucesso -->
          <div v-if="successMessage" class="alert alert-success">
            <i class="fas fa-check-circle"></i>
            {{ successMessage }}
          </div>
          
          <!-- Alerta de erro -->
          <div v-if="error" class="alert alert-error">
            <i class="fas fa-exclamation-circle"></i>
            {{ error }}
          </div>
          
          <!-- Formulário de login -->
          <form @submit.prevent="handleSubmit" class="login-form">
            <div class="form-group">
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="form-input"
                :class="{ error: errors.email }"
                placeholder="Email"
                required
                autocomplete="email"
              >
              <div v-if="errors.email" class="form-error">
                {{ errors.email }}
              </div>
            </div>
            
            <div class="form-group">
              <div class="password-input-container">
                <input
                  id="password"
                  v-model="form.senha"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-input"
                  :class="{ error: errors.senha }"
                  placeholder="Senha"
                  required
                  autocomplete="current-password"
                >
                <button
                  type="button"
                  class="password-toggle"
                  @click="togglePassword"
                >
                  {{ showPassword ? 'HIDE' : 'SHOW' }}
                </button>
              </div>
              <div v-if="errors.senha" class="form-error">
                {{ errors.senha }}
              </div>
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="form.rememberMe"
                  type="checkbox"
                  class="form-checkbox"
                >
                <span>Lembrar de mim</span>
              </label>
            </div>
            
            <button
              type="submit"
              class="btn-login"
              :disabled="loading"
            >
              <div v-if="loading" class="loading-spinner"></div>
              {{ loading ? 'Entrando...' : 'Login' }}
            </button>
            
            <div class="login-links">
              <a href="#" @click.prevent="goToForgotPassword" class="forgot-password">Esqueceu a senha?</a>
              <span class="separator">•</span>
              <a href="#" @click.prevent="goToRegister" class="signup-link">Cadastre-se</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const route = useRoute()
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
    const successMessage = ref('')
    const showPassword = ref(false)
    
    // Verificar se há mensagem na query string
    onMounted(() => {
      if (route.query.message) {
        successMessage.value = route.query.message
        // Limpar a query string
        router.replace({ path: '/login' })
      }
    })
    
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
    
    // Navegação
    const goToForgotPassword = () => {
      router.push('/forgot-password')
    }
    
    const goToRegister = () => {
      router.push('/register')
    }
    
    return {
      form,
      errors,
      loading,
      error,
      successMessage,
      showPassword,
      handleSubmit,
      togglePassword,
      goToForgotPassword,
      goToRegister
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.login-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  max-width: 1000px;
  height: 650px;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

/* Seção Welcome (Esquerda) */
.welcome-section {
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 50%, #2C5F91 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  position: relative;
  overflow: hidden;
}

.welcome-section::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: float 6s ease-in-out infinite;
}

.welcome-section::after {
  content: '';
  position: absolute;
  bottom: -20%;
  right: -20%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 50%);
  animation: float 8s ease-in-out infinite reverse;
}

.welcome-content {
  position: relative;
  z-index: 1;
  color: white;
  text-align: center;
}

.logo-container-welcome {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo-image-welcome {
  width: 280px;
  height: 280px;
  object-fit: contain;
  opacity: 1;
}

.welcome-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.3rem;
  letter-spacing: 2px;
  text-shadow: none;
}

.welcome-subtitle {
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 2rem;
  letter-spacing: 1px;
  opacity: 1;
  color: white;
}

.welcome-description {
  font-size: 1rem;
  line-height: 1.6;
  opacity: 1;
  color: white;
  max-width: 400px;
}

/* Seção Login (Direita) */
.login-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  background: white;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.login-title {
  font-size: 2rem;
  font-weight: 600;
  color: #2C3E50;
  margin-bottom: 0.5rem;
  text-align: center;
}

.login-subtitle {
  font-size: 1rem;
  color: #6C757D;
  margin-bottom: 2rem;
  text-align: center;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-input {
  padding: 1rem;
  border: 2px solid #E9ECEF;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s;
  background: #F8F9FA;
}

.form-input:focus {
  outline: none;
  border-color: #4A90E2;
  background: white;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.form-input.error {
  border-color: #E74C3C;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #6C757D;
}

.form-checkbox {
  margin: 0;
  accent-color: #4A90E2;
}

.password-input-container {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #4A90E2;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.password-toggle:hover {
  color: #357ABD;
}

.btn-login {
  padding: 1rem;
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-login:hover:not(:disabled) {
  background: linear-gradient(135deg, #357ABD 0%, #2C5F91 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(74, 144, 226, 0.3);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.login-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  font-size: 0.9rem;
}

.separator {
  color: #DEE2E6;
  font-weight: bold;
}

.forgot-password {
  color: #4A90E2;
  text-decoration: none;
  font-weight: 500;
}

.forgot-password:hover {
  text-decoration: underline;
}

.signup-link {
  color: #4A90E2;
  text-decoration: none;
  font-weight: 600;
}

.signup-link:hover {
  text-decoration: underline;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.alert-success {
  background: #F0F9FF;
  color: #059669;
  border: 1px solid #A7F3D0;
}

.alert-error {
  background: #FDF2F2;
  color: #E74C3C;
  border: 1px solid #F5C6CB;
}

.form-error {
  color: #E74C3C;
  font-size: 0.85rem;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsividade */
@media (max-width: 1024px) {
  .login-container {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 100vh;
  }
  
  .welcome-section {
    padding: 3rem 2rem;
    min-height: 40vh;
  }
  
  .welcome-title {
    font-size: 2.5rem;
  }
  
  .welcome-subtitle {
    font-size: 1.2rem;
  }
}

@media (max-width: 768px) {
  .login-page {
    padding: 1rem;
  }
  
  .login-container {
    border-radius: 12px;
  }
  
  .welcome-section {
    padding: 2rem 1.5rem;
    text-align: center;
  }
  
  .login-section {
    padding: 2rem 1.5rem;
  }
  
  .welcome-title {
    font-size: 2rem;
  }
  
  .welcome-description {
    max-width: none;
  }
}

@media (max-width: 480px) {
  .login-links {
    flex-direction: column;
    gap: 0.8rem;
    margin-top: 1rem;
  }
  
  .separator {
    display: none;
  }
  
  .welcome-title {
    font-size: 1.8rem;
  }
  
  .welcome-subtitle {
    font-size: 1rem;
  }
}

/* Animações */
@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}
</style>