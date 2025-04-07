const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  try {
    // Create admin user
    const adminPassword = await hash("admin123", 12);
    const admin = await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        email: "admin@example.com",
        name: "Admin User",
        password: adminPassword,
        role: "ADMIN",
      },
    });

    // Create manager user
    const managerPassword = await hash("manager123", 12);
    const manager = await prisma.user.upsert({
      where: { email: "manager@example.com" },
      update: {},
      create: {
        email: "manager@example.com",
        name: "Manager User",
        password: managerPassword,
        role: "MANAGER",
      },
    });

    // Create employee user
    const employeePassword = await hash("employee123", 12);
    const employee = await prisma.user.upsert({
      where: { email: "employee@example.com" },
      update: {},
      create: {
        email: "employee@example.com",
        name: "Employee User",
        password: employeePassword,
        role: "EMPLOYEE",
      },
    });

    console.log({ admin, manager, employee });
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 