import { NextRequest, NextResponse } from 'next/server';
import { callLLM, extractJSON } from '@/lib/llm-client';
import { BUILTIN_PROMPTS } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentRegex, failedPhrases, modelId, apiKey, baseUrl, temperature, maxTokens, isAnthropic } = body;

    if (!currentRegex || !failedPhrases || !apiKey) {
      return NextResponse.json(
        { error: '缺少必要参数：currentRegex, failedPhrases 或 apiKey' },
        { status: 400 }
      );
    }

    const prompt = BUILTIN_PROMPTS.adapt_regex.content.replace(
      '{currentRegex}',
      Array.isArray(currentRegex) ? currentRegex.join('\n') : currentRegex
    ).replace(
      '{failedPhrases}',
      Array.isArray(failedPhrases) ? failedPhrases.join('\n') : failedPhrases
    );

    const response = await callLLM(
      '你是一个正则表达式修正专家。只输出严格JSON格式，不要markdown代码块。',
      prompt,
      {
        modelId: modelId || 'gpt-4o',
        apiKey,
        baseUrl: baseUrl || 'https://api.openai.com/v1',
        temperature: temperature ?? 0.2,
        maxTokens: maxTokens || 4096,
        isAnthropic: isAnthropic || false,
      }
    );

    const jsonStr = extractJSON(response);
    const parsed = JSON.parse(jsonStr);

    return NextResponse.json({
      adaptedRegex: parsed.adaptedRegex || [],
      changes: parsed.changes || '正则表达式已修正',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
