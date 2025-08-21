// Teste Completo do Formulário de Ativos
// Este arquivo testa o CRUD completo com todos os campos implementados

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testFormularioCompleto() {
  console.log('🧪 Iniciando teste do formulário completo de ativos...\n');

  try {
    // 1. Login
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@sistema.com',
      senha: '123456'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login realizado com sucesso\n');

    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    // 2. Buscar dados de referência
    console.log('2. Carregando dados de referência...');
    
    const [setoresRes, categoriasRes, usuariosRes] = await Promise.all([
      axios.get(`${API_BASE}/setores`, config),
      axios.get(`${API_BASE}/categories`, config),
      axios.get(`${API_BASE}/users`, config)
    ]);

    const setores = setoresRes.data.data.setores || [];
    const categorias = categoriasRes.data.data?.categories || [];
    const usuarios = usuariosRes.data.data?.users || [];

    console.log(`✅ Setores encontrados: ${setores.length}`);
    console.log(`✅ Categorias encontradas: ${categorias.length}`);
    console.log(`✅ Usuários encontrados: ${usuarios.length}\n`);

    // 3. Criar ativo com formulário completo
    console.log('3. Criando ativo com formulário completo...');
    
    const ativoCompleto = {
      // Identificação (apenas campos obrigatórios e seguros)
      codigo_patrimonio: `COMP-${Date.now()}`,
      nome: 'Compressor Industrial Atlas Copco',
      
      // Referências opcionais (apenas se existirem)
      ...(categorias.length > 0 && { categoria_id: categorias[0].id }),
      ...(setores.length > 0 && { setor_id: setores[0].id }),
      ...(usuarios.length > 0 && { responsavel_id: usuarios[0].id }),
      
      // Fabricante
      fabricante: 'Atlas Copco',
      modelo: 'GA55+',
      numero_serie: 'AC2024001',
      ano_fabricacao: 2024,
      
      // Localização
      localizacao_completa: 'Prédio A - Térreo - Sala de Compressores - Posição 1',
      predio: 'Prédio A',
      andar: 'Térreo',
      sala: 'Sala de Compressores',
      posicao: 'Posição 1',
      
      // Estado e Criticidade
      estado: 'operacional',
      criticidade: 'critica',
      vida_util_anos: 15,
      
      // Características Técnicas
      potencia: '55 kW',
      tensao: '380V',
      frequencia: '60Hz',
      peso: 1250.50,
      dimensoes: '2.1 x 1.8 x 1.9 m',
      capacidade: '10.2 m³/min',
      
      // Financeiro
      data_aquisicao: '2024-01-15',
      valor_aquisicao: 150000.00,
      valor_atual: 145000.00,
      fornecedor: 'Atlas Copco Brasil Ltda',
      garantia_ate: '2026-01-15',
      
      // Manutenção
      data_proxima_inspecao: '2024-09-15',
      horas_funcionamento: 1250.75,
      contador_producao: 50000,
      ultima_manutencao: '2024-07-15',
      
      // Documentação
      especificacoes_tecnicas: 'Compressor de parafuso rotativo com sistema de controle eletrônico. Pressão de trabalho: 8 bar. Temperatura de operação: -10°C a +45°C.',
      manual_operacao: 'Verificar pressão diariamente. Drenar condensado a cada 8 horas. Monitorar temperatura do óleo.',
      manual_manutencao: 'Troca de óleo: 2000h. Filtro de ar: 1000h. Filtro de óleo: 2000h. Inspeção geral: 8000h.',
      observacoes: 'Equipamento crítico para produção. Manter sobressalente em estoque. Contrato de manutenção ativo.',
      
      // Status
      ativo: true
    };

    const createResponse = await axios.post(`${API_BASE}/ativos`, ativoCompleto, config);
    const ativo = createResponse.data.data.ativo;
    
    console.log(`✅ Ativo criado com ID: ${ativo.id}`);
    console.log(`   Código: ${ativo.codigo_patrimonio}`);
    console.log(`   Nome: ${ativo.nome}`);
    console.log(`   Fabricante: ${ativo.fabricante}`);
    console.log(`   Modelo: ${ativo.modelo}`);
    console.log(`   Localização: ${ativo.localizacao_completa}`);
    console.log(`   Potência: ${ativo.potencia}`);
    console.log(`   Valor: R$ ${ativo.valor_aquisicao}\n`);

    // 4. Verificar se todos os campos foram salvos
    console.log('4. Verificando se todos os campos foram salvos...');
    const getResponse = await axios.get(`${API_BASE}/ativos/${ativo.id}`, config);
    const ativoSalvo = getResponse.data.data?.ativo || getResponse.data;

    const camposVerificar = [
      'fabricante', 'modelo', 'numero_serie', 'ano_fabricacao',
      'localizacao_completa', 'predio', 'andar', 'sala', 'posicao',
      'potencia', 'tensao', 'frequencia', 'peso', 'dimensoes', 'capacidade',
      'valor_aquisicao', 'valor_atual', 'fornecedor',
      'especificacoes_tecnicas', 'manual_operacao', 'manual_manutencao', 'observacoes'
    ];

    let camposSalvos = 0;
    let camposComProblema = [];

    for (const campo of camposVerificar) {
      if (ativoSalvo[campo] !== null && ativoSalvo[campo] !== undefined && ativoSalvo[campo] !== '') {
        camposSalvos++;
        console.log(`   ✅ ${campo}: ${ativoSalvo[campo]}`);
      } else {
        camposComProblema.push(campo);
        console.log(`   ❌ ${campo}: não salvo`);
      }
    }

    console.log(`\n📊 Resumo: ${camposSalvos}/${camposVerificar.length} campos salvos corretamente`);
    
    if (camposComProblema.length > 0) {
      console.log(`⚠️  Campos com problema: ${camposComProblema.join(', ')}`);
    }

    // 5. Testar atualização
    console.log('\n5. Testando atualização do ativo...');
    const ativoAtualizado = {
      ...ativoCompleto,
      nome: 'Compressor Industrial Atlas Copco - ATUALIZADO',
      potencia: '60 kW',
      observacoes: 'Equipamento atualizado com nova potência. Teste de atualização completo.'
    };

    const updateResponse = await axios.put(`${API_BASE}/ativos/${ativo.id}`, ativoAtualizado, config);
    const ativoAtualizadoSalvo = updateResponse.data.data?.ativo || updateResponse.data;
    
    console.log(`✅ Ativo atualizado: ${ativoAtualizadoSalvo.nome || 'Nome não retornado'}`);
    console.log(`   Nova potência: ${ativoAtualizadoSalvo.potencia || 'Potência não retornada'}\n`);

    // 6. Limpeza
    console.log('6. Limpando ativo de teste...');
    await axios.delete(`${API_BASE}/ativos/${ativo.id}`, config);
    console.log('✅ Ativo de teste excluído\n');

    if (camposComProblema.length === 0) {
      console.log('🎉 SUCESSO TOTAL! Todos os campos do formulário estão funcionando corretamente.');
    } else {
      console.log(`⚠️  SUCESSO PARCIAL: ${camposSalvos}/${camposVerificar.length} campos funcionando. Revisar campos com problema.`);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Dica: Verifique se o token de autenticação está válido');
    }
    
    if (error.response?.status === 400) {
      console.log('💡 Dica: Verifique se todos os campos obrigatórios estão sendo enviados');
    }
    
    if (error.response?.status === 500) {
      console.log('💡 Dica: Verifique se o banco de dados está rodando e as tabelas existem');
    }
  }
}

// Executar teste
testFormularioCompleto();