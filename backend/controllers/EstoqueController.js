const { 
  CategoriaEstoque, 
  Fornecedor, 
  ItemEstoque, 
  MovimentacaoEstoque, 
  User, 
  Setor, 
  OrdemServico, 
  PlanoPreventivo 
} = require('../models');
const { Op } = require('sequelize');

class EstoqueController {
  // ========== CATEGORIAS DE ESTOQUE ==========
  
  async listarCategorias(req, res) {
    try {
      const { page = 1, limit = 10, search = '', ativo = null } = req.query;
      
      const where = {};
      
      if (search) {
        where[Op.or] = [
          { nome: { [Op.like]: `%${search}%` } },
          { codigo: { [Op.like]: `%${search}%` } },
          { descricao: { [Op.like]: `%${search}%` } }
        ];
      }
      
      if (ativo !== null) {
        where.ativo = ativo === 'true';
      }

      const offset = (page - 1) * limit;
      
      const { count, rows } = await CategoriaEstoque.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['nome', 'ASC']],
        include: [{
          model: ItemEstoque,
          as: 'itens',
          attributes: []
        }]
      });

      // Adicionar estatísticas para cada categoria
      for (let categoria of rows) {
        const stats = await categoria.obterEstatisticas();
        categoria.dataValues.estatisticas = stats;
      }

      res.json({
        categorias: rows,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalItems: count
      });
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async obterCategoria(req, res) {
    try {
      const { id } = req.params;
      
      const categoria = await CategoriaEstoque.findByPk(id, {
        include: [{
          model: ItemEstoque,
          as: 'itens',
          include: [
            { model: CategoriaEstoque, as: 'categoria' },
            { model: Fornecedor, as: 'fornecedor' }
          ]
        }]
      });

      if (!categoria) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }

      const estatisticas = await categoria.obterEstatisticas();
      categoria.dataValues.estatisticas = estatisticas;

      res.json(categoria);
    } catch (error) {
      console.error('Erro ao obter categoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async criarCategoria(req, res) {
    try {
      const categoriaData = req.body;
      
      const categoria = await CategoriaEstoque.create(categoriaData);
      
      res.status(201).json(categoria);
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: error.errors.map(e => e.message)
        });
      }
      
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async atualizarCategoria(req, res) {
    try {
      const { id } = req.params;
      const categoriaData = req.body;
      
      const categoria = await CategoriaEstoque.findByPk(id);
      
      if (!categoria) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }
      
      await categoria.update(categoriaData);
      
      res.json(categoria);
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: error.errors.map(e => e.message)
        });
      }
      
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async excluirCategoria(req, res) {
    try {
      const { id } = req.params;
      
      const categoria = await CategoriaEstoque.findByPk(id);
      
      if (!categoria) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }

      // Verificar se existem itens vinculados
      const itensVinculados = await ItemEstoque.count({
        where: { categoria_estoque_id: id }
      });

      if (itensVinculados > 0) {
        return res.status(400).json({ 
          error: 'Não é possível excluir categoria com itens vinculados',
          itensVinculados
        });
      }
      
      await categoria.destroy();
      
      res.json({ message: 'Categoria excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // ========== FORNECEDORES ==========
  
  async listarFornecedores(req, res) {
    try {
      const { page = 1, limit = 10, search = '', ativo = null } = req.query;
      
      const where = {};
      
      if (search) {
        where[Op.or] = [
          { nome: { [Op.like]: `%${search}%` } },
          { cnpj: { [Op.like]: `%${search}%` } },
          { razao_social: { [Op.like]: `%${search}%` } }
        ];
      }
      
      if (ativo !== null) {
        where.ativo = ativo === 'true';
      }

      const offset = (page - 1) * limit;
      
      const { count, rows } = await Fornecedor.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['nome', 'ASC']]
      });

      res.json({
        fornecedores: rows,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalItems: count
      });
    } catch (error) {
      console.error('Erro ao listar fornecedores:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async obterFornecedor(req, res) {
    try {
      const { id } = req.params;
      
      const fornecedor = await Fornecedor.findByPk(id, {
        include: [{
          model: ItemEstoque,
          as: 'itens_fornecidos',
          include: [{ model: CategoriaEstoque, as: 'categoria' }]
        }]
      });

      if (!fornecedor) {
        return res.status(404).json({ error: 'Fornecedor não encontrado' });
      }

      const estatisticas = await fornecedor.obterEstatisticas();
      fornecedor.dataValues.estatisticas = estatisticas;

      res.json(fornecedor);
    } catch (error) {
      console.error('Erro ao obter fornecedor:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async criarFornecedor(req, res) {
    try {
      const fornecedorData = req.body;
      
      const fornecedor = await Fornecedor.create(fornecedorData);
      
      res.status(201).json(fornecedor);
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: error.errors.map(e => e.message)
        });
      }
      
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async atualizarFornecedor(req, res) {
    try {
      const { id } = req.params;
      const fornecedorData = req.body;
      
      const fornecedor = await Fornecedor.findByPk(id);
      
      if (!fornecedor) {
        return res.status(404).json({ error: 'Fornecedor não encontrado' });
      }
      
      await fornecedor.update(fornecedorData);
      
      res.json(fornecedor);
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: error.errors.map(e => e.message)
        });
      }
      
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async excluirFornecedor(req, res) {
    try {
      const { id } = req.params;
      
      const fornecedor = await Fornecedor.findByPk(id);
      
      if (!fornecedor) {
        return res.status(404).json({ error: 'Fornecedor não encontrado' });
      }

      // Verificar se existem itens vinculados
      const itensVinculados = await ItemEstoque.count({
        where: { fornecedor_id: id }
      });

      if (itensVinculados > 0) {
        return res.status(400).json({ 
          error: 'Não é possível excluir fornecedor com itens vinculados',
          itensVinculados
        });
      }
      
      await fornecedor.destroy();
      
      res.json({ message: 'Fornecedor excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // ========== ITENS DE ESTOQUE ==========
  
  async listarItens(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        categoria_id = null,
        fornecedor_id = null,
        ativo = null,
        baixo_estoque = null,
        critico = null
      } = req.query;
      
      const where = {};
      
      if (search) {
        where[Op.or] = [
          { nome: { [Op.like]: `%${search}%` } },
          { codigo: { [Op.like]: `%${search}%` } },
          { descricao: { [Op.like]: `%${search}%` } }
        ];
      }
      
      if (categoria_id) where.categoria_estoque_id = categoria_id;
      if (fornecedor_id) where.fornecedor_id = fornecedor_id;
      if (ativo !== null) where.ativo = ativo === 'true';

      // Filtros especiais
      if (baixo_estoque === 'true') {
        where[Op.or] = [
          { '$quantidade_atual <= ponto_reposicao$': null }
        ];
      }

      if (critico === 'true') {
        where.nivel_criticidade = 'critico';
      }

      const offset = (page - 1) * limit;
      
      const { count, rows } = await ItemEstoque.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['nome', 'ASC']],
        include: [
          { model: CategoriaEstoque, as: 'categoria' },
          { model: Fornecedor, as: 'fornecedor' }
        ]
      });

      // Adicionar informações de status para cada item
      const itensComStatus = rows.map(item => {
        const itemData = item.toJSON();
        itemData.status_estoque = item.getStatusEstoque();
        itemData.dias_para_reposicao = item.calcularDiasParaReposicao();
        itemData.estoque_baixo = item.isEstoqueBaixo();
        return itemData;
      });

      res.json({
        itens: itensComStatus,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalItems: count
      });
    } catch (error) {
      console.error('Erro ao listar itens:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async obterItem(req, res) {
    try {
      const { id } = req.params;
      
      const item = await ItemEstoque.findByPk(id, {
        include: [
          { model: CategoriaEstoque, as: 'categoria' },
          { model: Fornecedor, as: 'fornecedor' },
          {
            model: MovimentacaoEstoque,
            as: 'movimentacoes',
            limit: 10,
            order: [['data_movimentacao', 'DESC']],
            include: [
              { model: User, as: 'usuario', attributes: ['id', 'nome'] }
            ]
          }
        ]
      });

      if (!item) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      const itemData = item.toJSON();
      itemData.status_estoque = item.getStatusEstoque();
      itemData.dias_para_reposicao = item.calcularDiasParaReposicao();
      itemData.estoque_baixo = item.isEstoqueBaixo();

      res.json(itemData);
    } catch (error) {
      console.error('Erro ao obter item:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async criarItem(req, res) {
    try {
      const itemData = req.body;
      
      const item = await ItemEstoque.create(itemData);
      
      // Buscar item com associações
      const itemCompleto = await ItemEstoque.findByPk(item.id, {
        include: [
          { model: CategoriaEstoque, as: 'categoria' },
          { model: Fornecedor, as: 'fornecedor' }
        ]
      });
      
      res.status(201).json(itemCompleto);
    } catch (error) {
      console.error('Erro ao criar item:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: error.errors.map(e => e.message)
        });
      }
      
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async atualizarItem(req, res) {
    try {
      const { id } = req.params;
      const itemData = req.body;
      
      const item = await ItemEstoque.findByPk(id);
      
      if (!item) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }
      
      await item.update(itemData);
      
      // Buscar item atualizado com associações
      const itemAtualizado = await ItemEstoque.findByPk(id, {
        include: [
          { model: CategoriaEstoque, as: 'categoria' },
          { model: Fornecedor, as: 'fornecedor' }
        ]
      });
      
      res.json(itemAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: error.errors.map(e => e.message)
        });
      }
      
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async excluirItem(req, res) {
    try {
      const { id } = req.params;
      
      const item = await ItemEstoque.findByPk(id);
      
      if (!item) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      // Verificar se existem movimentações
      const movimentacoes = await MovimentacaoEstoque.count({
        where: { item_estoque_id: id }
      });

      if (movimentacoes > 0) {
        return res.status(400).json({ 
          error: 'Não é possível excluir item com movimentações',
          movimentacoes
        });
      }
      
      await item.destroy();
      
      res.json({ message: 'Item excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // ========== MOVIMENTAÇÕES DE ESTOQUE ==========
  
  async listarMovimentacoes(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10,
        item_id = null,
        tipo = null,
        data_inicio = null,
        data_fim = null,
        status = null
      } = req.query;
      
      const where = {};
      
      if (item_id) where.item_estoque_id = item_id;
      if (tipo) where.tipo_movimentacao = tipo;
      if (status) where.status = status;
      
      if (data_inicio && data_fim) {
        where.data_movimentacao = {
          [Op.between]: [new Date(data_inicio), new Date(data_fim)]
        };
      }

      const offset = (page - 1) * limit;
      
      const { count, rows } = await MovimentacaoEstoque.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['data_movimentacao', 'DESC']],
        include: [
          { 
            model: ItemEstoque, 
            as: 'item_estoque',
            include: [{ model: CategoriaEstoque, as: 'categoria' }]
          },
          { model: Fornecedor, as: 'fornecedor' },
          { model: User, as: 'usuario', attributes: ['id', 'nome'] },
          { model: User, as: 'aprovado_por', attributes: ['id', 'nome'] }
        ]
      });

      res.json({
        movimentacoes: rows,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalItems: count
      });
    } catch (error) {
      console.error('Erro ao listar movimentações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async criarMovimentacao(req, res) {
    try {
      const movimentacaoData = req.body;
      movimentacaoData.usuario_id = req.user.id;
      
      // Obter quantidade atual do item antes da movimentação
      const item = await ItemEstoque.findByPk(movimentacaoData.item_estoque_id);
      if (!item) {
        return res.status(404).json({ error: 'Item de estoque não encontrado' });
      }
      
      movimentacaoData.quantidade_anterior = item.quantidade_atual;
      
      // Calcular quantidade posterior
      let quantidadePosterior;
      if (movimentacaoData.operacao === 'soma') {
        quantidadePosterior = parseFloat(item.quantidade_atual) + parseFloat(movimentacaoData.quantidade);
      } else {
        quantidadePosterior = parseFloat(item.quantidade_atual) - parseFloat(movimentacaoData.quantidade);
      }
      
      // Verificar se a quantidade posterior não fica negativa
      if (quantidadePosterior < 0) {
        return res.status(400).json({ 
          error: 'Quantidade insuficiente em estoque',
          quantidadeDisponivel: item.quantidade_atual
        });
      }
      
      movimentacaoData.quantidade_posterior = quantidadePosterior;
      
      const movimentacao = await MovimentacaoEstoque.create(movimentacaoData);
      
      // Buscar movimentação completa
      const movimentacaoCompleta = await MovimentacaoEstoque.findByPk(movimentacao.id, {
        include: [
          { 
            model: ItemEstoque, 
            as: 'item_estoque',
            include: [{ model: CategoriaEstoque, as: 'categoria' }]
          },
          { model: Fornecedor, as: 'fornecedor' },
          { model: User, as: 'usuario', attributes: ['id', 'nome'] }
        ]
      });
      
      res.status(201).json(movimentacaoCompleta);
    } catch (error) {
      console.error('Erro ao criar movimentação:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: error.errors.map(e => e.message)
        });
      }
      
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // ========== RELATÓRIOS ==========
  
  async relatorioEstoque(req, res) {
    try {
      const { 
        categoria_id = null,
        fornecedor_id = null,
        baixo_estoque = null,
        critico = null
      } = req.query;
      
      const where = { ativo: true };
      
      if (categoria_id) where.categoria_estoque_id = categoria_id;
      if (fornecedor_id) where.fornecedor_id = fornecedor_id;
      if (critico === 'true') where.nivel_criticidade = 'critico';
      
      const itens = await ItemEstoque.findAll({
        where,
        include: [
          { model: CategoriaEstoque, as: 'categoria' },
          { model: Fornecedor, as: 'fornecedor' }
        ],
        order: [['categoria', 'nome'], ['nome']]
      });
      
      let itensFiltrados = itens;
      
      if (baixo_estoque === 'true') {
        itensFiltrados = itens.filter(item => item.isEstoqueBaixo());
      }
      
      const relatorio = itensFiltrados.map(item => ({
        ...item.toJSON(),
        status_estoque: item.getStatusEstoque(),
        estoque_baixo: item.isEstoqueBaixo(),
        dias_para_reposicao: item.calcularDiasParaReposicao()
      }));
      
      // Calcular totais
      const totais = {
        total_itens: relatorio.length,
        valor_total_estoque: relatorio.reduce((acc, item) => acc + parseFloat(item.valor_total || 0), 0),
        itens_baixo_estoque: relatorio.filter(item => item.estoque_baixo).length,
        itens_criticos: relatorio.filter(item => item.nivel_criticidade === 'critico').length
      };
      
      res.json({
        relatorio,
        totais
      });
    } catch (error) {
      console.error('Erro ao gerar relatório de estoque:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async relatorioMovimentacoes(req, res) {
    try {
      const { data_inicio, data_fim } = req.query;
      
      if (!data_inicio || !data_fim) {
        return res.status(400).json({ 
          error: 'Data de início e fim são obrigatórias' 
        });
      }
      
      const movimentacoes = await MovimentacaoEstoque.relatorioPorPeriodo(
        new Date(data_inicio),
        new Date(data_fim)
      );
      
      const estatisticas = await MovimentacaoEstoque.estatisticasPorTipo(
        new Date(data_inicio),
        new Date(data_fim)
      );
      
      res.json({
        movimentacoes,
        estatisticas,
        periodo: { data_inicio, data_fim }
      });
    } catch (error) {
      console.error('Erro ao gerar relatório de movimentações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async alertasEstoque(req, res) {
    try {
      // Itens com baixo estoque
      const itensBaixoEstoque = await ItemEstoque.itensBaixoEstoque();
      
      // Itens críticos
      const itensCriticos = await ItemEstoque.findAll({
        where: { 
          nivel_criticidade: 'critico',
          ativo: true 
        },
        include: [
          { model: CategoriaEstoque, as: 'categoria' },
          { model: Fornecedor, as: 'fornecedor' }
        ]
      });
      
      // Itens vencidos ou próximos do vencimento (se houver controle de validade)
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + 30); // 30 dias
      
      const movimentacoesVencimento = await MovimentacaoEstoque.findAll({
        where: {
          data_validade: {
            [Op.lte]: dataLimite,
            [Op.gte]: new Date()
          }
        },
        include: [
          { model: ItemEstoque, as: 'item_estoque' }
        ],
        order: [['data_validade', 'ASC']]
      });
      
      res.json({
        baixo_estoque: itensBaixoEstoque,
        criticos: itensCriticos,
        proximos_vencimento: movimentacoesVencimento
      });
    } catch (error) {
      console.error('Erro ao obter alertas de estoque:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = new EstoqueController();