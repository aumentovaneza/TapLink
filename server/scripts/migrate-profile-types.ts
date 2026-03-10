import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BATCH_SIZE = 100;

const TEMPLATE_TYPE_TO_PROFILE_TYPE: Record<string, string> = {
  individual: "ITEMS",
  items: "ITEMS",
  pet: "PETS",
  pets: "PETS",
  business: "BUSINESS",
  cafe: "BUSINESS",
  creator: "CREATOR",
  musician: "CREATOR",
  event: "EVENT",
};

async function migrateTags(): Promise<number> {
  let totalUpdated = 0;
  let cursor: string | undefined;

  console.log("--- Migrating tags ---");

  while (true) {
    const tags = await prisma.tag.findMany({
      where: {
        profileType: null,
        profile: { isNot: null },
      },
      select: {
        id: true,
        profile: {
          select: { templateType: true },
        },
      },
      take: BATCH_SIZE,
      ...(cursor
        ? { skip: 1, cursor: { id: cursor } }
        : {}),
      orderBy: { id: "asc" },
    });

    if (tags.length === 0) break;

    for (const tag of tags) {
      const templateType = tag.profile?.templateType?.toLowerCase();
      if (!templateType) continue;

      const profileType = TEMPLATE_TYPE_TO_PROFILE_TYPE[templateType];
      if (!profileType) {
        console.warn(
          `  Skipping tag ${tag.id}: unknown templateType "${templateType}"`
        );
        continue;
      }

      await prisma.tag.update({
        where: { id: tag.id },
        data: { profileType: profileType as any },
      });

      totalUpdated++;
    }

    cursor = tags[tags.length - 1].id;
    console.log(`  Processed batch, ${totalUpdated} tags updated so far...`);
  }

  return totalUpdated;
}

async function migrateOrders(): Promise<number> {
  let totalUpdated = 0;
  let cursor: string | undefined;

  console.log("--- Migrating orders ---");

  while (true) {
    const orders = await prisma.order.findMany({
      where: {
        profileType: null,
        profile: { isNot: null },
      },
      select: {
        id: true,
        profile: {
          select: { templateType: true },
        },
      },
      take: BATCH_SIZE,
      ...(cursor
        ? { skip: 1, cursor: { id: cursor } }
        : {}),
      orderBy: { id: "asc" },
    });

    if (orders.length === 0) break;

    for (const order of orders) {
      const templateType = order.profile?.templateType?.toLowerCase();
      if (!templateType) continue;

      const profileType = TEMPLATE_TYPE_TO_PROFILE_TYPE[templateType];
      if (!profileType) {
        console.warn(
          `  Skipping order ${order.id}: unknown templateType "${templateType}"`
        );
        continue;
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { profileType: profileType as any },
      });

      totalUpdated++;
    }

    cursor = orders[orders.length - 1].id;
    console.log(`  Processed batch, ${totalUpdated} orders updated so far...`);
  }

  return totalUpdated;
}

async function migrateCafeProfiles(): Promise<number> {
  let totalUpdated = 0;
  let cursor: string | undefined;

  console.log("--- Migrating cafe profiles (setting businessCategory) ---");

  while (true) {
    const profiles = await prisma.profile.findMany({
      where: {
        templateType: "cafe",
      },
      select: {
        id: true,
        fields: true,
      },
      take: BATCH_SIZE,
      ...(cursor
        ? { skip: 1, cursor: { id: cursor } }
        : {}),
      orderBy: { id: "asc" },
    });

    if (profiles.length === 0) break;

    for (const profile of profiles) {
      const fields =
        (profile.fields as Record<string, unknown>) ?? {};

      // Skip if businessCategory is already set
      if (fields.businessCategory) {
        continue;
      }

      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          fields: { ...fields, businessCategory: "cafe_restaurant" },
        },
      });

      totalUpdated++;
    }

    cursor = profiles[profiles.length - 1].id;
    console.log(
      `  Processed batch, ${totalUpdated} cafe profiles updated so far...`
    );
  }

  return totalUpdated;
}

async function main() {
  console.log("Starting profile type migration...\n");

  const tagsUpdated = await migrateTags();
  const ordersUpdated = await migrateOrders();
  const cafeProfilesUpdated = await migrateCafeProfiles();

  console.log("\n=== Migration Summary ===");
  console.log(`  Tags updated:          ${tagsUpdated}`);
  console.log(`  Orders updated:        ${ordersUpdated}`);
  console.log(`  Cafe profiles updated: ${cafeProfilesUpdated}`);
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
