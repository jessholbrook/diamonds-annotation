# DIAMONDS Annotation

A small, focused tool for annotating LLM conversations across the **DIAMONDS** psychological framework. Chat with Claude, then rate the resulting conversation across 8 dimensions and view aggregate statistics.

Built with React + Vite + TypeScript on the frontend, FastAPI + SQLite on the backend, using the Anthropic SDK directly.

---

## What is DIAMONDS?

DIAMONDS is an 8-dimensional framework for analyzing situational characteristics in conversations. Each conversation is scored 0–1 with a salience level (none / low / moderate / high) on each dimension:

| Dimension | What it captures |
|-----------|-----------------|
| **D**uty | Work, obligations, responsibility |
| **I**ntellect | Cognitive challenges, problem-solving |
| **A**dversity | Conflicts, risks, difficulties |
| **M**ating | Romance, attraction |
| p**O**sitivity | Fun, enjoyment, humor |
| **N**egativity | Anxiety, threats |
| **D**eception | Manipulation, trickery |
| **S**ociality | Bonding, connection |

---

## Features

- **Chat with Claude** — streaming responses via the Anthropic SDK
- **Annotate** — 8 sliders (0–1) plus salience selectors and a notes field, saved per conversation
- **Stats dashboard** — aggregate mean scores and salience distributions across all annotations
- **Local-first** — single-user, SQLite storage in `backend/data/diamonds.db`, no auth

---

## Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- An **Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com/)

---

## Quick start

```bash
./setup.sh
```

Creates `backend/.env`, sets up a Python virtualenv, installs backend and frontend dependencies.

Then edit `backend/.env` and set `ANTHROPIC_API_KEY=...`.

Start the app:

```bash
./start.sh
```

- Frontend: <http://localhost:8080>
- Backend: <http://localhost:1337>
- API docs: <http://localhost:1337/docs>

Stop:

```bash
./stop.sh
```

---

## Configuration

`backend/.env`:

```
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-opus-4-7   # or claude-sonnet-4-6, claude-haiku-4-5
HOST=127.0.0.1
PORT=1337
```

Default model is `claude-opus-4-7`. Switch to `claude-sonnet-4-6` or `claude-haiku-4-5` if you want cheaper requests during development.

---

## Project layout

```
backend/
├── app/
│   ├── main.py             # FastAPI app
│   ├── config.py           # env-driven settings
│   ├── database.py         # SQLite schema + connection
│   ├── models.py           # Pydantic models
│   └── routes/
│       ├── chat.py         # POST /api/chat/stream (SSE)
│       ├── conversations.py
│       └── annotations.py  # PUT /api/annotations/{id}, GET /api/annotations/stats
├── data/                   # SQLite database lives here
├── requirements.txt
└── .env.example

frontend/
├── src/
│   ├── App.tsx             # main layout + state
│   ├── api.ts              # API client + SSE stream helper
│   ├── types.ts            # shared TypeScript types
│   └── components/
│       ├── Sidebar.tsx
│       ├── Chat.tsx
│       ├── Composer.tsx
│       ├── Message.tsx
│       ├── DiamondsAnnotator.tsx
│       └── DiamondsStats.tsx
├── package.json
└── vite.config.ts
```

---

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chat/stream` | Send a message, receive an SSE stream |
| `GET` | `/api/conversations` | List conversations |
| `GET` | `/api/conversations/{id}` | Get conversation with messages and annotation |
| `DELETE` | `/api/conversations/{id}` | Delete a conversation |
| `PUT` | `/api/annotations/{conversation_id}` | Save or update an annotation |
| `DELETE` | `/api/annotations/{conversation_id}` | Delete an annotation |
| `GET` | `/api/annotations/stats` | Aggregate annotation statistics |
| `GET` | `/health` | Health check |

Interactive docs at <http://localhost:1337/docs>.

---

## License

MIT
