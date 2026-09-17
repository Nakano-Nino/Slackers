# 🚀 Slackers

A modern, production-grade fullstack team collaboration workspace uniting **Zero-Knowledge End-to-End Encrypted (E2EE)** messaging, an interactive **Agile Kanban board**, **QA review verification workflows**, **Role-Based Access Control (RBAC)**, and **real-time WebSocket synchronization**.

---

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3+-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Node.js-Express_4.21+-green?logo=node.js&logoColor=white)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime_Sync-black?logo=socket.io&logoColor=white)](https://socket.io/)
[![E2EE](https://img.shields.io/badge/Security-AES--256--GCM-red?logo=lock&logoColor=white)](#-security--cryptography-model)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 Table of Contents

- [Core Features](#-core-features)
  - [Zero-Knowledge End-to-End Encryption](#1-zero-knowledge-end-to-end-encryption-e2ee)
  - [Real-Time Messaging & Direct Messages](#2-real-time-channels--direct-messaging)
  - [Agile Kanban Board & Workflows](#3-agile-kanban-board--project-management)
  - [Structured QA Review Steps & Acceptance Criteria](#4-structured-qa-review-steps--acceptance-criteria)
  - [Role-Based Access Control & Team Management](#5-role-based-access-control-rbac--team-management)
  - [Bug Tracking & Activity Audit Logging](#6-bug-tracking--activity-audit-logging)
- [Project Architecture](#-project-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#1-installation)
  - [Environment Configuration](#2-environment-configuration)
  - [Running the Application](#3-running-the-application)
  - [Building for Production](#4-building-for-production)
- [Demo Seed Accounts](#-demo-seed-accounts)
- [REST API Reference](#-rest-api-reference)
- [WebSocket Event Reference](#-websocket-event-reference)
- [Security & Cryptography Model](#-security--cryptography-model)
- [Scripts Reference](#-scripts-reference)
- [License](#-license)

---

## ✨ Core Features

### 1. Zero-Knowledge End-to-End Encryption (E2EE)
- **Client-Side Cryptography**: Uses the browser's native Web Crypto API (`AES-GCM-256`) with key derivation via PBKDF2 (`SHA-256`, 100,000 iterations) and ECDH P-256 KeyVaults.
- **Zero-Knowledge Server**: The backend only receives and stores ciphertexts, IVs, and authentication tags. Message contents and attached files cannot be decrypted on the server.
- **Encrypted Media & Attachments**: Files, screenshots, and voice recordings are encrypted on the client before being streamed to S3 / MinIO storage.
- **Privacy Assurance**: Transparent privacy status informing team members that their messages and attachments are end-to-end encrypted.

### 2. Real-Time Channels & Direct Messaging
- **Channels & 1-on-1 DMs**: Public team channels (`#general`, `#engineering`, `#product-design`, `#random`), private channels, and encrypted direct messaging.
- **Live WebSocket Sync**: Real-time message streaming, typing indicators, user presence state (`online`, `away`, `offline`), and unread badges.
- **Message Reactions & Threads**: Emoji reactions with live count synchronization and threaded discussions.
- **Strict Message Ownership**: Only the original author can edit their own messages.
- **Audio Messaging**: In-browser audio recording with waveform preview, encrypted upload, and synchronized playback.

### 3. Agile Kanban Board & Project Management
- **Interactive Drag & Drop**: Fluid drag-and-drop task workflows across columns (`Backlog`, `To Do`, `In Progress`, `In Review`, `Done`).
- **Strict Move Permission Guard**: Only the assigned developer, task creator, an Admin, or a Manager can move cards between columns.
- **Multi-Project Management**: Project visibility controls allowing projects to be public or restricted strictly to selected members.
- **Task Metadata**: Fibonacci story points (`1`, `2`, `3`, `5`, `8`, `13`), priority tags (`low`, `medium`, `high`, `urgent`), due dates, tags, comments, and attachments.
- **"Discuss in Chat" Action**: 1-click embedding of interactive Kanban task cards directly into chat channels for contextual collaboration.

### 4. Structured QA Review Steps & Acceptance Criteria
- **Strict QA Engineer Authority**: **Only users with the `qa_engineer` developer role** can define or add QA verification steps (enforced both on the API and frontend UI).
- **Test Verification Execution**: Test steps can be marked as `pending`, `passed`, `failed`, or `skipped`.
- **Tester Attribution**: Automatically tracks tester name, avatar, and timestamp, with failure notes and diagnostic logs.
- **Automated Verdict Computation**: Tasks automatically calculate `qaVerdict` (`pending`, `passed`, `failed`) based on test step outcomes.
- **Kanban Status Badges**: Visual indicators on cards (`QA 3/3 ✓` for passing, `QA 1✕` for failures) for instant sprint visibility.

### 5. Role-Based Access Control (RBAC) & Team Management
- **Base Authority Roles**:
  - `Admin`: Full workspace control, user management, project creation/deletion, task creation/deletion.
  - `Manager`: Project management, member role updates, task assignment, sprint coordination.
  - `Member`: Collaborative chat, task execution, status updates within assigned projects.
  - `Viewer`: Read-only observer access.
- **Specialized Developer Roles**:
  - `Lead Architect`, `Engineering Manager`, `Backend Developer`, `Frontend Developer`, `Full Stack Developer`, `QA Engineer`, `DevOps / Cloud Engineer`, `Security Engineer`, `Product / UI/UX Designer`, `Mobile Developer`, `Data / AI Engineer`.
- **Developer Role Protection**: Regular team members cannot arbitrarily alter their own developer specialization; reassignment is strictly controlled by Admins and Managers.
- **Member Invitations**: Admins and Managers can invite new members via secure onboarding invite links with pre-assigned roles.
- **User Profile & Settings**: Custom avatars, display names, email management, password updates, and active session inspection.

### 6. Bug Tracking & Activity Audit Logging
- **Integrated Bug Reporting**: Dedicated bug reporting modal with severity classification (`low`, `medium`, `high`, `critical`), reproduction steps, and 1-click conversion into Kanban tasks.
- **Audit Logging**: Tamper-proof activity logs recorded to MongoDB (`TASK_CREATED`, `TASK_MOVED`, `TASK_QA_STEP_UPDATED`, `MESSAGE_SENT`, `USER_INVITED`, `ROLE_UPDATED`).

---

## 🏗 Project Architecture

Slackers is organized as an **npm workspaces monorepo**:

```text
slackers/
├── apps/
│   ├── web/                              # Frontend Application (Next.js 16)
│   │   ├── src/
│   │   │   ├── app/                      # App Router: root layout, pages, global styling
│   │   │   │   ├── page.tsx              # Main collaboration dashboard
│   │   │   │   └── globals.css           # Tailwind CSS v4 styling
│   │   │   ├── components/               # React UI Components
│   │   │   │   ├── Sidebar.tsx           # Channel & navigation rail
│   │   │   │   ├── ChatArea.tsx          # Real-time chat & thread panel
│   │   │   │   ├── KanbanBoard.tsx       # Agile task board with drag-and-drop
│   │   │   │   ├── TaskDetailModal.tsx   # Detailed task editor & QA step execution
│   │   │   │   ├── CreateTaskModal.tsx   # Task creation with QA steps
│   │   │   │   ├── SettingsModal.tsx     # Profile, credentials & session management
│   │   │   │   ├── InviteMemberModal.tsx # Team invitation modal
│   │   │   │   ├── ProjectMembersModal.tsx # Project member access control
│   │   │   │   └── ReportBugModal.tsx    # Bug reporting & triage modal
│   │   │   ├── lib/                      # Utilities & API Clients
│   │   │   │   ├── api.ts                # REST API client
│   │   │   │   ├── crypto.ts             # Web Crypto AES-GCM-256 client logic
│   │   │   │   ├── roles.ts              # RBAC role schemas & badges
│   │   │   │   └── socket.ts             # Socket.IO client singleton
│   │   │   └── types/                    # Frontend TypeScript interfaces
│   │   ├── .env.local                    # Web environment configuration
│   │   └── package.json
│   │
│   └── api/                              # Backend Application (Node.js / Express)
│       ├── src/
│       │   ├── controllers/              # HTTP Route Controllers
│       │   │   ├── authController.ts     # Login, registration, profile
│       │   │   ├── channelController.ts  # Channel operations
│       │   │   ├── messageController.ts  # Message handling & reactions
│       │   │   ├── dmController.ts       # Direct messages & key exchange
│       │   │   ├── taskController.ts     # Task CRUD & QA review steps
│       │   │   ├── projectController.ts  # Project management & visibility
│       │   │   ├── memberController.ts   # Team invitations & role assignments
│       │   │   ├── bugController.ts      # Bug tracking & task conversion
│       │   │   └── fileController.ts     # Encrypted file upload & streaming
│       │   ├── routes/                   # Express Routers
│       │   ├── services/                 # Business Logic & Data Layer
│       │   │   ├── authService.ts        # Authentication & JWT tokens
│       │   │   ├── taskService.ts        # Task lifecycle, QA engine & RBAC
│       │   │   ├── projectService.ts     # Project access controls
│       │   │   ├── socketService.ts      # WebSocket event broadcasting
│       │   │   ├── mongoLogger.ts        # MongoDB audit logger
│       │   │   └── dataStore.ts          # In-memory storage & seed state
│       │   ├── middleware/               # Auth, rate limiting & error handlers
│       │   ├── types/                    # Shared backend TypeScript types
│       │   └── index.ts                  # Server entrypoint & HTTP/WS initialization
│       ├── .env                          # API environment configuration
│       └── package.json
│
├── package.json                          # Monorepo root package & dev scripts
└── README.md                             # Documentation
```

---

## 🛠 Tech Stack

| Domain | Technology | Description |
|---|---|---|
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router) | React Server & Client Components, modern bundler |
| **UI Library** | [React 19](https://react.dev/) | Declarative modern UI with hooks |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first styling with dark mode design system |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, accessible vector icons |
| **Backend Framework** | [Express 4](https://expressjs.com/) on [Node.js](https://nodejs.org/) | Fast REST API with TypeScript |
| **Real-Time Sync** | [Socket.IO 4.8](https://socket.io/) | Bi-directional WebSocket communication |
| **Cryptography** | Web Crypto API / Node `crypto` | `AES-GCM-256`, PBKDF2 (100k rounds), ECDH P-256 |
| **Validation** | [Zod](https://zod.dev/) | Type-safe schema parsing & request validation |
| **Database & ORM** | [Prisma](https://www.prisma.io/) / PostgreSQL | Relational storage & schema migrations |
| **Audit Logging** | [MongoDB Native Driver](https://www.mongodb.com/) | High-throughput tamper-evident activity logging |
| **Cache & Pub/Sub** | [Redis](https://redis.io/) / `ioredis` | Multi-instance socket adapter & distributed caching |
| **Object Storage** | [AWS SDK S3](https://aws.amazon.com/sdk-for-javascript/) / MinIO | Encrypted binary attachment storage |

---

## ⚡ Getting Started

### Prerequisites
- **Node.js**: `v18.17.0` or higher (Node.js 20+ recommended)
- **npm**: `v9.0.0` or higher

### 1. Installation
Clone the repository and install all dependencies from the root directory:
```bash
git clone https://github.com/your-username/slackers.git
cd slackers
npm install
```

### 2. Environment Configuration

#### Backend Configuration (`apps/api/.env`)
Create or edit `apps/api/.env`:
```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
REDIS_URL=redis://127.0.0.1:6379

# Object Storage (S3 or MinIO)
S3_ENDPOINT=http://127.0.0.1:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=slackers-encrypted-files
S3_FORCE_PATH_STYLE=true
```

#### Frontend Configuration (`apps/web/.env.local`)
Create or edit `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### 3. Running the Application
Start both the Next.js frontend and Express backend concurrently:
```bash
npm run dev
```

The services will be available at:
- 🌐 **Web Dashboard**: [http://localhost:3000](http://localhost:3000)
- 🔌 **API Server**: [http://localhost:5001](http://localhost:5001)
- 🩺 **Health Endpoint**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

#### Running Services Independently
```bash
# Run only the Next.js frontend
npm run dev:web

# Run only the Express backend
npm run dev:api
```

### 4. Building for Production
```bash
npm run build
```
This runs TypeScript type-checking and compiles:
- `apps/api` via `tsc` -> `apps/api/dist`
- `apps/web` via Next.js production builder

---

## 🔑 Demo Seed Accounts

The system comes pre-seeded with sample team accounts representing different organizational authority levels and technical specializations.

> **Default Password for all seed users**: `password123`

| Name | Email | Authority Role | Developer Specialization | Key Permissions |
|---|---|---|---|---|
| **Sarah Connor** | `sarah@slackers.dev` | `admin` | `lead_architect` | Workspace admin, member invitations, project management |
| **Alex Rivera** | `alex@slackers.dev` | `manager` | `engineering_manager` | Project management, role promotions, task assignment |
| **Jordan Lee** | `jordan@slackers.dev` | `member` | `backend_developer` | Chat, task execution, move assigned tasks |
| **Liam O’Connor** | `liam@slackers.dev` | `member` | `qa_engineer` | **Add QA review steps**, execute verification, mark QA pass/fail |
| **Morgan Vance** | `morgan@slackers.dev` | `member` | `security_engineer` | Chat, encryption review, assigned task execution |
| **Elena Rostova** | `elena@slackers.dev` | `member` | `ui_ux_designer` | Chat, design assets, assigned task execution |
| **Marcus Chen** | `marcus@slackers.dev` | `member` | `frontend_developer` | Chat, frontend feature execution |
| **Priya Patel** | `priya@slackers.dev` | `manager` | `devops_engineer` | Infrastructure management, member roles |
| **Taylor Guest** | `guest@slackers.dev` | `viewer` | `qa_engineer` | Read-only observation, view QA metrics |

---

## 📡 REST API Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate user with email & password |
| `POST` | `/api/auth/register` | Public | Register new user account |
| `GET` | `/api/auth/me` | Bearer | Get current authenticated user profile |
| `PUT` | `/api/auth/profile` | Bearer | Update user profile, password, or avatar |

### 💬 Channels & Messaging (`/api/channels`, `/api/messages`, `/api/dm`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/channels` | Bearer | List channels available to the user |
| `POST` | `/api/channels` | Bearer | Create a new public or private channel |
| `GET` | `/api/messages/channel/:channelId` | Bearer | Fetch message history for a channel |
| `POST` | `/api/messages` | Bearer | Post a new encrypted message or card embed |
| `PATCH` | `/api/messages/:id` | Bearer | Edit message content (**Author only**) |
| `DELETE` | `/api/messages/:id` | Bearer | Delete a message (**Author only**) |
| `POST` | `/api/messages/:id/react` | Bearer | Toggle an emoji reaction on a message |
| `GET` | `/api/dm/conversations` | Bearer | List recent direct message conversations |
| `GET` | `/api/dm/:partnerId` | Bearer | Retrieve direct message history with partner |
| `POST` | `/api/dm` | Bearer | Send an encrypted direct message |
| `PATCH` | `/api/dm/:id` | Bearer | Edit a direct message (**Author only**) |

### 📋 Tasks & QA Review Steps (`/api/tasks`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/tasks` | Optional | Retrieve tasks filtered by project, status, or assignee |
| `GET` | `/api/tasks/:id` | Optional | Retrieve task details with QA review steps |
| `POST` | `/api/tasks` | Admin/Mgr | Create a new task (Initial `qaSteps` allowed only if creator is QA Engineer) |
| `PATCH` | `/api/tasks/:id` | Bearer | Update status/move card (**Assignee, Creator, Admin, or Manager only**) |
| `DELETE` | `/api/tasks/:id` | Admin/Mgr | Delete a task |
| `POST` | `/api/tasks/:id/qa-steps` | Bearer | **Add QA review step (QA Engineers strictly)** |
| `PATCH` | `/api/tasks/:id/qa-steps/:stepId` | Bearer | Execute QA verification (`pending`, `passed`, `failed`, `skipped`) |
| `DELETE` | `/api/tasks/:id/qa-steps/:stepId` | Bearer | Remove QA review step |
| `GET` | `/api/tasks/:taskId/comments` | Optional | List comments for a task |
| `POST` | `/api/tasks/:taskId/comments` | Bearer | Post a task comment |

### 📁 Projects (`/api/projects`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/projects` | Optional | List projects visible to the requesting user |
| `GET` | `/api/projects/:id` | Optional | Get project details and member access lists |
| `POST` | `/api/projects` | Admin/Mgr | Create a new project with visibility settings |
| `PATCH` | `/api/projects/:id` | Bearer | Update project details or restricted member lists |
| `DELETE` | `/api/projects/:id` | Admin | Delete a project |

### 👥 Team Members & Invitations (`/api/members`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/members` | Admin/Mgr | Add a member directly to the workspace |
| `PATCH` | `/api/members/:id/role` | Admin/Mgr | Update authority role or developer specialization (**Admin/Manager only**) |
| `POST` | `/api/members/invite` | Admin/Mgr | Generate secure onboarding invitation link |
| `GET` | `/api/members/invitations` | Admin/Mgr | List active pending invitations |
| `DELETE` | `/api/members/invitations/:id` | Admin/Mgr | Revoke an invitation link |
| `GET` | `/api/members/invitations/verify/:token` | Public | Validate onboarding token |
| `POST` | `/api/members/invitations/accept` | Public | Accept invite and establish account credentials |

### 🔒 Encrypted Files (`/api/files`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/files/upload` | Bearer | Upload encrypted file blob with metadata |
| `GET` | `/api/files/:fileId` | Bearer | Stream encrypted binary ciphertext |

---

## 🔌 WebSocket Event Reference

Slackers uses Socket.IO for immediate cross-client synchronization.

| Event Name | Direction | Payload Description |
|---|---|---|
| `message:sent` | Server -> Client | Broadcasts newly posted encrypted channel message |
| `message:updated` | Server -> Client | Broadcasts edited message content or deleted flag |
| `message:reaction` | Server -> Client | Broadcasts added/removed emoji reaction state |
| `task:created` | Server -> Client | Broadcasts newly created task to project subscribers |
| `task:updated` | Server -> Client | Broadcasts task moves, QA step executions, or comments |
| `task:deleted` | Server -> Client | Broadcasts task deletion event |
| `user:presence` | Server -> Client | Broadcasts user online/away/offline status change |
| `typing:start` | Client <-> Server | Indicates user is composing a message in a channel |
| `typing:stop` | Client <-> Server | Indicates user stopped composing |

---

## 🛡 Security & Cryptography Model

```text
[ Sender Client ]
       │
       ▼
1. Generate / Derive Channel Key (AES-GCM-256 via PBKDF2)
2. Generate Random 12-byte IV
3. Encrypt Plaintext Payload -> Ciphertext + 16-byte Auth Tag
       │
       ▼ (Encrypted Payload over HTTPS/WSS)
[ Backend Server (Zero-Knowledge) ]
  • Receives only: { ciphertext, iv, authTag }
  • Saves to database & broadcasts via WebSocket
       │
       ▼ (Ciphertext Payload)
[ Recipient Client ]
       │
       ▼
1. Fetch shared KeyVault / derive Channel Key
2. Verify Auth Tag and Decrypt Ciphertext with IV
3. Render Plaintext & Attachments securely in DOM
```

- **Algorithm**: `AES-GCM` with a 256-bit key length.
- **Key Derivation**: PBKDF2 with HMAC-SHA256, 100,000 iterations, and cryptographic salt.
- **Asymmetric Key Exchange**: ECDH P-256 (`prime256v1`) keypairs stored in encrypted KeyVaults.
- **Data Protection**: Zero-knowledge architecture ensures server database breaches do not expose plaintext discussions or file contents.

---

## 💻 Scripts Reference

| Command | Workspace | Description |
|---|---|---|
| `npm run dev` | Root | Starts frontend & backend concurrently with color-coded logs |
| `npm run dev:web` | Root | Starts Next.js development server at port 3000 |
| `npm run dev:api` | Root | Starts Express backend with `tsx watch` at port 5001 |
| `npm run build` | Root | Runs complete production builds for both API and Web |
| `npm run clean` | Root | Cleans `dist` and `.next` build caches |
| `npm run lint` | `apps/web` | Runs Next.js ESLint static analysis |

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
