/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { LogEntry, Badge } from "../types";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { 
  Compass, 
  Leaf, 
  Zap, 
  TrendingDown, 
  Award, 
  Calendar, 
  Trash2, 
  Smile, 
  ArrowRight,
  TrendingUp,
  BarChart2,
  CalendarCheck
} from "lucide-react";

interface DashboardProps {
  logs: LogEntry[];
  badges: Badge[];
  streak: number;
  onClearLogs: () => void;
  onDeleteLog: (id: string) => void;
  onNavigateToCalculator: () => void;
}

export default function Dashboard({ 
  logs, 
  badges, 
  streak, 
  onClearLogs, 
  onDeleteLog, 
  onNavigateToCalculator 
}: DashboardProps) {

  // 1. STAT COMPUTATIONS
  const totalLogs = logs.length;

  const getRunningAverage = () => {
    if (totalLogs === 0) return 0;
    const sum = logs.reduce((acc, log) => acc + log.breakdown.total, 0);
    return parseFloat((sum / totalLogs).toFixed(1));
  };

  const getPersonalBest = () => {
    if (totalLogs === 0) return 0;
    const values = logs.map(l => l.breakdown.total);
    return parseFloat(Math.min(...values).toFixed(1));
  };

  const getTrend = () => {
    if (totalLogs < 2) return { direction: "None", text: "Collect logs to see trend" };
    
    const last = logs[logs.length - 1].breakdown.total;
    const prev = logs[logs.length - 2].breakdown.total;
    const diff = last - prev;

    if (diff < -0.2) {
      return { 
        direction: "improving", 
        text: `Green shift! Decreased by ${Math.abs(diff).toFixed(1)} kg since last entry`,
        color: "text-emerald-600 bg-emerald-50 border-emerald-150"
      };
    } else if (diff > 0.2) {
      return { 
        direction: "worsening", 
        text: `Increased by ${diff.toFixed(1)} kg since last entry`,
        color: "text-rose-600 bg-rose-50 border-rose-100"
      };
    } else {
      return { 
        direction: "neutral", 
        text: "Stable carbon footprint matching prior calculation",
        color: "text-slate-500 bg-slate-50 border-slate-100"
      };
    }
  };

  const runningAvg = getRunningAverage();
  const personalBest = getPersonalBest();
  const trend = getTrend();

  // Reverse logs list to show latest entries first in the list
  const reversedLogs = [...logs].reverse();

  // Pre-mapped badges lookup to find dynamic icon
  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case "Compass":
        return <Compass size={24} />;
      case "Leaf":
        return <Leaf size={24} />;
      case "Zap":
        return <Zap size={24} />;
      case "TrendingDown":
        return <TrendingDown size={24} />;
      default:
        return <Award size={24} />;
    }
  };

  return (
    <div id="dashboard-view" className="space-y-8">
      {totalLogs === 0 ? (
        /* EMPTY STATE WRAPPER */
        <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center space-y-6 shadow-sm">
          <div className="mx-auto w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-[#0D9488]">
            <Compass size={40} className="animate-spin-slow" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="font-display text-2xl font-black text-slate-800">Your Green Journey Awaits!</h2>
            <p className="text-slate-500 text-xs font-medium leading-relaxed font-sans">
              You haven't logged any footprint calculations yet. Track daily commute, meals, household energy and trash estimates to populate your timeline dashboard stats.
            </p>
          </div>
          <button
            onClick={onNavigateToCalculator}
            className="inline-flex items-center space-x-2 bg-[#0D9488] hover:bg-[#0b7a70] text-white font-sans font-bold text-sm px-6 py-3.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <span>Run First Calculator</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        /* MAIN DASHBOARD CONTENT */
        <div className="space-y-8 animate-fadeIn">
          
          {/* STAT SUMMARIES */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* STREAK WIDGET */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 flex items-center space-x-4 shadow-3xs">
              <div className={`p-4 rounded-2xl flex items-center justify-center shadow-xs text-white ${
                streak > 0 ? "bg-gradient-to-br from-amber-400 to-orange-550" : "bg-slate-200 text-slate-400"
              }`}>
                <Zap size={24} className={streak > 0 ? "animate-pulse" : ""} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Logging Streak</p>
                <h3 className="font-display text-2xl font-black text-slate-800 mt-1">
                  {streak} {streak === 1 ? "Day" : "Days"}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Consecutive logged updates</p>
              </div>
            </div>

            {/* RUNNING AVERAGE */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 flex items-center space-x-4 shadow-3xs">
              <div className="p-4 bg-teal-50 text-[#0D9488] rounded-2xl flex items-center justify-center">
                <BarChart2 size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Running Average</p>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="font-display text-2xl font-black text-slate-800">{runningAvg}</span>
                  <span className="text-xs text-slate-400 font-bold">kg CO₂e</span>
                </div>
                <p className="text-[10px] text-[#0D9488] mt-0.5 font-bold">Daily mean value</p>
              </div>
            </div>

            {/* PERSONAL BEST (LOWEST DAY) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 flex items-center space-x-4 shadow-3xs">
              <div className="p-4 bg-teal-50 text-[#0D9488] rounded-2xl flex items-center justify-center">
                <Leaf size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Personal Best</p>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="font-display text-2xl font-black text-slate-800">{personalBest}</span>
                  <span className="text-xs text-slate-400 font-bold">kg CO₂e</span>
                </div>
                <p className="text-[10px] text-teal-650 mt-0.5 font-bold">Lowest daily record</p>
              </div>
            </div>

            {/* TREND STUB */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 flex items-center space-x-4 shadow-3xs">
              <div className="p-4 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center">
                <CalendarCheck size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Calculations</p>
                <h3 className="font-display text-2xl font-black text-slate-800 mt-1">
                  {totalLogs}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Calculations registered</p>
              </div>
            </div>

          </div>

          {/* DYNAMIC SHIFT MESSAGE */}
          {trend.direction !== "None" && (
            <div className={`p-4 rounded-2xl border-2 flex items-center space-x-3 text-xs font-extrabold ${trend.color}`}>
              {trend.direction === "improving" ? <TrendingDown size={18} /> : trend.direction === "worsening" ? <TrendingUp size={18} /> : <Smile size={18} />}
              <span>{trend.text}</span>
            </div>
          )}

          {/* DYNAMIC GRAPH COMPONENT */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-3xs">
            <h3 className="font-display text-base font-bold text-slate-800 mb-6 flex items-center space-x-2">
              <Calendar className="text-[#0D9488]" size={18} />
              <span>Carbon Footprint Trend Over Time</span>
            </h3>

            {totalLogs === 1 ? (
              <div className="h-64 flex flex-col justify-center items-center bg-slate-50/55 rounded-2xl border-2 border-dashed border-slate-100 p-6">
                <p className="text-xs text-slate-600 text-center font-bold">
                  We've plotted your initial tracked data point ({logs[0].breakdown.total} kg CO₂e).
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-1 text-center">
                  Calculate and save another daily log from the calculator pad to render a historic shift graph.
                </p>
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={logs}
                    margin={{ top: 10, right: 15, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94A3B8" 
                      fontSize={11} 
                      tickLine={false} 
                    />
                    <YAxis 
                      stroke="#94A3B8" 
                      fontSize={11} 
                      tickLine={false} 
                      unit=" kg"
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1e293b", borderRadius: "16px", border: "none" }}
                      labelStyle={{ color: "#F8FAFC", fontWeight: "bold" }}
                      itemStyle={{ color: "#2DD4BF" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="breakdown.total" 
                      stroke="#0D9488" 
                      strokeWidth={3} 
                      dot={{ r: 5, fill: "#0D9488", strokeWidth: 2, stroke: "#FFF" }}
                      activeDot={{ r: 8 }}
                      name="Footprint"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 3. ACHIVEMENT PROGRESS BADGES */}
          <div className="space-y-4">
            <h3 className="font-display text-base font-bold text-slate-800 flex items-center space-x-2">
              <Award className="text-yellow-500" size={20} />
              <span>Unlockable Green Milestones</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {badges.map((badge) => (
                <div 
                  key={badge.id}
                  className={`relative overflow-hidden rounded-3xl p-5 border-2 text-center transition-all ${
                    badge.unlocked 
                      ? "bg-white border-teal-50 shadow-sm ring-2 ring-[#0D9488]/5"
                      : "bg-slate-50/50 border-slate-50 text-slate-400 opacity-80"
                  }`}
                >
                  <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    badge.unlocked 
                      ? "bg-teal-50 text-[#0D9488] shadow-xs"
                      : "bg-slate-100 text-slate-400"
                  }`}>
                    {getBadgeIcon(badge.icon)}
                  </div>

                  <h4 className={`font-display font-bold text-sm mt-4 ${
                    badge.unlocked ? "text-slate-800" : "text-slate-500"
                  }`}>
                    {badge.title}
                  </h4>

                  <p className="text-[11px] text-slate-500 mt-1 lines-clamp-2 leading-relaxed px-1">
                    {badge.description}
                  </p>

                  <div className="mt-4 pt-3 border-t-2 border-slate-50 flex items-center justify-center flex-col space-y-1">
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                      badge.unlocked
                        ? "bg-[#ECFDF5] text-[#0D9488]"
                        : "bg-slate-200 text-slate-500"
                    }`}>
                      {badge.unlocked ? "Unlocked" : "Locked"}
                    </span>
                    {badge.unlocked && badge.unlockedAt && (
                      <span className="text-[9px] text-[#0D9488] font-mono font-bold mt-1">
                        🔑 {badge.unlockedAt}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. HISTORY DIRECTORY TIMELINE */}
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-3xs">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <h3 className="font-display text-base font-bold text-slate-800">Carbon Log Ledger History</h3>
              <button
                onClick={onClearLogs}
                className="text-[11px] font-extrabold uppercase tracking-wider text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
              >
                Clear All Calculations
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {reversedLogs.map((log) => (
                <div key={log.id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/25 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-black text-slate-800 font-mono">
                        {log.breakdown.total} kg CO₂e / day
                      </span>
                      <span className="text-slate-350">|</span>
                      <span className="text-[10px] text-slate-550 font-bold flex items-center space-x-1 uppercase tracking-wider font-sans">
                        <Calendar size={12} className="text-slate-400" />
                        <span>{log.date}</span>
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-normal font-sans">
                      Commu: <b className="text-slate-800 font-bold font-mono">{log.input.transport.mode}</b> ({log.input.transport.distance}km) •
                      Food style: <b className="text-slate-800 font-bold font-mono">{log.input.diet.type}</b> •
                      Waste bag: <b className="text-slate-800 font-bold font-mono">{log.input.waste.amount}kg</b>
                    </p>
                  </div>

                  <div className="mt-4 sm:mt-0 flex items-center space-x-6 justify-between sm:justify-end">
                    <div className="flex space-x-2.5 text-[9px] font-mono font-bold">
                      <span className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">Trns: {log.breakdown.transport}</span>
                      <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg font-mono">Enr: {log.breakdown.energy}</span>
                      <span className="text-[#0D9488] bg-[#ECFDF5] px-2.5 py-1 rounded-lg">Diet: {log.breakdown.diet}</span>
                      <span className="text-gray-550 bg-gray-100 px-2.5 py-1 rounded-lg">Wst: {log.breakdown.waste}</span>
                    </div>

                    <button
                      onClick={() => onDeleteLog(log.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100"
                      title="Delete entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
