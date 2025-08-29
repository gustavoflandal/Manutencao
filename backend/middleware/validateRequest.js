const Joi = require('joi');

// Esquemas de validação
const schemas = {
  // FMEA
  createFmea: Joi.object({
    equipment_id: Joi.number().required().messages({
      'number.base': 'O ID do equipamento deve ser um número',
      'any.required': 'O ID do equipamento é obrigatório'
    }),
    component: Joi.string().required().min(3).max(100).messages({
      'string.base': 'O componente deve ser um texto',
      'string.empty': 'O componente não pode estar vazio',
      'string.min': 'O componente deve ter no mínimo {#limit} caracteres',
      'string.max': 'O componente deve ter no máximo {#limit} caracteres',
      'any.required': 'O componente é obrigatório'
    }),
    function: Joi.string().required().min(3).max(200).messages({
      'string.base': 'A função deve ser um texto',
      'string.empty': 'A função não pode estar vazia',
      'string.min': 'A função deve ter no mínimo {#limit} caracteres',
      'string.max': 'A função deve ter no máximo {#limit} caracteres',
      'any.required': 'A função é obrigatória'
    }),
    failure_mode: Joi.string().required().min(3).max(200).messages({
      'string.base': 'O modo de falha deve ser um texto',
      'string.empty': 'O modo de falha não pode estar vazio',
      'string.min': 'O modo de falha deve ter no mínimo {#limit} caracteres',
      'string.max': 'O modo de falha deve ter no máximo {#limit} caracteres',
      'any.required': 'O modo de falha é obrigatório'
    }),
    failure_effect: Joi.string().required().min(3).max(200).messages({
      'string.base': 'O efeito da falha deve ser um texto',
      'string.empty': 'O efeito da falha não pode estar vazio',
      'string.min': 'O efeito da falha deve ter no mínimo {#limit} caracteres',
      'string.max': 'O efeito da falha deve ter no máximo {#limit} caracteres',
      'any.required': 'O efeito da falha é obrigatório'
    }),
    failure_cause: Joi.string().required().min(3).max(200).messages({
      'string.base': 'A causa da falha deve ser um texto',
      'string.empty': 'A causa da falha não pode estar vazia',
      'string.min': 'A causa da falha deve ter no mínimo {#limit} caracteres',
      'string.max': 'A causa da falha deve ter no máximo {#limit} caracteres',
      'any.required': 'A causa da falha é obrigatória'
    }),
    current_controls: Joi.string().required().min(3).max(200).messages({
      'string.base': 'Os controles atuais devem ser um texto',
      'string.empty': 'Os controles atuais não podem estar vazios',
      'string.min': 'Os controles atuais devem ter no mínimo {#limit} caracteres',
      'string.max': 'Os controles atuais devem ter no máximo {#limit} caracteres',
      'any.required': 'Os controles atuais são obrigatórios'
    }),
    severity: Joi.number().required().min(1).max(10).messages({
      'number.base': 'A severidade deve ser um número',
      'number.min': 'A severidade deve ser no mínimo {#limit}',
      'number.max': 'A severidade deve ser no máximo {#limit}',
      'any.required': 'A severidade é obrigatória'
    }),
    occurrence: Joi.number().required().min(1).max(10).messages({
      'number.base': 'A ocorrência deve ser um número',
      'number.min': 'A ocorrência deve ser no mínimo {#limit}',
      'number.max': 'A ocorrência deve ser no máximo {#limit}',
      'any.required': 'A ocorrência é obrigatória'
    }),
    detection: Joi.number().required().min(1).max(10).messages({
      'number.base': 'A detecção deve ser um número',
      'number.min': 'A detecção deve ser no mínimo {#limit}',
      'number.max': 'A detecção deve ser no máximo {#limit}',
      'any.required': 'A detecção é obrigatória'
    }),
    status: Joi.string().valid('draft', 'review', 'approved', 'archived').default('draft').messages({
      'string.base': 'O status deve ser um texto',
      'any.only': 'O status deve ser um dos seguintes valores: draft, review, approved, archived'
    })
  }),

  updateFmea: Joi.object({
    equipment_id: Joi.number().messages({
      'number.base': 'O ID do equipamento deve ser um número'
    }),
    component: Joi.string().min(3).max(100).messages({
      'string.base': 'O componente deve ser um texto',
      'string.min': 'O componente deve ter no mínimo {#limit} caracteres',
      'string.max': 'O componente deve ter no máximo {#limit} caracteres'
    }),
    function: Joi.string().min(3).max(200).messages({
      'string.base': 'A função deve ser um texto',
      'string.min': 'A função deve ter no mínimo {#limit} caracteres',
      'string.max': 'A função deve ter no máximo {#limit} caracteres'
    }),
    failure_mode: Joi.string().min(3).max(200).messages({
      'string.base': 'O modo de falha deve ser um texto',
      'string.min': 'O modo de falha deve ter no mínimo {#limit} caracteres',
      'string.max': 'O modo de falha deve ter no máximo {#limit} caracteres'
    }),
    failure_effect: Joi.string().min(3).max(200).messages({
      'string.base': 'O efeito da falha deve ser um texto',
      'string.min': 'O efeito da falha deve ter no mínimo {#limit} caracteres',
      'string.max': 'O efeito da falha deve ter no máximo {#limit} caracteres'
    }),
    failure_cause: Joi.string().min(3).max(200).messages({
      'string.base': 'A causa da falha deve ser um texto',
      'string.min': 'A causa da falha deve ter no mínimo {#limit} caracteres',
      'string.max': 'A causa da falha deve ter no máximo {#limit} caracteres'
    }),
    current_controls: Joi.string().min(3).max(200).messages({
      'string.base': 'Os controles atuais devem ser um texto',
      'string.min': 'Os controles atuais devem ter no mínimo {#limit} caracteres',
      'string.max': 'Os controles atuais devem ter no máximo {#limit} caracteres'
    }),
    severity: Joi.number().min(1).max(10).messages({
      'number.base': 'A severidade deve ser um número',
      'number.min': 'A severidade deve ser no mínimo {#limit}',
      'number.max': 'A severidade deve ser no máximo {#limit}'
    }),
    occurrence: Joi.number().min(1).max(10).messages({
      'number.base': 'A ocorrência deve ser um número',
      'number.min': 'A ocorrência deve ser no mínimo {#limit}',
      'number.max': 'A ocorrência deve ser no máximo {#limit}'
    }),
    detection: Joi.number().min(1).max(10).messages({
      'number.base': 'A detecção deve ser um número',
      'number.min': 'A detecção deve ser no mínimo {#limit}',
      'number.max': 'A detecção deve ser no máximo {#limit}'
    }),
    status: Joi.string().valid('draft', 'review', 'approved', 'archived').messages({
      'string.base': 'O status deve ser um texto',
      'any.only': 'O status deve ser um dos seguintes valores: draft, review, approved, archived'
    })
  }),

  // Ordens de Serviço
  createOrdemServico: Joi.object({
    ativo_id: Joi.number().required().messages({
      'number.base': 'O ID do ativo deve ser um número',
      'any.required': 'O ID do ativo é obrigatório'
    }),
    tipo: Joi.string().required().valid('preventiva', 'corretiva', 'preditiva').messages({
      'string.base': 'O tipo deve ser um texto',
      'any.only': 'O tipo deve ser um dos seguintes valores: preventiva, corretiva, preditiva',
      'any.required': 'O tipo é obrigatório'
    }),
    descricao_servico: Joi.string().required().min(10).max(500).messages({
      'string.base': 'A descrição do serviço deve ser um texto',
      'string.empty': 'A descrição do serviço não pode estar vazia',
      'string.min': 'A descrição do serviço deve ter no mínimo {#limit} caracteres',
      'string.max': 'A descrição do serviço deve ter no máximo {#limit} caracteres',
      'any.required': 'A descrição do serviço é obrigatória'
    }),
    prioridade: Joi.string().required().valid('baixa', 'media', 'alta', 'urgente').messages({
      'string.base': 'A prioridade deve ser um texto',
      'any.only': 'A prioridade deve ser um dos seguintes valores: baixa, media, alta, urgente',
      'any.required': 'A prioridade é obrigatória'
    }),
    data_inicio_prevista: Joi.date().required().messages({
      'date.base': 'A data de início prevista deve ser uma data válida',
      'any.required': 'A data de início prevista é obrigatória'
    }),
    data_fim_prevista: Joi.date().required().min(Joi.ref('data_inicio_prevista')).messages({
      'date.base': 'A data de fim prevista deve ser uma data válida',
      'date.min': 'A data de fim prevista deve ser posterior à data de início prevista',
      'any.required': 'A data de fim prevista é obrigatória'
    }),
    horas_planejadas: Joi.number().required().min(0.5).messages({
      'number.base': 'As horas planejadas devem ser um número',
      'number.min': 'As horas planejadas devem ser no mínimo {#limit}',
      'any.required': 'As horas planejadas são obrigatórias'
    }),
    observacoes: Joi.string().allow('').max(500).messages({
      'string.base': 'As observações devem ser um texto',
      'string.max': 'As observações devem ter no máximo {#limit} caracteres'
    })
  }),

  updateOrdemServico: Joi.object({
    ativo_id: Joi.number().messages({
      'number.base': 'O ID do ativo deve ser um número'
    }),
    tipo: Joi.string().valid('preventiva', 'corretiva', 'preditiva').messages({
      'string.base': 'O tipo deve ser um texto',
      'any.only': 'O tipo deve ser um dos seguintes valores: preventiva, corretiva, preditiva'
    }),
    descricao_servico: Joi.string().min(10).max(500).messages({
      'string.base': 'A descrição do serviço deve ser um texto',
      'string.min': 'A descrição do serviço deve ter no mínimo {#limit} caracteres',
      'string.max': 'A descrição do serviço deve ter no máximo {#limit} caracteres'
    }),
    prioridade: Joi.string().valid('baixa', 'media', 'alta', 'urgente').messages({
      'string.base': 'A prioridade deve ser um texto',
      'any.only': 'A prioridade deve ser um dos seguintes valores: baixa, media, alta, urgente'
    }),
    data_inicio_prevista: Joi.date().messages({
      'date.base': 'A data de início prevista deve ser uma data válida'
    }),
    data_fim_prevista: Joi.date().min(Joi.ref('data_inicio_prevista')).messages({
      'date.base': 'A data de fim prevista deve ser uma data válida',
      'date.min': 'A data de fim prevista deve ser posterior à data de início prevista'
    }),
    horas_planejadas: Joi.number().min(0.5).messages({
      'number.base': 'As horas planejadas devem ser um número',
      'number.min': 'As horas planejadas devem ser no mínimo {#limit}'
    }),
    observacoes: Joi.string().allow('').max(500).messages({
      'string.base': 'As observações devem ser um texto',
      'string.max': 'As observações devem ter no máximo {#limit} caracteres'
    })
  })
};

// Middleware de validação
const validateRequest = (schemaName) => {
  return async (req, res, next) => {
    try {
      const schema = schemas[schemaName];
      if (!schema) {
        throw new Error(`Schema de validação '${schemaName}' não encontrado`);
      }

      const validatedData = await schema.validateAsync(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      // Atualiza o req.body com os dados validados
      req.body = validatedData;
      next();
    } catch (error) {
      if (error.isJoi) {
        // Formata os erros do Joi
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Erro de validação',
          errors
        });
      }

      // Erro inesperado
      next(error);
    }
  };
};

module.exports = validateRequest;