# Family Budget - Personal Finance Manager

## Overview
A YNAB-style personal finance management application built for the Denny family. This application helps track income, expenses, debts, savings goals, medical bills, HSA paybacks, and overall net worth.

## Tech Stack
- **Frontend**: React with TypeScript, Tailwind CSS, Shadcn UI components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter

## Project Structure
```
├── client/src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Shadcn UI components
│   │   ├── app-sidebar.tsx
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
│   ├── pages/            # Page components
│   │   ├── dashboard.tsx  # Main overview page
│   │   ├── accounts.tsx   # Bank accounts & credit cards
│   │   ├── budget.tsx     # Monthly expenses
│   │   ├── debts.tsx      # Debt tracking
│   │   ├── medical.tsx    # Medical bills & HSA
│   │   ├── savings.tsx    # Income & savings allocations
│   │   ├── networth.tsx   # Assets & net worth
│   │   └── settings.tsx   # App settings
│   ├── lib/
│   │   ├── formatters.ts  # Currency & date formatters
│   │   └── queryClient.ts # API client
│   └── App.tsx            # Main app with routing
├── server/
│   ├── db.ts             # Database connection
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # Data access layer
│   ├── seed.ts           # Initial data seeding
│   └── index.ts          # Server entry point
└── shared/
    └── schema.ts         # Database schema & types
```

## Database Schema
- **accounts**: Bank accounts, credit cards, investments
- **incomes**: Monthly income sources
- **savingsAllocations**: Monthly savings contributions
- **expenses**: Budgeted monthly expenses
- **debts**: Credit cards, loans, pay-later services
- **medicalBills**: Medical bills with payment tracking
- **hsaPaybacks**: HSA reimbursement tracking
- **assets**: Assets for net worth calculation

## Key Features
1. **Dashboard**: Overview of income, expenses, debt, and net worth
2. **Accounts**: Manage checking, savings, and credit accounts
3. **Budget**: Track monthly expenses by category
4. **Debts**: Monitor debt payoff progress
5. **Medical & HSA**: Track medical bills and HSA reimbursements
6. **Savings Goals**: Income sources and savings allocations
7. **Net Worth**: Total assets minus liabilities

## API Endpoints
All endpoints prefixed with `/api/`:
- `GET/POST /accounts` - Account management
- `GET/POST /incomes` - Income sources
- `GET/POST /savings-allocations` - Savings goals
- `GET/POST /expenses` - Budget items
- `GET/POST /debts` - Debt tracking
- `GET/POST /medical-bills` - Medical bills
- `GET/POST /hsa-paybacks` - HSA reimbursements
- `GET/POST /assets` - Asset management

## Financial Institutions Tracked
- USAA (Checking, Credit Cards)
- Navy Federal Credit Union (Checking, Savings, Credit Cards, Auto Loan)
- Chime (Prepaid Visa for bills)
- Greenwood (Savings)
- Various Credit: Affirm, PayPal, American Express, Best Buy, Klarna, Barclays, Old Navy

## Running the Application
- The app runs on port 5000
- Database is automatically seeded with data from the Excel file
- Use `npm run db:push` to update database schema

## User Preferences
- Family members: Kevin & Jamie
- Dark/Light mode support
- Currency formatted in USD
