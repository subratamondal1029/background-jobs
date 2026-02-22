import requests

def get_random_response():
    try:
        response = requests.get("http://localhost:5000/get-random")
        result = response.json()
        if "error" in result:
            raise ValueError(result['error'])
        return result
    except requests.RequestException as e:
        print(f"Error fetching random user: {e}")
        return {"error": str(e)}
    

print(get_random_response())