import fs from 'fs';
import path from 'path';
import { generateSeedSQL } from '../lib/db/seed-data';

const sql = generateSeedSQL();
const outPath = path.resolve(process.cwd(), 'supabase/seed.sql');

fs.writeFileSync(outPath, sql, 'utf8');
console.log(`Successfully generated fresh seed SQL relative to today at: ${outPath}`);
