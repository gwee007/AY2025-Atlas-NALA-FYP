"""
Test script to verify chatbot backend is working correctly.
Run this after starting the chatbot backend with: python run.py
"""
import requests
import json

CHATBOT_API_URL = "http://127.0.0.1:8000"

def test_health_check():
    """Test the health check endpoint"""
    print("Testing health check endpoint...")
    try:
        response = requests.get(f"{CHATBOT_API_URL}/api/health")
        if response.status_code == 200:
            print("✓ Health check passed:", response.json())
            return True
        else:
            print("✗ Health check failed:", response.status_code)
            return False
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to chatbot backend. Is it running on port 8000?")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_chat_endpoint():
    """Test the chat endpoint with a sample question"""
    print("\nTesting chat endpoint with a question...")
    try:
        payload = {
            "question": "What is a feedback control system?",
            "user_id": 1
        }
        
        response = requests.post(
            f"{CHATBOT_API_URL}/api/chat",
            headers={"Content-Type": "application/json"},
            json=payload
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✓ Chat endpoint works!")
            print(f"  Conversation ID: {data.get('conversation_id')}")
            print(f"  Evaluation Type: {data.get('evaluation_type')}")
            print(f"  Response Preview: {data.get('response', '')[:100]}...")
            return True
        else:
            print(f"✗ Chat endpoint failed with status {response.status_code}")
            print(f"  Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ Error testing chat endpoint: {e}")
        return False

def test_conversations_endpoint():
    """Test the conversations endpoint"""
    print("\nTesting conversations endpoint...")
    try:
        response = requests.get(f"{CHATBOT_API_URL}/api/conversations?user_id=1")
        
        if response.status_code == 200:
            conversations = response.json()
            print(f"✓ Conversations endpoint works! Found {len(conversations)} conversations")
            return True
        else:
            print(f"✗ Conversations endpoint failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("CHATBOT BACKEND CONNECTION TEST")
    print("=" * 60)
    
    # Run tests
    health_ok = test_health_check()
    
    if health_ok:
        chat_ok = test_chat_endpoint()
        conv_ok = test_conversations_endpoint()
        
        print("\n" + "=" * 60)
        if health_ok and chat_ok and conv_ok:
            print("✓ ALL TESTS PASSED! Backend is working correctly.")
        else:
            print("⚠ Some tests failed. Check the errors above.")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("✗ Backend is not running. Start it with: python run.py")
        print("=" * 60)
