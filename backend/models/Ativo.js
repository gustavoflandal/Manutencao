const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Ativo = sequelize.define('Ativo', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    codigo_patrimonio: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Código patrimonial é obrigatório'
        },
        len: {
          args: [1, 50],
          msg: 'Código patrimonial deve ter entre 1 e 50 caracteres'
        }
      }
    },
    nome: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Nome do ativo é obrigatório'
        },
        len: {
          args: [1, 200],
          msg: 'Nome deve ter entre 1 e 200 caracteres'
        }
      }
    },
    fabricante: {
      type: DataTypes.STRING(100)
    },
    modelo: {
      type: DataTypes.STRING(100)
    },
    numero_serie: {
      type: DataTypes.STRING(100)
    },
    ano_fabricacao: {
      type: DataTypes.INTEGER,
      validate: {
        min: {
          args: 1900,
          msg: 'Ano de fabricação deve ser maior que 1900'
        },
        max: {
          args: new Date().getFullYear() + 1,
          msg: 'Ano de fabricação não pode ser futuro'
        }
      }
    },
    data_aquisicao: {
      type: DataTypes.DATE
    },
    valor_aquisicao: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: {
          args: [0],
          msg: 'Valor de aquisição não pode ser negativo'
        }
      }
    },
    valor_atual: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: {
          args: [0],
          msg: 'Valor atual não pode ser negativo'
        }
      }
    },
    categoria_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    subcategoria_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'subcategories',
        key: 'id'
      }
    },
    department_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'departments',
        key: 'id'
      }
    },
    localizacao_completa: {
      type: DataTypes.STRING(500)
    },
    predio: {
      type: DataTypes.STRING(100)
    },
    andar: {
      type: DataTypes.STRING(50)
    },
    sala: {
      type: DataTypes.STRING(100)
    },
    posicao: {
      type: DataTypes.STRING(100)
    },
    estado: {
      type: DataTypes.ENUM('operacional', 'manutencao', 'parado', 'inativo', 'baixado'),
      defaultValue: 'operacional',
      validate: {
        isIn: {
          args: [['operacional', 'manutencao', 'parado', 'inativo', 'baixado']],
          msg: 'Estado deve ser: operacional, manutencao, parado, inativo ou baixado'
        }
      }
    },
    criticidade: {
      type: DataTypes.ENUM('baixa', 'media', 'alta', 'critica'),
      defaultValue: 'media',
      validate: {
        isIn: {
          args: [['baixa', 'media', 'alta', 'critica']],
          msg: 'Criticidade deve ser: baixa, media, alta ou critica'
        }
      }
    },
    potencia: {
      type: DataTypes.STRING(50)
    },
    tensao: {
      type: DataTypes.STRING(50)
    },
    frequencia: {
      type: DataTypes.STRING(50)
    },
    peso: {
      type: DataTypes.DECIMAL(10, 2),
      validate: {
        min: {
          args: [0],
          msg: 'Peso não pode ser negativo'
        }
      }
    },
    dimensoes: {
      type: DataTypes.STRING(200)
    },
    capacidade: {
      type: DataTypes.STRING(100)
    },
    fornecedor: {
      type: DataTypes.STRING(200)
    },
    garantia_ate: {
      type: DataTypes.DATE
    },
    manual_operacao: {
      type: DataTypes.TEXT
    },
    manual_manutencao: {
      type: DataTypes.TEXT
    },
    especificacoes_tecnicas: {
      type: DataTypes.TEXT
    },
    observacoes: {
      type: DataTypes.TEXT
    },
    qr_code: {
      type: DataTypes.STRING(500)
    },
    foto_principal: {
      type: DataTypes.STRING(500)
    },
    responsavel_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    setor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'setores',
        key: 'id'
      },
      validate: {
        isInt: {
          msg: 'ID do setor deve ser um número inteiro'
        }
      }
    },
    data_proxima_inspecao: {
      type: DataTypes.DATE
    },
    horas_funcionamento: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00,
      validate: {
        min: {
          args: [0],
          msg: 'Horas de funcionamento não pode ser negativo'
        }
      }
    },
    contador_producao: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Contador de produção não pode ser negativo'
        }
      }
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    tableName: 'ativos',
    hooks: {
      beforeCreate: async (ativo) => {
        // Gerar código patrimonial automaticamente se não fornecido
        if (!ativo.codigo_patrimonio) {
          const count = await Ativo.count();
          ativo.codigo_patrimonio = `AT${String(count + 1).padStart(6, '0')}`;
        }
        
        // Construir localização completa
        ativo.localizacao_completa = [
          ativo.predio,
          ativo.andar,
          ativo.sala,
          ativo.posicao
        ].filter(Boolean).join(' > ');
        
        // Gerar QR Code (URL será implementada posteriormente)
        ativo.qr_code = `QR_${ativo.codigo_patrimonio}_${Date.now()}`;
      },
      
      beforeUpdate: (ativo) => {
        // Atualizar localização completa se mudou
        if (ativo.changed('predio') || ativo.changed('andar') || 
            ativo.changed('sala') || ativo.changed('posicao')) {
          ativo.localizacao_completa = [
            ativo.predio,
            ativo.andar,
            ativo.sala,
            ativo.posicao
          ].filter(Boolean).join(' > ');
        }
      }
    }
  });

  // Definir associações
  Ativo.associate = (models) => {
    // Associação com categoria
    Ativo.belongsTo(models.Category, {
      foreignKey: 'categoria_id',
      as: 'categoria',
      onDelete: 'SET NULL'
    });

    // Associação com subcategoria
    Ativo.belongsTo(models.SubCategory, {
      foreignKey: 'subcategoria_id',
      as: 'subcategoria',
      onDelete: 'SET NULL'
    });

    // Associação com departamento
    Ativo.belongsTo(models.Department, {
      foreignKey: 'department_id',
      as: 'department',
      onDelete: 'SET NULL'
    });

    // Associação com responsável
    Ativo.belongsTo(models.User, {
      foreignKey: 'responsavel_id',
      as: 'responsavel',
      onDelete: 'SET NULL'
    });

    // Associação com setor
    Ativo.belongsTo(models.Setor, {
      foreignKey: 'setor_id',
      as: 'setor',
      onDelete: 'SET NULL'
    });

    // Associação com ordens de serviço
    Ativo.hasMany(models.OrdemServico, {
      foreignKey: 'ativo_id',
      as: 'ordens_servico'
    });

    // Associação com solicitações
    Ativo.hasMany(models.Solicitacao, {
      foreignKey: 'ativo_id',
      as: 'solicitacoes'
    });
  };

  // Métodos da instância
  Ativo.prototype.calcularIdade = function() {
    if (!this.data_aquisicao) return null;
    const agora = new Date();
    const aquisicao = new Date(this.data_aquisicao);
    const diffTime = Math.abs(agora - aquisicao);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 365.25); // Anos com ajuste para anos bissextos
  };

  Ativo.prototype.estaEmGarantia = function() {
    if (!this.garantia_ate) return false;
    return new Date() <= new Date(this.garantia_ate);
  };

  Ativo.prototype.precisaInspecao = function() {
    if (!this.data_proxima_inspecao) return false;
    const agora = new Date();
    const proximaInspecao = new Date(this.data_proxima_inspecao);
    const diasAte = Math.ceil((proximaInspecao - agora) / (1000 * 60 * 60 * 24));
    return diasAte <= 7; // Alerta com 7 dias de antecedência
  };

  // Métodos estáticos
  Ativo.buscarPorCodigo = async function(codigo) {
    return await this.findOne({
      where: { codigo_patrimonio: codigo },
      include: ['categoria', 'subcategoria', 'department', 'responsavel']
    });
  };

  Ativo.buscarPorCriticidade = async function(criticidade) {
    return await this.findAll({
      where: { 
        criticidade: criticidade,
        ativo: true 
      },
      include: ['categoria', 'department'],
      order: [['nome', 'ASC']]
    });
  };

  Ativo.buscarPorEstado = async function(estado) {
    return await this.findAll({
      where: { 
        estado: estado,
        ativo: true 
      },
      include: ['categoria', 'department'],
      order: [['nome', 'ASC']]
    });
  };

  return Ativo;
};