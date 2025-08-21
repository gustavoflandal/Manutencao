const axios = require('axios');

async function testeOrdemServico() {
    try {
        console.log('🧪 Testando API de Ordens de Serviço...');

        // 1. Testar listagem sem filtros
        console.log('\n1. 📝 Testando listagem de ordens de serviço...');
        const response = await axios.get('http://localhost:3001/api/ordens-servico?limit=1');
        
        console.log('✅ Status:', response.status);
        console.log('✅ Resposta:', {
            success: response.data.success,
            total: response.data.total,
            dataLength: response.data.data ? response.data.data.length : 0
        });

    } catch (error) {
        console.error('❌ Erro no teste:', error.response?.data || error.message);
    }
}

testeOrdemServico();