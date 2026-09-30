# Graph Report - slackers  (2026-09-30)

## Corpus Check
- 120 files · ~107,122 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: (none) 5, .example 4, .conf 3)

## Summary
- 989 nodes · 2440 edges · 76 communities (52 shown, 22 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 94 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2a09ce75`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- web/src/types/index.ts
- dataStore
- User
- Hybrid Production Deployment Guide: Docker Databases + PM2 Apps
- Webhook
- web/package.json
- dmController.ts
- compilerOptions
- E2EEService
- compilerOptions
- setup-vps-hybrid.sh
- package.json
- socketService.ts
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
- channelController.ts
- scripts
- api/src/types/index.ts
- src/index.ts
- authService
- authController.ts
- taskController.ts
- memberController.ts
- ChatArea.tsx
- BugTracker.tsx
- dataStore.ts
- projectController.ts
- projectService
- automationService.ts
- redisService.ts
- Project
- webhookController.ts
- User
- roles.ts
- Message
- socketService
- 🚀 Slackers — Ubuntu VPS Docker Deployment Guide
- api/package.json
- react
- s3Service
- useVoiceChat.ts
- 🛠 Manual Step-by-Step Installation (Alternative)
- devDependencies
- ThemeContext.tsx
- init-ssl.sh
- entrypoint.sh
- deploy.sh
- setup-ssl.sh
- automationService
- dependencies
- setup-vps-native.sh
- update-native.sh
- scripts
- layout.tsx
- optionalDependencies
- test-pentest-remediations.ts
- WebhookLog
- authMiddleware.ts
- bugController.ts
- memberService
- page.tsx
- notificationController.ts
- resetDatabase.ts
- Channel
- fileService

## God Nodes (most connected - your core abstractions)
1. `dataStore` - 72 edges
2. `User` - 68 edges
3. `User` - 42 edges
4. `socketService` - 37 edges
5. `express` - 32 edges
6. `react` - 28 edges
7. `taskService` - 27 edges
8. `E2EEService` - 27 edges
9. `mongoLogger` - 26 edges
10. `lucide-react` - 26 edges

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

## Communities (76 total, 22 thin omitted)

### Community 0 - "web/src/types/index.ts"
Cohesion: 0.11
Nodes (31): Props, AVATAR_PRESETS, Props, SettingsTab, PRIORITY_LABELS, STATUS_LABELS, api, channelKeyCache (+23 more)

### Community 1 - "dataStore"
Cohesion: 0.10
Nodes (5): dataStore, generateSeedKeyVault(), AutomationRule, ChannelKey, KeyVaultData

### Community 2 - "User"
Cohesion: 0.30
Nodes (4): taskService, Task, TaskStatus, User

### Community 3 - "Hybrid Production Deployment Guide: Docker Databases + PM2 Apps"
Cohesion: 0.14
Nodes (13): 1. Quick Start (1-Click Deployment), 2. Enabling HTTPS / SSL (Free Let's Encrypt), 3. Daily Operations & Management, 4. Deploying Updates (Zero-Downtime), 5. Database Backups, Hybrid Production Deployment Guide: Docker Databases + PM2 Apps, Managing Application Processes (PM2), Managing Containerized Databases (Docker) (+5 more)

### Community 4 - "Webhook"
Cohesion: 0.23
Nodes (4): encryptChannelMessageNode(), webhookService, IncomingWebhookPayload, Webhook

### Community 5 - "web/package.json"
Cohesion: 0.13
Nodes (14): @types/node, typescript, name, private, version, eslint, eslint-config-next, react-dom (+6 more)

### Community 6 - "dmController.ts"
Cohesion: 0.11
Nodes (18): deleteDirectMessage(), editDirectMessage(), getConversation(), getKeyVault(), getPublicKey(), getRecentConversations(), getUnreadCounts(), KeyVaultSchema (+10 more)

### Community 7 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 8 - "E2EEService"
Cohesion: 0.19
Nodes (6): Home(), SettingsModal(), arrayBufferToBase64(), base64ToArrayBuffer(), E2EEService, KeyVaultData

### Community 9 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, outDir, resolveJsonModule (+6 more)

### Community 11 - "package.json"
Cohesion: 0.13
Nodes (14): devDependencies, concurrently, name, private, scripts, build, clean, dev (+6 more)

### Community 12 - "socketService.ts"
Cohesion: 0.13
Nodes (7): CreateMessageSchema, AVATAR_PRESETS, notificationService, AuthenticatedSocket, Notification, NotificationType, bcryptjs

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

### Community 25 - "channelController.ts"
Cohesion: 0.47
Nodes (8): createChannel(), CreateChannelSchema, getChannelById(), getChannelKey(), getChannels(), saveChannelKey(), SaveChannelKeySchema, router

### Community 26 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, db:reset, db:seed, dev, prisma:generate, prisma:push, start

### Community 27 - "api/src/types/index.ts"
Cohesion: 0.12
Nodes (19): BugEnvironment, DeveloperRole, DiscordEmbed, DiscordEmbedField, DmCallStatus, MuteDuration, MuteTarget, ProjectStats (+11 more)

### Community 28 - "src/index.ts"
Cohesion: 0.14
Nodes (14): app, avatarsDir, httpServer, uploadsDir, requireRole(), errorHandler(), router, router (+6 more)

### Community 30 - "authController.ts"
Cohesion: 0.27
Nodes (11): getMe(), login(), LoginSchema, logout(), register(), updateProfile(), UpdateProfileSchema, uploadAvatar() (+3 more)

### Community 31 - "taskController.ts"
Cohesion: 0.11
Nodes (27): CreateCommentSchema, createTaskComment(), deleteTaskComment(), getTaskComments(), addQAStep(), AddQAStepSchema, addSubtask(), AddSubtaskSchema (+19 more)

### Community 32 - "memberController.ts"
Cohesion: 0.33
Nodes (11): acceptInvitation(), AcceptInviteSchema, addMember(), AddMemberSchema, createInvitation(), CreateInviteSchema, getInvitations(), revokeInvitation() (+3 more)

### Community 33 - "ChatArea.tsx"
Cohesion: 0.13
Nodes (24): ChatArea(), ChatDateDivider(), EncryptedAttachmentCard(), extractPlainText(), highlightMatches(), Props, RenderDecryptedContent(), SafetyModalProps (+16 more)

### Community 34 - "BugTracker.tsx"
Cohesion: 0.21
Nodes (12): BugTracker(), Props, SEVERITY_INFO, STATUS_BADGES, ProjectProgressBar(), Props, ProjectSearchDropdown(), ProjectSearchDropdownProps (+4 more)

### Community 35 - "dataStore.ts"
Cohesion: 0.19
Nodes (7): DEFAULT_PASSWORD_HASH, checkPostgresHealth(), prisma, EncryptedFileRecord, mongoLogger, ActivityLog, runTest()

### Community 36 - "projectController.ts"
Cohesion: 0.53
Nodes (8): createProject(), CreateProjectSchema, deleteProject(), getProjectById(), getProjects(), getProjectStats(), updateProject(), UpdateProjectSchema

### Community 37 - "projectService"
Cohesion: 0.14
Nodes (11): deleteMessage(), editMessage(), toggleReaction(), revokeSession(), projectService, parseDeviceName(), sessionService, Project (+3 more)

### Community 38 - "automationService.ts"
Cohesion: 0.27
Nodes (5): SmartReferenceResult, bugService, Bug, BugSeverity, BugStats

### Community 39 - "redisService.ts"
Cohesion: 0.29
Nodes (5): RedisHealth, S3Health, @aws-sdk/client-s3, dotenv, ioredis

### Community 40 - "Project"
Cohesion: 0.20
Nodes (15): CommandPalette(), PaletteItem, Props, Props, COLUMN_WIP_LIMITS, COLUMNS, getDueDateBadge(), KanbanBoard() (+7 more)

### Community 41 - "webhookController.ts"
Cohesion: 0.27
Nodes (7): webhookController, channelKeyCache, decryptChannelMessageNode(), deriveChannelKeyNode(), generateWebhookSecret(), generateWebhookToken(), verifyHmacSha256()

### Community 42 - "User"
Cohesion: 0.12
Nodes (18): ActiveDmCallModal(), ActiveDmCallModalProps, formatDuration(), AuthModal(), Props, CreateProjectModal(), Props, IncomingCallModal() (+10 more)

### Community 43 - "roles.ts"
Cohesion: 0.19
Nodes (12): CreateTaskModal(), Props, ReportBugModal(), formatActivityAction(), getDueDateStatus(), TaskDetailModal(), formatUserRole(), ROLE_BADGES (+4 more)

### Community 46 - "🚀 Slackers — Ubuntu VPS Docker Deployment Guide"
Cohesion: 0.08
Nodes (24): 1. Point DNS A-Record, 1. PostgreSQL Backup, 2. MongoDB Audit Log Backup, 2. Run the SSL Automation Script, 3. Automatic SSL Renewal, 3. MinIO File Attachments Backup, 💾 Backup & Restore Procedures, Can I run this behind Cloudflare? (+16 more)

### Community 47 - "api/package.json"
Cohesion: 0.10
Nodes (20): description, @types/node, typescript, main, name, private, version, cors (+12 more)

### Community 48 - "react"
Cohesion: 0.25
Nodes (13): CreateChannelModal(), Props, GroupVoiceStageModal(), GroupVoiceStageModalProps, Props, Sidebar(), VoiceControlsBar(), VoiceControlsBarProps (+5 more)

### Community 50 - "useVoiceChat.ts"
Cohesion: 0.53
Nodes (8): ICE_SERVERS, useVoiceChat(), getAudioContext(), playJoinSound(), playLeaveSound(), playMuteSound(), startRingSound(), stopRingSound()

### Community 51 - "🛠 Manual Step-by-Step Installation (Alternative)"
Cohesion: 0.08
Nodes (23): 1. Point Your Domain DNS A-Record, 2. Issue Certificate with Certbot, 3. Update Application URL, 📊 Daily Maintenance & PM2 Commands, 🔒 Enable Free HTTPS (Let's Encrypt SSL), Managing Processes, 🛠 Manual Step-by-Step Installation (Alternative), MongoDB (+15 more)

### Community 52 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 53 - "ThemeContext.tsx"
Cohesion: 0.32
Nodes (6): Props, ThemeToggle(), Theme, ThemeContext, ThemeContextType, useTheme()

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

### Community 66 - "test-pentest-remediations.ts"
Cohesion: 0.21
Nodes (13): createMessage(), getMessagesByChannel(), getThreadReplies(), authenticate(), authRateLimiter, memoryRateLimits, messagingRateLimiter, RateLimiterOptions (+5 more)

### Community 68 - "authMiddleware.ts"
Cohesion: 0.25
Nodes (10): downloadEncryptedFile(), uploadEncryptedFile(), getSessions(), revokeOtherSessions(), UserSessionResponse, AuthRequest, router, UserSession (+2 more)

### Community 69 - "bugController.ts"
Cohesion: 0.33
Nodes (11): convertBugToTask(), createBug(), CreateBugSchema, deleteBug(), getBugById(), getBugs(), getBugStats(), updateBug() (+3 more)

### Community 70 - "memberService"
Cohesion: 0.27
Nodes (3): memberService, Invitation, UserRole

### Community 71 - "page.tsx"
Cohesion: 0.29
Nodes (9): NotificationCenter(), ThreadPanel(), authStorage, connectSocket(), disconnectSocket(), getSocket(), getSocketUrl(), setupVisibilityHandler() (+1 more)

### Community 72 - "notificationController.ts"
Cohesion: 0.51
Nodes (8): deleteNotification(), getMuteTargets(), getNotifications(), markAllAsRead(), markAsRead(), muteTarget(), unmuteTarget(), router

### Community 73 - "resetDatabase.ts"
Cohesion: 0.50
Nodes (4): generateKeyVault(), KeyVaultData, main(), mongodb

## Knowledge Gaps
- **280 isolated node(s):** `entrypoint.sh script`, `name`, `version`, `private`, `description` (+275 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 352 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dataStore` connect `dataStore` to `User`, `dataStore.ts`, `authMiddleware.ts`, `WebhookLog`, `dmController.ts`, `automationService.ts`, `Webhook`, `webhookController.ts`, `Channel`, `test-pentest-remediations.ts`, `socketService.ts`, `Message`, `projectService`, `channelController.ts`, `api/src/types/index.ts`, `src/index.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `memberController.ts`, `dataStore`, `test-pentest-remediations.ts`, `dataStore.ts`, `authMiddleware.ts`, `projectService`, `automationService.ts`, `dmController.ts`, `memberService`, `socketService.ts`, `Message`, `socketService`, `api/src/types/index.ts`, `authService`, `authController.ts`, `taskController.ts`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `express` connect `authMiddleware.ts` to `memberController.ts`, `test-pentest-remediations.ts`, `dataStore.ts`, `projectController.ts`, `bugController.ts`, `dmController.ts`, `notificationController.ts`, `webhookController.ts`, `socketService.ts`, `api/package.json`, `channelController.ts`, `src/index.ts`, `authController.ts`, `taskController.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `entrypoint.sh script`, `name`, `version` to the rest of the system?**
  _280 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `web/src/types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10512820512820513 - nodes in this community are weakly interconnected._
- **Should `dataStore` be split into smaller, more focused modules?**
  _Cohesion score 0.09788359788359788 - nodes in this community are weakly interconnected._
- **Should `Hybrid Production Deployment Guide: Docker Databases + PM2 Apps` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._