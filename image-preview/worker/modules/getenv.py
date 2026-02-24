import os
import sys
from dotenv import load_dotenv

load_dotenv()

def getenv(key: str) -> str:
    value = os.getenv(key)

    if not value:
        print(f"Variable '{key}' is not set.")
        sys.exit(1)
        
    return value