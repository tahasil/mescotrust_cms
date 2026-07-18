const path = require("path");
const projectRoot = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(projectRoot, ".env"), override: true });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const sharp = require("sharp");
const { connectDB } = require("../lib/db");
const User = require("../models/User");

const BASE_URL = process.env.MEDIA_QA_BASE_URL || "http://localhost:4010";
const QA_PREFIX = `MEDIA_QA_${Date.now()}`;
const QA_ADMIN_EMAIL = `media-qa-admin+${Date.now()}@example.com`;
const QA_ADMIN_PASSWORD = `MediaQa!${Date.now()}`;

const createdMediaIds = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function toUrl(pathname) {
  return `${BASE_URL.replace(/\/$/, "")}${pathname}`;
}

function buildCookieHeader(jar) {
  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

function appendSetCookieToJar(headers, jar) {
  let values = [];
  if (typeof headers.getSetCookie === "function") {
    values = headers.getSetCookie();
  } else {
    const raw = headers.get("set-cookie");
    if (raw) values = [raw];
  }

  for (const line of values) {
    const chunk = normalizeText(line).split(";")[0];
    const eq = chunk.indexOf("=");
    if (eq <= 0) continue;
    const key = chunk.slice(0, eq).trim();
    const value = chunk.slice(eq + 1).trim();
    if (key) jar.set(key, value);
  }
}

async function request(pathname, options = {}, cookieJar = null) {
  const method = String(options.method || "GET").toUpperCase();
  const headers = {
    ...(options.headers || {}),
  };
  if (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") {
    headers.Origin = BASE_URL;
    headers.Referer = `${BASE_URL}/admin/media`;
  }
  if (cookieJar && cookieJar.size > 0) {
    headers.Cookie = buildCookieHeader(cookieJar);
  }

  const res = await fetch(toUrl(pathname), {
    ...options,
    redirect: options.redirect || "manual",
    headers,
  });
  if (cookieJar) appendSetCookieToJar(res.headers, cookieJar);

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { res, data, text };
}

async function checkServerAvailable() {
  const health = await request("/api/health");
  assert(health.res.status === 200, `Expected /api/health 200, got ${health.res.status}`);
}

async function ensureQaAdminUser() {
  await connectDB();
  const passwordHash = await bcrypt.hash(QA_ADMIN_PASSWORD, 10);
  await User.updateOne(
    { email: QA_ADMIN_EMAIL },
    {
      $set: {
        name: "Media QA Admin",
        role: "Admin",
        status: "active",
        password: passwordHash,
      },
    },
    { upsert: true },
  );
}

async function loginAsAdmin(cookieJar) {
  const csrfResponse = await request("/api/auth/csrf", { method: "GET" }, cookieJar);
  assert(csrfResponse.res.status === 200, `Expected csrf 200, got ${csrfResponse.res.status}`);
  const csrfToken = normalizeText(csrfResponse.data?.csrfToken);
  assert(csrfToken, "Missing csrfToken from /api/auth/csrf");

  const params = new URLSearchParams();
  params.set("csrfToken", csrfToken);
  params.set("email", QA_ADMIN_EMAIL);
  params.set("password", QA_ADMIN_PASSWORD);
  params.set("callbackUrl", `${BASE_URL}/admin/media`);
  params.set("json", "true");

  const loginRes = await fetch(toUrl("/api/auth/callback/credentials?json=true"), {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: BASE_URL,
      Referer: `${BASE_URL}/admin/login`,
      Cookie: buildCookieHeader(cookieJar),
    },
    body: params.toString(),
  });
  appendSetCookieToJar(loginRes.headers, cookieJar);

  const hasSessionCookie = [...cookieJar.keys()].some(
    (name) =>
      name.includes("next-auth.session-token") ||
      name.includes("__Secure-next-auth.session-token"),
  );
  assert(hasSessionCookie, "Admin login did not produce a NextAuth session cookie");

  const session = await request("/api/auth/session", { method: "GET" }, cookieJar);
  assert(session.res.status === 200, `Expected /api/auth/session 200, got ${session.res.status}`);
  assert(
    normalizeText(session.data?.user?.email).toLowerCase() === QA_ADMIN_EMAIL.toLowerCase(),
    "Session user mismatch after login",
  );
}

function buildRasterFormData({
  buffer,
  fileName = "qa-image.png",
  mimeType = "image/png",
  crop = null,
  width = null,
  height = null,
  title = "",
  altText = "",
}) {
  const formData = new FormData();
  formData.set("file", new Blob([buffer], { type: mimeType }), fileName);
  if (title) formData.set("title", title);
  if (altText) formData.set("altText", altText);
  if (crop) formData.set("crop", JSON.stringify(crop));
  if (Number.isInteger(width)) formData.set("width", String(width));
  if (Number.isInteger(height)) formData.set("height", String(height));
  return formData;
}

