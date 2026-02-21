import os
import smtplib
from email.message import EmailMessage


def _required_env(name: str) -> str:
    value = os.getenv(name)
    if value is None or value == "":
        raise ValueError(f"Missing required environment variable: {name}")
    return value


# 1. Credentials from Ethereal
host = _required_env("EMAIL_HOST")
port = int(_required_env("EMAIL_PORT"))
username = _required_env("EMAIL_USERNAME")
password = _required_env("EMAIL_PASSWORD")
from_email = _required_env("EMAIL_FROM")


def send(subject: str, to: str, content: str) -> bool:
    # 2. Write the message (take data from user)
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to
    msg.set_content(content)

    # 3. Send the email
    try:
        server = smtplib.SMTP(host, port)
        server.starttls()  # Secure the connection
        server.login(username, password)
        server.send_message(msg)
        server.quit()
        print("Email sent successfully to Ethereal!")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False