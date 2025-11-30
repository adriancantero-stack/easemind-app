#!/usr/bin/env python3
"""
Script para deletar usuários de teste do EaseMind
Deleta usuários do Firebase Auth e MongoDB
"""

import requests
import sys

# Configuração
BACKEND_URL = "https://api.easemind.io"

# Lista de emails para deletar
EMAILS_TO_DELETE = [
    "teste11@gmail.com",
    "teste10@gmail.com",
    "undefined",
    "savagems.sales@gmail.com",
    "teste@easemind.io",
    "final@easemind.io",
    "teste8@easemind.io",
    "teste5@easemind.io"
]

def get_all_users():
    """Busca todos os usuários do sistema"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/list_users")
        response.raise_for_status()
        data = response.json()
        
        # Se retornar string, tentar parsear
        if isinstance(data, str):
            import json
            data = json.loads(data)
        
        # Se for dict com chave 'users', pegar a lista
        if isinstance(data, dict) and 'users' in data:
            return data['users']
        
        # Se já for lista, retornar
        if isinstance(data, list):
            return data
            
        print(f"⚠️  Formato inesperado de resposta: {type(data)}")
        print(f"Dados: {data}")
        return []
    except Exception as e:
        print(f"❌ Erro ao buscar usuários: {e}")
        import traceback
        traceback.print_exc()
        return []

def delete_user(firebase_uid, email):
    """Deleta um usuário pelo Firebase UID"""
    try:
        response = requests.delete(f"{BACKEND_URL}/api/admin/delete-user/{firebase_uid}")
        response.raise_for_status()
        print(f"✅ Usuário deletado: {email} (UID: {firebase_uid})")
        return True
    except Exception as e:
        print(f"❌ Erro ao deletar {email}: {e}")
        return False

def main():
    print("🗑️  Iniciando deleção de usuários de teste...\n")
    
    # Buscar todos os usuários
    print("📋 Buscando lista de usuários...")
    users = get_all_users()
    
    if not users:
        print("❌ Não foi possível buscar usuários")
        sys.exit(1)
    
    print(f"✅ Encontrados {len(users)} usuários no sistema\n")
    
    # Encontrar e deletar usuários
    deleted_count = 0
    not_found = []
    
    for email in EMAILS_TO_DELETE:
        # Procurar usuário pelo email
        user_found = None
        for user in users:
            if user.get('email', '').lower() == email.lower() or user.get('nome', '').lower() == email.lower():
                user_found = user
                break
        
        if user_found:
            firebase_uid = user_found.get('firebase_uid') or user_found.get('_id')
            if firebase_uid:
                if delete_user(firebase_uid, email):
                    deleted_count += 1
            else:
                print(f"⚠️  Usuário {email} encontrado mas sem UID")
        else:
            not_found.append(email)
            print(f"⚠️  Usuário não encontrado: {email}")
    
    # Resumo
    print(f"\n{'='*50}")
    print(f"📊 RESUMO:")
    print(f"   ✅ Deletados: {deleted_count}")
    print(f"   ⚠️  Não encontrados: {len(not_found)}")
    print(f"{'='*50}")
    
    if not_found:
        print(f"\n⚠️  Usuários não encontrados:")
        for email in not_found:
            print(f"   - {email}")

if __name__ == "__main__":
    main()
