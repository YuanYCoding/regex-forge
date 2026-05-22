'use client';

import { useCallback, useState } from 'react';
import { useStore } from '@/lib/store';
import { IntentPanel } from '@/components/intent/IntentPanel';
import { ExpressionList } from '@/components/intent/ExpressionList';
import { RegexResultPanel } from '@/components/regex/RegexResultPanel';
import { TestPanel } from '@/components/test/TestPanel';
import { TestResultModal } from '@/components/test/TestResultModal';
import { runRegexTest, parseCommaSeparatedRegex } from '@/lib/regex-engine';
import type { SimilarExpression } from '@/lib/types';
import { Sparkles, ArrowRight, Loader2, AlertCircle, Zap, Brain, Hash, ShieldOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const s = useStore();
  const [error, setError] = useState<string | null>(null);
  const [adaptChanges, setAdaptChanges] = useState<string | null>(null);

  const llmBody = () => ({
    modelId: s.modelConfig.id, apiKey: s.modelConfig.apiKey,
    baseUrl: s.modelConfig.baseUrl, temperature: s.modelConfig.temperature,
    maxTokens: s.modelConfig.maxTokens, isAnthropic: s.modelConfig.isAnthropic,
    detailedContext: s.intentMode === 'detailed' ? s.detailedContext : '',
  });

  // Step 1: Generate similar expressions
  const handleGenerateExpressions = useCallback(async () => {
    if (!s.intent.trim()) { setError('请先输入意图'); return; }
    if (!s.modelConfig.apiKey) { setError('请先在设置页面配置 API Key'); return; }
    setError(null); s.setIsGeneratingExpressions(true);
    try {
      const res = await fetch('/api/generate-similar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: s.intent.trim(), count: s.similarCount, ...llmBody() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '请求失败');
      const exps: SimilarExpression[] = data.expressions.map((text: string, i: number) => ({ id: `gen-${Date.now()}-${i}`, text }));
      s.setExpressions(exps);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally { s.setIsGeneratingExpressions(false); }
  }, [s.intent, s.similarCount, s.modelConfig, s.detailedContext, s.intentMode]);

  // Generate negative examples
  const handleGenerateNegative = useCallback(async () => {
    if (!s.intent.trim() || !s.modelConfig.apiKey) { setError('请先输入意图并配置 API Key'); return; }
    setError(null); s.setIsGeneratingNegative(true);
    try {
      const res = await fetch('/api/generate-negative', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: s.intent.trim(), count: s.negativeCount, ...llmBody() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '请求失败');
      s.setNegativeExpressions(data.expressions.map((text: string, i: number) => ({ id: `neg-${Date.now()}-${i}`, text })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally { s.setIsGeneratingNegative(false); }
  }, [s.intent, s.similarCount, s.modelConfig, s.detailedContext, s.intentMode]);

  // Step 2: Generate regex
  const handleGenerateRegex = useCallback(async () => {
    if (s.expressions.length === 0) { setError('请先生成相似问列表'); return; }
    setError(null); s.setRegexResult(null); s.setIsGeneratingRegex(true);
    try {
      if (s.regexGenMode === 'fast') {
        const res = await fetch('/api/generate-regex-fast', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intent: s.intent.trim(), expressions: s.expressions.map((e) => e.text) }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '请求失败');
        s.setRegexResult({ merged: data.list.join(','), list: data.list, coverage: data.coverage });
      } else if (s.regexGenMode === 'keywords') {
        if (!s.modelConfig.apiKey) { setError('关键词生成需要 API Key'); s.setIsGeneratingRegex(false); return; }
        const res = await fetch('/api/generate-keywords', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intent: s.intent.trim(), ...llmBody() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '请求失败');
        s.setKeywordResult({ merged: data.keywords.join(','), list: data.keywords, coverage: 0 });
      } else {
        if (!s.modelConfig.apiKey) { setError('AI 生成需要 API Key'); s.setIsGeneratingRegex(false); return; }
        const res = await fetch('/api/generate-regex', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intent: s.intent.trim(), expressions: s.expressions.map((e) => e.text), ...llmBody() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '请求失败');
        s.setRegexResult({ merged: (data.list || []).join(','), list: data.list || [], coverage: data.coverage || 0 });
      }
      s.setTestResults([]); setAdaptChanges(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally { s.setIsGeneratingRegex(false); }
  }, [s.expressions, s.regexGenMode, s.modelConfig, s.intent]);

  // Step 3: Run test
  const handleRunTest = useCallback((phrases: string[]) => {
    if (!s.regexResult) { setError('请先生成或粘贴正则表达式'); return; }
    setError(null); setAdaptChanges(null);
    const patterns = s.regexResult.list.length > 0 ? s.regexResult.list : parseCommaSeparatedRegex(s.regexResult.merged);
    if (patterns.length === 0) { setError('未能解析出有效的正则表达式'); return; }
    const results = runRegexTest(patterns, phrases);
    s.setTestResults(results);
    s.setShowTestModal(true);
  }, [s.regexResult]);

  // Step 4: Adapt
  const handleAdapt = useCallback(async (failedPhrases: string[]) => {
    if (!s.regexResult || !s.modelConfig.apiKey) { setError('请配置 API Key'); return; }
    setError(null); s.setIsAdaptingRegex(true); setAdaptChanges(null);
    const currentList = s.regexResult.list.length > 0 ? s.regexResult.list : parseCommaSeparatedRegex(s.regexResult.merged);
    try {
      const res = await fetch('/api/adapt-regex', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentRegex: currentList, failedPhrases, ...llmBody() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '请求失败');
      setAdaptChanges(data.changes);
      s.setRegexResult({ merged: data.adaptedRegex.join(','), list: data.adaptedRegex, coverage: Math.min(100, (s.regexResult.coverage || 50) + 10) });
      const results = runRegexTest(data.adaptedRegex, failedPhrases);
      s.setTestResults([...s.testResults.filter((r) => r.passed), ...results]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '适配失败');
    } finally { s.setIsAdaptingRegex(false); }
  }, [s.regexResult, s.modelConfig, s.testResults]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text">正则表达式<span className="text-accent">工作台</span></h1>
          <p className="mt-1 text-sm text-text-dim">意图 → 相似问 → 正则 | 关键词 → 自动化测试</p>
        </div>
        {!s.modelConfig.apiKey && (
          <a href="/settings" className="flex items-center gap-1.5 rounded-lg border-2 border-warning/40 bg-warning/10 px-4 py-2 text-sm font-medium text-warning hover:bg-warning/15 transition-colors">
            <AlertCircle className="h-4 w-4" /> 配置 API Key
          </a>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border-2 border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger font-medium animate-in">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
          <button onClick={() => setError(null)} className="ml-auto font-bold text-lg">&times;</button>
        </div>
      )}
      {adaptChanges && (
        <div className="flex items-center gap-2 rounded-lg border-2 border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent font-medium animate-in">
          <Sparkles className="h-4 w-4 shrink-0" />适配完成: {adaptChanges}
        </div>
      )}

      {/* Two columns */}
      <div className="grid flex-1 gap-4 lg:grid-cols-2">
        {/* LEFT */}
        <div className="flex flex-col gap-4">
          {/* 1. Intent */}
          <section className="rounded-xl border-2 border-border bg-surface p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-xs font-mono font-bold text-white">1</span>
              <h2 className="text-sm font-semibold text-text">意图输入</h2>
            </div>
            <IntentPanel />
            <div className="flex gap-2">
              <button onClick={handleGenerateExpressions} disabled={s.isGeneratingExpressions || !s.intent.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-dim hover:shadow-md active:scale-[0.98] disabled:opacity-40 transition-all">
                {s.isGeneratingExpressions ? <><Loader2 className="h-4 w-4 animate-spin" />生成中...</> : <><Sparkles className="h-4 w-4" />生成相似问</>}
              </button>
              <button onClick={handleGenerateNegative} disabled={s.isGeneratingNegative || !s.intent.trim()}
                className="flex items-center gap-2 rounded-lg border-2 border-warning/30 bg-warning/5 px-4 py-2.5 text-sm font-semibold text-warning hover:bg-warning/10 active:scale-[0.98] disabled:opacity-40 transition-all">
                {s.isGeneratingNegative ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}生成反例
              </button>
            </div>
          </section>

          {/* 2. Expressions */}
          <section className={cn("rounded-xl border-2 border-border bg-surface p-4 shadow-sm flex-1 min-h-[300px]")}>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-xs font-mono font-bold text-white">2</span>
              <h2 className="text-sm font-semibold text-text">相似问管理</h2>
            </div>
            <ExpressionList />
            {s.expressions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-dim font-medium">生成方式：</span>
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    {(['fast', 'ai', 'keywords'] as const).map((k) => (
                      <button key={k} onClick={() => { s.setRegexGenMode(k); if (k === 'keywords') s.setSection3Tab('keywords'); else s.setSection3Tab('regex'); }}
                        className={cn('flex items-center gap-1 px-3 py-1.5 text-[10px] font-medium transition-colors', s.regexGenMode === k ? 'bg-accent text-white' : 'text-text-dim hover:text-text hover:bg-surface2')}>
                        {k === 'fast' && <><Zap className="h-3 w-3" />快速算法</>}
                        {k === 'ai' && <><Brain className="h-3 w-3" />AI 生成</>}
                        {k === 'keywords' && <><Hash className="h-3 w-3" />提取关键词</>}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleGenerateRegex} disabled={s.isGeneratingRegex}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-accent/30 bg-accent/5 px-4 py-2.5 text-sm font-semibold text-accent hover:bg-accent/10 hover:border-accent/50 active:scale-[0.98] disabled:opacity-40 transition-all">
                  {s.isGeneratingRegex ? <><Loader2 className="h-4 w-4 animate-spin" />生成中...</>
                    : <><ArrowRight className="h-4 w-4" />
                      {s.regexGenMode === 'fast' && `快速生成正则（${s.expressions.length} 条相似问）`}
                      {s.regexGenMode === 'ai' && `AI 生成正则（${s.expressions.length} 条相似问）`}
                      {s.regexGenMode === 'keywords' && `提取关键词（${s.expressions.length} 条相似问）`}
                    </>}
                </button>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-4">
          {/* 3. Regex | Keywords */}
          <section className={cn("rounded-xl border-2 border-border bg-surface p-4 shadow-sm flex-1 flex flex-col min-h-[300px]")}>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-xs font-mono font-bold text-white">3</span>
              <h2 className="text-sm font-semibold text-text">正则<span className="text-accent"> | </span>关键词</h2>
              <div className="flex rounded-lg border border-border overflow-hidden ml-4">
                {(['regex', 'keywords'] as const).map((tab) => (
                  <button key={tab} onClick={() => s.setSection3Tab(tab)}
                    className={cn('px-3 py-1 text-[10px] font-medium transition-colors', s.section3Tab === tab ? 'bg-accent text-white' : 'text-text-dim hover:text-text hover:bg-surface2')}>
                    {tab === 'regex' ? '正则表达式' : '关键词'}
                  </button>
                ))}
              </div>
            </div>
            <RegexResultPanel />
          </section>

          {/* 4. Test */}
          <section className="rounded-xl border-2 border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-xs font-mono font-bold text-white">4</span>
              <h2 className="text-sm font-semibold text-text">正则测试</h2>
            </div>
            <TestPanel onRunTest={handleRunTest} />
          </section>
        </div>
      </div>

      {/* Test result modal */}
      {s.showTestModal && s.testResults.length > 0 && (
        <TestResultModal results={s.testResults} onAdapt={handleAdapt} onClose={() => s.setShowTestModal(false)} />
      )}
    </div>
  );
}
