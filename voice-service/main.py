import os
import shutil
import base64
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from services.stt import transcribe_audio
from services.translate import translate_text
from services.rag import query_rag_engine
from services.tts import generate_tts

from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="MediGuide Voice Service")

# Allow CORS since UI might be on port 3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("temp_audio", exist_ok=True)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "voice-chatbot"}

@app.post("/voice/query")
async def process_voice_query(audio: UploadFile = File(...)):
    """
    1. Save incoming audio.
    2. STT -> Detect language + English text.
    3. If not English -> translate to English.
    4. Call Node Backend RAG API.
    5. Translate response back to original language.
    6. Generate TTS audio in original language.
    7. Return Base64 audio + translated text + detected language.
    """
    temp_in_path = f"temp_audio/in_{audio.filename}"
    
    # Save incoming audio file
    try:
        with open(temp_in_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
    except Exception as e:
        print(f"[API] Error saving audio: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse audio file")

    # Step 1 & 2: STT
    try:
        transcribed_text, detected_lang = transcribe_audio(temp_in_path)
        print(f"[API] Transcribed ({detected_lang}): {transcribed_text}")
    except Exception as e:
        return JSONResponse(content={
            "error": "Could not understand audio",
            "detected_language": "unknown"
        }, status_code=400)
    finally:
        if os.path.exists(temp_in_path):
            os.remove(temp_in_path)

    # Step 3: English Translation
    english_query = transcribed_text
    if detected_lang != "en":
        english_query = translate_text(transcribed_text, source_lang=detected_lang, target_lang="en")

    # Step 4: RAG processing
    rag_response_english = await query_rag_engine(english_query)

    # Step 5: Translate back
    final_response_text = rag_response_english
    if detected_lang != "en":
        final_response_text = translate_text(rag_response_english, source_lang="en", target_lang=detected_lang)

    # Step 6: Text-to-Speech
    tts_audio_path = generate_tts(final_response_text, lang_code=detected_lang)

    # Step 7: Convert audio to base64
    audio_base64 = None
    if tts_audio_path and os.path.exists(tts_audio_path):
        try:
            with open(tts_audio_path, "rb") as f:
                audio_base64 = base64.b64encode(f.read()).decode("utf-8")
        finally:
            os.remove(tts_audio_path)
    else:
        print("[API] TTS Failed generating audio file.")
        
    return {
        "detected_language": detected_lang,
        "query_text": transcribed_text,
        "response_text": final_response_text,
        "audio_base64": audio_base64
    }

@app.post("/voice/text")
async def process_text_query(text: str = Form(...), language: str = Form(None)):
    """
    Same as /voice/query but accepts text directly and an optional force language.
    Does NOT do STT. Output is still translated + TTS.
    """
    detected_lang = language if language else "en"
    
    # Step 3: English Translation
    english_query = text
    if detected_lang != "en":
        english_query = translate_text(text, source_lang=detected_lang, target_lang="en")

    # Step 4: RAG processing
    rag_response_english = await query_rag_engine(english_query)

    # Step 5: Translate back
    final_response_text = rag_response_english
    if detected_lang != "en":
        final_response_text = translate_text(rag_response_english, source_lang="en", target_lang=detected_lang)

    # Step 6: Text-to-Speech
    tts_audio_path = generate_tts(final_response_text, lang_code=detected_lang)

    # Step 7: Convert audio to base64
    audio_base64 = None
    if tts_audio_path and os.path.exists(tts_audio_path):
        try:
            with open(tts_audio_path, "rb") as f:
                audio_base64 = base64.b64encode(f.read()).decode("utf-8")
        finally:
            os.remove(tts_audio_path)

    return {
        "detected_language": detected_lang,
        "query_text": text,
        "response_text": final_response_text,
        "audio_base64": audio_base64
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8004))
    print(f"Starting Voice Service on Port {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
