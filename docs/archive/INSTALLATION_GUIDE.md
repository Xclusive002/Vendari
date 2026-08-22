# ProfitPilot Installation & Setup Guide

This guide will help you set up and deploy ProfitPilot on your local machine or production environment.

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- npm or yarn package manager
- Git (for cloning the repository)
- A Supabase account
- Paystack account for payment processing

## Step 1: Clone and Install

### Using npm:
```bash
git clone <repository-url>
cd profitpilot
npm install
```

### Using yarn:
```bash
git clone <repository-url>
cd profitpilot
yarn install
```

## Step 2: Set Up Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Paystack Configuration
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key
```

### Getting Your Credentials

#### Supabase:
1. Go to [supabase.com](https://supabase.com)
2. Create a new project or use existing one
3. Navigate to **Settings** → **API**
4. Copy the **URL** and **Anon Key**

#### Paystack:
1. Go to [paystack.com](https://paystack.com)
2. Create a business account
3. Navigate to **Settings** → **API Keys**
4. Copy both **Public Key** and **Secret Key**

## Step 3: Set Up Database Schema

Run the SQL migration to create the database tables:

```bash
# Using Supabase CLI
supabase db push

# Or manually execute scripts/001_create_tables.sql in Supabase SQL editor
```

## Step 4: Run Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## Step 5: Test the Application

1. **Visit Home Page**: Go to `http://localhost:3000`
2. **Test Login Flow**: Click "Manage Business"
3. **Test Payment**: Click "Buy Access Code" and use Paystack test keys
4. **Complete Setup**: Fill in business details
5. **Access Dashboard**: Start using the features

## Paystack Test Credentials

For testing payments in development:

### Test Cards:
- **Visa**: 4084084084084081
- **Mastercard**: 5061280000000000

**Expiry**: Any future date
**CVV**: Any 3 digits

## Deployment to Vercel

### Option 1: Using Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Select your GitHub repository
5. Add environment variables in **Settings** → **Environment Variables**
6. Click "Deploy"

### Option 2: Using Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

## Project Structure

```
profitpilot/
├── app/
│   ├── api/                 # API routes
│   ├── dashboard/           # Dashboard pages
│   │   ├── inventory/      # Inventory management
│   │   ├── sales/          # Sales tracking
│   │   ├── reports/        # Financial reports
│   │   ├── help/           # Help & tutorials
│   │   └── settings/       # Settings
│   ├── payment/            # Payment flow
│   ├── login/              # Login page
│   ├── globals.css         # Global styles
│   └── layout.tsx          # Root layout
├── components/
│   ├── ui/                 # UI components
│   └── dashboard/          # Dashboard components
├── lib/
│   ├── supabase/           # Supabase clients
│   └── utils/              # Utility functions
├── scripts/                # Database migrations
└── package.json
```

## Features Overview

### 1. Landing Page (`/`)
- Product showcase
- Pricing information
- Call-to-action buttons

### 2. Login (`/login`)
- Access code entry
- Session management
- Payment redirect for new users

### 3. Payment (`/payment`)
- Paystack integration
- ₦20,000 payment processing
- Access code generation upon success

### 4. Business Setup (`/dashboard/setup`)
- Business information entry
- Initial configuration
- User onboarding

### 5. Dashboard (`/dashboard`)
- Real-time analytics
- KPI display
- Quick actions
- Navigation to other sections

### 6. Sales (`/dashboard/sales`)
- Daily sales recording
- Sales history
- Sales analytics

### 7. Inventory (`/dashboard/inventory`)
- Product management
- Stock tracking
- Inventory reports

### 8. Reports (`/dashboard/reports`)
- P&L statements
- Financial summaries
- Data export

### 9. Help (`/dashboard/help`)
- Video tutorials
- Feature guides
- FAQ

### 10. Settings (`/dashboard/settings`)
- Business details
- Account management
- Logout

## Database Schema

### Users Table
- id (UUID, primary key)
- access_code (VARCHAR, unique)
- email (VARCHAR)
- created_at (TIMESTAMP)
- has_paid (BOOLEAN)

### Businesses Table
- id (UUID, primary key)
- user_id (UUID, foreign key)
- business_name (VARCHAR)
- business_type (VARCHAR)
- location (VARCHAR)
- currency (VARCHAR)
- created_at (TIMESTAMP)

### Sales Table
- id (UUID, primary key)
- business_id (UUID, foreign key)
- amount (DECIMAL)
- items (JSON)
- date (DATE)
- created_at (TIMESTAMP)

### Inventory Table
- id (UUID, primary key)
- business_id (UUID, foreign key)
- product_name (VARCHAR)
- quantity (INTEGER)
- unit_price (DECIMAL)
- reorder_level (INTEGER)
- created_at (TIMESTAMP)

### Expenses Table
- id (UUID, primary key)
- business_id (UUID, foreign key)
- amount (DECIMAL)
- category (VARCHAR)
- description (TEXT)
- date (DATE)
- created_at (TIMESTAMP)

### Payments Table
- id (UUID, primary key)
- user_id (UUID, foreign key)
- amount (DECIMAL)
- reference (VARCHAR, unique)
- status (VARCHAR)
- created_at (TIMESTAMP)

## Troubleshooting

### Issue: Environment variables not loading
**Solution**: Restart the development server after adding env variables

### Issue: Paystack payment not working
**Solution**: Verify your API keys are correct and account is active

### Issue: Database connection error
**Solution**: Check Supabase URL and Anon key are correct in env variables

### Issue: CORS errors on payment
**Solution**: Ensure Paystack domain is whitelisted in security settings

## Configuration Options

### Customizing Payment Amount

Edit `/app/payment/page.tsx`:
```typescript
const AMOUNT = 2000000; // Change this to desired amount in kobo
```

### Customizing Business Types

Edit `/lib/utils/businessTypes.ts` and add/remove business type options.

### Customizing Currency

Edit business setup page to change default currency from NGN to your preference.

## Performance Optimization

1. **Image Optimization**: Use Next.js Image component
2. **Code Splitting**: Dynamic imports for large components
3. **Caching**: Implement SWR for data fetching
4. **Database Indexing**: Add indexes on frequently queried columns

## Security Best Practices

1. Never commit `.env.local` to version control
2. Use HTTPS in production
3. Implement rate limiting on API endpoints
4. Validate all user inputs server-side
5. Use Row Level Security (RLS) in Supabase
6. Regularly rotate API keys

## Maintenance

### Regular Tasks
- Monitor error logs
- Update dependencies monthly
- Backup database weekly
- Review user access logs
- Update security patches

### Database Maintenance
```sql
-- Analyze database performance
ANALYZE;

-- Vacuum to reclaim space
VACUUM ANALYZE;

-- Check RLS policies
SELECT * FROM information_schema.role_based_access_control_policies;
```

## Support & Documentation

- **Official Docs**: [Visit Documentation]
- **GitHub Issues**: [Report bugs]
- **Email Support**: support@profitpilot.com
- **Community Forum**: [Join forum]

## Contributing

To contribute to ProfitPilot:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential. All rights reserved.

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Core features: Sales, Inventory, Reports
- Paystack integration
- Access code authentication
- Business dashboard

---

For the latest updates and support, visit [profitpilot.com](https://profitpilot.com)
