const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const sharp = require("sharp");

const REFERENCE_ROOT = "D:\\Tahasil BKP\\MESCO\\Mesco Fable18";
const OUTPUT_ROOT = path.resolve(__dirname, "..", "..", "mescotrust_visual_qa");
const CURRENT_ORIGIN = process.env.VISUAL_CURRENT_ORIGIN || "http://localhost:3000";

const PAGE_MAP = [
  ["home", "/", "index.html"],
  ["about", "/about-us/mesco-at-glance", "about.html"],
  ["awards-recognition", "/about-us/awards-recognition", "awards-recognition.html"],
  ["good-governance", "/about-us/good-governance", "good-governance.html"],
  ["managing-committee", "/about-us/managing-committee", "managing-committee.html"],
  ["our-team", "/about-us/our-team", "our-team.html"],
  ["volunteer", "/about-us/volunteer", "volunteer.html"],
  ["donate", "/donate-now", "donate.html"],
  ["careers", "/get-involved/careers", "careers.html"],
  ["contact-us", "/get-involved/contact-us", "contact-us.html"],
  ["csr", "/get-involved/csr", "csr.html"],
  ["notices", "/get-involved/notices", "notices.html"],
  ["donor-testimonials", "/impact/donor-testimonials-stories", "donor-testimonials.html"],
  ["success-stories", "/impact/success-stories", "success-stories.html"],
  ["annual-reports", "/media/annual-reports", "annual-reports.html"],
  ["gallery", "/media/image-gallery", "gallery.html"],
  ["in-media", "/media/in-media", "in-media.html"],
  ["newsletter", "/media/newsletter", "newsletter.html"],
  ["video-gallery", "/media/video-gallery", "video-gallery.html"],
  ["clinics-dispensaries", "/our-works/clinics-dispensaries", "clinics-dispensaries.html"],
  ["educational-support", "/our-works/educational-support", "educational-support.html"],
  ["medical-aid", "/our-works/medical-aid", "medical-aid.html"],
  ["old-newspaper-units", "/our-works/old-newspaper-units", "old-newspaper-units.html"],
  ["relief-of-poverty", "/our-works/relief-of-poverty", "relief-of-poverty.html"],
  ["school-adoption", "/our-works/school-adoption", "school-adoption.html"],
  ["blog", "/blog", "blog.html"],
  ["events", "/events", "events.html"],
  ["news", "/news", "news.html"],
];

const VIEWPORTS = {
  desktop: { width: 1440, height: 1000 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};

function argValue(name) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) || "";
}

function selectedValues(raw, fallback) {
  if (!raw || raw === "all") return fallback;
  const wanted = new Set(raw.split(",").map((value) => value.trim()).filter(Boolean));
  return fallback.filter((value) => wanted.has(Array.isArray(value) ? value[0] : value));
}

async function settlePage(page) {
  await page.waitForLoadState("domcontentloaded");
  if (await page.locator("#page-loader").count()) {
    await page.locator("#page-loader").waitFor({ state: "attached", timeout: 20000 }).catch(() => {});
    await page.waitForFunction(() => {
      const loader = document.querySelector("#page-loader");
      return !loader || loader.classList.contains("page-loader-hidden") || loader.getAttribute("aria-hidden") === "true";
    }, null, { timeout: 25000 }).catch(() => {});
  }
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready.catch(() => {});
  });
  await page.waitForTimeout(800);
  await page.evaluate(async () => {
    const step = Math.max(420, Math.floor(window.innerHeight * 0.72));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 45));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
  await page.addStyleTag({
    content: `
      *, *::before, *::after { animation-delay: 0s !important; animation-duration: 0s !important; transition-duration: 0s !important; }
      .fadeEffects { opacity: 1 !important; transform: none !important; visibility: visible !important; }
      #page-loader, [class*="chatbot" i], [class*="cookie" i], [class*="popup" i], .ant-notification { display: none !important; }
    `,
  });
}

async function pageMetrics(page) {
  return page.evaluate(() => {
    const selectors = ["main > section", ".cms-layout > section", ".cms-layout > div", "footer"];
    const seen = new Set();
    const sections = [];
    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        const box = element.getBoundingClientRect();
        const heading = element.querySelector("h1,h2,h3")?.textContent?.replace(/\s+/g, " ").trim() || "";
        sections.push({
          tag: element.tagName.toLowerCase(),
          id: element.id || "",
          component: element.getAttribute("data-component") || "",
          className: typeof element.className === "string" ? element.className.slice(0, 160) : "",
          heading: heading.slice(0, 100),
          top: Math.round(box.top + window.scrollY),
          height: Math.round(box.height),
          width: Math.round(box.width),
        });
      });
    }
    return {
      title: document.title,
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      sections: sections.sort((a, b) => a.top - b.top),
    };
  });
}

async function normalizeImage(input, width, height) {
  const metadata = await sharp(input).metadata();
  return sharp(input)
    .extend({
      top: 0,
      left: 0,
      right: Math.max(0, width - metadata.width),
      bottom: Math.max(0, height - metadata.height),
      background: { r: 255, g: 255, b: 255 },
    })
    .removeAlpha()
    .raw()
    .toBuffer();
}

