const AgendamentoService = require('../services/AgendamentoService');
const logger = require('../config/logger');

class AgendamentoController {

  // Obter status do serviço de agendamento
  async status(req, res) {
    try {
      const estatisticas = await AgendamentoService.obterEstatisticas();

      res.json({
        success: true,
        data: estatisticas
      });

    } catch (error) {
      logger.error('Erro ao obter status do agendamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Iniciar serviço de agendamento automático
  async iniciar(req, res) {
    try {
      const { intervalo_minutos = 60 } = req.body;

      AgendamentoService.iniciar(intervalo_minutos);

      logger.info(`Serviço de agendamento iniciado por usuário ${req.user.id}`, {
        userId: req.user.id,
        intervaloMinutos: intervalo_minutos
      });

      res.json({
        success: true,
        message: `Serviço de agendamento iniciado com intervalo de ${intervalo_minutos} minutos`
      });

    } catch (error) {
      logger.error('Erro ao iniciar serviço de agendamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Parar serviço de agendamento automático
  async parar(req, res) {
    try {
      AgendamentoService.parar();

      logger.info(`Serviço de agendamento parado por usuário ${req.user.id}`, {
        userId: req.user.id
      });

      res.json({
        success: true,
        message: 'Serviço de agendamento parado com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao parar serviço de agendamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Executar verificação manual
  async executarManual(req, res) {
    try {
      const resultado = await AgendamentoService.executarManual();

      logger.info(`Verificação manual executada por usuário ${req.user.id}`, {
        userId: req.user.id,
        resultado
      });

      res.json({
        success: true,
        message: 'Verificação manual executada com sucesso',
        data: resultado
      });

    } catch (error) {
      logger.error('Erro ao executar verificação manual:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new AgendamentoController();