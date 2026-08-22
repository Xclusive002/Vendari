# ProfitPilot - Application Flow & User Journey

## User Journey Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PROFITPILOT USER JOURNEY                        │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │ Landing Page│
                              │    (Home)   │
                              └──────┬──────┘
                                     │
                         ┌───────────┴───────────┐
                         │                       │
                    ┌────▼─────┐          ┌─────▼─────┐
                    │ Learn More│          │   Manage  │
                    │  Content  │          │ Business  │
                    └───────────┘          └─────┬─────┘
                                                 │
                                          ┌──────▼──────┐
                                          │  Login Page │
                                          └──────┬──────┘
                                                 │
                         ┌───────────┬───────────┴──────────┬──────────┐
                         │           │                      │          │
                    ┌────▼──────┐ ┌──▼──────────┐  ┌────────▼──────┐
                    │   Existing│ │ New User No │  │  Access Code  │
                    │ Access Code│ │ Access Code│  │   Validated   │
                    │  Verified │ │             │  │      ✓        │
                    └──────┬─────┘ └────┬────────┘  └────────┬───────┘
                           │            │                    │
                           │     ┌──────▼─────────┐         │
                           │     │  Payment Page  │         │
                           │     │   (Paystack)   │         │
                           │     └──────┬─────────┘         │
                           │            │                    │
                           │     ┌──────▼──────────┐        │
                           │     │ Payment Success│         │
                           │     │ Code Generated │         │
                           │     └──────┬─────────┘         │
                           │            │                    │
                           └────────────┼────────────────────┘
                                        │
                                  ┌─────▼────────┐
                                  │ First Login? │
                                  └─────┬────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         │                             │
                    ┌────▼──────────┐          ┌──────▼───────┐
                    │ Business Setup│          │  Main Browser│
                    │ Registration  │          │  (Dashboard) │
                    │     Form      │          └──────┬───────┘
                    └────┬──────────┘                  │
                         │                             │
                    ┌────▼──────────┐                  │
                    │ Setup Complete│                  │
                    │  Redirects to │                  │
                    │   Dashboard   │                  │
                    └────┬──────────┘                  │
                         │                             │
                         └──────────────┬──────────────┘
                                        │
                     ┌──────────────────▼─────────────────┐
                     │    Main Dashboard (Overview)       │
                     │  - KPIs                            │
                     │  - Charts & Analytics              │
                     │  - Quick Actions                   │
                     └──────────────────┬─────────────────┘
                                        │
         ┌──────────────┬───────────────┼───────────────┬──────────────┐
         │              │               │               │              │
    ┌────▼────┐  ┌─────▼────┐  ┌──────▼─────┐  ┌──────▼────┐  ┌─────▼───┐
    │  Sales  │  │Inventory │  │  Reports   │  │   Help    │  │Settings │
    │Management│  │Management│  │ (P&L, etc) │  │& Tutorials│  │& Account│
    └────┬────┘  └─────┬────┘  └──────┬─────┘  └──────┬────┘  └─────┬───┘
         │              │               │               │              │
         │              │               │               │              │
    ┌────▼────────────────────────────────────────────────────────────▼──┐
    │         Return to Dashboard or Navigate to Different Section       │
    └────────────────────────────────────────────────────────────────────┘
```

## Feature Flow Diagrams

### Sales Management Flow

```
┌──────────────────────────────────────┐
│  Sales Dashboard Page                │
│  - View all sales                    │
│  - Filter by date                    │
│  - Search functionality              │
└──────────┬───────────────────────────┘
           │
    ┌──────▼──────┐
    │ Add New Sale│ (Click Button)
    └──────┬──────┘
           │
    ┌──────▼──────────────────────┐
    │   Add Sale Dialog Box        │
    │   - Amount                   │
    │   - Items                    │
    │   - Date                     │
    │   - Payment Method           │
    └──────┬──────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │   Submit & Save to Database  │
    └──────┬──────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │   Success Confirmation       │
    │   Update Sales Analytics     │
    │   Refresh Sales List         │
    └──────────────────────────────┘
