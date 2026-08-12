"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import styled, { keyframes } from "styled-components";
import {
  ArrowLeftOutlined,
  ArrowUpOutlined,
  CompressOutlined,
  CloseOutlined,
  ExpandOutlined,
  HomeOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { usePageReadyTask } from "@/lib/pageReadiness";

const chatbotTypingPulse = keyframes`
  0%, 80%, 100% {
    opacity: 0.35;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-2px);
  }
`;

const ChatbotWidgetRoot = styled.div`
  @media (max-width: 1024px) {
    [data-chatbot-window][data-chatbot-expanded="false"] {
      right: 16px !important;
      left: auto !important;
      bottom: 16px !important;
      width: min(430px, calc(100vw - 32px)) !important;
      height: min(74vh, calc(100vh - 96px)) !important;
      max-height: calc(100vh - 32px) !important;
    }

    [data-chatbot-window][data-chatbot-expanded="false"][data-chatbot-position="left"] {
      left: 16px !important;
      right: auto !important;
    }
  }

  @media (max-width: 768px) {
    [data-chatbot-window][data-chatbot-expanded="false"] {
      top: auto !important;
      right: 16px !important;
      left: auto !important;
      bottom: 16px !important;
      width: calc(100vw - 32px) !important;
      height: min(72vh, calc(100vh - 96px)) !important;
      max-height: calc(100vh - 32px) !important;
      border-radius: 16px !important;
    }

    [data-chatbot-window][data-chatbot-expanded="false"][data-chatbot-position="left"] {
      left: 16px !important;
      right: auto !important;
    }

    [data-chatbot-window][data-chatbot-expanded="true"] {
      top: 16px !important;
      right: 16px !important;
      bottom: 16px !important;
      left: 16px !important;
      width: auto !important;
      height: auto !important;
      max-height: none !important;
      border-radius: 12px !important;
    }

    [data-chatbot-launcher] {
      right: 16px !important;
      bottom: 16px !important;
    }

    [data-chatbot-launcher][data-chatbot-position="left"] {
      left: 16px !important;
      right: auto !important;
    }
  }
`;

const TypingStatus = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const TypingDots = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const TypingDot = styled.i`
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.35;
  transform: translateY(0);
  animation: ${chatbotTypingPulse} 1s infinite ease-in-out;
  display: inline-block;

  &:nth-child(2) {
    animation-delay: 0.12s;
  }

  &:nth-child(3) {
    animation-delay: 0.24s;
  }
`;

const ContactActionLink = styled.a`
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 11px;
  border-radius: 999px;
  border: 1px solid ${(p) => p.$accentColor || "#1677ff"};
  color: ${(p) => p.$accentColor || "#1677ff"};
  font-weight: 600;
  font-size: 12px;
  transition: filter 140ms ease, transform 120ms ease;

  &:hover {
    filter: brightness(0.92);
  }

  &:active {
    transform: translateY(1px);
  }
`;

const HeaderBar = styled.div`
  padding: ${(p) => p.$padding || "12px 14px"};
  border-bottom: 1px solid ${(p) => p.$borderColor || "#f0f0f0"};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${(p) => p.$headerColor || "#1677ff"};
  gap: ${(p) => `${p.$gap || 10}px`};
`;

const HeaderTitle = styled.div`
  font-weight: 500;
  font-size: 16px;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${(p) => p.$headerTextColor || "#fff"};
`;

const HeaderStatus = styled.div`
  font-size: 12px;
  color: ${(p) => p.$headerSubTextColor || "rgba(255,255,255,0.8)"};
`;

const HeaderActionButton = styled.button`
  border: none;
  background: transparent;
  color: ${(p) => p.$headerTextColor || "#fff"};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 8px;
  transition: background-color 120ms ease, opacity 120ms ease;

  &:hover {
    background: ${(p) =>
      p.$headerTextColor === "#111111"
        ? "rgba(17,17,17,0.08)"
        : "rgba(255,255,255,0.14)"};
  }

  &:active {
    opacity: 0.85;
  }
`;

const ChatBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${(p) =>
    `${p.$contentPadding || 14}px ${p.$contentPadding || 14}px ${
      p.$contentPaddingBottom || 8
    }px`};
  background: ${(p) => p.$chatBackgroundColor || "#fff"};
  scroll-behavior: smooth;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.28) transparent;

  &::-webkit-scrollbar {
    width: 2px;
    height: 2px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.28);
    border-radius: 999px;
  }

  &:hover::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.42);
  }
`;

const WelcomeBannerImage = styled.img`
  width: 100%;
  max-height: 140px;
  object-fit: cover;
  object-position: center;
  border-radius: 12px;
  border: 1px solid ${(p) => p.$borderColor || "#ededed"};
  margin-bottom: 10px;
  display: block;
