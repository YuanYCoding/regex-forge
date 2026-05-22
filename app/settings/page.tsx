'use client';

import { useStore } from '@/lib/store';
import { PRESET_MODELS } from '@/lib/types';
import type { PresetModel } from '@/lib/types';
import { Eye, EyeOff, Check, ArrowLeft, Key, Cpu, Thermometer, Code2, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const { modelConfig, setModelConfig } = useStore();
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const markSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleSelectPreset = (preset: PresetModel) => {
    setModelConfig({
      id: preset.id, name: preset.name, provider: preset.provider,
      defaultBaseUrl: preset.defaultBaseUrl, baseUrl: preset.defaultBaseUrl,
      isAnthropic: !!preset.isAnthropic,
    });
    markSaved();
  };

  const updateConfig = (patch: Partial<typeof modelConfig>) => {
    setModelConfig(patch);
    markSaved();
  };

  const handleTestConnection = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: modelConfig.id,
          apiKey: modelConfig.apiKey,
          baseUrl: modelConfig.baseUrl,
          isAnthropic: modelConfig.isAnthropic,
        }),
      });
      const data = await res.json();
      setTestResult({ success: data.success, message: data.success ? data.message : (data.error || '连接失败') });
    } catch {
      setTestResult({ success: false, message: '网络请求异常，请检查 Base URL 是否正确' });
    } finally {
      setTesting(false);
    }
  }, [modelConfig]);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        返回工作台
      </Link>

      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight text-text">
          大模型<span className="text-accent">配置</span>
        </h1>
        <p className="mt-1 text-sm text-text-dim">
          配置 AI 服务以驱动相似问生成和正则表达式构建
        </p>
      </div>

      <div className="space-y-8">
        {/* Model selector */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-text">选择模型</h2>
            {saved && (
              <span className="flex items-center gap-1 text-xs text-accent animate-in font-medium">
                <Check className="h-3.5 w-3.5" />
                已保存
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {PRESET_MODELS.map((preset) => {
              const isSelected = modelConfig.id === preset.id ||
                (preset.id === 'custom' && !PRESET_MODELS.slice(0, -1).some((m) => m.id === modelConfig.id));
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`flex flex-col items-start gap-1 rounded-lg border-2 px-4 py-3 text-left transition-all ${
                    isSelected
                      ? 'border-accent bg-accent/5 shadow-sm'
                      : 'border-border bg-surface hover:border-accent/30 hover:bg-surface2'
                  }`}
                >
                  <span className="text-sm font-semibold text-text">{preset.name}</span>
                  <span className="text-xs text-text-muted">{preset.provider}</span>
                </button>
              );
            })}
          </div>

          {/* Custom model ID input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-text-dim" />
              <label className="text-sm font-medium text-text">模型 ID</label>
              <span className="text-xs text-text-muted">
                (可修改为其他版本，如 deepseek-chat → deepseek-v4)
              </span>
            </div>
            <input
              type="text"
              value={modelConfig.id}
              onChange={(e) => updateConfig({ id: e.target.value })}
              placeholder="输入模型 ID，如 gpt-4o、deepseek-chat..."
              className="w-full rounded-lg border-2 border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10 transition-all font-mono"
            />
          </div>
        </section>

        {/* API Key */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold text-text">API Key</h2>
            <span className="text-xs text-text-muted">
              (仅存储在浏览器本地，不经过服务端落地)
            </span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={modelConfig.apiKey}
                onChange={(e) => updateConfig({ apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full rounded-lg border-2 border-border bg-surface px-4 py-2.5 pr-10 text-sm text-text placeholder:text-text-muted focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10 transition-all font-mono"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Connection test */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleTestConnection}
              disabled={testing || !modelConfig.apiKey}
              className="flex items-center gap-2 rounded-lg border-2 border-border bg-surface px-4 py-2 text-sm font-medium text-text-dim hover:border-accent/40 hover:text-accent disabled:opacity-40 transition-all"
            >
              {testing ? (
                <><Loader2 className="h-4 w-4 animate-spin" />检测中...</>
              ) : (
                <><Wifi className="h-4 w-4" />测试连接</>
              )}
            </button>
            {testResult && (
              <div className={`flex items-center gap-1.5 text-sm font-medium animate-in ${
                testResult.success ? 'text-success' : 'text-danger'
              }`}>
                {testResult.success ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                {testResult.message}
              </div>
            )}
          </div>
        </section>

        {/* Base URL */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-text-dim" />
            <h2 className="text-sm font-semibold text-text">API Base URL</h2>
          </div>
          <input
            type="text"
            value={modelConfig.baseUrl}
            onChange={(e) => updateConfig({ baseUrl: e.target.value })}
            placeholder="https://api.openai.com/v1"
            className="w-full rounded-lg border-2 border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/10 transition-all font-mono"
          />
        </section>

        {/* Parameters */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-text-dim" />
            <h2 className="text-sm font-semibold text-text">生成参数</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-text-dim font-medium">Temperature</label>
                <span className="font-mono text-sm text-accent font-semibold">{modelConfig.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={modelConfig.temperature}
                onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
                className="w-full h-2 rounded-full appearance-none bg-surface2 cursor-pointer accent-accent"
              />
              <div className="flex justify-between text-xs text-text-muted">
                <span>精确 0</span>
                <span>创造 2</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-text-dim font-medium">Max Tokens</label>
                <span className="font-mono text-sm text-accent font-semibold">{modelConfig.maxTokens}</span>
              </div>
              <input
                type="range"
                min="256"
                max="16384"
                step="256"
                value={modelConfig.maxTokens}
                onChange={(e) => updateConfig({ maxTokens: parseInt(e.target.value) })}
                className="w-full h-2 rounded-full appearance-none bg-surface2 cursor-pointer accent-accent"
              />
              <div className="flex justify-between text-xs text-text-muted">
                <span>256</span>
                <span>16384</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
