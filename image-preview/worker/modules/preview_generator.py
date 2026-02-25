import time
import json
from decimal import Decimal
from typing import TypedDict

from PIL import Image
from io import BytesIO

from pika import spec
from pika.adapters.blocking_connection import BlockingChannel

from modules.getenv import getenv
from modules.retry_queue_producer import publish_retry
from modules.status_publish_queue import publish_status

from modules.database_service import DatabaseService
from modules.storage_service import Storage_service

database_service = DatabaseService()
storage_service = Storage_service()

MAX_RETRIES = int(getenv("MAX_RETRIES"))


class Data(TypedDict):
    size: str
    imageId: str
    jobId: int

def create_image(image_id: str, size: str):
    formatted_size = size.split("x")
    original_image_key = database_service.get_image_key(image_id)
    original_image_data = storage_service.read_image(original_image_key)

    img = Image.open(BytesIO(original_image_data))
    img.thumbnail((int(formatted_size[0]), int(formatted_size[1])))

    buff = BytesIO()
    img.save(buff, format="JPEG", quality=85)
    buff.seek(0)

    return buff


def generate_preview(
    channel: BlockingChannel,
    method: spec.Basic.Deliver,
    properties: spec.BasicProperties,
    body: bytes,
):
    try:
        headers = properties.headers or {}
        data: Data = json.loads(body)
        image_id = data["imageId"]
        job_id = data["jobId"]
        database_service.update_job_status(job_id, "PROCESSING")
        publish_status(channel, {
            "jobId": job_id,
            "status": "PROCESSING",
            "error": None,
        })
        time.sleep(5)
        image_data = create_image(image_id, data["size"])
        preview_key = storage_service.upload_image(image_data)

        database_service.update_image_preview(image_id, preview_key)
        database_service.update_job_status(job_id, "SUCCESS")
        publish_status(channel, {
            "jobId": job_id,
            "status": "SUCCESS",
            "error": None,
        })

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
            database_service.update_job_status(
                job_id,
                "FAILED",
                error=f"Max retries exceeded for error: {str(e)}",
                retries=retry_count,
            )
            publish_status(channel, {
                "jobId": job_id,
                "status": "FAILED",
                "error": "Max retries exceeded"
            })
            channel.basic_reject(delivery_tag=method.delivery_tag, requeue=False)
            return

        publish_retry(channel, body, retry_count + 1)
        database_service.update_job_status(
            job_id, "RETRYING", error=str(e), retries=retry_count + 1
        )
        channel.basic_ack(delivery_tag=method.delivery_tag)
