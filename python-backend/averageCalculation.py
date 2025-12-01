# Import requests and JSON. 
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Base website is https://nala.ntu.edu.sg/
# Conversations branch: "/api/chatbot/{id}/conversations"
# Status check for API: "/api/health"
# Temporary variables
# 
id = 3
API_KEY = os.environ.get("MY_API_KEY")
BASE_URL = "https://nala.ntu.edu.sg"
TOPICS_URL= "/api/topiclist"
LLM_URL = "/api/llm"
CONVO_URL = "/api/chatbot/{id}/conversations"
STATUS_URL = "/api/health/"
TIMEOUT = 30



# Try except structure To test the API by performing the get request 
def test_conversations_api():
    try:

        API_URL= f"{BASE_URL}{CONVO_URL}" # Yes, I meant to do that
        # Perform GET request to the API endpoint
        response = requests.get(API_URL.format(id=id),headers=headers, timeout=TIMEOUT)
        # Check for request success 
        response.raise_for_status()  # Raise an error for bad status codes And print it out later if needed
        conversations = response.json()
        print("Something is successful, I guess.")
        print("API Response:", json.dumps(conversations, indent=2))
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err}")
        print("Response Content:", response.content)
    except requests.exceptions.RequestException as e:
        print("Error during API request:", e)

# Implementing another function with status check.This is a get function. 
def test_api_status():
    headers = {
        "X-API-KEY": API_KEY}
    try:
        API_URL= f"{BASE_URL}{STATUS_URL}"
        # Just print to debug
        print("Status API URL:", API_URL)
        response = requests.get(API_URL,headers = headers, timeout=TIMEOUT) 
        response.raise_for_status()  
        print("API Status Check Successful.")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred during status check: {http_err}")
        print("Response Content:", response.content)
    except requests.exceptions.RequestException as e:
        print("Error during API status request:", e)


# Right, a main function in Python that just calls it.
if __name__ == "__main__":
    # test_conversations_api()
    test_api_status()

