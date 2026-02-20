function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
}

export default function robots() {
  const baseUrl = getBaseUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/admin"] }],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
