import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const TENANT_ID = 'bistec-global';

async function main() {
  try {
    console.log('Clearing all existing data...');

    await prisma.goalComment.deleteMany({});
    await prisma.goal.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.reviewCycle.deleteMany({});
    await prisma.eventParticipation.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.heart.deleteMany({});
    await prisma.companyValue.deleteMany({});
    await prisma.goalTemplate.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.emailNotification.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('Database cleared.\n');

    const admin = await prisma.user.create({
      data: {
        tenantId: TENANT_ID,
        email: 'admin@example.com',
        name: 'Admin User',
        password: await hash('admin123', 12),
        role: Role.ADMIN,
        department: 'Management',
        position: 'System Administrator',
        isActive: true,
      },
    });
    console.log('Created ADMIN   :', admin.email);

    const manager = await prisma.user.create({
      data: {
        tenantId: TENANT_ID,
        email: 'manager@example.com',
        name: 'Manager User',
        password: await hash('manager123', 12),
        role: Role.MANAGER,
        department: 'Engineering',
        position: 'Engineering Manager',
        isActive: true,
      },
    });
    console.log('Created MANAGER :', manager.email);

    const employee = await prisma.user.create({
      data: {
        tenantId: TENANT_ID,
        email: 'employee@example.com',
        name: 'Employee User',
        password: await hash('employee123', 12),
        role: Role.EMPLOYEE,
        department: 'Engineering',
        position: 'Software Engineer',
        managerId: manager.id,
        isActive: true,
      },
    });
    console.log('Created EMPLOYEE:', employee.email, '→ manager:', manager.email);

    const companyValues = ['Innovation', 'Teamwork', 'Ownership', 'Customer Focus', 'Excellence'];
    for (const name of companyValues) {
      await prisma.companyValue.create({
        data: { tenantId: TENANT_ID, name, isActive: true },
      });
    }
    console.log('\nCreated company values:', companyValues.length);

    const goalTemplates = [
      { title: 'Deliver Sprint Commitments', description: 'Complete all committed user stories within the sprint with passing tests and code review approval.', category: 'Engineering' },
      { title: 'Reduce Production Bugs', description: 'Reduce production defects in your module by 30% this quarter through better unit test coverage and code review participation.', category: 'Quality' },
      { title: 'Code Review Participation', description: 'Review at least 3 pull requests per week with constructive, actionable feedback that improves code quality.', category: 'Engineering' },
      { title: 'Improve Unit Test Coverage', description: 'Increase unit test coverage in your service/module from current baseline to at least 80%.', category: 'Quality' },
      { title: 'Learn a New Technology', description: 'Complete a certification or deliver a working proof-of-concept in a technology relevant to upcoming roadmap work.', category: 'Learning' },
      { title: 'Technical Documentation', description: 'Create or update technical documentation (architecture, runbooks, onboarding) for one of your team\'s key systems.', category: 'Knowledge' },
      { title: 'Mentor a Team Member', description: 'Mentor a junior engineer through weekly 1:1s and pair programming; track their growth against agreed learning goals.', category: 'Leadership' },
      { title: 'Improve Client/Customer Satisfaction', description: 'Achieve a client satisfaction score of 4.5+ on features and deliverables you own this quarter.', category: 'Customer' },
      { title: 'Process Improvement', description: 'Identify and implement one engineering process improvement (CI/CD, release, QA, standups) that saves the team at least 2 hours per week.', category: 'Efficiency' },
      { title: 'Security Best Practices', description: 'Complete security training (OWASP Top 10) and implement at least 2 security improvements (auth, input validation, secrets management) in your codebase.', category: 'Security' },
      { title: 'Cross-Team Collaboration', description: 'Lead or actively contribute to at least one cross-team initiative (platform, shared library, architecture guild) this quarter.', category: 'Collaboration' },
      { title: 'Reduce Technical Debt', description: 'Identify 3 high-impact tech-debt items and resolve them without regressing existing features.', category: 'Engineering' },
      { title: 'Improve System Performance', description: 'Identify and fix at least one performance bottleneck (API latency, DB query, frontend render) with measurable before/after metrics.', category: 'Performance' },
      { title: 'Client Demo Readiness', description: 'Deliver clean, working client demos for every sprint review with zero showstopper issues.', category: 'Customer' },
      { title: 'On-Call / Incident Response', description: 'Maintain on-call readiness: respond within SLA, write postmortems for Sev1/Sev2 incidents, and land at least one preventive fix.', category: 'Operations' },
    ];

    for (const t of goalTemplates) {
      await prisma.goalTemplate.create({
        data: { tenantId: TENANT_ID, ...t, isActive: true },
      });
    }
    console.log('Created goal templates:', goalTemplates.length);

    console.log('\nDatabase seeded successfully.');
    console.log('Tenant:', TENANT_ID);
    console.log('\nTest credentials:');
    console.log('  Admin    : admin@example.com    / admin123');
    console.log('  Manager  : manager@example.com  / manager123');
    console.log('  Employee : employee@example.com / employee123');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
