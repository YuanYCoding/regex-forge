import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, apiKey, baseUrl, isAnthropic } = body;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API Key 未配置' }, { status: 400 });
    }

    // Normalize base URL: ensure it ends with /v1 for OpenAI-compatible APIs
    let normalizedUrl = (baseUrl || '').replace(/\/+$/, '');
    if (!isAnthropic && normalizedUrl && !normalizedUrl.endsWith('/v1')) {
      normalizedUrl = normalizedUrl + '/v1';
    }

    if (isAnthropic) {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic({
        apiKey,
        baseURL: normalizedUrl || 'https://api.anthropic.com/v1',
      });
      const response = await client.messages.create({
        model: modelId || 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'hi' }],
      });
      const hasContent = response.content.some((block) => block.type === 'text');
      return NextResponse.json({
        success: hasContent,
        message: hasContent ? '连接成功！模型响应正常' : '连接异常：模型返回空响应',
      });
    }

    // OpenAI-compatible API
    const client = new OpenAI({
      apiKey,
      baseURL: normalizedUrl || undefined,
      timeout: 15000,
    });

    // Try the configured model first; fall back to listing models if it fails
    let response: OpenAI.Chat.Completions.ChatCompletion;
    try {
      response = await client.chat.completions.create({
        model: modelId || 'gpt-4o',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'hi' }],
      });
    } catch (modelError: unknown) {
      const errMsg = modelError instanceof Error ? modelError.message : '';
      // If model not found, try common model names
      if (errMsg.includes('model') || errMsg.includes('not found') || errMsg.includes('404')) {
        for (const fallbackModel of ['deepseek-chat', 'gpt-4o-mini', 'qwen-turbo', 'glm-4']) {
          try {
            response = await client.chat.completions.create({
              model: fallbackModel,
              max_tokens: 5,
              messages: [{ role: 'user', content: 'hi' }],
            });
            return NextResponse.json({
              success: true,
              message: `连接成功！模型 "${fallbackModel}" 可用（"${modelId}" 未找到，请检查模型 ID）`,
            });
          } catch {
            // continue trying
          }
        }
      }
      throw modelError;
    }

    const choice = response.choices[0];
    // Some reasoning models return empty content but have reasoning_content
    const msg = choice?.message;
    const hasContent = !!msg?.content || !!((msg as unknown as Record<string, unknown>)?.reasoning_content as string);
    const modelActual = response.model || modelId;
    return NextResponse.json({
      success: true,
      message: `连接成功！模型 "${modelActual}" 响应正常`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    // Extract meaningful part of error
    let shortMsg = message;
    if (shortMsg.includes('Connection error')) shortMsg = '网络连接失败，请检查 Base URL 是否正确';
    else if (shortMsg.includes('401')) shortMsg = 'API Key 无效 (401 Unauthorized)';
    else if (shortMsg.includes('403')) shortMsg = 'API Key 无权限 (403 Forbidden)';
    else if (shortMsg.includes('404')) shortMsg = '接口地址不存在，请检查 Base URL';
    else if (shortMsg.includes('timed out') || shortMsg.includes('timeout')) shortMsg = '连接超时，请检查网络';
    else shortMsg = shortMsg.slice(0, 100);
    return NextResponse.json({ success: false, error: shortMsg });
  }
}
