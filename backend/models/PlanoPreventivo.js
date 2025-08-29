const { Model, DataTypes } = require('sequelize');

class PlanoPreventivo extends Model {
  static associate(models) {
    // Pertence a um ativo
    this.belongsTo(models.Ativo, {
      foreignKey: 'ativo_id',
      as: 'ativoObj'
    });

    // Pertence a um setor (opcional)
    this.belongsTo(models.Setor, {
      foreignKey: 'setor_id',
      as: 'setorObj'
    });

    // Pertence a um responsável (usuário)
    this.belongsTo(models.User, {
      foreignKey: 'responsavel_id',
      as: 'responsavelObj'
    });

    // Pode ter muitas execuções de manutenção (futura implementação)
    // this.hasMany(models.ExecucaoPreventiva, {
    //   foreignKey: 'plano_id',
    //   as: 'execucoes'
    // });
  }

  // Métodos de instância
  calcularProximaExecucao() {
    const hoje = new Date();
    const ultimaExecucao = this.ultima_execucao ? new Date(this.ultima_execucao) : new Date(this.data_inicio);
    
    let proximaData = new Date(ultimaExecucao);
    
    switch (this.tipo_periodicidade) {
      case 'diaria':
        proximaData.setDate(proximaData.getDate() + this.intervalo_periodicidade);
        break;
      case 'semanal':
        proximaData.setDate(proximaData.getDate() + (7 * this.intervalo_periodicidade));
        break;
      case 'quinzenal':
        proximaData.setDate(proximaData.getDate() + (15 * this.intervalo_periodicidade));
        break;
      case 'mensal':
        proximaData.setMonth(proximaData.getMonth() + this.intervalo_periodicidade);
        break;
      case 'bimestral':
        proximaData.setMonth(proximaData.getMonth() + (2 * this.intervalo_periodicidade));
        break;
      case 'trimestral':
        proximaData.setMonth(proximaData.getMonth() + (3 * this.intervalo_periodicidade));
        break;
      case 'semestral':
        proximaData.setMonth(proximaData.getMonth() + (6 * this.intervalo_periodicidade));
        break;
      case 'anual':
        proximaData.setFullYear(proximaData.getFullYear() + this.intervalo_periodicidade);
        break;
      case 'horas_funcionamento':
      case 'contador_producao':
        // Para estes tipos, a próxima execução é calculada baseada nos valores do ativo
        return null; // Requer consulta ao ativo
    }
    
    return proximaData.toISOString().split('T')[0]; // Retorna no formato YYYY-MM-DD
  }

  diasParaVencimento() {
    const hoje = new Date();
    const proximaExecucao = new Date(this.proxima_execucao);
    const diffTime = proximaExecucao - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  statusVencimento() {
    const dias = this.diasParaVencimento();
    
    if (dias < 0) {
      return 'vencido';
    } else if (dias <= this.dias_antecedencia_alerta) {
      return 'alerta';
    } else {
      return 'normal';
    }
  }

  async precisaManutencaoByMetrica() {
    if (!this.ativo) {
      return false;
    }

    if (this.tipo_periodicidade === 'horas_funcionamento' && this.horas_funcionamento_limite) {
      const horasAtual = parseFloat(this.ativo.horas_funcionamento) || 0;
      const horasUltimaExecucao = parseFloat(this.executado_horas) || 0;
      return (horasAtual - horasUltimaExecucao) >= this.horas_funcionamento_limite;
    }

    if (this.tipo_periodicidade === 'contador_producao' && this.contador_producao_limite) {
      const contadorAtual = parseInt(this.ativo.contador_producao) || 0;
      const contadorUltimaExecucao = parseInt(this.executado_contador) || 0;
      return (contadorAtual - contadorUltimaExecucao) >= this.contador_producao_limite;
    }

    return false;
  }

  // Métodos estáticos
  static async obterPlanosPorStatus(status = 'all') {
    const where = { ativo: true };
    
    if (status === 'vencidos') {
      where.proxima_execucao = {
        [this.sequelize.Op.lt]: new Date()
      };
    } else if (status === 'alerta') {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + 7); // Próximos 7 dias
      where.proxima_execucao = {
        [this.sequelize.Op.between]: [new Date(), dataLimite]
      };
    }

    return await this.findAll({
      where,
      include: [
        { model: this.sequelize.models.Ativo, as: 'ativo' },
        { model: this.sequelize.models.Setor, as: 'setor' },
        { model: this.sequelize.models.User, as: 'responsavel' }
      ],
      order: [['proxima_execucao', 'ASC']]
    });
  }

  static async estatisticas() {
    const hoje = new Date();
    const proximosSete = new Date();
    proximosSete.setDate(hoje.getDate() + 7);

    const [total, ativos, vencidos, proximoVencimento, porCategoria, porPrioridade] = await Promise.all([
      this.count(),
      this.count({ where: { ativo: true } }),
      this.count({
        where: {
          ativo: true,
          proxima_execucao: { [this.sequelize.Op.lt]: hoje }
        }
      }),
      this.count({
        where: {
          ativo: true,
          proxima_execucao: { [this.sequelize.Op.between]: [hoje, proximosSete] }
        }
      }),
      this.findAll({
        attributes: [
          'categoria',
          [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'total']
        ],
        where: { ativo: true },
        group: ['categoria'],
        raw: true
      }),
      this.findAll({
        attributes: [
          'prioridade',
          [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'total']
        ],
        where: { ativo: true },
        group: ['prioridade'],
        raw: true
      })
    ]);

    return {
      total,
      ativos,
      vencidos,
      proximoVencimento,
      porCategoria,
      porPrioridade
    };
  }
}