`;

const BotMessageBubble = styled.div`
  display: inline-block;
  background: ${(p) => p.$bg || "#f7f7f7"};
  color: ${(p) => p.$text || "#202020"};
  border-radius: 16px;
  padding: ${(p) => p.$padding || "10px 13px"};
  border: 1px solid ${(p) => p.$borderColor || "#ededed"};
  box-shadow: ${(p) => p.$bubbleShadow || "none"};
  max-width: 95%;
  white-space: ${(p) => p.$whiteSpace || "normal"};
  line-height: ${(p) => p.$lineHeight || "normal"};

  a {
    color: ${(p) => p.$accentColor || "#1677ff"};
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  a:hover {
    filter: brightness(0.9);
  }
`;

const UserMessageBubble = styled.div`
  display: inline-block;
  background: ${(p) => p.$bg || "#1677ff"};
  color: ${(p) => p.$text || "#ffffff"};
  border: 1px solid ${(p) => p.$borderColor || "rgba(0,0,0,0.08)"};
  border-radius: 16px;
  padding: 10px 13px;
  max-width: 92%;
  line-height: 1.4;
  box-shadow: ${(p) => p.$bubbleShadow || "0 3px 10px rgba(0, 0, 0, 0.08)"};
`;

const ChoiceChipButton = styled.button`
  border: 1.5px solid ${(p) => p.$tone || "#3d5afe"};
  border-radius: 999px;
  padding: 7.5px 14px;
  max-width: 100%;
  cursor: pointer;
  background: ${(p) => p.$bg || "#ffffff"};
  color: ${(p) => p.$text || p.$tone || "#3d5afe"};
  font-weight: 600;
  font-size: ${(p) => `${p.$fontSize || 12}px`};
  text-align: center;
  line-height: 1.25;
  box-shadow: ${(p) => p.$chipShadow || "none"};
  transition: filter 140ms ease, transform 120ms ease;

  &:hover {
    filter: brightness(0.94);
  }

  &:active {
    transform: translateY(1px);
  }
`;

const NavActionButton = styled.button`
  border: none;
  background: transparent;
  color: ${(p) => p.$accentColor || "#1677ff"};
  cursor: ${(p) => (p.$disabled ? "default" : "pointer")};
  opacity: ${(p) => (p.$disabled ? 0.45 : 1)};
  display: ${(p) => (p.$visible ? "inline-flex" : "none")};
  align-items: center;
  gap: 6px;
  font-weight: 600;
  border-radius: 8px;
  padding: 2px 4px;
  transition: filter 140ms ease, transform 120ms ease;

  &:hover {
    filter: ${(p) => (p.$disabled ? "none" : "brightness(0.92)")};
  }

  &:active {
    transform: ${(p) => (p.$disabled ? "none" : "translateY(1px)")};
  }
`;

const ComposerWrap = styled.div`
  border: 1px solid ${(p) => p.$borderColor || "#e8e8e8"};
  border-radius: 18px;
  padding: ${(p) => `${p.$paddingY || 8}px ${p.$paddingX || 10}px`};
  display: flex;
  align-items: center;
  gap: ${(p) => `${p.$gap || 8}px`};
  background: ${(p) => p.$chatBackgroundColor || "#fff"};
`;

const ComposerInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: ${(p) => p.$textColor || "#222"};
  background: transparent;

  &::placeholder {
    color: ${(p) => p.$placeholderColor || "rgba(34,34,34,0.55)"};
  }
`;

const SendButton = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: ${(p) => (p.$disabled ? "#ececec" : p.$accentColor || "#1677ff")};
  color: ${(p) => (p.$disabled ? "#a9a9a9" : p.$textColor || "#fff")};
  cursor: ${(p) => (p.$disabled ? "default" : "pointer")};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: filter 140ms ease, transform 120ms ease;

  &:hover {
    filter: ${(p) => (p.$disabled ? "none" : "brightness(0.94)")};
  }

  &:active {
    transform: ${(p) => (p.$disabled ? "none" : "translateY(1px)")};
  }
`;

const LauncherButton = styled.button`
  position: fixed;
  bottom: ${(p) => p.$anchorGap || 16}px;
  right: ${(p) => (p.$position === "left" ? "auto" : `${p.$anchorGap || 16}px`)};
  left: ${(p) => (p.$position === "left" ? `${p.$anchorGap || 16}px` : "auto")};
  z-index: 3000;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.9);
  background: ${(p) => p.$accentColor || "#1677ff"};
  color: ${(p) => p.$iconColor || "#fff"};
  cursor: pointer;
  box-shadow: ${(p) => p.$launcherShadow || "0 10px 26px rgba(0, 0, 0, 0.25)"};
  display: ${(p) => (p.$hidden ? "none" : "inline-flex")};
  align-items: center;
  justify-content: center;
  transition: filter 140ms ease, transform 120ms ease;

  &:hover {
    filter: brightness(0.94);
  }

  &:active {
    transform: translateY(1px);
  }
