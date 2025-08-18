'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Setor extends Model {
    static associate(models) {
      // Associação com User (responsável)
      Setor.belongsTo(models.User, {
        foreignKey: 'responsavel_id',
        as: 'responsavel',
        constraints: false
      });

      // Associação com Ativos
      Setor.hasMany(models.Ativo, {
        foreignKey: 'setor_id',
        as: 'ativos'
      });

      // Associação com OrdemServico (futuro)
      if (models.OrdemServico) {
        Setor.hasMany(models.OrdemServico, {
          foreignKey: 'setor_id',
          as: 'ordens_servico'
        });
      }
    }

    // Métodos de instância
    getStatusAtivos() {
      if (!this.ativos) return null;
      
      const stats = {
        total: this.ativos.length,
        operacional: 0,
        manutencao: 0,
        parado: 0,
        criticos: 0
      };

      this.ativos.forEach(ativo => {
        if (ativo.estado === 'operacional') stats.operacional++;
        if (ativo.estado === 'manutencao') stats.manutencao++;
        if (ativo.estado === 'parado') stats.parado++;
        if (ativo.criticidade === 'critica' || ativo.criticidade === 'alta') {
          stats.criticos++;
        }
      });

      return stats;
    }

    // Método para verificar se o setor pode ser inativado
    podeSerInativado() {
      if (!this.ativos) return true;
      
      // Não pode inativar se tem ativos operacionais
      const ativosOperacionais = this.ativos.filter(a => a.estado === 'operacional');
      return ativosOperacionais.length === 0;
    }

    // Método estático para buscar setores ativos
    static async buscarAtivos(options = {}) {
      return await this.findAll({
        where: { ativo: true },
        include: [{
          model: sequelize.models.User,
          as: 'responsavel',
          attributes: ['id', 'nome', 'email']
        }],
        order: [['nome', 'ASC']],
        ...options
      });
    }

    // Método estático para buscar com estatísticas
    static async buscarComEstatisticas(options = {}) {
      return await this.findAll({
        include: [
          {
            model: sequelize.models.User,
            as: 'responsavel',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: sequelize.models.Ativo,
            as: 'ativos',
            attributes: ['id', 'estado', 'criticidade'],
            required: false
          }
        ],
        order: [['nome', 'ASC']],
        ...options
      });
    }
  }

  Setor.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    codigo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: {
        name: 'setores_codigo_unique',
        msg: 'Este código já está sendo utilizado por outro setor'
      },
      validate: {
        notEmpty: {
          msg: 'O código do setor é obrigatório'
        },
        len: {
          args: [2, 20],
          msg: 'O código deve ter entre 2 e 20 caracteres'
        },
        isUppercase: {
          msg: 'O código deve estar em maiúsculas'
        },
        is: {
          args: /^[A-Z0-9_]+$/,
          msg: 'O código deve conter apenas letras maiúsculas, números e underscores'
        }
      },
      set(value) {
        this.setDataValue('codigo', value ? value.toUpperCase() : value);
      }
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'O nome do setor é obrigatório'
        },
        len: {
          args: [2, 100],
          msg: 'O nome deve ter entre 2 e 100 caracteres'
        }
      }
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'A descrição não pode exceder 1000 caracteres'
        }
      }
    },
    localizacao: {
      type: DataTypes.STRING(200),
      allowNull: true,
      validate: {
        len: {
          args: [0, 200],
          msg: 'A localização não pode exceder 200 caracteres'
        }
      }
    },
    responsavel_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      validate: {
        isInt: {
          msg: 'ID do responsável deve ser um número inteiro'
        }
      }
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      validate: {
        isBoolean: {
          msg: 'O status ativo deve ser verdadeiro ou falso'
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Setor',
    tableName: 'setores',
    timestamps: true,
    underscored: true,
    paranoid: false, // Não usar soft delete para setores
    
    // Hooks
    hooks: {
      beforeValidate: (setor) => {
        // Normalizar código
        if (setor.codigo) {
          setor.codigo = setor.codigo.trim().toUpperCase();
        }
        
        // Normalizar nome
        if (setor.nome) {
          setor.nome = setor.nome.trim();
        }
      },
      
      beforeUpdate: async (setor) => {
        // Se está inativando o setor, verificar se pode
        if (setor.changed('ativo') && !setor.ativo) {
          const setorComAtivos = await Setor.findByPk(setor.id, {
            include: [{
              model: sequelize.models.Ativo,
              as: 'ativos',
              where: { estado: 'operacional' },
              required: false
            }]
          });
          
          if (setorComAtivos && setorComAtivos.ativos && setorComAtivos.ativos.length > 0) {
            throw new Error('Não é possível inativar um setor que possui ativos operacionais');
          }
        }
      }
    },

    // Índices
    indexes: [
      {
        unique: true,
        fields: ['codigo']
      },
      {
        fields: ['ativo']
      },
      {
        fields: ['responsavel_id']
      },
      {
        fields: ['nome']
      }
    ]
  });

  return Setor;
};