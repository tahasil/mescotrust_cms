import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import PortfolioItem from "@/models/Portfolio";
import { toText } from "@/lib/portfolioUtils";
import { ensureMailto, normalizeLinkTarget } from "@/lib/linkUtils";

export const dynamic = "force-dynamic";

function toPortfolioResponse(doc) {
  const source = doc && typeof doc === "object" ? doc : {};
  const rawCategory = source?.categoryId;
  const category =
    rawCategory && typeof rawCategory === "object"
      ? rawCategory
      : null;
  return {
    _id: String(source?._id || ""),
    name: toText(source?.name || source?.title),
    slug: toText(source?.slug),
    categoryId: category?._id ? String(category._id) : toText(rawCategory),
    categoryName: toText(category?.name),
    categorySlug: toText(category?.slug),
    designation: toText(source?.designation),
    image: toText(source?.image),
    logo: toText(source?.logo),
    bio: toText(source?.bio),
    socialLinks: Array.isArray(source?.socialLinks)
      ? source.socialLinks.map((entry) => ({
          label: toText(entry?.label || entry?.platform),
          platform: toText(entry?.platform || entry?.label),
          url: ensureMailto(entry?.url),
          linkEnabled:
            entry?.linkEnabled == null ? false : entry?.linkEnabled === true,
          target: normalizeLinkTarget(
            entry?.target ?? entry?.sourceTarget ?? entry?.openInNewTab,
            "_self",
          ),
          openInNewTab:
            normalizeLinkTarget(
              entry?.target ?? entry?.sourceTarget ?? entry?.openInNewTab,
              "_self",
            ) === "_blank",
        }))
      : [],
    feature:
      source?.feature === true ||
      source?.features?.featuredPortfolio === true ||
      source?.features?.showInSlider === true,
    features:
      source?.features && typeof source.features === "object"
        ? source.features
        : {},
    order: Number.isFinite(Number(source?.order)) ? Number(source.order) : 0,
    status: source?.status !== false,
  };
}

export async function GET(req, { params }) {
  const session = await requirePermission(req, "portfolio.view");
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const slug = toText(params?.slug).toLowerCase();
    if (!slug) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    const doc = await PortfolioItem.findOne({ slug })
      .populate("categoryId", "name slug isActive order")
      .lean();
    if (!doc) {
      return NextResponse.json({ error: "Portfolio item not found" }, { status: 404 });
    }

    return NextResponse.json(toPortfolioResponse(doc));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

