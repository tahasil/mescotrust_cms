import crypto from "crypto";

/**
 * Compact HMAC-signed tokens: `<base64url(JSON payload)>.<base64url(signature)>`.
 *
 * Shared by the returning-donor lookup (`/api/payment/donor-lookup`) and the
 * donor history session (`/api/public/donor-history`). Each caller passes its
 * own key so a token minted for one purpose can never verify for the other.
 *
 * Only builtin imports here, so operational/test scripts can `require` it.
 */

function hmac(key, data) {
  return crypto.createHmac("sha256", key).update(data).digest("base64url");
}

export function signToken(payload, key) {
  if (!key) throw new Error("signToken: missing key");
  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadEncoded}.${hmac(key, payloadEncoded)}`;
}

/**
 * Returns the decoded payload when the signature matches, otherwise null.
 * Expiry and purpose checks are left to the caller, which knows its rules.
 */
export function verifySignedToken(token, key) {
  if (!key) return null;
  const [payloadEncoded, signature, ...extra] = String(token || "").split(".");
  if (!payloadEncoded || !signature || extra.length) return null;

  const expected = hmac(key, payloadEncoded);
  if (
    expected.length !== signature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadEncoded, "base64url").toString("utf8"));
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
}
