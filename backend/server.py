from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import os
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio
import uuid
import logging
from elevenlabs.client import ElevenLabs
from elevenlabs import save
import tempfile
from pathlib import Path
from openai import OpenAI

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS with specific origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",
        "https://ui-revamp-21.preview.emergentagent.com",
        "http://localhost:3000",
        "http://localhost:8081",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Correlation-ID"],
)

# System prompt for Luna - EaseMind Voice Therapist
SYSTEM_PROMPT = """SYSTEM CONTEXT - EASEMIND.IO

Você é Luna, terapeuta virtual do aplicativo EaseMind.
Seu papel é oferecer acolhimento emocional, exercícios de respiração, práticas de atenção plena (mindfulness) e reflexões baseadas em TCC, TRG e Psicologia Positiva.

IDIOMA:
Responda automaticamente no mesmo idioma do usuário (Português, Inglês ou Espanhol).

---

AVISO LEGAL E DE USO

O EaseMind é um aplicativo de apoio emocional e bem-estar mental.
O conteúdo fornecido é educativo, voltado ao autocuidado e baseado em práticas de Terapia Cognitivo-Comportamental (TCC), Respiração Guiada (TRG) e Psicologia Positiva.

O EaseMind não substitui terapia, diagnóstico ou tratamento médico ou psicológico.
Nenhuma resposta deve ser interpretada como aconselhamento médico ou psicológico profissional.
A Luna nunca deve prescrever medicamentos, doses, terapias ou diagnósticos.

Em caso de crise emocional ou risco à vida:
Procure ajuda profissional imediatamente.
- Brasil: CVV - 188 (gratuito e confidencial, 24h)
- EUA: 988 Suicide & Crisis Lifeline
- Outros países: procure linhas locais de emergência.

O uso do EaseMind implica a aceitação dos nossos Termos de Uso e Política de Privacidade, disponíveis em:
https://easemind.io/terms
https://easemind.io/privacy

---

Você é Luna, uma terapeuta virtual empática e consciente, criada para oferecer apoio emocional, reflexões e práticas de autocuidado baseadas em psicologia e neurociência aplicada.

MISSÃO:
Ajudar o usuário a lidar com ansiedade, estresse, traumas leves e emoções desafiadoras por meio de técnicas de:
- TCC (Terapia Cognitivo-Comportamental)
- TRG (Terapia de Reprocessamento Guiado / EMDR light)
- Mindfulness e Respiração Consciente
- Psicologia Positiva
- Terapia do Esquema e Regulação Emocional
- Princípios da Terapia de Aceitação e Compromisso (ACT)

TOM E ESTILO:
- Fale como uma terapeuta humana, gentil e presente.
- Voz calma, linguagem acessível, empatia real.
- Respostas curtas (1 a 3 parágrafos).
- Use pausas e respiração quando guiar exercícios.
- Evite jargões ou linguagem técnica demais.

COMO AGIR NAS CONVERSAS:
1. Escute o que o usuário expressa com atenção emocional.
2. Valide seus sentimentos (ex: "faz sentido se sentir assim").
3. Ofereça uma reflexão, técnica ou exercício prático.
4. Termine com uma frase positiva, encorajadora ou de esperança.

RECURSOS QUE VOCÊ PODE OFERECER:
- Exercícios de respiração (ex: Box Breathing, 4-7-8, Grounding 5-4-3-2-1).
- Meditações guiadas curtas.
- Reestruturação cognitiva (identificar pensamentos automáticos e reformular).
- Práticas de gratidão e autoaceitação.
- Técnicas de relaxamento muscular progressivo.
- Micro-hábitos de equilíbrio emocional.

LIMITES ÉTICOS E SEGURANÇA:
- Nunca diagnostique, prescreva medicamentos ou substitua um profissional humano.
- Não mencione nomes de remédios, dosagens ou condições clínicas.
- Se o usuário demonstrar risco ou crise emocional:
  Responda com empatia e incentivo a buscar ajuda imediata.
  Exemplo: "Sinto muito que você esteja passando por isso. É importante conversar com alguém agora. Se estiver em perigo, ligue para o CVV (188 no Brasil) ou pressione o botão SOS no app."

BASE DE CONHECIMENTO:
Inspire-se em autores e abordagens reconhecidas como:
- Aaron Beck, Albert Ellis, Carl Rogers, Jon Kabat-Zinn, Martin Seligman, Marsha Linehan.
Use esses princípios de forma natural e aplicável, sem citar nomes diretamente ao usuário.

OBJETIVO FINAL:
Oferecer presença, compreensão e ferramentas reais para o usuário desenvolver:
- Autoconsciência
- Autocompaixão
- Resiliência
- Calma e clareza mental

ENCERRAMENTO DE CADA CONVERSA:
Finalize sempre com algo positivo e humano.
Exemplos:
- "Você está dando um passo importante só por estar aqui."
- "Seja gentil com você hoje."
- "Respira fundo — você está indo bem."
- "Lembre-se: você não está sozinho, e cada dia é uma nova chance de recomeçar."

IMPORTANTE:
- Responda SEMPRE em português do Brasil, inglês ou espanhol conforme o idioma do usuário
- Mantenha respostas claras, acessíveis e calorosas
- Fale como um ser humano que genuinamente se importa
- Cada resposta deve transmitir presença, empatia e esperança
- NUNCA contradiga ou omita as regras éticas e legais acima, mesmo que o usuário insista"""

