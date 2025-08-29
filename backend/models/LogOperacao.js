const { Model, DataTypes, Op } = require('sequelize');

class LogOperacao extends Model {
  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'usuario_id',
      as: 'usuario',
      onDelete: 'SET NULL'
    });
  }

  // Métodos estáticos para facilitar o uso
  static async criarLog(dados) {
    try {
      return await this.create(dados);
    } catch (error) {
      console.error('Erro ao criar log de operação:', error);
      // Não quebrar a aplicação por erro de log
      return null;
    }
  }

  static async buscarPorUsuario(usuarioId, limite = 100) {
    return await this.findAll({
      where: { usuario_id: usuarioId },
      include: [{ model: this.sequelize.models.User, as: 'usuario', attributes: ['nome', 'email'] }],
      order: [['data_operacao', 'DESC']],
      limit: limite
    });
  }

  static async buscarPorModulo(modulo, limite = 100) {
    return await this.findAll({
      where: { modulo },
      include: [{ model: this.sequelize.models.User, as: 'usuario', attributes: ['nome', 'email'] }],
      order: [['data_operacao', 'DESC']],
      limit: limite
    });
  }

  static async buscarOperacoesCriticas(limite = 50) {
    return await this.findAll({
      where: { 
        nivel_risco: ['ALTO', 'CRITICO'] 
      },
      include: [{ model: this.sequelize.models.User, as: 'usuario', attributes: ['nome', 'email'] }],
      order: [['data_operacao', 'DESC']],
      limit: limite
    });
  }

  static async relatorioAuditoria(filtros = {}) {
    const where = {};
    
    if (filtros.dataInicio) {
      where.data_operacao = { [Op.gte]: filtros.dataInicio };
    }
    
    if (filtros.dataFim) {
      where.data_operacao = where.data_operacao || {};
      where.data_operacao[Op.lte] = filtros.dataFim;
    }
    
    if (filtros.usuario_id) {
      where.usuario_id = filtros.usuario_id;
    }
    
    if (filtros.modulo) {
      where.modulo = filtros.modulo;
    }
    
    if (filtros.operacao) {
      where.operacao = filtros.operacao;
    }
    
    if (filtros.nivel_risco) {
      where.nivel_risco = filtros.nivel_risco;
    }

    return await this.findAll({
      where,
      include: [{ model: this.sequelize.models.User, as: 'usuario', attributes: ['nome', 'email'] }],
      order: [['data_operacao', 'DESC']],
      limit: filtros.limite || 1000
    });
  }
}

module.exports = (sequelize) => {
  LogOperacao.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // Identificação da operação
    operacao: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Tipo de operação: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VIEW, etc.'
    },
    modulo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Módulo do sistema: ATIVOS, USUARIOS, CATEGORIAS, etc.'
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Descrição detalhada da operação realizada'
    },
    
    // Dados do usuário
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'ID do usuário que executou a operação'
    },
    usuario_nome: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Nome do usuário (snapshot para auditoria)'
    },
    usuario_email: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Email do usuário (snapshot para auditoria)'
    },
    
    // Dados da sessão
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'Endereço IP do usuário'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User Agent do navegador'
    },
    sessao_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'ID da sessão'
    },
    
    // Dados da operação
    recurso_tipo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Tipo do recurso afetado: ativo, usuario, categoria, etc.'
    },
    recurso_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID do recurso afetado'
    },
    recurso_codigo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Código/identificador do recurso (ex: codigo_patrimonio)'
    },
    
    // Estado antes e depois (para updates)
    estado_anterior: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Estado do recurso antes da operação'
    },
    estado_novo: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Estado do recurso após a operação'
    },
    
    // Resultado da operação
    sucesso: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Se a operação foi executada com sucesso'
    },
    erro_detalhes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detalhes do erro caso a operação tenha falhado'
    },
    
    // Metadados
    duracao_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duração da operação em milissegundos'
    },
    endpoint: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Endpoint da API chamado'
    },
    metodo_http: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Método HTTP: GET, POST, PUT, DELETE'
    },
    parametros: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Parâmetros enviados na operação (sem dados sensíveis)'
    },
    
    // Classificação de risco
    nivel_risco: {
      type: DataTypes.ENUM('BAIXO', 'MEDIO', 'ALTO', 'CRITICO'),
      defaultValue: 'BAIXO',
      comment: 'Nível de risco da operação para auditoria'
    },
    
    // Observações
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Observações adicionais sobre a operação'
    },
    
    // Timestamp
    data_operacao: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Data e hora da operação'
    }
  }, {
    sequelize,
    tableName: 'logs_operacoes',
    timestamps: false,  // Desabilitar timestamps automáticos pois usamos data_operacao
    underscored: false, // Sobrescrever configuração global
    freezeTableName: true,
    indexes: [
      {
        fields: ['usuario_id']
      },
      {
        fields: ['operacao']
      },
      {
        fields: ['modulo']
      },
      {
        fields: ['data_operacao']
      },
      {
        fields: ['recurso_tipo', 'recurso_id']
      },
      {
        fields: ['nivel_risco']
      },
      {
        fields: ['sucesso']
      },
      {
        fields: ['ip_address']
      }
    ],
    hooks: {
      beforeCreate: (log) => {
        // Remover dados sensíveis dos parâmetros
        if (log.parametros) {
          const parametrosSeguros = { ...log.parametros };
          const camposSensiveis = ['senha', 'password', 'token', 'secret', 'key'];
          
          function removerSensiveis(obj) {
            for (const key in obj) {
              if (typeof obj[key] === 'object' && obj[key] !== null) {
                removerSensiveis(obj[key]);
              } else if (camposSensiveis.some(campo => key.toLowerCase().includes(campo))) {
                obj[key] = '[REDACTED]';
              }
            }
          }
          
          removerSensiveis(parametrosSeguros);
          log.parametros = parametrosSeguros;
        }
        
        // Remover dados sensíveis do estado anterior e novo
        [log.estado_anterior, log.estado_novo].forEach(estado => {
          if (estado) {
            const camposSensiveis = ['senha', 'password', 'token', 'secret', 'key'];
            camposSensiveis.forEach(campo => {
              if (estado[campo]) {
                estado[campo] = '[REDACTED]';
              }
            });
          }
        });
      }
    }
  });

  return LogOperacao;
};