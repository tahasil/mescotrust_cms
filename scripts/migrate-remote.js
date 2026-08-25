const path = require("path");
const { execSync } = require("child_process");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function migrate() {
  const localUri = process.env.MONGODB_URI || "mongodb://localhost:27017/mescotrust_cms";
  const remoteUri = process.env.REMOTE_MONGODB_URI || process.argv[2];

  console.log("==========================================");
  console.log(" MESCO CMS — Database Migration Tool");
  console.log("==========================================");
  console.log("Local Target URI:", localUri);

  if (!remoteUri) {
    console.log("\nNo REMOTE_MONGODB_URI specified.");
    console.log("Usage: node scripts/migrate-remote.js <REMOTE_MONGODB_URI>");
    console.log("Or set REMOTE_MONGODB_URI in your .env / .env.local file.\n");
    console.log("Running local schema verification and seeding instead...");
    require("./seed.js");
    return;
  }

  const dumpDir = path.join(__dirname, "..", ".db_dump");
  console.log("Remote Source URI:", remoteUri.replace(/:[^:@]+@/, ":***@"));
  console.log("Dumping remote database to temporary directory...");

  try {
    execSync(\`mongodump --uri="\${remoteUri}" --out="\${dumpDir}"\`, { stdio: "inherit" });
    
    // Find dumped db directory inside dumpDir
    const dirs = fs.readdirSync(dumpDir).filter(f => fs.statSync(path.join(dumpDir, f)).isDirectory());
    if (dirs.length === 0) {
      throw new Error("No database directory found in dump output.");
    }
    const sourceDbDir = path.join(dumpDir, dirs[0]);
    const targetDbName = localUri.split("/").pop().split("?")[0] || "mescotrust_cms";

    console.log(\`Restoring into local database: \${targetDbName}...\`);
    execSync(\`mongorestore --db="\${targetDbName}" --drop "\${sourceDbDir}"\`, { stdio: "inherit" });

    // Cleanup dump directory
    fs.rmSync(dumpDir, { recursive: true, force: true });

    console.log("\n Migration completed successfully!");
  } catch (err) {
    console.error("\n Migration failed:", err.message);
    process.exit(1);
  }
}

migrate();
