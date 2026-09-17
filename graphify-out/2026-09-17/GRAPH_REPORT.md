# Graph Report - slackers  (2026-09-17)

## Corpus Check
- 89 files · ~62,865 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .example 1, .prisma 1)

## Summary
- 699 nodes · 1737 edges · 35 communities (24 shown, 10 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 89 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c4a96a30`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- page.tsx
- dataStore
- src/index.ts
- api/package.json
- bugController.ts
- web/package.json
- dmController.ts
- compilerOptions
- E2EEService
- compilerOptions
- api/src/types/index.ts
- package.json
- notificationController.ts
- eslint.config.mjs
- postcss.config.mjs
- redisService
- s3Service
- Slackers - Fullstack Next.js & Node.js Web App
- web/README.md
- rules/graphify.md
- workflows/graphify.md
- AGENTS.md
- dependencies
- devDependencies
- sessionService
- scripts
- fileService
- redisService.ts
- db.ts
- dataStore.ts
- taskController.ts
- authService
- taskService.ts
- User

## God Nodes (most connected - your core abstractions)
1. `User` - 60 edges
2. `dataStore` - 46 edges
3. `User` - 33 edges
4. `express` - 30 edges
5. `socketService` - 26 edges
6. `react` - 22 edges
7. `lucide-react` - 21 edges
8. `Project` - 21 edges
9. `mongoLogger` - 19 edges
10. `redisService` - 19 edges

## Surprising Connections (you probably didn't know these)
- `UserSessionResponse` --inherits--> `UserSession`  [EXTRACTED]
  apps/api/src/controllers/sessionController.ts → apps/api/src/services/sessionService.ts
- `AuthenticatedRequest` --references--> `User`  [EXTRACTED]
  apps/api/src/middleware/authMiddleware.ts → apps/api/src/types/index.ts
- `dataStore` --references--> `User`  [EXTRACTED]
  apps/api/src/services/dataStore.ts → apps/api/src/types/index.ts
- `AuthenticatedSocket` --references--> `User`  [EXTRACTED]
  apps/api/src/services/socketService.ts → apps/api/src/types/index.ts
- `Home()` --calls--> `connectSocket()`  [EXTRACTED]
  apps/web/src/app/page.tsx → apps/web/src/lib/socket.ts

## Import Cycles
- None detected.

## Communities (35 total, 10 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.05
Nodes (103): AuthModal(), DEMO_USERS, Props, BugTracker(), Props, SEVERITY_INFO, STATUS_BADGES, ChatArea() (+95 more)

### Community 1 - "dataStore"
Cohesion: 0.11
Nodes (6): dataStore, generateSeedKeyVault(), Channel, ChannelKey, KeyVaultData, Message

### Community 2 - "src/index.ts"
Cohesion: 0.06
Nodes (60): getMe(), login(), LoginSchema, register(), RegisterSchema, updateProfile(), UpdateProfileSchema, createChannel() (+52 more)

### Community 3 - "api/package.json"
Cohesion: 0.10
Nodes (20): description, @types/node, typescript, main, name, private, version, cors (+12 more)

### Community 4 - "bugController.ts"
Cohesion: 0.13
Nodes (23): convertBugToTask(), createBug(), CreateBugSchema, deleteBug(), getBugById(), getBugs(), getBugStats(), updateBug() (+15 more)

### Community 5 - "web/package.json"
Cohesion: 0.04
Nodes (43): nextConfig, dependencies, lucide-react, next, react, react-dom, socket.io-client, devDependencies (+35 more)

### Community 6 - "dmController.ts"
Cohesion: 0.08
Nodes (18): deleteDirectMessage(), editDirectMessage(), getConversation(), getKeyVault(), getPublicKey(), getRecentConversations(), getUnreadCounts(), KeyVaultSchema (+10 more)

### Community 7 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 8 - "E2EEService"
Cohesion: 0.30
Nodes (4): Home(), arrayBufferToBase64(), base64ToArrayBuffer(), E2EEService

### Community 9 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, outDir, resolveJsonModule (+6 more)

### Community 10 - "api/src/types/index.ts"
Cohesion: 0.17
Nodes (12): bugService, Bug, BugEnvironment, BugSeverity, BugStats, BugStatus, DeveloperRole, MuteDuration (+4 more)

### Community 11 - "package.json"
Cohesion: 0.13
Nodes (14): devDependencies, concurrently, name, private, scripts, build, clean, dev (+6 more)

### Community 12 - "notificationController.ts"
Cohesion: 0.16
Nodes (10): deleteNotification(), getMuteTargets(), getNotifications(), markAllAsRead(), markAsRead(), muteTarget(), unmuteTarget(), router (+2 more)

### Community 16 - "s3Service"
Cohesion: 0.17
Nodes (5): router, EncryptedFileRecord, S3Health, s3Service, @aws-sdk/client-s3

### Community 17 - "Slackers - Fullstack Next.js & Node.js Web App"
Cohesion: 0.22
Nodes (8): 1. Install Dependencies, 2. Run Both Frontend and Backend Concurrently, 3. Individual Dev Commands, 📡 API Endpoints, 🏗 Project Architecture, ⚡ Quick Start, Slackers - Fullstack Next.js & Node.js Web App, 🛠 Tech Stack

### Community 18 - "web/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 23 - "dependencies"
Cohesion: 0.14
Nodes (14): dependencies, @aws-sdk/client-s3, bcryptjs, cors, dotenv, express, ioredis, jsonwebtoken (+6 more)

### Community 24 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, prisma, tsx, @types/bcryptjs, @types/cors, @types/express, @types/jsonwebtoken, @types/morgan (+2 more)

### Community 26 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, start

### Community 28 - "redisService.ts"
Cohesion: 0.50
Nodes (3): RedisHealth, dotenv, ioredis

### Community 30 - "dataStore.ts"
Cohesion: 0.23
Nodes (6): DEFAULT_PASSWORD_HASH, AVATAR_PRESETS, mongoLogger, UserSession, ActivityLog, bcryptjs

### Community 31 - "taskController.ts"
Cohesion: 0.15
Nodes (20): CreateCommentSchema, createTaskComment(), deleteTaskComment(), getTaskComments(), addQAStep(), AddQAStepSchema, createTask(), CreateTaskSchema (+12 more)

### Community 33 - "taskService.ts"
Cohesion: 0.21
Nodes (9): taskService, ProjectStats, QAReviewStep, QAStepStatus, Task, TaskPriority, TaskStatus, assert() (+1 more)

### Community 35 - "User"
Cohesion: 0.14
Nodes (5): memberService, AuthenticatedSocket, Invitation, User, UserRole

## Knowledge Gaps
- **184 isolated node(s):** `name`, `version`, `private`, `description`, `main` (+179 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 230 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `express` connect `src/index.ts` to `api/package.json`, `bugController.ts`, `dmController.ts`, `notificationController.ts`, `s3Service`, `taskController.ts`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `authService`, `dataStore`, `src/index.ts`, `taskService.ts`, `bugController.ts`, `dmController.ts`, `api/src/types/index.ts`, `dataStore.ts`, `taskController.ts`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `dataStore` connect `dataStore` to `taskService.ts`, `src/index.ts`, `User`, `dmController.ts`, `api/src/types/index.ts`, `s3Service`, `dataStore.ts`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _184 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.051834130781499205 - nodes in this community are weakly interconnected._
- **Should `dataStore` be split into smaller, more focused modules?**
  _Cohesion score 0.11396011396011396 - nodes in this community are weakly interconnected._
- **Should `src/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06027306027306027 - nodes in this community are weakly interconnected._