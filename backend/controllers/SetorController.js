const { Setor, User, Ativo } = require('../models');
const { Op } = require('sequelize');

class SetorController {
  // Listar todos os setores com filtros e paginação
  async index(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search, 
        ativo, 
        responsavel_id,
        incluir_estatisticas = false 
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Filtros
      if (search) {
        where[Op.or] = [
          { nome: { [Op.like]: `%${search}%` } },
          { codigo: { [Op.like]: `%${search}%` } },
          { descricao: { [Op.like]: `%${search}%` } }
        ];
      }

      if (ativo !== undefined) {
        where.ativo = ativo === 'true';
      }

      if (responsavel_id) {
        where.responsavel_id = responsavel_id;
      }

      // Includes condicionais
      const include = [
        {
          model: User,
          as: 'responsavel',
          attributes: ['id', 'nome', 'email', 'perfil']
        }
      ];

      if (incluir_estatisticas === 'true') {
        include.push({
          model: Ativo,
          as: 'ativos',
          attributes: ['id', 'estado', 'criticidade'],
          required: false
        });
      }

      const { count, rows: setores } = await Setor.findAndCountAll({
        where,
        include,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['nome', 'ASC']],
        distinct: true
      });

      // Calcular estatísticas se solicitado
      if (incluir_estatisticas === 'true') {
        setores.forEach(setor => {
          setor.dataValues.estatisticas = setor.getStatusAtivos();
        });
      }

