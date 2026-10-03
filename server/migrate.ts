import { db } from "./db";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function runMigrations() {
  console.log("Running database migrations...");

  await db.execute(sql`
    ALTER TABLE accounts ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW()
  `);

  await db.execute(sql`
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW()
  `);

  await db.execute(sql`
    ALTER TABLE debts ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW()
  `);

  await db.execute(sql`
    ALTER TABLE debts ADD COLUMN IF NOT EXISTS planned_payment NUMERIC(12,2)
  `);

  await db.execute(sql`
    ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW()
  `);

  await db.execute(sql`
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category TEXT
  `);

  await db.execute(sql`
    ALTER TABLE accounts ADD COLUMN IF NOT EXISTS monthly_allocation NUMERIC(12,2) NOT NULL DEFAULT 0
  `);

  // One-time backfill: restore planned monthly amounts that used to live in current_balance
  // before BankSync started writing live balances into that column.
  await db.execute(sql`
    UPDATE accounts SET monthly_allocation = 7550
    WHERE monthly_allocation = 0 AND name ILIKE 'Family USAA Checking'
  `);
  await db.execute(sql`
    UPDATE accounts SET monthly_allocation = 300
    WHERE monthly_allocation = 0 AND name ILIKE 'Jamie USAA Checking'
  `);
  await db.execute(sql`
    UPDATE accounts SET monthly_allocation = 4179
    WHERE monthly_allocation = 0 AND (
      name ILIKE 'Chime Prepaid%' OR name ILIKE 'Chime Checking'
    )
  `);
  // Ensure family Chime Savings exists as its own row (BankSync fills the live balance)
  await db.execute(sql`
    INSERT INTO accounts (
      name, institution, account_number, account_type,
      monthly_allocation, current_balance, owner, notes, is_active
    )
    SELECT
      'Chime Savings', 'Chime', '', 'savings',
      0, 0, 'Joint',
      'Chime savings (synced via BankSync when linked)', true
    WHERE NOT EXISTS (
      SELECT 1 FROM accounts WHERE name ILIKE 'Chime Savings'
    )
  `);
  await db.execute(sql`
    UPDATE accounts
    SET monthly_allocation = 0,
        last_updated = NOW()
    WHERE name ILIKE 'Kevin NFCU Checking'
      AND monthly_allocation::numeric = 200
  `);
  await db.execute(sql`
    UPDATE savings_allocations
    SET amount = 0,
        is_active = false,
        notes = 'NFCU allowance paused — monthly allocation is $0'
    WHERE name ILIKE 'Kevin NFCU Allowance'
      AND amount::numeric = 200
  `);
  await db.execute(sql`
    UPDATE accounts SET monthly_allocation = 75
    WHERE monthly_allocation = 0 AND name ILIKE 'Kevin Greenwood%'
  `);
  await db.execute(sql`
    UPDATE accounts SET monthly_allocation = 100
    WHERE monthly_allocation = 0 AND (
      name ILIKE '%Schwab Roth%' OR name ILIKE 'Roth Contributory IRA'
    )
  `);

  // Jamie Sep 2025 sheet: split paycheck out of Family checking; refresh SC debt balances.
  await db.execute(sql`
    UPDATE accounts
    SET monthly_allocation = 4954.10,
        notes = 'Biweekly $2,477.05 × 2. Aug 2025: $1800 put back as we no longer pay for private schooling',
        last_updated = NOW()
    WHERE name ILIKE 'Family USAA Checking'
      AND monthly_allocation IN (7550, 2735.24, 4954.10)
  `);
  await db.execute(sql`
    UPDATE accounts
    SET monthly_allocation = 4814.76,
        notes = 'Same as Jamie Paycheck — biweekly $2,407.38 × 2',
        last_updated = NOW()
    WHERE name ILIKE 'Jamie USAA Checking'
      AND monthly_allocation IN (0, 4814.76)
  `);
  await db.execute(sql`
    UPDATE incomes
    SET amount = 4954.10,
        notes = 'Biweekly $2,477.05 × 2 deposited to Family USAA Checking'
    WHERE name = 'Family USAA Income'
      AND amount::numeric IN (7550, 2735.24, 4954.10)
  `);
  await db.execute(sql`
    UPDATE incomes
    SET is_active = false,
        amount = 0,
        notes = 'Obsolete — replaced by Jamie Paycheck (same as Jamie USAA Checking monthly)'
    WHERE name = 'Jamie USAA Income'
  `);
  await db.execute(sql`
    UPDATE savings_allocations
    SET is_active = false,
        amount = 0,
        notes = 'Obsolete $300 leftover removed Sep 2025'
    WHERE name = 'Jamie USAA Savings'
  `);
  await db.execute(sql`
    INSERT INTO incomes (name, amount, frequency, notes, is_active)
    SELECT 'Jamie Paycheck', 4814.76, 'monthly',
           'Biweekly $2,407.38 × 2 — same as Jamie USAA Checking monthly allocation', true
    WHERE NOT EXISTS (SELECT 1 FROM incomes WHERE name = 'Jamie Paycheck')
  `);
  await db.execute(sql`
    UPDATE incomes
    SET amount = 4814.76,
        notes = 'Biweekly $2,407.38 × 2 — same as Jamie USAA Checking monthly allocation',
        is_active = true,
        account_id = (SELECT id FROM accounts WHERE name ILIKE 'Jamie USAA Checking' LIMIT 1)
    WHERE name = 'Jamie Paycheck'
      AND (
        account_id IS NULL
        OR account_id = (SELECT id FROM accounts WHERE name ILIKE 'Jamie USAA Checking' LIMIT 1)
      )
      AND notes NOT ILIKE '%DD to Jamie Chime%'
  `);
  await db.execute(sql`
    UPDATE expenses
    SET notes = 'Average Cost — includes Chuck E. Cheese monthly pass (~$11.99)',
        last_updated = NOW()
    WHERE name ILIKE 'Eating out/Entertainment'
  `);
  await db.execute(sql`
    UPDATE expenses
    SET notes = 'Paused — payment tracked on Student Loan - Jamie debt',
        is_active = false,
        last_updated = NOW()
    WHERE name ILIKE 'Student Loans (Jamie)'
  `);

  // Drop mistaken second Kevin loan if a prior migrate/seed created it
  await db.execute(sql`
    DELETE FROM debts WHERE name = 'Student Loan - Kevin #2'
  `);

  // One-time student loan corrections (skip once balances leave the pre-fix values)
  await db.execute(sql`
    UPDATE debts
    SET current_balance = 8303.14,
        original_balance = 21000.00,
        minimum_payment = 0,
        notes = 'Federal student loan (HB)',
        owner = 'Kevin',
        is_paid_off = false,
        last_updated = NOW()
    WHERE name ILIKE 'Student Loan - Kevin'
      AND name NOT ILIKE '%#2%'
      AND current_balance::numeric IN (149320, 8303.14)
  `);
  await db.execute(sql`
    UPDATE debts
    SET current_balance = 163000.00,
        original_balance = 163000.00,
        minimum_payment = 137,
        notes = 'Federal student loan (SC). Total includes $9,498.91 for her PhD program.',
        owner = 'Jamie',
        is_paid_off = false,
        last_updated = NOW()
    WHERE name ILIKE 'Student Loan - Jamie'
      AND current_balance::numeric IN (9498.91, 163000)
  `);
  await db.execute(sql`
    UPDATE debts
    SET notes = 'Federal student loan (SC). Total includes $9,498.91 for her PhD program.',
        last_updated = NOW()
    WHERE name ILIKE 'Student Loan - Jamie'
      AND owner = 'Jamie'
      AND (notes IS NULL OR notes NOT ILIKE '%PhD program%')
  `);

  // Jamie sheet balances — apply only while still at older seed figures
  await db.execute(sql`
    UPDATE debts SET current_balance = 19706, last_updated = NOW()
    WHERE name = 'NFCU Visa - Jamie #1' AND current_balance::numeric IN (19316.58, 19706)
  `);
  await db.execute(sql`
    UPDATE debts SET current_balance = 19706, last_updated = NOW()
    WHERE name = 'NFCU Visa - Jamie #2' AND current_balance::numeric IN (19591.90, 19706)
  `);
  await db.execute(sql`
    UPDATE debts SET current_balance = 6088.12, last_updated = NOW()
    WHERE name = 'USAA Visa - Jamie' AND current_balance::numeric IN (6073.10, 6088.12)
  `);
  await db.execute(sql`
    UPDATE debts SET current_balance = 6916, last_updated = NOW()
    WHERE name = 'Best Buy' AND owner = 'Jamie' AND current_balance::numeric IN (7100, 6916)
  `);
  await db.execute(sql`
    UPDATE debts SET current_balance = 4402, last_updated = NOW()
    WHERE name = 'Paypal Credit - Jamie' AND current_balance::numeric IN (4987.88, 4402)
  `);
  await db.execute(sql`
    UPDATE debts SET current_balance = 1428, last_updated = NOW()
    WHERE name = 'Paypal Mastercard - Jamie' AND current_balance::numeric IN (1433.87, 1428)
  `);
  await db.execute(sql`
    UPDATE debts SET current_balance = 1342, last_updated = NOW()
    WHERE name = 'AMEX - Jamie' AND current_balance::numeric IN (2047.89, 1342)
  `);
  await db.execute(sql`
    UPDATE debts
    SET current_balance = 1768.66,
        minimum_payment = 355.22,
        planned_payment = 355.22,
        notes = 'As of 9/15. Bi-monthly: Sep 30 $355.22, Oct 15 $199.77',
        last_updated = NOW()
    WHERE name = 'Affirm Payments - Jamie'
      AND current_balance::numeric IN (1672, 1768.66)
  `);
  await db.execute(sql`
    UPDATE debts SET current_balance = 828.73, last_updated = NOW()
    WHERE name = 'Old Navy' AND owner = 'Jamie' AND current_balance::numeric IN (1100, 828.73)
  `);
  await db.execute(sql`
    UPDATE debts
    SET notes = 'Confirm live balance via direct Barclays access',
        last_updated = NOW()
    WHERE name = 'Barclays - Jamie'
      AND NOT is_paid_off
      AND (notes IS NULL OR notes NOT ILIKE '%Confirm live balance%')
  `);

  // New Jamie installment debts (idempotent insert)
  await db.execute(sql`
    INSERT INTO debts (name, creditor, debt_type, current_balance, minimum_payment, planned_payment, owner, is_paid_off, notes)
    SELECT 'Afterpay - Jamie', 'Afterpay', 'pay_later', 144.25, 87.84, 87.84, 'Jamie', false,
           'Bi-monthly: Sep 30 $87.84, Oct 15 $56.41'
    WHERE NOT EXISTS (SELECT 1 FROM debts WHERE name = 'Afterpay - Jamie')
  `);
  await db.execute(sql`
    INSERT INTO debts (name, creditor, debt_type, current_balance, minimum_payment, planned_payment, owner, is_paid_off, notes)
    SELECT 'Cherry Credit - Jamie', 'Cherry', 'pay_later', 186.55, 93.29, 93.29, 'Jamie', false,
           'Dental work. $93.29 due Oct/Nov then paid off'
    WHERE NOT EXISTS (SELECT 1 FROM debts WHERE name = 'Cherry Credit - Jamie')
  `);
  await db.execute(sql`
    INSERT INTO debts (name, creditor, debt_type, current_balance, minimum_payment, planned_payment, owner, is_paid_off, notes)
    SELECT 'Upgrade Flights - Jamie', 'Upgrade', 'other', 221.02, 77.21, 77.21, 'Jamie', false,
           '$77.21 once a month'
    WHERE NOT EXISTS (SELECT 1 FROM debts WHERE name = 'Upgrade Flights - Jamie')
  `);
  await db.execute(sql`
    INSERT INTO debts (name, creditor, debt_type, current_balance, minimum_payment, planned_payment, owner, is_paid_off, notes)
    SELECT 'Upgrade Personal Loan - Jamie', 'Upgrade', 'other', 1805.47, 82.52, 82.52, 'Jamie', false,
           '$82.52 once a month'
    WHERE NOT EXISTS (SELECT 1 FROM debts WHERE name = 'Upgrade Personal Loan - Jamie')
  `);

  // Restore SC retirement assets to original static seed values.
  // Schwab BankSync previously wrote the live Roth balance onto Roth IRA - SC by mistake;
  // live Schwab Roth now maps to Roth IRA - HB only.
  await db.execute(sql`
    UPDATE assets
    SET value = 1116.32,
        notes = NULL,
        last_updated = NOW()
    WHERE name ILIKE 'Roth IRA - SC'
  `);
  await db.execute(sql`
    UPDATE assets
    SET value = 2649.73,
        notes = NULL,
        last_updated = NOW()
    WHERE name ILIKE 'Traditional IRA - SC'
  `);

  // Align asset nicknames with ownership: HB = Kevin, SC = Jamie
  await db.execute(sql`
    UPDATE accounts
    SET owner = 'Kevin',
        name = 'Schwab Roth IRA - HB',
        last_updated = NOW()
    WHERE name ILIKE '%Schwab%Roth%'
       OR (institution ILIKE '%Schwab%' AND name ILIKE '%roth%')
  `);
  await db.execute(sql`
    UPDATE assets
    SET owner = 'Kevin',
        last_updated = NOW()
    WHERE name ILIKE '% HB'
       OR name ILIKE '%- HB'
       OR name ILIKE 'Schwab Roth IRA%'
       OR name ILIKE '%401k - HB'
  `);
  await db.execute(sql`
    UPDATE assets
    SET owner = 'Jamie',
        last_updated = NOW()
    WHERE name ILIKE '% SC'
       OR name ILIKE '%- SC'
  `);

  // Ensure guest user password is set to the correct value
  const guestHash = await bcrypt.hash("community-money", 10);
  await db.execute(
    sql`UPDATE users SET password_hash = ${guestHash}, updated_at = NOW() WHERE username = 'guest'`
  );

  // Mrs. La'Toya Ray, CPA — Jamie's financial therapist (read-only / role=user)
  const latoyaHash = await bcrypt.hash("latoya-view", 10);
  await db.execute(sql`
    INSERT INTO users (username, email, password_hash, role)
    SELECT 'latoyaray', 'latoyaray@example.com', ${latoyaHash}, 'user'
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'latoyaray')
  `);

  // Oct 2026 — Jamie paycheck plan: DD → Chime Checking, then split each check.
  // Net $2,407.38 × 2 = $4,814.76 → Savings $3,214.76 + Chime keep $1,300 + USAA fun $300.
  await db.execute(sql`
    INSERT INTO accounts (
      name, institution, account_number, account_type,
      monthly_allocation, current_balance, owner, notes, is_active
    )
    SELECT
      'Jamie Chime Checking', 'Chime', '', 'checking',
      1300, 0, 'Jamie',
      'Main DD landing. Keeps $650/paycheck ($1,300/mo); rest transfers out. Not BankSync’d yet.',
      true
    WHERE NOT EXISTS (
      SELECT 1 FROM accounts
      WHERE owner = 'Jamie'
        AND institution ILIKE 'Chime'
        AND account_type = 'checking'
        AND name ILIKE '%chime%'
        AND name NOT ILIKE '%savings%'
    )
  `);
  await db.execute(sql`
    UPDATE accounts
    SET monthly_allocation = 1300,
        notes = 'Main DD landing. Keeps $650/paycheck ($1,300/mo); rest transfers out. Not BankSync’d yet.',
        is_active = true,
        last_updated = NOW()
    WHERE owner = 'Jamie'
      AND institution ILIKE 'Chime'
      AND account_type = 'checking'
      AND name ILIKE '%chime%'
      AND name NOT ILIKE '%savings%'
  `);
  await db.execute(sql`
    UPDATE accounts
    SET monthly_allocation = 300,
        notes = 'Fun money — $150/paycheck ($300/mo) from Jamie Chime',
        last_updated = NOW()
    WHERE name ILIKE 'Jamie USAA Checking'
  `);
  await db.execute(sql`
    UPDATE accounts
    SET monthly_allocation = 3214.76,
        notes = 'Jamie settlement pot — $1,607.38/paycheck ($3,214.76/mo). CC payments paused; save for settlements.',
        last_updated = NOW()
    WHERE name ILIKE 'Chime Savings'
      AND (owner = 'Joint' OR owner IS NULL OR owner = '')
  `);
  await db.execute(sql`
    UPDATE incomes
    SET amount = 4814.76,
        notes = 'Biweekly $2,407.38 × 2 — DD to Jamie Chime Checking, then split (see Jamie page)',
        is_active = true,
        account_id = NULL
    WHERE name = 'Jamie Paycheck'
  `);
  await db.execute(sql`
    INSERT INTO savings_allocations (name, amount, notes, is_active, account_id)
    SELECT
      'Jamie Settlement Pot',
      3214.76,
      'From Jamie paycheck → Chime Savings. CC mins paused; hold for future settlements. $1,607.38 × 2',
      true,
      (SELECT id FROM accounts WHERE name ILIKE 'Chime Savings' AND (owner = 'Joint' OR owner IS NULL OR owner = '') LIMIT 1)
    WHERE NOT EXISTS (SELECT 1 FROM savings_allocations WHERE name = 'Jamie Settlement Pot')
  `);
  await db.execute(sql`
    UPDATE savings_allocations
    SET amount = 3214.76,
        is_active = true,
        notes = 'From Jamie paycheck → Chime Savings. CC mins paused; hold for future settlements. $1,607.38 × 2',
        account_id = (SELECT id FROM accounts WHERE name ILIKE 'Chime Savings' AND (owner = 'Joint' OR owner IS NULL OR owner = '') LIMIT 1)
    WHERE name = 'Jamie Settlement Pot'
  `);
  await db.execute(sql`
    INSERT INTO savings_allocations (name, amount, notes, is_active, account_id)
    SELECT
      'Jamie Fun Money',
      300,
      'From Jamie paycheck → USAA Checking. $150 × 2',
      true,
      (SELECT id FROM accounts WHERE name ILIKE 'Jamie USAA Checking' LIMIT 1)
    WHERE NOT EXISTS (SELECT 1 FROM savings_allocations WHERE name = 'Jamie Fun Money')
  `);
  await db.execute(sql`
    UPDATE savings_allocations
    SET amount = 300,
        is_active = true,
        notes = 'From Jamie paycheck → USAA Checking. $150 × 2',
        account_id = (SELECT id FROM accounts WHERE name ILIKE 'Jamie USAA Checking' LIMIT 1)
    WHERE name = 'Jamie Fun Money'
  `);

  console.log("Database migrations completed.");
}
