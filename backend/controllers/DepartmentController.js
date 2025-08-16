const { Department } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

class DepartmentController {
  
  // Listar todos os departamentos com paginação e filtros
  async index(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        status = 'all',
        orderBy = 'nome',
        orderDirection = 'ASC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const whereClause = {};
      
      // Filtro por busca (nome ou descrição)
      if (search) {
        whereClause[Op.or] = [
          { nome: { [Op.like]: `%${search}%` } },
          { descricao: { [Op.like]: `%${search}%` } },
          { responsavel: { [Op.like]: `%${search}%` } },
          { localizacao: { [Op.like]: `%${search}%` } }
        ];
      }

      // Filtro por status
      if (status !== 'all') {
        whereClause.ativo = status === 'active';
      }

      const { count, rows: departments } = await Department.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [[orderBy, orderDirection.toUpperCase()]],
        attributes: {
          exclude: []
        }
      });

      logger.info(`Departamentos listados - Total: ${count}`, {
        userId: req.user?.id,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Departamentos listados com sucesso',
        data: {
          departments,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / parseInt(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Erro ao listar departamentos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Buscar departamento por ID
  async show(req, res) {
    try {
      const { id } = req.params;

      const department = await Department.findByPk(id);

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Departamento não encontrado'
        });
      }

      logger.info(`Departamento visualizado: ${department.nome}`, {
        userId: req.user?.id,
        departmentId: id,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Departamento encontrado',
        data: { department }
      });

    } catch (error) {
      logger.error('Erro ao buscar departamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Criar novo departamento
  async store(req, res) {
    try {
      const { nome, descricao, responsavel, localizacao } = req.body;

      // Validações básicas
      if (!nome || nome.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Nome do departamento é obrigatório e deve ter pelo menos 2 caracteres'
        });
      }

      // Verificar se já existe departamento com o mesmo nome
      const existingDepartment = await Department.findOne({
        where: { nome: nome.trim() }
      });

      if (existingDepartment) {
        return res.status(409).json({
          success: false,
          message: 'Já existe um departamento com este nome'
        });
      }

      const department = await Department.create({
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        responsavel: responsavel?.trim() || null,
        localizacao: localizacao?.trim() || null,
        ativo: true
      });

      logger.info(`Departamento criado: ${department.nome}`, {
        userId: req.user?.id,
        departmentId: department.id,
        ip: req.ip
      });

      res.status(201).json({
        success: true,
        message: 'Departamento criado com sucesso',
        data: { department }
      });

    } catch (error) {
      logger.error('Erro ao criar departamento:', error);
      
      // Tratar erro de nome duplicado
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          message: 'Já existe um departamento com este nome'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Atualizar departamento
  async update(req, res) {
    try {
      const { id } = req.params;
      const { nome, descricao, responsavel, localizacao, ativo } = req.body;

      const department = await Department.findByPk(id);

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Departamento não encontrado'
        });
      }

      // Validações básicas
      if (!nome || nome.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Nome do departamento é obrigatório e deve ter pelo menos 2 caracteres'
        });
      }

      // Verificar se já existe outro departamento com o mesmo nome
      const existingDepartment = await Department.findOne({
        where: { 
          nome: nome.trim(),
          id: { [Op.ne]: id }
        }
      });

      if (existingDepartment) {
        return res.status(409).json({
          success: false,
          message: 'Já existe outro departamento com este nome'
        });
      }

      await department.update({
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        responsavel: responsavel?.trim() || null,
        localizacao: localizacao?.trim() || null,
        ativo: typeof ativo === 'boolean' ? ativo : department.ativo
      });

      logger.info(`Departamento atualizado: ${department.nome}`, {
        userId: req.user?.id,
        departmentId: id,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Departamento atualizado com sucesso',
        data: { department }
      });

    } catch (error) {
      logger.error('Erro ao atualizar departamento:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          message: 'Já existe um departamento com este nome'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Excluir (desativar) departamento
  async destroy(req, res) {
    try {
      const { id } = req.params;

      const department = await Department.findByPk(id);

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Departamento não encontrado'
        });
      }

      // Verificar se há usuários vinculados ao departamento
      // (Implementar quando tivermos a associação com User)
      
      // Por ora, apenas desativar o departamento
      await department.update({ ativo: false });

      logger.info(`Departamento desativado: ${department.nome}`, {
        userId: req.user?.id,
        departmentId: id,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Departamento desativado com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao desativar departamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Reativar departamento
  async activate(req, res) {
    try {
      const { id } = req.params;

      const department = await Department.findByPk(id);

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Departamento não encontrado'
        });
      }

      await department.update({ ativo: true });

      logger.info(`Departamento reativado: ${department.nome}`, {
        userId: req.user?.id,
        departmentId: id,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Departamento reativado com sucesso',
        data: { department }
      });

    } catch (error) {
      logger.error('Erro ao reativar departamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Listar departamentos ativos (para selects)
  async active(req, res) {
    try {
      const departments = await Department.findAll({
        where: { ativo: true },
        order: [['nome', 'ASC']],
        attributes: ['id', 'nome', 'descricao']
      });

      res.json({
        success: true,
        message: 'Departamentos ativos listados',
        data: { departments }
      });

    } catch (error) {
      logger.error('Erro ao listar departamentos ativos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new DepartmentController();