<template>
  <div class="estoque-page">
    <div class="page-header">
      <h1>Gestão de Estoque</h1>
      <p>Controle completo de itens, movimentações e relatórios</p>
    </div>

    <!-- Cards de Resumo -->
    <div class="summary-cards">
      <div class="card summary-card">
        <div class="card-icon items">
          <i class="fas fa-boxes"></i>
        </div>
        <div class="card-content">
          <h3>{{ resumo.total_itens }}</h3>
          <p>Total de Itens</p>
        </div>
      </div>

      <div class="card summary-card">
        <div class="card-icon low-stock">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="card-content">
          <h3>{{ resumo.baixo_estoque }}</h3>
          <p>Baixo Estoque</p>
        </div>
      </div>

      <div class="card summary-card">
        <div class="card-icon value">
          <i class="fas fa-dollar-sign"></i>
        </div>
        <div class="card-content">
          <h3>R$ {{ formatCurrency(resumo.valor_total) }}</h3>
          <p>Valor Total</p>
        </div>
      </div>

      <div class="card summary-card">
        <div class="card-icon movements">
          <i class="fas fa-exchange-alt"></i>
        </div>
        <div class="card-content">
          <h3>{{ resumo.movimentacoes_mes }}</h3>
          <p>Movimentações (Mês)</p>
        </div>
      </div>
    </div>

    <!-- Tabs de Navegação -->
    <div class="tabs-container">
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <i :class="tab.icon"></i>
          {{ tab.label }}
        </button>
      </div>

      <!-- Conteúdo das Tabs -->
      <div class="tab-content">
        <!-- Tab Itens -->
        <div v-if="activeTab === 'itens'" class="tab-panel">
          <EstoqueItens @update-resumo="carregarResumo" />
        </div>

        <!-- Tab Categorias -->
        <div v-if="activeTab === 'categorias'" class="tab-panel">
          <EstoqueCategorias @update-resumo="carregarResumo" />
        </div>

        <!-- Tab Fornecedores -->
        <div v-if="activeTab === 'fornecedores'" class="tab-panel">
          <EstoqueFornecedores @update-resumo="carregarResumo" />
        </div>

        <!-- Tab Movimentações -->
        <div v-if="activeTab === 'movimentacoes'" class="tab-panel">
          <EstoqueMovimentacoes @update-resumo="carregarResumo" />
        </div>

        <!-- Tab Relatórios -->
        <div v-if="activeTab === 'relatorios'" class="tab-panel">
          <EstoqueRelatorios />
        </div>
      </div>
    </div>

    <!-- Modal de Alertas -->
    <div v-if="showAlertas" class="modal-overlay" @click="showAlertas = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Alertas de Estoque</h3>
          <button @click="showAlertas = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="alertas.baixo_estoque.length > 0" class="alert-section">
            <h4><i class="fas fa-exclamation-triangle text-warning"></i> Baixo Estoque</h4>
            <div class="alert-list">
              <div v-for="item in alertas.baixo_estoque" :key="item.id" class="alert-item">
                <strong>{{ item.nome }}</strong>
                <span>Estoque: {{ item.quantidade_atual }} / Mínimo: {{ item.estoque_minimo }}</span>
              </div>
            </div>
          </div>

          <div v-if="alertas.criticos.length > 0" class="alert-section">
            <h4><i class="fas fa-skull-crossbones text-danger"></i> Itens Críticos</h4>
            <div class="alert-list">
              <div v-for="item in alertas.criticos" :key="item.id" class="alert-item">
                <strong>{{ item.nome }}</strong>
                <span>Estoque: {{ item.quantidade_atual }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Botão de Alertas Flutuante -->
    <button 
      v-if="totalAlertas > 0"
      @click="showAlertas = true" 
      class="floating-alerts-btn"
      :title="`${totalAlertas} alertas pendentes`"
    >
      <i class="fas fa-bell"></i>
      <span class="alert-badge">{{ totalAlertas }}</span>
    </button>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from '../composables/useToast'
import api from '../services/api'
import EstoqueItens from '../components/EstoqueItens.vue'
import EstoqueCategorias from '../components/EstoqueCategorias.vue'
import EstoqueFornecedores from '../components/EstoqueFornecedores.vue'
import EstoqueMovimentacoes from '../components/EstoqueMovimentacoes.vue'
import EstoqueRelatorios from '../components/EstoqueRelatorios.vue'

export default {
  name: 'Estoque',
  components: {
    EstoqueItens,
    EstoqueCategorias,
    EstoqueFornecedores,
    EstoqueMovimentacoes,
    EstoqueRelatorios
  },
  setup() {
    const { showToast } = useToast()
    
    const activeTab = ref('itens')
    const showAlertas = ref(false)
    const loading = ref(false)
    
    const resumo = reactive({
      total_itens: 0,
      baixo_estoque: 0,
      valor_total: 0,
      movimentacoes_mes: 0
    })
    
    const alertas = reactive({
      baixo_estoque: [],
      criticos: [],
      proximos_vencimento: []
    })

    const tabs = [
      { id: 'itens', label: 'Itens', icon: 'fas fa-boxes' },
      { id: 'categorias', label: 'Categorias', icon: 'fas fa-tags' },
      { id: 'fornecedores', label: 'Fornecedores', icon: 'fas fa-truck' },
      { id: 'movimentacoes', label: 'Movimentações', icon: 'fas fa-exchange-alt' },
      { id: 'relatorios', label: 'Relatórios', icon: 'fas fa-chart-bar' }
    ]

    const totalAlertas = computed(() => {
      return alertas.baixo_estoque.length + alertas.criticos.length + alertas.proximos_vencimento.length
    })

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value || 0)
    }

    const carregarResumo = async () => {
      try {
        loading.value = true
        
        // Carregar estatísticas gerais
        const response = await api.get('/estoque/relatorios/estoque')
        const { totais } = response.data
        
        resumo.total_itens = totais.total_itens
        resumo.baixo_estoque = totais.itens_baixo_estoque
        resumo.valor_total = totais.valor_total_estoque
        
        // Carregar movimentações do mês
        const hoje = new Date()
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
        
        const movResponse = await api.get('/estoque/relatorios/movimentacoes', {
          params: {
            data_inicio: inicioMes.toISOString().split('T')[0],
            data_fim: fimMes.toISOString().split('T')[0]
          }
        })
        
        resumo.movimentacoes_mes = movResponse.data.movimentacoes.length
        
      } catch (error) {
        console.error('Erro ao carregar resumo:', error)
        showToast('Erro ao carregar resumo do estoque', 'error')
      } finally {
        loading.value = false
      }
    }

    const carregarAlertas = async () => {
      try {
        const response = await api.get('/estoque/alertas')
        
        alertas.baixo_estoque = response.data.baixo_estoque || []
        alertas.criticos = response.data.criticos || []
        alertas.proximos_vencimento = response.data.proximos_vencimento || []
        
      } catch (error) {
        console.error('Erro ao carregar alertas:', error)
      }
    }

    onMounted(() => {
      carregarResumo()
      carregarAlertas()
      
      // Atualizar alertas a cada 5 minutos
      setInterval(carregarAlertas, 5 * 60 * 1000)
    })

    return {
      activeTab,
      showAlertas,
      loading,
      resumo,
      alertas,
      tabs,
      totalAlertas,
      formatCurrency,
      carregarResumo,
      carregarAlertas
    }
  }
}
</script>

