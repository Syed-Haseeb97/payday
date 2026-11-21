import * as fs from 'fs';
import * as path from 'path';

interface PkgInfo {
  name: string;
  version: string;
  license: string;
  isPermissive: boolean;
  type: 'production' | 'development';
}

const PERMISSIVE_LICENSES = new Set([
  'MIT',
  'Apache-2.0',
  'BSD',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  '0BSD',
  'CC0-1.0',
  'Python-2.0',
]);

function getPkgInfo(pkgName: string, isDev: boolean, rootDir: string): PkgInfo {
  try {
    const pkgPath = path.join(rootDir, 'node_modules', pkgName, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const data = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const lic = typeof data.license === 'string' ? data.license : (data.licenses?.[0]?.type || 'Unknown');
      const isPermissive = PERMISSIVE_LICENSES.has(lic);
      return {
        name: pkgName,
        version: data.version || 'unknown',
        license: lic,
        isPermissive,
        type: isDev ? 'development' : 'production',
      };
    }
  } catch (e) {
    // ignore
  }

  return {
    name: pkgName,
    version: 'unknown',
    license: 'Unknown',
    isPermissive: false,
    type: isDev ? 'development' : 'production',
  };
}

export function generateLicensesMarkdown(rootDir = path.resolve(__dirname, '..')): string {
  const rootPkgPath = path.join(rootDir, 'package.json');
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));

  const deps = Object.keys(rootPkg.dependencies || {});
  const devDeps = Object.keys(rootPkg.devDependencies || {});

  const depInfos = deps.map((name) => getPkgInfo(name, false, rootDir));
  const devDepInfos = devDeps.map((name) => getPkgInfo(name, true, rootDir));

  let md = `# Third-Party Software & Licenses\n\n`;
  md += `This document lists all third-party open-source libraries, versions, licenses, fonts, and external runtime services utilized by Payday.\n\n`;
  md += `> Automatically generated via \`npm run licenses\` (\`scripts/generate-licenses.ts\`).\n\n`;

  md += `## Production Dependencies\n\n`;
  md += `| Package | Installed Version | License | Status |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  for (const info of depInfos) {
    const status = info.isPermissive ? 'Permissive (Approved)' : `Review Required (${info.license})`;
    md += `| \`${info.name}\` | \`${info.version}\` | ${info.license} | ${status} |\n`;
  }

  md += `\n## Development Dependencies\n\n`;
  md += `| Package | Installed Version | License | Status |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  for (const info of devDepInfos) {
    const status = info.isPermissive ? 'Permissive (Approved)' : `Review Required (${info.license})`;
    md += `| \`${info.name}\` | \`${info.version}\` | ${info.license} | ${status} |\n`;
  }

  md += `\n## Typography & Fonts\n\n`;
  md += `| Font Family | Designer / Source | License | Serving Strategy |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  md += `| **Geist Sans** | Vercel | SIL Open Font License 1.1 | Self-hosted via \`next/font/google\` |\n`;
  md += `| **Geist Mono** | Vercel | SIL Open Font License 1.1 | Self-hosted via \`next/font/google\` |\n`;
  md += `| **Instrument Serif** | Rodrigo Fuenzalida / Instrument | SIL Open Font License 1.1 | Google Fonts CSS import |\n`;

  md += `\n## External Runtime Services & APIs\n\n`;
  md += `| Service | Role | Environment Variables | Fallback Mechanism |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  md += `| **Supabase Postgres** | Persistent relational storage & transactional rollback | \`SUPABASE_URL\`, \`SUPABASE_SERVICE_ROLE_KEY\` | In-memory repository with relative synthetic demo seed data |\n`;
  md += `| **OpenAI / Compatible LLM API** | AI reminder drafting & WhatsApp unstructured parse | \`LLM_BASE_URL\`, \`LLM_API_KEY\`, \`LLM_MODEL\`, \`LLM_FALLBACK_MODEL\` | Deterministic rule-based template generation and regex parser |\n`;
  md += `| **Vercel** | Hosting, Edge CDN, and Serverless deployment | Platform managed | Standard Node.js / Docker container |\n`;

  return md;
}

if (require.main === module) {
  const rootDir = path.resolve(__dirname, '..');
  const md = generateLicensesMarkdown(rootDir);
  const outPath = path.join(rootDir, 'THIRD_PARTY.md');
  fs.writeFileSync(outPath, md, 'utf8');
  console.log(`Updated ${outPath} successfully.`);
}
