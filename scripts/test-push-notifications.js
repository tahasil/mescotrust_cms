/**
 * Test script to verify Web Push module integration, models, and VAPID setup.
 * Run with: node scripts/test-push-notifications.js
 */

const assert = require("assert");

async function runTests() {
  console.log("=== Testing Push Notification Module ===");

  // 1. Verify VAPID Key presence
  require("dotenv").config({ path: ".env" });
  assert(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, "NEXT_PUBLIC_VAPID_PUBLIC_KEY is defined");
  assert(process.env.VAPID_PRIVATE_KEY, "VAPID_PRIVATE_KEY is defined");
  console.log("✔ VAPID keys loaded from .env");

  // 2. Verify models load cleanly
  const PushSubscription = require("../models/PushSubscription");
  assert(PushSubscription, "PushSubscription model loaded");
  assert(PushSubscription.schema.paths.endpoint, "endpoint path exists on PushSubscription");
  assert(PushSubscription.schema.paths.status, "status path exists on PushSubscription");
  console.log("✔ PushSubscription model verified");

  const PushNotification = require("../models/PushNotification");
  assert(PushNotification, "PushNotification model loaded");
  assert(PushNotification.schema.paths.title, "title path exists on PushNotification");
  assert(PushNotification.schema.paths["stats.totalSubscribers"], "stats.totalSubscribers path exists on PushNotification");
  console.log("✔ PushNotification model verified");

  // 3. Verify lib/webPush setup
  const { ensureVapidConfig, getVapidPublicKey } = require("../lib/webPush");
  const configured = ensureVapidConfig();
  assert.strictEqual(configured, true, "ensureVapidConfig() returns true");
  const pubKey = getVapidPublicKey();
  assert(pubKey && pubKey.length > 20, "getVapidPublicKey() returns valid key");
  console.log("✔ lib/webPush initialized VAPID successfully");

  // 4. Verify RBAC catalog entry
  const fs = require("fs");
  const path = require("path");
  const catalogContent = fs.readFileSync(path.join(__dirname, "../lib/rbac/catalog.js"), "utf8");
  assert(catalogContent.includes('key: "push_notifications"'), "push_notifications is in ADMIN_MODULES");
  assert(catalogContent.includes('"push-notifications": "push_notifications"'), "push-notifications alias is defined");
  assert(catalogContent.includes('"/admin/push-notifications": "push_notifications.view"'), "Menu permission is mapped");
  assert(catalogContent.includes('path.startsWith("/admin/push-notifications")'), "Route permission check is mapped");
  console.log("✔ RBAC catalog and page permissions verified");

  console.log("\nALL PUSH NOTIFICATION CHECKS PASSED SUCCESSFULLY!\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