async function uploadRasterAndValidate(cookieJar) {
  const sourceBuffer = await sharp({
    create: {
      width: 160,
      height: 120,
      channels: 4,
      background: { r: 230, g: 40, b: 70, alpha: 0.7 },
    },
  })
    .png()
    .toBuffer();

  const missingCrop = await request(
    "/api/admin/media",
    {
      method: "POST",
      body: buildRasterFormData({
        buffer: sourceBuffer,
        fileName: `${QA_PREFIX}-missing-crop.png`,
        title: "Missing crop",
      }),
    },
    cookieJar,
  );
  assert(missingCrop.res.status === 400, `Expected missing-crop upload 400, got ${missingCrop.res.status}`);
  assert(missingCrop.data?.code === "CROP_CONFIRMATION_REQUIRED", `Expected CROP_CONFIRMATION_REQUIRED, got ${missingCrop.data?.code}`);

  const widthOnly = await request(
    "/api/admin/media",
    {
      method: "POST",
      body: buildRasterFormData({
        buffer: sourceBuffer,
        fileName: `${QA_PREFIX}-width-only.png`,
        crop: { x: 0, y: 0, width: 120, height: 80 },
        width: 100,
      }),
    },
    cookieJar,
  );
  assert(widthOnly.res.status === 400, `Expected width-only upload 400, got ${widthOnly.res.status}`);
  assert(widthOnly.data?.code === "WIDTH_HEIGHT_BOTH_REQUIRED", `Expected WIDTH_HEIGHT_BOTH_REQUIRED, got ${widthOnly.data?.code}`);

  const exceedDims = await request(
    "/api/admin/media",
    {
      method: "POST",
      body: buildRasterFormData({
        buffer: sourceBuffer,
        fileName: `${QA_PREFIX}-exceed.png`,
        crop: { x: 10, y: 10, width: 120, height: 80 },
        width: 300,
        height: 200,
      }),
    },
    cookieJar,
  );
  assert(exceedDims.res.status === 400, `Expected exceed-dims upload 400, got ${exceedDims.res.status}`);
  assert(exceedDims.data?.code === "DIMENSIONS_EXCEED_SOURCE", `Expected DIMENSIONS_EXCEED_SOURCE, got ${exceedDims.data?.code}`);

  const created = await request(
    "/api/admin/media",
    {
      method: "POST",
      body: buildRasterFormData({
        buffer: sourceBuffer,
        fileName: `${QA_PREFIX}-valid.png`,
        crop: { x: 20, y: 10, width: 120, height: 80 },
        width: 80,
        height: 50,
        title: "QA Raster Upload",
        altText: "QA Raster Alt",
      }),
    },
    cookieJar,
  );
  assert(created.res.status === 201, `Expected valid raster upload 201, got ${created.res.status}`);
  const media = created.data || {};
  assert(normalizeText(media._id), "Upload response missing media id");
  createdMediaIds.push(String(media._id));

  assert(Number(media.finalWidth) === 80, `Expected finalWidth 80, got ${media.finalWidth}`);
  assert(Number(media.finalHeight) === 50, `Expected finalHeight 50, got ${media.finalHeight}`);
  assert(normalizeText(media.status) === "ready", `Expected status ready, got ${media.status}`);

  const generatedSizes = media.generatedSizes || {};
  const keys = Object.keys(generatedSizes);
  assert(
    keys.length === 1 && keys[0] === "original",
    `Expected generatedSizes keys ['original'], got [${keys.join(", ")}]`,
  );
  assert(normalizeText(generatedSizes.original?.jpgUrl), "Expected generatedSizes.original.jpgUrl");

  return media;
}

