/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { LogEntry, Badge, CalculationInput } from "./types";
import { INITIAL_BADGES, evaluateBadges } from "./utils";
import Calculator from "./components/Calculator";
import Dashboard from "./components/Dashboard";
import Chatbot from "./components/Chatbot";
import DidYouKnow from "./components/DidYouKnow";
import { 
  Leaf, 
  BarChart4, 
  MessageSquare, 
  Sparkles, 
  Award, 
  TrendingDown, 
  HelpCircle,
  X,
  Play,
  Check
} from "lucide-react";

export default function App() {
  // 1. GLOBAL STATE
  const [activeTab, setActiveTab] = useState<"calculator" | "dashboard" | "chat">("calculator");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [badges, setBadges] = useState<Badge[]>(INITIAL_BADGES);
  const [streak, setStreak] = useState<number>(0);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState<boolean>(false);

  // Active badge unlock popup notification overlay state
  const [unlockedToast, setUnlockedToast] = useState<string | null>(null);

  // 2. BOOTSTRAP INITIAL CLIENT PERSISTENCE
  useEffect(() => {
    // Load Logs
    const cachedLogs = localStorage.getItem("ecotrack_logs");
    const loadedLogs: LogEntry[] = cachedLogs ? JSON.parse(cachedLogs) : [];
    setLogs(loadedLogs);

    // Calculate Streak from unique calendar days logged
    const uniqueDates = new Set(loadedLogs.map(l => l.date));
    const calculatedStreak = uniqueDates.size;
    setStreak(calculatedStreak);

    // Load or generate Badges
    const cachedBadges = localStorage.getItem("ecotrack_badges");
    let loadedBadges: Badge[] = cachedBadges ? JSON.parse(cachedBadges) : INITIAL_BADGES;

    // Evaluate badges right away in case they already met criteria
    const { updatedBadges } = evaluateBadges(loadedLogs, calculatedStreak, loadedBadges);
    setBadges(updatedBadges);
    localStorage.setItem("ecotrack_badges", JSON.stringify(updatedBadges));
  }, []);

  // 3. PERSIST RE-EVALUATION ON LOG MODIFICATIONS
  const handleSaveLog = (newLog: LogEntry) => {
    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);
    localStorage.setItem("ecotrack_logs", JSON.stringify(updatedLogs));

    // Recalculate streak
    const uniqueDates = new Set(updatedLogs.map(l => l.date));
    const newStreak = uniqueDates.size;
    setStreak(newStreak);

    // Evaluate and unlock badges
    const { updatedBadges, newlyUnlocked } = evaluateBadges(updatedLogs, newStreak, badges);
    setBadges(updatedBadges);
    localStorage.setItem("ecotrack_badges", JSON.stringify(updatedBadges));

    // Trigger congratulations toast if any badges newly unlocked!
    if (newlyUnlocked.length > 0) {
      setUnlockedToast(newlyUnlocked.join(", "));
    }
  };

  const handleDeleteLog = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this calculation log?")) return;
    const updated = logs.filter(l => l.id !== id);
    setLogs(updated);
    localStorage.setItem("ecotrack_logs", JSON.stringify(updated));

    // Re-evaluate badges on deletion
    const uniqueDates = new Set(updated.map(l => l.date));
    const newStreak = uniqueDates.size;
    setStreak(newStreak);

    const { updatedBadges } = evaluateBadges(updated, newStreak, INITIAL_BADGES);
    setBadges(updatedBadges);
    localStorage.setItem("ecotrack_badges", JSON.stringify(updatedBadges));
  };

  const handleClearLogs = () => {
    if (!window.confirm("This will permanently clear all your carbon footprints history progress logs. Proceed?")) return;
    setLogs([]);
    setStreak(0);
    setBadges(INITIAL_BADGES);
    localStorage.removeItem("ecotrack_logs");
    localStorage.removeItem("ecotrack_badges");
  };

  return (
    <div className="min-h-screen bg-[#F0FDFA] flex flex-col justify-between font-sans">
      
      {/* GLOBAL TOAST OVERLAY FOR NEW REWARDS ACHIEVEMENT */}
      {unlockedToast && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center border-2 border-emerald-100 shadow-2xl relative overflow-hidden">
            {/* Confetti styling bars */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"></div>
            
            <div className="mx-auto w-20 h-20 bg-[#ECFDF5] text-emerald-600 rounded-full flex items-center justify-center mb-6 border border-[#10B981]">
              <Award size={44} className="animate-bounce" />
            </div>

            <h3 className="font-display text-2xl font-black text-slate-850">Milestone Badge Unlocked!</h3>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              Incredible effort! You have earned the prestigious milestone designation badge:
            </p>
            <div className="my-5 bg-[#ECFDF5] text-emerald-800 font-sans font-extrabold text-lg py-3.5 px-6 rounded-2xl border border-emerald-200 inline-block">
              🏆 {unlockedToast}
            </div>

            <button
              onClick={() => setUnlockedToast(null)}
              className="w-full bg-[#0D9488] hover:bg-[#0b7a70] text-white font-bold font-sans py-3.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Keep Logging Habits</span>
              <Check size={16} />
            </button>
          </div>
        </div>
      )}

      {/* PERSISTENT ACCENT TOP HEADER NAVIGATION */}
      <header className="sticky top-0 z-45 bg-white/95 backdrop-blur-md border-b-2 border-teal-50/70 shadow-sm rounded-b-3xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* PLATFORM BRAND */}
          <div className="flex items-center space-x-3.5 self-start">
            <div className="p-2.5 bg-[#0D9488] text-white rounded-2xl shadow-xs">
              <Leaf size={24} className="animate-pulse" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight flex items-center space-x-1">
                <span className="text-[#0D9488]">🌱 Eco</span>
                <span className="text-slate-900">Track</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono block mt-0.5">
                Carbon Tracker & Climate Station
              </span>
            </div>
          </div>

          {/* CHOSEN TAB BADGE */}
          <div className="flex items-center gap-4">
            {streak > 0 && (
              <div className="bg-[#ECFDF5] text-[#059669] px-4 py-1.5 rounded-full font-bold text-xs border border-[#10B981] flex items-center gap-1.5 shadow-3xs">
                <span>🔥</span> {streak} Day Streak
              </div>
            )}

            {/* ACCESSIBLE NAVIGATION TABS RAIL */}
            <nav className="flex space-x-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
              <button
                onClick={() => setActiveTab("calculator")}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === "calculator"
                    ? "bg-[#0D9488] text-white shadow-xs"
                    : "text-slate-650 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <Leaf size={14} />
                <span>Calculator</span>
              </button>

              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer relative ${
                  activeTab === "dashboard"
                    ? "bg-[#0D9488] text-white shadow-xs"
                    : "text-slate-650 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <BarChart4 size={14} />
                <span>Dashboard</span>
                {logs.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#10B981] text-[9px] font-bold text-white font-mono shadow-xs border border-white">
                    {logs.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("chat")}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === "chat"
                    ? "bg-[#0D9488] text-white shadow-xs"
                    : "text-slate-650 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <MessageSquare size={14} />
                <span>Chatbot</span>
              </button>
            </nav>
          </div>

        </div>
      </header>

      {/* CORE FRAME LAYOUT */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        
        {/* EDUCATIONAL TOPICS BULLETINS */}
        <DidYouKnow />

        {/* COMPONENT OUTLET SECTORS */}
        <div id="content-outlet">
          {activeTab === "calculator" && (
            <Calculator 
              onSaveLog={handleSaveLog} 
              lastInput={logs.length > 0 ? logs[logs.length - 1].input : undefined}
            />
          )}

          {activeTab === "dashboard" && (
            <Dashboard
              logs={logs}
              badges={badges}
              streak={streak}
              onClearLogs={handleClearLogs}
              onDeleteLog={handleDeleteLog}
              onNavigateToCalculator={() => setActiveTab("calculator")}
            />
          )}

          {activeTab === "chat" && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-800">Learn Sustainability with EcoBot</h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Have doubts about trash sorting, or local grid emissions? Type complex or simple queries below for EcoBot's concise insights.
                </p>
              </div>
              <Chatbot isEmbedded={true} />
            </div>
          )}
        </div>

      </main>

      {/* GLOBAL FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-8 text-center text-xs text-slate-400 space-y-3">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="flex items-center space-x-1 font-semibold text-slate-500">
            <Leaf size={14} className="text-emerald-600" />
            <span>EcoTrack Climate Station • Designed for Sustainable Living</span>
          </p>
          <p className="leading-relaxed text-left md:text-right max-w-md">
            EcoTrack estimates CO₂ equivalent emissions using approximate grid emission indexes and average transit stats. Tap secrets to configure the Gemini keys.
          </p>
        </div>
      </footer>

      {/* FLOATING CHAT COMPONENT TRIGGER (VISIBLE ONLY IF EMBEDDED CHAT TAB IS INACTIVE) */}
      {activeTab !== "chat" && (
        <>
          {isFloatingChatOpen && (
            <Chatbot 
              isEmbedded={false} 
              onCloseFloating={() => setIsFloatingChatOpen(false)} 
            />
          )}
          <div className="fixed bottom-6 right-4 sm:right-6 z-50">
            <button
              onClick={() => setIsFloatingChatOpen(!isFloatingChatOpen)}
              className={`flex items-center space-x-2 ${
                isFloatingChatOpen 
                  ? "bg-rose-600 hover:bg-rose-700" 
                  : "bg-[#0D9488] hover:bg-[#0b7a70] hover:-translate-y-0.5"
              } text-white font-sans font-bold text-sm px-4.5 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer`}
            >
              {isFloatingChatOpen ? <X size={16} /> : <MessageSquare size={16} />}
              <span>{isFloatingChatOpen ? "Close Chat" : "Ask EcoBot"}</span>
            </button>
          </div>
        </>
      )}

    </div>
  );
}
