# EaseMind Project

EaseMind is a mental health application featuring a multilingual website and an AI-powered backend.

## 🚀 Deployment

This project is configured for automated deployment using GitHub Actions.

### Prerequisites

You need to add the following secrets to your GitHub repository settings (**Settings** > **Secrets and variables** > **Actions**):

| Secret Name | Description |
|-------------|-------------|
| `VERCEL_TOKEN` | Your Vercel account token. |
| `VERCEL_ORG_ID` | Your Vercel Organization ID (optional, if using a team). |
| `VERCEL_PROJECT_ID` | Your Vercel Project ID. |
| `RAILWAY_TOKEN` | Your Railway account token. |
| `BACKEND_URL` | The URL of your deployed backend on Railway (e.g., `https://easemind-backend.up.railway.app`). |
| `FIREBASE_CREDENTIALS` | The content of your Firebase service account JSON file (minified to a single line). |

### Automated Workflow

- **Website (Vercel)**: Pushes to `main` affecting the `website/` folder trigger a deploy to Vercel.
- **Backend (Railway)**: Pushes to `main` affecting the `backend/` folder trigger a deploy to Railway.

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
   # Root
   npm install

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

- `website/`: Express.js application (Frontend/Website).
- `backend/`: FastAPI application (AI/Chat backend).
- `.github/workflows/`: CI/CD configurations.
