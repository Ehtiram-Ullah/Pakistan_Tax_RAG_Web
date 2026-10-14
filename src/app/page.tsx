"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type Source = {
  id: number;
  document: string;
  page: number | null;
  score: number;
  excerpt: string;
};
type Result = {
  question: string;
  answer: string;
  sources: Source[];
  model: string | null;
  elapsed_ms: number;
};
type Activity = {
  type: string;
  model?: string;
  reason?: string;
  next_model?: string;
  message?: string;
  attempt?: number;
  total?: number;
};
type Research = { id: string; result: Result; activity: Activity[] };
const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");
const suggestions = [
  {
    icon: "income",
    tag: "PERSONAL INCOME",
    title: "Understand your salary tax",
    question:
      "What are the tax rates for salaried individuals, and which tax year do the retrieved provisions apply to?",
  },
  {
    icon: "car",
    tag: "VEHICLE TAX",
    title: "Look into vehicle taxation",
    question: "What is the tax on a motor vehicle between 1601cc and 1800cc?",
  },
  {
    icon: "business",
    tag: "BUSINESS EXPENSES",
    title: "Find allowable deductions",
    question:
      "What are the conditions for claiming business expenses as tax deductions?",
  },
];

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    book: (
      <>
        <path d="M12 5v15M3 4c4-1 7 0 9 2 2-2 5-3 9-2v15c-4-1-7 0-9 2-2-2-5-3-9-2Z" />
      </>
    ),
    pulse: <path d="M2 12h4l3-7 5 14 3-7h5" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    income: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="3" />
        <path d="M8 7h8M8 12h2m4 0h2m-8 4h2m4 0h2" />
      </>
    ),
    car: (
      <>
        <path d="m5 8 2-4h10l2 4M4 8h16v10H4zM7 18v2m10-2v2M7 12h2m6 0h2" />
      </>
    ),
    business: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="3" />
        <path d="M8 7V3h8v4M3 12c5 4 13 4 18 0M12 12v4" />
      </>
    ),
    file: (
      <>
        <path d="M14 3H5v18h14V8zM14 3v5h5M8 12h8M8 16h6" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="13" rx="2" />
        <path d="M16 8V3H3v13h5" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    sparkle: (
      <>
        <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" />
      </>
    ),
    switch: (
      <>
        <path d="M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.file}
    </svg>
  );
}

