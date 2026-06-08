/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CloseOutlined,
  CompressOutlined,
  ExpandOutlined,
  MessageOutlined,
} from "@ant-design/icons";

const OPEN_STATE_KEY = "faq_chatbot_open";
const EXPANDED_STATE_KEY = "faq_chatbot_expanded";
const SEARCH_DEBOUNCE_MS = 300;

function makeId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

function getNowIso() {
  return new Date().toISOString();
}

function toSafeConfig(input) {
  const source = input && typeof input === "object" ? input : {};
  return {
    enabled: source.enabled === true,
    headerTitle: String(source.headerTitle || "FAQ Assistant").trim() || "FAQ Assistant",
    welcomeMessage:
      String(source.welcomeMessage || "Hi! How can I help you today?").trim() ||
      "Hi! How can I help you today?",
    noResultsFoundMessage:
      String(
        source.noResultsFoundMessage ||
          "Sorry, I couldn't find an answer to your question.",
      ).trim() || "Sorry, I couldn't find an answer to your question.",
    avatar: {
      mediaId: String(source?.avatar?.mediaId || "").trim(),
      url: String(source?.avatar?.url || "").trim(),
    },
    colors: {
      launcherGradientStart:
        String(source?.colors?.launcherGradientStart || "#13567a").trim() || "#13567a",
      launcherGradientEnd:
        String(source?.colors?.launcherGradientEnd || "#1d9b78").trim() || "#1d9b78",
      headerGradientStart:
        String(source?.colors?.headerGradientStart || "#0f4f74").trim() || "#0f4f74",
      headerGradientEnd:
        String(source?.colors?.headerGradientEnd || "#157f67").trim() || "#157f67",
      userBubbleBackground:
        String(source?.colors?.userBubbleBackground || "#125679").trim() || "#125679",
      userBubbleText:
        String(source?.colors?.userBubbleText || "#ffffff").trim() || "#ffffff",
      botBubbleBackground:
        String(source?.colors?.botBubbleBackground || "#ffffff").trim() || "#ffffff",
      botBubbleText:
        String(source?.colors?.botBubbleText || "#132430").trim() || "#132430",
      chipBackground:
        String(source?.colors?.chipBackground || "#ffffff").trim() || "#ffffff",
      chipText: String(source?.colors?.chipText || "#1b3a4e").trim() || "#1b3a4e",
    },
    position:
      String(source.position || "").trim() === "bottom-left" ? "bottom-left" : "bottom-right",
    showTimestamps: source.showTimestamps !== false,
    timestampFormat: String(source.timestampFormat || "").trim() === "24h" ? "24h" : "12h",
    timestampLocale: String(source.timestampLocale || "en-US").trim() || "en-US",
    timestampTimezoneStrategy:
      String(source.timestampTimezoneStrategy || "").trim() === "fixed-timezone"
        ? "fixed-timezone"
        : "client-local",
    fixedTimezone: String(source.fixedTimezone || "").trim(),
    showTypingState: source.showTypingState !== false,
    typingMinMs: clampNumber(source.typingMinMs, 0, 15000, 600),
    typingMaxMs: clampNumber(source.typingMaxMs, 0, 30000, 2500),
    treeVersion: Math.max(1, Number(source.treeVersion) || 1),
  };
}

