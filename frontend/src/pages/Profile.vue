<template>
  <div class="profile-page">
    <header class="page-header">
      <h1>Meu Perfil</h1>
    </header>

    <div class="profile-content">
      <div class="profile-info">
        <div class="info-card">
          <h2>Informações Pessoais</h2>
          <form @submit.prevent="updateProfile" class="profile-form">
            <div class="form-group">
              <label for="nome">Nome</label>
              <input
                id="nome"
                v-model="form.nome"
                type="text"
                class="form-input"
                required
              />
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="form-input"
                required
              />
            </div>

            <div class="form-group">
              <label for="departamento">Departamento</label>
              <input
                id="departamento"
                v-model="form.departamento"
                type="text"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="telefone">Telefone</label>
              <input
                id="telefone"
                v-model="form.telefone"
                type="tel"
                class="form-input"
              />
            </div>

            <button type="submit" class="btn btn-primary" :disabled="loadingProfile">
              {{ loadingProfile ? 'Salvando...' : 'Salvar Alterações' }}
            </button>
          </form>
        </div>

        <div class="info-card">
          <h2>Alterar Senha</h2>
          <form @submit.prevent="changePassword" class="password-form">
            <div class="form-group">
              <label for="senhaAtual">Senha Atual</label>
              <input
                id="senhaAtual"
                v-model="passwordForm.senhaAtual"
                type="password"
                class="form-input"
                required
              />
            </div>

            <div class="form-group">
              <label for="novaSenha">Nova Senha</label>
              <input
                id="novaSenha"
                v-model="passwordForm.novaSenha"
                type="password"
                class="form-input"
                required
                minlength="6"
              />
            </div>

            <div class="form-group">
              <label for="confirmarSenha">Confirmar Nova Senha</label>
              <input
                id="confirmarSenha"
                v-model="passwordForm.confirmarSenha"
                type="password"
                class="form-input"
                required
                minlength="6"
              />
            </div>

            <button type="submit" class="btn btn-secondary" :disabled="loadingPassword">
              {{ loadingPassword ? 'Alterando...' : 'Alterar Senha' }}
            </button>
          </form>
        </div>
      </div>

      <div class="profile-details">
        <div class="detail-card">
          <h3>Detalhes da Conta</h3>
          <div class="detail-item">
            <strong>Perfil:</strong>
            <span class="role-badge" :class="authStore.user?.perfil">
              {{ getRoleLabel(authStore.user?.perfil) }}
            </span>
          </div>
          <div class="detail-item">
            <strong>Status:</strong>
            <span class="status-badge active">Ativo</span>
          </div>
          <div class="detail-item">
            <strong>Último Login:</strong>
            <span>{{ formatDate(authStore.user?.ultimo_login) }}</span>
          </div>
          <div class="detail-item">
            <strong>Conta Criada:</strong>
            <span>{{ formatDate(authStore.user?.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuthStore()

const form = ref({
  nome: '',
  email: '',
  departamento: '',
  telefone: ''
})

const passwordForm = ref({
  senhaAtual: '',
  novaSenha: '',
  confirmarSenha: ''
})

const loadingProfile = ref(false)
const loadingPassword = ref(false)

const getRoleLabel = (role) => {
  const labels = {
    'solicitante': 'Solicitante',
    'tecnico': 'Técnico',
    'supervisor': 'Supervisor',
    'administrador': 'Administrador'
  }
  return labels[role] || role
}

const formatDate = (dateString) => {
  if (!dateString) return 'Nunca'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadProfile = async () => {
  try {
    const response = await api.get('/users/profile')
    if (response.data.success) {
      const user = response.data.data.user
      form.value = {
        nome: user.nome,
        email: user.email,
        departamento: user.departamento || '',
        telefone: user.telefone || ''
      }
    }
  } catch (error) {
    console.error('Erro ao carregar perfil:', error)
  }
}

const updateProfile = async () => {
  try {
    loadingProfile.value = true
    const response = await api.put('/users/profile', form.value)
    
    if (response.data.success) {
      // Atualizar dados no store
      await authStore.verifyToken()
      alert('Perfil atualizado com sucesso!')
    }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    const message = error.response?.data?.message || 'Erro ao atualizar perfil'
    alert(message)
  } finally {
    loadingProfile.value = false
  }
}

const changePassword = async () => {
  if (passwordForm.value.novaSenha !== passwordForm.value.confirmarSenha) {
    alert('As senhas não coincidem')
    return
  }

  try {
    loadingPassword.value = true
    const data = {
      senhaAtual: passwordForm.value.senhaAtual,
      novaSenha: passwordForm.value.novaSenha
    }
    
    const response = await api.post('/auth/change-password', data)
    
    if (response.data.success) {
      alert('Senha alterada com sucesso!')
      passwordForm.value = {
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
      }
    }
  } catch (error) {
    console.error('Erro ao alterar senha:', error)
    const message = error.response?.data?.message || 'Erro ao alterar senha'
    alert(message)
  } finally {
    loadingPassword.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  color: var(--primary-color);
  font-size: 2rem;
  margin: 0;
}

.profile-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.info-card,
.detail-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
}

.info-card h2,
.detail-card h3 {
  color: var(--primary-color);
  font-size: 1.4rem;
  margin: 0 0 1.5rem 0;
}

.profile-form,
.password-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: var(--primary-color);
  font-size: 0.95rem;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--secondary-color);
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--secondary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--secondary-hover);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--primary-color);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item strong {
  color: var(--primary-color);
  font-weight: 600;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: capitalize;
}

.role-badge.solicitante {
  background: #e3f2fd;
  color: #1976d2;
}

.role-badge.tecnico {
  background: #f3e5f5;
  color: #7b1fa2;
}

.role-badge.supervisor {
  background: #fff3e0;
  color: #f57c00;
}

.role-badge.administrador {
  background: #ffebee;
  color: #d32f2f;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.active {
  background: #e8f5e8;
  color: #2e7d32;
}

@media (max-width: 768px) {
  .profile-content {
    grid-template-columns: 1fr;
  }
  
  .profile-page {
    padding: 1rem;
  }
}
</style>