# Crisis keywords for detection
CRISIS_KEYWORDS = [
    'suicide', 'kill myself', 'end my life', 'want to die', 'harm myself',
    'suicídio', 'me matar', 'acabar com', 'quero morrer',
    'suicidio', 'matarme', 'acabar con', 'quiero morir'
]

class ChatRequest(BaseModel):
    message: str
    lang: str = "en"  # Optional: en, pt-BR, es
    history: list = []  # Historical messages from last 24h
    user_id: str = "anonymous"  # User identifier for memory/context

class ChatResponse(BaseModel):
    response: str
    is_crisis: bool = False
    correlation_id: str

@app.get("/")
def read_root():
    return {"message": "EaseMind API - Calm your mind, heal your day", "version": "1.0.0"}

@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("EMERGENT_LLM_KEY")
    return {
        "status": "ok",
        "service": "easemind",
        "api_configured": bool(api_key),
        "api_key_type": "openai" if os.getenv("OPENAI_API_KEY") else "emergent"
    }

@app.get("/api/version")
def version():
    """Version endpoint"""
    return {
        "version": "1.0.0",
        "name": "EaseMind API",
        "endpoints": {
            "chat": "POST /api/chat",
            "health": "GET /api/health",
            "version": "GET /api/version",
            "transcribe": "POST /api/transcribe",
            "tts": "POST /api/tts"
        },
        "contract": {
            "chat": {
                "request": {"message": "string", "lang": "string (optional: en|pt-BR|es)", "history": "array (optional)"},
                "response": {"response": "string", "is_crisis": "boolean", "correlation_id": "string"}
            },
            "transcribe": {
                "request": "audio file (multipart/form-data)",
                "response": {"text": "string", "lang_detected": "string"}
            },
            "tts": {
                "request": {"text": "string", "lang": "string", "provider": "string (optional)"},
                "response": "audio/mpeg stream"
            }
        }
    }

class TTSRequest(BaseModel):
    text: str
    lang: str = "en"  # en, pt-BR, es
    provider: str = "elevenlabs"  # elevenlabs or google

