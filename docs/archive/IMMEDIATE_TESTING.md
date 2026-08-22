# ProfitPilot - Immediate Testing Instructions

## ⚡ Quick Start (5 Minutes)

### Step 1: Get Test Access Code
Copy any of these codes:
```
PROF0001
PILOT0002
BETA0003
DEMO0004
TEST0005
```

### Step 2: Start the App
```bash
npm run dev
```

### Step 3: Go to Login
Navigate to: **http://localhost:3000/login**

### Step 4: Login with Test Code
- Paste the code in the "Access Code" field
- Click "Login"

### Step 5: Complete Setup
- Enter Business Name: "My Test Business"
- Select Business Type
- Click "Create Business"
- You're in the dashboard! 🎉

---

## ⚠️ Before You Test

You need to have test codes in your database first.

### Quick Setup (2 minutes)

**1. Go to Supabase Dashboard**
- Open your Supabase project
- Click on "SQL Editor" (left sidebar)
- Click "New Query"

**2. Insert Test Codes**
Copy and paste this SQL:

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

**3. Execute**
- Click "Run" button
- Wait for "X rows inserted" message
- Done! ✅

---

## 🧪 Testing Scenarios

### Scenario 1: Complete User Journey (10 min)

1. **Login** with PROF0001
2. **Setup Business** with sample data
3. **Add Sales Record** (5 items, 50,000 naira)
4. **Add Inventory Item** (20 units)
5. **View Dashboard** - see the charts update
6. **Check Reports** - view P&L
7. **Read Help** - check tutorials

### Scenario 2: Sales Management Testing (5 min)

1. Login with PILOT0002
2. Go to Sales section
3. Add 5 sale records with different amounts
4. View the sales list
5. Test search functionality
6. Delete one record
7. Verify totals update

### Scenario 3: Inventory Testing (5 min)

1. Login with BETA0003
2. Go to Inventory section
3. Add 3 different products
4. Add stock to each
5. Update quantities
6. Check low stock warnings
7. Delete one item

### Scenario 4: Reports Testing (5 min)

1. Login with DEMO0004
2. Go to Reports section
3. Add some sales and expenses
4. View P&L statement
5. Check revenue trends
6. Check expense breakdown
7. Verify calculations

---

## 🎯 What to Check

### Functionality
- [x] Login works
- [x] Setup page loads
- [x] Dashboard displays
- [x] Can add sales
- [x] Can add inventory
- [x] Can add expenses
- [x] Reports calculate correctly
- [x] Navigation works

### User Interface
- [x] Layout is clean
- [x] Colors look professional
- [x] Charts display properly
- [x] Forms are easy to use
- [x] Buttons are responsive
- [x] Mobile responsive

### Performance
- [x] Pages load quickly
- [x] No console errors
- [x] Smooth transitions
- [x] Charts animate nicely

---

## 🔍 Debug If Something Breaks

**Open Browser Console:**
1. Press F12 (Windows/Linux) or Cmd+Option+I (Mac)
2. Click "Console" tab
3. Look for red error messages
4. Share the error with support

**Check Network:**
1. Press F12
2. Click "Network" tab
3. Reload page
4. Look for failed requests (red)
5. Check response details

**Clear Cache & Try Again:**
```bash
# Clear browser cache
# Windows: Ctrl + Shift + Delete
# Mac: Cmd + Shift + Delete
```

---

## 📋 Detailed Test Checklist

### Landing Page (/)
- [ ] Page loads
- [ ] Professional design visible
- [ ] "Manage Business" button works
- [ ] "Sign In" button works
- [ ] Features section visible
- [ ] Pricing section visible
- [ ] Footer visible

### Login Page (/login)
- [ ] Page loads with clean design
- [ ] Input field accepts codes
- [ ] Error message shows for invalid code
- [ ] "Don't have code?" link works
- [ ] Login button works
- [ ] Code field is focused initially

