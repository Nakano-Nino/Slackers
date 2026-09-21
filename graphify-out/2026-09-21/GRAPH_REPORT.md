# Graph Report - slackers  (2026-09-20)

## Corpus Check
- 100 files · ~93,384 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .example 1, .prisma 1)

## Summary
- 863 nodes · 2236 edges · 46 communities (32 shown, 13 thin omitted)
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
- socketService
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
- automationService
- scripts
- api/src/types/index.ts
- authController.ts
- dmController.ts
- WebhookLog
- taskController.ts
- memberController.ts
- ChatArea.tsx
- messageController.ts
- src/index.ts
- sessionController.ts
- sessionService
- Channel
- .constructor
- react
- fileService
- roles.ts
- page.tsx
- User
- KeyVaultData

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

## Communities (46 total, 13 thin omitted)

### Community 0 - "web/src/types/index.ts"
Cohesion: 0.11
Nodes (32): Props, AVATAR_PRESETS, SettingsTab, formatActivityAction(), getDueDateStatus(), PRIORITY_LABELS, STATUS_LABELS, TaskDetailModal() (+24 more)

### Community 1 - "dataStore"
Cohesion: 0.09
Nodes (4): dataStore, AutomationRule, ChannelKey, Message

### Community 2 - "authMiddleware.ts"
Cohesion: 0.18
Nodes (13): downloadEncryptedFile(), uploadEncryptedFile(), authenticate(), AuthRequest, requireRole(), authRateLimiter, memoryRateLimits, messagingRateLimiter (+5 more)

### Community 3 - "projectController.ts"
Cohesion: 0.18
Nodes (13): createProject(), CreateProjectSchema, deleteProject(), getProjectById(), getProjects(), getProjectStats(), updateProject(), UpdateProjectSchema (+5 more)

### Community 4 - "Webhook"
Cohesion: 0.23
Nodes (4): encryptChannelMessageNode(), webhookService, IncomingWebhookPayload, Webhook

### Community 5 - "web/package.json"
Cohesion: 0.04
Nodes (43): nextConfig, dependencies, lucide-react, next, react, react-dom, socket.io-client, devDependencies (+35 more)

### Community 6 - "socketService"
Cohesion: 0.11
Nodes (3): dmService, socketService, DirectMessage

### Community 7 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 8 - "E2EEService"
Cohesion: 0.16
Nodes (8): Home(), ChatArea(), extractPlainText(), SettingsModal(), arrayBufferToBase64(), base64ToArrayBuffer(), E2EEService, disconnectSocket()

### Community 9 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, outDir, resolveJsonModule (+6 more)

### Community 10 - "webhookService.ts"
Cohesion: 0.31
Nodes (7): channelKeyCache, decryptChannelMessageNode(), deriveChannelKeyNode(), generateWebhookSecret(), generateWebhookToken(), verifyHmacSha256(), WebhookType

### Community 11 - "package.json"
Cohesion: 0.13
Nodes (14): devDependencies, concurrently, name, private, scripts, build, clean, dev (+6 more)

### Community 12 - "notificationService"
Cohesion: 0.14
Nodes (11): deleteNotification(), getMuteTargets(), getNotifications(), markAllAsRead(), markAsRead(), muteTarget(), unmuteTarget(), router (+3 more)

### Community 16 - "test-pentest-remediations.ts"
Cohesion: 0.25
Nodes (15): createChannel(), CreateChannelSchema, getChannelById(), getChannelKey(), getChannels(), saveChannelKey(), SaveChannelKeySchema, createMessage() (+7 more)

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

### Community 27 - "api/src/types/index.ts"
Cohesion: 0.06
Nodes (38): convertBugToTask(), createBug(), CreateBugSchema, deleteBug(), getBugById(), getBugs(), getBugStats(), updateBug() (+30 more)

### Community 28 - "authController.ts"
Cohesion: 0.16
Nodes (13): getMe(), login(), LoginSchema, logout(), register(), RegisterSchema, updateProfile(), UpdateProfileSchema (+5 more)

