const http = require('http');

const BASE_URL = 'http://localhost:3001/api';

function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
                    }
                } catch (e) {
                    reject(new Error(`Parse error: ${responseData}`));
                }
            });
        });

        req.on('error', (err) => {
            reject(new Error(`Connection error: ${err.message}`));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testAPI() {
    try {
        console.log('🧪 Testando API do Sistema de Manutenção...\n');

        // Teste 1: Criar usuário administrador
        console.log('1. Criando usuário administrador...');
        const registerData = {
            nome: 'Administrador',
            email: 'admin@test.com',
            senha: '123456',
            perfil: 'administrador'
        };

        const registerResponse = await makeRequest('POST', '/auth/register', registerData);
        console.log('✅ Usuário criado:', registerResponse);

        // Teste 2: Login
        console.log('\n2. Fazendo login...');
        const loginData = {
            email: 'admin@test.com',
            senha: '123456'
        };

        const loginResponse = await makeRequest('POST', '/auth/login', loginData);
        console.log('✅ Login realizado:', loginResponse);

        const token = loginResponse.data.accessToken;

        // Teste 3: Listar usuários (com autenticação)
        console.log('\n3. Listando usuários...');
        const usersResponse = await makeRequest('GET', '/users', null, token);
        console.log('✅ Usuários listados:', usersResponse);

        // Teste 4: Criar outro usuário
        console.log('\n4. Criando usuário técnico...');
        const newUserData = {
            nome: 'João Técnico',
            email: 'joao@test.com',
            senha: '123456',
            perfil: 'tecnico'
        };

        const newUserResponse = await makeRequest('POST', '/users', newUserData, token);
        console.log('✅ Usuário técnico criado:', newUserResponse);

        // Teste 5: Atualizar usuário
        console.log('\n5. Atualizando usuário técnico...');
        const updateData = {
            nome: 'João Silva - Técnico Senior'
        };

        const updateResponse = await makeRequest('PUT', `/users/${newUserResponse.data.user.id}`, updateData, token);
        console.log('✅ Usuário atualizado:', updateResponse);

        console.log('\n🎉 Todos os testes passaram! Backend funcionando corretamente.');

    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

testAPI();