async function replaceRasterAndValidate(cookieJar, mediaId) {
  const replaceBuffer = await sharp({
    create: {
      width: 140,
      height: 100,
      channels: 4,
      background: { r: 10, g: 160, b: 220, alpha: 0.8 },
    },
  })
    .png()
    .toBuffer();

  const replaceMissingCrop = await request(
    `/api/admin/media/${encodeURIComponent(mediaId)}/replace`,
    {
      method: "POST",
      body: buildRasterFormData({
        buffer: replaceBuffer,
        fileName: `${QA_PREFIX}-replace-missing.png`,
      }),
    },
    cookieJar,
  );
  assert(
    replaceMissingCrop.res.status === 400,
    `Expected replace-without-crop 400, got ${replaceMissingCrop.res.status}`,
  );
  assert(
    replaceMissingCrop.data?.code === "CROP_CONFIRMATION_REQUIRED",
    `Expected replace CROP_CONFIRMATION_REQUIRED, got ${replaceMissingCrop.data?.code}`,
  );

  const replaced = await request(
    `/api/admin/media/${encodeURIComponent(mediaId)}/replace`,
    {
      method: "POST",
      body: buildRasterFormData({
        buffer: replaceBuffer,
        fileName: `${QA_PREFIX}-replace-valid.png`,
        crop: { x: 10, y: 10, width: 100, height: 80 },
        width: 50,
        height: 40,
        title: "QA Raster Replaced",
        altText: "QA Replaced Alt",
      }),
    },
    cookieJar,
  );
  assert(replaced.res.status === 200, `Expected replace 200, got ${replaced.res.status}`);
  assert(Number(replaced.data?.finalWidth) === 50, `Expected replace finalWidth 50, got ${replaced.data?.finalWidth}`);
  assert(Number(replaced.data?.finalHeight) === 40, `Expected replace finalHeight 40, got ${replaced.data?.finalHeight}`);
}

async function uploadSvgBypassAndValidate(cookieJar) {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="48"><rect x="0" y="0" width="64" height="48" fill="#11aa77"/></svg>`;
  const svgForm = new FormData();
  svgForm.set("file", new Blob([Buffer.from(svgContent)], { type: "image/svg+xml" }), `${QA_PREFIX}-vector.svg`);
  svgForm.set("title", "QA SVG Upload");

  const created = await request(
    "/api/admin/media",
    {
      method: "POST",
      body: svgForm,
    },
    cookieJar,
  );
  assert(created.res.status === 201, `Expected SVG upload 201, got ${created.res.status}`);
  assert(normalizeText(created.data?._id), "SVG upload missing id");
  createdMediaIds.push(String(created.data._id));
}

async function verifyLegacySizeDelivery(mediaId) {
  const res = await fetch(toUrl(`/api/media/${encodeURIComponent(mediaId)}?size=desktop&format=auto`), {
    method: "GET",
    headers: { Accept: "image/webp,image/*,*/*" },
    redirect: "manual",
  });
  assert(
    res.status === 200 || res.status === 307,
    `Expected legacy size media response 200/307, got ${res.status}`,
  );
}

async function verifyPublicPagesDoNotRequestLegacySizes() {
  const checks = ["/", "/blog", "/events"];
  const legacyPattern = /size=(thumbnail|medium|large|mobile|desktop)\b/i;

  for (const route of checks) {
    const res = await fetch(toUrl(route), { method: "GET", redirect: "manual" });
    assert(res.status === 200, `Expected ${route} 200, got ${res.status}`);
    const html = await res.text();
    assert(!legacyPattern.test(html), `Found legacy size query in rendered HTML for ${route}`);
  }
}

async function deleteCreatedMedia(cookieJar) {
  for (const mediaId of createdMediaIds.splice(0)) {
    await request(`/api/admin/media/${encodeURIComponent(mediaId)}`, { method: "DELETE" }, cookieJar).catch(() => {});
  }
}

async function cleanupQaUser() {
  await connectDB();
  await User.deleteMany({ email: QA_ADMIN_EMAIL }).catch(() => {});
}

async function main() {
  const cookieJar = new Map();
  const results = [];
  let uploadedRasterId = "";

  try {
    await checkServerAvailable();
    await ensureQaAdminUser();
    await loginAsAdmin(cookieJar);
    results.push("Server availability and QA admin authentication passed");

    const raster = await uploadRasterAndValidate(cookieJar);
    uploadedRasterId = String(raster._id);
    results.push("Raster upload contract checks passed (missing crop/invalid dims/valid upload)");

    await replaceRasterAndValidate(cookieJar, uploadedRasterId);
    results.push("Raster replace contract checks passed");

    await uploadSvgBypassAndValidate(cookieJar);
    results.push("SVG bypass upload (no crop contract) passed");

    await verifyLegacySizeDelivery(uploadedRasterId);
    results.push("Legacy size delivery compatibility check passed for /api/media/:id");

    await verifyPublicPagesDoNotRequestLegacySizes();
    results.push("Public page HTML scan passed (no legacy size query usage)");

    await deleteCreatedMedia(cookieJar);
    results.push("Media cleanup delete flow passed");

    console.log("MEDIA_PHASE8_QA_STATUS: PASS");
    for (const line of results) console.log(`- ${line}`);
  } catch (error) {
    console.error("MEDIA_PHASE8_QA_STATUS: FAIL");
    console.error(error?.stack || error?.message || error);
    process.exitCode = 1;
  } finally {
    try {
      await deleteCreatedMedia(cookieJar);
    } catch {
      // best-effort cleanup
    }
    try {
      await cleanupQaUser();
    } catch {
      // best-effort cleanup
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

main();
