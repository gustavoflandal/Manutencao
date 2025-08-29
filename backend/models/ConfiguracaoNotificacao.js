const { Model, DataTypes } = require('sequelize');

class ConfiguracaoNotificacao extends Model {
  static associate(models) {
    // Pertence a um usuário
    this.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  }

  // Métodos de instância
  deveReceberNotificacao(tipoNotificacao, prioridade) {
    // Verificar se notificações estão pausadas
    if (this.pausar_notificacoes) {
      if (this.pausar_ate && new Date() < new Date(this.pausar_ate)) {
        return false;
      } else if (this.pausar_ate && new Date() >= new Date(this.pausar_ate)) {
        // Despausar automaticamente
        this.pausar_notificacoes = false;
        this.pausar_ate = null;
        this.save();
      }
    }

    // Verificar prioridade mínima
    const prioridades = { 'baixa': 1, 'normal': 2, 'alta': 3, 'critica': 4 };
    if (prioridades[prioridade] < prioridades[this.prioridade_minima_notificacao]) {
      return false;
    }

    // Verificar configuração específica do tipo
    const configTipo = {
      'sistema': this.notificacoes_sistema,
      'ordem_criada': this.notificacoes_ordens,
      'ordem_atualizada': this.notificacoes_ordens,
      'manutencao_vencida': this.notificacoes_manutencao,
      'ativo_problema': this.notificacoes_ativos,
      'estoque_baixo': this.notificacoes_estoque
    };

    return configTipo[tipoNotificacao] !== false;
  }

  deveReceberEmail(tipoNotificacao, prioridade) {
    // Verificar se emails estão pausados
    if (this.pausar_notificacoes) {
      return false;
    }

    // Verificar prioridade mínima para email
    const prioridades = { 'baixa': 1, 'normal': 2, 'alta': 3, 'critica': 4 };
    if (prioridades[prioridade] < prioridades[this.prioridade_minima_email]) {
      return false;
    }

    // Verificar configuração específica do tipo para email
    const configEmail = {
      'sistema': this.email_sistema,
      'ordem_criada': this.email_ordens,
      'ordem_atualizada': this.email_ordens,
      'manutencao_vencida': this.email_manutencao,
      'ativo_problema': this.email_ativos,
      'estoque_baixo': this.email_estoque
    };

    return configEmail[tipoNotificacao] === true;
  }

  estaNoHorarioPermitido() {
    if (!this.horario_inicio_notificacoes || !this.horario_fim_notificacoes) {
      return true; // Sem restrição de horário
    }

    const agora = new Date();
    const horaAtual = agora.getHours() * 100 + agora.getMinutes();
    
    const inicio = parseInt(this.horario_inicio_notificacoes.replace(':', ''));
    const fim = parseInt(this.horario_fim_notificacoes.replace(':', ''));

    if (inicio <= fim) {
      return horaAtual >= inicio && horaAtual <= fim;
    } else {
      // Horário que cruza meia-noite
      return horaAtual >= inicio || horaAtual <= fim;
    }
  }

  // Métodos estáticos
  static async obterPorUsuario(userId) {
    let config = await this.findOne({
      where: { user_id: userId }
    });

    // Se não existe, criar com padrões
    if (!config) {
      config = await this.create({ user_id: userId });
    }

    return config;
  }

  static async atualizarPorUsuario(userId, novasConfiguracoes) {
    let config = await this.findOne({
      where: { user_id: userId }
    });

    if (!config) {
      config = await this.create({
        user_id: userId,
        ...novasConfiguracoes
      });
    } else {
      await config.update(novasConfiguracoes);
    }

    return config;
  }

  static async obterUsuariosParaNotificacao(tipoNotificacao, prioridade, setorId = null) {
    const configs = await this.findAll({
      include: [
        {
          model: this.sequelize.models.User,
          as: 'user',
          where: { ativo: true },
          attributes: ['id', 'nome', 'email', 'perfil']
        }
      ]
    });

    const usuariosValidos = [];

    for (const config of configs) {
      // Verificar se deve receber notificação
      if (!config.deveReceberNotificacao(tipoNotificacao, prioridade)) {
        continue;
      }

      // Verificar horário permitido
      if (!config.estaNoHorarioPermitido()) {
        continue;
      }

      // Verificar interesse por setor
      if (setorId && config.setores_interesse) {
        const setoresInteresse = Array.isArray(config.setores_interesse) 
          ? config.setores_interesse 
          : JSON.parse(config.setores_interesse);
        
        if (!setoresInteresse.includes(setorId)) {
          continue;
        }
      }

      usuariosValidos.push({
        user: config.user,
        config: config,
        deve_receber_email: config.deveReceberEmail(tipoNotificacao, prioridade)
      });
    }

    return usuariosValidos;
  }
}

