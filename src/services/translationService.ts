import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const translateText = async (
  q: string,
  source: string,
  target: string
): Promise<string> => {
  if (!q.trim()) return "";

  // If Gemini API key is present, use it for higher accuracy and reliability
  if (GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate the following text from ${source === "auto" ? "auto-detected language" : source} to ${target}. Only return the translated text, nothing else.\n\nText: ${q}`,
      });
      return response.text || "";
    } catch (error) {
      console.error("Gemini translation error, falling back to proxy:", error);
    }
  }

  try {
    // Using our backend proxy to avoid CORS and rate limiting issues
    const sl = source === "auto" ? "auto" : source;
    const tl = target;
    const url = `/api/translate?sl=${sl}&tl=${tl}&q=${encodeURIComponent(q)}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data && data[0]) {
      // Google Translate returns an array of segments, we need to join them
      const translatedText = data[0].map((item: any) => item[0]).join("");
      return translatedText;
    }
    
    throw new Error("Translation failed");
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
};


