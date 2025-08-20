const { PlanoPreventivo, Ativo, Setor, User, OrdemServico } = require('../models');
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

  // Gerar ordens de serviço automaticamente para planos vencidos
  async gerarOrdensAutomaticas(req, res) {
    try {
      const { 
        dias_antecedencia = 0,
        prioridade_minima = 'baixa',
        incluir_baseados_metrica = true 
      } = req.body;

      const hoje = new Date();
      const dataLimite = new Date();
      dataLimite.setDate(hoje.getDate() + parseInt(dias_antecedencia));

      // Buscar planos que precisam de manutenção
      const where = {
        ativo: true,
        [Op.or]: [
          {
            // Planos vencidos ou próximos ao vencimento por data
            proxima_execucao: {
              [Op.lte]: dataLimite
            }
          }
        ]
      };

      // Filtro por prioridade
      const prioridades = ['baixa', 'normal', 'alta', 'critica'];
      const indicePrioridadeMinima = prioridades.indexOf(prioridade_minima);
      if (indicePrioridadeMinima > 0) {
        where.prioridade = {
          [Op.in]: prioridades.slice(indicePrioridadeMinima)
        };
      }

      const planos = await PlanoPreventivo.findAll({
        where,
        include: [
          { 
            model: Ativo, 
            as: 'ativoObj',
            attributes: ['id', 'nome', 'codigo_patrimonio', 'horas_funcionamento', 'contador_producao']
          },
          { 
            model: Setor, 
            as: 'setorObj',
            attributes: ['id', 'nome']
          },
          { 
            model: User, 
            as: 'responsavelObj',
            attributes: ['id', 'nome', 'email']
          }
        ]
      });

      const ordensGeradas = [];
      const erros = [];

      for (const plano of planos) {
        try {
          // Verificar se já existe uma ordem em aberto para este plano
          const ordemExistente = await OrdemServico.findOne({
            where: {
              plano_preventivo_id: plano.id,
              status: {
                [Op.in]: ['aberto', 'em_andamento', 'pendente']
              }
            }
          });

          if (ordemExistente) {
            continue; // Pular se já existe ordem em aberto
          }

          // Verificar se precisa manutenção por métrica
          let precisaManutencao = true;
          if (incluir_baseados_metrica && 
              (plano.tipo_periodicidade === 'horas_funcionamento' || 
               plano.tipo_periodicidade === 'contador_producao')) {
            precisaManutencao = await plano.precisaManutencaoByMetrica();
          }

          if (!precisaManutencao) {
            continue;
          }

          // Criar ordem de serviço
          const ordemData = {
            codigo: null, // Será gerado automaticamente
            titulo: `Manutenção Preventiva - ${plano.nome}`,
            descricao: `Ordem gerada automaticamente para o plano preventivo ${plano.codigo}.\n\n${plano.procedimento || ''}`,
            tipo: 'preventiva',
            prioridade: plano.prioridade,
            status: 'aberto',
            ativo_id: plano.ativo_id,
            setor_id: plano.setor_id,
            solicitante_id: plano.responsavel_id || 1, // Usar ID do admin se não há responsável
            responsavel_id: plano.responsavel_id,
            plano_preventivo_id: plano.id,
            data_prevista_inicio: plano.proxima_execucao,
            duracao_estimada: plano.duracao_estimada,
            custo_estimado: plano.custo_estimado,
            procedimento: plano.procedimento,
            ferramentas_necessarias: plano.ferramentas_necessarias,
            pecas_necessarias: plano.pecas_necessarias,
            observacoes: `Gerada automaticamente em ${hoje.toISOString().split('T')[0]} para o plano preventivo ${plano.codigo}`
          };

          const ordem = await OrdemServico.create(ordemData);

          ordensGeradas.push({
            ordem_id: ordem.id,
            ordem_codigo: ordem.codigo,
            plano_id: plano.id,
            plano_codigo: plano.codigo,
            ativo_nome: plano.ativoObj?.nome,
            data_prevista: plano.proxima_execucao
          });

          logger.info(`Ordem de serviço gerada automaticamente: ${ordem.codigo} para plano ${plano.codigo}`, {
            ordemId: ordem.id,
            planoId: plano.id
          });

        } catch (error) {
          erros.push({
            plano_id: plano.id,
            plano_codigo: plano.codigo,
            erro: error.message
          });
          logger.error(`Erro ao gerar ordem para plano ${plano.codigo}:`, error);
        }
      }

      res.json({
        success: true,
        message: `${ordensGeradas.length} ordens de serviço geradas automaticamente`,
        data: {
          ordens_geradas: ordensGeradas,
          total_geradas: ordensGeradas.length,
          erros: erros,
          total_erros: erros.length
        }
      });

    } catch (error) {
      logger.error('Erro ao gerar ordens automáticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar planos baseados em métricas (horas/contador)
  async atualizarPlanosMetricas(req, res) {
    try {
      const planos = await PlanoPreventivo.findAll({
        where: {
          ativo: true,
          tipo_periodicidade: {
            [Op.in]: ['horas_funcionamento', 'contador_producao']
          }
        },
        include: [
          { 
            model: Ativo, 
            as: 'ativoObj',
            attributes: ['id', 'nome', 'horas_funcionamento', 'contador_producao']
          }
        ]
      });

      const planosAtualizados = [];
      const alertas = [];

      for (const plano of planos) {
        try {
          const precisaManutencao = await plano.precisaManutencaoByMetrica();
          
          if (precisaManutencao) {
            alertas.push({
              plano_id: plano.id,
              plano_codigo: plano.codigo,
              ativo_nome: plano.ativoObj?.nome,
              tipo_periodicidade: plano.tipo_periodicidade,
              valor_atual: plano.tipo_periodicidade === 'horas_funcionamento' 
                ? plano.ativoObj?.horas_funcionamento 
                : plano.ativoObj?.contador_producao,
              limite: plano.tipo_periodicidade === 'horas_funcionamento' 
                ? plano.horas_funcionamento_limite 
                : plano.contador_producao_limite,
              valor_ultima_execucao: plano.tipo_periodicidade === 'horas_funcionamento' 
                ? plano.executado_horas 
                : plano.executado_contador
            });
          }

          planosAtualizados.push({
            plano_id: plano.id,
            plano_codigo: plano.codigo,
            precisa_manutencao: precisaManutencao
          });

        } catch (error) {
          logger.error(`Erro ao verificar plano ${plano.codigo}:`, error);
        }
      }

      res.json({
        success: true,
        message: `${planos.length} planos verificados`,
        data: {
          planos_verificados: planosAtualizados,
          alertas_manutencao: alertas,
          total_alertas: alertas.length
        }
      });

    } catch (error) {
      logger.error('Erro ao atualizar planos por métricas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Relatório de eficiência da manutenção preventiva
  async relatorioEficiencia(req, res) {
    try {
      const { 
        data_inicio,
        data_fim,
        setor_id,
        categoria 
      } = req.query;

      const whereClause = { ativo: true };
      const whereOrdem = {};

      // Filtros por data
      if (data_inicio && data_fim) {
        whereOrdem.created_at = {
          [Op.between]: [new Date(data_inicio), new Date(data_fim)]
        };
      }

      if (setor_id) {
        whereClause.setor_id = setor_id;
      }

      if (categoria) {
        whereClause.categoria = categoria;
      }

      // Buscar planos e suas execuções
      const planos = await PlanoPreventivo.findAll({
        where: whereClause,
        include: [
          { 
            model: Ativo, 
            as: 'ativoObj',
            attributes: ['id', 'nome', 'valor_aquisicao', 'mtbf', 'mttr']
          },
          { 
            model: Setor, 
            as: 'setorObj',
            attributes: ['id', 'nome']
          }
        ]
      });

      // Buscar ordens de serviço relacionadas
      const ordensPreventivas = await OrdemServico.findAll({
        where: {
          ...whereOrdem,
          tipo: 'preventiva',
          plano_preventivo_id: {
            [Op.ne]: null
          },
          status: 'finalizado'
        },
        include: [
          {
            model: PlanoPreventivo,
            as: 'planoPreventivo',
            where: whereClause,
            include: [
              { model: Ativo, as: 'ativoObj' }
            ]
          }
        ]
      });

      // Calcular estatísticas
      const estatisticas = {
        total_planos: planos.length,
        planos_ativos: planos.filter(p => p.ativo).length,
        total_execucoes_realizadas: ordensPreventivas.length,
        
        // Por categoria
        por_categoria: {},
        
        // Por setor
        por_setor: {},
        
        // Eficiência geral
        taxa_cumprimento: 0,
        custo_total_preventiva: 0,
        tempo_total_preventiva: 0,
        
        // Top ativos com mais manutenções
        top_ativos_manutencao: {},
        
        // Planos mais executados
        planos_mais_executados: []
      };

      // Agrupar por categoria
      planos.forEach(plano => {
        if (!estatisticas.por_categoria[plano.categoria]) {
          estatisticas.por_categoria[plano.categoria] = {
            total_planos: 0,
            total_execucoes: 0,
            custo_total: 0
          };
        }
        estatisticas.por_categoria[plano.categoria].total_planos++;
        estatisticas.por_categoria[plano.categoria].total_execucoes += plano.total_execucoes;
      });

      // Agrupar por setor
      planos.forEach(plano => {
        const setorNome = plano.setorObj?.nome || 'Sem setor';
        if (!estatisticas.por_setor[setorNome]) {
          estatisticas.por_setor[setorNome] = {
            total_planos: 0,
            total_execucoes: 0,
            custo_total: 0
          };
        }
        estatisticas.por_setor[setorNome].total_planos++;
        estatisticas.por_setor[setorNome].total_execucoes += plano.total_execucoes;
      });

      // Calcular custos e tempos das ordens
      ordensPreventivas.forEach(ordem => {
        estatisticas.custo_total_preventiva += parseFloat(ordem.custo_real || ordem.custo_estimado || 0);
        estatisticas.tempo_total_preventiva += parseInt(ordem.duracao_real || ordem.duracao_estimada || 0);
        
        const categoria = ordem.planoPreventivo.categoria;
        if (estatisticas.por_categoria[categoria]) {
          estatisticas.por_categoria[categoria].custo_total += parseFloat(ordem.custo_real || ordem.custo_estimado || 0);
        }
        
        const setorNome = ordem.planoPreventivo.setorObj?.nome || 'Sem setor';
        if (estatisticas.por_setor[setorNome]) {
          estatisticas.por_setor[setorNome].custo_total += parseFloat(ordem.custo_real || ordem.custo_estimado || 0);
        }
      });

      // Top ativos
      const ativosContador = {};
      ordensPreventivas.forEach(ordem => {
        const ativoId = ordem.ativo_id;
        const ativoNome = ordem.planoPreventivo.ativoObj?.nome || 'Ativo desconhecido';
        
        if (!ativosContador[ativoId]) {
          ativosContador[ativoId] = {
            nome: ativoNome,
            total_manutencoes: 0,
            custo_total: 0
          };
        }
        
        ativosContador[ativoId].total_manutencoes++;
        ativosContador[ativoId].custo_total += parseFloat(ordem.custo_real || ordem.custo_estimado || 0);
      });

      estatisticas.top_ativos_manutencao = Object.entries(ativosContador)
        .sort(([,a], [,b]) => b.total_manutencoes - a.total_manutencoes)
        .slice(0, 10)
        .map(([id, dados]) => ({ ativo_id: id, ...dados }));

      // Planos mais executados
      estatisticas.planos_mais_executados = planos
        .sort((a, b) => b.total_execucoes - a.total_execucoes)
        .slice(0, 10)
        .map(plano => ({
          plano_id: plano.id,
          codigo: plano.codigo,
          nome: plano.nome,
          categoria: plano.categoria,
          total_execucoes: plano.total_execucoes,
          ativo_nome: plano.ativoObj?.nome
        }));

      // Taxa de cumprimento (ordens finalizadas vs ordens criadas)
      const totalOrdensPreventivas = await OrdemServico.count({
        where: {
          ...whereOrdem,
          tipo: 'preventiva',
          plano_preventivo_id: { [Op.ne]: null }
        }
      });

      if (totalOrdensPreventivas > 0) {
        estatisticas.taxa_cumprimento = (ordensPreventivas.length / totalOrdensPreventivas * 100).toFixed(2);
      }

      res.json({
        success: true,
        data: { 
          estatisticas,
          periodo: {
            data_inicio: data_inicio || 'Desde o início',
            data_fim: data_fim || 'Até agora'
          }
        }
      });

    } catch (error) {
      logger.error('Erro ao gerar relatório de eficiência:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Sugerir otimizações nos planos preventivos
  async sugerirOtimizacoes(req, res) {
    try {
      const sugestoes = [];

      // Buscar planos com baixa taxa de execução
      const planosBaixaExecucao = await PlanoPreventivo.findAll({
        where: {
          ativo: true,
          created_at: {
            [Op.lt]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Criados há mais de 90 dias
          }
        },
        include: [
          { model: Ativo, as: 'ativoObj', attributes: ['id', 'nome'] }
        ]
      });

      planosBaixaExecucao.forEach(plano => {
        const diasCriacao = Math.floor((new Date() - new Date(plano.created_at)) / (1000 * 60 * 60 * 24));
        const execucoesPorMes = (plano.total_execucoes / diasCriacao) * 30;

        if (execucoesPorMes < 0.5) { // Menos de 0.5 execuções por mês
          sugestoes.push({
            tipo: 'baixa_execucao',
            prioridade: 'media',
            plano_id: plano.id,
            plano_codigo: plano.codigo,
            ativo_nome: plano.ativoObj?.nome,
            descricao: `Plano com baixa taxa de execução (${plano.total_execucoes} execuções em ${diasCriacao} dias)`,
            sugestao: 'Revisar periodicidade ou desativar se não necessário',
            dados: {
              total_execucoes: plano.total_execucoes,
              dias_criacao: diasCriacao,
              execucoes_por_mes: execucoesPorMes.toFixed(2)
            }
          });
        }
      });

      // Buscar planos frequentemente atrasados
      const planosAtrasados = await PlanoPreventivo.findAll({
        where: {
          ativo: true,
          proxima_execucao: {
            [Op.lt]: new Date()
          }
        },
        include: [
          { model: Ativo, as: 'ativoObj', attributes: ['id', 'nome'] }
        ]
      });

      planosAtrasados.forEach(plano => {
        const diasAtraso = Math.floor((new Date() - new Date(plano.proxima_execucao)) / (1000 * 60 * 60 * 24));
        
        if (diasAtraso > 30) { // Atrasado há mais de 30 dias
          sugestoes.push({
            tipo: 'atraso_critico',
            prioridade: 'alta',
            plano_id: plano.id,
            plano_codigo: plano.codigo,
            ativo_nome: plano.ativoObj?.nome,
            descricao: `Plano crítico com ${diasAtraso} dias de atraso`,
            sugestao: 'Execução urgente ou revisão da periodicidade',
            dados: {
              dias_atraso: diasAtraso,
              proxima_execucao: plano.proxima_execucao
            }
          });
        } else if (diasAtraso > 7) {
          sugestoes.push({
            tipo: 'atraso_moderado',
            prioridade: 'media',
            plano_id: plano.id,
            plano_codigo: plano.codigo,
            ativo_nome: plano.ativoObj?.nome,
            descricao: `Plano com ${diasAtraso} dias de atraso`,
            sugestao: 'Programar execução em breve',
            dados: {
              dias_atraso: diasAtraso,
              proxima_execucao: plano.proxima_execucao
            }
          });
        }
      });

      // Buscar planos com custos elevados
      const ordensCaras = await OrdemServico.findAll({
        where: {
          tipo: 'preventiva',
          status: 'finalizado',
          plano_preventivo_id: { [Op.ne]: null },
          custo_real: { [Op.gt]: 1000 } // Custo real maior que R$ 1000
        },
        include: [
          {
            model: PlanoPreventivo,
            as: 'planoPreventivo',
            include: [
              { model: Ativo, as: 'ativoObj', attributes: ['id', 'nome'] }
            ]
          }
        ],
        order: [['custo_real', 'DESC']],
        limit: 10
      });

      ordensCaras.forEach(ordem => {
        sugestoes.push({
          tipo: 'custo_elevado',
          prioridade: 'media',
          plano_id: ordem.plano_preventivo_id,
          plano_codigo: ordem.planoPreventivo.codigo,
          ativo_nome: ordem.planoPreventivo.ativoObj?.nome,
          descricao: `Manutenção com custo elevado: R$ ${ordem.custo_real}`,
          sugestao: 'Revisar procedimentos e fornecedores para reduzir custos',
          dados: {
            custo_real: ordem.custo_real,
            ordem_codigo: ordem.codigo,
            data_execucao: ordem.data_finalizacao
          }
        });
      });

      // Ordenar sugestões por prioridade
      const prioridadeOrdem = { 'alta': 3, 'media': 2, 'baixa': 1 };
      sugestoes.sort((a, b) => prioridadeOrdem[b.prioridade] - prioridadeOrdem[a.prioridade]);

      res.json({
        success: true,
        data: {
          sugestoes,
          total_sugestoes: sugestoes.length,
          por_tipo: {
            baixa_execucao: sugestoes.filter(s => s.tipo === 'baixa_execucao').length,
            atraso_critico: sugestoes.filter(s => s.tipo === 'atraso_critico').length,
            atraso_moderado: sugestoes.filter(s => s.tipo === 'atraso_moderado').length,
            custo_elevado: sugestoes.filter(s => s.tipo === 'custo_elevado').length
          },
          por_prioridade: {
            alta: sugestoes.filter(s => s.prioridade === 'alta').length,
            media: sugestoes.filter(s => s.prioridade === 'media').length,
            baixa: sugestoes.filter(s => s.prioridade === 'baixa').length
          }
        }
      });

    } catch (error) {
      logger.error('Erro ao gerar sugestões de otimização:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Obter dados para gráfico de Gantt
  async gantt(req, res) {
    try {
      const { 
        periodo = 90,
        apenas_ativos = 'true',
        incluir_concluidos = 'false'
      } = req.query;

      const hoje = new Date();
      const dataFim = new Date();
      dataFim.setDate(hoje.getDate() + parseInt(periodo));

      const where = {};

      // Filtrar apenas ativos se solicitado
      if (apenas_ativos === 'true') {
        where.ativo = true;
      }

      // Calcular próxima execução e status
      const planos = await PlanoPreventivo.findAll({
        where,
        include: [
          {
            model: Ativo,
            as: 'ativo',
            attributes: ['id', 'nome', 'codigo']
          },
          {
            model: User,
            as: 'responsavel',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: OrdemServico,
            as: 'ordens',
            attributes: ['id', 'data_conclusao'],
            where: { status: 'concluida' },
            required: false,
            limit: 1,
            order: [['data_conclusao', 'DESC']]
          }
        ],
        order: [['proxima_execucao', 'ASC']]
      });

      // Processar e filtrar planos por período
      const dadosGantt = [];

      for (const plano of planos) {
        const proximaExecucao = new Date(plano.proxima_execucao);
        
        // Filtrar por período se dentro do range
        if (proximaExecucao <= dataFim) {
          const ultimaOrdem = plano.ordens && plano.ordens.length > 0 ? plano.ordens[0] : null;
          const ultimaExecucao = ultimaOrdem ? ultimaOrdem.data_conclusao : plano.created_at;
          
          // Calcular status baseado na data
          let status = 'ativo';
          const diasAteVencimento = Math.ceil((proximaExecucao - hoje) / (1000 * 60 * 60 * 24));
          
          if (diasAteVencimento < 0) {
            status = 'vencido';
          } else if (diasAteVencimento <= 7) {
            status = 'proximo_vencimento';
          } else if (plano.em_execucao) {
            status = 'em_execucao';
          } else if (!plano.ativo) {
            status = 'pausado';
          }

          // Incluir concluídos se solicitado
          if (incluir_concluidos === 'false' && status === 'concluido') {
            continue;
          }

          // Mapear frequência para texto legível
          const frequenciaTexto = {
            'diaria': 'Diária',
            'semanal': 'Semanal', 
            'quinzenal': 'Quinzenal',
            'mensal': 'Mensal',
            'bimestral': 'Bimestral',
            'trimestral': 'Trimestral',
            'semestral': 'Semestral',
            'anual': 'Anual'
          };

          dadosGantt.push({
            id: plano.id,
            nome: plano.nome,
            codigo: plano.codigo,
            descricao: plano.descricao,
            categoria: plano.categoria,
            prioridade: plano.prioridade,
            frequencia: plano.frequencia,
            frequencia_texto: frequenciaTexto[plano.frequencia] || plano.frequencia,
            proxima_execucao: plano.proxima_execucao,
            ultima_execucao: ultimaExecucao,
            status: status,
            dias_ate_vencimento: diasAteVencimento,
            ativo: plano.ativo,
            responsavel: plano.responsavel,
            estimativa_duracao: plano.estimativa_duracao || this.calcularDuracaoEstimada(plano.frequencia),
            criado_em: plano.created_at,
            atualizado_em: plano.updated_at
          });
        }
      }

      // Estatísticas resumidas
      const estatisticas = {
        total: dadosGantt.length,
        vencidos: dadosGantt.filter(p => p.status === 'vencido').length,
        proximo_vencimento: dadosGantt.filter(p => p.status === 'proximo_vencimento').length,
        em_execucao: dadosGantt.filter(p => p.status === 'em_execucao').length,
        ativos: dadosGantt.filter(p => p.status === 'ativo').length,
        periodo_dias: parseInt(periodo)
      };

      res.json({
        success: true,
        dados: dadosGantt,
        estatisticas: estatisticas,
        filtros: {
          periodo: parseInt(periodo),
          apenas_ativos: apenas_ativos === 'true',
          incluir_concluidos: incluir_concluidos === 'true',
          data_inicio: hoje.toISOString(),
          data_fim: dataFim.toISOString()
        }
      });

    } catch (error) {
      logger.error('Erro ao obter dados do Gantt:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Método auxiliar para calcular duração estimada
  calcularDuracaoEstimada(frequencia) {
    const duracoes = {
      'diaria': 2,
      'semanal': 4,
      'quinzenal': 6,
      'mensal': 8,
      'bimestral': 12,
      'trimestral': 16,
      'semestral': 24,
      'anual': 48
    };
    return duracoes[frequencia] || 4;
  }
}

module.exports = new PlanoPreventivosController();