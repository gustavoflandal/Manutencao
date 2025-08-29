const { Model, DataTypes } = require('sequelize');

class Ativo extends Model {
  static associate(models) {
    // Associação com Category
    this.belongsTo(models.Category, {
      foreignKey: 'categoria_id',
      as: 'categoria'
    });

    // Associação com SubCategory
    this.belongsTo(models.SubCategory, {
      foreignKey: 'subcategoria_id',
      as: 'subcategoria'
    });

    // Associação com Department
    this.belongsTo(models.Department, {
      foreignKey: 'department_id',
      as: 'department'
    });

    // Associação com User (responsável)
    this.belongsTo(models.User, {
      foreignKey: 'responsavel_id',
      as: 'responsavel'
    });

    // Associação com Setor
    this.belongsTo(models.Setor, {
      foreignKey: 'setor_id',
      as: 'setor'
    });

    // Associações de um para muitos
    this.hasMany(models.OrdemServico, {
      foreignKey: 'ativo_id',
      as: 'ordens_servico'
    });

    this.hasMany(models.FmeaAnalysis, {
      foreignKey: 'equipment_id',
      as: 'fmea_analyses'
    });
  }
}

module.exports = (sequelize) => {
  Ativo.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    codigo_patrimonio: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    fabricante: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    modelo: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    numero_serie: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    ano_fabricacao: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    data_aquisicao: {
      type: DataTypes.DATE,
      allowNull: false
    },
    valor_aquisicao: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    valor_atual: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    categoria_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    subcategoria_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'subcategories',
        key: 'id'
      }
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      }
    },
    localizacao_completa: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    predio: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    andar: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    sala: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    posicao: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('operacional', 'manutencao', 'parado', 'inativo'),
      defaultValue: 'operacional'
    },
    criticidade: {
      type: DataTypes.ENUM('baixa', 'media', 'alta', 'critica'),
      defaultValue: 'media'
    },
    potencia: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    tensao: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    frequencia: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    peso: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    dimensoes: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    capacidade: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    fornecedor: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    garantia_ate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    manual_operacao: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    manual_manutencao: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    especificacoes_tecnicas: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    qr_code: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    foto_principal: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    responsavel_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    setor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'setores',
        key: 'id'
      }
    },
    data_proxima_inspecao: {
      type: DataTypes.DATE,
      allowNull: true
    },
    horas_funcionamento: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    contador_producao: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    vida_util_anos: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ultima_manutencao: {
      type: DataTypes.DATE,
      allowNull: true
    },
    proxima_manutencao: {
      type: DataTypes.DATE,
      allowNull: true
    },
    intervalo_manutencao_dias: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    custo_manutencao_total: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    mtbf_horas: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    mttr_horas: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    historico_falhas: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    parametros_operacao: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    documentos_anexos: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'ativos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at'
  });

  return Ativo;
};