const { Model, DataTypes } = require('sequelize');

class Notificacao extends Model {
  static associate(models) {
    // Pertence a um destinatário (usuário)
    this.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'destinatario'
    });

    // Pertence a um remetente (usuário)
    this.belongsTo(models.User, {
      foreignKey: 'remetente_id',
      as: 'remetente'
    });
  }

  // Métodos de instância
  async marcarComoLida() {
    this.lida = true;
    this.data_leitura = new Date();
    return await this.save();
  }

  async marcarComoEntregue() {
    this.entregue = true;
    this.data_entrega = new Date();
    return await this.save();
  }

  isExpirada() {
    if (!this.data_expiracao) return false;
    return new Date() > new Date(this.data_expiracao);
  }
}

module.exports = (sequelize) => {
  Notificacao.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titulo: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Título é obrigatório'
        },
        len: {
          args: [5, 255],
          msg: 'Título deve ter entre 5 e 255 caracteres'
        }
      }
    },
    mensagem: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Mensagem é obrigatória'
        }
      }
    },
    tipo: {
      type: DataTypes.ENUM(
        'info', 'success', 'warning', 'error', 
        'sistema', 'ordem_criada', 'ordem_atualizada', 
        'manutencao_vencida', 'ativo_problema', 'estoque_baixo'
      ),
      allowNull: false,
      defaultValue: 'info',
      validate: {
        isIn: {
          args: [['info', 'success', 'warning', 'error', 'sistema', 'ordem_criada', 'ordem_atualizada', 'manutencao_vencida', 'ativo_problema', 'estoque_baixo']],
          msg: 'Tipo de notificação inválido'
        }
      }
    },
    prioridade: {
      type: DataTypes.ENUM('baixa', 'normal', 'alta', 'critica'),
      allowNull: false,
      defaultValue: 'normal',
      validate: {
        isIn: {
          args: [['baixa', 'normal', 'alta', 'critica']],
          msg: 'Prioridade inválida'
        }
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: {
          msg: 'ID do usuário deve ser um número inteiro'
        }
      },
      comment: 'ID do usuário destinatário (null para notificações globais)'
    },
    remetente_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: {
          msg: 'ID do remetente deve ser um número inteiro'
        }
      },
      comment: 'ID do usuário que enviou a notificação'
    },
    lida: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    data_leitura: {
      type: DataTypes.DATE,
      allowNull: true
    },
    entregue: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    data_entrega: {
      type: DataTypes.DATE,
      allowNull: true
    },
    link: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'Link deve ter no máximo 500 caracteres'
        }
      }
    },
    setor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: {
          msg: 'ID do setor deve ser um número inteiro'
        }
      }
    },
    categoria: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: {
          args: [0, 100],
          msg: 'Categoria deve ter no máximo 100 caracteres'
        }
      }
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    data_expiracao: {
      type: DataTypes.DATE,
      allowNull: true
    },
    enviar_email: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    email_enviado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    data_email_enviado: {
      type: DataTypes.DATE,
      allowNull: true
    },
    tentativas_email: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Tentativas de email não pode ser negativo'
        }
      }
    }
  }, {
    sequelize,
    tableName: 'notificacoes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['remetente_id']
      },
      {
        fields: ['tipo']
      },
      {
        fields: ['prioridade']
      },
      {
        fields: ['lida']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['data_expiracao']
      },
      {
        fields: ['setor_id']
      },
      {
        fields: ['categoria']
      },
      {
        fields: ['user_id', 'lida', 'created_at']
      }
    ]
  });

  return Notificacao;
};