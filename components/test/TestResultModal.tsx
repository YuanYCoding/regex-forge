'use client';

import { useStore } from '@/lib/store';
import { computeStats } from '@/lib/regex-engine';
import type { TestResult } from '@/lib/types';
import { Check, X, AlertTriangle, Wand2, Circle, Minimize2, Maximize2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TestResultModalProps {
  results: TestResult[];
  onAdapt: (failedPhrases: string[]) => void;
  onClose: () => void;
}

export function TestResultModal({ results, onAdapt, onClose }: TestResultModalProps) {
  const { isAdaptingRegex } = useStore();
  const [maximized, setMaximized] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const stats = computeStats(results);
  const failedResults = results.filter((r) => !r.passed);

  // Minimized state: show a floating bar
  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border-2 border-border bg-surface shadow-2xl px-5 py-3 animate-in cursor-pointer" onClick={() => setMinimized(false)}>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-xs font-mono font-bold', stats.passRate === 100 ? 'bg-accent/10 text-accent ring-1 ring-accent/30' : 'bg-danger/10 text-danger ring-1 ring-danger/30')}>
          {stats.passRate}%
        </div>
        <div className="text-sm font-semibold text-text">测试结果</div>
        <div className="text-xs text-text-dim"><span className="text-accent font-mono">{stats.passed}</span>/{stats.total} 通过</div>
        {failedResults.length > 0 && <div className="text-xs text-danger font-medium">{failedResults.length} 失败</div>}
        <div className="flex gap-1 ml-2">
          <button onClick={(e) => { e.stopPropagation(); setMaximized(true); setMinimized(false); }} className="rounded p-1.5 text-text-muted hover:text-text hover:bg-surface2"><Maximize2 className="h-3.5 w-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="rounded p-1.5 text-text-muted hover:text-danger hover:bg-danger/10"><XCircle className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    );
  }

  const containerClass = maximized
    ? 'fixed inset-4 z-50 flex flex-col rounded-2xl border-2 border-border bg-bg shadow-2xl animate-in'
    : 'fixed inset-x-4 top-16 bottom-8 z-50 flex flex-col rounded-2xl border-2 border-border bg-bg shadow-2xl max-w-4xl mx-auto animate-in';

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className={containerClass}>
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-bold text-text">正则测试结果</h2>
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-xs font-mono font-bold ring-1', stats.passRate === 100 ? 'bg-accent/10 text-accent ring-accent/30' : stats.passRate >= 80 ? 'bg-warning/10 text-warning ring-warning/30' : 'bg-danger/10 text-danger ring-danger/30')}>
              {stats.passRate}%
            </div>
            <div className="text-xs text-text-dim">
              <span className="text-accent font-mono font-semibold">{stats.passed}</span>/{stats.total} 通过
              {stats.failed > 0 && <span className="ml-1"><span className="text-danger font-mono font-semibold">{stats.failed}</span> 失败</span>}
            </div>
            <div className="flex-1 max-w-48">
              <div className="h-1.5 overflow-hidden rounded-full bg-surface2">
                <div className={cn('h-full rounded-full transition-all duration-700', stats.passRate === 100 ? 'bg-accent' : stats.passRate >= 80 ? 'bg-warning' : 'bg-danger')} style={{ width: `${stats.passRate}%` }} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setMaximized(!maximized)} className="rounded-lg p-2 text-text-muted hover:text-text hover:bg-surface2 transition-colors">
              {maximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button onClick={() => setMinimized(true)} className="rounded-lg p-2 text-text-muted hover:text-text hover:bg-surface2 transition-colors">─</button>
            <button onClick={onClose} className="rounded-lg p-2 text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"><XCircle className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Results body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1.5 stagger">
          {results.map((result, idx) => (
            <div key={idx} className={cn('flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors', result.passed ? 'border-accent/10 bg-accent/[0.02]' : 'border-danger/10 bg-danger/[0.02]')}>
              <div className="mt-0.5 shrink-0">
                {result.passed
                  ? <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10"><Check className="h-3 w-3 text-accent" /></div>
                  : <div className="flex h-5 w-5 items-center justify-center rounded-full bg-danger/10"><X className="h-3 w-3 text-danger" /></div>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-text">{result.phrase}</div>
                {result.passed
                  ? <div className="mt-1 text-[10px] text-text-muted font-mono truncate">匹配: {result.matchedPattern}</div>
                  : <div className="mt-1 flex items-start gap-1.5"><AlertTriangle className="h-3 w-3 shrink-0 text-warning mt-px" /><span className="text-[10px] text-warning/90">{result.failureReason}</span></div>}
              </div>
              <Circle className={cn('h-2 w-2 shrink-0', result.passed ? 'text-accent' : 'text-danger')} fill="currentColor" />
            </div>
          ))}
        </div>

        {/* Footer with adapt button */}
        {failedResults.length > 0 && (
          <div className="shrink-0 flex items-center gap-3 border-t border-border px-6 py-4 bg-surface/50">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <div className="text-xs">
              <div className="font-semibold text-warning">{failedResults.length} 条话术未通过</div>
              <div className="text-text-muted">一键适配修正正则，同时保证原有匹配不失效</div>
            </div>
            <button onClick={() => onAdapt(failedResults.map((r) => r.phrase))} disabled={isAdaptingRegex}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-warning px-4 py-2 text-sm font-semibold text-white hover:bg-warning/90 disabled:opacity-50 transition-colors shadow-sm">
              <Wand2 className="h-4 w-4" />{isAdaptingRegex ? '适配中...' : '一键适配修正'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
