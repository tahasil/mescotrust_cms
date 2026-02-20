import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Page } from "@/models";

export default async function HomePage() {
  await connectDB();
  const homePage = await Page.findOne({ isHomePage: true, status: "published" }).lean() as { slug?: string } | null;
  if (homePage?.slug) {
    redirect(`/${homePage.slug}`);
  }
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Welcome</h1>
      <p>No home page set. Create and publish a page in admin and set it as home.</p>
    </main>
  );
}
