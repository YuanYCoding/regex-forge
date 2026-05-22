'use client';

import { useStore } from '@/lib/store';
import { parseCommaSeparatedRegex } from '@/lib/regex-engine';
import { Copy, Check, Code2, List, Pencil, CheckCheck } from 'lucide-react';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((m) => m.Editor), {
  ssr: false,
  loading: () => <div className="flex h-40 items-center justify-center rounded-lg border border-border bg-surface text-xs text-text-muted">加载编辑器中...</div>,
});

export function RegexResultPanel() {
  const { regexResult, setRegexResult, keywordResult, setKeywordResult, regexFormat, setRegexFormat, section3Tab } = useStore();
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const prevTab = useRef(section3Tab);
  const skipNextChange = useRef(false);

  // Current data depends on active tab
  const currentResult = section3Tab === 'regex' ? regexResult : keywordResult;
  const setCurrentResult = section3Tab === 'regex' ? setRegexResult : setKeywordResult;

  const prevResultRef = useRef(currentResult);

  // When switching between tabs, skip next onChange
  useEffect(() => { skipNextChange.current = true; prevTab.current = section3Tab; }, [section3Tab]);

  // When external data changes (new regex generated), skip next onChange
  useEffect(() => {
    if (currentResult !== prevResultRef.current) {
      skipNextChange.current = true;
      prevResultRef.current = currentResult;
    }
  }, [currentResult]);

  // Display text
  const displayText = useMemo(() => {
    if (!currentResult) return '';
    if (section3Tab === 'keywords') {
      return currentResult.list.join(',\n');
    }
    if (regexFormat === 'merged') {
      // 合并：所有正则用逗号连接为一行
      return currentResult.list.join(',');
    }
    // 逐条：每条正则独占一行（无逗号后缀）
    return currentResult.list.join('\n');
  }, [currentResult, regexFormat, section3Tab]);

  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(null), 2000);
  }, []);

  // Process editor changes. Supports comma-separated and newline-separated formats.
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value === undefined) return;
    // Skip changes triggered by internal format switching
    if (skipNextChange.current) { skipNextChange.current = false; return; }
    const trimmed = value.trim();
    if (!trimmed) { setCurrentResult(null); return; }
    // First try newline splitting, then comma splitting
    let list: string[];
    if (trimmed.includes('\n')) {
      list = trimmed.split('\n').map((s: string) => s.replace(/,\s*$/, '').trim()).filter((s: string) => s.length > 0);
    } else {
      list = parseCommaSeparatedRegex(trimmed);
    }
    if (list.length === 0) { setCurrentResult(null); return; }
    setCurrentResult({ merged: list.join(','), list, coverage: 0 });
  }, [setCurrentResult]);

  const copyText = useMemo(() => {
    if (!currentResult) return '';
    return currentResult.list.join(',');
  }, [currentResult]);

  const patternCount = currentResult?.list?.length || 0;

  // Determine if editor should be read-only
  const isReadOnly = !editing;

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-1">
        <div className="flex items-center gap-1">
          {patternCount > 0 && (
            <span className="font-mono text-xs text-accent font-semibold">{patternCount} 条</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Edit toggle — only for regex tab. Default read-only, click to enable editing */}
          {section3Tab === 'regex' && (
            <button onClick={() => { skipNextChange.current = true; setEditing(!editing); }}
              className={cn('flex items-center gap-1 rounded-md border px-2.5 py-1 text-[10px] font-medium transition-colors',
                editing ? 'bg-warning/10 text-warning border-warning/40' : 'border-border text-text-dim hover:text-text hover:bg-surface2')}>
              {editing ? <><CheckCheck className="h-3 w-3" />完成编辑</> : <><Pencil className="h-3 w-3" />编辑</>}
            </button>
          )}

          {/* Format toggle - only for regex tab */}
          {section3Tab === 'regex' && currentResult && (
            <div className="flex rounded-md border border-border overflow-hidden">
              <button onClick={() => { skipNextChange.current = true; setRegexFormat('merged'); }}
                className={cn('flex items-center gap-1 px-2 py-1 text-[10px] font-medium transition-colors', regexFormat === 'merged' ? 'bg-accent/10 text-accent' : 'text-text-dim hover:text-text')}>
                <Code2 className="h-3 w-3" />合并
              </button>
              <button onClick={() => { skipNextChange.current = true; setRegexFormat('list'); }}
                className={cn('flex items-center gap-1 px-2 py-1 text-[10px] font-medium transition-colors', regexFormat === 'list' ? 'bg-accent/10 text-accent' : 'text-text-dim hover:text-text')}>
                <List className="h-3 w-3" />逐条
              </button>
            </div>
          )}

          {/* Copy */}
          {currentResult && (
            <button onClick={() => handleCopy(copyText, section3Tab)}
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-text-dim hover:border-accent/50 hover:text-accent transition-colors">
              {copied === section3Tab ? <><Check className="h-3 w-3 text-accent" /><span className="text-accent">已复制</span></> : <><Copy className="h-3 w-3" />复制</>}
            </button>
          )}

          {/* Keywords: copy-all button */}
          {section3Tab === 'keywords' && keywordResult && (
            <button onClick={() => handleCopy(keywordResult.list.join('\n'), 'keywords-all')}
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-text-dim hover:border-accent/50 hover:text-accent transition-colors">
              {copied === 'keywords-all' ? <><Check className="h-3 w-3 text-accent" />已复制</> : <><Copy className="h-3 w-3" />复制全部</>}
            </button>
          )}
        </div>
      </div>

      {/* Regex tab: Monaco editor */}
      {section3Tab === 'regex' && (
        <div className={cn('overflow-hidden rounded-lg border transition-colors',
          editing ? 'border-warning/40 ring-1 ring-warning/20' :
          currentResult ? 'border-border' :
          'border-accent/30 ring-1 ring-accent/10')}>
          <MonacoEditor
            height={Math.max(140, Math.min(380, (displayText || '粘贴正则到此处，逗号分隔').split('\n').length * 22 + 80))}
            language="regex" theme="vs" value={displayText}
            options={{
              readOnly: isReadOnly,
              minimap: { enabled: false }, lineNumbers: 'on',
              scrollBeyondLastLine: false, fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              padding: { top: 10, bottom: 10 }, wordWrap: 'on',
              renderLineHighlight: 'line', lineNumbersMinChars: 3,
              overviewRulerLanes: 0,
              scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
            }}
            onChange={handleEditorChange}
          />
        </div>
      )}

      {/* Keywords tab: keyword cloud */}
      {section3Tab === 'keywords' && (
        keywordResult && keywordResult.list.length > 0 ? (
          <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-surface/50 p-3">
            <div className="flex flex-wrap gap-1.5">
              {keywordResult.list.map((kw, i) => (
                <span key={i} className="inline-flex items-center rounded-md bg-accent/5 border border-accent/10 px-2.5 py-1 text-xs text-text font-mono cursor-default hover:bg-accent/10 transition-colors">{kw}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border py-10 text-center text-xs text-text-muted">关键词生成后将在此展示</div>
        )
      )}

      {/* Hint */}
      {section3Tab === 'regex' && (
        <p className="text-[10px] text-text-muted">
          {editing ? <span className="text-warning font-medium">编辑中</span> : <span>只读</span>}
          {regexFormat === 'list' ? ' · 逐条：每条正则独立成行' : ' · 合并：逗号连接为一行'}
          {patternCount > 0 && <span className="ml-1">· <span className="font-mono text-accent font-semibold">{patternCount}</span> 条正则</span>}
          {!currentResult && !editing && <span className="ml-1">· 点击「编辑」后粘贴逗号分隔的正则</span>}
        </p>
      )}
      {section3Tab === 'keywords' && keywordResult && (
        <p className="text-[10px] text-text-muted">
          共 <span className="font-mono text-accent font-semibold">{keywordResult.list.length}</span> 个关键词
        </p>
      )}
    </div>
  );
}
