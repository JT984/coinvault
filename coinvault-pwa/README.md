# CoinVault PWA

A mobile-first Progressive Web App for managing your certified coin collection. Works on iPhone, Android, and desktop. Installs to your home screen like a native app.

## Quick start (5 minutes)

### 1. Deploy to Vercel (free)

1. Go to [github.com](https://github.com) → create a free account if needed
2. Create a new repository called `coinvault`
3. Upload all files from this folder (drag & drop in the GitHub UI)
4. Go to [vercel.com](https://vercel.com) → Sign up with GitHub (free)
5. Click "Add New Project" → import your `coinvault` repo
6. Click Deploy — Vercel builds and gives you a live URL like `coinvault.vercel.app`

**Your app is live.** Open the URL on your iPhone, tap Share → Add to Home Screen.

---

### 2. Set up shared database (Supabase — free)

So your whole group sees the same collection:

1. Go to [supabase.com](https://supabase.com) → New project (free tier, no credit card)
2. Open the **SQL Editor** and run this SQL to create the tables:

```sql
create table coins (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),
  year int,
  name text not null,
  denomination text,
  mint text,
  strike_type text,
  grading_service text,
  grade text,
  descriptors text,
  cert_number text,
  registry_points int,
  in_registry boolean default false,
  ngc_population int,
  pcgs_population int,
  current_value numeric,
  purchase_cost numeric,
  shipping_cost numeric default 0,
  cert_url text,
  notes text,
  last_value_update timestamptz
);

create table sold_coins (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),
  year int,
  name text not null,
  denomination text,
  mint text,
  strike_type text,
  grading_service text,
  grade text,
  descriptors text,
  cert_number text,
  purchase_cost numeric,
  shipping_cost numeric default 0,
  cert_url text,
  notes text,
  sale_price numeric not null,
  sale_date date,
  sold_to text
);

-- Allow all reads and writes (for a private group app)
alter table coins enable row level security;
alter table sold_coins enable row level security;

create policy "Allow all" on coins for all using (true) with check (true);
create policy "Allow all" on sold_coins for all using (true) with check (true);
```

3. Go to **Project Settings → API**
4. Copy **Project URL** and **anon public key**
5. In the app, open Settings and paste both values → Save

The app will now sync across all devices instantly.

---

### 3. Import your 245 coins

Once Supabase is connected, run this one-time import in the Supabase SQL editor to load your coins from the seed data. Or use the import script:

```bash
node scripts/import.js
```

(See `scripts/import.js` — you'll need to add your Supabase URL and key to it first.)

---

### 4. PCGS API (optional)

For automatic cert lookup on PCGS coins:

1. Create a free account at [pcgs.com](https://www.pcgs.com)
2. Apply for API access at [pcgs.com/publicapi](https://www.pcgs.com/publicapi)
3. Once approved, go to Settings in the app and enter your Client ID, Client Secret, username, and password

NGC coins don't have a public API — tapping "View on NGC registry" opens the cert page directly.

---

## Installing to iPhone home screen

1. Open the app URL in **Safari** on your iPhone (must be Safari, not Chrome)
2. Tap the **Share button** (box with arrow pointing up)
3. Scroll down and tap **"Add to Home Screen"**
4. Name it "CoinVault" and tap Add

The app now has its own icon, opens full-screen without the browser bar, and works exactly like a native app.

---

## File structure

```
src/
  App.js                  — Tab routing and data management
  index.css               — Global styles (dark gold theme)
  seedData.js             — Your 245 coins pre-loaded
  lib/
    supabase.js           — Database client and queries
    pcgs.js               — PCGS API lookup
  components/
    CollectionView.js     — Coin list with search/sort
    CoinDetailView.js     — Detail, edit, sell
    AddCoinView.js        — Add by cert number
    PortfolioView.js      — Charts and summary
    SoldArchiveView.js    — Sold coins history
    SettingsView.js       — Database and API config
```
