import { generateRobotsContent, getSiteFile } from "@/lib/siteFiles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  let content;
  try {
    const robots = await getSiteFile("robots");
    content = robots.content;
  } catch (error) {
    console.error("Saved robots read error:", error);
    content = generateRobotsContent();
  }

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
