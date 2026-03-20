import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Send, Globe, MessageSquare } from "lucide-react";
import { motion } from "motion/react";
import { ChatMessage, LANGUAGES } from "../types";

interface ChatInterfaceProps {
  onTranslate: (text: string, source: string, target: string) => Promise<string>;
}

export default function ChatInterface({ onTranslate }: ChatInterfaceProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [myLang, setMyLang] = useState("en");
  const [username, setUsername] = useState(`User_${Math.floor(Math.random() * 1000)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to Socket.io server
    // Note: Vercel Serverless Functions do not support persistent WebSockets.
    // This feature will only work in environments with a dedicated Node.js server (like Railway or local).
    try {
      const newSocket = io(window.location.origin, {
        reconnectionAttempts: 3,
        timeout: 5000,
      });
      
      newSocket.on("connect", () => setIsConnected(true));
      newSocket.on("disconnect", () => setIsConnected(false));
      newSocket.on("connect_error", (err) => {
        console.warn("Socket connection failed. Real-time chat might be unavailable on this platform:", err.message);
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } catch (e) {
      console.error("Socket initialization error:", e);
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("receive_message", async (data: ChatMessage) => {
      // Translate incoming message to my language
      try {
        const translated = await onTranslate(data.originalText, data.sourceLang, myLang);
        setMessages((prev) => [...prev, { ...data, translatedText: translated, targetLang: myLang }]);
      } catch (error) {
        console.error("Translation error", error);
        setMessages((prev) => [...prev, { ...data, translatedText: "[Translation Error]", targetLang: myLang }]);
      }
    });

    return () => {
      socket.off("receive_message");
    };
  }, [socket, myLang, onTranslate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const joinRoom = () => {
    if (room.trim() && socket) {
      socket.emit("join_room", room);
      setJoined(true);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !socket) return;

    const messageData: ChatMessage = {
      id: Date.now().toString(),
      room,
      sender: username,
      originalText: input,
      translatedText: input, // For sender, it's the same initially
      sourceLang: myLang,
      targetLang: myLang,
      timestamp: Date.now(),
    };

    // Optimistically add to UI
    setMessages((prev) => [...prev, messageData]);
    
    // Send to server
    socket.emit("send_message", messageData);
    setInput("");
  };

  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md text-center"
        >
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare size={40} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Join Translation Chat</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Chat in your native language, we'll translate it for others.</p>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Your Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-800 dark:text-gray-200"
            />
            <input
              type="text"
              placeholder="Room Code (e.g. global)"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-800 dark:text-gray-200"
            />
            <select
              value={myLang}
              onChange={(e) => setMyLang(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-800 dark:text-gray-200"
            >
              {LANGUAGES.filter(l => l.code !== "auto").map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
            <button
              onClick={joinRoom}
              disabled={!room.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/30 disabled:opacity-50"
            >
              Join Room
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white/50 dark:bg-black/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
            <Globe size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Room: {room}</h3>
            <p className={`text-xs font-medium flex items-center gap-1 ${isConnected ? "text-green-500" : "text-red-500"}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span> 
              {isConnected ? "Connected" : "Disconnected (Real-time chat not supported on Vercel)"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">My Language:</span>
          <select
            value={myLang}
            onChange={(e) => setMyLang(e.target.value)}
            className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md text-sm outline-none"
          >
            {LANGUAGES.filter(l => l.code !== "auto").map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/50 dark:bg-gray-900/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender === username;
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={idx}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <span className="text-xs text-gray-400 dark:text-gray-500 mb-1 px-1">
                  {msg.sender} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div 
                  className={`max-w-[75%] rounded-2xl p-4 ${
                    isMe 
                      ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-500/20" 
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-700"
                  }`}
                >
                  <p className="text-lg">{isMe ? msg.originalText : msg.translatedText}</p>
                  {!isMe && msg.originalText !== msg.translatedText && (
                    <p className="text-xs mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 opacity-70 italic">
                      Original ({msg.sourceLang}): {msg.originalText}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/30"
          >
            <Send size={20} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
