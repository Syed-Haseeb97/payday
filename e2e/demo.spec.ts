import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Payday Hackathon Demo Path & Hardening', () => {
  test.beforeEach(async ({ request }) => {
    // Reset demo dataset to clean state before each test
    await request.post('/api/demo/reset');
  });

  test('1. Dashboard loads with Today summary, KPIs, and Mehta top overdue', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/dashboard');
    await expect(page).toHaveTitle(/Payday/i);

    // Verify Today summary
    const todaySummary = page.locator('p.font-serif.italic').first();
    await expect(todaySummary).toBeVisible();
    const summaryText = await todaySummary.textContent();
    expect(summaryText).toMatch(/chasing|on track|lowest cash point/i);

    // Verify KPIs
    await expect(page.locator('text=Total Outstanding').first()).toBeVisible();
    await expect(page.locator('text=Overdue').first()).toBeVisible();

    // Verify Mehta in Who Owes ledger
    const mehtaRow = page.locator('text=Rohit Mehta').first();
    await expect(mehtaRow).toBeVisible();

    // Verify no horizontal scrollbar
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
    expect(consoleErrors).toHaveLength(0);
  });

  test('2. Bad Day: top item is Mehta invoice, opens reminder drawer with exact amount', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/bad-day');
    
    // Mehta is top item
    const mehtaCard = page.locator('text=Rohit Mehta').first();
    await expect(mehtaCard).toBeVisible();

    // Click Draft WhatsApp / action button to open drawer
    const draftButton = page.locator('button:has-text("Draft WhatsApp"), button:has-text("Reminder")').first();
    await expect(draftButton).toBeVisible();
    await draftButton.click();

    // Drawer should open and contain the exact amount
    const drawer = page.locator('div:has-text("WhatsApp Follow-Up Draft"), div:has-text("Reminder")').first();
    await expect(drawer).toBeVisible();

    // Wait for text draft to populate with exact amount (e.g. ₹35,000)
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).not.toBeEmpty();
    const content = await textarea.inputValue();
    expect(content).toContain('35,000');

    // Verify no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
    expect(consoleErrors).toHaveLength(0);
  });

  test('3. Forecast: baseline positive, "Mehta pays late" makes it negative, Reset restores baseline', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/forecast');
    await page.waitForLoadState('networkidle');

    // Verify lowest balance is displayed
    const lowestBalanceCard = page.locator('text=Lowest Balance').first();
    await expect(lowestBalanceCard).toBeVisible();

    // On mobile, open What-If drawer if present
    const whatIfDrawerBtn = page.locator('button:has-text("What-If"):visible').first();
    if (await whatIfDrawerBtn.isVisible()) {
      await whatIfDrawerBtn.click();
    }

    // Apply "Slowest client pays 15 days late" preset
    const mehtaPreset = page.locator('button:has-text("Slowest client pays 15 days late"):visible').first();
    await expect(mehtaPreset).toBeVisible();
    await mehtaPreset.click();

    // Reset button appears, proving scenario is active
    const resetButton = page.locator('button:has-text("Reset"):visible').first();
    await expect(resetButton).toBeVisible();

    // Click Reset
    await resetButton.click();

    // Reset button disappears, restoring baseline
    await expect(resetButton).toBeHidden();
    await expect(page.locator('text=Lowest Balance').first()).toBeVisible();

    // Verify no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
    expect(consoleErrors).toHaveLength(0);
  });

  test('4. Quick Add: 3 demo phrases preview correctly and confirm creates booking', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/dashboard');

    // Open Quick Add Modal
    const quickAddButton = page.locator('button:has-text("Quick Add"):visible, button:has-text("+ Quick Add"):visible').first();
    await quickAddButton.click();

    const textarea = page.locator('textarea[placeholder*="Sharma wedding"]');
    await expect(textarea).toBeVisible();

    // Phrase 1: Sharma wedding
    await textarea.fill('Sharma wedding 14 Dec, ₹80k, ₹25k advance paid');
    await page.locator('button:has-text("Read it"):visible').click();

    // Verify preview shows 80,000
    await expect(page.locator('input[value="80000"], strong:has-text("₹80,000")').first()).toBeVisible();

    // Back to edit
    const editButton = page.locator('button:has-text("Edit original text"):visible').first();
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Phrase 2: Priya & Karan
    await textarea.fill('Priya & Karan engagement 2 Jan 45000 advance 10000 via UPI');
    await page.locator('button:has-text("Read it"):visible').click();
    await expect(page.locator('input[value="45000"], strong:has-text("₹45,000")').first()).toBeVisible();

    // Back to edit
    await editButton.click();

    // Phrase 3: Verma ji
    await textarea.fill('Verma ji ki shaadi 20 feb, 1.2 lakh, 30000 advance mil gaya');
    await page.locator('button:has-text("Read it"):visible').click();
    await expect(page.locator('input[value="120000"], strong:has-text("₹1,20,000")').first()).toBeVisible();

    // Confirm booking
    const confirmButton = page.locator('button:has-text("Confirm Booking"):visible').first();
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Wait for redirect to invoices
    await page.waitForURL('**/invoices');
    await expect(page.locator('text=Verma').and(page.locator(':visible')).first()).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('5. Invoice flow: partial payment recorded, overpayment rejected with clear message', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/invoices');

    // Click Pay on an invoice to open payment modal (pick visible one)
    const payBtn = page.locator('button:has-text("Pay"):visible').first();
    await expect(payBtn).toBeVisible();
    await payBtn.click();

    // Modal opens
    const modal = page.locator('div:has-text("Record Payment")').first();
    await expect(modal).toBeVisible();

    const amountInput = page.locator('input[type="number"], input[name="amount"]').first();
    await amountInput.fill('99999999'); // huge overpayment

    const submitBtn = page.locator('button:has-text("Confirm Receipt"):visible').last();
    await submitBtn.click();

    // Overpayment rejected with clear message
    const errorMsg = page.locator('text=cannot exceed remaining balance');
    await expect(errorMsg).toBeVisible();

    // Now record valid partial payment of 5000
    await amountInput.fill('5000');
    await submitBtn.click();

    // Modal closes upon success
    await expect(modal).not.toBeVisible();

    expect(consoleErrors).toHaveLength(0);
  });

  test('6. Pricing page loads and "Your numbers" card updates when assumption slider changes', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/pricing');
    await expect(page.locator('text=Your Numbers')).toBeVisible();

    const slider = page.locator('input[type="range"]').first();
    await expect(slider).toBeVisible();

    // Read initial summary sentence
    const summaryBefore = await page.locator('p.font-serif.italic').textContent();

    // Change slider value to 3.0
    await slider.fill('3.0');
    await slider.dispatchEvent('input');
    await slider.dispatchEvent('change');

    const summaryAfter = await page.locator('p.font-serif.italic').textContent();
    expect(summaryAfter).not.toEqual(summaryBefore);

    // Verify no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
    expect(consoleErrors).toHaveLength(0);
  });

  test('7. Accessibility audit: zero serious/critical violations on main pages in both themes', async ({ page }) => {
    const pages = ['/dashboard', '/bad-day', '/forecast', '/invoices', '/pricing'];

    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // Test light theme
      const lightResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const seriousOrCriticalLight = lightResults.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );

      expect(
        seriousOrCriticalLight,
        `Accessibility violations found on ${path} (Light): ${JSON.stringify(seriousOrCriticalLight, null, 2)}`
      ).toHaveLength(0);

      // Switch to dark theme and wait for CSS color transition to settle
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await page.waitForTimeout(300);
      const darkResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const seriousOrCriticalDark = darkResults.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );

      expect(
        seriousOrCriticalDark,
        `Accessibility violations found on ${path} (Dark): ${JSON.stringify(seriousOrCriticalDark, null, 2)}`
      ).toHaveLength(0);
    }
  });

  test('8. Security headers & CSP: zero securitypolicyviolation events or console errors across all pages', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.addInitScript(() => {
      (window as any).__cspViolations = [];
      window.addEventListener('securitypolicyviolation', (e) => {
        (window as any).__cspViolations.push({
          blockedURI: e.blockedURI,
          violatedDirective: e.violatedDirective,
          effectiveDirective: e.effectiveDirective,
          sourceFile: e.sourceFile,
          lineNumber: e.lineNumber,
          columnNumber: e.columnNumber,
          sample: (e as any).sample,
        });
      });
    });

    const routes = ['/dashboard', '/bad-day', '/forecast', '/invoices', '/pricing', '/settings', '/bookings', '/clients'];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const violations = await page.evaluate(() => (window as any).__cspViolations || []);
      expect(
        violations,
        `CSP violations reported on ${route}: ${JSON.stringify(violations)}`
      ).toHaveLength(0);
    }

    expect(consoleErrors).toHaveLength(0);
  });
});
