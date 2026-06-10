"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import {
  ArrowLeftOutlined,
  ArrowUpOutlined,
  CompressOutlined,
  CloseOutlined,
  ExpandOutlined,
  HomeOutlined,
  MessageOutlined,
} from "@ant-design/icons";

function resolveMediaSrc(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("/media/") || raw.startsWith("http")) return raw;
  if (/^[a-f0-9]{24}$/i.test(raw)) return `/media/${raw}`;
  return raw;
}

function extractApiError(payload, fallback = "Request failed") {
  if (!payload) return fallback;
  if (payload.error?.message) return payload.error.message;
  if (payload.message) return payload.message;
  if (payload.error) return payload.error;
  return fallback;
}

function normalizeQuestion(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function dedupeQuestions(items) {
  const out = [];
  const seenById = new Set();
  const seenByQuestion = new Set();
  for (const item of items || []) {
    if (!item || !item._id) continue;
    const id = String(item._id);
    if (seenById.has(id)) continue;
    const q = normalizeQuestion(item.question);
    if (q && seenByQuestion.has(q)) continue;
    seenById.add(id);
    if (q) seenByQuestion.add(q);
    out.push(item);
  }
  return out;
}

function htmlToText(input) {
  const raw = String(input || "").trim();
  if (!raw) return "";
  if (typeof window !== "undefined") {
    const node = document.createElement("div");
    node.innerHTML = raw;
    return String(node.textContent || node.innerText || "")
      .replace(/\s+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasRenderableHtml(input) {
  const text = String(input || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0;
}

function ContactAction({ href, label, target, onClick, accentColor }) {
  return (
    <a
      href={href}
      target={target || "_self"}
      rel={target === "_blank" ? "noreferrer" : undefined}
      onClick={onClick}
      style={{
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "7px 11px",
        borderRadius: 999,
        border: `1px solid ${accentColor}`,
        color: accentColor,
        fontWeight: 600,
        fontSize: 12,
      }}
    >
      {label}
    </a>
  );
}

export default function ChatbotWidget() {
  const [sessionId] = useState(() => {
    if (typeof window === "undefined") return `chat-${Date.now()}`;
    if (typeof window.crypto?.randomUUID === "function")
      return window.crypto.randomUUID();
    return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  });

  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [openedAt, setOpenedAt] = useState(0);
  const [settings, setSettings] = useState(null);
  const [roots, setRoots] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [popular, setPopular] = useState([]);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [query, setQuery] = useState("");
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [typing, setTyping] = useState(false);
  const [streamedBotText, setStreamedBotText] = useState("");
  const [botReplyText, setBotReplyText] = useState("");
  const [streamingMode, setStreamingMode] = useState(null);
  const [nodeResponseReadyId, setNodeResponseReadyId] = useState(null);
  const chatScrollRef = useRef(null);
  const touchStartYRef = useRef(0);
  const activeStreamRef = useRef({ runId: 0, timer: null });

  const sendEvent = useCallback(
    async (eventType, payload = {}) => {
      try {
        const entryPage =
          typeof window !== "undefined" ? window.location.pathname : "";
        await fetch("/api/public/chatbot/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType,
            sessionId,
            entryPage,
            ...payload,
          }),
          keepalive: true,
        });
      } catch {
        // best effort
      }
    },
    [sessionId],
  );

  const scrollToBottom = useCallback((behavior = "smooth") => {
    const node = chatScrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior });
  }, []);

  const cancelActiveStream = useCallback(() => {
    const current = activeStreamRef.current;
    current.runId += 1;
    if (current.timer) {
      clearInterval(current.timer);
      current.timer = null;
    }
    setTyping(false);
    setStreamingMode(null);
    setStreamedBotText("");
  }, []);

  const streamText = useCallback(
    (text, mode = "reply", onDone) => {
      const fullText = String(text || "").trim();
      cancelActiveStream();
      if (!settings?.enableTypingAnimation || !fullText) {
        if (typeof onDone === "function") onDone();
        return;
      }

      const chars = Array.from(fullText);
      const total = chars.length;
      const targetDurationMs = Math.max(700, Math.min(5000, total * 22));
      const intervalMs = 16;
      const totalTicks = Math.max(1, Math.ceil(targetDurationMs / intervalMs));
      const step = Math.min(24, Math.max(1, Math.ceil(total / totalTicks)));

      setTyping(true);
      setStreamingMode(mode);
      setStreamedBotText("");
      const current = activeStreamRef.current;
      const runId = current.runId + 1;
      current.runId = runId;
      let index = 0;

      current.timer = setInterval(() => {
        if (activeStreamRef.current.runId !== runId) return;
        index = Math.min(total, index + step);
        const partial = chars.slice(0, index).join("");
        setStreamedBotText(partial);
        scrollToBottom("auto");
        if (index >= total) {
          clearInterval(current.timer);
          current.timer = null;
          setTyping(false);
          setStreamingMode(null);
          if (typeof onDone === "function") onDone();
          setTimeout(() => scrollToBottom("smooth"), 0);
        }
      }, intervalMs);
    },
    [cancelActiveStream, scrollToBottom, settings?.enableTypingAnimation],
  );

  const handleWheelContain = useCallback((event) => {
    const node = chatScrollRef.current;
    if (!node) return;
    const deltaY = Number(event.deltaY || 0);
    const atTop = node.scrollTop <= 0;
    const atBottom =
      node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
    if ((deltaY < 0 && atTop) || (deltaY > 0 && atBottom)) {
      event.preventDefault();
    }
    event.stopPropagation();
  }, []);

  const handleTouchStartContain = useCallback((event) => {
    touchStartYRef.current = Number(event.touches?.[0]?.clientY || 0);
  }, []);

  const handleTouchMoveContain = useCallback((event) => {
    const node = chatScrollRef.current;
    if (!node) return;
    const currentY = Number(event.touches?.[0]?.clientY || 0);
    const deltaY = touchStartYRef.current - currentY;
    touchStartYRef.current = currentY;
    const atTop = node.scrollTop <= 0;
    const atBottom =
      node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
    if ((deltaY < 0 && atTop) || (deltaY > 0 && atBottom)) {
      event.preventDefault();
    }
    event.stopPropagation();
  }, []);

  const loadBootstrap = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, rootsRes, featuredRes, popularRes] =
        await Promise.all([
          fetch("/api/public/chatbot/settings"),
          fetch("/api/public/chatbot/faqs/root"),
          fetch("/api/public/chatbot/featured"),
          fetch("/api/public/chatbot/popular"),
        ]);

      const [settingsData, rootsData, featuredData, popularData] =
        await Promise.all([
          settingsRes.json().catch(() => ({})),
          rootsRes.json().catch(() => ({})),
          featuredRes.json().catch(() => ({})),
          popularRes.json().catch(() => ({})),
        ]);

      if (!settingsRes.ok || !settingsData?.success) {
        throw new Error(
          extractApiError(settingsData, "Failed to load chatbot settings"),
        );
      }
      if (!rootsRes.ok || !rootsData?.success) {
        throw new Error(
          extractApiError(rootsData, "Failed to load root questions"),
        );
      }

      setSettings(settingsData.data || null);
      setRoots(Array.isArray(rootsData?.data) ? rootsData.data : []);
      setFeatured(
        featuredRes.ok &&
          featuredData?.success &&
          Array.isArray(featuredData.data)
          ? featuredData.data
          : [],
      );
      setPopular(
        popularRes.ok && popularData?.success && Array.isArray(popularData.data)
          ? popularData.data
          : [],
      );
    } catch {
      setSettings(null);
      setRoots([]);
      setFeatured([]);
      setPopular([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  useEffect(() => {
    if (!open) return;
    scrollToBottom("auto");
  }, [
    open,
    current,
    searchResults,
    searchError,
    streamedBotText,
    lastSubmittedQuery,
    nodeResponseReadyId,
    scrollToBottom,
  ]);

  useEffect(
    () => () => {
      const current = activeStreamRef.current;
      current.runId += 1;
      if (current.timer) clearInterval(current.timer);
    },
    [],
  );

  const openNode = useCallback(
    async (id, { track = true, pushHistory = true, userText = "" } = {}) => {
      if (!id) return;
      try {
        cancelActiveStream();
        setTyping(true);
        setStreamingMode("loading");
        setStreamedBotText("");
        setSearchError("");
        setSearchResults([]);
        setBotReplyText("");
        setNodeResponseReadyId(null);
        setQuery("");
        if (userText) setLastSubmittedQuery(String(userText));
        const url = `/api/public/chatbot/faqs/${id}${track ? "" : "?track=false"}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          throw new Error(extractApiError(data, "Failed to load question"));
        }

        setCurrent(data.data || null);
        sendEvent("question_click", {
          questionId: String(data?.data?.node?._id || id),
          questionTitle: String(data?.data?.node?.question || ""),
          depth: Number(data?.data?.breadcrumb?.length || 0),
        });
        if (pushHistory) {
          setHistory((prev) => {
            if (prev[prev.length - 1] === String(id)) return prev;
            return [...prev, String(id)];
          });
        }

        const answerText = htmlToText(data?.data?.node?.answerHtml || "");
        const responseNodeId = String(data?.data?.node?._id || id || "");
        streamText(answerText, "node", () => {
          setNodeResponseReadyId(responseNodeId);
        });
      } catch (err) {
        setTyping(false);
        setStreamingMode(null);
        setStreamedBotText("");
        setSearchError(err.message || "Failed to load");
      }
    },
    [cancelActiveStream, sendEvent, streamText],
  );

  const runSearch = useCallback(async () => {
    if (!settings?.enableSearch) return;
    const text = String(query || "").trim();
    if (!text) return;
    if (text.length < Number(settings.minSearchChars || 2)) {
      setSearchError(
        `Please type at least ${settings.minSearchChars || 2} characters.`,
      );
      setSearchResults([]);
      return;
    }

    try {
      cancelActiveStream();
      setSearching(true);
      setTyping(true);
      setStreamingMode("loading");
      setStreamedBotText("");
      setSearchError("");
      setCurrent(null);
      setNodeResponseReadyId(null);
      setLastSubmittedQuery(text);
      setBotReplyText("");
      setSearchResults([]);
      const params = new URLSearchParams({
        q: text,
        page: "1",
        limit: String(settings.maxSearchResults || 8),
      });
      const res = await fetch(
        `/api/public/chatbot/search?${params.toString()}`,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(extractApiError(data, "Search failed"));
      }
      const items = Array.isArray(data?.data?.items) ? data.data.items : [];
      const dedupedItems = dedupeQuestions(items);
      setQuery("");
      sendEvent("search_submit", { query: text, resultCount: items.length });
      const responseText =
        dedupedItems.length > 0
          ? `I found ${dedupedItems.length} related question${dedupedItems.length > 1 ? "s" : ""}. Please choose one below.`
          : "I could not find an exact answer. Please try another keyword or choose from suggested questions.";
      streamText(responseText, "search", () => {
        setBotReplyText(responseText);
        setSearchResults(dedupedItems);
      });
      if (items.length === 0) {
        sendEvent("search_no_result", { query: text });
        setSearchError("Didn't find your answer?");
      }
    } catch (err) {
      setTyping(false);
      setStreamingMode(null);
      setStreamedBotText("");
      setSearchResults([]);
      setBotReplyText("");
      setSearchError(err.message || "Search failed");
    } finally {
      setSearching(false);
    }
  }, [cancelActiveStream, query, sendEvent, settings, streamText]);

  const onBack = async () => {
    cancelActiveStream();
    if (history.length <= 1) {
      setCurrent(null);
      setHistory([]);
      setBotReplyText("");
      setLastSubmittedQuery("");
      return;
    }
    const next = history.slice(0, -1);
    setHistory(next);
    await openNode(next[next.length - 1], { track: false, pushHistory: false });
  };

  const onHome = () => {
    cancelActiveStream();
    setCurrent(null);
    setHistory([]);
    setSearchResults([]);
    setSearchError("");
    setBotReplyText("");
    setNodeResponseReadyId(null);
    setLastSubmittedQuery("");
    setQuery("");
  };

  const toggleOpen = () => {
    if (!open) {
      cancelActiveStream();
      setOpen(true);
      setOpenedAt(Date.now());
      sendEvent("chat_open");
      return;
    }
    cancelActiveStream();
    setOpen(false);
    setExpanded(false);
    const durationSeconds =
      openedAt > 0
        ? Math.max(0, Math.round((Date.now() - openedAt) / 1000))
        : 0;
    sendEvent("chat_close", {
      durationSeconds,
      lastNodeId: String(current?.node?._id || ""),
    });
  };

  const quickOptions = useMemo(() => {
    return dedupeQuestions([
      ...(featured || []),
      ...(popular || []),
      ...(roots || []),
    ]).slice(0, 8);
  }, [featured, popular, roots]);

  const activeActions = useMemo(() => {
    const actions = Array.isArray(settings?.contactActions)
      ? settings.contactActions
      : [];
    return actions
      .filter(
        (action) =>
          action && action.enabled !== false && action.label && action.url,
      )
      .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  }, [settings?.contactActions]);

  const contactOnlyActions = useMemo(() => {
    const filtered = activeActions.filter((action) => {
      const type = String(action?.actionType || "").toLowerCase();
      const label = String(action?.label || "").toLowerCase();
      return type === "contact" || label.includes("contact");
    });
    if (filtered.length > 0) return filtered;
    return activeActions.slice(0, 1);
  }, [activeActions]);

  const anchorGap = 16;
  const accentColor = settings?.themeColor || "#ff8a00";
  const chipBg = settings?.quickOptionButtonColor || "#ff8a00";
  const chipColor = settings?.quickOptionButtonTextColor || "#ffffff";

  if (loading || !settings || settings.enabled === false) return null;
  const currentNodeId = String(current?.node?._id || "");
  const isCurrentNodeResponseReady =
    Boolean(currentNodeId) && nodeResponseReadyId === currentNodeId;
  const nodeAnswerHtml = String(current?.node?.answerHtml || "");
  const hasNodeAnswer = hasRenderableHtml(nodeAnswerHtml);

  const collapsedWindowStyle = {
    top: "auto",
    left: "auto",
    right: anchorGap,
    bottom: anchorGap,
    width: "min(420px, calc(100vw - 32px))",
    height: "min(78vh, 620px)",
    maxHeight: "calc(100vh - 32px)",
    borderRadius: Math.max(12, Number(settings.borderRadius || 22)),
  };

  const expandedWindowStyle = {
    top: 12,
    right: 12,
    bottom: 12,
    left: 12,
    width: "auto",
    height: "auto",
    maxHeight: "none",
    borderRadius: 16,
  };

  const windowSizeStyle = expanded ? expandedWindowStyle : collapsedWindowStyle;

  const renderContactActions = (actions = contactOnlyActions) => {
    if (
      !settings.enableContactBlock ||
      !Array.isArray(actions) ||
      actions.length === 0
    )
      return null;
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 8, fontWeight: 600, color: "#555" }}>
          Need more info?
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {actions.map((action) => (
            <ContactAction
              key={action.id}
              href={action.url}
              label={action.label}
              target={action.target || "_self"}
              accentColor={accentColor}
              onClick={() => {
                const eventType =
                  action.actionType === "donation"
                    ? "donation_action_click"
                    : "contact_action_click";
                sendEvent(eventType, {
                  actionType: String(action.actionType || ""),
                  actionLabel: String(action.label || ""),
                  sourceNodeId: String(current?.node?._id || ""),
                });
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderChoiceChips = (items) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        marginTop: 12,
      }}
    >
      {(items || []).map((item) => (
        <div
          key={String(item._id)}
          style={{ display: "flex", justifyContent: "flex-end" }}
        >
          <button
            type="button"
            onClick={() => openNode(item._id, { userText: item.question })}
            style={{
              border: "none",
              borderRadius: 999,
              padding: "10px 16px",
              maxWidth: "90%",
              cursor: "pointer",
              background: chipBg,
              color: chipColor,
              fontWeight: 600,
              textAlign: "left",
              boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
            }}
          >
            {item.question}
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Open support chat"
        data-chatbot-launcher
        style={{
          position: "fixed",
          bottom: anchorGap,
          right: anchorGap,
          zIndex: 3000,
          width: 62,
          height: 62,
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.9)",
          background: accentColor,
          color: "#fff",
          cursor: "pointer",
          boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
          display: open ? "none" : "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MessageOutlined style={{ fontSize: 24 }} />
      </button>

      <div
        style={{
          position: "fixed",
          top: windowSizeStyle.top,
          right: windowSizeStyle.right,
          bottom: windowSizeStyle.bottom,
          left: windowSizeStyle.left,
          zIndex: 3000,
          width: windowSizeStyle.width,
          height: windowSizeStyle.height,
          maxHeight: windowSizeStyle.maxHeight,
          maxWidth: "calc(100vw - 32px)",
          background: settings.chatBackgroundColor || "#fff",
          border: `1px solid ${settings.borderColor || "#ececec"}`,
          borderRadius: windowSizeStyle.borderRadius,
          boxShadow: "0 14px 38px rgba(0,0,0,0.22)",
          display: open ? "flex" : "none",
          flexDirection: "column",
          overflow: "hidden",
          overscrollBehavior: "contain",
          fontSize: Number(settings.fontSize || 14),
          transition:
            "top 240ms ease, right 240ms ease, bottom 240ms ease, left 240ms ease, width 240ms ease, height 240ms ease, max-height 240ms ease, border-radius 220ms ease",
        }}
        data-chatbot-window
        data-chatbot-expanded={expanded ? "true" : "false"}
      >
        <div
          style={{
            padding: "12px 14px",
            borderBottom: `1px solid ${settings.borderColor || "#f0f0f0"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#fff",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
            }}
          >
            {settings.avatarMediaId ? (
              <img
                src={resolveMediaSrc(settings.avatarMediaId)}
                alt={settings.botName || "Bot"}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#ffa238,#ff7a00)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                }}
              >
                <MessageOutlined />
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 500,
                  fontSize: 16,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: "#111",
                }}
              >
                {settings.botName || "MESCO Help Desk"}
              </div>
              <div style={{ fontSize: 12, color: "#777" }}>Online</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              style={{
                border: "none",
                background: "transparent",
                color: "#888",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label={expanded ? "Restore chat size" : "Expand chat"}
              title={expanded ? "Restore" : "Expand"}
            >
              {expanded ? (
                <CompressOutlined style={{ fontSize: 14 }} />
              ) : (
                <ExpandOutlined style={{ fontSize: 14 }} />
              )}
            </button>
            <button
              type="button"
              onClick={toggleOpen}
              style={{
                border: "none",
                background: "transparent",
                color: "#888",
                cursor: "pointer",
              }}
              aria-label="Close chat"
            >
              <CloseOutlined style={{ fontSize: 16 }} />
            </button>
          </div>
        </div>

        <div
          ref={chatScrollRef}
          onWheel={handleWheelContain}
          onTouchStart={handleTouchStartContain}
          onTouchMove={handleTouchMoveContain}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px 14px 8px",
            background: "#fff",
            scrollBehavior: "smooth",
            overscrollBehaviorY: "contain",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y",
          }}
        >
          {settings.enableBreadcrumb && current?.breadcrumb?.length > 0 ? (
            <div style={{ fontSize: 12, marginBottom: 8, color: "#999" }}>
              {current.breadcrumb.map((item, index) => (
                <span key={String(item._id)}>
                  {index > 0 ? " / " : ""}
                  {item.question}
                </span>
              ))}
            </div>
          ) : null}

          {!typing && !current?.node && !!lastSubmittedQuery ? (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  background: settings.userMessageBubbleColor || chipBg,
                  color: settings.userMessageTextColor || chipColor,
                  borderRadius: 16,
                  padding: "10px 13px",
                  maxWidth: "92%",
                  lineHeight: 1.4,
                  boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
                }}
              >
                {lastSubmittedQuery}
              </div>
            </div>
          ) : null}

          {typing ? (
            <div
              style={{
                display: "inline-block",
                background: settings.botMessageBubbleColor || "#f7f7f7",
                color: settings.botMessageTextColor || "#202020",
                borderRadius: 16,
                padding: "10px 13px",
                border: `1px solid ${settings.borderColor || "#ededed"}`,
                maxWidth: "95%",
                whiteSpace: "pre-wrap",
              }}
            >
              {streamedBotText ? (
                streamedBotText
              ) : (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>
                    {streamingMode === "node" ? "Typing" : "Thinking"}
                  </span>
                  <span className="chatbot-typing-dots" aria-hidden>
                    <i />
                    <i />
                    <i />
                  </span>
                </span>
              )}
            </div>
          ) : null}

          {!typing &&
          !current?.node &&
          !searchResults.length &&
          !lastSubmittedQuery ? (
            <>
              <div
                style={{
                  display: "inline-block",
                  background: settings.botMessageBubbleColor || "#f7f7f7",
                  color: settings.botMessageTextColor || "#202020",
                  borderRadius: 16,
                  padding: "12px 14px",
                  border: `1px solid ${settings.borderColor || "#ededed"}`,
                  lineHeight: 1.5,
                  maxWidth: "95%",
                }}
              >
                <div style={{ fontWeight: 700 }}>{settings.welcomeMessage}</div>
                <div>{settings.welcomeSubtitle}</div>
              </div>
              {renderChoiceChips(quickOptions)}
            </>
          ) : null}

          {!typing && searchResults.length > 0 ? (
            <>
              <div
                style={{
                  display: "inline-block",
                  background: settings.botMessageBubbleColor || "#f7f7f7",
                  color: settings.botMessageTextColor || "#202020",
                  borderRadius: 16,
                  padding: "10px 13px",
                  border: `1px solid ${settings.borderColor || "#ededed"}`,
                  maxWidth: "95%",
                  whiteSpace: "pre-wrap",
                }}
              >
                {botReplyText || "Here are matching questions:"}
              </div>
              {renderChoiceChips(searchResults)}
            </>
          ) : null}

          {!typing && searching ? (
            <div
              style={{
                display: "inline-block",
                background: settings.botMessageBubbleColor || "#f7f7f7",
                color: settings.botMessageTextColor || "#202020",
                borderRadius: 16,
                padding: "10px 13px",
                border: `1px solid ${settings.borderColor || "#ededed"}`,
                maxWidth: "95%",
              }}
            >
              Thinking...
            </div>
          ) : null}

          {!typing && !searchResults.length && current?.node ? (
            <>
              {hasNodeAnswer && isCurrentNodeResponseReady ? (
                <div
                  style={{
                    display: "inline-block",
                    background: settings.botMessageBubbleColor || "#f7f7f7",
                    color: settings.botMessageTextColor || "#202020",
                    borderRadius: 16,
                    padding: "12px 14px",
                    border: `1px solid ${settings.borderColor || "#ededed"}`,
                    maxWidth: "95%",
                    lineHeight: 1.5,
                  }}
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(nodeAnswerHtml),
                  }}
                />
              ) : null}
              {isCurrentNodeResponseReady
                ? renderChoiceChips(dedupeQuestions(current.children || []))
                : null}
              {isCurrentNodeResponseReady && current?.node?.showNeedMoreInfo
                ? renderContactActions(contactOnlyActions)
                : null}
            </>
          ) : null}

          {!typing && searchError ? (
            <div style={{ marginTop: 12, color: "#cf1322", fontWeight: 500 }}>
              {searchError}
              {searchError.toLowerCase().includes("didn't find")
                ? renderContactActions(contactOnlyActions)
                : null}
            </div>
          ) : null}
        </div>

        <div
          style={{
            borderTop: `1px solid ${settings.borderColor || "#f0f0f0"}`,
            padding: "10px 12px",
          }}
        >
          {(settings.enableBackButton || settings.enableHomeButton) && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <button
                type="button"
                onClick={onBack}
                disabled={!current?.node}
                style={{
                  border: "none",
                  background: "transparent",
                  color: accentColor,
                  cursor: current?.node ? "pointer" : "default",
                  opacity: current?.node ? 1 : 0.45,
                  display: settings.enableBackButton ? "inline-flex" : "none",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 600,
                }}
              >
                <ArrowLeftOutlined />
                Back
              </button>
              <button
                type="button"
                onClick={onHome}
                style={{
                  border: "none",
                  background: "transparent",
                  color: accentColor,
                  cursor: "pointer",
                  display: settings.enableHomeButton ? "inline-flex" : "none",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 600,
                }}
              >
                <HomeOutlined />
                Home
              </button>
            </div>
          )}

          <div
            style={{
              border: `1px solid ${settings.borderColor || "#e8e8e8"}`,
              borderRadius: 18,
              padding: "8px 10px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  runSearch();
                }
              }}
              placeholder={
                settings.enableSearch
                  ? "Write your message..."
                  : "Search disabled"
              }
              disabled={!settings.enableSearch}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 14,
                color: "#222",
                background: "transparent",
              }}
            />
            <button
              type="button"
              onClick={runSearch}
              disabled={
                !settings.enableSearch ||
                searching ||
                !String(query || "").trim()
              }
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                border: "none",
                background:
                  !settings.enableSearch || !String(query || "").trim()
                    ? "#ececec"
                    : accentColor,
                color:
                  !settings.enableSearch || !String(query || "").trim()
                    ? "#a9a9a9"
                    : "#fff",
                cursor:
                  !settings.enableSearch || !String(query || "").trim()
                    ? "default"
                    : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowUpOutlined />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .public-site .chatbot-typing-dots {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .public-site .chatbot-typing-dots i {
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: currentColor;
          opacity: 0.35;
          transform: translateY(0);
          animation: chatbotTypingPulse 1s infinite ease-in-out;
          display: inline-block;
        }
        .public-site .chatbot-typing-dots i:nth-child(2) {
          animation-delay: 0.12s;
        }
        .public-site .chatbot-typing-dots i:nth-child(3) {
          animation-delay: 0.24s;
        }
        @keyframes chatbotTypingPulse {
          0%, 80%, 100% {
            opacity: 0.35;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
            transform: translateY(-2px);
          }
        }

        @media (max-width: 1024px) {
          .public-site [data-chatbot-window][data-chatbot-expanded="false"] {
            right: 16px !important;
            left: auto !important;
            bottom: 16px !important;
            width: min(430px, calc(100vw - 32px)) !important;
            height: min(74vh, calc(100vh - 96px)) !important;
            max-height: calc(100vh - 32px) !important;
          }
        }

        @media (max-width: 768px) {
          .public-site [data-chatbot-window][data-chatbot-expanded="false"] {
            top: auto !important;
            right: 16px !important;
            left: auto !important;
            bottom: 16px !important;
            width: calc(100vw - 32px) !important;
            height: min(72vh, calc(100vh - 96px)) !important;
            max-height: calc(100vh - 32px) !important;
            border-radius: 16px !important;
          }

          .public-site [data-chatbot-window][data-chatbot-expanded="true"] {
            top: 16px !important;
            right: 16px !important;
            bottom: 16px !important;
            left: 16px !important;
            width: auto !important;
            height: auto !important;
            max-height: none !important;
            border-radius: 12px !important;
          }

          .public-site [data-chatbot-launcher] {
            right: 16px !important;
            bottom: 16px !important;
          }
        }
      `}</style>
    </>
  );
}
