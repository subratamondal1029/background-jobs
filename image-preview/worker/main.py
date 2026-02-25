from modules.getenv import getenv
from modules.rabbitmq import connect_to_rabbitmq
from modules.preview_generator import generate_preview
from modules.retry_queue_producer import init as retry_init

IMAGE_PREVIEW_QUEUE = getenv("QUEUE_NAME")

def main():
    ch = connect_to_rabbitmq()
    retry_init(ch)

    ch.basic_consume(queue=IMAGE_PREVIEW_QUEUE, on_message_callback=generate_preview)

    print("Worker Started")
    ch.start_consuming()


if __name__ == "__main__":
    main()
