# Graph Report - slackers  (2026-09-30)

## Corpus Check
- 144 files · ~117,927 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: (none) 5, .example 4, .conf 3)

## Summary
- 1174 nodes · 2882 edges · 73 communities (52 shown, 19 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 120 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ec88e091`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- web/src/types/index.ts
- dataStore
- User
- Hybrid Production Deployment Guide: Docker Databases + PM2 Apps
- webhookService.ts
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
- test-pentest-remediations.ts
- scripts
- api/src/types/index.ts
- src/index.ts
- writeJSON
- authController.ts
- taskController.ts
- memberController.ts
- ChatArea.tsx
- lucide-react
- dataStore.ts
- projectRoutes.ts
- sessionService
- automationService.ts
- sessionController.ts
- KanbanBoard.tsx
- Hub
- roles.ts
- page.tsx
- github.com/Nakano-Nino/slackers-api-go
- socketService.ts
- 🚀 Slackers — Ubuntu VPS Docker Deployment Guide
- api/package.json
- User
- s3Service
- useVoiceChat.ts
- 🛠 Manual Step-by-Step Installation (Alternative)
- devDependencies
- ThemeContext.tsx
- init-ssl.sh
- entrypoint.sh
- deploy.sh
- setup-ssl.sh
- resetDatabase.ts
- dependencies
- setup-vps-native.sh
- update-native.sh
- scripts
- next
- optionalDependencies
- messageController.ts
- PureWebSocket
- authMiddleware.ts
- projectController.ts
- bugController.ts
- redisService.ts
- fileService

## God Nodes (most connected - your core abstractions)
1. `dataStore` - 72 edges
2. `User` - 68 edges
3. `Hub` - 45 edges
4. `User` - 42 edges
5. `socketService` - 37 edges
6. `express` - 32 edges
7. `writeJSON()` - 31 edges
8. `react` - 28 edges
9. `taskService` - 27 edges
10. `E2EEService` - 27 edges

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

## Communities (73 total, 19 thin omitted)

### Community 0 - "web/src/types/index.ts"
Cohesion: 0.10
Nodes (32): Props, AVATAR_PRESETS, Props, SettingsTab, PRIORITY_LABELS, STATUS_LABELS, api, channelKeyCache (+24 more)

### Community 1 - "dataStore"
Cohesion: 0.07
Nodes (8): dataStore, generateSeedKeyVault(), AutomationRule, Channel, ChannelKey, KeyVaultData, Message, WebhookLog

### Community 2 - "User"
Cohesion: 0.21
Nodes (5): AuthenticatedSocket, taskService, Task, TaskStatus, User

### Community 3 - "Hybrid Production Deployment Guide: Docker Databases + PM2 Apps"
Cohesion: 0.14
Nodes (13): 1. Quick Start (1-Click Deployment), 2. Enabling HTTPS / SSL (Free Let's Encrypt), 3. Daily Operations & Management, 4. Deploying Updates (Zero-Downtime), 5. Database Backups, Hybrid Production Deployment Guide: Docker Databases + PM2 Apps, Managing Application Processes (PM2), Managing Containerized Databases (Docker) (+5 more)

### Community 4 - "webhookService.ts"
Cohesion: 0.11
Nodes (13): automationService, channelKeyCache, decryptChannelMessageNode(), deriveChannelKeyNode(), encryptChannelMessageNode(), generateWebhookSecret(), generateWebhookToken(), verifyHmacSha256() (+5 more)

### Community 5 - "web/package.json"
Cohesion: 0.12
Nodes (15): @types/node, typescript, name, private, version, eslint, eslint-config-next, react-dom (+7 more)

### Community 6 - "socketService"
Cohesion: 0.07
Nodes (19): deleteDirectMessage(), editDirectMessage(), getConversation(), getKeyVault(), getPublicKey(), getRecentConversations(), getUnreadCounts(), KeyVaultSchema (+11 more)

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

### Community 25 - "test-pentest-remediations.ts"
Cohesion: 0.25
Nodes (15): createChannel(), CreateChannelSchema, getChannelById(), getChannelKey(), getChannels(), saveChannelKey(), SaveChannelKeySchema, createMessage() (+7 more)

### Community 26 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, db:reset, db:seed, dev, prisma:generate, prisma:push, start

### Community 27 - "api/src/types/index.ts"
Cohesion: 0.11
Nodes (16): BugEnvironment, BugStats, DeveloperRole, DiscordEmbed, DiscordEmbedField, DmCallStatus, MuteDuration, MuteTarget (+8 more)

### Community 28 - "src/index.ts"
Cohesion: 0.12
Nodes (18): webhookController, app, avatarsDir, httpServer, uploadsDir, authenticate(), requireRole(), errorHandler() (+10 more)

### Community 29 - "writeJSON"
Cohesion: 0.06
Nodes (41): main(), Claims, VerifyToken(), ComparePassword(), Config, Load(), Connect(), Database (+33 more)

### Community 30 - "authController.ts"
Cohesion: 0.24
Nodes (12): getMe(), login(), LoginSchema, logout(), register(), updateProfile(), UpdateProfileSchema, uploadAvatar() (+4 more)

### Community 31 - "taskController.ts"
Cohesion: 0.12
Nodes (25): CreateCommentSchema, createTaskComment(), deleteTaskComment(), getTaskComments(), addQAStep(), AddQAStepSchema, addSubtask(), AddSubtaskSchema (+17 more)

### Community 32 - "memberController.ts"
Cohesion: 0.33
Nodes (11): acceptInvitation(), AcceptInviteSchema, addMember(), AddMemberSchema, createInvitation(), CreateInviteSchema, getInvitations(), revokeInvitation() (+3 more)

### Community 33 - "ChatArea.tsx"
Cohesion: 0.12
Nodes (26): ChatArea(), ChatDateDivider(), EncryptedAttachmentCard(), extractPlainText(), highlightMatches(), Props, RenderDecryptedContent(), SafetyModalProps (+18 more)

### Community 34 - "lucide-react"
Cohesion: 0.16
Nodes (18): BugTracker(), Props, SEVERITY_INFO, STATUS_BADGES, CreateProjectModal(), Props, ProjectMembersModal(), Props (+10 more)

### Community 35 - "dataStore.ts"
Cohesion: 0.16
Nodes (10): DEFAULT_PASSWORD_HASH, checkPostgresHealth(), prisma, EncryptedFileRecord, mongoLogger, ActivityLog, ProjectStats, runTest() (+2 more)

### Community 36 - "projectRoutes.ts"
Cohesion: 0.57
Nodes (7): createProject(), deleteProject(), getProjectById(), getProjects(), getProjectStats(), updateProject(), router

### Community 38 - "automationService.ts"
Cohesion: 0.38
Nodes (4): SmartReferenceResult, bugService, Bug, BugSeverity

### Community 39 - "sessionController.ts"
Cohesion: 0.52
Nodes (5): getSessions(), revokeOtherSessions(), revokeSession(), UserSessionResponse, router

### Community 40 - "KanbanBoard.tsx"
Cohesion: 0.18
Nodes (14): CommandPalette(), PaletteItem, Props, Props, COLUMN_WIP_LIMITS, COLUMNS, getDueDateBadge(), KanbanBoard() (+6 more)

### Community 41 - "Hub"
Cohesion: 0.05
Nodes (32): GenerateToken(), User, NewHub(), NewRedisPubSub(), context.CancelFunc, context.Context, encoding/json.RawMessage, github.com/gorilla/websocket.Conn (+24 more)

### Community 42 - "roles.ts"
Cohesion: 0.21
Nodes (9): AuthModal(), Props, InviteMemberModal(), Props, DEVELOPER_ROLES, ROLE_BADGES, RoleInfo, DeveloperRole (+1 more)

### Community 43 - "page.tsx"
Cohesion: 0.18
Nodes (14): CreateTaskModal(), NotificationCenter(), Props, ReportBugModal(), formatActivityAction(), getDueDateStatus(), TaskDetailModal(), authStorage (+6 more)

### Community 45 - "socketService.ts"
Cohesion: 0.14
Nodes (8): authService, AVATAR_PRESETS, memberService, UserSession, AuthResponse, Invitation, UserRole, bcryptjs

### Community 46 - "🚀 Slackers — Ubuntu VPS Docker Deployment Guide"
Cohesion: 0.08
Nodes (24): 1. Point DNS A-Record, 1. PostgreSQL Backup, 2. MongoDB Audit Log Backup, 2. Run the SSL Automation Script, 3. Automatic SSL Renewal, 3. MinIO File Attachments Backup, 💾 Backup & Restore Procedures, Can I run this behind Cloudflare? (+16 more)

### Community 47 - "api/package.json"
Cohesion: 0.09
Nodes (21): description, @types/node, typescript, main, name, private, version, cors (+13 more)

### Community 48 - "User"
Cohesion: 0.13
Nodes (23): ActiveDmCallModal(), ActiveDmCallModalProps, formatDuration(), CreateChannelModal(), Props, GroupVoiceStageModal(), GroupVoiceStageModalProps, IncomingCallModal() (+15 more)

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
Cohesion: 0.29
Nodes (5): metadata, Theme, ThemeContext, ThemeContextType, ThemeProvider()

### Community 58 - "resetDatabase.ts"
Cohesion: 0.50
Nodes (4): generateKeyVault(), KeyVaultData, main(), mongodb

### Community 59 - "dependencies"
Cohesion: 0.33
Nodes (6): dependencies, lucide-react, next, react, react-dom, socket.io-client

### Community 63 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 65 - "optionalDependencies"
Cohesion: 0.67
Nodes (3): optionalDependencies, @tailwindcss/oxide-linux-arm64-gnu, @tailwindcss/oxide-linux-x64-gnu

### Community 66 - "messageController.ts"
Cohesion: 0.45
Nodes (8): CreateMessageSchema, deleteMessage(), editMessage(), getThreadReplies(), toggleReaction(), assert(), mockResponse(), runRound2Verification()

### Community 67 - "PureWebSocket"
Cohesion: 0.24
Nodes (4): connectSocket(), getWsUrl(), PureWebSocket, setupVisibilityHandler()

### Community 68 - "authMiddleware.ts"
Cohesion: 0.28
Nodes (7): downloadEncryptedFile(), uploadEncryptedFile(), AuthRequest, memoryRateLimits, messagingRateLimiter, RateLimiterOptions, express

### Community 70 - "projectController.ts"
Cohesion: 0.28
Nodes (4): CreateProjectSchema, UpdateProjectSchema, projectService, Project

### Community 71 - "bugController.ts"
Cohesion: 0.33
Nodes (11): convertBugToTask(), createBug(), CreateBugSchema, deleteBug(), getBugById(), getBugs(), getBugStats(), updateBug() (+3 more)

### Community 73 - "redisService.ts"
Cohesion: 0.29
Nodes (5): RedisHealth, S3Health, @aws-sdk/client-s3, dotenv, ioredis

## Knowledge Gaps
- **289 isolated node(s):** `github.com/Nakano-Nino/slackers-api-go`, `APIResponse`, `contextKey`, `UserRole`, `UserStatus` (+284 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 382 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dataStore` connect `dataStore` to `messageController.ts`, `dataStore.ts`, `webhookService.ts`, `authMiddleware.ts`, `socketService`, `automationService.ts`, `User`, `socketService.ts`, `test-pentest-remediations.ts`, `src/index.ts`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `memberController.ts`, `dataStore`, `messageController.ts`, `dataStore.ts`, `authMiddleware.ts`, `automationService.ts`, `socketService`, `projectController.ts`, `socketService.ts`, `test-pentest-remediations.ts`, `api/src/types/index.ts`, `authController.ts`, `taskController.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `express` connect `authMiddleware.ts` to `memberController.ts`, `messageController.ts`, `dataStore.ts`, `webhookService.ts`, `projectRoutes.ts`, `socketService`, `bugController.ts`, `projectController.ts`, `sessionController.ts`, `notificationService`, `api/package.json`, `test-pentest-remediations.ts`, `src/index.ts`, `authController.ts`, `taskController.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `github.com/Nakano-Nino/slackers-api-go`, `APIResponse`, `contextKey` to the rest of the system?**
  _289 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `web/src/types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10365853658536585 - nodes in this community are weakly interconnected._
- **Should `dataStore` be split into smaller, more focused modules?**
  _Cohesion score 0.07053140096618357 - nodes in this community are weakly interconnected._
- **Should `Hybrid Production Deployment Guide: Docker Databases + PM2 Apps` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._