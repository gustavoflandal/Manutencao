const { Category, SubCategory } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

class CategoryController {
  // Listar categorias com paginação e filtros
  async index(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        ativo = '',
        orderBy = 'nome',
        orderDirection = 'ASC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Construir filtros
      const whereClause = {};
      
      if (search) {
        whereClause[Op.or] = [
          { nome: { [Op.like]: `%${search}%` } },
          { descricao: { [Op.like]: `%${search}%` } }
        ];
      }
      
      if (ativo !== '') {
        whereClause.ativo = ativo === 'true';
      }

      // Buscar categorias
      const { count, rows: categorias } = await Category.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: SubCategory,
            as: 'subcategorias',
            attributes: ['id', 'nome', 'ativo'],
            where: { ativo: true },
            required: false
          }
        ],
        order: [[orderBy, orderDirection.toUpperCase()]],
        limit: parseInt(limit),
        offset: offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      res.json({
        success: true,
        data: {
          categorias,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Erro ao listar categorias:', error);
      next(error);
    }
  }

  // Buscar categoria por ID
  async show(req, res, next) {
    try {
      const { id } = req.params;
      
      const categoria = await Category.findByPk(id, {
        include: [
          {
            model: SubCategory,
            as: 'subcategorias',
            attributes: ['id', 'nome', 'descricao', 'ativo']
          }
        ]
      });

      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: 'Categoria não encontrada'
        });
      }

      res.json({
        success: true,
        data: { categoria }
      });

    } catch (error) {
      logger.error('Erro ao buscar categoria:', error);
      next(error);
    }
  }

  // Criar nova categoria
  async store(req, res, next) {
    try {
      const { nome, descricao, cor, icone, ativo = true } = req.body;

      // Validações básicas
      if (!nome || nome.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Nome da categoria é obrigatório e deve ter pelo menos 2 caracteres'
        });
      }

      // Verificar se já existe categoria com o mesmo nome
      const categoriaExistente = await Category.findOne({
        where: { nome: nome.trim() }
      });

      if (categoriaExistente) {
        return res.status(400).json({
          success: false,
          message: 'Já existe uma categoria com este nome'
        });
      }

      // Criar categoria
      const categoriaData = {
        nome: nome.trim(),
        descricao: descricao?.trim(),
        cor: cor?.trim(),
        icone: icone?.trim(),
        ativo: Boolean(ativo)
      };

      const categoria = await Category.create(categoriaData);

      logger.info(`Categoria criada: ${categoria.nome}`, {
        categoriaId: categoria.id,
        createdBy: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Categoria criada com sucesso',
        data: { categoria }
      });

    } catch (error) {
      logger.error('Erro ao criar categoria:', error);
      next(error);
    }
  }

  // Atualizar categoria
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { nome, descricao, cor, icone, ativo } = req.body;

      // Buscar categoria
      const categoria = await Category.findByPk(id);
      
      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: 'Categoria não encontrada'
        });
      }

      // Verificar se nome já existe (se foi alterado)
      if (nome && nome.trim() !== categoria.nome) {
        const categoriaExistente = await Category.findOne({
          where: { 
            nome: nome.trim(),
            id: { [Op.ne]: id }
          }
        });

        if (categoriaExistente) {
          return res.status(400).json({
            success: false,
            message: 'Já existe uma categoria com este nome'
          });
        }
      }

      // Campos para atualizar
      const updateData = {};
      if (nome !== undefined) updateData.nome = nome.trim();
      if (descricao !== undefined) updateData.descricao = descricao?.trim();
      if (cor !== undefined) updateData.cor = cor?.trim();
      if (icone !== undefined) updateData.icone = icone?.trim();
      if (ativo !== undefined) updateData.ativo = Boolean(ativo);

      await categoria.update(updateData);

      logger.info(`Categoria atualizada: ${categoria.nome}`, {
        categoriaId: categoria.id,
        updatedBy: req.user.id,
        changes: Object.keys(updateData)
      });

      res.json({
        success: true,
        message: 'Categoria atualizada com sucesso',
        data: { categoria }
      });

    } catch (error) {
      logger.error('Erro ao atualizar categoria:', error);
      next(error);
    }
  }

  // Excluir categoria
  async destroy(req, res, next) {
    try {
      const { id } = req.params;

      const categoria = await Category.findByPk(id, {
        include: [
          {
            model: SubCategory,
            as: 'subcategorias'
          }
        ]
      });
      
      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: 'Categoria não encontrada'
        });
      }

      // Verificar se há subcategorias associadas
      if (categoria.subcategorias && categoria.subcategorias.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível excluir categoria que possui subcategorias'
        });
      }

      await categoria.destroy();

      logger.info(`Categoria excluída: ${categoria.nome}`, {
        categoriaId: categoria.id,
        deletedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Categoria excluída com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao excluir categoria:', error);
      next(error);
    }
  }

  // Listar categorias ativas (rota pública para selects) - inclui subcategorias ativas
  async listActive(req, res, next) {
    try {
      const categorias = await Category.findAll({
        where: { ativo: true },
        attributes: ['id', 'nome', 'descricao', 'cor', 'icone'],
        include: [
          {
            model: SubCategory,
            as: 'subcategorias',
            attributes: ['id', 'nome'],
            where: { ativo: true },
            required: false
          }
        ],
        order: [['nome', 'ASC']]
      });

      res.json({
        success: true,
        data: { categorias }
      });

    } catch (error) {
      logger.error('Erro ao listar categorias ativas:', error);
      next(error);
    }
  }
}

module.exports = new CategoryController();