/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SUSTAINABILITY_FACTS } from "../utils";
import { Lightbulb, RotateCw } from "lucide-react";

export default function DidYouKnow() {
  const [index, setIndex] = useState<number>(0);

  const handleNextFact = () => {
    setIndex((prev) => (prev + 1) % SUSTAINABILITY_FACTS.length);
  };

  return (
    <div className="bg-white border-2 border-slate-100/80 rounded-3xl p-5 flex items-center space-x-4 shadow-3xs">
      <div className="p-3 bg-[#ECFDF5] rounded-2xl text-[#0D9488] shrink-0">
        <Lightbulb size={20} className="animate-pulse" />
      </div>

      <div className="flex-1 space-y-1 text-left min-w-0">
        <h4 className="font-display text-xs font-black text-[#0D9488] uppercase tracking-widest font-mono">Carbon Literacy Trivia</h4>
        <p className="text-xs text-slate-700 leading-relaxed font-semibold">
          {SUSTAINABILITY_FACTS[index]}
        </p>
      </div>

      <button
        onClick={handleNextFact}
        className="p-2 bg-white text-slate-500 hover:text-slate-800 rounded-xl border-2 border-slate-100 hover:border-slate-350 hover:bg-slate-50 transition-all shrink-0 cursor-pointer self-center"
        title="Next Fact"
      >
        <RotateCw size={14} />
      </button>
    </div>
  );
}
