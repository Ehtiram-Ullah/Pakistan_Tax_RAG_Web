# TaxLens — Pakistan Tax Intelligence

An evidence-first research workspace for Pakistani tax legislation. Built with Next.js, React, FastAPI, Qdrant, BGE embeddings, and Gemini.

## What makes this project worth exploring

- An editorial, responsive interface with a persistent research workspace and inspectable source excerpts.
- Real streaming activity: retrieval → model attempt → failure reason → named fallback → completed answer.
- Explicit, bounded model routing instead of discovering and trying every model on startup.
- In-memory session history, linked citations, copy and Markdown export, cancellation, and recoverable errors.
- No invented progress percentages, placeholder chat history, or claims that similarity is legal confidence.

## Run locally

Requires Node.js 20.9+ and the backend in the sibling `Pakistan_Tax_RAG` repository.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

On PowerShell, use `Copy-Item .env.example .env.local` instead of `cp` if preferred. Open http://localhost:3000. Set `NEXT_PUBLIC_API_URL` to the FastAPI server origin; the default is http://127.0.0.1:8000. Restart Next.js after changing environment settings.

```sh
npm run lint
npm run build
npm start
```

The interface uses local system fonts and inline SVG icons, so rendering and builds do not require Google Fonts or an icon CDN.

## Streaming contract

`POST /ask/stream` accepts `{ "question": "..." }`. The response is newline-delimited JSON (`application/x-ndjson`). The reader buffers partial network chunks before parsing complete events.

| Event | Purpose |
| --- | --- |
| `retrieval_started` | The backend has begun searching |
| `retrieval_complete` | Retrieved passages, page numbers, and similarity scores |
| `discovery_started` / `discovery_complete` | Compatible model catalog lookup and candidate count |
| `model_skipped` | Recently failed model temporarily skipped with its reason |
| `model_started` | Model name, attempt number, total configured models |
| `model_failed` | Safe failure reason and the next model name, if any |
| `result` | Answer, sources, actual winning model, elapsed time |
| `error` | Recoverable operational error |

The client aborts requests after five minutes and detects streams that end without a result. Stop research cancels the browser request; a model call already running on the server can finish within its provider timeout. New questions are independent requests, not conversational memory. Session history is held only in memory and clears on refresh.

## Portfolio walkthrough

1. Start the backend with a real API key and indexed corpus.
2. Ask a suggested question and inspect the live activity panel.
3. Open a source passage and follow an inline citation.
4. Copy or download the research brief, then reopen it from session history.
5. To demonstrate failure handling deliberately, set the backend model list to an unavailable test model followed by a model your account supports. Explain that you intentionally triggered the first failure. Never present a simulated answer as live research.

## Deployment

Deploy the UI and API separately. Set `NEXT_PUBLIC_API_URL` **before building** the UI, and set the UI's exact origin in backend `CORS_ORIGINS`. Both services need HTTPS in production. Disable proxy buffering for `/ask/stream` and allow sufficient streaming request duration. Keep Gemini credentials on the backend only.

Before exposing a public paid API, add authentication and request throttling at the service or gateway. The local corpus is deployment-specific; the UI does not certify document currency or correctness.


During research, the activity panel moves into the main content area, receives keyboard focus once, and scrolls into view (respecting reduced-motion preferences). The current model and attempt count are prominent, and a highlighted banner names the fallback target and failure reason. The internal event log follows new events without repeatedly stealing page focus. After completion, the history moves back beside the answer.
