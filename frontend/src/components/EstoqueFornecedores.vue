<template>
  <div class="estoque-fornecedores">
    <div class="section-header">
      <h3>Fornecedores</h3>
      <button class="btn btn-primary" @click="abrirFormulario()">
        <i class="fas fa-plus"></i>
        Novo Fornecedor
      </button>
    </div>

    <!-- Filtros -->
    <div class="filters">
      <div class="filter-group">
        <input
          type="text"
          v-model="filtros.busca"
          class="form-control"
          placeholder="Buscar por nome, CNPJ ou email..."
          @input="aplicarFiltros"
        />
      </div>
      
      <div class="filter-group">
        <select v-model="filtros.status" class="form-control" @change="aplicarFiltros">
          <option value="">Todos os status</option>
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
        </select>
      </div>
    </div>

    <!-- Lista de Fornecedores -->
    <div class="fornecedores-lista">
      <div v-if="carregando" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        Carregando fornecedores...
      </div>

      <div v-else-if="fornecedores.length === 0" class="empty-state">
        <i class="fas fa-truck"></i>
        <h4>Nenhum fornecedor encontrado</h4>
        <p>{{ filtrosAplicados ? 'Tente ajustar os filtros' : 'Cadastre o primeiro fornecedor' }}</p>
      </div>

      <div v-else class="fornecedores-grid">
        <div 
          v-for="fornecedor in fornecedores" 
          :key="fornecedor.id"
          class="fornecedor-card"
          :class="{ 'inativo': !fornecedor.ativo }"
        >
          <div class="fornecedor-header">
            <h5>{{ fornecedor.nome }}</h5>
            <div class="fornecedor-actions">
              <button 
                class="btn-icon" 
                title="Editar"
                @click="editarFornecedor(fornecedor)"
              >
                <i class="fas fa-edit"></i>
              </button>
              <button 
                class="btn-icon" 
                title="Excluir"
                @click="excluirFornecedor(fornecedor)"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <div class="fornecedor-info">
            <p v-if="fornecedor.cnpj" class="cnpj">CNPJ: {{ formatarCNPJ(fornecedor.cnpj) }}</p>
            <p v-if="fornecedor.email" class="email">
              <i class="fas fa-envelope"></i>
              {{ fornecedor.email }}
            </p>
            <p v-if="fornecedor.telefone" class="telefone">
              <i class="fas fa-phone"></i>
              {{ fornecedor.telefone }}
            </p>
            <p v-if="fornecedor.endereco" class="endereco">
              <i class="fas fa-map-marker-alt"></i>
              {{ fornecedor.endereco }}
            </p>
          </div>

          <div class="fornecedor-stats">
            <div class="stat">
              <span class="label">Status:</span>
              <span class="valor" :class="fornecedor.ativo ? 'ativo' : 'inativo'">
                {{ fornecedor.ativo ? 'Ativo' : 'Inativo' }}
              </span>
            </div>
            <div class="stat">
              <span class="label">Itens:</span>
              <span class="valor">{{ fornecedor.total_itens || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Formulário -->
    <div v-if="modalFormulario.aberto" class="modal-overlay" @click="fecharFormulario">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>{{ modalFormulario.editando ? 'Editar' : 'Novo' }} Fornecedor</h4>
          <button class="btn-close" @click="fecharFormulario">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form @submit.prevent="salvarFornecedor">
          <div class="form-group">
            <label for="nome">Nome *</label>
            <input
              type="text"
              id="nome"
              v-model="formulario.nome"
              class="form-control"
              required
              maxlength="100"
            />
          </div>

          <div class="form-group">
            <label for="cnpj">CNPJ</label>
            <input
              type="text"
              id="cnpj"
              v-model="formulario.cnpj"
              class="form-control"
              placeholder="00.000.000/0000-00"
              maxlength="18"
              @input="formatarCNPJInput"
            />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              v-model="formulario.email"
              class="form-control"
              maxlength="100"
            />
          </div>

          <div class="form-group">
            <label for="telefone">Telefone</label>
            <input
              type="text"
              id="telefone"
              v-model="formulario.telefone"
              class="form-control"
              placeholder="(11) 99999-9999"
              maxlength="15"
            />
          </div>

          <div class="form-group">
            <label for="endereco">Endereço</label>
            <textarea
              id="endereco"
              v-model="formulario.endereco"
              class="form-control"
              rows="3"
              maxlength="300"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="observacoes">Observações</label>
            <textarea
              id="observacoes"
              v-model="formulario.observacoes"
              class="form-control"
              rows="3"
              maxlength="500"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="formulario.ativo"
              />
              Fornecedor ativo
            </label>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="fecharFormulario">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">
              {{ modalFormulario.editando ? 'Atualizar' : 'Criar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from '../composables/useToast'
import api from '../services/api'

export default {
  name: 'EstoqueFornecedores',
  emits: ['update-fornecedores'],
  setup(props, { emit }) {
    const { toast } = useToast()
    
    const carregando = ref(false)
    const fornecedores = ref([])
    
    const filtros = reactive({
      busca: '',
      status: ''
    })

    const modalFormulario = reactive({
      aberto: false,
      editando: false,
      fornecedorId: null
    })

    const formulario = reactive({
      nome: '',
      cnpj: '',
      email: '',
      telefone: '',
      endereco: '',
      observacoes: '',
      ativo: true
    })

    const filtrosAplicados = computed(() => {
      return filtros.busca || filtros.status
    })

    const carregarFornecedores = async () => {
      try {
        carregando.value = true
        const response = await api.get('/estoque/fornecedores')
        fornecedores.value = response.data.data || []
        emit('update-fornecedores', fornecedores.value)
      } catch (error) {
        console.error('Erro ao carregar fornecedores:', error)
        toast.error('Erro ao carregar fornecedores')
      } finally {
        carregando.value = false
      }
    }

    const aplicarFiltros = async () => {
      try {
        carregando.value = true
        const params = new URLSearchParams()
        
        if (filtros.busca) params.append('busca', filtros.busca)
        if (filtros.status) params.append('ativo', filtros.status)

        const response = await api.get(`/estoque/fornecedores?${params.toString()}`)
        fornecedores.value = response.data.data || []
      } catch (error) {
        console.error('Erro ao aplicar filtros:', error)
      } finally {
        carregando.value = false
      }
    }

    const abrirFormulario = (fornecedor = null) => {
      modalFormulario.aberto = true
      modalFormulario.editando = !!fornecedor
      modalFormulario.fornecedorId = fornecedor?.id || null

      if (fornecedor) {
        Object.assign(formulario, {
          nome: fornecedor.nome,
          cnpj: fornecedor.cnpj || '',
          email: fornecedor.email || '',
          telefone: fornecedor.telefone || '',
          endereco: fornecedor.endereco || '',
          observacoes: fornecedor.observacoes || '',
          ativo: fornecedor.ativo
        })
      } else {
        Object.assign(formulario, {
          nome: '',
          cnpj: '',
          email: '',
          telefone: '',
          endereco: '',
          observacoes: '',
          ativo: true
        })
      }
    }

    const fecharFormulario = () => {
      modalFormulario.aberto = false
      modalFormulario.editando = false
      modalFormulario.fornecedorId = null
    }

    const editarFornecedor = (fornecedor) => {
      abrirFormulario(fornecedor)
    }

    const salvarFornecedor = async () => {
      try {
        const dados = {
          nome: formulario.nome,
          cnpj: formulario.cnpj || null,
          email: formulario.email || null,
          telefone: formulario.telefone || null,
          endereco: formulario.endereco || null,
          observacoes: formulario.observacoes || null,
          ativo: formulario.ativo
        }

        if (modalFormulario.editando) {
          await api.put(`/estoque/fornecedores/${modalFormulario.fornecedorId}`, dados)
          toast.success('Fornecedor atualizado com sucesso!')
        } else {
          await api.post('/estoque/fornecedores', dados)
          toast.success('Fornecedor criado com sucesso!')
        }
        
        fecharFormulario()
        await carregarFornecedores()
      } catch (error) {
        console.error('Erro ao salvar fornecedor:', error)
        const message = error.response?.data?.message || 'Erro ao salvar fornecedor'
        toast.error(message)
      }
    }

    const excluirFornecedor = async (fornecedor) => {
      if (!confirm(`Tem certeza que deseja excluir o fornecedor "${fornecedor.nome}"?`)) {
        return
      }

      try {
        await api.delete(`/estoque/fornecedores/${fornecedor.id}`)
        toast.success('Fornecedor excluído com sucesso!')
        await carregarFornecedores()
      } catch (error) {
        console.error('Erro ao excluir fornecedor:', error)
        const message = error.response?.data?.message || 'Erro ao excluir fornecedor'
        toast.error(message)
      }
    }

    const formatarCNPJ = (cnpj) => {
      if (!cnpj) return ''
      return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    }

    const formatarCNPJInput = (event) => {
      let value = event.target.value.replace(/\D/g, '')
      value = value.replace(/^(\d{2})(\d)/, '$1.$2')
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2')
      value = value.replace(/(\d{4})(\d)/, '$1-$2')
      formulario.cnpj = value
    }

    onMounted(() => {
      carregarFornecedores()
    })

    return {
      carregando,
      fornecedores,
      filtros,
      modalFormulario,
      formulario,
      filtrosAplicados,
      aplicarFiltros,
      abrirFormulario,
      fecharFormulario,
      editarFornecedor,
      salvarFornecedor,
      excluirFornecedor,
      formatarCNPJ,
      formatarCNPJInput
    }
  }
}
</script>

<style scoped>
.estoque-fornecedores {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  color: #333;
}

.filters {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.filter-group .form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 15px;
  opacity: 0.5;
}

.fornecedores-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.fornecedor-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  background: white;
  transition: all 0.2s;
}

.fornecedor-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.fornecedor-card.inativo {
  opacity: 0.6;
  border-color: #ccc;
}

.fornecedor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.fornecedor-header h5 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.fornecedor-actions {
  display: flex;
  gap: 5px;
}

.btn-icon {
  background: none;
  border: none;
  padding: 5px;
  cursor: pointer;
  color: #666;
  border-radius: 3px;
}

.btn-icon:hover {
  background: #f0f0f0;
  color: #333;
}

.fornecedor-info p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cnpj {
  font-family: monospace;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
  display: inline-block !important;
}

.fornecedor-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat .label {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.stat .valor {
  font-weight: 500;
  font-size: 14px;
}

.valor.ativo {
  color: #28a745;
}

.valor.inativo {
  color: #dc3545;
}

.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

/* Modal */
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
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h4 {
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #999;
}

.btn-close:hover {
  color: #333;
}

.modal-content form {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

@media (max-width: 768px) {
  .filters {
    grid-template-columns: 1fr;
  }
  
  .fornecedores-grid {
    grid-template-columns: 1fr;
  }
}
</style>