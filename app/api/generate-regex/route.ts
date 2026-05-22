import { NextRequest, NextResponse } from 'next/server';
import { callLLM, extractJSON } from '@/lib/llm-client';
import { BUILTIN_PROMPTS } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { intent, expressions, detailedContext, modelId, apiKey, baseUrl, temperature, maxTokens, isAnthropic } = body;

    if (!intent || !expressions || !apiKey) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const expressionList = Array.isArray(expressions) ? expressions.join('\n') : expressions;
    const ctx = detailedContext ? `意图详细描述：${detailedContext}\n` : '';
    const prompt = BUILTIN_PROMPTS.generate_regex.content
      .replace('{intent_context}', ctx)
      .replace('{intent}', intent)
      .replace('{expressions}', expressionList)
      .replace('{count}', String(Math.min(expressions.length, 8)));

    const response = await callLLM('你是一个正则表达式专家。只输出JSON。', prompt, {
      modelId: modelId || 'gpt-4o', apiKey,
      baseUrl: baseUrl || 'https://api.openai.com/v1',
      temperature: temperature ?? 0.3, maxTokens: maxTokens || 4096,
      isAnthropic: isAnthropic || false,
    });

    const parsed = JSON.parse(extractJSON(response));
    return NextResponse.json({
      merged: (parsed.list || []).join(','), list: parsed.list || [], coverage: parsed.coverage || 0,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
  }
}
