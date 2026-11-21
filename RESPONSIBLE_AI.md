# Responsible AI Architecture & Principles

Payday applies generative AI strictly as a specialized conversational assistant and natural-language intake tool for creative entrepreneurs. To protect independent freelancers from financial miscalculations, customer relationship fallout, and privacy leaks, the application enforces rigid architectural boundaries between probabilistic language models and deterministic financial computations.

---

## 1. What the AI Does

1. **WhatsApp Follow-Up Drafting** (`/api/reminders/draft`):
   - Drafts polite, concise, culturally calibrated payment reminder messages (under 70 words) across three tones (`friendly`, `firm`, `final`) and two languages (`en`, `hinglish`).
   - Automatically generates a prefilled WhatsApp `wa.me` deep link for direct one-tap opening in the client's WhatsApp chat.

2. **Quick Add Text Parsing** (`/api/quickadd/parse`):
   - Extracts structured parameters (`clientName`, `eventName`, `eventDate`, `totalAmount`, `advanceAmount`, `advancePaid`, `paymentMethod`) from informal WhatsApp chat snippets, voice transcripts, or free-text inputs.

3. **Nothing Else**:
   - The AI explains nothing else. It does not provide financial advice, loan recommendations, credit underwriting, or business health opinions.

---

## 2. What the AI Never Does

1. **Never Performs Financial Maths or Forecast Projections**:
   - Cash curves, cumulative balances, runway days, aging buckets, and what-if deltas are computed **100% deterministically** by pure TypeScript functions in `lib/forecast`, `lib/whatif`, `lib/aging`, and `lib/money`.
   - The LLM is never invoked to sum balances, project cash, calculate fees, or determine deficits.

2. **Never Determines Prioritization or Ranking**:
   - The Bad Day Triage algorithm ranks actions using a mathematical score function (`cashImpact * 0.4 + daysOverdueWeight * 0.35 + clientUnreliability * 0.25`) implemented entirely in deterministic code (`lib/ranking`). The AI never decides which client is chased first.

3. **Never Saves Data Without User Review & Confirmation**:
   - Every booking parsed from free text is presented in an interactive preview card (Step 2 of the Quick Add modal).
   - The user must explicitly inspect milestone amounts, dates, and client details before clicking **Confirm Booking**. The AI cannot write to the database autonomously.

---

## 3. Guardrails & Safety Mechanisms

- **Strict PII Protection**:
  - Personal notes, phone numbers, email addresses, and client family surnames are stripped before constructing reminder prompts. Only the client's first name, project title, milestone label, formatted amount, and due date reach the LLM.
  - A dedicated automated test (`lib/ai/ai.test.ts`) verifies that client notes, phone numbers, and emails never appear in prompt strings.

- **Server-Side Prompt Construction**:
  - All prompts are constructed server-side in `lib/ai/index.ts`. Client inputs are sanitized to strip control characters and capped in length to prevent prompt injection.

- **Aggression & Legal Threat Filter (Banned Words)**:
  - Wedding photography is relationship-driven. To preserve client goodwill, the model output validator strictly rejects any draft containing aggressive, defamatory, or litigious language, including:
    `lawyer`, `legal action`, `police`, `court`, `penalty`, `defaulter`, `fraud`, `cheat`, `blacklist`.

- **Output Amount Integrity Validation**:
  - The model output validator verifies that the generated text contains the exact rupee balance due (`amountFormatted`). If the model hallucinates a different figure or omits the amount, the output is rejected.

- **Instant Deterministic Fallbacks**:
  - If the LLM is unconfigured (`LLM_API_KEY` missing), times out (10s limit), encounters HTTP 5xx errors, or returns malformed text, Payday seamlessly falls back to pre-authored deterministic templates (`lib/ai/fallbacks.ts`) and regex rule parsers (`lib/quickadd/rules.ts`). The application UI never hangs or errors.

- **Zero Secrets in Client Bundles**:
  - All LLM API keys and database credentials reside exclusively on the server. Bundles in `.next/static` are audited to verify that no secret keys or variable names are exposed to the browser.

---

## 4. Known Limitations

1. **Natural Language Ambiguity**:
   - Free-form text messages can contain ambiguous date references (e.g. "next Friday") or multi-currency nuances. When the AI parser confidence drops below 90% or discrepancies arise against regex rule heuristics, an explicit warning badge is displayed on the preview card for human review.
2. **Forecast Estimates vs. Real Bank Balances**:
   - Forecasts represent projected cash based on scheduled milestones and historical delay patterns entered by the user. Actual bank balances depend on external bank processing times and payment settlement. A permanent disclaimer is displayed on all projection screens.