<style scoped>
.estoque-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.page-header p {
  color: #7f8c8d;
  font-size: 16px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: white;
}

.card-icon.items {
  background: linear-gradient(45deg, #3498db, #2980b9);
}

.card-icon.low-stock {
  background: linear-gradient(45deg, #f39c12, #e67e22);
}

.card-icon.value {
  background: linear-gradient(45deg, #27ae60, #229954);
}

.card-icon.movements {
  background: linear-gradient(45deg, #9b59b6, #8e44ad);
}

.card-content h3 {
  margin: 0 0 5px 0;
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
}

.card-content p {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

.tabs-container {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #ecf0f1;
  overflow-x: auto;
}

.tab {
  padding: 15px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #7f8c8d;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.tab:hover {
  background-color: #f8f9fa;
  color: #2c3e50;
}

.tab.active {
  color: #3498db;
  background-color: #f8f9fa;
  border-bottom: 3px solid #3498db;
}

.tab-content {
  min-height: 500px;
}

.tab-panel {
  padding: 20px;
}

.floating-alerts-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(231, 76, 60, 0.4);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.floating-alerts-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(231, 76, 60, 0.6);
}

.alert-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #f39c12;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

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

.modal {
  background: white;
  border-radius: 10px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #ecf0f1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  border: none;
  background: none;
  font-size: 20px;
  color: #7f8c8d;
  cursor: pointer;
  padding: 5px;
  border-radius: 5px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #ecf0f1;
  color: #e74c3c;
}

.modal-body {
  padding: 20px;
}

.alert-section {
  margin-bottom: 25px;
}

.alert-section h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
}

.alert-list {
  margin-bottom: 10px;
}

.alert-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #e74c3c;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.alert-item strong {
  color: #2c3e50;
}

.alert-item span {
  color: #7f8c8d;
  font-size: 14px;
}

.text-warning {
  color: #f39c12;
}

.text-danger {
  color: #e74c3c;
}

@media (max-width: 768px) {
  .tabs {
    flex-direction: column;
  }
  
  .tab {
    justify-content: center;
  }
  
  .floating-alerts-btn {
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
}
</style>