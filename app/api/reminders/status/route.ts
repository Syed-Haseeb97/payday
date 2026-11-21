import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db/repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get('invoiceId');

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'invoiceId parameter is required' },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const lastReminder = await repo.getLastReminderSent(invoiceId);

    if (!lastReminder) {
      return NextResponse.json({
        hasReminder: false,
        sentWithinTwoDays: false,
        lastReminder: null,
      });
    }

    const sentDate = new Date(lastReminder.sent_at || lastReminder.created_at);
    const msDiff = Date.now() - sentDate.getTime();
    const daysAgo = Math.floor(msDiff / (24 * 3600 * 1000));
    const sentWithinTwoDays = daysAgo <= 2;

    return NextResponse.json({
      hasReminder: true,
      sentWithinTwoDays,
      daysAgo,
      lastReminder,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Failed to check reminder status' },
      { status: 500 }
    );
  }
}
