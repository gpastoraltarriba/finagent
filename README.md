FinAgent — AI Financial Analyst

An agentic AI that analyzes stocks in real-time: live prices, news sentiment, technical indicators, and buy/hold/sell recommendations. Built for the Swiss market and beyond.

**🌐 Live demo: [finagent-pi.vercel.app](https://finagent-pi.vercel.app)**

![Stack](https://img.shields.io/badge/LLM-LLaMA_3.3_70B-green) ![Stack](https://img.shields.io/badge/Backend-FastAPI-blue) ![Stack](https://img.shields.io/badge/Frontend-Next.js_14-black) ![Stack](https://img.shields.io/badge/Data-Yahoo_Finance-purple)

## ✨ Features

- **Agentic tool use** — the LLM decides which tools to call (stock data, news, technical indicators)
- **Real-time streaming** — responses stream token-by-token with tool-use indicators
- **Live price charts** — 1-week / 1-month area charts with Recharts
- **Swiss stock support** — NESN.SW, NOVN.SW, ROG.SW, UBSG.SW, etc.
- **News sentiment analysis** — recent news fetched and analyzed per query
- **Technical indicators** — RSI, SMA-20/50, volatility computed on-the-fly

## 🛠 Tech Stack (all free)

| Layer | Technology | Cost |
|-------|-----------|------|
| LLM | Groq API (LLaMA 3.3 70B) | Free tier |
| Stock data | Yahoo Finance | Free, no key |
| News | NewsAPI | Free (100 req/day) |
| Backend | Python FastAPI + Railway | Free |
| Frontend | Next.js 14 + Vercel | Free |

## 🏗 Architecture
```
User Query → Next.js Frontend → FastAPI Backend → Groq (LLaMA 3.3)
                                                        ↓
                                         Tool use loop:
                                         ├── get_stock_data → Yahoo Finance
                                         ├── get_news → NewsAPI  
                                         └── calculate_metrics → RSI, SMA, Vol
                                                        ↓
                                    SSE stream back to frontend
```

## 🚀 Local Setup
```bash
# Backend
cd finagent/backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
# Add GROQ_API_KEY and NEWS_API_KEY to .env
uvicorn main:app --reload --port 8000

# Frontend
cd finagent/frontend
npm install && npm run dev
```

## ⚠️ Disclaimer

For educational and portfolio purposes only. Not financial advice.
