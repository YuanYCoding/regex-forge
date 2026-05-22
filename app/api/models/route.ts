import { NextResponse } from 'next/server';
import { PRESET_MODELS } from '@/lib/types';

export async function GET() {
  return NextResponse.json({ models: PRESET_MODELS });
}