### Community 29 - "dmController.ts"
Cohesion: 0.22
Nodes (16): deleteDirectMessage(), editDirectMessage(), getConversation(), getKeyVault(), getPublicKey(), getRecentConversations(), getUnreadCounts(), KeyVaultSchema (+8 more)

### Community 31 - "taskController.ts"
Cohesion: 0.11
Nodes (27): CreateCommentSchema, createTaskComment(), deleteTaskComment(), getTaskComments(), addQAStep(), AddQAStepSchema, addSubtask(), AddSubtaskSchema (+19 more)

### Community 32 - "memberController.ts"
Cohesion: 0.30
Nodes (12): acceptInvitation(), AcceptInviteSchema, addMember(), AddMemberSchema, createInvitation(), CreateInviteSchema, getInvitations(), revokeInvitation() (+4 more)

### Community 33 - "ChatArea.tsx"
Cohesion: 0.14
Nodes (24): ChatDateDivider(), EncryptedAttachmentCard(), highlightMatches(), Props, RenderDecryptedContent(), SafetyModalProps, TaskAttachmentCard(), COMMON_REACTIONS (+16 more)

### Community 34 - "messageController.ts"
Cohesion: 0.39
Nodes (9): CreateMessageSchema, deleteMessage(), editMessage(), getThreadReplies(), toggleReaction(), router, assert(), mockResponse() (+1 more)

### Community 35 - "src/index.ts"
Cohesion: 0.05
Nodes (49): description, @types/node, typescript, main, name, private, version, app (+41 more)

### Community 36 - "sessionController.ts"
Cohesion: 0.52
Nodes (5): getSessions(), revokeOtherSessions(), revokeSession(), UserSessionResponse, router

### Community 40 - "react"
Cohesion: 0.18
Nodes (12): CommandPalette(), PaletteItem, Props, CreateChannelModal(), Props, Props, Props, Channel (+4 more)

### Community 42 - "roles.ts"
Cohesion: 0.18
Nodes (12): AuthModal(), DEMO_USERS, Props, InviteMemberModal(), Props, Sidebar(), DEVELOPER_ROLES, getUserRoleBadge() (+4 more)

### Community 43 - "page.tsx"
Cohesion: 0.14
Nodes (20): BugTracker(), Props, SEVERITY_INFO, STATUS_BADGES, CreateTaskModal(), NotificationCenter(), ProjectProgressBar(), Props (+12 more)

### Community 44 - "User"
Cohesion: 0.19
Nodes (17): CreateProjectModal(), Props, Props, COLUMN_WIP_LIMITS, COLUMNS, getDueDateBadge(), KanbanBoard(), PRIORITY_STYLES (+9 more)

## Knowledge Gaps
- **220 isolated node(s):** `name`, `version`, `private`, `description`, `main` (+215 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 282 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dataStore` connect `dataStore` to `messageController.ts`, `src/index.ts`, `authMiddleware.ts`, `Webhook`, `Channel`, `.constructor`, `webhookService.ts`, `KeyVaultData`, `test-pentest-remediations.ts`, `api/src/types/index.ts`, `dmController.ts`, `WebhookLog`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `express` connect `authMiddleware.ts` to `memberController.ts`, `messageController.ts`, `src/index.ts`, `projectController.ts`, `sessionController.ts`, `webhookService.ts`, `notificationService`, `test-pentest-remediations.ts`, `api/src/types/index.ts`, `authController.ts`, `dmController.ts`, `taskController.ts`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `User` connect `api/src/types/index.ts` to `memberController.ts`, `dataStore`, `authMiddleware.ts`, `src/index.ts`, `projectController.ts`, `messageController.ts`, `Channel`, `socketService`, `test-pentest-remediations.ts`, `authController.ts`, `taskController.ts`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _220 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `web/src/types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `dataStore` be split into smaller, more focused modules?**
  _Cohesion score 0.0907258064516129 - nodes in this community are weakly interconnected._
- **Should `web/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04336734693877551 - nodes in this community are weakly interconnected._