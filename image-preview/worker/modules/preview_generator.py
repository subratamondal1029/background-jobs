import json
from decimal import Decimal
from typing import TypedDict

from pika import spec
from pika.adapters.blocking_connection import BlockingChannel

from getenv import getenv
from retry_queue_producer import publish_retry

MAX_RETRIES = int(getenv("MAX_RETRIES"))


class Data(TypedDict):
    size: int
    imageId: str
    jobId: str


def generate_preview(
    channel: BlockingChannel,
    method: spec.Basic.Deliver,
    properties: spec.BasicProperties,
    body: bytes,
):
    try:
        headers = properties.headers or {}        
        data: Data = json.loads(body)
        print(data)

        channel.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        raw_retry_count = headers.get("x-retry-count", 0)
        # get in proper int type
        if isinstance(raw_retry_count, (int, Decimal, str, bytes, bytearray)):
            retry_count: int = int(raw_retry_count)
        else:
            retry_count: int = 0

        if retry_count >= MAX_RETRIES:
            # add to update database
            print(f"Max retries exceeded for job {data['jobId']}")
            channel.basic_reject(delivery_tag=method.delivery_tag, requeue=False)
            return
        
        publish_retry(channel, body, retry_count + 1)
