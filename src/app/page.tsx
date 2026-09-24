"use client";

import { useState } from "react";

type Source = {
  document: string;
  page: number;
  score: number;
};

type Result = {
  question: string;
  answer: string;
  sources: Source[];
};

const suggestions = [
  "What is the tax on a motor vehicle between 1601cc and 1800cc?",
  "What is the tax rate for salaried individuals?",
  "What are the conditions for claiming business expenses?",
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  async function askQuestion(questionText?: string) {
    const query = questionText ?? question.trim();

    if (!query || loading) return;

    setQuestion(query);
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: query,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Could not connect to the TaxLens API.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    askQuestion();
  }

  return (
    <main className="min-h-screen bg-[#08090b] text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 border-r border-white/[0.07] bg-[#0b0c0f] px-5 py-6 lg:flex lg:flex-col">
          <div className="mb-10">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-bold text-black">
                T
              </div>

              <div>
                <h1 className="text-sm font-semibold tracking-wide">
                  TAXLENS
                </h1>
                <p className="text-[10px] text-zinc-500">
                  Pakistan Tax Intelligence
                </p>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            <SidebarItem active label="New Research" icon="＋" />
            <SidebarItem label="Tax Legislation" icon="◫" />
            <SidebarItem label="Income Tax" icon="₨" />
            <SidebarItem label="Sales Tax" icon="▤" />
            <SidebarItem label="Finance Act" icon="§" />
          </nav>

          <div className="mt-auto">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-xs font-medium text-zinc-300">
                Research Corpus
              </p>

              <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                Income Tax Ordinance
                <br />
                Sales Tax Act
                <br />
                Finance Act 2026
              </p>
            </div>

            <p className="mt-5 text-[10px] text-zinc-600">
              TAXLENS v1.0
            </p>
          </div>
        </aside>

        {/* Main */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b border-white/[0.07] px-5 lg:px-10">
            <div className="lg:hidden">
              <span className="text-sm font-semibold">TAXLENS</span>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-xs text-zinc-600 sm:block">
                Research Assistant
              </span>

              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs text-zinc-400">
                AI
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-12 lg:px-10">
            {!result && !loading ? (
              <div className="flex flex-1 flex-col justify-center">
                <div className="mx-auto w-full max-w-3xl">
                  <div className="mb-10 text-center">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-[11px] text-zinc-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Pakistani Tax Law Corpus · 2026
                    </div>

                    <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                      Research tax law
                      <br />
                      <span className="text-zinc-500">with evidence.</span>
                    </h2>

                    <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-zinc-500">
                      Ask questions about Pakistani tax legislation and get
                      answers grounded in the retrieved legal documents.
                    </p>
                  </div>

                  {/* Search */}
                  <form onSubmit={handleSubmit}>
                    <div className="rounded-2xl border border-white/[0.1] bg-[#101114] p-2 shadow-2xl shadow-black/30">
                      <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ask a question about Pakistani tax law..."
                        rows={3}
                        className="w-full resize-none bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                      />

                      <div className="flex items-center justify-between border-t border-white/[0.06] px-2 pt-2">
                        <span className="px-2 text-[11px] text-zinc-600">
                          Answers are generated from retrieved legislation
                        </span>

                        <button
                          type="submit"
                          disabled={!question.trim()}
                          className="rounded-xl bg-white px-4 py-2 text-xs font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          Research →
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Suggestions */}
                  <div className="mt-8">
                    <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
                      Try asking
                    </p>

                    <div className="grid gap-2 sm:grid-cols-3">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => askQuestion(suggestion)}
                          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left text-xs leading-5 text-zinc-500 transition hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-zinc-300"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : loading ? (
              <LoadingState />
            ) : result ? (
              <ResearchResult
                result={result}
                question={question}
                onNewResearch={() => {
                  setResult(null);
                  setQuestion("");
                }}
              />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function SidebarItem({
  label,
  icon,
  active = false,
}: {
  label: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs transition ${
        active
          ? "bg-white/[0.07] text-white"
          : "text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-300"
      }`}
    >
      <span className="w-4 text-center text-sm">{icon}</span>
      {label}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center">
      <div className="rounded-2xl border border-white/[0.07] bg-[#101114] p-8">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

          <span className="text-xs text-zinc-400">
            Researching Pakistani tax legislation...
          </span>
        </div>

        <div className="mt-8 space-y-3">
          <div className="h-3 w-3/4 animate-pulse rounded bg-white/[0.05]" />
          <div className="h-3 w-full animate-pulse rounded bg-white/[0.05]" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-white/[0.05]" />
        </div>

        <div className="mt-8 flex items-center gap-2 text-[11px] text-zinc-600">
          <span>Retrieving evidence</span>
          <span>•</span>
          <span>Generating answer</span>
        </div>
      </div>
    </div>
  );
}

function ResearchResult({
  result,
  question,
  onNewResearch,
}: {
  result: Result;
  question: string;
  onNewResearch: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Top */}
      <div className="mb-10 flex items-start justify-between gap-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
            Research question
          </p>

          <h2 className="mt-3 text-xl font-medium leading-8 text-zinc-200">
            {question}
          </h2>
        </div>

        <button
          onClick={onNewResearch}
          className="shrink-0 rounded-xl border border-white/[0.08] px-3 py-2 text-xs text-zinc-500 transition hover:bg-white/[0.04] hover:text-white"
        >
          New research
        </button>
      </div>

      {/* Answer */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
            Answer
          </h3>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#101114] p-6 sm:p-8">
          <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
            {result.answer}
          </p>
        </div>
      </section>

      {/* Sources */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
              Retrieved evidence
            </h3>

            <p className="mt-1 text-[11px] text-zinc-600">
              Sources used to generate this answer
            </p>
          </div>

          <span className="text-[11px] text-zinc-600">
            {result.sources.length} sources
          </span>
        </div>

        <div className="space-y-2">
          {result.sources.map((source, index) => (
            <div
              key={`${source.document}-${source.page}-${index}`}
              className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-white/[0.1] hover:bg-white/[0.035]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-zinc-300">
                    {formatDocument(source.document)}
                  </p>

                  <p className="mt-1 text-[11px] text-zinc-600">
                    Page {source.page}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Semantic match
                  </p>

                  <p className="mt-1 font-mono text-xs text-zinc-400">
                    {source.score.toFixed(3)}
                  </p>
                </div>
              </div>

              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="h-full rounded-full bg-zinc-500"
                  style={{
                    width: `${Math.min(source.score * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatDocument(path: string) {
  const filename = path.split(/[\\/]/).pop() ?? path;

  return filename
    .replace(".pdf", "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}