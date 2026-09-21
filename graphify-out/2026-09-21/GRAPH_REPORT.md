# Graph Report - slackers  (2026-09-21)

## Corpus Check
- 112 files · ~99,707 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: (none) 5, .example 4, .conf 3)

## Summary
- 948 nodes · 2309 edges · 74 communities (48 shown, 24 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 94 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a05d2398`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- web/src/types/index.ts
- dataStore
- src/index.ts
- Hybrid Production Deployment Guide: Docker Databases + PM2 Apps
- Webhook
- web/package.json
- dmController.ts
- compilerOptions
- E2EEService
- compilerOptions
- setup-vps-hybrid.sh
- package.json
- notificationService
- eslint.config.mjs
- postcss.config.mjs
- redisService
- update-hybrid.sh
- 🚀 Slackers
- web/README.md
- rules/graphify.md
- workflows/graphify.md
- AGENTS.md
- dependencies
- devDependencies
- test-pentest-remediations.ts
- scripts
- User
- authMiddleware.ts
- socketService.ts
- authController.ts
- taskController.ts
- memberController.ts
- ChatArea.tsx
- sessionService
- fileService
- projectController.ts
- messageController.ts
- bugController.ts
- notificationController.ts
- User
- api/src/types/index.ts
- BugTracker.tsx
- page.tsx
- s3Service
- memberService
- 🚀 Slackers — Ubuntu VPS Docker Deployment Guide
- api/package.json
- KanbanBoard.tsx
- dataStore.ts
- automationService.ts
- 🛠 Manual Step-by-Step Installation (Alternative)
- devDependencies
- ThemeContext.tsx
- init-ssl.sh
- entrypoint.sh
- deploy.sh
- setup-ssl.sh
- webhookService.ts
- dependencies
- setup-vps-native.sh
- update-native.sh
- scripts
- layout.tsx
- optionalDependencies
- projectService
- Message
- authService
- taskCommentService
- Sidebar.tsx
- automationService
- WebhookLog
- test-project-members.ts

## God Nodes (most connected - your core abstractions)
1. `dataStore` - 72 edges
2. `User` - 64 edges
3. `User` - 34 edges
4. `express` - 32 edges
5. `socketService` - 30 edges
6. `taskService` - 27 edges
7. `E2EEService` - 27 edges
8. `mongoLogger` - 26 edges
9. `redisService` - 23 edges
10. `Task` - 22 edges

## Surprising Connections (you probably didn't know these)
- `runVerification()` --calls--> `webhookIngestRateLimiter`  [EXTRACTED]
  scratch/test-pentest-remediations.ts → apps/api/src/middleware/rateLimiter.ts
- `runVerification()` --calls--> `getChannels()`  [EXTRACTED]
  scratch/test-pentest-remediations.ts → apps/api/src/controllers/channelController.ts
- `runVerification()` --calls--> `getChannelById()`  [EXTRACTED]
  scratch/test-pentest-remediations.ts → apps/api/src/controllers/channelController.ts
- `runVerification()` --calls--> `getMessagesByChannel()`  [EXTRACTED]
  scratch/test-pentest-remediations.ts → apps/api/src/controllers/messageController.ts
- `runVerification()` --calls--> `createMessage()`  [EXTRACTED]
  scratch/test-pentest-remediations.ts → apps/api/src/controllers/messageController.ts

## Import Cycles
- None detected.

## Communities (74 total, 24 thin omitted)

### Community 0 - "web/src/types/index.ts"
Cohesion: 0.10
Nodes (32): Props, AVATAR_PRESETS, Props, SettingsTab, PRIORITY_LABELS, STATUS_LABELS, api, channelKeyCache (+24 more)

### Community 1 - "dataStore"
Cohesion: 0.09
Nodes (6): dataStore, generateSeedKeyVault(), AutomationRule, Channel, ChannelKey, KeyVaultData

### Community 2 - "src/index.ts"
Cohesion: 0.13
Nodes (14): app, avatarsDir, httpServer, uploadsDir, errorHandler(), router, router, router (+6 more)

### Community 3 - "Hybrid Production Deployment Guide: Docker Databases + PM2 Apps"
Cohesion: 0.14
Nodes (13): 1. Quick Start (1-Click Deployment), 2. Enabling HTTPS / SSL (Free Let's Encrypt), 3. Daily Operations & Management, 4. Deploying Updates (Zero-Downtime), 5. Database Backups, Hybrid Production Deployment Guide: Docker Databases + PM2 Apps, Managing Application Processes (PM2), Managing Containerized Databases (Docker) (+5 more)

### Community 4 - "Webhook"
Cohesion: 0.23
Nodes (4): encryptChannelMessageNode(), webhookService, IncomingWebhookPayload, Webhook

### Community 5 - "web/package.json"
Cohesion: 0.12
Nodes (15): @types/node, typescript, name, private, version, eslint, eslint-config-next, react-dom (+7 more)

### Community 6 - "dmController.ts"
Cohesion: 0.08
Nodes (18): deleteDirectMessage(), editDirectMessage(), getConversation(), getKeyVault(), getPublicKey(), getRecentConversations(), getUnreadCounts(), KeyVaultSchema (+10 more)

### Community 7 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 8 - "E2EEService"
Cohesion: 0.20
Nodes (5): Home(), SettingsModal(), arrayBufferToBase64(), base64ToArrayBuffer(), E2EEService

### Community 9 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, outDir, resolveJsonModule (+6 more)

### Community 11 - "package.json"
Cohesion: 0.13
Nodes (14): devDependencies, concurrently, name, private, scripts, build, clean, dev (+6 more)

### Community 12 - "notificationService"
Cohesion: 0.16
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

### Community 25 - "test-pentest-remediations.ts"
Cohesion: 0.32
Nodes (13): createChannel(), CreateChannelSchema, getChannelById(), getChannelKey(), getChannels(), saveChannelKey(), SaveChannelKeySchema, createMessage() (+5 more)

### Community 26 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, db:seed, dev, prisma:generate, prisma:push, start

### Community 27 - "User"
Cohesion: 0.30
Nodes (4): taskService, Task, TaskStatus, User

### Community 28 - "authMiddleware.ts"
Cohesion: 0.15
Nodes (15): downloadEncryptedFile(), uploadEncryptedFile(), getSessions(), revokeOtherSessions(), UserSessionResponse, AuthRequest, requireRole(), authRateLimiter (+7 more)

### Community 29 - "socketService.ts"
Cohesion: 0.22
Nodes (9): AVATAR_PRESETS, RedisHealth, UserSession, AuthenticatedSocket, bcryptjs, ioredis, jsonwebtoken, socket.io (+1 more)

### Community 30 - "authController.ts"
Cohesion: 0.30
Nodes (10): getMe(), login(), LoginSchema, logout(), register(), updateProfile(), UpdateProfileSchema, uploadAvatar() (+2 more)

### Community 31 - "taskController.ts"
Cohesion: 0.16
Nodes (24): CreateCommentSchema, createTaskComment(), deleteTaskComment(), getTaskComments(), addQAStep(), AddQAStepSchema, addSubtask(), AddSubtaskSchema (+16 more)

### Community 32 - "memberController.ts"
Cohesion: 0.33
Nodes (11): acceptInvitation(), AcceptInviteSchema, addMember(), AddMemberSchema, createInvitation(), CreateInviteSchema, getInvitations(), revokeInvitation() (+3 more)

### Community 33 - "ChatArea.tsx"
Cohesion: 0.16
Nodes (20): ChatArea(), ChatDateDivider(), EncryptedAttachmentCard(), extractPlainText(), highlightMatches(), RenderDecryptedContent(), TaskAttachmentCard(), COMMON_REACTIONS (+12 more)

### Community 36 - "projectController.ts"
Cohesion: 0.35
Nodes (11): createProject(), CreateProjectSchema, deleteProject(), getProjectById(), getProjects(), getProjectStats(), updateProject(), UpdateProjectSchema (+3 more)

### Community 37 - "messageController.ts"
Cohesion: 0.33
Nodes (11): CreateMessageSchema, deleteMessage(), editMessage(), getThreadReplies(), toggleReaction(), revokeSession(), messagingRateLimiter, router (+3 more)

### Community 38 - "bugController.ts"
Cohesion: 0.33
Nodes (11): convertBugToTask(), createBug(), CreateBugSchema, deleteBug(), getBugById(), getBugs(), getBugStats(), updateBug() (+3 more)

### Community 39 - "notificationController.ts"
Cohesion: 0.61
Nodes (7): deleteNotification(), getMuteTargets(), getNotifications(), markAllAsRead(), markAsRead(), muteTarget(), unmuteTarget()

### Community 40 - "User"
Cohesion: 0.13
Nodes (22): AuthModal(), Props, SafetyModalProps, CommandPalette(), PaletteItem, Props, CreateChannelModal(), Props (+14 more)

### Community 41 - "api/src/types/index.ts"
Cohesion: 0.12
Nodes (15): BugEnvironment, BugStats, DeveloperRole, DiscordEmbed, DiscordEmbedField, MuteDuration, MuteTarget, QAReviewStep (+7 more)

### Community 42 - "BugTracker.tsx"
Cohesion: 0.24
Nodes (10): BugTracker(), Props, SEVERITY_INFO, STATUS_BADGES, ProjectProgressBar(), Props, Bug, BugStatus (+2 more)

### Community 43 - "page.tsx"
Cohesion: 0.18
Nodes (15): CreateTaskModal(), NotificationCenter(), Props, ReportBugModal(), formatActivityAction(), getDueDateStatus(), TaskDetailModal(), authStorage (+7 more)

### Community 45 - "memberService"
Cohesion: 0.24
Nodes (3): memberService, Invitation, UserRole

### Community 46 - "🚀 Slackers — Ubuntu VPS Docker Deployment Guide"
Cohesion: 0.08
Nodes (24): 1. Point DNS A-Record, 1. PostgreSQL Backup, 2. MongoDB Audit Log Backup, 2. Run the SSL Automation Script, 3. Automatic SSL Renewal, 3. MinIO File Attachments Backup, 💾 Backup & Restore Procedures, Can I run this behind Cloudflare? (+16 more)

### Community 47 - "api/package.json"
Cohesion: 0.11
Nodes (18): description, @types/node, typescript, main, name, private, version, cors (+10 more)

### Community 48 - "KanbanBoard.tsx"
Cohesion: 0.18
Nodes (14): Props, COLUMN_WIP_LIMITS, COLUMNS, getDueDateBadge(), KanbanBoard(), PRIORITY_STYLES, Props, Sidebar() (+6 more)

### Community 49 - "dataStore.ts"
Cohesion: 0.15
Nodes (11): DEFAULT_PASSWORD_HASH, checkPostgresHealth(), prisma, EncryptedFileRecord, mongoLogger, S3Health, ActivityLog, ProjectStats (+3 more)

### Community 50 - "automationService.ts"
Cohesion: 0.33
Nodes (4): SmartReferenceResult, bugService, Bug, BugSeverity

### Community 51 - "🛠 Manual Step-by-Step Installation (Alternative)"
Cohesion: 0.08
Nodes (23): 1. Point Your Domain DNS A-Record, 2. Issue Certificate with Certbot, 3. Update Application URL, 📊 Daily Maintenance & PM2 Commands, 🔒 Enable Free HTTPS (Let's Encrypt SSL), Managing Processes, 🛠 Manual Step-by-Step Installation (Alternative), MongoDB (+15 more)

### Community 52 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 53 - "ThemeContext.tsx"
Cohesion: 0.32
Nodes (6): Props, ThemeToggle(), Theme, ThemeContext, ThemeContextType, useTheme()

### Community 58 - "webhookService.ts"
Cohesion: 0.27
Nodes (8): webhookController, channelKeyCache, decryptChannelMessageNode(), deriveChannelKeyNode(), generateWebhookSecret(), generateWebhookToken(), verifyHmacSha256(), WebhookType

### Community 59 - "dependencies"
Cohesion: 0.33
Nodes (6): dependencies, lucide-react, next, react, react-dom, socket.io-client

### Community 63 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 64 - "layout.tsx"
Cohesion: 0.29
Nodes (4): nextConfig, metadata, ThemeProvider(), next

### Community 65 - "optionalDependencies"
Cohesion: 0.67
Nodes (3): optionalDependencies, @tailwindcss/oxide-linux-arm64-gnu, @tailwindcss/oxide-linux-x64-gnu

### Community 70 - "Sidebar.tsx"
Cohesion: 0.43
Nodes (7): Props, Props, Props, Channel, DirectMessage, Message, MuteTarget

## Knowledge Gaps
- **276 isolated node(s):** `entrypoint.sh script`, `name`, `version`, `private`, `description` (+271 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 349 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dataStore` connect `dataStore` to `src/index.ts`, `Message`, `Webhook`, `messageController.ts`, `dmController.ts`, `WebhookLog`, `test-project-members.ts`, `dataStore.ts`, `automationService.ts`, `test-pentest-remediations.ts`, `webhookService.ts`, `User`, `authMiddleware.ts`, `socketService.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `express` connect `authMiddleware.ts` to `memberController.ts`, `src/index.ts`, `projectController.ts`, `messageController.ts`, `bugController.ts`, `dmController.ts`, `notificationController.ts`, `api/package.json`, `dataStore.ts`, `test-pentest-remediations.ts`, `webhookService.ts`, `authController.ts`, `taskController.ts`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `memberController.ts`, `dataStore`, `projectService`, `projectController.ts`, `authService`, `dmController.ts`, `taskCommentService`, `messageController.ts`, `api/src/types/index.ts`, `test-project-members.ts`, `memberService`, `dataStore.ts`, `automationService.ts`, `test-pentest-remediations.ts`, `authMiddleware.ts`, `socketService.ts`, `authController.ts`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `entrypoint.sh script`, `name`, `version` to the rest of the system?**
  _276 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `web/src/types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10121951219512196 - nodes in this community are weakly interconnected._
- **Should `dataStore` be split into smaller, more focused modules?**
  _Cohesion score 0.0855614973262032 - nodes in this community are weakly interconnected._
- **Should `src/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._