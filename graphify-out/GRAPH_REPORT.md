# Graph Report - slackers  (2026-09-30)

## Corpus Check
- 134 files · ~112,403 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: (none) 7, .conf 3, .example 2)

## Summary
- 1150 nodes · 2778 edges · 69 communities (51 shown, 17 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 120 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f77c78ec`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- web/src/types/index.ts
- dataStore
- User
- Hybrid Production Deployment Guide: Docker Databases + PM2 Apps
- socketService
- web/package.json
- dmController.ts
- compilerOptions
- E2EEService
- compilerOptions
- notificationController.ts
- package.json
- notificationService
- eslint.config.mjs
- postcss.config.mjs
- redisService
- TaskDetailModal.tsx
- 🚀 Slackers
- web/README.md
- rules/graphify.md
- workflows/graphify.md
- AGENTS.md
- dependencies
- devDependencies
- authMiddleware.ts
- scripts
- api/src/types/index.ts
- taskCommentService
- writeJSON
- authController.ts
- taskController.ts
- memberController.ts
- ChatArea.tsx
- lucide-react
- src/index.ts
- projectController.ts
- sessionService
- ActiveDmCallModal.tsx
- sessionController.ts
- User
- Hub
- roles.ts
- page.tsx
- github.com/Nakano-Nino/slackers-api-go
- socketService.ts
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
- dependencies
- scripts
- layout.tsx
- optionalDependencies
- messageController.ts
- PureWebSocket
- express
- projectService
- bugController.ts
- redisService.ts
- fileService

## God Nodes (most connected - your core abstractions)
1. `dataStore` - 68 edges
2. `User` - 65 edges
3. `Hub` - 45 edges
4. `User` - 42 edges
5. `socketService` - 37 edges
6. `express` - 32 edges
7. `writeJSON()` - 31 edges
8. `react` - 28 edges
9. `E2EEService` - 27 edges
10. `Database` - 26 edges

## Surprising Connections (you probably didn't know these)
- `UserSessionResponse` --inherits--> `UserSession`  [EXTRACTED]
  apps/api/src/controllers/sessionController.ts → apps/api/src/services/sessionService.ts
- `Props` --references--> `User`  [EXTRACTED]
  apps/web/src/components/AuthModal.tsx → apps/web/src/types/index.ts
- `SafetyModalProps` --references--> `User`  [EXTRACTED]
  apps/web/src/components/ChatArea.tsx → apps/web/src/types/index.ts
- `IncomingCallModalProps` --references--> `User`  [EXTRACTED]
  apps/web/src/components/IncomingCallModal.tsx → apps/web/src/types/index.ts
- `Props` --references--> `User`  [EXTRACTED]
  apps/web/src/components/InviteMemberModal.tsx → apps/web/src/types/index.ts

## Import Cycles
- None detected.

## Communities (69 total, 17 thin omitted)

### Community 0 - "web/src/types/index.ts"
Cohesion: 0.12
Nodes (26): Props, AVATAR_PRESETS, SettingsTab, api, channelKeyCache, sharedKeyCache, ActivityLog, ApiResponse (+18 more)

### Community 1 - "dataStore"
Cohesion: 0.05
Nodes (19): automationService, dataStore, generateSeedKeyVault(), channelKeyCache, decryptChannelMessageNode(), deriveChannelKeyNode(), encryptChannelMessageNode(), generateWebhookSecret() (+11 more)

### Community 2 - "User"
Cohesion: 0.17
Nodes (5): AuthenticatedSocket, taskService, Task, TaskStatus, User

### Community 3 - "Hybrid Production Deployment Guide: Docker Databases + PM2 Apps"
Cohesion: 0.14
Nodes (13): 1. Quick Start (1-Click Deployment), 2. Enabling HTTPS / SSL (Free Let's Encrypt), 3. Daily Operations & Management, 4. Deploying Updates (Zero-Downtime), 5. Database Backups, Hybrid Production Deployment Guide: Docker Databases + PM2 Apps, Managing Application Processes (PM2), Managing Containerized Databases (Docker) (+5 more)

### Community 5 - "web/package.json"
Cohesion: 0.12
Nodes (15): @types/node, typescript, name, private, version, eslint, eslint-config-next, react-dom (+7 more)

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

### Community 10 - "notificationController.ts"
Cohesion: 0.51
Nodes (8): deleteNotification(), getMuteTargets(), getNotifications(), markAllAsRead(), markAsRead(), muteTarget(), unmuteTarget(), router

### Community 11 - "package.json"
Cohesion: 0.13
Nodes (14): devDependencies, concurrently, name, private, scripts, build, clean, dev (+6 more)

### Community 12 - "notificationService"
Cohesion: 0.16
Nodes (3): notificationService, Notification, NotificationType

### Community 16 - "TaskDetailModal.tsx"
Cohesion: 0.31
Nodes (9): Sidebar(), formatActivityAction(), getDueDateStatus(), PRIORITY_LABELS, STATUS_LABELS, TaskDetailModal(), formatUserRole(), getUserRoleBadge() (+1 more)

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

### Community 25 - "authMiddleware.ts"
Cohesion: 0.23
Nodes (13): createChannel(), CreateChannelSchema, getChannelById(), getChannelKey(), getChannels(), saveChannelKey(), SaveChannelKeySchema, authenticate() (+5 more)

### Community 26 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, db:reset, db:seed, dev, prisma:generate, prisma:push, start

### Community 27 - "api/src/types/index.ts"
Cohesion: 0.10
Nodes (22): SmartReferenceResult, bugService, AutomationTrigger, Bug, BugEnvironment, BugSeverity, BugStats, BugStatus (+14 more)

### Community 29 - "writeJSON"
Cohesion: 0.06
Nodes (41): main(), Claims, VerifyToken(), ComparePassword(), Config, Load(), Connect(), Database (+33 more)

### Community 30 - "authController.ts"
Cohesion: 0.30
Nodes (10): getMe(), login(), LoginSchema, logout(), register(), updateProfile(), UpdateProfileSchema, uploadAvatar() (+2 more)

### Community 31 - "taskController.ts"
Cohesion: 0.16
Nodes (24): CreateCommentSchema, createTaskComment(), deleteTaskComment(), getTaskComments(), addQAStep(), AddQAStepSchema, addSubtask(), AddSubtaskSchema (+16 more)

### Community 32 - "memberController.ts"
Cohesion: 0.27
Nodes (13): acceptInvitation(), AcceptInviteSchema, addMember(), AddMemberSchema, createInvitation(), CreateInviteSchema, getInvitations(), revokeInvitation() (+5 more)

### Community 33 - "ChatArea.tsx"
Cohesion: 0.14
Nodes (25): ChatDateDivider(), EncryptedAttachmentCard(), highlightMatches(), Props, RenderDecryptedContent(), SafetyModalProps, TaskAttachmentCard(), COMMON_REACTIONS (+17 more)

### Community 34 - "lucide-react"
Cohesion: 0.23
Nodes (12): BugTracker(), Props, SEVERITY_INFO, STATUS_BADGES, ProjectProgressBar(), Props, ProjectSearchDropdown(), Bug (+4 more)

### Community 35 - "src/index.ts"
Cohesion: 0.12
Nodes (19): app, avatarsDir, httpServer, uploadsDir, errorHandler(), router, generateKeyVault(), KeyVaultData (+11 more)

### Community 36 - "projectController.ts"
Cohesion: 0.45
Nodes (9): createProject(), CreateProjectSchema, deleteProject(), getProjectById(), getProjects(), getProjectStats(), updateProject(), UpdateProjectSchema (+1 more)

### Community 38 - "ActiveDmCallModal.tsx"
Cohesion: 0.47
Nodes (5): ActiveDmCallModal(), ActiveDmCallModalProps, formatDuration(), UseVoiceChatReturn, DmCallStatus

### Community 39 - "sessionController.ts"
Cohesion: 0.52
Nodes (5): getSessions(), revokeOtherSessions(), revokeSession(), UserSessionResponse, router

### Community 40 - "User"
Cohesion: 0.14
Nodes (23): CommandPalette(), PaletteItem, Props, CreateProjectModal(), Props, CreateTaskModal(), Props, COLUMN_WIP_LIMITS (+15 more)

### Community 41 - "Hub"
Cohesion: 0.05
Nodes (32): GenerateToken(), User, NewHub(), NewRedisPubSub(), context.CancelFunc, context.Context, encoding/json.RawMessage, github.com/gorilla/websocket.Conn (+24 more)

### Community 42 - "roles.ts"
Cohesion: 0.21
Nodes (9): AuthModal(), Props, InviteMemberModal(), Props, DEVELOPER_ROLES, ROLE_BADGES, RoleInfo, DeveloperRole (+1 more)

### Community 43 - "page.tsx"
Cohesion: 0.20
Nodes (11): IncomingCallModal(), IncomingCallModalProps, NotificationCenter(), Props, ReportBugModal(), authStorage, disconnectSocket(), EventListener (+3 more)

### Community 45 - "socketService.ts"
Cohesion: 0.14
Nodes (8): authService, AVATAR_PRESETS, memberService, UserSession, AuthResponse, Invitation, UserRole, bcryptjs

### Community 46 - "🚀 Slackers — Ubuntu VPS Docker Deployment Guide"
Cohesion: 0.08
Nodes (24): 1. Point DNS A-Record, 1. PostgreSQL Backup, 2. MongoDB Audit Log Backup, 2. Run the SSL Automation Script, 3. Automatic SSL Renewal, 3. MinIO File Attachments Backup, 💾 Backup & Restore Procedures, Can I run this behind Cloudflare? (+16 more)

### Community 47 - "api/package.json"
Cohesion: 0.10
Nodes (20): description, @types/node, typescript, main, name, private, version, cors (+12 more)

### Community 48 - "react"
Cohesion: 0.27
Nodes (10): CreateChannelModal(), Props, GroupVoiceStageModal(), GroupVoiceStageModalProps, Props, VoiceControlsBar(), VoiceControlsBarProps, Channel (+2 more)

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
Cohesion: 0.42
Nodes (8): createMessage(), CreateMessageSchema, deleteMessage(), editMessage(), getMessagesByChannel(), getThreadReplies(), toggleReaction(), router

### Community 67 - "PureWebSocket"
Cohesion: 0.24
Nodes (4): connectSocket(), getWsUrl(), PureWebSocket, setupVisibilityHandler()

### Community 68 - "express"
Cohesion: 0.16
Nodes (13): downloadEncryptedFile(), uploadEncryptedFile(), webhookController, authRateLimiter, memoryRateLimits, messagingRateLimiter, RateLimiterOptions, webhookIngestRateLimiter (+5 more)

### Community 71 - "bugController.ts"
Cohesion: 0.38
Nodes (10): convertBugToTask(), createBug(), CreateBugSchema, deleteBug(), getBugById(), getBugs(), getBugStats(), updateBug() (+2 more)

### Community 73 - "redisService.ts"
Cohesion: 0.29
Nodes (5): RedisHealth, S3Health, @aws-sdk/client-s3, dotenv, ioredis

## Knowledge Gaps
- **285 isolated node(s):** `github.com/Nakano-Nino/slackers-api-go`, `APIResponse`, `contextKey`, `UserRole`, `UserStatus` (+280 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 372 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dataStore` connect `dataStore` to `messageController.ts`, `src/index.ts`, `express`, `User`, `dmController.ts`, `socketService.ts`, `authMiddleware.ts`, `api/src/types/index.ts`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `memberController.ts`, `dataStore`, `src/index.ts`, `socketService`, `dmController.ts`, `projectService`, `socketService.ts`, `authMiddleware.ts`, `api/src/types/index.ts`, `taskCommentService`, `authController.ts`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `express` connect `express` to `memberController.ts`, `messageController.ts`, `src/index.ts`, `projectController.ts`, `dmController.ts`, `bugController.ts`, `sessionController.ts`, `notificationController.ts`, `api/package.json`, `authMiddleware.ts`, `authController.ts`, `taskController.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `github.com/Nakano-Nino/slackers-api-go`, `APIResponse`, `contextKey` to the rest of the system?**
  _285 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `web/src/types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `dataStore` be split into smaller, more focused modules?**
  _Cohesion score 0.05117117117117117 - nodes in this community are weakly interconnected._
- **Should `Hybrid Production Deployment Guide: Docker Databases + PM2 Apps` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._