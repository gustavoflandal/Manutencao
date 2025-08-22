<template>
  <div class="ativos-page">
    <header class="page-header">
      <h1>Gestão de Ativos</h1>
      
      <button 
        v-if="podeGerenciarAtivos" 
        class="btn btn-create" 
        @click="abrirModalCadastro()"
      >
        <i class="fas fa-plus"></i>
        Novo Ativo
      </button>
    </header>

    <!-- Dashboard de Estatísticas -->
    <div class="dashboard-cards">
      <div class="card">
        <h3>Total de Ativos</h3>
        <div class="card-stats">
          <span class="stats-number" :class="{ 'loading': carregando }">
            {{ carregando ? '...' : stats.total }}
          </span>
          <span class="stats-label">Cadastrados</span>
        </div>
      </div>

      <div class="card">
        <h3>Operacionais</h3>
        <div class="card-stats">
          <span class="stats-number text-success" :class="{ 'loading': carregando }">
            {{ carregando ? '...' : stats.operacional }}
          </span>
          <span class="stats-label">Em funcionamento</span>
        </div>
      </div>

      <div class="card">
        <h3>Em Manutenção</h3>
        <div class="card-stats">
          <span class="stats-number text-warning" :class="{ 'loading': carregando }">
            {{ carregando ? '...' : stats.manutencao }}
          </span>
          <span class="stats-label">Sendo reparados</span>
        </div>
      </div>

      <div class="card">
        <h3>Criticidade Alta</h3>
        <div class="card-stats">
          <span class="stats-number text-danger" :class="{ 'loading': carregando }">
            {{ carregando ? '...' : stats.critica }}
          </span>
          <span class="stats-label">Requer atenção</span>
        </div>
      </div>
    </div>

    <div class="ativos-content">
      <!-- Filtros -->
      <div class="ativos-filters">
        <input 
          v-model="filtros.busca" 
          type="text" 
          placeholder="Buscar por código ou nome..."
          class="form-input"
        />
        
        <select v-model="filtros.estado" class="form-select">
          <option value="">Todos os estados</option>
          <option value="operacional">Operacional</option>
          <option value="manutencao">Em Manutenção</option>
          <option value="parado">Parado</option>
          <option value="descartado">Descartado</option>
        </select>
        
        <select v-model="filtros.criticidade" class="form-select">
          <option value="">Todas as criticidades</option>
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select>
        
        <select v-model="filtros.setor_id" class="form-select">
          <option value="">Todos os setores</option>
          <option v-for="setor in setores" :key="setor.id" :value="setor.id">
            {{ setor.codigo }} - {{ setor.nome }} ({{ setor.total_ativos ?? 0 }})
          </option>
        </select>
      </div>

      <!-- Tabela de Ativos -->
      <div class="ativos-table">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Setor</th>
              <th>Localização</th>
              <th>Estado</th>
              <th>Criticidade</th>
              <th v-if="podeGerenciarAtivos">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ativo in ativosFiltrados" :key="ativo.id">
              <td>
                <strong>{{ ativo.codigo_patrimonio }}</strong>
              </td>
              <td>{{ ativo.nome }}</td>
              <td>
                <span v-if="ativo.setor" class="setor-badge">
                  {{ ativo.setor.codigo }}
                </span>
                <span v-else class="text-gray">Sem setor</span>
              </td>
              <td>{{ ativo.localizacao || 'Não informado' }}</td>
              <td>
                <span class="status-badge" :class="getEstadoClass(ativo.estado)">
                  {{ formatarEstado(ativo.estado) }}
                </span>
              </td>
              <td>
                <span class="criticidade-badge" :class="getCriticidadeClass(ativo.criticidade)">
                  {{ formatarCriticidade(ativo.criticidade) }}
                </span>
              </td>
              <td v-if="podeGerenciarAtivos">
                <div class="action-buttons">
                  <button 
                    class="btn btn-edit btn-sm" 
                    @click="editarAtivo(ativo)"
                    title="Editar ativo"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button 
                    class="btn btn-images btn-sm" 
                    @click="abrirModalImagens(ativo)"
                    title="Gerenciar imagens"
                  >
                    <i class="fas fa-images"></i>
                  </button>
                  <button 
                    v-if="podeExcluirAtivos"
                    class="btn btn-delete btn-sm" 
                    @click="excluirAtivo(ativo)"
                    title="Excluir ativo"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="ativosFiltrados.length === 0">
              <td :colspan="podeGerenciarAtivos ? 7 : 6" class="no-data">
                {{ carregando ? 'Carregando ativos...' : 'Nenhum ativo encontrado' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Cadastro/Edição -->
    <div v-if="modalAberto" class="modal-overlay" @click="fecharModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>{{ ativoEdicao ? 'Editar Ativo' : 'Novo Ativo' }}</h2>
          <button @click="fecharModal" class="modal-close">&times;</button>
        </div>
        
        <form @submit.prevent="salvarAtivo" class="modal-form">
          <div class="form-sections">
            <!-- Seção 1: Identificação -->
            <div class="form-section">
              <h3 class="section-title">
                <i class="fas fa-id-card"></i>
                Identificação do Ativo
              </h3>
              
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Código Patrimonial*</label>
                  <input 
                    v-model="formulario.codigo_patrimonio" 
                    type="text" 
                    required 
                    class="form-input"
                    placeholder="Ex: EQP-001-2024"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Nome do Ativo*</label>
                  <input 
                    v-model="formulario.nome" 
                    type="text" 
                    required 
                    class="form-input"
                    placeholder="Nome do equipamento"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Categoria</label>
                  <select v-model="formulario.categoria_id" class="form-input">
                    <option value="">Selecione a categoria</option>
                    <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
                      {{ categoria.nome }}
                    </option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Setor*</label>
                  <select v-model="formulario.setor_id" required class="form-input">
                    <option value="">Selecione o setor</option>
                    <option v-for="setor in setores" :key="setor.id" :value="setor.id">
                      {{ setor.nome }} ({{ setor.total_ativos ?? 0 }})
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Seção 2: Dados do Fabricante -->
            <div class="form-section">
              <h3 class="section-title">
                <i class="fas fa-industry"></i>
                Dados do Fabricante
              </h3>
              
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Fabricante</label>
                  <input 
                    v-model="formulario.fabricante" 
                    type="text" 
                    class="form-input"
                    placeholder="Nome do fabricante"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Modelo</label>
                  <input 
                    v-model="formulario.modelo" 
                    type="text" 
                    class="form-input"
                    placeholder="Modelo do equipamento"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Número de Série</label>
                  <input 
                    v-model="formulario.numero_serie" 
                    type="text" 
                    class="form-input"
                    placeholder="Número de série"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Ano de Fabricação</label>
                  <input 
                    v-model.number="formulario.ano_fabricacao" 
                    type="number" 
                    class="form-input"
                    :min="1900"
                    :max="new Date().getFullYear() + 1"
                    placeholder="2024"
                  />
                </div>
              </div>
            </div>

            <!-- Seção 3: Localização -->
            <div class="form-section">
              <h3 class="section-title">
                <i class="fas fa-map-marker-alt"></i>
                Localização
              </h3>
              
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Localização Completa</label>
                  <input 
                    v-model="formulario.localizacao_completa" 
                    type="text" 
                    class="form-input"
                    placeholder="Ex: Setor A - Linha 1 - Posição 3"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Prédio</label>
                  <input 
                    v-model="formulario.predio" 
                    type="text" 
                    class="form-input"
                    placeholder="Prédio/Galpão"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Andar</label>
                  <input 
                    v-model="formulario.andar" 
                    type="text" 
                    class="form-input"
                    placeholder="Térreo, 1º, 2º..."
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Sala/Área</label>
                  <input 
                    v-model="formulario.sala" 
                    type="text" 
                    class="form-input"
                    placeholder="Sala ou área específica"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Posição</label>
                  <input 
                    v-model="formulario.posicao" 
                    type="text" 
                    class="form-input"
                    placeholder="Posição específica"
                  />
                </div>
              </div>
            </div>

            <!-- Seção 4: Estado e Criticidade -->
            <div class="form-section">
              <h3 class="section-title">
                <i class="fas fa-exclamation-triangle"></i>
                Estado e Criticidade
              </h3>
              
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Estado*</label>
                  <select v-model="formulario.estado" required class="form-input">
                    <option value="">Selecione o estado</option>
                    <option value="operacional">Operacional</option>
                    <option value="manutencao">Em Manutenção</option>
                    <option value="parado">Parado</option>
                    <option value="inativo">Inativo</option>
                    <option value="baixado">Baixado</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Criticidade*</label>
                  <select v-model="formulario.criticidade" required class="form-input">
                    <option value="">Selecione a criticidade</option>
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Responsável</label>
                  <select v-model="formulario.responsavel_id" class="form-input">
                    <option value="">Selecione o responsável</option>
                    <option v-for="usuario in usuarios" :key="usuario.id" :value="usuario.id">
                      {{ usuario.nome }}
                    </option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Vida Útil (anos)</label>
                  <input 
                    v-model.number="formulario.vida_util_anos" 
                    type="number" 
                    class="form-input"
                    min="1"
                    placeholder="10"
                  />
                </div>
              </div>
            </div>

            <!-- Seção 5: Características Técnicas -->
            <div class="form-section">
              <h3 class="section-title">
                <i class="fas fa-cogs"></i>
                Características Técnicas
              </h3>
              
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Potência</label>
                  <input 
                    v-model="formulario.potencia" 
                    type="text" 
                    class="form-input"
                    placeholder="Ex: 5 kW, 220 HP"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Tensão</label>
                  <input 
                    v-model="formulario.tensao" 
                    type="text" 
                    class="form-input"
                    placeholder="Ex: 220V, 380V, 440V"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Frequência</label>
                  <input 
                    v-model="formulario.frequencia" 
                    type="text" 
                    class="form-input"
                    placeholder="Ex: 60Hz, 50Hz"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Peso (kg)</label>
                  <input 
                    v-model.number="formulario.peso" 
                    type="number" 
                    step="0.01"
                    min="0"
                    class="form-input"
                    placeholder="0.00"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Dimensões</label>
                  <input 
                    v-model="formulario.dimensoes" 
                    type="text" 
                    class="form-input"
                    placeholder="Ex: 100x50x30 cm"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Capacidade</label>
                  <input 
                    v-model="formulario.capacidade" 
                    type="text" 
                    class="form-input"
                    placeholder="Ex: 1000 L/h, 50 ton"
                  />
                </div>
              </div>
            </div>

            <!-- Seção 6: Informações Financeiras -->
            <div class="form-section">
              <h3 class="section-title">
                <i class="fas fa-dollar-sign"></i>
                Informações Financeiras
              </h3>
              
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Data de Aquisição</label>
                  <input 
                    v-model="formulario.data_aquisicao" 
                    type="date" 
                    class="form-input"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Valor de Aquisição (R$)</label>
                  <input 
                    v-model.number="formulario.valor_aquisicao" 
                    type="number" 
                    step="0.01"
                    min="0"
                    class="form-input"
                    placeholder="0.00"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Valor Atual (R$)</label>
                  <input 
                    v-model.number="formulario.valor_atual" 
                    type="number" 
                    step="0.01"
                    min="0"
                    class="form-input"
                    placeholder="0.00"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Fornecedor</label>
                  <input 
                    v-model="formulario.fornecedor" 
                    type="text" 
                    class="form-input"
                    placeholder="Nome do fornecedor"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Garantia até</label>
                  <input 
                    v-model="formulario.garantia_ate" 
                    type="date" 
                    class="form-input"
                  />
                </div>
              </div>
            </div>

            <!-- Seção 7: Manutenção -->
            <div class="form-section">
              <h3 class="section-title">
                <i class="fas fa-wrench"></i>
                Informações de Manutenção
              </h3>
              
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Próxima Inspeção</label>
                  <input 
                    v-model="formulario.data_proxima_inspecao" 
                    type="date" 
                    class="form-input"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Horas de Funcionamento</label>
                  <input 
                    v-model.number="formulario.horas_funcionamento" 
                    type="number" 
                    step="0.01"
                    min="0"
                    class="form-input"
                    placeholder="0.00"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Contador de Produção</label>
                  <input 
                    v-model.number="formulario.contador_producao" 
                    type="number" 
                    min="0"
                    class="form-input"
                    placeholder="0"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">Última Manutenção</label>
                  <input 
                    v-model="formulario.ultima_manutencao" 
                    type="date" 
                    class="form-input"
                  />
                </div>
              </div>
            </div>

            <!-- Seção 8: Documentação e Observações -->
            <div class="form-section">
              <h3 class="section-title">
                <i class="fas fa-file-alt"></i>
                Documentação e Observações
              </h3>
              
              <div class="form-group">
                <label class="form-label">Especificações Técnicas</label>
                <textarea 
                  v-model="formulario.especificacoes_tecnicas" 
                  class="form-input"
                  rows="3"
                  placeholder="Especificações técnicas detalhadas do equipamento..."
                ></textarea>
              </div>
              
              <div class="form-group">
                <label class="form-label">Manual de Operação</label>
                <textarea 
                  v-model="formulario.manual_operacao" 
                  class="form-input"
                  rows="3"
                  placeholder="Procedimentos de operação, instruções de uso..."
                ></textarea>
              </div>
              
              <div class="form-group">
                <label class="form-label">Manual de Manutenção</label>
                <textarea 
                  v-model="formulario.manual_manutencao" 
                  class="form-input"
                  rows="3"
                  placeholder="Procedimentos de manutenção, frequências, peças..."
                ></textarea>
              </div>
              
              <div class="form-group">
                <label class="form-label">Observações Gerais</label>
                <textarea 
                  v-model="formulario.observacoes" 
                  class="form-input"
                  rows="3"
                  placeholder="Observações gerais, histórico, informações adicionais..."
                ></textarea>
              </div>
            </div>

            <!-- Seção de Imagens Simples - Apenas Preview Local -->
            <div v-if="ativoEdicao" class="form-section">
              <h3 class="section-title">
                <i class="fas fa-images"></i>
                Imagens do Ativo (máx. 5) - Preview Local
              </h3>
              
              <!-- Preview das imagens selecionadas -->
              <div class="imagens-preview" v-if="imagensAtivo.length > 0">
                <div 
                  v-for="(imagem, index) in imagensAtivo" 
                  :key="index" 
                  class="imagem-item"
                >
                  <img :src="imagem.url" :alt="`Imagem ${index + 1}`" class="imagem-thumb" />
                  <button 
                    type="button" 
                    @click="removerImagem(index)" 
                    class="btn-remover-imagem"
                    title="Remover imagem"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>

              <!-- Input para selecionar imagens -->
              <div class="upload-simples">
                <input 
                  ref="inputImagens"
                  type="file" 
                  accept="image/jpeg,image/jpg,image/png,image/webp" 
                  multiple 
                  @change="selecionarImagens"
                  style="display: none"
                />
                <button 
                  type="button" 
                  @click="$refs.inputImagens?.click()" 
                  class="btn btn-primary"
                  :disabled="imagensAtivo.length >= 5"
                >
                  <i class="fas fa-plus"></i>
                  {{ imagensAtivo.length === 0 ? 'Selecionar Imagens' : 'Adicionar Mais' }}
                  ({{ imagensAtivo.length }}/5)
                </button>
                <p class="upload-info">Formatos: JPG, PNG, WebP | Máximo: 5MB por imagem</p>
                <p class="upload-nota" v-if="imagensAtivo.length > 0">
                  <i class="fas fa-info-circle"></i>
                  Nota: As imagens são apenas para preview. A funcionalidade de salvar será implementada posteriormente.
                </p>
              </div>
            </div>
          </div>          <div class="modal-actions">
            <button type="button" @click="fecharModal" class="btn btn-outline">
              <i class="fas fa-times"></i>
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="salvando">
              <i class="fas fa-save"></i>
              {{ salvando ? 'Salvando...' : 'Salvar Ativo' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Gerenciamento de Imagens -->
    <div v-if="modalImagensAberto" class="modal-overlay" @click="fecharModalImagens">
      <div class="modal-container modal-imagens" @click.stop>
        <div class="modal-header">
          <h2>
            <i class="fas fa-images"></i>
            Gerenciar Imagens - {{ ativoSelecionado?.codigo_patrimonio }}
          </h2>
          <button @click="fecharModalImagens" class="modal-close">&times;</button>
        </div>
        
        <div class="modal-form">
          <!-- Informações do Ativo -->
          <div class="ativo-info">
            <div class="info-item">
              <strong>Código:</strong> {{ ativoSelecionado?.codigo_patrimonio }}
            </div>
            <div class="info-item">
              <strong>Nome:</strong> {{ ativoSelecionado?.nome }}
            </div>
            <div class="info-item">
              <strong>Setor:</strong> {{ ativoSelecionado?.setor?.nome || 'Não informado' }}
            </div>
          </div>

          <!-- Upload de Imagens -->
          <div class="upload-section">
            <div class="upload-header">
              <h3><i class="fas fa-upload"></i> Upload de Imagens</h3>
              <button 
                type="button"
                class="btn-upload-imagens"
                @click="$refs.uploadInput?.click()"
                :disabled="uploadando"
              >
                <i class="fas fa-plus" v-if="!uploadando"></i>
                <i class="fas fa-spinner fa-spin" v-else></i>
                {{ uploadando ? 'Enviando...' : 'Adicionar Imagens' }}
              </button>
            </div>

            <input 
              ref="uploadInput"
              type="file" 
              accept="image/jpeg,image/jpg,image/png,image/webp" 
              multiple 
              @change="handleFileSelect"
              style="display: none"
            />
          </div>

          <!-- Preview das Imagens Selecionadas -->
          <div v-if="imagensParaUpload.length > 0" class="preview-section">
            <h3><i class="fas fa-eye"></i> Imagens Selecionadas</h3>
            <div class="preview-grid">
              <div 
                v-for="(imagem, index) in imagensParaUpload" 
                :key="index" 
                class="preview-item"
              >
                <img :src="imagem.preview" :alt="imagem.nome" class="preview-thumb" />
                <div class="preview-info">
                  <span class="preview-name">{{ imagem.nome }}</span>
                  <span class="preview-size">{{ formatarTamanho(imagem.tamanho) }}</span>
                </div>
                <button 
                  type="button" 
                  @click="removerImagemUpload(index)" 
                  class="btn-remover-preview"
                  title="Remover imagem"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Imagens Existentes -->
          <div v-if="imagensExistentes.length > 0" class="existentes-section">
            <h3><i class="fas fa-database"></i> Imagens Salvas</h3>
            <div class="existentes-grid">
              <div 
                v-for="(imagem, index) in imagensExistentes" 
                :key="imagem.id" 
                class="existente-item"
              >
                <img 
                  :src="imagem.url" 
                  :alt="imagem.nome" 
                  class="existente-thumb" 
                  @click="visualizarImagem(imagem)"
                />
                <div class="existente-info">
                  <span class="existente-name">{{ imagem.nome }}</span>
                  <span class="existente-size">{{ formatarTamanho(imagem.tamanho) }}</span>
                </div>
                <div class="existente-actions">
                  <button 
                    type="button" 
                    @click="visualizarImagem(imagem)" 
                    class="btn-acao btn-view"
                    title="Visualizar em tamanho completo"
                  >
                    <i class="fas fa-search-plus"></i>
                  </button>
                  <button 
                    type="button" 
                    @click="excluirImagemExistente(index, imagem)" 
                    class="btn-acao btn-delete"
                    title="Excluir imagem"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Estado vazio -->
          <div v-if="imagensExistentes.length === 0 && imagensParaUpload.length === 0" class="empty-state">
            <i class="fas fa-images empty-icon"></i>
            <p class="empty-text">Nenhuma imagem encontrada</p>
            <p class="empty-subtitle">Faça upload de imagens para este ativo</p>
          </div>
        </div>

        <!-- Ações do Modal -->
        <div class="modal-actions">
          <button type="button" @click="fecharModalImagens" class="btn btn-outline">
            <i class="fas fa-times"></i>
            Fechar
          </button>
          <button 
            v-if="imagensParaUpload.length > 0"
            type="button" 
            @click="enviarImagens" 
            class="btn btn-primary"
            :disabled="uploadando"
          >
            <i class="fas fa-upload"></i>
            {{ uploadando ? 'Enviando...' : `Enviar ${imagensParaUpload.length} Imagem(ns)` }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Visualização de Imagem -->
    <div v-if="imagemVisualizacao" class="modal-overlay" @click="fecharVisualizacaoImagem">
      <div class="modal-container modal-image-view" @click.stop>
        <div class="modal-header">
          <h2>{{ imagemVisualizacao.nome }}</h2>
          <button @click="fecharVisualizacaoImagem" class="modal-close">&times;</button>
        </div>
        <div class="image-view-content">
          <img :src="imagemVisualizacao.url" :alt="imagemVisualizacao.nome" class="image-full" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import api from '@/services/api'

const authStore = useAuthStore()
const { success, error } = useToast()

// Estados reativos
const ativos = ref([])
const setores = ref([])
const categorias = ref([])
const imagensAtivo = ref([]) // Array para armazenar imagens do ativo
const imagensParaUpload = ref([]) // Array para novas imagens a serem enviadas
const usuarios = ref([])
const stats = ref({
  total: 0,
  operacional: 0,
  manutencao: 0,
  critica: 0
})
const carregando = ref(false)
const modalAberto = ref(false)
const ativoEdicao = ref(null)
const salvando = ref(false)

// Estados para o modal de imagens
const modalImagensAberto = ref(false)
const ativoSelecionado = ref(null)
const imagensExistentes = ref([])
const uploadando = ref(false)
const dragOver = ref(false)
const imagemVisualizacao = ref(null)

// Filtros
const filtros = ref({
  busca: '',
  estado: '',
  criticidade: '',
  setor_id: ''
})

// Formulário
const formulario = ref({
  // Identificação
  codigo_patrimonio: '',
  nome: '',
  categoria_id: '',
  setor_id: '',
  
  // Fabricante
  fabricante: '',
  modelo: '',
  numero_serie: '',
  ano_fabricacao: null,
  
  // Localização
  localizacao_completa: '',
  predio: '',
  andar: '',
  sala: '',
  posicao: '',
  
  // Estado e Criticidade
  estado: '',
  criticidade: '',
  responsavel_id: '',
  vida_util_anos: null,
  
  // Características Técnicas
  potencia: '',
  tensao: '',
  frequencia: '',
  peso: null,
  dimensoes: '',
  capacidade: '',
  
  // Financeiro
  data_aquisicao: '',
  valor_aquisicao: null,
  valor_atual: null,
  fornecedor: '',
  garantia_ate: '',
  
  // Manutenção
  data_proxima_inspecao: '',
  horas_funcionamento: null,
  contador_producao: null,
  ultima_manutencao: '',
  
  // Documentação
  especificacoes_tecnicas: '',
  manual_operacao: '',
  manual_manutencao: '',
  observacoes: '',
  
  // Referências
  department_id: 1,
  ativo: true
})

// Computed properties
const podeGerenciarAtivos = computed(() => {
  const nivel = {
    'solicitante': 1,
    'tecnico': 2,
    'supervisor': 3,
    'administrador': 4
  }
  return nivel[authStore.user?.perfil] >= 2
})

const podeExcluirAtivos = computed(() => {
  const nivel = {
    'solicitante': 1,
    'tecnico': 2,
    'supervisor': 3,
    'administrador': 4
  }
  return nivel[authStore.user?.perfil] >= 3
})

const ativosFiltrados = computed(() => {
  let filtrados = ativos.value

  if (filtros.value.busca) {
    const busca = filtros.value.busca.toLowerCase()
    filtrados = filtrados.filter(ativo => 
      ativo.codigo_patrimonio.toLowerCase().includes(busca) ||
      ativo.nome.toLowerCase().includes(busca)
    )
  }

  if (filtros.value.estado) {
    filtrados = filtrados.filter(ativo => ativo.estado === filtros.value.estado)
  }

  if (filtros.value.criticidade) {
    filtrados = filtrados.filter(ativo => ativo.criticidade === filtros.value.criticidade)
  }

  if (filtros.value.setor_id) {
    filtrados = filtrados.filter(ativo => ativo.setor_id == filtros.value.setor_id)
  }

  return filtrados
})

// Função helper para validar data
const validarData = (dataString) => {
  if (!dataString || dataString === '') return null
  const data = new Date(dataString)
  return !isNaN(data.getTime()) ? dataString : null
}

// Carregar imagens existentes do ativo
const carregarImagensAtivo = async (ativoId) => {
  try {
    const response = await api.get(`/ativos/${ativoId}/imagens`)
    
    if (response.data.success && response.data.data.imagens) {
      const imagens = response.data.data.imagens
      
      imagensAtivo.value = imagens.map(img => ({
        id: img.id,
        nome: img.nome_arquivo || img.caminho,
        url: img.caminho || `/api/ativos/${ativoId}/imagens/${img.nome_arquivo}/download`,
        preview: img.caminho || `/api/ativos/${ativoId}/imagens/${img.nome_arquivo}/download`,
        servidor: true, // Marca como imagem do servidor
        tamanho: img.tamanho,
        tipo: img.tipo
      }))
    } else {
      imagensAtivo.value = []
    }
  } catch (err) {
    console.error('Erro ao carregar imagens do ativo:', err)
    imagensAtivo.value = []
  }
}

// Funções para gerenciar imagens (apenas preview local)
const selecionarImagens = async (event) => {
  const files = Array.from(event.target.files)
  const imagensRestantes = 5 - imagensAtivo.value.length
  
  if (files.length === 0) return
  
  if (files.length > imagensRestantes) {
    error('Limite Excedido', `Você só pode adicionar mais ${imagensRestantes} imagem(ns). Máximo 5 imagens por ativo.`)
    // Seleciona apenas as primeiras imagens até o limite
    files.splice(imagensRestantes)
  }
  
  for (const file of files) {
    // Validar tamanho (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      error('Arquivo Muito Grande', `Arquivo "${file.name}" é muito grande. Máximo 5MB por imagem.`)
      continue
    }
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      error('Tipo Inválido', `Arquivo "${file.name}" não é uma imagem válida.`)
      continue
    }
    
    // Criar preview usando FileReader
    try {
      const dataURL = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
        reader.readAsDataURL(file)
      })
      
      imagensAtivo.value.push({
        arquivo: file,
        url: dataURL,
        nome: file.name,
        tamanho: file.size,
        servidor: false // Marca como imagem nova
      })
    } catch (err) {
      error('Erro de Leitura', `Não foi possível ler o arquivo "${file.name}".`)
    }
  }
  
  // Limpar input para permitir selecionar os mesmos arquivos novamente
  event.target.value = ''
  
  if (imagensAtivo.value.length > 0) {
    const imagensNovas = imagensAtivo.value.filter(img => !img.servidor).length
    success('Imagens Selecionadas', `${imagensNovas} imagem(ns) adicionada(s) para preview.`)
  }
}

const removerImagem = async (index) => {
  const imagem = imagensAtivo.value[index]
  
  // Se é uma imagem já salva no servidor
  if (imagem.id && ativoEdicao.value) {
    try {
      await api.delete(`/ativos/${ativoEdicao.value.id}/imagens/${imagem.id}`)
      success('Imagem removida', 'Imagem removida do servidor com sucesso')
    } catch (err) {
      console.error('Erro ao remover imagem do servidor:', err)
      error('Erro', 'Não foi possível remover a imagem do servidor')
      return
    }
  }
  
  // Remover da lista local
  imagensAtivo.value.splice(index, 1)
}

// Métodos
const carregarAtivos = async () => {
  try {
    carregando.value = true
    const response = await api.get('/ativos')
    
    if (response.data.success) {
      ativos.value = response.data.data.ativos || []
      calcularEstatisticas()
    }
  } catch (err) {
    console.error('Erro ao carregar ativos:', err)
    error('Erro', 'Não foi possível carregar os ativos')
  } finally {
    carregando.value = false
  }
}

const carregarSetores = async () => {
  try {
    const response = await api.get('/setores/ativos')
    if (response.data.success) {
      setores.value = response.data.data.setores || []
    }
  } catch (err) {
    console.error('Erro ao carregar setores:', err)
  }
}

const carregarCategorias = async () => {
  try {
    const response = await api.get('/categories')
    if (response.data.success) {
      categorias.value = response.data.data.categories || []
    }
  } catch (err) {
    console.error('Erro ao carregar categorias:', err)
  }
}

const carregarUsuarios = async () => {
  try {
    const response = await api.get('/users')
    if (response.data.success) {
      usuarios.value = response.data.data.users || []
    }
  } catch (err) {
    console.error('Erro ao carregar usuários:', err)
  }
}

const calcularEstatisticas = () => {
  const total = ativos.value.length
  const operacional = ativos.value.filter(a => a.estado === 'operacional').length
  const manutencao = ativos.value.filter(a => a.estado === 'manutencao').length
  const critica = ativos.value.filter(a => a.criticidade === 'critica' || a.criticidade === 'alta').length

  stats.value = { total, operacional, manutencao, critica }
}

const formatarEstado = (estado) => {
  const estados = {
    'operacional': 'Operacional',
    'manutencao': 'Em Manutenção',
    'parado': 'Parado',
    'descartado': 'Descartado'
  }
  return estados[estado] || estado
}

const formatarCriticidade = (criticidade) => {
  const criticidades = {
    'baixa': 'Baixa',
    'media': 'Média',
    'alta': 'Alta',
    'critica': 'Crítica'
  }
  return criticidades[criticidade] || criticidade
}

const getEstadoClass = (estado) => {
  return {
    'operacional': 'active',
    'manutencao': 'warning',
    'parado': 'danger',
    'descartado': 'inactive'
  }[estado] || ''
}

const getCriticidadeClass = (criticidade) => {
  return criticidade
}

const abrirModalCadastro = () => {
  ativoEdicao.value = null
  imagensAtivo.value = [] // Limpar imagens
  formulario.value = {
    // Identificação
    codigo_patrimonio: '',
    nome: '',
    categoria_id: '',
    setor_id: '',
    
    // Fabricante
    fabricante: '',
    modelo: '',
    numero_serie: '',
    ano_fabricacao: null,
    
    // Localização
    localizacao_completa: '',
    predio: '',
    andar: '',
    sala: '',
    posicao: '',
    
    // Estado e Criticidade
    estado: '',
    criticidade: '',
    responsavel_id: '',
    vida_util_anos: null,
    
    // Características Técnicas
    potencia: '',
    tensao: '',
    frequencia: '',
    peso: null,
    dimensoes: '',
    capacidade: '',
    
    // Financeiro
    data_aquisicao: '',
    valor_aquisicao: null,
    valor_atual: null,
    fornecedor: '',
    garantia_ate: '',
    
    // Manutenção
    data_proxima_inspecao: '',
    horas_funcionamento: null,
    contador_producao: null,
    ultima_manutencao: '',
    
    // Documentação
    especificacoes_tecnicas: '',
    manual_operacao: '',
    manual_manutencao: '',
    observacoes: '',
    
    // Referências
    department_id: 1,
    ativo: true
  }
  modalAberto.value = true
}

const editarAtivo = (ativo) => {
  ativoEdicao.value = ativo
  formulario.value = {
    // Identificação
    codigo_patrimonio: ativo.codigo_patrimonio || '',
    nome: ativo.nome || '',
    categoria_id: ativo.categoria_id || '',
    setor_id: ativo.setor_id || '',
    
    // Fabricante
    fabricante: ativo.fabricante || '',
    modelo: ativo.modelo || '',
    numero_serie: ativo.numero_serie || '',
    ano_fabricacao: ativo.ano_fabricacao || null,
    
    // Localização
    localizacao_completa: ativo.localizacao_completa || '',
    predio: ativo.predio || '',
    andar: ativo.andar || '',
    sala: ativo.sala || '',
    posicao: ativo.posicao || '',
    
    // Estado e Criticidade
    estado: ativo.estado || '',
    criticidade: ativo.criticidade || '',
    responsavel_id: ativo.responsavel_id || '',
    vida_util_anos: ativo.vida_util_anos || null,
    
    // Características Técnicas
    potencia: ativo.potencia || '',
    tensao: ativo.tensao || '',
    frequencia: ativo.frequencia || '',
    peso: ativo.peso || null,
    dimensoes: ativo.dimensoes || '',
    capacidade: ativo.capacidade || '',
    
    // Financeiro
    data_aquisicao: ativo.data_aquisicao ? ativo.data_aquisicao.split('T')[0] : '',
    valor_aquisicao: ativo.valor_aquisicao || null,
    valor_atual: ativo.valor_atual || null,
    fornecedor: ativo.fornecedor || '',
    garantia_ate: ativo.garantia_ate ? ativo.garantia_ate.split('T')[0] : '',
    
    // Manutenção
    data_proxima_inspecao: ativo.data_proxima_inspecao ? ativo.data_proxima_inspecao.split('T')[0] : '',
    horas_funcionamento: ativo.horas_funcionamento || null,
    contador_producao: ativo.contador_producao || null,
    ultima_manutencao: ativo.ultima_manutencao ? ativo.ultima_manutencao.split('T')[0] : '',
    
    // Documentação
    especificacoes_tecnicas: ativo.especificacoes_tecnicas || '',
    manual_operacao: ativo.manual_operacao || '',
    manual_manutencao: ativo.manual_manutencao || '',
    observacoes: ativo.observacoes || '',
    
    // Referências
    department_id: ativo.department_id || 1,
    ativo: ativo.ativo !== undefined ? ativo.ativo : true
  }
  
  // Carregar imagens do ativo
  carregarImagensAtivo(ativo.id)
  
  modalAberto.value = true
}

// Métodos para o modal de imagens
const abrirModalImagens = async (ativo) => {
  ativoSelecionado.value = ativo
  imagensParaUpload.value = []
  imagensExistentes.value = []
  modalImagensAberto.value = true
  
  // Carregar imagens existentes
  await carregarImagensExistentes(ativo.id)
}

const fecharModalImagens = () => {
  modalImagensAberto.value = false
  ativoSelecionado.value = null
  imagensParaUpload.value = []
  imagensExistentes.value = []
  dragOver.value = false
}

const carregarImagensExistentes = async (ativoId) => {
  try {
    const response = await api.get(`/ativos/${ativoId}/imagens`)
    
    if (response.data.success && response.data.data.imagens) {
      const imagens = response.data.data.imagens
      
      imagensExistentes.value = imagens.map(img => ({
        id: img.id,
        nome: img.nome_arquivo || img.caminho,
        url: img.caminho || `/api/ativos/${ativoId}/imagens/${img.nome_arquivo}/download`,
        tamanho: img.tamanho,
        tipo: img.tipo
      }))
    } else {
      imagensExistentes.value = []
    }
  } catch (err) {
    console.error('Erro ao carregar imagens existentes:', err)
    imagensExistentes.value = []
  }
}

const handleDrop = (event) => {
  dragOver.value = false
  const files = Array.from(event.dataTransfer.files)
  processarArquivos(files)
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  processarArquivos(files)
  // Limpar input para permitir selecionar os mesmos arquivos novamente
  event.target.value = ''
}

const processarArquivos = async (files) => {
  const totalImagens = imagensExistentes.value.length + imagensParaUpload.value.length
  const imagensRestantes = 5 - totalImagens
  
  if (files.length === 0) return
  
  if (files.length > imagensRestantes) {
    error('Limite Excedido', `Você só pode adicionar mais ${imagensRestantes} imagem(ns). Máximo 5 imagens por ativo.`)
    // Seleciona apenas as primeiras imagens até o limite
    files.splice(imagensRestantes)
  }
  
  for (const file of files) {
    // Validar tamanho (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      error('Arquivo Muito Grande', `Arquivo "${file.name}" é muito grande. Máximo 5MB por imagem.`)
      continue
    }
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      error('Tipo Inválido', `Arquivo "${file.name}" não é uma imagem válida.`)
      continue
    }
    
    // Criar preview usando FileReader
    try {
      const dataURL = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
        reader.readAsDataURL(file)
      })
      
      imagensParaUpload.value.push({
        arquivo: file,
        preview: dataURL,
        nome: file.name,
        tamanho: file.size
      })
    } catch (err) {
      error('Erro de Leitura', `Não foi possível ler o arquivo "${file.name}".`)
    }
  }
  
  if (imagensParaUpload.value.length > 0) {
    success('Imagens Selecionadas', `${files.length} imagem(ns) selecionada(s) para upload.`)
  }
}

