import requests
import os

from dotenv import load_dotenv
load_dotenv()
api_key = os.getenv("NALA_API_KEY")
base_url = os.getenv("BASE_URL")  
print("API Key:", api_key)
print("Base URL:", base_url)

# Define the endpoint URL
url = f"{base_url}/api/chatbot/3/conversations"

headers = {
    "Authorization": f"Bearer {api_key}"
}

# Send the POST request
response = requests.post(url, headers=headers)

# Check if the response status code is 200
if response.status_code == 200:
    try:
        # Parse the JSON response
        response_json = response.json()
        print(response_json)
    except ValueError:
        print("Failed to parse JSON response.")
else:
    print("Request failed with status code:", response.status_code)
    print("Response Body:", response.text)
