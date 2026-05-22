'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, Eye, Code2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromptItem {
  key: string; title: string; description: string; content: string; category: string;
}

/** Convert simple markdown to HTML — works without any external library */
function markdownToHtml(md: string): string {
  if (!md) return '';
  let html = md;
  // Escape HTML first
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4 class="text-sm font-bold text-text mt-3 mb-1">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-text mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-text mt-4 mb-2 border-b border-border pb-1">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-text mt-5 mb-3">$1</h1>');
  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-text">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-accent/5 text-accent px-1 py-0.5 rounded text-sm font-mono">$1</code>');
  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-surface2 rounded-lg p-4 my-2 overflow-x-auto text-sm font-mono text-text leading-relaxed"><code>$2</code></pre>');
  // Lists
  html = html.replace(/^[\s]*[-*+]\s+(.+)$/gm, '<li class="ml-5 text-sm text-text leading-relaxed list-disc">$1</li>');
  html = html.replace(/^[\s]*(\d+)\.\s+(.+)$/gm, '<li class="ml-5 text-sm text-text leading-relaxed list-decimal">$2</li>');
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="my-3 border-border" />');
  // Paragraphs: wrap consecutive non-empty lines
  const lines = html.split('\n');
  const result: string[] = [];
  let inList = false;
  for (const line of lines) {
    if (line.startsWith('<li') || line.startsWith('<hr') || line.startsWith('<h') || line.startsWith('<pre')) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(line);
      continue;
    }
    if (line.trim() === '') {
      if (inList) { result.push('</ul>'); inList = false; }
      continue;
    }
    if (inList) { result.push('</ul>'); inList = false; }
    result.push(`<p class="text-sm text-text leading-relaxed my-1">${line}</p>`);
  }
  if (inList) result.push('</ul>');
  return result.join('\n');
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [viewMode, setViewMode] = useState<'raw' | 'rendered'>('raw');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/prompts');
      const data = await res.json();
      setPrompts(data.prompts || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadPrompts(); // eslint-disable-next-line react-hooks/set-state-in-effect
  }, []);

  const selectedPrompt = prompts.find((p) => p.key === selected);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text.slice(0, 30));
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: editing, content: editContent }),
      });
      if (res.ok) {
        setPrompts((prev) => prev.map((p) => (p.key === editing ? { ...p, content: editContent } : p)));
        setEditing(null);
        setMessage('提示词已更新，下次调用将使用新提示词');
        setTimeout(() => setMessage(null), 3000);
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const categories = [...new Set(prompts.map((p) => p.category))];

  // Compute whether content has loaded for selected prompt
  const contentLoaded = selectedPrompt && typeof selectedPrompt.content === 'string' && selectedPrompt.content.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-6 py-8">
      {/* Sidebar */}
      <div className="w-72 shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text transition-colors">
            <ArrowLeft className="h-4 w-4" />返回工作台
          </Link>
        </div>
        <h1 className="text-lg font-bold tracking-tight text-text">提示词<span className="text-accent">配置</span></h1>
        {message && <div className="rounded-lg bg-accent/10 border border-accent/20 px-3 py-2 text-xs text-accent font-medium animate-in">{message}</div>}
        {loading
          ? <div className="text-xs text-text-muted py-4">加载中...</div>
          : categories.map((cat) => (
            <div key={cat} className="space-y-1">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">{cat}</h3>
              {prompts.filter((p) => p.category === cat).map((p) => (
                <button key={p.key}
                  onClick={() => { setSelected(p.key); setEditing(null); setViewMode('raw'); }}
                  className={cn('w-full text-left rounded-lg px-3 py-2.5 text-xs transition-colors',
                    selected === p.key ? 'bg-accent/10 border border-accent/30 text-accent font-semibold' : 'border border-transparent text-text-dim hover:bg-surface2 hover:text-text')}>
                  <div>{p.title}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">{p.description}</div>
                </button>
              ))}
            </div>
          ))}
      </div>

      {/* Content area */}
      <div className="flex-1 min-w-0 space-y-4">
        {!selectedPrompt ? (
          <div className="flex items-center justify-center h-full rounded-xl border-2 border-dashed border-border py-32 text-sm text-text-muted">选择左侧提示词查看和编辑</div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-text">{selectedPrompt.title}</h2>
              <span className="text-xs text-text-muted hidden sm:inline">{selectedPrompt.description}</span>
              <div className="ml-auto flex items-center gap-1">
                {/* Copy */}
                <button onClick={() => handleCopy(selectedPrompt.content)}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-dim hover:border-accent/30 hover:text-accent transition-colors">
                  {copied === selectedPrompt.content.slice(0, 30) ? <><Check className="h-3.5 w-3.5" />已复制</> : <><Copy className="h-3.5 w-3.5" />复制</>}
                </button>

                {/* Edit / Save */}
                {editing === selected ? (
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dim disabled:opacity-50 transition-colors">
                    <Save className="h-3.5 w-3.5" />{saving ? '保存中...' : '保存修改'}
                  </button>
                ) : (
                  <button onClick={() => { setEditing(selected); setEditContent(selectedPrompt.content); }}
                    className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-dim hover:border-accent/30 hover:text-accent transition-colors">编辑</button>
                )}

                {/* View mode toggle */}
                <button onClick={() => setViewMode(viewMode === 'raw' ? 'rendered' : 'raw')}
                  className={cn('flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                    viewMode === 'rendered' ? 'bg-accent/10 border-accent/30 text-accent' : 'border-border text-text-dim hover:border-accent/30 hover:text-accent')}>
                  {viewMode === 'raw' ? <><Eye className="h-3.5 w-3.5" />渲染</> : <><Code2 className="h-3.5 w-3.5" />源码</>}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="rounded-xl border-2 border-border bg-surface p-6 min-h-[500px] overflow-y-auto max-h-[70vh]">
              {editing === selected ? (
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[400px] resize-none bg-transparent text-sm text-text font-mono leading-relaxed focus:outline-none"
                  placeholder="编辑提示词内容..." />
              ) : !contentLoaded ? (
                <div className="text-xs text-text-muted py-8 text-center">加载中...</div>
              ) : viewMode === 'raw' ? (
                <pre className="text-sm text-text font-mono leading-relaxed whitespace-pre-wrap break-words">{selectedPrompt.content}</pre>
              ) : (
                <div
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(selectedPrompt.content) }}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