`;

function parseHexColor(value) {
  const raw = String(value || "").trim().toLowerCase();
  const short = raw.match(/^#([0-9a-f]{3})$/i);
  if (short) {
    const chars = short[1];
    return `#${chars[0]}${chars[0]}${chars[1]}${chars[1]}${chars[2]}${chars[2]}`;
  }
  if (/^#([0-9a-f]{6})$/i.test(raw)) return raw;
  return "";
}

function getReadableTextColor(background, lightColor = "#ffffff", darkColor = "#111111") {
  const hex = parseHexColor(background);
  if (!hex) return darkColor;
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.62 ? darkColor : lightColor;
}

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

const CHATBOT_SESSION_STORAGE_KEY = "mesco_chatbot_session_id";

function getOrCreateSessionId() {
  if (typeof window === "undefined") return `chat-${Date.now()}`;
  try {
    const existing = window.localStorage.getItem(CHATBOT_SESSION_STORAGE_KEY);
    if (existing && /^[a-zA-Z0-9-]{8,128}$/.test(existing)) return existing;
    const created =
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(CHATBOT_SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function setStoredSessionId(sessionId) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CHATBOT_SESSION_STORAGE_KEY,
      String(sessionId || "").trim(),
    );
  } catch {
    // ignore storage failures
  }
}

