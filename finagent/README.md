# 🤖 FinAgent — AI Financial Analyst

An agentic AI that analyzes stocks in real-time: live prices, news sentiment, technical indicators, and buy/hold/sell recommendations. Built for the Swiss market and beyond.

![Stack](https://img.shields.io/badge/LLM-LLaMA_3.3_70B-green) ![Stack](https://img.shields.io/badge/Backend-FastAPI-blue) ![Stack](https://img.shields.io/badge/Frontend-Next.js_14-black) ![Stack](https://img.shields.io/badge/Data-Yahoo_Finance-purple)

## ✨ Features

- **Agentic tool use** — the LLM decides which tools to call (stock data, news, technical indicators)
- **Real-time streaming** — responses stream token-by-token with tool-use indicators
- **Live price charts** — 1-week / 1-month area charts with Recharts
- **Swiss stock support** — NESN.SW, NOVN.SW, ROG.SW, UBSG.SW, etc.
- **Sentiment analysis** — recent news fetched and analyzed per query
- **Technical indicators** — RSI, SMA-20/50, volatility computed on-the-fly

## 🛠 Tech Stack (all free)

| Layer | Technology | Cost |
|-------|-----------|------|
| LLM | Groq API (LLaMA 3.3 70B) | Free tier |
| Stock data | Yahoo Finance via yfinance | Free, no key |
| News | NewsAPI | Free (100 req/day) |
| Backend | Python FastAPI + uvicorn | Free |
| Frontend | Next.js 14 + Tailwind + Recharts | Free |

## 🚀 Quick Start

### 1. Get API keys (5 minutes)

**Groq (required):**
1. Go to https://console.groq.com
2. Sign up (free)
3. Create an API key

**NewsAPI (optional but recommended):**
1. Go to https://newsapi.org/register
2. Sign up (free, 100 req/day)
3. Copy your API key

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY (and optionally NEWS_API_KEY)

# Start the server
uvicorn main:app --reload --port 8000
```

The API will be at: http://localhost:8000
Swagger docs: http://localhost:8000/docs

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open: http://localhost:3000

## 💬 Example queries

- "Analyze Nestlé (NESN.SW) — should I buy now?"
- "What's happening with NVIDIA? Latest news and technicals"
- "Compare Apple vs Microsoft — which has better fundamentals?"
- "Is Novartis (NOVN.SW) a good defensive play right now?"
- "Analyze UBS after the Credit Suisse acquisition"

## 🏗 Architecture

```
User Query
    │
    ▼
Next.js Frontend (chat UI + Recharts dashboard)
    │ POST /api/chat/stream
    ▼
FastAPI Backend
    │
    ▼
Groq API (LLaMA 3.3 70B) ← Tool-use loop
    │
    ├── get_stock_data(ticker)  → Yahoo Finance (yfinance)
    ├── get_news(query)         → NewsAPI
    └── calculate_metrics(ticker) → Computed from price history
    │
    ▼
Server-Sent Events stream back to frontend
    │
    ├── tool_use events  → show tool badges in UI
    ├── stock_data events → update chart + metrics panel
    └── text events      → stream the analysis text
```

## 📁 Project Structure

```
finagent/
├── backend/
│   ├── main.py          # FastAPI app + all tool functions
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx        # Main layout + state
    │   │   ├── layout.tsx
    │   │   └── globals.css
    │   └── components/
    │       ├── ChatPanel.tsx   # Chat messages + tool badges
    │       ├── StockPanel.tsx  # Chart + metrics dashboard
    │       └── SuggestedQueries.tsx
    ├── package.json
    └── tailwind.config.js
```

## ⚠️ Disclaimer

This tool is for educational and portfolio demonstration purposes only. It is NOT financial advice. Always consult a qualified financial advisor before making investment decisions.

---

Built with ❤️ for the Swiss job market · Stack: FastAPI + Next.js + Groq + yfinance
