# EaseMind - Mental Health Support App 🌿

**Tagline:** *Ease your mind. Heal your day.*

A mobile-first mental health app providing immediate emotional support for anxiety and stress through AI-powered chat, panic button, guided sessions, and journaling.

---

## 🎯 Features Implemented (MVP Core)

### ✅ 1. HOME - AI Chat Therapy
- **Mood Picker**: 5-level emoji scale (Very Bad → Excellent)
- **AI-Powered Chat**: Empathetic responses using GPT-4.1-mini via Emergent LLM Key
- **Quick Actions**: 
  - Breathe 2 min
  - Calm now
  - Write thought
- **Real-time Support**: Streaming AI responses with safety features
- **Crisis Detection**: Automatic detection of self-harm keywords with emergency resources
- **Multilingual**: English, Portuguese (BR), Spanish

### ✅ 2. PANIC BUTTON (Floating FAB)
- **Always Accessible**: Pulsing heart icon visible across all screens
- **Breathing Animation**: Expanding/contracting circle (3s cycles)
- **Box Breathing Guide**: 4-4-4-4 cycle with text sync
- **Haptic Feedback**: Gentle vibrations at phase transitions
- **6 Cycle Session**: ~60-90 seconds of guided breathing
- **Post-Panic Options**: Talk to AI, Quick meditation, Log feeling
- **Offline Support**: Works without internet connection

### ✅ 3. SESSIONS - Guided Exercises
- **8 Pre-Built Sessions**:
  - Box Breathing (2 min)
  - 4-7-8 Breathing (3 min)
  - Progressive Muscle Relaxation (5 min)
  - Gratitude Practice (2 min)
  - Body Scan for Sleep (5 min)
  - Quick Calm (1 min)
  - Evening Wind Down (3 min)
  - Mindful Moment (2 min)
- **Categories**: Breathing, Relaxation, Gratitude, Sleep
- **Step-by-Step Guidance**: Clear instructions with progress tracking
- **Session Logging**: Automatically saves completed sessions

### ✅ 4. JOURNAL - History & Reflections
- **Timeline View**: Grouped by day with mood and activities
- **Mood Tracking**: Visual emoji display of daily moods
- **Session Logs**: Shows completed exercises
- **Empty State**: Encouraging messages to start journey
- **Date Formatting**: Human-readable dates (e.g., "January 18, 2025")

### ✅ 5. PROFILE - Settings & Privacy
- **Language Switcher**: EN / PT-BR / ES
- **Theme Toggle**: Dark mode (default) / Light mode
- **Privacy Info**: Clear explanation of local data storage
- **Crisis Resources**: Emergency helplines (988 US, 188 Brazil, 024 Spain)
- **Disclaimers**: "Not a replacement for professional therapy"

---

## 🎨 Design System

### Color Palette (Dark Mode - Default)
```
Background:    #0E1A2B (Deep calm blue)
Cards:         #122238 (Subtle elevation)
Text Primary:  #EAF4FF (High contrast white-blue)
Text Muted:    #B7C7DA (Secondary text)
Accent 1:      #C8B6FF (Lilac)
Accent 2:      #A3CFFF (Light blue)
Panic FAB:     Gradient #C8B6FF → #A3CFFF
```

### Typography
- Font: System default (Inter/SF Pro on iOS, Roboto on Android)
- Sizes: 12-32px with proper hierarchy
- Line heights: 1.4-1.6 for readability

### Spacing
- Base unit: 4px
- Scale: xs(4), sm(8), md(16), lg(24), xl(32), xxl(48)

### Border Radius
- Standard: 16px (cards, buttons)
- Pills: 20-32px (chips, badges)
- Circle: 50% (mood buttons, FAB)

### Animations
- Duration: 200-250ms for microinteractions
- Easing: Default native ease-in-out
- Breathing circle: 3-4 second cycles

---

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: Expo (React Native)
- **Router**: expo-router (file-based routing)
- **State**: Zustand (lightweight, TypeScript-first)
- **Storage**: AsyncStorage (encrypted data)
- **I18n**: i18next + react-i18next
- **Animations**: react-native-reanimated
- **Haptics**: expo-haptics

### Backend Stack
- **Framework**: FastAPI (Python)
- **AI**: Emergent LLM Key (GPT-4.1-mini via emergentintegrations)
- **Database**: MongoDB (placeholder for future sync)

### File Structure
```
/app/frontend/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Tab navigation + Panic FAB
│   │   ├── index.tsx          # HOME - Chat screen
│   │   ├── sessions.tsx       # SESSIONS - Guided exercises
│   │   ├── journal.tsx        # JOURNAL - History
│   │   └── profile.tsx        # PROFILE - Settings
│   ├── _layout.tsx            # Root layout
│   └── session-detail.tsx     # Session player
├── components/
│   ├── MoodPicker.tsx
│   ├── ChatBubble.tsx
│   ├── BreathAnimation.tsx
│   └── PanicModal.tsx
├── store/
│   └── useStore.ts            # Zustand global state
├── utils/
│   ├── i18n.ts                # i18next config
│   └── theme.ts               # Design tokens
├── data/
│   └── sessions.ts            # 8 pre-built sessions
└── i18n/
    └── translations.ts        # EN/PT-BR/ES strings

/app/backend/
└── server.py                  # FastAPI + AI chat
```

