"""
EaseMind Orchestrator - Sistema de Memória, Contexto e Detecção de Risco
Gerencia interações entre usuário, Luna (IA) e banco de dados MongoDB
"""

from pymongo import MongoClient
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import os
import re
from emergentintegrations.llm.chat import LlmChat, UserMessage
import logging

logger = logging.getLogger(__name__)

# Conexão com MongoDB
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = MongoClient(MONGO_URL)
db = client.easemind

# Collections
users_collection = db.users
conversations_collection = db.conversations
ai_memories_collection = db.ai_memories
risk_events_collection = db.risk_events
mood_logs_collection = db.mood_logs
sessions_completed_collection = db.sessions_completed
journal_entries_collection = db.journal_entries
techniques_tracking_collection = db.techniques_tracking


class RiskDetector:
    """Detecta sinais de risco nas mensagens do usuário"""
    
    # Palavras-chave de risco (em português)
    CRITICAL_KEYWORDS = [
        "suicídio", "suicidar", "me matar", "acabar com tudo", "não aguento mais",
        "não vale a pena viver", "quero morrer", "vou me matar", "quero sumir",
        "acabar com minha vida", "prefiro morrer", "melhor morto"
    ]
    
    HIGH_RISK_KEYWORDS = [
        "desesperado", "sem saída", "sem esperança", "desistir", "não consigo mais",
        "acabou", "me machucar", "autoagressão", "me cortar", "me ferir"
    ]
    
    MODERATE_RISK_KEYWORDS = [
        "muito triste", "muito ansioso", "muito mal", "péssimo", "horrível",
        "pânico", "desespero", "sozinho", "ninguém liga", "abandono"
    ]
    
    @staticmethod
    def detect_risk(message: str) -> Tuple[int, List[str]]:
        """
        Detecta nível de risco na mensagem
        
        Returns:
            Tuple[int, List[str]]: (nível de risco, palavras detectadas)
            Níveis: 0=nenhum, 1=baixo, 2=moderado, 3=alto, 4=crítico
        """
        message_lower = message.lower()
        detected_words = []
        
        # Verificar palavras críticas
        for keyword in RiskDetector.CRITICAL_KEYWORDS:
            if keyword in message_lower:
                detected_words.append(keyword)
                return (4, detected_words)  # Risco crítico
        
        # Verificar palavras de alto risco
        for keyword in RiskDetector.HIGH_RISK_KEYWORDS:
            if keyword in message_lower:
                detected_words.append(keyword)
        
        if detected_words:
            return (3, detected_words)  # Risco alto
        
        # Verificar palavras de risco moderado
        for keyword in RiskDetector.MODERATE_RISK_KEYWORDS:
            if keyword in message_lower:
                detected_words.append(keyword)
        
        if len(detected_words) >= 2:
            return (2, detected_words)  # Risco moderado
        elif len(detected_words) == 1:
            return (1, detected_words)  # Risco baixo
        
        return (0, [])  # Sem risco


