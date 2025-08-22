'use strict';

/**
 * Migration: Enforce NOT NULL on ativos.setor_id
 * Steps:
 * 1. Garantir que exista um setor padrão (codigo = 'PROD') para backfill
 * 2. Preencher registros de ativos onde setor_id ainda está NULL
 * 3. Remover constraint/FK antiga (provavelmente ON DELETE SET NULL)
 * 4. Alterar coluna para NOT NULL
 * 5. Criar nova constraint com ON DELETE RESTRICT / ON UPDATE CASCADE
 * 6. Garantir índice em setor_id
 *
 * Down faz rollback para permitir NULL e restaura ON DELETE SET NULL.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Garantir setor padrão 'PROD'
      const [setorRows] = await queryInterface.sequelize.query(
        "SELECT id FROM setores WHERE codigo = 'PROD' LIMIT 1",
        { transaction }
      );
      let setorId;
      if (setorRows.length === 0) {
        const now = new Date();
        await queryInterface.bulkInsert('setores', [{
          codigo: 'PROD',
            nome: 'Produção',
            descricao: 'Setor padrão criado automaticamente para backfill',
            localizacao: 'N/D',
            ativo: true,
            created_at: now,
            updated_at: now
        }], { transaction });
        const [newSetorRows] = await queryInterface.sequelize.query(
          "SELECT id FROM setores WHERE codigo = 'PROD' LIMIT 1",
          { transaction }
        );
        setorId = newSetorRows[0].id;
      } else {
        setorId = setorRows[0].id;
      }

      // 2. Backfill ativos sem setor
      await queryInterface.sequelize.query(
        `UPDATE ativos SET setor_id = ${setorId} WHERE setor_id IS NULL`,
        { transaction }
      );

      // 3. Localizar e remover constraint existente sobre setor_id
      const [fkRows] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
         WHERE TABLE_SCHEMA = DATABASE() 
           AND TABLE_NAME = 'ativos' 
           AND COLUMN_NAME = 'setor_id' 
           AND REFERENCED_TABLE_NAME = 'setores'`,
        { transaction }
      );
      for (const row of fkRows) {
        await queryInterface.removeConstraint('ativos', row.CONSTRAINT_NAME, { transaction }).catch(() => {});
      }

      // 4. Alterar coluna para NOT NULL
      await queryInterface.changeColumn('ativos', 'setor_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'setores', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Setor ao qual o ativo pertence (constraint reforçada)'
      }, { transaction });

      // 5. Criar nova constraint explícita (nomeado para clareza)
      await queryInterface.addConstraint('ativos', {
        fields: ['setor_id'],
        type: 'foreign key',
        name: 'fk_ativos_setor_id_restrict',
        references: { table: 'setores', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        transaction
      }).catch(() => {}); // Ignorar se já criada por changeColumn

      // 6. Garantir índice
      const [idxRows] = await queryInterface.sequelize.query(
        "SHOW INDEX FROM ativos WHERE Key_name = 'idx_ativos_setor_id'",
        { transaction }
      );
      if (idxRows.length === 0) {
        await queryInterface.addIndex('ativos', ['setor_id'], {
          name: 'idx_ativos_setor_id',
          transaction
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Remover nova constraint
      await queryInterface.removeConstraint('ativos', 'fk_ativos_setor_id_restrict', { transaction }).catch(() => {});

      // Alterar coluna para permitir NULL novamente
      await queryInterface.changeColumn('ativos', 'setor_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'setores', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Setor ao qual o ativo pertence (reversão)'
      }, { transaction });

      // Recriar constraint com SET NULL
      await queryInterface.addConstraint('ativos', {
        fields: ['setor_id'],
        type: 'foreign key',
        name: 'fk_ativos_setor_id_setnull',
        references: { table: 'setores', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        transaction
      }).catch(() => {});

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
