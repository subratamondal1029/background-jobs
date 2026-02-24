import "dotenv/config";
import { shutdownDB } from "@/lib/prisma.js";
import app from "@/app.js";

const PORT = process.env.PORT || 3000;

// connect rabbitMQ
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const shutdownProcesses = async () => {
  console.log("Gracefully shutting down Server...");
  await shutdownDB();
  process.exit(0);
};

process.on("SIGINT", shutdownProcesses);
process.on("SIGTERM", shutdownProcesses);
