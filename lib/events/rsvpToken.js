import crypto from "crypto";
import { signToken, verifySignedToken } from "../donations/signedToken.js";

// Separates this key from the raw NEXTAUTH_SECRET and from the donor keys, so a
// token minted for one purpose can never verify for another.
const KEY_CONTEXT = "mesco:event-rsvp:v1";
const TOKEN_PURPOSE = "event-rsvp";

/** Derived signing key, or "" when NEXTAUTH_SECRET is missing (callers fail closed). */
export function getRsvpKey(env = process.env) {
  const secret = String(env?.NEXTAUTH_SECRET || "").trim();
  if (!secret) return "";
  return crypto.createHmac("sha256", secret).update(KEY_CONTEXT).digest("hex");
}

/**
 * The "change your reply" link. It has no expiry of its own: replies close with
 * the event, so the link stops working then.
 */
export function issueRsvpToken(registrationId, eventId, key) {
  return signToken(
    { p: TOKEN_PURPOSE, r: String(registrationId), e: String(eventId) },
    key,
  );
}

export function readRsvpToken(token, key) {
  const payload = verifySignedToken(token, key);
  if (!payload || payload.p !== TOKEN_PURPOSE || !payload.r || !payload.e) return null;
  return { registrationId: String(payload.r), eventId: String(payload.e) };
}
