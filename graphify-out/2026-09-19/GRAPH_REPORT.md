# Graph Report - slackers  (2026-09-19)

## Corpus Check
- 92 files · ~83,131 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .example 1, .prisma 1)

## Summary
- 787 nodes · 1979 edges · 37 communities (28 shown, 8 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 97 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `01d26286`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- web/src/types/index.ts
- dataStore
- src/index.ts
- api/package.json
- socketService
- web/package.json
- dmController.ts
- compilerOptions
- E2EEService
- compilerOptions
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
- scripts
- User
- mongoLogger
- api/src/types/index.ts
- redisService.ts
- taskController.ts
- ChatArea.tsx
- authController.ts
- socketService.ts
- SettingsModal.tsx
- page.tsx
- User
- ReportBugModal.tsx

## God Nodes (most connected - your core abstractions)
1. `User` - 62 edges
2. `dataStore` - 50 edges
3. `User` - 34 edges
4. `express` - 30 edges
5. `socketService` - 28 edges
6. `E2EEService` - 26 edges
7. `mongoLogger` - 25 edges
8. `taskService` - 25 edges
9. `react` - 22 edges
10. `lucide-react` - 21 edges

## Surprising Connections (you probably didn't know these)
- `UserSessionResponse` --inherits--> `UserSession`  [EXTRACTED]
  apps/api/src/controllers/sessionController.ts → apps/api/src/services/sessionService.ts
- `runTest()` --calls--> `checkPostgresHealth()`  [EXTRACTED]
  scratch/test-db-integration.ts → apps/api/src/services/db.ts
- `AuthenticatedSocket` --references--> `User`  [EXTRACTED]
  apps/api/src/services/socketService.ts → apps/api/src/types/index.ts
- `Props` --references--> `User`  [EXTRACTED]
  apps/web/src/components/AuthModal.tsx → apps/web/src/types/index.ts
- `SafetyModalProps` --references--> `User`  [EXTRACTED]
  apps/web/src/components/ChatArea.tsx → apps/web/src/types/index.ts

## Import Cycles
- None detected.

## Communities (37 total, 8 thin omitted)

### Community 0 - "web/src/types/index.ts"
Cohesion: 0.14
Nodes (21): Props, PRIORITY_LABELS, STATUS_LABELS, api, channelKeyCache, sharedKeyCache, ActivityLog, ApiResponse (+13 more)

### Community 1 - "dataStore"
Cohesion: 0.08
Nodes (6): dataStore, generateSeedKeyVault(), Channel, ChannelKey, KeyVaultData, Message

### Community 2 - "src/index.ts"
Cohesion: 0.06
Nodes (73): createChannel(), CreateChannelSchema, getChannelById(), getChannelKey(), getChannels(), saveChannelKey(), SaveChannelKeySchema, downloadEncryptedFile() (+65 more)

### Community 3 - "api/package.json"
Cohesion: 0.09
Nodes (21): description, @types/node, typescript, main, name, private, version, cors (+13 more)

### Community 5 - "web/package.json"
Cohesion: 0.04
Nodes (43): nextConfig, dependencies, lucide-react, next, react, react-dom, socket.io-client, devDependencies (+35 more)

### Community 6 - "dmController.ts"
Cohesion: 0.12
Nodes (18): deleteDirectMessage(), editDirectMessage(), getConversation(), getKeyVault(), getPublicKey(), getRecentConversations(), getUnreadCounts(), KeyVaultSchema (+10 more)

### Community 7 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 8 - "E2EEService"
Cohesion: 0.17
Nodes (8): Home(), ChatArea(), extractPlainText(), SettingsModal(), arrayBufferToBase64(), base64ToArrayBuffer(), E2EEService, KeyVaultData

### Community 9 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, outDir, resolveJsonModule (+6 more)

### Community 11 - "package.json"
Cohesion: 0.13
Nodes (14): devDependencies, concurrently, name, private, scripts, build, clean, dev (+6 more)

### Community 12 - "notificationService"
Cohesion: 0.20
Nodes (3): notificationService, Notification, NotificationType

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

### Community 27 - "User"
Cohesion: 0.09
Nodes (22): convertBugToTask(), createBug(), CreateBugSchema, deleteBug(), getBugById(), getBugs(), getBugStats(), updateBug() (+14 more)

### Community 28 - "mongoLogger"
Cohesion: 0.16
Nodes (6): checkPostgresHealth(), EncryptedFileRecord, fileService, mongoLogger, ActivityLog, runTest()

### Community 29 - "api/src/types/index.ts"
Cohesion: 0.20
Nodes (13): DEFAULT_PASSWORD_HASH, prisma, DeveloperRole, MuteDuration, MuteTarget, ProjectStats, QAReviewStep, QAStepStatus (+5 more)

### Community 30 - "redisService.ts"
Cohesion: 0.29
Nodes (5): RedisHealth, S3Health, @aws-sdk/client-s3, dotenv, ioredis

### Community 31 - "taskController.ts"
Cohesion: 0.11
Nodes (28): CreateCommentSchema, createTaskComment(), deleteTaskComment(), getTaskComments(), addQAStep(), AddQAStepSchema, addSubtask(), AddSubtaskSchema (+20 more)

### Community 33 - "ChatArea.tsx"
Cohesion: 0.14
Nodes (25): ChatDateDivider(), EncryptedAttachmentCard(), highlightMatches(), Props, RenderDecryptedContent(), SafetyModalProps, TaskAttachmentCard(), COMMON_REACTIONS (+17 more)

### Community 35 - "authController.ts"
Cohesion: 0.10
Nodes (16): getMe(), login(), LoginSchema, logout(), register(), RegisterSchema, updateProfile(), UpdateProfileSchema (+8 more)

### Community 38 - "socketService.ts"
Cohesion: 0.23
Nodes (6): AVATAR_PRESETS, parseDeviceName(), sessionService, UserSession, AuthenticatedSocket, bcryptjs

### Community 42 - "SettingsModal.tsx"
Cohesion: 0.13
Nodes (18): AuthModal(), DEMO_USERS, Props, InviteMemberModal(), Props, AVATAR_PRESETS, Props, SettingsTab (+10 more)

### Community 43 - "page.tsx"
Cohesion: 0.16
Nodes (17): BugTracker(), Props, SEVERITY_INFO, STATUS_BADGES, CreateChannelModal(), Props, NotificationCenter(), ProjectProgressBar() (+9 more)

### Community 44 - "User"
Cohesion: 0.16
Nodes (20): CommandPalette(), PaletteItem, Props, CreateProjectModal(), Props, Props, COLUMN_WIP_LIMITS, COLUMNS (+12 more)

### Community 47 - "ReportBugModal.tsx"
Cohesion: 0.27
Nodes (9): CreateTaskModal(), Props, ReportBugModal(), formatActivityAction(), getDueDateStatus(), TaskDetailModal(), formatUserRole(), BugEnvironment (+1 more)

## Knowledge Gaps
- **213 isolated node(s):** `name`, `version`, `private`, `description`, `main` (+208 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 269 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `express` connect `src/index.ts` to `authController.ts`, `api/package.json`, `dmController.ts`, `User`, `mongoLogger`, `taskController.ts`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `dataStore`, `src/index.ts`, `authController.ts`, `socketService`, `socketService.ts`, `dmController.ts`, `notificationService`, `api/src/types/index.ts`, `taskController.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `dataStore` connect `dataStore` to `src/index.ts`, `socketService.ts`, `dmController.ts`, `notificationService`, `User`, `mongoLogger`, `api/src/types/index.ts`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _213 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `web/src/types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14039408866995073 - nodes in this community are weakly interconnected._
- **Should `dataStore` be split into smaller, more focused modules?**
  _Cohesion score 0.07807807807807808 - nodes in this community are weakly interconnected._
- **Should `src/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05586722767648434 - nodes in this community are weakly interconnected._