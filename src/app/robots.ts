import type { MetadataRoute } from "next";
import { SITE } from "@/lib/research/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/checkout", "/cart", "/order/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