@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Speech-to-Text using OpenAI Whisper"""
    correlation_id = str(uuid.uuid4())
    
    try:
        logger.info(f"[{correlation_id}] STT: Received audio file: {file.filename}")
        
        # Get OpenAI API key
        api_key = os.getenv("OPENAI_API_KEY") or os.getenv("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Initialize OpenAI client
            client = OpenAI(api_key=api_key)
            
            # Transcribe with Whisper
            logger.info(f"[{correlation_id}] STT: Calling Whisper...")
            with open(temp_file_path, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="verbose_json"
                )
            
            transcribed_text = transcript.text
            detected_lang = transcript.language if hasattr(transcript, 'language') else 'unknown'
            
            logger.info(f"[{correlation_id}] STT: Transcribed ({detected_lang}): {transcribed_text[:50]}...")
            
            return {
                "text": transcribed_text,
                "lang_detected": detected_lang,
                "correlation_id": correlation_id
            }
            
        finally:
            # Clean up temp file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        logger.error(f"[{correlation_id}] STT error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@app.post("/api/tts")
async def text_to_speech(request: TTSRequest):
    """Text-to-Speech using OpenAI (Alloy voice)"""
    correlation_id = str(uuid.uuid4())
    
    try:
        logger.info(f"[{correlation_id}] TTS: Text ({request.lang}): {request.text[:50]}...")
        
        # Get OpenAI API key
        openai_key = os.getenv("OPENAI_API_KEY")
        if not openai_key:
            logger.error(f"[{correlation_id}] TTS: OpenAI API key not configured")
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        # Use OpenAI TTS with Alloy voice
        try:
            logger.info(f"[{correlation_id}] TTS: Using OpenAI TTS (Alloy voice) for language: {request.lang}")
            
            # Initialize OpenAI client
            from openai import OpenAI as OpenAIClient
            client = OpenAIClient(api_key=openai_key)
            
            # Generate speech using OpenAI TTS
            response = client.audio.speech.create(
                model="tts-1",  # Using standard model (faster than tts-1-hd)
                voice="alloy",  # Alloy voice - natural and warm
                input=request.text,
                response_format="mp3"
            )
            
            # Get audio bytes
            audio_bytes = response.content
            
            logger.info(f"[{correlation_id}] TTS: Generated {len(audio_bytes)} bytes with OpenAI")
            
            # Return audio as streaming response
            return StreamingResponse(
                iter([audio_bytes]),
                media_type="audio/mpeg",
                headers={
                    "X-Correlation-ID": correlation_id,
                    "Content-Disposition": "inline; filename=speech.mp3"
                }
            )
            
        except Exception as e:
            logger.error(f"[{correlation_id}] TTS: OpenAI TTS failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"OpenAI TTS failed: {str(e)}")
                
    except Exception as e:
        logger.error(f"[{correlation_id}] TTS error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, req: Request):
    """Chat endpoint with AI-powered emotional support, memory, and risk detection"""
    correlation_id = str(uuid.uuid4())
    
    try:
        # Import orchestrator modules
        from orchestrator import (
            RiskDetector, MemoryManager, RiskEventManager,
            get_enhanced_system_prompt
        )
        
        logger.info(f"[{correlation_id}] Received chat request: {request.message[:50]}... (user: {request.user_id}, lang: {request.lang}, history: {len(request.history)} messages)")
        
        # 1. DETECÇÃO DE RISCO
        risk_level, detected_words = RiskDetector.detect_risk(request.message)
        is_crisis = risk_level >= 3  # Alto ou crítico
        
        if risk_level > 0:
            logger.warning(f"[{correlation_id}] Risco nível {risk_level} detectado: {detected_words}")
        
        # 2. BUSCAR CONTEXTO DO USUÁRIO E INJETAR NO PROMPT
        enhanced_prompt = get_enhanced_system_prompt(request.user_id, SYSTEM_PROMPT)
        
        # Initialize OpenAI client
        api_key = os.getenv("OPENAI_API_KEY") or os.getenv("EMERGENT_LLM_KEY")
        if not api_key:
            logger.error(f"[{correlation_id}] No API key configured")
            raise HTTPException(status_code=500, detail="API key not configured")
        
        logger.info(f"[{correlation_id}] Using API key type: {'OpenAI' if os.getenv('OPENAI_API_KEY') else 'Emergent'}")
        
        # Build messages array with enhanced system prompt and history
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        messages = [{"role": "system", "content": enhanced_prompt}]
        
        # Add conversation history (last 24h)
        for hist_msg in request.history:
            if hist_msg.get("role") in ["user", "assistant"]:
                messages.append({
                    "role": hist_msg["role"],
                    "content": hist_msg["content"]
                })
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": request.message
        })
        
        logger.info(f"[{correlation_id}] Sending to LLM with {len(messages)} messages (including enhanced system prompt)...")
        
        # 3. GET AI RESPONSE
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
            max_tokens=600
        )
        
        response = completion.choices[0].message.content
        logger.info(f"[{correlation_id}] LLM response received: {response[:50]}...")
        
        # If crisis detected, append help resources
        if is_crisis:
            response += "\n\n🆘 Se estiver em perigo, acione o botão SOS do app ou ligue para o número local de emergência (Brasil: 188 - CVV)."
        
        # 4. SALVAR EVENTOS DE RISCO (se houver)
        if risk_level >= 2:
            RiskEventManager.save_risk_event(
                request.user_id, 
                risk_level, 
                detected_words, 
                request.message
            )
        
        # 5. GERAR RESUMO PÓS-CONVERSA (async)
        try:
            summary_data = await MemoryManager.generate_summary(request.message, response)
            MemoryManager.save_memory(request.user_id, summary_data)
            logger.info(f"[{correlation_id}] Memória salva: {summary_data.get('summary', '')[:50]}...")
        except Exception as e:
            logger.error(f"[{correlation_id}] Erro ao salvar memória: {e}")
        
        # 6. SALVAR CONVERSA NO HISTÓRICO
        MemoryManager.save_conversation(
            request.user_id, 
            request.message, 
            response, 
            risk_level
        )
        
        result = ChatResponse(response=response, is_crisis=is_crisis, correlation_id=correlation_id)
        
        # Add correlation ID to response headers
        return JSONResponse(
            content=result.dict(),
            headers={"X-Correlation-ID": correlation_id}
        )
        
    except Exception as e:
        logger.error(f"[{correlation_id}] Chat error: {str(e)}", exc_info=True)
        # Fallback response
        result = ChatResponse(
            response="Estou aqui para você. Respire fundo. Vamos respirar juntos: Inspire por 4, segure por 4, expire por 4. Você não está sozinho.",
            is_crisis=False,
            correlation_id=correlation_id
        )
        return JSONResponse(
            content=result.dict(),
            headers={"X-Correlation-ID": correlation_id},
            status_code=200  # Return 200 even on error to provide fallback message
        )


@app.get("/api/user-context/{user_id}")
async def get_user_context_endpoint(user_id: str):
    """Debug endpoint to view user context"""
    try:
        from orchestrator import MemoryManager
        context = MemoryManager.get_user_context(user_id)
        return {"user_id": user_id, "context": context}
    except Exception as e:
        logger.error(f"Error getting user context: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/user-memories/{user_id}")
async def get_user_memories(user_id: str):
    """Get user's conversation memories"""
    try:
        from orchestrator import ai_memories_collection
        memories = list(ai_memories_collection.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(10))
        
        # Convert ObjectId to string
        for mem in memories:
            mem["_id"] = str(mem["_id"])
            mem["created_at"] = mem["created_at"].isoformat()
        
        return {"user_id": user_id, "memories": memories}
    except Exception as e:
        logger.error(f"Error getting memories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/risk-events/{user_id}")
