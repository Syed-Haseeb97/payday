import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Client bundle security audit', () => {
  it('ensures no backend secrets or secret environment variable names leak into .next/static', () => {
    const staticDir = path.resolve(process.cwd(), '.next', 'static');
    if (!fs.existsSync(staticDir)) {
      // If not built yet, skip gracefully or flag
      console.warn('.next/static does not exist. Run next build first.');
      return;
    }

    const forbiddenStrings = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_SERVICE_KEY',
      'LLM_API_KEY',
      'GEMINI_API_KEY',
      'OPENAI_API_KEY',
    ];

    function scanDir(dir: string): string[] {
      let files: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files = files.concat(scanDir(fullPath));
        } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.json') || entry.name.endsWith('.css'))) {
          files.push(fullPath);
        }
      }
      return files;
    }

    const bundleFiles = scanDir(staticDir);
    expect(bundleFiles.length).toBeGreaterThan(0);

    for (const filePath of bundleFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      for (const secret of forbiddenStrings) {
        expect(
          content.includes(secret),
          `Security violation: Secret token or variable name "${secret}" found in client bundle file: ${filePath}`
        ).toBe(false);
      }
    }
  });
});
