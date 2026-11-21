import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db/repository';
import { computeCashForecast, addDays } from '@/lib/forecast';

export async function GET() {
  try {
    const repo = getRepository();
    const inputs = await repo.getForecastInputs();
    const summary = await repo.getBadDaySummary();

    const forecast = computeCashForecast({
      ...inputs,
      horizonDays: 90,
    });
    const horizon7Days = addDays(inputs.today, 7);
    const billsNext7Days = forecast.events.filter(
      (e) => e.type === 'outflow' && e.date >= inputs.today && e.date <= horizon7Days
    );

    return NextResponse.json({
      success: true,
      summary,
      cashToday: inputs.openingCash,
      lowestBalance: forecast.summary.lowestBalance,
      lowestBalanceDate: forecast.summary.lowestBalanceDate,
      health: forecast.summary.health,
      billsNext7Days,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Failed to fetch bad day actions' },
      { status: 500 }
    );
  }
}
