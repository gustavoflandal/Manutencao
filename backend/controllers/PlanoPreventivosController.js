const { PlanoPreventivo, Ativo, Setor, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

class PlanoPreventivosController {
  
  // Listar todos os planos preventivos com filtros e paginação
  async index(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search, 
        ativo_id,
        setor_id,
        responsavel_id,
        categoria,
        prioridade,
        status_vencimento,
        ativo = true,
        include_stats = false 
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

      if (ativo_id) {
        where.ativo_id = ativo_id;
      }

      if (setor_id) {
        where.setor_id = setor_id;
      }

      if (responsavel_id) {
        where.responsavel_id = responsavel_id;
      }

      if (categoria) {
        where.categoria = categoria;
      }

      if (prioridade) {
        where.prioridade = prioridade;
      }

      // Filtro por status de vencimento
      if (status_vencimento) {
        const hoje = new Date();
        const proximosSete = new Date();
        proximosSete.setDate(hoje.getDate() + 7);

        switch (status_vencimento) {
          case 'vencido':
            where.proxima_execucao = { [Op.lt]: hoje };
            break;
          case 'alerta':
            where.proxima_execucao = { [Op.between]: [hoje, proximosSete] };
            break;
          case 'normal':
            where.proxima_execucao = { [Op.gt]: proximosSete };
            break;
        }
      }

      const include = [
        {
          model: Ativo,
          as: 'ativoObj',
          attributes: ['id', 'nome', 'codigo_patrimonio', 'horas_funcionamento', 'contador_producao']
        },
        {
          model: Setor,
          as: 'setorObj',
          attributes: ['id', 'nome', 'codigo']
        },
        {
          model: User,
          as: 'responsavelObj',
          attributes: ['id', 'nome', 'email']
        }
      ];

      const { count, rows: planos } = await PlanoPreventivo.findAndCountAll({
        where,
        include,
        order: [['proxima_execucao', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Adicionar informações de status de vencimento
      const planosComStatus = planos.map(plano => {
        const planoJson = plano.toJSON();
        planoJson.dias_para_vencimento = plano.diasParaVencimento();
        planoJson.status_vencimento = plano.statusVencimento();
        return planoJson;
      });

      let response = {
        success: true,
        data: {
          planos: planosComStatus,
          pagination: {
            current_page: parseInt(page),
            per_page: parseInt(limit),
            total: count,
            total_pages: Math.ceil(count / limit)
          }
        }
      };

      // Incluir estatísticas se solicitado
      if (include_stats === 'true') {
        response.data.estatisticas = await PlanoPreventivo.estatisticas();
      }

      res.json(response);

    } catch (error) {
      logger.error('Erro ao listar planos preventivos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar um plano preventivo específico
  async show(req, res) {
    try {
      const { id } = req.params;

      const plano = await PlanoPreventivo.findByPk(id, {
        include: [
          {
            model: Ativo,
            as: 'ativoObj',
            include: [{
              model: Setor,
              as: 'setor',
              attributes: ['id', 'nome', 'codigo']
            }]
          },
          {
            model: Setor,
            as: 'setorObj',
            attributes: ['id', 'nome', 'codigo']
          },
          {
            model: User,
            as: 'responsavelObj',
            attributes: ['id', 'nome', 'email', 'perfil']
          }
        ]
      });

      if (!plano) {
        return res.status(404).json({
          success: false,
          message: 'Plano preventivo não encontrado'
        });
      }

      const planoJson = plano.toJSON();
      planoJson.dias_para_vencimento = plano.diasParaVencimento();
      planoJson.status_vencimento = plano.statusVencimento();
      
      // Verificar se precisa manutenção por métrica
      if (plano.tipo_periodicidade === 'horas_funcionamento' || plano.tipo_periodicidade === 'contador_producao') {
        planoJson.precisa_manutencao_metrica = await plano.precisaManutencaoByMetrica();
      }

      res.json({
        success: true,
        data: { plano: planoJson }
      });

    } catch (error) {
      logger.error('Erro ao buscar plano preventivo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Criar novo plano preventivo
  async store(req, res) {
    try {
      const {
        codigo,
        nome,
        descricao,
        ativo_id,
        setor_id,
        responsavel_id,
        tipo_periodicidade,
        intervalo_periodicidade,
        horas_funcionamento_limite,
        contador_producao_limite,
        prioridade,
        categoria,
        duracao_estimada,
        custo_estimado,
        procedimento,
        ferramentas_necessarias,
        pecas_necessarias,
        data_inicio,
        data_fim,
        proxima_execucao,
        dias_antecedencia_alerta,
        observacoes
      } = req.body;

      // Validar se o ativo existe e buscar informações associadas
      const ativo = await Ativo.findByPk(ativo_id, {
        include: [
          {
            model: Setor,
            as: 'setor'
          },
          {
            model: User,
            as: 'responsavel'
          }
        ]
      });
      
      if (!ativo) {
        return res.status(400).json({
          success: false,
          message: 'Ativo não encontrado'
        });
      }

      // Usar setor e responsável do ativo automaticamente
      // (ignora setor_id e responsavel_id enviados no body)
      const setor_id_final = ativo.setor?.id || null;
      const responsavel_id_final = ativo.responsavel?.id || null;

      // Validações específicas por tipo de periodicidade
      if (tipo_periodicidade === 'horas_funcionamento' && !horas_funcionamento_limite) {
        return res.status(400).json({
          success: false,
          message: 'Limite de horas de funcionamento é obrigatório para este tipo de periodicidade'
        });
      }

      if (tipo_periodicidade === 'contador_producao' && !contador_producao_limite) {
        return res.status(400).json({
          success: false,
          message: 'Limite do contador de produção é obrigatório para este tipo de periodicidade'
        });
      }

      const plano = await PlanoPreventivo.create({
        codigo,
        nome,
        descricao,
        ativo_id,
        setor_id: setor_id_final,
        responsavel_id: responsavel_id_final,
        tipo_periodicidade,
        intervalo_periodicidade,
        horas_funcionamento_limite,
        contador_producao_limite,
        prioridade,
        categoria,
        duracao_estimada,
        custo_estimado,
        procedimento,
        ferramentas_necessarias,
        pecas_necessarias,
        data_inicio,
        data_fim,
        proxima_execucao: proxima_execucao || data_inicio,
        dias_antecedencia_alerta,
        observacoes
      });

      // Buscar o plano criado com todas as associações
      const planoCriado = await PlanoPreventivo.findByPk(plano.id, {
        include: [
          { model: Ativo, as: 'ativoObj' },
          { model: Setor, as: 'setorObj' },
          { model: User, as: 'responsavelObj' }
        ]
      });

      logger.info(`Plano preventivo criado: ${plano.codigo}`, {
        userId: req.user.id,
        planoId: plano.id
      });

      res.status(201).json({
        success: true,
        message: 'Plano preventivo criado com sucesso',
        data: { plano: planoCriado }
      });

    } catch (error) {
      logger.error('Erro ao criar plano preventivo:', error);
      
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

      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Código já existe'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar plano preventivo
  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        codigo,
        nome,
        descricao,
        ativo_id,
        setor_id,
        responsavel_id,
        tipo_periodicidade,
        intervalo_periodicidade,
        horas_funcionamento_limite,
        contador_producao_limite,
        prioridade,
        categoria,
        duracao_estimada,
        custo_estimado,
        procedimento,
        ferramentas_necessarias,
        pecas_necessarias,
        data_inicio,
        data_fim,
        proxima_execucao,
        dias_antecedencia_alerta,
        ativo,
        observacoes
      } = req.body;

      const plano = await PlanoPreventivo.findByPk(id);

      if (!plano) {
        return res.status(404).json({
          success: false,
          message: 'Plano preventivo não encontrado'
        });
      }

      // Validações similares ao create se os valores mudaram
      if (ativo_id && ativo_id !== plano.ativo_id) {
        const ativoExiste = await Ativo.findByPk(ativo_id);
        if (!ativoExiste) {
          return res.status(400).json({
            success: false,
            message: 'Ativo não encontrado'
          });
        }
      }

      if (setor_id && setor_id !== plano.setor_id) {
        const setorExiste = await Setor.findByPk(setor_id);
        if (!setorExiste) {
          return res.status(400).json({
            success: false,
            message: 'Setor não encontrado'
          });
        }
      }

      if (responsavel_id && responsavel_id !== plano.responsavel_id) {
        const responsavelExiste = await User.findByPk(responsavel_id);
        if (!responsavelExiste) {
          return res.status(400).json({
            success: false,
            message: 'Responsável não encontrado'
          });
        }
      }

      await plano.update({
        codigo,
        nome,
        descricao,
        ativo_id,
        setor_id,
        responsavel_id,
        tipo_periodicidade,
        intervalo_periodicidade,
        horas_funcionamento_limite,
        contador_producao_limite,
        prioridade,
        categoria,
        duracao_estimada,
        custo_estimado,
        procedimento,
        ferramentas_necessarias,
        pecas_necessarias,
        data_inicio,
        data_fim,
        proxima_execucao,
        dias_antecedencia_alerta,
        ativo,
        observacoes
      });

      // Buscar o plano atualizado com todas as associações
      const planoAtualizado = await PlanoPreventivo.findByPk(id, {
        include: [
          { model: Ativo, as: 'ativoObj' },
          { model: Setor, as: 'setorObj' },
          { model: User, as: 'responsavelObj' }
        ]
      });

      logger.info(`Plano preventivo atualizado: ${plano.codigo}`, {
        userId: req.user.id,
        planoId: id
      });

      res.json({
        success: true,
        message: 'Plano preventivo atualizado com sucesso',
        data: { plano: planoAtualizado }
      });

    } catch (error) {
      logger.error('Erro ao atualizar plano preventivo:', error);
      
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

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Excluir plano preventivo
  async destroy(req, res) {
    try {
      const { id } = req.params;

      const plano = await PlanoPreventivo.findByPk(id);

      if (!plano) {
        return res.status(404).json({
          success: false,
          message: 'Plano preventivo não encontrado'
        });
      }

      await plano.destroy();

      logger.info(`Plano preventivo excluído: ${plano.codigo}`, {
        userId: req.user.id,
        planoId: id
      });

      res.json({
        success: true,
        message: 'Plano preventivo excluído com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao excluir plano preventivo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Obter estatísticas dos planos preventivos
  async stats(req, res) {
    try {
      const estatisticas = await PlanoPreventivo.estatisticas();

      res.json({
        success: true,
        data: { estatisticas }
      });

    } catch (error) {
      logger.error('Erro ao obter estatísticas de planos preventivos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Obter planos por status de vencimento
  async porStatus(req, res) {
    try {
      const { status = 'all' } = req.params;

      const planos = await PlanoPreventivo.obterPlanosPorStatus(status);

      // Adicionar informações de status
      const planosComStatus = planos.map(plano => {
        const planoJson = plano.toJSON();
        planoJson.dias_para_vencimento = plano.diasParaVencimento();
        planoJson.status_vencimento = plano.statusVencimento();
        return planoJson;
      });

      res.json({
        success: true,
        data: { planos: planosComStatus }
      });

    } catch (error) {
      logger.error('Erro ao obter planos por status:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Marcar execução de um plano preventivo
  async marcarExecucao(req, res) {
    try {
      const { id } = req.params;
      const { 
        data_execucao,
        observacoes_execucao,
        custo_real,
        duracao_real 
      } = req.body;

      const plano = await PlanoPreventivo.findByPk(id, {
        include: [{ model: Ativo, as: 'ativoObj' }]
      });

      if (!plano) {
        return res.status(404).json({
          success: false,
          message: 'Plano preventivo não encontrado'
        });
      }

      const dataExecucao = data_execucao || new Date().toISOString().split('T')[0];

      // Atualizar dados da execução
      const updateData = {
        ultima_execucao: dataExecucao,
        total_execucoes: plano.total_execucoes + 1
      };

      // Se for baseado em horas ou contador, salvar os valores atuais
      if (plano.tipo_periodicidade === 'horas_funcionamento' && plano.ativoObj) {
        updateData.executado_horas = plano.ativoObj.horas_funcionamento;
      }

      if (plano.tipo_periodicidade === 'contador_producao' && plano.ativoObj) {
        updateData.executado_contador = plano.ativoObj.contador_producao;
      }

      // Calcular próxima execução
      const proximaExecucao = plano.calcularProximaExecucao();
      if (proximaExecucao) {
        updateData.proxima_execucao = proximaExecucao;
      }

      await plano.update(updateData);

      logger.info(`Execução marcada para plano preventivo: ${plano.codigo}`, {
        userId: req.user.id,
        planoId: id,
        dataExecucao
      });

      // Buscar plano atualizado
      const planoAtualizado = await PlanoPreventivo.findByPk(id, {
        include: [
          { model: Ativo, as: 'ativoObj' },
          { model: Setor, as: 'setorObj' },
          { model: User, as: 'responsavelObj' }
        ]
      });

      res.json({
        success: true,
        message: 'Execução marcada com sucesso',
        data: { plano: planoAtualizado }
      });

    } catch (error) {
      logger.error('Erro ao marcar execução:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Obter calendário de manutenções
  async calendario(req, res) {
    try {
      const { 
        mes,
        ano,
        setor_id,
        responsavel_id 
      } = req.query;

      const where = { ativo: true };
      
      // Filtros por data se especificados
      if (mes && ano) {
        const dataInicio = new Date(ano, mes - 1, 1);
        const dataFim = new Date(ano, mes, 0);
        
        where.proxima_execucao = {
          [Op.between]: [dataInicio, dataFim]
        };
      }

      if (setor_id) {
        where.setor_id = setor_id;
      }

      if (responsavel_id) {
        where.responsavel_id = responsavel_id;
      }

      const planos = await PlanoPreventivo.findAll({
        where,
        include: [
          { model: Ativo, as: 'ativoObj', attributes: ['id', 'nome', 'codigo_patrimonio'] },
          { model: Setor, as: 'setorObj', attributes: ['id', 'nome'] },
          { model: User, as: 'responsavelObj', attributes: ['id', 'nome'] }
        ],
        order: [['proxima_execucao', 'ASC']]
      });

      // Agrupar por data
      const calendario = {};
      planos.forEach(plano => {
        const data = plano.proxima_execucao;
        if (!calendario[data]) {
          calendario[data] = [];
        }
        
        const planoJson = plano.toJSON();
        planoJson.status_vencimento = plano.statusVencimento();
        calendario[data].push(planoJson);
      });

      res.json({
        success: true,
        data: { calendario }
      });

    } catch (error) {
      logger.error('Erro ao obter calendário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new PlanoPreventivosController();