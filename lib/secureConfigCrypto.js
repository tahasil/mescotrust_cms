import crypto from "crypto";

const ENCRYPTION_PREFIX = "enc:v1";

function toSafeString(value) {
  return value == null ? "" : String(value);
}

function getEncryptionKey() {
  const secret = toSafeString(
    process.env.SOCIAL_WALL_CONFIG_SECRET || process.env.NEXTAUTH_SECRET,
  );
  if (!secret) return null;
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSecretValue(value) {
  const plainText = toSafeString(value).trim();
  if (!plainText) return "";

  const key = getEncryptionKey();
  if (!key) return plainText;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(plainText, "utf8")),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    ENCRYPTION_PREFIX,
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decryptSecretValue(value) {
  const raw = toSafeString(value).trim();
  if (!raw) return "";

  if (!raw.startsWith(`${ENCRYPTION_PREFIX}:`)) {
    // Backward compatibility: legacy plaintext values.
    return raw;
  }

  const parts = raw.split(":");
  if (parts.length !== 5) return "";

  const key = getEncryptionKey();
  if (!key) return "";

  try {
    const iv = Buffer.from(parts[2], "base64");
    const tag = Buffer.from(parts[3], "base64");
    const encrypted = Buffer.from(parts[4], "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8").trim();
  } catch {
    return "";
  }
}
