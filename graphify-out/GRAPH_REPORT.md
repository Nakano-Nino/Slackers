# Graph Report - slackers  (2026-09-21)

## Corpus Check
- 111 files · ~99,391 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: (none) 5, .example 4, .conf 3)

## Summary
- 942 nodes · 2304 edges · 49 communities (32 shown, 15 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 94 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `956f3396`
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
- scripts
- User
- taskController.ts
- ChatArea.tsx
- messageController.ts
- fileService
- socketService.ts
- bugController.ts
- User
- api/src/types/index.ts
- roles.ts
- page.tsx
- 🚀 Slackers — Ubuntu VPS Docker Deployment Guide
- api/package.json
- mongoLogger
- 🛠 Manual Step-by-Step Installation (Alternative)
- init-ssl.sh
- entrypoint.sh
- deploy.sh
- TaskDetailModal.tsx
- s3Service
- setup-vps-native.sh
- update-native.sh

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

## Communities (49 total, 15 thin omitted)

### Community 0 - "web/src/types/index.ts"
Cohesion: 0.13
Nodes (24): Props, AVATAR_PRESETS, SettingsTab, api, channelKeyCache, sharedKeyCache, ApiResponse, AuthResponse (+16 more)

### Community 1 - "dataStore"
Cohesion: 0.08
Nodes (8): dataStore, generateSeedKeyVault(), AutomationRule, Channel, ChannelKey, KeyVaultData, Message, WebhookLog

### Community 2 - "src/index.ts"
Cohesion: 0.05
Nodes (77): getMe(), login(), LoginSchema, logout(), register(), RegisterSchema, updateProfile(), UpdateProfileSchema (+69 more)

### Community 3 - "Hybrid Production Deployment Guide: Docker Databases + PM2 Apps"
Cohesion: 0.14
Nodes (13): 1. Quick Start (1-Click Deployment), 2. Enabling HTTPS / SSL (Free Let's Encrypt), 3. Daily Operations & Management, 4. Deploying Updates (Zero-Downtime), 5. Database Backups, Hybrid Production Deployment Guide: Docker Databases + PM2 Apps, Managing Application Processes (PM2), Managing Containerized Databases (Docker) (+5 more)

### Community 4 - "Webhook"
Cohesion: 0.11
Nodes (11): automationService, channelKeyCache, decryptChannelMessageNode(), deriveChannelKeyNode(), encryptChannelMessageNode(), generateWebhookSecret(), generateWebhookToken(), webhookService (+3 more)

### Community 5 - "web/package.json"
Cohesion: 0.04
Nodes (43): nextConfig, dependencies, lucide-react, next, react, react-dom, socket.io-client, devDependencies (+35 more)

### Community 6 - "dmController.ts"
Cohesion: 0.07
Nodes (19): deleteDirectMessage(), editDirectMessage(), getConversation(), getKeyVault(), getPublicKey(), getRecentConversations(), getUnreadCounts(), KeyVaultSchema (+11 more)

### Community 7 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 8 - "E2EEService"
Cohesion: 0.18
Nodes (6): Home(), SettingsModal(), arrayBufferToBase64(), base64ToArrayBuffer(), E2EEService, disconnectSocket()

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

### Community 26 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, db:seed, dev, prisma:generate, prisma:push, start

### Community 27 - "User"
Cohesion: 0.09
Nodes (9): memberService, projectService, AuthenticatedSocket, taskService, Invitation, Project, Task, TaskStatus (+1 more)

### Community 31 - "taskController.ts"
Cohesion: 0.11
Nodes (27): CreateCommentSchema, createTaskComment(), deleteTaskComment(), getTaskComments(), addQAStep(), AddQAStepSchema, addSubtask(), AddSubtaskSchema (+19 more)

### Community 33 - "ChatArea.tsx"
Cohesion: 0.12
Nodes (29): ChatArea(), ChatDateDivider(), EncryptedAttachmentCard(), extractPlainText(), highlightMatches(), Props, RenderDecryptedContent(), SafetyModalProps (+21 more)

### Community 34 - "messageController.ts"
Cohesion: 0.47
Nodes (8): CreateMessageSchema, deleteMessage(), editMessage(), toggleReaction(), revokeSession(), assert(), mockResponse(), runRound2Verification()

### Community 37 - "socketService.ts"
Cohesion: 0.16
Nodes (8): authService, AVATAR_PRESETS, parseDeviceName(), sessionService, UserSession, AuthResponse, UserRole, bcryptjs

### Community 38 - "bugController.ts"
Cohesion: 0.15
Nodes (17): convertBugToTask(), createBug(), CreateBugSchema, deleteBug(), getBugById(), getBugs(), getBugStats(), updateBug() (+9 more)

### Community 40 - "User"
Cohesion: 0.15
Nodes (24): CommandPalette(), PaletteItem, Props, CreateProjectModal(), Props, Props, COLUMN_WIP_LIMITS, COLUMNS (+16 more)

### Community 41 - "api/src/types/index.ts"
Cohesion: 0.16
Nodes (19): DEFAULT_PASSWORD_HASH, prisma, DeveloperRole, DiscordEmbed, DiscordEmbedField, MuteDuration, MuteTarget, ProjectStats (+11 more)

### Community 42 - "roles.ts"
Cohesion: 0.18
Nodes (12): AuthModal(), DEMO_USERS, Props, InviteMemberModal(), Props, Sidebar(), DEVELOPER_ROLES, getUserRoleBadge() (+4 more)

### Community 43 - "page.tsx"
Cohesion: 0.14
Nodes (20): BugTracker(), Props, SEVERITY_INFO, STATUS_BADGES, CreateTaskModal(), NotificationCenter(), ProjectProgressBar(), Props (+12 more)

### Community 46 - "🚀 Slackers — Ubuntu VPS Docker Deployment Guide"
Cohesion: 0.08
Nodes (24): 1. Point DNS A-Record, 1. PostgreSQL Backup, 2. MongoDB Audit Log Backup, 2. Run the SSL Automation Script, 3. Automatic SSL Renewal, 3. MinIO File Attachments Backup, 💾 Backup & Restore Procedures, Can I run this behind Cloudflare? (+16 more)

### Community 47 - "api/package.json"
Cohesion: 0.09
Nodes (21): description, @types/node, typescript, main, name, private, version, cors (+13 more)

### Community 49 - "mongoLogger"
Cohesion: 0.14
Nodes (10): checkPostgresHealth(), EncryptedFileRecord, mongoLogger, RedisHealth, S3Health, ActivityLog, @aws-sdk/client-s3, dotenv (+2 more)

### Community 51 - "🛠 Manual Step-by-Step Installation (Alternative)"
Cohesion: 0.08
Nodes (23): 1. Point Your Domain DNS A-Record, 2. Issue Certificate with Certbot, 3. Update Application URL, 📊 Daily Maintenance & PM2 Commands, 🔒 Enable Free HTTPS (Let's Encrypt SSL), Managing Processes, 🛠 Manual Step-by-Step Installation (Alternative), MongoDB (+15 more)

### Community 57 - "TaskDetailModal.tsx"
Cohesion: 0.22
Nodes (10): formatActivityAction(), getDueDateStatus(), PRIORITY_LABELS, STATUS_LABELS, TaskDetailModal(), ActivityLog, QAReviewStep, QAStepStatus (+2 more)

## Knowledge Gaps
- **273 isolated node(s):** `entrypoint.sh script`, `name`, `version`, `private`, `description` (+268 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 345 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dataStore` connect `dataStore` to `src/index.ts`, `messageController.ts`, `Webhook`, `socketService.ts`, `dmController.ts`, `api/src/types/index.ts`, `mongoLogger`, `User`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `express` connect `src/index.ts` to `messageController.ts`, `dmController.ts`, `bugController.ts`, `notificationService`, `api/package.json`, `mongoLogger`, `taskController.ts`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `dataStore`, `src/index.ts`, `messageController.ts`, `socketService.ts`, `bugController.ts`, `dmController.ts`, `api/src/types/index.ts`, `taskController.ts`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `entrypoint.sh script`, `name`, `version` to the rest of the system?**
  _273 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `web/src/types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12903225806451613 - nodes in this community are weakly interconnected._
- **Should `dataStore` be split into smaller, more focused modules?**
  _Cohesion score 0.08205128205128205 - nodes in this community are weakly interconnected._
- **Should `src/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05191919191919192 - nodes in this community are weakly interconnected._