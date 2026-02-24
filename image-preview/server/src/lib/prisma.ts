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

const connectDB = async () => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log("Connected to database");
  } catch (error) {
    console.error("Error connecting to database:", error);
    throw error;
  }
};

// Gracefull shutdown
const shutdown = async () => {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
};

// handle by main file (index.js)
// process.on("SIGINT", shutdown);
// process.on("SIGTERM", shutdown);

export { connectDB, shutdown as shutdownDB };
export default prisma;
