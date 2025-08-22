'use strict';

/**
 * Migration: Enforce FKs & NOT NULL em solicitacoes
 * - Garante que category_id, subcategory_id, ativo_id, setor_id existam e estejam consistentes
 * - Backfill a partir de campos legacy (categoria/subcategoria) caso IDs estejam ausentes
 * - Aplica NOT NULL (exceto se estratégia exigir opcionalidade temporária)
 * - Cria índices auxiliares
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Verificar existência de colunas (caso ambiente antigo)
      const [columns] = await queryInterface.sequelize.query("SHOW COLUMNS FROM solicitacoes", { transaction });
      const colMap = Object.fromEntries(columns.map(c => [c.Field, c]));

      // Helper para adicionar coluna se não existir
      async function ensureColumn(name, definition) {
        if (!colMap[name]) {
          await queryInterface.addColumn('solicitacoes', name, definition, { transaction });
        }
      }

      await ensureColumn('category_id', { type: Sequelize.INTEGER, allowNull: true });
      await ensureColumn('subcategory_id', { type: Sequelize.INTEGER, allowNull: true });
      await ensureColumn('ativo_id', { type: Sequelize.INTEGER, allowNull: true });
      await ensureColumn('setor_id', { type: Sequelize.INTEGER, allowNull: true });

      // 2. Backfill category_id/subcategory_id a partir dos campos legacy se possível
      // Assumindo que 'categoria' corresponde a categories.nome e 'subcategoria' a subcategories.nome
      // (Se já houver IDs corretos, nada muda.)
      await queryInterface.sequelize.query(`
        UPDATE solicitacoes s
        LEFT JOIN categories c ON c.nome = s.categoria
        SET s.category_id = c.id
        WHERE s.category_id IS NULL AND s.categoria IS NOT NULL
      `, { transaction });
      await queryInterface.sequelize.query(`
        UPDATE solicitacoes s
        LEFT JOIN subcategories sc ON sc.nome = s.subcategoria AND sc.category_id = s.category_id
        SET s.subcategory_id = sc.id
        WHERE s.subcategory_id IS NULL AND s.subcategoria IS NOT NULL
      `, { transaction });

      // 3. Validar se ainda restam registros sem category_id ou subcategory_id
      const [[{ missingCategories }]] = await queryInterface.sequelize.query(
        'SELECT COUNT(*) AS missingCategories FROM solicitacoes WHERE category_id IS NULL', { transaction }
      );
      const [[{ missingSubcategories }]] = await queryInterface.sequelize.query(
        'SELECT COUNT(*) AS missingSubcategories FROM solicitacoes WHERE subcategory_id IS NULL', { transaction }
      );

      if (parseInt(missingCategories, 10) > 0) {
        throw new Error(`Backfill incompleto: ${missingCategories} solicitações sem category_id`);
      }
      if (parseInt(missingSubcategories, 10) > 0) {
        throw new Error(`Backfill incompleto: ${missingSubcategories} solicitações sem subcategory_id`);
      }

      // 4. Ativo e Setor: garantir integridade (solicitações devem referenciar ativo & setor válidos)
      // Se houver solicitações sem ativo ou setor, falhar para correção manual (não auto-assume defaults)
      const [[{ missingAtivo }]] = await queryInterface.sequelize.query(
        'SELECT COUNT(*) AS missingAtivo FROM solicitacoes WHERE ativo_id IS NULL', { transaction }
      );
      const [[{ missingSetor }]] = await queryInterface.sequelize.query(
        'SELECT COUNT(*) AS missingSetor FROM solicitacoes WHERE setor_id IS NULL', { transaction }
      );
      if (parseInt(missingAtivo, 10) > 0) {
        throw new Error(`Backfill necessário: ${missingAtivo} solicitações sem ativo_id`);
      }
      if (parseInt(missingSetor, 10) > 0) {
        throw new Error(`Backfill necessário: ${missingSetor} solicitações sem setor_id`);
      }

      // 5. Remover FKs pré-existentes inconsistentes (nome genérico)
      async function dropFkIfExists(column) {
        const [fkRows] = await queryInterface.sequelize.query(`
          SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'solicitacoes'
            AND COLUMN_NAME = '${column}'
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `, { transaction });
        for (const row of fkRows) {
          await queryInterface.removeConstraint('solicitacoes', row.CONSTRAINT_NAME, { transaction }).catch(() => {});
        }
      }
      await dropFkIfExists('category_id');
      await dropFkIfExists('subcategory_id');
      await dropFkIfExists('ativo_id');
      await dropFkIfExists('setor_id');

      // 6. Alterar colunas para NOT NULL e criar FKs novas
      async function enforce(column, refTable, refField = 'id', onDelete = 'RESTRICT') {
        await queryInterface.changeColumn('solicitacoes', column, {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: refTable, key: refField },
          onUpdate: 'CASCADE',
          onDelete,
          comment: `FK reforçada para ${refTable}.${refField}`
        }, { transaction });
        await queryInterface.addConstraint('solicitacoes', {
          fields: [column],
            type: 'foreign key',
            name: `fk_solicitacoes_${column}`,
            references: { table: refTable, field: refField },
            onUpdate: 'CASCADE',
            onDelete,
            transaction
        }).catch(() => {});
      }

      await enforce('category_id', 'categories', 'id', 'RESTRICT');
      await enforce('subcategory_id', 'subcategories', 'id', 'RESTRICT');
      await enforce('ativo_id', 'ativos', 'id', 'RESTRICT');
      await enforce('setor_id', 'setores', 'id', 'RESTRICT');

      // 7. Criar índices se ausentes
      async function ensureIndex(name, fields) {
        const [idx] = await queryInterface.sequelize.query(
          `SHOW INDEX FROM solicitacoes WHERE Key_name = '${name}'`,
          { transaction }
        );
        if (idx.length === 0) {
          await queryInterface.addIndex('solicitacoes', fields, { name, transaction });
        }
      }
      await ensureIndex('idx_solicitacoes_category_id', ['category_id']);
      await ensureIndex('idx_solicitacoes_subcategory_id', ['subcategory_id']);
      await ensureIndex('idx_solicitacoes_ativo_id', ['ativo_id']);
      await ensureIndex('idx_solicitacoes_setor_id', ['setor_id']);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Reverter para permitir NULL novamente (mantendo colunas)
      for (const column of ['setor_id','ativo_id','subcategory_id','category_id']) {
        await queryInterface.removeConstraint('solicitacoes', `fk_solicitacoes_${column}`, { transaction }).catch(() => {});
      }
      await queryInterface.changeColumn('solicitacoes', 'category_id', { type: Sequelize.INTEGER, allowNull: true }, { transaction });
      await queryInterface.changeColumn('solicitacoes', 'subcategory_id', { type: Sequelize.INTEGER, allowNull: true }, { transaction });
      await queryInterface.changeColumn('solicitacoes', 'ativo_id', { type: Sequelize.INTEGER, allowNull: true }, { transaction });
      await queryInterface.changeColumn('solicitacoes', 'setor_id', { type: Sequelize.INTEGER, allowNull: true }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
