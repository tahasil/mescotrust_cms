import { NextResponse } from "next/server";
import path from "path";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Media from "@/models/Media";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  UPLOAD_MIME_BY_EXT,
} from "@/lib/media/constants";
import { getMediaSettings } from "@/lib/media/settings";
import { optimizeAndStoreUpload } from "@/lib/media/processor";
import { isSvgMimeType, sanitizeUploadedSvg } from "@/lib/media/svgSanitizer";
import {
  isCropContractError,
  parseCropContractFromFormData,
} from "@/lib/media/cropContract";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function sanitizeName(name) {
  return String(name || "upload")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/-+/g, "-");
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
    const skip = (page - 1) * limit;
    const q = (searchParams.get("q") || searchParams.get("search") || "").trim().slice(0, 120);
    const status = (searchParams.get("status") || "").trim();
    const type = (searchParams.get("type") || "").trim();
    const month = (searchParams.get("month") || "").trim();
    const includeFacets = String(searchParams.get("includeFacets") || "false") === "true";

    const filter = {};
    if (q) {
      const safeQ = escapeRegex(q);
      filter.$or = [
        { title: { $regex: safeQ, $options: "i" } },
        { fileName: { $regex: safeQ, $options: "i" } },
        { filename: { $regex: safeQ, $options: "i" } },
        { originalName: { $regex: safeQ, $options: "i" } },
        { altText: { $regex: safeQ, $options: "i" } },
      ];
    }
    if (status) filter.status = status;
    if (type === "image") filter.mimeType = { $regex: "^image/" };
    if (type === "document") filter.mimeType = { $not: /^image\// };
    if (month) {
      const match = month.match(/^(\d{4})-(\d{2})$/);
      if (!match) {
        return NextResponse.json(
          { error: "Invalid month format. Expected YYYY-MM" },
          { status: 400 },
        );
      }
      const year = Number(match[1]);
      const monthIndex = Number(match[2]) - 1;
      if (monthIndex < 0 || monthIndex > 11) {
        return NextResponse.json(
          { error: "Invalid month format. Expected YYYY-MM" },
          { status: 400 },
        );
      }
      const from = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
      const to = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0));
      filter.createdAt = { $gte: from, $lt: to };
    }

    const [items, total, monthBuckets] = await Promise.all([
      Media.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Media.countDocuments(filter),
      includeFacets
        ? Media.aggregate([
            {
              $project: {
                ym: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              },
            },
            { $group: { _id: "$ym", count: { $sum: 1 } } },
            { $sort: { _id: -1 } },
            { $limit: 48 },
          ])
        : Promise.resolve([]),
    ]);

    const facets = includeFacets
      ? {
          months: (monthBuckets || []).map((row) => ({
            value: row._id,
            count: row.count || 0,
          })),
        }
      : undefined;

    return NextResponse.json(
      {
        items: items.map((item) => ({
          ...item,
          alt: item.altText || item.alt || "",
          url: item.url || item.originalUrl || "",
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
        facets,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    await connectDB();
    const settings = await getMediaSettings();

    const formData = await req.formData();
    const file = formData.get("file");
    const altText = String(formData.get("altText") || formData.get("alt") || "");
    const title = String(formData.get("title") || "");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const rawMimeType = String(file.type || "").toLowerCase().trim();
    const ext = path.extname(String(file.name || "")).toLowerCase();
    const mimeType = rawMimeType || UPLOAD_MIME_BY_EXT[ext] || "";
    if (!ALLOWED_UPLOAD_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        {
          error: `Unsupported file type${
            mimeType ? `: ${mimeType}` : ""
          }. Allowed: JPG, JPEG, PNG, WEBP, AVIF, GIF, SVG, PDF.`,
        },
        { status: 400 },
      );
    }

    const cropContract = parseCropContractFromFormData(formData, { mimeType });

    const maxUploadBytes = Number(settings.maxUploadMB || 20) * 1024 * 1024;
    if (file.size > maxUploadBytes) {
      return NextResponse.json(
        { error: `File too large. Max size: ${settings.maxUploadMB || 20}MB` },
        { status: 400 },
      );
    }

    let buffer = Buffer.from(await file.arrayBuffer());
    if (isSvgMimeType(mimeType)) {
      const sanitizedSvg = sanitizeUploadedSvg(buffer);
      if (!sanitizedSvg.ok) {
        return NextResponse.json({ error: sanitizedSvg.error }, { status: 400 });
      }
      buffer = sanitizedSvg.buffer;
    }
    const safeName = sanitizeName(file.name) || `upload${ext || ".bin"}`;

    const draft = await Media.create({
      filename: `pending-${Date.now()}`,
      fileName: `pending-${Date.now()}`,
      originalName: file.name || safeName,
      mimeType,
      size: buffer.length,
      url: "/uploads/pending",
      originalUrl: "/uploads/pending",
      status: "processing",
      alt: altText,
      altText,
      title: title || safeName,
      uploadedBy: session.email || session.name || "",
      createdBy: session.email || session.name || "",
      updatedBy: session.email || session.name || "",
    });

    const storageProvider = process.env.MEDIA_STORAGE_PROVIDER || "local";
    const optimized = await optimizeAndStoreUpload({
      buffer,
      mimeType,
      originalName: safeName,
      mediaId: String(draft._id),
      settings,
      storageProvider,
      crop: cropContract.crop,
      targetWidth: cropContract.targetWidth,
      targetHeight: cropContract.targetHeight,
      rotation: cropContract.rotationDegrees,
    });

    draft.filename = optimized.filename || draft.filename;
    draft.fileName = optimized.fileName || draft.fileName || draft.filename;
    draft.originalName = file.name || draft.originalName;
    draft.mimeType = optimized.mimeType || mimeType;
    draft.ext = optimized.ext || ext;
    draft.storageProvider = optimized.storageProvider || storageProvider;
    draft.storageKey = optimized.storageKey || draft.storageKey || "";
    draft.publicUrl =
      optimized.publicUrl || `/media/${draft._id}?size=original&format=auto`;
    draft.url = optimized.url || draft.url;
    draft.originalUrl = optimized.originalUrl || draft.originalUrl || draft.url;
    draft.webpUrl = optimized.webpUrl || "";
    draft.avifUrl = optimized.avifUrl || "";
    draft.width = optimized.width || 0;
    draft.height = optimized.height || 0;
    draft.size = optimized.size || buffer.length;
    draft.originalSize = optimized.originalSize || buffer.length;
    draft.optimizedSize = optimized.optimizedSize || buffer.length;
    draft.savingsPercentage = optimized.savingsPercentage || 0;
    draft.generatedSizes = optimized.generatedSizes || {};
    draft.originalWidth = optimized.originalWidth || 0;
    draft.originalHeight = optimized.originalHeight || 0;
    draft.cropX = optimized.cropX || 0;
    draft.cropY = optimized.cropY || 0;
    draft.cropWidth = optimized.cropWidth || 0;
    draft.cropHeight = optimized.cropHeight || 0;
    draft.finalWidth = optimized.finalWidth || 0;
    draft.finalHeight = optimized.finalHeight || 0;
    draft.status = optimized.status || "ready";
    draft.errorMessage = optimized.errorMessage || "";
    draft.updatedBy = session.email || session.name || "";
    await draft.save();

    return NextResponse.json(draft, { status: 201 });
  } catch (err) {
    if (isCropContractError(err)) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status || 400 },
      );
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

