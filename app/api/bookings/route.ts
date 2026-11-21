import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db/repository';
import { createBookingSchema } from '@/lib/db/schemas';

export async function GET() {
  try {
    const repo = getRepository();
    const bookings = await repo.getBookings();
    return NextResponse.json({ success: true, bookings });
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
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const result = await repo.createBooking(parsed.data);
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
