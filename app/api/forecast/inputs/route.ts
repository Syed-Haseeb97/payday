import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db/repository';

export async function GET() {
  try {
    const repo = getRepository();
    const inputs = await repo.getForecastInputs();
    return NextResponse.json(inputs);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching forecast inputs:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch forecast inputs' },
      { status: 500 }
    );
  }
}
