import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db/repository';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const clientId = searchParams.get('clientId') || undefined;

    const repo = getRepository();
    const invoices = await repo.getInvoices({ status, clientId });
    return NextResponse.json({ success: true, invoices });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
