import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db/repository';

export async function POST() {
  try {
    const repo = getRepository();
    const isDemo = repo.isDemoMode();
    const allowReset = isDemo || process.env.NEXT_PUBLIC_DEMO_RESET === 'true';

    if (!allowReset) {
      return NextResponse.json(
        {
          success: false,
          error: 'Demo reset is only available in demo mode or when NEXT_PUBLIC_DEMO_RESET=true',
        },
        { status: 403 }
      );
    }

    await repo.resetDemoData();

    return NextResponse.json({
      success: true,
      message: 'Demo dataset restored to initial state successfully.',
    });
  } catch (error) {
    console.error('Error resetting demo data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset demo data',
      },
      { status: 500 }
    );
  }
}
