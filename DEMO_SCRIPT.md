# Payday: 2-Minute Demo Script

> **Product**: Payday (Cash Flow Intelligence & Receivables Management for Creative Freelancers)  
> **Speaker Persona**: Product Engineer presenting to hackathon judges  
> **Total Duration**: ~120 seconds  

---

## Screen 0: Introduction & The Persona (0:00 – 0:15)

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
- **Today's Briefing**: Identifies overdue items and the 90-day cash outlook lowest point (`₹26,500` on 14 Dec 2026).

---

## Screen 1: Bad Day Triage & WhatsApp Reminder with Pay Link (0:15 – 0:40)

**URL**: Click **Bad Day Triage** in the top navigation (`/bad-day`).

### What to Click:
1. Point to the prioritized receivables list sorted by the deterministic ranking score (combining financial impact, urgency, and client unreliability).
2. Look at the top item: **Rohit Mehta (Mehta Weddings)** (`₹95,000`, due in 10 days, average delay history of 13 days; action type: `heads_up`).
3. Click **Draft WhatsApp** to open the slide-over drawer.
4. In the Slide-Over Drawer:
   - Toggle Tone between **Friendly**, **Firm**, and **Final**.
   - Toggle Language between **English** and **Hinglish**.
   - Observe the prefilled message containing the exact rupee balance (`₹95,000`), the `wa.me` deep link, and the public **Pay Link** (`https://.../pay/<token>`).
5. Click **Mark as Sent**.

### Talking Points:
> "When receivables need attention, Arjun enters **Bad Day Mode**. Our deterministic ranking engine scores and sorts candidates by financial impact on the 90-day lowest balance, days overdue, and client unreliability.
>
> Rohit Mehta is ranked as the highest-priority action: an upcoming ₹95,000 milestone due in 10 days with a historical 13-day delay. Reaching out with a heads-up prevents delays and protects Arjun's upcoming bills.
>
> Arjun clicks 'Draft WhatsApp'. If an LLM is configured, it drafts a polite, concise reminder message under 70 words without aggressive language, keeping the exact rupee amount accurate and appending a secure, direct Pay Link. If no LLM is configured, our deterministic template fallback produces the message immediately."

### Key Numbers on Screen:
- Top Ranked Item: **Rohit Mehta (Mehta Weddings)**
- Milestone: `mid` milestone (`₹95,000`)
- Action Type: `heads_up` (due in 10 days, historical 13-day delay)

---

## Screen 2: 90-Day Runway, Ask Payday & The Recovery Plan (0:40 – 1:15)

**URL**: Click **Forecast (90d)** in the navigation (`/forecast`).

### What to Click:
1. Point to the **Daily Cash Trajectory** chart and the **Lowest Balance** card (`₹26,500` on 14 Dec 2026).
2. In the **Ask Payday** natural-language simulator input, type or click:  
   `What if Mehta pays 20 days late?`
3. Click **Ask**:
   - The preview card extracts: `Delay Rohit Mehta by 20 days`.
4. Click **Apply Scenario**:
   - Watch the trajectory recalculate into a projected deficit: **-₹9,500** on 15 Dec 2026 (a dip of `₹36,000`).
5. Notice the **Recovery Plan** card automatically appearing above the chart:
   - Deficit detected below safe buffer (`₹28,000`).
   - Top action: **Collect ₹95,000 from Rohit Mehta (Mehta Weddings)**.
   - Resulting lowest balance rises to **₹85,500** on 15 Dec 2026 (Fully Resolved: `Yes`).
6. Click **Reset** to restore baseline.

### Talking Points:
> "Next, Arjun opens the 90-day forecast. In baseline, his lowest projected balance is ₹26,500. But Arjun wants to stress-test his runway in plain English.
>
> He types into Ask Payday: *'What if Mehta pays 20 days late?'*. The question parses into a scenario and recalculates the curve: on December 15th, when studio rent is deducted, his cash drops below zero to -₹9,500.
>
> Because his cash dips below the 20% safe buffer of ₹28,000, Payday immediately renders a deterministic **Recovery Plan**. It doesn't give vague advice; it computes the exact math: collect the ₹95,000 milestone from Rohit Mehta, and his lowest balance climbs to positive ₹85,500, completely averting the crisis."

### Key Numbers on Screen:
- Baseline Lowest Balance: `₹26,500` (on 14 Dec 2026)
- What-If Projected Lowest Balance: `-₹9,500` (on 15 Dec 2026)
- Projected Cash Dip: `-₹36,000`
- Safe Buffer (20% of opening cash): `₹28,000`
- Recovery Action: Collect `₹95,000` from Rohit Mehta
- Resulting Lowest Balance: `₹85,500` (Fully Resolved)

---

## Screen 3: Client Pay Page & Payment Claim Loop (1:15 – 1:35)

**URL**: Open an invoice (e.g. `/invoices/<id>`) and click **Client Pay Page** (or navigate to `/pay/<token>` in a new tab).

### What to Click:
1. Point to the public, mobile-friendly **Client Pay Page**:
   - Clean, trustworthy aesthetic showing Studio Name ("Arjun Visuals"), invoice title, amount due (`₹95,000`), due date, and UPI ID.
   - Click **Copy UPI ID** or tap the instant UPI intent link / scan QR.
2. In the "Paid via UPI or Bank Transfer?" section, click **I have paid**:
   - Enter Amount: `₹35,000` (partial payment).
   - Method: `UPI`.
   - Transaction Reference / UTR: `UPI987654321012`.
   - Click **Submit Claim**.
3. The page displays a confirmation banner: *"Payment claimed. Awaiting studio confirmation."*
4. Return to the Studio Dashboard (`/dashboard`):
   - Notice the high-priority alert capsule: *"Payment claimed: ₹35,000 from Rohit Mehta"*.
5. Click the alert or navigate to the invoice details:
   - Inspect the **Pending Payment Claim** banner showing UTR and timestamp.
   - Click **Confirm Payment**: The ₹35,000 receipt is recorded, invoice balance reduces to `₹60,000`, and the claim is cleared.

### Talking Points:
> "Closing the loop between studio and client is usually messy. With Payday, every invoice generates a cryptographically signed public Pay Page.
>
> The client sees only what they need to see—no internal notes, no client history, no markup. They pay via UPI and submit a claim with their UTR number. Back in Arjun's dashboard, an alert informs him immediately. Arjun verifies the receipt in his banking app and clicks 'Confirm Payment'. The balance updates, the forecast recalculates, and client learning adjusts in real time."

---

## Screen 4: Zero-Friction Quick Add (1:35 – 1:50)

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

## Screen 5: Pricing & Settings Overview (1:50 – 2:00)

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
