import { projectService } from '../apps/api/src/services/projectService.js';
import { taskService } from '../apps/api/src/services/taskService.js';
import { bugService } from '../apps/api/src/services/bugService.js';
import { dataStore } from '../apps/api/src/services/dataStore.js';
import { User } from '../apps/api/src/types/index.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

async function runTests() {
  console.log('🧪 Starting Granular Project Visibility & Selected Member Access Control Tests...\n');

  const adminUser = dataStore.getUserById('u-1')!; // Alex Rivera (Admin)
  const managerUser = dataStore.getUserById('u-8')!; // Priya Patel (Manager)
  const memberInAi = dataStore.getUserById('u-2')!; // Sarah Chen (Member, in proj-ai memberIds)
  const memberInCloud = dataStore.getUserById('u-3')!; // Marcus Vance (Member, in proj-cloud memberIds)
  const regularMember = dataStore.getUserById('u-4')!; // Elena Rostova (Member, not in proj-ai or proj-cloud)

  // Test 1: Public projects are visible to all users
  console.log('--- Test 1: Public Project Visibility ---');
  const publicProjectsForElena = projectService.getProjects(regularMember).filter((p) => !p.isPrivate);
  assert(publicProjectsForElena.length >= 4, 'Elena (regular member) can see public projects');
  const coreForElena = projectService.getProjectById('proj-core', regularMember);
  assert(!!coreForElena && coreForElena.id === 'proj-core', 'Elena can fetch public project proj-core');

  // Test 2: Seed private project access (proj-ai: owner u-1, memberIds: ['u-1', 'u-2'])
  console.log('\n--- Test 2: Seed Private Project Access Control (proj-ai) ---');
  const aiForAdmin = projectService.getProjectById('proj-ai', adminUser);
  assert(!!aiForAdmin, 'Admin (u-1) can access private proj-ai');

  const aiForManager = projectService.getProjectById('proj-ai', managerUser);
  assert(!!aiForManager, 'Manager (u-8) can access private proj-ai via manager role');

  const aiForSarah = projectService.getProjectById('proj-ai', memberInAi);
  assert(!!aiForSarah, 'Member Sarah (u-2) can access private proj-ai because she is in memberIds');

  const aiForElena = projectService.getProjectById('proj-ai', regularMember);
  assert(!aiForElena, 'Member Elena (u-4) CANNOT access private proj-ai (returns undefined)');

  const elenaProjects = projectService.getProjects(regularMember);
  assert(!elenaProjects.some((p) => p.id === 'proj-ai'), 'proj-ai is not listed in Elena projects');

  // Test 3: Tasks and Bugs filtering for restricted projects
  console.log('\n--- Test 3: Task & Bug Isolation for Restricted Projects ---');
  const tasksForSarah = taskService.getTasks({ projectId: 'proj-ai' }, memberInAi);
  const tasksForElena = taskService.getTasks({ projectId: 'proj-ai' }, regularMember);
  assert(tasksForElena.length === 0, 'Elena receives 0 tasks when querying proj-ai directly');

  const bugsForElena = bugService.getBugs({ projectId: 'proj-ai' }, regularMember);
  assert(bugsForElena.length === 0, 'Elena receives 0 bugs when querying proj-ai directly');

  // Test 4: Creating a new Restricted Project with selected members
  console.log('\n--- Test 4: Creating New Restricted Project with Selected Members ---');
  const secretProject = await projectService.createProject(
    {
      name: 'Top Secret Falcon Project',
      key: 'FALCON',
      description: 'Restricted falcon engine development',
      isPrivate: true,
      memberIds: [managerUser.id, memberInCloud.id], // Manager u-8 and Marcus u-3
    },
    managerUser
  );

  assert(secretProject.isPrivate === true, 'Created project is private');
  assert(secretProject.memberIds?.includes(managerUser.id) === true, 'Creator u-8 is in memberIds');
  assert(secretProject.memberIds?.includes(memberInCloud.id) === true, 'Marcus u-3 is in memberIds');

  // Marcus (u-3) should have access
  const falconForMarcus = projectService.getProjectById(secretProject.id, memberInCloud);
  assert(!!falconForMarcus, 'Marcus (u-3) can view Top Secret Falcon Project');

  // Elena (u-4) should NOT have access
  const falconForElena = projectService.getProjectById(secretProject.id, regularMember);
  assert(!falconForElena, 'Elena (u-4) CANNOT view Top Secret Falcon Project');

  // Elena cannot create tasks in falcon project
  let elenaTaskBlocked = false;
  try {
    await taskService.createTask(
      {
        projectId: secretProject.id,
        title: 'Elena unauthorized task',
      },
      regularMember
    );
  } catch (err) {
    elenaTaskBlocked = true;
  }
  assert(elenaTaskBlocked, 'Elena is blocked from creating tasks in Top Secret Falcon Project');

  // Test 5: Dynamic Member Updates (Granting and Revoking Access)
  console.log('\n--- Test 5: Updating Selected Member Access List ---');
  // Manager updates memberIds to include Elena (u-4) and remove Marcus (u-3)
  const updatedFalcon = await projectService.updateProject(
    secretProject.id,
    {
      memberIds: [managerUser.id, regularMember.id], // u-8 and u-4
    },
    managerUser
  );

  assert(!!updatedFalcon, 'Project was successfully updated');

  // Now Elena should have access
  const falconForElenaNow = projectService.getProjectById(secretProject.id, regularMember);
  assert(!!falconForElenaNow, 'Elena (u-4) NOW HAS ACCESS after being added to memberIds');

  // Marcus should NO LONGER have access
  const falconForMarcusNow = projectService.getProjectById(secretProject.id, memberInCloud);
  assert(!falconForMarcusNow, 'Marcus (u-3) NO LONGER HAS ACCESS after being removed from memberIds');

  // Test 6: Member count enrichment
  console.log('\n--- Test 6: Member Count Calculation ---');
  assert(updatedFalcon.memberCount === 2, `Member count is correctly reported as 2 (actual: ${updatedFalcon.memberCount})`);

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! Granular Project Visibility is fully verified.\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
