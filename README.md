# Payday (पे-डे)

> **One-Person Back Office for Solo & Tiny-Team Wedding Photographers in India**  
> Manage clients, milestone invoices, 90-day cash flow forecast, what-if simulations, and Bad Day triage.

---

## 📸 Overview
Freelance wedding photographers operate in extreme financial cycles: high wedding season followed by prolonged dead months, lumpy milestone payments (30% advance, 50% shoot day, 20% album delivery), and constant fixed overheads (studio rent, camera EMIs, assistant salaries). 

**Payday** gives creative entrepreneurs a calm, deterministic command centre to know exactly who owes what, forecast cash across 90 days, and take one-tap actions via WhatsApp.

---

## 🛠 Tech Stack
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 (Warm Archival Paper light mode + Obsidian dark mode)
- **Database**: Supabase Postgres with SQL migrations (`supabase/migrations/`)
- **Backend Architecture**: Decoupled server logic in `lib/` (forecast, whatif, ranking, ai, db)
- **AI Engine**: `lib/ai` (OpenAI-compatible chat completions with 10s timeout, retry, and deterministic template fallback)

---

## 📂 Project Architecture

```text
codebenders_Hackathon/
├── app/                        # Next.js App Router
│   ├── dashboard/              # "Who Owes Me" & aging receivables
│   ├── clients/                # Client profiles & payment reliability ratings
│   ├── bookings/               # Shoot bookings with 30/50/20 milestone splits
│   ├── invoices/               # Milestone invoices, UPI links & WhatsApp deep links
│   ├── forecast/               # 90-day cash curve & what-if simulator
│   ├── bad-day/                # Signature Bad Day triage mode
│   ├── settings/               # Opening cash balance, currency (₹), demo account
│   ├── globals.css             # Light & dark theme tokens (no blinking elements)
│   ├── layout.tsx              # Root shell with AppHeader, AppNav, and MobileNav
│   └── page.tsx                # Redirects to /dashboard
├── components/                 # Reusable UI & Layout Components
│   └── shell/
│       ├── AppHeader.tsx       # Studio branding, calm demo status, theme switcher
│       ├── AppNav.tsx          # Desktop navigation
│       ├── MobileNav.tsx       # Mobile bottom navigation bar
│       └── ThemeToggle.tsx     # Client-side light/dark toggle
├── lib/                        # Decoupled server-side business logic
│   ├── ai/                     # LLM client, config, fallbacks, reminder stub
│   │   ├── client.ts           # 10s timeout, 1 retry, model fallback runner
│   │   ├── config.ts           # Safe env var reader (LLM_BASE_URL, LLM_API_KEY, etc.)
│   │   ├── fallbacks.ts        # Deterministic English & Hinglish templates
│   │   └── index.ts            # Public AI functions & wa.me URL generator
│   ├── db/                     # Data models, schema & types
│   │   ├── types.ts            # TypeScript interfaces for all 9 entities
│   │   └── index.ts            # Demo user context & db utilities
│   ├── forecast/               # 90-day daily cash projection engine
│   ├── whatif/                 # Interactive delay, cancellation & expense simulations
│   ├── ranking/                # Bad Day mathematical triage engine
│   └── utils/
│       └── currency.ts         # Indian number system formatting (₹1,25,000)
├── supabase/
│   ├── migrations/             # Complete Postgres SQL schema migration
│   │   └── 20261121000000_initial_schema.sql
│   └── seed.sql                # Synthetic seed data placeholder
├── PRODUCT_BRIEF.md            # Living context & product brief
├── .env.example                # Safe environment variable template
├── .gitignore                  # Git ignore rules (strictly ignoring .env*)
└── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node v22)
- npm, pnpm, or bun

### 2. Environment Setup
Copy the template environment file:
```bash
cp .env.example .env.local
```
*(Optional)* Add your OpenAI-compatible API key in `.env.local`. If left unset, Payday automatically and seamlessly uses its built-in deterministic template engine without failing.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 🛡 AI Fallback & Safety Rules
1. **Isolated Server Module**: All LLM interactions are contained in `lib/ai`. No API keys are ever leaked to the client bundle.
2. **Deterministic Fallbacks**: Every AI feature falls back to deterministic templates (English & Hinglish) if the primary LLM times out (10s) or encounters an error.
3. **Deterministic Financial Maths**: All 90-day cash projections, what-if simulations, and Bad Day triage calculations are executed in pure TypeScript — never calculated by LLMs.
4. **Mandatory Advisory Notice**: As marked on the forecast page: *"Estimates based on the data you entered."*

lol
