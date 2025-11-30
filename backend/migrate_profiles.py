#!/usr/bin/env python3
"""
Script de migração para marcar usuários existentes como perfil completo.
Isso evita que usuários antigos sejam forçados a passar pelo onboarding.
"""

import os
import sys
from datetime import datetime

# Adicionar diretório atual ao path para importar módulos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from orchestrator import users_collection
    print("✅ Conectado ao MongoDB com sucesso")
except ImportError:
    print("❌ Erro ao importar orchestrator. Certifique-se de estar no diretório correto.")
    sys.exit(1)
except Exception as e:
    print(f"❌ Erro ao conectar ao banco de dados: {e}")
    sys.exit(1)

def migrate_users():
    print("🚀 Iniciando migração de usuários...")
    
    # Critério: usuários que não têm o campo profile_completed
    query = {"profile_completed": {"$exists": False}}
    
    # Contar quantos precisam de migração
    count = users_collection.count_documents(query)
    print(f"📊 Encontrados {count} usuários para migrar")
    
    if count == 0:
        print("✅ Nenhum usuário precisa de migração.")
        return

    # Atualizar usuários
    result = users_collection.update_many(
        query,
        {
            "$set": {
                "profile_completed": True,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    print(f"✅ Migração concluída!")
    print(f"   - Usuários modificados: {result.modified_count}")
    print(f"   - Usuários encontrados: {result.matched_count}")

if __name__ == "__main__":
    migrate_users()
