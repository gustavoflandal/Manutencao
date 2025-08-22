<template>
  <div class="imagens-ativo">
    <div class="imagens-grid">
      <div v-for="(imagem, index) in imagens" :key="imagem.id" class="imagem-container">
        <img 
          :src="imagem.caminho" 
          :alt="imagem.descricao || `Imagem ${index + 1} do ativo`"
          @click="abrirPreview(imagem)"
          class="imagem-thumbnail"
        />
        <div class="imagem-overlay">
          <input 
            v-if="editavel"
            v-model="imagem.descricao" 
            @blur="atualizarDescricao(imagem)"
            placeholder="Descrição da imagem"
            class="descricao-input"
          />
          <div v-else class="descricao-texto">{{ imagem.descricao || `Imagem ${index + 1}` }}</div>
          
          <div v-if="editavel" class="imagem-acoes">
            <button 
              v-if="index > 0" 
              @click="moverImagem(imagem.id, 'up')" 
              class="btn-acao"
              title="Mover para cima"
            >
              <Icon name="arrow-up" size="16" />
            </button>
            <button 
              v-if="index < imagens.length - 1" 
              @click="moverImagem(imagem.id, 'down')" 
              class="btn-acao"
              title="Mover para baixo"
            >
              <Icon name="arrow-down" size="16" />
            </button>
            <button 
              @click="removerImagem(imagem.id)" 
              class="btn-acao btn-remover"
              title="Remover imagem"
            >
              <Icon name="trash-2" size="16" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="editavel && imagens.length < 4" class="upload-container"
           @dragover.prevent="onDragOver"
           @dragleave.prevent="onDragLeave"
           @drop.prevent="onDrop"
           :class="{ 'drag-over': isDragOver }">
        <div class="upload-options">
          <div class="upload-info">
            <Icon name="upload" size="32" />
            <h4>Arraste imagens aqui ou</h4>
            <p class="size-info">Máx. 5MB por imagem • JPEG, PNG, WebP</p>
          </div>
          
          <div class="upload-action">
            <label for="upload-imagem" class="btn btn-primary upload-btn-single">
              <Icon name="plus-circle" size="20" />
              <span>Selecionar Imagens</span>
            </label>
            <input 
              id="upload-imagem"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              @change="uploadImagem"
              multiple
              class="upload-input"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Preview -->
    <div v-if="imagemPreview" class="modal-preview" @click="fecharPreview">
      <img :src="imagemPreview.caminho" :alt="imagemPreview.descricao" class="preview-image" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import api from '@/services/api';
import Icon from '@/components/Icon.vue';

const props = defineProps({
  ativoId: {
    type: [Number, String],
    required: true
  },
  editavel: {
    type: Boolean,
    default: false
  }
});

const imagens = ref([]);
const imagemPreview = ref(null);
const isDragOver = ref(false);
const { showToast } = useToast();

// Carregar imagens do ativo
const carregarImagens = async () => {
  try {
    const response = await api.get(`/api/ativos/${props.ativoId}/imagens`);
    if (response.data.success) {
      imagens.value = response.data.data.imagens;
    }
  } catch (error) {
    showToast('error', 'Erro', 'Não foi possível carregar as imagens');
  }
};

// Upload de imagem
const uploadImagem = async (event) => {
  const files = Array.from(event.target.files);
  await processarUpload(files);
  event.target.value = ''; // Limpar input
};

// Processar upload de imagens
const processarUpload = async (files) => {
  const remainingSlots = 4 - imagens.value.length;
  
  if (files.length === 0) {
    showToast('warning', 'Atenção', 'Nenhuma imagem válida encontrada');
    return;
  }
  
  // Validar tamanho dos arquivos (5MB máximo)
  const arquivosGrandes = files.filter(file => file.size > 5 * 1024 * 1024);
  if (arquivosGrandes.length > 0) {
    showToast('error', 'Erro', `${arquivosGrandes.length} arquivo(s) excedem o limite de 5MB e foram ignorados`);
    files = files.filter(file => file.size <= 5 * 1024 * 1024);
  }
  
  if (files.length > remainingSlots) {
    showToast('warning', 'Atenção', `Você só pode adicionar mais ${remainingSlots} ${remainingSlots === 1 ? 'imagem' : 'imagens'}. Selecionando as primeiras ${remainingSlots}.`);
    files.splice(remainingSlots);
  }

  const formData = new FormData();
  files.forEach(file => formData.append('imagens', file));

  try {
    const response = await api.post(`/api/ativos/${props.ativoId}/imagens`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data.success) {
      await carregarImagens();
      showToast('success', 'Sucesso', `${files.length} ${files.length === 1 ? 'imagem adicionada' : 'imagens adicionadas'} com sucesso`);
    }
  } catch (error) {
    showToast('error', 'Erro', 'Não foi possível fazer o upload das imagens');
  }
};

