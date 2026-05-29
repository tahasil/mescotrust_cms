import mongoose from "mongoose";
import path from "path";
import { access, readdir, readFile, rm } from "fs/promises";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Form from "@/models/Form";
import { normalizeMapEmbedInput } from "@/lib/mapEmbed";

const DEFAULT_FORM_UI = {
  sectionBgGradient: "linear-gradient(172.897deg, rgb(0, 81, 111) 0%, rgb(0, 0, 0) 100%)",
  cardBg: "#ffffff",
  cardBorderRadius: 16,
  cardPadding: 24,
  titleColor: "#0b2130",
  labelColor: "#334155",
  labelColorKey: "",
  inputBg: "#ffffff",
  inputBorderColor: "#e5e7eb",
  inputTextColor: "#111827",
  buttonBg: "#f7b733",
  buttonBgColorKey: "",
  buttonTextColor: "#00516f",
  buttonTextColorKey: "",
  buttonHoverBg: "#ffffff",
  buttonHoverBgColorKey: "",
  buttonHoverTextColor: "#00516f",
  buttonHoverTextColorKey: "",
  buttonRadius: 24,
  leftContentHtml:
    "<p>We are happy to work with interns or people or organizations who are enthusiastic on working and helping startups grow.</p><p>If you think you can work and you have it in you or if you would like to collaborate with us in this space, then register your interest here. We will get back to you as soon as possible to discuss over a cup of coffee.</p>",
  leftContentColor: "#1f2933",
  leftContentColorKey: "",
  leftContentAlign: "left",
  leftContentFontSize: 16,
  leftContentLineHeight: 1.6,
  leftContentBottomSpacing: 16,
  leftMapTopSpacing: 18,
  mapEmbedUrl:
    "https://maps.google.com/maps?q=Karnataka%20Bangalore&t=&z=14&ie=UTF8&iwloc=&output=embed",
  mapHeightDesktop: 370,
  mapHeightTablet: 300,
  mapHeightMobile: 260,
  mapBorderRadius: 4,
  mapBorderColor: "#edf0f3",
  mapBorderColorKey: "",
};
const DEFAULT_SUCCESS_MESSAGE = "Form submitted successfully.";

function toFiniteNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toUiPatch(raw) {
  const input = raw && typeof raw === "object" ? raw : {};
  const patch = {};

  if ("labelColor" in input) {
    patch.labelColor = String(input.labelColor || DEFAULT_FORM_UI.labelColor);
  }
  if ("labelColorKey" in input) {
    patch.labelColorKey = String(input.labelColorKey || "");
  }
  if ("buttonBg" in input) {
    patch.buttonBg = String(input.buttonBg || DEFAULT_FORM_UI.buttonBg);
  }
  if ("buttonBgColorKey" in input) {
    patch.buttonBgColorKey = String(input.buttonBgColorKey || "");
  }
  if ("buttonTextColor" in input) {
    patch.buttonTextColor = String(input.buttonTextColor || DEFAULT_FORM_UI.buttonTextColor);
  }
  if ("buttonTextColorKey" in input) {
    patch.buttonTextColorKey = String(input.buttonTextColorKey || "");
  }
  if ("buttonHoverBg" in input) {
    patch.buttonHoverBg = String(input.buttonHoverBg || DEFAULT_FORM_UI.buttonHoverBg);
  }
  if ("buttonHoverBgColorKey" in input) {
    patch.buttonHoverBgColorKey = String(input.buttonHoverBgColorKey || "");
  }
  if ("buttonHoverTextColor" in input) {
    patch.buttonHoverTextColor = String(input.buttonHoverTextColor || DEFAULT_FORM_UI.buttonHoverTextColor);
  }
  if ("buttonHoverTextColorKey" in input) {
    patch.buttonHoverTextColorKey = String(input.buttonHoverTextColorKey || "");
  }
  if ("buttonRadius" in input) {
    patch.buttonRadius = toFiniteNumber(input.buttonRadius, DEFAULT_FORM_UI.buttonRadius);
  }

  if ("leftContentHtml" in input) {
    patch.leftContentHtml = String(input.leftContentHtml || DEFAULT_FORM_UI.leftContentHtml);
  }
  if ("leftContentColor" in input) {
    patch.leftContentColor = String(input.leftContentColor || DEFAULT_FORM_UI.leftContentColor);
  }
  if ("leftContentColorKey" in input) {
    patch.leftContentColorKey = String(input.leftContentColorKey || "");
  }
  if ("leftContentAlign" in input) {
    const rawAlign = String(input.leftContentAlign || "").trim().toLowerCase();
    patch.leftContentAlign =
      rawAlign === "center" || rawAlign === "right" ? rawAlign : "left";
  }
  if ("leftContentFontSize" in input) {
    patch.leftContentFontSize = toFiniteNumber(
      input.leftContentFontSize,
      DEFAULT_FORM_UI.leftContentFontSize,
    );
  }
  if ("leftContentLineHeight" in input) {
    patch.leftContentLineHeight = toFiniteNumber(
      input.leftContentLineHeight,
      DEFAULT_FORM_UI.leftContentLineHeight,
    );
  }
  if ("leftContentBottomSpacing" in input) {
    patch.leftContentBottomSpacing = toFiniteNumber(
      input.leftContentBottomSpacing,
      DEFAULT_FORM_UI.leftContentBottomSpacing,
    );
  }
  if ("leftMapTopSpacing" in input) {
    patch.leftMapTopSpacing = toFiniteNumber(
      input.leftMapTopSpacing,
      DEFAULT_FORM_UI.leftMapTopSpacing,
    );
  }
  if ("mapEmbedUrl" in input) {
    patch.mapEmbedUrl =
      normalizeMapEmbedInput(input.mapEmbedUrl) || DEFAULT_FORM_UI.mapEmbedUrl;
  }
  if ("mapHeightDesktop" in input) {
    patch.mapHeightDesktop = toFiniteNumber(
      input.mapHeightDesktop,
      DEFAULT_FORM_UI.mapHeightDesktop,
    );
  }
  if ("mapHeightTablet" in input) {
    patch.mapHeightTablet = toFiniteNumber(
      input.mapHeightTablet,
      DEFAULT_FORM_UI.mapHeightTablet,
    );
  }
  if ("mapHeightMobile" in input) {
    patch.mapHeightMobile = toFiniteNumber(
      input.mapHeightMobile,
      DEFAULT_FORM_UI.mapHeightMobile,
    );
  }
  if ("mapBorderRadius" in input) {
    patch.mapBorderRadius = toFiniteNumber(
      input.mapBorderRadius,
      DEFAULT_FORM_UI.mapBorderRadius,
    );
  }
  if ("mapBorderColor" in input) {
    patch.mapBorderColor = String(input.mapBorderColor || DEFAULT_FORM_UI.mapBorderColor);
  }
  if ("mapBorderColorKey" in input) {
    patch.mapBorderColorKey = String(input.mapBorderColorKey || "");
  }

  return patch;
}

