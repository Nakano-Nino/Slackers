import dotenv from 'dotenv';
dotenv.config({ path: './apps/api/.env' });

import assert from 'assert';
import { prisma, checkPostgresHealth } from '../apps/api/src/services/db.js';
import { mongoLogger } from '../apps/api/src/services/mongoLogger.js';

async function runTest() {
  console.log('--- 1. Testing PostgreSQL Integration ---');
  const pgHealth = await checkPostgresHealth();
  console.log('PostgreSQL Health:', pgHealth);
  assert.strictEqual(pgHealth.status, 'connected', 'PostgreSQL should report connected');
  assert.strictEqual(pgHealth.database, 'slackers', 'PostgreSQL database should be slackers');
  assert(typeof pgHealth.latencyMs === 'number', 'Latency should be a number');

  const usersCount = await prisma.user.count();
  console.log(`✓ PostgreSQL users count: ${usersCount}`);
  assert(usersCount >= 10, 'Should have at least 10 users in PostgreSQL');

  const projectsCount = await prisma.project.count();
  console.log(`✓ PostgreSQL projects count: ${projectsCount}`);
  assert(projectsCount >= 5, 'Should have at least 5 projects in PostgreSQL');

  const tasksCount = await prisma.task.count();
  console.log(`✓ PostgreSQL tasks count: ${tasksCount}`);
  assert(tasksCount >= 10, 'Should have at least 10 tasks in PostgreSQL');

  // Verify Sarah Connor in PostgreSQL
  const sarah = await prisma.user.findUnique({ where: { email: 'sarah@slackers.dev' } });
  assert(sarah, 'Sarah should exist in PostgreSQL');
  console.log(`✓ Verified user in PostgreSQL: ${sarah.name} (${sarah.developerRole})`);

  console.log('\n--- 2. Testing MongoDB Integration ---');
  // Log a test action
  const testId = `test-${Date.now()}`;
  await mongoLogger.log(
    'TASK_CREATED',
    { testId, message: 'Automated DB integration test log' },
    { id: sarah.id, name: sarah.name }
  );
  console.log('✓ Logged test activity to MongoDB');

  const mongoHealth = await mongoLogger.checkMongoHealth();
  console.log('MongoDB Health:', mongoHealth);
  assert.strictEqual(mongoHealth.status, 'connected', 'MongoDB should report connected');
  assert.strictEqual(mongoHealth.database, 'slackers_logs', 'MongoDB database should be slackers_logs');
  assert(typeof mongoHealth.latencyMs === 'number', 'Latency should be a number');
  assert((mongoHealth.documentsCount ?? 0) >= 1, 'MongoDB should have at least 1 log document');

  const recentLogs = await mongoLogger.getRecentLogs(5);
  const foundLog = recentLogs.find((l) => (l.details as any)?.testId === testId);
  assert(foundLog, 'Inserted test log must be found in MongoDB');
  console.log('✓ Successfully retrieved logged entry from MongoDB:', foundLog.action);

  console.log('\n=========================================');
  console.log(' DATABASE INTEGRATION TESTS ALL PASSED! ');
  console.log('=========================================');

  await prisma.$disconnect();
  process.exit(0);
}

runTest().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
