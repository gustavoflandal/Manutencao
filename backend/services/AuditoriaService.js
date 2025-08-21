const { LogOperacao } = require('../models');

class AuditoriaService {
  constructor() {
    this.nivelRisco = {
      BAIXO: 'BAIXO',
      MEDIO: 'MEDIO', 
      ALTO: 'ALTO',
      CRITICO: 'CRITICO'
    };

    this.operacoes = {
      CREATE: 'CREATE',
      UPDATE: 'UPDATE',
      DELETE: 'DELETE',
      VIEW: 'VIEW',
      LOGIN: 'LOGIN',
      LOGOUT: 'LOGOUT',
      EXPORT: 'EXPORT',
      IMPORT: 'IMPORT',
      BACKUP: 'BACKUP',
      RESTORE: 'RESTORE'
    };

    this.modulos = {
      ATIVOS: 'ATIVOS',
      USUARIOS: 'USUARIOS',
      CATEGORIAS: 'CATEGORIAS',
      SETORES: 'SETORES',
      ORDENS_SERVICO: 'ORDENS_SERVICO',
      MANUTENCAO: 'MANUTENCAO',
      ESTOQUE: 'ESTOQUE',
      RELATORIOS: 'RELATORIOS',
      AUTH: 'AUTH',
      SISTEMA: 'SISTEMA'
    };
  }

  /**
   * Registra uma operação no log de auditoria
   */
  async registrarOperacao({
    operacao,
    modulo,
    descricao,
    usuario,
    req,
    recursoTipo = null,
    recursoId = null,
    recursoCodigo = null,
    estadoAnterior = null,
    estadoNovo = null,
    sucesso = true,
    erroDetalhes = null,
    nivelRisco = this.nivelRisco.BAIXO,
    observacoes = null,
    duracaoMs = null,
    parametros = null
  }) {
    try {
      const dadosLog = {
        operacao,
        modulo,
        descricao,
        
        // Dados do usuário
        usuario_id: usuario?.id || null,
        usuario_nome: usuario?.nome || 'Sistema',
        usuario_email: usuario?.email || null,
        
        // Dados da requisição
        ip_address: this.extrairIP(req),
        user_agent: req?.headers?.['user-agent'] || null,
        sessao_id: req?.sessionID || null,
        endpoint: req?.originalUrl || null,
        metodo_http: req?.method || null,
        
        // Dados do recurso
        recurso_tipo: recursoTipo,
        recurso_id: recursoId,
        recurso_codigo: recursoCodigo,
        
        // Estados
        estado_anterior: estadoAnterior,
        estado_novo: estadoNovo,
        
        // Resultado
        sucesso,
        erro_detalhes: erroDetalhes,
        
        // Metadados
        duracao_ms: duracaoMs,
        parametros: parametros || this.extrairParametros(req),
        nivel_risco: nivelRisco,
        observacoes,
        
        data_operacao: new Date()
      };

      return await LogOperacao.criarLog(dadosLog);
    } catch (error) {
      console.error('Erro no serviço de auditoria:', error);
      return null;
    }
  }

  /**
   * Registra login de usuário
   */
  async registrarLogin(usuario, req, sucesso = true, erroDetalhes = null) {
    return await this.registrarOperacao({
      operacao: this.operacoes.LOGIN,
      modulo: this.modulos.AUTH,
      descricao: sucesso ? 
        `Login realizado com sucesso para ${usuario?.email || 'usuário desconhecido'}` :
        `Tentativa de login falhada para ${usuario?.email || 'email não informado'}`,
      usuario: sucesso ? usuario : null,
      req,
      sucesso,
      erroDetalhes,
      nivelRisco: sucesso ? this.nivelRisco.BAIXO : this.nivelRisco.MEDIO
    });
  }

  /**
   * Registra logout de usuário
   */
  async registrarLogout(usuario, req) {
    return await this.registrarOperacao({
      operacao: this.operacoes.LOGOUT,
      modulo: this.modulos.AUTH,
      descricao: `Logout realizado para ${usuario?.email}`,
      usuario,
      req,
      nivelRisco: this.nivelRisco.BAIXO
    });
  }

