import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requirePermission } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import PortfolioItem from "@/models/Portfolio";
import PortfolioCategory from "@/models/PortfolioCategory";
import { syncPortfolioSliderMapping, removePortfolioItemFromSlider } from "@/lib/portfolioSliderMapping";
import { isPortfolioItemMappingSupported } from "@/lib/portfolioSliderSupport";
import {
  normalizePortfolioPayload,
  slugify,
  toText,
} from "@/lib/portfolioUtils";
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

async function ensureUniqueSlug(baseSlug, ignoreId) {
  const root = slugify(baseSlug || "portfolio-item");
  let candidate = root;
  let i = 1;
  // eslint-disable-next-line no-await-in-loop
  while (
    await PortfolioItem.findOne({
      slug: candidate,
      ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
    }).lean()
  ) {
    candidate = `${root}-${i}`;
    i += 1;
  }
  return candidate;
}

export async function GET(req, { params }) {
  const session = await requirePermission(req, "portfolio.view");
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const id = toText(params?.id);
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid portfolio id" }, { status: 400 });
    }

    const doc = await PortfolioItem.findById(id)
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

export async function PUT(req, { params }) {
  const session = await requirePermission(req, "portfolio.edit");
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const id = toText(params?.id);
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid portfolio id" }, { status: 400 });
    }

    const existing = await PortfolioItem.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: "Portfolio item not found" }, { status: 404 });
    }

    const body = await req.json();
    const normalized = normalizePortfolioPayload(
      {
        ...existing,
        ...(body && typeof body === "object" ? body : {}),
      },
      { fallbackName: existing?.name || "Portfolio" },
    );

    if (!normalized.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!normalized.categoryId) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(normalized.categoryId)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    const selectedSliderId = toText(normalized?.features?.mappedSliderComponentId);
    if (selectedSliderId && !isPortfolioItemMappingSupported(selectedSliderId)) {
      return NextResponse.json(
        { error: "Selected slider does not support Portfolio mapping" },
        { status: 400 },
      );
    }

    const category = await PortfolioCategory.findById(normalized.categoryId).lean();
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const desiredSlug = toText(body?.slug) || normalized.slug || existing.slug || normalized.name;
    const slug = await ensureUniqueSlug(desiredSlug, id);

    const saved = await PortfolioItem.findByIdAndUpdate(
      id,
      { $set: { ...normalized, title: normalized.name, slug } },
      { new: true, runValidators: true },
    ).lean();
    if (!saved) {
      return NextResponse.json({ error: "Portfolio item not found" }, { status: 404 });
    }

    const previousSliderId = toText(
      existing?.features?.mappedSliderComponentId || existing?.mappedSliderComponentId,
    );
    await syncPortfolioSliderMapping({
      item: saved,
      previousSliderComponentId: previousSliderId,
      categoryName: toText(category?.name),
    });

    const populated = await PortfolioItem.findById(saved._id)
      .populate("categoryId", "name slug isActive order")
      .lean();
    return NextResponse.json(toPortfolioResponse(populated));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requirePermission(req, "portfolio.delete");
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const id = toText(params?.id);
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid portfolio id" }, { status: 400 });
    }
    const existing = await PortfolioItem.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: "Portfolio item not found" }, { status: 404 });
    }
    const previousSliderId = toText(
      existing?.features?.mappedSliderComponentId || existing?.mappedSliderComponentId,
    );

    const deleted = await PortfolioItem.softDeleteById(id, {
      deletedBy: session.email || session.id || "",
    });
    if (!deleted) {
      return NextResponse.json({ error: "Portfolio item not found" }, { status: 404 });
    }
    if (previousSliderId) {
      await removePortfolioItemFromSlider(previousSliderId, id);
    }
    return NextResponse.json({ ok: true, deleted: id, softDeleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

