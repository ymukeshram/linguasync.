import { Languages, MessageSquare, Scan, Clock, ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { motion } from "motion/react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }: SidebarProps) {
  const menuItems = [
    { id: "translate", label: "Translate", icon: Languages },
    //{ id: "chat", label: "Chat", icon: MessageSquare },
    { id: "ocr", label: "OCR", icon: Scan },
    { id: "history", label: "History", icon: Clock },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? "80px" : "260px" }}
      className="h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col relative z-30 transition-colors duration-300"
    >
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-3 overflow-hidden">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
          <Languages className="text-white" size={24} />
        </div>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent whitespace-nowrap"
          >
            LinguaSync
          </motion.span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-2 mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative ${
                isActive 
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" 
                  : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <Icon size={22} className={isActive ? "text-indigo-600 dark:text-indigo-400" : "group-hover:text-indigo-500"} />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-medium whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
              
              {/* Active Indicator Glow */}
              {isActive && (
                <div className="absolute inset-0 rounded-xl border border-indigo-500/20 dark:border-indigo-400/20 shadow-[0_0_15px_rgba(99,102,241,0.1)] pointer-events-none" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-4 p-3 rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
        >
          {isCollapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
          {!isCollapsed && <span className="font-medium">Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
}
