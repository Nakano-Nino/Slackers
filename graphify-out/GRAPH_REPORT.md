# Graph Report - slackers  (2026-09-21)

## Corpus Check
- 104 files · ~95,701 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 5, .example 2, .conf 2)

## Summary
- 895 nodes · 2264 edges · 57 communities (43 shown, 13 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 94 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `01d26286`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- web/src/types/index.ts
- dataStore
- authMiddleware.ts
- projectController.ts
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
- test-pentest-remediations.ts
- 🚀 Slackers
- web/README.md
- rules/graphify.md
- workflows/graphify.md
- AGENTS.md
- dependencies
- devDependencies
- AutomationRule
- scripts
- User
- authController.ts
- src/index.ts
- WebhookLog
- taskController.ts
- memberController.ts
- ChatArea.tsx
- messageController.ts
- mongoLogger.ts
- sessionController.ts
- socketService.ts
- bugController.ts
- .constructor
- Channel
- api/src/types/index.ts
- roles.ts
- page.tsx
- KanbanBoard.tsx
- KeyVaultData
- 🚀 Slackers — Ubuntu VPS Docker Deployment Guide
- api/package.json
- notificationController.ts
- mongoLogger
- taskCommentController.ts
- lucide-react
- socket.ts
- UserRole
- init-ssl.sh
- entrypoint.sh
- deploy.sh

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
- `runRound2Verification()` --calls--> `revokeSession()`  [EXTRACTED]
  scratch/test-pentest-round2.ts → apps/api/src/controllers/sessionController.ts
- `runVerification()` --calls--> `authenticate()`  [EXTRACTED]
  scratch/test-pentest-remediations.ts → apps/api/src/middleware/authMiddleware.ts
- `runVerification()` --calls--> `getChannels()`  [EXTRACTED]
  scratch/test-pentest-remediations.ts → apps/api/src/controllers/channelController.ts
- `runVerification()` --calls--> `getChannelById()`  [EXTRACTED]
  scratch/test-pentest-remediations.ts → apps/api/src/controllers/channelController.ts
- `runVerification()` --calls--> `getMessagesByChannel()`  [EXTRACTED]
  scratch/test-pentest-remediations.ts → apps/api/src/controllers/messageController.ts

## Import Cycles
- None detected.

## Communities (57 total, 13 thin omitted)

### Community 0 - "web/src/types/index.ts"
Cohesion: 0.12
Nodes (27): AVATAR_PRESETS, SettingsTab, PRIORITY_LABELS, STATUS_LABELS, api, channelKeyCache, sharedKeyCache, ActivityLog (+19 more)

### Community 1 - "dataStore"
Cohesion: 0.10
Nodes (4): dataStore, Channel, ChannelKey, Message

### Community 2 - "authMiddleware.ts"
Cohesion: 0.19
Nodes (12): downloadEncryptedFile(), uploadEncryptedFile(), webhookController, authenticate(), AuthRequest, requireRole(), memoryRateLimits, messagingRateLimiter (+4 more)

### Community 3 - "projectController.ts"
Cohesion: 0.45
Nodes (9): createProject(), CreateProjectSchema, deleteProject(), getProjectById(), getProjects(), getProjectStats(), updateProject(), UpdateProjectSchema (+1 more)

### Community 4 - "Webhook"
Cohesion: 0.23
Nodes (4): encryptChannelMessageNode(), webhookService, IncomingWebhookPayload, Webhook

### Community 5 - "web/package.json"
Cohesion: 0.04
Nodes (42): nextConfig, dependencies, lucide-react, next, react, react-dom, socket.io-client, devDependencies (+34 more)

### Community 6 - "dmController.ts"
Cohesion: 0.07
Nodes (18): deleteDirectMessage(), editDirectMessage(), getConversation(), getKeyVault(), getPublicKey(), getRecentConversations(), getUnreadCounts(), KeyVaultSchema (+10 more)

### Community 7 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 8 - "E2EEService"
Cohesion: 0.18
Nodes (6): Home(), ChatArea(), SettingsModal(), arrayBufferToBase64(), base64ToArrayBuffer(), E2EEService

### Community 9 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, outDir, resolveJsonModule (+6 more)

### Community 10 - "webhookService.ts"
Cohesion: 0.36
Nodes (6): channelKeyCache, decryptChannelMessageNode(), deriveChannelKeyNode(), generateWebhookSecret(), generateWebhookToken(), WebhookType

### Community 11 - "package.json"
Cohesion: 0.13
Nodes (14): devDependencies, concurrently, name, private, scripts, build, clean, dev (+6 more)

### Community 12 - "notificationService"
Cohesion: 0.16
Nodes (3): notificationService, Notification, NotificationType

### Community 16 - "test-pentest-remediations.ts"
Cohesion: 0.31
Nodes (13): createChannel(), CreateChannelSchema, getChannelById(), getChannelKey(), getChannels(), saveChannelKey(), SaveChannelKeySchema, createMessage() (+5 more)

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

### Community 25 - "AutomationRule"
Cohesion: 0.21
Nodes (3): automationService, AutomationRule, AutomationTrigger

### Community 26 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, db:seed, dev, prisma:generate, prisma:push, start

### Community 27 - "User"
Cohesion: 0.12
Nodes (9): memberService, projectService, AuthenticatedSocket, taskService, Invitation, Project, Task, TaskStatus (+1 more)

### Community 28 - "authController.ts"
Cohesion: 0.23
Nodes (13): getMe(), login(), LoginSchema, logout(), register(), RegisterSchema, updateProfile(), UpdateProfileSchema (+5 more)

### Community 29 - "src/index.ts"
Cohesion: 0.12
Nodes (15): app, avatarsDir, httpServer, uploadsDir, errorHandler(), router, router, router (+7 more)

### Community 31 - "taskController.ts"
Cohesion: 0.22
Nodes (19): addQAStep(), AddQAStepSchema, addSubtask(), AddSubtaskSchema, createTask(), CreateTaskSchema, deleteQAStep(), deleteSubtask() (+11 more)

### Community 32 - "memberController.ts"
Cohesion: 0.30
Nodes (12): acceptInvitation(), AcceptInviteSchema, addMember(), AddMemberSchema, createInvitation(), CreateInviteSchema, getInvitations(), revokeInvitation() (+4 more)

### Community 33 - "ChatArea.tsx"
Cohesion: 0.14
Nodes (24): ChatDateDivider(), EncryptedAttachmentCard(), extractPlainText(), highlightMatches(), Props, RenderDecryptedContent(), TaskAttachmentCard(), COMMON_REACTIONS (+16 more)

### Community 34 - "messageController.ts"
Cohesion: 0.45
Nodes (8): CreateMessageSchema, deleteMessage(), editMessage(), getThreadReplies(), toggleReaction(), assert(), mockResponse(), runRound2Verification()

### Community 35 - "mongoLogger.ts"
Cohesion: 0.11
Nodes (9): checkPostgresHealth(), EncryptedFileRecord, fileService, RedisHealth, S3Health, s3Service, dotenv, ioredis (+1 more)

### Community 36 - "sessionController.ts"
Cohesion: 0.52
Nodes (5): getSessions(), revokeOtherSessions(), revokeSession(), UserSessionResponse, router

### Community 37 - "socketService.ts"
Cohesion: 0.16
Nodes (8): authService, AVATAR_PRESETS, parseDeviceName(), sessionService, UserSession, AuthResponse, UserRole, bcryptjs

### Community 38 - "bugController.ts"
Cohesion: 0.11
Nodes (19): convertBugToTask(), createBug(), CreateBugSchema, deleteBug(), getBugById(), getBugs(), getBugStats(), updateBug() (+11 more)

### Community 40 - "Channel"
Cohesion: 0.33
Nodes (6): CreateChannelModal(), Props, Props, Props, Channel, MuteTarget

### Community 41 - "api/src/types/index.ts"
Cohesion: 0.16
Nodes (18): DEFAULT_PASSWORD_HASH, prisma, DeveloperRole, DiscordEmbed, DiscordEmbedField, MuteDuration, MuteTarget, ProjectStats (+10 more)

### Community 42 - "roles.ts"
Cohesion: 0.14
Nodes (17): AuthModal(), DEMO_USERS, Props, CreateTaskModal(), InviteMemberModal(), Props, Sidebar(), formatActivityAction() (+9 more)

### Community 43 - "page.tsx"
Cohesion: 0.17
Nodes (23): BugTracker(), Props, SEVERITY_INFO, STATUS_BADGES, SafetyModalProps, CommandPalette(), PaletteItem, Props (+15 more)

### Community 44 - "KanbanBoard.tsx"
Cohesion: 0.29
Nodes (9): Props, COLUMN_WIP_LIMITS, COLUMNS, getDueDateBadge(), KanbanBoard(), PRIORITY_STYLES, Props, TaskPriority (+1 more)

### Community 46 - "🚀 Slackers — Ubuntu VPS Docker Deployment Guide"
Cohesion: 0.08
Nodes (24): 1. Point DNS A-Record, 1. PostgreSQL Backup, 2. MongoDB Audit Log Backup, 2. Run the SSL Automation Script, 3. Automatic SSL Renewal, 3. MinIO File Attachments Backup, 💾 Backup & Restore Procedures, Can I run this behind Cloudflare? (+16 more)

### Community 47 - "api/package.json"
Cohesion: 0.09
Nodes (22): description, @types/node, typescript, main, name, private, version, @aws-sdk/client-s3 (+14 more)

### Community 48 - "notificationController.ts"
Cohesion: 0.61
Nodes (7): deleteNotification(), getMuteTargets(), getNotifications(), markAllAsRead(), markAsRead(), muteTarget(), unmuteTarget()

### Community 50 - "taskCommentController.ts"
Cohesion: 0.29
Nodes (6): CreateCommentSchema, createTaskComment(), deleteTaskComment(), getTaskComments(), ApiResponse, zod

### Community 51 - "lucide-react"
Cohesion: 0.33
Nodes (5): NotificationCenter(), Props, Notification, NotificationType, lucide-react

### Community 52 - "socket.ts"
Cohesion: 0.40
Nodes (5): authStorage, connectSocket(), disconnectSocket(), setupVisibilityHandler(), socket.io-client

### Community 53 - "UserRole"
Cohesion: 0.60
Nodes (4): ProjectProgressBar(), Props, ProjectStats, UserRole

## Knowledge Gaps
- **242 isolated node(s):** `entrypoint.sh script`, `name`, `version`, `private`, `description` (+237 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 307 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dataStore` connect `dataStore` to `messageController.ts`, `authMiddleware.ts`, `mongoLogger.ts`, `socketService.ts`, `dmController.ts`, `bugController.ts`, `.constructor`, `api/src/types/index.ts`, `Webhook`, `webhookService.ts`, `KeyVaultData`, `test-pentest-remediations.ts`, `AutomationRule`, `User`, `src/index.ts`, `WebhookLog`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `express` connect `authMiddleware.ts` to `memberController.ts`, `messageController.ts`, `projectController.ts`, `sessionController.ts`, `mongoLogger.ts`, `dmController.ts`, `bugController.ts`, `api/package.json`, `test-pentest-remediations.ts`, `notificationController.ts`, `taskCommentController.ts`, `authController.ts`, `src/index.ts`, `taskController.ts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `memberController.ts`, `dataStore`, `authMiddleware.ts`, `messageController.ts`, `socketService.ts`, `bugController.ts`, `dmController.ts`, `api/src/types/index.ts`, `test-pentest-remediations.ts`, `authController.ts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `entrypoint.sh script`, `name`, `version` to the rest of the system?**
  _242 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `web/src/types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `dataStore` be split into smaller, more focused modules?**
  _Cohesion score 0.10114942528735632 - nodes in this community are weakly interconnected._
- **Should `web/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.044326241134751775 - nodes in this community are weakly interconnected._