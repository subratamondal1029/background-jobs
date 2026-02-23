import requests
from _getenv import get_env

def get_random_response():
    response = requests.get(f"{get_env('API_URL')}/get-random")
    result = response.json()
    if "error" in result:
        raise Exception(result['error'])
    return result