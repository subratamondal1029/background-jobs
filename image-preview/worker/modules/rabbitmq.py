from modules.getenv import getenv
import time
import pika
from pika.adapters.blocking_connection import BlockingChannel
from modules import retry_queue_producer


RABBITMQ_HOST = getenv("RABBITMQ_HOST")
RABBITMQ_PORT = getenv("RABBITMQ_PORT")
RABBITMQ_USERNAME = getenv("RABBITMQ_USERNAME")
RABBITMQ_PASSWORD = getenv("RABBITMQ_PASSWORD")

QUEUE_NAME = getenv("QUEUE_NAME")


def connect_to_rabbitmq() -> BlockingChannel:
    while True:
        try:
            conn = pika.BlockingConnection(
                pika.ConnectionParameters(
                    host=RABBITMQ_HOST,
                    port=RABBITMQ_PORT,
                    credentials=pika.PlainCredentials(
                        username=RABBITMQ_USERNAME, password=RABBITMQ_PASSWORD
                    ),
                )
            )
            break

        except Exception as err:
            print(f"RabbitMQ Either not available || connection failed: {err}")
            time.sleep(2)

    ch: BlockingChannel = conn.channel()
    ch.queue_declare(queue=QUEUE_NAME, durable=True)
    retry_queue_producer.init(ch)
    return ch
