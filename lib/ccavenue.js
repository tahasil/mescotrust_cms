/**
 * CCAvenue AES-128-CBC encryption/decryption utility.
 * Uses Node.js built-in crypto module — no external packages needed.
 *
 * CCAvenue protocol:
 * - Key: MD5 hash of working_key (16 bytes)
 * - IV: First 16 bytes of the MD5 key (0x00 padded)
 * - Mode: AES-128-CBC
 * - Input: query-string style "key=value&key2=value2"
 * - Output: hex-encoded ciphertext
 */

const crypto = require("crypto");

function md5(data) {
  return crypto.createHash("md5").update(data).digest();
}

/**
 * Encrypt plaintext for CCAvenue request.
 * @param {string} plainText - "merchant_id=123&order_id=ORD1&amount=500&..."
 * @param {string} workingKey - CCAvenue working key
 * @returns {string} hex-encoded encrypted string
 */
function encrypt(plainText, workingKey) {
  const key = md5(workingKey);
  const iv = Buffer.alloc(16, 0); // 16-byte zero IV (CCAvenue standard)
  const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

/**
 * Decrypt CCAvenue response.
 * @param {string} encText - hex-encoded encrypted response
 * @param {string} workingKey - CCAvenue working key
 * @returns {string} decrypted plaintext "key=value&key2=value2"
 */
function decrypt(encText, workingKey) {
  const key = md5(workingKey);
  const iv = Buffer.alloc(16, 0);
  const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
  let decrypted = decipher.update(encText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Parse "key=value&key2=value2" string into object.
 */
function parseResponse(plainText) {
  const params = {};
  if (!plainText) return params;
  plainText.split("&").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx > 0) {
      params[pair.substring(0, idx).trim()] = decodeURIComponent(
        pair.substring(idx + 1).trim()
      );
    }
  });
  return params;
}

/**
 * Generate unique order ID for donation.
 */
function generateOrderId() {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DON_${ts}_${rand}`;
}

module.exports = { encrypt, decrypt, parseResponse, generateOrderId };
