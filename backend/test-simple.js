#!/usr/bin/env node

/**
 * Script simples para testar uma rota básica
 */

const axios = require('axios');

async function testeSimples() {
  try {
    console.log('🧪 Teste simples de conectividade...');
    
    // Teste básico de conectividade
    const response = await axios.get('http://localhost:3001/api/health');
    console.log('✅ Servidor respondendo:', response.status);
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Servidor não está rodando ou não é acessível');
    } else {
      console.log('⚠️ Resposta do servidor:', error.response?.status, error.response?.data?.message || error.message);
    }
  }
}

testeSimples();