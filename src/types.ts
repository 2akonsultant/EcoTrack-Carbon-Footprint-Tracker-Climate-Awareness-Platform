/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TransportInput {
  mode: "car" | "bus" | "train" | "bike" | "walk";
  distance: number; // km per day
  fuelType?: "gasoline" | "diesel" | "electric" | "hybrid" | "none";
}

export interface EnergyInput {
  isKwh: boolean;
  kwhValue: number; // monthly kWh
  sliderLevel: "low" | "medium" | "high"; // fallback slider
}

export interface DietInput {
  type: "meat-heavy" | "average" | "vegetarian" | "vegan";
  mealsPerDay: number;
}

export interface WasteInput {
  amount: number; // kg per week
  recycling: "yes" | "no" | "sometimes";
}

export interface CalculationInput {
  transport: TransportInput;
  energy: EnergyInput;
  diet: DietInput;
  waste: WasteInput;
}

export interface FootprintBreakdown {
  transport: number; // kg CO2 / day
  energy: number;    // kg CO2 / day
  diet: number;      // kg CO2 / day
  waste: number;     // kg CO2 / day
  total: number;     // kg CO2 / day
  totalYear: number; // kg CO2 / year
}

export interface LogEntry {
  id: string;
  date: string; // ISO string or short date YYYY-MM-DD
  input: CalculationInput;
  breakdown: FootprintBreakdown;
}

export interface Tip {
  category: "Transport" | "Diet" | "Energy" | "Waste";
  title: string;
  explanation: string;
  impact: "High Impact" | "Medium Impact" | "Low Impact";
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  unlocked: boolean;
  unlockedAt?: string;
  criteria: string;
}
