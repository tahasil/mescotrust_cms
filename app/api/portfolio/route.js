import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import PortfolioItem from "@/models/Portfolio";
import PortfolioCategory from "@/models/PortfolioCategory";
import { toText } from "@/lib/portfolioUtils";
import { ensureMailto, normalizeLinkTarget } from "@/lib/linkUtils";

export const dynamic = "force-dynamic";

function parseCsv(value) {
  const raw = toText(value);
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const categoryIds = parseCsv(searchParams.get("categoryIds")).filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );
    const allCategoriesParam = searchParams.get("allCategories");
    const showAllCategories =
      allCategoriesParam == null
        ? categoryIds.length === 0
        : allCategoriesParam === "1";
    const featured = searchParams.get("featured") === "1";
    const homepage = searchParams.get("homepage") === "1";
    const highlight = searchParams.get("highlight") === "1";
    const includeInactive = searchParams.get("status") === "all";

    let categoriesQuery = { isActive: true };
    if (!showAllCategories) {
      categoriesQuery = { _id: { $in: categoryIds }, isActive: true };
    }

    const categories = await PortfolioCategory.find(categoriesQuery)
      .sort({ order: 1, name: 1 })
      .lean();
    const activeCategoryIds = categories.map((cat) => String(cat._id));

    const query = {
      name: { $exists: true, $ne: "" },
      categoryId: { $in: activeCategoryIds },
    };
    if (!includeInactive) query.status = true;
    if (featured) {
      query.$or = [
        { isFeatured: true },
        { feature: true },
        { "features.featuredPortfolio": true },
        { "features.showInSlider": true },
      ];
    }
    if (homepage) query["features.showOnHomepage"] = true;
    if (highlight) query["features.highlightPortfolio"] = true;

    const docs = await PortfolioItem.find(query)
      .populate("categoryId", "name slug")
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const items = docs.map((doc) => {
      const rawCategory = doc?.categoryId;
      const category =
        rawCategory && typeof rawCategory === "object"
          ? rawCategory
          : null;
      return {
        _id: String(doc._id),
        name: toText(doc?.name || doc?.title),
        slug: toText(doc?.slug),
        categoryId: category?._id ? String(category._id) : toText(rawCategory),
        categoryName: toText(category?.name),
        categorySlug: toText(category?.slug),
        designation: toText(doc?.designation),
        image: toText(doc?.image),
        logo: toText(doc?.logo),
        bio: toText(doc?.bio),
        socialLinks: Array.isArray(doc?.socialLinks)
          ? doc.socialLinks.map((entry) => ({
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
          doc?.feature === true ||
          doc?.features?.featuredPortfolio === true ||
          doc?.features?.showInSlider === true,
        features:
          doc?.features && typeof doc.features === "object" ? doc.features : {},
        order: Number.isFinite(Number(doc?.order)) ? Number(doc.order) : 0,
        status: doc?.status !== false,
      };
    });

    return NextResponse.json({
      items,
      categories: categories.map((cat) => ({
        _id: String(cat._id),
        name: toText(cat.name),
        slug: toText(cat.slug),
        description: toText(cat.description),
        order: Number.isFinite(Number(cat.order)) ? Number(cat.order) : 0,
        isActive: cat.isActive !== false,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