const removerImagemUpload = (index) => {
  imagensParaUpload.value.splice(index, 1)
}

const enviarImagens = async () => {
  if (imagensParaUpload.value.length === 0) return
  
  try {
    uploadando.value = true
    
    const formData = new FormData()
    imagensParaUpload.value.forEach(img => {
      formData.append('imagens', img.arquivo)
    })
    
    await api.post(`/ativos/${ativoSelecionado.value.id}/imagens`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    success('Sucesso', `${imagensParaUpload.value.length} imagem(ns) enviada(s) com sucesso!`)
    
    // Limpar upload e recarregar imagens existentes
    imagensParaUpload.value = []
    await carregarImagensExistentes(ativoSelecionado.value.id)
    
  } catch (err) {
    console.error('Erro no upload de imagens:', err)
    error('Erro', 'Não foi possível enviar as imagens')
  } finally {
    uploadando.value = false
  }
}

const excluirImagemExistente = async (index, imagem) => {
  if (!confirm(`Deseja realmente excluir a imagem "${imagem.nome}"?`)) {
    return
  }
  
  try {
    await api.delete(`/ativos/${ativoSelecionado.value.id}/imagens/${imagem.id}`)
    success('Sucesso', 'Imagem excluída com sucesso')
    
    // Remover da lista local
    imagensExistentes.value.splice(index, 1)
    
  } catch (err) {
    console.error('Erro ao excluir imagem:', err)
    error('Erro', 'Não foi possível excluir a imagem')
  }
}

const visualizarImagem = (imagem) => {
  imagemVisualizacao.value = imagem
}

const fecharVisualizacaoImagem = () => {
  imagemVisualizacao.value = null
}

const formatarTamanho = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const excluirAtivo = async (ativo) => {
  if (!confirm(`Deseja realmente excluir o ativo ${ativo.codigo_patrimonio}?`)) {
    return
  }

  try {
    await api.delete(`/ativos/${ativo.id}`)
    success('Sucesso', 'Ativo excluído com sucesso')
    await carregarAtivos()
  } catch (err) {
    console.error('Erro ao excluir ativo:', err)
    error('Erro', 'Não foi possível excluir o ativo')
  }
}

const salvarAtivo = async () => {
  try {
    salvando.value = true
    
    // Validações básicas obrigatórias
    if (!formulario.value.codigo_patrimonio || formulario.value.codigo_patrimonio.trim() === '') {
      error('Erro de Validação', 'Código patrimonial é obrigatório')
      return
    }
    
    if (!formulario.value.nome || formulario.value.nome.trim() === '') {
      error('Erro de Validação', 'Nome do ativo é obrigatório')
      return
    }
    
    // Validar datas se fornecidas
    const datasParaValidar = [
      { campo: 'data_aquisicao', nome: 'Data de Aquisição' },
      { campo: 'garantia_ate', nome: 'Garantia até' },
      { campo: 'data_proxima_inspecao', nome: 'Data da Próxima Inspeção' },
      { campo: 'ultima_manutencao', nome: 'Última Manutenção' }
    ]
    
    for (const { campo, nome } of datasParaValidar) {
      const valor = formulario.value[campo]
      if (valor && valor !== '' && !validarData(valor)) {
        error('Data Inválida', `${nome} tem um formato inválido`)
        return
      }
    }
    
    // Validar setor obrigatório
    if (!formulario.value.setor_id) {
      error('Setor obrigatório', 'Selecione o setor do ativo antes de salvar');
      return;
    }

    // Limpar campos vazios e garantir tipos corretos
    const dadosLimpos = {
      ...formulario.value,
      codigo_patrimonio: formulario.value.codigo_patrimonio.trim(),
      nome: formulario.value.nome.trim(),
      // Converter valores numéricos
      ano_fabricacao: formulario.value.ano_fabricacao ? parseInt(formulario.value.ano_fabricacao) : null,
      valor_aquisicao: formulario.value.valor_aquisicao ? parseFloat(formulario.value.valor_aquisicao) : null,
      valor_atual: formulario.value.valor_atual ? parseFloat(formulario.value.valor_atual) : null,
      peso: formulario.value.peso ? parseFloat(formulario.value.peso) : null,
      vida_util_anos: formulario.value.vida_util_anos ? parseInt(formulario.value.vida_util_anos) : null,
      horas_funcionamento: formulario.value.horas_funcionamento ? parseInt(formulario.value.horas_funcionamento) : null,
      contador_producao: formulario.value.contador_producao ? parseInt(formulario.value.contador_producao) : null,
      // Tratar datas corretamente
      data_aquisicao: validarData(formulario.value.data_aquisicao),
      garantia_ate: validarData(formulario.value.garantia_ate),
      data_proxima_inspecao: validarData(formulario.value.data_proxima_inspecao),
      ultima_manutencao: validarData(formulario.value.ultima_manutencao),
      // Garantir IDs como números
      categoria_id: formulario.value.categoria_id ? parseInt(formulario.value.categoria_id) : null,
      setor_id: formulario.value.setor_id ? parseInt(formulario.value.setor_id) : null,
      responsavel_id: formulario.value.responsavel_id ? parseInt(formulario.value.responsavel_id) : null,
      department_id: formulario.value.department_id ? parseInt(formulario.value.department_id) : null
    }
    
    // Log para debug
    console.log('Dados limpos a serem enviados:', dadosLimpos)
    
    // CRUD: Criar ou atualizar ativo
    let ativoId = null
    if (ativoEdicao.value) {
      await api.put(`/ativos/${ativoEdicao.value.id}`, dadosLimpos)
      ativoId = ativoEdicao.value.id
      success('Sucesso', 'Ativo atualizado com sucesso')
    } else {
      const response = await api.post('/ativos', dadosLimpos)
      ativoId = response.data.data.ativo.id
      success('Sucesso', 'Ativo cadastrado com sucesso')
    }
    
    // Upload de imagens (se houver imagens novas)
    const imagensNovas = imagensAtivo.value.filter(img => img.arquivo)
    if (imagensNovas.length > 0) {
      const formData = new FormData()
      imagensNovas.forEach(img => {
        formData.append('imagens', img.arquivo)
      })
      
      try {
        await api.post(`/ativos/${ativoId}/imagens`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        success('Imagens', `${imagensNovas.length} imagem(ns) enviada(s) com sucesso`)
      } catch (imgError) {
        console.error('Erro no upload de imagens:', imgError)
        error('Aviso', 'Ativo salvo, mas houve erro no upload das imagens')
      }
    }
    
    fecharModal()
    await carregarAtivos()
  } catch (err) {
    console.error('Erro ao salvar ativo:', err)
    console.error('Resposta do servidor:', err.response?.data)
    
    // Melhor tratamento de erro
    let mensagemErro = 'Não foi possível salvar o ativo'
    if (err.response?.data?.message) {
      mensagemErro = err.response.data.message
    } else if (err.response?.data?.error) {
      mensagemErro = err.response.data.error
    } else if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
      mensagemErro = err.response.data.errors.map(e => e.message || e).join(', ')
    }
    
    error('Erro', mensagemErro)
  } finally {
    salvando.value = false
  }
}

const fecharModal = () => {
  modalAberto.value = false
  ativoEdicao.value = null
  imagensAtivo.value = [] // Limpar imagens
}

// Watchers para filtros
watch([() => filtros.value.busca, () => filtros.value.estado, () => filtros.value.criticidade], () => {
  // Os filtros são reativos através do computed ativosFiltrados
}, { deep: true })

// Lifecycle
onMounted(() => {
  carregarAtivos()
  carregarSetores()
  carregarCategorias()
  carregarUsuarios()
})
</script>

<style scoped>
.ativos-page {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  color: var(--color-primary);
  font-size: 2rem;
  margin: 0;
}

.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.card {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-light-gray);
}

