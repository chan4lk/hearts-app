/**
 * Backfill `nextReviewDate` for all users who have an appointmentDate but
 * no review date yet. Default rule: nextReviewDate = appointmentDate + 6 months.
 *
 * Idempotent — safe to re-run. Users who already have a nextReviewDate
 * (manually set or previously backfilled) are left alone.
 *
 *   npx ts-node --project prisma/tsconfig.json prisma/scripts/backfill-review-dates.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function main() {
  const users = await prisma.user.findMany({
    where: {
      appointmentDate: { not: null },
      nextReviewDate: null,
    },
    select: { id: true, email: true, appointmentDate: true },
  });

  console.log(`Found ${users.length} user(s) needing review date backfill`);

  let updated = 0;
  for (const u of users) {
    const next = addMonths(u.appointmentDate!, 6);
    await prisma.user.update({
      where: { id: u.id },
      data: { nextReviewDate: next },
    });
    console.log(`  + ${u.email}: ${next.toISOString().slice(0, 10)}`);
    updated++;
  }
  console.log(`\n✅ backfilled ${updated} user(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
