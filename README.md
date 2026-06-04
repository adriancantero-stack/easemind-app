<div align="center">
  <img src="website/public/logo.png" alt="EaseMind Logo" width="150"/>
  <h1>EaseMind</h1>
  <p><b>Empathetic AI for Mental Wellness</b></p>
  <p>Find calm and clarity in minutes with Luna, your virtual therapist.</p>
</div>

---

## 📖 About The Project

**EaseMind** is a comprehensive mental health platform designed to provide immediate emotional support, guided mindfulness practices, and an emotional diary. The ecosystem consists of an **Expo/React Native Mobile App** and a highly-optimized **Node.js/Express Landing Page & Blog**.

Our virtual assistant, **Luna**, uses natural language processing to understand emotions and offer empathetic, context-aware responses—all without the wait for a traditional appointment.

### 🌟 Key Features

- **🧠 Empathetic Conversations**: Talk to Luna 24/7 for cognitive-behavioral support and anxiety relief.
- **🎧 Guided Sessions**: Short audio practices (4-7-8 breathing, box breathing, sleep relaxation) with ambient music.
- **🚨 SOS Emergency Button**: Immediate panic-attack relief with short breathing exercises and access to hotlines.
- **📔 Emotional Diary**: Track daily moods, identify triggers, and view emotional trends.
- **🌍 Full Internationalization (i18n)**: Seamlessly supports **English (en)**, **Portuguese (pt)**, and **Spanish (es)**.

---

## 🛠 Tech Stack

### Website / Landing Page
- **Backend:** Node.js, Express.js
- **Frontend:** HTML5, CSS3, Vanilla JS
- **SEO & Architecture:** 
  - Dynamic Markdown Blog Parsing (`marked`, `front-matter`)
  - Server-Side Rendering for ultra-fast load times
  - Advanced SEO (JSON-LD Schema, `hreflang` canonicals, Semantic HTML)

### Mobile Application
- **Framework:** React Native, Expo
- **Routing:** Expo Router
- **Backend/Database:** Firebase (Auth, Firestore, Cloud Functions)

---

## 📂 Project Structure

```text
easemind-app/
├── frontend/             # React Native (Expo) Mobile Application
│   ├── app/              # Expo Router screens
│   ├── components/       # Reusable UI components
│   └── constants/        # Theme, Colors, and Constants
│
├── website/              # Node.js Server & Landing Page
│   ├── content/blog/     # Markdown files for the blog (pt, en, es)
│   ├── locales/          # Translation JSON files (pt, en, es)
│   ├── public/           # Static assets (CSS, images, icons)
│   └── server.js         # Express server & HTML templating engine
└── README.md
```

---

## 🚀 How to Run

### 1. Website (Landing Page & Blog)

```bash
cd website
npm install
npm start
```
The website will be available at `http://localhost:9000`

### 2. Mobile App (Expo)

```bash
cd frontend
npm install
npx expo start
```
Scan the QR code with the Expo Go app on your phone, or press `i` to run on an iOS simulator.

---

## 🔒 Privacy & Security

EaseMind is committed to data privacy. We comply with GDPR and LGPD regulations. User conversations and emotional data are strictly confidential and securely stored in Firebase. The app does not provide medical diagnoses or prescriptions.

---

<div align="center">
  <p>Made with ❤️ to help you find calm.</p>
  <p>© 2026 EaseMind. All rights reserved.</p>
</div>
