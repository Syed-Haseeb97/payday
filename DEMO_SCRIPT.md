# Payday: 2-Minute Demo Script

> **Product**: Payday (Cash Flow OS for Freelance Creative Studios)  
> **Speaker Persona**: Product Engineer presenting to hackathon judges  
> **Total Duration**: ~120 seconds  

---

## Screen 0: Introduction & The Persona (0:00 – 0:20)

**URL**: `http://localhost:3000/dashboard`

### What to Click:
- Start on the **Dashboard** in default Light Theme ("Warm Archival Paper").

### Talking Points:
> "Meet Arjun, an independent wedding photographer in Mumbai. On paper, his studio booked ₹4.5 Lakhs this wedding season. But when rent and assistant payouts are due this week, he has no idea whether his bank account can actually cover them.
>
> Traditional invoicing tools only tell Arjun what happened in the past. Payday gives him a calm, forward-looking cash flow OS. It answers three questions: Who owes me today? When will I run out of cash? And what single action should I take right now?"

### Key Numbers on Screen:
- **Total Outstanding**: `₹3,85,000`
- **Total Overdue**: `₹35,000`
- **Today's Briefing**: `"1 invoice needs chasing. Your lowest cash point is ₹26,500 on 12 Dec."`

---

## Screen 1: Bad Day Triage & WhatsApp Reminder (0:20 – 0:50)

**URL**: Click **Bad Day Triage** in the top navigation or banner (`/bad-day`).

### What to Click:
1. Point to the top prioritized invoice: **Rohit Mehta** (`₹35,000`, 12 days overdue).
2. Click **Draft WhatsApp**.
3. In the Slide-Over Drawer:
   - Toggle Tone from **Firm** to **Friendly** to **Final**.
   - Toggle Language from **English** to **Hinglish**.
4. Show the prefilled message containing the exact rupee balance (`₹35,000`) and the `wa.me` deep link.
5. Click **Mark as Sent**.

### Talking Points:
> "When money is tight, you enter **Bad Day Mode**. Our deterministic ranking engine sorts receivables by financial urgency and client unreliability.
>
> Rohit Mehta is our top overdue client at ₹35,000. Arjun clicks 'Draft WhatsApp'. Our AI drafts a polite, concise reminder message under 70 words, with strict guardrails: zero legal threats, no personal phone or notes leaked, and the exact amount guaranteed. It even offers culturally natural Hinglish. One click copies it or launches a direct WhatsApp wa.me link with UPI payment QR."

### Key Numbers on Screen:
- Top Overdue Item: **Rohit Mehta (Shoot Day Milestone)**
- Balance: `₹35,000`
- Days Overdue: `12 days`

---

## Screen 2: 90-Day Cash Runway & What-If Stress Testing (0:50 – 1:25)

**URL**: Click **Forecast (90d)** in the navigation (`/forecast`).

### What to Click:
1. Point to the **Daily Cash Trajectory** chart and the **Lowest Balance** card (`₹26,500` on 12 Dec).
2. Under "What-If Scenarios", click the one-click preset: **"Slowest client pays 15 days late"**.
3. Watch the trajectory immediately recalculate into a negative balance (`Deficit / Danger`).
4. Click **Reset** to restore baseline.

### Talking Points:
> "Next, Arjun checks his 90-day cash curve. Our forecast engine runs on pure math in Indian Standard Time, factoring in each client's historical payment delay and fixed monthly bills.
>
> Right now, his lowest cash point is positive at ₹26,500. But what happens if his slowest client delays again? He taps our one-click stress-test preset: 'Slowest client pays 15 days late'. Instantly, the trajectory turns red, revealing a projected cash deficit before gear repair day. He doesn't need to guess—he can see the exact deficit date and plan follow-ups weeks before it happens. Tapping 'Reset' instantly restores the baseline."

### Key Numbers on Screen:
- Baseline Lowest Balance: `₹26,500` (Safe)
- What-If Lowest Balance: Negative deficit (Danger / Deficit alert triggered)

---

## Screen 3: Zero-Friction Quick Add (1:25 – 1:50)

**URL**: Click **Quick Add** (`+ Quick Add`) in the header.

### What to Click:
1. In the Quick Add modal, tap the first example chip:  
   `Sharma wedding 14 Dec, ₹80k, ₹25k advance paid`
2. Click **Read it**.
3. Point to the parsed preview card:
   - Client: `Priya Sharma`
   - Total: `₹80,000`
   - Advance token: `₹25,000` marked as paid via UPI.
   - 3-stage milestone breakdown automatically split (30% / 50% / 20%).
4. Click **Confirm Booking**.
5. App routes to `/invoices`, displaying the newly booked milestones.

### Talking Points:
> "Creatives hate complex invoice builders. With Quick Add, Arjun simply pastes a WhatsApp message or speaks: *'Sharma wedding 14 Dec, ₹80k, ₹25k advance paid'*.
>
> Our hybrid parser extracts the amounts, dates, and payment state, automatically splitting it into Indian wedding milestone tranches (Advance, Shoot Day, Album Delivery). Nothing saves silently: Arjun inspects the preview card, clicks Confirm Booking, and his receivables, forecast, and ledger update immediately."

### Key Numbers on Screen:
- Total Amount: `₹80,000`
- Advance Paid: `₹25,000`
- Pending Inflows: `₹55,000` across shoot and delivery milestones

---

## Screen 4: Pricing & Conclusion (1:50 – 2:00)

**URL**: Click **Pricing** (`/pricing`).

### What to Click:
1. Point to **Your Numbers** (Live Delay Cost Calculator).
2. Move the **Assumed Cost of Delay** slider from 1.5% to 2.5%.
3. Point to the Solo Plan value proposition.

### Talking Points:
> "Finally, our pricing page shows Arjun the real financial cost of delayed receivables: delayed payments cost solo studios thousands of rupees in credit card overdrafts every month. Payday pays for itself by collecting just one overdue invoice a few days earlier.
>
> That is Payday: deterministic financial intelligence, cultural precision, and calm clarity for India's independent creative studios. Thank you!"

---

## If Something Breaks (Troubleshooting & Backup Plan)

1. **If the demo data gets altered by previous testing**:
   - Click **Settings** in the left navigation -> click **Reset Demo Dataset**, OR
   - Visit or curl `POST http://localhost:3000/api/demo/reset`.
   - The entire dataset resets cleanly in under 50ms to the default Arjun Visuals state.

2. **If external LLM API is slow, rate-limited, or unavailable**:
   - Zero problem: Payday's AI layer has built-in instant deterministic template fallbacks (`lib/ai/fallbacks.ts`).
   - If `LLM_API_KEY` is unset or fails, reminder drafting and quick-add parsing complete instantly using tested, pre-authored templates and regex heuristics.

3. **Backup Video**:
   - If live network connectivity fails completely during the presentation, open the pre-recorded 2-minute offline walkthrough MP4 backup in the submission drive.
