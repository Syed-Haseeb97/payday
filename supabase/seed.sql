-- Payday Dynamic Synthetic Seed Data
-- Generated relative to runtime date

BEGIN;

-- 1. Insert User
INSERT INTO users (id, email, full_name, business_name, phone, upi_id, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'arjun@example.com', 'Arjun Verma', 'Arjun Visuals', '+91 90000 00000', 'arjunvisuals@okaxis', '2026-05-26T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 2. Insert Settings
INSERT INTO settings (id, user_id, opening_cash_balance, currency, locale, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 140000, 'INR', 'en-IN', '2026-05-26T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO UPDATE SET opening_cash_balance = EXCLUDED.opening_cash_balance;

-- 3. Insert Clients
INSERT INTO clients (id, user_id, name, phone, email, payment_reliability, average_delay_days, notes, created_at, updated_at)
VALUES ('c1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Priya Sharma (Sharma Nuptials)', '+91 90000 00001', 'priya.sharma@example.fake', 'reliable', 1, 'Prompt payer, prefers UPI transfers immediately upon milestone delivery.', '2026-06-15T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO clients (id, user_id, name, phone, email, payment_reliability, average_delay_days, notes, created_at, updated_at)
VALUES ('c1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Vikram Malhotra (Malhotra Reception)', '+91 90000 00002', 'vikram.malhotra@example.fake', 'reliable', 2, 'Clear communication, high budget corporate family wedding.', '2026-06-25T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO clients (id, user_id, name, phone, email, payment_reliability, average_delay_days, notes, created_at, updated_at)
VALUES ('c1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Rohan & Neha Kapoor', '+91 90000 00003', 'rohan.kapoor@example.fake', 'average', 6, 'Takes around a week after WhatsApp follow-up to release NEFT.', '2026-07-05T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO clients (id, user_id, name, phone, email, payment_reliability, average_delay_days, notes, created_at, updated_at)
VALUES ('c1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Siddharth Verma (Verma Grand Sangeet)', '+91 90000 00004', 'sid.verma@example.fake', 'average', 7, 'Busy finance executive, responds after second friendly ping.', '2026-07-25T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO clients (id, user_id, name, phone, email, payment_reliability, average_delay_days, notes, created_at, updated_at)
VALUES ('c1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Deepak Gupta (Gupta Traditional)', '+91 90000 00005', 'deepak.gupta@example.fake', 'average', 8, 'Family elders approve payments, usually clears in 8-10 days.', '2026-08-14T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO clients (id, user_id, name, phone, email, payment_reliability, average_delay_days, notes, created_at, updated_at)
VALUES ('c1000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Rohit Mehta (Mehta Weddings)', '+91 90000 00006', 'rohit.mehta@example.fake', 'slow', 13, 'Habitual slow payer. Requires firm reminders; always delays until album delivery.', '2026-08-24T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO clients (id, user_id, name, phone, email, payment_reliability, average_delay_days, notes, created_at, updated_at)
VALUES ('c1000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Kunal Singhania (Singhania Destination)', '+91 90000 00007', 'kunal.singhania@example.fake', 'unreliable', 22, 'Extremely delayed. Ignores friendly WhatsApp messages; owes long overdue balance.', '2026-09-03T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO clients (id, user_id, name, phone, email, payment_reliability, average_delay_days, notes, created_at, updated_at)
VALUES ('c1000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Ananya Iyer (Iyer Engagement)', '+91 90000 00008', 'ananya.iyer@example.fake', 'new', 0, 'New client, first booking for upcoming pre-wedding & engagement ceremony.', '2026-11-12T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Bookings
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Sharma Pre-Wedding Shoot', '2026-06-25', 45000, 30, 50, 20, 'completed', 'Package booking for Sharma Pre-Wedding Shoot', '2026-05-31T00:00:00Z', '2026-05-31T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Sharma 2-Day Wedding', '2026-07-15', 160000, 30, 50, 20, 'completed', 'Package booking for Sharma 2-Day Wedding', '2026-06-15T00:00:00Z', '2026-06-15T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'Malhotra Intimate Roka', '2026-07-05', 50000, 30, 50, 20, 'completed', 'Package booking for Malhotra Intimate Roka', '2026-06-10T00:00:00Z', '2026-06-10T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'Malhotra 3-Day Luxury Wedding', '2026-08-04', 240000, 30, 50, 20, 'completed', 'Package booking for Malhotra 3-Day Luxury Wedding', '2026-06-30T00:00:00Z', '2026-06-30T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'Kapoor Engagement Night', '2026-07-20', 60000, 30, 50, 20, 'completed', 'Package booking for Kapoor Engagement Night', '2026-07-05T00:00:00Z', '2026-07-05T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'Kapoor Cocktail & Haldi', '2026-08-19', 90000, 30, 50, 20, 'completed', 'Package booking for Kapoor Cocktail & Haldi', '2026-07-25T00:00:00Z', '2026-07-25T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000004', 'Verma Sangeet Celebration', '2026-08-24', 75000, 30, 50, 20, 'completed', 'Package booking for Verma Sangeet Celebration', '2026-07-30T00:00:00Z', '2026-07-30T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000004', 'Verma Reception Party', '2026-09-08', 110000, 30, 50, 20, 'completed', 'Package booking for Verma Reception Party', '2026-08-14T00:00:00Z', '2026-08-14T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000005', 'Gupta Traditional Haldi', '2026-09-03', 40000, 30, 50, 20, 'completed', 'Package booking for Gupta Traditional Haldi', '2026-08-14T00:00:00Z', '2026-08-14T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000005', 'Gupta Full Wedding Package', '2026-09-23', 145000, 30, 50, 20, 'completed', 'Package booking for Gupta Full Wedding Package', '2026-08-29T00:00:00Z', '2026-08-29T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000006', 'Mehta Pre-Wedding Teaser', '2026-09-13', 55000, 30, 50, 20, 'completed', 'Package booking for Mehta Pre-Wedding Teaser', '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000007', 'Singhania Goa Pre-Wedding', '2026-09-18', 80000, 30, 50, 20, 'completed', 'Package booking for Singhania Goa Pre-Wedding', '2026-09-03T00:00:00Z', '2026-09-03T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'Malhotra Post-Wedding Brunch', '2026-10-08', 42000, 30, 50, 20, 'completed', 'Package booking for Malhotra Post-Wedding Brunch', '2026-09-28T00:00:00Z', '2026-09-28T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Sharma Family Milestone', '2026-10-23', 48000, 30, 50, 20, 'completed', 'Package booking for Sharma Family Milestone', '2026-10-08T00:00:00Z', '2026-10-08T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000007', 'Singhania Grand Palace Wedding', '2026-10-13', 250000, 30, 50, 20, 'confirmed', 'Package booking for Singhania Grand Palace Wedding', '2026-09-13T00:00:00Z', '2026-09-13T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000006', 'Mehta Grand Regal Wedding', '2026-11-23', 180000, 30, 50, 20, 'confirmed', 'Package booking for Mehta Grand Regal Wedding', '2026-10-08T00:00:00Z', '2026-10-08T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Sharma Winter Nuptials', '2026-12-07', 215000, 30, 50, 20, 'confirmed', 'Package booking for Sharma Winter Nuptials', '2026-10-23T00:00:00Z', '2026-10-23T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'Kapoor Udaipur Sangeet', '2026-12-17', 175000, 30, 50, 20, 'confirmed', 'Package booking for Kapoor Udaipur Sangeet', '2026-11-02T00:00:00Z', '2026-11-02T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000008', 'Iyer South Indian Engagement', '2026-12-04', 65000, 30, 50, 20, 'confirmed', 'Package booking for Iyer South Indian Engagement', '2026-11-14T00:00:00Z', '2026-11-14T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'Malhotra Anniversary Gala', '2026-12-30', 85000, 30, 50, 20, 'confirmed', 'Package booking for Malhotra Anniversary Gala', '2026-11-07T00:00:00Z', '2026-11-07T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000004', 'Verma Delhi Royal Wedding', '2027-01-13', 230000, 30, 50, 20, 'confirmed', 'Package booking for Verma Delhi Royal Wedding', '2026-11-12T00:00:00Z', '2026-11-12T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000005', 'Gupta Spring Reception', '2027-01-31', 120000, 30, 50, 20, 'confirmed', 'Package booking for Gupta Spring Reception', '2026-11-17T00:00:00Z', '2026-11-17T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000008', 'Iyer Traditional Wedding', '2027-02-25', 190000, 30, 50, 20, 'confirmed', 'Package booking for Iyer Traditional Wedding', '2026-11-19T00:00:00Z', '2026-11-19T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Sharma Destination Vows', '2027-03-22', 220000, 30, 50, 20, 'confirmed', 'Package booking for Sharma Destination Vows', '2026-11-20T00:00:00Z', '2026-11-20T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO bookings (id, user_id, client_id, title, event_date, total_amount, advance_percentage, mid_percentage, final_percentage, status, notes, created_at, updated_at)
VALUES ('b1000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'Kapoor Summer Reception', '2027-04-16', 95000, 30, 50, 20, 'confirmed', 'Package booking for Kapoor Summer Reception', '2026-11-21T00:00:00Z', '2026-11-21T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Invoices
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'INV-0001', 'advance', 13500, 13500, '2026-05-31', true, 'sent', 'gCcE4z5G4-tfpGcabR8G3-wGglJ6GXlP', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Sharma Pre-Wedding Shoot', '2026-05-31T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'INV-0002', 'mid', 22500, 22500, '2026-05-31', true, 'sent', 'Q5kKHiACUkrGjNCaDRCxB4hm4BpJu1v4', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'MID milestone for Sharma Pre-Wedding Shoot', '2026-05-31T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'INV-0003', 'final', 9000, 9000, '2026-07-02', true, 'sent', '1-o_c1T_IvCE8Iza3mIPSdR4u2HyBP0A', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'FINAL milestone for Sharma Pre-Wedding Shoot', '2026-05-31T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'INV-0004', 'advance', 48000, 48000, '2026-06-15', true, 'sent', 'aVEuMzGLnz0Jl6uI8lWOwTL-PO06r5qo', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Sharma 2-Day Wedding', '2026-06-15T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'INV-0005', 'mid', 80000, 80000, '2026-06-15', true, 'sent', 'm67DDMMlAOwg6Pqw6FWIsmxiSSdHJJsH', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'MID milestone for Sharma 2-Day Wedding', '2026-06-15T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'INV-0006', 'final', 32000, 32000, '2026-07-22', true, 'sent', '5P0rV1AamrkF6X5YyWPl408f5jd3mnmG', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'FINAL milestone for Sharma 2-Day Wedding', '2026-06-15T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 'INV-0007', 'advance', 15000, 15000, '2026-06-10', true, 'sent', 'R-CfjwAQA9OTpX-2o42t-ZH-m2LAF6Fx', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Malhotra Intimate Roka', '2026-06-10T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 'INV-0008', 'mid', 25000, 25000, '2026-06-10', true, 'sent', 'maeNvaCmgtweTbpKZgnFr9b07COHxBP1', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'MID milestone for Malhotra Intimate Roka', '2026-06-10T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 'INV-0009', 'final', 10000, 10000, '2026-07-12', true, 'sent', 'FqqvYXnsoUP2TVPt2lxyxowBEjaj8wGX', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'FINAL milestone for Malhotra Intimate Roka', '2026-06-10T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000002', 'INV-0010', 'advance', 72000, 72000, '2026-06-30', true, 'sent', 'EpyFPBBFVSyWJAzMA_mibyJv79r4czjr', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Malhotra 3-Day Luxury Wedding', '2026-06-30T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000002', 'INV-0011', 'mid', 120000, 120000, '2026-07-05', true, 'sent', 'u3cyDjQIchT4_WMf0VRjpfbOOHy7SMGd', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'MID milestone for Malhotra 3-Day Luxury Wedding', '2026-06-30T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000002', 'INV-0012', 'final', 48000, 48000, '2026-08-11', true, 'sent', '2vvIEavx2TXzNrHP9qL-c3Aj8DgLfvgP', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'FINAL milestone for Malhotra 3-Day Luxury Wedding', '2026-06-30T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000003', 'INV-0013', 'advance', 18000, 18000, '2026-07-05', true, 'sent', 'WRKvVHK9Sd6jkYfR2UIoR3Xily7PEn93', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Kapoor Engagement Night', '2026-07-05T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000003', 'INV-0014', 'mid', 30000, 30000, '2026-07-05', true, 'sent', '7IXse0jVm9XP2h5tOm5hZGnnoql4CrDq', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'MID milestone for Kapoor Engagement Night', '2026-07-05T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000003', 'INV-0015', 'final', 12000, 12000, '2026-07-27', true, 'sent', 'Evfs9IyAFnjTAM4fQVwFBvuX8sxCgsoh', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'FINAL milestone for Kapoor Engagement Night', '2026-07-05T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000003', 'INV-0016', 'advance', 27000, 27000, '2026-07-25', true, 'sent', '87vFadWEClfScv_z0FR0OD8VSzy4ghf6', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Kapoor Cocktail & Haldi', '2026-07-25T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000003', 'INV-0017', 'mid', 45000, 45000, '2026-07-25', true, 'sent', 'eZBYoPTnFnLfk01VOJOdlyTCsECuUcpe', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'MID milestone for Kapoor Cocktail & Haldi', '2026-07-25T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000003', 'INV-0018', 'final', 18000, 18000, '2026-08-26', true, 'sent', 'WXLGk_K2O7qobmNFBOsYViBY7o-ieinZ', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'FINAL milestone for Kapoor Cocktail & Haldi', '2026-07-25T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000004', 'INV-0019', 'advance', 22500, 22500, '2026-07-30', true, 'sent', 'u-kmN5z1ICe1v2BFCD1weiY3ytcMRNLC', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Verma Sangeet Celebration', '2026-07-30T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000004', 'INV-0020', 'mid', 37500, 37500, '2026-07-30', true, 'sent', 'KSbbQZX3V4zXi5FGwsi6GDeNoFQ-1tx1', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'MID milestone for Verma Sangeet Celebration', '2026-07-30T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000004', 'INV-0021', 'final', 15000, 15000, '2026-08-31', true, 'sent', 'V_Nta51o--yj2UAxrh6ASLd2D-Gdc6LI', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'FINAL milestone for Verma Sangeet Celebration', '2026-07-30T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000004', 'INV-0022', 'advance', 33000, 33000, '2026-08-14', true, 'sent', 'sIT38cdsaLpbXgowSsdmAcg2GhKWElsx', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Verma Reception Party', '2026-08-14T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000004', 'INV-0023', 'mid', 55000, 55000, '2026-08-14', true, 'sent', '2jiEZEOyUNxbFwP8gc4RAn-5M6NC-Jkh', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'MID milestone for Verma Reception Party', '2026-08-14T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000004', 'INV-0024', 'final', 22000, 22000, '2026-09-15', true, 'sent', '9kYYD7oLIr-3q_AH4if6ZAvJjoivRtY0', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'FINAL milestone for Verma Reception Party', '2026-08-14T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000005', 'INV-0025', 'advance', 12000, 12000, '2026-08-14', true, 'sent', '_tuyfciaQ91U6FowuXNkVxG51GWYY1hR', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Gupta Traditional Haldi', '2026-08-14T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000005', 'INV-0026', 'mid', 20000, 20000, '2026-08-14', true, 'sent', 'RbNVoEaCaeZ5K822TF_LNgViS_oplYrL', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'MID milestone for Gupta Traditional Haldi', '2026-08-14T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000005', 'INV-0027', 'final', 8000, 8000, '2026-09-10', true, 'sent', 'OSiUE6Zk1-fA5JbC1-Kf_ktpUH8Xlsj6', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'FINAL milestone for Gupta Traditional Haldi', '2026-08-14T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000005', 'INV-0028', 'advance', 43500, 43500, '2026-08-29', true, 'sent', '8iuiO7o52r3AVqOhmW7MMCBXWrqF8Yki', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Gupta Full Wedding Package', '2026-08-29T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000005', 'INV-0029', 'mid', 72500, 72500, '2026-08-29', true, 'sent', 'sHawahxq_DiCAddzsE4TCx4ZrA-v2bbZ', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'MID milestone for Gupta Full Wedding Package', '2026-08-29T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000005', 'INV-0030', 'final', 29000, 29000, '2026-09-30', true, 'sent', 'QgU4nlhCGBOkdwAM9lOXyttJiI4hg9qI', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'FINAL milestone for Gupta Full Wedding Package', '2026-08-29T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000006', 'INV-0031', 'advance', 16500, 16500, '2026-08-24', true, 'sent', 'Gv_yHi_n6R58LGnzXu0TA0XrIJlYA2sH', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Mehta Pre-Wedding Teaser', '2026-08-24T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000006', 'INV-0032', 'mid', 27500, 27500, '2026-08-24', true, 'sent', 'QfuT1rcW_TDJK4mQLJwNA8cVS9tlG8nu', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'MID milestone for Mehta Pre-Wedding Teaser', '2026-08-24T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000006', 'INV-0033', 'final', 11000, 11000, '2026-09-20', true, 'sent', 'eNQOuT8Jy4hX6mBNBFF_-yW9gVcEVJ7A', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'FINAL milestone for Mehta Pre-Wedding Teaser', '2026-08-24T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000007', 'INV-0034', 'advance', 24000, 24000, '2026-09-03', true, 'sent', '8FT3myuaJocRpwGHpNpdCCADcZsOlAhF', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Singhania Goa Pre-Wedding', '2026-09-03T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000007', 'INV-0035', 'mid', 40000, 40000, '2026-09-03', true, 'sent', 'wyjHl4DU59UfYNdczqEGq9W7h2MGbh5i', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'MID milestone for Singhania Goa Pre-Wedding', '2026-09-03T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000007', 'INV-0036', 'final', 16000, 16000, '2026-09-25', true, 'sent', 'PV_fw20kplEuaXcFipENvfTlbbjDLbeJ', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'FINAL milestone for Singhania Goa Pre-Wedding', '2026-09-03T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000013', 'c1000000-0000-0000-0000-000000000002', 'INV-0037', 'advance', 12600, 12600, '2026-09-28', true, 'sent', 'fOfdsay00-FXiS4t9JiPnjzbI_hPxIR7', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Malhotra Post-Wedding Brunch', '2026-09-28T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000038', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000013', 'c1000000-0000-0000-0000-000000000002', 'INV-0038', 'mid', 21000, 21000, '2026-09-28', true, 'sent', 'imooflq9YTVwE0wrfyjixEkWx8ztqzaf', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'MID milestone for Malhotra Post-Wedding Brunch', '2026-09-28T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000039', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000013', 'c1000000-0000-0000-0000-000000000002', 'INV-0039', 'final', 8400, 8400, '2026-10-15', true, 'sent', 'W6D0TSD7GzBEVTawn37ULRGwWx-iojwG', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'FINAL milestone for Malhotra Post-Wedding Brunch', '2026-09-28T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000001', 'INV-0040', 'advance', 14400, 14400, '2026-10-08', true, 'sent', 'SJjtX90cX_JgQxT2dm-w2cssmLj-H9Fv', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Sharma Family Milestone', '2026-10-08T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000001', 'INV-0041', 'mid', 24000, 24000, '2026-10-08', true, 'sent', 'DFrnc0mtGFPjTb3bGlgaCOREEMuvY6y4', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'MID milestone for Sharma Family Milestone', '2026-10-08T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000001', 'INV-0042', 'final', 9600, 9600, '2026-10-30', true, 'sent', 'hC6ihQDG5_5tUiZykWyyrvedbj_U34XQ', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'FINAL milestone for Sharma Family Milestone', '2026-10-08T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000007', 'INV-0043', 'advance', 75000, 75000, '2026-09-13', true, 'sent', 'CFc5Yls-QeMA71DEXONhEontXVbkwrBb', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Singhania Grand Palace Wedding', '2026-09-13T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000007', 'INV-0044', 'mid', 125000, 125000, '2026-09-13', true, 'sent', '4LG5GN9iJuXwh7MUCMw50t4qzllxBKce', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'MID milestone for Singhania Grand Palace Wedding', '2026-09-13T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000045', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000007', 'INV-0045', 'final', 50000, 0, '2026-11-28', true, 'sent', 'CNjy8dPfL7AlLGqZBxCTQYGZK9gq9h1s', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=50000&cu=INR', 'FINAL milestone for Singhania Grand Palace Wedding', '2026-09-13T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000046', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000016', 'c1000000-0000-0000-0000-000000000006', 'INV-0046', 'advance', 50000, 50000, '2026-10-08', true, 'sent', '_ff8VwZ2RKW0tR3D46lGcT122Ocn4ozJ', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Mehta Grand Regal Wedding', '2026-10-08T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000047', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000016', 'c1000000-0000-0000-0000-000000000006', 'INV-0047', 'mid', 35000, 0, '2026-11-10', true, 'sent', 'w6CtaLhnJChLjH7b6MM8Rus-1tEV13TD', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=35000&cu=INR', 'MID milestone for Mehta Grand Regal Wedding', '2026-10-08T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000048', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000016', 'c1000000-0000-0000-0000-000000000006', 'INV-0048', 'final', 95000, 0, '2026-12-02', true, 'sent', 'kCs6D7NvYp_ZdPHyjxduS4T-WhFL9cZL', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=95000&cu=INR', 'FINAL milestone for Mehta Grand Regal Wedding', '2026-10-08T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000049', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000017', 'c1000000-0000-0000-0000-000000000001', 'INV-0049', 'advance', 64500, 64500, '2026-10-23', true, 'sent', '6SaKafZPzvnHAR4kP6UHHofsTO8VZItx', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Sharma Winter Nuptials', '2026-10-23T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000017', 'c1000000-0000-0000-0000-000000000001', 'INV-0050', 'mid', 107500, 0, '2026-12-16', true, 'sent', 'T57PR00f02v8ZyVI6exyP8v4-gfdCJYv', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=107500&cu=INR', 'MID milestone for Sharma Winter Nuptials', '2026-10-23T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000017', 'c1000000-0000-0000-0000-000000000001', 'INV-0051', 'final', 43000, 0, '2026-12-27', true, 'sent', 'QVj4AlUiIw4qBhT3oyKGpybE0MufjsTX', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=43000&cu=INR', 'FINAL milestone for Sharma Winter Nuptials', '2026-10-23T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000018', 'c1000000-0000-0000-0000-000000000003', 'INV-0052', 'advance', 52500, 52500, '2026-11-02', true, 'sent', 'Uw37O9Gyq0p3n1MWC2JTjtoDeKwvqFjh', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Kapoor Udaipur Sangeet', '2026-11-02T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000053', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000018', 'c1000000-0000-0000-0000-000000000003', 'INV-0053', 'mid', 87500, 0, '2026-12-11', true, 'sent', 'MCBeWIgDKchU8rxyR0CnZrd6brkvm03x', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=87500&cu=INR', 'MID milestone for Kapoor Udaipur Sangeet', '2026-11-02T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000054', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000018', 'c1000000-0000-0000-0000-000000000003', 'INV-0054', 'final', 35000, 0, '2026-12-30', true, 'sent', 'cRaA71bkj0X2YtgPSosn5x_Eg5bJHcIF', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=35000&cu=INR', 'FINAL milestone for Kapoor Udaipur Sangeet', '2026-11-02T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000055', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000019', 'c1000000-0000-0000-0000-000000000008', 'INV-0055', 'advance', 19500, 19500, '2026-11-14', true, 'sent', 'DSV9jxZgoSgD1NP0kpbskq3ZliZ7B-Lw', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Iyer South Indian Engagement', '2026-11-14T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000056', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000019', 'c1000000-0000-0000-0000-000000000008', 'INV-0056', 'mid', 32500, 32500, '2026-11-14', true, 'sent', 'ePZgWnMCLt5ryHb72mU3ZMJ3sGbtKjVO', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'MID milestone for Iyer South Indian Engagement', '2026-11-14T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000057', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000019', 'c1000000-0000-0000-0000-000000000008', 'INV-0057', 'final', 13000, 0, '2026-12-18', true, 'sent', 'jVbBVHjP79i8jprpiI6IX4KYMZJHwEFz', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=13000&cu=INR', 'FINAL milestone for Iyer South Indian Engagement', '2026-11-14T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000058', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000020', 'c1000000-0000-0000-0000-000000000002', 'INV-0058', 'advance', 25500, 25500, '2026-11-07', true, 'sent', 'BmHNRhphzI_1QFoAE_3Zpt4SPwuAtUwm', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Malhotra Anniversary Gala', '2026-11-07T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000059', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000020', 'c1000000-0000-0000-0000-000000000002', 'INV-0059', 'mid', 42500, 0, '2026-12-17', true, 'sent', 'Z8QaP-UiQIJCIHS66yT8aFhEjaP-23F8', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=42500&cu=INR', 'MID milestone for Malhotra Anniversary Gala', '2026-11-07T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000060', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000020', 'c1000000-0000-0000-0000-000000000002', 'INV-0060', 'final', 17000, 0, '2027-01-06', true, 'sent', 'NlB49Pk2TTuTtzhHJunFsUFIMt-GlFEb', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=17000&cu=INR', 'FINAL milestone for Malhotra Anniversary Gala', '2026-11-07T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000021', 'c1000000-0000-0000-0000-000000000004', 'INV-0061', 'advance', 69000, 69000, '2026-11-12', true, 'sent', 'CyX23elex62OBJDPrp4zuqZ9WS5eLP5c', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Verma Delhi Royal Wedding', '2026-11-12T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000021', 'c1000000-0000-0000-0000-000000000004', 'INV-0062', 'mid', 115000, 0, '2026-12-14', true, 'sent', 'Y0FcOq9CkhPa4YyIGOhX9DGzIdmEcOdF', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=115000&cu=INR', 'MID milestone for Verma Delhi Royal Wedding', '2026-11-12T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000063', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000021', 'c1000000-0000-0000-0000-000000000004', 'INV-0063', 'final', 46000, 0, '2027-01-20', true, 'sent', 'L9Pw2fXF8VEXs10vFyVT7esilVMRfHuw', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=46000&cu=INR', 'FINAL milestone for Verma Delhi Royal Wedding', '2026-11-12T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000064', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000022', 'c1000000-0000-0000-0000-000000000005', 'INV-0064', 'advance', 36000, 36000, '2026-11-17', true, 'sent', 'OlCl4R2itddxiC0MshB9MPi7_iEtSjtU', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Gupta Spring Reception', '2026-11-17T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000065', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000022', 'c1000000-0000-0000-0000-000000000005', 'INV-0065', 'mid', 60000, 0, '2027-01-01', true, 'sent', '2JKOiamZ9DgoYyPZm46SqUdzEexILnhT', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=60000&cu=INR', 'MID milestone for Gupta Spring Reception', '2026-11-17T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000066', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000022', 'c1000000-0000-0000-0000-000000000005', 'INV-0066', 'final', 24000, 0, '2027-02-07', true, 'sent', 'Du14f-TIgJnM2naXjWvQPjypK5U9fTwR', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=24000&cu=INR', 'FINAL milestone for Gupta Spring Reception', '2026-11-17T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000067', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000023', 'c1000000-0000-0000-0000-000000000008', 'INV-0067', 'advance', 57000, 57000, '2026-11-19', true, 'sent', '0Q3KwwgYfOY2hhne4oO58GE6LYd9TwSG', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Iyer Traditional Wedding', '2026-11-19T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000068', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000023', 'c1000000-0000-0000-0000-000000000008', 'INV-0068', 'mid', 95000, 0, '2027-01-26', false, 'sent', 'CCepNj_xk_6lRjsagHWuhth0Rz6CcVt_', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=95000&cu=INR', 'MID milestone for Iyer Traditional Wedding', '2026-11-19T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000069', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000023', 'c1000000-0000-0000-0000-000000000008', 'INV-0069', 'final', 38000, 0, '2027-03-04', false, 'sent', 'dH-kf0kE48-Lt-Sk55zHIq9icUMofzgU', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=38000&cu=INR', 'FINAL milestone for Iyer Traditional Wedding', '2026-11-19T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000070', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000024', 'c1000000-0000-0000-0000-000000000001', 'INV-0070', 'advance', 66000, 66000, '2026-11-20', true, 'sent', 'BNu7Vq3guzczSmrYgTUGN2LuKqULoHU8', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Sharma Destination Vows', '2026-11-20T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000024', 'c1000000-0000-0000-0000-000000000001', 'INV-0071', 'mid', 110000, 0, '2027-02-20', false, 'sent', 'Zb58zNbJ9cPmcMN53t0TdGtugUcmbPmU', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=110000&cu=INR', 'MID milestone for Sharma Destination Vows', '2026-11-20T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000024', 'c1000000-0000-0000-0000-000000000001', 'INV-0072', 'final', 44000, 0, '2027-03-29', false, 'sent', 'N7rKV18chahHxqMT5RaF6RfX06simXp_', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=44000&cu=INR', 'FINAL milestone for Sharma Destination Vows', '2026-11-20T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000073', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000025', 'c1000000-0000-0000-0000-000000000003', 'INV-0073', 'advance', 28500, 28500, '2026-11-21', true, 'sent', 'weSFMZ_Pr8Oxxk1Z4Qq_bLk3FxFSVbOc', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=0&cu=INR', 'ADVANCE milestone for Kapoor Summer Reception', '2026-11-21T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000074', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000025', 'c1000000-0000-0000-0000-000000000003', 'INV-0074', 'mid', 47500, 0, '2027-03-17', false, 'sent', 'TXt96ESqrQl-MdqApbpCBK3yfcafhK_p', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=47500&cu=INR', 'MID milestone for Kapoor Summer Reception', '2026-11-21T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO invoices (id, user_id, booking_id, client_id, invoice_number, milestone_label, amount, paid_amount, due_date, sent, status, pay_token, upi_link, notes, created_at, updated_at)
VALUES ('i1000000-0000-0000-0000-000000000075', '00000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000025', 'c1000000-0000-0000-0000-000000000003', 'INV-0075', 'final', 19000, 0, '2027-04-23', false, 'sent', 'KvvNq-exiM34hOIjse0Z3E1nrhAmbbyI', 'upi://pay?pa=arjunvisuals@okaxis&pn=Arjun%20Visuals&am=19000&cu=INR', 'FINAL milestone for Kapoor Summer Reception', '2026-11-21T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Payments
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000001', 13500, '2026-05-31', 'UPI', 'UPI-100002', 'Payment for INV-0001 (advance)', '2026-05-31T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000002', 22500, '2026-05-31', 'UPI', 'UPI-100003', 'Payment for INV-0002 (mid)', '2026-05-31T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000003', 9000, '2026-07-02', 'UPI', 'UPI-100004', 'Payment for INV-0003 (final)', '2026-07-02T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000004', 48000, '2026-06-15', 'UPI', 'UPI-100005', 'Payment for INV-0004 (advance)', '2026-06-15T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000005', 80000, '2026-06-15', 'UPI', 'UPI-100006', 'Payment for INV-0005 (mid)', '2026-06-15T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000006', 32000, '2026-07-22', 'UPI', 'UPI-100007', 'Payment for INV-0006 (final)', '2026-07-22T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000007', 15000, '2026-06-10', 'UPI', 'UPI-100008', 'Payment for INV-0007 (advance)', '2026-06-10T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000008', 25000, '2026-06-10', 'UPI', 'UPI-100009', 'Payment for INV-0008 (mid)', '2026-06-10T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000009', 10000, '2026-07-12', 'UPI', 'UPI-100010', 'Payment for INV-0009 (final)', '2026-07-12T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000010', 72000, '2026-06-30', 'UPI', 'UPI-100011', 'Payment for INV-0010 (advance)', '2026-06-30T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000011', 120000, '2026-07-05', 'UPI', 'UPI-100012', 'Payment for INV-0011 (mid)', '2026-07-05T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000012', 48000, '2026-08-11', 'UPI', 'UPI-100013', 'Payment for INV-0012 (final)', '2026-08-11T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000013', 18000, '2026-07-05', 'UPI', 'UPI-100014', 'Payment for INV-0013 (advance)', '2026-07-05T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000014', 30000, '2026-07-05', 'UPI', 'UPI-100015', 'Payment for INV-0014 (mid)', '2026-07-05T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000015', 12000, '2026-07-27', 'UPI', 'UPI-100016', 'Payment for INV-0015 (final)', '2026-07-27T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000016', 27000, '2026-07-25', 'UPI', 'UPI-100017', 'Payment for INV-0016 (advance)', '2026-07-25T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000017', 45000, '2026-07-25', 'UPI', 'UPI-100018', 'Payment for INV-0017 (mid)', '2026-07-25T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000018', 18000, '2026-08-26', 'UPI', 'UPI-100019', 'Payment for INV-0018 (final)', '2026-08-26T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000019', 22500, '2026-07-30', 'UPI', 'UPI-100020', 'Payment for INV-0019 (advance)', '2026-07-30T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000020', 37500, '2026-07-30', 'UPI', 'UPI-100021', 'Payment for INV-0020 (mid)', '2026-07-30T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000021', 15000, '2026-08-31', 'UPI', 'UPI-100022', 'Payment for INV-0021 (final)', '2026-08-31T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000022', 33000, '2026-08-14', 'UPI', 'UPI-100023', 'Payment for INV-0022 (advance)', '2026-08-14T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000023', 55000, '2026-08-14', 'UPI', 'UPI-100024', 'Payment for INV-0023 (mid)', '2026-08-14T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000024', 22000, '2026-09-15', 'UPI', 'UPI-100025', 'Payment for INV-0024 (final)', '2026-09-15T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000025', 12000, '2026-08-14', 'UPI', 'UPI-100026', 'Payment for INV-0025 (advance)', '2026-08-14T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000026', 20000, '2026-08-14', 'UPI', 'UPI-100027', 'Payment for INV-0026 (mid)', '2026-08-14T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000027', 8000, '2026-09-10', 'UPI', 'UPI-100028', 'Payment for INV-0027 (final)', '2026-09-10T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000028', 43500, '2026-08-29', 'UPI', 'UPI-100029', 'Payment for INV-0028 (advance)', '2026-08-29T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000029', 72500, '2026-08-29', 'UPI', 'UPI-100030', 'Payment for INV-0029 (mid)', '2026-08-29T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000030', 29000, '2026-09-30', 'UPI', 'UPI-100031', 'Payment for INV-0030 (final)', '2026-09-30T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000031', 16500, '2026-08-24', 'UPI', 'UPI-100032', 'Payment for INV-0031 (advance)', '2026-08-24T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000032', 27500, '2026-08-24', 'UPI', 'UPI-100033', 'Payment for INV-0032 (mid)', '2026-08-24T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000033', 11000, '2026-09-20', 'UPI', 'UPI-100034', 'Payment for INV-0033 (final)', '2026-09-20T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000034', 24000, '2026-09-03', 'UPI', 'UPI-100035', 'Payment for INV-0034 (advance)', '2026-09-03T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000035', 40000, '2026-09-03', 'UPI', 'UPI-100036', 'Payment for INV-0035 (mid)', '2026-09-03T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000036', 16000, '2026-09-25', 'UPI', 'UPI-100037', 'Payment for INV-0036 (final)', '2026-09-25T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000037', 12600, '2026-09-28', 'UPI', 'UPI-100038', 'Payment for INV-0037 (advance)', '2026-09-28T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000038', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000038', 21000, '2026-09-28', 'UPI', 'UPI-100039', 'Payment for INV-0038 (mid)', '2026-09-28T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000039', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000039', 8400, '2026-10-15', 'UPI', 'UPI-100040', 'Payment for INV-0039 (final)', '2026-10-15T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000040', 14400, '2026-10-08', 'UPI', 'UPI-100041', 'Payment for INV-0040 (advance)', '2026-10-08T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000041', 24000, '2026-10-08', 'UPI', 'UPI-100042', 'Payment for INV-0041 (mid)', '2026-10-08T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000042', 9600, '2026-10-30', 'UPI', 'UPI-100043', 'Payment for INV-0042 (final)', '2026-10-30T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000043', 75000, '2026-09-13', 'UPI', 'UPI-100044', 'Payment for INV-0043 (advance)', '2026-09-13T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000044', 125000, '2026-09-13', 'UPI', 'UPI-100045', 'Payment for INV-0044 (mid)', '2026-09-13T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000045', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000046', 50000, '2026-10-08', 'UPI', 'UPI-100046', 'Payment for INV-0046 (advance)', '2026-10-08T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000046', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000049', 64500, '2026-10-23', 'UPI', 'UPI-100047', 'Payment for INV-0049 (advance)', '2026-10-23T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000047', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000052', 52500, '2026-11-02', 'UPI', 'UPI-100048', 'Payment for INV-0052 (advance)', '2026-11-02T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000048', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000055', 19500, '2026-11-14', 'UPI', 'UPI-100049', 'Payment for INV-0055 (advance)', '2026-11-14T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000049', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000056', 32500, '2026-11-14', 'UPI', 'UPI-100050', 'Payment for INV-0056 (mid)', '2026-11-14T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000058', 25500, '2026-11-07', 'UPI', 'UPI-100051', 'Payment for INV-0058 (advance)', '2026-11-07T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000061', 69000, '2026-11-12', 'UPI', 'UPI-100052', 'Payment for INV-0061 (advance)', '2026-11-12T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000064', 36000, '2026-11-17', 'UPI', 'UPI-100053', 'Payment for INV-0064 (advance)', '2026-11-17T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000053', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000067', 57000, '2026-11-19', 'UPI', 'UPI-100054', 'Payment for INV-0067 (advance)', '2026-11-19T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000054', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000070', 66000, '2026-11-20', 'UPI', 'UPI-100055', 'Payment for INV-0070 (advance)', '2026-11-20T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at)
VALUES ('p1000000-0000-0000-0000-000000000055', '00000000-0000-0000-0000-000000000001', 'i1000000-0000-0000-0000-000000000073', 28500, '2026-11-21', 'UPI', 'UPI-100056', 'Payment for INV-0073 (advance)', '2026-11-21T12:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Recurring Expenses
INSERT INTO recurring_expenses (id, user_id, name, amount, frequency, next_due_date, category, is_active, created_at, updated_at)
VALUES ('e1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Studio Rent (Indiranagar)', 47000, 'monthly', '2026-12-12', 'rent', true, '2026-05-26T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO recurring_expenses (id, user_id, name, amount, frequency, next_due_date, category, is_active, created_at, updated_at)
VALUES ('e1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Sony FX3 Cinema Kit EMI', 28000, 'monthly', '2026-12-13', 'emi', true, '2026-05-26T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO recurring_expenses (id, user_id, name, amount, frequency, next_due_date, category, is_active, created_at, updated_at)
VALUES ('e1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Assistant Photographer Salary (Rohan)', 35000, 'monthly', '2026-12-14', 'salary', true, '2026-05-26T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO recurring_expenses (id, user_id, name, amount, frequency, next_due_date, category, is_active, created_at, updated_at)
VALUES ('e1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Godox Studio Lighting EMI', 14000, 'monthly', '2026-11-27', 'emi', true, '2026-05-26T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO recurring_expenses (id, user_id, name, amount, frequency, next_due_date, category, is_active, created_at, updated_at)
VALUES ('e1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Drone Kit Lease EMI', 18000, 'monthly', '2026-12-02', 'emi', true, '2026-05-26T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO recurring_expenses (id, user_id, name, amount, frequency, next_due_date, category, is_active, created_at, updated_at)
VALUES ('e1000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Adobe CC & Cloud Storage', 6500, 'monthly', '2026-12-07', 'software', true, '2026-05-26T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO recurring_expenses (id, user_id, name, amount, frequency, next_due_date, category, is_active, created_at, updated_at)
VALUES ('e1000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Studio & Gear Insurance (Annual)', 36000, 'yearly', '2026-12-15', 'insurance', true, '2026-05-26T00:00:00Z', '2026-11-22T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Payment Claims

COMMIT;