module.exports = (sequelize) => {
  PlanoPreventivo.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    codigo: {
      type: DataTypes.STRING(20),
      allowNull: true, // Permitir null para gerar automaticamente
      unique: true,
      validate: {
        len: {
          args: [2, 20],
          msg: 'Código deve ter entre 2 e 20 caracteres'
        }
      }
    },
    nome: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Nome é obrigatório'
        },
        len: {
          args: [5, 200],
          msg: 'Nome deve ter entre 5 e 200 caracteres'
        }
      }
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ativo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Ativo é obrigatório'
        },
        isInt: {
          msg: 'ID do ativo deve ser um número inteiro'
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
    responsavel_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: {
          msg: 'ID do responsável deve ser um número inteiro'
        }
      }
    },
    tipo_periodicidade: {
      type: DataTypes.ENUM('diaria', 'semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual', 'horas_funcionamento', 'contador_producao'),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Tipo de periodicidade é obrigatório'
        },
        isIn: {
          args: [['diaria', 'semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual', 'horas_funcionamento', 'contador_producao']],
          msg: 'Tipo de periodicidade inválido'
        }
      }
    },
    intervalo_periodicidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: {
          args: 1,
          msg: 'Intervalo deve ser maior que zero'
        },
        max: {
          args: 365,
          msg: 'Intervalo não pode ser maior que 365'
        }
      }
    },
    horas_funcionamento_limite: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        min: {
          args: 0,
          msg: 'Horas de funcionamento não pode ser negativo'
        }
      }
    },
    contador_producao_limite: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: 0,
          msg: 'Contador de produção não pode ser negativo'
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
    categoria: {
      type: DataTypes.ENUM('lubrificacao', 'inspecao', 'limpeza', 'calibracao', 'substituicao', 'ajuste', 'teste', 'outros'),
      allowNull: false,
      defaultValue: 'inspecao',
      validate: {
        isIn: {
          args: [['lubrificacao', 'inspecao', 'limpeza', 'calibracao', 'substituicao', 'ajuste', 'teste', 'outros']],
          msg: 'Categoria inválida'
        }
      }
    },
    duracao_estimada: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: 1,
          msg: 'Duração deve ser maior que zero'
        },
        max: {
          args: 1440, // 24 horas em minutos
          msg: 'Duração não pode ser maior que 24 horas'
        }
      }
    },
    custo_estimado: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00,
      validate: {
        min: {
          args: [0],
          msg: 'Custo não pode ser negativo'
        }
      }
    },
    procedimento: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ferramentas_necessarias: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    pecas_necessarias: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    data_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Data de início é obrigatória'
        },
        isDate: {
          msg: 'Data de início deve ser uma data válida'
        }
      }
    },
    data_fim: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: {
          msg: 'Data de fim deve ser uma data válida'
        },
        isAfterStart(value) {
          if (value && this.data_inicio && new Date(value) <= new Date(this.data_inicio)) {
            throw new Error('Data de fim deve ser posterior à data de início');
          }
        }
      }
    },
    proxima_execucao: {
      type: DataTypes.DATEONLY,
      allowNull: true, // Permitir null para calcular automaticamente
      validate: {
        isDate: {
          msg: 'Próxima execução deve ser uma data válida'
        }
      }
    },
    ultima_execucao: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: {
          msg: 'Última execução deve ser uma data válida'
        }
      }
    },
    executado_horas: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        min: {
          args: 0,
          msg: 'Horas executadas não pode ser negativo'
        }
      }
    },
    executado_contador: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: 0,
          msg: 'Contador executado não pode ser negativo'
        }
      }
    },
    total_execucoes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Total de execuções não pode ser negativo'
        }
      }
    },
    dias_antecedencia_alerta: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 7,
      validate: {
        min: {
          args: [0],
          msg: 'Dias de antecedência não pode ser negativo'
        },
        max: {
          args: [365],
          msg: 'Dias de antecedência não pode ser maior que 365'
        }
      }
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'planos_preventivos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (plano) => {
        // Gerar código automaticamente se não fornecido
        if (!plano.codigo) {
          const count = await PlanoPreventivo.count();
          plano.codigo = `PP${String(count + 1).padStart(3, '0')}`;
        }
        
        // Se não há próxima execução definida, calcular baseado na data de início
        if (!plano.proxima_execucao) {
          plano.proxima_execucao = plano.data_inicio;
        }
      },
      
      beforeUpdate: async (plano) => {
        // Validar se a data de fim ainda é válida
        if (plano.data_fim && plano.data_inicio && new Date(plano.data_fim) <= new Date(plano.data_inicio)) {
          throw new Error('Data de fim deve ser posterior à data de início');
        }
      }
    }
  });

  return PlanoPreventivo;
};