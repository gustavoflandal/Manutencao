// Script para testar setores no console do navegador
// Copie e cole este código no console do navegador (F12)

// TESTE DE SETORES - SISTEMA DE MANUTENÇÃO

async function testSetoresCompleto() {
    const API_BASE = 'http://localhost:3000/api';
    
    console.log('🔄 INICIANDO TESTE DE SETORES...\n');
    
    // 1. FAZER LOGIN
    console.log('1️⃣ Fazendo login...');
    try {
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@sistema.com',
                senha: '123456'
            })
        });
        
        const loginData = await loginResponse.json();
        
        if (loginData.success) {
            localStorage.setItem('access_token', loginData.data.accessToken);
            console.log('✅ Login realizado com sucesso!');
            console.log('👤 Usuário:', loginData.data.user.nome);
            console.log('🔑 Token salvo no localStorage');
        } else {
            console.error('❌ Erro no login:', loginData.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Erro na requisição de login:', error);
        return false;
    }
    
    // 2. TESTAR SETORES
    console.log('\n2️⃣ Carregando setores...');
    const token = localStorage.getItem('access_token');
    
    try {
        const setoresResponse = await fetch(`${API_BASE}/setores/ativos`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Status da requisição:', setoresResponse.status);
        
        if (setoresResponse.ok) {
            const setoresData = await setoresResponse.json();
            
            console.log('📦 Resposta completa:', setoresData);
            
            if (setoresData.success && setoresData.data && setoresData.data.setores) {
                const setores = setoresData.data.setores;
                console.log('✅ Setores carregados com sucesso!');
                console.log('📊 Total de setores:', setores.length);
                console.log('📋 Lista de setores:');
                
                setores.forEach((setor, index) => {
                    console.log(`   ${index + 1}. ${setor.codigo} - ${setor.nome}`);
                    console.log(`      📍 Local: ${setor.localizacao || 'Não informado'}`);
                    if (setor.responsavel) {
                        console.log(`      👨‍💼 Responsável: ${setor.responsavel.nome}`);
                    }
                    console.log('');
                });
                
                // 3. SIMULAR O QUE O FRONTEND DEVERIA FAZER
                console.log('3️⃣ Simulando preenchimento do select...');
                
                // Buscar o select de setores na página (se existir)
                const setorSelect = document.querySelector('#setor');
                if (setorSelect) {
                    console.log('🎯 Select de setor encontrado! Preenchendo opções...');
                    
                    // Limpar opções existentes (exceto a primeira)
                    while (setorSelect.children.length > 1) {
                        setorSelect.removeChild(setorSelect.lastChild);
                    }
                    
                    // Adicionar setores
                    setores.forEach(setor => {
                        const option = document.createElement('option');
                        option.value = setor.id;
                        option.textContent = `${setor.codigo} - ${setor.nome}`;
                        setorSelect.appendChild(option);
                    });
                    
                    console.log('✅ Select preenchido com', setores.length, 'setores!');
                } else {
                    console.log('⚠️ Select de setor não encontrado na página atual');
                    console.log('💡 Navegue até a página de solicitações e abra o modal para ver o select');
                }
                
                return true;
                
            } else {
                console.error('❌ Formato de resposta inválido:', setoresData);
                return false;
            }
        } else {
            const errorText = await setoresResponse.text();
            console.error('❌ Erro HTTP:', setoresResponse.status, errorText);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erro na requisição de setores:', error);
        return false;
    }
}

// EXECUTAR O TESTE
console.log('🚀 Iniciando teste de setores...');
console.log('📋 Para executar, digite: testSetoresCompleto()');

// Auto-executar
testSetoresCompleto().then(success => {
    if (success) {
        console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
        console.log('✅ O sistema está funcionando corretamente');
        console.log('💡 Se o select não está preenchendo, verifique se você está na página correta');
    } else {
        console.log('\n❌ TESTE FALHOU!');
        console.log('🔍 Verifique os erros acima para mais detalhes');
    }
});