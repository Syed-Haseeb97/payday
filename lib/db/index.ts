// Database access layer for Payday
// Designed to isolate Supabase queries and allow moving business logic to its own service later.

import { DEMO_USER_ID, DEMO_USER } from './types';

export * from './types';

export function getDemoUserId(): string {
  return DEMO_USER_ID;
}

export function getDemoUser() {
  return DEMO_USER;
}
