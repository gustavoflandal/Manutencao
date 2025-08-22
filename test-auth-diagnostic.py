#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste de Diagnóstico de Autenticação
"""

import requests
import json

API_BASE = "http://localhost:3001/api"

def print_step(step, message):
    print(f"\n{step} {message}")
    print("-" * 50)

def test_auth_flow():
    print("🔧 TESTE AUTOMATIZADO DE DIAGNÓSTICO DE AUTENTICAÇÃO")
    print("=" * 60)
    
    # 1. Testar conectividade do backend
    print_step("1️⃣", "Testando conectividade do backend...")
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend online - uptime: {data.get('uptime', 0):.1f}s")
        else:
            print(f"❌ Backend respondeu com status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erro de conectividade: {e}")
        return False
    
    # 2. Testar processo de login
    print_step("2️⃣", "Testando processo de login...")
    
    login_data = {
        "email": "admin@sistema.com",
        "senha": "123456"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"📡 Status da resposta: {response.status_code}")
        
        if response.status_code == 200:
            login_response = response.json()
            print(f"📋 Resposta: {json.dumps(login_response, indent=2)}")
            
            if login_response.get('success'):
                access_token = login_response.get('data', {}).get('accessToken')
                refresh_token = login_response.get('data', {}).get('refreshToken')
                user_data = login_response.get('data', {}).get('user')
                
                print(f"✅ Login bem-sucedido!")
                print(f"👤 Usuário: {user_data.get('nome') if user_data else 'N/A'}")
                print(f"🔑 Access Token: {access_token[:30] if access_token else 'NULL'}...")
                print(f"🔄 Refresh Token: {refresh_token[:30] if refresh_token else 'NULL'}...")
                
                # 3. Testar validade do token
                print_step("3️⃣", "Testando validade do token...")
                
                if access_token:
                    verify_response = requests.get(
                        f"{API_BASE}/auth/verify",
                        headers={"Authorization": f"Bearer {access_token}"},
                        timeout=5
                    )
                    
                    if verify_response.status_code == 200:
                        verify_data = verify_response.json()
                        print(f"✅ Token válido!")
                        print(f"📋 Dados: {json.dumps(verify_data.get('data', {}), indent=2)}")
                        
                        print_step("4️⃣", "Simulando verificação do Vue Router...")
                        
                        # Simular computed property isAuthenticated
                        simulated_token = access_token  # localStorage
                        simulated_user = user_data     # store
                        
                        is_authenticated = bool(simulated_token and simulated_user)
                        
                        print(f"🔍 Token simulado: {bool(simulated_token)}")
                        print(f"👤 User simulado: {bool(simulated_user)}")
                        print(f"🛡️ isAuthenticated: {is_authenticated}")
                        
                        if is_authenticated:
                            print("✅ Sistema funcionaria normalmente!")
                            
                            print_step("5️⃣", "Possíveis causas do problema...")
                            print("🔍 Causas do redirecionamento:")
                            print("   1. localStorage sendo limpo")
                            print("   2. Store não sincronizando")
                            print("   3. Router guard timing")
                            print("   4. CORS bloqueando")
                            
                            return True
                        else:
                            print("❌ Auth guard redirecionaria")
                            return False
                    else:
                        print(f"❌ Token inválido - {verify_response.status_code}")
                        return False
                else:
                    print("❌ Nenhum token recebido")
                    return False
            else:
                print(f"❌ Login falhou: {login_response.get('message')}")
                return False
        else:
            print(f"❌ Erro HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

if __name__ == "__main__":
    success = test_auth_flow()
    
    print("\n" + "=" * 60)
    if success:
        print("🎯 BACKEND FUNCIONANDO CORRETAMENTE")
        print("🔍 PROBLEMA NO FRONTEND (localStorage/Vue)")
    else:
        print("🎯 PROBLEMA NO BACKEND")
