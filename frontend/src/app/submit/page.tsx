"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";

type Language = "go" | "python" | "javascript";

type SubmitResponse = {
  submission_id: string;
  status: string;
};

const DEFAULT_CODE: Record<Language, string> = {
  go: `package main

import "fmt"

func add(a, b int) int {
\treturn a + b
}

func main() {
\tfmt.Println(add(2, 3))
}
`,
  python: `def add(a, b):
    return a + b

print(add(2, 3))
`,
  javascript: `function add(a, b) {
  return a + b;
}

console.log(add(2, 3));
`,
};

const API_URL = "http://localhost:8080/submit";
const PROBLEM_ID = "two-sum";

export default function SubmitPage() {
  const [language, setLanguage] = useState<Language>("go");
  const [code, setCode] = useState<string>(DEFAULT_CODE.go);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLanguageChange = (next: Language) => {
    setLanguage(next);
    setCode(DEFAULT_CODE[next]);
    setResult(null);
    setError(null);
  };

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          problem_id: PROBLEM_ID,
          language,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `API returned ${res.status} ${res.statusText}${text ? `: ${text}` : ""}`
        );
      }

      const data: SubmitResponse = await res.json();
      setResult(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error contacting API";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">CodeForge — Submit Code</h1>
          <p className="mt-2 text-gray-400">
            Problem: <span className="text-gray-200">Write a function that adds two numbers</span>
          </p>
        </header>

        <section className="mb-4 flex items-center gap-3">
          <label htmlFor="language" className="text-sm text-gray-300">
            Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
          >
            <option value="go">Go</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
          </select>
        </section>

        <section className="overflow-hidden rounded-lg border border-gray-800">
          <Editor
            height="400px"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value ?? "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              tabSize: 4,
              automaticLayout: true,
              scrollBeyondLastLine: false,
            }}
          />
        </section>

        <section className="mt-4 flex items-center gap-3">
          <button
            onClick={handleRun}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-900 disabled:text-gray-400"
          >
            {loading ? "Submitting…" : "Run"}
          </button>
          {loading && <span className="text-sm text-gray-400">Contacting API…</span>}
        </section>

        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold text-gray-200">Output</h2>
          <div className="min-h-[120px] rounded-md border border-gray-800 bg-gray-900 p-4 font-mono text-sm">
            {error && (
              <div className="text-red-400">
                <div className="font-semibold">Error</div>
                <div className="mt-1 whitespace-pre-wrap">{error}</div>
              </div>
            )}
            {!error && result && (
              <div className="space-y-1 text-gray-200">
                <div>
                  <span className="text-gray-500">submission_id:</span>{" "}
                  <span className="text-blue-300">{result.submission_id}</span>
                </div>
                <div>
                  <span className="text-gray-500">status:</span>{" "}
                  <span className="text-green-300">{result.status}</span>
                </div>
              </div>
            )}
            {!error && !result && !loading && (
              <div className="text-gray-500">Submit code to see the API response here.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
