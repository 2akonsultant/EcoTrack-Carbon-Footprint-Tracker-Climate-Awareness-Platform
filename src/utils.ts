import { CalculationInput, FootprintBreakdown, Badge, LogEntry } from "./types";

/**
 * Calculates carbon footprint estimate in kg CO2 per day/year
 */
export function calculateFootprint(input: CalculationInput): FootprintBreakdown {
  // 1. TRANSPORT CALCULATION (kg CO2 per day)
  let transportCo2 = 0;
  const dist = input.transport.distance;
  
  if (input.transport.mode === "car") {
    const fuel = input.transport.fuelType || "gasoline";
    let factor = 0.18; // gasoline
    if (fuel === "diesel") factor = 0.20;
    else if (fuel === "electric") factor = 0.05;
    else if (fuel === "hybrid") factor = 0.10;
    transportCo2 = dist * factor;
  } else if (input.transport.mode === "bus") {
    transportCo2 = dist * 0.08;
  } else if (input.transport.mode === "train") {
    transportCo2 = dist * 0.04;
  } else {
    // bike or walk
    transportCo2 = 0;
  }

  // 2. ENERGY CALCULATION (kg CO2 per day)
  let monthlyKwh = 0;
  if (input.energy.isKwh) {
    monthlyKwh = input.energy.kwhValue;
  } else {
    switch (input.energy.sliderLevel) {
      case "low":
        monthlyKwh = 120;
        break;
      case "medium":
        monthlyKwh = 280;
        break;
      case "high":
        monthlyKwh = 480;
        break;
    }
  }
  // Average US/Global grid mix factor is ~0.45 kg CO2 per kWh
  const energyCo2 = (monthlyKwh * 0.45) / 30;

  // 3. DIET CALCULATION (kg CO2 per day)
  let dietBase = 5.0; // average
  switch (input.diet.type) {
    case "meat-heavy":
      dietBase = 7.2;
      break;
    case "vegetarian":
      dietBase = 3.2;
      break;
    case "vegan":
      dietBase = 2.0;
      break;
    case "average":
    default:
      dietBase = 5.0;
      break;
  }
  // Ratio based on meals per day (normalized to standard 3 meals)
  const mealsFactor = input.diet.mealsPerDay > 0 ? (input.diet.mealsPerDay / 3) : 1;
  const dietCo2 = dietBase * mealsFactor;

  // 4. WASTE CALCULATION (kg CO2 per day, input is weekly)
  // Assume default municipal solid waste landfill emissions of 0.5 kg CO2e per kg
  let recyclingFactor = 1.0;
  if (input.waste.recycling === "yes") {
    recyclingFactor = 0.50; // 50% carbon reduction in sorting/materials
  } else if (input.waste.recycling === "sometimes") {
    recyclingFactor = 0.75; // 25% reduction
  }
  const wasteCo2 = (input.waste.amount * 0.5 * recyclingFactor) / 7;

  // Totals
  const total = parseFloat((transportCo2 + energyCo2 + dietCo2 + wasteCo2).toFixed(2));
  const totalYear = parseFloat((total * 365).toFixed(1));

  return {
    transport: parseFloat(transportCo2.toFixed(2)),
    energy: parseFloat(energyCo2.toFixed(2)),
    diet: parseFloat(dietCo2.toFixed(2)),
    waste: parseFloat(wasteCo2.toFixed(2)),
    total,
    totalYear
  };
}

/**
 * Educational Climate Facts
 */
export const SUSTAINABILITY_FACTS = [
  "Leaving devices on standby accounts for up to 10% of global household carbon emissions. Unplug them and cut phantom loads!",
  "Choosing public transport or micro-mobility (biking/walking) stands as the highest single reduction point for high-commute individuals.",
  "Methane is 25 times more harmful than carbon dioxide. Food waste rotting in deep landfills is a major source of greenhouse gas.",
  "A meat-based diet produces more than double the greenhouse gas footprint of vegetarian platters. Even 'Meatless Mondays' help!",
  "Recycling one single aluminum soda can saves 95% of the energy needed to refine brand-new ore. That is a giant CO2 saving!",
  "E-waste accounts for a massive portion of hazardous heavy metals in landfills. Standard phone batteries emit heavy manufacturing CO2.",
  "Drying your laundry on a simple clothesline or drying rack instead of using a heated dryer avoids around 2.1kg of CO2 per load!"
];

/**
 * List of unlockable badges in the application
 */
export const INITIAL_BADGES: Badge[] = [
  {
    id: "first_log",
    title: "Eco Voyager",
    description: "Launch your green journey by saving your first carbon logging entry.",
    icon: "Compass",
    unlocked: false,
    criteria: "First Log Saved"
  },
  {
    id: "low_footprint",
    title: "Green Champion",
    description: "Achieve a carbon footprint calculation lower than the typical average (10 kg CO2/day).",
    icon: "Leaf",
    unlocked: false,
    criteria: "Footprint Below Average"
  },
  {
    id: "streak_7",
    title: "Consistent Climateer",
    description: "Maintain a logging streak of 3 consecutive calendar entries or 7 days.",
    icon: "Zap",
    unlocked: false,
    criteria: "Streak Milestone"
  },
  {
    id: "savings_30",
    title: "Footprint Reducer",
    description: "Reduce your daily footprint by 30% compared to your highest recorded day.",
    icon: "TrendingDown",
    unlocked: false,
    criteria: "30% Carbon Reduction"
  }
];

/**
 * Checks and updates which badges have been unlocked based on history
 */
export function evaluateBadges(logs: LogEntry[], streak: number, badges: Badge[]): { updatedBadges: Badge[], newlyUnlocked: string[] } {
  if (logs.length === 0) return { updatedBadges: badges, newlyUnlocked: [] };

  const newlyUnlocked: string[] = [];
  const updatedBadges = badges.map(badge => {
    if (badge.unlocked) return badge; // Already unlocked

    let shouldUnlock = false;

    if (badge.id === "first_log") {
      shouldUnlock = logs.length >= 1;
    } else if (badge.id === "low_footprint") {
      // Check if any log is below 10 kg CO2 / day (typical average)
      shouldUnlock = logs.some(l => l.breakdown.total < 10);
    } else if (badge.id === "streak_7") {
      // User logged at least 3 times, or streak is high
      shouldUnlock = streak >= 3 || logs.length >= 5;
    } else if (badge.id === "savings_30") {
      if (logs.length >= 2) {
        const totals = logs.map(l => l.breakdown.total);
        const maxCo2 = Math.max(...totals);
        const minCo2 = Math.min(...totals);
        if (maxCo2 > 0) {
          const reductionRatio = (maxCo2 - minCo2) / maxCo2;
          shouldUnlock = reductionRatio >= 0.30;
        }
      }
    }

    if (shouldUnlock) {
      newlyUnlocked.push(badge.title);
      return {
        ...badge,
        unlocked: true,
        unlockedAt: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      };
    }

    return badge;
  });

  return { updatedBadges, newlyUnlocked };
}
