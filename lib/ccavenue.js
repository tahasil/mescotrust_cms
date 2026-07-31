/**
 * CCAvenue AES-128-CBC encryption/decryption utility.
 * Uses Node.js built-in crypto module — no external packages needed.
 *
 * CCAvenue protocol:
 * - Key: MD5 hash of working_key (16 bytes)
 * - IV: CCAvenue's fixed byte sequence 0x00..0x0f
 * - Mode: AES-128-CBC
 * - Input: query-string style "key=value&key2=value2"
 * - Output: hex-encoded ciphertext
 */

const crypto = require("crypto");

// This exact IV is part of CCAvenue's published integration utility. A
// zero-filled IV produces valid AES ciphertext, but CCAvenue cannot decrypt it.
const CCAVENUE_IV = Buffer.from([
  0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
  0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
]);

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
  const cipher = crypto.createCipheriv("aes-128-cbc", key, CCAVENUE_IV);
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
  if (!/^[a-f0-9]+$/i.test(String(encText || "")) || encText.length % 2 !== 0) {
    throw new Error("Invalid CCAvenue encrypted response");
  }
  const decipher = crypto.createDecipheriv("aes-128-cbc", key, CCAVENUE_IV);
  let decrypted = decipher.update(encText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Parse "key=value&key2=value2" string into object.
 */
function parseResponse(plainText) {
  if (!plainText) return {};
  return Object.fromEntries(new URLSearchParams(plainText));
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
