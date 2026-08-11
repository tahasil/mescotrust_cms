import { getSiteFile, generateSitemapContent } from "@/lib/siteFiles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  let content;
  try {
    const sitemap = await getSiteFile("sitemap");
    content = sitemap.content;
  } catch (error) {
    console.error("Saved sitemap read error:", error);
    content = await generateSitemapContent();
  }

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
