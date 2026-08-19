const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { toAbsolutePath } = require("../lib/storage/localStorage");
const mongoose = require("mongoose");

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

test("PDF viewer proxy route live contract tests", async (t) => {
  const testUploadsDir = toAbsolutePath("uploads");
  const testPdfFilename = "test-contract-sample.pdf";
  const testPdfPath = path.join(testUploadsDir, testPdfFilename);
  const dummyPdfBuffer = Buffer.from(
    "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kinds [] /Count 0 >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n"
  );

  fs.mkdirSync(testUploadsDir, { recursive: true });
  fs.writeFileSync(testPdfPath, dummyPdfBuffer);

  t.after(() => {
    try {
      fs.unlinkSync(testPdfPath);
    } catch {}
  });

  await t.test("rejects request missing src parameter", async () => {
    const res = await fetch(`${BASE_URL}/api/public/pdf-viewer`);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /valid PDF URL/i);
  });

  await t.test("serves local uploaded PDF directly from disk with 200 status", async () => {
    const res = await fetch(
      `${BASE_URL}/api/public/pdf-viewer?src=%2Fuploads%2F${testPdfFilename}`
    );
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "application/pdf");
    assert.equal(res.headers.get("accept-ranges"), "bytes");
    assert.equal(res.headers.get("x-frame-options"), "SAMEORIGIN");
    assert.match(
      res.headers.get("content-disposition"),
      /inline;\s*filename="test-contract-sample\.pdf"/i
    );
    const body = await res.arrayBuffer();
    assert.equal(body.byteLength, dummyPdfBuffer.length);
  });

  await t.test("serves Range bytes=0-0 request with status 206 for verifyPdf MIME probe", async () => {
    const res = await fetch(
      `${BASE_URL}/api/public/pdf-viewer?src=%2Fuploads%2F${testPdfFilename}`,
      { headers: { Range: "bytes=0-0" } }
    );
    assert.equal(res.status, 206);
    assert.equal(res.headers.get("content-type"), "application/pdf");
    assert.equal(res.headers.get("content-length"), "1");
    assert.equal(
      res.headers.get("content-range"),
      `bytes 0-0/${dummyPdfBuffer.length}`
    );
    const body = await res.arrayBuffer();
    assert.equal(body.byteLength, 1);
  });

  await t.test("serves /media/<id> documents from disk without an internal self-fetch", async () => {
    // Regression: behind a reverse proxy `req.nextUrl.origin` is the internal
    // listener, so resolving /media/<id> via HTTP self-fetch returned 502.
    const uri = fs
      .readFileSync(path.join(__dirname, "..", ".env"), "utf8")
      .match(/MONGODB_URI=(.*)/)[1]
      .trim();
    await mongoose.connect(uri);

    const mediaId = new mongoose.Types.ObjectId();
    const storageKey = `uploads/${mediaId}-media-contract.pdf`;
    const mediaFilePath = toAbsolutePath(storageKey);
    fs.mkdirSync(path.dirname(mediaFilePath), { recursive: true });
    fs.writeFileSync(mediaFilePath, dummyPdfBuffer);

    const collection = mongoose.connection.db.collection("media");
    await collection.insertOne({
      _id: mediaId,
      filename: "media-contract.pdf",
      mimeType: "application/pdf",
      url: `/${storageKey}`,
      originalUrl: `/${storageKey}`,
      storageProvider: "local",
    });

    try {
      // Proxy headers make the resolved origin unreachable from this process,
      // so a passing request proves the file came off disk.
      const res = await fetch(
        `${BASE_URL}/api/public/pdf-viewer?src=%2Fmedia%2F${mediaId}%3Fsize%3Doriginal%26format%3Dauto`,
        {
          headers: {
            "x-forwarded-host": "mescotrust.org",
            "x-forwarded-proto": "https",
          },
        }
      );
      assert.equal(res.status, 200);
      assert.equal(res.headers.get("content-type"), "application/pdf");
      const body = await res.arrayBuffer();
      assert.equal(body.byteLength, dummyPdfBuffer.length);
    } finally {
      await collection.deleteOne({ _id: mediaId });
      await mongoose.disconnect();
      try {
        fs.unlinkSync(mediaFilePath);
      } catch {}
    }
  });

  await t.test("recognizes production domain match as local URL via X-Forwarded-Host header", async () => {
    const res = await fetch(
      `${BASE_URL}/api/public/pdf-viewer?src=https%3A%2F%2Fmescotrust.org%2Fuploads%2F${testPdfFilename}`,
      {
        headers: {
          "x-forwarded-host": "mescotrust.org",
        },
      }
    );
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "application/pdf");
  });

});
