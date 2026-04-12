import os
import uuid
from gtts import gTTS

# Directory to temporarily store generated audio files
AUDIO_DIR = "temp_audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

def generate_tts(text: str, lang_code: str) -> str:
    """
    Generates TTS audio using gTTS.
    Returns the file path of the generated audio.
    """
    try:
        # Some whisper codes might not match gTTS exactly, but mostly they do.
        # Fallback to English if gTTS throws a ValueError for unsupported language
        tts = gTTS(text=text, lang=lang_code)
        
        filename = f"{uuid.uuid4().hex}.mp3"
        filepath = os.path.join(AUDIO_DIR, filename)
        
        tts.save(filepath)
        return filepath
        
    except ValueError as ve:
        print(f"[TTS] Language '{lang_code}' not supported by gTTS, falling back to English: {ve}")
        tts_en = gTTS(text=text, lang="en")
        filename = f"{uuid.uuid4().hex}.mp3"
        filepath = os.path.join(AUDIO_DIR, filename)
        tts_en.save(filepath)
        return filepath
    except Exception as e:
        print(f"[TTS] Error generating audio: {e}")
        return ""
