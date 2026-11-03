/**
 * Contract tests for the public donation history page (UAT DON-05).
 *
 * Part 1 (always runs, offline): OTP hashing, session signing, identifier
 * parsing, PII whitelist, history link sanitising.
 *
 * Part 2 (needs MONGODB_URI and `npm run dev` on BASE_URL, default
 * http://localhost:3000): the HTTP routes end to end. It creates its own
 * test rows (order IDs starting "DHTEST-", emails @example.invalid) and
 * removes them at the end. No email is sent unless DONOR_HISTORY_TEST_EMAIL
 * is set, in which case the matched request-otp and receipt re-send
 * scenarios also run and mail that address.
 *
 * The verify route allows 10 attempts per IP per minute; Part 2 uses 6, so
 * wait a minute between back-to-back runs.
 *
 * Run with: npm run test:donor-history
 */

const assert = require("assert");
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

const auth = require("../lib/donations/donorHistoryAuth");
const { signToken } = require("../lib/donations/signedToken");
const { normalizeHistoryLink, DEFAULT_HISTORY_LINK } = require("../lib/donateNowConfig");
const DonateNowSubmission = require("../models/DonateNowSubmission");
const DonorHistoryOtp = require("../models/DonorHistoryOtp");

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const API = `${BASE_URL}/api/public/donor-history`;

