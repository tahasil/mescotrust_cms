const runningJobs = new Set();

function isJobRunning(jobId) {
  return runningJobs.has(String(jobId));
}

function markJobRunning(jobId) {
  runningJobs.add(String(jobId));
}

function markJobFinished(jobId) {
  runningJobs.delete(String(jobId));
}

function enqueueMediaJob(jobId, runner) {
  const key = String(jobId);
  if (!key) return false;
  if (isJobRunning(key)) return false;
  markJobRunning(key);
  setTimeout(async () => {
    try {
      await runner(key);
    } finally {
      markJobFinished(key);
    }
  }, 25);
  return true;
}

module.exports = {
  enqueueMediaJob,
  isJobRunning,
  markJobRunning,
  markJobFinished,
};