  /**
   * Registra criação de recurso
   */
  async registrarCriacao(modulo, recurso, usuario, req, observacoes = null) {
    return await this.registrarOperacao({
      operacao: this.operacoes.CREATE,
      modulo,
      descricao: `Criação de ${modulo.toLowerCase()}: ${this.obterIdentificadorRecurso(recurso)}`,
      usuario,
      req,
      recursoTipo: modulo.toLowerCase(),
      recursoId: recurso?.id,
      recursoCodigo: this.obterCodigoRecurso(recurso),
      estadoNovo: this.limparDadosSensiveis(recurso),
      nivelRisco: this.determinarNivelRisco(modulo, this.operacoes.CREATE),
      observacoes
    });
  }

  /**
   * Registra atualização de recurso
   */
  async registrarAtualizacao(modulo, recursoAnterior, recursoNovo, usuario, req, observacoes = null) {
    return await this.registrarOperacao({
      operacao: this.operacoes.UPDATE,
      modulo,
      descricao: `Atualização de ${modulo.toLowerCase()}: ${this.obterIdentificadorRecurso(recursoNovo)}`,
      usuario,
      req,
      recursoTipo: modulo.toLowerCase(),
      recursoId: recursoNovo?.id,
      recursoCodigo: this.obterCodigoRecurso(recursoNovo),
      estadoAnterior: this.limparDadosSensiveis(recursoAnterior),
      estadoNovo: this.limparDadosSensiveis(recursoNovo),
      nivelRisco: this.determinarNivelRisco(modulo, this.operacoes.UPDATE),
      observacoes
    });
  }

  /**
   * Registra exclusão de recurso
   */
  async registrarExclusao(modulo, recurso, usuario, req, observacoes = null) {
    return await this.registrarOperacao({
      operacao: this.operacoes.DELETE,
      modulo,
      descricao: `Exclusão de ${modulo.toLowerCase()}: ${this.obterIdentificadorRecurso(recurso)}`,
      usuario,
      req,
      recursoTipo: modulo.toLowerCase(),
      recursoId: recurso?.id,
      recursoCodigo: this.obterCodigoRecurso(recurso),
      estadoAnterior: this.limparDadosSensiveis(recurso),
      nivelRisco: this.determinarNivelRisco(modulo, this.operacoes.DELETE),
      observacoes
    });
  }

  /**
   * Registra visualização de dados sensíveis
   */
  async registrarVisualizacao(modulo, recurso, usuario, req, observacoes = null) {
    return await this.registrarOperacao({
      operacao: this.operacoes.VIEW,
      modulo,
      descricao: `Visualização de ${modulo.toLowerCase()}: ${this.obterIdentificadorRecurso(recurso)}`,
      usuario,
      req,
      recursoTipo: modulo.toLowerCase(),
      recursoId: recurso?.id,
      recursoCodigo: this.obterCodigoRecurso(recurso),
      nivelRisco: this.nivelRisco.BAIXO,
      observacoes
    });
  }

  /**
   * Registra operação crítica do sistema
   */
  async registrarOperacaoCritica(operacao, modulo, descricao, usuario, req, detalhes = {}) {
    return await this.registrarOperacao({
      operacao,
      modulo,
      descricao,
      usuario,
      req,
      ...detalhes,
      nivelRisco: this.nivelRisco.CRITICO
    });
  }

  /**
   * Extrai endereço IP da requisição
   */
  extrairIP(req) {
    if (!req) return null;
    
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.headers?.['x-forwarded-for']?.split(',')[0] ||
           req.headers?.['x-real-ip'] ||
           null;
  }

  /**
   * Extrai parâmetros da requisição (sem dados sensíveis)
   */
  extrairParametros(req) {
    if (!req) return null;

    const parametros = {
      query: req.query || {},
      params: req.params || {},
      body: { ...req.body } || {}
    };

    // Remover dados sensíveis
    const camposSensiveis = ['senha', 'password', 'token', 'secret', 'key'];
    camposSensiveis.forEach(campo => {
      if (parametros.body[campo]) {
        parametros.body[campo] = '[REDACTED]';
      }
    });

    return parametros;
  }

