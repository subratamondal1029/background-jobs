import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const DB_URL = process.env.DB_URL;

if (!DB_URL) {
  console.error("DB_URL environment variable is not set");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: DB_URL });
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Gracefull shutdown
const shutdown = async () => {
  console.log("Shutting down DB gracefully...");
  await prisma.$disconnect();
  process.exit(0);
};

// handle by main file (index.js)
// process.on("SIGINT", shutdown);
// process.on("SIGTERM", shutdown);

export { shutdown as shutdownDB };
export default prisma;
