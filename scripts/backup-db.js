/**
 * Back up every MongoDB collection as canonical Extended JSON Lines.
 *
 * Output is stored outside the repository by default:
 *   ../mescotrust_cms_backups/YYYY-MM-DD_HH-mm-ss/database
 *
 * Set BACKUP_ROOT to choose another external backup root.
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { once } = require("events");
const { MongoClient } = require("mongodb");
const { EJSON } = require("bson");

const projectRoot = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(projectRoot, ".env") });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const defaultBackupRoot = path.resolve(
  projectRoot,
  "..",
  `${path.basename(projectRoot)}_backups`,
);
const backupRoot = path.resolve(process.env.BACKUP_ROOT || defaultBackupRoot);
const outputDirectory = path.join(backupRoot, timestamp, "database");

function assertExternalBackupPath() {
  const projectPrefix = `${projectRoot}${path.sep}`;
  if (
    outputDirectory === projectRoot ||
    outputDirectory.startsWith(projectPrefix)
  ) {
    throw new Error("Database backups must be stored outside the project directory.");
  }
}

async function writeCollection(db, collectionInfo, index) {
  const safeName = collectionInfo.name.replace(/[^A-Za-z0-9._-]/g, "_");
  const fileName = `${String(index + 1).padStart(3, "0")}_${safeName}.ejsonl.gz`;
  const filePath = path.join(outputDirectory, fileName);
  const gzip = zlib.createGzip({ level: 9 });
  const output = fs.createWriteStream(filePath, { flags: "wx" });
  gzip.pipe(output);

  let documents = 0;
  for await (const document of db.collection(collectionInfo.name).find({})) {
    const line = `${EJSON.stringify(document, { relaxed: false })}\n`;
    if (!gzip.write(line)) await once(gzip, "drain");
    documents += 1;
  }

  gzip.end();
  await once(output, "finish");

  let indexes = [];
  try {
    indexes = await db.collection(collectionInfo.name).indexes();
  } catch (error) {
    indexes = [{ backupWarning: error.message }];
  }

  return {
    name: collectionInfo.name,
    type: collectionInfo.type,
    options: collectionInfo.options || {},
    info: collectionInfo.info || {},
    idIndex: collectionInfo.idIndex || null,
    indexes,
    file: fileName,
    documents,
  };
}

async function backup() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI in .env");

  assertExternalBackupPath();
  fs.mkdirSync(outputDirectory, { recursive: true });

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const collectionInfos = await db
      .listCollections({}, { nameOnly: false })
      .toArray();
    const collections = [];
    let totalDocuments = 0;

    for (let index = 0; index < collectionInfos.length; index += 1) {
      const result = await writeCollection(db, collectionInfos[index], index);
      collections.push(result);
      totalDocuments += result.documents;
      console.log(`OK ${result.name}: ${result.documents} documents`);
    }

    const manifest = {
      format: "MongoDB Extended JSON Lines, canonical mode, gzip-compressed",
      createdAt: new Date().toISOString(),
      databaseName: db.databaseName,
      collectionCount: collections.length,
      totalDocuments,
      collections,
    };
    fs.writeFileSync(
      path.join(outputDirectory, "manifest.ejson"),
      EJSON.stringify(manifest, { relaxed: false, indent: 2 }),
      { encoding: "utf8", flag: "wx" },
    );

    console.log(`Backup complete: ${outputDirectory}`);
  } finally {
    await client.close();
  }
}

backup().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
