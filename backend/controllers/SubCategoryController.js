const { SubCategory, Category } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

class SubCategoryController {
  // Listar subcategorias com paginação e filtros
  async index(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        category_id = '',
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
      
      if (category_id) {
        whereClause.category_id = category_id;
      }
      
      if (ativo !== '') {
        whereClause.ativo = ativo === 'true';
      }

      // Buscar subcategorias
      const { count, rows: subcategorias } = await SubCategory.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Category,
            as: 'categoria',
            attributes: ['id', 'nome', 'cor', 'icone']
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
          subcategorias,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Erro ao listar subcategorias:', error);
      next(error);
    }
  }

  // Buscar subcategoria por ID
  async show(req, res, next) {
    try {
      const { id } = req.params;
      
      const subcategoria = await SubCategory.findByPk(id, {
        include: [
          {
            model: Category,
            as: 'categoria',
            attributes: ['id', 'nome', 'cor', 'icone']
          }
        ]
      });

      if (!subcategoria) {
        return res.status(404).json({
          success: false,
          message: 'Subcategoria não encontrada'
        });
      }

      res.json({
        success: true,
        data: { subcategoria }
      });

    } catch (error) {
      logger.error('Erro ao buscar subcategoria:', error);
      next(error);
    }
  }

  // Criar nova subcategoria
  async store(req, res, next) {
    try {
      const { nome, descricao, category_id, ativo = true } = req.body;

      // Validações básicas
      if (!nome || nome.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Nome da subcategoria é obrigatório e deve ter pelo menos 2 caracteres'
        });
      }

      if (!category_id) {
        return res.status(400).json({
          success: false,
          message: 'Categoria é obrigatória'
        });
      }

      // Verificar se a categoria existe
      const categoria = await Category.findByPk(category_id);
      if (!categoria) {
        return res.status(400).json({
          success: false,
          message: 'Categoria não encontrada'
        });
      }

      // Verificar se já existe subcategoria com o mesmo nome na mesma categoria
      const subcategoriaExistente = await SubCategory.findOne({
        where: { 
          nome: nome.trim(),
          category_id: category_id
        }
      });

      if (subcategoriaExistente) {
        return res.status(400).json({
          success: false,
          message: 'Já existe uma subcategoria com este nome nesta categoria'
        });
      }

      // Criar subcategoria
      const subcategoriaData = {
        nome: nome.trim(),
        descricao: descricao?.trim(),
        category_id: parseInt(category_id),
        ativo: Boolean(ativo)
      };

      const subcategoria = await SubCategory.create(subcategoriaData);

      // Recarregar com associações
      const subcategoriaCompleta = await SubCategory.findByPk(subcategoria.id, {
        include: [
          {
            model: Category,
            as: 'categoria',
            attributes: ['id', 'nome', 'cor', 'icone']
          }
        ]
      });

      logger.info(`Subcategoria criada: ${subcategoria.nome}`, {
        subcategoriaId: subcategoria.id,
        categoryId: category_id,
        createdBy: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Subcategoria criada com sucesso',
        data: { subcategoria: subcategoriaCompleta }
      });

    } catch (error) {
      logger.error('Erro ao criar subcategoria:', error);
      next(error);
    }
  }

  // Atualizar subcategoria
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { nome, descricao, category_id, ativo } = req.body;

      // Buscar subcategoria
      const subcategoria = await SubCategory.findByPk(id);
      
      if (!subcategoria) {
        return res.status(404).json({
          success: false,
          message: 'Subcategoria não encontrada'
        });
      }

      // Verificar se categoria existe (se foi alterada)
      if (category_id && category_id !== subcategoria.category_id) {
        const categoria = await Category.findByPk(category_id);
        if (!categoria) {
          return res.status(400).json({
            success: false,
            message: 'Categoria não encontrada'
          });
        }
      }

      // Verificar se nome já existe na categoria (se foi alterado)
      if (nome && nome.trim() !== subcategoria.nome) {
        const subcategoriaExistente = await SubCategory.findOne({
          where: { 
            nome: nome.trim(),
            category_id: category_id || subcategoria.category_id,
            id: { [Op.ne]: id }
          }
        });

        if (subcategoriaExistente) {
          return res.status(400).json({
            success: false,
            message: 'Já existe uma subcategoria com este nome nesta categoria'
          });
        }
      }

      // Campos para atualizar
      const updateData = {};
      if (nome !== undefined) updateData.nome = nome.trim();
      if (descricao !== undefined) updateData.descricao = descricao?.trim();
      if (category_id !== undefined) updateData.category_id = parseInt(category_id);
      if (ativo !== undefined) updateData.ativo = Boolean(ativo);

      await subcategoria.update(updateData);

      // Recarregar com associações
      const subcategoriaAtualizada = await SubCategory.findByPk(id, {
        include: [
          {
            model: Category,
            as: 'categoria',
            attributes: ['id', 'nome', 'cor', 'icone']
          }
        ]
      });

      logger.info(`Subcategoria atualizada: ${subcategoria.nome}`, {
        subcategoriaId: subcategoria.id,
        updatedBy: req.user.id,
        changes: Object.keys(updateData)
      });

      res.json({
        success: true,
        message: 'Subcategoria atualizada com sucesso',
        data: { subcategoria: subcategoriaAtualizada }
      });

    } catch (error) {
      logger.error('Erro ao atualizar subcategoria:', error);
      next(error);
    }
  }

  // Excluir subcategoria
  async destroy(req, res, next) {
    try {
      const { id } = req.params;

      const subcategoria = await SubCategory.findByPk(id);
      
      if (!subcategoria) {
        return res.status(404).json({
          success: false,
          message: 'Subcategoria não encontrada'
        });
      }

      await subcategoria.destroy();

      logger.info(`Subcategoria excluída: ${subcategoria.nome}`, {
        subcategoriaId: subcategoria.id,
        deletedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Subcategoria excluída com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao excluir subcategoria:', error);
      next(error);
    }
  }

  // Listar subcategorias por categoria
  async byCategory(req, res, next) {
    try {
      const { categoryId } = req.params;

      const subcategorias = await SubCategory.findAll({
        where: { 
          category_id: categoryId,
          ativo: true 
        },
        attributes: ['id', 'nome'],
        order: [['nome', 'ASC']]
      });

      res.json({
        success: true,
        subcategorias
      });

    } catch (error) {
      logger.error('Erro ao listar subcategorias por categoria:', error);
      next(error);
    }
  }
}

module.exports = new SubCategoryController();