const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ItemEstoque = sequelize.define('ItemEstoque', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    codigo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Código do item é obrigatório'
        },
        len: {
          args: [1, 50],
          msg: 'Código deve ter entre 1 e 50 caracteres'
        }
      }
    },
    codigo_barras: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    nome: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Nome do item é obrigatório'
        },
        len: {
          args: [1, 200],
          msg: 'Nome deve ter entre 1 e 200 caracteres'
        }
      }
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    categoria_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: {
          msg: 'ID da categoria deve ser um número inteiro'
        }
      }
    },
    fornecedor_principal_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: {
          msg: 'ID do fornecedor deve ser um número inteiro'
        }
      }
    },
    unidade_medida: {
      type: DataTypes.ENUM('UN', 'PC', 'KG', 'G', 'L', 'ML', 'M', 'CM', 'M2', 'M3', 'CX', 'PCT', 'KIT'),
      allowNull: false,
      defaultValue: 'UN',
      validate: {
        isIn: {
          args: [['UN', 'PC', 'KG', 'G', 'L', 'ML', 'M', 'CM', 'M2', 'M3', 'CX', 'PCT', 'KIT']],
          msg: 'Unidade de medida inválida'
        }
      }
    },
    tipo_item: {
      type: DataTypes.ENUM('material', 'ferramenta', 'epi', 'consumivel', 'peca_reposicao', 'outros'),
      allowNull: false,
      defaultValue: 'material',
      validate: {
        isIn: {
          args: [['material', 'ferramenta', 'epi', 'consumivel', 'peca_reposicao', 'outros']],
          msg: 'Tipo de item inválido'
        }
      }
    },
    localizacao: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    quantidade_atual: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0.000,
      validate: {
        min: {
          args: [0],
          msg: 'Quantidade atual não pode ser negativa'
        }
      }
    },
    quantidade_minima: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0.000,
      validate: {
        min: {
          args: [0],
          msg: 'Quantidade mínima não pode ser negativa'
        }
      }
    },
    quantidade_maxima: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Quantidade máxima não pode ser negativa'
        }
      }
    },
    ponto_reposicao: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Ponto de reposição não pode ser negativo'
        }
      }
    },
    preco_unitario: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0.00,
      validate: {
        min: {
          args: [0],
          msg: 'Preço unitário não pode ser negativo'
        }
      }
    },
    preco_medio: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0.00,
      validate: {
        min: {
          args: [0],
          msg: 'Preço médio não pode ser negativo'
        }
      }
    },
    valor_total: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0.00,
      validate: {
        min: {
          args: [0],
          msg: 'Valor total não pode ser negativo'
        }
      }
    },
    ncm: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    aplicacao: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    especificacoes_tecnicas: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    numero_parte: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    marca: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    modelo: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    peso: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Peso não pode ser negativo'
        }
      }
    },
    dimensoes: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    validade_controle: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    dias_validade: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: [1],
          msg: 'Dias de validade deve ser maior que zero'
        }
      }
    },
    temperatura_armazenamento: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    condicoes_armazenamento: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    criticidade: {
      type: DataTypes.ENUM('baixa', 'media', 'alta', 'critica'),
      allowNull: false,
      defaultValue: 'media',
      validate: {
        isIn: {
          args: [['baixa', 'media', 'alta', 'critica']],
          msg: 'Criticidade inválida'
        }
      }
    },
    status_item: {
      type: DataTypes.ENUM('ativo', 'inativo', 'descontinuado', 'em_analise'),
      allowNull: false,
      defaultValue: 'ativo',
      validate: {
        isIn: {
          args: [['ativo', 'inativo', 'descontinuado', 'em_analise']],
          msg: 'Status do item inválido'
        }
      }
    },
    foto_principal: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    usuario_cadastro_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: {
          msg: 'ID do usuário deve ser um número inteiro'
        }
      }
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'itens_estoque',
    hooks: {
      beforeCreate: async (item) => {
        // Gerar código automaticamente se não fornecido
        if (!item.codigo) {
          const count = await ItemEstoque.count();
          item.codigo = `EST${String(count + 1).padStart(6, '0')}`;
        }
        
        // Converter código para maiúsculo
        item.codigo = item.codigo.toUpperCase();
        
        // Calcular valor total
        if (item.quantidade_atual && item.preco_medio) {
          item.valor_total = parseFloat(item.quantidade_atual) * parseFloat(item.preco_medio);
        }
        
        // Definir ponto de reposição se não fornecido
        if (!item.ponto_reposicao && item.quantidade_minima) {
          item.ponto_reposicao = parseFloat(item.quantidade_minima) * 1.2; // 20% acima do mínimo
        }
      },
      
      beforeUpdate: (item) => {
        if (item.codigo) {
          item.codigo = item.codigo.toUpperCase();
        }
        
        // Recalcular valor total se quantidade ou preço mudaram
        if (item.changed('quantidade_atual') || item.changed('preco_medio')) {
          const quantidade = item.quantidade_atual || 0;
          const preco = item.preco_medio || 0;
          item.valor_total = parseFloat(quantidade) * parseFloat(preco);
        }
        
        // Atualizar ponto de reposição se quantidade mínima mudou
        if (item.changed('quantidade_minima') && !item.changed('ponto_reposicao')) {
          item.ponto_reposicao = parseFloat(item.quantidade_minima || 0) * 1.2;
        }
      }
    }
  });

  // Definir associações
  ItemEstoque.associate = (models) => {
    // Pertence a uma categoria
    ItemEstoque.belongsTo(models.CategoriaEstoque, {
      foreignKey: 'categoria_id',
      as: 'categoria',
      onDelete: 'SET NULL'
    });

    // Pertence a um fornecedor principal
    ItemEstoque.belongsTo(models.Fornecedor, {
      foreignKey: 'fornecedor_principal_id',
      as: 'fornecedor_principal',
      onDelete: 'SET NULL'
    });

    // Pertence a um usuário que cadastrou
    ItemEstoque.belongsTo(models.User, {
      foreignKey: 'usuario_cadastro_id',
      as: 'usuario_cadastro',
      onDelete: 'SET NULL'
    });

    // Tem muitas movimentações
    ItemEstoque.hasMany(models.MovimentacaoEstoque, {
      foreignKey: 'item_estoque_id',
      as: 'movimentacoes',
      onDelete: 'CASCADE'
    });
  };

  // Métodos da instância
  ItemEstoque.prototype.isEstoqueBaixo = function() {
    return parseFloat(this.quantidade_atual) <= parseFloat(this.quantidade_minima || 0);
  };

  ItemEstoque.prototype.isPontoReposicao = function() {
    return parseFloat(this.quantidade_atual) <= parseFloat(this.ponto_reposicao || 0);
  };

  ItemEstoque.prototype.getStatusEstoque = function() {
    if (this.isEstoqueBaixo()) return 'baixo';
    if (this.isPontoReposicao()) return 'reposicao';
    return 'normal';
  };

  ItemEstoque.prototype.calcularGiro = async function(dias = 30) {
    const movimentacoes = await this.getMovimentacoes({
      where: {
        tipo_movimentacao: 'saida',
        data_movimentacao: {
          [sequelize.Op.gte]: new Date(Date.now() - dias * 24 * 60 * 60 * 1000)
        }
      }
    });

    const totalSaidas = movimentacoes.reduce((total, mov) => total + parseFloat(mov.quantidade), 0);
    const giro = totalSaidas / parseFloat(this.quantidade_atual || 1);
    
    return {
      total_saidas: totalSaidas,
      giro_dias: giro,
      giro_mensal: giro * (30 / dias)
    };
  };

  // Métodos estáticos
  ItemEstoque.buscarPorCodigo = async function(codigo) {
    return await this.findOne({
      where: { 
        codigo: codigo.toUpperCase(),
        ativo: true 
      },
      include: [
        { model: sequelize.models.CategoriaEstoque, as: 'categoria' },
        { model: sequelize.models.Fornecedor, as: 'fornecedor_principal' },
        { model: sequelize.models.User, as: 'usuario_cadastro', attributes: ['id', 'nome'] }
      ]
    });
  };

  ItemEstoque.buscarPorCodigoBarras = async function(codigoBarras) {
    return await this.findOne({
      where: { 
        codigo_barras: codigoBarras,
        ativo: true 
      },
      include: [
        { model: sequelize.models.CategoriaEstoque, as: 'categoria' },
        { model: sequelize.models.Fornecedor, as: 'fornecedor_principal' }
      ]
    });
  };

  ItemEstoque.listarEstoqueBaixo = async function() {
    return await this.findAll({
      where: {
        [sequelize.Op.and]: [
          { ativo: true },
          sequelize.where(
            sequelize.col('quantidade_atual'),
            sequelize.Op.lte,
            sequelize.col('quantidade_minima')
          )
        ]
      },
      include: [
        { model: sequelize.models.CategoriaEstoque, as: 'categoria' },
        { model: sequelize.models.Fornecedor, as: 'fornecedor_principal' }
      ],
      order: [['nome', 'ASC']]
    });
  };

  ItemEstoque.listarPontoReposicao = async function() {
    return await this.findAll({
      where: {
        [sequelize.Op.and]: [
          { ativo: true },
          sequelize.where(
            sequelize.col('quantidade_atual'),
            sequelize.Op.lte,
            sequelize.col('ponto_reposicao')
          )
        ]
      },
      include: [
        { model: sequelize.models.CategoriaEstoque, as: 'categoria' },
        { model: sequelize.models.Fornecedor, as: 'fornecedor_principal' }
      ],
      order: [['nome', 'ASC']]
    });
  };

  ItemEstoque.estatisticas = async function() {
    const total = await this.count({ where: { ativo: true } });
    const estoqueBaixo = await this.count({
      where: {
        [sequelize.Op.and]: [
          { ativo: true },
          sequelize.where(
            sequelize.col('quantidade_atual'),
            sequelize.Op.lte,
            sequelize.col('quantidade_minima')
          )
        ]
      }
    });
    
    const pontoReposicao = await this.count({
      where: {
        [sequelize.Op.and]: [
          { ativo: true },
          sequelize.where(
            sequelize.col('quantidade_atual'),
            sequelize.Op.lte,
            sequelize.col('ponto_reposicao')
          )
        ]
      }
    });

    const valorTotal = await this.sum('valor_total', { where: { ativo: true } });

    return {
      total_itens: total,
      itens_estoque_baixo: estoqueBaixo,
      itens_ponto_reposicao: pontoReposicao,
      valor_total_estoque: parseFloat(valorTotal || 0)
    };
  };

  return ItemEstoque;
};