function formatMessageTime(messageIso, config) {
  if (!config?.showTimestamps || !messageIso) return "";
  try {
    const date = new Date(messageIso);
    const use24h = config.timestampFormat === "24h";
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: !use24h,
    };
    if (
      config.timestampTimezoneStrategy === "fixed-timezone" &&
      config.fixedTimezone
    ) {
      options.timeZone = config.fixedTimezone;
    }
    return new Intl.DateTimeFormat(config.timestampLocale || "en-US", options).format(date);
  } catch {
    return "";
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Request failed: ${response.status}`);
  }
  return data;
}

export default function FAQChatbotWidget() {
  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentOptions, setCurrentOptions] = useState([]);
  const [historyStack, setHistoryStack] = useState([]);
  const [currentNodeId, setCurrentNodeId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchInput, setDebouncedSearchInput] = useState("");
  const [searchState, setSearchState] = useState({
    loading: false,
    query: "",
    results: [],
    noResultsFoundMessage: "",
  });
  const [lastNoResultQuery, setLastNoResultQuery] = useState("");
  const bodyRef = useRef(null);
  const messagesRef = useRef(messages);
  const optionsRef = useRef(currentOptions);
  const currentNodeRef = useRef(currentNodeId);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    optionsRef.current = currentOptions;
  }, [currentOptions]);

  useEffect(() => {
    currentNodeRef.current = currentNodeId;
  }, [currentNodeId]);

  useEffect(() => {
    let alive = true;
    setConfigLoading(true);
    fetchJson("/api/public/faq-chatbot/config")
      .then((data) => {
        if (!alive) return;
        setConfig(toSafeConfig(data));
      })
      .catch(() => {
        if (!alive) return;
        setConfig(toSafeConfig(null));
      })
      .finally(() => {
        if (!alive) return;
        setConfigLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedOpen = window.sessionStorage.getItem(OPEN_STATE_KEY) === "1";
    const savedExpanded = window.sessionStorage.getItem(EXPANDED_STATE_KEY) === "1";
    setOpen(savedOpen);
    setExpanded(savedOpen && savedExpanded);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(OPEN_STATE_KEY, open ? "1" : "0");
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(EXPANDED_STATE_KEY, open && expanded ? "1" : "0");
  }, [open, expanded]);

  const appendMessage = useCallback((nextMessage) => {
    setMessages((prev) => [...prev, nextMessage]);
  }, []);

  const initializeConversation = useCallback(async () => {
    if (!config) return;
    const welcomeTimestamp = getNowIso();
    const baseMessages = [
      {
        id: makeId(),
        role: "bot",
        text: config.welcomeMessage,
        createdAtIso: welcomeTimestamp,
      },
    ];
    setMessages(baseMessages);
    setCurrentNodeId("");
    setHistoryStack([]);
    setSearchInput("");
    setDebouncedSearchInput("");
    setSearchState({
      loading: false,
      query: "",
      results: [],
      noResultsFoundMessage: "",
    });
    setLastNoResultQuery("");

    try {
      const data = await fetchJson("/api/public/faq-chatbot/root-options");
      setCurrentOptions(Array.isArray(data?.options) ? data.options : []);
    } catch {
      setCurrentOptions([]);
    }
    setInitialized(true);
  }, [config]);

  useEffect(() => {
    if (!open || !config?.enabled || initialized) return;
    initializeConversation();
  }, [config?.enabled, initializeConversation, initialized, open]);

  useEffect(() => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, currentOptions, searchState]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchInput(searchInput);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const runWithTypingState = useCallback(
    async (runner) => {
      const typingEnabled = config?.showTypingState !== false;
      const minMs = clampNumber(config?.typingMinMs, 0, 15000, 600);
      const maxMs = Math.max(minMs, clampNumber(config?.typingMaxMs, 0, 30000, 2500));
      const createdAtIso = getNowIso();
      const typingId = makeId();

      if (!typingEnabled) {
        const result = await runner();
        return { result, createdAtIso };
      }

      setMessages((prev) => [
        ...prev,
        { id: typingId, role: "typing", text: "", createdAtIso },
      ]);
      const startedAt = Date.now();
      let timeoutId = null;
      const timeoutPromise = new Promise((resolve) => {
        timeoutId = window.setTimeout(() => resolve({ timedOut: true }), maxMs);
      });

      try {
        const race = await Promise.race([
          runner()
            .then((result) => ({ timedOut: false, result }))
            .catch((error) => ({ timedOut: false, error })),
          timeoutPromise,
        ]);

        if (race.timedOut) {
          setMessages((prev) => [
            ...prev.filter((item) => item.id !== typingId),
            {
              id: makeId(),
              role: "bot",
              text: "Sorry, this is taking longer than expected. Please try again.",
              createdAtIso,
            },
          ]);
          return { result: null, createdAtIso, timedOut: true };
        }

        const elapsed = Date.now() - startedAt;
        if (elapsed < minMs) {
          await new Promise((resolve) => window.setTimeout(resolve, minMs - elapsed));
        }

        setMessages((prev) => prev.filter((item) => item.id !== typingId));
        if (race.error) throw race.error;
        return { result: race.result, createdAtIso };
      } finally {
        if (timeoutId) window.clearTimeout(timeoutId);
      }
    },
    [config?.showTypingState, config?.typingMaxMs, config?.typingMinMs],
  );

  const navigateToNode = useCallback(
    async ({ questionNodeId, questionText, fromSearch = false }) => {
      if (!questionNodeId || processing) return;
      setProcessing(true);
      appendMessage({
        id: makeId(),
        role: "user",
        text: String(questionText || "Selected question").trim(),
        createdAtIso: getNowIso(),
      });

      const snapshot = {
        messages: [...messagesRef.current],
        options: [...optionsRef.current],
        currentNodeId: currentNodeRef.current,
      };
      setHistoryStack((prev) => [...prev, snapshot]);

      try {
        const typingResult = await runWithTypingState(() =>
          fetchJson(`/api/public/faq-chatbot/node/${encodeURIComponent(questionNodeId)}`),
        );
        if (typingResult?.timedOut) return;
        const payload = typingResult?.result || {};
        const botTimestamp = typingResult?.createdAtIso || getNowIso();

        const answers = Array.isArray(payload?.terminalAnswers) ? payload.terminalAnswers : [];
        const nextQuestions = Array.isArray(payload?.childQuestions) ? payload.childQuestions : [];

        if (answers.length === 0 && nextQuestions.length === 0) {
          appendMessage({
            id: makeId(),
            role: "bot",
            text: config?.noResultsFoundMessage || "No response available.",
            createdAtIso: botTimestamp,
          });
        } else {
          for (const answer of answers) {
            appendMessage({
              id: makeId(),
              role: "bot",
              text: String(answer?.answerText || "").trim(),
              createdAtIso: botTimestamp,
            });
          }
        }

        setCurrentNodeId(String(questionNodeId));
        setCurrentOptions(nextQuestions);
        if (fromSearch) {
          setSearchInput("");
          setDebouncedSearchInput("");
          setSearchState({
            loading: false,
            query: "",
            results: [],
            noResultsFoundMessage: "",
          });
        }
      } catch {
        appendMessage({
          id: makeId(),
          role: "bot",
          text: "Sorry, I couldn't load this response right now.",
          createdAtIso: getNowIso(),
        });
      } finally {
        setProcessing(false);
      }
    },
    [appendMessage, config?.noResultsFoundMessage, processing, runWithTypingState],
  );

  const restartConversation = useCallback(async () => {
    setProcessing(false);
    await initializeConversation();
  }, [initializeConversation]);

  const goBack = useCallback(() => {
    setHistoryStack((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const snapshot = copy.pop();
      if (snapshot) {
        setMessages(snapshot.messages);
        setCurrentOptions(snapshot.options);
        setCurrentNodeId(snapshot.currentNodeId || "");
      }
      return copy;
    });
  }, []);

  const fetchAllSearchResults = useCallback(async (query) => {
    const safeQuery = String(query || "").trim();
    if (safeQuery.length < 2) {
      return { results: [], noResultsFoundMessage: "" };
    }

    let page = 1;
    const pageSize = 20;
    let totalPages = 1;
    let noResultsFoundMessage = "";
    const allResults = [];

    while (page <= totalPages) {
      const params = new URLSearchParams();
      params.set("q", safeQuery);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const payload = await fetchJson(`/api/public/faq-chatbot/search?${params.toString()}`);
      const pageResults = Array.isArray(payload?.results) ? payload.results : [];
      allResults.push(...pageResults);
      noResultsFoundMessage = String(payload?.noResultsFoundMessage || "").trim();
      totalPages = Math.max(1, Number(payload?.pagination?.totalPages) || 1);
      page += 1;
    }

    return { results: allResults, noResultsFoundMessage };
  }, []);

  useEffect(() => {
    const query = String(debouncedSearchInput || "").trim();
    if (!config?.enabled) return;
    if (query.length < 2) {
      setSearchState({
        loading: false,
        query: "",
        results: [],
        noResultsFoundMessage: "",
      });
      return;
    }

    let alive = true;
    setSearchState((prev) => ({
      ...prev,
      loading: true,
      query,
      results: [],
      noResultsFoundMessage: "",
    }));
    fetchAllSearchResults(query)
      .then((data) => {
        if (!alive) return;
        setSearchState({
          loading: false,
          query,
          results: data.results,
          noResultsFoundMessage: data.noResultsFoundMessage,
        });
      })
      .catch(() => {
        if (!alive) return;
        setSearchState({
          loading: false,
          query,
          results: [],
          noResultsFoundMessage: "Search is unavailable right now.",
        });
      });

    return () => {
      alive = false;
    };
  }, [config?.enabled, debouncedSearchInput, fetchAllSearchResults]);

  useEffect(() => {
    const query = String(searchState.query || "").trim().toLowerCase();
    if (!query || searchState.loading) return;
    if ((searchState.results || []).length > 0) return;
    if (!searchState.noResultsFoundMessage) return;
    if (lastNoResultQuery === query) return;

    appendMessage({
      id: makeId(),
      role: "bot",
      text: searchState.noResultsFoundMessage,
      createdAtIso: getNowIso(),
    });
    setLastNoResultQuery(query);
  }, [
    appendMessage,
    lastNoResultQuery,
    searchState.loading,
    searchState.noResultsFoundMessage,
    searchState.query,
    searchState.results,
  ]);

  const panelPositionClass =
    config?.position === "bottom-left" ? "faq-chatbot-left" : "faq-chatbot-right";
  const isMobileViewport =
    typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false;
  const showExpanded = expanded && !isMobileViewport;
  const themeVars = useMemo(
    () => ({
      "--faq-launcher-gradient-start": config?.colors?.launcherGradientStart || "#13567a",
      "--faq-launcher-gradient-end": config?.colors?.launcherGradientEnd || "#1d9b78",
      "--faq-header-gradient-start": config?.colors?.headerGradientStart || "#0f4f74",
      "--faq-header-gradient-end": config?.colors?.headerGradientEnd || "#157f67",
      "--faq-user-bubble-bg": config?.colors?.userBubbleBackground || "#125679",
      "--faq-user-bubble-text": config?.colors?.userBubbleText || "#ffffff",
      "--faq-bot-bubble-bg": config?.colors?.botBubbleBackground || "#ffffff",
      "--faq-bot-bubble-text": config?.colors?.botBubbleText || "#132430",
      "--faq-chip-bg": config?.colors?.chipBackground || "#ffffff",
      "--faq-chip-text": config?.colors?.chipText || "#1b3a4e",
    }),
    [config?.colors],
  );

  const headerStatusText = useMemo(() => {
    if (processing) return "Thinking...";
    return "Online";
  }, [processing]);

  if (configLoading || !config?.enabled) return null;

  return (
    <>
      <div className={`faq-chatbot-root ${panelPositionClass}`} style={themeVars}>
        {!open ? (
          <button
            type="button"
            className="faq-chatbot-launcher"
            aria-label="Open FAQ Chatbot"
            onClick={async () => {
              setOpen(true);
              setExpanded(false);
              if (!initialized) {
                await initializeConversation();
              }
            }}
          >
            <span className="faq-chatbot-launcher-icon">
              <MessageOutlined />
            </span>
          </button>
        ) : (
          <div
            className={`faq-chatbot-panel ${showExpanded ? "expanded" : ""}`}
            role="dialog"
            aria-label={config.headerTitle}
          >
            <div className="faq-chatbot-header">
              <div className="faq-chatbot-header-left">
                {config?.avatar?.url ? (
                  <img
                    src={config.avatar.url}
                    alt={config.headerTitle}
                    className="faq-chatbot-avatar"
                  />
                ) : (
                  <span className="faq-chatbot-avatar-fallback">
                    {String(config.headerTitle || "F").trim().charAt(0).toUpperCase() || "F"}
                  </span>
                )}
                <div className="faq-chatbot-header-meta">
                  <div className="faq-chatbot-header-title">{config.headerTitle}</div>
                  <div className="faq-chatbot-header-status">{headerStatusText}</div>
                </div>
              </div>
              <div className="faq-chatbot-header-actions">
                <button
                  type="button"
                  className="faq-chatbot-icon-btn"
                  aria-label={showExpanded ? "Collapse" : "Expand"}
                  onClick={() => setExpanded((prev) => !prev)}
                >
                  {showExpanded ? <CompressOutlined /> : <ExpandOutlined />}
                </button>
                <button
                  type="button"
                  className="faq-chatbot-icon-btn"
                  aria-label="Close"
                  onClick={() => {
                    setOpen(false);
                    setExpanded(false);
                  }}
                >
                  <CloseOutlined />
                </button>
              </div>
            </div>

            <div className="faq-chatbot-body" ref={bodyRef}>
              {messages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <div
                    key={message.id}
                    className={`faq-chatbot-message-row ${isUser ? "user" : "bot"}`}
                  >
                    <div
                      className={`faq-chatbot-message ${message.role === "typing" ? "typing" : ""}`}
                    >
                      {message.role === "typing" ? (
                        <span className="faq-chatbot-typing-dots">
                          <i />
                          <i />
                          <i />
                        </span>
                      ) : (
                        <span>{message.text}</span>
                      )}
                    </div>
                    {message.role !== "typing" ? (
                      <div className="faq-chatbot-message-time">
                        {formatMessageTime(message.createdAtIso, config)}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {currentOptions.length > 0 ? (
                <div className="faq-chatbot-options">
                  {currentOptions.map((item) => (
                    <button
                      key={item.nodeId}
                      type="button"
                      disabled={processing}
                      className="faq-chatbot-chip"
                      onClick={() =>
                        navigateToNode({
                          questionNodeId: item.nodeId,
                          questionText: item.questionText,
                        })
                      }
                    >
                      {item.questionText}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="faq-chatbot-footer">
              <div className="faq-chatbot-nav-actions">
                <button
                  type="button"
                  className="faq-chatbot-mini-btn"
                  onClick={goBack}
                  disabled={historyStack.length === 0}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="faq-chatbot-mini-btn"
                  onClick={restartConversation}
                  disabled={processing}
                >
                  Restart
                </button>
              </div>
              <input
                className="faq-chatbot-search-input"
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search questions..."
                aria-label="Search questions"
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  if (searchState.results.length > 0) {
                    const first = searchState.results[0];
                    navigateToNode({
                      questionNodeId: first.questionNodeId,
                      questionText: first.questionText,
                      fromSearch: true,
                    });
                  } else if (
                    searchState.query &&
                    searchState.noResultsFoundMessage &&
                    lastNoResultQuery !== searchState.query.toLowerCase()
                  ) {
                    appendMessage({
                      id: makeId(),
                      role: "bot",
                      text: searchState.noResultsFoundMessage,
                      createdAtIso: getNowIso(),
                    });
                    setLastNoResultQuery(searchState.query.toLowerCase());
                  }
                }}
              />

              {searchState.query ? (
                <div className="faq-chatbot-search-results">
                  {searchState.loading ? (
                    <div className="faq-chatbot-search-empty">Searching...</div>
                  ) : searchState.results.length > 0 ? (
                    searchState.results.map((result) => (
                      <button
                        key={`${result.questionNodeId}_${result.score}`}
                        type="button"
                        className="faq-chatbot-search-item"
                        onClick={() =>
                          navigateToNode({
                            questionNodeId: result.questionNodeId,
                            questionText: result.questionText,
                            fromSearch: true,
                          })
                        }
                      >
                        <span className="faq-chatbot-search-title">{result.questionText}</span>
                        <span className="faq-chatbot-search-path">{result.pathText}</span>
                      </button>
                    ))
                  ) : (
                    <div className="faq-chatbot-search-empty">
                      {searchState.noResultsFoundMessage || "No matching questions found."}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .faq-chatbot-root {
          position: fixed;
          bottom: 16px;
          z-index: 1200;
        }
        .faq-chatbot-right {
          right: 16px;
        }
        .faq-chatbot-left {
          left: 16px;
        }
        .faq-chatbot-launcher {
          width: 56px;
          height: 56px;
          border-radius: 999px;
          border: 0;
          cursor: pointer;
          font-size: 22px;
          background: linear-gradient(
            135deg,
            var(--faq-launcher-gradient-start, #13567a) 0%,
            var(--faq-launcher-gradient-end, #1d9b78) 100%
          );
          color: #ffffff;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.24);
        }
        .faq-chatbot-launcher-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        .faq-chatbot-panel {
          width: min(390px, calc(100vw - 24px));
          height: min(650px, calc(100vh - 24px));
          display: flex;
          flex-direction: column;
          border-radius: 14px;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #dce4ea;
          box-shadow: 0 18px 48px rgba(6, 28, 44, 0.24);
        }
        .faq-chatbot-panel.expanded {
          width: min(740px, calc(100vw - 24px));
          height: min(820px, calc(100vh - 24px));
        }
        .faq-chatbot-header {
          padding: 10px 12px;
          background: linear-gradient(
            135deg,
            var(--faq-header-gradient-start, #0f4f74) 0%,
            var(--faq-header-gradient-end, #157f67) 100%
          );
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .faq-chatbot-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .faq-chatbot-avatar {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          object-fit: cover;
          border: 1px solid rgba(255, 255, 255, 0.55);
        }
        .faq-chatbot-avatar-fallback {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.24);
          border: 1px solid rgba(255, 255, 255, 0.55);
          font-weight: 700;
        }
        .faq-chatbot-header-meta {
          min-width: 0;
        }
        .faq-chatbot-header-title {
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .faq-chatbot-header-status {
          font-size: 11px;
          opacity: 0.95;
        }
        .faq-chatbot-header-actions {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .faq-chatbot-icon-btn {
          width: 28px;
          height: 28px;
          border: 0;
          border-radius: 6px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.18);
          color: #ffffff;
          font-size: 14px;
          line-height: 1;
        }
        .faq-chatbot-body {
          flex: 1;
          overflow-y: auto;
          background: linear-gradient(180deg, #f7fafc 0%, #edf4f8 100%);
          padding: 12px;
        }
        .faq-chatbot-message-row {
          margin-bottom: 10px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .faq-chatbot-message-row.user {
          align-items: flex-end;
        }
        .faq-chatbot-message {
          max-width: 88%;
          border-radius: 12px;
          padding: 9px 11px;
          font-size: 13px;
          line-height: 1.45;
          background: var(--faq-bot-bubble-bg, #ffffff);
          border: 1px solid #dce5ec;
          color: var(--faq-bot-bubble-text, #132430);
          white-space: pre-wrap;
        }
        .faq-chatbot-message-row.user .faq-chatbot-message {
          background: var(--faq-user-bubble-bg, #125679);
          color: var(--faq-user-bubble-text, #ffffff);
          border-color: var(--faq-user-bubble-bg, #125679);
        }
        .faq-chatbot-message.typing {
          min-width: 56px;
          display: inline-flex;
          justify-content: center;
        }
        .faq-chatbot-typing-dots {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .faq-chatbot-typing-dots i {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #3c5668;
          animation: faqTyping 1s ease-in-out infinite;
        }
        .faq-chatbot-typing-dots i:nth-child(2) {
          animation-delay: 0.15s;
        }
        .faq-chatbot-typing-dots i:nth-child(3) {
          animation-delay: 0.3s;
        }
        @keyframes faqTyping {
          0%,
          80%,
          100% {
            transform: translateY(0);
            opacity: 0.35;
          }
          40% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }
        .faq-chatbot-message-time {
          margin-top: 4px;
          font-size: 10px;
          color: #617484;
        }
        .faq-chatbot-options {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 2px;
        }
        .faq-chatbot-chip {
          border-radius: 999px;
          border: 1px solid #b7c8d4;
          background: var(--faq-chip-bg, #ffffff);
          color: var(--faq-chip-text, #1b3a4e);
          padding: 6px 11px;
          font-size: 12px;
          cursor: pointer;
        }
        .faq-chatbot-chip:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .faq-chatbot-footer {
          border-top: 1px solid #dce4ea;
          background: #ffffff;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .faq-chatbot-nav-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .faq-chatbot-mini-btn {
          border: 1px solid #c9d6df;
          background: #f8fbfd;
          color: #25445a;
          border-radius: 8px;
          padding: 4px 9px;
          cursor: pointer;
          font-size: 12px;
        }
        .faq-chatbot-mini-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .faq-chatbot-search-input {
          width: 100%;
          border: 1px solid #cbd8e1;
          border-radius: 9px;
          padding: 8px 10px;
          font-size: 13px;
          outline: none;
        }
        .faq-chatbot-search-input:focus {
          border-color: #1e6f95;
          box-shadow: 0 0 0 2px rgba(30, 111, 149, 0.15);
        }
        .faq-chatbot-search-results {
          max-height: 160px;
          overflow-y: auto;
          border: 1px solid #dce5ec;
          border-radius: 9px;
          background: #fbfdff;
        }
        .faq-chatbot-search-item {
          width: 100%;
          text-align: left;
          border: 0;
          border-bottom: 1px solid #e5edf2;
          background: #fbfdff;
          padding: 8px 10px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .faq-chatbot-search-item:last-child {
          border-bottom: 0;
        }
        .faq-chatbot-search-title {
          font-size: 12px;
          color: #123147;
          font-weight: 600;
        }
        .faq-chatbot-search-path {
          font-size: 11px;
          color: #657d8d;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .faq-chatbot-search-empty {
          font-size: 12px;
          color: #586f7f;
          padding: 9px 10px;
        }
        @media (max-width: 768px) {
          .faq-chatbot-root {
            right: 8px !important;
            left: 8px !important;
            bottom: 8px;
          }
          .faq-chatbot-panel,
          .faq-chatbot-panel.expanded {
            width: 100%;
            height: min(76vh, 620px);
          }
        }
      `}</style>
    </>
  );
}
