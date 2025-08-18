const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CategoriaEstoque = sequelize.define('CategoriaEstoque', {
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
          msg: 'Código da categoria é obrigatório'
        },
        len: {
          args: [1, 20],
          msg: 'Código deve ter entre 1 e 20 caracteres'
        }
      }
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Nome da categoria é obrigatório'
        },
        len: {
          args: [1, 100],
          msg: 'Nome deve ter entre 1 e 100 caracteres'
        }
      }
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cor: {
      type: DataTypes.STRING(7),
      allowNull: true,
      defaultValue: '#6c757d',
      validate: {
        is: {
          args: /^#[0-9A-F]{6}$/i,
          msg: 'Cor deve estar no formato hexadecimal (#RRGGBB)'
        }
      }
    },
    icone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'fas fa-box'
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'categorias_estoque',
    hooks: {
      beforeCreate: async (categoria) => {
        // Gerar código automaticamente se não fornecido
        if (!categoria.codigo) {
          const count = await CategoriaEstoque.count();
          categoria.codigo = `CAT${String(count + 1).padStart(3, '0')}`;
        }
        // Converter código para maiúsculo
        categoria.codigo = categoria.codigo.toUpperCase();
      },
      beforeUpdate: (categoria) => {
        if (categoria.codigo) {
          categoria.codigo = categoria.codigo.toUpperCase();
        }
      }
    }
  });

  // Definir associações
  CategoriaEstoque.associate = (models) => {
    // Uma categoria pode ter muitos itens de estoque
    CategoriaEstoque.hasMany(models.ItemEstoque, {
      foreignKey: 'categoria_id',
      as: 'itens',
      onDelete: 'SET NULL'
    });
  };

  // Métodos estáticos
  CategoriaEstoque.buscarPorCodigo = async function(codigo) {
    return await this.findOne({
      where: { 
        codigo: codigo.toUpperCase(),
        ativo: true 
      },
      include: [{
        model: sequelize.models.ItemEstoque,
        as: 'itens',
        where: { ativo: true },
        required: false
      }]
    });
  };

  CategoriaEstoque.listarAtivas = async function() {
    return await this.findAll({
      where: { ativo: true },
      order: [['nome', 'ASC']],
      include: [{
        model: sequelize.models.ItemEstoque,
        as: 'itens',
        attributes: ['id'],
        where: { ativo: true },
        required: false
      }]
    });
  };

  CategoriaEstoque.estatisticas = async function() {
    const total = await this.count({ where: { ativo: true } });
    const comItens = await this.count({
      where: { ativo: true },
      include: [{
        model: sequelize.models.ItemEstoque,
        as: 'itens',
        where: { ativo: true },
        required: true
      }]
    });

    return {
      total_categorias: total,
      categorias_com_itens: comItens,
      categorias_sem_itens: total - comItens
    };
  };

  return CategoriaEstoque;
};