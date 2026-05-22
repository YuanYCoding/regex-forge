import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm-client';
import { BUILTIN_PROMPTS } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { intent, count, detailedContext, modelId, apiKey, baseUrl, temperature, maxTokens, isAnthropic } = body;

    if (!intent || !apiKey) {
      return NextResponse.json({ error: '缺少必要参数：intent 或 apiKey' }, { status: 400 });
    }

    const ctx = detailedContext ? `意图详细描述：${detailedContext}\n` : '';
    const prompt = BUILTIN_PROMPTS.generate_similar.content
      .replace('{intent_context}', ctx)
      .replace('{intent}', intent)
      .replace(/{count}/g, String(count || 10));

    const response = await callLLM(
      '你是一个专业的话术扩展专家。只输出话术列表，每行一条，不要编号，不要引号，不要解释。',
      prompt,
      {
        modelId: modelId || 'gpt-4o', apiKey,
        baseUrl: baseUrl || 'https://api.openai.com/v1',
        temperature: temperature ?? 0.9, maxTokens: Math.max(4096, (count || 10) * 80),
        isAnthropic: isAnthropic || false,
      }
    );

    const expressions = response.split('\n')
      .map((line) => line.replace(/^\d+[\.\、\)）]\s*/, '').replace(/^["'「『]|["'」』]$/g, '').trim())
      .filter((line) => line.length > 0 && line.length <= 100);

    return NextResponse.json({ expressions });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
  }
}
