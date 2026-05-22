import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm-client';
import { BUILTIN_PROMPTS } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { intent, count, detailedContext, modelId, apiKey, baseUrl, temperature, maxTokens, isAnthropic } = body;

    if (!intent || !apiKey) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const ctx = detailedContext ? `意图背景：${detailedContext}\n` : '';
    const prompt = BUILTIN_PROMPTS.generate_negative.content
      .replace('{intent_context}', ctx)
      .replace(/{intent}/g, intent)
      .replace(/{count}/g, String(count || 10));

    const response = await callLLM('你是一个话术测试专家。只输出反例话术列表。', prompt, {
      modelId: modelId || 'gpt-4o', apiKey,
      baseUrl: baseUrl || 'https://api.openai.com/v1',
      temperature: temperature ?? 0.8, maxTokens: maxTokens || 4096,
      isAnthropic: isAnthropic || false,
    });

    const expressions = response.split('\n')
      .map((l) => l.replace(/^\d+[\.\、\)）]\s*/, '').replace(/^["'「『]|["'」』]$/g, '').trim())
      .filter((l) => l.length > 0 && l.length <= 100);

    return NextResponse.json({ expressions });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
  }
}
