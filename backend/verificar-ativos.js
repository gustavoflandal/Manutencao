const { Ativo } = require('./models');
require('./config/database');

async function verificarAtivos() {
  try {
    console.log('🔍 Verificando ativos no banco de dados...\n');
    
    // Buscar todos os ativos (incluindo desativados)
    const todosAtivos = await Ativo.findAll({
      attributes: ['id', 'codigo_patrimonio', 'nome', 'ativo', 'estado'],
      order: [['id', 'ASC']]
    });
    
    console.log(`📊 Total de ativos no banco: ${todosAtivos.length}`);
    console.log('\n📋 Lista completa de ativos:');
    todosAtivos.forEach(ativo => {
      console.log(`   ID: ${ativo.id} | Código: ${ativo.codigo_patrimonio} | Nome: ${ativo.nome} | Ativo: ${ativo.ativo} | Estado: ${ativo.estado}`);
    });
    
    // Buscar apenas ativos ativos
    const ativosAtivos = await Ativo.findAll({
      where: { ativo: true },
      attributes: ['id', 'codigo_patrimonio', 'nome', 'ativo', 'estado'],
      order: [['id', 'ASC']]
    });
    
    console.log(`\n✅ Ativos com status ativo: ${ativosAtivos.length}`);
    console.log('\n📋 Lista de ativos ativos:');
    ativosAtivos.forEach(ativo => {
      console.log(`   ID: ${ativo.id} | Código: ${ativo.codigo_patrimonio} | Nome: ${ativo.nome} | Estado: ${ativo.estado}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao verificar ativos:', error);
    process.exit(1);
  }
}

// Aguardar conexão do banco
setTimeout(verificarAtivos, 1000);