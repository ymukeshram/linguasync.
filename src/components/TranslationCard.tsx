import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Copy, Download, ArrowRightLeft, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { LANGUAGES, TranslationHistoryItem } from "../types";

interface TranslationCardProps {
  onTranslate: (text: string, source: string, target: string) => Promise<string>;
  onSaveHistory: (sourceText: string, translatedText: string, sourceLang: string, targetLang: string) => void;
  reuseItem?: TranslationHistoryItem | null;
  onReuseComplete?: () => void;
}

export default function TranslationCard({ onTranslate, onSaveHistory, reuseItem, onReuseComplete }: TranslationCardProps) {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (reuseItem) {
      setSourceText(reuseItem.sourceText);
      setTranslatedText(reuseItem.translatedText);
      setSourceLang(reuseItem.sourceLang);
      setTargetLang(reuseItem.targetLang);
      if (onReuseComplete) onReuseComplete();
    }
  }, [reuseItem, onReuseComplete]);

  useEffect(() => {
    // Setup Speech Recognition
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSourceText(transcript);
        handleTranslate(transcript, sourceLang, targetLang);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [sourceLang, targetLang]);

  const handleTranslate = async (text: string, source: string, target: string) => {
    if (!text.trim()) {
      setTranslatedText("");
      return;
    }
    setIsTranslating(true);
    try {
      const result = await onTranslate(text, source, target);
      setTranslatedText(result);
      onSaveHistory(text, result, source, target);
    } catch (error) {
      setTranslatedText("Error translating text. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLang === "auto") return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const speakText = (text: string, lang: string) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "auto" ? "en-US" : lang;
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadText = (text: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "translation.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current.lang = sourceLang === "auto" ? "en-US" : sourceLang;
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-6xl mx-auto"
    >
      <div className="flex flex-col lg:flex-row items-stretch gap-4 relative">
        {/* Source Panel */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden min-h-[450px]">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="bg-transparent text-gray-700 dark:text-gray-200 font-semibold text-sm focus:outline-none cursor-pointer hover:text-indigo-600 transition-colors"
            >
              {LANGUAGES.map((lang) => (
                <option key={`source-${lang.code}`} value={lang.code} className="text-black">
                  {lang.name}
                </option>
              ))}
            </select>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Source</span>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 flex flex-col">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleTranslate(sourceText, sourceLang, targetLang);
                }
              }}
              placeholder="Type or paste text here..."
              className="flex-1 w-full bg-transparent resize-none focus:outline-none text-xl text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-700 leading-relaxed"
            />
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
            <div className="flex items-center gap-1">
              <button 
                onClick={toggleListening}
                title="Voice Input"
                className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-indigo-600'}`}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button 
                onClick={() => speakText(sourceText, sourceLang)}
                title="Listen"
                className="p-2.5 rounded-xl text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-indigo-600 transition-all"
              >
                <Volume2 size={18} />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400 font-medium">{sourceText.length} / 5000</span>
              <button
                onClick={() => handleTranslate(sourceText, sourceLang, targetLang)}
                disabled={isTranslating || !sourceText.trim()}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:shadow-none"
              >
                {isTranslating ? <Loader2 className="animate-spin" size={18} /> : "Translate"}
              </button>
            </div>
          </div>
        </div>

        {/* Swap Divider */}
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <button
            onClick={handleSwapLanguages}
            disabled={sourceLang === "auto"}
            className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:scale-110 transition-all active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            <ArrowRightLeft size={20} />
          </button>
        </div>

        {/* Target Panel */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden min-h-[450px]">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-transparent text-gray-700 dark:text-gray-200 font-semibold text-sm focus:outline-none cursor-pointer hover:text-indigo-600 transition-colors"
            >
              {LANGUAGES.filter(l => l.code !== "auto").map((lang) => (
                <option key={`target-${lang.code}`} value={lang.code} className="text-black">
                  {lang.name}
                </option>
              ))}
            </select>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Translation</span>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 flex flex-col bg-indigo-50/5 dark:bg-indigo-900/5">
            {isTranslating ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-indigo-500">
                <Loader2 className="animate-spin" size={32} />
                <span className="text-sm font-medium animate-pulse">Translating...</span>
              </div>
            ) : (
              <div className="flex-1 w-full text-xl text-gray-800 dark:text-gray-100 whitespace-pre-wrap overflow-y-auto leading-relaxed">
                {translatedText || <span className="text-gray-300 dark:text-gray-700 italic">Your translation will appear here...</span>}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => speakText(translatedText, targetLang)}
                disabled={!translatedText}
                title="Listen"
                className="p-2.5 rounded-xl text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-indigo-600 transition-all disabled:opacity-30"
              >
                <Volume2 size={18} />
              </button>
              <button 
                onClick={() => copyToClipboard(translatedText)}
                disabled={!translatedText}
                title="Copy"
                className="p-2.5 rounded-xl text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-indigo-600 transition-all disabled:opacity-30"
              >
                <Copy size={18} />
              </button>
              <button 
                onClick={() => downloadText(translatedText)}
                disabled={!translatedText}
                title="Download"
                className="p-2.5 rounded-xl text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-indigo-600 transition-all disabled:opacity-30"
              >
                <Download size={18} />
              </button>
            </div>
            {translatedText && (
              <span className="text-[10px] font-bold text-indigo-500/50 uppercase tracking-widest">Verified by AI</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
