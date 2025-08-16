<template>
  <div class="department-form-page">
    <header class="page-header">
      <h1>{{ isEditing ? 'Editar Departamento' : 'Novo Departamento' }}</h1>
      
      <button 
        class="btn btn-secondary" 
        @click="$router.push('/departments')"
      >
        Voltar
      </button>
    </header>

    <div class="form-container">
      <form @submit.prevent="submitForm" class="department-form">
        <div class="form-row">
          <div class="form-group">
            <label for="nome" class="required">Nome do Departamento</label>
            <input
              id="nome"
              v-model="form.nome"
              type="text"
              class="form-input"
              :class="{ error: errors.nome }"
              placeholder="Ex: Tecnologia da Informação"
              maxlength="100"
              required
            >
            <span v-if="errors.nome" class="error-message">{{ errors.nome }}</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="descricao">Descrição</label>
            <textarea
              id="descricao"
              v-model="form.descricao"
              class="form-textarea"
              :class="{ error: errors.descricao }"
              placeholder="Descreva as responsabilidades e atividades do departamento..."
              maxlength="500"
              rows="4"
            ></textarea>
            <span v-if="errors.descricao" class="error-message">{{ errors.descricao }}</span>
            <small class="char-counter">{{ (form.descricao || '').length }}/500 caracteres</small>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="responsavel">Responsável</label>
            <input
              id="responsavel"
              v-model="form.responsavel"
              type="text"
              class="form-input"
              :class="{ error: errors.responsavel }"
              placeholder="Nome do responsável pelo departamento"
              maxlength="100"
            >
            <span v-if="errors.responsavel" class="error-message">{{ errors.responsavel }}</span>
          </div>

          <div class="form-group">
            <label for="localizacao">Localização</label>
            <input
              id="localizacao"
              v-model="form.localizacao"
              type="text"
              class="form-input"
              :class="{ error: errors.localizacao }"
              placeholder="Ex: Andar 2 - Sala 201"
              maxlength="200"
            >
            <span v-if="errors.localizacao" class="error-message">{{ errors.localizacao }}</span>
          </div>
        </div>

        <div v-if="isEditing" class="form-row">
          <div class="form-group">
            <label class="checkbox-label">
              <input
                v-model="form.ativo"
                type="checkbox"
                class="form-checkbox"
              >
              <span class="checkmark"></span>
              Departamento ativo
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button 
            type="button" 
            class="btn btn-outline" 
            @click="$router.push('/departments')"
          >
            Cancelar
          </button>
          
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="loading"
          >
            {{ loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar') }}
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

const loading = ref(false)
const errors = ref({})

const form = ref({
  nome: '',
  descricao: '',
  responsavel: '',
  localizacao: '',
  ativo: true
})

const isEditing = computed(() => !!route.params.id)
const departmentId = computed(() => route.params.id)

const canManageDepartments = computed(() => {
  return authStore.user?.perfil === 'supervisor' || authStore.user?.perfil === 'administrador'
})

const validateForm = () => {
  errors.value = {}

  // Nome é obrigatório
  if (!form.value.nome || form.value.nome.trim().length < 2) {
    errors.value.nome = 'Nome é obrigatório e deve ter pelo menos 2 caracteres'
  } else if (form.value.nome.length > 100) {
    errors.value.nome = 'Nome deve ter no máximo 100 caracteres'
  }

  // Descrição opcional, mas se informada deve ter no máximo 500 caracteres
  if (form.value.descricao && form.value.descricao.length > 500) {
    errors.value.descricao = 'Descrição deve ter no máximo 500 caracteres'
  }

  // Responsável opcional, mas se informado deve ter no máximo 100 caracteres
  if (form.value.responsavel && form.value.responsavel.length > 100) {
    errors.value.responsavel = 'Nome do responsável deve ter no máximo 100 caracteres'
  }

  // Localização opcional, mas se informada deve ter no máximo 200 caracteres
  if (form.value.localizacao && form.value.localizacao.length > 200) {
    errors.value.localizacao = 'Localização deve ter no máximo 200 caracteres'
  }

  return Object.keys(errors.value).length === 0
}

const loadDepartment = async () => {
  if (!isEditing.value) return

  try {
    loading.value = true
    const response = await api.get(`/departments/${departmentId.value}`)
    
    if (response.data.success) {
      const dept = response.data.data.department
      form.value = {
        nome: dept.nome,
        descricao: dept.descricao || '',
        responsavel: dept.responsavel || '',
        localizacao: dept.localizacao || '',
        ativo: dept.ativo
      }
    }
  } catch (err) {
    console.error('Erro ao carregar departamento:', err)
    error('Erro ao carregar', 'Não foi possível carregar os dados do departamento')
    router.push('/departments')
  } finally {
    loading.value = false
  }
}

const submitForm = async () => {
  if (!validateForm()) {
    return
  }

  if (!canManageDepartments.value) {
    error('Sem permissão', 'Você não tem permissão para gerenciar departamentos')
    return
  }

  try {
    loading.value = true

    const data = {
      nome: form.value.nome.trim(),
      descricao: form.value.descricao?.trim() || null,
      responsavel: form.value.responsavel?.trim() || null,
      localizacao: form.value.localizacao?.trim() || null,
      ativo: form.value.ativo
    }

    let response
    if (isEditing.value) {
      response = await api.put(`/departments/${departmentId.value}`, data)
    } else {
      response = await api.post('/departments', data)
    }

    if (response.data.success) {
      success(
        isEditing.value ? 'Departamento atualizado' : 'Departamento criado',
        isEditing.value ? 'Departamento atualizado com sucesso' : 'Departamento criado com sucesso'
      )
      router.push('/departments')
    }

  } catch (err) {
    console.error('Erro ao salvar departamento:', err)
    
    if (err.response?.status === 409) {
      errors.value.nome = 'Já existe um departamento com este nome'
    } else if (err.response?.status === 400) {
      const serverErrors = err.response.data.errors || {}
      errors.value = { ...errors.value, ...serverErrors }
    } else {
      error(
        'Erro ao salvar',
        isEditing.value ? 'Não foi possível atualizar o departamento' : 'Não foi possível criar o departamento'
      )
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Verificar permissões
  if (!canManageDepartments.value) {
    error('Sem permissão', 'Você não tem permissão para acessar esta página')
    router.push('/departments')
    return
  }

  // Carregar dados se for edição
  if (isEditing.value) {
    loadDepartment()
  }
})
</script>

<style scoped>
.department-form-page {
  padding: 2rem;
  max-width: 800px;
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

.department-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  min-width: 250px;
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.form-group label.required::after {
  content: ' *';
  color: #d32f2f;
}

.form-input,
.form-textarea {
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-input.error,
.form-textarea.error {
  border-color: #d32f2f;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: 500;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.error-message {
  color: #d32f2f;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.char-counter {
  color: var(--text-secondary);
  font-size: 0.75rem;
  margin-top: 0.25rem;
  align-self: flex-end;
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
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 120px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-secondary {
  background: var(--secondary-color);
  color: white;
}

.btn-secondary:hover {
  background: var(--secondary-hover);
}

.btn-outline {
  background: transparent;
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.btn-outline:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

@media (max-width: 768px) {
  .department-form-page {
    padding: 1rem;
  }
  
  .form-container {
    padding: 1.5rem;
  }
  
  .form-row {
    flex-direction: column;
  }
  
  .form-group {
    min-width: unset;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>