.card h3 {
  color: var(--color-primary);
  font-size: 1.1rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.card-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stats-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-secondary);
  line-height: 1;
  transition: opacity 0.3s ease;
}

.stats-number.loading {
  opacity: 0.5;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

.stats-label {
  color: var(--color-dark-gray);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.ativos-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.form-input,
.form-select {
  padding: 0.75rem 1rem;
  border: 2px solid var(--color-light-gray);
  border-radius: var(--border-radius-md);
  font-size: 1rem;
  background: var(--color-white);
}

.form-input {
  min-width: 300px;
  flex: 1;
}

.form-select {
  min-width: 200px;
}

.ativos-table {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-light-gray);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: var(--color-primary);
  color: var(--color-white);
  padding: 1rem;
  text-align: left;
  font-weight: 600;
}

td {
  padding: 1rem;
  border-bottom: 1px solid var(--color-light-gray);
}

tr:last-child td {
  border-bottom: none;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.active {
  background: #e8f5e8;
  color: #2e7d32;
}

.status-badge.warning {
  background: #fff3e0;
  color: #f57c00;
}

.status-badge.danger {
  background: #ffebee;
  color: #d32f2f;
}

.status-badge.inactive {
  background: #f5f5f5;
  color: #666;
}

.criticidade-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.criticidade-badge.baixa {
  background: #e8f5e8;
  color: #2e7d32;
}

.criticidade-badge.media {
  background: #e3f2fd;
  color: #1976d2;
}

.criticidade-badge.alta {
  background: #fff3e0;
  color: #f57c00;
}

.criticidade-badge.critica {
  background: #ffebee;
  color: #d32f2f;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.no-data {
  text-align: center;
  color: var(--color-dark-gray);
  padding: 2rem;
  font-style: italic;
}

.setor-badge {
  padding: 0.2rem 0.6rem;
  background: var(--color-light);
  color: var(--color-primary);
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

/* Botões */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-create,
.btn-primary {
  background: #3498db;
  color: white;
}

.btn-create:hover,
.btn-primary:hover {
  background: #28a745;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-outline {
  background: transparent;
  color: #3498db;
  border: 2px solid #3498db;
}

.btn-outline:hover {
  background: #3498db;
  color: white;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* Modal styles */
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

.modal-container {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  width: 95%;
  max-width: 900px;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-light-gray);
}

.modal-header h2 {
  color: var(--color-primary);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-dark-gray);
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: var(--color-light-gray);
}

.modal-form {
  padding: 1.5rem 2rem;
  box-sizing: border-box;
  overflow-y: auto;
  flex: 1;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 0.75rem;
  width: 100%;
  box-sizing: border-box;
}

.form-group {
  margin-bottom: 0.75rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-dark);
}

/* Indicador visual para campos obrigatórios */
.form-label[for*="codigo_patrimonio"]::after,
.form-label[for*="nome"]::after {
  content: " *";
  color: #ef4444;
  font-weight: bold;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding: 1rem 2rem;
  border-top: 1px solid var(--color-light-gray);
  background: var(--color-white);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .ativos-page {
    padding: 1rem;
  }
  
  .dashboard-cards {
    grid-template-columns: 1fr;
  }
  
  .ativos-filters {
    flex-direction: column;
  }
  
  .form-input {
    min-width: auto;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-container {
    width: 95%;
    max-width: 95vw;
    max-height: 95vh;
    margin: 0.5rem;
  }
  
  .modal-form {
    padding: 1rem;
  }
  
  .modal-actions {
    padding: 1rem;
    flex-direction: column;
  }
  
  .modal-actions .btn {
    width: 100%;
    justify-content: center;
  }
}

.imagens-placeholder {
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  color: #6c757d;
  font-style: italic;
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.form-group:has(.imagens-ativo) {
  grid-column: 1 / -1;
}

/* Estilos para seções do formulário */
.form-sections {
  padding: 20px;
}

.form-section {
  margin-bottom: 2rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.section-title {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 1rem 1.5rem;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title i {
  color: #6366f1;
  font-size: 1.1rem;
}

.form-section .form-grid,
.form-section .form-group {
  padding: 1.5rem;
  padding-bottom: 0;
}

.form-section .form-group:last-child {
  padding-bottom: 1.5rem;
}

/* Estilos para seção de imagens simples */
.imagens-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1.5rem;
  padding-bottom: 0;
}

.imagem-item {
  position: relative;
  min-width: 200px;
  height: 150px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  background: white;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.imagem-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.2s;
  cursor: pointer;
}

.imagem-thumb:hover {
  opacity: 0.9;
}

.imagem-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border-color: #3b82f6;
}

.btn-remover-imagem {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: background-color 0.2s;
}

.btn-remover-imagem:hover {
  background: rgba(185, 28, 28, 1);
}

.upload-simples {
  padding: 1.5rem;
  text-align: center;
}

.upload-info {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.upload-nota {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.upload-nota i {
  color: #f59e0b;
}

/* Estilos para botão de imagens */
.btn-images {
  background: #8b5cf6;
  color: white;
}

.btn-images:hover {
  background: #7c3aed;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(139, 92, 246, 0.3);
}

/* Estilos para modal de imagens */
.modal-imagens {
  max-width: 1000px;
  max-height: 90vh;
}

.ativo-info {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
}

.info-item {
  font-size: 0.9rem;
}

.info-item strong {
  color: #374151;
  margin-right: 0.5rem;
}

.upload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.preview-section h3,
.existentes-section h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: #374151;
  font-size: 1.1rem;
  font-weight: 600;
}

.btn-upload-imagens {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.btn-upload-imagens:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
}

.btn-upload-imagens:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* CSS da área de upload removido - agora usando botão */

.upload-content {
  pointer-events: none;
}

.upload-icon {
  font-size: 3rem;
  color: #9ca3af;
  margin-bottom: 1rem;
  display: block;
}

.upload-text {
  font-size: 1.1rem;
  color: #374151;
  margin-bottom: 0.5rem;
}

.upload-link {
  color: #3b82f6;
  font-weight: 600;
}

.upload-info {
  font-size: 0.9rem;
  color: #6b7280;
}

.upload-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #10b981;
}

.upload-loading i {
  font-size: 2rem;
}

.preview-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  border: 2px dashed #3b82f6;
  position: relative;
}

.preview-section::before {
  content: "";
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  background: linear-gradient(45deg, #3b82f6, #8b5cf6, #3b82f6);
  border-radius: 12px;
  z-index: -1;
  opacity: 0.1;
}

.existentes-section {
  margin-bottom: 1.5rem;
}

.preview-grid,
.existentes-grid {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding: 1rem 0;
  scroll-behavior: smooth;
}

.existentes-grid::-webkit-scrollbar {
  height: 8px;
}

.existentes-grid::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.existentes-grid::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.existentes-grid::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.preview-item,
.existente-item {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-width: 200px;
  height: 150px;
  flex-shrink: 0;
}

.preview-item:hover,
.existente-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.preview-thumb,
.existente-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.preview-thumb:hover,
.existente-thumb:hover {
  transform: scale(1.05);
}

.preview-info,
.existente-info {
  display: none;
}

.preview-name,
.existente-name {
  display: block;
  font-weight: 600;
  color: #1f2937;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.preview-size,
.existente-size {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
}

.btn-remover-preview {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(220, 38, 38, 0.95);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  opacity: 0;
}

.preview-item:hover .btn-remover-preview {
  opacity: 1;
}

.btn-remover-preview:hover {
  background: rgba(185, 28, 28, 1);
  transform: scale(1.1);
}

.existente-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.existente-item:hover .existente-actions {
  opacity: 1;
}

.btn-acao {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.btn-acao.btn-view {
  background: rgba(59, 130, 246, 0.95);
  color: white;
}

.btn-acao.btn-view:hover {
  background: rgba(37, 99, 235, 1);
  transform: scale(1.1);
}

.btn-acao.btn-delete {
  background: rgba(220, 38, 38, 0.95);
  color: white;
}

.btn-acao.btn-delete:hover {
  background: rgba(185, 28, 28, 1);
  transform: scale(1.1);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 12px;
  border: 2px dashed #d1d5db;
}

.empty-icon {
  font-size: 5rem;
  color: #d1d5db;
  margin-bottom: 1.5rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.empty-text {
  font-size: 1.3rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

.empty-subtitle {
  font-size: 1.1rem;
  color: #6b7280;
}

/* Modal de visualização de imagem */
.modal-image-view {
  max-width: 70vw;
  max-height: 85vh;
  width: auto;
}

.modal-image-view .modal-header {
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  color: white;
  border-bottom: none;
}

.modal-image-view .modal-close {
  color: white;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.modal-image-view .modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.image-view-content {
  padding: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  max-height: 70vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.image-full {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
}

.image-full:hover {
  transform: scale(1.02);
}

@media (max-width: 768px) {
  .upload-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .btn-upload-imagens {
    align-self: stretch;
    justify-content: center;
  }
  
  .modal-image-view {
    max-width: 95vw;
    max-height: 90vh;
  }
  
  .image-view-content {
    padding: 1rem;
    min-height: 200px;
    max-height: 75vh;
  }
  
  .imagens-preview {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.75rem;
  }
  
  .ativo-info {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .upload-area {
    padding: 2rem 1rem;
  }
  
  .preview-grid,
  .existentes-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .preview-thumb,
  .existente-thumb {
    height: 160px;
  }
  
  .modal-imagens {
    max-width: 95vw;
    max-height: 95vh;
  }
  
  .image-view-content {
    padding: 1rem;
    min-height: 300px;
    max-height: 70vh;
  }
}
</style>