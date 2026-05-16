import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const { PrismaClient } = await import("../src/generated/prisma/client.ts");
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  console.log("Seeding database...");

  const adminHash = await bcrypt.hash("admin123", 12);
  const userHash = await bcrypt.hash("password123", 12);

  const cto = await prisma.user.upsert({
    where: { email: "cto@lbc.com" },
    update: {},
    create: {
      email: "cto@lbc.com",
      name: "Chief Officer",
      passwordHash: adminHash,
      role: "CTO",
    },
  });
  console.log(`Created CTO: ${cto.name} (${cto.email})`);

  const alice = await prisma.user.upsert({
    where: { email: "alice@lbc.com" },
    update: {},
    create: {
      email: "alice@lbc.com",
      name: "Alice Johnson",
      passwordHash: userHash,
      role: "EMPLOYEE",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@lbc.com" },
    update: {},
    create: {
      email: "bob@lbc.com",
      name: "Bob Smith",
      passwordHash: userHash,
      role: "EMPLOYEE",
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: "carol@lbc.com" },
    update: {},
    create: {
      email: "carol@lbc.com",
      name: "Carol Williams",
      passwordHash: userHash,
      role: "EMPLOYEE",
    },
  });

  console.log(`Created employees: ${alice.name}, ${bob.name}, ${carol.name}`);

  const existingIdeas = await prisma.idea.count();
  if (existingIdeas === 0) {
    const idea1 = await prisma.idea.create({
      data: {
        title: "User Authentication Flow",
        description: "Implement a complete user authentication flow including login, registration, and password reset.",
        status: "IN_PROGRESS",
        createdById: cto.id,
        assignedToId: alice.id,
        tasks: {
          create: [
            { title: "Design login page UI", description: "Create the login page with email and password fields.", status: "GREEN", order: 0 },
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
        createdById: cto.id,
        assignedToId: bob.id,
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
