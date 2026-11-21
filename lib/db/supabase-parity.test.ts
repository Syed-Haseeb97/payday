import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Parses all SQL migration files in supabase/migrations/
 * Extracts a map of TableName -> Set of ColumnNames
 */
function parseMigrationSchema(migrationsDir: string): Map<string, Set<string>> {
  const schema = new Map<string, Set<string>>();
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    // Match CREATE TABLE [IF NOT EXISTS] <table_name> ( ... );
    const tableRegex = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);/gi;
    let match: RegExpExecArray | null;

    while ((match = tableRegex.exec(content)) !== null) {
      const tableName = match[1].toLowerCase();
      const body = match[2];

      if (!schema.has(tableName)) {
        schema.set(tableName, new Set<string>());
      }
      const tableCols = schema.get(tableName)!;

      // Split lines inside table definition
      const lines = body.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (
          !trimmed ||
          trimmed.startsWith('--') ||
          trimmed.startsWith('CONSTRAINT') ||
          trimmed.startsWith('PRIMARY KEY') ||
          trimmed.startsWith('FOREIGN KEY') ||
          trimmed.startsWith('CHECK') ||
          trimmed.startsWith('UNIQUE')
        ) {
          continue;
        }

        // First word is the column name
        const colMatch = trimmed.match(/^([a-zA-Z0-9_]+)/);
        if (colMatch) {
          const colName = colMatch[1].toLowerCase();
          tableCols.add(colName);
        }
      }
    }
  }

  return schema;
}

describe('Supabase Parity & Schema Consistency Verification', () => {
  const migrationsDir = path.resolve(__dirname, '../../supabase/migrations');
  const schema = parseMigrationSchema(migrationsDir);

  it('successfully parsed migration tables from SQL files', () => {
    expect(schema.size).toBeGreaterThanOrEqual(8);
    expect(schema.has('users')).toBe(true);
    expect(schema.has('clients')).toBe(true);
    expect(schema.has('bookings')).toBe(true);
    expect(schema.has('invoices')).toBe(true);
    expect(schema.has('payments')).toBe(true);
    expect(schema.has('recurring_expenses')).toBe(true);
    expect(schema.has('reminders')).toBe(true);
    expect(schema.has('alerts')).toBe(true);
    expect(schema.has('settings')).toBe(true);
    expect(schema.has('usage_counters')).toBe(true);
  });

  it('verifies all table and column references in SupabaseRepository match migration schema', () => {
    const repoFile = path.resolve(__dirname, 'repository.ts');
    const repoContent = fs.readFileSync(repoFile, 'utf8');

    // Extract SupabaseRepository implementation
    const supabaseRepoIndex = repoContent.indexOf('class SupabaseRepository');
    expect(supabaseRepoIndex).toBeGreaterThan(0);
    const supabaseCode = repoContent.slice(supabaseRepoIndex);

    const mismatches: string[] = [];

    // 1. Verify .from('<table>') calls
    const fromMatches = Array.from(supabaseCode.matchAll(/\.from\(['"]([a-zA-Z0-9_]+)['"]\)/g));
    for (const m of fromMatches) {
      const table = m[1].toLowerCase();
      if (!schema.has(table)) {
        mismatches.push(`SupabaseRepository queries non-existent table: "${table}"`);
      }
    }

    // 2. Verify common column references: .eq('<col>', ...), .order('<col>'), etc.
    const colFilterMatches = Array.from(
      supabaseCode.matchAll(/\.(?:eq|order)\(['"]([a-zA-Z0-9_]+)['"]/g)
    );
    const knownColumns = new Set<string>();
    for (const [, cols] of schema) {
      for (const col of cols) {
        knownColumns.add(col);
      }
    }

    for (const m of colFilterMatches) {
      const col = m[1].toLowerCase();
      if (!knownColumns.has(col)) {
        mismatches.push(`SupabaseRepository filters/orders by unknown column: "${col}"`);
      }
    }

    expect(mismatches).toEqual([]);
  });

  it('verifies TypeScript database entity types in lib/db/types.ts match SQL schema columns', () => {
    // Map TypeScript entity to DB table
    const entityTableMap: Record<string, string> = {
      Client: 'clients',
      Booking: 'bookings',
      Invoice: 'invoices',
      Payment: 'payments',
      RecurringExpense: 'recurring_expenses',
      Reminder: 'reminders',
      Alert: 'alerts',
      Settings: 'settings',
      User: 'users',
    };

    const typesFile = path.resolve(__dirname, 'types.ts');
    const typesContent = fs.readFileSync(typesFile, 'utf8');

    const mismatches: string[] = [];

    // Ignored joined relation fields (not actual table columns)
    const ignoredRelations = new Set([
      'client',
      'booking',
      'invoices',
      'payments',
      'days_overdue',
      'invoice',
    ]);

    for (const [interfaceName, tableName] of Object.entries(entityTableMap)) {
      const tableCols = schema.get(tableName);
      if (!tableCols) {
        mismatches.push(`Migration schema missing table: "${tableName}" for interface ${interfaceName}`);
        continue;
      }

      // Match interface declaration: export interface <Name> { ... }
      const interfaceRegex = new RegExp(`export\\s+interface\\s+${interfaceName}\\s*\\{([\\s\\S]*?)\\}`, 'm');
      const match = interfaceRegex.exec(typesContent);
      if (!match) continue;

      const body = match[1];
      const lines = body.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

        // Match property declaration: property_name?: type;
        const propMatch = trimmed.match(/^([a-zA-Z0-9_]+)\??\s*:/);
        if (propMatch) {
          const propName = propMatch[1];
          if (ignoredRelations.has(propName)) continue;

          if (!tableCols.has(propName.toLowerCase())) {
            mismatches.push(
              `Interface ${interfaceName} has property "${propName}" not present in SQL table "${tableName}"`
            );
          }
        }
      }
    }

    if (mismatches.length > 0) {
      console.error('Schema mismatches found:\n' + mismatches.join('\n'));
    }

    expect(mismatches).toEqual([]);
  });
});
