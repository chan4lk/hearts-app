import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const TENANT_ID = 'bistec-global';

async function main() {
  try {
    // Create admin user
    const adminPassword = await hash("admin123", 12);
    const admin = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: TENANT_ID, email: "admin@example.com" } },
      update: {},
      create: {
        tenantId: TENANT_ID,
        email: "admin@example.com",
        name: "Admin User",
        password: adminPassword,
        role: Role.ADMIN,
        department: "Management",
        position: "System Administrator",
      },
    });
    console.log('Created admin:', admin.name);

    // Create manager 1
    const managerPassword = await hash("manager123", 12);
    const manager1 = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: TENANT_ID, email: "manager@example.com" } },
      update: {},
      create: {
        tenantId: TENANT_ID,
        email: "manager@example.com",
        name: "Marcus Chen",
        password: managerPassword,
        role: Role.MANAGER,
        department: "Engineering",
        position: "Engineering Manager",
      },
    });
    console.log('Created manager:', manager1.name);

    // Create manager 2
    const manager2 = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: TENANT_ID, email: "manager2@example.com" } },
      update: {},
      create: {
        tenantId: TENANT_ID,
        email: "manager2@example.com",
        name: "Priya Sharma",
        password: await hash("manager123", 12),
        role: Role.MANAGER,
        department: "Product",
        position: "Product Manager",
      },
    });
    console.log('Created manager:', manager2.name);

    // Create employees under manager 1
    const employees = [
      { email: "arun@example.com", name: "Arun Patel", department: "Engineering", position: "Junior Developer" },
      { email: "sarah@example.com", name: "Sarah Kim", department: "Engineering", position: "Senior Developer" },
      { email: "david@example.com", name: "David Lee", department: "Engineering", position: "DevOps Engineer" },
    ];

    for (const emp of employees) {
      const user = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: TENANT_ID, email: emp.email } },
        update: {},
        create: {
          tenantId: TENANT_ID,
          email: emp.email,
          name: emp.name,
          password: await hash("employee123", 12),
          role: Role.EMPLOYEE,
          department: emp.department,
          position: emp.position,
          managerId: manager1.id,
        },
      });
      console.log('Created employee:', user.name, '→ manager:', manager1.name);
    }

    // Create employees under manager 2
    const employees2 = [
      { email: "lisa@example.com", name: "Lisa Wang", department: "Product", position: "UX Designer" },
      { email: "mike@example.com", name: "Mike Johnson", department: "Product", position: "Product Analyst" },
    ];

    for (const emp of employees2) {
      const user = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: TENANT_ID, email: emp.email } },
        update: {},
        create: {
          tenantId: TENANT_ID,
          email: emp.email,
          name: emp.name,
          password: await hash("employee123", 12),
          role: Role.EMPLOYEE,
          department: emp.department,
          position: emp.position,
          managerId: manager2.id,
        },
      });
      console.log('Created employee:', user.name, '→ manager:', manager2.name);
    }

    // Seed company values
    const values = ['Innovation', 'Teamwork', 'Ownership'];
    for (const name of values) {
      const value = await prisma.companyValue.upsert({
        where: { tenantId_name: { tenantId: TENANT_ID, name } },
        update: {},
        create: {
          tenantId: TENANT_ID,
          name,
          isActive: true,
        },
      });
      console.log('Created company value:', value.name);
    }

    console.log('\nDatabase seeded successfully!');
    console.log('Tenant:', TENANT_ID);
    console.log('Users: 1 admin, 2 managers, 5 employees');
    console.log('Company Values: Innovation, Teamwork, Ownership');
    console.log('\nTest credentials:');
    console.log('  Admin:    admin@example.com / admin123');
    console.log('  Manager:  manager@example.com / manager123');
    console.log('  Employee: arun@example.com / employee123');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
