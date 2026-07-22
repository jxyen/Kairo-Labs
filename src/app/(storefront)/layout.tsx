import { CartProvider } from "@/components/cart-context";
import { AnnouncementBar } from "@/components/announcement-bar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileCtaBar } from "@/components/mobile-cta-bar";
import { getAccessories } from "@/lib/catalog/queries";
import { CartDrawer } from "@/components/cart-drawer";
import { ResearcherGate } from "@/components/researcher-gate";

// No cookies() read here on purpose: the gate is mounted unconditionally and
// decides on the client whether the visitor already verified (see
// ResearcherGate). Keeping this layout free of per-request cookie reads is what
// lets every storefront page render as ISR (CDN-cacheable) instead of
// force-dynamic — the biggest technical lever for crawl budget / indexation.
export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      <ResearcherGate />
    </CartProvider>
  );
}
