const { OrdemServico, Ativo, User, Solicitacao, Setor, FmeaAnalysis } = require('./models');

async function testOrdemServico() {
  try {
    console.log('🧪 Testando query de OrdemServico...');
    
    // Replica a query do index do controller
    const ordens = await OrdemServico.findAll({
      where: { deleted_at: null },
      include: [
        {
          model: Ativo,
          as: 'ativo',
          attributes: ['id', 'nome', 'codigo_patrimonio'],
          include: [{
            model: Setor,
            as: 'setor',
            attributes: ['id', 'nome', 'codigo']
          }]
        },
        {
          model: User,
          as: 'responsavel',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: User,
          as: 'solicitante',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: FmeaAnalysis,
          as: 'fmea',
          attributes: ['id', 'component', 'failure_mode', 'rpn']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log(`✅ Query executada com sucesso! ${ordens.length} ordens encontradas`);
    
  } catch (error) {
    console.error('❌ Erro na query:', error.message);
    if (error.sql) {
      console.error('🔍 SQL gerado:', error.sql);
    }
  }
}

testOrdemServico();