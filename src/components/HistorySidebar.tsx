import { Clock, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TranslationHistoryItem } from "../types";

interface HistorySidebarProps {
  history: TranslationHistoryItem[];
  onClearHistory: () => void;
  onReuse: (item: TranslationHistoryItem) => void;
}

export default function HistorySidebar({ history, onClearHistory, onReuse }: HistorySidebarProps) {
  return (
    <div className="w-full lg:w-80 h-full bg-white/50 dark:bg-black/50 backdrop-blur-md border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden transition-colors duration-300">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Clock size={20} className="text-indigo-500" />
          History
        </h2>
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Clear History"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <AnimatePresence>
          {history.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-500 dark:text-gray-400 mt-10"
            >
              No translation history yet.
            </motion.div>
          ) : (
            history.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all group"
                onClick={() => onReuse(item)}
              >
                <div className="flex items-center justify-between mb-2 text-xs font-medium text-gray-400 dark:text-gray-500">
                  <span className="uppercase tracking-wider">{item.sourceLang} → {item.targetLang}</span>
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2 mb-1">
                  {item.sourceText}
                </p>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 line-clamp-2 font-medium">
                  {item.translatedText}
                </p>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