class MemoryManager:
    """Gerencia memórias e contexto do usuário"""
    
    @staticmethod
    def get_user_context(user_id: str) -> Dict:
        """
        Busca contexto completo do usuário para injetar no prompt
        
        Returns:
            Dict com perfil, memórias, humor, técnicas eficazes
        """
        # Buscar perfil do usuário
        user = users_collection.find_one({"user_id": user_id})
        if not user:
            # Criar usuário básico se não existir
            user = {
                "user_id": user_id,
                "display_name": "Usuário",
                "language": "pt-BR",
                "country": "BR",
                "goals": [],
                "prefers_voice": True,
                "created_at": datetime.utcnow()
            }
            users_collection.insert_one(user)
        
        # Buscar últimas 3 memórias
        memories = list(ai_memories_collection.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(3))
        
        memory_texts = [
            mem.get("summary", "Nenhuma memória anterior")
            for mem in memories
        ]
        while len(memory_texts) < 3:
            memory_texts.append("Nenhuma memória")
        
        # Buscar humor dos últimos 7 e 30 dias
        mood_7d = MoodTracker.get_mood_trend(user_id, days=7)
        mood_30d = MoodTracker.get_mood_trend(user_id, days=30)
        
        # Buscar técnicas mais eficazes
        best_techniques_data = TechniqueTracker.get_best_techniques(user_id, limit=3)
        best_techniques = ", ".join([f"{t['technique']} ({t['effectiveness']}/5)" for t in best_techniques_data]) if best_techniques_data else "Ainda descobrindo"
        
        # Buscar sessões recentes
        recent_sessions = SessionManager.get_recent_sessions(user_id, limit=3)
        sessions_text = ", ".join([s["session_id"] for s in recent_sessions]) if recent_sessions else "Nenhuma sessão recente"
        
        return {
            "user_profile": {
                "display_name": user.get("display_name", "Usuário"),
                "language": user.get("language", "pt-BR"),
                "country": user.get("country", "BR"),
                "goals": ", ".join(user.get("goals", [])) or "Não definidos",
                "prefers_voice": user.get("prefers_voice", True)
            },
            "ai_memories": {
                "last_1": memory_texts[0],
                "last_2": memory_texts[1],
                "last_3": memory_texts[2]
            },
            "user_trends": {
                "mood_7d": f"{mood_7d['average']}/5 ({mood_7d['trend']}, {mood_7d['count']} registros)",
                "mood_30d": f"{mood_30d['average']}/5 ({mood_30d['trend']}, {mood_30d['count']} registros)"
            },
            "user_best_techniques": best_techniques,
            "sessions": {
                "recent_list": "Nenhuma sessão recente"
            }
        }
    
    @staticmethod
    def inject_context_in_prompt(base_prompt: str, context: Dict) -> str:
        """
        Injeta o contexto dinâmico no prompt da Luna
        """
        context_section = f"""

[CONTEXTO DO USUÁRIO]
Perfil: {context['user_profile']['display_name']}, idioma {context['user_profile']['language']}, país {context['user_profile']['country']}
Objetivos: {context['user_profile']['goals']}
Prefere voz: {context['user_profile']['prefers_voice']}

Últimas memórias:
1) {context['ai_memories']['last_1']}
2) {context['ai_memories']['last_2']}
3) {context['ai_memories']['last_3']}

Humor médio (7 dias): {context['user_trends']['mood_7d']}
Técnicas mais eficazes: {context['user_best_techniques']}
Sessões recentes: {context['sessions']['recent_list']}

Use esse contexto para personalizar a conversa sem revelar dados diretamente.
"""
        return base_prompt + context_section
    
    @staticmethod
    async def generate_summary(user_message: str, luna_response: str) -> Dict:
        """
        Gera resumo automático da conversa usando IA
        
        Returns:
            Dict com summary, tags, importance
        """
        try:
            # Criar prompt para resumo
            summary_prompt = f"""Resuma esta conversa de forma ética e prática em até 150 caracteres:

Usuário: {user_message}
Luna: {luna_response}

Liste em formato JSON:
- summary: resumo curto
- tags: array de 2-3 tags (ex: ["ansiedade", "respiração"])
- techniques_worked: técnicas mencionadas que ajudaram (ex: ["4-7-8", "diário"])
- next_step: próximo passo sugerido (curto)
- importance: 1 (baixa), 2 (média) ou 3 (alta)

Sem diagnóstico, sem PII, sem citações diretas."""

            # Usar OpenAI diretamente
            import os
            from openai import OpenAI
            
            api_key = os.getenv("OPENAI_API_KEY") or os.getenv("EMERGENT_LLM_KEY")
            client = OpenAI(api_key=api_key)
            
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Você é um assistente que gera resumos éticos e práticos de conversas terapêuticas."},
                    {"role": "user", "content": summary_prompt}
                ],
                temperature=0.3,
                max_tokens=300
            )
            
            response = completion.choices[0].message.content
            
            # Parse JSON (simplificado)
            import json
            try:
                summary_data = json.loads(response)
            except:
                # Fallback se JSON falhar
                summary_data = {
                    "summary": user_message[:100],
                    "tags": ["conversa"],
                    "techniques_worked": [],
                    "next_step": "Continuar conversando",
                    "importance": 1
                }
            
            return summary_data
            
        except Exception as e:
            logger.error(f"Erro ao gerar resumo: {e}")
            return {
                "summary": user_message[:100],
                "tags": ["conversa"],
                "techniques_worked": [],
                "next_step": "Continuar",
                "importance": 1
            }
    
    @staticmethod
    def save_memory(user_id: str, summary_data: Dict):
        """Salva nova memória no banco"""
        memory = {
            "user_id": user_id,
            "summary": summary_data.get("summary", ""),
            "tags": summary_data.get("tags", []),
            "techniques_worked": summary_data.get("techniques_worked", []),
            "next_step": summary_data.get("next_step", ""),
            "importance": summary_data.get("importance", 1),
            "created_at": datetime.utcnow()
        }
        ai_memories_collection.insert_one(memory)
        
        # Manter apenas as últimas 20 memórias
        memories = list(ai_memories_collection.find(
            {"user_id": user_id}
        ).sort("created_at", -1))
        
        if len(memories) > 20:
            old_memories = memories[20:]
            for old_mem in old_memories:
                ai_memories_collection.delete_one({"_id": old_mem["_id"]})
    
    @staticmethod
    def save_conversation(user_id: str, user_message: str, luna_response: str, risk_level: int):
        """Salva conversa no histórico"""
        conversation = {
            "user_id": user_id,
            "user_message": user_message,
            "luna_response": luna_response,
            "risk_level": risk_level,
            "created_at": datetime.utcnow()
        }
        conversations_collection.insert_one(conversation)


