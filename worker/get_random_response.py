import requests

def get_random_response():
    try:
        response = requests.get("http://localhost:5000/get-random/s")
        result = response.json()
        if "error" in result:
            raise ValueError(result['error'])
        return result
    except (requests.RequestException, ValueError):
        raise
    

print(get_random_response())