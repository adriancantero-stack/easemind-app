#!/usr/bin/env python3
"""
Script de teste para enviar emails de boas-vindas
Envia 3 emails (PT/EN/ES) para testar os templates
"""

import sys
import os

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Configurar API Key
os.environ['RESEND_API_KEY'] = 're_bTtMyTby_AyHDS7JfzFkd7iXXaJxE5jis'

from services.email_service import EmailService

def test_welcome_emails():
    """Envia emails de teste em 3 idiomas"""
    
    email_service = EmailService()
    test_email = "adrian.cantero1@gmail.com"
    
    print("📧 Iniciando teste de emails de boas-vindas...\n")
    
    # Teste 1: Português
    print("1️⃣ Enviando email em PORTUGUÊS...")
    try:
        result_pt = email_service.send_welcome_email(
            email=test_email,
            name="Adrian",
            language="pt-BR"
        )
        if result_pt:
            print("   ✅ Email em português enviado com sucesso!")
        else:
            print("   ❌ Falha ao enviar email em português")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
    
    print()
    
    # Teste 2: Inglês
    print("2️⃣ Enviando email em INGLÊS...")
    try:
        result_en = email_service.send_welcome_email(
            email=test_email,
            name="Adrian",
            language="en"
        )
        if result_en:
            print("   ✅ Email em inglês enviado com sucesso!")
        else:
            print("   ❌ Falha ao enviar email em inglês")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
    
    print()
    
    # Teste 3: Espanhol
    print("3️⃣ Enviando email em ESPANHOL...")
    try:
        result_es = email_service.send_welcome_email(
            email=test_email,
            name="Adrian",
            language="es"
        )
        if result_es:
            print("   ✅ Email em espanhol enviado com sucesso!")
        else:
            print("   ❌ Falha ao enviar email em espanhol")
    except Exception as e:
        print(f"   ❌ Erro: {e}")
    
    print("\n" + "="*50)
    print("📬 Verifique sua caixa de entrada:")
    print(f"   Email: {test_email}")
    print("   Você deve receber 3 emails:")
    print("   - 🇧🇷 Português: 'Bem-vindo ao EaseMind!'")
    print("   - 🇺🇸 Inglês: 'Welcome to EaseMind!'")
    print("   - 🇪🇸 Espanhol: '¡Bienvenido a EaseMind!'")
    print("="*50)

if __name__ == "__main__":
    test_welcome_emails()
