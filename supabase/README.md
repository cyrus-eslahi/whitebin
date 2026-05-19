# Supabase setup for WhiteBin

## 1. Create a project

Go to [supabase.com](https://supabase.com) and create a new project.

## 2. Run the database schema

1. Open **SQL Editor** in your Supabase dashboard.
2. Paste the contents of `schema.sql` and click **Run**.

## 3. Add your keys to the site

Open `js/config.js` in this repo and fill in:

```js
window.WHITEBIN_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_ANON_PUBLIC_KEY",
};
```

Find these under **Project Settings → API**.

## 4. Deploy

Push to GitHub. Orders will save to the `orders` table and order IDs will increment automatically (`A1`, `A2`, … `A99`, `B1`, …).

## Without Supabase

The site still works: order IDs use `localStorage` and orders are queued in `whitebin_orders_queue` until you connect Supabase.