let passed = 0;
let failed = 0;
let skipped = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err?.message || err}`);
    failed++;
  }
}

function skip(name, reason) {
  console.log(`  [SKIP] ${name} (${reason})`);
  skipped++;
}

// ---------------------------------------------------------------------------
// Part 1: offline
// ---------------------------------------------------------------------------

async function runOffline() {
  console.log("\nPart 1: offline contracts");
  const key = auth.getHistoryKey({ NEXTAUTH_SECRET: "unit-test-secret" });

  await test("history key fails closed without NEXTAUTH_SECRET and differs from the raw secret", () => {
    assert.strictEqual(auth.getHistoryKey({}), "");
    assert.strictEqual(auth.getHistoryKey({ NEXTAUTH_SECRET: "  " }), "");
    assert.ok(key.length === 64);
    assert.notStrictEqual(key, "unit-test-secret");
  });

  await test("identifier parsing accepts email and 10-15 digit mobiles only", () => {
    assert.deepStrictEqual(auth.parseIdentifier("  Donor@Example.COM "), {
      type: "email",
      email: "donor@example.com",
    });
    const mobile = auth.parseIdentifier("+91 98765-43210");
    assert.strictEqual(mobile.type, "mobile");
    assert.ok(mobile.variants.includes("9876543210"));
    assert.strictEqual(auth.parseIdentifier("98765 43210").type, "mobile");
    for (const bad of ["", "abc", "12345", "abc9876543210", "a@b", "1234567890123456", null]) {
      assert.strictEqual(auth.parseIdentifier(bad), null, `should reject ${JSON.stringify(bad)}`);
    }
  });

  await test("the 'code sent to' address is masked but keeps the domain", () => {
    assert.strictEqual(auth.maskEmailForDisplay("Chandni@Gmail.com"), "ch*****@gmail.com");
    assert.strictEqual(auth.maskEmailForDisplay("ab@x.org"), "a***@x.org");
    assert.strictEqual(auth.maskEmailForDisplay("a@x.org"), "a***@x.org");
    assert.strictEqual(auth.maskEmailForDisplay("not-an-email"), "");
  });

  await test("codes are 6 digits", () => {
    for (let i = 0; i < 500; i++) {
      assert.match(auth.generateOtp(), /^\d{6}$/);
    }
    assert.ok(auth.isValidChallengeId(auth.generateChallengeId()));
    assert.ok(!auth.isValidChallengeId("not-a-challenge"));
  });

  await test("code is stored only as a hash bound to its challenge", () => {
    const challengeId = auth.generateChallengeId();
    const otherChallenge = auth.generateChallengeId();
    const code = "042917";
    const hash = auth.hashOtp(challengeId, code, key);
    assert.ok(!hash.includes(code));
    assert.ok(auth.otpMatches(challengeId, code, hash, key));
    assert.ok(!auth.otpMatches(challengeId, "042918", hash, key));
    assert.ok(!auth.otpMatches(otherChallenge, code, hash, key));
    assert.ok(!auth.otpMatches(challengeId, "42917", hash, key));
    assert.ok(!auth.otpMatches(challengeId, code, hash, auth.getHistoryKey({ NEXTAUTH_SECRET: "other" })));
  });

  await test("session round-trips and rejects expired, tampered and wrongly keyed tokens", () => {
    const now = Date.now();
    const token = auth.issueHistorySession("Donor@Example.com", key, now);
    assert.deepStrictEqual(auth.readHistorySession(token, key, now + 1000).email, "donor@example.com");
    assert.strictEqual(auth.readHistorySession(token, key, now + auth.SESSION_TTL_MS + 1), null);

    const [payload, signature] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ purpose: "donor-history", email: "victim@example.com", exp: now + 60_000 }),
    ).toString("base64url");
    assert.strictEqual(auth.readHistorySession(`${forged}.${signature}`, key, now), null);
    assert.strictEqual(auth.readHistorySession(`${payload}.${signature}x`, key, now), null);
    assert.strictEqual(auth.readHistorySession(token, auth.getHistoryKey({ NEXTAUTH_SECRET: "other" }), now), null);
    assert.strictEqual(auth.readHistorySession("", key, now), null);
  });

  await test("a donor-lookup verificationProof can't be used as a history session", () => {
    const proof = signToken(
      { sid: "abc", verified: true, email: "donor@example.com", mobile: "9876543210", exp: Date.now() + 60_000 },
      "unit-test-secret",
    );
    assert.strictEqual(auth.readHistorySession(proof, key), null);
    // Even signed with the history key, a token without the purpose is refused.
    const noPurpose = signToken({ email: "donor@example.com", exp: Date.now() + 60_000 }, key);
    assert.strictEqual(auth.readHistorySession(noPurpose, key), null);
  });

  await test("history rows never carry PAN, address or mobile", () => {
    const item = auth.toHistoryItem({
      orderId: "ORD1",
      amount: 5000,
      currency: "INR",
      purpose: "HCES",
      donationCategory: "Non-Zakat",
      completedAt: new Date("2026-10-01T10:00:00Z"),
      schemes: [{ schemeId: "hces", schemeName: "HCES", quantity: 2, subtotal: 5000, amount: 2500 }],
      donor: { name: "A Donor", pan: "ABCDE1234F", address: "12 Secret Street", mobile: "9876543210" },
      payment: { transactionId: "TXN1", paymentMode: "UPI", bankRefNo: "BANK1" },
      additionalFields: { pan: "ABCDE1234F" },
    });
    assert.deepStrictEqual(Object.keys(item).sort(), [
      "amount", "category", "currency", "date", "orderId", "paymentMode", "purpose", "schemes", "transactionId",
    ]);
    const json = JSON.stringify(item);
    for (const secret of ["ABCDE1234F", "Secret Street", "9876543210", "BANK1", "A Donor"]) {
      assert.ok(!json.includes(secret), `leaked ${secret}`);
    }
    assert.deepStrictEqual(item.schemes, [{ name: "HCES", quantity: 2, subtotal: 5000 }]);
  });

  await test("history filter is success-only, excludes deleted rows, and lowercases the email", () => {
    assert.deepStrictEqual(auth.getHistoryFilter(" Donor@Example.com "), {
      "donor.email": "donor@example.com",
      status: "success",
      isDeleted: { $ne: true },
    });
    const projection = auth.HISTORY_PROJECTION;
    for (const field of ["donor", "donor.pan", "donor.address", "donor.mobile", "additionalFields"]) {
      assert.ok(!(field in projection), `projection must not include ${field}`);
    }
  });

  await test("session cookie is httpOnly, SameSite=Lax and scoped to the history API", () => {
    const options = auth.getSessionCookieOptions({ secure: true });
    assert.strictEqual(options.httpOnly, true);
    assert.strictEqual(options.sameSite, "lax");
    assert.strictEqual(options.secure, true);
    assert.strictEqual(options.path, "/api/public/donor-history");
    assert.strictEqual(options.maxAge, auth.SESSION_TTL_MS / 1000);
  });

  await test("Donate page history link only allows same-site paths", () => {
    assert.deepStrictEqual(normalizeHistoryLink({}), { ...DEFAULT_HISTORY_LINK });
    assert.strictEqual(normalizeHistoryLink({ href: "/donor/history" }).href, "/donor/history");
    for (const bad of ["//evil.example", "https://evil.example", "javascript:alert(1)", "my-donations", "/a b"]) {
      assert.strictEqual(normalizeHistoryLink({ href: bad }).href, DEFAULT_HISTORY_LINK.href, bad);
    }
    assert.strictEqual(normalizeHistoryLink({ enabled: false }).enabled, false);
    assert.strictEqual(normalizeHistoryLink({ label: "  " }).label, DEFAULT_HISTORY_LINK.label);
  });
}

// ---------------------------------------------------------------------------
// Part 2: HTTP + DB
// ---------------------------------------------------------------------------

function getSetCookies(res) {
  if (typeof res.headers.getSetCookie === "function") return res.headers.getSetCookie();
  const raw = res.headers.get("set-cookie");
  return raw ? [raw] : [];
}

function sessionCookieFrom(res) {
  const line = getSetCookies(res).find((value) => value.startsWith(`${auth.SESSION_COOKIE_NAME}=`));
  return line || "";
}

async function call(path, { method = "GET", body, cookie } = {}) {
  const headers = { Origin: BASE_URL };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  return { res, data };
}

async function serverIsUp() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${BASE_URL}/api/health`, { signal: controller.signal });
    clearTimeout(timer);
    return res.status < 500;
  } catch {
    return false;
  }
}

