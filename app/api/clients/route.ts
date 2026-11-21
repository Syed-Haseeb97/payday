import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db/repository';
import { createClientSchema } from '@/lib/db/schemas';

export async function GET() {
  try {
    const repo = getRepository();
    const clients = await repo.getClients();
    return NextResponse.json({ success: true, clients });
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
    const parsed = createClientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const client = await repo.createClient(parsed.data);
    return NextResponse.json({ success: true, client }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
