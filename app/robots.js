import { getSiteUrl } from "@/lib/env";

export default function robots() {
  const baseUrl = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/preview"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
