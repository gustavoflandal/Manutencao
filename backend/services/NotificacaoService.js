const { Notificacao, ConfiguracaoNotificacao, User } = require('../models');
const EmailService = require('./EmailService');
const logger = require('../config/logger');
const { Op } = require('sequelize');

class NotificacaoService {
  constructor() {
    this.filaEmail = [];
    this.processandoEmail = false;
    
    // Iniciar processamento da fila de emails
    this.iniciarProcessamentoFila();
    
    // Iniciar limpeza automática de notificações expiradas
    this.iniciarLimpezaAutomatica();
  }

  // Criar e enviar notificação
  async criarNotificacao(dados) {
    try {
      const {
        tipo,
        titulo,
        mensagem,
        prioridade = 'normal',
        user_id = null,
        remetente_id,
        link,
        setor_id,
        categoria,
        metadata,
        data_expiracao,
        enviar_email = false
      } = dados;

      // Validações
      if (!tipo || !titulo || !mensagem) {
        throw new Error('Tipo, título e mensagem são obrigatórios');
      }

      // Se for notificação específica para um usuário
      if (user_id) {
        const config = await ConfiguracaoNotificacao.obterPorUsuario(user_id);
        
        // Verificar se o usuário deve receber a notificação
        if (!config.deveReceberNotificacao(tipo, prioridade)) {
          logger.info(`Notificação não enviada: usuário ${user_id} não aceita ${tipo} com prioridade ${prioridade}`);
          return null;
        }

        // Verificar horário permitido
        if (!config.estaNoHorarioPermitido()) {
          logger.info(`Notificação adiada: fora do horário permitido para usuário ${user_id}`);
          // Agendar para mais tarde (implementar se necessário)
          return null;
        }

        // Determinar se deve enviar email
        const deveEnviarEmail = enviar_email && config.deveReceberEmail(tipo, prioridade);

        const notificacao = await Notificacao.create({
          tipo,
          titulo,
          mensagem,
          prioridade,
          user_id,
          remetente_id,
          link,
          setor_id,
          categoria,
          metadata,
          data_expiracao,
          enviar_email: deveEnviarEmail
        });

        // Adicionar à fila de email se necessário
        if (deveEnviarEmail) {
          this.adicionarNaFilaEmail(notificacao.id);
        }

        return notificacao;
      } else {
        // Notificação global - distribuir para usuários relevantes
        const usuariosParaNotificar = await ConfiguracaoNotificacao.obterUsuariosParaNotificacao(
          tipo,
          prioridade,
          setor_id
        );

        const notificacoesCriadas = [];

        for (const { user, config, deve_receber_email } of usuariosParaNotificar) {
          const notificacao = await Notificacao.create({
            tipo,
            titulo,
            mensagem,
            prioridade,
            user_id: user.id,
            remetente_id,
            link,
            setor_id,
            categoria,
            metadata,
            data_expiracao,
            enviar_email: deve_receber_email
          });

          notificacoesCriadas.push(notificacao);

          // Adicionar à fila de email se necessário
          if (deve_receber_email) {
            this.adicionarNaFilaEmail(notificacao.id);
          }
        }

        return notificacoesCriadas;
      }
    } catch (error) {
      logger.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  // Notificações específicas do sistema
  async notificarOrdemCriada(ordem, remetente_id) {
    const dados = {
      tipo: 'ordem_criada',
      titulo: `Nova Ordem de Serviço #${ordem.id}`,
      mensagem: `Uma nova ordem de serviço foi criada: ${ordem.titulo}.\nPrioridade: ${ordem.prioridade}\nSetor: ${ordem.setor?.nome || 'N/A'}`,
      prioridade: this.mapearPrioridadeOrdem(ordem.prioridade),
      remetente_id,
      link: `/ordens-servico/${ordem.id}`,
      setor_id: ordem.setor_id,
      categoria: 'ordem_servico',
      metadata: {
        ordem_id: ordem.id,
        ordem_numero: ordem.numero,
        ordem_titulo: ordem.titulo
      },
      enviar_email: true
    };

    return await this.criarNotificacao(dados);
  }

  async notificarOrdemAtualizada(ordem, mudancas, remetente_id) {
    const dados = {
      tipo: 'ordem_atualizada',
      titulo: `Ordem de Serviço #${ordem.id} Atualizada`,
      mensagem: `A ordem de serviço "${ordem.titulo}" foi atualizada.\nMudanças: ${mudancas.join(', ')}`,
      prioridade: this.mapearPrioridadeOrdem(ordem.prioridade),
      user_id: ordem.solicitante_id,
      remetente_id,
      link: `/ordens-servico/${ordem.id}`,
      setor_id: ordem.setor_id,
      categoria: 'ordem_servico',
      metadata: {
        ordem_id: ordem.id,
        mudancas
      },
      enviar_email: true
    };

    return await this.criarNotificacao(dados);
  }

  async notificarManutencaoVencida(plano) {
    const dados = {
      tipo: 'manutencao_vencida',
      titulo: `Manutenção Vencida: ${plano.nome}`,
      mensagem: `A manutenção preventiva "${plano.nome}" está vencida.\nÚltima execução: ${plano.ultima_execucao ? new Date(plano.ultima_execucao).toLocaleDateString('pt-BR') : 'Nunca'}\nFrequência: ${plano.frequencia_dias} dias`,
      prioridade: 'alta',
      setor_id: plano.setor_id,
      categoria: 'manutencao_preventiva',
      metadata: {
        plano_id: plano.id,
        dias_vencido: Math.floor((new Date() - new Date(plano.proxima_execucao)) / (1000 * 60 * 60 * 24))
      },
      enviar_email: true
    };

    return await this.criarNotificacao(dados);
  }

  async notificarProblemaAtivo(ativo, descricaoProblema, remetente_id) {
    const dados = {
      tipo: 'ativo_problema',
      titulo: `Problema Reportado: ${ativo.nome}`,
      mensagem: `Foi reportado um problema no ativo "${ativo.nome}".\nDescrição: ${descricaoProblema}\nLocalização: ${ativo.localizacao || 'N/A'}`,
      prioridade: 'alta',
      remetente_id,
      setor_id: ativo.setor_id,
      categoria: 'ativo',
      metadata: {
        ativo_id: ativo.id,
        ativo_nome: ativo.nome,
        problema: descricaoProblema
      },
      enviar_email: true
    };

    return await this.criarNotificacao(dados);
  }

  async notificarEstoqueBaixo(item) {
    const dados = {
      tipo: 'estoque_baixo',
      titulo: `Estoque Baixo: ${item.nome}`,
      mensagem: `O item "${item.nome}" está com estoque baixo.\nQuantidade atual: ${item.quantidade_atual}\nQuantidade mínima: ${item.quantidade_minima}`,
      prioridade: 'normal',
      categoria: 'estoque',
      metadata: {
        item_id: item.id,
        quantidade_atual: item.quantidade_atual,
        quantidade_minima: item.quantidade_minima
      },
      enviar_email: false
    };

    return await this.criarNotificacao(dados);
  }

  async notificarSistema(titulo, mensagem, prioridade = 'normal', user_id = null) {
    const dados = {
      tipo: 'sistema',
      titulo,
      mensagem,
      prioridade,
      user_id,
      categoria: 'sistema',
      enviar_email: prioridade === 'critica'
    };

    return await this.criarNotificacao(dados);
  }

  // Gerenciamento da fila de emails
  adicionarNaFilaEmail(notificacaoId) {
    this.filaEmail.push(notificacaoId);
    logger.info(`Notificação ${notificacaoId} adicionada à fila de email`);
  }

  async iniciarProcessamentoFila() {
    setInterval(async () => {
      if (!this.processandoEmail && this.filaEmail.length > 0) {
        await this.processarFilaEmail();
      }
    }, 10000); // Processar a cada 10 segundos
  }

  async processarFilaEmail() {
    if (this.processandoEmail) return;

    this.processandoEmail = true;
    
    try {
      while (this.filaEmail.length > 0) {
        const notificacaoId = this.filaEmail.shift();
        await this.enviarEmailNotificacao(notificacaoId);
        
        // Aguardar um pouco entre envios para não sobrecarregar o servidor
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      logger.error('Erro ao processar fila de email:', error);
    } finally {
      this.processandoEmail = false;
    }
  }

  async enviarEmailNotificacao(notificacaoId) {
    try {
      const notificacao = await Notificacao.findByPk(notificacaoId, {
        include: [
          {
            model: User,
            as: 'destinatario',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: User,
            as: 'remetente',
            attributes: ['id', 'nome']
          }
        ]
      });

      if (!notificacao || notificacao.email_enviado || !notificacao.enviar_email) {
        return;
      }

      if (!notificacao.destinatario?.email) {
        logger.error(`Usuário ${notificacao.user_id} não tem email cadastrado`);
        return;
      }

      const resultado = await EmailService.enviarNotificacaoPorEmail(
        notificacao,
        notificacao.destinatario
      );

      if (resultado.sucesso) {
        await notificacao.update({
          email_enviado: true,
          data_email_enviado: new Date(),
          tentativas_email: notificacao.tentativas_email + 1
        });

        logger.info(`Email da notificação ${notificacaoId} enviado com sucesso`);
      } else {
        // Incrementar tentativas e reagendar se não excedeu o limite
        const novasTentativas = notificacao.tentativas_email + 1;
        
        if (novasTentativas < 3) {
          await notificacao.update({ tentativas_email: novasTentativas });
          
          // Reagendar para mais tarde
          setTimeout(() => {
            this.adicionarNaFilaEmail(notificacaoId);
          }, 30000 * novasTentativas); // Aguardar mais a cada tentativa
          
          logger.warn(`Falha ao enviar email da notificação ${notificacaoId}. Tentativa ${novasTentativas}/3`);
        } else {
          await notificacao.update({ tentativas_email: novasTentativas });
          logger.error(`Falha definitiva ao enviar email da notificação ${notificacaoId} após 3 tentativas`);
        }
      }
    } catch (error) {
      logger.error(`Erro ao enviar email da notificação ${notificacaoId}:`, error);
    }
  }

  // Limpeza automática
  async iniciarLimpezaAutomatica() {
    // Executar limpeza diariamente à meia-noite
    setInterval(async () => {
      const agora = new Date();
      if (agora.getHours() === 0 && agora.getMinutes() === 0) {
        await this.limparNotificacoesExpiradas();
        await this.limparNotificacoesAntigas();
      }
    }, 60000); // Verificar a cada minuto
  }

  async limparNotificacoesExpiradas() {
    try {
      const resultado = await Notificacao.destroy({
        where: {
          data_expiracao: {
            [Op.lt]: new Date()
          }
        }
      });

      if (resultado > 0) {
        logger.info(`${resultado} notificações expiradas foram removidas`);
      }
    } catch (error) {
      logger.error('Erro ao limpar notificações expiradas:', error);
    }
  }

  async limparNotificacoesAntigas() {
    try {
      // Manter apenas notificações dos últimos 6 meses
      const seisMonesesAtras = new Date();
      seisMonesesAtras.setMonth(seisMonesesAtras.getMonth() - 6);

      const resultado = await Notificacao.destroy({
        where: {
          created_at: {
            [Op.lt]: seisMonesesAtras
          },
          lida: true
        }
      });

      if (resultado > 0) {
        logger.info(`${resultado} notificações antigas foram removidas`);
      }
    } catch (error) {
      logger.error('Erro ao limpar notificações antigas:', error);
    }
  }

  // Utilitários
  mapearPrioridadeOrdem(prioridadeOrdem) {
    const mapeamento = {
      'baixa': 'baixa',
      'normal': 'normal',
      'alta': 'alta',
      'urgente': 'critica',
      'critica': 'critica'
    };

    return mapeamento[prioridadeOrdem] || 'normal';
  }

  // Estatísticas
  async obterEstatisticasGerais() {
    try {
      const [
        totalNotificacoes,
        naoLidas,
        enviadas24h,
        emailsEnviados,
        porTipo,
        porPrioridade
      ] = await Promise.all([
        Notificacao.count(),
        Notificacao.count({ where: { lida: false } }),
        Notificacao.count({
          where: {
            created_at: {
              [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        }),
        Notificacao.count({ where: { email_enviado: true } }),
        Notificacao.findAll({
          attributes: [
            'tipo',
            [Notificacao.sequelize.fn('COUNT', Notificacao.sequelize.col('tipo')), 'count']
          ],
          group: ['tipo']
        }),
        Notificacao.findAll({
          attributes: [
            'prioridade',
            [Notificacao.sequelize.fn('COUNT', Notificacao.sequelize.col('prioridade')), 'count']
          ],
          group: ['prioridade']
        })
      ]);

      return {
        total_notificacoes: totalNotificacoes,
        nao_lidas: naoLidas,
        enviadas_24h: enviadas24h,
        emails_enviados: emailsEnviados,
        por_tipo: porTipo.map(item => ({
          tipo: item.tipo,
          count: parseInt(item.dataValues.count)
        })),
        por_prioridade: porPrioridade.map(item => ({
          prioridade: item.prioridade,
          count: parseInt(item.dataValues.count)
        })),
        fila_email: this.filaEmail.length
      };
    } catch (error) {
      logger.error('Erro ao obter estatísticas gerais:', error);
      throw error;
    }
  }
}

module.exports = new NotificacaoService();