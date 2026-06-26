# Covalent Labs

Marketing site + catalog for **Covalent Labs**, a research-use-only peptide storefront.
Dark, premium aesthetic with a violet→coral gradient system. Built from a high-fidelity
design handoff.

> All copy is framed strictly as **research use only** — keep the "not for human consumption"
> framing and the footer disclaimer intact.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (design tokens + component classes in `src/app/globals.css`)
- **Geist / Geist Mono** via `next/font`
- Static prerendered (`/` and `/catalog`)

## Develop

```bash
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```

## Structure

```
src/
  app/
    layout.tsx          # CartProvider + page wash + header/footer shell
    page.tsx            # Home (hero, trust, featured, COA, process, reviews, checkout, FAQ, CTA)
    catalog/page.tsx    # Catalog with category filter chips
    globals.css         # design tokens + component classes
  components/
    site-header.tsx     # sticky header, mobile drawer, cart badge
    site-footer.tsx
    announcement-bar.tsx
    product-card.tsx    # add-to-cart with "✓ Added" affordance
    cart-context.tsx    # client cart state (count only, this scope)
    vial-placeholder.tsx# light studio-tile placeholder until real photos
    logo.tsx
  lib/
    products.ts         # 8 products + categories (static; would come from an API in prod)
```

## Notes / next steps

- **Product & hero photography** are placeholders. Wire `vial-placeholder` slots to real
  vial photos (clean/light backgrounds) or a CDN/product image field.
- **Cart** tracks a count only — no cart drawer or checkout in this scope.
- **COA "View full COA (PDF)"** is a non-functional affordance; hook to real certificates.

## Admin foundation (setup)

1. Install Docker Desktop (for local Supabase) **or** create a cloud Supabase project.
2. `npm install`
3. `npx supabase start` (local) or `npx supabase link` + `npx supabase db push` (cloud)
4. Copy keys into `.env.local` (see `.env.example`).
5. `npm run db:reset` — apply migrations.
6. `npm run db:seed` — seed the product catalog.
7. Create a first owner (see `docs/admin-features/staff.md`).
8. `npm run dev` → visit `/admin`.

Tests: `npm test`. Regenerate DB types after schema changes: `npm run db:types`.
