import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepository } from '@/lib/db/repository';

const alertActionSchema = z.object({
  alertId: z.string().min(1),
  action: z.enum(['dismiss', 'snooze']),
  hours: z.number().optional().default(24),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = alertActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { alertId, action, hours } = parsed.data;
    const repo = getRepository();

    if (action === 'dismiss') {
      await repo.dismissAlert(alertId);
    } else if (action === 'snooze') {
      await repo.snoozeAlert(alertId, hours);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to update alert state:', error);
    return NextResponse.json(
      { error: 'Failed to update alert state' },
      { status: 500 }
    );
  }
}
