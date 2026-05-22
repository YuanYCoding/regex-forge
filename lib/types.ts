// ===== Model Config =====
export interface ModelConfig {
  id: string; name: string; provider: string; defaultBaseUrl: string;
  apiKey: string; baseUrl: string; temperature: number; maxTokens: number; isAnthropic: boolean;
}

export interface PresetModel {
  id: string; name: string; provider: string; defaultBaseUrl: string; isAnthropic?: boolean;
}

export const PRESET_MODELS: PresetModel[] = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", defaultBaseUrl: "https://api.openai.com/v1" },
  { id: "gpt-4o-mini", name: "GPT-4o-mini", provider: "OpenAI", defaultBaseUrl: "https://api.openai.com/v1" },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "OpenAI", defaultBaseUrl: "https://api.openai.com/v1" },
  { id: "claude-opus-4-20250514", name: "Claude Opus 4", provider: "Anthropic", defaultBaseUrl: "https://api.anthropic.com/v1", isAnthropic: true },
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: "Anthropic", defaultBaseUrl: "https://api.anthropic.com/v1", isAnthropic: true },
  { id: "deepseek-chat", name: "DeepSeek V3", provider: "DeepSeek", defaultBaseUrl: "https://api.deepseek.com" },
  { id: "deepseek-reasoner", name: "DeepSeek R1", provider: "DeepSeek", defaultBaseUrl: "https://api.deepseek.com" },
  { id: "qwen-max", name: "Qwen-Max", provider: "阿里云", defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1" },
  { id: "qwen-plus", name: "Qwen-Plus", provider: "阿里云", defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1" },
  { id: "glm-4", name: "GLM-4", provider: "智谱", defaultBaseUrl: "https://open.bigmodel.cn/api/paas/v4" },
  { id: "glm-4-plus", name: "GLM-4-Plus", provider: "智谱", defaultBaseUrl: "https://open.bigmodel.cn/api/paas/v4" },
  { id: "moonshot-v1-8k", name: "Moonshot V1", provider: "月之暗面", defaultBaseUrl: "https://api.moonshot.cn/v1" },
  { id: "custom", name: "自定义模型", provider: "Custom", defaultBaseUrl: "" },
];

// ===== Intent modes =====
export type IntentMode = 'concise' | 'detailed';

// ===== Expressions =====
export interface SimilarExpression {
  id: string; text: string;
}

// ===== Regex & Keywords =====
export type RegexFormat = "merged" | "list";
export type Section3Tab = 'regex' | 'keywords';

export interface RegexResult {
  merged: string; list: string[]; coverage: number;
}

export interface KeywordResult {
  keywords: string[]; matchRule: 'ALL' | 'ANY';
}

// ===== Testing =====
export interface TestResult {
  phrase: string; passed: boolean; matchedPattern?: string; failureReason?: string;
}

export interface TestStats {
  total: number; passed: number; failed: number; passRate: number;
}

// ===== Prompts config =====
export interface PromptDef {
  key: string; title: string; description: string; content: string; category: string;
}

export const DEFAULT_PROMPTS: PromptDef[] = [
  { key: 'generate_similar', title: '生成相似问', description: '根据用户意图生成语义相似的表达', category: '意图扩展', content: '' },
  { key: 'generate_regex', title: 'AI 生成正则', description: '基于意图和相似问生成话术正则表达式', category: '正则生成', content: '' },
  { key: 'generate_keywords', title: '提取关键词', description: '从意图和相似问中提取核心关键词', category: '关键词提取', content: '' },
  { key: 'generate_negative', title: '生成反例测试问', description: '生成与意图相关但语义相反的测试问', category: '意图扩展', content: '' },
  { key: 'adapt_regex', title: '适配修正正则', description: '根据失败话术修正和扩展正则表达式', category: '正则优化', content: '' },
];
