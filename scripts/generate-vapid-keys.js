#!/usr/bin/env node

/**
 * Script to generate VAPID keys for Web Push Notifications.
 * Run with: node scripts/generate-vapid-keys.js
 */

const webpush = require("web-push");

console.log("\n=========================================");
console.log(" Generating Web Push VAPID Keypair...");
console.log("=========================================\n");

const vapidKeys = webpush.generateVAPIDKeys();

console.log("Copy and paste the following into your .env file:\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:info@mescotrust.org\n`);
console.log("=========================================\n");
