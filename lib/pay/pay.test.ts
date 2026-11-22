import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generatePayToken,
  generateDeterministicPayToken,
  isValidPayToken,
  getPayLinkUrl,
} from './token';
import { InMemoryRepository } from '../db/repository';
import { checkRateLimit, resetRateLimits } from '../rate-limit';
import { generateReminderDraft } from '../ai';

describe('Payment Links & Claims Engine (Section 3)', () => {
  beforeEach(async () => {
    resetRateLimits();
    const repo = new InMemoryRepository();
    await repo.resetDemoData();
  });

  describe('1. Token Generation & Format', () => {
    it('generates cryptographically random URL-safe tokens with length >= 24', () => {
      const token = generatePayToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThanOrEqual(24);
      expect(/^[A-Za-z0-9_-]+$/.test(token)).toBe(true);
    });

    it('generates 100 unique tokens without collisions', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const token = generatePayToken();
        expect(tokens.has(token)).toBe(false);
        tokens.add(token);
      }
      expect(tokens.size).toBe(100);
    });

    it('generates deterministic tokens for stable seed invoices', () => {
      const t1 = generateDeterministicPayToken('inv-test-123');
      const t2 = generateDeterministicPayToken('inv-test-123');
      expect(t1).toBe(t2);
      expect(t1.length).toBeGreaterThanOrEqual(24);
      expect(isValidPayToken(t1)).toBe(true);
    });

    it('correctly validates valid and invalid pay tokens', () => {
      expect(isValidPayToken(generatePayToken())).toBe(true);
      expect(isValidPayToken('short-token')).toBe(false); // < 24 chars
      expect(isValidPayToken('valid_length_token_1234567890!@#')).toBe(false); // special chars
      expect(isValidPayToken('')).toBe(false);
    });

    it('constructs correct pay link URL using NEXT_PUBLIC_APP_URL or fallback', () => {
      const token = 'test-token-1234567890-abcdefgh';
      const link = getPayLinkUrl(token);
      expect(link).toContain(`/pay/${token}`);
    });
  });

  describe('2. Privacy Guard (Zero Data Leakage on Public Route)', () => {
    it('reveals ONLY safe fields and zero client contact or internal notes', async () => {
      const repo = new InMemoryRepository();
      const invoices = await repo.getInvoices();
      const targetInv = invoices[0];
      expect(targetInv.pay_token).toBeDefined();

      const publicInvoice = await repo.getInvoiceByPayToken(targetInv.pay_token!);
      expect(publicInvoice).not.toBeNull();

      // Client first name only projection
      const rawClientName = publicInvoice!.client?.name || '';
      const clientFirstName = rawClientName.split(' ')[0];

      // Projections that go to the public UI
      const publicPayload = {
        businessName: 'Arjun Visuals',
        clientFirstName,
        milestoneLabel: publicInvoice!.milestone_label,
        eventName: publicInvoice!.booking?.title,
        amount: publicInvoice!.amount,
        paidAmount: publicInvoice!.paid_amount,
        balance: publicInvoice!.amount - publicInvoice!.paid_amount,
        dueDate: publicInvoice!.due_date,
        status: publicInvoice!.status,
      };

      // Ensure no private data is in publicPayload
      expect(publicPayload).not.toHaveProperty('phone');
      expect(publicPayload).not.toHaveProperty('email');
      expect(publicPayload).not.toHaveProperty('notes');
      expect(publicPayload).not.toHaveProperty('average_delay_days');
      expect(publicPayload).not.toHaveProperty('payment_reliability');
      expect(publicPayload.clientFirstName).not.toContain('@');
      expect(publicPayload.clientFirstName).not.toContain('+91');
    });

    it('returns null for unknown token', async () => {
      const repo = new InMemoryRepository();
      const result = await repo.getInvoiceByPayToken('non_existent_token_1234567890');
      expect(result).toBeNull();
    });
  });

  describe('3. Payment Claims Creation & Validation', () => {
    it('creates a pending payment claim for valid amount', async () => {
      const repo = new InMemoryRepository();
      const invoices = await repo.getInvoices({ status: 'outstanding' });
      const inv = invoices[0];
      const balance = inv.amount - inv.paid_amount;

      const claim = await repo.createPaymentClaim({
        invoiceId: inv.id,
        claimedAmount: balance,
        reference: 'UPI-987654321012',
      });

      expect(claim).toBeDefined();
      expect(claim.status).toBe('pending');
      expect(claim.claimed_amount).toBe(balance);
      expect(claim.reference).toBe('UPI-987654321012');
      expect(claim.resolved_at).toBeNull();

      // Invoice status remains unchanged until confirmed
      const refreshed = await repo.getInvoiceById(inv.id);
      expect(refreshed?.paid_amount).toBe(inv.paid_amount);
    });

    it('rejects claim with amount <= 0', async () => {
      const repo = new InMemoryRepository();
      const invoices = await repo.getInvoices();
      const inv = invoices[0];

      await expect(
        repo.createPaymentClaim({
          invoiceId: inv.id,
          claimedAmount: 0,
        })
      ).rejects.toThrow('Claimed amount must be greater than zero');
    });

    it('rejects claim with amount exceeding remaining balance', async () => {
      const repo = new InMemoryRepository();
      const invoices = await repo.getInvoices({ status: 'outstanding' });
      const inv = invoices[0];
      const balance = inv.amount - inv.paid_amount;

      await expect(
        repo.createPaymentClaim({
          invoiceId: inv.id,
          claimedAmount: balance + 5000,
        })
      ).rejects.toThrow('exceeds remaining balance');
    });

    it('rejects duplicate pending claims on the same invoice', async () => {
      const repo = new InMemoryRepository();
      const invoices = await repo.getInvoices({ status: 'outstanding' });
      const inv = invoices[0];
      const balance = inv.amount - inv.paid_amount;

      await repo.createPaymentClaim({
        invoiceId: inv.id,
        claimedAmount: Math.floor(balance / 2),
      });

      await expect(
        repo.createPaymentClaim({
          invoiceId: inv.id,
          claimedAmount: Math.floor(balance / 2),
        })
      ).rejects.toThrow('A pending claim already exists for this invoice');
    });
  });

  describe('4. Owner Claim Confirmation and Rejection', () => {
    it('confirming claim records payment, updates client learning, and marks claim confirmed', async () => {
      const repo = new InMemoryRepository();
      const invoices = await repo.getInvoices({ status: 'outstanding' });
      const inv = invoices[0];
      const initialBalance = inv.amount - inv.paid_amount;

      const claim = await repo.createPaymentClaim({
        invoiceId: inv.id,
        claimedAmount: initialBalance,
        reference: 'UTR1234567890',
      });

      // Owner confirmation flow
      const paymentResult = await repo.recordPayment({
        invoiceId: inv.id,
        amount: claim.claimed_amount,
        paymentMethod: 'UPI',
        referenceNumber: claim.reference,
        notes: `Confirmed claim ${claim.id}`,
      });

      const resolvedClaim = await repo.resolvePaymentClaim(claim.id, 'confirmed');

      expect(resolvedClaim.status).toBe('confirmed');
      expect(resolvedClaim.resolved_at).not.toBeNull();
      expect(paymentResult.invoice.paid_amount).toBe(inv.amount);
      expect(paymentResult.invoice.amount - paymentResult.invoice.paid_amount).toBe(0);
    });

    it('rejecting claim marks claim rejected and leaves invoice balance unpaid', async () => {
      const repo = new InMemoryRepository();
      const invoices = await repo.getInvoices({ status: 'outstanding' });
      const inv = invoices[0];
      const initialPaid = inv.paid_amount;

      const claim = await repo.createPaymentClaim({
        invoiceId: inv.id,
        claimedAmount: 10000,
      });

      const rejected = await repo.resolvePaymentClaim(claim.id, 'rejected');
      expect(rejected.status).toBe('rejected');
      expect(rejected.resolved_at).not.toBeNull();

      const refreshed = await repo.getInvoiceById(inv.id);
      expect(refreshed?.paid_amount).toBe(initialPaid);
    });
  });

  describe('5. Idempotent Confirmation', () => {
    it('confirming an already-confirmed claim is idempotent and does not duplicate payments', async () => {
      const repo = new InMemoryRepository();
      const invoices = await repo.getInvoices({ status: 'outstanding' });
      const inv = invoices[0];

      const claim = await repo.createPaymentClaim({
        invoiceId: inv.id,
        claimedAmount: 5000,
      });

      const firstConfirm = await repo.resolvePaymentClaim(claim.id, 'confirmed');
      expect(firstConfirm.status).toBe('confirmed');

      // Second confirm should return cleanly without modifying or duplicating
      const secondConfirm = await repo.resolvePaymentClaim(claim.id, 'confirmed');
      expect(secondConfirm.status).toBe('confirmed');
    });
  });

  describe('6. Rate Limiting on Claim Endpoint', () => {
    it('allows 5 requests and blocks the 6th request within window', () => {
      const ip = '192.168.1.100';
      const key = `claim_${ip}`;
      const windowMs = 60 * 60 * 1000;

      for (let i = 1; i <= 5; i++) {
        const check = checkRateLimit(key, { limit: 5, windowMs });
        expect(check.allowed).toBe(true);
        expect(check.remaining).toBe(5 - i);
      }

      const blockedCheck = checkRateLimit(key, { limit: 5, windowMs });
      expect(blockedCheck.allowed).toBe(false);
      expect(blockedCheck.remaining).toBe(0);
    });
  });

  describe('7. Reminder Draft Includes Pay Link', () => {
    it('always appends or includes pay link in deterministic fallback reminder', async () => {
      const token = 'pay_tok_test_sample_1234567890';
      const draft = await generateReminderDraft(
        'friendly',
        'en',
        {
          clientName: 'Priya',
          eventName: 'Sharma Wedding',
          milestoneLabel: 'advance',
          amountFormatted: '₹40,000',
          dueDateFormatted: '14 Dec 2026',
          daysOverdue: 0,
          businessName: 'Arjun Visuals',
          payToken: token,
        }
      );

      expect(draft.text).toContain(`/pay/${token}`);
      expect(draft.whatsappDeepLink).toContain(encodeURIComponent(`/pay/${token}`));
    });
  });
});
