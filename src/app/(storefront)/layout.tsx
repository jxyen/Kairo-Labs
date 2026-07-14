import { cookies } from "next/headers";
import { CartProvider } from "@/components/cart-context";
import { AnnouncementBar } from "@/components/announcement-bar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileCtaBar } from "@/components/mobile-cta-bar";
import { getAccessories } from "@/lib/catalog/queries";
import { CartDrawer } from "@/components/cart-drawer";
import { ResearcherGate } from "@/components/researcher-gate";
import { GATE_COOKIE, hasVerified } from "@/lib/gate";

export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const verified = hasVerified(cookieStore.get(GATE_COOKIE)?.value);
  const accessories = await getAccessories();

  return (
    <CartProvider>
      <div className="page-wash">
        <AnnouncementBar />
        <SiteHeader />
        {children}
        <SiteFooter />
      </div>
      <MobileCtaBar />
      <CartDrawer accessories={accessories} />
      {!verified && <ResearcherGate />}
    </CartProvider>
  );
}