```

### Inventory Management Flow

```
┌──────────────────────────────────────┐
│  Inventory Dashboard                 │
│  - View all products                 │
│  - Stock levels                      │
│  - Search & filter                   │
└──────────┬───────────────────────────┘
           │
    ┌──────▼────────────────────────┐
    │      Add New Product (OR)      │
    │  Edit Existing Product (OR)    │
    │  Delete Product                │
    └──────┬────────────────────────┘
           │
    ┌──────▼────────────────────────┐
    │   Product Form Dialog          │
    │   - Product Name               │
    │   - SKU                        │
    │   - Category                   │
    │   - Unit Price                 │
    │   - Current Stock              │
    │   - Reorder Level              │
    └──────┬────────────────────────┘
           │
    ┌──────▼────────────────────────┐
    │   Submit & Save to Database    │
    └──────┬────────────────────────┘
           │
    ┌──────▼────────────────────────┐
    │   Success Confirmation         │
    │   Update Inventory Stats       │
    │   Refresh Product List         │
    └────────────────────────────────┘
```

### Financial Reports Flow

```
┌──────────────────────────────────────┐
│  Reports Dashboard                   │
│  - Select Report Type                │
│  - Choose Date Range                 │
│  - Filter Options                    │
└──────────┬───────────────────────────┘
           │
    ┌──────▼────────────────────────┐
    │   Report Type Selection        │
    │   1. P&L Statement             │
    │   2. Revenue Report            │
    │   3. Expense Report            │
    │   4. Summary Report            │
    └──────┬────────────────────────┘
           │
    ┌──────▼────────────────────────┐
    │   Date Range Selection         │
    │   - Start Date                 │
    │   - End Date                   │
    └──────┬────────────────────────┘
           │
    ┌──────▼────────────────────────┐
    │   Fetch Data from Database     │
    │   Calculate Totals             │
    │   Generate Charts              │
    └──────┬────────────────────────┘
           │
    ┌──────▼────────────────────────┐
    │   Display Report               │
    │   - Summary Statistics         │
    │   - Charts & Graphs            │
    │   - Detailed Breakdown         │
    │   - Export Options             │
    └────────────────────────────────┘
```

## Authentication & Payment Flow

```
┌─────────────────────────────────────────────────────────┐
│         COMPLETE AUTHENTICATION & PAYMENT FLOW          │
└─────────────────────────────────────────────────────────┘

1. USER VISITS LOGIN PAGE
   ├─ Check if user has access code
   ├─ If YES → Verify code
   │  └─ Code Valid? → Go to Dashboard
   │  └─ Code Invalid? → Show error
   └─ If NO → Show payment option

2. USER CLICKS "BUY ACCESS CODE"
   ├─ Redirect to Payment Page
   ├─ Display Paystack Payment Form
   ├─ Amount: ₦20,000
   └─ Show payment instructions

3. PAYSTACK PAYMENT PROCESS
   ├─ User enters card details
   ├─ Paystack processes payment
   ├─ Return to success page with reference
   └─ Verify payment with backend

4. PAYMENT VERIFICATION
   ├─ Send reference to backend
   ├─ Backend verifies with Paystack API
   ├─ If verified → Generate access code
   ├─ Store code in localStorage
   └─ Display code to user

5. USER LOGS IN WITH CODE
   ├─ Enter 8-character access code
   ├─ Validate code format
   ├─ Check if first login
   ├─ If YES → Show business setup
   ├─ If NO → Go to dashboard
   └─ Set session token

6. BUSINESS SETUP (First Time)
   ├─ Display setup form
   ├─ Collect business details
   ├─ Save to database
   └─ Redirect to dashboard

7. DASHBOARD ACCESS
   ├─ Load user data
   ├─ Load business data
   ├─ Display analytics
   └─ User can navigate freely
