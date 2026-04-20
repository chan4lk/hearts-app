/**
 * One-off: for every goal where `category IS NULL`, look up a matching
 * GoalTemplate by exact `title` (within the same tenant) and copy that
 * template's `category` onto the goal.
 *
 * Safe to re-run — skips goals that already have a category, and skips
 * titles that don't exactly match a template.
 *
 * Run:
 *   npx ts-node --project prisma/tsconfig.json prisma/scripts/backfill-goal-categories.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const goalsMissingCategory = await prisma.goal.findMany({
    where: { category: null },
    select: { id: true, tenantId: true, title: true },
  });

  if (goalsMissingCategory.length === 0) {
    console.log('No goals without a category — nothing to do.');
    return;
  }

  console.log(`Found ${goalsMissingCategory.length} goal(s) without a category.\n`);

  let matched = 0;
  let skipped = 0;

  for (const goal of goalsMissingCategory) {
    const template = await prisma.goalTemplate.findFirst({
      where: {
        tenantId: goal.tenantId,
        title: goal.title,
        category: { not: null },
      },
      select: { category: true },
    });

    if (!template?.category) {
      skipped++;
      continue;
    }

    await prisma.goal.update({
      where: { id: goal.id },
      data: { category: template.category },
    });
    matched++;
    console.log(`  ✓ ${goal.title}  →  ${template.category}`);
  }

  console.log(`\nDone. Updated ${matched}, skipped ${skipped} (no matching template).`);
}

main()
  .catch((err) => {
    console.error('backfill-goal-categories failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
