# 金欠対策

MVP core scaffold for Hono + Drizzle + SQLite + better-auth and Vite + React.

## Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
```

## Development

```bash
npm run dev
```

Server: `http://localhost:8080`  
Client: `http://localhost:5173`

## Build

```bash
npm run typecheck
npm run build
npm start
```

Set `SERVE_STATIC=1` in production to serve `dist/client` from Hono.
