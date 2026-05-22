'use client';

import { useStore } from '@/lib/store';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const COUNT_OPTIONS = [10, 20, 30, 50, 80, 100];

export function IntentPanel() {
  const { intent, setIntent, intentMode, setIntentMode, detailedContext, setDetailedContext, similarCount, setSimilarCount, negativeCount, setNegativeCount, isGeneratingExpressions } = useStore();
  const [showCount, setShowCount] = useState(false);
  const [showNegCount, setShowNegCount] = useState(false);

  return (
    <div className="space-y-3">
      {/* Tab switch */}
      <div className="flex rounded-lg border border-border overflow-hidden w-fit">
        {(['concise', 'detailed'] as const).map((m) => (
          <button key={m} onClick={() => setIntentMode(m)}
            className={`px-4 py-1.5 text-xs font-medium transition-colors ${intentMode === m ? 'bg-accent text-white' : 'text-text-dim hover:text-text hover:bg-surface2'}`}>
            {m === 'concise' ? '精简意图' : '详细描述'}
          </button>
        ))}
      </div>

      {/* Concise mode */}
      {intentMode === 'concise' && (
        <textarea value={intent} onChange={(e) => setIntent(e.target.value)}
          placeholder="输入用户意图，如：优惠券无法使用、不想参加回访、投诉客服..."
          rows={2} disabled={isGeneratingExpressions}
          className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-colors font-sans" />
      )}

      {/* Detailed mode */}
      {intentMode === 'detailed' && (
        <div className="space-y-2">
          <input type="text" value={intent} onChange={(e) => setIntent(e.target.value)}
            placeholder="意图标题（必填），如：优惠券无法使用"
            disabled={isGeneratingExpressions}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-colors font-sans" />
          <textarea value={detailedContext} onChange={(e) => setDetailedContext(e.target.value)}
            placeholder="详细描述意图的背景和上下文（可选），如：用户在尝试使用优惠券时遇到各种问题，包括券码无效、券已过期、不满足使用条件、系统错误导致券无法抵扣等场景..."
            rows={4} disabled={isGeneratingExpressions}
            className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-colors font-sans" />
        </div>
      )}

      {/* Count selector + info */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button onClick={() => setShowCount(!showCount)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-dim hover:border-accent/30 hover:text-text transition-colors">
            <span className="text-accent font-mono font-semibold">{similarCount}</span> 条
            {showCount ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showCount && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowCount(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 w-32 rounded-lg border border-border bg-surface py-1 shadow-xl animate-in">
                {COUNT_OPTIONS.map((n) => (
                  <button key={n} onClick={() => { setSimilarCount(n); setShowCount(false); }}
                    className={`w-full px-3 py-1.5 text-left text-xs font-mono transition-colors ${n === similarCount ? 'text-accent bg-accent/10 font-semibold' : 'text-text-dim hover:text-text hover:bg-surface2'}`}>
                    {n} 条
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {/* Negative count selector */}
        <div className="relative">
          <button onClick={() => setShowNegCount(!showNegCount)}
            className="flex items-center gap-1.5 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning hover:bg-warning/10 transition-colors">
            反例 <span className="text-warning font-mono font-semibold">{negativeCount}</span> 条
          </button>
          {showNegCount && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNegCount(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 w-32 rounded-lg border border-border bg-surface py-1 shadow-xl animate-in">
                {COUNT_OPTIONS.map((n) => (
                  <button key={n} onClick={() => { setNegativeCount(n); setShowNegCount(false); }}
                    className={`w-full px-3 py-1.5 text-left text-xs font-mono transition-colors ${n === negativeCount ? 'text-warning bg-warning/5 font-semibold' : 'text-text-dim hover:text-text hover:bg-surface2'}`}>
                    {n} 条
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="flex-1 text-xs text-text-muted">
          {intent.length > 0
            ? <span>意图<span className="text-accent font-medium">「{intent.slice(0, 25)}{intent.length > 25 ? '...' : ''}」</span>，生成 <span className="text-accent font-mono font-semibold">{similarCount}</span> 条相似问 + <span className="text-warning font-mono font-semibold">{negativeCount}</span> 条反例{detailedContext ? '（含详细上下文）' : ''}</span>
            : <span className="cursor-blink">等待输入意图...</span>}
        </div>
      </div>
    </div>
  );
}
