import { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import type { CreditScoreFactors } from "@/lib/types";
import { ShieldCheck } from "lucide-react";

interface CreditScoreGaugeProps {
  score: CreditScoreFactors | null;
  merchantId: string | null;
}

const ratingColor: Record<string, string> = {
  Excellent: "text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]",
  Good: "text-[var(--primary)]",
  Fair: "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]",
  Building: "text-[var(--muted-foreground)]",
};

export function CreditScoreGauge({ score, merchantId }: CreditScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(300);

  useEffect(() => {
    if (score) {
      let current = 300;
      const target = score.overall_score;
      const duration = 1500;
      const stepTime = 20;
      const steps = duration / stepTime;
      const increment = (target - 300) / steps;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          clearInterval(timer);
          setAnimatedScore(target);
        } else {
          setAnimatedScore(Math.floor(current));
        }
      }, stepTime);

      return () => clearInterval(timer);
    }
  }, [score]);

  if (!score) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 shadow-2xl backdrop-blur-xl">
        <div className="text-sm font-semibold flex items-center gap-2 text-white">
           <ShieldCheck className="w-4 h-4 text-white/50" /> FairScale Score
        </div>
        <p className="mt-4 text-sm text-(--text-secondary)">No credit history established yet.</p>
      </div>
    );
  }

  const pct = Math.round((animatedScore - 300) / 5.5); // 300-850 -> ~0-100

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-black/40 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl group">
      {/* Background glow tied to score */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-(--green-500) rounded-full blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity duration-700" />
      
      <div className="relative z-10 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-(--green-400)" />
            <span className="truncate text-base font-bold text-white tracking-wide">FairScale Score</span>
        </div>
        {merchantId && (
          <Link to={`/credit-score/${merchantId}`} className="shrink-0 text-xs font-semibold text-(--green-400) hover:text-(--green-300) transition-colors flex items-center gap-1">
            View Analytics
          </Link>
        )}
      </div>
      
      <div className="relative z-10 mt-6 flex min-w-0 flex-col sm:flex-row items-center gap-8">
        <div className="relative h-32 w-32 shrink-0">
          <svg className="h-32 w-32 -rotate-90 transform-gpu" viewBox="0 0 36 36">
            <path
              className="text-white/10"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <motion.path
              className="text-(--green-400)"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray={`${pct}, 100`}
              strokeLinecap="round"
              fill="none"
              initial={{ strokeDasharray: "0, 100" }}
              animate={{ strokeDasharray: `${pct}, 100` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              style={{ filter: "drop-shadow(0 0 4px rgba(74,222,128,0.4))" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-3xl font-bold tracking-tighter text-white drop-shadow-md">
                {animatedScore}
            </span>
          </div>
        </div>
        
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
             <motion.p 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className={`truncate text-2xl font-black uppercase tracking-widest ${ratingColor[score.rating] || "text-white"}`}>
                {score.rating}
             </motion.p>
          </div>
          <p className="mt-2 text-sm text-(--text-secondary) font-medium leading-relaxed">
            Your financial health is strong. This tier unlocks microloans up to ₦500,000 at 2% interest.
          </p>
          
          <div className="mt-4 inline-flex items-center justify-center rounded-full border border-white/5 bg-white/[0.02] px-3 py-1 text-[10px] font-medium text-white/40 uppercase tracking-widest">
            300–850 Scale
          </div>
        </div>
      </div>
    </div>
  );
}
