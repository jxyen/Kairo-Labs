import { getActivePaymentAccounts } from "@/lib/payments/accounts";
import { CheckoutView } from "./checkout-view";
import type { AccountLite } from "./checkout-types";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const accounts = await getActivePaymentAccounts();
  const lite: AccountLite[] = accounts.map((a) => ({
    method: a.method,
    displayName: a.displayName,
    handle: a.handle,
    instructions: a.instructions,
    qrUrl: a.qrUrl,
  }));

  return (
    <main className="container co-wrap">
      <header className="co-headline">
        <h1 className="co-title">Checkout</h1>
        <p className="co-sub">Complete your order securely</p>
      </header>
      <CheckoutView accounts={lite} />
    </main>
  );
}
