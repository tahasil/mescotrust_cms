import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Media from "@/models/Media";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 8192; // 8192px max width or height

function getImageDimensions(buffer, mimeType) {
  try {
    if (mimeType === "image/png" && buffer.length > 24) {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    if ((mimeType === "image/jpeg" || mimeType === "image/jpg") && buffer.length > 2) {
      let offset = 2;
      while (offset < buffer.length - 1) {
        if (buffer[offset] !== 0xff) break;
        const marker = buffer[offset + 1];
        if (marker === 0xc0 || marker === 0xc2) {
          if (offset + 9 < buffer.length) {
            return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
          }
        }
        if (marker === 0xd9 || marker === 0xda) break;
        const len = buffer.readUInt16BE(offset + 2);
        offset += 2 + len;
      }
    }
    if (mimeType === "image/gif" && buffer.length > 10) {
      return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
    }
    if (mimeType === "image/webp" && buffer.length > 30) {
      const riff = buffer.toString("ascii", 0, 4);
      if (riff === "RIFF") {
        const vp8 = buffer.toString("ascii", 12, 16);
        if (vp8 === "VP8 " && buffer.length > 29) {
          return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
        }
        if (vp8 === "VP8L" && buffer.length > 25) {
          const bits = buffer.readUInt32LE(21);
          return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
        }
      }
    }
  } catch {
    // parsing failed — return zeros
  }
  return { width: 0, height: 0 };
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

    const [items, total] = await Promise.all([
      Media.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Media.countDocuments(),
    ]);
    return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const alt = formData.get("alt") || "";

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid MIME type "${file.type}". Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const dims = getImageDimensions(buffer, file.type);
    if (dims.width > MAX_DIMENSION || dims.height > MAX_DIMENSION) {
      return NextResponse.json(
        { error: `Image too large: ${dims.width}x${dims.height}px. Max ${MAX_DIMENSION}x${MAX_DIMENSION}px.` },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${timestamp}_${safeName}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const url = `/uploads/${filename}`;

    await connectDB();
    const media = await Media.create({
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      url,
      alt,
      width: dims.width,
      height: dims.height,
      uploadedBy: session.email || session.name || "",
    });

    return NextResponse.json(media, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
