<template>
  <div class="register-page">
    <div class="register-container">
      <!-- Área esquerda - Welcome Section -->
      <div class="welcome-section">
        <div class="welcome-content">
          <div class="logo-container-welcome">
            <img src="/UpKeep.png" alt="UpKeep Pró 1.0" class="logo-image-welcome">
          </div>
          <h1 class="welcome-title">CADASTRE-SE</h1>
          <h2 class="welcome-subtitle">SISTEMA DE MANUTENÇÃO</h2>
          <p class="welcome-description">
            Crie sua conta e tenha acesso completo ao sistema de gerenciamento de manutenção.
          </p>
        </div>
      </div>

      <!-- Área direita - Register Form -->
      <div class="form-section">
        <div class="form-card">
          <h2 class="form-title">Criar conta</h2>
          <p class="form-subtitle">Preencha os dados para se cadastrar</p>
          
          <!-- Alerta de erro -->
          <div v-if="error" class="alert alert-error">
            <i class="fas fa-exclamation-circle"></i>
            {{ error }}
          </div>
          
          <!-- Formulário de cadastro -->
          <form @submit.prevent="handleSubmit" class="register-form">
            <div class="form-group">
              <input
                id="nome"
                v-model="form.nome"
                type="text"
                class="form-input"
                :class="{ error: errors.nome }"
                placeholder="Nome completo"
                required
                autocomplete="name"
              >
              <div v-if="errors.nome" class="form-error">
                {{ errors.nome }}
              </div>
            </div>

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
                  id="senha"
                  v-model="form.senha"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-input"
                  :class="{ error: errors.senha }"
                  placeholder="Senha"
                  required
                  autocomplete="new-password"
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
              <div class="password-input-container">
                <input
                  id="confirmarSenha"
                  v-model="form.confirmarSenha"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  class="form-input"
                  :class="{ error: errors.confirmarSenha }"
                  placeholder="Confirmar senha"
                  required
                  autocomplete="new-password"
                >
                <button
                  type="button"
                  class="password-toggle"
                  @click="toggleConfirmPassword"
                >
                  {{ showConfirmPassword ? 'HIDE' : 'SHOW' }}
                </button>
              </div>
              <div v-if="errors.confirmarSenha" class="form-error">
                {{ errors.confirmarSenha }}
              </div>
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="form.acceptTerms"
                  type="checkbox"
                  class="form-checkbox"
                  required
                >
                <span>
                  Aceito os 
                  <a href="#" class="terms-link">termos de uso</a> 
                  e 
                  <a href="#" class="privacy-link">política de privacidade</a>
                </span>
              </label>
              <div v-if="errors.acceptTerms" class="form-error">
                {{ errors.acceptTerms }}
              </div>
            </div>
            
            <button
              type="submit"
              class="btn-submit"
              :disabled="loading"
            >
              <div v-if="loading" class="loading-spinner"></div>
              {{ loading ? 'Criando conta...' : 'Criar conta' }}
            </button>
          </form>
          
          <!-- Links de navegação -->
          <div class="navigation-links">
            <span>Já tem uma conta?</span>
            <a href="#" @click="goToLogin" class="login-link">Fazer login</a>
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
  name: 'Register',
  setup() {
    const router = useRouter()
    
    // Estado do formulário
    const form = reactive({
      nome: '',
      email: '',
      senha: '',
      confirmarSenha: '',
      acceptTerms: false
    })
    
    const errors = ref({})
    const loading = ref(false)
    const error = ref('')
    const showPassword = ref(false)
    const showConfirmPassword = ref(false)
    
    // Validar formulário
    const validateForm = () => {
      errors.value = {}
      
      if (!form.nome) {
        errors.value.nome = 'Nome é obrigatório'
      } else if (form.nome.length < 2) {
        errors.value.nome = 'Nome deve ter pelo menos 2 caracteres'
      }
      
      if (!form.email) {
        errors.value.email = 'Email é obrigatório'
      } else if (!/\S+@\S+\.\S+/.test(form.email)) {
        errors.value.email = 'Email inválido'
      }
      
      if (!form.senha) {
        errors.value.senha = 'Senha é obrigatória'
      } else if (form.senha.length < 6) {
        errors.value.senha = 'Senha deve ter pelo menos 6 caracteres'
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.senha)) {
        errors.value.senha = 'Senha deve conter ao menos uma letra minúscula, maiúscula e um número'
      }
      
      if (!form.confirmarSenha) {
        errors.value.confirmarSenha = 'Confirmação de senha é obrigatória'
      } else if (form.senha !== form.confirmarSenha) {
        errors.value.confirmarSenha = 'Senhas não coincidem'
      }
      
      if (!form.acceptTerms) {
        errors.value.acceptTerms = 'Você deve aceitar os termos de uso'
      }
      
      return Object.keys(errors.value).length === 0
    }
    
    // Submeter formulário
    const handleSubmit = async () => {
      if (!validateForm()) return
      
      loading.value = true
      error.value = ''
      
      try {
        console.log('📝 Tentando cadastrar usuário...')
        const response = await fetch('/api/auth/public-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: form.nome,
            email: form.email,
            senha: form.senha
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          console.log('📝 Usuário cadastrado com sucesso!')
          router.push(`/login?message=${encodeURIComponent(result.message)}`)
        } else {
          error.value = result.message || 'Erro ao criar conta'
        }
        
      } catch (err) {
        console.error('📝 Erro no cadastro:', err)
        error.value = 'Erro ao criar conta. Tente novamente.'
      } finally {
        loading.value = false
      }
    }
    
    // Alternar visibilidade das senhas
    const togglePassword = () => {
      showPassword.value = !showPassword.value
    }
    
    const toggleConfirmPassword = () => {
      showConfirmPassword.value = !showConfirmPassword.value
    }
    
    // Navegação
    const goToLogin = () => {
      router.push('/login')
    }
    
    return {
      form,
      errors,
      loading,
      error,
      showPassword,
      showConfirmPassword,
      handleSubmit,
      togglePassword,
      toggleConfirmPassword,
      goToLogin
    }
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.register-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  max-width: 1000px;
  min-height: 700px;
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
  width: 306px;
  height: 306px;
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
  max-width: 320px;
}

