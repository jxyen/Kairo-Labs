# Admin Staff management — design

**Date:** 2026-06-26
**Route:** `src/app/admin/staff/page.tsx` (replaces the foundation stub)
**Owner-only.** Tables: `staff` + the Supabase Auth admin API.

## Goal

Owner-only UI to invite staff members, set their role (`owner` / `staff`),
and activate / deactivate accounts — with a guard so an owner cannot lock
themselves out.

## Two-population reminder

Admins live in `staff` (all currently `owner`). Affiliates are a separate
population and never touched here. No open sign-up — staff are invited.

## Key correction vs. staff.md

`staff.md` step 2 says "insert a corresponding row." That is stale. The
`on_auth_user_created` trigger in `0001_staff.sql` **already inserts** the
staff row (inactive, role `staff`) when the Auth user is created. So invite =
create Auth user → **UPDATE** the auto-created row. Never blind-INSERT.

## Decisions (locked with the user)

1. **Invite flow:** email invite (magic link) via
   `auth.admin.inviteUserByEmail`. Supabase creates the Auth user and sends an
   invite link (captured by local Mailpit on :54324 in dev); the member sets
   their own password. We never handle passwords.
2. **Lockout guard:** block both self-deactivate **and** self-demote
   (`owner → staff` on your own row). Either would strip the actor's own owner
   access.
3. **Manage UX:** inline per-row controls in a single table (role `<select>`
   form + activate/deactivate form). Invite form above the table.

## Files (all within `src/app/admin/staff/`)

- `page.tsx` — server component. `requireOwner()`, fetch list, render
  invite form + table.
- `staff-data.ts` — **pure data-access functions**, each takes a Supabase
  client argument. No `requireOwner`, no secrets — this is the unit under
  test. (`server-only` is aliased to empty in vitest, so importing in tests is
  safe; included for production hygiene.)
- `actions.ts` — `'use server'`. Thin wrappers: `requireOwner()` →
  data-access fn → `revalidatePath('/admin/staff')`. Return `{ error }` on
  failure for `useActionState`.
- `invite-form.tsx` — `'use client'`, `useActionState` (mirrors
  `login-form.tsx`).
- `staff-table.tsx` — table + per-row role form and activate/deactivate form
  (progressive-enhancement `<form action={...}>`, hidden `id`).

No migration: `staff` already has the columns. Last-sign-in is not a `staff`
column — it lives in `auth.users.last_sign_in_at`, read via the Auth admin
API. (Reserved migration number `0008` remains unused.)

## Data-access functions (`staff-data.ts`)

```
class LockoutError extends Error {}

listStaff(client): StaffRow[]                       // owners first, then created_at
updateStaffProfile(client, id, { full_name, role, active })
setStaffRole(client, { targetId, role, currentUserId })
  -> throws LockoutError if targetId === currentUserId && role !== 'owner'
setStaffActive(client, { targetId, active, currentUserId })
  -> throws LockoutError if targetId === currentUserId && active === false
inviteStaff(adminClient, { email, full_name, role })
  -> inviteUserByEmail(email); then updateStaffProfile(adminClient, user.id,
     { full_name, role, active: true })
```

`currentUserId` is passed *into* the guard functions so the lockout rule is
unit-testable against a real DB, not only reachable through the UI.

## Data flow (list)

`page.tsx`: `requireOwner()` → `listStaff(rlsServerClient)` → enrich
last-sign-in from `adminClient.auth.admin.listUsers()` mapped by `id`. Only
the auth enrichment and invite use `@/lib/supabase/admin`, inside the
owner-guarded server path.

## Security

- `requireOwner()` at the top of the page and every action.
- Admin/service-role client used only inside actions, after the owner
  re-check; never on a client-reachable request path.
- Self-row controls render disabled with a "you" marker; the server enforces
  the guard regardless of the UI.

## Testing (Vitest, service-role client; extends `tests/db/staff.test.ts`)

- keep existing: service-role readable, anon denied (RLS).
- `listStaff` returns seeded rows.
- `updateStaffProfile` sets role/active/full_name.
- `setStaffActive` / `setStaffRole` happy path mutates.
- self-deactivate and self-demote throw `LockoutError` and leave the row
  unchanged.
- `inviteStaff` creates an auth user → trigger row exists → profile updated
  to active + role; cleanup deletes the auth user afterward.

TDD: each test written failing first, then the implementation.
```
