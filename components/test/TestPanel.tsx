'use client';

import { useStore } from '@/lib/store';
import { useState } from 'react';
import { Play, Plus, Trash2, AlertTriangle, ShieldOff } from 'lucide-react';

interface TestPanelProps { onRunTest: (phrases: string[]) => void; }

type TestMode = 'similar' | 'custom' | 'badcase' | 'negative';

export function TestPanel({ onRunTest }: TestPanelProps) {
  const { expressions, negativeExpressions, badcases, addBadcase, removeBadcase, setBadcases } = useStore();
  const [mode, setMode] = useState<TestMode>('similar');
  const [customPhrases, setCustomPhrases] = useState<string[]>(['']);
  const [badcaseInput, setBadcaseInput] = useState('');

  const handleRun = () => {
    if (mode === 'similar') onRunTest(expressions.map((e) => e.text));
    else if (mode === 'negative') onRunTest(negativeExpressions.map((e) => e.text));
    else if (mode === 'custom') onRunTest(customPhrases.filter((t) => t.trim()));
    else onRunTest(badcases);
  };

  const addCustomLine = () => setCustomPhrases((p) => [...p, '']);
  const updateCustomLine = (i: number, v: string) => setCustomPhrases((p) => p.map((t, idx) => (idx === i ? v : t)));
  const removeCustomLine = (i: number) => setCustomPhrases((p) => p.filter((_, idx) => idx !== i));
  const handleAddBadcase = () => { const t = badcaseInput.trim(); if (t) { addBadcase(t); setBadcaseInput(''); } };

  return (
    <div className="space-y-3">
      {/* 4 tabs */}
      <div className="flex rounded-lg border border-border overflow-hidden w-fit flex-wrap">
        {([
          ['similar', '相似问测试'],
          ['negative', '反例测试'],
          ['custom', '自定义话术'],
          ['badcase', 'Badcase'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setMode(key)}
            className={`px-3 py-2 text-xs font-medium transition-colors ${mode === key ? 'bg-accent text-white' : 'text-text-dim hover:text-text hover:bg-surface2'}`}>
            {key === 'negative' && <ShieldOff className="h-3 w-3 inline mr-1" />}
            {label}
          </button>
        ))}
      </div>

      {/* Similar mode */}
      {mode === 'similar' && (
        expressions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-text-muted">暂无相似问，请先生成</div>
        ) : (
          <>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-surface/50 p-2 space-y-1">
              {expressions.map((exp, i) => (
                <div key={exp.id} className="flex items-center gap-2 rounded px-3 py-1.5 hover:bg-surface2 text-sm text-text">
                  <span className="font-mono text-[10px] text-text-muted w-5 shrink-0 text-right">{i + 1}</span>
                  <span className="truncate">{exp.text}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-text-muted">共 {expressions.length} 条相似问参与测试</p>
          </>
        )
      )}

      {/* Negative test mode */}
      {mode === 'negative' && (
        negativeExpressions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-text-muted">暂无返例，请在意图区生成返例</div>
        ) : (
          <>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-warning/20 bg-warning/[0.02] p-2 space-y-1">
              {negativeExpressions.map((exp, i) => (
                <div key={exp.id} className="flex items-center gap-2 rounded px-3 py-1.5 hover:bg-surface2 text-sm text-text">
                  <span className="font-mono text-[10px] text-text-muted w-5 shrink-0 text-right">{i + 1}</span>
                  <ShieldOff className="h-3 w-3 shrink-0 text-warning/60" />
                  <span className="truncate">{exp.text}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-text-muted">共 {negativeExpressions.length} 条返例参与测试（检测误命中）</p>
          </>
        )
      )}

      {/* Custom mode */}
      {mode === 'custom' && (
        <div className="space-y-2">
          <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-border bg-surface/50 p-2">
            {customPhrases.map((text, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-text-muted w-5 shrink-0 text-right">{idx + 1}</span>
                <input type="text" value={text} onChange={(e) => updateCustomLine(idx, e.target.value)}
                  placeholder="输入测试话术..." className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text placeholder:text-text-muted focus:border-accent/50 focus:outline-none transition-colors font-sans" />
                <button onClick={() => removeCustomLine(idx)} className="rounded p-1 text-text-muted hover:text-danger transition-colors shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
          <button onClick={addCustomLine} className="flex items-center gap-1 text-xs text-text-dim hover:text-accent transition-colors"><Plus className="h-3 w-3" />添加测试话术</button>
        </div>
      )}

      {/* Badcase mode */}
      {mode === 'badcase' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input type="text" value={badcaseInput} onChange={(e) => setBadcaseInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddBadcase()}
              placeholder="输入 Badcase 话术..." className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent/50 focus:outline-none transition-colors font-sans" />
            <button onClick={handleAddBadcase} disabled={!badcaseInput.trim()}
              className="flex items-center gap-1 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-dim disabled:opacity-30 transition-colors"><Plus className="h-3.5 w-3.5" />添加</button>
          </div>
          {badcases.length > 0 ? (
            <div className="max-h-64 overflow-y-auto rounded-lg border border-warning/30 bg-warning/[0.03] p-2 space-y-1">
              {badcases.map((text, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded px-3 py-1.5 text-sm text-text">
                  <AlertTriangle className="h-3 w-3 shrink-0 text-warning" />
                  <span className="flex-1 truncate">{text}</span>
                  <button onClick={() => removeBadcase(idx)} className="rounded p-1 text-text-muted hover:text-danger transition-colors"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-text-muted">暂无 Badcase</div>
          )}
          {badcases.length > 0 && <button onClick={() => setBadcases([])} className="text-xs text-text-muted hover:text-danger transition-colors">清空全部 Badcase</button>}
        </div>
      )}

      {/* Run button */}
      <button onClick={handleRun}
        disabled={
          (mode === 'similar' && expressions.length === 0) ||
          (mode === 'negative' && negativeExpressions.length === 0) ||
          (mode === 'custom' && customPhrases.filter((t) => t.trim()).length === 0) ||
          (mode === 'badcase' && badcases.length === 0)
        }
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-accent-dim hover:shadow-md active:scale-[0.98] disabled:opacity-40 transition-all">
        <Play className="h-4 w-4" />运行测试
      </button>
    </div>
  );
}
