import pika, json, time
from _getenv import get_env


# from send_mail import send as send_mail
from get_random_response import get_random_response

MAX_RETRIES = 5
RETRY_EXCHANGE = "retry-ex"
RETRY_ROUTING_KEY = "retry"
RETRY_QUEUE = "retry-queue"
RETRY_DELAY_MS = 5000


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
    ch.exchange_declare(exchange=RETRY_EXCHANGE, exchange_type="direct", durable=True)
    ch.queue_declare(
        queue=RETRY_QUEUE,
        durable=True,
        arguments={
            "x-message-ttl": RETRY_DELAY_MS,
            "x-dead-letter-exchange": "",
            "x-dead-letter-routing-key": queue,
        },
    )
    ch.queue_bind(
        queue=RETRY_QUEUE, exchange=RETRY_EXCHANGE, routing_key=RETRY_ROUTING_KEY
    )

    def callback(ch, method, properties, body):
        headers = properties.headers or {}
        retries = headers.get("x-retries", 0)

        try:
            data = json.loads(body)
            if retries >= 1:
                print(f"Retry count: {retries} for message {data['id']}")

            # DO WORK HERE
            # send_mail(data["subject"], data["email"], data["body"])
            print(f"Random response: {get_random_response()}")

            ch.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as err:
            if retries >= MAX_RETRIES:
                print(f"Max retries exceeded for message {data['id']}: {err}")
                ch.basic_reject(delivery_tag=method.delivery_tag, requeue=False)
                return

            ch.basic_publish(
                exchange=RETRY_EXCHANGE,
                routing_key=RETRY_ROUTING_KEY,
                body=body,
                properties=pika.BasicProperties(
                    headers={"x-retries": retries + 1},
                    delivery_mode=2,
                    content_type="application/json",
                ),
            )
            ch.basic_ack(delivery_tag=method.delivery_tag)

    ch.basic_consume(queue=queue, on_message_callback=callback)

    print("Worker started")
    ch.start_consuming()


if __name__ == "__main__":
    main()
