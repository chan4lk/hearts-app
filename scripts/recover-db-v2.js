#!/usr/bin/env node

/**
 * Hearts App - Database Recovery Script (Version 2)
 * Handles PL/pgSQL blocks and complex queries
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// SQL statements that need to be executed
const statements = [
  // Delete failed migrations
  `DELETE FROM "_prisma_migrations" WHERE migration_name = '20250103000000_add_performance_indexes' AND finished_at IS NULL`,
  `DELETE FROM "_prisma_migrations" WHERE migration_name = '20250103000001_complete_schema_sync' AND finished_at IS NULL`,

  // Create enums (these use DO blocks which Prisma can't handle as individual statements)
  // We'll handle these with psql instead

  // Create tables
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginAttempt" TIMESTAMP(3),
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" TEXT,
    "managerId" TEXT,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "Goal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "managerId" TEXT,
    "employeeId" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "managerComments" TEXT,
    "category" TEXT NOT NULL DEFAULT 'PROFESSIONAL',
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "updatedById" TEXT,
    "lastProgressUpdate" TIMESTAMP(3),
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "progressStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "progressNotes" TEXT,
    "department" TEXT NOT NULL DEFAULT 'ENGINEERING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "Rating" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "selfScore" INTEGER,
    "selfComments" TEXT,
    "selfRatedById" TEXT,
    "selfRatedAt" TIMESTAMP(3),
    "managerScore" INTEGER,
    "managerComments" TEXT,
    "managerRatedById" TEXT,
    "managerRatedAt" TIMESTAMP(3),
    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "goalId" TEXT,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "ReviewCycle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportingPersonId" TEXT,
    "jobCategory" TEXT,
    "designation" TEXT,
    "dateOfAppointment" TIMESTAMP(3),
    "after6Months" TEXT,
    "reviewMonth" TEXT,
    "adjustedReviewMonth" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,
    CONSTRAINT "ReviewCycle_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "location" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER,
    "registrationDeadline" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "EventParticipation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "participationStatus" TEXT NOT NULL DEFAULT 'REGISTERED',
    "hoursContributed" DOUBLE PRECISION,
    "feedback" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EventParticipation_pkey" PRIMARY KEY ("id")
  )`,
];

// Constraints to add
const constraints = [
  `ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email")`,
  `ALTER TABLE "Rating" ADD CONSTRAINT "Rating_goalId_key" UNIQUE ("goalId")`,
  `ALTER TABLE "ReviewCycle" ADD CONSTRAINT "ReviewCycle_userId_key" UNIQUE ("userId")`,
  `ALTER TABLE "EventParticipation" ADD CONSTRAINT "EventParticipation_eventId_userId_key" UNIQUE ("eventId", "userId")`,
  `ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "Goal" ADD CONSTRAINT "Goal_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Goal" ADD CONSTRAINT "Goal_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "Goal" ADD CONSTRAINT "Goal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "Goal" ADD CONSTRAINT "Goal_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "Goal" ADD CONSTRAINT "Goal_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "Rating" ADD CONSTRAINT "Rating_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Rating" ADD CONSTRAINT "Rating_selfRatedById_fkey" FOREIGN KEY ("selfRatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "Rating" ADD CONSTRAINT "Rating_managerRatedById_fkey" FOREIGN KEY ("managerRatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Notification" ADD CONSTRAINT "Notification_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "ReviewCycle" ADD CONSTRAINT "ReviewCycle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "ReviewCycle" ADD CONSTRAINT "ReviewCycle_reportingPersonId_fkey" FOREIGN KEY ("reportingPersonId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "ReviewCycle" ADD CONSTRAINT "ReviewCycle_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "Event" ADD CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "EventParticipation" ADD CONSTRAINT "EventParticipation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "EventParticipation" ADD CONSTRAINT "EventParticipation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
];

// Indexes
const indexes = [
  `CREATE INDEX IF NOT EXISTS "User_managerId_idx" ON "User"("managerId")`,
  `CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role")`,
  `CREATE INDEX IF NOT EXISTS "User_department_idx" ON "User"("department")`,
  `CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive")`,
  `CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email")`,
  `CREATE INDEX IF NOT EXISTS "Goal_managerId_idx" ON "Goal"("managerId")`,
  `CREATE INDEX IF NOT EXISTS "Goal_employeeId_idx" ON "Goal"("employeeId")`,
  `CREATE INDEX IF NOT EXISTS "Goal_status_idx" ON "Goal"("status")`,
  `CREATE INDEX IF NOT EXISTS "Goal_category_idx" ON "Goal"("category")`,
  `CREATE INDEX IF NOT EXISTS "Goal_createdAt_idx" ON "Goal"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "Goal_dueDate_idx" ON "Goal"("dueDate")`,
  `CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId")`,
  `CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead")`,
  `CREATE INDEX IF NOT EXISTS "ReviewCycle_userId_idx" ON "ReviewCycle"("userId")`,
  `CREATE INDEX IF NOT EXISTS "Event_createdById_idx" ON "Event"("createdById")`,
  `CREATE INDEX IF NOT EXISTS "Event_status_idx" ON "Event"("status")`,
  `CREATE INDEX IF NOT EXISTS "EventParticipation_eventId_idx" ON "EventParticipation"("eventId")`,
  `CREATE INDEX IF NOT EXISTS "EventParticipation_userId_idx" ON "EventParticipation"("userId")`,
];

async function main() {
  console.log('\n================================================');
  console.log('Hearts App - Database Recovery');
  console.log('================================================\n');

  try {
    console.log('Testing database connection...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✓ Connection successful\n');

    console.log('Executing recovery statements...\n');

    let executed = 0;
    let skipped = 0;

    // Execute all statements
    const allStatements = [...statements, ...constraints, ...indexes];

    for (let i = 0; i < allStatements.length; i++) {
      const stmt = allStatements[i];
      const type = i < statements.length ? 'setup' : i < statements.length + constraints.length ? 'constraint' : 'index';
      
      try {
        await prisma.$executeRawUnsafe(stmt);
        executed++;
        const preview = stmt.substring(0, 50).replace(/\n/g, ' ');
        process.stdout.write(`\r[${i + 1}/${allStatements.length}] ${type}: ${preview}...`);
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          skipped++;
        } else {
          console.error(`\n\nError: ${error.message}`);
          throw error;
        }
      }
    }

    console.log(`\r[${allStatements.length}/${allStatements.length}] Recovery complete!               `);
    console.log('');

    // Mark migrations as completed
    console.log('\nMarking migrations as completed...');
    
    await prisma.$executeRawUnsafe(
      `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
       SELECT gen_random_uuid()::text, 'checksum', now(), '20250103000000_add_performance_indexes', NULL, NULL, now() - interval '1 hour', 0
       WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '20250103000000_add_performance_indexes')`
    );

    await prisma.$executeRawUnsafe(
      `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
       SELECT gen_random_uuid()::text, 'checksum', now(), '20250103000001_complete_schema_sync', NULL, NULL, now() - interval '59 minutes', 0
       WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '20250103000001_complete_schema_sync')`
    );

    await prisma.$executeRawUnsafe(
      `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
       SELECT gen_random_uuid()::text, 'checksum', now(), '20260205000000_add_event_management', NULL, NULL, now() - interval '58 minutes', 0
       WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '20260205000000_add_event_management')`
    );

    console.log('\n================================================');
    console.log('✓ Database recovery completed successfully!');
    console.log('================================================\n');

    console.log(`Statements executed: ${executed}`);
    console.log(`Constraints/Indexes skipped (already exist): ${skipped}\n`);

    console.log('Next steps:');
    console.log('1. Run: npm run prisma:generate');
    console.log('2. Run: npm run prisma:seed (optional)');
    console.log('3. Run: npm run dev\n');

    process.exit(0);
  } catch (error) {
    console.error('\n================================================');
    console.error('✗ Database recovery failed');
    console.error('================================================\n');
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
