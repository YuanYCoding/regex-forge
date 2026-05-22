/**
 * Server-side LLM client supporting both OpenAI-compatible and Anthropic APIs.
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface LLMParams {
  modelId: string;
  apiKey: string;
  baseUrl: string;
  temperature: number;
  maxTokens: number;
  isAnthropic: boolean;
}

export async function callLLM(
  systemPrompt: string,
  userMessage: string,
  params: LLMParams
): Promise<string> {
  if (params.isAnthropic) {
    return callAnthropic(systemPrompt, userMessage, params);
  }
  return callOpenAICompatible(systemPrompt, userMessage, params);
}

function normalizeBaseUrl(url: string): string {
  let normalized = (url || '').replace(/\/+$/, '');
  if (normalized && !normalized.endsWith('/v1')) {
    normalized = normalized + '/v1';
  }
  return normalized;
}

async function callOpenAICompatible(
  systemPrompt: string,
  userMessage: string,
  params: LLMParams
): Promise<string> {
  const client = new OpenAI({
    apiKey: params.apiKey,
    baseURL: normalizeBaseUrl(params.baseUrl) || undefined,
  });

  const response = await client.chat.completions.create({
    model: params.modelId,
    temperature: params.temperature,
    max_tokens: params.maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  const msg = response.choices[0]?.message;
  const content = msg?.content || (msg as unknown as Record<string, unknown>)?.reasoning_content as string || '';
  if (!content) {
    throw new Error('LLM 返回了空响应');
  }
  return content;
}

async function callAnthropic(
  systemPrompt: string,
  userMessage: string,
  params: LLMParams
): Promise<string> {
  const client = new Anthropic({
    apiKey: params.apiKey,
    baseURL: normalizeBaseUrl(params.baseUrl) || 'https://api.anthropic.com/v1',
  });

  const response = await client.messages.create({
    model: params.modelId,
    max_tokens: params.maxTokens,
    temperature: params.temperature,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude 返回了空响应');
  }
  return textBlock.text;
}

/**
 * Extract JSON from LLM response, handling markdown code blocks.
 */
export function extractJSON(text: string): string {
  // Try to find JSON in markdown code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  // Otherwise return the whole text trimmed
  return text.trim();
}
