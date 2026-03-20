import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests (matching original Express route)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { q, sl, tl } = req.query;
    
    if (!q || !sl || !tl) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    // Ensure API key is present
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not defined in environment variables");
      return res.status(500).json({ error: "API key configuration error" });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `You are a highly accurate translation engine.
Translate the following text from ${sl === 'auto' ? 'its detected language (handle transliterated text like Telugu/Hindi in English script natively)' : sl} to language code '${tl}'.
If the text is mixed language, translate all parts to '${tl}'.
Return ONLY the final translated text. Do not include any quotes, explanations, or markdown formatting.

Text to translate:
${q}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-preview",
      contents: prompt,
    });

    const translatedText = response.text?.trim() || "";

    // Return in the format expected by the frontend (Google Translate array format)
    // Using res.status(200).json to be explicit
    return res.status(200).json([[[translatedText]]]);
  } catch (error) {
    console.error("Translation proxy error:", error);
    return res.status(500).json({ error: "Translation failed" });
  }
}
