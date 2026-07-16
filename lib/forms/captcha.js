import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const CAPTCHA_TYPES = ["alphanumeric", "math", "checkbox_v2"];
const DEFAULT_CAPTCHA_TYPE = "alphanumeric";
const CAPTCHA_TOKEN_VERSION = 1;
const CAPTCHA_TOKEN_TTL_MS = 5 * 60 * 1000;
const ALPHANUMERIC_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function normalizeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function toBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const text = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padding = text.length % 4 === 0 ? "" : "=".repeat(4 - (text.length % 4));
  return Buffer.from(`${text}${padding}`, "base64");
}

function safeCompare(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  try {
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

function getCaptchaSecret() {
  return String(
    process.env.CAPTCHA_SECRET || process.env.NEXTAUTH_SECRET || "dev_captcha_secret",
  );
}

function getGoogleRecaptchaSiteKeyFromEnv() {
  return normalizeText(
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
      process.env.RECAPTCHA_SITE_KEY ||
      process.env.GOOGLE_RECAPTCHA_SITE_KEY,
  );
}

function getGoogleRecaptchaSecretKeyFromEnv() {
  return normalizeText(
    process.env.RECAPTCHA_SECRET_KEY || process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
  );
}

function getGoogleRecaptchaSiteKeyFromSettings(submissionSettings) {
  return normalizeText(
    submissionSettings?.recaptchaSiteKey ||
      submissionSettings?.siteKey ||
      submissionSettings?.googleRecaptchaSiteKey,
  );
}

function getGoogleRecaptchaSecretKeyFromSettings(submissionSettings) {
  return normalizeText(
    submissionSettings?.recaptchaSecretKey ||
      submissionSettings?.secretKey ||
      submissionSettings?.googleRecaptchaSecretKey,
  );
}

function resolveGoogleRecaptchaSiteKey(submissionSettings) {
  return (
    getGoogleRecaptchaSiteKeyFromSettings(submissionSettings) ||
    getGoogleRecaptchaSiteKeyFromEnv()
  );
}

function resolveGoogleRecaptchaSecretKey(submissionSettings) {
  return (
    getGoogleRecaptchaSecretKeyFromSettings(submissionSettings) ||
    getGoogleRecaptchaSecretKeyFromEnv()
  );
}

function normalizeCaptchaAnswer(answer, type) {
  const normalizedType = normalizeCaptchaType(type);
  if (normalizedType === "checkbox_v2") {
    if (answer === true) return "true";
    const text = normalizeText(answer).toLowerCase();
    return text === "true" || text === "1" || text === "yes" || text === "on" ? "true" : "";
  }

  const text = normalizeText(answer);
  if (!text) return "";
  if (normalizedType === "alphanumeric") return text.toUpperCase();
  return text.replace(/\s+/g, "");
}

function buildAnswerHash(answer, nonce) {
  const secret = getCaptchaSecret();
  return createHash("sha256")
    .update(`${normalizeText(answer)}|${normalizeText(nonce)}|${secret}`)
    .digest("hex");
}

function signPayload(payload) {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", getCaptchaSecret()).update(encodedPayload).digest("hex");
  return `${encodedPayload}.${signature}`;
}

function parseSignedPayload(token) {
  const rawToken = normalizeText(token);
  const [encodedPayload, signature] = rawToken.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = createHmac("sha256", getCaptchaSecret())
    .update(encodedPayload)
    .digest("hex");
  if (!safeCompare(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload).toString("utf8"));
    if (!payload || typeof payload !== "object") return null;
    return payload;
  } catch {
    return null;
  }
}

function randomInt(min, max) {
  const from = Math.ceil(Number(min));
  const to = Math.floor(Number(max));
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return 0;
  const span = to - from + 1;
  return Math.floor(Math.random() * span) + from;
}

function createAlphanumericText(length = 5) {
  const safeLength = Math.max(4, Math.min(7, Number(length) || 5));
  let output = "";
  for (let index = 0; index < safeLength; index += 1) {
    output += ALPHANUMERIC_CHARS[randomInt(0, ALPHANUMERIC_CHARS.length - 1)];
  }
  return output;
}

function createAlphanumericSvg(text) {
  const answer = normalizeText(text).toUpperCase();
  const width = 180;
  const height = 56;
  const chars = answer.split("");
  const textNodes = chars
    .map((char, index) => {
      const x = 16 + index * 30;
      const y = randomInt(30, 42);
      const rotation = randomInt(-18, 18);
      return `<text x="${x}" y="${y}" transform="rotate(${rotation} ${x} ${y})" font-size="30" font-family="Arial, sans-serif" font-weight="700" fill="#1f2937">${char}</text>`;
    })
    .join("");

  const noiseLines = Array.from({ length: 5 })
    .map(() => {
      const x1 = randomInt(0, width);
      const y1 = randomInt(8, height - 8);
      const x2 = randomInt(0, width);
      const y2 = randomInt(8, height - 8);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#9ca3af" stroke-width="1" opacity="0.8" />`;
    })
    .join("");

  const noiseDots = Array.from({ length: 20 })
    .map(() => {
      const cx = randomInt(2, width - 2);
      const cy = randomInt(2, height - 2);
      const r = randomInt(1, 2);
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#d1d5db" />`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="captcha"><rect width="${width}" height="${height}" rx="8" fill="#f3f4f6" />${noiseLines}${noiseDots}${textNodes}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function createMathChallenge() {
  const operator = Math.random() < 0.5 ? "+" : "-";
  const left = randomInt(2, 12);
  const right = operator === "-" ? randomInt(1, left - 1) : randomInt(1, 12);
  const answer = operator === "+" ? left + right : left - right;
  return {
    prompt: `What is ${left} ${operator} ${right}?`,
    answer: String(answer),
  };
}

function createCaptchaToken({ formId, type, answer, ttlMs = CAPTCHA_TOKEN_TTL_MS }) {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + Math.max(30_000, Number(ttlMs) || CAPTCHA_TOKEN_TTL_MS);
  const nonce = randomBytes(16).toString("hex");
  const normalizedAnswer = normalizeCaptchaAnswer(answer, type);
  const payload = {
    v: CAPTCHA_TOKEN_VERSION,
    formId: normalizeText(formId),
    type: normalizeCaptchaType(type),
    nonce,
    issuedAt,
    expiresAt,
    answerHash: buildAnswerHash(normalizedAnswer, nonce),
  };
  return signPayload(payload);
}

export function normalizeCaptchaType(value, fallback = DEFAULT_CAPTCHA_TYPE) {
  const text = normalizeText(value).toLowerCase();
  return CAPTCHA_TYPES.includes(text) ? text : fallback;
}

export function isCaptchaEnabled(submissionSettings) {
  return Boolean(submissionSettings?.captchaEnabled);
}

export function generateCaptchaChallenge({ formId, captchaType, submissionSettings }) {
  const type = normalizeCaptchaType(captchaType);
  const base = {
    type,
    prompt: "",
    placeholder: "",
    imageDataUri: "",
    token: "",
    provider: "",
    siteKey: "",
    expiresInSeconds: Math.floor(CAPTCHA_TOKEN_TTL_MS / 1000),
  };

  if (type === "math") {
    const challenge = createMathChallenge();
    return {
      ...base,
      prompt: challenge.prompt,
      placeholder: "Enter answer",
      token: createCaptchaToken({ formId, type, answer: challenge.answer }),
    };
  }

  if (type === "checkbox_v2") {
    return {
      ...base,
      prompt: "Verify you are not a robot",
      provider: "google_recaptcha",
      siteKey: resolveGoogleRecaptchaSiteKey(submissionSettings),
    };
  }

  const answer = createAlphanumericText(5);
  return {
    ...base,
    prompt: "Type the characters shown",
    placeholder: "Enter captcha text",
    imageDataUri: createAlphanumericSvg(answer),
    token: createCaptchaToken({ formId, type, answer }),
  };
}

async function verifyGoogleRecaptchaToken({ token, remoteIp, submissionSettings }) {
  const secret = resolveGoogleRecaptchaSecretKey(submissionSettings);
  if (!secret) {
    return {
      valid: false,
      message: "Google reCAPTCHA is not configured on server.",
      requiresRefresh: false,
    };
  }

  const responseToken = normalizeText(token);
  if (!responseToken) {
    return { valid: false, message: "Please complete Google reCAPTCHA.", requiresRefresh: false };
  }

  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", responseToken);
    if (normalizeText(remoteIp)) body.set("remoteip", normalizeText(remoteIp));

    const verifyResponse = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      cache: "no-store",
    });

    const verifyData = await verifyResponse.json().catch(() => ({}));
    if (!verifyResponse.ok) {
      return {
        valid: false,
        message: "Google reCAPTCHA verification failed. Please try again.",
        requiresRefresh: true,
      };
    }

    if (!Boolean(verifyData?.success)) {
      return {
        valid: false,
        message: "Google reCAPTCHA verification failed. Please try again.",
        requiresRefresh: true,
      };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      message: "Unable to verify Google reCAPTCHA right now. Please try again.",
      requiresRefresh: false,
    };
  }
}

