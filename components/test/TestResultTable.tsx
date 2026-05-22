'use client';

import { useStore } from '@/lib/store';
import { computeStats } from '@/lib/regex-engine';
import type { TestResult as TestResultType } from '@/lib/types';
import { Check, X, AlertTriangle, Wand2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestResultTableProps {
  results: TestResultType[];
  onAdapt: (failedPhrases: string[]) => void;
}

export function TestResultTable({ results, onAdapt }: TestResultTableProps) {
  const { isAdaptingRegex } = useStore();
  const stats = computeStats(results);
  const failedResults = results.filter((r) => !r.passed);

  if (results.length === 0) return null;

  return (
    <div className="space-y-4 animate-in">
      {/* Stats bar */}
      <div className="flex items-center gap-4 rounded-lg border border-border bg-surface/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full text-xs font-mono font-bold',
              stats.passRate === 100
                ? 'bg-accent/10 text-accent ring-1 ring-accent/30'
                : stats.passRate >= 80
                ? 'bg-warning/10 text-warning ring-1 ring-warning/30'
                : 'bg-danger/10 text-danger ring-1 ring-danger/30'
            )}
          >
            {stats.passRate}%
          </div>
          <div className="text-xs">
            <div className="font-medium text-text">通过率</div>
            <div className="text-text-dim">
              <span className="text-accent font-mono">{stats.passed}</span>
              {' / '}
              <span className="font-mono">{stats.total}</span> 通过
              {stats.failed > 0 && (
                <>
                  {'，'}
                  <span className="text-danger font-mono">{stats.failed}</span> 失败
                </>
              )}
            </div>
          </div>
        </div>

        {/* Pass rate bar */}
        <div className="flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-surface2">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700 ease-out',
                stats.passRate === 100
                  ? 'bg-accent'
                  : stats.passRate >= 80
                  ? 'bg-warning'
                  : 'bg-danger'
              )}
              style={{ width: `${stats.passRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Results list */}
      <div className="space-y-1.5 stagger">
        {results.map((result, idx) => (
          <div
            key={idx}
            className={cn(
              'flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors',
              result.passed
                ? 'border-accent/10 bg-accent/[0.02]'
                : 'border-danger/10 bg-danger/[0.02]'
            )}
          >
            <div className="mt-0.5 shrink-0">
              {result.passed ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10">
                  <Check className="h-3 w-3 text-accent" />
                </div>
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-danger/10">
                  <X className="h-3 w-3 text-danger" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-text">{result.phrase}</div>
              {result.passed ? (
                <div className="mt-1 text-[10px] text-text-muted font-mono truncate">
                  匹配: {result.matchedPattern}
                </div>
              ) : (
                <div className="mt-1 flex items-start gap-1.5">
                  <AlertTriangle className="h-3 w-3 shrink-0 text-warning mt-px" />
                  <span className="text-[10px] text-warning/90">{result.failureReason}</span>
                </div>
              )}
            </div>

            <div className="shrink-0">
              <Circle
                className={cn(
                  'h-2 w-2',
                  result.passed ? 'text-accent' : 'text-danger'
                )}
                fill="currentColor"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Adapt button for failed results */}
      {failedResults.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border-2 border-warning/30 bg-warning/5 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <div className="text-xs text-warning/90">
            <div className="font-semibold">{failedResults.length} 条话术未通过</div>
            <div className="text-text-muted mt-0.5">
              点击右侧按钮，AI 将分析失败原因并修正/新增正则，同时保证原有匹配不失效
            </div>
          </div>
          <button
            onClick={() => onAdapt(failedResults.map((r) => r.phrase))}
            disabled={isAdaptingRegex}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-warning px-4 py-2 text-sm font-semibold text-white hover:bg-warning/90 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Wand2 className="h-4 w-4" />
            {isAdaptingRegex ? '适配中...' : '一键适配修正'}
          </button>
        </div>
      )}
    </div>
  );
}
