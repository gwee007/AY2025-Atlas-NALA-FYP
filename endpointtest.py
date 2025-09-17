# pip install requests 
import os 
import requests 

# topic list retrieval is working
# expected output: 
# Chatbot: 3
# Topics: ['Integration', 'Derivatives', 'Complex numbers', 'Limits and continuity of functions', 'Applications of integration', 'Integration methods', 'Applications of derivatives', 'vectors and matrices']

# read API key from a .txt file outside this folder
# path: D:\Documents\Academics\programming\APIkey.txt
API_KEY_PATH = "D:\\Documents\\Academics\\programming\\APIkey.txt" # change this to your actual path
api_key = None
if os.path.exists(API_KEY_PATH):    
    with open(API_KEY_PATH, "r") as f:
        api_key = f.read().strip()
        print(f"API key {api_key} loaded from file.")


BASE_URL = os.getenv("BASE_URL", "https://nala.ntu.edu.sg") 
API_KEY = os.getenv("API_KEY", api_key) 
def get_topic_list(chatbot_id=3, timeout=15): 
    url = f"{BASE_URL}/api/topiclist" 
    headers = {"X-API-Key": API_KEY} 
    params = {"chatbot_id": chatbot_id} 
    resp = requests.get(url, headers=headers, params=params, timeout=timeout) 
    try: resp.raise_for_status() 
    except requests.HTTPError: 
        try: print("Error body:", resp.json()) 
        except Exception: print("Error text:", resp.text) 
        raise 
    data = resp.json() 
    print("Chatbot:", data.get("chatbot_id")) 
    print("Topics:", data.get("topic_list")) 
    return data 
if __name__ == "__main__": 
    get_topic_list(3)

# chat history retrieval test
# expected output: "Returned 1 rows"

def get_chat_history(chatbot_id: int, **filters):
    url = f"{BASE_URL}/api/chathistory"
    headers = {"X-API-Key": API_KEY}
    params = {"chatbot_id": chatbot_id, **filters}

    r = requests.get(url, headers=headers, params=params, timeout=20)

    try:
        r.raise_for_status()
    except requests.HTTPError:
        try:
            print("Error body:", r.json())
        except Exception:
            print("Error text:", r.text)
        raise

    data = r.json()
    print(f"Returned {len(data)} rows")
    # print type of data
    return data


if __name__ == "__main__":
    get_chat_history(3, limit=5, order="desc")



# chat history insertion test: output should insert new records into the chat history table 

import json


def post_chat_history(records, timeout_s: float = 15.0):
    """
    Insert one or more chat history records into the API.

    Args:
        records (dict | list[dict]): A single record or list of records.
        timeout_s (float): Request timeout in seconds.

    Returns:
        dict: API response containing 'inserted' and 'errors' counts.
    """
    url = f"{BASE_URL}/api/chathistory"
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
    }

    r = requests.post(url, headers=headers, data=json.dumps(records), timeout=timeout_s)

    if not r.ok:
        try:
            print("Error body:", r.json())
        except Exception:
            print("Error text:", r.text)
        r.raise_for_status()

    data = r.json()
    print("Inserted:", data.get("inserted"))
    print("Errors:", data.get("errors"))
    return data


if __name__ == "__main__":
    # Single insert (minimal)
    post_chat_history({
        "conversation_id": 42,
        "sender": "user",
        "text": "Hello there!",
        "timestamp": "2025-09-03T03:33:21Z",
    })

    # Batch insert
    post_chat_history([
        {
            "convo_id": 42,  # <-- check if this should be 'conversation_id' for consistency
            "timestamp": "2025-09-03T03:33:21Z",
            "sender": "user",
            "text": "What are the deadlines?",
            "context": {"channel": "web"},
        },
        {
            "conversation_id": 42,
            "timestamp": "2025-09-03T03:33:35Z",
            "sender": "assistant",
            "text": "Fall deadline is Oct 31.",
            "user_evaluation": "helpful",
        },
    ])