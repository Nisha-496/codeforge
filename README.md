# CodeForge

A sandboxed code execution platform — users submit code in the browser, the backend safely runs it in Docker containers with strict resource limits, and results stream back in real time.

> **Status: Day 1 — Skeleton complete.** Folder structure, infra (Postgres + Redis), API skeleton (`/health`, `/submit`), and a Next.js editor frontend are wired up. Sandbox execution, worker pool, queue processing, and DB persistence land in Day 2–3.

---

## Architecture

```
                      ┌───────────────────────────────┐
                      │  Frontend (Next.js 14)        │
                      │  Monaco editor + Run button   │
                      │  http://localhost:3000        │
                      └──────────────┬────────────────┘
                                     │ POST /submit
                                     ▼
                      ┌───────────────────────────────┐
                      │  API Server (Go + chi)        │
                      │  Validates + enqueues jobs    │
                      │  http://localhost:8080        │
                      └──────┬─────────────────┬──────┘
                             │                 │
                             ▼                 ▼
                ┌────────────────────┐  ┌────────────────────┐
                │  Redis 7 (queue)   │  │  Postgres 16       │
                │  Buffers jobs      │  │  Users / problems  │
                │  :6379             │  │  Submissions       │
                └─────────┬──────────┘  │  :5432             │
                          │             └────────────────────┘
                          ▼
                ┌────────────────────┐
                │  Worker (Go)       │
                │  Pulls jobs        │
                │  Spawns sandboxes  │
                └─────────┬──────────┘
                          ▼
                ┌────────────────────┐
                │  Docker Sandbox    │
                │  mem=128MB         │
                │  cpu=1, timeout=5s │
                └────────────────────┘
```

---

## Tech Stack

| Layer       | Tech                                                    |
|-------------|---------------------------------------------------------|
| Frontend    | Next.js 14, React, TypeScript, Tailwind CSS, Monaco     |
| API         | Go 1.26, chi router, go-chi/cors, godotenv              |
| Worker      | Go 1.26, Docker SDK (Day 2)                             |
| Queue       | Redis 7                                                 |
| Database    | PostgreSQL 16                                           |
| Sandbox     | Docker with cgroup-enforced memory / CPU / time limits  |

---

## Project Layout

```
codeforge/
├── backend/
│   ├── cmd/
│   │   ├── api/main.go      # HTTP server (chi)
│   │   └── worker/main.go   # job consumer (stub)
│   ├── internal/
│   │   ├── db/              # Postgres access (Day 2)
│   │   ├── handlers/        # HTTP handlers
│   │   ├── queue/           # Redis enqueue/dequeue (Day 2)
│   │   └── sandbox/         # Docker exec wrapper (Day 2)
│   ├── migrations/          # SQL schema (Day 2)
│   ├── go.mod
│   └── .env.example
├── frontend/
│   └── src/app/submit/      # /submit page: Monaco + Run
├── docker/
│   └── docker-compose.yml   # Postgres + Redis
├── .gitignore
└── README.md
```

---

## Local Setup

### Prerequisites

- Go 1.26.3
- Node.js 20+
- Docker Desktop (or any Docker daemon)
- npm

### 1. Start Postgres + Redis

```powershell
cd docker
docker compose up -d
docker compose ps   # both should be (healthy)
```

### 2. Run the API

```powershell
cd backend
copy .env.example .env   # first time only
go run ./cmd/api
# → "codeforge api listening on :8080"
```

Smoke test:

```powershell
curl http://localhost:8080/health
# → ok

curl -X POST http://localhost:8080/submit `
  -H "Content-Type: application/json" `
  -d '{\"code\":\"package main\",\"problem_id\":\"two-sum\",\"language\":\"go\"}'
# → {"submission_id":"stub-id-123","status":"pending"}
```

### 3. Run the frontend

```powershell
cd frontend
npm install        # first time only
npm run dev
# → http://localhost:3000
```

Open [http://localhost:3000/submit](http://localhost:3000/submit), pick a language, edit code, click **Run**. You should see the stubbed submission response.

### 4. Shut everything down

```powershell
# Ctrl+C the Go API and Next dev server, then:
cd docker
docker compose down            # keep volumes
docker compose down -v         # nuke Postgres/Redis data
```

---

## Endpoints (current)

| Method | Path     | Description                                              |
|--------|----------|----------------------------------------------------------|
| GET    | /health  | Returns `ok` (200) — used by load balancer / smoke tests |
| POST   | /submit  | Accepts `{code, problem_id, language}`. Day 1: returns stubbed `{submission_id, status: "pending"}`. Day 2: enqueues to Redis. |

---

## Roadmap

- **Day 1 — Skeleton (DONE):** folder structure, docker-compose, API skeleton with stub endpoints, Next.js + Monaco frontend wired to the API.
- **Day 2:** real Docker sandbox, worker that consumes the Redis queue, Postgres schema + persistence for submissions.
- **Day 3:** result polling / streaming back to the frontend, dashboard for queue depth & latency, basic auth, multi-language support.
