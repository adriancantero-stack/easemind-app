# EaseMind Project

EaseMind is a mental health application featuring a multilingual website, a PWA, and an AI-powered backend.

## 🚀 Deployment

This project uses **automatic deployment** via Vercel and Railway integrations:

- **Website (Vercel)**: Automatically deploys from the `main` branch when changes are pushed to `website/`
- **PWA (Vercel)**: Automatically deploys from the `main` branch  
- **Backend (Railway)**: Automatically deploys from the `main` branch when changes are pushed to `backend/`

### Environment Variables

Make sure the following environment variables are configured in each platform:

**Vercel (Website)**:
- `BACKEND_URL` - URL of the Railway backend (e.g., `https://api.easemind.io`)
- `FIREBASE_ADMIN_SDK` - Firebase Admin SDK credentials (JSON)
- `MONGO_URL` - MongoDB connection string

**Railway (Backend)**:
- `MONGO_URL` - MongoDB connection string
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `PORT` - Port number (default: 8001)
- `FIREBASE_CREDENTIALS` - Firebase service account credentials (JSON)

## 🛠️ Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/adriancantero-stack/easemind-app.git
   cd easemind-app
   ```

2. **Configure Environment Variables**
   Copy the example file to `.env`:
   ```bash
   cp env.example .env
   ```
   Fill in the values in `.env`.

3. **Install Dependencies**
   ```bash
   # Website
   cd website
   npm install

   # Backend
   cd ../backend
   pip install -r requirements.txt
   ```

4. **Run Locally**
   - **Website**: `cd website && npm run dev`
   - **Backend**: `cd backend && python3 server.py`

## 📂 Project Structure

- `website/`: Express.js application (Website/Landing Page)
- `backend/`: FastAPI application (AI/Chat backend)
- `frontend/`: React Native PWA (Mobile app)

## 🔗 Live URLs

- **Website**: https://easemind.vercel.app
- **PWA**: https://app.easemind.io
- **API**: https://api.easemind.io
