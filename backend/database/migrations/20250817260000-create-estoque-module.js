'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🏪 Criando estrutura do módulo de estoque...');
      
      // 1. Criar tabela de categorias de estoque
      await queryInterface.createTable('categorias_estoque', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        codigo: {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true
        },
        nome: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        descricao: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        cor: {
          type: Sequelize.STRING(7),
          allowNull: true,
          defaultValue: '#6c757d'
        },
        icone: {
          type: Sequelize.STRING(50),
          allowNull: true,
          defaultValue: 'fas fa-box'
        },
        ativo: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // 2. Criar tabela de fornecedores
      await queryInterface.createTable('fornecedores', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        codigo: {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true
        },
        razao_social: {
          type: Sequelize.STRING(200),
          allowNull: false
        },
        nome_fantasia: {
          type: Sequelize.STRING(200),
          allowNull: true
        },
        cnpj: {
          type: Sequelize.STRING(18),
          allowNull: true,
          unique: true
        },
        inscricao_estadual: {
          type: Sequelize.STRING(20),
          allowNull: true
        },
        telefone: {
          type: Sequelize.STRING(20),
          allowNull: true
        },
        email: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        site: {
          type: Sequelize.STRING(200),
          allowNull: true
        },
        endereco: {
          type: Sequelize.STRING(200),
          allowNull: true
        },
        numero: {
          type: Sequelize.STRING(10),
          allowNull: true
        },
        complemento: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        bairro: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        cidade: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        estado: {
          type: Sequelize.STRING(2),
          allowNull: true
        },
        cep: {
          type: Sequelize.STRING(10),
          allowNull: true
        },
        contato_principal: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        telefone_contato: {
          type: Sequelize.STRING(20),
          allowNull: true
        },
        email_contato: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        prazo_entrega_padrao: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Prazo padrão de entrega em dias'
        },
        condicoes_pagamento: {
          type: Sequelize.STRING(200),
          allowNull: true
        },
        observacoes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        ativo: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // 3. Criar tabela de itens de estoque
      await queryInterface.createTable('itens_estoque', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        codigo: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true
        },
        codigo_barras: {
          type: Sequelize.STRING(50),
          allowNull: true,
          unique: true
        },
        nome: {
          type: Sequelize.STRING(200),
          allowNull: false
        },
        descricao: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        categoria_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'categorias_estoque',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        fornecedor_principal_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'fornecedores',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        unidade_medida: {
          type: Sequelize.ENUM('UN', 'PC', 'KG', 'G', 'L', 'ML', 'M', 'CM', 'M2', 'M3', 'CX', 'PCT', 'KIT'),
          allowNull: false,
          defaultValue: 'UN'
        },
        tipo_item: {
          type: Sequelize.ENUM('material', 'ferramenta', 'epi', 'consumivel', 'peca_reposicao', 'outros'),
          allowNull: false,
          defaultValue: 'material'
        },
        localizacao: {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'Localização física no estoque (prateleira, gaveta, etc.)'
        },
        quantidade_atual: {
          type: Sequelize.DECIMAL(10, 3),
          allowNull: false,
          defaultValue: 0.000
        },
        quantidade_minima: {
          type: Sequelize.DECIMAL(10, 3),
          allowNull: false,
          defaultValue: 0.000
        },
        quantidade_maxima: {
          type: Sequelize.DECIMAL(10, 3),
          allowNull: true
        },
        ponto_reposicao: {
          type: Sequelize.DECIMAL(10, 3),
          allowNull: true,
          comment: 'Quantidade que dispara alerta de reposição'
        },
        preco_unitario: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: true,
          defaultValue: 0.00
        },
        preco_medio: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: true,
          defaultValue: 0.00,
          comment: 'Preço médio calculado automaticamente'
        },
        valor_total: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: true,
          defaultValue: 0.00,
          comment: 'Valor total do estoque (quantidade * preço médio)'
        },
        ncm: {
          type: Sequelize.STRING(10),
          allowNull: true,
          comment: 'Nomenclatura Comum do Mercosul'
        },
        aplicacao: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Onde o item é utilizado'
        },
        especificacoes_tecnicas: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        numero_parte: {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'Part Number do fabricante'
        },
        marca: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        modelo: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        peso: {
          type: Sequelize.DECIMAL(10, 3),
          allowNull: true
        },
        dimensoes: {
          type: Sequelize.STRING(200),
          allowNull: true
        },
        validade_controle: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Se o item tem controle de validade'
        },
        dias_validade: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Dias de validade padrão para itens com controle'
        },
        temperatura_armazenamento: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        condicoes_armazenamento: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        criticidade: {
          type: Sequelize.ENUM('baixa', 'media', 'alta', 'critica'),
          allowNull: false,
          defaultValue: 'media'
        },
        status_item: {
          type: Sequelize.ENUM('ativo', 'inativo', 'descontinuado', 'em_analise'),
          allowNull: false,
          defaultValue: 'ativo'
        },
        foto_principal: {
          type: Sequelize.STRING(500),
          allowNull: true
        },
        observacoes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        usuario_cadastro_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        ativo: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // 4. Criar tabela de movimentações de estoque
      await queryInterface.createTable('movimentacoes_estoque', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        numero_movimentacao: {
          type: Sequelize.STRING(20),
          allowNull: false,
          unique: true
        },
        item_estoque_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'itens_estoque',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        tipo_movimentacao: {
          type: Sequelize.ENUM('entrada', 'saida', 'transferencia', 'ajuste', 'perda', 'devolucao'),
          allowNull: false
        },
        operacao: {
          type: Sequelize.ENUM('soma', 'subtracao'),
          allowNull: false,
          comment: 'Como a movimentação afeta o estoque'
        },
        quantidade: {
          type: Sequelize.DECIMAL(10, 3),
          allowNull: false
        },
        quantidade_anterior: {
          type: Sequelize.DECIMAL(10, 3),
          allowNull: false
        },
        quantidade_posterior: {
          type: Sequelize.DECIMAL(10, 3),
          allowNull: false
        },
        preco_unitario: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: true
        },
        valor_total: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: true
        },
        documento_origem: {
          type: Sequelize.STRING(100),
          allowNull: true,
          comment: 'Nota fiscal, ordem de compra, etc.'
        },
        fornecedor_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'fornecedores',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        ordem_servico_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'ordens_servico',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        plano_preventivo_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'planos_preventivos',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        setor_origem_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'setores',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        setor_destino_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'setores',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        data_movimentacao: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        data_validade: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Para itens com controle de validade'
        },
        lote: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        observacoes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        motivo: {
          type: Sequelize.STRING(200),
          allowNull: true,
          comment: 'Motivo da movimentação'
        },
        usuario_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        aprovado_por_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        data_aprovacao: {
          type: Sequelize.DATE,
          allowNull: true
        },
        status: {
          type: Sequelize.ENUM('pendente', 'aprovado', 'rejeitado', 'executado'),
          allowNull: false,
          defaultValue: 'executado'
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
      }, { transaction });
      
      // 5. Criar índices para otimização
      await queryInterface.addIndex('categorias_estoque', ['codigo'], { 
        name: 'idx_categorias_estoque_codigo',
        transaction 
      });
      
      await queryInterface.addIndex('fornecedores', ['codigo'], { 
        name: 'idx_fornecedores_codigo',
        transaction 
      });
      await queryInterface.addIndex('fornecedores', ['cnpj'], { 
        name: 'idx_fornecedores_cnpj',
        transaction 
      });
      
      await queryInterface.addIndex('itens_estoque', ['codigo'], { 
        name: 'idx_itens_estoque_codigo',
        transaction 
      });
      await queryInterface.addIndex('itens_estoque', ['codigo_barras'], { 
        name: 'idx_itens_estoque_codigo_barras',
        transaction 
      });
      await queryInterface.addIndex('itens_estoque', ['categoria_id'], { 
        name: 'idx_itens_estoque_categoria',
        transaction 
      });
      await queryInterface.addIndex('itens_estoque', ['tipo_item'], { 
        name: 'idx_itens_estoque_tipo',
        transaction 
      });
      await queryInterface.addIndex('itens_estoque', ['status_item'], { 
        name: 'idx_itens_estoque_status',
        transaction 
      });
      
      await queryInterface.addIndex('movimentacoes_estoque', ['numero_movimentacao'], { 
        name: 'idx_movimentacoes_numero',
        transaction 
      });
      await queryInterface.addIndex('movimentacoes_estoque', ['item_estoque_id'], { 
        name: 'idx_movimentacoes_item',
        transaction 
      });
      await queryInterface.addIndex('movimentacoes_estoque', ['tipo_movimentacao'], { 
        name: 'idx_movimentacoes_tipo',
        transaction 
      });
      await queryInterface.addIndex('movimentacoes_estoque', ['data_movimentacao'], { 
        name: 'idx_movimentacoes_data',
        transaction 
      });
      await queryInterface.addIndex('movimentacoes_estoque', ['usuario_id'], { 
        name: 'idx_movimentacoes_usuario',
        transaction 
      });
      
      await transaction.commit();
      
      console.log('✅ Estrutura do módulo de estoque criada com sucesso!');
      console.log('📊 Tabelas criadas:');
      console.log('   • categorias_estoque - Categorização de itens');
      console.log('   • fornecedores - Cadastro de fornecedores');
      console.log('   • itens_estoque - Itens em estoque');
      console.log('   • movimentacoes_estoque - Histórico de movimentações');
      console.log('🔍 Índices criados para otimização de consultas');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Erro ao criar estrutura do estoque:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remover tabelas na ordem inversa (respeitando dependências)
      await queryInterface.dropTable('movimentacoes_estoque', { transaction });
      await queryInterface.dropTable('itens_estoque', { transaction });
      await queryInterface.dropTable('fornecedores', { transaction });
      await queryInterface.dropTable('categorias_estoque', { transaction });
      
      await transaction.commit();
      console.log('🧹 Estrutura do módulo de estoque removida');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Erro ao remover estrutura do estoque:', error);
      throw error;
    }
  }
};