'use client';

import { create } from 'zustand';
import type { SimilarExpression, RegexFormat, RegexResult, TestResult, ModelConfig, IntentMode, Section3Tab } from './types';

const STORAGE_KEY = 'regexforge-model-config';

const defaultModelConfig: ModelConfig = {
  id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI',
  defaultBaseUrl: 'https://api.openai.com/v1', apiKey: '',
  baseUrl: 'https://api.openai.com/v1', temperature: 0.7,
  maxTokens: 4096, isAnthropic: false,
};

function persistConfig(config: ModelConfig) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch { /* ignore */ }
}

interface AppState {
  intent: string; setIntent: (v: string) => void;
  intentMode: IntentMode; setIntentMode: (m: IntentMode) => void;
  detailedContext: string; setDetailedContext: (v: string) => void;
  similarCount: number; setSimilarCount: (v: number) => void;
  negativeCount: number; setNegativeCount: (v: number) => void;

  expressions: SimilarExpression[];
  setExpressions: (e: SimilarExpression[]) => void;
  addExpression: (text: string) => void;
  removeExpression: (id: string) => void;
  updateExpression: (id: string, text: string) => void;
  isGeneratingExpressions: boolean; setIsGeneratingExpressions: (v: boolean) => void;

  negativeExpressions: SimilarExpression[];
  setNegativeExpressions: (e: SimilarExpression[]) => void;
  isGeneratingNegative: boolean; setIsGeneratingNegative: (v: boolean) => void;

  regexResult: RegexResult | null; setRegexResult: (r: RegexResult | null) => void;
  keywordResult: RegexResult | null; setKeywordResult: (r: RegexResult | null) => void;
  regexFormat: RegexFormat; setRegexFormat: (f: RegexFormat) => void;
  isGeneratingRegex: boolean; setIsGeneratingRegex: (v: boolean) => void;
  regexGenMode: 'ai' | 'fast' | 'keywords'; setRegexGenMode: (m: 'ai' | 'fast' | 'keywords') => void;
  section3Tab: Section3Tab; setSection3Tab: (t: Section3Tab) => void;

  testResults: TestResult[]; setTestResults: (r: TestResult[]) => void;
  isAdaptingRegex: boolean; setIsAdaptingRegex: (v: boolean) => void;
  showTestModal: boolean; setShowTestModal: (v: boolean) => void;

  badcases: string[]; setBadcases: (b: string[]) => void;
  addBadcase: (t: string) => void; removeBadcase: (i: number) => void;

  modelConfig: ModelConfig; setModelConfig: (c: Partial<ModelConfig>) => void;
  hydrateModelConfig: () => void; hydrated: boolean;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useStore = create<AppState>((set) => ({
  intent: '', setIntent: (intent) => set({ intent }),
  intentMode: 'concise' as IntentMode, setIntentMode: (intentMode) => set({ intentMode }),
  detailedContext: '', setDetailedContext: (detailedContext) => set({ detailedContext }),
  similarCount: 10, setSimilarCount: (similarCount) => set({ similarCount }),
  negativeCount: 10, setNegativeCount: (negativeCount) => set({ negativeCount }),

  expressions: [], setExpressions: (expressions) => set({ expressions }),
  addExpression: (text) => set((s) => ({ expressions: [...s.expressions, { id: generateId(), text }] })),
  removeExpression: (id) => set((s) => ({ expressions: s.expressions.filter((e) => e.id !== id) })),
  updateExpression: (id, text) => set((s) => ({ expressions: s.expressions.map((e) => (e.id === id ? { ...e, text } : e)) })),
  isGeneratingExpressions: false, setIsGeneratingExpressions: (v) => set({ isGeneratingExpressions: v }),

  negativeExpressions: [], setNegativeExpressions: (negativeExpressions) => set({ negativeExpressions }),
  isGeneratingNegative: false, setIsGeneratingNegative: (v) => set({ isGeneratingNegative: v }),

  regexResult: null, setRegexResult: (regexResult) => set({ regexResult }),
  keywordResult: null, setKeywordResult: (keywordResult) => set({ keywordResult }),
  regexFormat: 'list', setRegexFormat: (regexFormat) => set({ regexFormat }),
  isGeneratingRegex: false, setIsGeneratingRegex: (v) => set({ isGeneratingRegex: v }),
  regexGenMode: 'fast', setRegexGenMode: (regexGenMode) => set({ regexGenMode }),
  section3Tab: 'regex' as Section3Tab, setSection3Tab: (section3Tab) => set({ section3Tab }),

  testResults: [], setTestResults: (testResults) => set({ testResults }),
  isAdaptingRegex: false, setIsAdaptingRegex: (v) => set({ isAdaptingRegex: v }),
  showTestModal: false, setShowTestModal: (showTestModal) => set({ showTestModal }),

  badcases: [], setBadcases: (badcases) => set({ badcases }),
  addBadcase: (text) => set((s) => ({ badcases: [...s.badcases, text] })),
  removeBadcase: (i) => set((s) => ({ badcases: s.badcases.filter((_, idx) => idx !== i) })),

  modelConfig: { ...defaultModelConfig }, hydrated: false,
  setModelConfig: (config) => set((s) => {
    const updated = { ...s.modelConfig, ...config };
    if (s.hydrated) persistConfig(updated);
    return { modelConfig: updated };
  }),
  hydrateModelConfig: () => set((s) => {
    if (s.hydrated) return {};
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { modelConfig: { id: parsed.id || 'gpt-4o', name: parsed.name || '', provider: parsed.provider || '', defaultBaseUrl: parsed.defaultBaseUrl || '', apiKey: parsed.apiKey || '', baseUrl: parsed.baseUrl || '', temperature: parsed.temperature ?? 0.7, maxTokens: parsed.maxTokens || 4096, isAnthropic: parsed.isAnthropic || false }, hydrated: true };
      }
    } catch { /* ignore */ }
    return { hydrated: true };
  }),
}));
