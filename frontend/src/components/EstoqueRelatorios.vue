<template>
  <div class="estoque-relatorios">
    <div class="section-header">
      <h3>Relatórios de Estoque</h3>
    </div>

    <!-- Cartões de Resumo -->
    <div class="resumo-cards">
      <div class="card">
        <div class="card-icon">
          <i class="fas fa-boxes"></i>
        </div>
        <div class="card-content">
          <h4>Total de Itens</h4>
          <p class="card-value">{{ resumo.total_itens || 0 }}</p>
        </div>
      </div>

      <div class="card">
        <div class="card-icon warning">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="card-content">
          <h4>Estoque Baixo</h4>
          <p class="card-value warning">{{ resumo.estoque_baixo || 0 }}</p>
        </div>
      </div>

      <div class="card">
        <div class="card-icon danger">
          <i class="fas fa-times-circle"></i>
        </div>
        <div class="card-content">
          <h4>Estoque Zerado</h4>
          <p class="card-value danger">{{ resumo.estoque_zerado || 0 }}</p>
        </div>
      </div>

      <div class="card">
        <div class="card-icon success">
          <i class="fas fa-dollar-sign"></i>
        </div>
        <div class="card-content">
          <h4>Valor Total</h4>
          <p class="card-value">R$ {{ formatarMoeda(resumo.valor_total) }}</p>
        </div>
      </div>
    </div>

    <!-- Relatórios Disponíveis -->
    <div class="relatorios-section">
      <h4>Relatórios Disponíveis</h4>
      
      <div class="relatorios-grid">
        <!-- Relatório de Itens por Categoria -->
        <div class="relatorio-card">
          <div class="relatorio-header">
            <i class="fas fa-chart-pie"></i>
            <h5>Itens por Categoria</h5>
          </div>
          <p>Visualize a distribuição de itens por categoria de estoque</p>
          <button class="btn btn-outline-primary" @click="gerarRelatorioCategoria">
            <i class="fas fa-download"></i>
            Gerar Relatório
          </button>
        </div>

        <!-- Relatório de Estoque Baixo -->
        <div class="relatorio-card">
          <div class="relatorio-header">
            <i class="fas fa-exclamation-triangle"></i>
            <h5>Estoque Baixo</h5>
          </div>
          <p>Lista de itens com estoque abaixo do mínimo</p>
          <button class="btn btn-outline-warning" @click="gerarRelatorioEstoqueBaixo">
            <i class="fas fa-download"></i>
            Gerar Relatório
          </button>
        </div>

        <!-- Relatório de Movimentações -->
        <div class="relatorio-card">
          <div class="relatorio-header">
            <i class="fas fa-exchange-alt"></i>
            <h5>Movimentações</h5>
          </div>
          <p>Histórico de entradas e saídas do estoque</p>
          <div class="form-group">
            <label>Período:</label>
            <div class="date-range">
              <input
                type="date"
                v-model="filtrosMovimentacao.dataInicio"
                class="form-control"
              />
              <span>até</span>
              <input
                type="date"
                v-model="filtrosMovimentacao.dataFim"
                class="form-control"
              />
            </div>
          </div>
          <button class="btn btn-outline-info" @click="gerarRelatorioMovimentacoes">
            <i class="fas fa-download"></i>
            Gerar Relatório
          </button>
        </div>

        <!-- Relatório de Valorização -->
        <div class="relatorio-card">
          <div class="relatorio-header">
            <i class="fas fa-chart-line"></i>
            <h5>Valorização do Estoque</h5>
          </div>
          <p>Análise do valor total do estoque por categoria</p>
          <button class="btn btn-outline-success" @click="gerarRelatorioValorizacao">
            <i class="fas fa-download"></i>
            Gerar Relatório
          </button>
        </div>
      </div>
    </div>

    <!-- Itens com Estoque Baixo -->
    <div v-if="itensBaixoEstoque.length > 0" class="estoque-baixo-section">
      <h4>⚠️ Itens com Estoque Baixo</h4>
      
      <div class="items-baixo-estoque">
        <div 
          v-for="item in itensBaixoEstoque" 
          :key="item.id"
          class="item-baixo-card"
        >
          <div class="item-info">
            <h6>{{ item.nome }}</h6>
            <small>{{ item.codigo }}</small>
          </div>
          <div class="item-estoque">
            <span class="atual">{{ item.estoque_atual }}</span>
            <span class="separador">/</span>
            <span class="minimo">{{ item.estoque_minimo }}</span>
          </div>
          <div class="item-status">
            <span class="badge warning">Baixo</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="carregando" class="loading-overlay">
      <div class="loading-content">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Gerando relatório...</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useToast } from '../composables/useToast'
