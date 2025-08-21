const axios = require('axios');

async function testeAuditoriaDireto() {
    try {
        console.log('🧪 Testando sistema de auditoria diretamente...');

        // 1. Primeiro vamos testar login para gerar logs
        console.log('\n1. 🔐 Fazendo login para gerar logs...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@sistema.com',
            senha: '123456'
        });

        if (loginResponse.data.success) {
            console.log('✅ Login realizado com sucesso!');
            const token = loginResponse.data.token;

            // 2. Aguardar um pouco para o log ser processado
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 3. Testar endpoint de auditoria diretamente
            console.log('\n2. 📋 Testando endpoint de auditoria...');
            const auditoriaResponse = await axios.get('http://localhost:3001/api/auditoria', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('✅ Resposta da auditoria:', {
                status: auditoriaResponse.status,
                totalLogs: auditoriaResponse.data.data ? auditoriaResponse.data.data.length : 0,
                success: auditoriaResponse.data.success
            });

            // 4. Testar estatísticas
            console.log('\n3. 📊 Testando estatísticas de auditoria...');
            const statsResponse = await axios.get('http://localhost:3001/api/auditoria/estatisticas', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('✅ Estatísticas da auditoria:', {
                status: statsResponse.status,
                stats: statsResponse.data
            });

        } else {
            console.log('❌ Falha no login:', loginResponse.data);
        }

    } catch (error) {
        console.error('❌ Erro no teste:', error.response?.data || error.message);
    }
}

testeAuditoriaDireto();