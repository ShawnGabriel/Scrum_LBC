import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const { PrismaClient } = await import("../src/generated/prisma/client.ts");
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  console.log("Seeding database...");

  const ctos: { username: string; name: string; password: string }[] = [
    { username: "narin", name: "Narin", password: "narin678" },
    { username: "shawn", name: "Shawn", password: "shawn678" },
  ];

  const associates: { username: string; name: string }[] = [
    { username: "atala", name: "Atala" },
    { username: "akbar", name: "Akbar" },
    { username: "fadlan", name: "Fadlan" },
    { username: "arkan", name: "Arkan" },
    { username: "jonathan", name: "Jo" },
    { username: "el", name: "El" },
  ];

  const ctoRecords = [];
  for (const c of ctos) {
    const hash = await bcrypt.hash(c.password, 12);
    const user = await prisma.user.upsert({
      where: { username: c.username },
      update: {},
      create: {
        username: c.username,
        name: c.name,
        passwordHash: hash,
        role: "CTO",
      },
    });
    ctoRecords.push(user);
    console.log(`Created CTO: ${user.name} (${user.username})`);
  }

  const associateRecords = [];
  for (const a of associates) {
    const hash = await bcrypt.hash(`${a.username}123`, 12);
    const user = await prisma.user.upsert({
      where: { username: a.username },
      update: {},
      create: {
        username: a.username,
        name: a.name,
        passwordHash: hash,
        role: "ASSOCIATE",
      },
    });
    associateRecords.push(user);
    console.log(`Created associate: ${user.name} (${user.username})`);
  }

  const existingIdeas = await prisma.idea.count();
  if (existingIdeas === 0) {
    const primaryCto = ctoRecords[0];
    const atala = associateRecords.find((u) => u.username === "atala")!;
    const akbar = associateRecords.find((u) => u.username === "akbar")!;

    const idea1 = await prisma.idea.create({
      data: {
        title: "User Authentication Flow",
        description: "Implement a complete user authentication flow including login, registration, and password reset.",
        status: "IN_PROGRESS",
        createdById: primaryCto.id,
        assignedToId: atala.id,
        tasks: {
          create: [
            { title: "Design login page UI", description: "Create the login page with username and password fields.", status: "GREEN", order: 0 },
            { title: "Implement auth API endpoints", description: "Build the REST API endpoints for login, register, and password reset.", status: "YELLOW", order: 1 },
            { title: "Add session management", description: "Implement JWT-based session management with refresh tokens.", status: "WHITE", order: 2 },
          ],
        },
      },
    });
    console.log(`Created idea: ${idea1.title}`);

    const idea2 = await prisma.idea.create({
      data: {
        title: "Dashboard Analytics",
        description: "Build an analytics dashboard showing project metrics, task completion rates, and team performance.",
        status: "ASSIGNED",
        createdById: primaryCto.id,
        assignedToId: akbar.id,
        tasks: {
          create: [
            { title: "Design dashboard layout", description: "Create wireframes and implement the dashboard grid layout.", status: "YELLOW", order: 0 },
            { title: "Build chart components", description: "Implement reusable chart components for bar, line, and pie charts.", status: "WHITE", order: 1 },
            { title: "Connect to data API", description: "Fetch analytics data from the backend and populate the charts.", status: "WHITE", order: 2 },
          ],
        },
      },
    });
    console.log(`Created idea: ${idea2.title}`);
  } else {
    console.log("Ideas already exist, skipping...");
  }

  console.log("Seeding complete!");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
