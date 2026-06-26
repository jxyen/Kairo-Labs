# Affiliates — terminal brief

**Route:** `src/app/admin/affiliates/page.tsx` (replace the stub)
**Tables you own:** `affiliates`, `orders.affiliate_id`
**Access:** `requireStaff`

## Goal

Build the affiliate management UI so staff can maintain affiliate partners and
track their attributed orders. Each affiliate has a unique referral code stored
in `affiliates`. Orders reference `affiliate_id` when a referral code is used at
checkout. The UI should compute commission owed by summing the order totals
attributed to each affiliate multiplied by their commission rate.

## Definition of done

- [ ] List affiliates with referral code, commission rate, and status
- [ ] Create an affiliate (name, email, referral code, commission rate)
- [ ] Edit an affiliate; deactivate without deleting
- [ ] View orders attributed to each affiliate via `orders.affiliate_id`
- [ ] Compute commission owed from attributed order totals × commission rate
- [ ] RLS respected (no service-role client in request paths)
- [ ] Tests under `tests/` cover the data-access functions
- [ ] Types regenerated if schema changed

## Two distinct surfaces (read before building)

Affiliates are a **separate user population from admins**, and there are two
different things to build:

1. **Admin-side management (THIS brief, `/admin/affiliates`)** — the 3 admins
   create/manage affiliates and see attributed orders + commission owed. Guarded
   by `requireStaff` like the rest of `/admin`.
2. **Affiliate-facing portal (separate, later, NOT under `/admin`)** — affiliates
   log in to a minimal view: their referral code, who they referred, and earnings.
   They must never reach the admin panel.

### Auth warning for the affiliate portal

The `handle_new_user` trigger (migration `0001`) auto-creates a `staff` row for
**every** new `auth.users` signup. That is correct while only the 3 admins exist
(they're invited manually), but it means a naive affiliate signup would also get a
`staff` row. Before building affiliate login you MUST separate the populations —
e.g. gate the trigger on a sign-up metadata flag, or give affiliates a distinct
sign-up path that inserts into `affiliates` (and never `staff`). An affiliate must
never satisfy `is_staff()`. Disable open email signups in the Supabase dashboard
until this is handled.
