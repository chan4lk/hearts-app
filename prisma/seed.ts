import { PrismaClient, Role, GoalStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create manager user first
    const managerPassword = await hash("manager123", 12);
    const manager = await prisma.user.upsert({
      where: { email: "manager@example.com" },
      update: {},
      create: {
        email: "manager@example.com",
        name: "Manager User",
        password: managerPassword,
        role: Role.MANAGER,
      },
    });
    console.log('Created manager:', manager);

    // Create employee user with manager relationship
    const employeePassword = await hash("employee123", 12);
    const employee = await prisma.user.upsert({
      where: { email: "employee@example.com" },
      update: {
        managerId: manager.id, // Update existing employee to have this manager
      },
      create: {
        email: "employee@example.com",
        name: "Employee User",
        password: employeePassword,
        role: Role.EMPLOYEE,
        managerId: manager.id, // Set the manager relationship
      },
    });
    console.log('Created employee:', employee);

    // Create some approved goals for the employee
    const goals = await Promise.all([
      prisma.goal.create({
        data: {
          title: "Complete Project A",
          description: "Implement core features for Project A",
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: GoalStatus.APPROVED,
          employeeId: employee.id,
          managerId: manager.id,
        },
      }),
      prisma.goal.create({
        data: {
          title: "Learn New Technology",
          description: "Master React and Next.js framework",
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          status: GoalStatus.APPROVED,
          employeeId: employee.id,
          managerId: manager.id,
        },
      }),
    ]);
    console.log('Created goals:', goals);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 