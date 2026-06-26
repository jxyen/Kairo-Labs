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
