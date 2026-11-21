# Payday — Product Brief & Living Context

> **Living Context Notice**: This document records the core product specification and operating principles for Payday. It serves as the living context for all subsequent development, feature additions, and architecture decisions.

---

## 1. Product Vision
Small creative businesses fail because money arrives late and bills arrive on time. **Payday** is a one-person back office tailored for solo and tiny-team freelance wedding photographers and videographers in India:
- Manage clients, bookings, and invoices.
- See who owes what and since when.
- Forecast cash flow for the next 90 days.
- Test what-if scenarios live.
- Receive alerts that end in one clear, decisive action.

---

## 2. Target User Persona
- **Persona**: Arjun, a freelance wedding photographer with one assistant.
- **Cash Flow Dynamics**:
  - **Lumpy Income**: Each booking pays in milestones (advance, mid, final).
  - **Seasonality**: Peak wedding season followed by a dead season.
  - **Fixed Operational Costs**: Studio rent, equipment EMIs, assistant salary, software subscriptions keep coming regardless of season.
- **Workflow & Habits**:
  - Chases payments over WhatsApp.
  - Tracks things in a notebook.
  - Wants to enter as little data as possible.
  - Device: Mobile-first (mostly operates from a phone).
- **Regional & Financial Formatting**:
  - Currency: Indian Rupee (INR / ₹).
  - Number System: Indian grouping system (e.g., `₹1,25,000`, `₹80,000`).
  - Payment Method: Predominantly UPI links and QR codes.

---

## 3. Technology Stack & Architecture
- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS, deployed to Vercel.
- **Backend / API**: Next.js App Router API routes (`app/api/*`).
  - **Decoupled Business Logic**: Keep all business logic in a separate server-side `lib/` layer so it can be extracted to a standalone service in the future.
- **Database**: Supabase Postgres with SQL migrations and seed data.
- **Auth Strategy**: Single demo account with no real auth flow for initial release; hardcode one demo user while keeping the architecture ready for real Supabase/NextAuth integration later.

---

