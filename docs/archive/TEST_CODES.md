# ProfitPilot - Test Access Codes

## Ready-to-Use Test Codes

Use any of these codes to test ProfitPilot immediately:

```
PROF0001
PILOT0002
BETA0003
DEMO0004
TEST0005
TRIAL0006
DEVEL0007
SAMPLE0008
SETUP0009
CHECK0010
```

## How to Use

1. **Start the Application**
   ```bash
   npm run dev
   ```

2. **Navigate to Login**
   - Go to: http://localhost:3000/login

3. **Enter Test Code**
   - Copy any code from the list above
   - Paste it into the "Access Code" field
   - Click "Login"

4. **Complete Setup**
   - Enter your business details
   - Click "Create Business"
   - You'll be redirected to the dashboard

5. **Start Testing**
   - Add sales records
   - Add inventory items
   - Add expenses
   - View reports and analytics

## Important Notes

⚠️ **Database Setup Required:**
Before using these codes, you must:
1. Have Supabase connected
2. Run the database migration: `scripts/001_create_tables.sql`
3. Insert test codes into database (see below)

## Inserting Codes Into Database

### Option A: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Open **SQL Editor**
3. Create a new query
4. Copy and paste this SQL:

```sql
INSERT INTO access_codes (code, is_active, created_at) 
VALUES 
  ('PROF0001', true, NOW()),
  ('PILOT0002', true, NOW()),
  ('BETA0003', true, NOW()),
  ('DEMO0004', true, NOW()),
  ('TEST0005', true, NOW()),
  ('TRIAL0006', true, NOW()),
  ('DEVEL0007', true, NOW()),
  ('SAMPLE0008', true, NOW()),
  ('SETUP0009', true, NOW()),
  ('CHECK0010', true, NOW());
```

5. Click **Run**
6. You should see: "10 rows affected"

### Option B: Using Script

1. Run the code generator:
   ```bash
   node scripts/generateTestCode.js
   ```

2. Copy the generated SQL
3. Paste into Supabase SQL Editor
4. Execute

### Option C: Manual Entry

1. In Supabase Dashboard → Table Editor
2. Click the **access_codes** table
3. Click **Insert row**
4. Enter each code manually (takes longer)

## Verifying Setup

To confirm codes are in the database:

1. Go to Supabase Dashboard
2. Open Table Editor
3. Click **access_codes** table
4. You should see your codes listed

## Troubleshooting

**Codes not working?**

Check:
1. Are codes in the `access_codes` table? (check Supabase)
2. Is `is_active` set to `true`?
3. Is the code exactly 8 characters?
4. Have you refreshed the app after inserting codes?

**Getting "Invalid access code" error?**

Try:
1. Copy code directly from this file (no typos)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try a different code from the list
4. Check Supabase connection (NEXT_PUBLIC_SUPABASE_URL)

## Generate Custom Codes

Create your own test codes using the generator:

```bash
node scripts/generateTestCode.js
```

This will:
- Generate 5 random 8-character codes
- Show the SQL insert statement
- You can copy & paste the SQL into Supabase

## Test Flow

```
Landing Page (/)
    ↓
"Manage Business" Button
    ↓
Login Page (/login)
    ↓
Enter Test Code (e.g., PROF0001)
    ↓
Click Login
    ↓
Setup Page (/dashboard/setup)
    ↓
Enter Business Details
    ↓
Click "Create Business"
    ↓
Dashboard (/dashboard)
    ↓
Start Using Features!
```

## What to Test

After logging in:

1. **Dashboard**
   - View KPI cards
   - Check charts load
   - Navigation menu works

2. **Sales**
   - Add new sale
   - View sales list
   - Delete sales
   - Search functionality

3. **Inventory**
   - Add products
   - Update stock
   - Delete items
   - Low stock warnings

4. **Reports**
   - P&L statement
   - Revenue chart
   - Expense breakdown

5. **Help & Tutorials**
   - Getting started guide
   - Feature tutorials
   - FAQ section

6. **Settings**
   - View business info
   - Update business details
   - View account

## Quick Reference

| Task | Access Code |
|------|-------------|
| Feature Testing | BETA0003 |
| Sales Testing | TEST0005 |
| Inventory Testing | DEVEL0007 |
| Reports Testing | CHECK0010 |
| General Demo | DEMO0004 |
| Full Testing | Any code |

## Sample Business Data (for testing)

After login with test code, use these sample values:

**Business Setup:**
- Name: "Test Business Inc"
- Type: "Retail"
- Industry: "Electronics"
- Location: "Lagos, Nigeria"
- Email: "test@testbusiness.com"
- Phone: "+234 800 000 0000"

**Sample Sale:**
- Customer: "John Doe"
- Item: "Product A"
- Quantity: 5
- Price: 10000

**Sample Inventory:**
- Product: "Item 1"
- Category: "Electronics"
- Price: 25000
- Stock: 20

## Next Steps

After testing:
1. Review all documentation files
2. Customize the software for your needs
3. Deploy to Vercel
4. Set up Paystack production keys
5. Launch!

For detailed testing procedures, see **TESTING_GUIDE.md**
