const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawn } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const PORT = 3015;
const BASE_URL = `http://localhost:${PORT}`;

function waitForReady(child, timeoutMs = 180000) {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let settled = false;

    const done = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.stdout?.off("data", onStdout);
      child.stderr?.off("data", onStderr);
      child.off("exit", onExit);
      if (error) reject(error);
      else resolve({ stdout, stderr });
    };

    const onStdout = (chunk) => {
      stdout += String(chunk);
      if (/ready in|ready on|ready - started server/i.test(stdout)) {
        done();
      }
    };
    const onStderr = (chunk) => {
      stderr += String(chunk);
      if (/ready in|ready on|ready - started server/i.test(stderr)) {
        done();
      }
    };
    const onExit = (code) => {
      done(new Error(`next dev exited early with code ${code}\n${stdout}\n${stderr}`));
    };

    const timer = setTimeout(() => {
      done(new Error(`Timed out waiting for next dev readiness\n${stdout}\n${stderr}`));
    }, timeoutMs);

    child.stdout?.on("data", onStdout);
    child.stderr?.on("data", onStderr);
    child.once("exit", onExit);
  });
}

async function stopServer(child) {
  if (!child || child.killed) return;
  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
      });
      killer.on("exit", () => resolve());
      killer.on("error", () => resolve());
    });
    return;
  }
  child.kill("SIGTERM");
}

async function fetchJson(url, timeoutMs = 120000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const body = await response.json();
    return { status: response.status, body };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchMedia(url, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const body = await response.arrayBuffer();
    return { status: response.status, headers: response.headers, byteLength: body.byteLength };
  } finally {
    clearTimeout(timer);
  }
}

test("public social wall APIs return healthy JSON contracts", async () => {
  const child =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", `npx next dev -p ${PORT}`], {
          cwd: projectRoot,
          env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
          stdio: ["ignore", "pipe", "pipe"],
        })
      : spawn("npx", ["next", "dev", "-p", String(PORT)], {
          cwd: projectRoot,
          env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
          stdio: ["ignore", "pipe", "pipe"],
        });

  try {
    await waitForReady(child);

    const platforms = await fetchJson(`${BASE_URL}/api/public/social-wall/platforms`);
    assert.equal(platforms.status, 200);
    assert.ok(platforms.body && typeof platforms.body === "object");
    assert.ok(Array.isArray(platforms.body.items));
    assert.ok("settings" in platforms.body);

    const feed = await fetchJson(`${BASE_URL}/api/public/social-wall/feed?limit=3`);
    assert.equal(feed.status, 200);
    assert.ok(feed.body && typeof feed.body === "object");
    assert.ok(Array.isArray(feed.body.items));
    assert.ok(Object.prototype.hasOwnProperty.call(feed.body, "nextCursor"));

    const mediaItem = feed.body.items.find(
      (item) => item?.id && (item?.thumbnailUrl || item?.mediaUrl),
    );
    if (mediaItem) {
      const media = await fetchMedia(
        `${BASE_URL}/api/public/social-wall/media/${encodeURIComponent(mediaItem.id)}?source=media&index=0`,
      );
      assert.equal(media.status, 200);
      assert.match(media.headers.get("content-type") || "", /^image\//);
      assert.match(media.headers.get("cache-control") || "", /max-age=86400/);
      assert.ok(media.byteLength > 0);
    }

    const moduleFeed = await fetchJson(`${BASE_URL}/api/public/social-wall?view=module&limit=3`);
    assert.equal(moduleFeed.status, 200);
    assert.ok(moduleFeed.body && typeof moduleFeed.body === "object");
    assert.ok(Array.isArray(moduleFeed.body.items));
    assert.equal(typeof moduleFeed.body.moduleEnabled, "boolean");
  } finally {
    await stopServer(child);
  }
});
