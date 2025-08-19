<template>
  <div class="estoque-categorias">
    <div class="section-header">
      <h3>Categorias de Estoque</h3>
      <button class="btn btn-create" @click="abrirFormulario()">
        <i class="fas fa-plus"></i>
        Nova Categoria
      </button>
    </div>

    <!-- Lista de Categorias -->
    <div class="categorias-lista">
      <div v-if="carregando" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        Carregando categorias...
      </div>

      <div v-else-if="categorias.length === 0" class="empty-state">
        <i class="fas fa-folder-open"></i>
        <h4>Nenhuma categoria encontrada</h4>
        <p>Cadastre a primeira categoria de estoque</p>
      </div>

      <div v-else class="categorias-grid">
        <div 
          v-for="categoria in categorias" 
          :key="categoria.id"
          class="categoria-card"
          :class="{ 'inativa': !categoria.ativo }"
        >
          <div class="categoria-header">
            <div class="categoria-info">
              <h5>{{ categoria.nome }}</h5>
              <p v-if="categoria.descricao" class="descricao">{{ categoria.descricao }}</p>
            </div>
            <div class="categoria-actions">
              <button 
                class="btn-icon btn-edit btn-sm" 
                title="Editar"
                @click="editarCategoria(categoria)"
              >
                <i class="fas fa-edit"></i>
              </button>
              <button 
                class="btn-icon btn-delete btn-sm" 
                title="Excluir"
                @click="excluirCategoria(categoria)"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <div class="categoria-stats">
            <div class="stat">
              <span class="label">Itens:</span>
              <span class="valor">{{ categoria.total_itens || 0 }}</span>
            </div>
            <div class="stat">
              <span class="label">Status:</span>
              <span class="valor" :class="categoria.ativo ? 'ativa' : 'inativa'">
                {{ categoria.ativo ? 'Ativa' : 'Inativa' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Formulário -->
    <div v-if="modalFormulario.aberto" class="modal-overlay" @click="fecharFormulario">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>{{ modalFormulario.editando ? 'Editar' : 'Nova' }} Categoria</h4>
          <button class="btn-close" @click="fecharFormulario">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form @submit.prevent="salvarCategoria">
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
            <label for="descricao">Descrição</label>
            <textarea
              id="descricao"
              v-model="formulario.descricao"
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
              Categoria ativa
            </label>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-outline" @click="fecharFormulario">
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
import { ref, reactive, onMounted } from 'vue'
import { useToast } from '../composables/useToast'
import api from '../services/api'

export default {
  name: 'EstoqueCategorias',
  emits: ['update-categorias'],
  setup(props, { emit }) {
    const { toast } = useToast()
    
    const carregando = ref(false)
    const categorias = ref([])
    
    const modalFormulario = reactive({
      aberto: false,
      editando: false,
      categoriaId: null
    })

    const formulario = reactive({
      nome: '',
      descricao: '',
      ativo: true
    })

    const carregarCategorias = async () => {
      try {
        carregando.value = true
        const response = await api.get('/estoque/categorias')
        categorias.value = response.data.data || []
        emit('update-categorias', categorias.value)
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
        toast.error('Erro ao carregar categorias do estoque')
      } finally {
        carregando.value = false
      }
    }

    const abrirFormulario = (categoria = null) => {
      modalFormulario.aberto = true
      modalFormulario.editando = !!categoria
      modalFormulario.categoriaId = categoria?.id || null

      if (categoria) {
        formulario.nome = categoria.nome
        formulario.descricao = categoria.descricao || ''
        formulario.ativo = categoria.ativo
      } else {
        formulario.nome = ''
        formulario.descricao = ''
        formulario.ativo = true
      }
    }

    const fecharFormulario = () => {
      modalFormulario.aberto = false
      modalFormulario.editando = false
      modalFormulario.categoriaId = null
    }

    const editarCategoria = (categoria) => {
      abrirFormulario(categoria)
    }

    const salvarCategoria = async () => {
      try {
        const dados = {
          nome: formulario.nome,
          descricao: formulario.descricao || null,
          ativo: formulario.ativo
        }

        if (modalFormulario.editando) {
          await api.put(`/estoque/categorias/${modalFormulario.categoriaId}`, dados)
          toast.success('Categoria atualizada com sucesso!')
        } else {
          await api.post('/estoque/categorias', dados)
          toast.success('Categoria criada com sucesso!')
        }
        
        fecharFormulario()
        await carregarCategorias()
      } catch (error) {
        console.error('Erro ao salvar categoria:', error)
        const message = error.response?.data?.message || 'Erro ao salvar categoria'
        toast.error(message)
      }
    }

    const excluirCategoria = async (categoria) => {
      if (!confirm(`Tem certeza que deseja excluir a categoria "${categoria.nome}"?`)) {
        return
      }

      try {
        await api.delete(`/estoque/categorias/${categoria.id}`)
        toast.success('Categoria excluída com sucesso!')
        await carregarCategorias()
      } catch (error) {
        console.error('Erro ao excluir categoria:', error)
        const message = error.response?.data?.message || 'Erro ao excluir categoria'
        toast.error(message)
      }
    }

    onMounted(() => {
      carregarCategorias()
    })

    return {
      carregando,
      categorias,
      modalFormulario,
      formulario,
      abrirFormulario,
      fecharFormulario,
      editarCategoria,
      salvarCategoria,
      excluirCategoria
    }
  }
}
</script>

<style scoped>
.estoque-categorias {
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

.categorias-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.categoria-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  background: white;
  transition: all 0.2s;
}

.categoria-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.categoria-card.inativa {
  opacity: 0.6;
  border-color: #ccc;
}

.categoria-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.categoria-info h5 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 16px;
}

.descricao {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.categoria-actions {
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

.categoria-stats {
  display: flex;
  justify-content: space-between;
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

.valor.ativa {
  color: #28a745;
}

.valor.inativa {
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
  .categorias-grid {
    grid-template-columns: 1fr;
  }
}
</style>