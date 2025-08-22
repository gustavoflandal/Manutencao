require('dotenv').config();
const { sequelize, Ativo, Setor } = require('../models');

(async () => {
  console.log('🔍 Iniciando backfill de setor_id nulos em ativos...');
  try {
    await sequelize.authenticate();

    const ativosSemSetor = await Ativo.findAll({ where: { setor_id: null } });
    console.log(`Encontrados ${ativosSemSetor.length} ativos sem setor.`);

    if (ativosSemSetor.length === 0) {
      console.log('✅ Nenhuma ação necessária.');
      process.exit(0);
    }

    // Localizar ou criar setor padrão
    const [setorPadrao] = await Setor.findOrCreate({
      where: { codigo: 'DEFAULT' },
      defaults: {
        nome: 'Setor Padrão',
        descricao: 'Setor criado automaticamente para backfill de ativos sem setor',
        ativo: true
      }
    });

    console.log(`Usando setor padrão ID=${setorPadrao.id} (${setorPadrao.nome}).`);

    let atualizados = 0;
    for (const ativo of ativosSemSetor) {
      await ativo.update({ setor_id: setorPadrao.id });
      atualizados++;
      if (atualizados % 50 === 0) {
        console.log(`...${atualizados} ativos atualizados`);
      }
    }

    console.log(`✅ Backfill concluído. ${atualizados} ativos atualizados para setor padrão.`);
    process.exit(0);

  } catch (err) {
    console.error('❌ Erro no backfill:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
})();