class MoodTracker:
    """Gerencia registro e análise de humor do usuário"""
    
    @staticmethod
    def log_mood(user_id: str, mood_value: int, note: str = ""):
        """
        Registra humor do usuário (1-5)
        1 = Muito mal, 2 = Mal, 3 = Neutro, 4 = Bem, 5 = Muito bem
        """
        mood_log = {
            "user_id": user_id,
            "mood_value": mood_value,
            "note": note,
            "created_at": datetime.utcnow()
        }
        mood_logs_collection.insert_one(mood_log)
        logger.info(f"📊 Humor registrado: {user_id} = {mood_value}/5")
    
    @staticmethod
    def get_mood_trend(user_id: str, days: int = 7) -> Dict:
        """
        Calcula tendência de humor dos últimos N dias
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        mood_logs = list(mood_logs_collection.find({
            "user_id": user_id,
            "created_at": {"$gte": cutoff_date}
        }).sort("created_at", -1))
        
        if not mood_logs:
            return {
                "average": 0,
                "trend": "sem_dados",
                "count": 0,
                "days": days
            }
        
        # Calcular média
        avg_mood = sum(log["mood_value"] for log in mood_logs) / len(mood_logs)
        
        # Calcular tendência (comparar primeira metade vs segunda metade)
        mid_point = len(mood_logs) // 2
        if mid_point > 0:
            first_half_avg = sum(log["mood_value"] for log in mood_logs[:mid_point]) / mid_point
            second_half_avg = sum(log["mood_value"] for log in mood_logs[mid_point:]) / (len(mood_logs) - mid_point)
            
            if second_half_avg > first_half_avg + 0.5:
                trend = "melhorando"
            elif second_half_avg < first_half_avg - 0.5:
                trend = "piorando"
            else:
                trend = "estavel"
        else:
            trend = "insuficiente"
        
        return {
            "average": round(avg_mood, 1),
            "trend": trend,
            "count": len(mood_logs),
            "days": days
        }


class TechniqueTracker:
    """Rastreia técnicas usadas e sua efetividade"""
    
    # Lista de técnicas conhecidas
    KNOWN_TECHNIQUES = [
        "respiracao_4_7_8", "box_breathing", "grounding_5_4_3_2_1",
        "diario", "meditacao", "relaxamento_muscular", "gratidao",
        "caminhada", "exercicio", "musica", "conversar"
    ]
    
    @staticmethod
    def track_technique(user_id: str, technique: str, effectiveness: int, context: str = ""):
        """
        Registra uso de uma técnica e sua efetividade
        effectiveness: 1-5 (1=não ajudou, 5=ajudou muito)
        """
        tracking = {
            "user_id": user_id,
            "technique": technique.lower().replace(" ", "_"),
            "effectiveness": effectiveness,
            "context": context,
            "created_at": datetime.utcnow()
        }
        techniques_tracking_collection.insert_one(tracking)
        logger.info(f"🎯 Técnica registrada: {technique} = {effectiveness}/5")
    
    @staticmethod
    def get_best_techniques(user_id: str, limit: int = 5) -> List[Dict]:
        """
        Retorna as técnicas mais eficazes para o usuário
        """
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {
                "_id": "$technique",
                "avg_effectiveness": {"$avg": "$effectiveness"},
                "count": {"$sum": 1}
            }},
            {"$match": {"count": {"$gte": 2}}},  # Pelo menos 2 usos
            {"$sort": {"avg_effectiveness": -1}},
            {"$limit": limit}
        ]
        
        results = list(techniques_tracking_collection.aggregate(pipeline))
        return [{
            "technique": r["_id"],
            "effectiveness": round(r["avg_effectiveness"], 1),
            "uses": r["count"]
        } for r in results]


class SessionManager:
    """Gerencia sessões guiadas completadas"""
    
    @staticmethod
    def log_session(user_id: str, session_id: str, duration_seconds: int, completed: bool = True, notes: str = ""):
        """
        Registra uma sessão guiada completada
        """
        session = {
            "user_id": user_id,
            "session_id": session_id,
            "duration_seconds": duration_seconds,
            "completed": completed,
            "notes": notes,
            "created_at": datetime.utcnow()
        }
        sessions_completed_collection.insert_one(session)
        logger.info(f"🧘 Sessão registrada: {session_id} ({duration_seconds}s)")
    
    @staticmethod
    def get_recent_sessions(user_id: str, limit: int = 10) -> List[Dict]:
        """
        Retorna sessões recentes do usuário
        """
        sessions = list(sessions_completed_collection.find(
            {"user_id": user_id, "completed": True}
        ).sort("created_at", -1).limit(limit))
        
        return [{
            "session_id": s["session_id"],
            "duration": s["duration_seconds"],
            "date": s["created_at"].isoformat()
        } for s in sessions]
    
    @staticmethod
    def get_session_stats(user_id: str) -> Dict:
        """
        Estatísticas de sessões do usuário
        """
        total = sessions_completed_collection.count_documents({
            "user_id": user_id,
            "completed": True
        })
        
        # Últimos 7 dias
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent = sessions_completed_collection.count_documents({
            "user_id": user_id,
            "completed": True,
            "created_at": {"$gte": seven_days_ago}
        })
        
        # Duração total
        pipeline = [
            {"$match": {"user_id": user_id, "completed": True}},
            {"$group": {"_id": None, "total_duration": {"$sum": "$duration_seconds"}}}
        ]
        duration_result = list(sessions_completed_collection.aggregate(pipeline))
        total_duration = duration_result[0]["total_duration"] if duration_result else 0
        
        return {
            "total_sessions": total,
            "sessions_last_7_days": recent,
            "total_minutes": round(total_duration / 60, 1)
        }


class JournalManager:
    """Gerencia entradas de diário"""
    
    @staticmethod
    def create_entry(user_id: str, title: str, content: str, mood: int, tags: List[str] = None):
        """
        Cria nova entrada de diário
        """
        entry = {
            "user_id": user_id,
            "title": title,
            "content": content,
            "mood": mood,
            "tags": tags or [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = journal_entries_collection.insert_one(entry)
        logger.info(f"📓 Entrada de diário criada: {title}")
        return str(result.inserted_id)
    
    @staticmethod
    def get_entries(user_id: str, limit: int = 20, tag: str = None) -> List[Dict]:
        """
        Busca entradas de diário do usuário
        """
        query = {"user_id": user_id}
        if tag:
            query["tags"] = tag
        
        entries = list(journal_entries_collection.find(query).sort("created_at", -1).limit(limit))
        
        return [{
            "id": str(e["_id"]),
            "title": e["title"],
            "content": e["content"],
            "mood": e["mood"],
            "tags": e["tags"],
            "date": e["created_at"].isoformat()
        } for e in entries]
    
    @staticmethod
    def get_common_tags(user_id: str, limit: int = 10) -> List[Dict]:
        """
        Retorna tags mais usadas pelo usuário
        """
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$unwind": "$tags"},
            {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": limit}
        ]
        
        results = list(journal_entries_collection.aggregate(pipeline))
        return [{"tag": r["_id"], "count": r["count"]} for r in results]





class SubscriptionManager:
    """Gerencia assinaturas e status premium (preparado para RevenueCat)"""
    
    @staticmethod
    def check_premium_status(user_id: str) -> Dict:
        """
        Verifica se usuário tem acesso premium
        Por enquanto, todos têm acesso (preparado para RevenueCat)
        """
        user = users_collection.find_one({"user_id": user_id})
        
        if not user:
            return {
                "is_premium": False,
                "plan": "free",
                "features": ["basic_chat", "panic_button"]
            }
        
        # Por enquanto todos têm acesso premium (MVP)
        # Futuramente integrar com RevenueCat
        return {
            "is_premium": True,
            "plan": "premium_trial",
            "features": [
                "basic_chat",
                "panic_button",
                "guided_sessions",
                "journal",
                "mood_tracking",
                "ai_memory",
                "voice_chat"
            ],
            "trial_days_remaining": 30
        }
    
    @staticmethod
    def log_subscription_event(user_id: str, event_type: str, details: Dict):
        """
        Registra eventos de assinatura (compra, cancelamento, renovação)
        Preparado para integração com RevenueCat webhooks
        """
        event = {
            "user_id": user_id,
            "event_type": event_type,  # purchase, cancel, renew, trial_start
            "details": details,
            "created_at": datetime.utcnow()
        }
        db.subscription_events.insert_one(event)
        logger.info(f"💸 Subscription event: {user_id} - {event_type}")


class AnalyticsManager:
    """Gerencia analytics agregados e anônimos para admin"""
    
    @staticmethod
    def get_global_stats() -> Dict:
        """
        Estatísticas globais da plataforma (anônimas e agregadas)
        """
        from datetime import datetime, timedelta
        
        # Total de usuários
        total_users = users_collection.count_documents({})
        
        # Usuários ativos (últimos 7 dias)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        active_users_7d = conversations_collection.distinct("user_id", {
            "created_at": {"$gte": seven_days_ago}
        })
        
        # Total de conversas
        total_conversations = conversations_collection.count_documents({})
        
        # Total de sessões guiadas
        total_sessions = sessions_completed_collection.count_documents({"completed": True})
        
        # Total de entradas de diário
        total_journal_entries = journal_entries_collection.count_documents({})
        
        # Eventos de risco (últimos 30 dias)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        risk_events_30d = risk_events_collection.count_documents({
            "created_at": {"$gte": thirty_days_ago}
        })
        
        # Distribuição de humor médio
        mood_pipeline = [
            {"$group": {
                "_id": None,
                "avg_mood": {"$avg": "$mood_value"},
                "total_logs": {"$sum": 1}
            }}
        ]
        mood_result = list(mood_logs_collection.aggregate(mood_pipeline))
        avg_mood = mood_result[0]["avg_mood"] if mood_result else 0
        
        return {
            "users": {
                "total": total_users,
                "active_7d": len(active_users_7d),
                "retention_rate": round(len(active_users_7d) / total_users * 100, 1) if total_users > 0 else 0
            },
            "engagement": {
                "total_conversations": total_conversations,
                "total_sessions": total_sessions,
                "total_journal_entries": total_journal_entries,
                "avg_conversations_per_user": round(total_conversations / total_users, 1) if total_users > 0 else 0
            },
            "wellbeing": {
                "avg_mood": round(avg_mood, 1),
                "risk_events_30d": risk_events_30d
            }
        }
    
    @staticmethod
    def get_popular_sessions() -> List[Dict]:
        """
        Sessões guiadas mais populares
        """
        pipeline = [
            {"$match": {"completed": True}},
            {"$group": {
                "_id": "$session_id",
                "count": {"$sum": 1},
                "avg_duration": {"$avg": "$duration_seconds"}
            }},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        
        results = list(sessions_completed_collection.aggregate(pipeline))
        return [{
            "session_id": r["_id"],
            "completions": r["count"],
            "avg_duration_minutes": round(r["avg_duration"] / 60, 1)
        } for r in results]
    
    @staticmethod
    def get_mood_distribution() -> Dict:
        """
        Distribuição de humor na plataforma
        """
        pipeline = [
            {"$group": {
                "_id": "$mood_value",
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        
        results = list(mood_logs_collection.aggregate(pipeline))
        distribution = {r["_id"]: r["count"] for r in results}
        
        return {
            "distribution": distribution,
            "total_logs": sum(distribution.values())
        }


class SOSManager:
    """Gerencia protocolo SOS aprimorado"""
    
    @staticmethod
    def trigger_sos(user_id: str, location: Dict = None, notes: str = ""):
        """
        Aciona protocolo SOS completo
        """
        sos_event = {
            "user_id": user_id,
            "type": "sos_triggered",
            "location": location,  # {latitude, longitude, city} - opcional
            "notes": notes,
            "status": "active",
            "created_at": datetime.utcnow()
        }
        
        result = db.sos_events.insert_one(sos_event)
        
        # Também registrar como evento de risco crítico
        RiskEventManager.save_risk_event(
            user_id,
            risk_level=4,
            detected_words=["SOS_BUTTON"],
            message="Usuário acionou botão SOS"
        )
        
        logger.warning(f"🆘 SOS ACIONADO: {user_id}")
        
        return str(result.inserted_id)


class AudioManager:
    """Gerencia áudio emocional, músicas ambiente e sons terapêuticos"""
    
    # Mapeamento de sessões → trilhas de áudio
    SESSION_AUDIO_MAP = {
        "box_breathing": "gentle_rain.mp3",
        "4_7_8_breathing": "deep_piano.mp3",
        "progressive_muscle_relaxation": "forest_birds.mp3",
        "gratitude_practice": "ambient_ocean.mp3",
        "body_scan_for_sleep": "night_wind.mp3",
        "quick_calm": "deep_piano.mp3",
        "evening_wind_down": "forest_birds.mp3",
        "mindful_moment": "gentle_rain.mp3",
        "morning_reset": "sunrise_soft.mp3"
    }
    
    # Mapeamento de humor → feedback sonoro
    MOOD_SOUND_MAP = {
        1: "soft_drop.mp3",      # Muito triste
        2: "soft_drop.mp3",      # Triste
        3: "neutral_breath.mp3",  # Neutro
        4: "chime_up.mp3",        # Bem
        5: "chime_up.mp3"         # Muito bem
    }
    
    # Configurações padrão de áudio
    DEFAULT_VOLUME = 0.4
    FADE_IN_DURATION = 2.0  # segundos
    FADE_OUT_DURATION = 3.0
    DUCKING_REDUCTION = 0.4  # 40% de redução quando Luna fala
    CROSSFADE_DURATION = 1.5
    
    @staticmethod
    def get_audio_for_session(session_id: str) -> Dict:
        """
        Retorna configuração de áudio para uma sessão guiada
        """
        session_key = session_id.lower().replace(" ", "_")
        track = AudioManager.SESSION_AUDIO_MAP.get(session_key, "gentle_rain.mp3")
        
        return {
            "track": track,
            "volume": AudioManager.DEFAULT_VOLUME,
            "loop": True,
            "fade_in": AudioManager.FADE_IN_DURATION,
            "fade_out": AudioManager.FADE_OUT_DURATION,
            "ducking": True,
            "visualization": "orb_pulse"
        }
    
    @staticmethod
    def get_audio_for_mood(mood_value: int) -> Dict:
        """
        Retorna som de feedback para registro de humor
        """
        sound = AudioManager.MOOD_SOUND_MAP.get(mood_value, "neutral_breath.mp3")
        
        return {
            "track": sound,
            "volume": 0.5,
            "loop": False,
            "duration": 2.0,  # Sons curtos
            "fade_in": 0.3,
            "fade_out": 0.5
        }
    
    @staticmethod
    def get_sos_audio_config() -> Dict:
        """
        Configuração de áudio para protocolo SOS
        """
        return {
            "track": "deep_piano.mp3",
            "volume": 0.5,
            "loop": True,
            "fade_in": 0.5,  # Mais rápido no SOS
            "fade_out": 3.0,
            "ducking": True,
            "visualization": "orb_breathing_slow",
            "breathing_cycle": 3.0  # 3 segundos por ciclo
        }
    
    @staticmethod
    def log_audio_event(user_id: str, event_type: str, track: str, context: str = ""):
        """
        Registra evento de áudio para analytics
        """
        event = {
            "user_id": user_id,
            "event_type": event_type,  # play, pause, stop, switch
            "track": track,
            "context": context,
            "created_at": datetime.utcnow()
        }
        db.audio_events.insert_one(event)
        logger.info(f"🎵 Audio event: {user_id} - {event_type} - {track}")
    
    @staticmethod
    def get_available_tracks() -> List[Dict]:
        """
        Lista todas as trilhas disponíveis
        """
        tracks = [
            {
                "id": "gentle_rain",
                "name": "Chuva Suave",
                "file": "gentle_rain.mp3",
                "duration": 300,  # 5 min
                "category": "relaxation",
                "description": "Chuva leve para relaxamento respiratório"
            },
            {
                "id": "deep_piano",
                "name": "Piano Profundo",
                "file": "deep_piano.mp3",
                "duration": 360,
                "category": "calming",
                "description": "Piano calmante para alívio emocional"
            },
            {
                "id": "forest_birds",
                "name": "Floresta",
                "file": "forest_birds.mp3",
                "duration": 420,
                "category": "nature",
                "description": "Floresta e pássaros para alívio de tensão"
            },
            {
                "id": "ambient_ocean",
                "name": "Oceano",
                "file": "ambient_ocean.mp3",
                "duration": 480,
                "category": "focus",
                "description": "Ondas suaves para foco e serenidade"
            },
            {
                "id": "night_wind",
                "name": "Vento Noturno",
                "file": "night_wind.mp3",
                "duration": 600,
                "category": "sleep",
                "description": "Vento noturno para indução ao sono"
            },
            {
                "id": "sunrise_soft",
                "name": "Amanhecer",
                "file": "sunrise_soft.mp3",
                "duration": 240,
                "category": "energizing",
                "description": "Acordar suave com energia positiva"
            }
        ]
        return tracks
    
    @staticmethod
    def suggest_music_by_emotion(emotion: str) -> Dict:
        """
        Sugere música baseada em emoção detectada
        """
        emotion_map = {
            "ansioso": "gentle_rain.mp3",
            "triste": "deep_piano.mp3",
            "estressado": "forest_birds.mp3",
            "cansado": "night_wind.mp3",
            "agitado": "ambient_ocean.mp3",
            "feliz": "sunrise_soft.mp3"
        }
        
        track = emotion_map.get(emotion.lower(), "gentle_rain.mp3")
        
        return {
            "track": track,
            "volume": AudioManager.DEFAULT_VOLUME,
            "loop": True,
            "fade_in": AudioManager.FADE_IN_DURATION,
            "reason": f"Recomendado para {emotion}"
        }

    
    @staticmethod
    def get_emergency_contacts(user_id: str) -> List[Dict]:
        """
        Busca contatos de emergência do usuário
        """
        user = users_collection.find_one({"user_id": user_id})
        return user.get("sos_contacts", []) if user else []
    
    @staticmethod
    def add_emergency_contact(user_id: str, name: str, phone: str):
        """
        Adiciona contato de emergência
        """
        users_collection.update_one(
            {"user_id": user_id},
            {"$push": {"sos_contacts": {"name": name, "phone": phone}}},
            upsert=True
        )
        logger.info(f"📞 Emergency contact added for {user_id}")
    
    @staticmethod
    def get_sos_history(user_id: str, limit: int = 10) -> List[Dict]:
        """
        Histórico de eventos SOS do usuário
        """
        events = list(db.sos_events.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(limit))
        
        return [{
            "id": str(e["_id"]),
            "type": e["type"],
            "status": e.get("status", "active"),
            "date": e["created_at"].isoformat(),
            "notes": e.get("notes", "")
        } for e in events]

class RiskEventManager:
    """Gerencia eventos de risco"""
    
    @staticmethod
    def save_risk_event(user_id: str, risk_level: int, detected_words: List[str], message: str):
        """Salva evento de risco no banco"""
        if risk_level >= 2:  # Apenas moderado ou superior
            risk_event = {
                "user_id": user_id,
                "type": "keyword_flag",
                "level": risk_level,
                "details": {
                    "matched": detected_words,
                    "source": "chat",
                    "message_preview": message[:100]  # Apenas preview
                },
                "created_at": datetime.utcnow()
            }
            risk_events_collection.insert_one(risk_event)
            logger.warning(f"⚠️  Risco nível {risk_level} detectado para usuário {user_id}")


def get_enhanced_system_prompt(user_id: str, base_prompt: str) -> str:
    """
    Função principal: retorna prompt da Luna com contexto do usuário injetado
    """
    context = MemoryManager.get_user_context(user_id)
    enhanced_prompt = MemoryManager.inject_context_in_prompt(base_prompt, context)
    return enhanced_prompt
