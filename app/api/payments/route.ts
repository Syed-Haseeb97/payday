import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db/repository';
import { recordPaymentSchema } from '@/lib/db/schemas';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId') || undefined;

    const repo = getRepository();
    const payments = await repo.getPayments({ invoiceId });
    return NextResponse.json({ success: true, payments });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = recordPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const result = await repo.recordPayment(parsed.data);
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
