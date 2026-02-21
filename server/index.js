import "dotenv/config";
import amqp from "amqplib";
import express from "express";

const app = express();

let ch;
const queue = "send-mail";
const connectMQ = async () => {
  const conn = await amqp.connect(process.env.RABBITMQ_CN);
  ch = await conn.createConfirmChannel();
  await ch.assertQueue(queue, { durable: true });
};

const addTOQueue = async (msg) => {
  if (!ch || !queue) return;

  ch.sendToQueue(queue, Buffer.from(JSON.stringify(msg)), {
    persistent: true,
  });

  await ch.waitForConfirms();
  return `Sent message: ${msg.subject}`;
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the mail sending service!" });
});

app.post("/send-mail", async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    const result = await addTOQueue({ email: to, subject, body });

    if (!result) return res.status(500).json({ error: "Failed to send mail" });

    res.json({ message: result });
  } catch (error) {
    console.error("Error sending mail:", error);
    res.status(500).json({ error: "Failed to send mail" });
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
