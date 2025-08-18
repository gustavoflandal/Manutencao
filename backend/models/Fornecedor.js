const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Fornecedor = sequelize.define('Fornecedor', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    codigo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Código do fornecedor é obrigatório'
        },
        len: {
          args: [1, 20],
          msg: 'Código deve ter entre 1 e 20 caracteres'
        }
      }
    },
    razao_social: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Razão social é obrigatória'
        },
        len: {
          args: [1, 200],
          msg: 'Razão social deve ter entre 1 e 200 caracteres'
        }
      }
    },
    nome_fantasia: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    cnpj: {
      type: DataTypes.STRING(18),
      allowNull: true,
      unique: true,
      validate: {
        is: {
          args: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/,
          msg: 'CNPJ deve estar no formato 00.000.000/0000-00 ou 14 dígitos'
        }
      }
    },
    inscricao_estadual: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    telefone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: {
          msg: 'Email deve ter um formato válido'
        }
      }
    },
    site: {
      type: DataTypes.STRING(200),
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Site deve ter um formato de URL válido'
        }
      }
    },
    endereco: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    numero: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    complemento: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    bairro: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    cidade: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    estado: {
      type: DataTypes.STRING(2),
      allowNull: true,
      validate: {
        len: {
          args: [2, 2],
          msg: 'Estado deve ter exatamente 2 caracteres'
        }
      }
    },
    cep: {
      type: DataTypes.STRING(10),
      allowNull: true,
      validate: {
        is: {
          args: /^\d{5}-?\d{3}$/,
          msg: 'CEP deve estar no formato 00000-000 ou 00000000'
        }
      }
    },
    contato_principal: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    telefone_contato: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email_contato: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: {
          msg: 'Email de contato deve ter um formato válido'
        }
      }
    },
    prazo_entrega_padrao: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Prazo de entrega não pode ser negativo'
        }
      }
    },
    condicoes_pagamento: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'fornecedores',
    hooks: {
      beforeCreate: async (fornecedor) => {
        // Gerar código automaticamente se não fornecido
        if (!fornecedor.codigo) {
          const count = await Fornecedor.count();
          fornecedor.codigo = `FOR${String(count + 1).padStart(4, '0')}`;
        }
        // Converter código para maiúsculo
        fornecedor.codigo = fornecedor.codigo.toUpperCase();
        
        // Formatar CNPJ se fornecido
        if (fornecedor.cnpj && fornecedor.cnpj.length === 14) {
          fornecedor.cnpj = fornecedor.cnpj.replace(
            /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
            '$1.$2.$3/$4-$5'
          );
        }
        
        // Formatar CEP se fornecido
        if (fornecedor.cep && fornecedor.cep.length === 8) {
          fornecedor.cep = fornecedor.cep.replace(/(\d{5})(\d{3})/, '$1-$2');
        }
      },
      beforeUpdate: (fornecedor) => {
        if (fornecedor.codigo) {
          fornecedor.codigo = fornecedor.codigo.toUpperCase();
        }
        
        // Formatar CNPJ se mudou
        if (fornecedor.changed('cnpj') && fornecedor.cnpj && fornecedor.cnpj.length === 14) {
          fornecedor.cnpj = fornecedor.cnpj.replace(
            /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
            '$1.$2.$3/$4-$5'
          );
        }
        
        // Formatar CEP se mudou
        if (fornecedor.changed('cep') && fornecedor.cep && fornecedor.cep.length === 8) {
          fornecedor.cep = fornecedor.cep.replace(/(\d{5})(\d{3})/, '$1-$2');
        }
      }
    }
  });

  // Definir associações
  Fornecedor.associate = (models) => {
    // Um fornecedor pode fornecer muitos itens
    Fornecedor.hasMany(models.ItemEstoque, {
      foreignKey: 'fornecedor_principal_id',
      as: 'itens_fornecidos',
      onDelete: 'SET NULL'
    });

    // Um fornecedor pode ter muitas movimentações de entrada
    Fornecedor.hasMany(models.MovimentacaoEstoque, {
      foreignKey: 'fornecedor_id',
      as: 'movimentacoes',
      onDelete: 'SET NULL'
    });
  };

  // Métodos da instância
  Fornecedor.prototype.getEnderecoCompleto = function() {
    const partes = [
      this.endereco,
      this.numero,
      this.complemento,
      this.bairro,
      this.cidade,
      this.estado,
      this.cep
    ].filter(Boolean);
    
    return partes.join(', ');
  };

  Fornecedor.prototype.getContatoCompleto = function() {
    const contatos = [];
    if (this.contato_principal) contatos.push(`Contato: ${this.contato_principal}`);
    if (this.telefone_contato) contatos.push(`Tel: ${this.telefone_contato}`);
    if (this.email_contato) contatos.push(`Email: ${this.email_contato}`);
    return contatos.join(' | ');
  };

  // Métodos estáticos
  Fornecedor.buscarPorCodigo = async function(codigo) {
    return await this.findOne({
      where: { 
        codigo: codigo.toUpperCase(),
        ativo: true 
      },
      include: [{
        model: sequelize.models.ItemEstoque,
        as: 'itens_fornecidos',
        where: { ativo: true },
        required: false
      }]
    });
  };

  Fornecedor.buscarPorCnpj = async function(cnpj) {
    return await this.findOne({
      where: { 
        cnpj: cnpj,
        ativo: true 
      }
    });
  };

  Fornecedor.listarAtivos = async function() {
    return await this.findAll({
      where: { ativo: true },
      order: [['razao_social', 'ASC']],
      include: [{
        model: sequelize.models.ItemEstoque,
        as: 'itens_fornecidos',
        attributes: ['id'],
        where: { ativo: true },
        required: false
      }]
    });
  };

  Fornecedor.estatisticas = async function() {
    const total = await this.count({ where: { ativo: true } });
    const comItens = await this.count({
      where: { ativo: true },
      include: [{
        model: sequelize.models.ItemEstoque,
        as: 'itens_fornecidos',
        where: { ativo: true },
        required: true
      }]
    });

    return {
      total_fornecedores: total,
      fornecedores_com_itens: comItens,
      fornecedores_sem_itens: total - comItens
    };
  };

  return Fornecedor;
};