### Payment Page (/payment)
- [ ] Page shows pricing
- [ ] Paystack button visible
- [ ] Payment info displayed
- [ ] Back to login link works

### Setup Page (/dashboard/setup)
- [ ] Form fields display
- [ ] All inputs are required
- [ ] Form validation works
- [ ] Submit button creates business
- [ ] Redirects to dashboard

### Dashboard (/dashboard)
- [ ] Shows KPI cards
- [ ] Revenue card displays total
- [ ] Expenses card displays total
- [ ] Profit card displays calculation
- [ ] Revenue chart shows data
- [ ] Expense pie chart displays
- [ ] Recent transactions show
- [ ] Navigation menu appears

### Sales Page (/dashboard/sales)
- [ ] Page loads with table
- [ ] Add Sale button works
- [ ] Modal form opens
- [ ] All fields are required
- [ ] Form submission works
- [ ] New record appears in table
- [ ] Delete button works
- [ ] Search/filter works
- [ ] Date range filter works

### Inventory Page (/dashboard/inventory)
- [ ] Page loads with table
- [ ] Add Item button works
- [ ] Modal form opens
- [ ] Stock update works
- [ ] Low stock badges show (< 5)
- [ ] Delete button works
- [ ] Search works
- [ ] Categories filter works

### Reports Page (/dashboard/reports)
- [ ] Page loads
- [ ] P&L statement shows
- [ ] Revenue section displays
- [ ] Expense section displays
- [ ] Calculations are correct
- [ ] Charts load properly
- [ ] Period selector works
- [ ] Data updates correctly

### Help Page (/dashboard/help)
- [ ] Getting started guide loads
- [ ] Tutorial section displays
- [ ] FAQ section shows questions
- [ ] Answers expand/collapse
- [ ] Contact form visible
- [ ] Video embeds load (if any)

### Settings Page (/dashboard/settings)
- [ ] Business details display
- [ ] Edit form opens
- [ ] Update button works
- [ ] Changes are saved
- [ ] Logout button works

---

## 🚀 Next Steps After Testing

1. **Review all documentation**
   - Read TESTING_GUIDE.md for detailed tests
   - Read FEATURES_CHECKLIST.md for all features
   - Read APPLICATION_FLOW.md for user flows

2. **Customize for Production**
   - Change business name in landing page
   - Update colors if needed
   - Add your own branding
   - Configure real Paystack keys

3. **Deploy**
   - Follow DEPLOYMENT_CHECKLIST.md
   - Deploy to Vercel
   - Set up production database
   - Test payment flow

4. **Launch**
   - Announce the software
   - Start accepting payments
   - Monitor for issues

---

## 💡 Pro Tips

- Use the same test code multiple times
- Add different types of data to test sorting
- Try adding large numbers to check calculations
- Test on mobile device for responsive design
- Use different browsers for compatibility
- Check console for any warnings

---

## 📞 Support Resources

- **TEST_CODES.md** - Detailed test code info
- **TESTING_GUIDE.md** - Complete testing procedures
- **QUICK_START.md** - Quick setup guide
- **GETTING_STARTED.md** - Feature overview
- **FEATURES_CHECKLIST.md** - All features list

---

## ✅ Success Criteria

You've successfully tested ProfitPilot when:

✅ Can login with test code
✅ Can complete business setup
✅ Dashboard loads with data
✅ Can add sales record
✅ Can add inventory item
✅ Can add expense
✅ Reports calculate correctly
✅ Charts display data
✅ Navigation works properly
✅ No console errors
✅ Mobile responsive
✅ All buttons work

**You're ready to use ProfitPilot!** 🎉

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Invalid access code" | Check code is in database (Supabase) |
| Can't login | Clear browser cache, try different code |
| Dashboard won't load | Check Supabase connection, refresh |
| Charts empty | Add sales/expense records first |
| Button doesn't work | Open console (F12), check for errors |
| Mobile looks broken | Clear cache, refresh page |

---

**Ready to test? Start with the Quick Start section above! 🚀**
