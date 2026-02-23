import "dotenv/config";
import amqp from "amqplib";
import express from "express";

const app = express();

let ch;
const queue = process.env.MESSAGE_QUEUE;

if (!queue) {
  throw new Error("MESSAGE_QUEUE environment variable is not set");
}

const connectMQ = async () => {
  const conn = await amqp.connect(process.env.RABBITMQ_CN);
  ch = await conn.createConfirmChannel();
  await ch.assertQueue(queue, { durable: true });
};

const addTOQueue = async (msg) => {
  if (!ch) {
    console.error("channel not found");
    return;
  }

  const ok = ch.sendToQueue(queue, Buffer.from(JSON.stringify(msg)), {
    persistent: true,
    contentType: "application/json",
  });

  if (!ok) {
    await new Promise((res) => ch.once("drain", res));
  }

  await ch.waitForConfirms();
  return "Message Sent";
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the mail sending service!" });
});

app.post("/send-message", async (req, res) => {
  try {
    const result = await addTOQueue(req.body);

    if (!result)
      return res.status(500).json({ error: "Failed to send message" });

    res.json({ message: result });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

connectMQ()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log("Mail sending service is running on port 3000");
    });
  })
  .catch((error) => {
    console.error("Failed to connect to RabbitMQ:", error);
    process.exit(1);
  });
