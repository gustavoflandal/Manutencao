const { OrdemServico, Ativo, User, Solicitacao, Setor } = require('./models');
const logger = require('./config/logger');

async function testOrdemServico() {
  try {
    console.log('🧪 Testando consulta de Ordem de Serviço...');
    
    // Teste 1: Busca simples sem include
    console.log('\n1️⃣ Teste 1: Busca simples sem include');
    try {
      const result = await OrdemServico.findAll({
        limit: 1,
        attributes: ['id', 'numero_os', 'status']
      });
      console.log('✅ Sucesso:', result.length, 'registros encontrados');
    } catch (error) {
      console.log('❌ Erro:', error.message);
    }
    
    // Teste 2: Busca com include do Ativo
    console.log('\n2️⃣ Teste 2: Busca com include do Ativo');
    try {
      const result = await OrdemServico.findAll({
        limit: 1,
        include: [
          {
            model: Ativo,
            as: 'ativo',
            attributes: ['id', 'nome', 'codigo_patrimonio']
          }
        ]
      });
      console.log('✅ Sucesso:', result.length, 'registros encontrados');
    } catch (error) {
      console.log('❌ Erro:', error.message);
    }
    
    // Teste 3: Busca com include do Ativo e Setor
    console.log('\n3️⃣ Teste 3: Busca com include do Ativo e Setor');
    try {
      const result = await OrdemServico.findAll({
        limit: 1,
        include: [
          {
            model: Ativo,
            as: 'ativo',
            include: [{ 
              model: Setor, 
              as: 'setor',
              required: false 
            }]
          }
        ]
      });
      console.log('✅ Sucesso:', result.length, 'registros encontrados');
    } catch (error) {
      console.log('❌ Erro:', error.message);
    }
    
    // Teste 4: Verificar estrutura da tabela ativos
    console.log('\n4️⃣ Teste 4: Verificando estrutura da tabela ativos');
    try {
      const [results] = await OrdemServico.sequelize.query(`
        DESCRIBE ativos
      `);
      
      const hasSetorId = results.find(col => col.Field === 'setor_id');
      if (hasSetorId) {
        console.log('✅ Coluna setor_id existe na tabela ativos');
      } else {
        console.log('❌ Coluna setor_id NÃO existe na tabela ativos');
      }
    } catch (error) {
      console.log('❌ Erro ao verificar estrutura:', error.message);
    }
    
    // Teste 5: Verificar se há dados na tabela
    console.log('\n5️⃣ Teste 5: Verificando dados na tabela ordens_servico');
    try {
      const count = await OrdemServico.count();
      console.log('📊 Total de ordens de serviço:', count);
    } catch (error) {
      console.log('❌ Erro ao contar registros:', error.message);
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  } finally {
    process.exit(0);
  }
}

testOrdemServico();