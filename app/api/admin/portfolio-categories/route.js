import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import PortfolioCategory from "@/models/PortfolioCategory";
import { normalizeCategoryPayload, slugify, toText } from "@/lib/portfolioUtils";

export const dynamic = "force-dynamic";

function toCategoryResponse(doc) {
  const source = doc && typeof doc === "object" ? doc : {};
  return {
    _id: String(source?._id || ""),
    name: toText(source?.name),
    slug: toText(source?.slug),
    description: toText(source?.description),
    order: Number.isFinite(Number(source?.order)) ? Number(source.order) : 0,
    isActive: source?.isActive !== false,
  };
}

async function getUniqueSlug(baseSlug, ignoreId) {
  const safeBase = slugify(baseSlug || "category");
  let candidate = safeBase;
  let i = 1;
  // eslint-disable-next-line no-await-in-loop
  while (
    await PortfolioCategory.findOne({
      slug: candidate,
      ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
    }).lean()
  ) {
    candidate = `${safeBase}-${i}`;
    i += 1;
  }
  return candidate;
}

export async function GET(req) {
  const session = await requirePermission(req, "portfolio.view");
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "1";
    const q = toText(searchParams.get("q")).toLowerCase();

    const query = {};
    if (activeOnly) query.isActive = true;

    const docs = await PortfolioCategory.find(query)
      .sort({ order: 1, name: 1 })
      .lean();

    const items = docs
      .map(toCategoryResponse)
      .filter((item) => !q || item.name.toLowerCase().includes(q));

    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requirePermission(req, "portfolio.create");
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const body = await req.json();
    const normalized = normalizeCategoryPayload(body || {}, {
      fallbackName: "Category",
    });

    if (!normalized.name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const slug = await getUniqueSlug(normalized.slug || normalized.name);
    const created = await PortfolioCategory.create({
      ...normalized,
      slug,
    });

    const out = created.toObject ? created.toObject() : created;
    return NextResponse.json(toCategoryResponse(out), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

