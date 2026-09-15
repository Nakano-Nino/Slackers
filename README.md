# Slackers - Fullstack Next.js & Node.js Web App

A modern, production-grade fullstack web application built with a **Next.js** frontend and a dedicated **Node.js Express** backend in a monorepo workspace.

---

## 🏗 Project Architecture

```text
slackers/
├── apps/
│   ├── web/                     # Frontend: Next.js 15 (App Router, React 19, Tailwind CSS)
│   │   ├── src/
│   │   │   ├── app/             # App router pages, layouts & globals
│   │   │   ├── components/      # UI components (Sidebar, ChatArea, BackendStatus, modals)
│   │   │   ├── lib/             # API client & fetchers
│   │   │   └── types/           # Client-side TypeScript interfaces
│   │   ├── .env.local           # Frontend environment configuration
│   │   └── package.json
│   │
│   └── api/                     # Backend: Node.js + Express (TypeScript, Zod, Morgan, CORS)
│       ├── src/
│       │   ├── controllers/     # Request handlers (Channels, Messages, Users)
│       │   ├── routes/          # Express API route definitions
│       │   ├── services/        # Business logic & data storage
│       │   ├── middleware/      # Error handlers & validation
│       │   ├── types/           # API TypeScript definitions
│       │   └── index.ts         # Server entrypoint
│       ├── .env                 # Backend environment configuration
│       └── package.json
│
├── package.json                 # Root npm workspace & concurrent dev scripts
└── README.md
```

---

## ⚡ Quick Start

### 1. Install Dependencies
From the repository root:
```bash
npm install
```

### 2. Run Both Frontend and Backend Concurrently
```bash
npm run dev
```
This concurrently starts:
- **Next.js Frontend**: [http://localhost:3000](http://localhost:3000)
- **Node.js API**: [http://localhost:5001](http://localhost:5001)

### 3. Individual Dev Commands
Run only the frontend:
```bash
npm run dev:web
```

Run only the backend:
```bash
npm run dev:api
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status, uptime, and stats |
| `GET` | `/api/channels` | List all available channels |
| `GET` | `/api/channels/:id` | Get details for a specific channel |
| `POST` | `/api/channels` | Create a new channel (`name`, `description`, `isPrivate`) |
| `GET` | `/api/messages/channel/:channelId` | Retrieve all messages for a channel |
| `POST` | `/api/messages` | Send a new message (`channelId`, `content`, `userId`) |
| `GET` | `/api/users` | List active team members & status |
| `GET` | `/api/users/me` | Current authenticated user profile |

---

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js, Express, TypeScript, tsx (fast development watch mode), Zod validation, CORS, Morgan
- **Monorepo**: npm workspaces with concurrent script runners
