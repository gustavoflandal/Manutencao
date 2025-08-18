const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MovimentacaoEstoque = sequelize.define('MovimentacaoEstoque', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    numero_movimentacao: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Número da movimentação é obrigatório'
        }
      }
    },
    item_estoque_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Item de estoque é obrigatório'
        },
        isInt: {
          msg: 'ID do item de estoque deve ser um número inteiro'
        }
      }
    },
    tipo_movimentacao: {
      type: DataTypes.ENUM('entrada', 'saida', 'transferencia', 'ajuste', 'perda', 'devolucao'),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Tipo de movimentação é obrigatório'
        },
        isIn: {
          args: [['entrada', 'saida', 'transferencia', 'ajuste', 'perda', 'devolucao']],
          msg: 'Tipo de movimentação inválido'
        }
      }
    },
    operacao: {
      type: DataTypes.ENUM('soma', 'subtracao'),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Operação é obrigatória'
        },
        isIn: {
          args: [['soma', 'subtracao']],
          msg: 'Operação deve ser soma ou subtração'
        }
      }
    },
    quantidade: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Quantidade é obrigatória'
        },
        min: {
          args: [0.001],
          msg: 'Quantidade deve ser maior que zero'
        }
      }
    },
    quantidade_anterior: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Quantidade anterior não pode ser negativa'
        }
      }
    },
    quantidade_posterior: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Quantidade posterior não pode ser negativa'
        }
      }
    },
    preco_unitario: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Preço unitário não pode ser negativo'
        }
      }
    },
    valor_total: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Valor total não pode ser negativo'
        }
      }
    },
    documento_origem: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    fornecedor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: {
          msg: 'ID do fornecedor deve ser um número inteiro'
        }
      }
    },
    ordem_servico_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: {
          msg: 'ID da ordem de serviço deve ser um número inteiro'
        }
      }
    },
    plano_preventivo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: {
          msg: 'ID do plano preventivo deve ser um número inteiro'
        }
      }
    },
    setor_origem_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: {
          msg: 'ID do setor de origem deve ser um número inteiro'
        }
      }
    },
    setor_destino_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: {
          msg: 'ID do setor de destino deve ser um número inteiro'
        }
      }
    },
    data_movimentacao: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      validate: {
        notNull: {
          msg: 'Data da movimentação é obrigatória'
        },
        isDate: {
          msg: 'Data da movimentação deve ser uma data válida'
        }
      }
    },
    data_validade: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: {
          msg: 'Data de validade deve ser uma data válida'
        }
      }
    },
    lote: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    motivo: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Usuário responsável é obrigatório'
        },
        isInt: {
          msg: 'ID do usuário deve ser um número inteiro'
        }
      }
    },
    aprovado_por_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: {
          msg: 'ID do aprovador deve ser um número inteiro'
        }
      }
    },
    data_aprovacao: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: {
          msg: 'Data de aprovação deve ser uma data válida'
        }
      }
    },
    status: {
      type: DataTypes.ENUM('pendente', 'aprovado', 'rejeitado', 'executado'),
      allowNull: false,
      defaultValue: 'executado',
      validate: {
        isIn: {
          args: [['pendente', 'aprovado', 'rejeitado', 'executado']],
          msg: 'Status inválido'
        }
      }
    }
  }, {
    tableName: 'movimentacoes_estoque',
    hooks: {
      beforeCreate: async (movimentacao) => {
        // Gerar número da movimentação automaticamente
        if (!movimentacao.numero_movimentacao) {
          const ano = new Date().getFullYear();
          const count = await MovimentacaoEstoque.count({
            where: {
              createdAt: {
                [sequelize.Op.gte]: new Date(ano, 0, 1),
                [sequelize.Op.lt]: new Date(ano + 1, 0, 1)
              }
            }
          });
          movimentacao.numero_movimentacao = `MOV${ano}${String(count + 1).padStart(6, '0')}`;
        }
        
        // Calcular valor total se não fornecido
        if (!movimentacao.valor_total && movimentacao.preco_unitario && movimentacao.quantidade) {
          movimentacao.valor_total = parseFloat(movimentacao.preco_unitario) * parseFloat(movimentacao.quantidade);
        }
        
        // Definir operação baseada no tipo de movimentação
        if (!movimentacao.operacao) {
          const tiposAdicao = ['entrada', 'devolucao'];
          const tiposSubtracao = ['saida', 'transferencia', 'ajuste', 'perda'];
          
          if (tiposAdicao.includes(movimentacao.tipo_movimentacao)) {
            movimentacao.operacao = 'soma';
          } else if (tiposSubtracao.includes(movimentacao.tipo_movimentacao)) {
            movimentacao.operacao = 'subtracao';
          }
        }
      },
      
      beforeUpdate: (movimentacao) => {
        // Recalcular valor total se preço ou quantidade mudaram
        if ((movimentacao.changed('preco_unitario') || movimentacao.changed('quantidade')) && 
            movimentacao.preco_unitario && movimentacao.quantidade) {
          movimentacao.valor_total = parseFloat(movimentacao.preco_unitario) * parseFloat(movimentacao.quantidade);
        }
      },
      
      afterCreate: async (movimentacao) => {
        // Atualizar estoque do item após criar movimentação
        await movimentacao.atualizarEstoqueItem();
      }
    }
  });

  // Definir associações
  MovimentacaoEstoque.associate = (models) => {
    // Pertence a um item de estoque
    MovimentacaoEstoque.belongsTo(models.ItemEstoque, {
      foreignKey: 'item_estoque_id',
      as: 'item_estoque',
      onDelete: 'RESTRICT'
    });

    // Pertence a um fornecedor (para entradas)
    MovimentacaoEstoque.belongsTo(models.Fornecedor, {
      foreignKey: 'fornecedor_id',
      as: 'fornecedor',
      onDelete: 'SET NULL'
    });

    // Pertence a uma ordem de serviço (para saídas)
    MovimentacaoEstoque.belongsTo(models.OrdemServico, {
      foreignKey: 'ordem_servico_id',
      as: 'ordem_servico',
      onDelete: 'SET NULL'
    });

    // Pertence a um plano preventivo (para saídas)
    MovimentacaoEstoque.belongsTo(models.PlanoPreventivo, {
      foreignKey: 'plano_preventivo_id',
      as: 'plano_preventivo',
      onDelete: 'SET NULL'
    });

    // Pertence a setores (origem e destino)
    MovimentacaoEstoque.belongsTo(models.Setor, {
      foreignKey: 'setor_origem_id',
      as: 'setor_origem',
      onDelete: 'SET NULL'
    });

    MovimentacaoEstoque.belongsTo(models.Setor, {
      foreignKey: 'setor_destino_id',
      as: 'setor_destino',
      onDelete: 'SET NULL'
    });

    // Pertence a usuários
    MovimentacaoEstoque.belongsTo(models.User, {
      foreignKey: 'usuario_id',
      as: 'usuario',
      onDelete: 'RESTRICT'
    });

    MovimentacaoEstoque.belongsTo(models.User, {
      foreignKey: 'aprovado_por_id',
      as: 'aprovado_por',
      onDelete: 'SET NULL'
    });
  };

  // Métodos da instância
  MovimentacaoEstoque.prototype.atualizarEstoqueItem = async function() {
    const item = await this.getItem_estoque();
    if (!item) return;

    let novaQuantidade;
    if (this.operacao === 'soma') {
      novaQuantidade = parseFloat(item.quantidade_atual) + parseFloat(this.quantidade);
    } else {
      novaQuantidade = parseFloat(item.quantidade_atual) - parseFloat(this.quantidade);
    }

    // Garantir que a quantidade não seja negativa
    novaQuantidade = Math.max(0, novaQuantidade);

    // Atualizar preço médio se for uma entrada com preço
    let novoPrecoMedio = item.preco_medio;
    if (this.tipo_movimentacao === 'entrada' && this.preco_unitario) {
      const quantidadeAnterior = parseFloat(item.quantidade_atual);
      const precoAnterior = parseFloat(item.preco_medio || 0);
      const quantidadeEntrada = parseFloat(this.quantidade);
      const precoEntrada = parseFloat(this.preco_unitario);

      if (quantidadeAnterior > 0) {
        // Calcular preço médio ponderado
        const valorAnterior = quantidadeAnterior * precoAnterior;
        const valorEntrada = quantidadeEntrada * precoEntrada;
        const quantidadeTotal = quantidadeAnterior + quantidadeEntrada;
        novoPrecoMedio = (valorAnterior + valorEntrada) / quantidadeTotal;
      } else {
        // Se não havia estoque, usar o preço da entrada
        novoPrecoMedio = precoEntrada;
      }
    }

    // Calcular novo valor total
    const novoValorTotal = novaQuantidade * parseFloat(novoPrecoMedio || 0);

    await item.update({
      quantidade_atual: novaQuantidade,
      preco_medio: novoPrecoMedio,
      valor_total: novoValorTotal
    });
  };

  MovimentacaoEstoque.prototype.isVencida = function() {
    if (!this.data_validade) return false;
    return new Date() > new Date(this.data_validade);
  };

  MovimentacaoEstoque.prototype.diasParaVencimento = function() {
    if (!this.data_validade) return null;
    const hoje = new Date();
    const vencimento = new Date(this.data_validade);
    const diferenca = vencimento - hoje;
    return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
  };

  // Métodos estáticos
  MovimentacaoEstoque.buscarPorNumero = async function(numero) {
    return await this.findOne({
      where: { numero_movimentacao: numero },
      include: [
        { model: sequelize.models.ItemEstoque, as: 'item_estoque' },
        { model: sequelize.models.Fornecedor, as: 'fornecedor' },
        { model: sequelize.models.User, as: 'usuario', attributes: ['id', 'nome'] },
        { model: sequelize.models.User, as: 'aprovado_por', attributes: ['id', 'nome'] }
      ]
    });
  };

  MovimentacaoEstoque.relatorioPorPeriodo = async function(dataInicio, dataFim, filtros = {}) {
    const where = {
      data_movimentacao: {
        [sequelize.Op.between]: [dataInicio, dataFim]
      },
      ...filtros
    };

    return await this.findAll({
      where,
      include: [
        { model: sequelize.models.ItemEstoque, as: 'item_estoque' },
        { model: sequelize.models.Fornecedor, as: 'fornecedor' },
        { model: sequelize.models.User, as: 'usuario', attributes: ['id', 'nome'] }
      ],
      order: [['data_movimentacao', 'DESC']]
    });
  };

  MovimentacaoEstoque.estatisticasPorTipo = async function(dataInicio, dataFim) {
    const movimentacoes = await this.findAll({
      where: {
        data_movimentacao: {
          [sequelize.Op.between]: [dataInicio, dataFim]
        }
      },
      attributes: [
        'tipo_movimentacao',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_movimentacoes'],
        [sequelize.fn('SUM', sequelize.col('quantidade')), 'total_quantidade'],
        [sequelize.fn('SUM', sequelize.col('valor_total')), 'total_valor']
      ],
      group: ['tipo_movimentacao']
    });

    return movimentacoes.map(mov => ({
      tipo: mov.tipo_movimentacao,
      total_movimentacoes: parseInt(mov.dataValues.total_movimentacoes),
      total_quantidade: parseFloat(mov.dataValues.total_quantidade || 0),
      total_valor: parseFloat(mov.dataValues.total_valor || 0)
    }));
  };

  return MovimentacaoEstoque;
};