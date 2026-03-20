import React, { useState, useRef } from "react";
import Tesseract from "tesseract.js";
import { Upload, Image as ImageIcon, Loader2, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { LANGUAGES } from "../types";

interface OCRTranslatorProps {
  onTranslate: (text: string, source: string, target: string) => Promise<string>;
  onSaveHistory: (sourceText: string, translatedText: string, sourceLang: string, targetLang: string) => void;
}

import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default function OCRTranslator({ onTranslate, onSaveHistory }: OCRTranslatorProps) {
  const [image, setImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("te");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setExtractedText("");
        setTranslatedText("");
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!image) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // If Gemini API key is present, use it for OCR as it's much more accurate for mixed languages
      if (GEMINI_API_KEY) {
        try {
          const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
          const base64Data = image.split(',')[1];
          
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64Data
                }
              },
              {
                text: `Extract all text from this image. If the text is in multiple languages, extract it all accurately. Then, translate the extracted text to ${targetLang}. Return the result in JSON format: { "extractedText": "...", "translatedText": "..." }`
              }
            ],
            config: {
              responseMimeType: "application/json"
            }
          });

          const result = JSON.parse(response.text || "{}");
          if (result.extractedText) {
            setExtractedText(result.extractedText);
            setTranslatedText(result.translatedText || "");
            onSaveHistory(result.extractedText, result.translatedText || "", sourceLang, targetLang);
            setIsProcessing(false);
            return;
          }
        } catch (geminiError) {
          console.error("Gemini OCR Error, falling back to Tesseract:", geminiError);
        }
      }

      // Fallback to Tesseract.js
      let tessLang = "eng";
      if (sourceLang === "auto") tessLang = "eng+hin+tam+tel+mal";
      else if (sourceLang === "tel") tessLang = "eng+tel"; // Always include English for better mixed results
      else if (sourceLang === "tam") tessLang = "eng+tam";
      else if (sourceLang === "hin") tessLang = "eng+hin";
      else if (sourceLang === "mal") tessLang = "eng+mal";
      else tessLang = sourceLang;

      const result = await Tesseract.recognize(image, tessLang, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      
      const text = result.data.text.trim();
      setExtractedText(text);
      
      if (text) {
        // Map tesseract language code to google translate language code
        const gTranslateSource = sourceLang === "eng" ? "en" : sourceLang === "tel" ? "te" : sourceLang === "tam" ? "ta" : sourceLang === "hin" ? "hi" : sourceLang === "mal" ? "ml" : "auto";
        const translated = await onTranslate(text, gTranslateSource, targetLang);
        setTranslatedText(translated);
        onSaveHistory(text, translated, gTranslateSource, targetLang);
      } else {
        setTranslatedText("No text found in the image.");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      setExtractedText("Error extracting text. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden p-6"
    >
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Side: Upload & Preview */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <ImageIcon className="text-indigo-500" />
              Image Translation
            </h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-lg outline-none font-medium flex-1 sm:flex-none"
              >
                <option value="auto">Auto Detect</option>
                <option value="eng">English</option>
                <option value="tel">Telugu</option>
                <option value="tam">Tamil</option>
                <option value="hin">Hindi</option>
                <option value="mal">Malayalam</option>
              </select>
              <span className="text-gray-400">to</span>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-lg outline-none font-medium flex-1 sm:flex-none"
              >
                {LANGUAGES.filter(l => l.code !== "auto").map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer transition-all ${
              image 
                ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/10" 
                : "border-gray-300 dark:border-gray-700 hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            } min-h-[300px] relative overflow-hidden`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
            
            {image ? (
              <img src={image} alt="Preview" className="max-h-[280px] object-contain rounded-lg z-10" />
            ) : (
              <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
                <Upload size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Click to upload an image</p>
                <p className="text-sm mt-2">Supports JPG, PNG, WEBP</p>
              </div>
            )}
          </div>

          <button
            onClick={processImage}
            disabled={!image || isProcessing}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30 disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" />
                Processing ({progress}%)
              </>
            ) : (
              <>
                <RefreshCw size={20} />
                Extract & Translate
              </>
            )}
          </button>
        </div>

        {/* Right Side: Results */}
        <div className="flex-1 flex flex-col gap-4 min-h-[400px]">
          <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Extracted Text</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar text-gray-800 dark:text-gray-200">
              {extractedText ? (
                <p className="whitespace-pre-wrap">{extractedText}</p>
              ) : (
                <p className="text-gray-400 italic">Text will appear here...</p>
              )}
            </div>
          </div>

          <div className="flex-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800/50 flex flex-col">
            <h3 className="text-sm font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-3">Translation</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar text-gray-800 dark:text-gray-100 text-xl">
              {translatedText ? (
                <p className="whitespace-pre-wrap">{translatedText}</p>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 italic">Translation will appear here...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
