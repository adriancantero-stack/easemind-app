# 🚀 Guia Completo: Deploy Backend Serverless no Vercel

## 📋 Visão Geral

Este guia mostra como migrar o backend FastAPI atual para funções serverless no Vercel, deixando tudo em `easemind.io/api`.

---

## ⚠️ Limitações do Vercel Serverless (Hobby Plan - Grátis)

| Limitação | Valor | Impacto |
|-----------|-------|---------|
| Timeout | 10 segundos | ⚠️ TTS e transcrição podem ser lentos |
| Payload | 250MB | ✅ Suficiente para áudio curto |
| Memória | 1GB | ✅ OK |
| Cold Start | 1-3s | ⚠️ Primeira requisição mais lenta |

**Recomendação:** Se TTS/transcrição demorarem >10s, considere Railway ($5/mês) no futuro.

---

## 🏗️ Estrutura de Arquivos

```
easemind/
├── website/
│   ├── api/              ← APIs Serverless Python
│   │   ├── chat.py       ← Chat com Luna (LLM)
│   │   ├── tts.py        ← Text-to-Speech
│   │   ├── transcribe.py ← Transcrição de áudio
│   │   ├── journal.py    ← Journal operations
│   │   ├── user_sync.py  ← User sync (já existe como user/sync)
│   │   ├── admin_stats.py ← Admin (já existe)
│   │   └── requirements.txt
│   ├── server.js         ← Website Express
│   ├── admin.html        ← Admin dashboard
│   ├── index.html        ← Landing page
│   └── vercel.json       ← Configuração Vercel
```

---

## 🔑 Variáveis de Ambiente no Vercel

Acesse: **Vercel Dashboard → Settings → Environment Variables**

Adicione todas as variáveis:

```env
MONGO_URL=mongodb+srv://easemind_admin:7Sb6d2HAP9Da4W7K@easemind-cluster.5jd1ohc.mongodb.net/easemind

EMERGENT_LLM_KEY=sua_chave_aqui
# OU
OPENAI_API_KEY=sua_chave_openai

ELEVENLABS_API_KEY=sua_chave_elevenlabs
```

**Importante:** Selecione **todos os ambientes** (Production, Preview, Development).

---

## 📝 API: Chat com Luna (`/api/chat.py`)

**Necessidades:**
- Integração com LLM (OpenAI, Anthropic, ou Emergent LLM)
- Conexão MongoDB para contexto e memórias
- System prompt da Luna

**Complexidade:** 🔴 Alta  
**Tempo estimado:** ~10 segundos (pode timeout)

**Solução:** 
- Usar streaming de resposta
- OU migrar apenas chat para Railway
- OU usar LLM com respostas mais rápidas (GPT-4o-mini)

---

## 📝 API: TTS (`/api/tts.py`)

**Necessidades:**
- ElevenLabs API
- Processar áudio e retornar

**Complexidade:** 🟡 Média  
**Tempo estimado:** 3-7 segundos

**Status:** ✅ Pode funcionar no Vercel

---

## 📝 API: Transcribe (`/api/transcribe.py`)

**Necessidades:**
- OpenAI Whisper API
- Upload de áudio
- Transcrição

**Complexidade:** 🟡 Média  
**Tempo estimado:** 3-8 segundos

**Status:** ✅ Pode funcionar no Vercel

---

## 📝 API: Journal (`/api/journal.py`)

**Necessidades:**
- MongoDB CRUD
- Simples e rápido

**Complexidade:** 🟢 Baixa  
**Tempo estimado:** <1 segundo

**Status:** ✅✅ Perfeito para Vercel

---

## 🔧 Atualizar `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    },
    {
      "src": "api/*.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/chat",
      "dest": "/api/chat.py"
    },
    {
      "src": "/api/tts",
      "dest": "/api/tts.py"
    },
    {
      "src": "/api/transcribe",
      "dest": "/api/transcribe.py"
    },
    {
      "src": "/api/journal",
      "dest": "/api/journal.py"
    },
    {
      "src": "/api/user/sync",
      "dest": "/api/user_sync.py"
    },
    {
      "src": "/api/(admin_stats|mood_distribution|popular_sessions|list_users)",
      "dest": "/api/$1.py"
    },
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

---

## 📱 Atualizar App Mobile

**Arquivo:** `frontend/.env`

```env
EXPO_PUBLIC_BACKEND_URL=https://easemind.io
```

**Todas as chamadas de API vão para:**
```
https://easemind.io/api/chat
https://easemind.io/api/tts
https://easemind.io/api/transcribe
...
```

---

## 🚀 Deploy

```bash
# 1. Fazer commit
git add website/api/
git commit -m "Add serverless APIs"

# 2. Push para GitHub
git push origin main

# 3. Vercel faz deploy automático
# Aguarde 3-5 minutos

# 4. Teste
curl https://easemind.io/api/user/sync
```

---

## 🧪 Testes

### Teste User Sync
```bash
curl -X POST https://easemind.io/api/user/sync \
  -H "Content-Type: application/json" \
  -d '{
    "firebase_uid": "test123",
    "email": "test@test.com",
    "display_name": "Test"
  }'
```

### Teste Admin Stats
```bash
curl https://easemind.io/api/admin_stats
```

---

## ⚡ Alternativa: Híbrido (Melhor Opção)

**APIs simples no Vercel (grátis):**
- ✅ user/sync
- ✅ admin_stats
- ✅ mood_distribution
- ✅ list_users
- ✅ journal (CRUD)

**APIs complexas no Railway ($5/mês):**
- 🚀 chat (LLM - pode demorar)
- 🚀 tts (ElevenLabs)
- 🚀 transcribe (Whisper)

**Configuração:**
```
easemind.io/api/user/sync     → Vercel Serverless
easemind.io/api/chat          → Railway (proxy)
easemind.io/api/tts           → Railway (proxy)
easemind.io/api/transcribe    → Railway (proxy)
```

---

## 💰 Comparação de Custos

| Opção | Custo | Prós | Contras |
|-------|-------|------|---------|
| **100% Vercel Serverless** | $0/mês | Grátis! | Timeout 10s pode ser problema |
| **Híbrido (Vercel + Railway)** | $5/mês | Melhor performance | Custo baixo |
| **100% Railway** | $5/mês | Sem limitações | Paga mesmo APIs simples |

---

## 🎯 Minha Recomendação Final

### **Para Lançamento:**

**Use a abordagem híbrida:**

1. ✅ **APIs Admin** → Vercel Serverless (grátis)
2. ✅ **Chat, TTS, Transcribe** → Railway ($5/mês)

**Por quê?**
- Economiza onde pode (admin é grátis)
- Garante performance onde importa (chat sem timeout)
- Total: $5/mês (muito acessível!)

---

## 📞 Próximos Passos

**Escolha sua opção:**

**A)** Testar 100% serverless primeiro (grátis, pode ter timeouts)
**B)** Ir direto para híbrido (Railway + Vercel, $5/mês, garantido)

**Quer ajuda para implementar qual opção?** 🚀
