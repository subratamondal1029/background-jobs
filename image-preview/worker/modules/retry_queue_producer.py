import pika
from pika.adapters.blocking_connection import BlockingChannel
from getenv import getenv

MAIN_EXCHANGE_NAME = getenv("EXCHANGE_NAME")
QUEUE_NAME = getenv("QUEUE_NAME")

MAX_RETRIES = getenv("MAX_RETRIES")
RETRY_EXCHANGE = getenv("RETRY_EXCHANGE")
RETRY_QUEUE = getenv("RETRY_QUEUE")
RETRY_DELAY_MS = getenv("RETRY_DELAY_MS")


def init(ch: BlockingChannel):
    ch.exchange_declare(exchange=RETRY_EXCHANGE, exchange_type="direct", durable=True)
    ch.queue_declare(
        queue=RETRY_QUEUE,
        durable=True,
        arguments={
            "x-message-ttl": int(RETRY_DELAY_MS),
            "x-dead-letter-exchange": MAIN_EXCHANGE_NAME,
            "x-dead-letter-routing-key": QUEUE_NAME,
        },
    )

    ch.queue_bind(queue=RETRY_QUEUE, exchange=RETRY_EXCHANGE, routing_key=RETRY_QUEUE)


def publish_retry(ch: BlockingChannel, body: bytes, retry_count: int):
    ch.basic_publish(
        exchange=RETRY_EXCHANGE,
        routing_key=RETRY_QUEUE,
        body=body,
        properties=pika.BasicProperties(
            headers={"x-retry-count": retry_count},
            content_type="application/json",
            delivery_mode=2,
        ),
    )
