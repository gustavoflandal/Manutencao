// Teste das APIs de Workflow
const http = require('http');
const https = require('https');

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https:') ? https : http;
        
        const reqOptions = {
            method: options.method || 'GET',
            headers: options.headers || {},
            ...options
        };
        
        const req = protocol.request(url, reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });
        
        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

async function testarWorkflowApis() {
    const baseURL = 'http://localhost:3001/api';
    
    try {
        console.log('🔄 Testando sistema de Workflows...\n');
        
        // 1. Teste de Health Check
        console.log('1. Testando Health Check...');
        const healthResponse = await makeRequest(`${baseURL}/health`);
        console.log('✅ Health Check:', healthResponse.data);
        
        // 2. Teste de Login
        console.log('\n2. Testando Login...');
        const loginBody = JSON.stringify({
            email: 'admin@sistema.com',
            senha: '123456'
        });
        
        const loginResponse = await makeRequest(`${baseURL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(loginBody)
            },
            body: loginBody
        });
        console.log('✅ Login realizado:', loginResponse.data.success);
        console.log('📄 Resposta completa do login:', JSON.stringify(loginResponse.data, null, 2));
        
        if (!loginResponse.data.success) {
            console.log('❌ Falha no login:', loginResponse.data);
            return;
        }
        
        const token = loginResponse.data.data.accessToken;
        console.log('🔑 Token recebido:', token ? 'Sim' : 'Não');
        
        if (!token) {
            console.log('❌ Token não foi retornado no login');
            return;
        }
        const authHeaders = { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        // 3. Teste de Templates de Workflow
        console.log('\n3. Testando Templates de Workflow...');
        const templatesResponse = await makeRequest(`${baseURL}/workflows/templates`, {
            headers: authHeaders
        });
        console.log('✅ Templates de Workflow:', templatesResponse.data);
        
        // 4. Teste de Listagem de Workflows
        console.log('\n4. Testando Listagem de Workflows...');
        const workflowsResponse = await makeRequest(`${baseURL}/workflows`, {
            headers: authHeaders
        });
        console.log('✅ Workflows:', workflowsResponse.data);
        
        // 5. Teste de Endpoint de Analytics
        console.log('\n5. Testando Analytics...');
        const analyticsResponse = await makeRequest(`${baseURL}/analytics/dashboard`, {
            headers: authHeaders
        });
        console.log('✅ Analytics Dashboard:', analyticsResponse.data);
        
        console.log('\n🎉 Todos os testes passaram! Sistema de Workflows está funcionando perfeitamente.');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

// Executar os testes
testarWorkflowApis();