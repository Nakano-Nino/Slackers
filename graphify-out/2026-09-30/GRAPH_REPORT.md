# Graph Report - slackers  (2026-09-30)

## Corpus Check
- 138 files · ~113,794 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: (none) 5, .example 4, .conf 3)

## Summary
- 1092 nodes · 2702 edges · 79 communities (53 shown, 24 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 119 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `69b608e0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- web/src/types/index.ts
- dataStore
- User
- Hybrid Production Deployment Guide: Docker Databases + PM2 Apps
- Webhook
- web/package.json
- socketService
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
- channelController.ts
- scripts
- api/src/types/index.ts
- src/index.ts
- writeJSON
- authController.ts
- taskController.ts
- memberController.ts
- ChatArea.tsx
- Project
- dataStore.ts
- projectController.ts
- sessionService
- bugService.ts
- sessionController.ts
- KanbanBoard.tsx
- models.go
- User
- roles.ts
- github.com/Nakano-Nino/slackers-api-go
- memberService
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
- messageController.ts
- page.tsx
- authMiddleware.ts
- Message
- projectService
- bugController.ts
- authService
- redisService.ts
- mongoLogger
- ApiResponse
- webhookCryptoService.ts
- Channel
- WebhookLog

## God Nodes (most connected - your core abstractions)
1. `dataStore` - 72 edges
2. `User` - 68 edges
3. `User` - 42 edges
4. `socketService` - 37 edges
5. `express` - 32 edges
6. `writeJSON()` - 31 edges
7. `react` - 28 edges
8. `taskService` - 27 edges
9. `E2EEService` - 27 edges
10. `mongoLogger` - 26 edges

## Surprising Connections (you probably didn't know these)
- `runVerification()` --calls--> `getChannels()`  [EXTRACTED]
  scratch/test-pentest-remediations.ts → apps/api/src/controllers/channelController.ts
- `runVerification()` --calls--> `getChannelById()`  [EXTRACTED]
  scratch/test-pentest-remediations.ts → apps/api/src/controllers/channelController.ts
- `runRound2Verification()` --calls--> `revokeSession()`  [EXTRACTED]
  scratch/test-pentest-round2.ts → apps/api/src/controllers/sessionController.ts
- `runVerification()` --calls--> `getMessagesByChannel()`  [EXTRACTED]
  scratch/test-pentest-remediations.ts → apps/api/src/controllers/messageController.ts
- `runVerification()` --calls--> `createMessage()`  [EXTRACTED]
  scratch/test-pentest-remediations.ts → apps/api/src/controllers/messageController.ts

## Import Cycles
- None detected.

## Communities (79 total, 24 thin omitted)

### Community 0 - "web/src/types/index.ts"
Cohesion: 0.11
Nodes (31): Props, AVATAR_PRESETS, Props, SettingsTab, PRIORITY_LABELS, STATUS_LABELS, api, channelKeyCache (+23 more)

### Community 1 - "dataStore"
Cohesion: 0.10
Nodes (5): dataStore, generateSeedKeyVault(), AutomationRule, ChannelKey, KeyVaultData

### Community 2 - "User"
Cohesion: 0.28
Nodes (5): AuthenticatedSocket, taskService, Task, TaskStatus, User

### Community 3 - "Hybrid Production Deployment Guide: Docker Databases + PM2 Apps"
Cohesion: 0.14
Nodes (13): 1. Quick Start (1-Click Deployment), 2. Enabling HTTPS / SSL (Free Let's Encrypt), 3. Daily Operations & Management, 4. Deploying Updates (Zero-Downtime), 5. Database Backups, Hybrid Production Deployment Guide: Docker Databases + PM2 Apps, Managing Application Processes (PM2), Managing Containerized Databases (Docker) (+5 more)

### Community 4 - "Webhook"
Cohesion: 0.23
Nodes (4): encryptChannelMessageNode(), webhookService, IncomingWebhookPayload, Webhook

### Community 5 - "web/package.json"
Cohesion: 0.13
Nodes (14): @types/node, typescript, name, private, version, eslint, eslint-config-next, react-dom (+6 more)

### Community 6 - "socketService"
Cohesion: 0.07
Nodes (19): deleteDirectMessage(), editDirectMessage(), getConversation(), getKeyVault(), getPublicKey(), getRecentConversations(), getUnreadCounts(), KeyVaultSchema (+11 more)

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

### Community 25 - "channelController.ts"
Cohesion: 0.56
Nodes (7): createChannel(), CreateChannelSchema, getChannelById(), getChannelKey(), getChannels(), saveChannelKey(), SaveChannelKeySchema

### Community 26 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, db:reset, db:seed, dev, prisma:generate, prisma:push, start

### Community 27 - "api/src/types/index.ts"
Cohesion: 0.12
Nodes (16): AutomationTrigger, DeveloperRole, DiscordEmbed, DiscordEmbedField, DmCallStatus, MuteDuration, MuteTarget, NotificationType (+8 more)

### Community 28 - "src/index.ts"
Cohesion: 0.13
Nodes (15): app, avatarsDir, httpServer, uploadsDir, errorHandler(), router, router, router (+7 more)

### Community 29 - "writeJSON"
Cohesion: 0.06
Nodes (39): main(), GenerateToken(), Claims, VerifyToken(), ComparePassword(), Config, Load(), Connect() (+31 more)

### Community 30 - "authController.ts"
Cohesion: 0.30
Nodes (10): getMe(), login(), LoginSchema, logout(), register(), updateProfile(), UpdateProfileSchema, uploadAvatar() (+2 more)

### Community 31 - "taskController.ts"
Cohesion: 0.12
Nodes (26): CreateCommentSchema, createTaskComment(), deleteTaskComment(), getTaskComments(), addQAStep(), AddQAStepSchema, addSubtask(), AddSubtaskSchema (+18 more)

### Community 32 - "memberController.ts"
Cohesion: 0.27
Nodes (13): acceptInvitation(), AcceptInviteSchema, addMember(), AddMemberSchema, createInvitation(), CreateInviteSchema, getInvitations(), revokeInvitation() (+5 more)

### Community 33 - "ChatArea.tsx"
Cohesion: 0.12
Nodes (24): ChatArea(), ChatDateDivider(), EncryptedAttachmentCard(), extractPlainText(), highlightMatches(), Props, RenderDecryptedContent(), SafetyModalProps (+16 more)

### Community 34 - "Project"
Cohesion: 0.16
Nodes (18): BugTracker(), Props, SEVERITY_INFO, STATUS_BADGES, CommandPalette(), PaletteItem, Props, ProjectProgressBar() (+10 more)

### Community 35 - "dataStore.ts"
Cohesion: 0.18
Nodes (13): generateKeyVault(), KeyVaultData, main(), DEFAULT_PASSWORD_HASH, checkPostgresHealth(), prisma, AVATAR_PRESETS, UserSession (+5 more)

### Community 36 - "projectController.ts"
Cohesion: 0.53
Nodes (8): createProject(), CreateProjectSchema, deleteProject(), getProjectById(), getProjects(), getProjectStats(), updateProject(), UpdateProjectSchema

### Community 38 - "bugService.ts"
Cohesion: 0.18
Nodes (9): SmartReferenceResult, bugService, Bug, BugEnvironment, BugSeverity, BugStats, BugStatus, assert() (+1 more)

### Community 39 - "sessionController.ts"
Cohesion: 0.43
Nodes (6): getSessions(), revokeOtherSessions(), revokeSession(), UserSessionResponse, AuthRequest, router

### Community 40 - "KanbanBoard.tsx"
Cohesion: 0.29
Nodes (9): Props, COLUMN_WIP_LIMITS, COLUMNS, getDueDateBadge(), KanbanBoard(), PRIORITY_STYLES, Props, TaskPriority (+1 more)

### Community 41 - "models.go"
Cohesion: 0.23
Nodes (15): User, encoding/json.RawMessage, time.Time, Bug, Channel, DirectMessage, LoginRequest, LoginResponse (+7 more)

### Community 42 - "User"
Cohesion: 0.12
Nodes (18): ActiveDmCallModal(), ActiveDmCallModalProps, formatDuration(), AuthModal(), Props, CreateProjectModal(), Props, IncomingCallModal() (+10 more)

### Community 43 - "roles.ts"
Cohesion: 0.19
Nodes (12): CreateTaskModal(), Props, ReportBugModal(), formatActivityAction(), getDueDateStatus(), TaskDetailModal(), formatUserRole(), ROLE_BADGES (+4 more)

### Community 45 - "memberService"
Cohesion: 0.24
Nodes (3): memberService, Invitation, UserRole

### Community 46 - "🚀 Slackers — Ubuntu VPS Docker Deployment Guide"
Cohesion: 0.08
Nodes (24): 1. Point DNS A-Record, 1. PostgreSQL Backup, 2. MongoDB Audit Log Backup, 2. Run the SSL Automation Script, 3. Automatic SSL Renewal, 3. MinIO File Attachments Backup, 💾 Backup & Restore Procedures, Can I run this behind Cloudflare? (+16 more)

### Community 47 - "api/package.json"
Cohesion: 0.09
Nodes (21): description, @types/node, typescript, main, name, private, version, cors (+13 more)

### Community 48 - "react"
Cohesion: 0.28
Nodes (12): Props, GroupVoiceStageModal(), GroupVoiceStageModalProps, Props, Sidebar(), VoiceControlsBar(), VoiceControlsBarProps, getUserRoleBadge() (+4 more)

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

### Community 66 - "messageController.ts"
Cohesion: 0.50
Nodes (7): CreateMessageSchema, deleteMessage(), editMessage(), toggleReaction(), assert(), mockResponse(), runRound2Verification()

### Community 67 - "page.tsx"
Cohesion: 0.26
Nodes (10): CreateChannelModal(), NotificationCenter(), ThreadPanel(), authStorage, connectSocket(), disconnectSocket(), getSocket(), getSocketUrl() (+2 more)

### Community 68 - "authMiddleware.ts"
Cohesion: 0.18
Nodes (14): createMessage(), getMessagesByChannel(), getThreadReplies(), webhookController, authenticate(), requireRole(), authRateLimiter, memoryRateLimits (+6 more)

### Community 71 - "bugController.ts"
Cohesion: 0.44
Nodes (9): convertBugToTask(), createBug(), CreateBugSchema, deleteBug(), getBugById(), getBugs(), getBugStats(), updateBug() (+1 more)

### Community 73 - "redisService.ts"
Cohesion: 0.22
Nodes (6): EncryptedFileRecord, RedisHealth, S3Health, @aws-sdk/client-s3, dotenv, ioredis

### Community 75 - "ApiResponse"
Cohesion: 0.22
Nodes (6): downloadEncryptedFile(), uploadEncryptedFile(), messagingRateLimiter, router, fileService, ApiResponse

### Community 76 - "webhookCryptoService.ts"
Cohesion: 0.32
Nodes (6): channelKeyCache, decryptChannelMessageNode(), deriveChannelKeyNode(), generateWebhookSecret(), generateWebhookToken(), verifyHmacSha256()

## Knowledge Gaps
- **286 isolated node(s):** `github.com/Nakano-Nino/slackers-api-go`, `APIResponse`, `contextKey`, `UserRole`, `UserStatus` (+281 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 365 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `memberController.ts`, `dataStore`, `messageController.ts`, `dataStore.ts`, `authMiddleware.ts`, `Message`, `bugService.ts`, `socketService`, `authService`, `projectService`, `memberService`, `api/src/types/index.ts`, `authController.ts`, `taskController.ts`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `express` connect `src/index.ts` to `memberController.ts`, `messageController.ts`, `dataStore.ts`, `projectController.ts`, `authMiddleware.ts`, `socketService`, `bugController.ts`, `sessionController.ts`, `ApiResponse`, `notificationService`, `api/package.json`, `channelController.ts`, `authController.ts`, `taskController.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `dataStore` connect `dataStore` to `messageController.ts`, `dataStore.ts`, `authMiddleware.ts`, `Message`, `socketService`, `bugService.ts`, `Webhook`, `User`, `Channel`, `WebhookLog`, `channelController.ts`, `src/index.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `github.com/Nakano-Nino/slackers-api-go`, `APIResponse`, `contextKey` to the rest of the system?**
  _286 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `web/src/types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10512820512820513 - nodes in this community are weakly interconnected._
- **Should `dataStore` be split into smaller, more focused modules?**
  _Cohesion score 0.09788359788359788 - nodes in this community are weakly interconnected._
- **Should `Hybrid Production Deployment Guide: Docker Databases + PM2 Apps` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._