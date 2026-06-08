/* eslint-disable no-console */

const BASE_URL = process.env.FAQ_CHATBOT_BASE_URL || "http://127.0.0.1:3000";
const MAX_QUESTIONS = Math.max(1, Number(process.env.FAQ_CHATBOT_EVAL_MAX_QUESTIONS) || 200);
const SEARCH_PAGE_SIZE = Math.max(1, Number(process.env.FAQ_CHATBOT_EVAL_PAGE_SIZE) || 5);

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function buildQueryCandidates(questionText) {
  const tokens = tokenize(questionText);
  if (tokens.length === 0) return [];

  const candidates = [];
  candidates.push(tokens.slice(0, Math.min(4, tokens.length)).join(" "));
  if (tokens.length >= 2) candidates.push(tokens.slice(0, 2).join(" "));
  if (tokens.length >= 3) candidates.push(tokens.slice(1, 3).join(" "));
  if (tokens.length >= 4) candidates.push(tokens.slice(1, 4).join(" "));
  candidates.push(tokens.join(" "));

  const deduped = [];
  const seen = new Set();
  for (const candidate of candidates.map((item) => normalizeText(item)).filter(Boolean)) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    deduped.push(candidate);
  }
  return deduped;
}

async function fetchJson(pathname) {
  const url = `${BASE_URL}${pathname}`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${pathname} -> ${response.status} ${json?.error || "Request failed"}`);
  }
  return json;
}

async function collectQuestions() {
  const rootPayload = await fetchJson("/api/public/faq-chatbot/root-options");
  const queue = Array.isArray(rootPayload?.options)
    ? rootPayload.options.map((item) => item?.nodeId).filter(Boolean)
    : [];

  const byId = new Map();
  while (queue.length > 0 && byId.size < MAX_QUESTIONS) {
    const nodeId = String(queue.shift() || "").trim();
    if (!nodeId || byId.has(nodeId)) continue;
    const nodePayload = await fetchJson(`/api/public/faq-chatbot/node/${encodeURIComponent(nodeId)}`);
    const questionText = String(nodePayload?.node?.questionText || "").trim();
    if (questionText) {
      byId.set(nodeId, {
        nodeId,
        questionText,
      });
    }

    const children = Array.isArray(nodePayload?.childQuestions) ? nodePayload.childQuestions : [];
    for (const child of children) {
      const childId = String(child?.nodeId || "").trim();
      if (childId && !byId.has(childId)) queue.push(childId);
    }
  }

  return Array.from(byId.values());
}

async function evaluateQuestion(question) {
  const queryCandidates = buildQueryCandidates(question.questionText);
  if (queryCandidates.length === 0) {
    return {
      nodeId: question.nodeId,
      questionText: question.questionText,
      query: "",
      foundAt: -1,
      matchedCount: 0,
      attempted: false,
    };
  }

  for (const query of queryCandidates) {
    const payload = await fetchJson(
      `/api/public/faq-chatbot/search?q=${encodeURIComponent(query)}&page=1&pageSize=${SEARCH_PAGE_SIZE}`,
    );
    const results = Array.isArray(payload?.results) ? payload.results : [];
    const foundAt = results.findIndex((item) => String(item?.questionNodeId || "") === question.nodeId);
    if (foundAt >= 0) {
      return {
        nodeId: question.nodeId,
        questionText: question.questionText,
        query,
        foundAt,
        matchedCount: Number(payload?.matchedCount) || 0,
        attempted: true,
      };
    }
  }

  const fallbackQuery = queryCandidates[0];
  const fallbackPayload = await fetchJson(
    `/api/public/faq-chatbot/search?q=${encodeURIComponent(fallbackQuery)}&page=1&pageSize=${SEARCH_PAGE_SIZE}`,
  );
  return {
    nodeId: question.nodeId,
    questionText: question.questionText,
    query: fallbackQuery,
    foundAt: -1,
    matchedCount: Number(fallbackPayload?.matchedCount) || 0,
    attempted: true,
  };
}

function summarize(results) {
  const attempted = results.filter((item) => item.attempted);
  const top1 = attempted.filter((item) => item.foundAt === 0);
  const top3 = attempted.filter((item) => item.foundAt >= 0 && item.foundAt <= 2);
  const found = attempted.filter((item) => item.foundAt >= 0);
  const missed = attempted.filter((item) => item.foundAt < 0);

  const pct = (num, den) => (den <= 0 ? 0 : Math.round((num / den) * 10000) / 100);
  return {
    totalCollected: results.length,
    totalAttempted: attempted.length,
    foundAny: found.length,
    top1: top1.length,
    top3: top3.length,
    missed: missed.length,
    foundAnyPct: pct(found.length, attempted.length),
    top1Pct: pct(top1.length, attempted.length),
    top3Pct: pct(top3.length, attempted.length),
  };
}

async function main() {
  console.log(`FAQ search evaluation started against ${BASE_URL}`);
  const questions = await collectQuestions();
  if (questions.length === 0) {
    console.log("No FAQ questions found. Seed/configure FAQ data, then rerun.");
    process.exit(0);
  }

  const results = [];
  for (const question of questions) {
    // Sequential requests avoid accidental request bursts in shared environments.
    const result = await evaluateQuestion(question);
    results.push(result);
  }

  const summary = summarize(results);
  console.log("FAQ search evaluation summary:");
  console.table(summary);

  const misses = results.filter((item) => item.attempted && item.foundAt < 0).slice(0, 15);
  if (misses.length > 0) {
    console.log("Sample misses (up to 15):");
    console.table(
      misses.map((item) => ({
        nodeId: item.nodeId,
        query: item.query,
        matchedCount: item.matchedCount,
        questionText: item.questionText.slice(0, 80),
      })),
    );
  }
}

main().catch((err) => {
  console.error("FAQ search evaluation failed:", err.message || err);
  process.exit(1);
});
