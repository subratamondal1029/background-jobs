import "dotenv/config";
import { shutdownDB } from "./lib/prisma.js";
import { connectMQ, disconnectMQ } from "./lib/rabbitmq.js";
import app from "./app.js";

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectMQ();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
})();

const shutdownProcesses = async () => {
  console.log("Gracefully shutting down Server...");
  await shutdownDB();
  await disconnectMQ();
  process.exit(0);
};

process.on("SIGINT", shutdownProcesses);
process.on("SIGTERM", shutdownProcesses);
