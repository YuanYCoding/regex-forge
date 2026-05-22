'use client';

import { useStore } from '@/lib/store';
import { X, Plus, Edit3, Check, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';

export function ExpressionList() {
  const { expressions, addExpression, removeExpression, updateExpression, negativeExpressions, isGeneratingExpressions } = useStore();
  const [newText, setNewText] = useState('');
  const [batchText, setBatchText] = useState('');
  const [showBatch, setShowBatch] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleAdd = () => {
    const trimmed = newText.trim();
    if (trimmed) { addExpression(trimmed); setNewText(''); }
  };

  const handleBatchImport = () => {
    const items = batchText.split('|').map((s) => s.trim()).filter((s) => s.length > 0);
    items.forEach((text) => addExpression(text));
    setBatchText(''); setShowBatch(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: 'add' | 'edit') => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (type === 'add') handleAdd();
      else { if (editingId && editText.trim()) { updateExpression(editingId, editText.trim()); } setEditingId(null); setEditText(''); }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-wider text-text-dim">
          相似问列表 {expressions.length > 0 && <span className="ml-2 font-mono text-accent font-semibold">{expressions.length} 条</span>}
        </label>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowBatch(!showBatch)}
            className="flex items-center gap-1 text-[10px] text-text-dim hover:text-accent transition-colors">
            <Upload className="h-3 w-3" />批量导入
          </button>
          {expressions.length > 0 && (
            <button onClick={() => { const ids = expressions.map((e) => e.id); ids.forEach((id) => removeExpression(id)); }}
              className="flex items-center gap-1 text-[10px] text-text-muted hover:text-danger transition-colors">
              <Trash2 className="h-3 w-3" />清空
            </button>
          )}
        </div>
      </div>

      {/* Batch import area */}
      {showBatch && (
        <div className="space-y-2 rounded-lg border border-accent/30 bg-accent/[0.02] p-3 animate-in">
          <p className="text-[10px] text-text-dim">用 <span className="text-accent font-mono font-semibold">|</span> 分隔每条相似问，一键批量导入</p>
          <textarea value={batchText} onChange={(e) => setBatchText(e.target.value)}
            placeholder="优惠券用不了 | 券无法使用 | 我的券怎么用不了 | ..."
            rows={3} className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent/50 focus:outline-none font-sans" />
          <div className="flex gap-2">
            <button onClick={handleBatchImport} disabled={!batchText.trim()}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dim disabled:opacity-30 transition-colors">确认导入</button>
            <button onClick={() => { setBatchText(''); setShowBatch(false); }}
              className="rounded-md border border-border px-3 py-1.5 text-xs text-text-dim hover:text-text transition-colors">取消</button>
          </div>
        </div>
      )}

      {/* Single add */}
      <div className="flex gap-2">
        <input type="text" value={newText} onChange={(e) => setNewText(e.target.value)} onKeyDown={(e) => handleKeyDown(e, 'add')}
          placeholder="手动添加一条相似问..." disabled={isGeneratingExpressions}
          className="flex-1 rounded-lg border border-dashed border-border bg-transparent px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent/50 focus:outline-none transition-colors font-sans" />
        <button onClick={handleAdd} disabled={!newText.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-dim hover:border-accent/50 hover:text-accent disabled:opacity-30 transition-colors">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Expression items */}
      <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-surface/50 p-2 space-y-1 stagger">
        {expressions.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted">点击上方「生成相似问」或手动添加</div>
        ) : (
          expressions.map((exp, i) => (
            <div key={exp.id} className="group flex items-center gap-2 rounded-md px-3 py-2 hover:bg-surface2/50 transition-colors">
              <span className="font-mono text-[10px] text-text-muted w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
              {editingId === exp.id ? (
                <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => handleKeyDown(e, 'edit')}
                  className="flex-1 rounded bg-surface px-2 py-1 text-sm text-text border border-accent/50 focus:outline-none font-sans" autoFocus />
              ) : (
                <span className="flex-1 text-sm text-text truncate">{exp.text}</span>
              )}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {editingId === exp.id ? (
                  <button onClick={() => { updateExpression(editingId, editText.trim()); setEditingId(null); }}
                    className="rounded p-1 text-accent hover:bg-accent/10"><Check className="h-3.5 w-3.5" /></button>
                ) : (
                  <button onClick={() => { setEditingId(exp.id); setEditText(exp.text); }}
                    className="rounded p-1 text-text-muted hover:text-text hover:bg-surface2"><Edit3 className="h-3.5 w-3.5" /></button>
                )}
                <button onClick={() => removeExpression(exp.id)} className="rounded p-1 text-text-muted hover:text-danger hover:bg-danger/10"><X className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Negative expressions display */}
      {negativeExpressions.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-[10px] font-medium uppercase tracking-wider text-warning">反例测试问 {negativeExpressions.length} 条</label>
          <div className="max-h-32 overflow-y-auto rounded-lg border border-warning/20 bg-warning/[0.02] p-2 space-y-0.5">
            {negativeExpressions.map((exp, i) => (
              <div key={exp.id} className="flex items-center gap-2 rounded px-3 py-1 text-sm text-text/80">
                <span className="font-mono text-[10px] text-text-muted w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <span className="truncate">{exp.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}