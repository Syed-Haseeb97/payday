import { z } from 'zod';

// Configure Zod 4 globally to operate in jitless mode.
// This prevents any runtime probing or execution of `new Function` / `eval`,
// ensuring full compliance with strict Content Security Policies.
z.config({ jitless: true });

export { z };
export default z;
