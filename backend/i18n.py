"""
Backend i18n stub.
Provides plain-language strings for API responses and future SMS/voice output.
To add a new language, copy the STRINGS dict and translate values.
"""

STRINGS = {
    "en": {
        "triage": {
            "emergency": "Isolate this animal from the herd immediately. Call a vet now.",
            "high": "Isolate this animal. Seek veterinary treatment within 24 hours.",
            "moderate": "Begin treatment. Monitor closely. Contact a vet if no improvement in 2-3 days.",
            "low": "Monitor this animal. Provide clean water, feed, and shade.",
            "no_match": "No specific disease pattern detected. Continue monitoring.",
        },
        "risk_labels": {
            "emergency": "Emergency",
            "high": "High Risk",
            "moderate": "Moderate Risk",
            "low": "Low Risk",
        },
        "event_types": {
            "illness": "Illness",
            "treatment": "Treatment",
            "birth": "Birth",
            "death": "Death",
            "sale": "Sale",
            "vaccination": "Vaccination",
            "heat": "Heat / Estrus",
            "injury": "Injury",
            "other": "Other",
        },
        # Audio prompt templates (for future TTS / voice IVR)
        "audio_prompts": {
            "triage_start": "What symptoms does your animal have?",
            "triage_result_emergency": "Warning: emergency. Isolate the animal now and call a vet.",
            "triage_result_high": "High risk detected. Isolate this animal and call a vet today.",
            "triage_result_moderate": "Moderate risk. Begin treatment and monitor for 2 to 3 days.",
            "triage_result_low": "Low risk. Keep the animal comfortable and watch for changes.",
            "log_event": "Event recorded successfully.",
        }
    },
    # Future: add "ha" (Hausa), "sw" (Swahili), "yo" (Yoruba), "fr" (French)
}


def t(key: str, lang: str = "en") -> str:
    """Fetch a flat dot-notation key, e.g. t('triage.emergency')"""
    parts = key.split(".")
    node = STRINGS.get(lang, STRINGS["en"])
    for part in parts:
        if isinstance(node, dict):
            node = node.get(part, key)
        else:
            return key
    return node if isinstance(node, str) else key