function documentName(name: string) {
  return name
    .replace(/\.pdf$/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function Answer({ text, sources }: { text: string; sources: Source[] }) {
  function inline(value: string) {
    return value.split(/(\*\*.*?\*\*|\[\d+\])/g).map((part, i) => {
      if (part.startsWith("**"))
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (/^\[\d+\]$/.test(part)) {
        const id = Number(part.slice(1, -1));
        if (sources.some((s) => s.id === id))
          return (
            <a
              className="citation"
              key={i}
              href={`#source-${id}`}
              onClick={() => {
                const source = document.getElementById(`source-${id}`);
                if (source instanceof HTMLDetailsElement) source.open = true;
              }}
              aria-label={`Read source ${id}`}
            >
              {id}
            </a>
          );
      }
      return part;
    });
  }
  return (
    <div className="answer-prose">
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div className="paragraph-gap" key={i} />;
        if (/^#{1,6}\s/.test(line))
          return <h3 key={i}>{inline(line.replace(/^#{1,6}\s/, ""))}</h3>;
        if (/^\s*[-*]\s/.test(line))
          return (
            <div className="answer-bullet" key={i}>
              <span>•</span>
              <p>{inline(line.replace(/^\s*[-*]\s/, ""))}</p>
            </div>
          );
        return <p key={i}>{inline(line)}</p>;
      })}
    </div>
  );
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [history, setHistory] = useState<Research[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [health, setHealth] = useState<
    "checking" | "ready" | "unconfigured" | "offline"
  >("checking");
  const [view, setView] = useState<"research" | "about">("research");
  const [notice, setNotice] = useState("");
  const controller = useRef<AbortController | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const abort = new AbortController();
    fetch(`${API}/health`, { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) =>
        setHealth(data.generation_configured ? "ready" : "unconfigured"),
      )
      .catch(() => {
        if (!abort.signal.aborted) setHealth("offline");
      });
    const timer = setTimeout(() => {
      setHealth((current) => (current === "checking" ? "offline" : current));
      abort.abort();
    }, 6000);
    return () => {
      clearTimeout(timer);
      abort.abort();
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (!loading) return;
    const start = Date.now();
    const timer = setInterval(
      () => setElapsed(Math.floor((Date.now() - start) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, [loading]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  function reset() {
    controller.current?.abort();
    controller.current = null;
    setLoading(false);
    setQuestion("");
    setSubmitted("");
    setResult(null);
    setActivity([]);
    setSources([]);
    setError("");
    setView("research");
    setTimeout(() => input.current?.focus(), 0);
  }

  async function ask(text = question) {
    const query = text.trim();
    if (query.length < 3 || loading) return;
    const abort = new AbortController();
    controller.current = abort;
    setQuestion(query);
    setSubmitted(query);
    setResult(null);
    setActivity([]);
    setSources([]);
    setError("");
    setElapsed(0);
    setLoading(true);
    setView("research");
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      abort.abort();
    }, 300000);
    const events: Activity[] = [];
    let completed = false;
    try {
      const response = await fetch(`${API}/ask/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
        signal: abort.signal,
      });
      if (!response.ok)
        throw new Error(
          response.status === 422
            ? "Please enter a question between 3 and 2,000 characters."
            : `The research service is unavailable (${response.status}). Please try again.`,
        );
      if (!response.body)
        throw new Error("Your browser could not open the research stream.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const receive = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line);
        if (controller.current !== abort) return;
        if (event.type === "error") throw new Error(event.message);
        if (event.type === "result") {
          completed = true;
          const answer = event as Result;
          setResult(answer);
          setSources(answer.sources);
          setHistory((old) =>
            [
              {
                id: crypto.randomUUID(),
                result: answer,
                activity: [...events],
              },
              ...old,
            ].slice(0, 12),
          );
          return;
        }
        if (event.type === "retrieval_complete") setSources(event.sources);
        events.push(event);
        setActivity([...events]);
      };
      try {
        while (true) {
          const { value, done } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          lines.forEach(receive);
          if (done) {
            receive(buffer);
            break;
          }
        }
      } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
      if (!completed)
        throw new Error(
          "The connection ended before an answer arrived. Please retry your question.",
        );
    } catch (err) {
      if (controller.current !== abort) return;
      if (abort.signal.aborted)
        setError(
          timedOut
            ? "Research took too long. The first search may need to load the embedding model. Please retry."
            : "Research stopped. Your question is ready to try again.",
        );
      else
        setError(
          err instanceof TypeError
            ? "Cannot reach the API. Start the backend or check NEXT_PUBLIC_API_URL, then try again."
            : err instanceof Error
              ? err.message
              : "Something went wrong. Please try again.",
        );
    } finally {
      clearTimeout(timeout);
      if (controller.current === abort) {
        setLoading(false);
        controller.current = null;
      }
    }
  }

  async function copyAnswer() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.answer);
      setNotice("Answer copied to clipboard");
    } catch {
      setNotice("Clipboard unavailable. Select the answer to copy it.");
    }
  }
  function download() {
    if (!result) return;
    const report = `# TaxLens research\n\n${result.question}\n\n${result.answer}\n\n## Retrieved evidence\n\n${result.sources.map((s) => `[${s.id}] ${documentName(s.document)}, page ${s.page ?? "unknown"}\n${s.excerpt}`).join("\n\n")}\n\nModel: ${result.model || "None"}\nResearch aid only. Verify the source text and applicable tax year.`;
    const url = URL.createObjectURL(
      new Blob([report], { type: "text/markdown;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "taxlens-research.md";
    link.click();
    URL.revokeObjectURL(url);
  }
  const active = loading || !!submitted;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button onClick={reset} className="brand" aria-label="TaxLens home">
          <span className="brand-mark">
            <Icon name="book" size={23} />
          </span>
          <span>
            taxlens<span className="brand-dot">.</span>
            <small>PAKISTAN TAX INTELLIGENCE</small>
          </span>
        </button>
        <button className="new-research" onClick={reset}>
          <Icon name="plus" size={18} /> New research <span>↗</span>
        </button>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          <button
            className={`nav-item ${view === "research" ? "selected" : ""}`}
            onClick={() => setView("research")}
          >
            <Icon name="search" /> Research assistant{" "}
            <span className="nav-dot" />
          </button>
          <button
            className={`nav-item ${view === "about" ? "selected" : ""}`}
            onClick={() => setView("about")}
          >
            <Icon name="book" /> How TaxLens works
          </button>
        </nav>
        <div className="history-area">
          <div className="nav-label">
            THIS SESSION{" "}
            <span>{history.length.toString().padStart(2, "0")}</span>
          </div>
          {history.length ? (
            history.map((item) => (
              <button
                key={item.id}
                className="history-item"
                disabled={loading}
                onClick={() => {
                  setResult(item.result);
                  setSubmitted(item.result.question);
                  setQuestion(item.result.question);
                  setSources(item.result.sources);
                  setActivity(item.activity);
                  setError("");
                  setView("research");
                }}
              >
                <Icon name="clock" size={15} />
                <span>{item.result.question}</span>
              </button>
            ))
          ) : (
            <p className="history-empty">
              A little clarity, one question at a time. Your research will
              appear here.
            </p>
          )}
        </div>
        <div className="sidebar-bottom">
          <div className="engine-card">
            <span className="engine-icon">
              <Icon name="pulse" />
            </span>
            <div>
              <strong>Built on evidence</strong>
              <p>Retrieval + Gemini intelligence</p>
            </div>
          </div>
          <div className="sidebar-foot">
            <span className="country-dot" /> Made for Pakistan <span>v2.0</span>
          </div>
        </div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <span className="mobile-brand">taxlens.</span>
            <span className="desktop-crumb">
              Workspace <span>/</span>
            </span>{" "}
            {view === "about" ? "Behind the research" : "Research assistant"}
          </div>
          <div className={`service-status ${health}`}>
            <span />
            {health === "ready"
              ? "API connected"
              : health === "checking"
                ? "Connecting"
                : health === "unconfigured"
                  ? "API · key needed"
                  : "API offline"}
          </div>
        </header>
        {view === "about" ? (
          <div className="about-view">
            <span className="eyebrow">FROM QUESTION TO EVIDENCE</span>
            <h1>
              Clarity you can
              <br />
              <em>trace back.</em>
            </h1>
            <p className="hero-description">
              TaxLens connects natural-language questions to passages in a local
              Pakistani tax legislation corpus.
            </p>
            <div className="architecture">
              {[
                {
                  n: "01",
                  title: "Retrieve relevant passages",
                  text: "BGE sentence embeddings match your question against a Qdrant vector index. The embedding model and database connection are reused across requests.",
                },
                {
                  n: "02",
                  title: "Route with resilience",
                  text: "Gemini receives the retrieved evidence. If a configured model fails, the next model is attempted. Real backend events show the model name, failure reason, and switch as they happen.",
                },
                {
                  n: "03",
                  title: "Inspect the evidence",
                  text: "Read the answer alongside its retrieved passages and page references. Semantic similarity indicates retrieval relevance, not the legal correctness of an answer.",
                },
              ].map((step) => (
                <article key={step.n}>
                  <span>{step.n}</span>
                  <h2>{step.title}</h2>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
            <div className="about-note">
              <Icon name="book" />
              <p>
                Corpus coverage depends on the documents indexed on the server.
                Check effective dates and amendments in the original
                legislation. Research history is kept in memory for this tab and
                clears on refresh.
              </p>
            </div>
            <button
              className="primary-button"
              onClick={() => setView("research")}
            >
              Start exploring <Icon name="arrow" size={17} />
            </button>
          </div>
        ) : (
          <div className={`workspace ${active ? "has-research" : ""}`}>
            <div className="research-column">
              {!active ? (
                <section className="hero">
                  <div className="eyebrow">
                    <span /> LESS SEARCHING. MORE UNDERSTANDING.
                  </div>
                  <h1>
                    Pakistan tax law.
                    <br />
                    <em>Grounded in evidence.</em>
                  </h1>
                  <p className="hero-description">
                    Navigate Pakistani tax legislation with answers
                    <br className="desktop-break" /> grounded in the documents
                    behind them.
                  </p>
                  <div className="hero-tags">
                    <span>
                      <Icon name="book" size={15} /> Source-backed answers
                    </span>
                    <span>
                      <Icon name="pulse" size={15} /> Transparent AI workflow
                    </span>
                  </div>
                </section>
              ) : (
                <section className="question-heading">
                  <div className="eyebrow">YOUR RESEARCH</div>
                  <h1>{submitted}</h1>
                  <div className="research-meta">
                    <span>
                      <Icon name="search" size={14} /> Legislation research
                    </span>
                    {result && (
                      <span>
                        <Icon name="clock" size={14} />{" "}
                        {(result.elapsed_ms / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                </section>
              )}

              {!active && (
                <Composer
                  question={question}
                  setQuestion={setQuestion}
                  input={input}
                  loading={loading}
                  ask={ask}
                />
              )}
              {loading && (
                <div className="activity-spotlight">
                  <ResearchActivity
                    activity={activity}
                    active={active}
                    loading={loading}
                    result={result}
                    error={error}
                    elapsed={elapsed}
                    onStop={() => controller.current?.abort()}
                  />
                </div>
              )}
              {error && (
                <div className="error-card" role="alert">
                  <strong>Let’s try that again.</strong>
                  <p>{error}</p>
                  <button
                    className="secondary-button"
                    onClick={() => ask(submitted)}
                  >
                    Retry research <Icon name="arrow" size={16} />
                  </button>
                </div>
              )}
              {result && (
                <section className="answer-card">
                  <div className="section-top">
                    <div>
                      <span className="answer-icon">
                        <Icon name="sparkle" size={16} />
                      </span>
                      <h2>Research brief</h2>
                    </div>
                    <div className="answer-actions">
                      <button
                        onClick={copyAnswer}
                        aria-label="Copy answer"
                        title="Copy answer"
                      >
                        <Icon name="copy" size={17} />
                      </button>
                      <button
                        onClick={download}
                        aria-label="Download research as Markdown"
                        title="Download research"
                      >
                        <Icon name="download" size={17} />
                      </button>
                    </div>
                  </div>
                  <Answer text={result.answer} sources={result.sources} />
                  <div className="answer-footer">
                    <span>
                      <Icon name="check" size={14} /> {result.sources.length}{" "}
                      retrieved passages
                    </span>
                    <span>{result.model || "No model needed"}</span>
                  </div>
                </section>
              )}
              {!active && (
                <section className="suggestions">
                  <div className="section-label">
                    A GOOD PLACE TO START{" "}
                    <span>Pick a question to explore ↙</span>
                  </div>
                  <div className="suggestion-grid">
                    {suggestions.map((s) => (
                      <button
                        key={s.tag}
                        className="suggestion-card"
                        onClick={() => ask(s.question)}
                      >
                        <span className="suggestion-icon">
                          <Icon name={s.icon} />
                        </span>
                        <small>{s.tag}</small>
                        <strong>{s.title}</strong>
                        <span className="suggestion-bottom">
                          Explore question <Icon name="arrow" size={16} />
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
              {sources.length > 0 && (
                <section className="sources-section">
                  <div className="section-label">
                    THE EVIDENCE{" "}
                    <span>{sources.length} retrieved passages</span>
                  </div>
                  {sources.map((s) => (
                    <details
                      className="source-card"
                      id={`source-${s.id}`}
                      key={s.id}
                    >
                      <summary>
                        <span className="source-number">
                          {String(s.id).padStart(2, "0")}
                        </span>
                        <span className="source-title">
                          <strong>{documentName(s.document)}</strong>
                          <small>
                            Page {s.page ?? "unknown"} · Similarity{" "}
                            {s.score.toFixed(3)}
                          </small>
                        </span>
                        <span className="source-expand">+</span>
                      </summary>
                      <div className="source-excerpt">
                        {s.excerpt || "No excerpt available for this passage."}
                      </div>
                    </details>
                  ))}
                  <p className="source-help">
                    Similarity measures relevance to your question, not answer
                    accuracy.
                  </p>
                </section>
              )}
              {active && !loading && (
                <div className="follow-up">
                  <div className="section-label">EXPLORE ANOTHER QUESTION</div>
                  <Composer
                    question={question}
                    setQuestion={setQuestion}
                    input={input}
                    loading={loading}
                    ask={ask}
                  />
                </div>
              )}
              <footer className="workspace-footer">
                <Icon name="book" size={14} />
                <span>
                  A research starting point. Verify the source text and
                  applicable tax year before relying on an answer.
                </span>
              </footer>
            </div>

            <aside className="insight-column">
              {!loading && (
                <ResearchActivity
                  activity={activity}
                  active={active}
                  loading={false}
                  result={result}
                  error={error}
                  elapsed={elapsed}
                />
              )}
              <section className="resilience-card">
                <span className="resilience-symbol">
                  <Icon name="switch" size={21} />
                </span>
                <h3>
                  One model down. <br />
                  Research carries on.
                </h3>
                <p>
                  If a Gemini model is unavailable, TaxLens tries the next
                  configured model. You’ll see the switch here, with its name
                  and reason.
                </p>
                <span className="tiny-label">AUTOMATIC MODEL FALLBACK</span>
              </section>
              <div className="margin-note">
                <span>01 / THE TAXLENS APPROACH</span>
                <p>
                  Good answers come
                  <br />
                  with a paper trail.
                </p>
                <Icon name="arrow" size={20} />
              </div>
            </aside>
          </div>
        )}
      </main>
      {notice && (
        <div className="toast" role="status">
          <Icon name="check" size={17} />
          {notice}
        </div>
      )}
    </div>
  );
}

function Composer({
  question,
  setQuestion,
  input,
  loading,
  ask,
}: {
  question: string;
  setQuestion: (q: string) => void;
  input: React.RefObject<HTMLTextAreaElement | null>;
  loading: boolean;
  ask: (q?: string) => void;
}) {
  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault();
        ask();
      }}
    >
      <label htmlFor="research-question" className="composer-label">
        <Icon name="sparkle" size={17} /> What would you like to understand?
      </label>
      <textarea
        id="research-question"
        ref={input}
        value={question}
        maxLength={2000}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question about Pakistani tax law…"
        rows={3}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            ask();
          }
        }}
      />
      <div className="composer-bottom">
        <span>
          <kbd>↵</kbd> to research{" "}
          <span className="shift-hint">· Shift + Enter for a new line</span>
        </span>
        <button
          className="primary-button"
          disabled={question.trim().length < 3 || loading}
          type="submit"
        >
          Research <Icon name="arrow" size={17} />
        </button>
      </div>
    </form>
  );
}

function activityTitle(event: Activity) {
  if (event.type === "retrieval_started") return "Searching the corpus";
  if (event.type === "retrieval_complete")
    return event.message || "Evidence retrieved";
  if (event.type === "discovery_started")
    return "Discovering compatible models";
  if (event.type === "discovery_complete") return event.message;
  if (event.type === "model_started") return event.model;
  if (event.type === "model_skipped") return `Skipping ${event.model}`;
  return "Switching models";
}

function activityDescription(event: Activity, current: boolean) {
  if (event.type === "retrieval_started")
    return "Matching question to legislation";
  if (event.type === "retrieval_complete")
    return "Evidence ready for generation";
  if (event.type === "discovery_started")
    return "Checking the account's cached or live model catalog";
  if (event.type === "discovery_complete" || event.type === "model_skipped")
    return event.reason;
  if (event.type === "model_started")
    return `Attempt ${event.attempt} of ${event.total}${current ? " · in progress" : ""}`;
  return `${event.model}: ${event.reason}`;
}

function ResearchActivity({
  activity,
  active,
  loading,
  result,
  error,
  elapsed,
  onStop,
}: {
  activity: Activity[];
  active: boolean;
  loading: boolean;
  result: Result | null;
  error: string;
  elapsed: number;
  onStop?: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const lastModel = [...activity]
    .reverse()
    .find((event) => event.type === "model_started");
  const lastFailure = [...activity]
    .reverse()
    .find((event) => event.type === "model_failed");
  useEffect(() => {
    if (!loading) return;
    const panel = panelRef.current;
    panel?.focus({ preventScroll: true });
    panel?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  }, [loading]);
  useEffect(() => {
    if (loading && timelineRef.current)
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
  }, [activity.length, loading]);
  return (
    <section
      className={`activity-panel ${loading ? "activity-focused" : ""}`}
      ref={panelRef}
      tabIndex={-1}
      aria-label="Research activity"
    >
      <div className="panel-heading">
        <span>
          <Icon name="pulse" size={17} /> Research activity
        </span>
        <span className={`live-label ${loading ? "is-live" : ""}`}>
          {loading
            ? "LIVE"
            : result
              ? "COMPLETE"
              : error
                ? "STOPPED"
                : "STANDBY"}
        </span>
      </div>
      {loading && (
        <div className="activity-current" aria-live="polite">
          <div className="activity-current-top">
            <span className="orbit">
              <Icon name="sparkle" size={25} />
            </span>
            <span className="elapsed">{elapsed}s elapsed</span>
          </div>
          <p className="activity-phase">
            {lastModel
              ? `MODEL ATTEMPT ${lastModel.attempt} OF ${lastModel.total}`
              : activity.some((event) => event.type === "discovery_started")
                ? "MODEL DISCOVERY"
                : "EVIDENCE SEARCH"}
          </p>
          <h2>
            {lastModel?.model ||
              (activity.some((event) => event.type === "discovery_started")
                ? "Finding the right model"
                : "Searching the legislation")}
          </h2>
          <p className="activity-current-description">
            {lastModel
              ? "Generating your answer from the retrieved evidence."
              : "Follow each step of your research here, as it happens."}
          </p>
          {lastFailure && (
            <div
              className="switch-banner"
              key={`${lastFailure.model}-${activity.length}`}
            >
              <Icon name="switch" size={19} />
              <div>
                <strong>
                  {lastFailure.next_model
                    ? `Switching to ${lastFailure.next_model}`
                    : "Checking remaining model options"}
                </strong>
                <p>
                  {lastFailure.model} · {lastFailure.reason}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      {active ? (
        <>
          <div
            ref={timelineRef}
            className="activity-timeline"
            aria-live="polite"
            aria-relevant="additions"
          >
            {activity.map((event, i) => (
              <div
                className={`activity-event ${["model_failed", "model_skipped"].includes(event.type) ? "failed" : ""}`}
                key={i}
              >
                <span className="event-marker">
                  <Icon
                    name={
                      event.type === "model_failed"
                        ? "switch"
                        : event.type === "model_started"
                          ? "sparkle"
                          : "check"
                    }
                    size={13}
                  />
                </span>
                <div>
                  <strong>{activityTitle(event)}</strong>
                  <p>
                    {activityDescription(
                      event,
                      loading && event === activity[activity.length - 1],
                    )}
                  </p>
                  {event.next_model && (
                    <span className="next-model">↳ {event.next_model}</span>
                  )}
                </div>
              </div>
            ))}
            {result && (
              <div className="activity-event">
                <span className="event-marker">
                  <Icon name="check" size={13} />
                </span>
                <div>
                  <strong>Research complete</strong>
                  <p>
                    {(result.elapsed_ms / 1000).toFixed(1)} seconds ·{" "}
                    {result.sources.length} passages
                  </p>
                </div>
              </div>
            )}
            {error && (
              <div className="activity-event failed">
                <span className="event-marker">
                  <Icon name="close" size={13} />
                </span>
                <div>
                  <strong>Research paused</strong>
                  <p>Your question is available to retry.</p>
                </div>
              </div>
            )}
          </div>
          {loading && (
            <div className="activity-wait">
              <span className="live-dot" /> Listening for backend events
              <button className="stop-research" onClick={onStop}>
                Stop research <Icon name="close" size={14} />
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="standby-graphic">
            <div className="graphic-ring outer" />
            <div className="graphic-ring inner" />
            <span className="graphic-center">
              <Icon name="sparkle" size={25} />
            </span>
            <span className="graphic-node node-one" />
            <span className="graphic-node node-two" />
            <span className="graphic-node node-three" />
          </div>
          <h3>Your research, in the open.</h3>
          <p className="standby-copy">
            Follow the evidence search and model selection as they happen.
          </p>
          <div className="pipeline">
            <span>Retrieve</span>
            <i>→</i>
            <span>Reason</span>
            <i>→</i>
            <span>Reference</span>
          </div>
        </>
      )}
    </section>
  );
}
