import { Sparkles, CheckCircle2, AlertTriangle, Pill } from 'lucide-react';

interface VitaminBenefit {
  name: string;
  benefit: string;
  icon: string;
}

interface DrinkInsightsProps {
  vitaminBenefits: VitaminBenefit[];
  standouts: string[];
  pitfalls: string[];
  insightSummary?: string;
}

const DrinkInsights = ({ vitaminBenefits, standouts, pitfalls, insightSummary }: DrinkInsightsProps) => {
  const hasContent = vitaminBenefits.length > 0 || standouts.length > 0 || pitfalls.length > 0;
  
  if (!hasContent) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-400" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Drink Insights</h3>
      </div>

      {/* Summary */}
      {insightSummary && (
        <p className="text-sm text-slate-300 leading-relaxed">{insightSummary}</p>
      )}

      {/* Vitamins & Nutrients */}
      {vitaminBenefits.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-purple-300 uppercase tracking-wider">Vitamins & Nutrients</span>
          </div>
          <div className="space-y-2">
            {vitaminBenefits.map((vitamin, index) => (
              <div 
                key={index}
                className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-lg p-3 border border-purple-500/20"
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{vitamin.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-purple-200">{vitamin.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{vitamin.benefit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standouts */}
      {standouts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-300 uppercase tracking-wider">Standouts</span>
          </div>
          <ul className="space-y-1.5">
            {standouts.map((standout, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>{standout}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Potential Pitfalls */}
      {pitfalls.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-amber-300 uppercase tracking-wider">Potential Pitfalls</span>
          </div>
          <ul className="space-y-1.5">
            {pitfalls.map((pitfall, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-amber-400 mt-0.5">•</span>
                <span>{pitfall}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DrinkInsights;
