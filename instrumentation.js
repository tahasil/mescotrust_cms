const { validateEnv } = require("./lib/env");

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  validateEnv();

  // Opt-out: SKIP_INDEX_SYNC=1 for environments where indexes are managed
  // out-of-band (e.g. Atlas migrations). Default is to sync on boot.
  if (process.env.SKIP_INDEX_SYNC === "1") return;
  try {
    const { connectDB } = require("./lib/db");
    const { syncAllIndexes } = require("./scripts/ensure-indexes");
    // Fire-and-forget — we don't want a slow index build to delay readiness.
    (async () => {
      await connectDB();
      await syncAllIndexes();
    })().catch((err) => {
      console.error("[instrumentation] index sync failed:", err.message);
    });
  } catch (err) {
    console.error("[instrumentation] could not load index sync:", err.message);
  }
}