async function insertOtp(email, code, overrides = {}) {
  const key = auth.getHistoryKey();
  const challengeId = auth.generateChallengeId();
  const now = Date.now();
  await DonorHistoryOtp.create({
    challengeId,
    email,
    codeHash: auth.hashOtp(challengeId, code, key),
    expiresAt: new Date(now + auth.OTP_TTL_MS),
    purgeAt: new Date(now + auth.OTP_SEND_WINDOW_MS),
    ...overrides,
  });
  return challengeId;
}

async function runHttp() {
  console.log("\nPart 2: HTTP routes (live server + database)");

  if (!process.env.MONGODB_URI) {
    skip("all HTTP scenarios", "MONGODB_URI not set");
    return;
  }
  if (!auth.getHistoryKey()) {
    skip("all HTTP scenarios", "NEXTAUTH_SECRET not set");
    return;
  }
  if (!(await serverIsUp())) {
    skip("all HTTP scenarios", `no server at ${BASE_URL}; start it with npm run dev`);
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const stamp = Date.now();
  const realEmail = String(process.env.DONOR_HISTORY_TEST_EMAIL || "").trim().toLowerCase();
  const emailA = realEmail || `dh-test-a-${stamp}@example.invalid`;
  const emailB = `dh-test-b-${stamp}@example.invalid`;
  const emailFailed = `dh-test-f-${stamp}@example.invalid`;
  const unknownEmail = `dh-test-none-${stamp}@example.invalid`;
  const prefix = `DHTEST-${stamp}`;

  const base = (orderId, email, extra = {}) => ({
    orderId,
    amount: 2500,
    currency: "INR",
    purpose: "HCES",
    donationCategory: "Non-Zakat",
    schemes: [{ schemeId: "hces", schemeName: "HCES", amount: 2500, quantity: 1, subtotal: 2500 }],
    donor: {
      name: "History Test Donor",
      email,
      mobile: "9000000000",
      pan: "ABCDE1234F",
      address: "12 Secret Street",
    },
    source: "donor-history-test",
    status: "success",
    completedAt: new Date(),
    ...extra,
  });

  try {
    await DonateNowSubmission.create([
      base(`${prefix}-A1`, emailA),
      base(`${prefix}-A2`, emailA, { isDeleted: true }),
      base(`${prefix}-A3`, emailA, { status: "failed", completedAt: null }),
      base(`${prefix}-B1`, emailB),
      base(`${prefix}-F1`, emailFailed, { status: "failed", completedAt: null, donor: { name: "F", email: emailFailed, mobile: "9000000002" } }),
    ]);

    await test("request-otp for an unknown email says no donations were found and sends nothing", async () => {
      const { res, data } = await call("/request-otp", { method: "POST", body: { identifier: unknownEmail } });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.ok, false);
      assert.strictEqual(data.found, false);
      assert.ok(!data.challengeId, "no challenge for an unknown email");
      assert.match(data.message, /couldn't find any donations for this email address/);
      assert.strictEqual(await DonorHistoryOtp.countDocuments({ email: unknownEmail }), 0);
    });

    await test("request-otp for an unknown mobile names the mobile number", async () => {
      const { data } = await call("/request-otp", { method: "POST", body: { identifier: "9999988877" } });
      assert.strictEqual(data.found, false);
      assert.match(data.message, /this mobile number/);
    });

    await test("request-otp for an email with only failed donations explains there's nothing completed", async () => {
      const { res, data } = await call("/request-otp", { method: "POST", body: { identifier: emailFailed } });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.found, true);
      assert.strictEqual(data.completed, false);
      assert.ok(!data.challengeId);
      assert.match(data.message, /none were completed/);
      assert.strictEqual(await DonorHistoryOtp.countDocuments({ email: emailFailed }), 0);
    });

    if (realEmail) {
      await test("request-otp for a known email sends a code and says where it went", async () => {
        const { res, data } = await call("/request-otp", { method: "POST", body: { identifier: emailA } });
        assert.strictEqual(res.status, 200, JSON.stringify(data));
        assert.strictEqual(data.ok, true);
        assert.strictEqual(data.sentTo, auth.maskEmailForDisplay(emailA));
        assert.ok(data.message.includes(data.sentTo));
        const doc = await DonorHistoryOtp.findOne({ challengeId: data.challengeId }).lean();
        assert.ok(doc, "OTP row should exist");
        assert.match(doc.codeHash, /^[a-f0-9]{64}$/);
      });
    } else {
      skip("request-otp for a known email sends a code", "set DONOR_HISTORY_TEST_EMAIL to send a real code");
    }

    await test("asking again within a minute reuses the code already sent (no new email)", async () => {
      const existing = await insertOtp(emailA, "555555");
      const before = await DonorHistoryOtp.countDocuments({ email: emailA });
      const { res, data } = await call("/request-otp", { method: "POST", body: { identifier: emailA } });
      assert.strictEqual(res.status, 200, JSON.stringify(data));
      assert.strictEqual(data.challengeId, existing);
      assert.match(data.message, /less than a minute ago/);
      assert.ok(data.resendAfterSeconds > 0 && data.resendAfterSeconds <= 60);
      assert.strictEqual(await DonorHistoryOtp.countDocuments({ email: emailA }), before);
    });

    await test("the hourly cap is explained when no usable code is left", async () => {
      await DonorHistoryOtp.updateMany({ email: emailA }, { $set: { invalidatedAt: new Date() } });
      const tenMinutesAgo = new Date(Date.now() - 10 * 60_000);
      await DonorHistoryOtp.collection.insertMany(
        Array.from({ length: auth.OTP_MAX_SENDS_PER_WINDOW }, () => ({
          challengeId: auth.generateChallengeId(),
          email: emailA,
          codeHash: "0".repeat(64),
          expiresAt: tenMinutesAgo,
          attempts: 0,
          consumedAt: tenMinutesAgo,
          invalidatedAt: null,
          purgeAt: new Date(Date.now() + 50 * 60_000),
          createdAt: tenMinutesAgo,
          updatedAt: tenMinutesAgo,
        })),
      );
      const { res, data } = await call("/request-otp", { method: "POST", body: { identifier: emailA } });
      assert.strictEqual(res.status, 429, JSON.stringify(data));
      assert.match(data.error, /several codes in the last hour/);
      assert.ok(data.retryAfterSeconds > 0);
      await DonorHistoryOtp.deleteMany({ email: emailA });
    });

    await test("request-otp rejects a malformed identifier", async () => {
      const { res } = await call("/request-otp", { method: "POST", body: { identifier: "not valid" } });
      assert.strictEqual(res.status, 400);
    });

    await test("verify-otp gives one generic failure for an unknown challenge", async () => {
      const { res, data } = await call("/verify-otp", {
        method: "POST",
        body: { challengeId: auth.generateChallengeId(), code: "123456" },
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(data.error, auth.VERIFY_OTP_FAILED_MESSAGE);
    });

    await test("a code locks after 5 wrong attempts, even if the 6th is right", async () => {
      const challengeId = await insertOtp(emailA, "111111", { attempts: auth.OTP_MAX_ATTEMPTS - 1 });
      const wrong = await call("/verify-otp", { method: "POST", body: { challengeId, code: "222222" } });
      assert.strictEqual(wrong.res.status, 400);
      const right = await call("/verify-otp", { method: "POST", body: { challengeId, code: "111111" } });
      assert.strictEqual(right.res.status, 400);
      assert.strictEqual(sessionCookieFrom(right.res), "");
    });

    await test("an expired code is refused", async () => {
      const challengeId = await insertOtp(emailA, "333333", { expiresAt: new Date(Date.now() - 1000) });
      const { res } = await call("/verify-otp", { method: "POST", body: { challengeId, code: "333333" } });
      assert.strictEqual(res.status, 400);
    });

    let cookie = "";
    await test("the right code signs the donor in with a scoped httpOnly cookie, once", async () => {
      const challengeId = await insertOtp(emailA, "444444");
      const { res, data } = await call("/verify-otp", { method: "POST", body: { challengeId, code: "444444" } });
      assert.strictEqual(res.status, 200, JSON.stringify(data));
      const setCookie = sessionCookieFrom(res);
      assert.ok(/HttpOnly/i.test(setCookie), setCookie);
      assert.ok(/Path=\/api\/public\/donor-history/i.test(setCookie), setCookie);
      assert.ok(/SameSite=Lax/i.test(setCookie), setCookie);
      cookie = setCookie.split(";")[0];

      const replay = await call("/verify-otp", { method: "POST", body: { challengeId, code: "444444" } });
      assert.strictEqual(replay.res.status, 400);
    });

    await test("history lists only this donor's successful, non-deleted donations without PII", async () => {
      assert.ok(cookie, "needs the session from the previous scenario");
      const { res, data } = await call("", { cookie });
      assert.strictEqual(res.status, 200);
      const ours = data.items.filter((item) => item.orderId.startsWith(prefix));
      assert.deepStrictEqual(ours.map((item) => item.orderId), [`${prefix}-A1`]);
      assert.strictEqual(data.email, emailA);
      const json = JSON.stringify(data);
      for (const secret of ["ABCDE1234F", "Secret Street", "9000000000", emailB]) {
        assert.ok(!json.includes(secret), `leaked ${secret}`);
      }
    });

    await test("history refuses missing, tampered and lookup-style sessions", async () => {
      const signedOut = async (opts) => {
        const { res, data } = await call("", opts);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(data.signedIn, false);
        assert.ok(!Array.isArray(data.items), "no items without a session");
      };
      await signedOut();
      await signedOut({ cookie: `${cookie}x` });
      const proof = signToken(
        { sid: "x", verified: true, email: emailA, mobile: "9000000000", exp: Date.now() + 60_000 },
        process.env.NEXTAUTH_SECRET,
      );
      await signedOut({ cookie: `${auth.SESSION_COOKIE_NAME}=${proof}` });
      const receipt = await call("/receipt", { method: "POST", body: { orderId: `${prefix}-A1` } });
      assert.strictEqual(receipt.res.status, 401);
    });

    await test("receipt re-send refuses another donor's order", async () => {
      const { res } = await call("/receipt", { method: "POST", body: { orderId: `${prefix}-B1` }, cookie });
      assert.strictEqual(res.status, 404);
      const deleted = await call("/receipt", { method: "POST", body: { orderId: `${prefix}-A2` }, cookie });
      assert.strictEqual(deleted.res.status, 404);
    });

    if (realEmail) {
      await test("receipt re-send works for the donor's own order", async () => {
        const { res, data } = await call("/receipt", { method: "POST", body: { orderId: `${prefix}-A1` }, cookie });
        assert.strictEqual(res.status, 200, JSON.stringify(data));
      });
    } else {
      skip("receipt re-send for own order", "set DONOR_HISTORY_TEST_EMAIL to send a real receipt");
    }

    await test("sign-out clears the cookie", async () => {
      const { res } = await call("", { method: "DELETE", cookie });
      assert.strictEqual(res.status, 200);
      const setCookie = sessionCookieFrom(res);
      assert.ok(/Max-Age=0/i.test(setCookie) || /Expires=Thu, 01 Jan 1970/i.test(setCookie), setCookie);
    });
  } finally {
    await DonateNowSubmission.deleteMany({ orderId: { $regex: `^${prefix}-` } });
    await DonorHistoryOtp.deleteMany({ email: { $in: [emailA, emailB, emailFailed, unknownEmail] } });
    await mongoose.disconnect();
  }
}

(async () => {
  console.log("=== Donor history (DON-05) contract tests ===");
  await runOffline();
  await runHttp();
  console.log(`\n${passed} passed, ${failed} failed, ${skipped} skipped`);
  process.exit(failed > 0 ? 1 : 0);
})().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
