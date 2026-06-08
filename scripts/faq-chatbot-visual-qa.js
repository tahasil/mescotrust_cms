/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const sharp = require("sharp");
const { chromium } = require("playwright-core");
const { connectDB } = require("../lib/db");
const FAQChatbotConfig = require("../models/FAQChatbotConfig");
const FAQChatbotNode = require("../models/FAQChatbotNode");
const FAQChatbotSearchIndex = require("../models/FAQChatbotSearchIndex");

const SETTINGS_KEY = "default";
const BASE_URL = process.env.FAQ_CHATBOT_QA_BASE_URL || "http://127.0.0.1:3000";
const UPDATE_REFERENCE = process.argv.includes("--update-reference");
const MAX_DIFF_PERCENT = Number(process.env.FAQ_CHATBOT_VISUAL_MAX_DIFF_PERCENT || 12);
const MAX_MEAN_ABS_DIFF = Number(process.env.FAQ_CHATBOT_VISUAL_MAX_MEAN_ABS_DIFF || 20);
const PIXEL_DELTA_THRESHOLD = Number(process.env.FAQ_CHATBOT_VISUAL_PIXEL_DELTA || 24);

const PROJECT_ROOT = process.cwd();

for (const fileName of [".env.local", ".env"]) {
  const envPath = path.join(PROJECT_ROOT, fileName);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

const REFERENCE_DIR = path.join(PROJECT_ROOT, "docs", "references", "faq-chatbot");
const ARTIFACT_DIR = path.join(PROJECT_ROOT, "artifacts", "faq-chatbot-qa");
const CAPTURE_DIR = path.join(ARTIFACT_DIR, "captures");
const DIFF_DIR = path.join(ARTIFACT_DIR, "diffs");
const SERVER_LOG_PATH = path.join(ARTIFACT_DIR, "server.log");
const REPORT_PATH = path.join(ARTIFACT_DIR, "visual-report.json");

const SCREENSHOT_CASES = [
  { key: "open", referenceFile: "ui-open-state.png", captureFile: "ui-open-state.capture.png" },
  {
    key: "thinking1",
    referenceFile: "ui-thinking-state-1.png",
    captureFile: "ui-thinking-state-1.capture.png",
  },
  {
    key: "thinking2",
    referenceFile: "ui-thinking-state-2.png",
    captureFile: "ui-thinking-state-2.capture.png",
  },
];

const QA_TREE_NODES = [
  {
    nodeId: "q_donate",
    parentNodeId: null,
    rootNodeId: "q_donate",
    type: "question",
    questionText: "How can I donate to Mesco Trust?",
    answerText: "",
    depth: 0,
    order: 0,
    pathNodeIds: ["q_donate"],
    pathText: "How can I donate to Mesco Trust?",
  },
  {
    nodeId: "a_donate",
    parentNodeId: "q_donate",
    rootNodeId: "q_donate",
    type: "answer",
    questionText: "",
    answerText: "You can donate online from our donation page using UPI, card, or netbanking.",
    depth: 1,
    order: 0,
    pathNodeIds: ["q_donate", "a_donate"],
    pathText:
      "How can I donate to Mesco Trust? > You can donate online from our donation page using UPI, card, or netbanking.",
  },
  {
    nodeId: "q_events",
    parentNodeId: null,
    rootNodeId: "q_events",
    type: "question",
    questionText: "How do I register for upcoming events?",
    answerText: "",
    depth: 0,
    order: 1,
    pathNodeIds: ["q_events"],
    pathText: "How do I register for upcoming events?",
  },
  {
    nodeId: "a_events",
    parentNodeId: "q_events",
    rootNodeId: "q_events",
    type: "answer",
    questionText: "",
    answerText: "Open the Events page, choose an event, and submit the registration form.",
    depth: 1,
    order: 0,
    pathNodeIds: ["q_events", "a_events"],
    pathText:
      "How do I register for upcoming events? > Open the Events page, choose an event, and submit the registration form.",
  },
  {
    nodeId: "q_events_docs",
    parentNodeId: "q_events",
    rootNodeId: "q_events",
    type: "question",
    questionText: "What documents are needed for event registration?",
    answerText: "",
    depth: 1,
    order: 1,
    pathNodeIds: ["q_events", "q_events_docs"],
    pathText:
      "How do I register for upcoming events? > What documents are needed for event registration?",
  },
  {
    nodeId: "a_events_docs",
    parentNodeId: "q_events_docs",
    rootNodeId: "q_events",
    type: "answer",
    questionText: "",
    answerText:
      "Carry a valid ID card and registration confirmation email for on-site verification.",
    depth: 2,
    order: 0,
    pathNodeIds: ["q_events", "q_events_docs", "a_events_docs"],
    pathText:
      "How do I register for upcoming events? > What documents are needed for event registration? > Carry a valid ID card and registration confirmation email for on-site verification.",
  },
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function stripDoc(doc) {
  if (!doc || typeof doc !== "object") return doc;
  const output = { ...doc };
  delete output.__v;
  return output;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function waitForServerReady(timeoutMs = 120000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`, { method: "GET" });
      if (response.status === 200) return true;
    } catch {
      // Keep polling.
    }
    await sleep(1500);
  }
  return false;
}

function detectChromeExecutable() {
  const candidates = [
    process.env.FAQ_CHATBOT_QA_CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    "No Chrome/Edge executable found. Set FAQ_CHATBOT_QA_CHROME_PATH to a valid browser executable.",
  );
}

async function fetchJson(relativePath, options = {}) {
  const response = await fetch(`${BASE_URL}${relativePath}`, options);
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

function resolveQuestionNodeId(node, nodeMap) {
  if (!node) return "";
  if (node.type === "question") return node.nodeId;
  let parentNodeId = node.parentNodeId;
  while (parentNodeId) {
    const parent = nodeMap.get(parentNodeId);
    if (!parent) break;
    if (parent.type === "question") return parent.nodeId;
    parentNodeId = parent.parentNodeId;
  }
  return "";
}

function buildSearchIndexRows(nodes, treeVersion) {
  const nodeMap = new Map(nodes.map((node) => [node.nodeId, node]));
  const rows = [];
  for (const node of nodes) {
    const text = (node.type === "question" ? node.questionText : node.answerText || "").trim();
    if (!text) continue;
    const questionNodeId = resolveQuestionNodeId(node, nodeMap);
    if (!questionNodeId) continue;

    let weight = node.type === "question" ? 120 : 90;
    if (node.type === "question" && node.depth === 0) weight += 10;
    weight -= Math.min(40, Math.max(0, Number(node.depth) || 0) * 2);

    rows.push({
      nodeId: node.nodeId,
      questionNodeId,
      type: node.type,
      text,
      pathText: node.pathText || text,
      depth: Math.max(0, Number(node.depth) || 0),
      weight,
      isActive: true,
      treeVersion: Math.max(1, Number(treeVersion) || 1),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return rows;
}

async function snapshotExistingFaqData() {
  await connectDB();
  const [configDoc, nodeDocs, indexDocs] = await Promise.all([
    FAQChatbotConfig.findOne({ settingsKey: SETTINGS_KEY }).lean(),
    FAQChatbotNode.find({}).lean(),
    FAQChatbotSearchIndex.find({}).lean(),
  ]);
  return {
    config: configDoc ? stripDoc(configDoc) : null,
    nodes: Array.isArray(nodeDocs) ? nodeDocs.map(stripDoc) : [],
    indexRows: Array.isArray(indexDocs) ? indexDocs.map(stripDoc) : [],
  };
}

async function seedFaqQaScenario() {
  await connectDB();
  const currentConfig = await FAQChatbotConfig.findOne({ settingsKey: SETTINGS_KEY }).lean();
  const nextTreeVersion = Math.max(1, Number(currentConfig?.treeVersion) || 0) + 1;
  const actor = "faq-chatbot-visual-qa";

  const seededNodes = QA_TREE_NODES.map((node) => ({
    ...node,
    isActive: true,
    createdBy: actor,
    updatedBy: actor,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  const seededIndexRows = buildSearchIndexRows(seededNodes, nextTreeVersion);
  const now = new Date();

  const seededConfig = {
    settingsKey: SETTINGS_KEY,
    enabled: true,
    headerTitle: "FAQ Assistant",
    welcomeMessage: "Hi! Ask me anything about donations, events, and registrations.",
    noResultsFoundMessage: "Sorry, I couldn't find an answer to your question.",
    avatar: { mediaId: "", url: "" },
    colors: {
      launcherGradientStart: "#13567a",
      launcherGradientEnd: "#1d9b78",
      headerGradientStart: "#0f4f74",
      headerGradientEnd: "#157f67",
      userBubbleBackground: "#125679",
      userBubbleText: "#ffffff",
      botBubbleBackground: "#ffffff",
      botBubbleText: "#132430",
      chipBackground: "#ffffff",
      chipText: "#1b3a4e",
    },
    searchIndexStatus: {
      lastRebuildAt: now,
      lastRebuildSource: "qa-seed",
      lastTreeVersion: nextTreeVersion,
      lastScannedNodes: seededNodes.length,
      lastIndexedRows: seededIndexRows.length,
      lastSkippedRows: 0,
      lastDurationMs: 1,
      lastError: "",
      autoRepairCount: Number(currentConfig?.searchIndexStatus?.autoRepairCount) || 0,
    },
    searchMetricsStatus: {
      totalQueries: 0,
      noResultQueries: 0,
      indexedQueryCount: 0,
      fallbackQueryCount: 0,
      totalLatencyMs: 0,
      lastLatencyMs: 0,
      lastResultCount: 0,
      lastSource: "",
      lastQuery: "",
      lastQueryAt: null,
    },
    position: "bottom-right",
    uiPreferences: {
      showTimestamps: true,
      timestampFormat: "12h",
      timestampLocale: "en-US",
      timestampTimezoneStrategy: "fixed-timezone",
      fixedTimezone: "UTC",
      showTypingState: true,
      typingMinMs: 1800,
      typingMaxMs: 2200,
    },
    treeVersion: nextTreeVersion,
    updatedBy: actor,
  };

  await FAQChatbotNode.deleteMany({});
  await FAQChatbotSearchIndex.deleteMany({});
  await FAQChatbotConfig.deleteMany({ settingsKey: SETTINGS_KEY });
  await FAQChatbotNode.insertMany(seededNodes, { ordered: true });
  if (seededIndexRows.length > 0) {
    await FAQChatbotSearchIndex.insertMany(seededIndexRows, { ordered: true });
  }
  await FAQChatbotConfig.create(seededConfig);
}

async function restoreFaqData(snapshot) {
  await connectDB();
  await FAQChatbotNode.deleteMany({});
  await FAQChatbotSearchIndex.deleteMany({});
  await FAQChatbotConfig.deleteMany({ settingsKey: SETTINGS_KEY });

  if (Array.isArray(snapshot?.nodes) && snapshot.nodes.length > 0) {
    await FAQChatbotNode.insertMany(snapshot.nodes, { ordered: true });
  }
  if (Array.isArray(snapshot?.indexRows) && snapshot.indexRows.length > 0) {
    await FAQChatbotSearchIndex.insertMany(snapshot.indexRows, { ordered: true });
  }
  if (snapshot?.config) {
    await FAQChatbotConfig.create(snapshot.config);
  }
}

async function runFunctionalAssertions() {
  const configRes = await fetchJson("/api/public/faq-chatbot/config");
  assert(configRes.response.status === 200, "Public config endpoint failed");
  assert(configRes.payload.enabled === true, "Seeded chatbot config was not returned as enabled");

  const rootRes = await fetchJson("/api/public/faq-chatbot/root-options");
  assert(rootRes.response.status === 200, "Root options endpoint failed");
  assert(Array.isArray(rootRes.payload.options), "Root options payload is invalid");
  assert(rootRes.payload.options.length >= 2, "Expected at least 2 root FAQ options");

  const donateNodeRes = await fetchJson("/api/public/faq-chatbot/node/q_donate");
  assert(donateNodeRes.response.status === 200, "Node endpoint failed for q_donate");
  assert(
    Array.isArray(donateNodeRes.payload.terminalAnswers) &&
      donateNodeRes.payload.terminalAnswers.length >= 1,
    "Expected a terminal answer for q_donate",
  );

  const searchDonateRes = await fetchJson("/api/public/faq-chatbot/search?q=donate&page=1&pageSize=5");
  assert(searchDonateRes.response.status === 200, "Search endpoint failed for 'donate'");
  assert(
    Number(searchDonateRes.payload.matchedCount) >= 1,
    "Expected donate query to return one or more matches",
  );

  const noResultRes = await fetchJson("/api/public/faq-chatbot/search?q=zzzzzz&page=1&pageSize=5");
  assert(noResultRes.response.status === 200, "Search endpoint failed for no-result query");
  assert(Number(noResultRes.payload.matchedCount) === 0, "No-result query unexpectedly returned matches");
  assert(
    String(noResultRes.payload.noResultsFoundMessage || "").trim().length > 0,
    "No-result search did not return configured noResultsFoundMessage",
  );

  const adminUnauthorizedRes = await fetchJson("/api/admin/faq-chatbot");
  const adminRejected =
    adminUnauthorizedRes.response.status === 401 ||
    adminUnauthorizedRes.response.status === 403 ||
    (adminUnauthorizedRes.response.status === 200 &&
      String(adminUnauthorizedRes.response.url || "").includes("/admin/login"));
  assert(
    adminRejected,
    `Expected /api/admin/faq-chatbot to reject unauthenticated requests, got status ${adminUnauthorizedRes.response.status} url ${adminUnauthorizedRes.response.url}`,
  );

  let metricsObserved = false;
  for (let i = 0; i < 10; i += 1) {
    const configDoc = await FAQChatbotConfig.findOne({ settingsKey: SETTINGS_KEY }).lean();
    const totalQueries = Number(configDoc?.searchMetricsStatus?.totalQueries) || 0;
    if (totalQueries >= 2) {
      metricsObserved = true;
      break;
    }
    await sleep(250);
  }
  assert(metricsObserved, "Search metrics hooks did not update totalQueries as expected");
}

async function captureUiStates({ executablePath }) {
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ["--disable-gpu"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const fixedNow = new Date("2026-06-08T10:00:00.000Z").getTime();
  await page.addInitScript(({ mockedNow }) => {
    const RealDate = Date;
    class MockedDate extends RealDate {
      constructor(...args) {
        if (args.length === 0) {
          super(mockedNow);
          return;
        }
        super(...args);
      }
      static now() {
        return mockedNow;
      }
      static parse(value) {
        return RealDate.parse(value);
      }
      static UTC(...args) {
        return RealDate.UTC(...args);
      }
    }
    window.Date = MockedDate;
  }, { mockedNow: fixedNow });

  await page.goto(`${BASE_URL}/search`, { waitUntil: "networkidle" });
  await page.addStyleTag({
    content:
      "*,*::before,*::after{animation:none !important;transition:none !important;}",
  });

  const cookieAcceptButton = page.locator(
    ".mesco-cookie-banner .mesco-cookie-btn-primary",
  );
  try {
    if (await cookieAcceptButton.isVisible({ timeout: 2500 })) {
      await cookieAcceptButton.click();
    }
  } catch {
    // Cookie banner is optional and may not exist in every environment.
  }

  const launcher = page.locator(".faq-chatbot-launcher");
  await launcher.waitFor({ state: "visible", timeout: 60000 });
  await launcher.click();

  const panel = page.locator(".faq-chatbot-panel");
  await panel.waitFor({ state: "visible", timeout: 60000 });
  await page.locator(".faq-chatbot-options .faq-chatbot-chip").first().waitFor({ state: "visible", timeout: 60000 });

  const captures = {};
  const openCapturePath = path.join(CAPTURE_DIR, SCREENSHOT_CASES[0].captureFile);
  await panel.screenshot({ path: openCapturePath });
  captures.open = openCapturePath;

  const firstOption = page.locator(".faq-chatbot-options .faq-chatbot-chip").first();
  await firstOption.click();
  const typingBubble = page.locator(".faq-chatbot-message.typing");
  await typingBubble.waitFor({ state: "visible", timeout: 60000 });

  await page.waitForTimeout(120);
  const thinking1Path = path.join(CAPTURE_DIR, SCREENSHOT_CASES[1].captureFile);
  await panel.screenshot({ path: thinking1Path });
  captures.thinking1 = thinking1Path;

  await page.waitForTimeout(500);
  const thinking2Path = path.join(CAPTURE_DIR, SCREENSHOT_CASES[2].captureFile);
  await panel.screenshot({ path: thinking2Path });
  captures.thinking2 = thinking2Path;

  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll(".faq-chatbot-message"))
        .some((node) => String(node.textContent || "").includes("You can donate online")),
    null,
    { timeout: 10000 },
  );

  await page.fill(".faq-chatbot-search-input", "register");
  await page.locator(".faq-chatbot-search-item").first().waitFor({ state: "visible", timeout: 10000 });
  const firstSearchResultText = await page.locator(".faq-chatbot-search-title").first().innerText();
  assert(
    String(firstSearchResultText || "").trim().length > 0,
    "Search suggestions did not render in widget footer",
  );

  await browser.close();
  return captures;
}

async function loadImageBuffer(filePath, resizeTo) {
  let image = sharp(filePath).ensureAlpha();
  if (resizeTo?.width && resizeTo?.height) {
    image = image.resize(resizeTo.width, resizeTo.height, { fit: "fill" });
  }
  return image.raw().toBuffer({ resolveWithObject: true });
}

async function compareImages({ referencePath, capturePath, diffPath }) {
  const reference = await loadImageBuffer(referencePath);
  const capture = await loadImageBuffer(capturePath, {
    width: reference.info.width,
    height: reference.info.height,
  });

  const totalPixels = reference.info.width * reference.info.height;
  const diffBuffer = Buffer.alloc(reference.data.length);
  let changedPixels = 0;
  let totalAbsDiff = 0;

  for (let i = 0; i < reference.data.length; i += 4) {
    const dr = Math.abs(reference.data[i] - capture.data[i]);
    const dg = Math.abs(reference.data[i + 1] - capture.data[i + 1]);
    const db = Math.abs(reference.data[i + 2] - capture.data[i + 2]);
    const da = Math.abs(reference.data[i + 3] - capture.data[i + 3]);
    const pixelMaxDelta = Math.max(dr, dg, db, da);
    totalAbsDiff += dr + dg + db + da;

    if (pixelMaxDelta > PIXEL_DELTA_THRESHOLD) {
      changedPixels += 1;
      diffBuffer[i] = 255;
      diffBuffer[i + 1] = 0;
      diffBuffer[i + 2] = 170;
      diffBuffer[i + 3] = 255;
    } else {
      diffBuffer[i] = Math.round(reference.data[i] * 0.35);
      diffBuffer[i + 1] = Math.round(reference.data[i + 1] * 0.35);
      diffBuffer[i + 2] = Math.round(reference.data[i + 2] * 0.35);
      diffBuffer[i + 3] = 255;
    }
  }

  await sharp(diffBuffer, {
    raw: {
      width: reference.info.width,
      height: reference.info.height,
      channels: 4,
    },
  })
    .png()
    .toFile(diffPath);

  const diffPercent = Number(((changedPixels / totalPixels) * 100).toFixed(3));
  const meanAbsDiff = Number((totalAbsDiff / (totalPixels * 4)).toFixed(3));
  return { diffPercent, meanAbsDiff, width: reference.info.width, height: reference.info.height };
}

function ensureValidReferenceAssets() {
  for (const screenshotCase of SCREENSHOT_CASES) {
    const referencePath = path.join(REFERENCE_DIR, screenshotCase.referenceFile);
    const exists = fs.existsSync(referencePath);
    assert(exists, `Reference image missing: ${referencePath}`);
    const size = exists ? fs.statSync(referencePath).size : 0;
    assert(
      size > 0,
      `Reference image is empty: ${referencePath}. Replace placeholder files before running visual QA.`,
    );
  }
}

async function runVisualComparison(captures) {
  if (!UPDATE_REFERENCE) {
    ensureValidReferenceAssets();
  }

  const results = [];
  for (const screenshotCase of SCREENSHOT_CASES) {
    const referencePath = path.join(REFERENCE_DIR, screenshotCase.referenceFile);
    const capturePath = captures[screenshotCase.key];
    const diffPath = path.join(DIFF_DIR, `${screenshotCase.key}.diff.png`);

    if (UPDATE_REFERENCE) {
      fs.copyFileSync(capturePath, referencePath);
      results.push({
        key: screenshotCase.key,
        status: "REFERENCE_UPDATED",
        diffPercent: 0,
        meanAbsDiff: 0,
      });
      continue;
    }

    const comparison = await compareImages({ referencePath, capturePath, diffPath });
    const passed =
      comparison.diffPercent <= MAX_DIFF_PERCENT &&
      comparison.meanAbsDiff <= MAX_MEAN_ABS_DIFF;
    results.push({
      key: screenshotCase.key,
      status: passed ? "PASS" : "FAIL",
      diffPercent: comparison.diffPercent,
      meanAbsDiff: comparison.meanAbsDiff,
      maxDiffPercent: MAX_DIFF_PERCENT,
      maxMeanAbsDiff: MAX_MEAN_ABS_DIFF,
      diffImage: diffPath,
    });
  }
  return results;
}

function buildServerLogger() {
  const stream = fs.createWriteStream(SERVER_LOG_PATH, { flags: "w" });
  return {
    stream,
    write(message) {
      stream.write(`${message}\n`);
    },
    close() {
      stream.end();
    },
  };
}

async function startDevServerIfNeeded() {
  const alreadyReady = await waitForServerReady(1500);
  if (alreadyReady) {
    return { child: null, startedByScript: false };
  }

  const logger = buildServerLogger();
  logger.write(`[faq-chatbot-visual-qa] starting dev server at ${new Date().toISOString()}`);
  const child = spawn("npm", ["run", "dev"], {
    cwd: PROJECT_ROOT,
    shell: true,
    env: process.env,
    windowsHide: true,
  });
  child.stdout.on("data", (chunk) => logger.write(String(chunk).trimEnd()));
  child.stderr.on("data", (chunk) => logger.write(String(chunk).trimEnd()));

  const ready = await waitForServerReady(120000);
  if (!ready) {
    try {
      child.kill("SIGTERM");
    } catch {
      // Ignore kill errors.
    }
    logger.close();
    throw new Error("Dev server did not become ready within timeout.");
  }

  return { child, startedByScript: true, logger };
}

async function stopDevServer(handle) {
  if (!handle?.startedByScript || !handle?.child) {
    if (handle?.logger) handle.logger.close();
    return;
  }
  try {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/PID", String(handle.child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
    } else {
      handle.child.kill("SIGTERM");
      await sleep(1000);
      if (!handle.child.killed) {
        handle.child.kill("SIGKILL");
      }
    }
  } catch {
    // Ignore stop errors.
  } finally {
    if (handle.logger) handle.logger.close();
  }
}

async function main() {
  ensureDir(ARTIFACT_DIR);
  ensureDir(CAPTURE_DIR);
  ensureDir(DIFF_DIR);

  console.log(`[faq-chatbot-visual-qa] base url: ${BASE_URL}`);
  console.log(
    `[faq-chatbot-visual-qa] mode: ${UPDATE_REFERENCE ? "update-reference" : "compare"}`,
  );

  const snapshot = await snapshotExistingFaqData();
  let serverHandle = null;
  let report = null;

  try {
    await seedFaqQaScenario();
    serverHandle = await startDevServerIfNeeded();
    await runFunctionalAssertions();

    const executablePath = detectChromeExecutable();
    console.log(`[faq-chatbot-visual-qa] browser executable: ${executablePath}`);
    const captures = await captureUiStates({ executablePath });
    const visualResults = await runVisualComparison(captures);
    const failed = visualResults.filter((item) => item.status === "FAIL");

    report = {
      generatedAtIso: new Date().toISOString(),
      baseUrl: BASE_URL,
      mode: UPDATE_REFERENCE ? "update-reference" : "compare",
      results: visualResults,
      passed: failed.length === 0,
    };
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
    console.table(visualResults);
    console.log(`[faq-chatbot-visual-qa] report written: ${REPORT_PATH}`);

    if (failed.length > 0) {
      throw new Error(
        `Visual comparison failed for ${failed.map((item) => item.key).join(", ")}.`,
      );
    }
  } finally {
    await stopDevServer(serverHandle);
    await restoreFaqData(snapshot);
    await mongoose.disconnect();
  }

  console.log("[faq-chatbot-visual-qa] completed successfully.");
}

main().catch((error) => {
  console.error(`[faq-chatbot-visual-qa] failed: ${error.message || error}`);
  process.exit(1);
});
