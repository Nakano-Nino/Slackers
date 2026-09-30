import { prisma } from '../services/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { MongoClient } from 'mongodb';

interface KeyVaultData {
  publicKey: string;
  encryptedPrivateKey: string;
  keyVaultSalt: string;
  keyVaultIv: string;
}

function generateKeyVault(password: string): KeyVaultData {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const pubJwk = publicKey.export({ format: 'jwk' });
  const privJwk = privateKey.export({ format: 'jwk' });

  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);

  const vaultKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const cipher = crypto.createCipheriv('aes-256-gcm', vaultKey, iv);
  const plaintext = JSON.stringify(privJwk);
  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final(), cipher.getAuthTag()]);

  return {
    publicKey: JSON.stringify(pubJwk),
    encryptedPrivateKey: encrypted.toString('base64'),
    keyVaultSalt: salt.toString('base64'),
    keyVaultIv: iv.toString('base64'),
  };
}

async function main() {
  console.log('🔄 Connecting to PostgreSQL (Supabase)...');

  try {
    await prisma.$connect();
    console.log('✓ Connected to PostgreSQL.');

    // 1. Delete all relational data in correct dependency order
    console.log('🗑️  Emptying PostgreSQL tables...');
    await prisma.webhookLog.deleteMany();
    await prisma.webhook.deleteMany();
    await prisma.automationRule.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.taskComment.deleteMany();
    await prisma.bug.deleteMany();
    await prisma.task.deleteMany();
    await prisma.directMessage.deleteMany();
    await prisma.message.deleteMany();
    await prisma.channelKey.deleteMany();
    await prisma.channelMember.deleteMany();
    await prisma.channel.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    console.log('✓ All PostgreSQL tables are now completely empty.');

    // 2. Clear MongoDB activity/server logs if connected
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/slackers_logs';
    try {
      console.log('🍃 Checking MongoDB logs at', mongoUri);
      const mongo = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 2000 });
      await mongo.connect();
      const db = mongo.db('slackers_logs');
      await db.collection('activity_logs').deleteMany({});
      console.log('✓ Cleared MongoDB activity_logs.');
      await mongo.close();
    } catch {
      console.log('ℹ️  MongoDB not running or unreachable; skipping MongoDB log purge.');
    }

    // 3. Create ONE account with highest authority
    console.log('👑 Creating highest-authority Superadmin account...');
    const adminPassword = 'password123';
    const passwordHash = bcrypt.hashSync(adminPassword, 10);
    const vault = generateKeyVault(adminPassword);

    const adminUser = await prisma.user.create({
      data: {
        id: 'u-root-admin',
        name: 'Super Admin',
        email: 'admin@slackers.dev',
        passwordHash,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'ADMIN',
        developerRole: 'lead_architect',
        status: 'ONLINE',
        publicKey: vault.publicKey,
        encryptedPrivateKey: vault.encryptedPrivateKey,
        keyVaultSalt: vault.keyVaultSalt,
        keyVaultIv: vault.keyVaultIv,
      },
    });
    console.log(`✓ Created admin user: ${adminUser.name} (${adminUser.email}) [ID: ${adminUser.id}]`);

    // 4. Create one initial default channel so workspace UI is ready
    const generalChannel = await prisma.channel.create({
      data: {
        id: 'c-general',
        name: 'general',
        description: 'Company-wide announcements and discussion',
        isPrivate: false,
      },
    });
    await prisma.channelMember.create({
      data: {
        channelId: generalChannel.id,
        userId: adminUser.id,
        role: 'ADMIN',
      },
    });
    console.log(`✓ Created default #${generalChannel.name} channel.`);

    // 5. Create one initial default project
    const defaultProject = await prisma.project.create({
      data: {
        id: 'proj-core',
        name: 'Core Workspace',
        key: 'CORE',
        description: 'Main workspace and project tracking',
        isPrivate: false,
        ownerId: adminUser.id,
        memberIds: [adminUser.id],
      },
    });
    await prisma.projectMember.create({
      data: {
        projectId: defaultProject.id,
        userId: adminUser.id,
        role: 'ADMIN',
      },
    });
    console.log(`✓ Created default project: [${defaultProject.key}] ${defaultProject.name}.`);

    // 6. Verification counts
    const userCount = await prisma.user.count();
    const channelCount = await prisma.channel.count();
    const projectCount = await prisma.project.count();
    const messageCount = await prisma.message.count();

    console.log('\n📊 Database Reset Summary:');
    console.log(`   - Users in DB:    ${userCount} (only superadmin)`);
    console.log(`   - Channels in DB: ${channelCount}`);
    console.log(`   - Projects in DB: ${projectCount}`);
    console.log(`   - Messages in DB: ${messageCount}`);
    console.log('\n🔑 Login Credentials:');
    console.log(`   Email:    ${adminUser.email}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role:     ADMIN (Highest Authority / Superuser)`);
  } catch (err) {
    console.error('❌ Error during database reset:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
