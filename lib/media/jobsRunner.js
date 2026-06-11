const { connectDB } = require("../db");
const Media = require("../../models/Media");
const MediaJob = require("../../models/MediaJob");
const { getMediaSettings } = require("./settings");
const { optimizeExistingMediaFromDisk } = require("./processor");

function getStorageProvider() {
  return process.env.MEDIA_STORAGE_PROVIDER || "local";
}

function getImageFilter() {
  return {
    mimeType: {
      $in: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"],
    },
  };
}

function needsOptimizationFilter(jobType) {
  if (jobType === "regenerate_sizes") return getImageFilter();
  if (jobType === "convert_formats") {
    return {
      ...getImageFilter(),
      $or: [{ webpUrl: "" }, { webpUrl: { $exists: false } }, { avifUrl: "" }, { avifUrl: { $exists: false } }],
    };
  }
  return {
    ...getImageFilter(),
    $or: [
      { webpUrl: "" },
      { avifUrl: "" },
      { "generatedSizes.desktop.jpgUrl": "" },
      { "generatedSizes.desktop": { $exists: false } },
    ],
  };
}

async function updateJob(jobId, patch) {
  await MediaJob.findByIdAndUpdate(jobId, { $set: patch }, { new: false });
}

async function runMediaJob(jobId) {
  await connectDB();
  const job = await MediaJob.findById(jobId);
  if (!job) return;
  if (job.status === "cancelled" || job.status === "completed") return;

  const filter = needsOptimizationFilter(job.jobType);
  const mediaItems = await Media.find(filter).sort({ createdAt: 1 }).lean();
  const total = mediaItems.length;

  await updateJob(jobId, {
    status: "running",
    startedAt: new Date(),
    total,
    processed: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  });

  if (total === 0) {
    await updateJob(jobId, {
      status: "completed",
      endedAt: new Date(),
      processed: 0,
      success: 0,
      skipped: 0,
      failed: 0,
    });
    return;
  }

  const settings = await getMediaSettings();
  const storageProvider = getStorageProvider();
  let processed = 0;
  let success = 0;
  let failed = 0;
  let skipped = 0;
  const errors = [];

  for (const media of mediaItems) {
    const fresh = await MediaJob.findById(jobId).select("status").lean();
    if (!fresh || fresh.status === "cancelled") break;

    try {
      const optimized = await optimizeExistingMediaFromDisk({
        media,
        settings,
        storageProvider,
      });

      await Media.findByIdAndUpdate(media._id, {
        $set: {
          status: optimized.status || "ready",
          errorMessage: optimized.errorMessage || "",
          storageProvider: optimized.storageProvider || media.storageProvider || "local",
          storageKey: optimized.storageKey || media.storageKey || "",
          fileName: optimized.fileName || media.fileName || media.filename,
          filename: optimized.filename || media.filename || media.fileName,
          ext: optimized.ext || media.ext || "",
          mimeType: optimized.mimeType || media.mimeType,
          url: optimized.url || media.url,
          publicUrl:
            optimized.publicUrl ||
            media.publicUrl ||
            `/media/${media._id}?size=original&format=auto`,
          originalUrl: optimized.originalUrl || media.originalUrl || media.url,
          webpUrl: optimized.webpUrl || "",
          avifUrl: optimized.avifUrl || "",
          width: optimized.width || media.width || 0,
          height: optimized.height || media.height || 0,
          size: optimized.size || media.size || 0,
          originalSize: optimized.originalSize || media.originalSize || media.size || 0,
          optimizedSize: optimized.optimizedSize || media.optimizedSize || media.size || 0,
          savingsPercentage: optimized.savingsPercentage || 0,
          generatedSizes: optimized.generatedSizes || {},
          updatedBy: "system-media-job",
        },
      });

      success += 1;
    } catch (err) {
      failed += 1;
      errors.push({
        mediaId: String(media._id),
        reason: err?.message || "Optimization failed",
      });
      await Media.findByIdAndUpdate(media._id, {
        $set: {
          status: "failed",
          errorMessage: err?.message || "Optimization failed",
        },
      });
    } finally {
      processed += 1;
      await updateJob(jobId, {
        processed,
        success,
        failed,
        skipped,
        errors: errors.slice(-100),
      });
    }
  }

  const finalStatus = failed > 0 && success === 0 ? "failed" : "completed";
  await updateJob(jobId, {
    status: finalStatus,
    endedAt: new Date(),
    processed,
    success,
    failed,
    skipped,
    errors: errors.slice(-200),
  });
}

module.exports = { runMediaJob };
