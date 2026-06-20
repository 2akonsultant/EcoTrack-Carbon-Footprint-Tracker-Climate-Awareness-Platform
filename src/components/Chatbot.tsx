/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { 
  Send, 
  MessageSquare, 
  Sparkles, 
  RefreshCw, 
  ArrowRight,
  User,
  Heart,
  HelpCircle,
  X,
  Plus
} from "lucide-react";

interface ChatbotProps {
  isEmbedded?: boolean; // True if rendered inside a tab, False if a floating widget
  onCloseFloating?: () => void;
}

export default function Chatbot({ isEmbedded = true, onCloseFloating }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      text: "👋 Hi there! I'm EcoBot, your climate action learning buddy. Ask me anything about carbon footprints, green habits, climate science, or how to reduce your calculations!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompt tags for starting conversations
  const starterQuestions = [
    "What is the biggest contributor to my footprint?",
    "How does carbon impact climate change?",
    "Does diet affect greenhouse gas emissions?",
    "Give me 3 easy steps to save electricity!"
  ];

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: "usr_" + Date.now(),
      role: "user",
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Assemble history to keep bot contextual
      // Extract latest 6 messages (turns) to avoid excessive tokens
      const chatHistory = messages
        .filter(m => m.id !== "welcome")
        .slice(-6)
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: chatHistory
        })
      });

      const data = await response.json();
      
      const botMsg: ChatMessage = {
        id: "bot_" + Date.now(),
        role: "model",
        text: data.text || "I was unable to retrieve a response, but rest assured, every micro-step you take for our planet counts!",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat API fetch error:", error);
      const errorMsg: ChatMessage = {
        id: "err_" + Date.now(),
        role: "model",
        text: "I'm experiencing a small connection delay. Generally, changing your transport mode to biking, composting organic waste, and cutting beef consumption are the biggest individual carbon saver steps! What other questions do you have?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleStarterClick = (question: string) => {
    handleSendMessage(question);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "model",
        text: "👋 Welcome back! Ask me anything about environmental science, recycling rules, or how micro-habits shrink carbon footprints.",
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div 
      id="chatbot-container" 
      className={`bg-white border text-left border-slate-100 shadow-sm flex flex-col justify-between transition-all overflow-hidden ${
        isEmbedded 
          ? "h-[600px] rounded-3xl w-full" 
          : "fixed bottom-[88px] right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[460px] rounded-3xl shadow-2xl z-50 border border-slate-200 animate-slideUp"
      }`}
    >
      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-[#0D9488] to-[#0f766e] px-5 py-4 text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
            <Sparkles size={16} className="text-teal-350" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-sm tracking-wide">EcoTrack Learning Buddy</h3>
            <p className="text-[10px] text-teal-100 flex items-center space-x-1 mt-0.5 font-mono">
              <span className="w-1.5 h-1.5 bg-teal-300 rounded-full inline-block animate-pulse"></span>
              <span>Ask Climate Science Questions</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={handleResetChat}
            className="p-1.5 hover:bg-white/10 rounded-lg text-teal-100 hover:text-white transition-all cursor-pointer"
            title="Reset Conversation"
          >
            <RefreshCw size={14} />
          </button>
          {!isEmbedded && onCloseFloating && (
            <button 
              onClick={onCloseFloating}
              className="p-1.5 bg-white/20 hover:bg-rose-650 border border-white/20 hover:border-rose-500 rounded-lg text-white transition-all duration-150 cursor-pointer flex items-center justify-center shadow-3xs"
              title="Close Chat"
              aria-label="Close Chat"
            >
              <X size={16} className="text-white shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* MESSAGES CORE SCROLL CONTAINER */}
      <div className="p-5 flex-1 overflow-y-auto space-y-4 bg-[#F8FAFC]">
        {messages.map((msg) => {
          const isMe = msg.role === "user";
          return (
            <div 
              key={msg.id} 
              className={`flex items-start space-x-2.5 max-w-[85%] ${
                isMe ? "ml-auto flex-row-reverse space-x-reverse" : "mr-auto"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border text-xs font-semibold ${
                isMe 
                  ? "bg-slate-200 text-slate-700 border-slate-350" 
                  : "bg-teal-50 text-[#0D9488] border-teal-100"
              }`}>
                {isMe ? <User size={14} /> : "🌱"}
              </div>

              <div className={`p-4 rounded-2xl text-xs leading-relaxed font-semibold font-sans ${
                isMe 
                  ? "bg-[#0D9488] text-white rounded-tr-none shadow-xs" 
                  : "bg-white text-slate-700 shadow-3xs border border-slate-100 rounded-tl-none leading-relaxed"
              }`}>
                <p className="whitespace-pre-line">{msg.text}</p>
                <div className={`text-[8px] mt-2 block text-right font-mono font-bold ${
                  isMe ? "text-teal-100" : "text-slate-400"
                }`}>
                  {msg.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start space-x-2.5 max-w-[85%] mr-auto animate-fadeIn">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-teal-50 text-[#0D9488] border border-teal-100">
              🌱
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-3xs">
              <div className="flex space-x-1.5 py-1 items-center animate-pulse">
                <span className="w-1.5 h-1.5 bg-[#0D9488] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 bg-[#0D9488] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 bg-[#0D9488] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* SUGGESTED STARTERS DIRECTORY */}
      {messages.length === 1 && !loading && (
        <div className="px-5 py-3.5 border-t border-slate-150 bg-white space-y-2 animate-fadeIn">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center space-x-1 font-mono">
            <HelpCircle size={10} />
            <span>Click starter questions:</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {starterQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleStarterClick(q)}
                className="text-[11px] bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#0D9488] font-bold px-3 py-1.5 rounded-xl border border-transparent hover:border-[#10B981]/20 transition-all text-left truncate max-w-full cursor-pointer shadow-3xs"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER CHAT INPUT FORM */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} 
        className="p-4 border-t border-slate-100 bg-white flex items-center space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about saving electricity, biking, global warming..."
          disabled={loading}
          className="flex-1 bg-slate-50 border-2 border-slate-100 focus:border-[#0D9488] rounded-xl p-3 text-xs font-semibold focus:outline-none text-slate-850 disabled:opacity-60 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-3 bg-[#0D9488] hover:bg-[#0b7a70] disabled:bg-slate-100 text-white disabled:text-slate-450 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
