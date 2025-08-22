// Teste rápido de /categories/active
const axios = require('axios');

const API = 'http://localhost:3001/api';

(async () => {
  try {
    console.log('🔐 Fazendo login...');
    let login;
    try {
      login = await axios.post(`${API}/auth/login`, { email: 'admin@sistema.com', senha: '123456' });
    } catch (e1) {
      console.log('Tentando com password...');
      login = await axios.post(`${API}/auth/login`, { email: 'admin@sistema.com', password: '123456' });
    }
    const token = login.data.data.accessToken;

    console.log('📥 Buscando categorias ativas...');
    const resp = await axios.get(`${API}/categories/active`, { headers: { Authorization: `Bearer ${token}` }});

    if (!resp.data.success) {
      console.error('❌ Falha na resposta', resp.data);
      process.exit(1);
    }

    const categorias = resp.data.data?.categorias || [];
    console.log(`✅ ${categorias.length} categorias ativas`);
    categorias.slice(0,5).forEach(c => {
      console.log(` - ${c.id}: ${c.nome} | subcategorias: ${(c.subcategorias||[]).length}`);
    });

    if (categorias.length === 0) {
      console.warn('⚠️ Nenhuma categoria ativa encontrada.');
    }

    // Validar shape mínimo
    const invalida = categorias.find(c => !('id' in c) || !('nome' in c));
    if (invalida) {
      console.error('❌ Categoria sem campos mínimos:', invalida);
      process.exit(1);
    }

    console.log('🧪 Teste básico concluído com sucesso.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro no teste:', err.response?.data || err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Headers:', err.response.headers);
    }
    process.exit(1);
  }
})();