---

## 🔐 Privacy & Safety

### Data Storage
- **Local First**: All conversations stored on device with AsyncStorage
- **Encrypted**: Sensitive data encrypted at rest
- **No Cloud Sync** (in MVP): Data never leaves device
- **User Control**: Settings explain what's stored

### Crisis Detection
- **Keyword Monitoring**: Detects self-harm language in 3 languages
- **Emergency Resources**: Automatically provides helplines
- **Supportive Tone**: Extra compassionate responses
- **Clear Disclaimers**: "This is not therapy" messaging

### AI System Prompt
```
Core principles:
- Speak calmly, empathetically, briefly (2-4 sentences)
- Never diagnose or replace therapy
- Validate feelings: "What you're feeling is valid"
- Offer breathing exercises when distressed
- Detect crisis signals → recommend professional help
- Match user's language (EN/PT-BR/ES)
```

---

## 📱 URLs & Access

### Web Preview
- **URL**: https://speech-chat-app.preview.emergentagent.com
- **Best for**: Desktop testing, feature demos

### Mobile Testing (Expo Go)
1. Install Expo Go app (iOS/Android)
2. Open camera and scan QR code from terminal
3. Wait for bundle to load (~30s first time)

### Backend API
- **Health Check**: `GET /api/health`
- **Chat Endpoint**: `POST /api/chat`
- **Body**: `{"message": "your message here"}`

---

## 🧪 Testing Results

### Backend API ✅
- ✅ Root endpoint responding
- ✅ Health check working
- ✅ AI chat with empathetic responses
- ✅ Multilingual support (EN/PT/ES)
- ✅ Crisis detection functional
- ✅ Emergency resources included

### Frontend ✅
- ✅ Tab navigation working
- ✅ Mood picker interactive
- ✅ Chat UI rendering
- ✅ Quick action chips
- ✅ Sessions list with 8 items
- ✅ Session detail with progress
- ✅ Journal timeline
- ✅ Profile settings
- ✅ Language switching
- ✅ Theme toggle (dark/light)
- ✅ Panic FAB visible and pulsing

### Known Limitations
- ⚠️ Panic FAB may overlap send button on web (optimized for mobile)
- ⚠️ Web animations use JS fallback (native driver unavailable)
- ⚠️ No push notifications yet (future feature)

---

## 🚀 Running the App

### Prerequisites
- Frontend runs on port 3000 (Expo)
- Backend runs on port 8001 (FastAPI)
- MongoDB on port 27017

### Start Services
```bash
# Backend
sudo supervisorctl restart backend

# Frontend
sudo supervisorctl restart expo
```

### Test Backend
```bash
curl http://localhost:8001/api/health
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I feel anxious"}'
```

---

## 🌍 Accessibility

### Built-in Features
- ✅ Large touch targets (44x44 min)
- ✅ High contrast colors (WCAG AA)
- ✅ Screen reader labels (aria-labels)
- ✅ Font scaling support
- ✅ Keyboard navigation
- ✅ No reliance on color alone

### Future Enhancements
- Voice-over optimization
- Font size controls in settings
- Reduced motion option

---

## 📊 Session Data

All 8 sessions included with:
- Title, category, duration
- Step-by-step instructions
- Progress tracking
- Completion logging

**Example Session**: Box Breathing
```
Duration: 2 minutes
Steps: 8 guided steps
Pattern: Inhale 4 → Hold 4 → Exhale 4 → Hold 4
```

---

## 🔑 Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
EMERGENT_LLM_KEY=your-emergent-key-here
OPENAI_API_KEY=your-openai-key-here
```

### Frontend (.env)
```
EXPO_PUBLIC_BACKEND_URL=https://speech-chat-app.preview.emergentagent.com
EXPO_PACKAGER_HOSTNAME=https://speech-chat-app.preview.emergentagent.com
```

---

## 🎯 Future Enhancements (Post-MVP)

### Phase 2
- [ ] Push notifications (morning/evening check-ins)
- [ ] Audio-guided sessions (ElevenLabs integration)
- [ ] Export journal as PDF
- [ ] Cloud sync option (Supabase)
- [ ] Social auth (Google/Apple)

### Phase 3
- [ ] Mood trends & insights
- [ ] Custom session creation
- [ ] Share sessions with therapist
- [ ] Community resources directory
- [ ] Widget for iOS/Android

---

## 📝 Credits

- **AI Model**: GPT-4.1-mini via Emergent LLM Key
- **Design Inspiration**: Calm, Headspace, Woebot
- **Crisis Resources**: National Suicide Prevention Lifeline, CVV Brasil

---

## ⚠️ Important Disclaimer

**EaseMind is not a replacement for professional mental health care.**

If you're experiencing a mental health crisis:
- 🇺🇸 US: Call/Text 988 (Suicide & Crisis Lifeline)
- 🇧🇷 Brazil: Call 188 (CVV - Centro de Valorização da Vida)
- 🇪🇸 Spain: Call 024
- 🌍 International: https://findahelpline.com

For ongoing support, please consult a licensed therapist or counselor.

---

**Built with ❤️ using Expo, FastAPI, and Emergent LLM**

Version: 1.0.0 MVP
Last Updated: January 2025
