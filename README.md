# SMB Bookkeeper

WhatsApp-based AI bookkeeping assistant for Africa's informal SMB economy. Merchants text sales, expenses, and debts in natural language (including Nigerian Pidgin English). The AI parses and stores data; a web dashboard visualizes the merchant's financial picture.

## Stack

- **Backend:** Python FastAPI, Supabase (PostgreSQL), Twilio WhatsApp Sandbox, Google Gemini 2.5 Flash
- **Frontend:** React Router v7, shadcn/ui, Tailwind v4, Vite

## Setup

### Backend

```bash
cd backend
cp .env.example .env   # Fill in Twilio, Gemini, Supabase keys
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
npm run dev
```

### Supabase

Run the SQL schema in `docs/supabase_schema.sql` (or from the spec) in the Supabase SQL Editor.

### Twilio

1. Join WhatsApp Sandbox at twilio.com.
2. Set webhook to `https://your-backend-url/webhook/whatsapp` (POST).
3. For local dev, use ngrok: `ngrok http 8000` and use the ngrok URL.

## Scripts

- **Seed demo data (90 days):** `python scripts/seed_data.py` (from repo root; requires `.env` with Supabase credentials).
- **Test LLM parsing:** `python scripts/test_messages.py` (requires `GEMINI_API_KEY`).

## Deployment

### Backend (Render.com)
1. Connect repo to Render; create Web Service.
2. Root directory: `backend` (or set build command to run from backend).
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add env vars from `backend/.env.example`. Ping `/health` before demo to wake free tier.

### Frontend (Vercel)
1. Import project; framework: Vite.
2. Build: `npm run build`; output: `dist`.
3. Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (your Render backend URL).

### Twilio WhatsApp Sandbox
1. Set webhook URL to `https://<your-render-url>/webhook/whatsapp`, method POST.
2. For local dev use ngrok: `ngrok http 8000` and set Twilio webhook to the ngrok URL.
