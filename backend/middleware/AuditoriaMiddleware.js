const AuditoriaService = require('../services/AuditoriaService');

/**
 * Middleware para auditoria automática de operações
 */
class AuditoriaMiddleware {
  /**
   * Middleware principal de auditoria
   */
  static capturarOperacao(opcoes = {}) {
    return async (req, res, next) => {
      const inicioOperacao = Date.now();
      
      // Interceptar resposta para capturar resultado
      const resOriginal = {
        json: res.json.bind(res),
        status: res.status.bind(res),
        send: res.send.bind(res)
      };

      let dadosResposta = null;
      let statusResposta = 200;

      // Interceptar res.json
      res.json = function(data) {
        dadosResposta = data;
        return resOriginal.json(data);
      };

      // Interceptar res.status
      res.status = function(code) {
        statusResposta = code;
        return resOriginal.status(code);
      };

      // Executar próximo middleware
      try {
        await next();
        
        // Registrar operação após execução
        const duracao = Date.now() - inicioOperacao;
        await AuditoriaMiddleware.registrarOperacaoCompleta(
          req, 
          res, 
          dadosResposta, 
          statusResposta, 
          duracao, 
          opcoes
        );
        
      } catch (error) {
        // Registrar erro
        const duracao = Date.now() - inicioOperacao;
        await AuditoriaMiddleware.registrarErro(
          req, 
          error, 
          duracao, 
          opcoes
        );
        throw error; // Re-lançar erro
      }
    };
  }

  /**
   * Registra operação completa
   */
  static async registrarOperacaoCompleta(req, res, dadosResposta, statusResposta, duracao, opcoes) {
    try {
      const operacao = AuditoriaMiddleware.determinarOperacao(req.method);
      const modulo = opcoes.modulo || AuditoriaMiddleware.determinarModulo(req.path);
      const sucesso = statusResposta < 400;
      
      // Extrair dados do recurso da resposta
      const recursoInfo = AuditoriaMiddleware.extrairInfoRecurso(dadosResposta, req);
      
      await AuditoriaService.registrarOperacao({
        operacao,
        modulo,
        descricao: AuditoriaMiddleware.gerarDescricao(req, operacao, modulo, recursoInfo),
        usuario: req.user,
        req,
        recursoTipo: recursoInfo.tipo,
        recursoId: recursoInfo.id,
        recursoCodigo: recursoInfo.codigo,
        estadoNovo: operacao === 'CREATE' ? recursoInfo.dados : null,
        sucesso,
        erroDetalhes: !sucesso ? `Status: ${statusResposta}` : null,
        duracaoMs: duracao,
        nivelRisco: opcoes.nivelRisco || AuditoriaService.determinarNivelRisco(modulo, operacao),
        observacoes: opcoes.observacoes
      });
    } catch (error) {
      console.error('Erro ao registrar auditoria automática:', error);
    }
  }

  /**
   * Registra erro de operação
   */
  static async registrarErro(req, error, duracao, opcoes) {
    try {
      const operacao = AuditoriaMiddleware.determinarOperacao(req.method);
      const modulo = opcoes.modulo || AuditoriaMiddleware.determinarModulo(req.path);
      
      await AuditoriaService.registrarOperacao({
        operacao,
        modulo,
        descricao: `Erro em ${operacao.toLowerCase()} de ${modulo.toLowerCase()}`,
        usuario: req.user,
        req,
        sucesso: false,
        erroDetalhes: error.message,
        duracaoMs: duracao,
        nivelRisco: AuditoriaService.nivelRisco.ALTO
      });
    } catch (auditError) {
      console.error('Erro ao registrar erro na auditoria:', auditError);
    }
  }

  /**
   * Determina operação baseada no método HTTP
   */
  static determinarOperacao(metodo) {
    const mapeamento = {
      'GET': 'VIEW',
      'POST': 'CREATE',
      'PUT': 'UPDATE',
      'PATCH': 'UPDATE',
      'DELETE': 'DELETE'
    };
    return mapeamento[metodo] || 'OTHER';
  }

