import os
import pika, json, time
from dotenv import load_dotenv

load_dotenv()

def main():
    while True:
        try:
            conn = pika.BlockingConnection(
                pika.ConnectionParameters(os.getenv("RABBITMQ_CN"))
            )
            break
        except:
            print("Waiting for RabbitMQ...")
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