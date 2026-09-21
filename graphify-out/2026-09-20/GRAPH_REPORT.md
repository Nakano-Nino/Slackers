# Graph Report - slackers  (2026-09-20)

## Corpus Check
- 100 files · ~93,279 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .example 1, .prisma 1)

## Summary
- 862 nodes · 2234 edges · 38 communities (28 shown, 9 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 94 edges (avg confidence: 0.85)
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
- Webhook
- web/package.json
- dmController.ts
- compilerOptions
- E2EEService
- compilerOptions
- webhookService.ts
- package.json
- notificationService
- eslint.config.mjs
- postcss.config.mjs
- redisService
- Message
- 🚀 Slackers
- web/README.md
- rules/graphify.md
- workflows/graphify.md
- AGENTS.md
- dependencies
- devDependencies
- automationService
- scripts
- User
- authController.ts
- Sidebar.tsx
- WebhookLog
- taskController.ts
- ChatArea.tsx
- api/src/types/index.ts
- react
- roles.ts
- page.tsx
- User

## God Nodes (most connected - your core abstractions)
1. `dataStore` - 72 edges
2. `User` - 64 edges
3. `User` - 34 edges
4. `express` - 32 edges
5. `socketService` - 30 edges
6. `taskService` - 27 edges
7. `mongoLogger` - 26 edges
8. `E2EEService` - 26 edges
9. `redisService` - 23 edges
10. `Task` - 22 edges

## Surprising Connections (you probably didn't know these)
- `runVerification()` --calls--> `getChannels()`  [EXTRACTED]
  scratch/test-pentest-remediations.ts → apps/api/src/controllers/channelController.ts
- `runVerification()` --calls--> `getChannelById()`  [EXTRACTED]
  scratch/test-pentest-remediations.ts → apps/api/src/controllers/channelController.ts
- `runVerification()` --calls--> `getMessagesByChannel()`  [EXTRACTED]
  scratch/test-pentest-remediations.ts → apps/api/src/controllers/messageController.ts
- `runVerification()` --calls--> `createMessage()`  [EXTRACTED]
  scratch/test-pentest-remediations.ts → apps/api/src/controllers/messageController.ts
- `runRound2Verification()` --calls--> `toggleReaction()`  [EXTRACTED]
  scratch/test-pentest-round2.ts → apps/api/src/controllers/messageController.ts

## Import Cycles
- None detected.

## Communities (38 total, 9 thin omitted)

### Community 0 - "web/src/types/index.ts"
Cohesion: 0.11
Nodes (32): Props, AVATAR_PRESETS, SettingsTab, formatActivityAction(), getDueDateStatus(), PRIORITY_LABELS, STATUS_LABELS, TaskDetailModal() (+24 more)

### Community 1 - "dataStore"
Cohesion: 0.09
Nodes (6): dataStore, generateSeedKeyVault(), AutomationRule, Channel, ChannelKey, KeyVaultData

### Community 2 - "src/index.ts"
Cohesion: 0.06
Nodes (74): createChannel(), CreateChannelSchema, getChannelById(), getChannelKey(), getChannels(), saveChannelKey(), SaveChannelKeySchema, downloadEncryptedFile() (+66 more)

### Community 3 - "api/package.json"
Cohesion: 0.10
Nodes (19): description, @types/node, typescript, main, name, private, version, cors (+11 more)

### Community 4 - "Webhook"
Cohesion: 0.23
Nodes (4): encryptChannelMessageNode(), webhookService, IncomingWebhookPayload, Webhook

### Community 5 - "web/package.json"
Cohesion: 0.04
Nodes (42): nextConfig, dependencies, lucide-react, next, react, react-dom, socket.io-client, devDependencies (+34 more)

### Community 6 - "dmController.ts"
Cohesion: 0.08
Nodes (18): deleteDirectMessage(), editDirectMessage(), getConversation(), getKeyVault(), getPublicKey(), getRecentConversations(), getUnreadCounts(), KeyVaultSchema (+10 more)

### Community 7 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 8 - "E2EEService"
Cohesion: 0.17
Nodes (7): Home(), ChatArea(), extractPlainText(), SettingsModal(), arrayBufferToBase64(), base64ToArrayBuffer(), E2EEService

### Community 9 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, outDir, resolveJsonModule (+6 more)

### Community 10 - "webhookService.ts"
Cohesion: 0.27
Nodes (8): webhookController, channelKeyCache, decryptChannelMessageNode(), deriveChannelKeyNode(), generateWebhookSecret(), generateWebhookToken(), verifyHmacSha256(), WebhookType

### Community 11 - "package.json"
Cohesion: 0.13
Nodes (14): devDependencies, concurrently, name, private, scripts, build, clean, dev (+6 more)

### Community 12 - "notificationService"
Cohesion: 0.14
Nodes (11): deleteNotification(), getMuteTargets(), getNotifications(), markAllAsRead(), markAsRead(), muteTarget(), unmuteTarget(), router (+3 more)

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
Nodes (23): convertBugToTask(), createBug(), CreateBugSchema, deleteBug(), getBugById(), getBugs(), getBugStats(), updateBug() (+15 more)

### Community 28 - "authController.ts"
Cohesion: 0.10
Nodes (16): getMe(), login(), LoginSchema, logout(), register(), RegisterSchema, updateProfile(), UpdateProfileSchema (+8 more)

### Community 29 - "Sidebar.tsx"
Cohesion: 0.47
Nodes (5): Props, Props, Sidebar(), getUserRoleBadge(), MuteTarget

### Community 31 - "taskController.ts"
Cohesion: 0.12
Nodes (26): CreateCommentSchema, createTaskComment(), deleteTaskComment(), getTaskComments(), addQAStep(), AddQAStepSchema, addSubtask(), AddSubtaskSchema (+18 more)

### Community 33 - "ChatArea.tsx"
Cohesion: 0.15
Nodes (24): ChatDateDivider(), EncryptedAttachmentCard(), highlightMatches(), Props, RenderDecryptedContent(), TaskAttachmentCard(), COMMON_REACTIONS, Props (+16 more)

### Community 35 - "api/src/types/index.ts"
Cohesion: 0.06
Nodes (38): DEFAULT_PASSWORD_HASH, checkPostgresHealth(), prisma, EncryptedFileRecord, fileService, AVATAR_PRESETS, mongoLogger, RedisHealth (+30 more)

### Community 40 - "react"
Cohesion: 0.29
Nodes (5): CreateChannelModal(), Props, HealthStatus, lucide-react, react

### Community 42 - "roles.ts"
Cohesion: 0.16
Nodes (14): AuthModal(), DEMO_USERS, Props, InviteMemberModal(), Props, ProjectProgressBar(), Props, DEVELOPER_ROLES (+6 more)

### Community 43 - "page.tsx"
Cohesion: 0.16
Nodes (17): BugTracker(), Props, SEVERITY_INFO, STATUS_BADGES, CreateTaskModal(), NotificationCenter(), Props, ReportBugModal() (+9 more)

### Community 44 - "User"
Cohesion: 0.15
Nodes (21): SafetyModalProps, CommandPalette(), PaletteItem, Props, CreateProjectModal(), Props, Props, COLUMN_WIP_LIMITS (+13 more)

## Knowledge Gaps
- **220 isolated node(s):** `name`, `version`, `private`, `description`, `main` (+215 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 282 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dataStore` connect `dataStore` to `src/index.ts`, `api/src/types/index.ts`, `Webhook`, `dmController.ts`, `webhookService.ts`, `Message`, `User`, `WebhookLog`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `express` connect `src/index.ts` to `api/package.json`, `api/src/types/index.ts`, `dmController.ts`, `webhookService.ts`, `notificationService`, `User`, `authController.ts`, `taskController.ts`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `dataStore`, `src/index.ts`, `api/src/types/index.ts`, `dmController.ts`, `authController.ts`, `taskController.ts`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _220 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `web/src/types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `dataStore` be split into smaller, more focused modules?**
  _Cohesion score 0.0855614973262032 - nodes in this community are weakly interconnected._
- **Should `src/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05592105263157895 - nodes in this community are weakly interconnected._