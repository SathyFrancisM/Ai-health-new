import httpx
import os

RAG_API_URL = os.getenv("RAG_API", "http://localhost:5000/api/rag/query")

# Safety Keywords Trigger
CRITICAL_KEYWORDS = ["chest pain", "severe bleeding", "breathing issue", "heart attack", "stroke"]

async def query_rag_engine(text: str) -> str:
    """
    Checks for critical keywords, and if safe, calls the existing Express RAG API.
    """
    text_lower = text.lower()
    
    # 1. Critical Safety Check (Short-circuit API call)
    if any(keyword in text_lower for keyword in CRITICAL_KEYWORDS):
        return "Please consult a doctor immediately. This could be a medical emergency. Do not rely on home remedies for this symptom."

    # 2. Call Node.js RAG API
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                RAG_API_URL, 
                json={"query": text, "allergies": []}, 
                timeout=15.0
            )
            response.raise_for_status()
            data = response.json()
            return data.get("text", "I'm sorry, I couldn't find a remedy for that right now.")
            
    except Exception as e:
        print(f"[RAG] Error calling primary backend RAG API: {e}")
        return "I am currently unable to reach the medical database. Please try again later."
