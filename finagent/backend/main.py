from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import yfinance as yf

import httpx
import json
import os
import asyncio
from datetime import datetime, timedelta
from typing import Optional
import re

app = FastAPI(title="FinAgent API", version="1.0.0")
yf.set_tz_cache_location("/tmp")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https://.*\.vercel\.app",
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"

# ─── Tool functions ────────────────────────────────────────────────────────────

def get_stock_data(ticker: str) -> dict:
    """Fetch real-time stock data from Yahoo Finance."""
    try:
        from curl_cffi import requests as curl_requests
        session = curl_requests.Session(impersonate="chrome")
        stock = yf.Ticker(ticker.upper(), session=session)
        info = stock.info
        hist = stock.history(period="1mo", interval="1d")

        price_history = []
        for date, row in hist.iterrows():
            price_history.append({
                "date": date.strftime("%Y-%m-%d"),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
            })

        return {
            "ticker": ticker.upper(),
            "name": info.get("longName", ticker),
            "price": info.get("currentPrice") or info.get("regularMarketPrice"),
            "change": info.get("regularMarketChange"),
            "change_pct": info.get("regularMarketChangePercent"),
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE"),
            "52w_high": info.get("fiftyTwoWeekHigh"),
            "52w_low": info.get("fiftyTwoWeekLow"),
            "volume": info.get("regularMarketVolume"),
            "avg_volume": info.get("averageVolume"),
            "sector": info.get("sector", "N/A"),
            "currency": info.get("currency", "USD"),
            "price_history": price_history,
            "summary": info.get("longBusinessSummary", "")[:400],
        }
    except Exception as e:
        return {"error": str(e), "ticker": ticker}


def get_news(query: str, days: int = 7) -> list:
    """Fetch news from NewsAPI."""
    if not NEWS_API_KEY:
        return [{"title": "NewsAPI key not configured", "description": "Add NEWS_API_KEY to .env", "url": "#", "publishedAt": "", "source": ""}]
    try:
        from_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        url = (
            f"https://newsapi.org/v2/everything"
            f"?q=\"{query}\"&from={from_date}&sortBy=publishedAt"
            f"&language=en&pageSize=8&apiKey={NEWS_API_KEY}"
        )
        import requests
        resp = requests.get(url, timeout=10)
        data = resp.json()
        articles = data.get("articles", [])
        return [
            {
                "title": a.get("title", ""),
                "description": a.get("description", ""),
                "url": a.get("url", ""),
                "publishedAt": a.get("publishedAt", ""),
                "source": a.get("source", {}).get("name", ""),
            }
            for a in articles[:8]
        ]
    except Exception as e:
        return [{"title": f"Error: {e}", "description": "", "url": "#", "publishedAt": "", "source": ""}]


def calculate_metrics(ticker: str) -> dict:
    """Calculate technical metrics for a stock."""
    try:
        stock = yf.Ticker(ticker.upper())
        hist = stock.history(period="3mo", interval="1d")
        closes = hist["Close"].tolist()

        if len(closes) < 20:
            return {"error": "Not enough data"}

        sma_20 = sum(closes[-20:]) / 20
        sma_50 = sum(closes[-50:]) / 50 if len(closes) >= 50 else None
        volatility = (max(closes[-20:]) - min(closes[-20:])) / min(closes[-20:]) * 100

        # RSI calculation (14-period)
        deltas = [closes[i] - closes[i - 1] for i in range(1, len(closes))]
        gains = [d for d in deltas[-14:] if d > 0]
        losses = [abs(d) for d in deltas[-14:] if d < 0]
        avg_gain = sum(gains) / 14 if gains else 0
        avg_loss = sum(losses) / 14 if losses else 0
        rs = avg_gain / avg_loss if avg_loss > 0 else 100
        rsi = 100 - (100 / (1 + rs))

        return {
            "sma_20": round(sma_20, 2),
            "sma_50": round(sma_50, 2) if sma_50 else None,
            "rsi": round(rsi, 1),
            "volatility_pct": round(volatility, 2),
            "current_vs_sma20": round((closes[-1] - sma_20) / sma_20 * 100, 2),
        }
    except Exception as e:
        return {"error": str(e)}


