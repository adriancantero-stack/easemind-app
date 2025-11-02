# 📱 EaseMind - Documentação Completa

**Versão:** 1.0.1  
**Última Atualização:** Novembro 2025  
**Plataforma:** Mobile (iOS/Android) + Web

---

## 📖 Índice

1. [Visão Geral](#visão-geral)
2. [Funcionalidades Principais](#funcionalidades-principais)
3. [Arquitetura Técnica](#arquitetura-técnica)
4. [Fluxos de Usuário](#fluxos-de-usuário)
5. [Backend e APIs](#backend-e-apis)
6. [Integrações e Serviços](#integrações-e-serviços)
7. [Sistema de Dados](#sistema-de-dados)
8. [Segurança e Privacidade](#segurança-e-privacidade)
9. [Configurações e Ambientes](#configurações-e-ambientes)
10. [Publicação e Deploy](#publicação-e-deploy)

---

## 1. Visão Geral

### 🎯 Missão
O **EaseMind** é um aplicativo móvel de apoio emocional e bem-estar mental que oferece suporte através de IA conversacional (Luna), práticas de mindfulness, sessões guiadas, e ferramentas de autocuidado.

### 🌟 Proposta de Valor
- **Terapia virtual acessível**: Conversas com Luna, uma IA terapeuta empática
- **Práticas de mindfulness**: Respiração guiada, meditações, relaxamento
- **Botão SOS**: Protocolo de emergência emocional com áudio guiado
- **Diário pessoal**: Registro de emoções e pensamentos
- **Multi-idioma**: Português, Inglês e Espanhol
- **Design sereno**: Interface "Apple-like" com estética minimalista

### 👥 Público-Alvo
- Pessoas com ansiedade, estresse ou traumas leves
- Indivíduos buscando ferramentas de autocuidado emocional
- Usuários que precisam de suporte emocional acessível 24/7

---

## 2. Funcionalidades Principais

### 2.1 🤖 Luna - Chat com IA Terapeuta

**Descrição:**  
Luna é a terapeuta virtual do EaseMind, baseada em GPT-4o-mini da OpenAI.

**Características:**
- Conversação empática e humanizada
- Respostas baseadas em TCC, Psicologia Positiva, Mindfulness
- Contexto do usuário (nome customizado, objetivos, histórico)
- Detecção de risco emocional/crise
- Memória de conversas (últimas 24h)
- Idioma automático (PT/EN/ES)

**Técnicas Oferecidas:**
- Exercícios de respiração (Box Breathing, 4-7-8, Grounding 5-4-3-2-1)
- Reestruturação cognitiva
- Práticas de gratidão
- Relaxamento muscular progressivo
- Micro-hábitos de equilíbrio emocional

**Limites Éticos:**
- Nunca diagnostica ou prescreve medicamentos
- Em casos de crise, direciona para CVV (188) ou linha local
- Não substitui profissional de saúde

---

### 2.2 🆘 Botão SOS (Panic Button)

**Descrição:**  
Protocolo de emergência emocional ativado por um botão pulsante na tab bar.

**Funcionamento:**
1. Usuário pressiona o botão SOS (com animação de respiração)
2. Modal abre automaticamente
3. Áudio guiado de respiração começa (Luna falando)
4. Música calmante de fundo (432Hz)
5. Instruções visuais sincronizadas: "Inspire", "Segure", "Expire"
6. Duração: ~60 segundos
7. Ao final, oferece opções:
   - Conversar com Luna
   - Ligar para CVV (188 no Brasil)
   - Ligar para SAMU (192 no Brasil)

**Áudios por Idioma:**
- **Português (pt-BR):** `luna_sos.mp3`
- **Inglês (en):** `lily_english_voice.mp3`
- **Espanhol (es):** `jhenny_spanish_voice.mp3`

**Sincronização de Idioma:**  
O idioma da voz SOS agora sincroniza automaticamente com o idioma escolhido no perfil do usuário.

**Números de Emergência por País:**
- **Brasil:** CVV 188, SAMU 192
- **EUA:** 988 (Suicide & Crisis Lifeline), 911
- **Espanha/Latam:** 024/112/911 (depende do país)

---

### 2.3 🧘 Sessões Guiadas

**Descrição:**  
Práticas de mindfulness, meditação e relaxamento com áudio guiado.

**Sessões Disponíveis:**
1. **Respiração Guiada 5min** - Box Breathing
2. **Meditação de Gratidão 10min**
3. **Body Scan 15min** - Relaxamento muscular
4. **Sono Tranquilo 20min** - Para antes de dormir
5. **Alívio de Ansiedade 8min** - Técnicas de grounding
6. **Autocompaixão 12min** - Psicologia Positiva

**Recursos:**
- Timer visual
- Música de fundo ajustável (432Hz calmante)
- Histórico de sessões completadas
- Notas pós-sessão

**Fade Out Automático:**  
A música agora faz fade out gradual de 5 segundos ao final da sessão, parando automaticamente.

---

### 2.4 📔 Diário (Journal)

**Descrição:**  
Espaço para o usuário registrar pensamentos, emoções e reflexões diárias.

**Funcionalidades:**
- Criar entradas com título e texto
- Selecionar humor do dia (escala 1-5)
- Tags personalizadas (ex: "ansiedade", "trabalho", "família")
- Busca por data ou tag
- Visualização de entradas anteriores
- **Salvamento Confiável:** Correções implementadas para garantir que as entradas sejam salvas corretamente

**Backend:**
- Endpoint: `POST /api/journal` e `GET /api/journal/{user_id}`
- Armazenamento no MongoDB

---

### 2.5 👤 Perfil Personalizado

**Descrição:**  
Sistema completo de perfil do usuário com customização e configurações.

**Dados do Perfil:**
- **Display Name** (nome customizado, diferente do Google)
- **Foto de Perfil** (upload via `expo-image-picker`)
- **Email** (do Firebase Auth)
- **Objetivos** (múltipla escolha):
  - Reduzir ansiedade
  - Melhorar sono
  - Gerenciar estresse
  - Aumentar autoestima
  - Desenvolver mindfulness
  - Lidar com traumas
- **Preferências de Notificação:**
  - Ativadas/Desativadas
  - Horário preferido (manhã/tarde/noite)
- **Faixa Etária** (opcional): 18-24, 25-34, 35-44, 45-54, 55+
- **Gênero** (opcional): Masculino, Feminino, Não-binário, Prefiro não informar

**Uso dos Dados:**
- Luna usa `display_name` para personalização
- Objetivos influenciam sugestões de sessões e técnicas
- Notificações enviadas no horário preferido

**Correção Implementada:**  
O sistema agora **não sobrescreve** o `display_name` customizado pelo usuário quando ele faz login com Google. O nome do Google só é usado se o usuário ainda não tiver definido um nome personalizado.

---

### 2.6 🌐 Multi-idioma (i18n)

**Idiomas Suportados:**
- 🇧🇷 Português (Brasil) - `pt-BR`
- 🇺🇸 Inglês - `en`
- 🇪🇸 Espanhol - `es`

**Detecção Automática:**
- Ao instalar, detecta idioma do sistema
- Usuário pode mudar manualmente no Perfil

**Sincronização:**
- Idioma sincroniza entre `i18n` e `useStore`
- Voz do SOS muda automaticamente com o idioma escolhido
- Números de emergência adaptados ao idioma/região

**Implementação:**
- Biblioteca: `i18next` + `react-i18next`
- Armazenamento: `AsyncStorage`
- Arquivo de traduções: `/frontend/i18n/translations.ts`

---

### 2.7 🎨 Temas (Light/Dark/Auto)

**Modos:**
- ☀️ **Light Mode** - Modo claro
- 🌙 **Dark Mode** - Modo escuro
- 🔄 **Auto (System)** - Segue o tema do sistema

**Paleta de Cores:**
- **Accent 1:** `#C8B6FF` (Roxo suave)
- **Background Light:** `#F5F5F7`
- **Background Dark:** `#0E1A2B`
- **Text Light:** `#000000`
- **Text Dark:** `#FFFFFF`

**Persistência:**  
Escolha salva no `AsyncStorage` e restaurada ao abrir o app.

---

### 2.8 🔐 Autenticação

**Provedor:**  
Firebase Authentication

**Métodos Suportados:**
1. **Email e Senha** (criar conta ou login)
2. **Google Sign-In** (via `@react-native-google-signin/google-signin`)

**Fluxo:**
1. Usuário faz login/cadastro
2. Firebase retorna `uid` e dados básicos
3. Backend sincroniza usuário no MongoDB via `/api/user/sync`
4. Contexto de autenticação (`AuthContext`) gerencia estado global

**Google Sign-In em APK:**  
⚠️ **Pendente:** Configurar SHA-1/SHA-256 no Firebase Console para funcionar em builds nativos.

**Persistência:**  
Firebase mantém sessão automaticamente.

---

### 2.9 📊 Sobre (About)

**Conteúdo:**
- Informações sobre o EaseMind
- Missão e valores
- Equipe (opcional)
- Créditos de áudio e design
- Versão do app

**Navegação:**  
Acessível via Perfil → "Sobre o EaseMind"

---

## 3. Arquitetura Técnica

### 3.1 Stack Tecnológica

**Frontend (Mobile):**
- **Framework:** React Native 0.81.5
- **Navegação:** Expo Router 6.0.14 (file-based routing)
- **State Management:** Zustand 5.0.8
- **UI:** React Native components + Expo modules
- **Animações:** React Native Reanimated 4.1.1
- **Áudio:** Expo AV
- **Imagens:** Expo Image Picker
- **Idiomas:** i18next + react-i18next
- **Ícones:** @expo/vector-icons (Ionicons)

**Backend:**
- **Framework:** FastAPI (Python)
- **LLM:** OpenAI GPT-4o-mini
- **TTS/STT:** OpenAI Whisper + TTS API
- **Database:** MongoDB
- **Deploy:** Railway (backend) + Vercel (website futuro)

**Website:**
- **Framework:** HTML/CSS/JavaScript
- **Hospedagem:** Temporariamente no container Nginx

**Infraestrutura:**
- **Desenvolvimento:** Docker container (Kubernetes)
- **Produção (Backend):** Railway
- **Produção (Frontend):** EAS Build (Expo)
- **Database:** MongoDB Atlas (via Railway)

---

### 3.2 Estrutura de Pastas (Frontend)

```
/app/frontend/
├── app/                      # Expo Router (file-based routing)
│   ├── (tabs)/              # Tab navigation
│   │   ├── _layout.tsx      # Tab bar config (com Safe Area fix)
│   │   ├── index.tsx        # Chat com Luna
│   │   ├── sessions.tsx     # Sessões guiadas
│   │   ├── panic.tsx        # Placeholder (SOS via modal)
│   │   ├── journal.tsx      # Diário
│   │   ├── profile.tsx      # Perfil
│   │   └── about.tsx        # Sobre
│   ├── auth/
│   │   └── login.tsx        # Login/Cadastro
│   ├── profile/
│   │   └── edit-profile.tsx # Editar perfil
│   ├── session-details.tsx  # Detalhes da sessão
│   └── _layout.tsx          # Root layout (AuthContext)
├── assets/
│   ├── audio/               # Áudios guiados
│   │   ├── luna_sos.mp3
│   │   ├── lily_english_voice.mp3
│   │   ├── jhenny_spanish_voice.mp3
│   │   └── 432hz_calmante.mp3
│   └── images/              # Logos, ícones, splash
│       ├── logo-EaseMind-transparente.png (light theme)
│       ├── EaseMind-escura.png (dark theme)
│       ├── icone-easemind.png
│       ├── splash-image.png
│       └── panic-button.png
├── components/
│   ├── ChatBubble.tsx
│   ├── PanicModal.tsx       # Modal do SOS
│   ├── BreathAnimation.tsx  # Animação de respiração
│   └── ...
├── contexts/
│   └── AuthContext.tsx      # Gerencia autenticação
├── store/
│   └── useStore.ts          # Zustand global state
├── utils/
│   ├── theme.ts             # Paleta de cores
│   └── i18n.ts              # Configuração i18n
├── i18n/
│   └── translations.ts      # Traduções PT/EN/ES
├── config/
│   └── firebase.ts          # Firebase config
├── data/
│   └── sessions.ts          # Lista de sessões guiadas
├── hooks/
│   ├── useAudioPlayer.ts
│   └── useVoiceRecording.ts
├── app.json                 # Expo config (versionCode, package, etc)
├── eas.json                 # EAS Build config
├── package.json
└── .env                     # EXPO_PUBLIC_BACKEND_URL
```

---

### 3.3 Estrutura de Pastas (Backend)

```
/app/backend/
├── server.py               # FastAPI app principal
├── orchestrator.py         # Lógica de IA, memória, risco
├── requirements.txt
├── .env                    # OPENAI_API_KEY, MONGO_URL
└── (outras dependências)
```

---

### 3.4 Fluxo de Navegação

```
Login Screen (auth/login.tsx)
    ↓
Tab Navigator (_layout.tsx)
    ├── Chat (index.tsx) ← Luna
    ├── Sessions (sessions.tsx)
    │       ↓
    │   Session Details (session-details.tsx)
    ├── SOS (panic.tsx → PanicModal)
    ├── Journal (journal.tsx)
    └── Profile (profile.tsx)
            ↓
        Edit Profile (profile/edit-profile.tsx)
            ↓
        About (about.tsx)
```

---

## 4. Fluxos de Usuário

### 4.1 Onboarding e Login

**Fluxo:**
1. Usuário abre o app
2. Se não autenticado → tela de Login (`/auth/login`)
3. Opções:
   - Criar conta com Email/Senha
   - Login com Email/Senha
   - Login com Google
4. Firebase autentica
5. Backend sincroniza usuário (`POST /api/user/sync`)
6. Usuário é redirecionado para Chat (tab index)

**Primeira Vez:**
- Sistema detecta idioma do sistema
- Tema configurado como "auto"
- Perfil criado com valores padrão

---

### 4.2 Conversa com Luna

**Fluxo:**
1. Usuário digita mensagem
2. Frontend envia para `POST /api/chat`:
   ```json
   {
     "message": "Estou ansioso",
     "lang": "pt-BR",
     "history": [...],
     "user_id": "firebase_uid"
   }
   ```
3. Backend:
   - Detecta risco emocional (RiskDetector)
   - Busca contexto do usuário (display_name, goals, etc)
   - Injeta contexto no system prompt
   - Chama OpenAI GPT-4o-mini
   - Salva memória da conversa (MongoDB)
   - Retorna resposta
4. Frontend exibe resposta com animação de digitação
5. Histórico salvo no `AsyncStorage`

**Detecção de Crise:**
- Se risco nível 3+ detectado:
  - Resposta inclui número CVV/emergência
  - Flag `is_crisis: true`
  - Evento salvo no MongoDB (`risk_events`)

---

### 4.3 Protocolo SOS

**Fluxo:**
1. Usuário clica no botão SOS pulsante (tab bar)
2. `PanicModal` abre automaticamente
3. Sistema verifica idioma (`useStore.getState().language`)
4. Carrega áudio correto (PT/EN/ES)
5. Inicia áudio de voz + música de fundo (432Hz)
6. Exibe textos sincronizados: "Inspire", "Segure", "Expire"
7. Ao final (~60s):
   - Música faz fade out de 5s
   - Exibe opções:
     - Conversar com Luna
     - Ligar CVV (188)
     - Ligar SAMU (192)
8. Usuário escolhe ação ou fecha modal

**Logs Backend:**
- Evento SOS salvo via `POST /api/sos/trigger`

---

### 4.4 Sessão Guiada

**Fluxo:**
1. Usuário vai em "Sessões"
2. Escolhe uma sessão (ex: "Respiração 5min")
3. Tela de detalhes abre (`/session-details`)
4. Usuário clica "Iniciar"
5. Timer começa
6. Áudio guiado toca
7. Música de fundo (opcional)
8. Ao final:
   - Música faz fade out
   - Tela de conclusão
   - Opção de adicionar notas
9. Sessão salva via `POST /api/session`

**Dados Salvos:**
- `user_id`, `session_id`, `duration_seconds`, `completed`, `notes`

---

### 4.5 Criar Entrada no Diário

**Fluxo:**
1. Usuário vai em "Diário" (Journal)
2. Clica em "Nova Entrada"
3. Preenche:
   - Título
   - Texto
   - Humor (1-5)
   - Tags (opcional)
4. Clica "Salvar"
5. Frontend envia para `POST /api/journal`:
   ```json
   {
     "user_id": "firebase_uid",
     "title": "Dia difícil",
     "content": "Hoje foi...",
     "mood": 3,
     "tags": ["trabalho", "ansiedade"]
   }
   ```
6. Backend salva no MongoDB
7. Entrada aparece na lista

**Correções Implementadas:**
- Verificação de `response.ok` antes de `response.json()`
- Melhor tratamento de erros
- Alertas para feedback do usuário

---

### 4.6 Editar Perfil

**Fluxo:**
1. Usuário vai em "Perfil"
2. Clica "Editar Perfil"
3. Tela `/profile/edit-profile` abre
4. Usuário edita:
   - Display Name
   - Foto (via `expo-image-picker`)
   - Objetivos (múltipla escolha)
   - Notificações (on/off, horário)
   - Faixa etária
   - Gênero
5. Clica "Salvar"
6. Frontend envia para `PUT /api/user/profile`:
   ```json
   {
     "firebase_uid": "...",
     "display_name": "João",
     "profile_photo": "base64...",
     "goals": ["ansiedade", "sono"],
     "notification_enabled": true,
     "preferred_time": "morning",
     "age_range": "25-34",
     "gender": "Masculino"
   }
   ```
7. Backend atualiza MongoDB
8. Perfil atualizado exibido

---

### 4.7 Mudar Idioma

**Fluxo:**
1. Usuário vai em "Perfil"
2. Seção "Idioma"
3. Seleciona novo idioma (PT/EN/ES)
4. Sistema:
   - Atualiza `i18n.changeLanguage()`
   - Salva no `AsyncStorage`
   - **Sincroniza com `useStore.setLanguage()`** (correção implementada)
5. Interface atualiza instantaneamente
6. Voz do SOS também muda

---

## 5. Backend e APIs

### 5.1 Endpoints Principais

#### **5.1.1 Saúde e Versão**

**GET /api/health**
```json
{
  "status": "ok",
  "service": "easemind",
  "api_configured": true,
  "api_key_type": "openai"
}
```

**GET /api/version**
```json
{
  "version": "1.0.0",
  "name": "EaseMind API",
  "endpoints": {...}
}
```

---

#### **5.1.2 Chat com Luna**

**POST /api/chat**

**Request:**
```json
{
  "message": "Estou me sentindo ansioso",
  "lang": "pt-BR",
  "history": [
    {"role": "user", "content": "Olá"},
    {"role": "assistant", "content": "Olá! Como posso ajudar?"}
  ],
  "user_id": "firebase_uid_123"
}
```

**Response:**
```json
{
  "response": "Entendo que você esteja se sentindo ansioso. Vamos respirar juntos...",
  "is_crisis": false,
  "correlation_id": "uuid-1234"
}
```

**Lógica Interna:**
1. Detecta risco (`RiskDetector.detect_risk()`)
2. Busca contexto do usuário (`MemoryManager.get_user_context()`)
3. Injeta contexto no system prompt
4. Chama OpenAI GPT-4o-mini
5. Salva memória e conversa no MongoDB
6. Retorna resposta

---

#### **5.1.3 Autenticação e Perfil**

**POST /api/user/sync**  
Sincroniza usuário do Firebase com MongoDB.

**Request:**
```json
{
  "firebase_uid": "abc123",
  "email": "user@example.com",
  "display_name": "João Silva",
  "photo_url": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "user_id": "abc123",
  "is_new_user": true
}
```

**Lógica:**
- Se usuário não existe → cria novo
- Se existe → atualiza `email`, `photo_url`, `last_login`
- **NÃO sobrescreve `display_name` se já customizado**

---

**GET /api/user/profile/{firebase_uid}**  
Obtém perfil completo.

**Response:**
```json
{
  "success": true,
  "user": {
    "firebase_uid": "abc123",
    "email": "user@example.com",
    "display_name": "João",
    "profile_photo": "base64...",
    "goals": ["ansiedade", "sono"],
    "notification_enabled": true,
    "preferred_time": "morning",
    "age_range": "25-34",
    "gender": "Masculino"
  }
}
```

---

**PUT /api/user/profile**  
Atualiza perfil.

**Request:**
```json
{
  "firebase_uid": "abc123",
  "display_name": "João Pedro",
  "profile_photo": "base64...",
  "goals": ["estresse"],
  "notification_enabled": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {...}
}
```

---

#### **5.1.4 Diário**

**POST /api/journal**  
Cria entrada.

**Request:**
```json
{
  "user_id": "abc123",
  "title": "Dia difícil",
  "content": "Hoje foi...",
  "mood": 3,
  "tags": ["trabalho"],
  "date": null
}
```

**Response:**
```json
{
  "success": true,
  "entry_id": "entry_789"
}
```

---

**GET /api/journal/{user_id}?limit=20&tag=ansiedade**  
Lista entradas.

**Response:**
```json
{
  "user_id": "abc123",
  "entries": [
    {
      "id": "entry_789",
      "title": "Dia difícil",
      "content": "...",
      "mood": 3,
      "tags": ["trabalho"],
      "created_at": "2025-11-01T12:00:00Z"
    }
  ],
  "common_tags": ["ansiedade", "trabalho", "sono"]
}
```

---

#### **5.1.5 Sessões Guiadas**

**POST /api/session**  
Registra sessão completada.

**Request:**
```json
{
  "user_id": "abc123",
  "session_id": "breathing_5min",
  "duration_seconds": 300,
  "completed": true,
  "notes": "Me senti mais calmo"
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "breathing_5min"
}
```

---

**GET /api/sessions/{user_id}?limit=10**  
Histórico de sessões.

**Response:**
```json
{
  "user_id": "abc123",
  "sessions": [...],
  "stats": {
    "total_sessions": 45,
    "total_minutes": 560,
    "most_used": "breathing_5min"
  }
}
```

---

#### **5.1.6 SOS**

**POST /api/sos/trigger**  
Registra evento SOS.

**Request:**
```json
{
  "user_id": "abc123",
  "location": {"lat": -23.5505, "lng": -46.6333},
  "notes": "Ataque de pânico"
}
```

**Response:**
```json
{
  "success": true,
  "event_id": "sos_456",
  "message": "SOS protocol activated"
}
```

---

**GET /api/sos/history/{user_id}?limit=10**  
Histórico SOS.

---

#### **5.1.7 TTS e STT**

**POST /api/tts**  
Text-to-Speech (OpenAI TTS).

**Request:**
```json
{
  "text": "Respire fundo",
  "lang": "pt-BR",
  "provider": "openai"
}
```

**Response:**  
Stream de áudio MP3

---

**POST /api/transcribe**  
Speech-to-Text (Whisper).

**Request:**  
Multipart form-data com arquivo de áudio

**Response:**
```json
{
  "text": "Estou me sentindo ansioso",
  "lang_detected": "pt",
  "correlation_id": "uuid-1234"
}
```

---

### 5.2 Sistema de Memória (Orchestrator)

**Módulos:**

**1. MemoryManager**
- Salva resumos de conversas
- Busca contexto do usuário
- Gerencia histórico

**2. RiskDetector**
- Detecta palavras-chave de risco (suicídio, automutilação, etc)
- Classifica níveis 1-5
- Retorna palavras detectadas

**3. RiskEventManager**
- Salva eventos de risco no MongoDB
- Usado para monitoramento

**4. get_enhanced_system_prompt()**
- Injeta contexto do usuário no system prompt
- Inclui: display_name, goals, resumo de conversas recentes

**Coleções MongoDB:**
- `users` - Perfis de usuários
- `ai_memories` - Resumos de conversas
- `ai_conversations` - Histórico completo
- `risk_events` - Eventos de risco
- `journal_entries` - Entradas do diário
- `session_logs` - Sessões completadas
- `sos_events` - Acionamentos SOS

---

## 6. Integrações e Serviços

### 6.1 Firebase Authentication

**Configuração:**
- Project ID: `easemind-auth-firebase`
- Web Client ID: `771193870049-qv0qmj1h8eac2802119b6dfe5009a0.apps.googleusercontent.com`

**Métodos:**
- Email/Password
- Google Sign-In

**Pendência:**
- Configurar SHA-1/SHA-256 para Google Sign-In funcionar em APK

---

### 6.2 OpenAI

**APIs Usadas:**
1. **GPT-4o-mini** - Chat com Luna
2. **Whisper** - Transcrição de áudio
3. **TTS (Alloy voice)** - Voz para Luna (futuro)

**Chave API:**
- Variável: `OPENAI_API_KEY` ou `EMERGENT_LLM_KEY`
- Localização: `.env` do backend

---

### 6.3 MongoDB

**Hospedagem:**  
MongoDB Atlas (via Railway)

**Conexão:**
```
MONGO_URL=mongodb://localhost:27017/easemind_db
```

**Database:** `easemind_db`

---

### 6.4 Railway (Deploy Backend)

**URL Produção:**  
`https://web-production-8d0fb.up.railway.app`

**Configuração:**
- `railway.json` - Config do projeto
- `nixpacks.toml` - Build config (Python 3.11)
- `start-all-services.sh` - Script de start (uvicorn)

**Variáveis de Ambiente:**
- `OPENAI_API_KEY`
- `MONGO_URL`
- `PORT` (padrão 8001)

---

### 6.5 Expo (Frontend)

**EAS Build:**
- Account: `adriancantero`
- Project: `easemind`
- Project ID: `f42ed3ee-de06-4213-bf6d-ea34f17a4aa7`

**Configuração:**
- `eas.json` - Build profiles
- `app.json` - App config

---

## 7. Sistema de Dados

### 7.1 Modelo de Dados - Usuário

```javascript
{
  _id: ObjectId,
  firebase_uid: "abc123",
  user_id: "abc123",
  email: "user@example.com",
  display_name: "João Pedro",
  photo_url: "https://...",
  profile_photo: "base64...",
  language: "pt-BR",
  country: "BR",
  goals: ["ansiedade", "sono"],
  prefers_voice: true,
  notification_enabled: true,
  preferred_time: "morning",
  age_range: "25-34",
  gender: "Masculino",
  sos_contacts: [],
  created_at: ISODate,
  last_login: ISODate,
  updated_at: ISODate
}
```

---

### 7.2 Modelo de Dados - Memória de Conversa

```javascript
{
  _id: ObjectId,
  user_id: "abc123",
  summary: "Usuário relatou ansiedade sobre trabalho",
  emotion: "ansioso",
  topics: ["trabalho", "pressão"],
  needs_followup: false,
  created_at: ISODate
}
```

---

### 7.3 Modelo de Dados - Entrada de Diário

```javascript
{
  _id: ObjectId,
  user_id: "abc123",
  title: "Dia difícil",
  content: "Hoje foi um dia desafiador...",
  mood: 3,
  tags: ["trabalho", "ansiedade"],
  created_at: ISODate
}
```

---

### 7.4 Modelo de Dados - Evento SOS

```javascript
{
  _id: ObjectId,
  user_id: "abc123",
  location: {lat: -23.5505, lng: -46.6333},
  notes: "Ataque de pânico",
  created_at: ISODate
}
```

---

### 7.5 AsyncStorage (Frontend)

**Chaves:**
- `@easemind_theme_mode` - light/dark/auto
- `@easemind_lang` - pt-BR/en/es
- `@easemind_onboarding` - true/false
- `@easemind_messages` - Histórico de chat
- `@easemind_user_id` - Firebase UID
- `@easemind_voice_enabled` - true/false

---

## 8. Segurança e Privacidade

### 8.1 Proteção de Dados

**Dados Sensíveis:**
- Conversas com Luna (criptografadas no MongoDB)
- Entradas de diário (privadas, não compartilhadas)
- Perfil do usuário (acesso restrito por Firebase UID)

**LGPD/GDPR:**
- Usuário pode solicitar exclusão de dados
- Política de privacidade disponível em `https://easemind.io/privacy`
- Termos de uso em `https://easemind.io/terms`

---

### 8.2 Autenticação e Autorização

**Firebase Auth:**
- JWT tokens automáticos
- Refresh tokens gerenciados pelo Firebase

**Backend:**
- Endpoints protegidos por `user_id`
- Validação de Firebase UID

---

### 8.3 Avisos Legais

**Disclaimer:**
> "O EaseMind é um aplicativo de apoio emocional e bem-estar mental. O conteúdo fornecido é educativo e não substitui terapia, diagnóstico ou tratamento médico/psicológico. Em caso de crise, procure ajuda profissional imediatamente (CVV 188 no Brasil)."

---

## 9. Configurações e Ambientes

### 9.1 Variáveis de Ambiente (Backend)

**Arquivo:** `/app/backend/.env`

```bash
OPENAI_API_KEY=sk-...
EMERGENT_LLM_KEY=em-...  # Alternativa
MONGO_URL=mongodb://localhost:27017/easemind_db
PORT=8001
```

---

### 9.2 Variáveis de Ambiente (Frontend)

**Arquivo:** `/app/frontend/.env`

```bash
EXPO_PUBLIC_BACKEND_URL=https://web-production-8d0fb.up.railway.app
EXPO_PACKAGER_PROXY_URL=...
EXPO_PACKAGER_HOSTNAME=...
```

**Acesso no código:**
```javascript
const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
```

---

### 9.3 Configuração do Firebase

**Arquivo:** `/app/frontend/config/firebase.ts`

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAPNDYtqEC4Q7cgQzqeWjPZ61_SRrqrwRw",
  authDomain: "easemind-auth-firebase.firebaseapp.com",
  projectId: "easemind-auth-firebase",
  storageBucket: "easemind-auth-firebase.firebasestorage.app",
  messagingSenderId: "771193870049",
  appId: "1:771193870049:web:8eac2802119b6dfe5009a0"
};
```

---

### 9.4 Configuração do app.json

**Arquivo:** `/app/frontend/app.json`

```json
{
  "expo": {
    "name": "EaseMind",
    "slug": "easemind",
    "version": "1.0.1",
    "android": {
      "package": "io.easemind.app",
      "versionCode": 3
    },
    "extra": {
      "EXPO_PUBLIC_BACKEND_URL": "${EXPO_PUBLIC_BACKEND_URL}",
      "eas": {
        "projectId": "f42ed3ee-de06-4213-bf6d-ea34f17a4aa7"
      }
    }
  }
}
```

---

### 9.5 Configuração EAS Build

**Arquivo:** `/app/frontend/eas.json`

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "node": "22.11.0",
      "env": {
        "EXPO_PUBLIC_BACKEND_URL": "https://web-production-8d0fb.up.railway.app"
      }
    }
  }
}
```

---

## 10. Publicação e Deploy

### 10.1 Build Android (AAB)

**Comando:**
```bash
cd /app/frontend
eas build --platform android --profile production
```

**Requisitos:**
- EAS CLI instalado
- Conta Expo
- `eas.json` configurado
- `app.json` com `versionCode` incremental

**Saída:**
- Arquivo `.aab` (Android App Bundle)
- Link de download no Expo.dev

---

### 10.2 Publicação na Google Play Store

**Processo:**

1. **Criar App na Play Console**
   - Criar novo aplicativo
   - Nome: EaseMind
   - Idioma padrão: Português (Brasil)

2. **Fazer Upload do .aab**
   - Ir em "Produção" → "Criar nova versão"
   - Upload do arquivo `.aab`
   - Preencher notas da versão

3. **Informações Obrigatórias:**
   - Descrição do app
   - Screenshots (mínimo 2)
   - Ícone (512x512px)
   - Política de privacidade (URL)
   - Classificação de conteúdo

4. **Submeter para Revisão**
   - Tempo de revisão: 1-7 dias
   - Status: Em análise → Publicado

**Importante:**
- Cada nova versão precisa incrementar o `versionCode`
- Não é possível fazer downgrade de versionCode

---

### 10.3 Deploy Backend (Railway)

**Deploy Automático:**
- Push no GitHub → Railway detecta e faz deploy

**Deploy Manual:**
```bash
railway up
```

**Logs:**
```bash
railway logs
```

**Configuração:**
- `nixpacks.toml` - Build config
- `railway.json` - Service config
- `start-all-services.sh` - Start command

---

### 10.4 Atualizações Over-The-Air (OTA) - Futuro

**Expo Updates:**
- Permite atualizar JS/assets sem novo build
- Configurar em `app.json`
- Comando: `eas update`

---

## 11. Correções Recentes Implementadas

### ✅ Correções Aplicadas

1. **Safe Area nas Tabs (Android)**
   - Problema: Menu inferior coberto pelos botões do sistema
   - Solução: Adicionado `useSafeAreaInsets()` em `_layout.tsx`
   - Arquivo: `/app/frontend/app/(tabs)/_layout.tsx`

2. **Sincronização de Idioma no SOS**
   - Problema: Voz do SOS não mudava com idioma do perfil
   - Solução: Sincronizar `i18n` com `useStore.setLanguage()`
   - Arquivo: `/app/frontend/app/(tabs)/profile.tsx`

3. **Display Name não sobrescrito pelo Google**
   - Problema: Nome customizado era substituído no Google Sign-In
   - Solução: Backend verifica se nome já é customizado antes de atualizar
   - Arquivo: `/app/backend/server.py` (linha 918-928)

4. **Journal Save com Melhor Tratamento de Erros**
   - Problema: Entradas não salvavam consistentemente
   - Solução: Verificação de `response.ok`, melhores alertas
   - Arquivo: `/app/frontend/app/(tabs)/journal.tsx`

5. **Fade Out Automático em Sessões**
   - Problema: Música não parava automaticamente
   - Solução: Fade out de 5s ao final da sessão
   - Arquivo: `/app/frontend/app/session-details.tsx`

6. **Logo Responsivo no Login**
   - Melhoria: Logos diferentes para light/dark theme
   - Arquivos: `logo-EaseMind-transparente.png`, `EaseMind-escura.png`

---

## 12. Roadmap e Funcionalidades Futuras

### 🔜 Em Planejamento

1. **Apple Sign-In** (iOS)
2. **RevenueCat** (monetização/assinaturas)
3. **Push Notifications** (lembretes, check-ins)
4. **Analytics Avançado** (Firebase Analytics, Mixpanel)
5. **Modo Offline** (cache de conversas, sessões)
6. **TTS para Luna** (voz da Luna falando respostas)
7. **CMS para Blog** (estudos, artigos)
8. **Painel Admin no Website** (estatísticas, usuários)
9. **Serverless APIs** (Vercel para TTS/LLM)
10. **OAuth Consent Screen** (nome/logo customizado no Google Sign-In)

---

## 13. Troubleshooting Comum

### Problema: Google Sign-In não funciona em APK

**Causa:** SHA-1/SHA-256 não configurados no Firebase

**Solução:**
1. Obter SHA-1 do EAS Build:
   ```bash
   eas credentials
   ```
2. Adicionar no Firebase Console:
   - Project Settings → Your apps → Android
   - Adicionar SHA-1 e SHA-256

---

### Problema: Build EAS falha com "Cannot find module"

**Causa:** Dependência faltando

**Solução:**
```bash
npx expo install --fix
rm -rf node_modules yarn.lock
yarn install
```

---

### Problema: VersionCode duplicado na Play Store

**Causa:** Arquivo `.aab` antigo sendo usado

**Solução:**
1. Incrementar versionCode no `app.json`
2. Fazer novo build: `eas build`
3. Baixar o NOVO arquivo `.aab`
4. Fazer upload do arquivo correto

---

### Problema: Backend retorna 500

**Causa:** API key não configurada ou MongoDB offline

**Solução:**
- Verificar `.env` do backend
- Testar endpoint: `GET /api/health`

---

## 14. Contatos e Suporte

**Desenvolvedor:**
- Nome: Adrian Cantero
- GitHub: `adriancantero-stack`
- Email: `adrian.cantero1@gm...`

**Repositório:**
- GitHub: `https://github.com/adriancantero-stack/easemind-app`

**Website:**
- URL: `https://easemind.io` (em desenvolvimento)

**Suporte:**
- Email: `support@easemind.io` (configurar)

---

## 15. Licença e Termos

**Termos de Uso:**  
`https://easemind.io/terms`

**Política de Privacidade:**  
`https://easemind.io/privacy`

**Licença:**  
Proprietário (todos os direitos reservados ao desenvolvedor)

---

## 16. Apêndices

### A. Lista Completa de Dependências (Frontend)

```json
{
  "@expo/ngrok": "^4.1.3",
  "@expo/vector-icons": "^15.0.3",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "@react-native-firebase/app": "^23.4.1",
  "@react-native-firebase/auth": "^23.4.1",
  "@react-native-google-signin/google-signin": "^16.0.0",
  "@react-navigation/bottom-tabs": "^7.3.10",
  "@react-navigation/elements": "^2.3.8",
  "@react-navigation/native": "^7.1.6",
  "date-fns": "^4.1.0",
  "expo": "^54.0.21",
  "expo-av": "^16.0.7",
  "expo-blur": "^15.0.7",
  "expo-constants": "~18.0.10",
  "expo-file-system": "^19.0.17",
  "expo-font": "~14.0.9",
  "expo-haptics": "~15.0.7",
  "expo-image": "~3.0.10",
  "expo-image-picker": "~17.0.8",
  "expo-linear-gradient": "^15.0.7",
  "expo-linking": "~8.0.8",
  "expo-localization": "^17.0.7",
  "expo-router": "~6.0.14",
  "expo-secure-store": "^15.0.7",
  "expo-splash-screen": "~31.0.10",
  "expo-status-bar": "~3.0.8",
  "expo-symbols": "~1.0.7",
  "expo-system-ui": "~6.0.8",
  "expo-web-browser": "~15.0.8",
  "firebase": "^12.4.0",
  "i18next": "^25.6.0",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "react-i18next": "^16.1.0",
  "react-native": "0.81.5",
  "react-native-chart-kit": "^6.12.0",
  "react-native-dotenv": "^3.4.11",
  "react-native-gesture-handler": "~2.28.0",
  "react-native-reanimated": "~4.1.1",
  "react-native-safe-area-context": "~5.6.0",
  "react-native-screens": "~4.16.0",
  "react-native-svg": "15.12.1",
  "react-native-web": "^0.21.0",
  "react-native-webview": "13.15.0",
  "zustand": "^5.0.8"
}
```

---

### B. Lista Completa de Dependências (Backend)

```txt
fastapi
uvicorn[standard]
python-dotenv
pymongo
openai
elevenlabs
pydantic
```

---

### C. Comandos Úteis

```bash
# Frontend
cd /app/frontend
yarn install
yarn start
eas build --platform android --profile production
eas credentials

# Backend
cd /app/backend
pip install -r requirements.txt
python server.py

# Git
git status
git add .
git commit -m "message"
git push

# Docker/Supervisorctl
sudo supervisorctl status
sudo supervisorctl restart expo
sudo supervisorctl restart backend
```

---

## 📝 Notas Finais

Este documento foi criado para fornecer uma visão completa e detalhada do EaseMind. Para informações adicionais ou atualizações, consulte o repositório GitHub ou entre em contato com o desenvolvedor.

**Última Atualização:** Novembro 2025  
**Versão do Documento:** 1.0

---

✨ **EaseMind** - Ease your mind. Heal your day.
