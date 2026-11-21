import { NextRequest, NextResponse } from 'next/server';
import { executeQuickAddConfirm, quickAddConfirmSchema } from '@/lib/quickadd/confirm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = quickAddConfirmSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid booking data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await executeQuickAddConfirm(parsed.data);

    return NextResponse.json({
      success: true,
      booking: result.booking,
      invoices: result.invoices,
      client: result.client,
      payment: result.payment,
    });
  } catch (error: unknown) {
    console.error('Failed to confirm booking:', error);
    return NextResponse.json(
      { error: 'Failed to confirm booking' },
      { status: 500 }
    );
  }
}
