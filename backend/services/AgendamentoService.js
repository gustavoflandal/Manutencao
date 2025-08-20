const { PlanoPreventivo, OrdemServico, Ativo, User, Setor } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

class AgendamentoService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
  }

  /**
   * Inicia o serviço de agendamento automático
   * @param {number} intervalMinutos - Intervalo em minutos para execução automática
   */
  iniciar(intervalMinutos = 60) {
    if (this.isRunning) {
      logger.warn('Serviço de agendamento já está em execução');
      return;
    }

    logger.info(`Iniciando serviço de agendamento automático - Intervalo: ${intervalMinutos} minutos`);
    
    this.isRunning = true;
    
    // Executar imediatamente
    this.executarVerificacao();
    
    // Agendar execuções periódicas
    this.intervalId = setInterval(() => {
      this.executarVerificacao();
    }, intervalMinutos * 60 * 1000);
  }

  /**
   * Para o serviço de agendamento automático
   */
  parar() {
    if (!this.isRunning) {
      logger.warn('Serviço de agendamento não está em execução');
      return;
    }

    logger.info('Parando serviço de agendamento automático');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
  }

  /**
   * Executa a verificação e geração automática de ordens
   */
  async executarVerificacao() {
    try {
      logger.info('Executando verificação automática de planos preventivos');
      
      const resultados = await Promise.all([
        this.gerarOrdensVencidas(),
        this.gerarOrdensProximasVencimento(),
        this.verificarPlanosMetricas(),
        this.enviarAlertas()
      ]);

      const [ordensVencidas, ordensProximas, planosMetricas, alertas] = resultados;

      logger.info('Verificação automática concluída', {
        ordensVencidas: ordensVencidas.length,
        ordensProximas: ordensProximas.length,
        planosMetricas: planosMetricas.length,
        alertasEnviados: alertas.length
      });

      return {
        success: true,
        ordensVencidas,
        ordensProximas,
        planosMetricas,
        alertas
      };

    } catch (error) {
      logger.error('Erro na verificação automática:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Gera ordens para planos vencidos
   */
  async gerarOrdensVencidas() {
    const hoje = new Date();
    
    const planosVencidos = await PlanoPreventivo.findAll({
      where: {
        ativo: true,
        proxima_execucao: {
          [Op.lt]: hoje
        }
      },
      include: [
        { 
          model: Ativo, 
          as: 'ativoObj',
          attributes: ['id', 'nome', 'codigo_patrimonio', 'horas_funcionamento', 'contador_producao']
        },
        { 
          model: User, 
          as: 'responsavelObj',
          attributes: ['id', 'nome', 'email']
        }
      ]
    });

    const ordensGeradas = [];

    for (const plano of planosVencidos) {
      try {
        // Verificar se já existe ordem em aberto
        const ordemExistente = await OrdemServico.findOne({
          where: {
            plano_preventivo_id: plano.id,
            status: {
              [Op.in]: ['aberto', 'em_andamento', 'pendente']
            }
          }
        });

        if (ordemExistente) {
          continue;
        }

        const ordem = await this.criarOrdemAutomatica(plano, 'vencido');
        ordensGeradas.push(ordem);

      } catch (error) {
        logger.error(`Erro ao gerar ordem para plano vencido ${plano.codigo}:`, error);
      }
    }

    return ordensGeradas;
  }

  /**
   * Gera ordens para planos próximos ao vencimento
   */
  async gerarOrdensProximasVencimento() {
    const hoje = new Date();
    const proximosSete = new Date();
    proximosSete.setDate(hoje.getDate() + 7);

    const planosProximos = await PlanoPreventivo.findAll({
      where: {
        ativo: true,
        proxima_execucao: {
          [Op.between]: [hoje, proximosSete]
        },
        prioridade: {
          [Op.in]: ['alta', 'critica']
        }
      },
      include: [
        { 
          model: Ativo, 
          as: 'ativoObj',
          attributes: ['id', 'nome', 'codigo_patrimonio']
        },
        { 
          model: User, 
          as: 'responsavelObj',
          attributes: ['id', 'nome', 'email']
        }
      ]
    });

    const ordensGeradas = [];

    for (const plano of planosProximos) {
      try {
        // Verificar se já existe ordem em aberto
        const ordemExistente = await OrdemServico.findOne({
          where: {
            plano_preventivo_id: plano.id,
            status: {
              [Op.in]: ['aberto', 'em_andamento', 'pendente']
            }
          }
        });

        if (ordemExistente) {
          continue;
        }

        const ordem = await this.criarOrdemAutomatica(plano, 'proximo_vencimento');
        ordensGeradas.push(ordem);

      } catch (error) {
        logger.error(`Erro ao gerar ordem para plano próximo ${plano.codigo}:`, error);
      }
    }

    return ordensGeradas;
  }

  /**
   * Verifica planos baseados em métricas
   */
  async verificarPlanosMetricas() {
    const planosMetricas = await PlanoPreventivo.findAll({
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
        },
        { 
          model: User, 
          as: 'responsavelObj',
          attributes: ['id', 'nome', 'email']
        }
      ]
    });

    const ordensGeradas = [];

    for (const plano of planosMetricas) {
      try {
        const precisaManutencao = await plano.precisaManutencaoByMetrica();
        
        if (precisaManutencao) {
          // Verificar se já existe ordem em aberto
          const ordemExistente = await OrdemServico.findOne({
            where: {
              plano_preventivo_id: plano.id,
              status: {
                [Op.in]: ['aberto', 'em_andamento', 'pendente']
              }
            }
          });

          if (!ordemExistente) {
            const ordem = await this.criarOrdemAutomatica(plano, 'metrica_atingida');
            ordensGeradas.push(ordem);
          }
        }

      } catch (error) {
        logger.error(`Erro ao verificar plano por métrica ${plano.codigo}:`, error);
      }
    }

    return ordensGeradas;
  }

  /**
   * Cria uma ordem de serviço automática
   */
  async criarOrdemAutomatica(plano, motivo) {
    const hoje = new Date();
    
    let titulo = `Manutenção Preventiva - ${plano.nome}`;
    let descricao = `Ordem gerada automaticamente para o plano preventivo ${plano.codigo}`;
    
    switch (motivo) {
      case 'vencido':
        titulo += ' (VENCIDA)';
        descricao += '\n\nMOTIVO: Plano vencido - execução em atraso';
        break;
      case 'proximo_vencimento':
        titulo += ' (PRÓXIMA)';
        descricao += '\n\nMOTIVO: Plano próximo ao vencimento - prioridade alta/crítica';
        break;
      case 'metrica_atingida':
        titulo += ' (MÉTRICA)';
        descricao += '\n\nMOTIVO: Métrica de funcionamento atingiu o limite';
        break;
    }

    if (plano.procedimento) {
      descricao += `\n\nPROCEDIMENTO:\n${plano.procedimento}`;
    }

    const ordemData = {
      titulo,
      descricao,
      tipo: 'preventiva',
      prioridade: plano.prioridade,
      status: 'aberto',
      ativo_id: plano.ativo_id,
      setor_id: plano.setor_id,
      solicitante_id: 1, // Sistema automático
      responsavel_id: plano.responsavel_id,
      plano_preventivo_id: plano.id,
      data_prevista_inicio: motivo === 'vencido' ? hoje.toISOString().split('T')[0] : plano.proxima_execucao,
      duracao_estimada: plano.duracao_estimada,
      custo_estimado: plano.custo_estimado,
      procedimento: plano.procedimento,
      ferramentas_necessarias: plano.ferramentas_necessarias,
      pecas_necessarias: plano.pecas_necessarias,
      observacoes: `Gerada automaticamente em ${hoje.toISOString().split('T')[0]} - Motivo: ${motivo}`
    };

    const ordem = await OrdemServico.create(ordemData);

    logger.info(`Ordem automática criada: ${ordem.codigo} para plano ${plano.codigo}`, {
      ordemId: ordem.id,
      planoId: plano.id,
      motivo
    });

    return {
      ordem_id: ordem.id,
      ordem_codigo: ordem.codigo,
      plano_id: plano.id,
      plano_codigo: plano.codigo,
      ativo_nome: plano.ativoObj?.nome,
      motivo,
      data_criacao: hoje.toISOString()
    };
  }

  /**
   * Envia alertas para responsáveis
   */
  async enviarAlertas() {
    // Por enquanto, apenas registra logs
    // Em implementação futura, pode enviar emails, notificações push, etc.
    
    const hoje = new Date();
    const proximosSete = new Date();
    proximosSete.setDate(hoje.getDate() + 7);

    const planosAlerta = await PlanoPreventivo.findAll({
      where: {
        ativo: true,
        proxima_execucao: {
          [Op.between]: [hoje, proximosSete]
        }
      },
      include: [
        { 
          model: Ativo, 
          as: 'ativoObj',
          attributes: ['id', 'nome']
        },
        { 
          model: User, 
          as: 'responsavelObj',
          attributes: ['id', 'nome', 'email']
        }
      ]
    });

    const alertas = [];

    planosAlerta.forEach(plano => {
      const diasParaVencimento = plano.diasParaVencimento();
      
      if (diasParaVencimento <= plano.dias_antecedencia_alerta) {
        const alerta = {
          plano_id: plano.id,
          plano_codigo: plano.codigo,
          ativo_nome: plano.ativoObj?.nome,
          responsavel_email: plano.responsavelObj?.email,
          dias_para_vencimento: diasParaVencimento,
          proxima_execucao: plano.proxima_execucao
        };

        alertas.push(alerta);

        logger.info(`Alerta de manutenção: ${plano.codigo} vence em ${diasParaVencimento} dias`, {
          planoId: plano.id,
          responsavelId: plano.responsavel_id,
          diasParaVencimento
        });
      }
    });

    return alertas;
  }

  /**
   * Obtém estatísticas do serviço
   */
  async obterEstatisticas() {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const [
      ordensGeradasHoje,
      ordensGeradasMes,
      planosVencidos,
      planosProximoVencimento
    ] = await Promise.all([
      OrdemServico.count({
        where: {
          tipo: 'preventiva',
          plano_preventivo_id: { [Op.ne]: null },
          created_at: {
            [Op.gte]: new Date(hoje.toDateString())
          },
          observacoes: {
            [Op.like]: '%Gerada automaticamente%'
          }
        }
      }),
      OrdemServico.count({
        where: {
          tipo: 'preventiva',
          plano_preventivo_id: { [Op.ne]: null },
          created_at: {
            [Op.gte]: inicioMes
          },
          observacoes: {
            [Op.like]: '%Gerada automaticamente%'
          }
        }
      }),
      PlanoPreventivo.count({
        where: {
          ativo: true,
          proxima_execucao: {
            [Op.lt]: hoje
          }
        }
      }),
      PlanoPreventivo.count({
        where: {
          ativo: true,
          proxima_execucao: {
            [Op.between]: [hoje, new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000)]
          }
        }
      })
    ]);

    return {
      servico_ativo: this.isRunning,
      ordens_geradas_hoje: ordensGeradasHoje,
      ordens_geradas_mes: ordensGeradasMes,
      planos_vencidos: planosVencidos,
      planos_proximo_vencimento: planosProximoVencimento,
      ultima_execucao: new Date().toISOString()
    };
  }

  /**
   * Executa uma verificação manual
   */
  async executarManual() {
    logger.info('Executando verificação manual do serviço de agendamento');
    return await this.executarVerificacao();
  }
}

module.exports = new AgendamentoService();