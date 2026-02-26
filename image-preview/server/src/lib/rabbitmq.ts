import amqplib from "amqplib";
import requiredEnv from "@/utils/requiredEnv.js";
import { sendStatusUpdate } from "@/controllers/job.controller.js";

const RABBITMQ_URL = requiredEnv("RABBITMQ_CONN");
const EXCHANGE_NAME = requiredEnv("EXCHANGE_NAME");
const IMAGE_PROCESS_QUEUE = requiredEnv("IMAGE_PROCESS_QUEUE");
const STATUS_QUEUE = requiredEnv("STATUS_QUEUE");
const STATUS_EXCHANGE = requiredEnv("STATUS_EXCHANGE");

let channel: amqplib.ConfirmChannel;

const createQueue = async (queueName: string) => {
  try {
    await channel.assertQueue(queueName, {
      durable: true,
    });
  } catch (error) {
    console.error("Error creating queue:", error);
    throw error;
  }
};

const publishToQueue = (
  message: Record<string, any>,
  queueName: string = IMAGE_PROCESS_QUEUE,
) => {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized");
  }

  const ok = channel.publish(
    EXCHANGE_NAME,
    queueName,
    Buffer.from(JSON.stringify(message)),
  );

  if (!ok) {
    console.warn("Backpressure: TCP buffer full");
  }

  return async () => await channel.waitForConfirms();
};

const consumeStatus = async (msg: amqplib.ConsumeMessage | null) => {
  if (!msg) {
    console.warn("Received null message");
    return;
  }

  const { jobId, status } = JSON.parse(msg.content.toString());
  sendStatusUpdate(jobId, status);
};

const connectMQ = async () => {
  try {
    const conn = await amqplib.connect(RABBITMQ_URL);
    channel = await conn.createConfirmChannel();
    await channel.assertExchange(EXCHANGE_NAME, "direct", {
      durable: true,
    });
    await channel.assertExchange(STATUS_EXCHANGE, "direct", {
      durable: true,
    });

    await createQueue(IMAGE_PROCESS_QUEUE);
    await channel.bindQueue(
      IMAGE_PROCESS_QUEUE,
      EXCHANGE_NAME,
      IMAGE_PROCESS_QUEUE,
    );

    
    await createQueue(STATUS_QUEUE);
    await channel.bindQueue(STATUS_QUEUE, STATUS_EXCHANGE, STATUS_QUEUE);
    await channel.consume(STATUS_QUEUE, consumeStatus);
  } catch (error) {
    console.error("Error connecting to RabbitMQ:", error);
    throw error;
  }
};

const disconnectMQ = async () => {
  try {
    if (channel) {
      await channel.close();
    }
  } catch (error) {
    console.error("Error disconnecting from RabbitMQ:", error);
  }
};

export { channel, publishToQueue, connectMQ, disconnectMQ };
