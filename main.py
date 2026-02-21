from dotenv import load_dotenv
load_dotenv()

from send_mail import send as send_email


def main():
   print("Hello world")
   send_email("This is Test Subject", "test@email.com", "Hello from the python send function")


if __name__ == "__main__":
    main()
