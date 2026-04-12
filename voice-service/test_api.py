import httpx
import asyncio

async def test_text_endpoint():
    url = "http://localhost:8004/voice/text"
    
    # Test 1: English query -> No translation needed to EN -> Should get response
    # It must return detected_language = en, and TTS audio in english.
    print("\n--- Test 1: English Query ---")
    data = {
        "text": "What is a good home remedy for a mild headache?",
        "language": "en"
    }
    
    async with httpx.AsyncClient() as client:
        res = await client.post(url, data=data, timeout=30.0)
        print(f"Status: {res.status_code}")
        
        if res.status_code == 200:
            json_resp = res.json()
            print("Response:", json_resp.get("response_text"))
            print("Detected Lang:", json_resp.get("detected_language"))
            print("Audio Length:", len(json_resp.get("audio_base64", "")) if json_resp.get("audio_base64") else 0)
        else:
            print("Error:", res.text)

    # Test 2: Emergency Safety Layer check
    print("\n--- Test 2: Emergency Override (Chest Pain) ---")
    data_emergency = {
        "text": "I am having severe chest pain right now.",
        "language": "en"
    }
    
    async with httpx.AsyncClient() as client:
        res = await client.post(url, data=data_emergency, timeout=30.0)
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            json_resp = res.json()
            print("Response:", json_resp.get("response_text"))
        else:
            print("Error:", res.text)


if __name__ == "__main__":
    asyncio.run(test_text_endpoint())