// Funções de drag & drop
const onDragOver = (event) => {
  event.preventDefault();
  isDragOver.value = true;
};

const onDragLeave = (event) => {
  event.preventDefault();
  isDragOver.value = false;
};

const onDrop = async (event) => {
  event.preventDefault();
  isDragOver.value = false;
  
  const files = Array.from(event.dataTransfer.files);
  const imagemFiles = files.filter(file => file.type.startsWith('image/'));
  
  if (imagemFiles.length === 0) {
    showToast('warning', 'Atenção', 'Nenhuma imagem válida encontrada nos arquivos soltos');
    return;
  }
  
  await processarUpload(imagemFiles);
};

// Remover imagem
const removerImagem = async (imagemId) => {
  if (!confirm('Tem certeza que deseja remover esta imagem?')) return;

  try {
    const response = await api.delete(`/api/ativos/${props.ativoId}/imagens/${imagemId}`);
    if (response.data.success) {
      imagens.value = imagens.value.filter(img => img.id !== imagemId);
      showToast('success', 'Sucesso', 'Imagem removida com sucesso');
    }
  } catch (error) {
    showToast('error', 'Erro', 'Não foi possível remover a imagem');
  }
};

// Atualizar ordem das imagens
const moverImagem = async (imagemId, direcao) => {
  const index = imagens.value.findIndex(img => img.id === imagemId);
  const novaOrdem = direcao === 'up' ? index - 1 : index + 1;

  try {
    const response = await api.put(`/api/ativos/${props.ativoId}/imagens/${imagemId}/ordem`, {
      ordem: novaOrdem
    });

    if (response.data.success) {
      await carregarImagens();
    }
  } catch (error) {
    showToast('error', 'Erro', 'Não foi possível reordenar as imagens');
  }
};

// Preview de imagem
const abrirPreview = (imagem) => {
  imagemPreview.value = imagem;
};

const fecharPreview = () => {
  imagemPreview.value = null;
};

// Inicialização
onMounted(() => {
  carregarImagens();
});
</script>

<style scoped>
.imagens-ativo {
  margin: 1rem 0;
}

.imagens-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.imagem-container {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.imagem-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
  cursor: pointer;
}

.imagem-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.7);
  padding: 0.5rem;
  color: white;
}

.descricao-input {
  width: 100%;
  padding: 0.25rem;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 4px;
  background: rgba(0,0,0,0.3);
  color: white;
  font-size: 0.875rem;
}

.descricao-texto {
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.imagem-acoes {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.btn-acao {
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 4px;
  padding: 0.25rem;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-acao:hover {
  background: rgba(255,255,255,0.3);
}

.btn-remover:hover {
  background: rgba(220,53,69,0.5);
}

.upload-container {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 2rem;
  background: #fafafa;
}

.upload-container:hover,
.upload-container.drag-over {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: translateY(-2px);
}

.upload-options {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
  text-align: center;
}

.upload-info h4 {
  margin: 0.5rem 0;
  color: #374151;
  font-size: 1.1rem;
  font-weight: 600;
}

.size-info {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.upload-action {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

.upload-btn-single {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  text-decoration: none;
  border: none;
  font-size: 0.875rem;
  background: #3b82f6;
  color: white;
  min-width: 180px;
  justify-content: center;
}

.upload-btn-single:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.upload-input {
  display: none;
}

.modal-preview {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  cursor: pointer;
}

.preview-image {
  max-width: 90%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .imagens-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .upload-container {
    min-height: 150px;
    padding: 1rem;
  }
  
  .upload-action {
    margin-top: 1rem;
  }
  
  .upload-btn-single {
    width: 100%;
    padding: 0.875rem 1.5rem;
    font-size: 0.875rem;
  }
}
</style>