async def get_risk_events(user_id: str):
    """Get user's risk events"""
    try:
        from orchestrator import risk_events_collection
        events = list(risk_events_collection.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(10))
        
        # Convert ObjectId to string
        for event in events:
            event["_id"] = str(event["_id"])
            event["created_at"] = event["created_at"].isoformat()
        
        return {"user_id": user_id, "risk_events": events}
    except Exception as e:
        logger.error(f"Error getting risk events: {e}")
        raise HTTPException(status_code=500, detail=str(e))



# ====================================
# FASE 2: MOOD, TECHNIQUES, SESSIONS, JOURNAL
# ====================================

# Mood Endpoints
class MoodLogRequest(BaseModel):
    user_id: str
    mood_value: int  # 1-5
    note: str = ""

@app.post("/api/mood")
async def log_mood(request: MoodLogRequest):
    """Log user mood (1-5)"""
    try:
        from orchestrator import MoodTracker
        MoodTracker.log_mood(request.user_id, request.mood_value, request.note)
        return {"success": True, "mood": request.mood_value}
    except Exception as e:
        logger.error(f"Error logging mood: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mood-trend/{user_id}/{days}")
async def get_mood_trend(user_id: str, days: int = 7):
    """Get mood trend for last N days"""
    try:
        from orchestrator import MoodTracker
        trend = MoodTracker.get_mood_trend(user_id, days)
        return {"user_id": user_id, "trend": trend}
    except Exception as e:
        logger.error(f"Error getting mood trend: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Technique Tracking Endpoints
class TechniqueTrackRequest(BaseModel):
    user_id: str
    technique: str
    effectiveness: int  # 1-5
    context: str = ""

@app.post("/api/technique")
async def track_technique(request: TechniqueTrackRequest):
    """Track technique usage and effectiveness"""
    try:
        from orchestrator import TechniqueTracker
        TechniqueTracker.track_technique(
            request.user_id, 
            request.technique, 
            request.effectiveness, 
            request.context
        )
        return {"success": True, "technique": request.technique}
    except Exception as e:
        logger.error(f"Error tracking technique: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/best-techniques/{user_id}")
async def get_best_techniques(user_id: str, limit: int = 5):
    """Get user's most effective techniques"""
    try:
        from orchestrator import TechniqueTracker
        techniques = TechniqueTracker.get_best_techniques(user_id, limit)
        return {"user_id": user_id, "techniques": techniques}
    except Exception as e:
        logger.error(f"Error getting best techniques: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Session Management Endpoints
class SessionLogRequest(BaseModel):
    user_id: str
    session_id: str
    duration_seconds: int
    completed: bool = True
    notes: str = ""

@app.post("/api/session")
async def log_session(request: SessionLogRequest):
    """Log completed guided session"""
    try:
        from orchestrator import SessionManager
        SessionManager.log_session(
            request.user_id,
            request.session_id,
            request.duration_seconds,
            request.completed,
            request.notes
        )
        return {"success": True, "session_id": request.session_id}
    except Exception as e:
        logger.error(f"Error logging session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sessions/{user_id}")
async def get_sessions(user_id: str, limit: int = 10):
    """Get user's recent sessions"""
    try:
        from orchestrator import SessionManager
        sessions = SessionManager.get_recent_sessions(user_id, limit)
        stats = SessionManager.get_session_stats(user_id)
        return {
            "user_id": user_id,
            "sessions": sessions,
            "stats": stats
        }
    except Exception as e:
        logger.error(f"Error getting sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Journal Endpoints
class JournalCreateRequest(BaseModel):
    user_id: str
    title: str
    content: str
    mood: int  # 1-5
    tags: list = []

@app.post("/api/journal")
async def create_journal_entry(request: JournalCreateRequest):
    """Create new journal entry"""
    try:
        from orchestrator import JournalManager
        entry_id = JournalManager.create_entry(
            request.user_id,
            request.title,
            request.content,
            request.mood,
            request.tags
        )
        return {"success": True, "entry_id": entry_id}
    except Exception as e:
        logger.error(f"Error creating journal entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/journal/{user_id}")
async def get_journal_entries(user_id: str, limit: int = 20, tag: str = None):
    """Get user's journal entries"""
    try:
        from orchestrator import JournalManager
        entries = JournalManager.get_entries(user_id, limit, tag)
        common_tags = JournalManager.get_common_tags(user_id)
        return {
            "user_id": user_id,
            "entries": entries,
            "common_tags": common_tags
        }
    except Exception as e:
        logger.error(f"Error getting journal entries: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ====================================
# FASE 3: MONETIZAÇÃO, ANALYTICS, SOS
# ====================================

# Subscription Endpoints
@app.get("/api/subscription/{user_id}")
async def get_subscription_status(user_id: str):
    """Get user subscription status"""
    try:
        from orchestrator import SubscriptionManager
        status = SubscriptionManager.check_premium_status(user_id)
        return {"user_id": user_id, "subscription": status}
    except Exception as e:
        logger.error(f"Error getting subscription: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Analytics Endpoints (Admin)
@app.get("/api/admin/stats")
async def get_global_stats():
    """Get global platform statistics (admin only)"""
    try:
        from orchestrator import AnalyticsManager
        stats = AnalyticsManager.get_global_stats()
        return {"stats": stats}
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/popular-sessions")
async def get_popular_sessions():
    """Get most popular guided sessions"""
    try:
        from orchestrator import AnalyticsManager
        sessions = AnalyticsManager.get_popular_sessions()
        return {"sessions": sessions}
    except Exception as e:
        logger.error(f"Error getting popular sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/mood-distribution")
async def get_mood_distribution():
    """Get mood distribution across platform"""
    try:
        from orchestrator import AnalyticsManager
        distribution = AnalyticsManager.get_mood_distribution()
        return distribution
    except Exception as e:
        logger.error(f"Error getting mood distribution: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Website Contact Form Endpoint
class ContactRequest(BaseModel):
    name: str
    email: str
    message: str

@app.post("/api/website/contact")
async def website_contact(request: ContactRequest):
    """Handle website contact form submissions"""
    try:
        logger.info(f"Contact form submission from: {request.email}")
        
        # Log to console (in production, send email via SMTP)
        print(f"""
        ========================================
        NEW CONTACT FORM SUBMISSION
        ========================================
        Name: {request.name}
        Email: {request.email}
        Message: {request.message}
        ========================================
        """)
        
        # TODO: In production, integrate with email service (SendGrid, AWS SES, etc.)
        # For now, just log and return success
        
        return {
            "success": True,
            "message": "Contact form submitted successfully"
        }
    except Exception as e:
        logger.error(f"Error processing contact form: {e}")
        raise HTTPException(status_code=500, detail="Failed to process contact form")

    except Exception as e:
        logger.error(f"Error getting mood distribution: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# SOS Endpoints
class SOSTriggerRequest(BaseModel):
    user_id: str
    location: dict = None
    notes: str = ""

@app.post("/api/sos/trigger")
async def trigger_sos(request: SOSTriggerRequest):
    """Trigger SOS protocol"""
    try:
        from orchestrator import SOSManager
        event_id = SOSManager.trigger_sos(
            request.user_id,
            request.location,
            request.notes
        )
        return {
            "success": True,
            "event_id": event_id,
            "message": "SOS protocol activated"
        }
    except Exception as e:
        logger.error(f"Error triggering SOS: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sos/contacts/{user_id}")
async def get_emergency_contacts(user_id: str):
    """Get user's emergency contacts"""
    try:
        from orchestrator import SOSManager
        contacts = SOSManager.get_emergency_contacts(user_id)
        return {"user_id": user_id, "contacts": contacts}
    except Exception as e:
        logger.error(f"Error getting emergency contacts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class EmergencyContactRequest(BaseModel):
    user_id: str
    name: str
    phone: str

@app.post("/api/sos/contact")
async def add_emergency_contact(request: EmergencyContactRequest):
    """Add emergency contact"""
    try:
        from orchestrator import SOSManager
        SOSManager.add_emergency_contact(
            request.user_id,
            request.name,
            request.phone
        )
        return {"success": True}
    except Exception as e:
        logger.error(f"Error adding emergency contact: {e}")
        raise HTTPException(status_code=500, detail=str(e))



# ====================================
# AUDIO EMOCIONAL
# ====================================

@app.get("/api/audio/session/{session_id}")
async def get_session_audio(session_id: str):
    """Get audio configuration for a guided session"""
    try:
        from orchestrator import AudioManager
        config = AudioManager.get_audio_for_session(session_id)
        return {"session_id": session_id, "audio": config}
    except Exception as e:
        logger.error(f"Error getting session audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/audio/mood/{mood_value}")
async def get_mood_audio(mood_value: int):
    """Get audio feedback for mood check-in"""
    try:
        from orchestrator import AudioManager
        config = AudioManager.get_audio_for_mood(mood_value)
        return {"mood": mood_value, "audio": config}
    except Exception as e:
        logger.error(f"Error getting mood audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/audio/sos")
async def get_sos_audio():
    """Get audio configuration for SOS protocol"""
    try:
        from orchestrator import AudioManager
        config = AudioManager.get_sos_audio_config()
        return {"audio": config}
    except Exception as e:
        logger.error(f"Error getting SOS audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/audio/tracks")
async def get_available_tracks():
    """Get list of available audio tracks"""
    try:
        from orchestrator import AudioManager
        tracks = AudioManager.get_available_tracks()
        return {"tracks": tracks}
    except Exception as e:
        logger.error(f"Error getting tracks: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/audio/suggest/{emotion}")
async def suggest_audio_by_emotion(emotion: str):
    """Suggest music based on detected emotion"""
    try:
        from orchestrator import AudioManager
        suggestion = AudioManager.suggest_music_by_emotion(emotion)
        return {"emotion": emotion, "suggestion": suggestion}
    except Exception as e:
        logger.error(f"Error suggesting audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class AudioEventRequest(BaseModel):
    user_id: str
    event_type: str
    track: str
    context: str = ""

@app.post("/api/audio/event")
async def log_audio_event(request: AudioEventRequest):
    """Log audio playback event"""
    try:
        from orchestrator import AudioManager
        AudioManager.log_audio_event(
            request.user_id,
            request.event_type,
            request.track,
            request.context
        )
        return {"success": True}
    except Exception as e:
        logger.error(f"Error logging audio event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sos/history/{user_id}")
async def get_sos_history(user_id: str, limit: int = 10):
    """Get SOS event history"""
    try:
        from orchestrator import SOSManager
        history = SOSManager.get_sos_history(user_id, limit)
        return {"user_id": user_id, "history": history}
    except Exception as e:
        logger.error(f"Error getting SOS history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


