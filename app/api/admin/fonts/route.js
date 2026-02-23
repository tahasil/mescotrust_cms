import { NextResponse } from "next/server";
import { writeFile, mkdir, readdir, unlink } from "fs/promises";
import path from "path";
import { requireAuth } from "@/lib/apiAuth";

const ALLOWED_EXTENSIONS = [".woff2", ".woff", ".ttf"];
const MAX_FONT_SIZE = 2 * 1024 * 1024; // 2MB

export async function GET(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const fontsDir = path.join(process.cwd(), "public", "uploads", "fonts");
    await mkdir(fontsDir, { recursive: true });
    const files = await readdir(fontsDir);
    const fonts = files
      .filter((f) => ALLOWED_EXTENSIONS.includes(path.extname(f).toLowerCase()))
      .map((f) => ({
        filename: f,
        url: `/uploads/fonts/${f}`,
      }));
    return NextResponse.json({ fonts });
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

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Invalid font format. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FONT_SIZE) {
      return NextResponse.json(
        { error: `Font file too large. Max: ${MAX_FONT_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fontsDir = path.join(process.cwd(), "public", "uploads", "fonts");
    await mkdir(fontsDir, { recursive: true });

    const filePath = path.join(fontsDir, safeName);
    await writeFile(filePath, buffer);

    return NextResponse.json({ filename: safeName, url: `/uploads/fonts/${safeName}` }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");
    if (!filename) {
      return NextResponse.json({ error: "filename param required" }, { status: 400 });
    }

    const safeName = path.basename(filename);
    const fontsDir = path.join(process.cwd(), "public", "uploads", "fonts");
    const filePath = path.join(fontsDir, safeName);

    try {
      await unlink(filePath);
    } catch {
      return NextResponse.json({ error: "Font file not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