module.exports = (sequelize) => {
  ConfiguracaoNotificacao.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'ID do usuário é obrigatório'
        },
        isInt: {
          msg: 'ID do usuário deve ser um número inteiro'
        }
      }
    },
    // Configurações por tipo de notificação
    notificacoes_sistema: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Receber notificações gerais do sistema'
    },
    notificacoes_ordens: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Receber notificações sobre ordens de serviço'
    },
    notificacoes_manutencao: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Receber notificações sobre manutenção preventiva'
    },
    notificacoes_ativos: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Receber notificações sobre problemas em ativos'
    },
    notificacoes_estoque: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Receber notificações sobre estoque'
    },
    
    // Configurações de email
    email_sistema: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Receber emails para notificações do sistema'
    },
    email_ordens: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Receber emails sobre ordens de serviço'
    },
    email_manutencao: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Receber emails sobre manutenção preventiva'
    },
    email_ativos: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Receber emails sobre problemas em ativos'
    },
    email_estoque: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Receber emails sobre estoque'
    },
    
    // Configurações de prioridade mínima
    prioridade_minima_notificacao: {
      type: DataTypes.ENUM('baixa', 'normal', 'alta', 'critica'),
      allowNull: false,
      defaultValue: 'normal',
      comment: 'Prioridade mínima para receber notificações'
    },
    prioridade_minima_email: {
      type: DataTypes.ENUM('baixa', 'normal', 'alta', 'critica'),
      allowNull: false,
      defaultValue: 'alta',
      comment: 'Prioridade mínima para receber emails'
    },
    
    // Configurações de horário
    horario_inicio_notificacoes: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: 'Horário de início para receber notificações (00:00-23:59)'
    },
    horario_fim_notificacoes: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: 'Horário de fim para receber notificações (00:00-23:59)'
    },
    
    // Configurações de frequência
    frequencia_resumo_email: {
      type: DataTypes.ENUM('nunca', 'diario', 'semanal', 'mensal'),
      allowNull: false,
      defaultValue: 'nunca',
      comment: 'Frequência para receber resumo de notificações por email'
    },
    
    // Configurações avançadas
    pausar_notificacoes: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Pausar temporariamente todas as notificações'
    },
    pausar_ate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data/hora até quando pausar as notificações'
    },
    
    // Configurações de setores (JSON array)
    setores_interesse: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array de IDs de setores de interesse para notificações'
    },
    
    // Configurações de tipos de ativo
    tipos_ativo_interesse: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array de tipos de ativo de interesse para notificações'
    }
  }, {
    sequelize,
    tableName: 'configuracoes_notificacao',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['user_id']
      }
    ],
    hooks: {
      beforeCreate: async (config) => {
        // Definir configurações padrão baseadas no perfil do usuário
        const user = await sequelize.models.User.findByPk(config.user_id);
        
        if (user) {
          switch (user.perfil) {
            case 'administrador':
              // Administradores recebem tudo
              config.email_sistema = true;
              config.prioridade_minima_notificacao = 'baixa';
              config.prioridade_minima_email = 'normal';
              break;
              
            case 'supervisor':
              // Supervisores recebem notificações importantes
              config.prioridade_minima_notificacao = 'normal';
              config.prioridade_minima_email = 'alta';
              break;
              
            case 'tecnico':
              // Técnicos focam em ordens e manutenção
              config.notificacoes_sistema = false;
              config.email_sistema = false;
              config.prioridade_minima_notificacao = 'normal';
              break;
              
            case 'solicitante':
              // Solicitantes só recebem sobre suas solicitações
              config.notificacoes_manutencao = false;
              config.notificacoes_estoque = false;
              config.email_manutencao = false;
              config.email_estoque = false;
              config.prioridade_minima_notificacao = 'alta';
              break;
          }
        }
      }
    }
  });

  return ConfiguracaoNotificacao;
};