  /**
   * Determina nível de risco baseado no módulo e operação
   */
  determinarNivelRisco(modulo, operacao) {
    // Operações críticas
    if (operacao === this.operacoes.DELETE) {
      if ([this.modulos.USUARIOS, this.modulos.SISTEMA].includes(modulo)) {
        return this.nivelRisco.CRITICO;
      }
      return this.nivelRisco.ALTO;
    }

    // Módulos sensíveis
    if ([this.modulos.USUARIOS, this.modulos.AUTH].includes(modulo)) {
      if (operacao === this.operacoes.CREATE || operacao === this.operacoes.UPDATE) {
        return this.nivelRisco.ALTO;
      }
    }

    // Operações de sistema
    if ([this.operacoes.BACKUP, this.operacoes.RESTORE, this.operacoes.IMPORT].includes(operacao)) {
      return this.nivelRisco.ALTO;
    }

    return this.nivelRisco.BAIXO;
  }

  /**
   * Obtém identificador do recurso para logs
   */
  obterIdentificadorRecurso(recurso) {
    if (!recurso) return 'N/A';
    
    return recurso.nome || 
           recurso.codigo_patrimonio || 
           recurso.email || 
           recurso.codigo || 
           recurso.titulo ||
           `ID: ${recurso.id}` || 
           'Sem identificador';
  }

  /**
   * Obtém código do recurso para indexação
   */
  obterCodigoRecurso(recurso) {
    if (!recurso) return null;
    
    return recurso.codigo_patrimonio || 
           recurso.codigo || 
           recurso.email || 
           recurso.id?.toString() || 
           null;
  }

  /**
   * Remove dados sensíveis antes de armazenar no log
   */
  limparDadosSensiveis(objeto) {
    if (!objeto) return null;

    const objetoLimpo = { ...objeto };
    const camposSensiveis = ['senha', 'password', 'token', 'secret', 'key', 'hash'];
    
    camposSensiveis.forEach(campo => {
      if (objetoLimpo[campo]) {
        objetoLimpo[campo] = '[REDACTED]';
      }
    });

    return objetoLimpo;
  }

  /**
   * Gera relatório de auditoria
   */
  async gerarRelatorioAuditoria(filtros = {}) {
    return await LogOperacao.relatorioAuditoria(filtros);
  }

  /**
   * Busca logs por critério
   */
  async buscarLogs(criterio, valor, limite = 100) {
    const where = {};
    where[criterio] = valor;

    return await LogOperacao.findAll({
      where,
      include: [{ model: require('../models').User, as: 'usuario', attributes: ['nome', 'email'] }],
      order: [['data_operacao', 'DESC']],
      limit: limite
    });
  }

  /**
   * Estatísticas de auditoria
   */
  async obterEstatisticas(dataInicio, dataFim) {
    const { Op } = require('sequelize');
    const where = {};
    
    if (dataInicio || dataFim) {
      where.data_operacao = {};
      if (dataInicio) where.data_operacao[Op.gte] = dataInicio;
      if (dataFim) where.data_operacao[Op.lte] = dataFim;
    }

    const [
      totalOperacoes,
      operacoesSucesso,
      operacoesErro,
      operacoesCriticas,
      usuariosAtivos,
      modulosUtilizados,
      operacoesPorTipo
    ] = await Promise.all([
      LogOperacao.count({ where }),
      LogOperacao.count({ where: { ...where, sucesso: true } }),
      LogOperacao.count({ where: { ...where, sucesso: false } }),
      LogOperacao.count({ where: { ...where, nivel_risco: ['ALTO', 'CRITICO'] } }),
      LogOperacao.count({ where, distinct: true, col: 'usuario_id' }),
      LogOperacao.findAll({
        where,
        attributes: ['modulo', [require('sequelize').fn('COUNT', '*'), 'total']],
        group: ['modulo'],
        order: [[require('sequelize').literal('total'), 'DESC']]
      }),
      LogOperacao.findAll({
        where,
        attributes: ['operacao', [require('sequelize').fn('COUNT', '*'), 'total']],
        group: ['operacao'],
        order: [[require('sequelize').literal('total'), 'DESC']]
      })
    ]);

    return {
      totalOperacoes,
      operacoesSucesso,
      operacoesErro,
      operacoesCriticas,
      usuariosAtivos,
      modulosUtilizados: modulosUtilizados.map(m => ({ modulo: m.modulo, total: m.dataValues.total })),
      operacoesPorTipo: operacoesPorTipo.map(o => ({ operacao: o.operacao, total: o.dataValues.total })),
      taxaSucesso: totalOperacoes > 0 ? (operacoesSucesso / totalOperacoes * 100).toFixed(2) : 0
    };
  }
}

module.exports = new AuditoriaService();