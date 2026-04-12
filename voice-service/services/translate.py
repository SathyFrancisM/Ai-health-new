from deep_translator import GoogleTranslator

def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    """
    Bidirectional translation using Google Translate.
    """
    if source_lang == target_lang:
        return text
    
    try:
        translator = GoogleTranslator(source=source_lang, target=target_lang)
        translated = translator.translate(text)
        return translated
    except Exception as e:
        print(f"[Translation] Error translating {source_lang} to {target_lang}: {e}")
        # Fallback to original text if translation fails to prevent crashing
        return text
