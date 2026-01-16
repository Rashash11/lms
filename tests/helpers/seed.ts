import fs from 'node:fs';
import path from 'node:path';

export interface SeedFixtures {
    tenantAId: string;
    tenantBId: string;
    nodeAId: string;
    nodeBId: string;
    nodeCId: string;
    adminAId: string;
    adminAEmail: string;
    superInstructorAId: string;
    superInstructorAEmail: string;
    instructorAId: string;
    instructorAEmail: string;
    learnerAId: string;
    learnerAEmail: string;
    learnerBId: string;
    learnerBEmail: string;
    adminBId: string;
    adminBEmail: string;
    categoryAId: string;
    groupAId: string;
    courseAId: string;
    courseBId: string;
    sectionAId: string;
    unitVideoId: string;
    unitDocumentId: string;
    unitQuizId: string;
    lpAId: string;
    enrollmentAId: string;
    lpEnrollmentAId: string;
    assignmentAId: string;
    submissionAId: string;
    skillAId: string;
    conferenceAId: string;
    calendarEventAId: string;
    notificationAId: string;
    automationAId: string;
    testPassword: string;
}

export function loadE2ESeedFixtures(rootDir = process.cwd()): SeedFixtures {
    const fixturesPath = path.join(rootDir, 'tests', 'e2e', 'fixtures', 'seed.json');
    if (!fs.existsSync(fixturesPath)) {
        throw new Error(`Missing seed fixtures at ${fixturesPath}. Run npm run test:setup`);
    }
    return JSON.parse(fs.readFileSync(fixturesPath, 'utf-8')) as SeedFixtures;
}

