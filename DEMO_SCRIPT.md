# Payday: 2-Minute Demo Script

> **Product**: Payday (Cash Flow Intelligence & Receivables Management for Creative Freelancers)  
> **Speaker Persona**: Product Engineer presenting to hackathon judges  
> **Total Duration**: ~120 seconds  

---

## Screen 0: Introduction & The Persona (0:00 – 0:20)

**URL**: `<your-deployment-url>/dashboard`

### What to Click:
- Start on the **Dashboard** in default Light Theme ("Warm Archival Paper").

### Talking Points:
> "Meet Arjun, an independent wedding photographer operating Arjun Visuals. On paper, his studio has ₹11.24 Lakhs in receivables across the wedding season. But when fixed monthly studio rent and assistant payouts are due, he needs to know whether his bank balance can actually cover them.
>
> Traditional accounting tools only look backward. Payday is a forward-looking cash flow and receivables tool. It answers three questions: Who owes me money? When will my cash dip to its lowest point? And what single action should I take right now?"

### Key Numbers on Screen:
- **Opening Cash**: `₹1,40,000`
- **Total Outstanding**: `₹11,24,000`
- **Total Overdue**: `₹35,000`
- **Today's Briefing**: Identifies overdue items and the 90-day cash outlook lowest point (`₹26,500` on 13 Dec 2026).

---

## Screen 1: Bad Day Triage & WhatsApp Reminder (0:20 – 0:50)

**URL**: Click **Bad Day Triage** in the top navigation (`/bad-day`).

### What to Click:
1. Point to the prioritized receivables list sorted by the deterministic ranking score (combining financial impact, urgency, and client unreliability).
2. Look at the top item: **Rohit Mehta (Mehta Weddings)** (`₹95,000`, due in 10 days, average delay history of 13 days; action type: `heads_up`).
3. Click **Draft WhatsApp** to open the slide-over drawer.
4. In the Slide-Over Drawer:
   - Toggle Tone between **Friendly**, **Firm**, and **Final**.
   - Toggle Language between **English** and **Hinglish**.
5. Observe the prefilled message containing the exact rupee balance (`₹95,000`) and the `wa.me` deep link.
6. Click **Mark as Sent**.

### Talking Points:
> "When receivables need attention, Arjun enters **Bad Day Mode**. Our deterministic ranking engine scores and sorts candidates by financial impact on the 90-day lowest balance, days overdue, and client unreliability.
>
> Rohit Mehta is ranked as the highest-priority action: an upcoming ₹95,000 milestone due in 10 days with a historical 13-day delay. Reaching out with a heads-up prevents delays and protects Arjun's upcoming bills.
>
> Arjun clicks 'Draft WhatsApp'. If an LLM is configured, it drafts a polite, concise reminder message under 70 words without aggressive language, keeping the exact rupee amount accurate. If no LLM is configured, our deterministic template fallback produces the message immediately. One click allows copying the text or opening a pre-populated WhatsApp link."

### Key Numbers on Screen:
- Top Ranked Item: **Rohit Mehta (Mehta Weddings)**
- Milestone: `mid` milestone (`₹95,000`)
- Action Type: `heads_up` (due in 10 days, historical 13-day delay)

---

## Screen 2: 90-Day Cash Runway & What-If Stress Testing (0:50 – 1:25)

**URL**: Click **Forecast (90d)** in the navigation (`/forecast`).

### What to Click:
1. Point to the **Daily Cash Trajectory** chart and the **Lowest Balance** card (`₹26,500` on 13 Dec 2026).
2. Under "What-If Scenarios", click the one-click preset: **"Slowest client pays 15 days late"** (or apply the Mehta delayed scenario).
3. Watch the trajectory recalculate into a projected deficit (`-₹9,500` on 14 Dec 2026, a dip of `₹36,000`).
4. Click **Reset** to restore baseline.

### Talking Points:
> "Next, Arjun opens the 90-day forecast. The forecast engine calculates daily inflows and recurring outflows in Indian Standard Time, factoring in each client's historical payment delay alongside fixed recurring bills like studio rent.
>
> In the baseline projection, his lowest cash balance is ₹26,500. But what happens if his slowest client delays payment? With one tap on the stress-test preset, the forecast recalculates: the balance dips below zero to -₹9,500 when rent is due. Arjun can see the exact deficit date weeks in advance and take action early. Clicking 'Reset' restores the baseline trajectory."

### Key Numbers on Screen:
- Baseline Lowest Balance: `₹26,500` (on 13 Dec 2026)
- What-If Projected Lowest Balance: `-₹9,500` (on 14 Dec 2026)
- Projected Cash Dip: `-₹36,000`

---

## Screen 3: Zero-Friction Quick Add (1:25 – 1:50)

**URL**: Click **Quick Add** (`+ Quick Add`) in the header.

### What to Click:
1. In the Quick Add modal, tap the first example chip:  
   `Sharma wedding 14 Dec, ₹80k, ₹25k advance paid`
2. Click **Read it**.
3. Point to the parsed preview card:
   - Client Name: `Sharma`
   - Total Amount: `₹80,000`
   - Advance Paid: `₹25,000`
   - 3-stage milestone breakdown automatically split (`advance`: ₹24,000, `mid`: ₹40,000, `final`: ₹16,000).
4. Click **Confirm Booking**.
5. The modal closes, and the invoices list updates with the new booking and its milestones.

### Talking Points:
> "Solo photographers often receive booking confirmations on WhatsApp while on location. With Quick Add, Arjun pastes the message text directly: *'Sharma wedding 14 Dec, ₹80k, ₹25k advance paid'*.
>
> The parser extracts the amounts, dates, and advance status, splitting the booking into standard wedding milestone tranches: advance, mid, and final. Nothing is saved until Arjun inspects the preview and confirms. On confirmation, the booking, milestone invoices, and any advance payment are created atomically with rollback safety."

### Key Numbers on Screen:
- Total Amount: `₹80,000`
- Advance Paid: `₹25,000`
- Unpaid Milestone Inflows: `₹55,000` across `mid` and `final` tranches

---

## Screen 4: Pricing & Settings Overview (1:50 – 2:00)

**URL**: Click **Pricing** (`/pricing`) or **Settings** (`/settings`).

### What to Click:
1. On `/pricing`, show the **Your Numbers** interactive assumption slider adjusting the estimated monthly cost of delayed capital.
2. Navigate to `/settings` to show the **System Status** card (displaying whether the app is running in Demo or Supabase mode, whether LLM is configured, and the active model names).

### Talking Points:
> "Finally, our pricing page models the financial impact of delayed receivables based on the user's outstanding book. In Settings, the System Status card gives transparent visibility into data mode—demo in-memory or Supabase live—and confirms whether LLM integration is active.
>
> That is Payday: deterministic forecasting, culturally attuned communication, and clear receivables management for independent creative studios. Thank you!"

---

## Troubleshooting & Verification

1. **Reset Demo Dataset**:
   - Go to **Settings** -> Click **Reset Demo Data**, or trigger `POST <your-deployment-url>/api/demo/reset`.
   - The entire dataset resets cleanly in memory or in Supabase to fresh seed data relative to the current calendar date.

2. **AI Availability & Fallbacks**:
   - Verify AI status at `<your-deployment-url>/api/status` or click **Test AI connection** on `/settings`.
   - If an API key is not configured, the app operates entirely on deterministic rule-based parsing and pre-authored reminder templates.