# ─── Tool definitions for Groq ────────────────────────────────────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_stock_data",
            "description": "Get real-time stock price, financials and 1-month price history for a ticker symbol.",
            "parameters": {
                "type": "object",
                "properties": {
                    "ticker": {"type": "string", "description": "Stock ticker symbol e.g. NVDA, AAPL, NESN.SW"}
                },
                "required": ["ticker"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_news",
            "description": "Search recent financial news articles for a company or topic.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query e.g. 'Nestlé earnings', 'NVIDIA AI chips'"},
                    "days": {"type": "integer", "description": "How many days back to search (default 7)"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_metrics",
            "description": "Calculate technical indicators: RSI, SMA-20, SMA-50, volatility for a stock.",
            "parameters": {
                "type": "object",
                "properties": {
                    "ticker": {"type": "string", "description": "Stock ticker symbol"}
                },
                "required": ["ticker"],
            },
        },
    },
]

SYSTEM_PROMPT = """You are FinAgent, an expert financial analyst AI. You have access to real-time stock data, news, and technical indicators.

When analyzing a stock or answering financial questions:
1. Always fetch current price data first
2. Check recent news for sentiment
3. Calculate technical metrics when relevant
4. Provide a clear BUY / HOLD / SELL recommendation with reasoning
5. Mention key risks

Important: You analyse Swiss and global stocks. Swiss tickers end in .SW (e.g. NESN.SW, NOVN.SW, ROG.SW).
Always structure your final answer with: 📊 Data Summary, 📰 News Sentiment, 🎯 Technical View, ✅ Recommendation.
Be concise, professional, and actionable. You are NOT a licensed financial advisor — always add a brief disclaimer."""


# ─── Routes ───────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@app.get("/api/stock/{ticker}")
async def stock_endpoint(ticker: str):
    data = get_stock_data(ticker)
    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])
    return data


@app.get("/api/news/{query}")
async def news_endpoint(query: str, days: int = 7):
    return get_news(query, days)


@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    """Streaming agentic chat with tool use via Groq."""

    async def generate():
        messages = [{"role": m.role, "content": m.content} for m in request.messages]

        async with httpx.AsyncClient(timeout=60.0) as client:
            max_iterations = 5
            iteration = 0

            while iteration < max_iterations:
                iteration += 1
                payload = {
                    "model": GROQ_MODEL,
                    "messages": [{"role": "system", "content": SYSTEM_PROMPT}] + messages,
                    "tools": TOOLS,
                    "tool_choice": "auto",
                    "max_tokens": 2048,
                    "temperature": 0.3,
                    "stream": False,
                }

                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()
                choice = data["choices"][0]
                msg = choice["message"]

                # If the model wants to call tools
                if choice["finish_reason"] == "tool_calls" and msg.get("tool_calls"):
                    messages.append(msg)
                    tool_results = []

                    for tool_call in msg["tool_calls"]:
                        fn_name = tool_call["function"]["name"]
                        fn_args = json.loads(tool_call["function"]["arguments"])

                        # Notify frontend about tool usage
                        yield f"data: {json.dumps({'type': 'tool_use', 'tool': fn_name, 'args': fn_args})}\n\n"

                        # Execute the tool
                        if fn_name == "get_stock_data":
                            result = get_stock_data(**fn_args)
                        elif fn_name == "get_news":
                            result = get_news(**fn_args)
                        elif fn_name == "calculate_metrics":
                            result = calculate_metrics(**fn_args)
                        else:
                            result = {"error": f"Unknown tool: {fn_name}"}

                        # Send structured data for UI rendering
                        if fn_name == "get_stock_data" and "price_history" in result:
                            yield f"data: {json.dumps({'type': 'stock_data', 'data': result})}\n\n"

                        tool_results.append({
                            "role": "tool",
                            "tool_call_id": tool_call["id"],
                            "content": json.dumps(result),
                        })

                    messages.extend(tool_results)

                else:
                    # Final text response — stream it word by word for effect
                    content = msg.get("content", "")
                    words = content.split(" ")
                    for i, word in enumerate(words):
                        chunk = word + (" " if i < len(words) - 1 else "")
                        yield f"data: {json.dumps({'type': 'text', 'content': chunk})}\n\n"
                        await asyncio.sleep(0.02)

                    yield f"data: {json.dumps({'type': 'done'})}\n\n"
                    break

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.get("/api/health")
def health():
    return {"status": "ok", "model": GROQ_MODEL}
