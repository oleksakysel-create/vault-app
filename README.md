# Vault — personal finance & investing (prototype)

iOS-first prototype: budget with envelopes (Essentials · Flexible · Savings), savings goals,
investments with automatic tax on profit. React + Tailwind CSS + Framer Motion + Lucide, wrapped in Electron.

## Run

```bash
npm install
npm run desktop   # desktop app (Electron + Vite dev server)
npm run dev       # browser only: http://localhost:5173
```

## Update to the latest version

```bash
git pull
npm install
npm run desktop
```

## Build a macOS app

```bash
npm run desktop:build   # .dmg and .zip in release/
```

Demo data only — nothing is saved between launches. Tax brackets are demo rules, not tax advice.
