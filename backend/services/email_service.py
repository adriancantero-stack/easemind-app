"""
Email Service for EaseMind
Handles automated email sending using Resend API
"""

import os
import logging
import resend
from typing import Optional

logger = logging.getLogger(__name__)

# Configure Resend API
resend.api_key = os.getenv('RESEND_API_KEY', 're_bTtMyTby_AyHDS7JfzFkd7iXXaJxE5jis')

class EmailService:
    """Service for sending emails via Resend API"""
    
    def __init__(self):
        self.from_email = "EaseMind <support@app.easemind.io>"
        
    def _get_welcome_template(self, language: str) -> tuple[str, str]:
        """Get welcome email subject and HTML content based on language"""
        
        templates = {
            'pt-BR': {
                'subject': '🌟 Bem-vindo ao EaseMind! Sua jornada de bem-estar começa aqui',
                'html': self._get_pt_template()
            },
            'en': {
                'subject': '🌟 Welcome to EaseMind! Your wellness journey starts here',
                'html': self._get_en_template()
            },
            'es': {
                'subject': '🌟 ¡Bienvenido a EaseMind! Tu viaje de bienestar comienza aquí',
                'html': self._get_es_template()
            }
        }
        
        # Default to Portuguese if language not found
        template = templates.get(language, templates['pt-BR'])
        return template['subject'], template['html']
    
    def _get_pt_template(self) -> str:
        """Portuguese welcome email template"""
        return """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao EaseMind</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">💜 EaseMind</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Acalme sua mente. Cure seu dia.</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px;">Olá! 👋</h2>
                            <p style="color: #4a5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                                Seja muito bem-vindo(a) ao <strong>EaseMind</strong>! Estamos muito felizes em ter você aqui. 💜
                            </p>
                            <p style="color: #4a5568; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                                Você acabou de dar o primeiro passo para cuidar melhor da sua saúde mental e emocional. 
                                Este é um espaço <strong>seguro, privado</strong> e feito especialmente para você.
                            </p>
                            
                            <!-- Features -->
                            <h3 style="color: #667eea; margin: 30px 0 20px 0; font-size: 20px;">🌟 O que você pode fazer no EaseMind:</h3>
                            
                            <div style="margin-bottom: 20px;">
                                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 16px;">💬 Conversar com Luna - Sua terapeuta virtual</p>
                                <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.5;">Luna está disponível 24/7 para ouvir você, sem julgamentos.</p>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 16px;">🧘 Sessões Guiadas</p>
                                <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.5;">Meditação, respiração e exercícios para ansiedade e estresse.</p>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 16px;">📔 Diário Emocional</p>
                                <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.5;">Registre seus sentimentos e acompanhe seu progresso.</p>
                            </div>
                            
                            <div style="margin-bottom: 30px;">
                                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 16px;">🚨 Botão SOS</p>
                                <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.5;">Em momentos de crise, acesso rápido a técnicas de alívio imediato.</p>
                            </div>
                            
                            <!-- Install Instructions -->
                            <h3 style="color: #667eea; margin: 30px 0 20px 0; font-size: 20px;">📱 Como instalar no seu celular:</h3>
                            
                            <div style="background-color: #f7fafc; padding: 20px; border-radius: 12px; margin-bottom: 15px;">
                                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 16px;">📱 iPhone:</p>
                                <ol style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px; line-height: 1.8;">
                                    <li>Abra <strong>app.easemind.io</strong> no Safari</li>
                                    <li>Toque no ícone de compartilhar</li>
                                    <li>Selecione "Adicionar à Tela de Início"</li>
                                </ol>
                            </div>
                            
                            <div style="background-color: #f7fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
                                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 16px;">🤖 Android:</p>
                                <ol style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px; line-height: 1.8;">
                                    <li>Abra <strong>app.easemind.io</strong> no Chrome</li>
                                    <li>Toque nos 3 pontos (menu)</li>
                                    <li>Selecione "Adicionar à tela inicial"</li>
                                </ol>
                            </div>
                            
                            <!-- Security -->
                            <div style="background-color: #edf2f7; padding: 20px; border-radius: 12px; border-left: 4px solid #667eea; margin-bottom: 30px;">
                                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 16px;">🔒 Seus dados estão seguros</p>
                                <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                                    Suas conversas são privadas e criptografadas. Nunca compartilhamos suas informações com terceiros. Este é o seu espaço seguro.
                                </p>
                            </div>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="https://app.easemind.io" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 18px;">
                                            Começar Agora →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                                Qualquer dúvida, estamos aqui: <a href="mailto:support@easemind.io" style="color: #667eea; text-decoration: none;">support@easemind.io</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f7fafc; padding: 30px; text-align: center;">
                            <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 14px;">Com carinho,</p>
                            <p style="margin: 0; color: #667eea; font-weight: 700; font-size: 16px;">Equipe EaseMind 💜</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    
    def _get_en_template(self) -> str:
        """English welcome email template"""
        return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to EaseMind</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">💜 EaseMind</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Ease your mind. Heal your day.</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px;">Hello! 👋</h2>
                            <p style="color: #4a5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                                Welcome to <strong>EaseMind</strong>! We're so happy to have you here. 💜
                            </p>
                            <p style="color: #4a5568; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                                You've just taken the first step towards better mental and emotional health. 
                                This is a <strong>safe, private</strong> space made especially for you.
                            </p>
                            
                            <!-- Features -->
                            <h3 style="color: #667eea; margin: 30px 0 20px 0; font-size: 20px;">🌟 What you can do in EaseMind:</h3>
                            
                            <div style="margin-bottom: 20px;">
                                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 16px;">💬 Chat with Luna - Your virtual therapist</p>
                                <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.5;">Luna is available 24/7 to listen to you, without judgment.</p>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 16px;">🧘 Guided Sessions</p>
                                <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.5;">Meditation, breathing, and exercises for anxiety and stress.</p>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 16px;">📔 Emotional Journal</p>
                                <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.5;">Record your feelings and track your progress.</p>
                            </div>
                            
                            <div style="margin-bottom: 30px;">
                                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 16px;">🚨 SOS Button</p>
                                <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.5;">In moments of crisis, quick access to immediate relief techniques.</p>
                            </div>
                            
                            <!-- Install Instructions -->
                            <h3 style="color: #667eea; margin: 30px 0 20px 0; font-size: 20px;">📱 How to install on your phone:</h3>
                            
                            <div style="background-color: #f7fafc; padding: 20px; border-radius: 12px; margin-bottom: 15px;">
                                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 16px;">📱 iPhone:</p>
                                <ol style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px; line-height: 1.8;">
                                    <li>Open <strong>app.easemind.io</strong> in Safari</li>
                                    <li>Tap the share icon</li>
                                    <li>Select "Add to Home Screen"</li>
                                </ol>
                            </div>
                            
                            <div style="background-color: #f7fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
                                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 16px;">🤖 Android:</p>
                                <ol style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px; line-height: 1.8;">
                                    <li>Open <strong>app.easemind.io</strong> in Chrome</li>
                                    <li>Tap the 3 dots (menu)</li>
                                    <li>Select "Add to home screen"</li>
                                </ol>
                            </div>
                            
                            <!-- Security -->
                            <div style="background-color: #edf2f7; padding: 20px; border-radius: 12px; border-left: 4px solid #667eea; margin-bottom: 30px;">
                                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 16px;">🔒 Your data is safe</p>
                                <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                                    Your conversations are private and encrypted. We never share your information with third parties. This is your safe space.
                                </p>
                            </div>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="https://app.easemind.io" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 18px;">
                                            Get Started →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                                Any questions? We're here: <a href="mailto:support@easemind.io" style="color: #667eea; text-decoration: none;">support@easemind.io</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f7fafc; padding: 30px; text-align: center;">
                            <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 14px;">With love,</p>
                            <p style="margin: 0; color: #667eea; font-weight: 700; font-size: 16px;">EaseMind Team 💜</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    
    def _get_es_template(self) -> str:
        """Spanish welcome email template"""
        return """
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a EaseMind</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">💜 EaseMind</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Calma tu mente. Sana tu día.</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px;">¡Hola! 👋</h2>
                            <p style="color: #4a5568; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                                ¡Bienvenido(a) a <strong>EaseMind</strong>! Estamos muy felices de tenerte aquí. 💜
                            </p>
                            <p style="color: #4a5568; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                                Acabas de dar el primer paso para cuidar mejor tu salud mental y emocional. 
                                Este es un espacio <strong>seguro, privado</strong> y hecho especialmente para ti.
                            </p>
                            
                            <!-- Features -->
                            <h3 style="color: #667eea; margin: 30px 0 20px 0; font-size: 20px;">🌟 Qué puedes hacer en EaseMind:</h3>
                            
                            <div style="margin-bottom: 20px;">
                                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 16px;">💬 Conversar con Luna - Tu terapeuta virtual</p>
                                <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.5;">Luna está disponible 24/7 para escucharte, sin juicios.</p>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 16px;">🧘 Sesiones Guiadas</p>
                                <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.5;">Meditación, respiración y ejercicios para ansiedad y estrés.</p>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 16px;">📔 Diario Emocional</p>
                                <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.5;">Registra tus sentimientos y sigue tu progreso.</p>
                            </div>
                            
                            <div style="margin-bottom: 30px;">
                                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 16px;">🚨 Botón SOS</p>
                                <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.5;">En momentos de crisis, acceso rápido a técnicas de alivio inmediato.</p>
                            </div>
                            
                            <!-- Install Instructions -->
                            <h3 style="color: #667eea; margin: 30px 0 20px 0; font-size: 20px;">📱 Cómo instalar en tu celular:</h3>
                            
                            <div style="background-color: #f7fafc; padding: 20px; border-radius: 12px; margin-bottom: 15px;">
                                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 16px;">📱 iPhone:</p>
                                <ol style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px; line-height: 1.8;">
                                    <li>Abre <strong>app.easemind.io</strong> en Safari</li>
                                    <li>Toca el ícono de compartir</li>
                                    <li>Selecciona "Añadir a pantalla de inicio"</li>
                                </ol>
                            </div>
                            
                            <div style="background-color: #f7fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
                                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 16px;">🤖 Android:</p>
                                <ol style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px; line-height: 1.8;">
                                    <li>Abre <strong>app.easemind.io</strong> en Chrome</li>
                                    <li>Toca los 3 puntos (menú)</li>
                                    <li>Selecciona "Añadir a pantalla de inicio"</li>
                                </ol>
                            </div>
                            
                            <!-- Security -->
                            <div style="background-color: #edf2f7; padding: 20px; border-radius: 12px; border-left: 4px solid #667eea; margin-bottom: 30px;">
                                <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 16px;">🔒 Tus datos están seguros</p>
                                <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                                    Tus conversaciones son privadas y encriptadas. Nunca compartimos tu información con terceros. Este es tu espacio seguro.
                                </p>
                            </div>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="https://app.easemind.io" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 18px;">
                                            Comenzar Ahora →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                                ¿Alguna pregunta? Estamos aquí: <a href="mailto:support@easemind.io" style="color: #667eea; text-decoration: none;">support@easemind.io</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f7fafc; padding: 30px; text-align: center;">
                            <p style="margin: 0 0 10px 0; color: #1a202c; font-weight: 600; font-size: 14px;">Con cariño,</p>
                            <p style="margin: 0; color: #667eea; font-weight: 700; font-size: 16px;">Equipo EaseMind 💜</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    
    def send_welcome_email(self, email: str, name: str, language: str = 'pt-BR') -> bool:
        """
        Send welcome email to new user
        
        Args:
            email: User's email address
            name: User's display name
            language: User's preferred language (pt-BR, en, es)
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Get template based on language
            subject, html_content = self._get_welcome_template(language)
            
            # Replace name placeholder if exists
            html_content = html_content.replace('{{name}}', name)
            
            # Send email via Resend
            params = {
                "from": self.from_email,
                "to": [email],
                "subject": subject,
                "html": html_content,
            }
            
            email_response = resend.Emails.send(params)
            
            logger.info(f"✅ Welcome email sent to {email} (language: {language})")
            logger.debug(f"Resend response: {email_response}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to send welcome email to {email}: {str(e)}")
            return False
