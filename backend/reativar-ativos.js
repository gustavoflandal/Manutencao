const { Ativo } = require('./models');
require('./config/database');

async function reativarAtivos() {
  try {
    console.log('🔄 Reativando ativos desativados...\n');
    
    // Buscar ativos desativados
    const ativosDesativados = await Ativo.findAll({
      where: { ativo: false },
      attributes: ['id', 'codigo_patrimonio', 'nome']
    });
    
    console.log(`📊 Ativos desativados encontrados: ${ativosDesativados.length}`);
    
    if (ativosDesativados.length > 0) {
      console.log('\n📋 Reativando ativos:');
      
      for (const ativo of ativosDesativados) {
        await ativo.update({ ativo: true });
        console.log(`   ✅ ID: ${ativo.id} | Código: ${ativo.codigo_patrimonio} | Nome: ${ativo.nome}`);
      }
      
      console.log(`\n🎉 ${ativosDesativados.length} ativos reativados com sucesso!`);
    } else {
      console.log('\n✅ Nenhum ativo desativado encontrado.');
    }
    
    // Verificar total de ativos ativos agora
    const totalAtivos = await Ativo.count({ where: { ativo: true } });
    console.log(`\n📊 Total de ativos ativos agora: ${totalAtivos}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao reativar ativos:', error);
    process.exit(1);
  }
}

// Aguardar conexão do banco
setTimeout(reativarAtivos, 1000);