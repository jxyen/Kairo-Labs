# Payments Review

`/admin/payments-review` (all staff). Lists `payment_events` with status
`unmatched` or `ambiguous` — payments the auto-reconciliation engine recorded
but could not confirm to a single order.

- **unmatched** — no unpaid order matched the amount + method in the last 30 days.
- **ambiguous** — two or more unpaid orders matched; `candidate_orders` lists them.

Each card shows amount, method, sender, note, and received time. Staff type (or
pick) the target order code and **Apply to order** → calls `apply_payment_event`
(→ `mark_order_paid`: marks the order paid, records a `payments` row, links the
event as `applied`). **Dismiss** sets the event to `ignored`.

Auto-confirmed payments never appear here — a single exact amount+method match (or
an order code in the memo that resolves to the matching order) is applied
automatically by `ingest_payment_event`.
