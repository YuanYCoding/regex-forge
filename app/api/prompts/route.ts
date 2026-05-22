import { NextRequest, NextResponse } from 'next/server';
import { BUILTIN_PROMPTS } from '@/lib/prompts';

// GET: return all prompts
export async function GET() {
  const prompts = Object.entries(BUILTIN_PROMPTS).map(([key, val]) => ({
    key, ...val,
  }));
  return NextResponse.json({ prompts });
}

// POST: update a specific prompt (stored in-memory)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, content } = body;
    if (!key || content === undefined) {
      return NextResponse.json({ error: '缺少 key 或 content' }, { status: 400 });
    }
    if (BUILTIN_PROMPTS[key]) {
      BUILTIN_PROMPTS[key].content = content;
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: '未找到对应提示词' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
