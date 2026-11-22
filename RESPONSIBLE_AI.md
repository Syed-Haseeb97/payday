# Responsible AI Architecture & Principles

Payday applies generative AI strictly as a specialized conversational assistant and natural-language intake tool for creative entrepreneurs. To protect independent freelancers from financial miscalculations, customer relationship fallout, and privacy leaks, the application enforces rigid architectural boundaries between probabilistic language models and deterministic financial computations.

---

## 1. What the AI Does

1. **WhatsApp Follow-Up Drafting** (`/api/reminders/draft`):
   - Drafts polite, concise, culturally calibrated payment reminder messages (under 70 words) across three tones (`friendly`, `firm`, `final`) and two languages (`en`, `hinglish`).
   - Automatically appends a prefilled WhatsApp `wa.me` deep link and direct client Pay Page URL (`/pay/[token]`).

2. **Quick Add Text Parsing** (`/api/quickadd/parse`):
   - Extracts structured parameters (`clientName`, `eventName`, `eventDate`, `totalAmount`, `advanceAmount`, `advancePaid`, `paymentMethod`) from informal WhatsApp chat snippets, voice transcripts, or free-text inputs.

3. **Ask Payday Natural-Language Simulation** (`/api/whatif/ask`):
   - Translates owner questions (e.g. *"What if Mehta pays 20 days late?"* or *"What if Sharma cancels?"*) into structured what-if scenario parameter sets (`delay_invoice`, `cancel_booking`, `advance_delay`, `recurring_expense`).

4. **Nothing Else**:
   - The AI explains nothing else. It does not provide financial advice, loan recommendations, credit underwriting, or business health opinions.

---

## 2. What the AI Never Does

1. **Never Performs Financial Maths or Forecast Projections**:
   - Cash curves, cumulative balances, runway days, aging buckets, and what-if deltas are computed **100% deterministically** by pure TypeScript functions in `lib/forecast`, `lib/whatif`, `lib/aging`, and `lib/money`.
   - The LLM is never invoked to sum balances, project cash, calculate fees, or determine deficits.

2. **Never Determines Prioritization or Ranking**:
   - The Bad Day Triage algorithm ranks actions using a mathematical score function (`W_IMPACT * normalizedCashImpact + W_URGENCY * urgency + W_UNRELIABILITY * unreliability`) implemented entirely in deterministic code (`lib/ranking`). The AI never decides which client is chased first.

3. **Never Computes Recovery Plans**:
   - The **Recovery Plan engine** (`lib/recovery`) is **100% deterministic code** with zero LLM involvement. When projected cash falls below the 20% safe buffer, the engine runs greedy simulations across real unpaid invoices and upcoming deferrable expenses to calculate the exact rupee amount and date needed to lift the runway back to safety.

4. **Never Writes Data or Deducts Balances Autonomously**:
   - **Quick Add**: Every parsed booking is presented in an interactive preview card. The user must explicitly inspect milestone amounts, dates, and client details before clicking **Confirm Booking**.
   - **Payment Claims**: When a client claims payment on `/pay/[token]`, the balance is never deducted automatically. A high-priority alert is raised for the owner, who must manually verify the transaction UTR in their banking app and click **Confirm Payment**.

---

## 3. Privacy & Public Pay Page Boundaries

1. **Strict Client PII Protection in AI Prompts**:
   - Personal notes, phone numbers, email addresses, and client family surnames are stripped before constructing reminder or Ask Payday prompts.
   - For reminders, only the client's first name, project title, milestone label, formatted amount, and due date reach the LLM.
   - For Ask Payday, the LLM receives only the user's question, today's date, and a sanitized list of client/booking names.

2. **Zero Information Leakage on Public Pay Pages (`/pay/[token]`)**:
   - Public pay pages are secured by high-entropy cryptographic tokens.
   - The client page renders **strictly public metadata**: studio name, UPI ID, invoice reference, issue/due dates, and amount.
   - **Internal studio fields are never exposed**: client payment reliability ratings, average delay days, internal studio notes, client email/phone, other invoices, and bank balance projections are completely excluded from the payload.

---

## 4. Guardrails, Cost Controls & Safety Mechanisms

- **No Default Models or Endpoints Out of the Box**:
   - `isLLMConfigured()` returns true only when `LLM_BASE_URL`, `LLM_API_KEY`, and `LLM_MODEL` are all non-empty and non-placeholder.
   - If any configuration variable is missing, no outbound network call is ever made, and all AI features immediately route through deterministic fallbacks without delay or error.
   - Judge verification: The current status of AI configuration can be checked via `GET /api/status` or tested live via the "Test AI connection" button in Settings (`/settings`), which calls `POST /api/ai/test` and returns `{ ok, latencyMs, modelUsed, errorKind }`.

- **Global Daily Rate Limit & Cost Control (`AI_DAILY_CALL_LIMIT`)**:
   - The system enforces a daily AI call budget cap (configured via `AI_DAILY_CALL_LIMIT`, default 400 calls/day).
   - When running on Supabase, the call counter is incremented atomically in the `usage_counters` table; when running in demo mode, an in-memory sliding window counter is maintained.
   - If the daily quota is exhausted, endpoints reject requests with HTTP 429 and status `ai_cap_reached`, cleanly routing users to deterministic fallbacks to avoid runaway API bills.
   - Per-IP rate limiting (15 requests/minute for reminders, 20 requests/minute for quick-add and ask-payday) is also enforced.

- **Server-Side Prompt Construction & Injection Resistance**:
   - All prompts are constructed server-side in `lib/ai/index.ts` and `lib/whatif/ask-ai.ts`. Client inputs are sanitized to strip control characters and capped in length to prevent prompt injection. Output schemas are strictly validated with Zod.

- **Aggression & Legal Threat Filter (Banned Words)**:
   - Wedding photography is relationship-driven. To preserve client goodwill, the reminder output validator strictly rejects any draft containing aggressive, defamatory, or litigious language, including:
     `lawyer`, `legal action`, `police`, `court`, `penalty`, `defaulter`, `fraud`, `cheat`, `blacklist`.

- **Output Amount Integrity Validation**:
   - The reminder output validator verifies that the generated text contains the exact rupee balance due (`amountFormatted`). If the model hallucinates a different figure or omits the amount, the output is rejected.

- **Instant Deterministic Fallbacks**:
   - If the LLM is unconfigured (`LLM_API_KEY` missing), times out (10s limit), encounters HTTP 5xx errors, or returns malformed text, Payday seamlessly falls back to pre-authored deterministic templates (`lib/ai/fallbacks.ts`), regex rule parsers (`lib/quickadd/rules.ts`), and rule-based scenario extractors (`lib/whatif/ask-rules.ts`). The application UI never hangs or errors.

- **Zero Secrets in Client Bundles**:
   - All LLM API keys and database credentials reside exclusively on the server. Bundles in `.next/static` are audited in automated unit tests (`lib/security-bundle.test.ts`) to verify that no secret keys or variable names are exposed to the browser.
