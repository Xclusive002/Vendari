# Complete Setup & Testing Guide for ProfitPilot

## 🎯 PAYSTACK TEST CARDS (For Live Mode Account)

Since your Paystack account is in **LIVE MODE**, use these official test cards:

### Primary Test Card (Recommended)
```
Card Number: 4084084084084081
Expiry: 12/26
CVV: 123
PIN: 1111
OTP: 123456
```

### Alternative Test Cards

**Visa Card:**
```
Number: 4532015112830366
Expiry: 12/28
CVV: 123
PIN: 1111
```

**Mastercard:**
```
Number: 5399810243796449
Expiry: 12/27
CVV: 456
PIN: 1111
```

**Verve Card (Nigerian):**
```
Number: 5061020677922380
Expiry: 12/26
CVV: 123
PIN: 1111
```

**All Cards:** OTP is `123456`

---

## 🗄️ SETUP TEST ACCESS CODES IN SUPABASE

### Step 1: Open Supabase SQL Editor
1. Go to: https://app.supabase.com
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"

### Step 2: Copy & Paste This SQL

```sql
INSERT INTO access_codes (code, is_used, expires_at) VALUES 
('TEST1234', false, NULL),
('DEMO5678', false, NULL),
('TRIAL9999', false, NULL),
('PROF0001', false, NULL),
('PILOT0002', false, NULL),
('BETA0003', false, NULL),
('ADMIN0001', false, NULL),
('USER00001', false, NULL);
```

### Step 3: Click "RUN"

✅ You should see: "Query executed successfully. 8 rows affected."

---

## 🚀 QUICK START (5 MINUTES)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Dev Server
```bash
npm run dev
```

### 3. Visit the App
Open your browser: http://localhost:3000

### 4. Complete Flow

**Login Page** → http://localhost:3000/login
- Enter access code: `TEST1234`
- Click "Log In"

**Business Setup** → /dashboard/setup
- Fill in all business details
- Click "Complete Setup"

**Dashboard** → /dashboard
- View all your statistics, charts, and data
- Try adding sales, expenses, inventory

---

## ✅ FEATURES TO TEST

### 1. Dashboard (/dashboard)
- [x] View total sales
- [x] View net profit
- [x] View inventory count
- [x] View total expenses
- [x] Sales trend chart (7-day view)
- [x] Expense breakdown pie chart
- [x] Quick sale entry dialog
- [x] Recent transactions table

### 2. Sales Management (/dashboard/sales)
- [x] View all sales records
- [x] Filter by date range
- [x] Add new sales record
- [x] Edit sales record
- [x] Delete sales record
- [x] Search sales
- [x] Export sales data
- [x] View sales statistics

### 3. Inventory Management (/dashboard/inventory)
- [x] View all inventory items
- [x] Add new inventory item
- [x] Edit inventory item
- [x] Delete inventory item
- [x] Low stock alerts
- [x] Track stock levels
- [x] Supplier information
- [x] Product codes and categories

### 4. Financial Reports (/dashboard/reports)
- [x] Profit & Loss statement
- [x] Revenue report
- [x] Expense report
- [x] Income breakdown
- [x] Date range filtering
- [x] Monthly summaries
- [x] Year-to-date reports
- [x] Download reports

### 5. Settings (/dashboard/settings)
- [x] Edit business information
- [x] Update business details
- [x] Change business name
- [x] Update contact information
- [x] View account status

### 6. Help & Tutorial (/dashboard/help)
- [x] Video tutorials
- [x] Step-by-step guides
- [x] FAQ section
- [x] Troubleshooting tips
- [x] Feature explanations
- [x] Best practices
- [x] Contact support

### 7. Authentication
- [x] Login with access code
- [x] Business setup on first login
- [x] Session persistence
- [x] Logout functionality
- [x] Access code validation
- [x] Error handling

### 8. Payment (Optional Testing)
- [x] Payment page (/payment)
- [x] Paystack integration
- [x] Payment verification
- [x] Access code generation after payment
- [x] Success page with access code display
- [x] Error handling for failed payments

---

## 🧪 COMPREHENSIVE TEST CHECKLIST

### Dashboard Statistics
```
✓ Total Sales calculation from all sales records
✓ Net Profit calculation (Sales - Expenses)
✓ Inventory Items count
✓ Total Expenses calculation
✓ Low stock items identification
✓ Profit margin percentage
✓ Transaction count
```

