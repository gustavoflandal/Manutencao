const { OrdemServico, Ativo, User, Solicitacao, Setor } = require('./models');

async function testSpecificQuery() {
  try {
    console.log('🔍 Testando consulta específica que falha...');
    
    // Esta é a consulta que está sendo feita no controller
    const result = await OrdemServico.findAndCountAll({
      where: {},
      include: [
        {
          model: Ativo,
          as: 'ativo',
          attributes: ['id', 'nome', 'codigo_patrimonio']
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
          model: Solicitacao,
          as: 'solicitacao',
          required: false
        }
      ],
      attributes: [
        'id', 'numero_os', 'tipo', 'descricao_servico', 'status', 'prioridade',
        'data_inicio_prevista', 'data_inicio_real', 'data_fim_prevista', 'data_fim_real',
        'horas_planejadas', 'horas_realizadas', 'custo_total', 'observacoes_execucao',
        'ativo_id', 'solicitante_id', 'responsavel_id', 'created_at', 'updated_at'
      ],
      limit: 1,
      offset: 0,
      order: [
        ['prioridade', 'DESC'],
        ['data_inicio_prevista', 'ASC'],
        ['created_at', 'DESC']
      ]
    });

    console.log('✅ Consulta executada com sucesso!');
    console.log('📊 Resultados:', result.count);
    
  } catch (error) {
    console.error('❌ Erro na consulta:', error.message);
    console.error('🔍 SQL:', error.sql);
    
    // Vamos tentar ver o SQL gerado
    if (error.sql) {
      console.log('\n📝 SQL gerado pelo Sequelize:');
      console.log(error.sql);
    }
  }
  
  process.exit(0);
}

testSpecificQuery();