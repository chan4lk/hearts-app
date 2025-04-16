import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create admin user first
    const adminPassword = await hash("admin123", 12);
    const admin = await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        email: "admin@example.com",
        name: "Admin User",
        password: adminPassword,
        role: Role.ADMIN,
      },
    });
    console.log('Created admin:', admin);

    // Create manager user
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

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 