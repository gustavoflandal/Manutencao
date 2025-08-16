const { User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

class UserController {
  // Listar usuários com paginação e filtros
  async index(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        perfil = '', 
        ativo = null,
        orderBy = 'nome',
        orderDirection = 'ASC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Construir filtros
      const whereClause = {};
      
      if (search) {
        whereClause[Op.or] = [
          { nome: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { departamento: { [Op.like]: `%${search}%` } }
        ];
      }
      
      if (perfil) {
        whereClause.perfil = perfil;
      }
      
      if (ativo !== null) {
        whereClause.ativo = ativo === 'true';
      }

      // Buscar usuários
      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        attributes: ['id', 'nome', 'email', 'perfil', 'departamento', 'department_id', 'telefone', 'ativo', 'ultimo_login', 'created_at'],
        include: [{
          model: require('../models').Department,
          as: 'department',
          attributes: ['id', 'nome'],
          required: false
        }],
        order: [[orderBy, orderDirection.toUpperCase()]],
        limit: parseInt(limit),
        offset: offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Erro ao listar usuários:', error);
      next(error);
    }
  }

  // Buscar usuário por ID
  async show(req, res, next) {
    try {
      const { id } = req.params;
      
      const user = await User.findByPk(id, {
        attributes: ['id', 'nome', 'email', 'perfil', 'departamento', 'department_id', 'telefone', 'ativo', 'ultimo_login', 'created_at', 'updated_at'],
        include: [{
          model: require('../models').Department,
          as: 'department',
          attributes: ['id', 'nome'],
          required: false
        }]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      res.json({
        success: true,
        data: { user }
      });

    } catch (error) {
      logger.error('Erro ao buscar usuário:', error);
      next(error);
    }
  }

  // Criar novo usuário
  async store(req, res, next) {
    try {
      const { nome, email, senha, perfil, department_id, telefone } = req.body;

      // Validações básicas
      if (!nome || !email || !senha) {
        return res.status(400).json({
          success: false,
          message: 'Nome, email e senha são obrigatórios'
        });
      }

      if (senha.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'A senha deve ter pelo menos 6 caracteres'
        });
      }

      // Verificar se email já existe
      const existingUser = await User.findOne({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Este email já está em uso'
        });
      }

      // Buscar nome do departamento se department_id foi fornecido
      let departmentName = null;
      if (department_id) {
        const { Department } = require('../models');
        const department = await Department.findByPk(department_id);
        if (department) {
          departmentName = department.nome;
        }
      }

      // Criar usuário
      const userData = {
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        senha,
        perfil: perfil || 'solicitante',
        department_id: department_id || null,
        departamento: departmentName,
        telefone: telefone?.trim(),
        ativo: true
      };

      const user = await User.create(userData);

      logger.info(`Usuário criado: ${user.email}`, {
        userId: user.id,
        createdBy: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: {
          user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            perfil: user.perfil,
            department_id: user.department_id,
            departamento: user.departamento,
            telefone: user.telefone,
            ativo: user.ativo
          }
        }
      });

    } catch (error) {
      logger.error('Erro ao criar usuário:', error);
      next(error);
    }
  }

  // Atualizar usuário
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { nome, email, perfil, department_id, telefone, ativo } = req.body;

      // Buscar usuário
      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Verificar permissão: só admin pode alterar perfil e status
      if ((perfil || ativo !== undefined) && req.user.perfil !== 'administrador') {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para alterar perfil ou status'
        });
      }

      // Verificar se email já existe (se foi alterado)
      if (email && email.toLowerCase() !== user.email) {
        const existingUser = await User.findOne({
          where: { 
            email: email.toLowerCase(),
            id: { [Op.ne]: id }
          }
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Este email já está em uso'
          });
        }
      }

      // Atualizar dados
      const updateData = {};
      if (nome) updateData.nome = nome.trim();
      if (email) updateData.email = email.toLowerCase().trim();
      if (telefone !== undefined) updateData.telefone = telefone?.trim();
      
      // Atualizar department_id e departamento
      if (department_id !== undefined) {
        updateData.department_id = department_id || null;
        
        // Buscar nome do departamento se department_id foi fornecido
        if (department_id) {
          const { Department } = require('../models');
          const department = await Department.findByPk(department_id);
          updateData.departamento = department ? department.nome : null;
        } else {
          updateData.departamento = null;
        }
      }
      
      // Campos que só admin pode alterar
      if (req.user.perfil === 'administrador') {
        if (perfil) updateData.perfil = perfil;
        if (ativo !== undefined) updateData.ativo = ativo;
      }

      await user.update(updateData);

      logger.info(`Usuário atualizado: ${user.email}`, {
        userId: user.id,
        updatedBy: req.user.id,
        changes: Object.keys(updateData)
      });

      res.json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: {
          user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            perfil: user.perfil,
            department_id: user.department_id,
            telefone: user.telefone,
            ativo: user.ativo
          }
        }
      });

    } catch (error) {
      logger.error('Erro ao atualizar usuário:', error);
      next(error);
    }
  }

  // Excluir usuário (desativar)
  async destroy(req, res, next) {
    try {
      const { id } = req.params;

      // Verificar permissão
      if (req.user.perfil !== 'administrador') {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para excluir usuários'
        });
      }

      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Não permitir excluir a si mesmo
      if (user.id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível excluir seu próprio usuário'
        });
      }

      // Desativar ao invés de excluir
      await user.update({ ativo: false });

      logger.info(`Usuário desativado: ${user.email}`, {
        userId: user.id,
        deactivatedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Usuário desativado com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao excluir usuário:', error);
      next(error);
    }
  }

  // Resetar senha de usuário
  async resetPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { novaSenha } = req.body;

      // Verificar permissão
      if (req.user.perfil !== 'administrador') {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para resetar senhas'
        });
      }

      if (!novaSenha || novaSenha.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Nova senha deve ter pelo menos 6 caracteres'
        });
      }

      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      await user.update({ senha: novaSenha });

      logger.info(`Senha resetada: ${user.email}`, {
        userId: user.id,
        resetBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Senha resetada com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao resetar senha:', error);
      next(error);
    }
  }

  // Obter perfil do usuário logado
  async profile(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'nome', 'email', 'perfil', 'departamento', 'telefone', 'ultimo_login', 'created_at']
      });

      res.json({
        success: true,
        data: { user }
      });

    } catch (error) {
      logger.error('Erro ao buscar perfil:', error);
      next(error);
    }
  }

  // Atualizar perfil do usuário logado
  async updateProfile(req, res, next) {
    try {
      const { nome, email, departamento, telefone } = req.body;
      const user = await User.findByPk(req.user.id);

      // Verificar se email já existe (se foi alterado)
      if (email && email.toLowerCase() !== user.email) {
        const existingUser = await User.findOne({
          where: { 
            email: email.toLowerCase(),
            id: { [Op.ne]: user.id }
          }
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Este email já está em uso'
          });
        }
      }

      // Atualizar dados
      const updateData = {};
      if (nome) updateData.nome = nome.trim();
      if (email) updateData.email = email.toLowerCase().trim();
      if (departamento !== undefined) updateData.departamento = departamento?.trim();
      if (telefone !== undefined) updateData.telefone = telefone?.trim();

      await user.update(updateData);

      logger.info(`Perfil atualizado: ${user.email}`, {
        userId: user.id
      });

      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: {
          user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            perfil: user.perfil,
            departamento: user.departamento,
            telefone: user.telefone
          }
        }
      });

    } catch (error) {
      logger.error('Erro ao atualizar perfil:', error);
      next(error);
    }
  }
}

module.exports = new UserController();
