/**
 * Audio / voice abstraction layer.
 *
 * Currently uses the Web Speech API (SpeechSynthesis) which is available
 * in most modern mobile browsers. No external dependency needed.
 *
 * Future extensions:
 * - Swap speak() for a server-side TTS call (e.g. Google TTS, Azure Cognitive)
 *   to support local languages like Hausa, Swahili, Yoruba
 * - Add voice INPUT via SpeechRecognition for symptom capture by voice
 * - Integrate with USSD/IVR gateways for feature phone support
 */

let currentLang = 'en-US';

export function setAudioLang(lang: string): void {
  currentLang = lang;
}

export function speak(text: string, lang?: string): void {
  if (typeof window === 'undefined') return;
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel(); // stop any current speech
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang ?? currentLang;
  utterance.rate = 0.9;  // slightly slower for field conditions
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined') return;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Audio prompts — keep in sync with backend i18n.py
export const AUDIO_PROMPTS = {
  triageStart: 'What symptoms does your animal have?',
  triageEmergency: 'Warning: emergency. Isolate the animal now and call a vet.',
  triageHigh: 'High risk detected. Isolate this animal and call a vet today.',
  triageModerate: 'Moderate risk. Begin treatment and monitor for 2 to 3 days.',
  triageLow: 'Low risk. Keep the animal comfortable and watch for changes.',
  eventSaved: 'Event recorded successfully.',
  animalSaved: 'Animal registered successfully.',
};
