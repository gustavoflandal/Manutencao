<template>
  <div class="estoque-itens">
    <div class="section-header">
      <h3>Itens do Estoque</h3>
      <button class="btn btn-primary" @click="abrirFormulario()">
        <i class="fas fa-plus"></i>
        Novo Item
      </button>
    </div>

    <!-- Filtros -->
    <div class="filters">
      <div class="filter-group">
        <input
          type="text"
          v-model="filtros.busca"
          class="form-control"
          placeholder="Buscar por nome ou código..."
          @input="aplicarFiltros"
        />
      </div>
      
      <div class="filter-group">
        <select v-model="filtros.categoria" class="form-control" @change="aplicarFiltros">
          <option value="">Todas as categorias</option>
          <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
            {{ categoria.nome }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <select v-model="filtros.status" class="form-control" @change="aplicarFiltros">
          <option value="">Todos os status</option>
          <option value="normal">Normal</option>
          <option value="baixo">Estoque Baixo</option>
          <option value="zerado">Zerado</option>
        </select>
      </div>
    </div>

    <!-- Lista de Itens -->
    <div class="itens-lista">
      <div v-if="carregando" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        Carregando itens...
      </div>

      <div v-else-if="itens.length === 0" class="empty-state">
        <i class="fas fa-box-open"></i>
        <h4>Nenhum item encontrado</h4>
        <p>{{ filtrosAplicados ? 'Tente ajustar os filtros' : 'Cadastre o primeiro item do estoque' }}</p>
      </div>

      <div v-else class="itens-grid">
        <div 
          v-for="item in itens" 
          :key="item.id"
          class="item-card"
          :class="{ 
            'estoque-baixo': item.estoque_atual <= item.estoque_minimo,
            'estoque-zerado': item.estoque_atual === 0
          }"
        >
          <div class="item-header">
            <h5>{{ item.nome }}</h5>
            <div class="item-actions">
              <button 
                class="btn-icon" 
                title="Editar"
                @click="editarItem(item)"
              >
                <i class="fas fa-edit"></i>
              </button>
              <button 
                class="btn-icon" 
                title="Excluir"
                @click="excluirItem(item)"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <div class="item-info">
            <p class="codigo">Código: {{ item.codigo }}</p>
            <p class="categoria">{{ item.categoria?.nome || 'Sem categoria' }}</p>
            <p class="fornecedor">{{ item.fornecedor?.nome || 'Sem fornecedor' }}</p>
          </div>

          <div class="item-estoque">
            <div class="estoque-info">
              <span class="label">Atual:</span>
              <span class="valor atual">{{ item.estoque_atual || 0 }}</span>
            </div>
            <div class="estoque-info">
              <span class="label">Mínimo:</span>
              <span class="valor minimo">{{ item.estoque_minimo || 0 }}</span>
            </div>
            <div class="estoque-info">
              <span class="label">Preço:</span>
              <span class="valor preco">R$ {{ formatarMoeda(item.preco_unitario) }}</span>
            </div>
          </div>

          <div class="item-actions-bottom">
            <button 
              class="btn btn-sm btn-success"
              @click="movimentarEstoque(item, 'entrada')"
            >
              <i class="fas fa-plus"></i>
              Entrada
            </button>
            <button 
              class="btn btn-sm btn-warning"
              @click="movimentarEstoque(item, 'saida')"
              :disabled="item.estoque_atual === 0"
            >
              <i class="fas fa-minus"></i>
              Saída
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Movimentação -->
    <div v-if="modalMovimentacao.aberto" class="modal-overlay" @click="fecharModalMovimentacao">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>{{ modalMovimentacao.tipo === 'entrada' ? 'Entrada' : 'Saída' }} de Estoque</h4>
          <button class="btn-close" @click="fecharModalMovimentacao">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form @submit.prevent="confirmarMovimentacao">
          <div class="form-group">
            <label>Item:</label>
            <p>{{ modalMovimentacao.item?.nome }}</p>
          </div>

          <div class="form-group">
            <label for="quantidade">Quantidade *</label>
            <input
              type="number"
              id="quantidade"
              v-model.number="modalMovimentacao.quantidade"
              class="form-control"
              min="1"
              required
            />
          </div>

          <div class="form-group" v-if="modalMovimentacao.tipo === 'entrada'">
            <label for="preco">Preço Unitário</label>
            <input
              type="number"
              id="preco"
              v-model.number="modalMovimentacao.preco"
              class="form-control"
              step="0.01"
              min="0"
            />
          </div>

          <div class="form-group">
            <label for="observacoes">Observações</label>
            <textarea
              id="observacoes"
              v-model="modalMovimentacao.observacoes"
              class="form-control"
              rows="3"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="fecharModalMovimentacao">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">
              Confirmar {{ modalMovimentacao.tipo === 'entrada' ? 'Entrada' : 'Saída' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useToast } from '../composables/useToast'
import api from '../services/api'

export default {
  name: 'EstoqueItens',
  emits: ['update-resumo'],
  setup(props, { emit }) {
    const { toast } = useToast()
    
    const carregando = ref(false)
    const itens = ref([])
    const categorias = ref([])
    
    const filtros = reactive({
      busca: '',
      categoria: '',
      status: ''
    })

    const modalMovimentacao = reactive({
      aberto: false,
      tipo: 'entrada',
      item: null,
      quantidade: 1,
      preco: 0,
      observacoes: ''
    })

    const filtrosAplicados = computed(() => {
      return filtros.busca || filtros.categoria || filtros.status
    })

    const carregarItens = async () => {
      try {
        carregando.value = true
        const response = await api.get('/estoque/itens')
        itens.value = response.data.data || []
      } catch (error) {
        console.error('Erro ao carregar itens:', error)
        toast.error('Erro ao carregar itens do estoque')
      } finally {
        carregando.value = false
      }
    }

    const carregarCategorias = async () => {
      try {
        const response = await api.get('/estoque/categorias')
        categorias.value = response.data.data || []
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
      }
    }

    const aplicarFiltros = async () => {
      try {
        carregando.value = true
        const params = new URLSearchParams()
        
        if (filtros.busca) params.append('busca', filtros.busca)
        if (filtros.categoria) params.append('categoria_id', filtros.categoria)
        if (filtros.status) params.append('status', filtros.status)

        const response = await api.get(`/estoque/itens?${params.toString()}`)
        itens.value = response.data.data || []
      } catch (error) {
        console.error('Erro ao aplicar filtros:', error)
      } finally {
        carregando.value = false
      }
    }

    const abrirFormulario = () => {
      // Emit event para abrir formulário no componente pai
      emit('abrir-formulario')
    }

    const editarItem = (item) => {
      // Emit event para editar item no componente pai
      emit('editar-item', item)
    }

    const excluirItem = async (item) => {
      if (!confirm(`Tem certeza que deseja excluir o item "${item.nome}"?`)) {
        return
      }

      try {
        await api.delete(`/estoque/itens/${item.id}`)
        toast.success('Item excluído com sucesso!')
        await carregarItens()
        emit('update-resumo')
      } catch (error) {
        console.error('Erro ao excluir item:', error)
        toast.error('Erro ao excluir item')
      }
    }

    const movimentarEstoque = (item, tipo) => {
      modalMovimentacao.aberto = true
      modalMovimentacao.tipo = tipo
      modalMovimentacao.item = item
      modalMovimentacao.quantidade = 1
      modalMovimentacao.preco = tipo === 'entrada' ? item.preco_unitario || 0 : 0
      modalMovimentacao.observacoes = ''
    }

    const fecharModalMovimentacao = () => {
      modalMovimentacao.aberto = false
      modalMovimentacao.item = null
    }

    const confirmarMovimentacao = async () => {
      try {
        const dados = {
          item_id: modalMovimentacao.item.id,
          tipo: modalMovimentacao.tipo,
          quantidade: modalMovimentacao.quantidade,
          observacoes: modalMovimentacao.observacoes
        }

        if (modalMovimentacao.tipo === 'entrada' && modalMovimentacao.preco > 0) {
          dados.preco_unitario = modalMovimentacao.preco
        }

        await api.post('/estoque/movimentacoes', dados)
        
        toast.success(`${modalMovimentacao.tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`)
        
        fecharModalMovimentacao()
        await carregarItens()
        emit('update-resumo')
      } catch (error) {
        console.error('Erro ao registrar movimentação:', error)
        toast.error('Erro ao registrar movimentação')
      }
    }

    const formatarMoeda = (valor) => {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(valor || 0)
    }

    onMounted(() => {
      carregarItens()
      carregarCategorias()
    })

    return {
      carregando,
      itens,
      categorias,
      filtros,
      modalMovimentacao,
      filtrosAplicados,
      aplicarFiltros,
      abrirFormulario,
      editarItem,
      excluirItem,
      movimentarEstoque,
      fecharModalMovimentacao,
      confirmarMovimentacao,
      formatarMoeda
    }
  }
}
</script>

<style scoped>
.estoque-itens {
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
  grid-template-columns: 2fr 1fr 1fr;
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

.itens-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.item-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  background: white;
  transition: all 0.2s;
}

.item-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.item-card.estoque-baixo {
  border-left: 4px solid #ffc107;
}

.item-card.estoque-zerado {
  border-left: 4px solid #dc3545;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.item-header h5 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.item-actions {
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

.item-info p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

.codigo {
  font-family: monospace;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
  display: inline-block;
}

.item-estoque {
  margin: 15px 0;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.estoque-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.estoque-info:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 14px;
  color: #666;
}

.valor {
  font-weight: 500;
}

.valor.atual {
  color: #28a745;
}

.valor.minimo {
  color: #ffc107;
}

.valor.preco {
  color: #007bff;
}

.item-actions-bottom {
  display: flex;
  gap: 10px;
  margin-top: 15px;
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

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #1e7e34;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background: #e0a800;
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
  max-width: 500px;
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
  
  .itens-grid {
    grid-template-columns: 1fr;
  }
  
  .item-actions-bottom {
    flex-direction: column;
  }
}
</style>