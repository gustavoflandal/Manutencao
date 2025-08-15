#!/bin/bash

echo "🧪 Testando Sistema de Manutenção"
echo "=================================="

echo ""
echo "1. Testando Health Check..."
curl -X GET http://localhost:3001/api/health || echo "❌ Health check falhou"

echo ""
echo "2. Criando primeiro administrador..."
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Administrador Sistema",
    "email": "admin@sistema.com", 
    "senha": "123456"
  }' || echo "❌ Registro falhou"

echo ""
echo "3. Fazendo login..."
RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sistema.com",
    "senha": "123456"
  }')

echo $RESPONSE

# Extrair token (simplificado)
TOKEN=$(echo $RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

echo ""
echo "4. Testando autenticação..."
curl -X GET http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer $TOKEN" || echo "❌ Verificação falhou"

echo ""
echo "5. Listando usuários..."
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer $TOKEN" || echo "❌ Listagem falhou"

echo ""
echo "✅ Testes concluídos!"
