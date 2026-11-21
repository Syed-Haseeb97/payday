import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db/repository';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const today = searchParams.get('today') || undefined;

    const repo = getRepository();
    const data = await repo.getDashboardData(today);
    const isDemo = repo.isDemoMode();

    return NextResponse.json({ success: true, isDemo, ...data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
