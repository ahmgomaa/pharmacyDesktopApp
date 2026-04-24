# pharmacyDesktopApp

A cross-platform desktop pharmacy management application.

## Features

- **Medicines / inventory**: CRUD with name, barcode, stock, reorder level, expiry date, price, cost, supplier.
- **Point of Sale**: barcode scan / search, cart with stock validation, discount, receipt print.
- **Sales history**: list recent sales and inspect line items.
- **Customers**: CRUD for customer records.
- **Suppliers**: CRUD for supplier records.
- **Purchase orders**: receive stock from a supplier; stock and cost price auto-update.
- **Users**: admin-only user management with role-based access (admin / cashier).
- **Reports**: daily sales, low stock, expiring soon (60 days).
- **Bilingual UI**: English + Arabic with automatic RTL layout.
- **Local SQLite database** stored in the OS user data directory — no server required.

## Stack

- [Electron](https://www.electronjs.org/) + [electron-vite](https://electron-vite.org/)
- React 18 + TypeScript
- Tailwind CSS
- React Router (HashRouter)
- i18next + react-i18next
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) for the embedded database
- bcryptjs for password hashing

## Getting started

```bash
npm install
npm run dev
```

First launch creates a SQLite file at your Electron `userData` directory (e.g. `~/.config/Pharmacy Desktop App/pharmacy.db` on Linux, `%APPDATA%\\Pharmacy Desktop App\\pharmacy.db` on Windows, `~/Library/Application Support/Pharmacy Desktop App/pharmacy.db` on macOS) and seeds a default admin user:

- **Username**: `admin`
- **Password**: `admin123`

Change this password immediately from the Users page.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Run in development mode with HMR. |
| `npm run build` | Typecheck + build main, preload, and renderer bundles. |
| `npm run build:win` / `build:mac` / `build:linux` | Package installers via electron-builder. |
| `npm run typecheck` | Typecheck node and web projects. |
| `npm run lint` | ESLint. |
| `npm run format` | Prettier format. |

## Project layout

```
src/
├── main/              # Electron main process (DB, IPC handlers)
│   ├── db/database.ts
│   └── ipc/
├── preload/           # contextBridge → window.api
├── renderer/          # React app
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── contexts/
│       ├── components/
│       ├── pages/
│       ├── locales/   # en.json, ar.json
│       └── styles.css
└── shared/            # Types + IPC channel constants
```

## Notes

- All business logic sits in the main process; the renderer never touches SQLite directly.
- Every IPC handler returns `{ ok, data, error }`. The preload unwraps it and throws on error.
- Admin-only routes are guarded both in the router (`ProtectedRoute adminOnly`) and in IPC handlers (`requireAdmin()`).
- Sale creation runs in a transaction and decrements stock atomically.
- Purchase orders increment stock and update `cost_price` / `supplier_id` for each medicine.