async function createDiff(referencePath, currentPath, diffPath) {
  const [referenceMeta, currentMeta] = await Promise.all([
    sharp(referencePath).metadata(),
    sharp(currentPath).metadata(),
  ]);
  const width = Math.max(referenceMeta.width, currentMeta.width);
  const height = Math.max(referenceMeta.height, currentMeta.height);
  const [reference, current] = await Promise.all([
    normalizeImage(referencePath, width, height),
    normalizeImage(currentPath, width, height),
  ]);
  const diff = Buffer.alloc(width * height * 3);
  let total = 0;
  let changed = 0;
  for (let index = 0; index < diff.length; index += 3) {
    const delta = Math.round((
      Math.abs(reference[index] - current[index]) +
      Math.abs(reference[index + 1] - current[index + 1]) +
      Math.abs(reference[index + 2] - current[index + 2])
    ) / 3);
    total += delta;
    if (delta >= 24) changed += 1;
    diff[index] = Math.min(255, delta * 4);
    diff[index + 1] = delta < 24 ? 255 - delta : 0;
    diff[index + 2] = delta < 24 ? 255 - delta : 0;
  }
  await sharp(diff, { raw: { width, height, channels: 3 } }).jpeg({ quality: 76 }).toFile(diffPath);
  return {
    meanDelta: Number((total / (width * height)).toFixed(2)),
    changedRatio: Number((changed / (width * height)).toFixed(4)),
    referenceHeight: referenceMeta.height,
    currentHeight: currentMeta.height,
  };
}

async function createPair(referencePath, currentPath, pairPath) {
  const panelWidth = 720;
  const [reference, current] = await Promise.all([
    sharp(referencePath).resize({ width: panelWidth }).jpeg({ quality: 78 }).toBuffer(),
    sharp(currentPath).resize({ width: panelWidth }).jpeg({ quality: 78 }).toBuffer(),
  ]);
  const [referenceMeta, currentMeta] = await Promise.all([
    sharp(reference).metadata(),
    sharp(current).metadata(),
  ]);
  const height = Math.max(referenceMeta.height, currentMeta.height);
  await sharp({
    create: { width: panelWidth * 2, height, channels: 3, background: "#ffffff" },
  })
    .composite([
      { input: reference, left: 0, top: 0 },
      { input: current, left: panelWidth, top: 0 },
    ])
    .jpeg({ quality: 78 })
    .toFile(pairPath);
}

async function capture(browser, pageEntry, viewportName, viewport) {
  const [name, currentPath, referenceFile] = pageEntry;
  const directory = path.join(OUTPUT_ROOT, viewportName);
  fs.mkdirSync(directory, { recursive: true });
  const referenceScreenshot = path.join(directory, `${name}--reference.jpg`);
  const currentScreenshot = path.join(directory, `${name}--current.jpg`);
  const diffScreenshot = path.join(directory, `${name}--diff.jpg`);
  const pairScreenshot = path.join(directory, `${name}--pair.jpg`);
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  const referenceUrl = new URL(`file:///${path.join(REFERENCE_ROOT, referenceFile).replace(/\\/g, "/")}`).href;
  await page.goto(referenceUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await settlePage(page);
  const referenceMetrics = await pageMetrics(page);
  await page.screenshot({ path: referenceScreenshot, fullPage: true, type: "jpeg", quality: 80 });

  const response = await page.goto(`${CURRENT_ORIGIN}${currentPath}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await settlePage(page);
  const currentMetrics = await pageMetrics(page);
  await page.screenshot({ path: currentScreenshot, fullPage: true, type: "jpeg", quality: 80 });
  const diff = await createDiff(referenceScreenshot, currentScreenshot, diffScreenshot);
  await createPair(referenceScreenshot, currentScreenshot, pairScreenshot);
  await context.close();
  return {
    page: name,
    viewport: viewportName,
    currentPath,
    referenceFile,
    status: response?.status() || 0,
    errors,
    reference: referenceMetrics,
    current: currentMetrics,
    diff,
  };
}

async function main() {
  const pages = selectedValues(argValue("pages"), PAGE_MAP);
  const viewports = selectedValues(argValue("viewports"), Object.keys(VIEWPORTS));
  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const viewportName of viewports) {
      for (const pageEntry of pages) {
        process.stdout.write(`capture ${viewportName} ${pageEntry[0]} ... `);
        try {
          const result = await capture(browser, pageEntry, viewportName, VIEWPORTS[viewportName]);
          results.push(result);
          console.log(`${result.status} delta=${result.diff.meanDelta} changed=${result.diff.changedRatio}`);
        } catch (error) {
          results.push({ page: pageEntry[0], viewport: viewportName, error: error.message });
          console.log(`ERROR ${error.message}`);
        }
      }
    }
  } finally {
    await browser.close();
  }
  const summaryPath = path.join(OUTPUT_ROOT, "summary.json");
  let previous = [];
  if (fs.existsSync(summaryPath)) {
    try {
      previous = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    } catch {
      previous = [];
    }
  }
  const merged = new Map(
    previous.map((result) => [`${result.viewport}:${result.page}`, result]),
  );
  results.forEach((result) => merged.set(`${result.viewport}:${result.page}`, result));
  const summary = [...merged.values()].sort((a, b) =>
    `${a.viewport}:${a.page}`.localeCompare(`${b.viewport}:${b.page}`),
  );
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`summary ${summaryPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
