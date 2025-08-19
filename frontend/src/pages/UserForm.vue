<template>
  <div class="user-form-page">
    <header class="page-header">
      <h1>{{ isEdit ? 'Editar Usuário' : 'Novo Usuário' }}</h1>
      <button class="btn btn-outline" @click="$router.push('/users')">
        Voltar
      </button>
    </header>

    <div class="form-container">
      <form @submit.prevent="submitForm" class="user-form">
        <div class="form-group">
          <label for="nome">Nome *</label>
          <input
            id="nome"
            v-model="form.nome"
            type="text"
            class="form-input"
            required
            placeholder="Nome completo do usuário"
          />
        </div>

        <div class="form-group">
          <label for="email">Email *</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-input"
            :class="{ 'error': emailError }"
            required
            placeholder="email@exemplo.com"
            @blur="validateEmail"
          />
          <span v-if="emailError" class="error-message">{{ emailError }}</span>
        </div>

        <div class="form-group" v-if="!isEdit">
          <label for="senha">Senha *</label>
          <input
            id="senha"
            v-model="form.senha"
            type="password"
            class="form-input"
            :class="{ 'error': passwordError }"
            required
            placeholder="Mínimo 6 caracteres"
            minlength="6"
            @input="validatePassword"
          />
          <div class="password-strength" v-if="form.senha">
            <div class="strength-bar">
              <div 
                class="strength-fill" 
                :class="passwordStrength.class"
                :style="{ width: passwordStrength.width }"
              ></div>
            </div>
            <span class="strength-text" :class="passwordStrength.class">
              {{ passwordStrength.text }}
            </span>
          </div>
          <span v-if="passwordError" class="error-message">{{ passwordError }}</span>
        </div>

        <div class="form-group">
          <label for="perfil">Perfil *</label>
          <select id="perfil" v-model="form.perfil" class="form-select" required>
            <option value="">Selecione o perfil</option>
            <option value="solicitante">Solicitante</option>
            <option value="tecnico">Técnico</option>
            <option value="supervisor" v-if="canAssignSupervisor">Supervisor</option>
            <option value="administrador" v-if="canAssignAdmin">Administrador</option>
          </select>
        </div>

        <div class="form-group">
          <label for="departamento">Departamento</label>
          <select 
            id="departamento" 
            v-model="form.department_id" 
            class="form-select"
          >
            <option value="">Selecione um departamento</option>
            <option 
              v-for="dept in departments" 
              :key="dept.id" 
              :value="dept.id"
            >
              {{ dept.nome }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="telefone">Telefone</label>
          <input
            id="telefone"
            v-model="form.telefone"
            type="tel"
            class="form-input"
            placeholder="(11) 99999-9999"
            @input="formatPhone"
          />
        </div>

        <div class="form-group" v-if="isEdit && canChangeStatus">
          <label class="checkbox-label">
            <input
              v-model="form.ativo"
              type="checkbox"
              class="form-checkbox"
            />
            <span>Usuário ativo</span>
          </label>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-outline" @click="$router.push('/users')">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            <i v-else :class="isEdit ? 'fas fa-save' : 'fas fa-plus'"></i>
            {{ loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { success, error } = useToast()

const form = ref({
  nome: '',
  email: '',
  senha: '',
  perfil: '',
  department_id: '',
  telefone: '',
  ativo: true
})

const loading = ref(false)
const emailError = ref('')
const passwordError = ref('')
const departments = ref([])

const isEdit = computed(() => !!route.params.id)

const passwordStrength = computed(() => {
  const password = form.value.senha
  if (!password) return { width: '0%', class: '', text: '' }

  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) {
    return { width: '33%', class: 'weak', text: 'Fraca' }
  } else if (score <= 4) {
    return { width: '66%', class: 'medium', text: 'Média' }
  } else {
    return { width: '100%', class: 'strong', text: 'Forte' }
  }
})

const canAssignSupervisor = computed(() => {
  return authStore.user?.perfil === 'administrador'
})

const canAssignAdmin = computed(() => {
  return authStore.user?.perfil === 'administrador'
})

const canChangeStatus = computed(() => {
  return authStore.user?.perfil === 'administrador'
})

const loadDepartments = async () => {
  try {
    console.log('Carregando departamentos...')
    const response = await api.get('/public/departments/active')
    console.log('Resposta dos departamentos:', response.data)
    departments.value = response.data.data.departments
    console.log('Departamentos carregados:', departments.value)
  } catch (error) {
    console.error('Erro ao carregar departamentos:', error)
    useToast().error('Erro ao carregar departamentos')
  }
}

const loadUser = async () => {
  if (!isEdit.value) return

  try {
    loading.value = true
    const response = await api.get(`/users/${route.params.id}`)
    if (response.data.success) {
      const user = response.data.data.user
      form.value = {
        nome: user.nome,
        email: user.email,
        senha: '', // Não carregar senha existente
        perfil: user.perfil,
        department_id: user.department_id || '',
        telefone: user.telefone || '',
        ativo: user.ativo
      }
    }
  } catch (err) {
    console.error('Erro ao carregar usuário:', err)
    error('Erro ao carregar usuário', 'Não foi possível carregar os dados do usuário')
    router.push('/users')
  } finally {
    loading.value = false
  }
}

const submitForm = async () => {
  try {
    // Validar antes de enviar
    validateEmail()
    if (!isEdit.value) {
      validatePassword()
    }
    
    // Verificar se há erros
    if (emailError.value || passwordError.value) {
      error('Formulário inválido', 'Por favor, corrija os erros no formulário')
      return
    }

    loading.value = true

    const data = {
      nome: form.value.nome.trim(),
      email: form.value.email.trim().toLowerCase(),
      perfil: form.value.perfil,
      department_id: form.value.department_id || null,
      telefone: form.value.telefone?.trim()
    }

    if (!isEdit.value) {
      data.senha = form.value.senha
    }

    if (isEdit.value && canChangeStatus.value) {
      data.ativo = form.value.ativo
    }

    let response
    if (isEdit.value) {
      response = await api.put(`/users/${route.params.id}`, data)
    } else {
      response = await api.post('/users', data)
    }

    if (response.data.success) {
      success(
        `Usuário ${isEdit.value ? 'atualizado' : 'criado'}`,
        `${form.value.nome} foi ${isEdit.value ? 'atualizado' : 'criado'} com sucesso`
      )
      router.push('/users')
    }
  } catch (err) {
    console.error('Erro ao salvar usuário:', err)
    const message = err.response?.data?.message || 'Erro ao salvar usuário'
    error('Erro ao salvar', message)
  } finally {
    loading.value = false
  }
}

const formatPhone = (event) => {
  let value = event.target.value.replace(/\D/g, '')
  
  if (value.length > 0) {
    if (value.length <= 2) {
      value = `(${value}`
    } else if (value.length <= 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`
    } else if (value.length <= 10) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`
    } else {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`
    }
  }
  
  form.value.telefone = value
}

const validateEmail = () => {
  const email = form.value.email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (email && !emailRegex.test(email)) {
    emailError.value = 'Email inválido'
  } else {
    emailError.value = ''
  }
}

const validatePassword = () => {
  const password = form.value.senha
  
  if (password && password.length < 6) {
    passwordError.value = 'Senha deve ter pelo menos 6 caracteres'
  } else {
    passwordError.value = ''
  }
}

onMounted(async () => {
  await loadDepartments()
  await loadUser()
})
</script>

<style scoped>
.user-form-page {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  color: var(--primary-color);
  font-size: 2rem;
  margin: 0;
}

.form-container {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
}

.user-form {
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

.form-input,
.form-select {
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--secondary-color);
}

.form-input.error {
  border-color: #d32f2f;
  background-color: #fff5f5;
}

.error-message {
  color: #d32f2f;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.password-strength {
  margin-top: 0.5rem;
}

.strength-bar {
  width: 100%;
  height: 4px;
  background-color: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.strength-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.strength-fill.weak {
  background-color: #d32f2f;
}

.strength-fill.medium {
  background-color: #f57c00;
}

.strength-fill.strong {
  background-color: #2e7d32;
}

.strength-text {
  font-size: 0.85rem;
  font-weight: 500;
}

.strength-text.weak {
  color: #d32f2f;
}

.strength-text.medium {
  color: #f57c00;
}

.strength-text.strong {
  color: #2e7d32;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal !important;
  cursor: pointer;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  margin: 0;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #28a745;
  transform: translateY(-1px);
}

.btn-outline {
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.btn-outline:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-1px);
}
</style>