function invalidId(id) {
  return !mongoose.Types.ObjectId.isValid(id);
}

function buildFormFolderName(name = "") {
  const cleaned = String(name || "").replace(/[^a-zA-Z0-9]+/g, "").trim();
  return (cleaned || "Form").slice(0, 80);
}

function isPathInside(baseDir, targetPath) {
  const base = path.resolve(baseDir);
  const target = path.resolve(targetPath);
  if (base.toLowerCase() === target.toLowerCase()) return false;
  const baseWithSep = base.endsWith(path.sep) ? base : `${base}${path.sep}`;
  return target.toLowerCase().startsWith(baseWithSep.toLowerCase());
}

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function findGeneratedFoldersByFormKey(formsRoot, formKey) {
  const matches = new Set();
  if (!formsRoot || !formKey) return matches;
  if (!(await pathExists(formsRoot))) return matches;

  let entries = [];
  try {
    entries = await readdir(formsRoot, { withFileTypes: true });
  } catch {
    return matches;
  }

  for (const entry of entries) {
    if (!entry?.isDirectory?.()) continue;
    const folderPath = path.join(formsRoot, entry.name);
    if (!isPathInside(formsRoot, folderPath)) continue;

    const metaPath = path.join(folderPath, "form.meta.json");
    // eslint-disable-next-line no-await-in-loop
    const hasMeta = await pathExists(metaPath);
    if (!hasMeta) continue;

    try {
      // eslint-disable-next-line no-await-in-loop
      const raw = await readFile(metaPath, "utf8");
      const meta = JSON.parse(raw);
      const metaFormKey = String(meta?.formKey || "").trim();
      if (metaFormKey && metaFormKey.toLowerCase() === String(formKey).trim().toLowerCase()) {
        matches.add(folderPath);
      }
    } catch {
      // Ignore invalid/unreadable metadata file.
    }
  }

  return matches;
}

async function readFolderMetaFormKey(folderPath) {
  const metaPath = path.join(folderPath, "form.meta.json");
  const hasMeta = await pathExists(metaPath);
  if (!hasMeta) return null;
  try {
    const raw = await readFile(metaPath, "utf8");
    const meta = JSON.parse(raw);
    return String(meta?.formKey || "").trim() || null;
  } catch {
    return null;
  }
}

