/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  CalculationInput, 
  FootprintBreakdown, 
  Tip, 
  LogEntry 
} from "../types";
import { calculateFootprint } from "../utils";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from "recharts";
import { 
  Car, 
  Flame, 
  Utensils, 
  Trash2, 
  Sparkles, 
  ChevronRight, 
  ArrowRight, 
  CheckCircle, 
  RotateCcw,
  Loader,
  TrendingDown,
  TrendingUp,
  Award
} from "lucide-react";

interface CalculatorProps {
  onSaveLog: (log: LogEntry) => void;
  lastInput?: CalculationInput;
}

export default function Calculator({ onSaveLog, lastInput }: CalculatorProps) {
  // 1. FORM STATE
  const [transportMode, setTransportMode] = useState<"car" | "bus" | "train" | "bike" | "walk">(
    lastInput?.transport.mode || "car"
  );
  const [distance, setDistance] = useState<number>(lastInput?.transport.distance ?? 10);
  const [fuelType, setFuelType] = useState<"gasoline" | "diesel" | "electric" | "hybrid" | "none">(
    lastInput?.transport.fuelType || "gasoline"
  );

  const [isKwh, setIsKwh] = useState<boolean>(lastInput?.energy.isKwh || false);
  const [kwhValue, setKwhValue] = useState<number>(lastInput?.energy.kwhValue ?? 150);
  const [sliderLevel, setSliderLevel] = useState<"low" | "medium" | "high">(
    lastInput?.energy.sliderLevel || "medium"
  );

  const [dietType, setDietType] = useState<"meat-heavy" | "average" | "vegetarian" | "vegan">(
    lastInput?.diet.type || "average"
  );
  const [mealsPerDay, setMealsPerDay] = useState<number>(lastInput?.diet.mealsPerDay ?? 3);

  const [wasteAmount, setWasteAmount] = useState<number>(lastInput?.waste.amount ?? 5);
  const [recycling, setRecycling] = useState<"yes" | "no" | "sometimes">(
    lastInput?.waste.recycling || "sometimes"
  );

  // 2. COMPUTATION & DISPLAY STATE
  const [activeStep, setActiveStep] = useState<number>(0); // 0: Form, 1: Results
  const [breakdown, setBreakdown] = useState<FootprintBreakdown | null>(null);
  const [loadingTips, setLoadingTips] = useState<boolean>(false);
  const [tips, setTips] = useState<Tip[]>([]);
  const [tipsError, setTipsError] = useState<string | null>(null);
  const [logSaved, setLogSaved] = useState<boolean>(false);

  // Step names
  const steps = [
    { title: "Transport", icon: Car },
    { title: "Energy", icon: Flame },
    { title: "Diet", icon: Utensils },
    { title: "Waste", icon: Trash2 }
  ];

  // Global comparison average
  const DAILY_AVERAGE = 10.0; // kg CO2 / day

  // Handlers
  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogSaved(false);
    setTips([]);
    setTipsError(null);

    const inputData: CalculationInput = {
      transport: {
        mode: transportMode,
        distance,
        fuelType: transportMode === "car" ? fuelType : "none"
      },
      energy: {
        isKwh,
        kwhValue,
        sliderLevel
      },
      diet: {
        type: dietType,
        mealsPerDay
      },
      waste: {
        amount: wasteAmount,
        recycling
      }
    };

    const calculatedBreakdown = calculateFootprint(inputData);
    setBreakdown(calculatedBreakdown);
    setActiveStep(1); // switch to results screen

    // Call Gemini API to generate tips
    setLoadingTips(true);
    try {
      const response = await fetch("/api/gemini/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputData)
      });
      
      const data = await response.json();
      if (response.ok && data.tips) {
        setTips(data.tips);
      } else {
        throw new Error(data.error || "Failed key load");
      }
    } catch (err: any) {
      console.warn("Tips creation fallback used:", err);
      // Fallback tips so the user always has a stellar, bullet-proof experience
      setTipsError("AI service currently queuing. Tap below or review recommended steps:");
      setTips([
        {
          category: transportMode === "car" ? "Transport" : "Waste",
          title: transportMode === "car" ? "Cut Car Emissions" : "Reduce Packaging",
          explanation: transportMode === "car" 
            ? "Carpooling with other commuters or opting for public transit offsets travel CO2 immediately."
            : "Choosing unpackaged bulk products decreases weekly plastics landfill load.",
          impact: "High Impact"
        },
        {
          category: dietType === "meat-heavy" || dietType === "average" ? "Diet" : "Energy",
          title: dietType === "meat-heavy" || dietType === "average" ? "Go Meatless Once a Week" : "Check Standby Chargers",
          explanation: dietType === "meat-heavy" || dietType === "average"
            ? "Skipping red meat and dairy just one day a week saves massive amounts of agricultural water and methane."
            : "Standby power consumes passive energy. Unplug screen adapters at bedtime.",
          impact: "Medium Impact"
        },
        {
          category: recycling === "no" ? "Waste" : "Energy",
          title: recycling === "no" ? "Launch Desk Bin Recycling" : "Use Cold Water Washes",
          explanation: recycling === "no"
            ? "Place paper and clean drink bottles in sorting canisters to intercept incinerator waste."
            : "Washing garments at 30°C saves up to 75% of the machine electricity cycle.",
          impact: "Low Impact"
        }
      ]);
    } finally {
      setLoadingTips(false);
    }
  };

  const handleSaveToDashboard = () => {
    if (!breakdown) return;

    const inputData: CalculationInput = {
      transport: { mode: transportMode, distance, fuelType: transportMode === "car" ? fuelType : "none" },
      energy: { isKwh, kwhValue, sliderLevel },
      diet: { type: dietType, mealsPerDay },
      waste: { amount: wasteAmount, recycling }
    };

    const newLog: LogEntry = {
      id: "log_" + Date.now(),
      date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
      input: inputData,
      breakdown
    };

    onSaveLog(newLog);
    setLogSaved(true);
  };

  const handleReset = () => {
    setActiveStep(0);
    setLogSaved(false);
    setBreakdown(null);
    setTips([]);
  };

  // Format Recharts data
  const getChartData = () => {
    if (!breakdown) return [];
    return [
      { name: "Transport", value: breakdown.transport, fill: "#0D9488" }, // Teal
      { name: "Energy", value: breakdown.energy, fill: "#F59E0B" },    // Amber
      { name: "Diet", value: breakdown.diet, fill: "#10B981" },        // Emerald
      { name: "Waste", value: breakdown.waste, fill: "#6B7280" }        // Gray
    ];
  };

  const getComparisonPercent = () => {
    if (!breakdown) return 0;
    const diff = breakdown.total - DAILY_AVERAGE;
    return parseFloat(((Math.abs(diff) / DAILY_AVERAGE) * 100).toFixed(0));
  };

  return (
    <div id="calculator-view" className="space-y-8">
      {/* 1. INPUT FORM STEP CONTAINER */}
      {activeStep === 0 ? (
        <form onSubmit={handleCalculate} className="bg-white rounded-3xl shadow-sm border border-teal-50 overflow-hidden">
          <div className="bg-gradient-to-r from-[#134E4A] to-[#0D9488] p-8 text-white text-center">
            <h2 className="font-display text-2xl font-extrabold tracking-tight">Carbon Footprint Calculator</h2>
            <p className="text-teal-100 text-xs font-medium uppercase mt-1.5 tracking-wider font-mono">
              EcoTrack Climate Assessment • Real-time Carbon Metrics
            </p>
          </div>

          <div className="p-8 space-y-10">
            {/* CATEGORY 1: TRANSPORT */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b-2 border-slate-100">
                <div className="p-2.5 bg-teal-50 rounded-xl text-[#0D9488]">
                  <Car size={20} />
                </div>
                <h3 className="font-display text-lg font-bold text-slate-800">1. Transportation Methods</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">How do you usually travel?</label>
                  <select 
                    value={transportMode}
                    onChange={(e: any) => setTransportMode(e.target.value)}
                    className="w-full p-3 font-sans text-sm rounded-xl border-2 border-slate-100 bg-[#F8FAFC] text-slate-800 focus:outline-none focus:border-[#0D9488] focus:bg-white transition-all shadow-3xs cursor-pointer"
                  >
                    <option value="walk">🏃 Walking (Zero Emission)</option>
                    <option value="bike">🚲 Bicycle / Scooter (Zero Emission)</option>
                    <option value="bus">🚌 Urban Bus</option>
                    <option value="train">🚆 Metro / Train</option>
                    <option value="car">🚗 Personal Car</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                    Average distance traveled per day: <span className="text-[#0D9488] font-bold">{distance} km</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={distance}
                    onChange={(e) => setDistance(Number(e.target.value))}
                    className="w-full accent-[#0D9488] mt-2 cursor-pointer h-1.5 bg-slate-150 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium font-mono mt-1">
                    <span>0 km (No commute)</span>
                    <span>50 km</span>
                    <span>100+ km</span>
                  </div>
                </div>

                {transportMode === "car" && (
                  <div className="md:col-span-2 bg-[#ECFDF5] p-5 rounded-2xl border-2 border-[#10B981]/15 animate-fadeIn">
                    <label className="block text-[11px] font-bold text-[#0D9488] uppercase tracking-widest mb-3 font-mono">What fuel type is your car?</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(["gasoline", "diesel", "hybrid", "electric"] as const).map((fuel) => (
                        <button
                          key={fuel}
                          type="button"
                          onClick={() => setFuelType(fuel)}
                          className={`py-2.5 px-4 rounded-xl text-xs font-extrabold capitalize text-center transition-all cursor-pointer ${
                            fuelType === fuel 
                              ? "bg-[#0D9488] text-white shadow-sm border-2 border-[#0D9488]" 
                              : "bg-white text-slate-650 border-2 border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {fuel}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CATEGORY 2: ENERGY */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b-2 border-slate-100">
                <div className="p-2.5 bg-teal-50 rounded-xl text-[#0D9488]">
                  <Flame size={20} />
                </div>
                <h3 className="font-display text-lg font-bold text-slate-800">2. Household Electric Usage</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex space-x-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setIsKwh(false)}
                    className={`text-xs py-2 px-5 rounded-full font-extrabold transition-all cursor-pointer ${
                      !isKwh 
                        ? "bg-[#0D9488] text-white shadow-xs" 
                        : "bg-slate-100 text-slate-650 border border-slate-250 hover:bg-slate-200"
                    }`}
                  >
                    Low / Med / High Estimate
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsKwh(true)}
                    className={`text-xs py-2 px-5 rounded-full font-extrabold transition-all cursor-pointer ${
                      isKwh 
                        ? "bg-[#0D9488] text-white shadow-xs" 
                        : "bg-slate-100 text-slate-650 border border-slate-250 hover:bg-slate-200"
                    }`}
                  >
                    Enter Monthly kWh Value
                  </button>
                </div>

                {!isKwh ? (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 font-mono">My living standard is:</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { level: "low", label: "Low Impact", desc: "Studio/Dorm room / high saver", kwh: "~120 kWh" },
                        { level: "medium", label: "Average", desc: "Shared apartment / typical electronics", kwh: "~280 kWh" },
                        { level: "high", label: "Heavy", desc: "Single house / gaming rigs / climate control", kwh: "~480 kWh" }
                      ].map((item) => (
                        <button
                          key={item.level}
                          type="button"
                          onClick={() => setSliderLevel(item.level as any)}
                          className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                            sliderLevel === item.level 
                              ? "bg-teal-50/55 border-[#0D9488] ring-2 ring-[#0D9488]/10" 
                              : "bg-[#F8FAFC] border-slate-100 hover:border-slate-250 hover:bg-slate-50"
                          }`}
                        >
                          <p className="text-sm font-bold text-slate-800">{item.label}</p>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{item.desc}</p>
                          <span className="inline-block bg-slate-200/70 text-slate-700 text-[10px] px-2.5 py-1 rounded-lg mt-3.5 font-mono font-bold">
                            {item.kwh}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-w-md animate-fadeIn">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest font-mono">Electricity consumed per month (kWh):</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        min="1"
                        max="2000"
                        value={kwhValue}
                        onChange={(e) => setKwhValue(Number(e.target.value))}
                        className="w-full p-3 font-mono text-sm rounded-xl border-2 border-slate-100 bg-[#F8FAFC] text-[#0D9488] focus:outline-none focus:border-[#0D9488] focus:bg-white transition-all shadow-3xs"
                      />
                      <span className="text-slate-505 font-bold text-sm shrink-0">kWh / month</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">An average small household consumes roughly 150-300 kWh per month.</p>
                  </div>
                )}
              </div>
            </div>

            {/* CATEGORY 3: DIET */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b-2 border-slate-100">
                <div className="p-2.5 bg-teal-50 rounded-xl text-[#0D9488]">
                  <Utensils size={20} />
                </div>
                <h3 className="font-display text-lg font-bold text-slate-800">3. Daily Food Habits</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">What style category fits your meals?</label>
                  <select
                    value={dietType}
                    onChange={(e: any) => setDietType(e.target.value)}
                    className="w-full p-3 font-sans text-sm rounded-xl border-2 border-slate-100 bg-[#F8FAFC] text-slate-800 focus:outline-none focus:border-[#0D9488] focus:bg-white transition-all shadow-3xs cursor-pointer"
                  >
                    <option value="meat-heavy">🥩 Meat-heavy (Multiple meat meals daily)</option>
                    <option value="average">🍗 Average (Occasional poultry/dairy, low red meat)</option>
                    <option value="vegetarian">🥚 Vegetarian (Eggs & plant dairy but no meat)</option>
                    <option value="vegan">🌱 Vegan (Strictly plant-based organic nutrition)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                    Number of full meals consumed per day: <span className="text-[#0D9488] font-bold">{mealsPerDay}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={mealsPerDay}
                    onChange={(e) => setMealsPerDay(Number(e.target.value))}
                    className="w-full accent-[#0D9488] mt-2 cursor-pointer h-1.5 bg-slate-150 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium font-mono mt-1">
                    <span>1 meal</span>
                    <span>3 default meals</span>
                    <span>5 meals</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CATEGORY 4: WASTE */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b-2 border-slate-100">
                <div className="p-2.5 bg-teal-50 rounded-xl text-[#0D9488]">
                  <Trash2 size={20} />
                </div>
                <h3 className="font-display text-lg font-bold text-slate-800">4. Waste & Recycling Habits</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">
                    Estimated non-recyclable bag waste per week: <span className="text-[#0D9488] font-bold">{wasteAmount} kg</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={wasteAmount}
                    onChange={(e) => setWasteAmount(Number(e.target.value))}
                    className="w-full accent-[#0D9488] mt-2 cursor-pointer h-1.5 bg-slate-150 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium font-mono mt-1">
                    <span>1 kg (Nearly zero)</span>
                    <span>15 kg</span>
                    <span>30 kg (Heavy)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">Do you recycle plastics, paper, and metal cans?</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { val: "yes", label: "Always" },
                      { val: "sometimes", label: "Sometimes" },
                      { val: "no", label: "Rarely" }
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setRecycling(item.val as any)}
                        className={`text-xs py-2.5 px-3 rounded-xl font-extrabold border-2 text-center transition-all cursor-pointer ${
                          recycling === item.val
                            ? "bg-[#0D9488] text-white border-[#0D9488] shadow-xs"
                            : "bg-white text-slate-600 border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50/75 p-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="flex items-center space-x-2 bg-[#0D9488] hover:bg-[#0b7a70] font-sans font-bold text-white px-8 py-3.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>Calculate Carbon Footprint</span>
              <Sparkles size={18} />
            </button>
          </div>
        </form>
      ) : (
        /* 2. RESULTS STEP CONTAINER */
        <div className="space-y-8 animate-fadeIn">
          {breakdown && (
            <>
              {/* PRIMARY MASSIVE STATE CARD */}
              <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  
                  {/* LEFT SPLIT: BIG NUMBERS */}
                  <div className="lg:col-span-5 p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50/20">
                    <div>
                      <span className="text-[11px] font-bold tracking-widest text-[#0D9488] uppercase font-mono">
                        ESTIMATED DAILY EMISSION
                      </span>
                      <div className="flex items-baseline space-x-2 mt-4">
                        <span className="text-7xl sm:text-8xl font-black font-display text-slate-900 tracking-[-4px] leading-none">
                          {breakdown.total}
                        </span>
                        <span className="text-lg font-bold text-slate-500 font-sans tracking-tight">
                          kg CO₂e
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#0D9488] mt-3 font-mono bg-[#ECFDF5] inline-block px-3 py-1.5 rounded-full border border-[#10B981]/20">
                        {breakdown.totalYear.toLocaleString()} kg CO₂e / year estimate
                      </div>
                    </div>

                    {/* GAUGING WITH COMPARISON VALUE */}
                    <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                      <div className="flex items-center space-x-2.5">
                        {breakdown.total <= DAILY_AVERAGE ? (
                          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-full">
                            <TrendingDown size={22} />
                          </div>
                        ) : (
                          <div className="p-2 bg-amber-100 text-amber-700 rounded-full">
                            <TrendingUp size={22} />
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                            Typical Daily Average
                          </p>
                          <p className="text-sm font-bold text-slate-800">
                            {DAILY_AVERAGE.toFixed(1)} kg CO₂ per person
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white border border-slate-100">
                        {breakdown.total <= DAILY_AVERAGE ? (
                          <p className="text-sm text-slate-600 leading-relaxed">
                            🎉 Awesome job! Your daily footprint is{" "}
                            <span className="text-emerald-600 font-bold">
                              {getComparisonPercent()}% lower
                            </span>{" "}
                            than standard baseline carbon averages.
                          </p>
                        ) : (
                          <p className="text-sm text-slate-600 leading-relaxed">
                            ⚠️ Heads up! Your calculation is{" "}
                            <span className="text-amber-600 font-bold">
                              {getComparisonPercent()}% higher
                            </span>{" "}
                            than typical averages. Explore simple micro-adjustments around transport or diet below!
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 flex space-x-3">
                      <button
                        onClick={handleSaveToDashboard}
                        disabled={logSaved}
                        className={`w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-xl font-sans font-bold transition-all cursor-pointer ${
                          logSaved 
                            ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                            : "bg-[#0D9488] hover:bg-[#0b7a70] text-white shadow-xs"
                        }`}
                      >
                        <CheckCircle size={18} />
                        <span>{logSaved ? "Saved to Dashboard" : "Save Log Entry"}</span>
                      </button>

                      <button
                        onClick={handleReset}
                        className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer border border-slate-200"
                        title="Recalculate"
                      >
                        <RotateCcw size={18} />
                      </button>
                    </div>
                  </div>

                  {/* RIGHT SPLIT: VISUAL GRAPH */}
                  <div className="lg:col-span-7 p-8">
                    <h3 className="font-sans font-bold text-slate-800 text-lg sticky top-0 mb-6 flex items-center space-x-2">
                      <span>Category Emission Breakdown </span>
                      <span className="text-xs text-slate-400 font-normal font-mono">(Estimates in kg/day)</span>
                    </h3>

                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={getChartData()}
                          margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#94A3B8" 
                            fontSize={12} 
                            tickLine={false} 
                          />
                          <YAxis 
                            stroke="#94A3B8" 
                            fontSize={12} 
                            tickLine={false} 
                            unit=" kg" 
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "none" }}
                            labelStyle={{ color: "#F8FAFC", fontWeight: "bold" }}
                            itemStyle={{ color: "#34D399" }}
                          />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {getChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mt-6">
                      {getChartData().map((cat) => (
                        <div key={cat.name} className="p-3 rounded-xl border border-slate-50 text-center bg-slate-50/30">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cat.name}</p>
                          <p className="text-sm font-extrabold text-slate-700 mt-1 font-mono">
                            {cat.value} kg
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* PERSONALIZED AI ACTION TIPS BELOW */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans text-xl font-bold text-slate-800 flex items-center space-x-2">
                    <Sparkles className="text-emerald-500 animate-pulse" size={20} />
                    <span>AI-Powered Action Plan For You</span>
                  </h3>
                  {tipsError && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                      Offline Mode Active
                    </span>
                  )}
                </div>

                {loadingTips ? (
                  // Pulse Skeletons
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse space-y-4">
                        <div className="h-4 bg-slate-200 rounded-sm w-1/3"></div>
                        <div className="h-6 bg-slate-200 rounded-sm w-3/4"></div>
                        <div className="space-y-2">
                          <div className="h-3 bg-slate-200 rounded-sm w-full"></div>
                          <div className="h-3 bg-slate-200 rounded-sm w-full"></div>
                          <div className="h-3 bg-slate-200 rounded-sm w-4/5"></div>
                        </div>
                        <div className="h-8 bg-slate-200 rounded-sm w-1/4 mt-4"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {tips.map((tip, idx) => {
                      // Styling factors based on tags
                      const tagColors = {
                        "High Impact": "bg-emerald-100 text-emerald-800 border-emerald-200",
                        "Medium Impact": "bg-yellow-105 text-amber-800 border-amber-200 min-w-0 bg-yellow-50",
                        "Low Impact": "bg-sky-50 text-sky-800 border-sky-200"
                      }[tip.impact] || "bg-slate-100 text-slate-800";

                      const categoryColors = {
                        "Transport": "bg-emerald-50 text-emerald-600",
                        "Energy": "bg-amber-50 text-amber-600",
                        "Diet": "bg-green-50 text-green-600",
                        "Waste": "bg-slate-100 text-slate-600"
                      }[tip.category] || "bg-slate-100 text-slate-600";

                      return (
                        <div 
                          key={idx} 
                          className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-emerald-200 shadow-xs flex flex-col justify-between transition-all hover:shadow-xs group hover:-translate-y-0.5"
                        >
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm ${categoryColors}`}>
                                {tip.category}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${tagColors}`}>
                                {tip.impact}
                              </span>
                            </div>
                            <h4 className="font-sans font-bold text-slate-800 leading-snug text-base group-hover:text-emerald-700 transition-colors">
                              {tip.title}
                            </h4>
                            <p className="text-sm text-slate-500 leading-relaxed">
                              {tip.explanation}
                            </p>
                          </div>

                          <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-emerald-600">
                            <span>Direct Action Item</span>
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
