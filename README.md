# AI Voice Interviewer Pro

> Multi-role AI voice interview simulator — React + Node.js + AWS RDS MySQL + Groq AI

---

## 5 Career Tracks · 3 Levels · Voice In + Voice Out · MySQL-Backed

| Role              | Interviewer | Icon |
|-------------------|-------------|------|
| DevOps Engineer   | Alex        | ⚙️  |
| Java Full Stack   | Priya       | ☕  |
| Data Analyst      | Morgan      | 📊  |
| Cybersecurity     | Jordan      | 🔐  |
| Cloud Engineer    | Sam         | ☁️  |

---

## Stack

| Layer        | Tech                                      |
|--------------|-------------------------------------------|
| Frontend     | React 18 + Vite + Tailwind CSS            |
| Backend      | Node.js + Express                         |
| Database     | **AWS RDS MySQL 8.0** + Sequelize ORM     |
| AI Chat      | Groq — Llama 3.3 70B Versatile            |
| Speech-to-Text | Groq — Whisper Large v3 Turbo           |
| Text-to-Speech | Web Speech API (browser-native)         |

---

## MySQL Schema (auto-created on startup)

```
sessions      → interview session per candidate
questions     → AI-generated questions (linked to session)
answers       → spoken answers + AI grading (linked to question)
leaderboard   → top scores by role/level (written on session complete)
```

Sequelize auto-syncs all tables to RDS on server startup. No manual migration needed.

---

## Quick Start — Local Dev

### 1. Get Groq API Key (free)
→ https://console.groq.com/keys

### 2. AWS RDS MySQL Setup
1. AWS Console → RDS → Create Database
2. Engine: **MySQL 8.0**
3. Template: Free tier / Production
4. DB name: `voice_interviewer`
5. Master username: `admin`
6. Enable Public access (or use same VPC)
7. Security Group: allow **TCP 3306** from your IP / EC2

Copy the endpoint: `your-db.xxxx.ap-south-1.rds.amazonaws.com`

### 3. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=4000
NODE_ENV=development

GROQ_API_KEY=gsk_your_key_here
GROQ_CHAT_MODEL=llama-3.3-70b-versatile
GROQ_WHISPER_MODEL=whisper-large-v3-turbo

DB_HOST=your-db.xxxx.ap-south-1.rds.amazonaws.com
DB_PORT=3306
DB_NAME=voice_interviewer
DB_USER=admin
DB_PASSWORD=your_rds_password

FRONTEND_URL=http://localhost:5173
```

### 4. Run Backend

```bash
cd backend
npm install
npm run dev
# Tables auto-created in RDS on first boot
# → http://localhost:4000/api/health
```

### 5. Run Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Docker — Local Dev with MySQL Container

```bash
# Set your Groq key (DB vars are auto-set by compose)
echo "GROQ_API_KEY=gsk_your_key" >> backend/.env

docker-compose up --build
# App: http://localhost:3000
# API: http://localhost:4000
```

---

## API Reference

| Method | Endpoint                         | Description                          |
|--------|----------------------------------|--------------------------------------|
| GET    | `/api/roles`                     | List all interview roles             |
| POST   | `/api/validate-key`              | Validate Groq API key                |
| POST   | `/api/sessions`                  | Create session → saved to RDS        |
| POST   | `/api/question`                  | Generate + save question to RDS      |
| POST   | `/api/transcribe`                | Whisper speech-to-text               |
| POST   | `/api/grade`                     | Grade answer + save to RDS           |
| PATCH  | `/api/sessions/:token/complete`  | Finalize score + write leaderboard   |
| GET    | `/api/sessions/:token/history`   | Full session review                  |
| GET    | `/api/leaderboard`               | Top scores (`?role=&level=&limit=`)  |
| GET    | `/api/leaderboard/stats`         | Aggregate stats per role             |
| GET    | `/api/health`                    | Health check + DB connectivity       |

---

## RDS Data Flow

```
Browser (mic) → Groq Whisper → transcript
transcript    → Groq Llama   → verdict + feedback
verdict       → RDS MySQL    → answers table
session end   → RDS MySQL    → sessions + leaderboard tables
```

Every question, answer, score, and feedback is stored permanently in your RDS MySQL instance.

---

## Production Deployment

### Backend → EC2

```bash
# backend/.env for production
NODE_ENV=production
DB_HOST=your-rds.ap-south-1.rds.amazonaws.com   # private endpoint (same VPC)
DB_PORT=3306
FRONTEND_URL=https://yourdomain.com

npm install --production
pm2 start src/server.js --name voice-backend
```

RDS Security Group: allow TCP 3306 **only from the backend EC2 security group**.

### Frontend → S3 + CloudFront or EC2 + nginx

```bash
cd frontend
echo "VITE_API_URL=/api" > .env.production
npm run build
# Upload dist/ to S3 or serve via nginx
```

Use the **Internal ALB** pattern from the main README for production two-ALB setup.

---

## Browser Requirements

- Chrome 90+ or Edge 90+ (best mic + TTS support)
- HTTPS required in production for microphone access
- Allow microphone when prompted
