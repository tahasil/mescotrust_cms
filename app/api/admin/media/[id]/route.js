import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import Media from "@/models/Media";
import { getStorageAdapter } from "@/lib/storage";

function toStorageKey(urlOrKey) {
  const value = String(urlOrKey || "").trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return "";
  return value.replace(/^\/+/, "");
}

function collectPotentialStorageKeys(media) {
  const keys = new Set();
  const push = (v) => {
    const k = toStorageKey(v);
    if (k) keys.add(k);
  };

  push(media.storageKey);
  push(media.url);
  push(media.originalUrl);
  push(media.webpUrl);
  push(media.avifUrl);

  const sizes = media.generatedSizes || {};
  for (const name of Object.keys(sizes)) {
    const s = sizes[name] || {};
    push(s.jpgUrl);
    push(s.webpUrl);
    push(s.avifUrl);
  }

  return Array.from(keys);
}

export async function GET(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    await connectDB();
    const media = await Media.findById(id).lean();
    if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      ...media,
      alt: media.altText || media.alt || "",
      url: media.url || media.originalUrl || "",
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    await connectDB();
    const media = await Media.findById(id);
    if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (body.alt !== undefined || body.altText !== undefined) {
      const altValue = String(body.altText ?? body.alt ?? "");
      media.alt = altValue;
      media.altText = altValue;
    }
    if (body.title !== undefined) media.title = String(body.title || "");
    if (body.caption !== undefined) media.caption = String(body.caption || "");
    if (body.description !== undefined) media.description = String(body.description || "");

    media.updatedBy = session.email || session.name || "";
    await media.save();
    return NextResponse.json(media);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const id = params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    await connectDB();
    const media = await Media.findById(id);
    if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const force = String(searchParams.get("force") || "false") === "true";
    if (force && !isAdmin(session)) {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }
    const usedIn = Array.isArray(media.usedIn) ? media.usedIn : [];

    if (!force && usedIn.length > 0) {
      return NextResponse.json(
        {
          error: "Media is in use. Deletion blocked.",
          code: "MEDIA_IN_USE",
          usedIn,
        },
        { status: 409 },
      );
    }

    const provider = media.storageProvider || "local";
    const adapter = getStorageAdapter(provider);
    const keys = collectPotentialStorageKeys(media);

    for (const key of keys) {
      // best effort cleanup; ignore individual failures
      await adapter.deleteFile({ storageKey: key }).catch(() => {});
    }

    await Media.findByIdAndDelete(id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