/* Seção Form (Direita) */
.form-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: white;
  overflow-y: auto;
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

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
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
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.password-toggle:hover {
  color: #357ABD;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #6C757D;
  line-height: 1.4;
}

.form-checkbox {
  margin: 0;
  margin-top: 0.2rem;
  accent-color: #4A90E2;
  flex-shrink: 0;
}

.terms-link, .privacy-link {
  color: #4A90E2;
  text-decoration: none;
}

.terms-link:hover, .privacy-link:hover {
  text-decoration: underline;
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
  text-align: center;
  margin-top: 2rem;
  font-size: 0.9rem;
  color: #6C757D;
}

.login-link {
  color: #4A90E2;
  text-decoration: none;
  font-weight: 600;
  margin-left: 0.5rem;
}

.login-link:hover {
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
  .register-container {
    grid-template-columns: 1fr;
    min-height: 100vh;
    height: auto;
  }
  
  .welcome-section {
    padding: 3rem 2rem;
    min-height: 40vh;
  }
  
  .form-section {
    padding: 2rem;
  }
}

@media (max-width: 768px) {
  .register-page {
    padding: 1rem;
  }
  
  .register-container {
    border-radius: 12px;
  }
  
  .welcome-section, .form-section {
    padding: 2rem 1.5rem;
  }
  
  .welcome-title {
    font-size: 1.8rem;
  }
  
  .welcome-subtitle {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .register-form {
    gap: 1rem;
  }
  
  .form-title {
    font-size: 1.7rem;
  }
}
</style>