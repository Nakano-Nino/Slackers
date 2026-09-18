# Graph Report - slackers  (2026-09-18)

## Corpus Check
- 91 files · ~70,812 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .example 1, .prisma 1)

## Summary
- 747 nodes · 1857 edges · 42 communities (29 shown, 12 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 91 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `50fee90e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- page.tsx
- User
- authMiddleware.ts
- api/package.json
- bugService
- web/package.json
- dmController.ts
- compilerOptions
- E2EEService
- compilerOptions
- memberService
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
- dataStore.ts
- socketService
- src/index.ts
- authController.ts
- memberController.ts
- projectController.ts
- channelController.ts

## God Nodes (most connected - your core abstractions)
1. `User` - 59 edges
2. `dataStore` - 48 edges
3. `User` - 33 edges
4. `express` - 30 edges
5. `socketService` - 27 edges
6. `mongoLogger` - 23 edges
7. `taskService` - 22 edges
8. `react` - 22 edges
9. `lucide-react` - 21 edges
10. `Project` - 21 edges

## Surprising Connections (you probably didn't know these)
- `UserSessionResponse` --inherits--> `UserSession`  [EXTRACTED]
  apps/api/src/controllers/sessionController.ts → apps/api/src/services/sessionService.ts
- `runTest()` --calls--> `checkPostgresHealth()`  [EXTRACTED]
  scratch/test-db-integration.ts → apps/api/src/services/db.ts
- `AuthenticatedRequest` --references--> `User`  [EXTRACTED]
  apps/api/src/middleware/authMiddleware.ts → apps/api/src/types/index.ts
- `dataStore` --references--> `Message`  [EXTRACTED]
  apps/api/src/services/dataStore.ts → apps/api/src/types/index.ts
- `AuthenticatedSocket` --references--> `User`  [EXTRACTED]
  apps/api/src/services/socketService.ts → apps/api/src/types/index.ts

## Import Cycles
- 3-file cycle: `apps/api/src/services/authService.ts -> apps/api/src/services/notificationService.ts -> apps/api/src/services/socketService.ts -> apps/api/src/services/authService.ts`

## Communities (42 total, 12 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.05
Nodes (103): AuthModal(), DEMO_USERS, Props, BugTracker(), Props, SEVERITY_INFO, STATUS_BADGES, ChatArea() (+95 more)

### Community 1 - "User"
Cohesion: 0.12
Nodes (7): dataStore, generateSeedKeyVault(), AuthenticatedSocket, Channel, ChannelKey, KeyVaultData, User

### Community 2 - "authMiddleware.ts"
Cohesion: 0.20
Nodes (14): downloadEncryptedFile(), uploadEncryptedFile(), getSessions(), revokeOtherSessions(), revokeSession(), UserSessionResponse, authenticate(), AuthRequest (+6 more)

### Community 3 - "api/package.json"
Cohesion: 0.09
Nodes (21): description, @types/node, typescript, main, name, private, version, cors (+13 more)

### Community 4 - "bugService"
Cohesion: 0.29
Nodes (4): bugService, Bug, BugSeverity, BugStats

### Community 5 - "web/package.json"
Cohesion: 0.04
Nodes (43): nextConfig, dependencies, lucide-react, next, react, react-dom, socket.io-client, devDependencies (+35 more)

### Community 6 - "dmController.ts"
Cohesion: 0.14
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

### Community 28 - "mongoLogger"
Cohesion: 0.24
Nodes (5): checkPostgresHealth(), EncryptedFileRecord, mongoLogger, ActivityLog, runTest()

### Community 29 - "api/src/types/index.ts"
Cohesion: 0.17
Nodes (16): prisma, BugEnvironment, BugStatus, DeveloperRole, MuteDuration, MuteTarget, NotificationType, ProjectStats (+8 more)

### Community 30 - "redisService.ts"
Cohesion: 0.29
Nodes (5): RedisHealth, S3Health, @aws-sdk/client-s3, dotenv, ioredis

### Community 31 - "taskController.ts"
Cohesion: 0.13
Nodes (21): CreateCommentSchema, createTaskComment(), deleteTaskComment(), getTaskComments(), addQAStep(), AddQAStepSchema, createTask(), CreateTaskSchema (+13 more)

### Community 32 - "bugController.ts"
Cohesion: 0.44
Nodes (9): convertBugToTask(), createBug(), CreateBugSchema, deleteBug(), getBugById(), getBugs(), getBugStats(), updateBug() (+1 more)

### Community 35 - "dataStore.ts"
Cohesion: 0.20
Nodes (8): authService, DEFAULT_PASSWORD_HASH, AVATAR_PRESETS, parseDeviceName(), UserSession, AuthResponse, UserRole, bcryptjs

### Community 36 - "socketService"
Cohesion: 0.08
Nodes (10): createMessage(), CreateMessageSchema, deleteMessage(), editMessage(), getMessagesByChannel(), getThreadReplies(), toggleReaction(), router (+2 more)

### Community 37 - "src/index.ts"
Cohesion: 0.15
Nodes (12): app, avatarsDir, httpServer, uploadsDir, errorHandler(), router, router, router (+4 more)

### Community 38 - "authController.ts"
Cohesion: 0.25
Nodes (12): getMe(), login(), LoginSchema, logout(), register(), RegisterSchema, updateProfile(), UpdateProfileSchema (+4 more)

### Community 39 - "memberController.ts"
Cohesion: 0.30
Nodes (12): acceptInvitation(), AcceptInviteSchema, addMember(), AddMemberSchema, createInvitation(), CreateInviteSchema, getInvitations(), revokeInvitation() (+4 more)

### Community 40 - "projectController.ts"
Cohesion: 0.31
Nodes (12): createProject(), CreateProjectSchema, deleteProject(), getProjectById(), getProjects(), getProjectStats(), updateProject(), UpdateProjectSchema (+4 more)

### Community 41 - "channelController.ts"
Cohesion: 0.50
Nodes (7): createChannel(), CreateChannelSchema, getChannelById(), getChannelKey(), getChannels(), saveChannelKey(), SaveChannelKeySchema

## Knowledge Gaps
- **209 isolated node(s):** `name`, `version`, `private`, `description`, `main` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 264 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `express` connect `authMiddleware.ts` to `bugController.ts`, `api/package.json`, `socketService`, `src/index.ts`, `authController.ts`, `dmController.ts`, `memberController.ts`, `channelController.ts`, `projectController.ts`, `notificationService`, `mongoLogger`, `taskController.ts`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `authMiddleware.ts`, `dataStore.ts`, `bugService`, `socketService`, `authController.ts`, `memberController.ts`, `projectController.ts`, `dmController.ts`, `memberService`, `projectService`, `taskService`, `api/src/types/index.ts`, `taskController.ts`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `dataStore` connect `User` to `authMiddleware.ts`, `dataStore.ts`, `socketService`, `src/index.ts`, `dmController.ts`, `channelController.ts`, `mongoLogger`, `api/src/types/index.ts`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.051834130781499205 - nodes in this community are weakly interconnected._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `api/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._