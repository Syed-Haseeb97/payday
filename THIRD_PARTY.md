# Third-Party Software & Licenses

This document lists all third-party open-source libraries, versions, licenses, fonts, and external runtime services utilized by Payday.

> Automatically generated via `npm run licenses` (`scripts/generate-licenses.ts`).

## Production Dependencies

| Package | Installed Version | License | Status |
| :--- | :--- | :--- | :--- |
| `@supabase/supabase-js` | `2.119.2` | MIT | Permissive (Approved) |
| `clsx` | `2.1.1` | MIT | Permissive (Approved) |
| `date-fns` | `4.4.0` | MIT | Permissive (Approved) |
| `framer-motion` | `14.14.0` | MIT | Permissive (Approved) |
| `lucide-react` | `1.77.0` | ISC | Permissive (Approved) |
| `next` | `16.4.6` | MIT | Permissive (Approved) |
| `qrcode.react` | `4.2.0` | ISC | Permissive (Approved) |
| `react` | `19.3.0` | MIT | Permissive (Approved) |
| `react-dom` | `19.3.0` | MIT | Permissive (Approved) |
| `recharts` | `3.11.0` | MIT | Permissive (Approved) |
| `tailwind-merge` | `3.7.1` | MIT | Permissive (Approved) |
| `zod` | `4.6.7` | MIT | Permissive (Approved) |

## Development Dependencies

| Package | Installed Version | License | Status |
| :--- | :--- | :--- | :--- |
| `@axe-core/playwright` | `4.14.0` | MPL-2.0 | Review Required (MPL-2.0) |
| `@playwright/test` | `1.65.1` | Apache-2.0 | Permissive (Approved) |
| `@tailwindcss/turbopack` | `4.3.3` | MIT | Permissive (Approved) |
| `@types/node` | `22.20.5` | MIT | Permissive (Approved) |
| `@types/react` | `19.3.0` | MIT | Permissive (Approved) |
| `@types/react-dom` | `19.3.0` | MIT | Permissive (Approved) |
| `eslint` | `9.39.5` | MIT | Permissive (Approved) |
| `eslint-config-next` | `16.4.6` | MIT | Permissive (Approved) |
| `tailwindcss` | `4.3.3` | MIT | Permissive (Approved) |
| `tsx` | `4.23.15` | MIT | Permissive (Approved) |
| `typescript` | `5.9.3` | Apache-2.0 | Permissive (Approved) |
| `vitest` | `5.1.1` | MIT | Permissive (Approved) |

## Typography & Fonts

| Font Family | Designer / Source | License | Serving Strategy |
| :--- | :--- | :--- | :--- |
| **Geist Sans** | Vercel | SIL Open Font License 1.1 | Self-hosted via `next/font/google` |
| **Geist Mono** | Vercel | SIL Open Font License 1.1 | Self-hosted via `next/font/google` |
| **Instrument Serif** | Rodrigo Fuenzalida / Instrument | SIL Open Font License 1.1 | Google Fonts CSS import |

## External Runtime Services & APIs

| Service | Role | Environment Variables | Fallback Mechanism |
| :--- | :--- | :--- | :--- |
| **Supabase Postgres** | Persistent relational storage & transactional rollback | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | In-memory repository with relative synthetic demo seed data |
| **OpenAI / Compatible LLM API** | AI reminder drafting & WhatsApp unstructured parse | `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_FALLBACK_MODEL` | Deterministic rule-based template generation and regex parser |
| **Vercel** | Hosting, Edge CDN, and Serverless deployment | Platform managed | Standard Node.js / Docker container |
