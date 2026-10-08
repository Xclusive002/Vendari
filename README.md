# Vendari

Vendari is a business management platform for retailers and service businesses. It brings everyday operations together so owners can keep track of sales, stock, customers, expenses, invoices, and their online storefront without relying on scattered spreadsheets and messages.

The application includes a Next.js web app and a Django REST API. Members can use the dashboard to:

- Record sales, manage inventory, and review business activity.
- Keep customer records and follow up with customers.
- Track expenses and create invoices and receipts.
- Set up a storefront to showcase products and services, receive orders, and manage payouts.
- Invite team members and manage their business access.
- Use AI-assisted insights and WhatsApp features where configured for the account.
- Manage membership billing and, where eligible, share referral links and track referral commissions.

## Project structure

- `app/` — Next.js routes, including registration, dashboard, storefront, referral, and legal pages.
- `components/` — shared UI and dashboard components.
- `lib/` — frontend API and utility code.
- `backend/` — Django project, API applications, migrations, and management commands.
- `docs/archive/` — historical project documentation.

## Run the frontend

Requirements: Node.js and npm.

```bash
npm install
```

Create a root `.env.local` file and set the URL of the Django API:

```dotenv
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

Then start Next.js:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Run the backend

Requirements: Python, PostgreSQL (or a database URL supported by Django), and the Python packages in `backend/requirements.txt`.

From the repository root, create and activate a virtual environment, install the backend dependencies, and copy the example environment file:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` for your local environment. At minimum, configure `SECRET_KEY`, set `DEBUG=True`, and provide a database URL and appropriate allowed hosts. Optional integrations such as Paystack, email delivery, Sentry, AI, WhatsApp, and Cloudinary need their corresponding credentials before those features can be used. Do not commit `.env` files or credentials.

Apply migrations and start the API:

```powershell
python manage.py migrate
python manage.py runserver
```

The API runs at [http://127.0.0.1:8000](http://127.0.0.1:8000) by default. Keep the frontend's `NEXT_PUBLIC_API_URL` pointed at that API URL plus `/api`.

## Checks

Run the Django test suite from `backend/`:

```powershell
python manage.py test
```

Check frontend TypeScript types from the repository root:

```bash
npx tsc --noEmit
```

## Referral program

Signed-in members can open **Refer & Earn** from the dashboard navigation. The page provides a shareable referral link, referral and commission activity, payout setup, and withdrawal requests. Read the [Referral Terms](/referral-terms) for eligibility, commission, hold, and payout conditions.
