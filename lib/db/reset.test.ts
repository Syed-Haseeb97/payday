import { describe, it, expect } from 'vitest';
import { InMemoryRepository } from './repository';

describe('Demo Dataset Reset Action', () => {
  it('resets repository back to initial seed data', async () => {
    const repo = new InMemoryRepository();

    // 1. Add a dummy client
    const newClient = await repo.createClient({
      name: 'Temporary Test Client',
      phone: '+91 99999 00000',
      payment_reliability: 'reliable',
      average_delay_days: 0,
    });
    expect(newClient).toBeDefined();

    const clientsBefore = await repo.getClients();
    const hasTempClient = clientsBefore.some((c) => c.name === 'Temporary Test Client');
    expect(hasTempClient).toBe(true);

    // 2. Perform Reset
    await repo.resetDemoData();

    // 3. Verify clean state
    const clientsAfter = await repo.getClients();
    const stillHasTempClient = clientsAfter.some((c) => c.name === 'Temporary Test Client');
    expect(stillHasTempClient).toBe(false);

    // Initial 8 seed clients restored
    expect(clientsAfter.length).toBe(8);
  });
});
