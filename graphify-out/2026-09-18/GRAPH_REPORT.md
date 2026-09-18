# Graph Report - slackers  (2026-09-17)

## Corpus Check
- 91 files · ~70,589 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .example 1, .prisma 1)

## Summary
- 746 nodes · 1847 edges · 37 communities (24 shown, 12 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 90 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `50fee90e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- page.tsx
- dataStore
- src/index.ts
- api/package.json
- User
- web/package.json
- dmController.ts
- compilerOptions
- E2EEService
- compilerOptions
- memberService.ts
- package.json
- notificationService
- eslint.config.mjs
- postcss.config.mjs
- redisService
- s3Service
- 🚀 Slackers
- web/README.md
- rules/graphify.md
- workflows/graphify.md
- AGENTS.md
- dependencies
- devDependencies
- projectService
- scripts
- taskService
- mongoLogger
- api/src/types/index.ts
- redisService.ts
- taskController.ts
- bugController.ts
- sessionService
- fileService
- authService
- test-project-members.ts

## God Nodes (most connected - your core abstractions)
1. `User` - 59 edges
2. `dataStore` - 48 edges
3. `User` - 33 edges
4. `express` - 30 edges
5. `socketService` - 26 edges
6. `mongoLogger` - 22 edges
7. `taskService` - 22 edges
8. `react` - 22 edges
9. `lucide-react` - 21 edges
10. `Project` - 21 edges

## Surprising Connections (you probably didn't know these)
- `UserSessionResponse` --inherits--> `UserSession`  [EXTRACTED]
  apps/api/src/controllers/sessionController.ts → apps/api/src/services/sessionService.ts
- `runTest()` --calls--> `checkPostgresHealth()`  [EXTRACTED]
  scratch/test-db-integration.ts → apps/api/src/services/db.ts
- `AuthenticatedSocket` --references--> `User`  [EXTRACTED]
  apps/api/src/services/socketService.ts → apps/api/src/types/index.ts
- `AuthenticatedRequest` --references--> `User`  [EXTRACTED]
  apps/api/src/middleware/authMiddleware.ts → apps/api/src/types/index.ts
- `dataStore` --references--> `User`  [EXTRACTED]
  apps/api/src/services/dataStore.ts → apps/api/src/types/index.ts

## Import Cycles
- 3-file cycle: `apps/api/src/services/authService.ts -> apps/api/src/services/notificationService.ts -> apps/api/src/services/socketService.ts -> apps/api/src/services/authService.ts`

## Communities (37 total, 12 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.05
Nodes (101): AuthModal(), DEMO_USERS, Props, BugTracker(), Props, SEVERITY_INFO, STATUS_BADGES, ChatArea() (+93 more)

### Community 1 - "dataStore"
Cohesion: 0.11
Nodes (6): dataStore, generateSeedKeyVault(), Channel, ChannelKey, KeyVaultData, Message

### Community 2 - "src/index.ts"
Cohesion: 0.06
Nodes (64): getMe(), login(), LoginSchema, register(), RegisterSchema, updateProfile(), UpdateProfileSchema, uploadAvatar() (+56 more)

### Community 3 - "api/package.json"
Cohesion: 0.09
Nodes (21): description, @types/node, typescript, main, name, private, version, cors (+13 more)

### Community 4 - "User"
Cohesion: 0.16
Nodes (5): bugService, Bug, BugSeverity, BugStats, User

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
Cohesion: 0.27
Nodes (6): Home(), SettingsModal(), arrayBufferToBase64(), base64ToArrayBuffer(), E2EEService, KeyVaultData

### Community 9 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, outDir, resolveJsonModule (+6 more)

### Community 10 - "memberService.ts"
Cohesion: 0.17
Nodes (8): AVATAR_PRESETS, memberService, UserSession, AuthenticatedSocket, AuthResponse, Invitation, UserRole, bcryptjs

### Community 11 - "package.json"
Cohesion: 0.13
Nodes (14): devDependencies, concurrently, name, private, scripts, build, clean, dev (+6 more)

### Community 12 - "notificationService"
Cohesion: 0.15
Nodes (10): deleteNotification(), getMuteTargets(), getNotifications(), markAllAsRead(), markAsRead(), muteTarget(), unmuteTarget(), router (+2 more)

### Community 17 - "🚀 Slackers"
Cohesion: 0.06
Nodes (32): 1. Installation, 1. Zero-Knowledge End-to-End Encryption (E2EE), 2. Environment Configuration, 2. Real-Time Channels & Direct Messaging, 3. Agile Kanban Board & Project Management, 3. Running the Application, 4. Building for Production, 4. Structured QA Review Steps & Acceptance Criteria (+24 more)

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
Cohesion: 0.29
Nodes (7): scripts, build, db:seed, dev, prisma:generate, prisma:push, start

### Community 27 - "taskService"
Cohesion: 0.30
Nodes (3): taskService, Task, TaskStatus

### Community 28 - "mongoLogger"
Cohesion: 0.31
Nodes (3): EncryptedFileRecord, mongoLogger, ActivityLog

### Community 29 - "api/src/types/index.ts"
Cohesion: 0.18
Nodes (16): DEFAULT_PASSWORD_HASH, checkPostgresHealth(), prisma, BugEnvironment, BugStatus, DeveloperRole, MuteDuration, MuteTarget (+8 more)

### Community 30 - "redisService.ts"
Cohesion: 0.29
Nodes (5): RedisHealth, S3Health, @aws-sdk/client-s3, dotenv, ioredis

### Community 31 - "taskController.ts"
Cohesion: 0.09
Nodes (33): createProject(), CreateProjectSchema, deleteProject(), getProjectById(), getProjects(), getProjectStats(), updateProject(), UpdateProjectSchema (+25 more)

### Community 32 - "bugController.ts"
Cohesion: 0.38
Nodes (10): convertBugToTask(), createBug(), CreateBugSchema, deleteBug(), getBugById(), getBugs(), getBugStats(), updateBug() (+2 more)

## Knowledge Gaps
- **209 isolated node(s):** `name`, `version`, `private`, `description`, `main` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 264 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `express` connect `src/index.ts` to `bugController.ts`, `api/package.json`, `dmController.ts`, `notificationService`, `api/src/types/index.ts`, `taskController.ts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `dataStore`, `src/index.ts`, `authService`, `test-project-members.ts`, `dmController.ts`, `memberService.ts`, `projectService`, `taskService`, `api/src/types/index.ts`, `taskController.ts`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `dataStore` connect `dataStore` to `src/index.ts`, `User`, `test-project-members.ts`, `dmController.ts`, `memberService.ts`, `api/src/types/index.ts`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05273047563123899 - nodes in this community are weakly interconnected._
- **Should `dataStore` be split into smaller, more focused modules?**
  _Cohesion score 0.10846560846560846 - nodes in this community are weakly interconnected._
- **Should `src/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05600722673893405 - nodes in this community are weakly interconnected._