  /**
   * Determina módulo baseado no path da requisição
   */
  static determinarModulo(path) {
    if (path.includes('/ativos')) return AuditoriaService.modulos.ATIVOS;
    if (path.includes('/users') || path.includes('/usuarios')) return AuditoriaService.modulos.USUARIOS;
    if (path.includes('/categories') || path.includes('/categorias')) return AuditoriaService.modulos.CATEGORIAS;
    if (path.includes('/setores')) return AuditoriaService.modulos.SETORES;
    if (path.includes('/ordens')) return AuditoriaService.modulos.ORDENS_SERVICO;
    if (path.includes('/auth')) return AuditoriaService.modulos.AUTH;
    if (path.includes('/relatorios')) return AuditoriaService.modulos.RELATORIOS;
    if (path.includes('/estoque')) return AuditoriaService.modulos.ESTOQUE;
    return AuditoriaService.modulos.SISTEMA;
  }

  /**
   * Extrai informações do recurso da resposta
   */
  static extrairInfoRecurso(dadosResposta, req) {
    let recurso = null;
    
    // Tentar extrair dados do recurso da resposta
    if (dadosResposta?.data) {
      if (dadosResposta.data.ativo) recurso = dadosResposta.data.ativo;
      else if (dadosResposta.data.user) recurso = dadosResposta.data.user;
      else if (dadosResposta.data.usuario) recurso = dadosResposta.data.usuario;
      else if (dadosResposta.data.categoria) recurso = dadosResposta.data.categoria;
      else if (dadosResposta.data.setor) recurso = dadosResposta.data.setor;
      else if (typeof dadosResposta.data === 'object') recurso = dadosResposta.data;
    }
    
    // Se não encontrou na resposta, tentar no body da requisição
    if (!recurso && req.body) {
      recurso = req.body;
    }
    
    // Se não encontrou, tentar nos parâmetros
    if (!recurso && req.params?.id) {
      recurso = { id: req.params.id };
    }
    
    const modulo = AuditoriaMiddleware.determinarModulo(req.path);
    
    return {
      tipo: modulo.toLowerCase(),
      id: recurso?.id || req.params?.id || null,
      codigo: recurso?.codigo_patrimonio || 
              recurso?.codigo || 
              recurso?.email || 
              null,
      dados: recurso
    };
  }

  /**
   * Gera descrição da operação
   */
  static gerarDescricao(req, operacao, modulo, recursoInfo) {
    const identificador = recursoInfo.codigo || 
                         recursoInfo.id || 
                         'recurso sem identificador';
    
    const acoes = {
      'CREATE': 'Criação',
      'UPDATE': 'Atualização',
      'DELETE': 'Exclusão',
      'VIEW': 'Visualização'
    };
    
    const acao = acoes[operacao] || operacao;
    
    return `${acao} de ${modulo.toLowerCase()}: ${identificador}`;
  }

  /**
   * Middleware específico para login
   */
  static async registrarLogin(req, res, next) {
    const original = res.json.bind(res);
    
    res.json = async function(data) {
      const sucesso = res.statusCode === 200 && data.success;
      const usuario = sucesso ? data.data?.user : null;
      
      await AuditoriaService.registrarLogin(
        usuario || { email: req.body.email },
        req,
        sucesso,
        sucesso ? null : data.message
      );
      
      return original(data);
    };
    
    next();
  }

  /**
   * Middleware específico para logout
   */
  static async registrarLogout(req, res, next) {
    const original = res.json.bind(res);
    
    res.json = async function(data) {
      await AuditoriaService.registrarLogout(req.user, req);
      return original(data);
    };
    
    next();
  }

  /**
   * Middleware para operações críticas
   */
  static operacaoCritica(descricao, observacoes = null) {
    return async (req, res, next) => {
      const original = res.json.bind(res);
      
      res.json = async function(data) {
        const sucesso = res.statusCode < 400;
        
        await AuditoriaService.registrarOperacaoCritica(
          AuditoriaMiddleware.determinarOperacao(req.method),
          AuditoriaMiddleware.determinarModulo(req.path),
          descricao,
          req.user,
          req,
          {
            sucesso,
            erroDetalhes: sucesso ? null : data.message,
            observacoes
          }
        );
        
        return original(data);
      };
      
      next();
    };
  }

  /**
   * Middleware para filtrar rotas que não precisam de auditoria
   */
  static pularAuditoria(req, res, next) {
    // Pular auditoria para certas rotas
    const rotasIgnoradas = [
      '/health',
      '/status',
      '/ping',
      '/favicon.ico'
    ];
    
    const deveIgnorar = rotasIgnoradas.some(rota => req.path.includes(rota));
    
    if (deveIgnorar) {
      return next();
    }
    
    // Aplicar auditoria padrão
    return AuditoriaMiddleware.capturarOperacao()(req, res, next);
  }
}

module.exports = AuditoriaMiddleware;