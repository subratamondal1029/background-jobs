import pika
import json
from pika.adapters.blocking_connection import BlockingChannel
from modules.getenv import getenv
from typing import TypedDict

class StatusMessage(TypedDict):
    jobId: int
    status: str
    error: str | None

STATUS_EXCHANGE = getenv("STATUS_EXCHANGE")
STATUS_QUEUE = getenv("STATUS_QUEUE")


def init(ch: BlockingChannel):
    ch.exchange_declare(exchange=STATUS_EXCHANGE, exchange_type="direct", durable=True)
    ch.queue_declare(
        queue=STATUS_QUEUE,
        durable=True,
        
    )

    ch.queue_bind(queue=STATUS_QUEUE, exchange=STATUS_EXCHANGE, routing_key=STATUS_QUEUE)

def publish_status(ch: BlockingChannel, message: StatusMessage):
    json_message = json.dumps(message)
    print("Sending status message:", json_message)
    ch.basic_publish(
        exchange=STATUS_EXCHANGE,
        routing_key=STATUS_QUEUE,
        body=json_message,
        properties=pika.BasicProperties(delivery_mode=2)
    )