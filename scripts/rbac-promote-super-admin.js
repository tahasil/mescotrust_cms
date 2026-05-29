#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Migration M3 (TSUV → MESCO RBAC port, Phase 1).
 * Promote an existing user to Super Admin. MESCO ships with no Super Admin, so
 * run this once after the RBAC bootstrap to seed the first one.
 *
 * Usage: node scripts/rbac-promote-super-admin.js <email>
 *    or: npm run rbac-promote-super-admin -- <email>
 */
const path = require("path");
const projectRoot = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(projectRoot, ".env.local") });
require("dotenv").config({ path: path.join(projectRoot, ".env") });

async function run() {
  const emailArg = process.argv[2];
  const email = String(emailArg || process.env.RBAC_SUPER_ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();

  if (!email) {
    console.error("Usage: node scripts/rbac-promote-super-admin.js <email>");
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI in .env.local or .env");
    process.exit(1);
  }

  const { connectDB } = require("../lib/db");
  await connectDB();

  const User = require("../models/User");
  const user = await User.findOne({ email });
  if (!user) {
    console.error(`User not found for email: ${email}`);
    process.exit(1);
  }

  user.role = "Super Admin";
  user.roleKey = "super_admin";
  user.userType = "superadmin";
  user.status = "active";
  user.permissionVersion = Number(user.permissionVersion || 1) + 1;
  user.sessionVersion = Number(user.sessionVersion || 1) + 1;
  await user.save();

  console.log(`Promoted ${email} to Super Admin successfully.`);
  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
