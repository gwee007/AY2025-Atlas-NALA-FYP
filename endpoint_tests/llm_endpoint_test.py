import requests
import os

from dotenv import load_dotenv
load_dotenv()
api_key = os.getenv("NALA_API_KEY")
base_url = os.getenv("NALA_BASE_URL")  
print("API Key:", api_key)
print("Base URL:", base_url)

# Define the endpoint URL
url = f"{base_url}/api/llm/"

xml_body = f"""
<llm_request>
    <model>gemini-3-pro-preview</model>
    <system_prompt>You are a precise and technical assistant.</system_prompt>
    <hyperparameters>
        <temperature>0.3</temperature>
        <top_p>0.1</top_p>
    </hyperparameters>
    <user_prompt>Explain what is process control and dynamics.</user_prompt>
</llm_request>
"""

headers = {
    "Content-Type": "application/xml",
    "Authorization": f"Bearer {api_key}"
}

# Send the POST request
response = requests.post(url, data=xml_body, headers=headers)

# Check if the response status code is 200
if response.status_code == 200:
    try:
        # Parse the JSON response
        response_json = response.json()
        print(response_json['message'])
    except ValueError:
        print("Failed to parse JSON response.")
else:
    print("Request failed with status code:", response.status_code)
    print("Response Body:", response.text)
