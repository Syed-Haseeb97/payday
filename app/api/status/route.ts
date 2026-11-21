import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db/repository';

export async function GET() {
  const repo = getRepository();
  return NextResponse.json({
    success: true,
    isDemo: repo.isDemoMode(),
  });
}
