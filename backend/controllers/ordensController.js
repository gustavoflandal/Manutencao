const { OrdemServico } = require('../models');
const { AppError } = require('../middleware/errorHandler');

exports.list = async (req, res, next) => {
  try {
    const ordens = await OrdemServico.findAll({
      where: { deleted_at: null }
    });

    res.json({
      success: true,
      data: ordens
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const ordem = await OrdemServico.findOne({
      where: { 
        id: req.params.id,
        deleted_at: null
      }
    });

    if (!ordem) {
      throw new AppError('Ordem de serviço não encontrada', 404);
    }

    res.json({
      success: true,
      data: ordem
    });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const ordem = await OrdemServico.create(req.body);

    res.status(201).json({
      success: true,
      data: ordem
    });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const ordem = await OrdemServico.findOne({
      where: { 
        id: req.params.id,
        deleted_at: null
      }
    });

    if (!ordem) {
      throw new AppError('Ordem de serviço não encontrada', 404);
    }

    await ordem.update(req.body);

    res.json({
      success: true,
      data: ordem
    });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const ordem = await OrdemServico.findOne({
      where: { 
        id: req.params.id,
        deleted_at: null
      }
    });

    if (!ordem) {
      throw new AppError('Ordem de serviço não encontrada', 404);
    }

    // Soft delete
    await ordem.update({ deleted_at: new Date() });

    res.json({
      success: true,
      message: 'Ordem de serviço excluída com sucesso'
    });
  } catch (error) {
    next(error);
  }
};
