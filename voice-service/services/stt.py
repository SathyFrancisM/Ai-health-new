import speech_recognition as sr
from langdetect import detect

def transcribe_audio(audio_path: str) -> tuple[str, str]:
    """
    Transcribes an audio file and detects its language from transcribed text.
    Returns: (transcribed_text, detected_language_code)
    """
    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(audio_path) as source:
            audio = recognizer.record(source)
            text = recognizer.recognize_google(audio)
            
            # Auto-detect language of the transcribed text
            try:
                detected_lang = detect(text)
            except:
                detected_lang = "en"
                
            return text.strip(), detected_lang
    except sr.UnknownValueError:
        print("[STT] Error: Speech could not be understood.")
        raise Exception("Unclear audio")
    except Exception as e:
        print(f"[STT] Error during transcription: {e}")
        raise e


