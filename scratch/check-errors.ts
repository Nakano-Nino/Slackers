import { mongoLogger } from '../apps/api/src/services/mongoLogger.js';
import { bugService } from '../apps/api/src/services/bugService.js';
import { dataStore } from '../apps/api/src/services/dataStore.js';
import { redisService } from '../apps/api/src/services/redisService.js';
import { s3Service } from '../apps/api/src/services/s3Service.js';

async function check() {
  console.log('=== Checking Application State & Errors ===\n');

  const admin = dataStore.getUserById('u-1');
  const bugs = bugService.getBugs({}, admin);
  console.log('--- Active Bug Reports ---');
  bugs.forEach(b => console.log(`[${b.severity.toUpperCase()}] ${b.title} (Status: ${b.status}, Project: ${b.projectId})`));

  console.log('\n--- Recent Activity Logs from MongoDB ---');
  const logs = await mongoLogger.getRecentLogs(50);
  console.log(`Total retrieved logs: ${logs.length}`);
  const errorLogs = logs.filter(l => l.level === 'error' || l.action.includes('ERROR') || (l.details as any)?.error);
  console.log(`Total error entries: ${errorLogs.length}`);
  errorLogs.forEach(l => console.log(`[${l.timestamp}] ${l.action}:`, JSON.stringify(l.details)));

  console.log('\n--- S3 Object Storage Health ---');
  const s3 = await s3Service.checkHealth();
  console.log(JSON.stringify(s3, null, 2));

  console.log('\n--- Redis Health ---');
  const redis = await redisService.checkHealth();
  console.log(JSON.stringify(redis, null, 2));

  redisService.disconnect();
  process.exit(0);
}

check().catch(err => {
  console.error('Check failed:', err);
  redisService.disconnect();
  process.exit(1);
});
