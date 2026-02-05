#!/usr/bin/env node

/**
 * Hearts App - Database Seeding Script
 * Adds sample data to the database
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Simple password hash for demo purposes
// In production, use bcrypt!
async function main() {
  console.log('\n================================================');
  console.log('Hearts App - Database Seeding');
  console.log('================================================\n');

  try {
    // Check if data already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (existingAdmin) {
      console.log('✓ Sample data already exists');
      console.log('Skipping seeding...\n');
      process.exit(0);
    }

    console.log('Creating sample users...');

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: 'hashed_admin123', // This would be bcrypt hashed in real app
        role: 'ADMIN',
      }
    });
    console.log(`  ✓ Admin: ${admin.email}`);

    // Create manager user
    const manager = await prisma.user.create({
      data: {
        email: 'manager@example.com',
        name: 'Manager User',
        password: 'hashed_manager123',
        role: 'MANAGER',
      }
    });
    console.log(`  ✓ Manager: ${manager.email}`);

    // Create employee user
    const employee = await prisma.user.create({
      data: {
        email: 'employee@example.com',
        name: 'Employee User',
        password: 'hashed_employee123',
        role: 'EMPLOYEE',
        managerId: manager.id,
      }
    });
    console.log(`  ✓ Employee: ${employee.email}`);

    console.log('\nCreating sample events...');

    // Create sample events
    const event1 = await prisma.event.create({
      data: {
        title: 'Toastmasters Meeting',
        description: 'Monthly toastmasters public speaking event',
        eventType: 'TOASTMASTERS',
        location: 'Conference Room A',
        startDate: new Date('2026-02-15T10:00:00Z'),
        endDate: new Date('2026-02-15T11:30:00Z'),
        registrationDeadline: new Date('2026-02-14T23:59:59Z'),
        capacity: 50,
        createdById: admin.id,
      }
    });
    console.log(`  ✓ Event: ${event1.title}`);

    const event2 = await prisma.event.create({
      data: {
        title: 'Code Crunch Workshop',
        description: 'Competitive coding workshop',
        eventType: 'CODECRUNCH',
        location: 'Dev Lab',
        startDate: new Date('2026-02-20T14:00:00Z'),
        endDate: new Date('2026-02-20T16:00:00Z'),
        registrationDeadline: new Date('2026-02-19T23:59:59Z'),
        capacity: 30,
        createdById: admin.id,
      }
    });
    console.log(`  ✓ Event: ${event2.title}`);

    console.log('\nAdding event participations...');

    // Add employee participation
    const participation = await prisma.eventParticipation.create({
      data: {
        eventId: event1.id,
        userId: employee.id,
        participationStatus: 'REGISTERED',
      }
    });
    console.log(`  ✓ ${employee.name} registered for ${event1.title}`);

    console.log('\n================================================');
    console.log('✓ Database seeding completed successfully!');
    console.log('================================================\n');

    console.log('Sample credentials:');
    console.log('  Admin:    admin@example.com');
    console.log('  Manager:  manager@example.com');
    console.log('  Employee: employee@example.com\n');

    console.log('Next step:');
    console.log('Run: npm run dev\n');

    process.exit(0);
  } catch (error) {
    console.error('\n================================================');
    console.error('✗ Seeding failed');
    console.error('================================================\n');
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
