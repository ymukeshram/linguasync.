import { Moon, Sun, Languages } from "lucide-react";

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ darkMode, setDarkMode, activeTab, setActiveTab }: NavbarProps) {
  return (
    <nav className="flex items-center justify-between p-4 bg-white/50 dark:bg-black/50 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-indigo-500 rounded-lg text-white">
          <Languages size={24} />
        </div>
        <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent hidden sm:block">
          LinguaSync
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg overflow-x-auto custom-scrollbar">
          {["translate", "chat", "ocr", "history"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium capitalize transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              } ${tab === "history" ? "lg:hidden" : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-1.5 md:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? <Sun size={18} className="md:w-5 md:h-5" /> : <Moon size={18} className="md:w-5 md:h-5" />}
        </button>
      </div>
    </nav>
  );
}
