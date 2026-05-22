import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm-client';
import { BUILTIN_PROMPTS } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { intent, detailedContext, modelId, apiKey, baseUrl, temperature, maxTokens, isAnthropic } = body;

    if (!intent) {
      return NextResponse.json({ error: '缺少必要参数：intent' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: '关键词生成需要 API Key' }, { status: 400 });
    }

    const ctx = detailedContext ? `意图详细描述：${detailedContext}\n` : '';
    const prompt = BUILTIN_PROMPTS.generate_keywords.content
      .replace('{intent_context}', ctx)
      .replace('{intent}', intent)
      .replace(/{count}/g, '80');

    const response = await callLLM('你是话术关键词扩展专家。只输出关键词列表。', prompt, {
      modelId: modelId || 'gpt-4o', apiKey,
      baseUrl: baseUrl || 'https://api.openai.com/v1',
      temperature: 0.9, maxTokens: Math.max(4096, maxTokens || 8192),
      isAnthropic: isAnthropic || false,
    });

    const keywords = response.split('\n')
      .map((l) => l.replace(/^\d+[\.\、\)）]\s*/, '').replace(/^["'「『]|["'」』]$/g, '').trim())
      .filter((l) => l.length > 0 && l.length <= 30);

    return NextResponse.json({ keywords, matchRule: 'ANY' as const });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
  }
}
