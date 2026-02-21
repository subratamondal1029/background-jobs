import os
import pika, json, time
from dotenv import load_dotenv

load_dotenv()

def _required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"{name} environment variable is not set")
    return value

def main():
    print("hello world")
    while True:
        try:
            conn = pika.BlockingConnection(
                pika.ConnectionParameters(_required_env("RABBITMQ_CN"))
            )
            break
        except Exception as e:
            print("Waiting for RabbitMQ...", e)
            time.sleep(2)

    ch = conn.channel()
    queue = "jobs"

    ch.queue_declare(queue=queue, durable=True)

    def callback(ch, method, properties, body):
        print("Received message start processing")
        time.sleep(5)
        data = json.loads(body)
        print("Processing:", data)

        # DO WORK HERE

        ch.basic_ack(delivery_tag=method.delivery_tag)

    ch.basic_consume(queue=queue, on_message_callback=callback)

    print("Worker started")
    ch.start_consuming()

if __name__ == "__main__":
    main()