import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-context";
import { AnnouncementBar } from "@/components/announcement-bar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Covalent Labs — Research-grade peptides, lab-tested & shipped same day",
  description:
    "Independently lab-tested research peptides with a verifiable certificate of analysis per batch. ≥99% purity, US-based same-day shipping, secure checkout. For research use only.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <CartProvider>
          <div className="page-wash">
            <AnnouncementBar />
            <SiteHeader />
            {children}
            <SiteFooter />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