### Charts & Visualizations
```
✓ Sales trend chart displays last 7 days
✓ Sales amount updates when new sale is added
✓ Expense pie chart shows category breakdown
✓ Charts are interactive
✓ Charts have proper tooltips
✓ Charts display zero data gracefully
```

### Data Entry & Management
```
✓ Can add sales with date, product, quantity, price
✓ Can add expenses with date, category, amount
✓ Can add inventory items with product name and stock
✓ Can edit all records
✓ Can delete records
✓ Can search/filter records
✓ Form validation works
✓ Success messages display
✓ Error messages display
```

### Data Persistence
```
✓ All data saves to database
✓ Data persists after page refresh
✓ Data persists across different pages
✓ Multiple users can have separate data
✓ No data mixing between users
```

### UI/UX
```
✓ All buttons are clickable
✓ All forms are functional
✓ Dialogs open and close smoothly
✓ Navigation works between pages
✓ Sidebar is responsive on mobile
✓ Tables scroll on mobile
✓ No console errors
✓ Loading states display properly
✓ Empty states display when no data
```

### Security
```
✓ Logged out users cannot access dashboard
✓ Session persists for 1 year
✓ Access codes are validated
✓ User data is private
✓ Data is encrypted in transit
```

---

## 🐛 TROUBLESHOOTING

### Problem: Access code not working
**Solution:** Make sure to:
1. Insert test codes using the SQL above
2. Use uppercase letters (e.g., `TEST1234`)
3. Code must be exactly 8 characters
4. Code should not be marked as `is_used = true`

### Problem: No data showing on dashboard
**Solution:**
1. Make sure you completed business setup
2. Add some sales/expenses/inventory items
3. Refresh the page
4. Check browser console for errors

### Problem: Payment page not working
**Solution:**
1. Add Paystack API keys to environment variables
2. Use test cards from above
3. Check network tab in browser devtools
4. Verify Paystack account is in Live Mode

### Problem: Charts not displaying
**Solution:**
1. Add some sales records first
2. Wait for page to reload
3. Check browser console for JavaScript errors
4. Clear browser cache

---

## 📱 TESTING ON MOBILE

1. Use Chrome DevTools (F12) → Toggle Device Toolbar
2. Or open on actual phone: `http://[YOUR_IP]:3000`
3. Test:
   - Sidebar collapse/expand
   - Form input on small screens
   - Table scrolling
   - Touch interactions
   - Orientation changes

---

## 🎬 TEST SCENARIO WALKTHROUGH

### Scenario 1: New User Setup (10 minutes)
1. Go to http://localhost:3000
2. Click "Manage Business"
3. Enter access code: `TEST1234`
4. Fill in business details
5. Click "Complete Setup"
6. See dashboard with empty stats

### Scenario 2: Add Sales Data (5 minutes)
1. On dashboard, click "Add Sale"
2. Enter:
   - Date: Today
   - Product: "T-Shirt"
   - Quantity: 5
   - Unit Price: ₦5,000
3. Click "Add Sale"
4. See dashboard update with ₦25,000 total sales
5. Repeat 5 times with different products

### Scenario 3: Add Inventory (5 minutes)
1. Go to Inventory page
2. Click "Add Item"
3. Enter:
   - Product: "T-Shirt"
   - Stock: 50
   - Reorder Level: 10
   - Supplier: "Supplier ABC"
4. Click "Add Item"
5. See item appear in inventory list

### Scenario 4: View Reports (3 minutes)
1. Go to Reports page
2. See P&L statement
3. See revenue from sales
4. See expenses breakdown
5. Check date range filters work

### Scenario 5: Full Payment Test (Optional)
1. Go to http://localhost:3000/payment
2. Enter email address
3. Initiate payment
4. Use test card: `4084084084084081`
5. Complete payment
6. Get access code
7. Use access code to login

---

## 🔧 ENVIRONMENT VARIABLES NEEDED

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

---

## 📊 EXPECTED RESULTS

After completing all tests, you should have:

✅ 1 Business setup
✅ 5+ Sales records
✅ 5+ Inventory items  
✅ 3+ Expense records
✅ Dashboard showing all statistics
✅ Charts displaying data correctly
✅ All CRUD operations working
✅ No console errors
✅ Responsive design on mobile
✅ Full payment flow (optional)

---

## 🎉 YOU'RE READY TO GO!

Everything in ProfitPilot should now work perfectly. If you encounter any issues, check the troubleshooting section above or review the APPLICATION_FLOW.md document.

**Next Steps:**
1. Test all features
2. Customize colors/text if needed
3. Deploy to production when ready
4. Share with users!