      return res.json({
        success: true,
        message: 'Setores listados com sucesso',
        data: {
          setores,
          pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Erro ao listar setores:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Buscar setor específico
  async show(req, res) {
    try {
      const { id } = req.params;
      const { incluir_ativos = false } = req.query;

      const include = [
        {
          model: User,
          as: 'responsavel',
          attributes: ['id', 'nome', 'email', 'perfil']
        }
      ];

      if (incluir_ativos === 'true') {
        include.push({
          model: Ativo,
          as: 'ativos',
          attributes: [
            'id', 'codigo_patrimonio', 'nome', 'estado', 
            'criticidade', 'localizacao', 'created_at'
          ],
          required: false
        });
      }

      const setor = await Setor.findByPk(id, { include });

      if (!setor) {
        return res.status(404).json({
          success: false,
          message: 'Setor não encontrado'
        });
      }

      // Calcular estatísticas dos ativos
      if (incluir_ativos === 'true') {
        setor.dataValues.estatisticas = setor.getStatusAtivos();
      }

      return res.json({
        success: true,
        message: 'Setor encontrado',
        data: { setor }
      });

    } catch (error) {
      console.error('Erro ao buscar setor:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Criar novo setor
  async store(req, res) {
    try {
      const { codigo, nome, descricao, localizacao, responsavel_id } = req.body;

      // Validações básicas
      if (!codigo || !nome) {
        return res.status(400).json({
          success: false,
          message: 'Código e nome são obrigatórios'
        });
      }

      // Verificar se o código já existe
      const setorExistente = await Setor.findOne({ where: { codigo } });
      if (setorExistente) {
        return res.status(400).json({
          success: false,
          message: 'Já existe um setor com este código'
        });
      }

      // Verificar se o responsável existe
      if (responsavel_id) {
        const responsavel = await User.findByPk(responsavel_id);
        if (!responsavel) {
          return res.status(400).json({
            success: false,
            message: 'Responsável não encontrado'
          });
        }
      }

      const setor = await Setor.create({
        codigo,
        nome,
        descricao,
        localizacao,
        responsavel_id,
        ativo: true
      });

      // Recarregar com as associações
      const setorCompleto = await Setor.findByPk(setor.id, {
        include: [{
          model: User,
          as: 'responsavel',
          attributes: ['id', 'nome', 'email']
        }]
      });

      return res.status(201).json({
        success: true,
        message: 'Setor criado com sucesso',
        data: { setor: setorCompleto }
      });

    } catch (error) {
      console.error('Erro ao criar setor:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors.map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Atualizar setor
  async update(req, res) {
    try {
      const { id } = req.params;
      const { codigo, nome, descricao, localizacao, responsavel_id, ativo } = req.body;

      const setor = await Setor.findByPk(id);
      if (!setor) {
        return res.status(404).json({
          success: false,
          message: 'Setor não encontrado'
        });
      }

      // Verificar se o código já existe em outro setor
      if (codigo && codigo !== setor.codigo) {
        const setorExistente = await Setor.findOne({ 
          where: { 
            codigo,
            id: { [Op.ne]: id }
          }
        });
        if (setorExistente) {
          return res.status(400).json({
            success: false,
            message: 'Já existe outro setor com este código'
          });
        }
      }

      // Verificar se o responsável existe
      if (responsavel_id) {
        const responsavel = await User.findByPk(responsavel_id);
        if (!responsavel) {
          return res.status(400).json({
            success: false,
            message: 'Responsável não encontrado'
          });
        }
      }

      await setor.update({
        codigo: codigo || setor.codigo,
        nome: nome || setor.nome,
        descricao: descricao !== undefined ? descricao : setor.descricao,
        localizacao: localizacao !== undefined ? localizacao : setor.localizacao,
        responsavel_id: responsavel_id !== undefined ? responsavel_id : setor.responsavel_id,
        ativo: ativo !== undefined ? ativo : setor.ativo
      });

      // Recarregar com as associações
      const setorAtualizado = await Setor.findByPk(id, {
        include: [{
          model: User,
          as: 'responsavel',
          attributes: ['id', 'nome', 'email']
        }]
      });

      return res.json({
        success: true,
        message: 'Setor atualizado com sucesso',
        data: { setor: setorAtualizado }
      });

    } catch (error) {
      console.error('Erro ao atualizar setor:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors.map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Excluir setor
  async destroy(req, res) {
    try {
      const { id } = req.params;

      const setor = await Setor.findByPk(id, {
        include: [{
          model: Ativo,
          as: 'ativos',
          attributes: ['id']
        }]
      });

      if (!setor) {
        return res.status(404).json({
          success: false,
          message: 'Setor não encontrado'
        });
      }

      // Verificar se tem ativos vinculados
      if (setor.ativos && setor.ativos.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível excluir um setor que possui ativos vinculados'
        });
      }

      await setor.destroy();

      return res.json({
        success: true,
        message: 'Setor excluído com sucesso'
      });

    } catch (error) {
      console.error('Erro ao excluir setor:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Buscar setores ativos (para dropdowns)
  async ativos(req, res) {
    try {
      // Buscar setores ativos
      const setores = await Setor.buscarAtivos({
        attributes: ['id', 'codigo', 'nome', 'localizacao']
      });

      // Obter contagem de ativos por setor em uma consulta agregada
      const counts = await Ativo.findAll({
        attributes: ['setor_id', [Ativo.sequelize.fn('COUNT', Ativo.sequelize.col('id')), 'total_ativos']],
        where: { ativo: true, setor_id: { [Op.ne]: null } },
        group: ['setor_id']
      });

      const mapCounts = counts.reduce((acc, row) => {
        acc[row.get('setor_id')] = parseInt(row.get('total_ativos'), 10);
        return acc;
      }, {});

      // Anexar contagem a cada setor (0 se não houver)
      const setoresComContagem = setores.map(s => ({
        ...s.toJSON(),
        total_ativos: mapCounts[s.id] || 0
      }));

      return res.json({
        success: true,
        message: 'Setores ativos listados',
        data: { setores: setoresComContagem }
      });

    } catch (error) {
      console.error('Erro ao listar setores ativos:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Buscar estatísticas de um setor
  async stats(req, res) {
    try {
      const { id } = req.params;

      const setor = await Setor.findByPk(id, {
        include: [{
          model: Ativo,
          as: 'ativos',
          attributes: ['id', 'estado', 'criticidade']
        }]
      });

      if (!setor) {
        return res.status(404).json({
          success: false,
          message: 'Setor não encontrado'
        });
      }

      const estatisticas = setor.getStatusAtivos();

      return res.json({
        success: true,
        message: 'Estatísticas do setor',
        data: { 
          setor: {
            id: setor.id,
            nome: setor.nome,
            codigo: setor.codigo
          },
          estatisticas 
        }
      });

    } catch (error) {
      console.error('Erro ao buscar estatísticas do setor:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new SetorController();