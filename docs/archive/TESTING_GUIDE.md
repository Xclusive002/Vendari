# ProfitPilot - Testing Guide

## Quick Start - Generate Test Access Code

### Method 1: Using the Code Generator Script (Recommended)

1. **Run the generator script:**
   ```bash
   node scripts/generateTestCode.js
   ```

2. **You'll see output like this:**
   ```
   Generated Test Access Codes:

   1. K7M9P2L5
   2. Q3X8R1T4
   3. V6W2S9N7
   4. B4C7D1E8
   5. F9G2H5J3
   ```

3. **Copy any code** from the list

4. **Go to http://localhost:3000/login** and paste it in the Access Code field

### Method 2: Manual Database Entry

If you have direct access to your Supabase database:

1. Go to Supabase Dashboard
2. Open the SQL Editor
3. Run this command to insert test codes:

```sql
INSERT INTO access_codes (code, is_active, created_at) 
VALUES 
  ('TEST1234', true, NOW()),
  ('DEMO5678', true, NOW()),
  ('TRIAL9999', true, NOW()),
  ('DEVEL234', true, NOW()),
  ('BETA5678', true, NOW());
```

4. The codes are now available for testing

### Method 3: Hardcoded Test Codes (Development Only)

For immediate testing without database setup, here are predefined codes:

```
TEST1234
DEMO5678
TRIAL9999
DEVEL234
BETA5678
```

## Testing Workflow

### 1. Login with Access Code
- Navigate to: `http://localhost:3000/login`
- Paste any generated access code
- Click "Login"

### 2. First-Time User Setup
After login, you'll be taken to the business setup page where you can enter:
- Business Name
- Business Type (Retail, Service, Manufacturing, etc.)
- Industry
- Location
- Contact Email
- Phone Number

### 3. Main Dashboard
After setup, you'll access the main dashboard with:
- Sales overview cards
- Revenue chart
- Expense pie chart
- Recent transactions
- Navigation to other modules

## Feature Testing Checklist

### Dashboard
- [ ] View total sales
- [ ] View total expenses
- [ ] View profit calculation
- [ ] View revenue trend chart
- [ ] View expense breakdown pie chart
- [ ] Navigation menu works

### Sales Management
- [ ] Add new sale record
- [ ] View all sales
- [ ] Delete sale record
- [ ] Filter by date range
- [ ] Search functionality works
- [ ] Calculate daily totals

### Inventory Management
- [ ] Add inventory item
- [ ] View all items
- [ ] Update stock quantity
- [ ] Delete item
- [ ] Low stock warnings (< 5 units)
- [ ] Search items

### Reports
- [ ] View P&L statement
- [ ] Revenue summary by period
- [ ] Expense breakdown
- [ ] Profit trend
- [ ] Export functionality (if implemented)

### Help & Tutorial
- [ ] View getting started guide
- [ ] View feature tutorials
- [ ] Access FAQ section
- [ ] Contact support form

### Settings
- [ ] View business details
- [ ] Update business information
- [ ] View account info
- [ ] Logout functionality

## Sample Data Entry

### Sample Sale Entry
- Customer Name: "John Doe"
- Item Sold: "Laptop"
- Quantity: "1"
- Price: "50000"
- Date: Today's date

### Sample Inventory Item
- Product Name: "Samsung Galaxy S21"
- Category: "Electronics"
- Unit Price: "35000"
- Quantity in Stock: "15"
- Reorder Level: "5"

### Sample Expense
- Description: "Office Supplies"
- Category: "Materials"
- Amount: "5000"
- Date: Today's date

## Troubleshooting

### Access Code Not Working
**Problem:** "Invalid access code" error
**Solution:** 
- Verify code is exactly 8 characters
- Check if code exists in database
- Try regenerating a new code
- Check database connection

### Can't Access Dashboard
**Problem:** Redirected back to login
**Solution:**
- Clear browser cookies
- Try a different access code
- Check if business is registered
- Verify database tables exist

### Data Not Saving
**Problem:** Form submission fails silently
**Solution:**
- Open browser console (F12) to see errors
- Check network tab for failed requests
- Verify database is connected
- Check RLS policies are configured

### Charts Not Showing
**Problem:** Empty charts on dashboard
**Solution:**
- Ensure you've added sales/expense records
- Refresh the page
- Clear browser cache
- Check browser console for errors

## Test Account Details

After logging in with an access code and setting up your business:

**Default Business Setup Example:**
- Business Name: "My Test Business"
- Business Type: "Retail"
- Location: "Test City"
- Contact: "test@example.com"

These can be changed in Settings page.

## Performance Testing

### Test with Data Volume
1. Add 10+ sales records
2. Add 20+ inventory items
3. Add 10+ expense records
4. Check if dashboard loads in < 2 seconds
5. Verify search functionality with large datasets

### Browser Testing
- [ ] Chrome (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Automated Testing (Optional)

For comprehensive testing, consider adding:
```bash
npm install --save-dev jest @testing-library/react
```

Then create test files in `__tests__/` directories.

## Reporting Issues

When testing, if you find bugs:
1. Document the steps to reproduce
2. Include the access code used
3. Take a screenshot
4. Check browser console for errors
5. Note the exact error message

## Next Steps

After successful testing:
1. Review DEPLOYMENT_CHECKLIST.md
2. Configure production Paystack keys
3. Set up production database
4. Deploy to Vercel
5. Test payment flow with real transaction

## Support

For detailed information about features and usage, refer to:
- **QUICK_START.md** - Quick setup guide
- **GETTING_STARTED.md** - Feature overview
- **APPLICATION_FLOW.md** - User flows and workflows
- **FEATURES_CHECKLIST.md** - Complete feature list
