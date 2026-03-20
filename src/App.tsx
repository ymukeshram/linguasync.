/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import TranslationCard from "./components/TranslationCard";
import HistorySidebar from "./components/HistorySidebar";
import ChatInterface from "./components/ChatInterface";
import OCRTranslator from "./components/OCRTranslator";
import { translateText } from "./services/translationService";
import { TranslationHistoryItem } from "./types";
import { Sun, Moon } from "lucide-react";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("translate");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
  const [reuseItem, setReuseItem] = useState<TranslationHistoryItem | null>(null);

  useEffect(() => {
    // Load history from local storage
    const savedHistory = localStorage.getItem("translationHistory");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    // Load theme preference
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(isDark);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handleSaveHistory = (
    sourceText: string,
    translatedText: string,
    sourceLang: string,
    targetLang: string
  ) => {
    const newItem: TranslationHistoryItem = {
      id: Date.now().toString(),
      sourceText,
      translatedText,
      sourceLang,
      targetLang,
      timestamp: Date.now(),
    };
    
    setHistory((prev) => {
      const newHistory = [newItem, ...prev].slice(0, 50); // Keep last 50
      localStorage.setItem("translationHistory", JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("translationHistory");
  };

  const handleReuseHistory = (item: TranslationHistoryItem) => {
    setReuseItem(item);
    setActiveTab("translate");
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 flex`}>
      {/* Background gradients */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 dark:bg-indigo-600/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 dark:bg-purple-600/5 blur-[120px]" />
      </div>

      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />

      <div className="flex-1 flex flex-col h-screen relative z-10 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 bg-white/50 dark:bg-black/50 backdrop-blur-md">
          <h1 className="text-lg font-semibold capitalize text-gray-800 dark:text-gray-200">
            {activeTab}
          </h1>
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-indigo-500 transition-all border border-gray-200 dark:border-gray-700"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-gray-50/30 dark:bg-black/30">
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            {activeTab === "translate" && (
              <div className="flex-1 flex flex-col items-center justify-center py-4 w-full">
                <div className="text-center mb-8 px-4">
                  <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Break Language Barriers
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
                    Instantly translate text, voice, and images across multiple languages with our advanced AI-powered platform.
                  </p>
                </div>
                <div className="w-full px-2 md:px-0">
                  <TranslationCard 
                    onTranslate={translateText} 
                    onSaveHistory={handleSaveHistory} 
                    reuseItem={reuseItem}
                    onReuseComplete={() => setReuseItem(null)}
                  />
                </div>
              </div>
            )}

            {activeTab === "chat" && (
              <div className="flex-1 py-6">
                <ChatInterface onTranslate={translateText} />
              </div>
            )}

            {activeTab === "ocr" && (
              <div className="flex-1 py-6">
                <OCRTranslator onTranslate={translateText} onSaveHistory={handleSaveHistory} />
              </div>
            )}

            {activeTab === "history" && (
              <div className="flex-1 py-6">
                <div className="h-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
                  <HistorySidebar 
                    history={history} 
                    onClearHistory={clearHistory} 
                    onReuse={handleReuseHistory} 
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