function pathsEqual(a, b) {
  return path.resolve(String(a || "")).toLowerCase() === path.resolve(String(b || "")).toLowerCase();
}

export async function GET(req, { params }) {
  const session = await requirePermission(req, "forms.view");
  if (session instanceof NextResponse) return session;

  try {
    const id = String(params?.id || "");
    if (invalidId(id)) return NextResponse.json({ error: "Invalid form id" }, { status: 400 });

    await connectDB();
    const doc = await Form.findById(id).lean();
    if (!doc) return NextResponse.json({ error: "Form not found" }, { status: 404 });
    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to load form" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await requirePermission(req, "forms.edit");
  if (session instanceof NextResponse) return session;

  try {
    const id = String(params?.id || "");
    if (invalidId(id)) return NextResponse.json({ error: "Invalid form id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const hasName = Object.prototype.hasOwnProperty.call(body, "name");
    const nextName = hasName ? String(body?.name || "").trim() : null;
    if (hasName && !nextName) {
      return NextResponse.json({ error: "Form name is required" }, { status: 400 });
    }
    const hasIsActive = Object.prototype.hasOwnProperty.call(body, "isActive");
    const hasSuccessMessage = Object.prototype.hasOwnProperty.call(body, "successMessage");
    const successMessage = hasSuccessMessage
      ? String(body?.successMessage || "").trim()
      : null;
    const uiPatch = Object.prototype.hasOwnProperty.call(body, "ui")
      ? toUiPatch(body?.ui)
      : null;

    await connectDB();
    const doc = await Form.findById(id);
    if (!doc) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    if (hasName && nextName) doc.name = nextName;
    if (hasIsActive) doc.isActive = body?.isActive !== false;
    if (hasSuccessMessage) {
      doc.successMessage = successMessage || DEFAULT_SUCCESS_MESSAGE;
    }
    if (uiPatch && Object.keys(uiPatch).length > 0) {
      doc.ui = { ...DEFAULT_FORM_UI, ...(doc.ui || {}), ...uiPatch };
    }
    doc.updatedBy = session?.email || "";
    await doc.save();

    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to update form" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await requirePermission(req, "forms.delete");
  if (session instanceof NextResponse) return session;

  try {
    const id = String(params?.id || "");
    if (invalidId(id)) return NextResponse.json({ error: "Invalid form id" }, { status: 400 });

    await connectDB();
    const doc = await Form.findById(id);
    if (!doc) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    const root = process.cwd();
    const formsRoot = path.join(root, "components", "admin", "forms");
    const fallbackFolder = buildFormFolderName(doc.name);
    const resolvedScaffoldPath = doc?.scaffold?.relativePath
      ? path.resolve(root, String(doc.scaffold.relativePath))
      : null;
    const candidatePaths = new Set([
      path.join(formsRoot, fallbackFolder),
      path.join(formsRoot, `${fallbackFolder}-${doc.formKey}`),
      path.join(formsRoot, buildFormFolderName(doc.formKey)),
    ]);
    if (resolvedScaffoldPath) {
      candidatePaths.add(resolvedScaffoldPath);
    }
    const discoveredFolders = await findGeneratedFoldersByFormKey(formsRoot, doc.formKey);
    for (const discovered of discoveredFolders) {
      candidatePaths.add(discovered);
    }

    const removedPaths = [];
    for (const candidate of candidatePaths) {
      if (!isPathInside(formsRoot, candidate)) continue;
      // eslint-disable-next-line no-await-in-loop
      const exists = await pathExists(candidate);
      if (!exists) continue;

      // Delete only folders that are confirmed to belong to this form.
      // Priority: explicit form.meta.json formKey match.
      // Fallback: exact scaffold path match (legacy folders may miss meta).
      // eslint-disable-next-line no-await-in-loop
      const metaFormKey = await readFolderMetaFormKey(candidate);
      const belongsByMeta =
        String(metaFormKey || "").toLowerCase() === String(doc.formKey || "").toLowerCase();
      const belongsByScaffold =
        !metaFormKey &&
        resolvedScaffoldPath &&
        pathsEqual(candidate, resolvedScaffoldPath);
      if (!belongsByMeta && !belongsByScaffold) continue;

      // eslint-disable-next-line no-await-in-loop
      await rm(candidate, { recursive: true, force: true });
      removedPaths.push(candidate);
    }

    const deleted = await Form.softDeleteById(id, {
      deletedBy: session?.email || session?.id || "",
    });
    if (!deleted) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      softDeleted: true,
      removedPaths,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to delete form" }, { status: 500 });
  }
}
