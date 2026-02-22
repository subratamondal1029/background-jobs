import pika, json, time
from _getenv import get_env


# from send_mail import send as send_mail
from get_random_response import get_random_response

MAX_RETRIES = 5

def main():
    while True:
        try:
            conn = pika.BlockingConnection(
                pika.ConnectionParameters(get_env("RABBITMQ_CN"))
            )
            break
        except Exception as e:
            print("Waiting for RabbitMQ...", e)
            time.sleep(2)

    ch = conn.channel()
    queue = get_env("MESSAGE_QUEUE")

    ch.queue_declare(queue=queue, durable=True)

    def callback(ch, method, properties, body):
        headers = properties.headers or {}
        retries = headers.get("x-retries", 0)

        try:
            data = json.loads(body)
            print(f"Retry count: {retries} for message {data}")
            print("Received message:", data)

            # DO WORK HERE
            # send_mail(data["subject"], data["email"], data["body"])
            get_random_response()

            ch.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as err:
            if retries >= MAX_RETRIES:
                print("Max retries exceeded for message:", err)
                ch.basic_reject(delivery_tag=method.delivery_tag, requeue=False)
                return

            ch.basic_publish(
                exchange="retry-ex",
                routing_key="retry",
                body=body,
                properties=pika.BasicProperties(
                    headers={"x-retries": retries + 1},
                    delivery_mode=2,
                    content_type="application/json"
                )
            )
            ch.basic_ack(delivery_tag=method.delivery_tag)


    ch.basic_consume(queue=queue, on_message_callback=callback)

    print("Worker started")
    ch.start_consuming()

if __name__ == "__main__":
    main()