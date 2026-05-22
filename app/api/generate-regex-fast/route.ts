import { NextRequest, NextResponse } from 'next/server';
import { fastGenerateRegex } from '@/lib/fast-regex-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { intent, expressions } = body;

    if (!intent || !expressions || !Array.isArray(expressions)) {
      return NextResponse.json({ error: '缺少必要参数：intent, expressions' }, { status: 400 });
    }

    const result = fastGenerateRegex(intent, expressions);

    return NextResponse.json({
      list: result.list,
      coverage: result.coverage,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
