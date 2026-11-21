import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db/repository';

export async function GET() {
  try {
    const repo = getRepository();
    const alerts = await repo.getAlerts();
    return NextResponse.json({
      success: true,
      alerts,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
