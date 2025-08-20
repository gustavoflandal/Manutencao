<template>
  <div class="forgot-password-page">
    <div class="forgot-password-container">
      <!-- Área esquerda - Welcome Section -->
      <div class="welcome-section">
        <div class="welcome-content">
          <div class="logo-container-welcome">
            <img src="/UpKeep.png" alt="UpKeep Pró 1.0" class="logo-image-welcome">
          </div>
          <h1 class="welcome-title">RECUPERAÇÃO</h1>
          <h2 class="welcome-subtitle">DE SENHA</h2>
          <p class="welcome-description">
            Digite seu email para receber as instruções de recuperação de senha.
          </p>
        </div>
      </div>

      <!-- Área direita - Forgot Password Form -->
      <div class="form-section">
        <div class="form-card">
          <h2 class="form-title">Esqueceu a senha?</h2>
          <p class="form-subtitle">Digite seu email para recuperar sua conta</p>
          
          <!-- Alerta de sucesso -->
          <div v-if="success" class="alert alert-success">
            <i class="fas fa-check-circle"></i>
            {{ successMessage }}
          </div>
          
          <!-- Alerta de erro -->
          <div v-if="error" class="alert alert-error">
            <i class="fas fa-exclamation-circle"></i>
            {{ error }}
          </div>
          
          <!-- Formulário de recuperação -->
          <form @submit.prevent="handleSubmit" class="forgot-form" v-if="!success">
            <div class="form-group">
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
            
            <button
              type="submit"
              class="btn-submit"
              :disabled="loading"
            >
              <div v-if="loading" class="loading-spinner"></div>
              {{ loading ? 'Enviando...' : 'Enviar instruções' }}
            </button>
          </form>
          
          <!-- Links de navegação -->
          <div class="navigation-links">
            <a href="#" @click="goToLogin" class="back-link">
              <i class="fas fa-arrow-left"></i>
              Voltar ao login
            </a>
            <span class="separator">•</span>
            <a href="#" @click="goToRegister" class="register-link">Criar conta</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'ForgotPassword',
  setup() {
    const router = useRouter()
    
    // Estado do formulário
    const form = reactive({
      email: ''
    })
    
    const errors = ref({})
    const loading = ref(false)
    const error = ref('')
    const success = ref(false)
    const successMessage = ref('')
    
    // Validar formulário
    const validateForm = () => {
      errors.value = {}
      
      if (!form.email) {
        errors.value.email = 'Email é obrigatório'
      } else if (!/\S+@\S+\.\S+/.test(form.email)) {
        errors.value.email = 'Email inválido'
      }
      
      return Object.keys(errors.value).length === 0
    }
    
    // Submeter formulário
    const handleSubmit = async () => {
      if (!validateForm()) return
      
      loading.value = true
      error.value = ''
      
      try {
        console.log('🔑 Tentando recuperar senha...')
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email })
        })
        
        const result = await response.json()
        
        if (result.success) {
          success.value = true
          successMessage.value = result.message
        } else {
          error.value = result.message || 'Erro ao enviar instruções'
        }
        
      } catch (err) {
        console.error('🔑 Erro na recuperação:', err)
        error.value = 'Erro ao enviar instruções. Tente novamente.'
      } finally {
        loading.value = false
      }
    }
    
    // Navegação
    const goToLogin = () => {
      router.push('/login')
    }
    
    const goToRegister = () => {
      router.push('/register')
    }
    
    return {
      form,
      errors,
      loading,
      error,
      success,
      successMessage,
      handleSubmit,
      goToLogin,
      goToRegister
    }
  }
}
</script>

<style scoped>
.forgot-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.forgot-password-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  max-width: 900px;
  height: 600px;
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
  padding: 4rem;
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
  background: 
    radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(1deg); }
}

.welcome-content {
  position: relative;
  z-index: 1;
  color: white;
  text-align: center;
}

.logo-container-welcome {
  margin-bottom: 2rem;
}

.logo-image-welcome {
  width: 340px;
  height: 340px;
  object-fit: contain;
  opacity: 0.95;
}

.welcome-title {
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  letter-spacing: 1.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.welcome-subtitle {
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  letter-spacing: 0.8px;
  opacity: 0.95;
  color: #E8F4FD;
}

.welcome-description {
  font-size: 0.95rem;
  line-height: 1.5;
  opacity: 0.9;
  color: #E8F4FD;
  max-width: 300px;
}

/* Seção Form (Direita) */
.form-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  background: white;
}

.form-card {
  width: 100%;
  max-width: 400px;
}

.form-title {
  font-size: 2rem;
  font-weight: 600;
  color: #2C3E50;
  margin-bottom: 0.5rem;
  text-align: center;
}

.form-subtitle {
  font-size: 1rem;
  color: #6C757D;
  margin-bottom: 2rem;
  text-align: center;
}

.forgot-form {
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

.btn-submit {
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

.btn-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #357ABD 0%, #2C5F91 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(74, 144, 226, 0.3);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.navigation-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  font-size: 0.9rem;
}

.separator {
  color: #DEE2E6;
  font-weight: bold;
}

.back-link, .register-link {
  color: #4A90E2;
  text-decoration: none;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.back-link:hover, .register-link:hover {
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
  .forgot-password-container {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 100vh;
  }
  
  .welcome-section {
    padding: 3rem 2rem;
    min-height: 40vh;
  }
}

@media (max-width: 768px) {
  .forgot-password-page {
    padding: 1rem;
  }
  
  .forgot-password-container {
    border-radius: 12px;
  }
  
  .welcome-section, .form-section {
    padding: 2rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .navigation-links {
    flex-direction: column;
    gap: 0.8rem;
  }
  
  .separator {
    display: none;
  }
}
</style>