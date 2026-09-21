import { prisma } from './db.js';
import { dataStore } from './dataStore.js';
import { taskService } from './taskService.js';
import { projectService } from './projectService.js';
import { bugService } from './bugService.js';
import { taskCommentService } from './taskCommentService.js';
import { dmService } from './dmService.js';

/**
 * Seeds PostgreSQL database from in-memory seed models if empty.
 */
export async function seedPostgres(): Promise<{
  usersCount: number;
  channelsCount: number;
  projectsCount: number;
  tasksCount: number;
  bugsCount: number;
  messagesCount: number;
}> {
  if (process.env.SEED_DB !== 'true') {
    console.log('ℹ️  SEED_DB is not enabled. Skipping database seed (database remains empty).');
    return {
      usersCount: 0,
      channelsCount: 0,
      projectsCount: 0,
      tasksCount: 0,
      bugsCount: 0,
      messagesCount: 0,
    };
  }

  console.log('🌱 Checking PostgreSQL seed status...');

  // 1. Seed Users
  const existingUsersCount = await prisma.user.count();
  if (existingUsersCount === 0) {
    console.log('  → Seeding users into PostgreSQL...');
    const seedUsers = dataStore.getUsers();
    for (const u of seedUsers) {
      await prisma.user.create({
        data: {
          id: u.id,
          email: u.email,
          name: u.name,
          avatar: u.avatar,
          passwordHash: u.passwordHash || '',
          publicKey: u.publicKey || null,
          encryptedPrivateKey: u.encryptedPrivateKey || null,
          keyVaultSalt: u.keyVaultSalt || null,
          keyVaultIv: u.keyVaultIv || null,
          role: u.role.toUpperCase() as any,
          developerRole: u.developerRole || null,
          status: u.status.toUpperCase() as any,
        },
      });
    }
    console.log(`  ✓ Seeded ${seedUsers.length} users.`);
  }

  // 2. Seed Channels
  const existingChannelsCount = await prisma.channel.count();
  if (existingChannelsCount === 0) {
    console.log('  → Seeding channels into PostgreSQL...');
    const seedChannels = dataStore.getChannels();
    for (const c of seedChannels) {
      await prisma.channel.create({
        data: {
          id: c.id,
          name: c.name,
          description: c.description,
          isPrivate: c.isPrivate,
        },
      });
    }
    console.log(`  ✓ Seeded ${seedChannels.length} channels.`);
  }

  // 3. Seed Projects
  const existingProjectsCount = await prisma.project.count();
  if (existingProjectsCount === 0) {
    console.log('  → Seeding projects into PostgreSQL...');
    const seedProjects = projectService.getProjectsRaw();
    for (const p of seedProjects) {
      await prisma.project.create({
        data: {
          id: p.id,
          name: p.name,
          key: p.key,
          description: p.description,
          isPrivate: p.isPrivate,
          ownerId: p.ownerId || 'u-1',
          memberIds: p.memberIds || [],
        },
      });
    }
    console.log(`  ✓ Seeded ${seedProjects.length} projects.`);
  }

  // 4. Seed Tasks
  const existingTasksCount = await prisma.task.count();
  if (existingTasksCount === 0) {
    console.log('  → Seeding tasks into PostgreSQL...');
    const seedTasks = taskService.getTasks();
    for (const t of seedTasks) {
      await prisma.task.create({
        data: {
          id: t.id,
          projectId: t.projectId,
          title: t.title,
          description: t.description,
          status: (t.status.toUpperCase() === 'IN_PROGRESS'
            ? 'IN_PROGRESS'
            : t.status.toUpperCase() === 'IN_REVIEW'
            ? 'IN_REVIEW'
            : t.status.toUpperCase()) as any,
          priority: t.priority.toUpperCase() as any,
          storyPoints: t.storyPoints,
          tags: t.tags,
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
          assigneeId: t.assigneeId || null,
          creatorId: t.creatorId || null,
          qaSteps: (t.qaSteps as any) || null,
          qaVerdict: t.qaVerdict || null,
          attachments: (t.attachments as any) || null,
        },
      });
    }
    console.log(`  ✓ Seeded ${seedTasks.length} tasks.`);
  }

  // 5. Seed Bugs
  const existingBugsCount = await prisma.bug.count();
  if (existingBugsCount === 0) {
    console.log('  → Seeding bugs into PostgreSQL...');
    const seedBugs = bugService.getBugs();
    for (const b of seedBugs) {
      await prisma.bug.create({
        data: {
          id: b.id,
          projectId: b.projectId,
          title: b.title,
          description: b.description,
          severity: b.severity.toUpperCase() as any,
          status: b.status.toUpperCase() as any,
          environment: b.environment.toUpperCase() as any,
          reproductionSteps: b.reproductionSteps || '',
          expectedBehavior: b.expectedBehavior || '',
          actualBehavior: b.actualBehavior || '',
          reportedById: b.reportedById,
          assignedToId: b.assignedToId || null,
          createdAt: new Date(b.createdAt),
          updatedAt: new Date(b.updatedAt),
        },
      });
    }
    console.log(`  ✓ Seeded ${seedBugs.length} bugs.`);
  }

  // 6. Seed Channel Messages
  const existingMessagesCount = await prisma.message.count();
  if (existingMessagesCount === 0) {
    console.log('  → Seeding messages into PostgreSQL...');
    const seedChannels = dataStore.getChannels();
    for (const c of seedChannels) {
      const { messages: msgs } = dataStore.getMessagesByChannel(c.id, { limit: 1000 });
      for (const m of msgs) {
        await prisma.message.create({
          data: {
            id: m.id,
            channelId: m.channelId,
            userId: m.userId,
            ciphertext: m.ciphertext,
            iv: m.iv,
            content: m.content || null,
            createdAt: new Date(m.createdAt),
          },
        });
      }
    }
    console.log(`  ✓ Seeded messages.`);
  }

  // 7. Seed Task Comments
  const existingCommentsCount = await prisma.taskComment.count();
  if (existingCommentsCount === 0) {
    console.log('  → Seeding task comments into PostgreSQL...');
    const seedTasks = taskService.getTasks();
    for (const t of seedTasks) {
      const comments = taskCommentService.getCommentsByTask(t.id);
      for (const c of comments) {
        await prisma.taskComment.create({
          data: {
            id: c.id,
            taskId: c.taskId,
            userId: c.userId,
            content: c.content,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
          },
        });
      }
    }
    console.log(`  ✓ Seeded task comments.`);
  }

  // 8. Seed Direct Messages
  const existingDMsCount = await prisma.directMessage.count();
  if (existingDMsCount === 0) {
    console.log('  → Seeding direct messages into PostgreSQL...');
    const dms = (dmService as any).messages || [];
    for (const dm of dms) {
      await prisma.directMessage.create({
        data: {
          id: dm.id,
          senderId: dm.senderId,
          receiverId: dm.receiverId,
          ciphertext: dm.ciphertext,
          iv: dm.iv,
          senderCopy: dm.senderCopy || null,
          isRead: dm.isRead || false,
          readAt: dm.readAt ? new Date(dm.readAt) : null,
          createdAt: new Date(dm.createdAt),
        },
      });
    }
    console.log(`  ✓ Seeded direct messages.`);
  }

  const [uCount, cCount, pCount, tCount, bCount, mCount] = await Promise.all([
    prisma.user.count(),
    prisma.channel.count(),
    prisma.project.count(),
    prisma.task.count(),
    prisma.bug.count(),
    prisma.message.count(),
  ]);

  console.log(`✨ PostgreSQL ready: ${uCount} users, ${cCount} channels, ${pCount} projects, ${tCount} tasks, ${bCount} bugs, ${mCount} messages.`);
  return {
    usersCount: uCount,
    channelsCount: cCount,
    projectsCount: pCount,
    tasksCount: tCount,
    bugsCount: bCount,
    messagesCount: mCount,
  };
}

// Standalone execution support
if (process.argv[1]?.endsWith('dbSeed.ts')) {
  seedPostgres()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
