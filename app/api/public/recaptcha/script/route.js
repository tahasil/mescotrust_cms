import { NextResponse } from "next/server";

const UPSTREAM_SOURCES = [
  "https://www.google.com/recaptcha/api.js?render=explicit",
  "https://www.recaptcha.net/recaptcha/api.js?render=explicit",
];

async function fetchScriptFromUpstream(url) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/javascript, text/javascript, */*;q=0.1",
    },
  });
  if (!response.ok) {
    throw new Error(`Upstream responded with status ${response.status}`);
  }
  const scriptText = await response.text();
  if (!String(scriptText || "").trim()) {
    throw new Error("Empty script body received from upstream");
  }
  return scriptText;
}

export async function GET() {
  let lastError = null;

  for (const sourceUrl of UPSTREAM_SOURCES) {
    try {
      const scriptText = await fetchScriptFromUpstream(sourceUrl);
      return new NextResponse(scriptText, {
        status: 200,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "X-Recaptcha-Upstream": sourceUrl,
        },
      });
    } catch (err) {
      lastError = err;
    }
  }

  return NextResponse.json(
    {
      error: "Failed to fetch Google reCAPTCHA script",
      detail: String(lastError?.message || ""),
    },
    { status: 502 },
  );
}