```

## Database Data Flow

```
┌────────────────────────────────────┐
│       CLIENT (Browser)             │
│  - React Components                │
│  - Form Submissions                │
│  - LocalStorage (session)          │
└──────────────┬─────────────────────┘
               │
        ┌──────▼──────┐
        │  API Routes │
        │ (Next.js)   │
        └──────┬──────┘
               │
        ┌──────▼──────────────────┐
        │  Validation & Auth      │
        │  - Check session        │
        │  - Verify user          │
        │  - Validate inputs      │
        └──────┬───────────────────┘
               │
        ┌──────▼──────────────────┐
        │   Supabase Client       │
        │   (Database Operations) │
        └──────┬───────────────────┘
               │
        ┌──────▼──────────────────┐
        │  PostgreSQL Database    │
        │  - Users                │
        │  - Businesses           │
        │  - Sales                │
        │  - Inventory            │
        │  - Expenses             │
        │  - Payments             │
        └──────┬───────────────────┘
               │
        ┌──────▼──────────────────┐
        │  Row Level Security     │
        │  (RLS Policies)         │
        │  - User isolation       │
        │  - Business isolation   │
        └──────┬───────────────────┘
               │
        ┌──────▼──────────────────┐
        │   Response to Client    │
        │   - JSON Data           │
        │   - Success/Error       │
        └──────┬───────────────────┘
               │
        ┌──────▼──────────────────┐
        │  Update UI              │
        │  - Refresh Components   │
        │  - Show Results         │
        │  - Update Analytics     │
        └────────────────────────┘
```

## Page Navigation Map

```
Home (/）
│
├─ Manage Business → Login (/login)
│                    │
│                    ├─ Has Code → Verify Code → Dashboard
│                    │
│                    └─ No Code → Buy Access (/payment)
│                                  │
│                                  ├─ Payment Success (/payment/success)
│                                  │  └─ View Access Code → Login
│                                  │
│                                  └─ Payment Failed → Retry
│
└─ (All pages accessible from Dashboard)
   │
   ├─ /dashboard (Main)
   ├─ /dashboard/sales
   ├─ /dashboard/inventory
   ├─ /dashboard/reports
   ├─ /dashboard/help
   └─ /dashboard/settings
      └─ Logout → /login
```

## Component Hierarchy

```
RootLayout (app/layout.tsx)
│
├─ Home Page (/)
│  ├─ Navigation
│  ├─ Hero Section
│  ├─ Features Grid
│  ├─ Pricing Section
│  └─ Footer
│
├─ Login Page (/login)
│  ├─ Card Component
│  ├─ Form
│  └─ Links (Payment, Help)
│
├─ Payment Page (/payment)
│  ├─ Card Component
│  ├─ Product Details
│  ├─ Paystack Form
│  └─ Success Link
│
├─ DashboardLayout (/dashboard/*)
│  ├─ DashboardNav (Navigation)
│  ├─ Auth Guard
│  ├─ Child Pages
│  │  ├─ Dashboard
│  │  │  ├─ StatsCard
│  │  │  └─ Charts
│  │  ├─ Sales
│  │  │  ├─ SalesTable
│  │  │  └─ AddItemDialog
│  │  ├─ Inventory
│  │  │  ├─ InventoryTable
│  │  │  └─ AddItemDialog
│  │  ├─ Reports
│  │  │  ├─ ReportCharts
│  │  │  └─ Statistics
│  │  ├─ Help
│  │  │  ├─ TutorialCards
│  │  │  └─ FAQ
│  │  └─ Settings
│  │     ├─ SettingsForm
│  │     └─ LogoutButton
│  └─ Footer
```

## Data Synchronization Flow

```
USER ACTION → FORM SUBMISSION → VALIDATION → API CALL → DATABASE UPDATE
    │              │                │              │              │
    │              │                │              │              └─ Return Response
    │              │                │              │
    │              │                │              └─ Row Level Security Check
    │              │                │
    │              │                └─ Server-side Validation
    │              │
    │              └─ Client-side Validation
    │
    └─ User Interaction (Click, Type, Submit)

RESPONSE → LOCAL UPDATE → UI REFRESH → VISUAL CONFIRMATION
   │            │              │              │
   │            │              │              └─ Toast/Alert
   │            │              │
   │            │              └─ Component Re-render
   │            │
   │            └─ Update Component State
   │
   └─ Receive from Backend
```

## Session Management

```
LOGIN
  │
  ├─ Verify Access Code
  ├─ Create Session
  ├─ Store Token in localStorage
  └─ Redirect to Dashboard

NAVIGATION
  ├─ Check Session on each route
  ├─ If valid → Allow access
  └─ If invalid → Redirect to login

USER ACTIVITY
  └─ Maintain session throughout usage

LOGOUT
  ├─ Clear localStorage
  ├─ Clear session
  └─ Redirect to login
```

---

This flow diagram helps understand how ProfitPilot guides users through the complete journey from landing page to full dashboard usage, with proper authentication, payment processing, and data management at each step.
