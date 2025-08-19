<template>
  <div class="modal-overlay" @click="fechar">
    <div class="plano-form" @click.stop>
      <div class="modal-header">
        <h3>{{ isEdicao ? 'Editar Plano Preventivo' : 'Novo Plano Preventivo' }}</h3>
        <button type="button" class="btn-close" @click="fechar">
          <i class="fas fa-times"></i>
        </button>
      </div>

    <form @submit.prevent="salvar" class="plano-form-content">
      <div class="form-group">
        <label for="nome">Nome do Plano *</label>
        <input
          type="text"
          id="nome"
          v-model="form.nome"
          class="form-control"
          required
          placeholder="Digite o nome do plano"
        />
      </div>

      <div class="form-group">
        <label for="descricao">Descrição</label>
        <textarea
          id="descricao"
          v-model="form.descricao"
          class="form-control"
          rows="3"
          placeholder="Descreva as atividades do plano"
        ></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="setor_id">Setor *</label>
          <select
            id="setor_id"
            v-model="form.setor_id"
            class="form-control"
            required
          >
            <option value="">Selecione um setor</option>
            <option 
              v-for="setor in setores" 
              :key="setor.id" 
              :value="setor.id"
            >
              {{ setor.nome }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="responsavel_id">Responsável</label>
          <select
            id="responsavel_id"
            v-model="form.responsavel_id"
            class="form-control"
          >
            <option value="">Selecione um responsável</option>
            <option 
              v-for="user in tecnicos" 
              :key="user.id" 
              :value="user.id"
            >
              {{ user.nome }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="periodicidade">Periodicidade *</label>
          <select
            id="periodicidade"
            v-model="form.periodicidade"
            class="form-control"
            required
          >
            <option value="">Selecione a periodicidade</option>
            <option value="diaria">Diária</option>
            <option value="semanal">Semanal</option>
            <option value="quinzenal">Quinzenal</option>
            <option value="mensal">Mensal</option>
            <option value="bimestral">Bimestral</option>
            <option value="trimestral">Trimestral</option>
            <option value="semestral">Semestral</option>
            <option value="anual">Anual</option>
          </select>
        </div>

        <div class="form-group">
          <label for="prioridade">Prioridade *</label>
          <select
            id="prioridade"
            v-model="form.prioridade"
            class="form-control"
            required
          >
            <option value="">Selecione a prioridade</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="duracao_estimada">Duração Estimada (min)</label>
          <input
            type="number"
            id="duracao_estimada"
            v-model.number="form.duracao_estimada"
            class="form-control"
            min="1"
            placeholder="Duração em minutos"
          />
        </div>

        <div class="form-group">
          <label for="data_inicio">Data de Início</label>
          <input
            type="date"
            id="data_inicio"
            v-model="form.data_inicio"
            class="form-control"
          />
        </div>
      </div>

      <div class="form-group">
        <label for="ativo">Status</label>
        <div class="form-check">
          <input
            type="checkbox"
            id="ativo"
            v-model="form.ativo"
            class="form-check-input"
          />
          <label for="ativo" class="form-check-label">
            Plano Ativo
          </label>
        </div>
      </div>

      <!-- Instruções -->
      <div class="form-group">
        <label for="instrucoes">Instruções Detalhadas</label>
        <textarea
          id="instrucoes"
          v-model="form.instrucoes"
          class="form-control"
          rows="4"
          placeholder="Instruções detalhadas para execução"
        ></textarea>
      </div>

      <!-- Itens de Verificação -->
      <div class="form-group">
        <label>Itens de Verificação</label>
        <div class="checklist-container">
          <div 
            v-for="(item, index) in form.checklist" 
            :key="index"
            class="checklist-item"
          >
            <input
              type="text"
              v-model="item.descricao"
              class="form-control"
              placeholder="Descrição do item"
            />
            <button 
              type="button" 
              class="btn btn-sm btn-danger"
              @click="removerItemChecklist(index)"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <button 
            type="button" 
            class="btn btn-sm btn-secondary"
            @click="adicionarItemChecklist"
          >
            <i class="fas fa-plus"></i>
            Adicionar Item
          </button>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="fechar">
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary" :disabled="salvando">
          <i class="fas fa-save"></i>
          {{ salvando ? 'Salvando...' : 'Salvar' }}
        </button>
      </div>
    </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useToast } from '../composables/useToast'
import api from '../services/api'

export default {
  name: 'PlanoForm',
  props: {
    plano: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const { showToast } = useToast()
    
    const salvando = ref(false)
    const setores = ref([])
    const tecnicos = ref([])
    
    const form = reactive({
      nome: '',
      descricao: '',
      setor_id: '',
      responsavel_id: '',
      periodicidade: '',
      prioridade: '',
      duracao_estimada: null,
      data_inicio: '',
      ativo: true,
      instrucoes: '',
      checklist: []
    })

    const isEdicao = Boolean(props.plano)

    const carregarSetores = async () => {
      try {
        const response = await api.get('/setores')
        setores.value = response.data.data || []
      } catch (error) {
        console.error('Erro ao carregar setores:', error)
      }
    }

    const carregarTecnicos = async () => {
      try {
        const response = await api.get('/users?perfil=tecnico')
        tecnicos.value = response.data.data || []
      } catch (error) {
        console.error('Erro ao carregar técnicos:', error)
      }
    }

    const preencherForm = () => {
      if (props.plano) {
        Object.assign(form, {
          nome: props.plano.nome || '',
          descricao: props.plano.descricao || '',
          setor_id: props.plano.setor_id || '',
          responsavel_id: props.plano.responsavel_id || '',
          periodicidade: props.plano.periodicidade || '',
          prioridade: props.plano.prioridade || '',
          duracao_estimada: props.plano.duracao_estimada || null,
          data_inicio: props.plano.data_inicio ? props.plano.data_inicio.split('T')[0] : '',
          ativo: props.plano.ativo !== false,
          instrucoes: props.plano.instrucoes || '',
          checklist: props.plano.checklist || []
        })
      }
    }

    const adicionarItemChecklist = () => {
      form.checklist.push({
        descricao: '',
        obrigatorio: true
      })
    }

    const removerItemChecklist = (index) => {
      form.checklist.splice(index, 1)
    }

    const salvar = async () => {
      try {
        salvando.value = true

        const dados = {
          ...form,
          checklist: form.checklist.filter(item => item.descricao.trim())
        }

        if (isEdicao) {
          await api.put(`/preventiva/planos/${props.plano.id}`, dados)
          showToast('Plano atualizado com sucesso!', 'success')
        } else {
          await api.post('/preventiva/planos', dados)
          showToast('Plano criado com sucesso!', 'success')
        }

        emit('saved')
        fechar()
      } catch (error) {
        console.error('Erro ao salvar plano:', error)
        showToast(error.response?.data?.message || 'Erro ao salvar plano', 'error')
      } finally {
        salvando.value = false
      }
    }

    const fechar = () => {
      emit('close')
    }

    onMounted(() => {
      carregarSetores()
      carregarTecnicos()
      preencherForm()
      
      // Adicionar pelo menos um item no checklist se for novo
      if (!isEdicao && form.checklist.length === 0) {
        adicionarItemChecklist()
      }
    })

    return {
      form,
      salvando,
      setores,
      tecnicos,
      isEdicao,
      salvar,
      fechar,
      adicionarItemChecklist,
      removerItemChecklist
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.plano-form {
  background: white;
  border-radius: 8px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0 20px;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #999;
  padding: 5px;
}

.btn-close:hover {
  color: #333;
}

.plano-form-content {
  padding: 0 20px 20px 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-check {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-check-input {
  width: auto;
}

.checklist-container {
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 15px;
  background: #f9f9f9;
}

.checklist-item {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.checklist-item:last-child {
  margin-bottom: 15px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #28a745;
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .plano-form {
    max-width: none;
    width: 100%;
  }
  
  .modal-header, .plano-form-content {
    padding: 15px;
  }
}
</style>