## 4. Folder Structure Standards
```text
codebenders_Hackathon/
├── app/
│   ├── (shell)/
│   │   ├── dashboard/
│   │   ├── clients/
│   │   ├── bookings/
│   │   ├── invoices/
│   │   ├── forecast/
│   │   ├── bad-day/
│   │   └── settings/
│   ├── api/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── shell/
│   │   ├── AppHeader.tsx
│   │   ├── AppNav.tsx
│   │   ├── MobileNav.tsx
│   │   └── ThemeToggle.tsx
│   └── ui/
├── lib/
│   ├── ai/
│   │   ├── client.ts
│   │   ├── config.ts
│   │   ├── fallbacks.ts
│   │   └── index.ts
│   ├── db/
│   │   ├── index.ts
│   │   ├── schema.ts
│   │   └── types.ts
│   ├── forecast/
│   ├── whatif/
│   ├── ranking/
│   └── utils/
│       └── currency.ts
├── supabase/
│   ├── migrations/
│   │   └── 20261121000000_initial_schema.sql
│   └── seed.sql
├── docs/
│   └── PRODUCT_BRIEF.md
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

---

## 5. Core Features Roadmap (Sequential Order)
1. **Clients, Bookings, and Invoices**:
   - Booking auto-splits into milestone invoices (default 30/50/20, editable).
   - Invoices feature: amount, due date, status (`draft`, `sent`, `partially_paid`, `paid`, `overdue`), UPI payment link or QR placeholder.
2. **Payment Tracking**:
   - Record partial and full payments against milestone invoices.
3. **"Who Owes Me" Dashboard**:
   - Per client breakdown: amount owed, days overdue, aging buckets (`0-7 days`, `8-30 days`, `30+ days`), total outstanding.
4. **90-Day Cash Forecast**:
   - Daily projected balance: Opening Cash + Expected Invoice Receipts (adjusted by client's historical payment delay) − Recurring Bills.
   - Highlights: Lowest-cash day and any day projected balance dips below zero.
5. **What-If Scenarios on Top of Forecast**:
   - Live interactive toggles/inputs: "client X pays N days late", "lose booking Y", "add expense Z".
   - Live before/after comparison of runway and lowest cash point.
6. **Actionable Alerts**:
   - Alerts that end in a one-tap action (e.g., *"Mehta invoice is 12 days overdue: Send Reminder"*, *"Cash dips below zero on 3 Jan: See What-If"*).
7. **Bad Day Mode (Signature Feature)**:
   - Single focused triage screen ranking today's top actions by cash impact, combining invoice amount, days overdue, and client reliability.
   - Each item includes a 1-line reason and a 1-tap action.
8. **WhatsApp Reminder Drafts**:
   - Pre-drafted messages in three distinct tones (`friendly`, `firm`, `final`) in English or Hinglish.
   - Triggers `wa.me` deep links with prefilled text (no direct WhatsApp API integration required).
9. **Plain-Language Quick Entry**:
   - Paste chat snippet or natural language text (e.g., *"Sharma wedding 14 Dec, ₹80k, ₹25k advance paid"*).
   - AI extracts booking details, milestone invoices, and payments.
   - Displays a confirmation preview before saving to database.

---

## 6. AI Architecture & Reliability Guardrails
- **Module Isolation**: Single server-side module `lib/ai/` for all LLM calls.
- **Provider Protocol**: OpenAI-compatible chat completions interface configured strictly via environment variables:
  - `LLM_BASE_URL`
  - `LLM_API_KEY`
  - `LLM_MODEL`
  - `LLM_FALLBACK_MODEL`
- **Security & Privacy**:
  - Keys are server-side only; never exposed to the client bundle.
  - Keys must never be committed to git, logged, or hardcoded.
  - `.env*` files are strictly ignored via `.gitignore`.
- **Fault-Tolerance & Fallbacks**:
  - Timeout: 10 seconds.
  - Retry: 1 retry before initiating fallback.
  - Fallback sequence: Primary model (`LLM_MODEL`) → Fallback model (`LLM_FALLBACK_MODEL`) → Deterministic template/rule-based engine.
  - The UI must never crash or block user actions due to LLM failure.
- **Deterministic Math Mandate**:
  - Financial forecasting, what-if simulations, and Bad Day ranking math are 100% deterministic TypeScript code, unit-tested, and never delegated to an LLM.
  - AI is restricted to: natural language parsing, reminder generation, and brief explanations.
- **Human-in-the-Loop**:
  - Any AI extraction that creates or modifies data must present a preview for user review and confirmation before database persistence.
  - All parsed responses are validated against runtime schemas (e.g., Zod).

---

## 7. Data, Privacy & Safety Guidelines
- **Synthetic Data**: Use only synthetic names, dummy phone numbers, and placeholder payment identifiers.
- **Regulatory Clarification**: Payday is an operational organization and message-drafting tool, not a certified legal, tax, or accounting advisor. A mandatory disclaimer appears on financial surfaces: *"Estimates based on the data you entered."*

---

## 8. Design System & Aesthetics
- **Theme**: Mobile-first, responsive, supporting clean Light and Dark modes.
- **Light Aesthetic**: Warm archival paper (`#F5F3EE`), stone hairline borders (`#C8C2B5`), charcoal typography (`#16181D`), academic forest green for safe cash inflows (`#1D6B52`), warm amber for warnings (`#86560D`), terracotta red for overdue/dips (`#B53A26`).
- **Dark Aesthetic**: Clean obsidian slate (`#0F1115` / `#16181E`), high-contrast crisp text, subtle borders (`#272B35`), emerald for money-in, crimson for money-out.
- **Clarity**: Large legible numbers formatted in the Indian numbering system (`₹XX,XX,XXX`).
- **Calmness**: **Strictly no blinking, pulsing, or flashing animations**. All indicators, badges, and alerts remain static and serene.