function createClientMessageId() {
  if (
    typeof window !== "undefined" &&
    typeof window.crypto?.randomUUID === "function"
  ) {
    return window.crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildMessage(role, content, extra = {}) {
  return {
    messageId: createClientMessageId(),
    role,
    content: String(content || "").trim(),
    contentHtml: String(extra.contentHtml || "").trim(),
    messageType: String(extra.messageType || "faq"),
    metadata:
      extra.metadata && typeof extra.metadata === "object" ? extra.metadata : {},
  };
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
    <ContactActionLink
      href={href}
      target={target || "_self"}
      rel={target === "_blank" ? "noreferrer" : undefined}
      onClick={onClick}
      $accentColor={accentColor}
    >
      {label}
    </ContactActionLink>
  );
}

export default function ChatbotWidget() {
  const [sessionId, setSessionId] = useState(() => getOrCreateSessionId());

  const [loading, setLoading] = useState(true);
  usePageReadyTask(loading, "chatbot");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [openedAt, setOpenedAt] = useState(0);
  const [settings, setSettings] = useState(null);
  const [roots, setRoots] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [popular, setPopular] = useState([]);
  const [messages, setMessages] = useState([]);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [typing, setTyping] = useState(false);
  const [streamedBotText, setStreamedBotText] = useState("");
  const [streamingMode, setStreamingMode] = useState(null);
  const [nodeResponseReadyId, setNodeResponseReadyId] = useState(null);
  const chatScrollRef = useRef(null);
  const touchStartYRef = useRef(0);
  const activeStreamRef = useRef({ runId: 0, timer: null });
  const messagesRef = useRef([]);
  const historyLoadedRef = useRef(false);

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

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const persistMessages = useCallback(
    async (newMessages) => {
      if (!Array.isArray(newMessages) || newMessages.length === 0) return;
      const totalCount = messagesRef.current.length;
      const baseIndex = Math.max(0, totalCount - newMessages.length);
      const payload = newMessages.map((item, index) => ({
        ...item,
        orderIndex:
          item?.orderIndex != null && Number.isFinite(Number(item.orderIndex))
            ? Number(item.orderIndex)
            : baseIndex + index,
      }));

      try {
        const res = await fetch(
          `/api/public/chatbot/conversations/${encodeURIComponent(sessionId)}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: payload }),
          },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          throw new Error(
            extractApiError(data, "Failed to save conversation history"),
          );
        }
      } catch (err) {
        setHistoryError(err.message || "Failed to save conversation history");
      }
    },
    [sessionId],
  );

  const appendLocalMessages = useCallback((newMessages) => {
    if (!Array.isArray(newMessages) || newMessages.length === 0) return;
    setMessages((prev) => {
      const existingIds = new Set(prev.map((item) => String(item.messageId)));
      const deduped = newMessages.filter(
        (item) => item?.messageId && !existingIds.has(String(item.messageId)),
      );
      if (!deduped.length) return prev;
      return [...prev, ...deduped];
    });
  }, []);

  const loadNodeContext = useCallback(async (id, { track = true } = {}) => {
    if (!id) return null;
    const url = `/api/public/chatbot/faqs/${id}${track ? "" : "?track=false"}`;
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      throw new Error(extractApiError(data, "Failed to load question"));
    }
    setCurrent(data.data || null);
    setNodeResponseReadyId(String(data?.data?.node?._id || id || ""));
    return data.data || null;
  }, []);

  const restoreContextFromMessages = useCallback(
    async (loadedMessages) => {
      const items = Array.isArray(loadedMessages) ? loadedMessages : [];
      const lastBot = [...items].reverse().find((item) => item?.role === "bot");
      if (!lastBot) {
        setCurrent(null);
        setHistory([]);
        setSearchResults([]);
        setNodeResponseReadyId(null);
        return;
      }

      const meta = lastBot.metadata || {};
      if (Array.isArray(meta.searchResults) && meta.searchResults.length > 0) {
        setSearchResults(meta.searchResults);
        setCurrent(null);
        setHistory([]);
        setNodeResponseReadyId(null);
        return;
      }

      if (meta.questionId) {
        if (Array.isArray(meta.faqHistory)) {
          setHistory(meta.faqHistory.map((item) => String(item)));
        }
        try {
          await loadNodeContext(String(meta.questionId), { track: false });
        } catch {
          setCurrent(null);
          setNodeResponseReadyId(null);
        }
        return;
      }

      setCurrent(null);
      setHistory([]);
      setSearchResults([]);
      setNodeResponseReadyId(null);
    },
    [loadNodeContext],
  );

  const loadConversationHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const entryPage =
        typeof window !== "undefined" ? window.location.pathname : "";
      const params = new URLSearchParams({ sessionId, entryPage });
      const res = await fetch(
        `/api/public/chatbot/conversations?${params.toString()}`,
        { cache: "no-store" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(
          extractApiError(data, "Failed to load conversation history"),
        );
      }
      const loaded = Array.isArray(data?.data?.messages) ? data.data.messages : [];
      setMessages(loaded);
      await restoreContextFromMessages(loaded);
      historyLoadedRef.current = true;
    } catch (err) {
      setHistoryError(err.message || "Failed to load conversation history");
    } finally {
      setHistoryLoading(false);
    }
  }, [restoreContextFromMessages, sessionId]);

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

  const refreshSettings = useCallback(async () => {
    try {
      const settingsRes = await fetch("/api/public/chatbot/settings", {
        cache: "no-store",
      });
      const settingsData = await settingsRes.json().catch(() => ({}));
      if (!settingsRes.ok || !settingsData?.success) return;
      setSettings(settingsData.data || null);
    } catch {
      // best effort live refresh
    }
  }, []);

  const loadBootstrap = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, rootsRes, featuredRes, popularRes] =
        await Promise.all([
          fetch("/api/public/chatbot/settings", { cache: "no-store" }),
          fetch("/api/public/chatbot/faqs/root", { cache: "no-store" }),
          fetch("/api/public/chatbot/featured", { cache: "no-store" }),
          fetch("/api/public/chatbot/popular", { cache: "no-store" }),
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
    loadConversationHistory();
  }, [loadBootstrap, loadConversationHistory]);

  useEffect(() => {
    if (!open) return;
    refreshSettings();
    const timer = setInterval(() => {
      refreshSettings();
    }, 15000);
    return () => clearInterval(timer);
  }, [open, refreshSettings]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onSettingsUpdated = () => {
      refreshSettings();
    };
    const onStorage = (event) => {
      if (event.key !== "chatbotSettingsUpdatedAt") return;
      refreshSettings();
    };
    window.addEventListener("chatbot-settings-updated", onSettingsUpdated);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("chatbot-settings-updated", onSettingsUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [refreshSettings]);

  useEffect(() => {
    if (!open) return;
    scrollToBottom("auto");
  }, [
    open,
    current,
    searchResults,
    searchError,
    streamedBotText,
    messages,
    nodeResponseReadyId,
    historyLoading,
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
        setQuery("");

        const url = `/api/public/chatbot/faqs/${id}${track ? "" : "?track=false"}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          throw new Error(extractApiError(data, "Failed to load question"));
        }

        const resolvedUserText = String(
          userText || data?.data?.node?.question || "",
        ).trim();

        const nextHistory = pushHistory
          ? history[history.length - 1] === String(id)
            ? history
            : [...history, String(id)]
          : history;
        if (pushHistory) setHistory(nextHistory);

        const userMessage = resolvedUserText
          ? buildMessage("user", resolvedUserText, {
              messageType: "faq",
              metadata: { questionId: String(id) },
            })
          : null;
        if (userMessage) {
          appendLocalMessages([userMessage]);
        }

        setCurrent(data.data || null);
        sendEvent("question_click", {
          questionId: String(data?.data?.node?._id || id),
          questionTitle: String(data?.data?.node?.question || ""),
          depth: Number(data?.data?.breadcrumb?.length || 0),
        });

        const answerText = htmlToText(data?.data?.node?.answerHtml || "");
        const responseNodeId = String(data?.data?.node?._id || id || "");
        const answerHtml = String(data?.data?.node?.answerHtml || "");
        streamText(answerText, "node", async () => {
          setNodeResponseReadyId(responseNodeId);
          const botMessage = buildMessage("bot", answerText, {
            contentHtml: answerHtml,
            messageType: "faq",
            metadata: {
              questionId: responseNodeId,
              breadcrumb: data?.data?.breadcrumb || [],
              children: data?.data?.children || [],
              showNeedMoreInfo: Boolean(data?.data?.node?.showNeedMoreInfo),
              faqHistory: nextHistory,
            },
          });
          appendLocalMessages([botMessage]);
          const toPersist = [userMessage, botMessage].filter(Boolean);
          await persistMessages(toPersist);
        });
      } catch (err) {
        setTyping(false);
        setStreamingMode(null);
        setStreamedBotText("");
        setSearchError(err.message || "Failed to load");
      }
    },
    [
      appendLocalMessages,
      cancelActiveStream,
      history,
      persistMessages,
      sendEvent,
      streamText,
    ],
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
      setSearchResults([]);

      const userMessage = buildMessage("user", text, {
        messageType: "search",
        metadata: { searchQuery: text },
      });
      appendLocalMessages([userMessage]);

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
          : settings?.enableRelatedQuestions === false
            ? "I could not find an exact answer. Please use the Need more info option below."
            : "I could not find an exact answer. Please try another keyword or choose from suggested questions.";
      streamText(responseText, "search", async () => {
        const botMessage = buildMessage("bot", responseText, {
          messageType: "search",
          metadata: {
            searchQuery: text,
            searchResults: dedupedItems,
          },
        });
        appendLocalMessages([botMessage]);
        setSearchResults(dedupedItems);
        await persistMessages([userMessage, botMessage]);
      });
      if (items.length === 0) {
        sendEvent("search_no_result", { query: text });
        setSearchError("");
      }
    } catch (err) {
      setTyping(false);
      setStreamingMode(null);
      setStreamedBotText("");
      setSearchResults([]);
      setSearchError(err.message || "Search failed");
    } finally {
      setSearching(false);
    }
  }, [
    appendLocalMessages,
    cancelActiveStream,
    persistMessages,
    query,
    sendEvent,
    settings,
    streamText,
  ]);

  const onBack = async () => {
    cancelActiveStream();
    if (history.length <= 1) {
      setCurrent(null);
      setHistory([]);
      setSearchResults([]);
      setNodeResponseReadyId(null);
      return;
    }
    const next = history.slice(0, -1);
    setHistory(next);
    try {
      await loadNodeContext(next[next.length - 1], { track: false });
    } catch (err) {
      setSearchError(err.message || "Failed to go back");
    }
  };

  const onHome = async () => {
    cancelActiveStream();
    try {
      const entryPage =
        typeof window !== "undefined" ? window.location.pathname : "";
      const res = await fetch("/api/public/chatbot/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "new", entryPage }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success && data?.data?.conversation?.sessionId) {
        const newSessionId = String(data.data.conversation.sessionId);
        setStoredSessionId(newSessionId);
        historyLoadedRef.current = true;
        setSessionId(newSessionId);
      }
    } catch {
      // keep local reset even if API fails
    }
    setMessages([]);
    setCurrent(null);
    setHistory([]);
    setSearchResults([]);
    setSearchError("");
    setNodeResponseReadyId(null);
    setQuery("");
    setHistoryError("");
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

  const fallbackNeedMoreInfoActions = useMemo(
    () => [
      {
        id: "default-contact-page",
        actionType: "contact",
        label: "Contact Us",
        url: "/contact",
        target: "_self",
      },
    ],
    [],
  );

  const anchorGap = 16;
  const position = settings?.position === "left" ? "left" : "right";
  const accentColor =
    settings?.linkAccentColor || settings?.themeColor || "#1677ff";
  const headerColor = settings?.headerColor || accentColor;
  const headerTextColor = getReadableTextColor(headerColor);
  const headerSubTextColor =
    headerTextColor === "#111111"
      ? "rgba(17,17,17,0.72)"
      : "rgba(255,255,255,0.82)";
  const borderColor = settings?.borderColor || "#e8e8e8";
  const chatBackgroundColor = settings?.chatBackgroundColor || "#ffffff";
  const botBubbleBg = settings?.botMessageBubbleColor || "#f7f7f7";
  const botBubbleText =
    settings?.botMessageTextColor || getReadableTextColor(botBubbleBg, "#ffffff", "#202020");
  const userBubbleBg =
    settings?.userMessageBubbleColor || settings?.quickOptionButtonColor || accentColor;
  const userBubbleText =
    settings?.userMessageTextColor ||
    settings?.quickOptionButtonTextColor ||
    getReadableTextColor(userBubbleBg, "#ffffff", "#111111");
  const rawChipTone = settings?.quickOptionButtonColor || accentColor;
  const chipBg = chatBackgroundColor || "#ffffff";
  const normalizedChipTone = parseHexColor(rawChipTone);
  const normalizedChipBg = parseHexColor(chipBg);
  const chipTone =
    normalizedChipTone &&
    normalizedChipBg &&
    normalizedChipTone === normalizedChipBg
      ? accentColor || borderColor
      : rawChipTone;
  const chipColor = settings?.quickOptionButtonTextColor || chipTone;
  const chipFontSize = Math.max(10, Number(settings?.fontSize || 14) - 2);
  const showRelatedQuestions = settings?.enableRelatedQuestions !== false;
  const welcomeBannerSrc = resolveMediaSrc(settings?.welcomeBannerMediaId);
  const desiredWidth = Math.max(320, Number(settings?.width || 420));
  const desiredHeight = Math.max(420, Number(settings?.height || 620));
  const contentPadding = Math.max(8, Number(settings?.contentPadding || 14));
  const footerPadding = Math.max(8, Number(settings?.footerPadding || 10));
  const elementGap = Math.max(4, Number(settings?.elementGap || 8));
  const launcherShadow = String(settings?.launcherShadow || "0 10px 26px rgba(0,0,0,0.25)");
  const windowShadow = String(settings?.windowShadow || "0 14px 38px rgba(0,0,0,0.22)");
  const bubbleShadow = String(settings?.bubbleShadow || "0 3px 10px rgba(0,0,0,0.08)");
  const chipShadow = String(settings?.chipShadow || "none");
  const launcherIconColor = "#ffffff";
  const sendButtonTextColor = "#ffffff";

  const lastBotMessage = useMemo(() => {
    return [...messages].reverse().find((item) => item?.role === "bot") || null;
  }, [messages]);

  if (loading || !settings || settings.enabled === false) return null;

  const currentNodeId = String(current?.node?._id || "");
  const isCurrentNodeResponseReady =
    Boolean(currentNodeId) && nodeResponseReadyId === currentNodeId;

  const showWelcomeScreen =
    !historyLoading &&
    messages.length === 0 &&
    !typing &&
    !searching &&
    !current?.node &&
    !searchResults.length;

  const showActiveContext =
    !historyLoading &&
    !typing &&
    !searching &&
    (Boolean(current?.node) || searchResults.length > 0);

  const renderTranscriptMessage = (message) => {
    if (!message) return null;
    if (message.role === "user") {
      return (
        <div
          key={String(message.messageId)}
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: elementGap + 2,
          }}
        >
          <UserMessageBubble
            $bg={userBubbleBg}
            $text={userBubbleText}
            $borderColor={borderColor}
            $bubbleShadow={bubbleShadow}
          >
            {message.content}
          </UserMessageBubble>
        </div>
      );
    }

    const html = String(message.contentHtml || "").trim();
    const hasHtml = hasRenderableHtml(html);
    return (
      <div
        key={String(message.messageId)}
        style={{ marginBottom: elementGap + 2 }}
      >
        <BotMessageBubble
          $bg={botBubbleBg}
          $text={botBubbleText}
          $borderColor={borderColor}
          $accentColor={accentColor}
          $bubbleShadow={bubbleShadow}
          $padding={hasHtml ? "12px 14px" : "10px 13px"}
          $lineHeight={hasHtml ? "1.5" : "normal"}
          $whiteSpace={hasHtml ? "normal" : "pre-wrap"}
          {...(hasHtml
            ? {
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML: {
                  __html: DOMPurify.sanitize(html),
                },
              }
            : { children: message.content })}
        />
      </div>
    );
  };

  const collapsedWindowStyle = {
    top: "auto",
    left: position === "left" ? anchorGap : "auto",
    right: position === "left" ? "auto" : anchorGap,
    bottom: anchorGap,
    width: `min(${desiredWidth}px, calc(100vw - 32px))`,
    height: `min(78vh, ${desiredHeight}px)`,
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
    if (!settings.enableContactBlock) return null;
    const resolvedActions =
      Array.isArray(actions) && actions.length > 0
        ? actions
        : fallbackNeedMoreInfoActions;

    return (
      <div style={{ marginTop: contentPadding - 2 }}>
        <div style={{ marginBottom: elementGap, fontWeight: 600, color: botBubbleText }}>
          Need more info?
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: elementGap }}>
          {resolvedActions.map((action) => (
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
        flexWrap: "wrap",
        gap: elementGap + 2,
        marginTop: contentPadding - 2,
        marginBottom: Math.max(4, Math.round((contentPadding - 2) * 0.75)),
      }}
    >
      {(items || []).map((item) => (
        <ChoiceChipButton
          key={String(item._id)}
          type="button"
          onClick={() => openNode(item._id, { userText: item.question })}
          $bg={chipBg}
          $text={chipColor}
          $tone={chipTone}
          $chipShadow={chipShadow}
          $fontSize={chipFontSize}
        >
          {item.question}
        </ChoiceChipButton>
      ))}
    </div>
  );

  return (
    <ChatbotWidgetRoot>
      <LauncherButton
        type="button"
        onClick={toggleOpen}
        aria-label="Open support chat"
        data-chatbot-launcher
        data-chatbot-position={position}
        $anchorGap={anchorGap}
        $position={position}
        $accentColor={accentColor}
        $launcherShadow={launcherShadow}
        $iconColor={launcherIconColor}
        $hidden={open}
      >
        <MessageOutlined style={{ fontSize: 24 }} />
      </LauncherButton>

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
          background: chatBackgroundColor,
          border: `1px solid ${borderColor}`,
          borderRadius: windowSizeStyle.borderRadius,
          boxShadow: windowShadow,
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
        data-chatbot-position={position}
      >
        <HeaderBar
          $headerColor={headerColor}
          $borderColor={borderColor}
          $gap={elementGap + 2}
          $padding={`${Math.max(10, contentPadding - 2)}px ${contentPadding}px`}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: elementGap + 2,
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
                  border: `1px solid ${borderColor}`,
                  objectFit: "contain",
                  objectPosition: "center",
                  background: "#fff",
                  padding: 2,
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: accentColor,
                  color: getReadableTextColor(accentColor),
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
              <HeaderTitle $headerTextColor={headerTextColor}>
                {settings.botName || "MESCO Help Desk"}
              </HeaderTitle>
              <HeaderStatus $headerSubTextColor={headerSubTextColor}>
                Online
              </HeaderStatus>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: elementGap }}>
            <HeaderActionButton
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              $headerTextColor={headerTextColor}
              aria-label={expanded ? "Restore chat size" : "Expand chat"}
              title={expanded ? "Restore" : "Expand"}
            >
              {expanded ? (
                <CompressOutlined style={{ fontSize: 14 }} />
              ) : (
                <ExpandOutlined style={{ fontSize: 14 }} />
              )}
            </HeaderActionButton>
            <HeaderActionButton
              type="button"
              onClick={toggleOpen}
              $headerTextColor={headerTextColor}
              aria-label="Close chat"
            >
              <CloseOutlined style={{ fontSize: 16 }} />
            </HeaderActionButton>
          </div>
        </HeaderBar>

        <ChatBody
          ref={chatScrollRef}
          onWheel={handleWheelContain}
          onTouchStart={handleTouchStartContain}
          onTouchMove={handleTouchMoveContain}
          $chatBackgroundColor={chatBackgroundColor}
          $contentPadding={contentPadding}
          $contentPaddingBottom={Math.max(8, contentPadding - 6)}
        >
          {settings.enableBreadcrumb && current?.breadcrumb?.length > 0 ? (
            <div style={{ fontSize: 12, marginBottom: elementGap, color: botBubbleText }}>
              {current.breadcrumb.map((item, index) => (
                <span key={String(item._id)}>
                  {index > 0 ? " / " : ""}
                  {item.question}
                </span>
              ))}
            </div>
          ) : null}

          {historyLoading ? (
            <BotMessageBubble
              $bg={botBubbleBg}
              $text={botBubbleText}
              $borderColor={borderColor}
              $accentColor={accentColor}
              $bubbleShadow={bubbleShadow}
            >
              Loading conversation...
            </BotMessageBubble>
          ) : null}

          {!historyLoading && historyError ? (
            <div
              style={{
                marginBottom: elementGap,
                color: "#cf1322",
                fontWeight: 500,
                fontSize: 12,
              }}
            >
              {historyError}
            </div>
          ) : null}

          {!historyLoading ? messages.map(renderTranscriptMessage) : null}

          {typing ? (
            <BotMessageBubble
              $bg={botBubbleBg}
              $text={botBubbleText}
              $borderColor={borderColor}
              $accentColor={accentColor}
              $bubbleShadow={bubbleShadow}
              $whiteSpace="pre-wrap"
            >
              {streamedBotText ? (
                streamedBotText
              ) : (
                <TypingStatus>
                  <span>
                    {streamingMode === "node" ? "Typing" : "Thinking"}
                  </span>
                  <TypingDots aria-hidden>
                    <TypingDot />
                    <TypingDot />
                    <TypingDot />
                  </TypingDots>
                </TypingStatus>
              )}
            </BotMessageBubble>
          ) : null}

          {showWelcomeScreen ? (
            <>
              {welcomeBannerSrc ? (
                <WelcomeBannerImage
                  src={welcomeBannerSrc}
                  alt={`${settings.botName || "Chatbot"} welcome banner`}
                  $borderColor={borderColor}
                />
              ) : null}
              <BotMessageBubble
                $bg={botBubbleBg}
                $text={botBubbleText}
                $borderColor={borderColor}
                $accentColor={accentColor}
                $bubbleShadow={bubbleShadow}
                $padding="12px 14px"
                $lineHeight="1.5"
              >
                <div style={{ fontWeight: 700 }}>{settings.welcomeMessage}</div>
                <div>{settings.welcomeSubtitle}</div>
              </BotMessageBubble>
              {showRelatedQuestions ? renderChoiceChips(quickOptions) : null}
            </>
          ) : null}

          {!historyLoading &&
          !typing &&
          messages.length > 0 &&
          !current?.node &&
          !searchResults.length ? (
            showRelatedQuestions ? renderChoiceChips(quickOptions) : null
          ) : null}

          {showActiveContext && searchResults.length > 0
            ? showRelatedQuestions
              ? renderChoiceChips(searchResults)
              : null
            : null}

          {!typing && searching ? (
            <BotMessageBubble
              $bg={botBubbleBg}
              $text={botBubbleText}
              $borderColor={borderColor}
              $accentColor={accentColor}
              $bubbleShadow={bubbleShadow}
            >
              Thinking...
            </BotMessageBubble>
          ) : null}

          {showActiveContext && !searchResults.length && current?.node ? (
            <>
              {showRelatedQuestions && isCurrentNodeResponseReady
                ? renderChoiceChips(dedupeQuestions(current.children || []))
                : null}
              {isCurrentNodeResponseReady && current?.node?.showNeedMoreInfo
                ? renderContactActions(contactOnlyActions)
                : null}
            </>
          ) : null}

          {!typing && searchError ? (
            <div style={{ marginTop: contentPadding - 2, color: "#cf1322", fontWeight: 500 }}>
              {searchError}
            </div>
          ) : null}

          {!typing &&
          !searching &&
          !current?.node &&
          !searchResults.length &&
          !searchError &&
          messages.length > 0 &&
          lastBotMessage?.messageType === "search" &&
          (!Array.isArray(lastBotMessage?.metadata?.searchResults) ||
            lastBotMessage.metadata.searchResults.length === 0)
            ? renderContactActions(contactOnlyActions)
            : null}
        </ChatBody>

        <div
          style={{
            borderTop: `1px solid ${borderColor}`,
            padding: `${footerPadding}px ${Math.max(10, footerPadding + 2)}px`,
            background: chatBackgroundColor,
          }}
        >
          {(settings.enableBackButton || settings.enableHomeButton) && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: elementGap,
              }}
            >
              <NavActionButton
                type="button"
                onClick={onBack}
                disabled={!current?.node}
                $accentColor={accentColor}
                $disabled={!current?.node}
                $visible={settings.enableBackButton}
              >
                <ArrowLeftOutlined />
                Back
              </NavActionButton>
              <NavActionButton
                type="button"
                onClick={onHome}
                $accentColor={accentColor}
                $visible={settings.enableHomeButton}
              >
                <HomeOutlined />
                Home
              </NavActionButton>
            </div>
          )}

          <ComposerWrap
            $borderColor={borderColor}
            $chatBackgroundColor={chatBackgroundColor}
            $paddingY={Math.max(6, footerPadding - 2)}
            $paddingX={Math.max(8, footerPadding)}
            $gap={elementGap}
          >
            <ComposerInput
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
              $textColor={botBubbleText}
              $placeholderColor={botBubbleText}
            />
            <SendButton
              type="button"
              onClick={runSearch}
              $disabled={
                !settings.enableSearch ||
                searching ||
                !String(query || "").trim()
              }
              disabled={
                !settings.enableSearch ||
                searching ||
                !String(query || "").trim()
              }
              $accentColor={accentColor}
              $textColor={sendButtonTextColor}
            >
              <ArrowUpOutlined />
            </SendButton>
          </ComposerWrap>
        </div>
      </div>

    </ChatbotWidgetRoot>
  );
}
