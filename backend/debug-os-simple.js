const { OrdemServico } = require('./models');

async function testSimpleOS() {
  try {
    console.log('Teste 1: Busca simples sem include');
    const test1 = await OrdemServico.findAll({ limit: 1 });
    console.log('✅ Busca simples OK:', test1.length);

    console.log('Teste 2: Busca com atributos específicos');
    const test2 = await OrdemServico.findAll({ 
      attributes: ['id', 'numero_os'],
      limit: 1 
    });
    console.log('✅ Busca com atributos OK:', test2.length);

    console.log('Teste 3: findAndCountAll simples');
    const test3 = await OrdemServico.findAndCountAll({ limit: 1 });
    console.log('✅ findAndCountAll OK:', test3.count);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testSimpleOS();