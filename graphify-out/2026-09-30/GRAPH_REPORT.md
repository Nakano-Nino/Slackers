# Graph Report - slackers  (2026-09-28)

## Corpus Check
- 118 files · ~105,617 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: (none) 5, .example 4, .conf 3)

## Summary
- 981 nodes · 2420 edges · 68 communities (45 shown, 21 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 94 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5a93f90e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- web/src/types/index.ts
- dataStore
- src/index.ts
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
- authMiddleware.ts
- authService
- authController.ts
- taskController.ts
- memberController.ts
- ChatArea.tsx
- sessionService
- fileService
- projectController.ts
- test-pentest-remediations.ts
- bugController.ts
- TaskDetailModal.tsx
- User
- webhookService.ts
- roles.ts
- page.tsx
- Message
- sessionController.ts
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
- ActiveDmCallModal.tsx
- WebhookLog

## God Nodes (most connected - your core abstractions)
1. `dataStore` - 72 edges
2. `User` - 68 edges
3. `User` - 42 edges
4. `socketService` - 37 edges
5. `express` - 32 edges
6. `taskService` - 27 edges
7. `react` - 27 edges
8. `E2EEService` - 27 edges
9. `mongoLogger` - 26 edges
10. `lucide-react` - 25 edges

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

## Communities (68 total, 21 thin omitted)

### Community 0 - "web/src/types/index.ts"
Cohesion: 0.12
Nodes (25): Props, AVATAR_PRESETS, Props, SettingsTab, api, channelKeyCache, sharedKeyCache, ApiResponse (+17 more)

### Community 1 - "dataStore"
Cohesion: 0.09
Nodes (6): dataStore, generateSeedKeyVault(), AutomationRule, Channel, ChannelKey, KeyVaultData

### Community 2 - "src/index.ts"
Cohesion: 0.12
Nodes (15): app, avatarsDir, httpServer, uploadsDir, errorHandler(), router, router, router (+7 more)

### Community 3 - "Hybrid Production Deployment Guide: Docker Databases + PM2 Apps"
Cohesion: 0.14
Nodes (13): 1. Quick Start (1-Click Deployment), 2. Enabling HTTPS / SSL (Free Let's Encrypt), 3. Daily Operations & Management, 4. Deploying Updates (Zero-Downtime), 5. Database Backups, Hybrid Production Deployment Guide: Docker Databases + PM2 Apps, Managing Application Processes (PM2), Managing Containerized Databases (Docker) (+5 more)

### Community 4 - "Webhook"
Cohesion: 0.26
Nodes (3): webhookService, IncomingWebhookPayload, Webhook

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

### Community 25 - "channelController.ts"
Cohesion: 0.56
Nodes (7): createChannel(), CreateChannelSchema, getChannelById(), getChannelKey(), getChannels(), saveChannelKey(), SaveChannelKeySchema

### Community 26 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, db:seed, dev, prisma:generate, prisma:push, start

### Community 27 - "api/src/types/index.ts"
Cohesion: 0.05
Nodes (47): SmartReferenceResult, bugService, DEFAULT_PASSWORD_HASH, checkPostgresHealth(), prisma, EncryptedFileRecord, AVATAR_PRESETS, memberService (+39 more)

### Community 28 - "authMiddleware.ts"
Cohesion: 0.19
Nodes (11): downloadEncryptedFile(), uploadEncryptedFile(), webhookController, AuthRequest, requireRole(), memoryRateLimits, messagingRateLimiter, RateLimiterOptions (+3 more)

### Community 30 - "authController.ts"
Cohesion: 0.20
Nodes (14): getMe(), login(), LoginSchema, logout(), register(), updateProfile(), UpdateProfileSchema, uploadAvatar() (+6 more)

### Community 31 - "taskController.ts"
Cohesion: 0.12
Nodes (26): CreateCommentSchema, createTaskComment(), deleteTaskComment(), getTaskComments(), addQAStep(), AddQAStepSchema, addSubtask(), AddSubtaskSchema (+18 more)

### Community 32 - "memberController.ts"
Cohesion: 0.33
Nodes (11): acceptInvitation(), AcceptInviteSchema, addMember(), AddMemberSchema, createInvitation(), CreateInviteSchema, getInvitations(), revokeInvitation() (+3 more)

### Community 33 - "ChatArea.tsx"
Cohesion: 0.13
Nodes (25): ChatArea(), ChatDateDivider(), EncryptedAttachmentCard(), extractPlainText(), highlightMatches(), Props, RenderDecryptedContent(), TaskAttachmentCard() (+17 more)

### Community 36 - "projectController.ts"
Cohesion: 0.53
Nodes (8): createProject(), CreateProjectSchema, deleteProject(), getProjectById(), getProjects(), getProjectStats(), updateProject(), UpdateProjectSchema

### Community 37 - "test-pentest-remediations.ts"
Cohesion: 0.26
Nodes (15): createMessage(), CreateMessageSchema, deleteMessage(), editMessage(), getMessagesByChannel(), getThreadReplies(), toggleReaction(), authenticate() (+7 more)

### Community 38 - "bugController.ts"
Cohesion: 0.33
Nodes (11): convertBugToTask(), createBug(), CreateBugSchema, deleteBug(), getBugById(), getBugs(), getBugStats(), updateBug() (+3 more)

### Community 39 - "TaskDetailModal.tsx"
Cohesion: 0.22
Nodes (10): formatActivityAction(), getDueDateStatus(), PRIORITY_LABELS, STATUS_LABELS, TaskDetailModal(), ActivityLog, QAReviewStep, QAStepStatus (+2 more)

### Community 40 - "User"
Cohesion: 0.13
Nodes (23): SafetyModalProps, CommandPalette(), PaletteItem, Props, CreateProjectModal(), Props, Props, IncomingCallModal() (+15 more)

### Community 41 - "webhookService.ts"
Cohesion: 0.24
Nodes (8): channelKeyCache, decryptChannelMessageNode(), deriveChannelKeyNode(), encryptChannelMessageNode(), generateWebhookSecret(), generateWebhookToken(), verifyHmacSha256(), WebhookType

### Community 42 - "roles.ts"
Cohesion: 0.21
Nodes (9): AuthModal(), Props, InviteMemberModal(), Props, DEVELOPER_ROLES, ROLE_BADGES, RoleInfo, DeveloperRole (+1 more)

### Community 43 - "page.tsx"
Cohesion: 0.12
Nodes (24): BugTracker(), Props, SEVERITY_INFO, STATUS_BADGES, CreateChannelModal(), CreateTaskModal(), NotificationCenter(), ProjectProgressBar() (+16 more)

### Community 45 - "sessionController.ts"
Cohesion: 0.52
Nodes (5): getSessions(), revokeOtherSessions(), revokeSession(), UserSessionResponse, router

### Community 46 - "🚀 Slackers — Ubuntu VPS Docker Deployment Guide"
Cohesion: 0.08
Nodes (24): 1. Point DNS A-Record, 1. PostgreSQL Backup, 2. MongoDB Audit Log Backup, 2. Run the SSL Automation Script, 3. Automatic SSL Renewal, 3. MinIO File Attachments Backup, 💾 Backup & Restore Procedures, Can I run this behind Cloudflare? (+16 more)

### Community 47 - "api/package.json"
Cohesion: 0.09
Nodes (22): description, @types/node, typescript, main, name, private, version, @aws-sdk/client-s3 (+14 more)

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

### Community 66 - "ActiveDmCallModal.tsx"
Cohesion: 0.47
Nodes (5): ActiveDmCallModal(), ActiveDmCallModalProps, formatDuration(), UseVoiceChatReturn, DmCallStatus

## Knowledge Gaps
- **278 isolated node(s):** `entrypoint.sh script`, `name`, `version`, `private`, `description` (+273 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 350 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dataStore` connect `dataStore` to `src/index.ts`, `WebhookLog`, `Webhook`, `test-pentest-remediations.ts`, `socketService`, `webhookService.ts`, `Message`, `channelController.ts`, `api/src/types/index.ts`, `authMiddleware.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `User` connect `api/src/types/index.ts` to `memberController.ts`, `dataStore`, `test-pentest-remediations.ts`, `socketService`, `Message`, `authMiddleware.ts`, `authService`, `authController.ts`, `taskController.ts`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `express` connect `authMiddleware.ts` to `memberController.ts`, `src/index.ts`, `projectController.ts`, `test-pentest-remediations.ts`, `bugController.ts`, `socketService`, `notificationService`, `sessionController.ts`, `api/package.json`, `channelController.ts`, `api/src/types/index.ts`, `authController.ts`, `taskController.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `entrypoint.sh script`, `name`, `version` to the rest of the system?**
  _278 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `web/src/types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `dataStore` be split into smaller, more focused modules?**
  _Cohesion score 0.08712121212121213 - nodes in this community are weakly interconnected._
- **Should `src/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._