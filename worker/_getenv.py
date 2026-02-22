from dotenv import load_dotenv
load_dotenv()
import os

def get_env(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise ValueError(f"{key} environment variable is not set")
    return value