export async function validateCaptchaSubmission({
  formId,
  submissionSettings,
  captchaToken,
  captchaResponse,
  remoteIp,
}) {
  if (!isCaptchaEnabled(submissionSettings)) {
    return { valid: true };
  }

  const expectedType = normalizeCaptchaType(
    submissionSettings?.captchaType,
    DEFAULT_CAPTCHA_TYPE,
  );

  if (expectedType === "checkbox_v2") {
    const googleToken = normalizeText(captchaResponse || captchaToken);
    return verifyGoogleRecaptchaToken({
      token: googleToken,
      remoteIp,
      submissionSettings,
    });
  }

  const token = normalizeText(captchaToken);
  if (!token) {
    return { valid: false, message: "Captcha is required.", requiresRefresh: true };
  }

  const payload = parseSignedPayload(token);
  if (!payload) {
    return { valid: false, message: "Captcha is invalid. Please try again.", requiresRefresh: true };
  }

  if (Number(payload?.v) !== CAPTCHA_TOKEN_VERSION) {
    return { valid: false, message: "Captcha is invalid. Please refresh and try again.", requiresRefresh: true };
  }

  if (normalizeText(payload?.formId) !== normalizeText(formId)) {
    return { valid: false, message: "Captcha does not match this form.", requiresRefresh: true };
  }

  if (normalizeCaptchaType(payload?.type) !== expectedType) {
    return { valid: false, message: "Captcha type mismatch. Please refresh and try again.", requiresRefresh: true };
  }

  if (Date.now() > Number(payload?.expiresAt || 0)) {
    return { valid: false, message: "Captcha expired. Please refresh and try again.", requiresRefresh: true };
  }

  const normalizedAnswer = normalizeCaptchaAnswer(captchaResponse, expectedType);
  if (!normalizedAnswer) {
    return { valid: false, message: "Captcha is required.", requiresRefresh: false };
  }

  const expectedHash = buildAnswerHash(normalizedAnswer, payload?.nonce);
  if (!safeCompare(expectedHash, payload?.answerHash)) {
    return { valid: false, message: "Captcha verification failed. Please try again.", requiresRefresh: true };
  }

  return { valid: true };
}