import api from '../services/api'

export default {
  name: 'EstoqueRelatorios',
  setup() {
    const { toast } = useToast()
    
    const carregando = ref(false)
    const resumo = ref({})
    const itensBaixoEstoque = ref([])
    
    const filtrosMovimentacao = reactive({
      dataInicio: '',
      dataFim: ''
    })

    const carregarResumo = async () => {
      try {
        const response = await api.get('/estoque/resumo')
        resumo.value = response.data.data || {}
      } catch (error) {
        console.error('Erro ao carregar resumo:', error)
        toast.error('Erro ao carregar resumo do estoque')
      }
    }

    const carregarItensBaixoEstoque = async () => {
      try {
        const response = await api.get('/estoque/itens?status=baixo')
        itensBaixoEstoque.value = response.data.data || []
      } catch (error) {
        console.error('Erro ao carregar itens com estoque baixo:', error)
      }
    }

    const gerarRelatorioCategoria = async () => {
      try {
        carregando.value = true
        
        const response = await api.get('/estoque/relatorios/categorias', {
          responseType: 'blob'
        })
        
        const blob = new Blob([response.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `relatorio-categorias-${new Date().toISOString().split('T')[0]}.pdf`
        link.click()
        window.URL.revokeObjectURL(url)
        
        toast.success('Relatório gerado com sucesso!')
      } catch (error) {
        console.error('Erro ao gerar relatório:', error)
        toast.error('Erro ao gerar relatório de categorias')
      } finally {
        carregando.value = false
      }
    }

    const gerarRelatorioEstoqueBaixo = async () => {
      try {
        carregando.value = true
        
        const response = await api.get('/estoque/relatorios/estoque-baixo', {
          responseType: 'blob'
        })
        
        const blob = new Blob([response.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `relatorio-estoque-baixo-${new Date().toISOString().split('T')[0]}.pdf`
        link.click()
        window.URL.revokeObjectURL(url)
        
        toast.success('Relatório gerado com sucesso!')
      } catch (error) {
        console.error('Erro ao gerar relatório:', error)
        toast.error('Erro ao gerar relatório de estoque baixo')
      } finally {
        carregando.value = false
      }
    }

    const gerarRelatorioMovimentacoes = async () => {
      if (!filtrosMovimentacao.dataInicio || !filtrosMovimentacao.dataFim) {
        toast.error('Selecione o período para o relatório')
        return
      }

      try {
        carregando.value = true
        
        const params = new URLSearchParams({
          data_inicio: filtrosMovimentacao.dataInicio,
          data_fim: filtrosMovimentacao.dataFim
        })
        
        const response = await api.get(`/estoque/relatorios/movimentacoes?${params}`, {
          responseType: 'blob'
        })
        
        const blob = new Blob([response.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `relatorio-movimentacoes-${filtrosMovimentacao.dataInicio}-${filtrosMovimentacao.dataFim}.pdf`
        link.click()
        window.URL.revokeObjectURL(url)
        
        toast.success('Relatório gerado com sucesso!')
      } catch (error) {
        console.error('Erro ao gerar relatório:', error)
        toast.error('Erro ao gerar relatório de movimentações')
      } finally {
        carregando.value = false
      }
    }

    const gerarRelatorioValorizacao = async () => {
      try {
        carregando.value = true
        
        const response = await api.get('/estoque/relatorios/valorizacao', {
          responseType: 'blob'
        })
        
        const blob = new Blob([response.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `relatorio-valorizacao-${new Date().toISOString().split('T')[0]}.pdf`
        link.click()
        window.URL.revokeObjectURL(url)
        
        toast.success('Relatório gerado com sucesso!')
      } catch (error) {
        console.error('Erro ao gerar relatório:', error)
        toast.error('Erro ao gerar relatório de valorização')
      } finally {
        carregando.value = false
      }
    }

    const formatarMoeda = (valor) => {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(valor || 0)
    }

    onMounted(() => {
      carregarResumo()
      carregarItensBaixoEstoque()
      
      // Definir datas padrão (último mês)
      const hoje = new Date()
      const umMesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 1, hoje.getDate())
      
      filtrosMovimentacao.dataFim = hoje.toISOString().split('T')[0]
      filtrosMovimentacao.dataInicio = umMesAtras.toISOString().split('T')[0]
    })

    return {
      carregando,
      resumo,
      itensBaixoEstoque,
      filtrosMovimentacao,
      gerarRelatorioCategoria,
      gerarRelatorioEstoqueBaixo,
      gerarRelatorioMovimentacoes,
      gerarRelatorioValorizacao,
      formatarMoeda
    }
  }
}
</script>

<style scoped>
.estoque-relatorios {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.section-header {
  margin-bottom: 30px;
}

.section-header h3 {
  margin: 0;
  color: #333;
}

.resumo-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #007bff;
  color: white;
  font-size: 20px;
}

.card-icon.warning {
  background: #ffc107;
}

.card-icon.danger {
  background: #dc3545;
}

.card-icon.success {
  background: #28a745;
}

.card-content h4 {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.card-value {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.card-value.warning {
  color: #ffc107;
}

.card-value.danger {
  color: #dc3545;
}

.relatorios-section {
  margin-bottom: 40px;
}

.relatorios-section h4 {
  margin-bottom: 20px;
  color: #333;
}

.relatorios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.relatorio-card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  background: white;
}

.relatorio-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.relatorio-header i {
  font-size: 20px;
  color: #007bff;
}

.relatorio-header h5 {
  margin: 0;
  color: #333;
}

.relatorio-card p {
  color: #666;
  margin-bottom: 15px;
  line-height: 1.4;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 5px;
}

.date-range span {
  color: #666;
  font-size: 14px;
}

.estoque-baixo-section {
  margin-bottom: 40px;
}

.estoque-baixo-section h4 {
  margin-bottom: 20px;
  color: #333;
}

.items-baixo-estoque {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.item-baixo-card {
  border: 1px solid #ffc107;
  border-radius: 6px;
  padding: 15px;
  background: #fff3cd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-info h6 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 14px;
}

.item-info small {
  color: #666;
  font-size: 12px;
}

.item-estoque {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
}

.atual {
  color: #dc3545;
}

.separador {
  color: #666;
}

.minimo {
  color: #ffc107;
}

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge.warning {
  background: #ffc107;
  color: #856404;
}

.btn {
  padding: 8px 12px;
  border: 1px solid;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  text-decoration: none;
  transition: all 0.2s;
  background: white;
}

.btn-outline-primary {
  border-color: #007bff;
  color: #007bff;
}

.btn-outline-primary:hover {
  background: #007bff;
  color: white;
}

.btn-outline-warning {
  border-color: #ffc107;
  color: #ffc107;
}

.btn-outline-warning:hover {
  background: #ffc107;
  color: #212529;
}

.btn-outline-info {
  border-color: #17a2b8;
  color: #17a2b8;
}

.btn-outline-info:hover {
  background: #17a2b8;
  color: white;
}

.btn-outline-success {
  border-color: #28a745;
  color: #28a745;
}

.btn-outline-success:hover {
  background: #28a745;
  color: white;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.loading-overlay {
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

.loading-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  text-align: center;
}

.loading-content i {
  font-size: 24px;
  color: #007bff;
  margin-bottom: 10px;
}

.loading-content p {
  margin: 0;
  color: #333;
}

@media (max-width: 768px) {
  .resumo-cards {
    grid-template-columns: 1fr;
  }
  
  .relatorios-grid {
    grid-template-columns: 1fr;
  }
  
  .date-range {
    flex-direction: column;
    align-items: stretch;
  }
  
  .items-baixo-estoque {
    grid-template-columns: 1fr;
  }
}
</style>