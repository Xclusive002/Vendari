# ProfitPilot - Quick Start Guide

Get ProfitPilot up and running in 5 minutes!

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Paystack account

## Installation (2 minutes)

```bash
# Clone or download the project
cd profitpilot

# Install dependencies
npm install

# Or with yarn
yarn install
```

## Configuration (2 minutes)

Create `.env.local` file in the root directory:

```env
# Get from Supabase dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Get from Paystack dashboard
PAYSTACK_PUBLIC_KEY=pk_test_xxxx
PAYSTACK_SECRET_KEY=sk_test_xxxx
```

## Start the Application (1 minute)

```bash
npm run dev
```

Visit `http://localhost:3000`

## First Time Usage

### Option 1: Test Without Payment
1. Click "Manage Business"
2. Use test access code: `TEST1234`
3. Set up your business
4. Start tracking!

### Option 2: Complete Payment Flow
1. Click "Manage Business"
2. Click "Buy Access Code"
3. Use Paystack test card:
   - **Card**: 4084084084084081
   - **Expiry**: Any future date
   - **CVV**: Any 3 digits
4. Copy your access code
5. Log in and set up

## Dashboard Features at a Glance

| Feature | Location | What You Can Do |
|---------|----------|-----------------|
| **Sales** | Dashboard → Sales | Record daily sales, view trends |
| **Inventory** | Dashboard → Inventory | Manage products, track stock |
| **Reports** | Dashboard → Reports | View P&L, revenue, expenses |
| **Help** | Dashboard → Help | Watch tutorials, read guides |
| **Settings** | Dashboard → Settings | Manage business, logout |

## Key Pages

- **Home** (`/`) - Landing page
- **Login** (`/login`) - Enter access code
- **Payment** (`/payment`) - Buy access code
- **Dashboard** (`/dashboard`) - Main interface
- **Sales** (`/dashboard/sales`) - Sales management
- **Inventory** (`/dashboard/inventory`) - Product management
- **Reports** (`/dashboard/reports`) - Financial reports
- **Help** (`/dashboard/help`) - Tutorials & guides
- **Settings** (`/dashboard/settings`) - Account settings

## Common Tasks

### How to Record a Sale
1. Go to Dashboard → Sales
2. Click "Add New Sale"
3. Enter amount, items, date
4. Click "Save"

### How to Add a Product
1. Go to Dashboard → Inventory
2. Click "Add Product"
3. Enter product details
4. Click "Add"

### How to View Reports
1. Go to Dashboard → Reports
2. Select report type (P&L, Revenue, Expenses)
3. Choose date range
4. View statistics

### How to Access Help
1. Go to Dashboard → Help
2. Browse tutorials by category
3. Watch video guides
4. Check FAQ section

## Paystack Test Cards

For development testing:

| Card Type | Number | Expiry | CVV |
|-----------|--------|--------|-----|
| Visa | 4084084084084081 | Any future | Any 3 |
| Mastercard | 5061280000000000 | Any future | Any 3 |

## Troubleshooting

### "Environment variables not found"
- Restart dev server after creating `.env.local`
- Verify file is in root directory

### "Paystack error"
- Check API keys are correct
- Ensure Paystack account is active
- Verify amount is ₦20,000

### "Database connection error"
- Verify Supabase URL and key
- Check internet connection
- Restart dev server

### "Access code not working"
- Ensure code is exactly 8 characters
- Check for space at beginning/end
- Try test code: `TEST1234`

## Project Structure Quick Reference

```
profitpilot/
├── app/                 # Pages & layouts
├── components/          # React components
├── lib/                 # Utilities & helpers
├── scripts/             # Database setup
├── .env.local          # Your config (create this)
└── package.json        # Dependencies
```

## What's Included

✅ Complete business management system
✅ Sales tracking
✅ Inventory management
✅ Financial reports
✅ Paystack payment integration
✅ Access code authentication
✅ Interactive dashboard
✅ Help & tutorials
✅ Responsive design
✅ Production-ready code

## Next Steps

1. **Customize**: Edit colors/branding in `app/globals.css`
2. **Deploy**: Push to GitHub and deploy to Vercel
3. **Setup Database**: Run SQL migrations in Supabase
4. **Test**: Complete test payment flow
5. **Go Live**: Configure Paystack production keys

## Support

- Read `README.md` for detailed features
- Check `INSTALLATION_GUIDE.md` for setup help
- Review `PROJECT_SUMMARY.md` for architecture
- Visit Help section in dashboard for tutorials

## Quick Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Format code
npm run lint

# Type check
npx tsc --noEmit
```

## Environment Variables Checklist

- [ ] NEXT_PUBLIC_SUPABASE_URL set
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY set
- [ ] PAYSTACK_PUBLIC_KEY set
- [ ] PAYSTACK_SECRET_KEY set
- [ ] .env.local file created
- [ ] Dev server restarted

## Success Indicators

After setup, you should see:
✅ Landing page loads at `http://localhost:3000`
✅ Can navigate to login page
✅ Can access payment page
✅ Can view dashboard (with test code)
✅ Can navigate between all sections
✅ Console has no errors

## Time Estimates

- Setup: 5 minutes
- Configuration: 2 minutes
- First payment test: 3 minutes
- Dashboard exploration: 5 minutes

**Total: ~15 minutes to full setup**

---

Happy managing! 🚀

For detailed documentation, see:
- `README.md` - Feature overview
- `INSTALLATION_GUIDE.md` - Complete setup
- `PROJECT_SUMMARY.md` - Architecture details
