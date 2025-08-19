<template>
  <div class="estoque-movimentacoes">
    <div class="section-header">
      <h3>Movimentações de Estoque</h3>
      <button class="btn btn-create" @click="abrirModalMovimentacao">
        <i class="fas fa-plus"></i>
        Nova Movimentação
      </button>
    </div>

    <!-- Filtros -->
    <div class="filters">
      <div class="filter-group">
        <input
          type="text"
          v-model="filtros.item"
          class="form-control"
          placeholder="Buscar por item..."
          @input="aplicarFiltros"
        />
      </div>
      
      <div class="filter-group">
        <select v-model="filtros.tipo" class="form-control" @change="aplicarFiltros">
          <option value="">Todos os tipos</option>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>
      </div>

      <div class="filter-group">
        <input
          type="date"
          v-model="filtros.dataInicio"
          class="form-control"
          @change="aplicarFiltros"
        />
      </div>

      <div class="filter-group">
        <input
          type="date"
          v-model="filtros.dataFim"
          class="form-control"
          @change="aplicarFiltros"
        />
      </div>
    </div>

    <!-- Lista de Movimentações -->
    <div class="movimentacoes-lista">
      <div v-if="carregando" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        Carregando movimentações...
      </div>

      <div v-else-if="movimentacoes.length === 0" class="empty-state">
        <i class="fas fa-exchange-alt"></i>
        <h4>Nenhuma movimentação encontrada</h4>
        <p>{{ filtrosAplicados ? 'Tente ajustar os filtros' : 'Ainda não há movimentações registradas' }}</p>
      </div>

      <div v-else class="movimentacoes-table">
        <table class="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Item</th>
              <th>Tipo</th>
              <th>Quantidade</th>
              <th>Preço Unit.</th>
              <th>Total</th>
              <th>Usuário</th>
              <th>Observações</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="movimentacao in movimentacoes" 
              :key="movimentacao.id"
              :class="{ 'entrada': movimentacao.tipo === 'entrada', 'saida': movimentacao.tipo === 'saida' }"
            >
              <td>{{ formatarData(movimentacao.data_movimentacao) }}</td>
              <td>
                <div class="item-info">
                  <strong>{{ movimentacao.item?.nome || 'Item removido' }}</strong>
                  <small v-if="movimentacao.item?.codigo">{{ movimentacao.item.codigo }}</small>
                </div>
              </td>
              <td>
                <span class="badge" :class="movimentacao.tipo">
                  <i :class="movimentacao.tipo === 'entrada' ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
                  {{ movimentacao.tipo === 'entrada' ? 'Entrada' : 'Saída' }}
                </span>
              </td>
              <td class="text-center">{{ movimentacao.quantidade }}</td>
              <td class="text-right">R$ {{ formatarMoeda(movimentacao.preco_unitario) }}</td>
              <td class="text-right">
                <strong>R$ {{ formatarMoeda(movimentacao.quantidade * (movimentacao.preco_unitario || 0)) }}</strong>
              </td>
              <td>{{ movimentacao.usuario?.nome || 'Sistema' }}</td>
              <td>
                <span class="observacoes" :title="movimentacao.observacoes">
                  {{ truncarTexto(movimentacao.observacoes, 30) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Paginação -->
    <div v-if="paginacao.total > paginacao.limite" class="pagination">
      <button 
        class="btn btn-outline btn-sm" 
        :disabled="paginacao.pagina === 1"
        @click="mudarPagina(paginacao.pagina - 1)"
      >
        Anterior
      </button>
      
      <span class="pagination-info">
        Página {{ paginacao.pagina }} de {{ Math.ceil(paginacao.total / paginacao.limite) }}
      </span>
      
      <button 
        class="btn btn-outline btn-sm" 
        :disabled="paginacao.pagina >= Math.ceil(paginacao.total / paginacao.limite)"
        @click="mudarPagina(paginacao.pagina + 1)"
      >
        Próxima
      </button>
    </div>

    <!-- Modal de Nova Movimentação -->
    <div v-if="modalMovimentacao.aberto" class="modal-overlay" @click="fecharModalMovimentacao">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>Nova Movimentação</h4>
          <button class="btn-close" @click="fecharModalMovimentacao">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form @submit.prevent="salvarMovimentacao">
          <div class="form-group">
            <label for="item">Item *</label>
            <select
              id="item"
              v-model="formulario.item_id"
              class="form-control"
              required
            >
              <option value="">Selecione um item</option>
              <option 
                v-for="item in itensDisponiveis" 
                :key="item.id" 
                :value="item.id"
              >
                {{ item.nome }} ({{ item.codigo }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="tipo">Tipo *</label>
            <select
              id="tipo"
              v-model="formulario.tipo"
              class="form-control"
              required
            >
              <option value="">Selecione o tipo</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </div>

          <div class="form-group">
            <label for="quantidade">Quantidade *</label>
            <input
              type="number"
              id="quantidade"
              v-model.number="formulario.quantidade"
              class="form-control"
              min="1"
              required
            />
          </div>

          <div class="form-group" v-if="formulario.tipo === 'entrada'">
            <label for="preco">Preço Unitário</label>
            <input
              type="number"
              id="preco"
              v-model.number="formulario.preco_unitario"
              class="form-control"
              step="0.01"
              min="0"
            />
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

          <div class="form-actions">
            <button type="button" class="btn btn-outline" @click="fecharModalMovimentacao">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">
              Registrar Movimentação
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
  name: 'EstoqueMovimentacoes',
  setup() {
    const { toast } = useToast()
    
    const carregando = ref(false)
    const movimentacoes = ref([])
    const itensDisponiveis = ref([])
    
    const filtros = reactive({
      item: '',
      tipo: '',
      dataInicio: '',
      dataFim: ''
    })

    const paginacao = reactive({
      pagina: 1,
      limite: 20,
      total: 0
    })

    const modalMovimentacao = reactive({
      aberto: false
    })

    const formulario = reactive({
      item_id: '',
      tipo: '',
      quantidade: 1,
      preco_unitario: 0,
      observacoes: ''
    })

    const filtrosAplicados = computed(() => {
      return filtros.item || filtros.tipo || filtros.dataInicio || filtros.dataFim
    })

    const carregarMovimentacoes = async () => {
      try {
        carregando.value = true
        const params = new URLSearchParams()
        
        if (filtros.item) params.append('item', filtros.item)
        if (filtros.tipo) params.append('tipo', filtros.tipo)
        if (filtros.dataInicio) params.append('data_inicio', filtros.dataInicio)
        if (filtros.dataFim) params.append('data_fim', filtros.dataFim)
        
        params.append('pagina', paginacao.pagina.toString())
        params.append('limite', paginacao.limite.toString())

        const response = await api.get(`/estoque/movimentacoes?${params.toString()}`)
        const data = response.data.data
        
        movimentacoes.value = data.movimentacoes || []
        paginacao.total = data.total || 0
      } catch (error) {
        console.error('Erro ao carregar movimentações:', error)
        toast.error('Erro ao carregar movimentações')
      } finally {
        carregando.value = false
      }
    }

    const carregarItens = async () => {
      try {
        const response = await api.get('/estoque/itens')
        itensDisponiveis.value = response.data.data || []
      } catch (error) {
        console.error('Erro ao carregar itens:', error)
      }
    }

    const aplicarFiltros = () => {
      paginacao.pagina = 1
      carregarMovimentacoes()
    }

    const mudarPagina = (novaPagina) => {
      paginacao.pagina = novaPagina
      carregarMovimentacoes()
    }

    const abrirModalMovimentacao = () => {
      modalMovimentacao.aberto = true
      Object.assign(formulario, {
        item_id: '',
        tipo: '',
        quantidade: 1,
        preco_unitario: 0,
        observacoes: ''
      })
    }

    const fecharModalMovimentacao = () => {
      modalMovimentacao.aberto = false
    }

    const salvarMovimentacao = async () => {
      try {
        const dados = {
          item_id: formulario.item_id,
          tipo: formulario.tipo,
          quantidade: formulario.quantidade,
          observacoes: formulario.observacoes || null
        }

        if (formulario.tipo === 'entrada' && formulario.preco_unitario > 0) {
          dados.preco_unitario = formulario.preco_unitario
        }

        await api.post('/estoque/movimentacoes', dados)
        toast.success('Movimentação registrada com sucesso!')
        
        fecharModalMovimentacao()
        await carregarMovimentacoes()
      } catch (error) {
        console.error('Erro ao registrar movimentação:', error)
        const message = error.response?.data?.message || 'Erro ao registrar movimentação'
        toast.error(message)
      }
    }

    const formatarData = (data) => {
      return new Date(data).toLocaleString('pt-BR')
    }

    const formatarMoeda = (valor) => {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(valor || 0)
    }

    const truncarTexto = (texto, limite) => {
      if (!texto) return '-'
      return texto.length > limite ? texto.substring(0, limite) + '...' : texto
    }

    onMounted(() => {
      carregarMovimentacoes()
      carregarItens()
    })

    return {
      carregando,
      movimentacoes,
      itensDisponiveis,
      filtros,
      paginacao,
      modalMovimentacao,
      formulario,
      filtrosAplicados,
      aplicarFiltros,
      mudarPagina,
      abrirModalMovimentacao,
      fecharModalMovimentacao,
      salvarMovimentacao,
      formatarData,
      formatarMoeda,
      truncarTexto
    }
  }
}
</script>

<style scoped>
.estoque-movimentacoes {
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
  grid-template-columns: 2fr 1fr 1fr 1fr;
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

.movimentacoes-table {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.table th,
.table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.table tr:hover {
  background: #f8f9fa;
}

.table tr.entrada {
  border-left: 4px solid #28a745;
}

.table tr.saida {
  border-left: 4px solid #dc3545;
}

.item-info {
  display: flex;
  flex-direction: column;
}

.item-info small {
  color: #666;
  font-size: 12px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge.entrada {
  background: #d4edda;
  color: #155724;
}

.badge.saida {
  background: #f8d7da;
  color: #721c24;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.observacoes {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: help;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.pagination-info {
  font-size: 14px;
  color: #666;
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

.btn-sm {
  padding: 6px 10px;
  font-size: 12px;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  
  .table {
    font-size: 12px;
  }
  
  .table th,
  .table td {
    padding: 8px;
  }
}
</style>