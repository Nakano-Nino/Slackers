# Graph Report - slackers  (2026-09-16)

## Corpus Check
- 73 files · ~41,045 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .example 1, .prisma 1)

## Summary
- 559 nodes · 1321 edges · 23 communities (16 shown, 6 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c4a96a30`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- page.tsx
- User
- src/index.ts
- api/package.json
- taskService.ts
- web/package.json
- mongoLogger
- compilerOptions
- E2EEService
- compilerOptions
- api/src/types/index.ts
- package.json
- notificationController.ts
- eslint.config.mjs
- postcss.config.mjs
- redisService
- ThemeContext.tsx
- Slackers - Fullstack Next.js & Node.js Web App
- web/README.md
- rules/graphify.md
- workflows/graphify.md
- AGENTS.md

## God Nodes (most connected - your core abstractions)
1. `User` - 40 edges
2. `dataStore` - 39 edges
3. `express` - 24 edges
4. `User` - 23 edges
5. `redisService` - 18 edges
6. `react` - 18 edges
7. `lucide-react` - 17 edges
8. `Project` - 17 edges
9. `mongoLogger` - 16 edges
10. `notificationService` - 16 edges

## Surprising Connections (you probably didn't know these)
- `AuthenticatedRequest` --references--> `User`  [EXTRACTED]
  apps/api/src/middleware/authMiddleware.ts → apps/api/src/types/index.ts
- `AuthenticatedSocket` --references--> `User`  [EXTRACTED]
  apps/api/src/services/socketService.ts → apps/api/src/types/index.ts
- `Home()` --calls--> `connectSocket()`  [EXTRACTED]
  apps/web/src/app/page.tsx → apps/web/src/lib/socket.ts
- `Home()` --calls--> `disconnectSocket()`  [EXTRACTED]
  apps/web/src/app/page.tsx → apps/web/src/lib/socket.ts
- `Home()` --calls--> `getSocket()`  [EXTRACTED]
  apps/web/src/app/page.tsx → apps/web/src/lib/socket.ts

## Import Cycles
- None detected.

## Communities (23 total, 6 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.07
Nodes (79): AuthModal(), DEMO_USERS, Props, BackendStatus(), BugTracker(), Props, SEVERITY_INFO, STATUS_BADGES (+71 more)

### Community 1 - "User"
Cohesion: 0.07
Nodes (17): authService, dataStore, DEFAULT_PASSWORD_HASH, generateSeedKeyVault(), projectService, AuthenticatedSocket, Channel, ChannelKey (+9 more)

### Community 2 - "src/index.ts"
Cohesion: 0.06
Nodes (61): getMe(), login(), LoginSchema, register(), RegisterSchema, updateProfile(), UpdateProfileSchema, createChannel() (+53 more)

### Community 3 - "api/package.json"
Cohesion: 0.04
Nodes (45): dependencies, bcryptjs, cors, dotenv, express, ioredis, jsonwebtoken, mongodb (+37 more)

### Community 4 - "taskService.ts"
Cohesion: 0.11
Nodes (22): CreateCommentSchema, createTaskComment(), deleteTaskComment(), getTaskComments(), createTask(), CreateTaskSchema, deleteTask(), getProjectStats() (+14 more)

### Community 5 - "web/package.json"
Cohesion: 0.06
Nodes (33): dependencies, lucide-react, next, react, react-dom, socket.io-client, devDependencies, eslint (+25 more)

### Community 6 - "mongoLogger"
Cohesion: 0.21
Nodes (5): dmService, mongoLogger, ActivityLog, DirectMessage, mongodb

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
Cohesion: 0.16
Nodes (19): convertBugToTask(), createBug(), CreateBugSchema, deleteBug(), getBugById(), getBugs(), getBugStats(), updateBug() (+11 more)

### Community 11 - "package.json"
Cohesion: 0.13
Nodes (14): devDependencies, concurrently, name, private, scripts, build, clean, dev (+6 more)

### Community 12 - "notificationController.ts"
Cohesion: 0.10
Nodes (12): deleteNotification(), getMuteTargets(), getNotifications(), markAllAsRead(), markAsRead(), muteTarget(), unmuteTarget(), router (+4 more)

### Community 16 - "ThemeContext.tsx"
Cohesion: 0.16
Nodes (10): nextConfig, metadata, Props, ThemeToggle(), Theme, ThemeContext, ThemeContextType, ThemeProvider() (+2 more)

### Community 17 - "Slackers - Fullstack Next.js & Node.js Web App"
Cohesion: 0.22
Nodes (8): 1. Install Dependencies, 2. Run Both Frontend and Backend Concurrently, 3. Individual Dev Commands, 📡 API Endpoints, 🏗 Project Architecture, ⚡ Quick Start, Slackers - Fullstack Next.js & Node.js Web App, 🛠 Tech Stack

### Community 18 - "web/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **168 isolated node(s):** `name`, `version`, `private`, `description`, `main` (+163 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 199 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `express` connect `src/index.ts` to `api/src/types/index.ts`, `api/package.json`, `notificationController.ts`, `taskService.ts`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `src/index.ts`, `taskService.ts`, `mongoLogger`, `api/src/types/index.ts`, `notificationController.ts`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `dataStore` connect `User` to `src/index.ts`, `taskService.ts`, `mongoLogger`, `api/src/types/index.ts`, `notificationController.ts`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _168 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06639487478159581 - nodes in this community are weakly interconnected._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.07259528130671507 - nodes in this community are weakly interconnected._
- **Should `src/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05777345017851347 - nodes in this community are weakly interconnected._