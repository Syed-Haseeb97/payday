# Third-Party Licenses & Dependencies

This document provides a complete inventory of all direct dependencies, fonts, and third-party services utilized by **Payday**, along with their respective versions and software licenses.

---

## 1. Direct Production Dependencies (`dependencies`)

| Package Name | Version | License | License Category | Notes / Flag |
| :--- | :--- | :--- | :--- | :--- |
| `@supabase/supabase-js` | `^2.119.2` | MIT | Permissive | Supabase Postgres client |
| `clsx` | `^2.1.1` | MIT | Permissive | Utility for constructing className strings |
| `date-fns` | `^4.4.0` | MIT | Permissive | Modern JavaScript date utility library |
| `framer-motion` | `^14.14.0` | MIT | Permissive | Motion library for React |
| `lucide-react` | `^1.77.0` | ISC | Permissive | Icon library |
| `next` | `16.4.6` | MIT | Permissive | Next.js React Framework |
| `qrcode.react` | `^4.2.0` | ISC | Permissive | React component for generating QR codes |
| `react` | `19.3.0` | MIT | Permissive | UI foundation |
| `react-dom` | `19.3.0` | MIT | Permissive | React DOM renderer |
| `recharts` | `^3.11.0` | MIT | Permissive | Redefined chart library for React |
| `tailwind-merge` | `^3.7.1` | MIT | Permissive | Merge Tailwind CSS classes safely |
| `zod` | `^4.6.7` | MIT | Permissive | TypeScript-first schema validation |

*All production dependencies use permissive MIT or ISC open-source licenses.*

---

## 2. Direct Development Dependencies (`devDependencies`)

| Package Name | Version | License | License Category | Notes / Flag |
| :--- | :--- | :--- | :--- | :--- |
| `@tailwindcss/turbopack` | `4.3.3` | MIT | Permissive | Turbopack integration for Tailwind |
| `@types/node` | `^22.20.5` | MIT | Permissive | TypeScript type definitions for Node.js |
| `@types/react` | `^19` | MIT | Permissive | TypeScript type definitions for React |
| `@types/react-dom` | `^19` | MIT | Permissive | TypeScript type definitions for React DOM |
| `eslint` | `^9` | Apache-2.0 | Permissive | JavaScript and TypeScript linter |
| `eslint-config-next` | `16.4.6` | MIT | Permissive | ESLint configuration for Next.js |
| `tailwindcss` | `4.3.3` | MIT | Permissive | Utility-first CSS framework |
| `typescript` | `^5` | Apache-2.0 | Permissive | TypeScript compiler |
| `vitest` | `^5.1.1` | MIT | Permissive | Fast unit test runner |
| `@playwright/test` | `^1.52.0` | Apache-2.0 | Permissive | End-to-end testing framework |
| `@axe-core/playwright` | `^4.10.1` | MPL-2.0 | **Weak Copyleft (Flagged for Review)** | Automated accessibility testing wrapper |

> [!WARNING]
> **License Flag for Review**: `@axe-core/playwright` and its underlying engine `axe-core` are licensed under the **Mozilla Public License 2.0 (MPL-2.0)**. MPL-2.0 is a weak copyleft license that permits commercial use, proprietary linking, and distribution, provided that modifications to the MPL-licensed files themselves remain open-source. Because this package is strictly a **development-time testing tool** (`devDependencies`) executed during CI/testing and is never bundled into production client artifacts, it imposes no copyleft obligations on Payday's proprietary codebase.

---

## 3. Typography & Web Fonts

Payday imports web fonts via Google Fonts:

| Font Family | Designer / Foundry | License | Usage |
| :--- | :--- | :--- | :--- |
| **Instrument Serif** | Instrument & Rodrigo Fuenzalida | SIL Open Font License, Version 1.1 (OFL-1.1) | Display headings, currency totals, executive briefing |
| **Geist Sans** | Vercel | SIL Open Font License, Version 1.1 (OFL-1.1) | Primary UI labels, body text, form controls |
| **Geist Mono** | Vercel | SIL Open Font License, Version 1.1 (OFL-1.1) | Metadata tags, badges, metrics, tables, and numeric dates |

*The SIL Open Font License 1.1 allows free usage, bundling, and web embedding without royalties or commercial restrictions.*

---

## 4. Third-Party Runtime Services & APIs

- **LLM Gateway / OpenAI-Compatible API**:
  - The language model is an external third-party API accessed at runtime over HTTPS.
  - Model identifiers (e.g. `llama-3.3-70b-versatile`, `gpt-4o-mini`) and API base endpoints are strictly decoupled and configured via runtime environment variables (`LLM_BASE_URL`, `LLM_PRIMARY_MODEL`, `LLM_FALLBACK_MODEL`).
  - No proprietary model weights, server binaries, or static AI models are stored or distributed in this repository.
  - If the external API is unreachable or environment variables are unset, Payday automatically falls back to deterministic local templates.

- **Supabase Postgres (Optional)**:
  - Persistent storage uses Supabase's managed PostgreSQL database. All client communication uses the official `@supabase/supabase-js` SDK via HTTPS/REST.
