import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.adminSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      platformName: "TapLink",
      supportEmail: "support@taplink.io",
      platformUrl: "https://taplink.io",
      maxProfilesPerUser: 10,
      maintenanceMode: false,
      config: {
        notifications: {
          newUser: true,
          tagClaimed: true,
          dailySummary: true,
        },
      },
    },
  });

  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  const userPasswordHash = await bcrypt.hash("Password123!", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@taplink.io" },
    update: {
      name: "TapLink Admin",
      role: "ADMIN",
      passwordHash: adminPasswordHash,
    },
    create: {
      name: "TapLink Admin",
      email: "admin@taplink.io",
      role: "ADMIN",
      passwordHash: adminPasswordHash,
    },
  });

  const alexUser = await prisma.user.upsert({
    where: { email: "alex@taplink.io" },
    update: {
      name: "Alex Rivera",
      role: "USER",
      passwordHash: userPasswordHash,
    },
    create: {
      name: "Alex Rivera",
      email: "alex@taplink.io",
      role: "USER",
      passwordHash: userPasswordHash,
    },
  });

  const sarahUser = await prisma.user.upsert({
    where: { email: "sarah@taplink.io" },
    update: {
      name: "Sarah Chen",
      role: "USER",
      passwordHash: userPasswordHash,
    },
    create: {
      name: "Sarah Chen",
      email: "sarah@taplink.io",
      role: "USER",
      passwordHash: userPasswordHash,
    },
  });

  const alexProfile = await prisma.profile.upsert({
    where: { slug: "alex-rivera" },
    update: {
      ownerId: alexUser.id,
      templateType: "individual",
      theme: "wave",
      palette: "original",
      showGraphic: true,
      photoUrl:
        "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      fields: {
        name: "Alex Rivera",
        title: "Product Designer",
        company: "Designly Studio",
        location: "San Francisco, CA",
        bio: "Creating digital experiences that people love.",
      },
    },
    create: {
      slug: "alex-rivera",
      ownerId: alexUser.id,
      templateType: "individual",
      theme: "wave",
      palette: "original",
      showGraphic: true,
      photoUrl:
        "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      fields: {
        name: "Alex Rivera",
        title: "Product Designer",
        company: "Designly Studio",
        location: "San Francisco, CA",
        bio: "Creating digital experiences that people love.",
      },
    },
  });

  const sarahProfile = await prisma.profile.upsert({
    where: { slug: "sarah-chen" },
    update: {
      ownerId: sarahUser.id,
      templateType: "individual",
      theme: "sunset",
      palette: "original",
      showGraphic: true,
      photoUrl:
        "https://images.unsplash.com/photo-1762522921456-cdfe882d36c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      fields: {
        name: "Sarah Chen",
        title: "UX Researcher",
        company: "DesignLab",
        location: "New York, NY",
        bio: "Research-led product strategy and user experience.",
      },
    },
    create: {
      slug: "sarah-chen",
      ownerId: sarahUser.id,
      templateType: "individual",
      theme: "sunset",
      palette: "original",
      showGraphic: true,
      photoUrl:
        "https://images.unsplash.com/photo-1762522921456-cdfe882d36c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      fields: {
        name: "Sarah Chen",
        title: "UX Researcher",
        company: "DesignLab",
        location: "New York, NY",
        bio: "Research-led product strategy and user experience.",
      },
    },
  });

  const alexWorkProfile = await prisma.profile.upsert({
    where: { slug: "alex-rivera-work" },
    update: {
      ownerId: alexUser.id,
      templateType: "individual",
      theme: "ocean",
      palette: "original",
      showGraphic: true,
      photoUrl:
        "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      fields: {
        name: "Alex Rivera - Work",
        title: "Product Designer",
        company: "Designly Studio",
        location: "San Francisco, CA",
        bio: "Work profile for networking and client outreach.",
      },
    },
    create: {
      slug: "alex-rivera-work",
      ownerId: alexUser.id,
      templateType: "individual",
      theme: "ocean",
      palette: "original",
      showGraphic: true,
      photoUrl:
        "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      fields: {
        name: "Alex Rivera - Work",
        title: "Product Designer",
        company: "Designly Studio",
        location: "San Francisco, CA",
        bio: "Work profile for networking and client outreach.",
      },
    },
  });

  await prisma.profileLink.deleteMany({ where: { profileId: alexProfile.id } });
  await prisma.profileLink.createMany({
    data: [
      { profileId: alexProfile.id, position: 0, type: "linkedin", label: "LinkedIn", url: "https://linkedin.com/in/alexrivera" },
      { profileId: alexProfile.id, position: 1, type: "website", label: "Portfolio", url: "https://alexrivera.design" },
      { profileId: alexProfile.id, position: 2, type: "email", label: "Email Me", url: "mailto:alex@taplink.io" },
    ],
  });

  await prisma.profileLink.deleteMany({ where: { profileId: sarahProfile.id } });
  await prisma.profileLink.createMany({
    data: [
      { profileId: sarahProfile.id, position: 0, type: "linkedin", label: "LinkedIn", url: "https://linkedin.com/in/sarahchen" },
      { profileId: sarahProfile.id, position: 1, type: "website", label: "Website", url: "https://sarahchen.co" },
      { profileId: sarahProfile.id, position: 2, type: "email", label: "Email", url: "mailto:sarah@taplink.io" },
    ],
  });

  await prisma.profileLink.deleteMany({ where: { profileId: alexWorkProfile.id } });
  await prisma.profileLink.createMany({
    data: [
      { profileId: alexWorkProfile.id, position: 0, type: "linkedin", label: "LinkedIn", url: "https://linkedin.com/in/alexrivera" },
      { profileId: alexWorkProfile.id, position: 1, type: "website", label: "Work Portfolio", url: "https://alexrivera.design/work" },
      { profileId: alexWorkProfile.id, position: 2, type: "email", label: "Business Email", url: "mailto:work@taplink.io" },
    ],
  });

  const tag1 = await prisma.tag.upsert({
    where: { code: "tag-001" },
    update: {
      uid: "04:A3:F2:1B:9E:2C",
      ownerId: alexUser.id,
      profileId: alexProfile.id,
      status: "ACTIVE",
      claimCode: null,
    },
    create: {
      code: "tag-001",
      uid: "04:A3:F2:1B:9E:2C",
      ownerId: alexUser.id,
      profileId: alexProfile.id,
      status: "ACTIVE",
      claimCode: null,
    },
  });

  await prisma.tag.upsert({
    where: { code: "tag-002" },
    update: {
      uid: "04:C7:D1:8A:3F:11",
      status: "UNCLAIMED",
      ownerId: null,
      profileId: null,
      claimCode: "TAPX42",
      taps: 0,
      lastTapAt: null,
    },
    create: {
      code: "tag-002",
      uid: "04:C7:D1:8A:3F:11",
      status: "UNCLAIMED",
      claimCode: "TAPX42",
      taps: 0,
    },
  });

  await prisma.tag.upsert({
    where: { code: "TL-001" },
    update: {
      uid: "04:B5:E9:4C:7D:55",
      ownerId: alexUser.id,
      profileId: alexWorkProfile.id,
      status: "ACTIVE",
      claimCode: null,
    },
    create: {
      code: "TL-001",
      uid: "04:B5:E9:4C:7D:55",
      ownerId: alexUser.id,
      profileId: alexWorkProfile.id,
      status: "ACTIVE",
    },
  });

  await prisma.tag.upsert({
    where: { code: "TL-002" },
    update: {
      uid: "04:F1:A2:0D:5E:88",
      ownerId: sarahUser.id,
      profileId: sarahProfile.id,
      status: "ACTIVE",
      claimCode: null,
    },
    create: {
      code: "TL-002",
      uid: "04:F1:A2:0D:5E:88",
      ownerId: sarahUser.id,
      profileId: sarahProfile.id,
      status: "ACTIVE",
    },
  });

  await prisma.tag.upsert({
    where: { code: "TL-003" },
    update: {
      uid: "04:11:B8:5A:2E:63",
      status: "UNCLAIMED",
      ownerId: null,
      profileId: null,
      claimCode: "BRDG19",
      taps: 0,
      lastTapAt: null,
    },
    create: {
      code: "TL-003",
      uid: "04:11:B8:5A:2E:63",
      status: "UNCLAIMED",
      claimCode: "BRDG19",
      taps: 0,
    },
  });

  const existingTapEvents = await prisma.tapEvent.count({
    where: { tagId: tag1.id },
  });

  if (existingTapEvents === 0) {
    const devices = ["iPhone 15 Pro", "Pixel 8", "Samsung S24", "iPhone 14", "OnePlus 12"];
    const cities = ["San Francisco", "Oakland", "San Jose", "Palo Alto", "Berkeley"];

    const events = Array.from({ length: 120 }, (_, i) => {
      const occurredAt = new Date();
      occurredAt.setUTCHours(occurredAt.getUTCHours() - i * 4);

      return {
        tagId: tag1.id,
        profileId: alexProfile.id,
        scanMethod: i % 4 === 0 ? "QR" as const : "NFC" as const,
        device: devices[i % devices.length],
        city: cities[i % cities.length],
        country: "USA",
        referrer: "direct",
        occurredAt,
      };
    });

    await prisma.tapEvent.createMany({ data: events });

    await prisma.linkClickEvent.createMany({
      data: Array.from({ length: 70 }, (_, i) => ({
        profileId: alexProfile.id,
        linkLabel: i % 3 === 0 ? "LinkedIn" : i % 3 === 1 ? "Portfolio" : "Email Me",
        occurredAt: new Date(Date.now() - i * 3600 * 1000 * 6),
      })),
    });

    await prisma.tag.update({
      where: { id: tag1.id },
      data: {
        taps: events.length,
        lastTapAt: events[0].occurredAt,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: adminUser.id,
      action: "seed.completed",
      entityType: "system",
      metadata: {
        usersSeeded: 3,
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
