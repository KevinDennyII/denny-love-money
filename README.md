# 🐷 Denny Love Money: A Personal Finance Hub

Welcome to **Denny Love Money**, a comprehensive personal finance application built for the Denny family to manage money with love and care. It brings income, expenses, debts, savings, medical/HSA tracking, and net worth into one place — with optional live bank balances and Privacy.com card activity.

**Live site:** [dennylovemoney.site](https://dennylovemoney.site)

## ✨ Features

- **Dashboard**: Get a high-level overview of your financial health, including emergency savings progress.
- **Accounts**: Track monthly contributions separately from live account balances (synced via BankSync when configured).
- **Budget**: Create and manage your monthly budget with ease.
- **Debts & Debt Payoff**: Track credit cards and loans, and plan your debt payoff strategy.
- **Medical**: Keep track of medical bills and HSA reimbursements.
- **Savings**: Set and monitor income sources and savings goals.
- **Net Worth**: Calculate and track assets and liabilities; Emergency Savings and Schwab Roth (HB) can update from live BankSync data.
- **Privacy Card Transactions**: Sync and review approved Privacy.com virtual-card charges.
- **Android companion**: Open the same live web app from a phone with optional fingerprint / PIN unlock.

## 🛠️ Technology Stack

This project is built with a modern, full-stack TypeScript architecture, combining a powerful backend with a dynamic and responsive frontend.

### 🚀 Backend

- **[Node.js](https://nodejs.org/)**: A JavaScript runtime built on Chrome's V8 JavaScript engine.
- **[Express](https://expressjs.com/)**: A minimal and flexible Node.js web application framework.
- **[PostgreSQL](https://www.postgresql.org/)**: A powerful, open source object-relational database system.
- **[Drizzle ORM](https://orm.drizzle.team/)**: A TypeScript ORM for SQL databases.
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)**: Password hashing for username/password login.
- **[Passport.js](http://www.passportjs.org/)**: Authentication utilities for Node.js.

### 🎨 Frontend

- **[React](https://reactjs.org/)**: A JavaScript library for building user interfaces.
- **[Vite](https://vitejs.dev/)**: A fast and lightweight build tool for modern web projects.
- **[TypeScript](https://www.typescriptlang.org/)**: A typed superset of JavaScript that compiles to plain JavaScript.
- **[Wouter](https://github.com/molefrog/wouter)**: Lightweight client-side routing.
- **[TanStack Query](https://tanstack.com/query)**: Server-state fetching and caching.
- **[Tailwind CSS](https://tailwindcss.com/)**: A utility-first CSS framework for rapid UI development.
- **[Shadcn/UI](https://ui.shadcn.com/)**: A collection of re-usable components for React.
- **[Framer Motion](https://www.framer.com/motion/)**: A production-ready motion library for React.
- **[Recharts](https://recharts.org/)**: A composable charting library built on React components.

### 📱 Mobile

- **[Jetpack Compose](https://developer.android.com/compose)**: Android companion shell that loads the hosted web app (see [`android/`](./android/)).

## 🔌 External APIs

### [BankSync.io](https://banksync.io/)

Pulls live balances from linked banks (USAA, Chime, Charles Schwab, Navy Federal, and more). Configure via Replit Secrets or local `.env`:

- `BANKSYNC_API_KEY` — API key (`bsk_…`)
- `BANKSYNC_AUTO_SYNC_MINUTES` — background sync interval (`0` to disable)
- `BANKSYNC_EMERGENCY_LAST4` / `BANKSYNC_EMERGENCY_GOAL` — emergency fund last4 and minimum goal

App endpoints: `POST /api/banksync/sync`, `GET /api/banksync/status`, `GET /api/banksync/emergency`.

### [Privacy.com](https://privacy.com/)

Syncs approved virtual-card transactions (manual sync, auto-sync, and webhook).

- `PRIVACY_API_KEY` — API key
- `PRIVACY_AUTO_SYNC_MINUTES` / `PRIVACY_AUTO_SYNC_DAYS` — background sync window

App endpoints: `GET /api/privacy/transactions`, `POST /api/privacy/sync`, `POST /api/privacy/webhook`.

See [`.env.example`](./.env.example) for the full list. Never commit real API keys.

## 🚀 Deployment & Development

This project is deployed using **[Replit](https://replit.com/)**, which hosts the Express app (API + built client) and provides the public URL / custom domain. The database is powered by **[Replit PostgreSQL](https://replit.com/site/hosting/databases-on-replit)** — `DATABASE_URL` is injected automatically in that environment.

For live BankSync and Privacy features in production, add the API keys above as **Replit Secrets**. Point Privacy.com webhooks at `https://YOUR_HOST/api/privacy/webhook`.

Locally, you can run Postgres with Docker Compose (host port **5435**) and `npm run dev:docker`. See [`CLEANUP.md`](./CLEANUP.md) for maintenance and code-cleanup standards.

The development of this project was greatly accelerated with the help of the **[Replit](https://replit.com/ai)** and **[Trae IDE](https://trae.ai/)** coding assistants.

## 💻 Getting Started

To get started with the project, clone the repository and install the dependencies:

```bash
git clone https://github.com/KevinDennyII/denny-love-money.git
cd denny-love-money
npm install
```

Next, set up your `.env` file by copying the `.env.example` file and filling in the required environment variables (`DATABASE_URL`, and optionally `PRIVACY_API_KEY` / `BANKSYNC_API_KEY`).

For a local database:

```bash
docker compose up -d
npm run db:push:docker
npm run db:seed-users:docker
npm run dev:docker
```

Or, if `DATABASE_URL` is already set in `.env`:

```bash
npm run dev
```

The application will be available at `http://localhost:5001`.

## 📱 Android companion

There is a Jetpack Compose Android companion under [`android/`](./android/) so Jamie can open Denny Love Money from the home screen. It loads the same live web app (same look, icons, and data)—not a separate Play Store product. Supports fingerprint / PIN unlock when “Remember this device” is on.

**Install / build / sideload / versioning:** see **[android/README.md](./android/README.md)** and **[android/CHANGELOG.md](./android/CHANGELOG.md)**.

## ❤️ Contributing

This project is a labor of love. If you would like to contribute, please feel free to fork the repository and submit a pull request.
