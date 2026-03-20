export interface TranslationHistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  room: string;
  sender: string;
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
}

export const LANGUAGES = [
  { code: "auto", name: "Auto Detect" },
  { code: "en", name: "English" },
  { code: "te", name: "Telugu" },
  { code: "ta", name: "Tamil" },
  { code: "hi", name: "Hindi" },
  { code: "ml", name: "Malayalam" },
];
