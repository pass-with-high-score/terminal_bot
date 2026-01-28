# 🖥️ Telegram SSH Terminal Mini App

A full-featured SSH terminal as a Telegram Mini App with real-time terminal emulation.

## ✨ Features

- 🔐 Password and private key authentication
- ⚡ Real-time terminal with WebSocket
- 🎨 Beautiful dark theme UI
- 📱 Responsive design for mobile
- 🔧 Full PTY support (vim, nano, htop, etc.)
- 🌐 Works inside Telegram app

## 📁 Project Structure

```
terminal_bot/
├── backend/                 # FastAPI backend
│   ├── main.py             # API endpoints & WebSocket
│   ├── ssh_handler.py      # SSH session management
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment config
│
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx         # Main component
│   │   ├── App.css         # Styles
│   │   └── components/
│   │       ├── Header.jsx      # Header with status
│   │       ├── ConnectForm.jsx # SSH connection form
│   │       └── Terminal.jsx    # xterm.js terminal
│   ├── index.html
│   └── package.json
│
├── bot.py                  # Telegram bot with Mini App
├── main.py                 # Bot entry point
└── README.md
```

## 🚀 Quick Start

### 1. Setup Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env if needed

# Run backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env if needed (API URLs)

# Run development server
npm run dev
```

### 3. Setup Telegram Bot

```bash
# In root directory
cd ..

# Configure bot
cp .env.example .env
# Add your TELEGRAM_BOT_TOKEN
# Set MINI_APP_URL to your frontend URL

# Run bot
source venv/bin/activate
python main.py
```

## 🌐 Deployment for Telegram Mini App

> ⚠️ **Important**: Telegram Mini Apps require HTTPS URLs.

### Option 1: ngrok (for development)

```bash
# Terminal 1: Backend
ngrok http 8000
# Note the https URL, e.g., https://abc123.ngrok.io

# Terminal 2: Frontend
# Update frontend/.env with backend ngrok URL
# Then run: npm run dev

# Terminal 3: ngrok for frontend
ngrok http 5173
# Use this URL for MINI_APP_URL in bot .env
```

### Option 2: Production Deployment

**Backend (Railway, Render, etc.):**
```bash
cd backend
# Deploy and get URL like https://your-backend.railway.app
```

**Frontend (Vercel, Netlify, etc.):**
```bash
cd frontend
npm run build
# Deploy dist/ folder
# Get URL like https://your-app.vercel.app
```

### Configure Bot

1. Open [@BotFather](https://t.me/botfather)
2. Select your bot
3. Go to **Bot Settings** → **Menu Button** → **Configure Menu Button**
4. Set URL to your Mini App URL
5. Or just use the `/terminal` command

## 🔧 API Reference

### REST Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/api/connect` | POST | Create SSH connection |
| `/api/disconnect/{session_id}` | POST | Close SSH connection |
| `/api/resize/{session_id}` | POST | Resize terminal |

### WebSocket

**Endpoint:** `/ws/terminal/{session_id}`

**Client → Server:**
```json
{"type": "input", "data": "ls -la\n"}
{"type": "resize", "cols": 80, "rows": 24}
{"type": "ping"}
```

**Server → Client:**
```json
{"type": "output", "data": "..."}
{"type": "error", "message": "..."}
{"type": "pong"}
```

## 🛡️ Security Notes

1. **HTTPS Required**: Mini Apps must use HTTPS
2. **No Storage**: Credentials are not persisted
3. **Direct Connection**: SSH goes through your backend only
4. **Session Cleanup**: Sessions are cleaned on disconnect

## 📝 Development

### Backend Hot Reload
```bash
uvicorn main:app --reload
```

### Frontend Hot Reload
```bash
npm run dev
```

### Build Frontend
```bash
npm run build
```

## 🐛 Troubleshooting

**Mini App not opening:**
- Ensure URL is HTTPS
- Check BotFather configuration

**WebSocket connection failed:**
- Verify backend is running
- Check CORS settings
- Ensure correct WS URL in frontend

**SSH connection failed:**
- Check host/port accessibility
- Verify credentials
- Check server firewall

## 📄 License

MIT License
