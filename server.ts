import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required but missing. Go to Settings > Secrets in the AI Studio menu to configure it.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. Personalized Tips API Endpoint
app.post("/api/gemini/tips", async (req, res) => {
  try {
    const { transport, energy, diet, waste } = req.body;

    if (!transport || !energy || !diet || !waste) {
      res.status(400).json({ error: "Missing calculation data for tips generation" });
      return;
    }

    const ai = getGeminiClient();
    const prompt = `Generate 3 highly personalized, encouraging, and actionable green tips tailored specifically for a general user.
Use their weekly/daily activity metrics to construct these tips:

Calculation Input Data:
- Transport Mode: ${transport.mode} (${transport.distance} km per day) ${transport.fuelType ? `with fuel type: ${transport.fuelType}` : ''}
- Home Energy level/usage: ${energy.value} (e.g. low/med/high or monthly kWh)
- Diet style: ${diet.type} (${diet.mealsPerDay} meals per day)
- Waste: ${waste.amount} kg per week (Recycling habits: ${waste.recycling})

Your instructions:
- Provide friendly, constructive, clear and non-judgmental advice.
- Focus on practical adjustments (e.g., if they are average/meat-heavy diet, hint at "Meatless Mondays" or simple vegetarian swaps; if they walk/bike, praise them and suggest composting; if transport distance is high, suggest route optimization or ride-sharing).
- Return a JSON array or list format precisely adhering to this schema:
  JSON array of 3 distinct recommendation objects, each with these properties:
  - "category": Short label, one of: "Transport", "Diet", "Energy", "Waste"
  - "title": Actionable catchy tip title (e.g., "Try Meatless Mondays" or "Unplug Standby Chargers")
  - "explanation": Friendly explanation explaining of why/how to do it (1-2 sentences)
  - "impact": A rating of carbon reduction impact: either "High Impact", "Medium Impact", or "Low Impact"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              title: { type: Type.STRING },
              explanation: { type: Type.STRING },
              impact: { type: Type.STRING },
            },
            required: ["category", "title", "explanation", "impact"],
          }
        }
      }
    });

    const tipsText = response.text || "[]";
    const tips = JSON.parse(tipsText.trim());
    res.json({ tips });
  } catch (error: any) {
    console.error("Gemini Tips API Error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate personalized tips. Please check your Gemini API configuration.",
      fallback: [
        {
          category: "Transport",
          title: "Optimize Your Commute",
          explanation: "Consider sharing rides, walking, biking, or choosing electric scooters/bicycles for short trips.",
          impact: "Medium Impact"
        },
        {
          category: "Diet",
          title: "Adopt More Plant-Based Platters",
          explanation: "Reducing beef and lamb consumption just twice a week makes a significant dent in agricultural greenhouse gas footprints.",
          impact: "High Impact"
        },
        {
          category: "Waste",
          title: "Double Down on Recyclables",
          explanation: "Keep separate sorting tags at your desk or room. Composting organic matter stops methane emissions from traditional dumps.",
          impact: "Medium Impact"
        }
      ]
    });
  }
});

// 2. Chatbot Dialog API Endpoint
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const ai = getGeminiClient();

    // Map conversation turn formats to Gemini Content structure
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      for (const turn of history) {
        contents.push({
          role: turn.role === "user" ? "user" : "model",
          parts: [{ text: turn.text }]
        });
      }
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const systemInstruction = 
      "You are EcoBot, a friendly, encouraging, and conversational AI carbon and sustainability assistant for EcoTrack - the Carbon Footprint Tracker. " +
      "Your core mandate is to answer questions strictly about carbon footprints, climate change, green habits, recycling, carbon accounting, renewable energy, " +
      "or specific tips provided within the EcoTrack app. Keep your tone highly supportive, positive, simple, and jargon-free for a general audience. " +
      "Keep answers very concise (typically 2 to 4 sentences) to match the chatbot widget visual format, unless they actively ask for a detailed description or a step-by-step master plan. " +
      "Do not use markdown lists heavily unless asked. Be brief and educational.";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text || "I'm having a small hiccup right now, but let's keep striving to protect our planet!" });
  } catch (error: any) {
    console.error("Gemini Chat API Error:", error);
    res.status(500).json({
      error: error.message || "Failed to talk to Gemini.",
      text: "I am offline or my API key is currently loading, but remember: small micro-steps in transport choices, energy saving, and food habits add up to global impacts! Can you try again or check the Settings secrets?"
    });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Vite Dev Server middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving static files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EcoTrack backend running at http://localhost:${PORT}`);
  });
}

startServer();
