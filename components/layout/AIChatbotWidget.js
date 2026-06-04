"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const CONFIG_REFRESH_POLL_MS = 5000;
const STORAGE_REFRESH_KEY = "chatbot_config_updated_at";
const SESSION_AUTO_OPEN_KEY = "chatbot_auto_opened";
const SESSION_ID_KEY = "chatbot_session_id";

function toSafeString(value) {
  return value == null ? "" : String(value).trim();
}

function normalizePathname(pathname = "/") {
  let route = toSafeString(pathname);
  if (!route) route = "/";
  if (!route.startsWith("/")) route = `/${route}`;
  const qIdx = route.indexOf("?");
  if (qIdx >= 0) route = route.slice(0, qIdx);
  const hIdx = route.indexOf("#");
  if (hIdx >= 0) route = route.slice(0, hIdx);
  if (route.length > 1 && route.endsWith("/")) route = route.slice(0, -1);
  return route;
}

function createClientSessionId() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(SESSION_ID_KEY);
  if (existing) return existing;
  const newId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(SESSION_ID_KEY, newId);
  return newId;
}

function getLocale() {
  if (typeof document === "undefined") return "";
  return toSafeString(document.documentElement?.lang || "");
}

export default function AIChatbotWidget() {
  const pathname = usePathname() || "/";
  const router = useRouter();

  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [runtimeQuickActions, setRuntimeQuickActions] = useState([]);
  const [runtimeEscalation, setRuntimeEscalation] = useState(null);
  const [showInlineEscalation, setShowInlineEscalation] = useState(false);
  const [escalationForm, setEscalationForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submittingEscalation, setSubmittingEscalation] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const initializedRef = useRef(false);
  const messagesEndRef = useRef(null);

  const loadConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch("/api/public/ai-chatbot/config", { cache: "no-store" });
      const data = res.ok ? await res.json() : {};
      setConfig(data || null);
      setRuntimeQuickActions(Array.isArray(data?.quickActions) ? data.quickActions : []);

      const welcome = toSafeString(data?.welcomeMessage);
      if (!initializedRef.current) {
        initializedRef.current = true;
        if (welcome) {
          setMessages([
            {
              id: "welcome",
              role: "bot",
              text: welcome,
              source: "system",
            },
          ]);
        }
        const defaultState = toSafeString(data?.visibilityBehavior?.defaultState);
        setOpen(defaultState === "open");
      } else if (welcome) {
        setMessages((prev) =>
          prev.length
            ? prev
            : [{ id: "welcome", role: "bot", text: welcome, source: "system" }],
        );
      }
    } catch {
      setConfig(null);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig, pathname]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const poll = window.setInterval(loadConfig, CONFIG_REFRESH_POLL_MS);
    const onFocus = () => loadConfig();
    const onVisibility = () => {
      if (document.visibilityState === "visible") loadConfig();
    };
    const onStorage = (event) => {
      if (event.key === STORAGE_REFRESH_KEY) loadConfig();
    };
    const onSameTab = () => loadConfig();

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    window.addEventListener("chatbot-config-updated", onSameTab);

    return () => {
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("chatbot-config-updated", onSameTab);
    };
  }, [loadConfig]);

  const currentPath = normalizePathname(pathname || "/");

  const shouldRender = useMemo(() => {
    if (!config?.enabled) return false;
    if (isMobile && config?.visibilityBehavior?.enabledOnMobile === false) return false;
    if (!isMobile && config?.visibilityBehavior?.enabledOnDesktop === false) return false;
    const includeRoutes = Array.isArray(config?.visibilityBehavior?.includeRoutes)
      ? config.visibilityBehavior.includeRoutes
      : [];
    if (!includeRoutes.length) return true;
    return includeRoutes.includes(currentPath);
  }, [config, currentPath, isMobile]);

  useEffect(() => {
    if (!shouldRender) {
      setOpen(false);
      return;
    }
    if (!config?.visibilityBehavior?.autoOpenEnabled) return;

    const once = config?.visibilityBehavior?.autoOpenOncePerSession !== false;
    if (once && window.sessionStorage.getItem(SESSION_AUTO_OPEN_KEY) === "1") return;
    const delayMs = Number(config?.visibilityBehavior?.autoOpenDelayMs) || 0;
    const timer = window.setTimeout(() => {
      setOpen(true);
      if (once) {
        window.sessionStorage.setItem(SESSION_AUTO_OPEN_KEY, "1");
      }
    }, Math.max(0, Math.min(15000, delayMs)));

    return () => window.clearTimeout(timer);
  }, [config, shouldRender]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, sending, open]);

  const addMessage = useCallback((role, text, meta = {}) => {
    const safeText = toSafeString(text);
    if (!safeText) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `${role}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        role,
        text: safeText,
        source: meta.source || "",
      },
    ]);
  }, []);

  const sendMessage = useCallback(
    async (rawMessage) => {
      const messageText = toSafeString(rawMessage);
      if (!messageText || sending) return;

      addMessage("user", messageText);
      setInput("");
      setSending(true);

      try {
        const sessionId = createClientSessionId();
        const res = await fetch("/api/public/chatbot/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageText,
            sessionId,
            page: currentPath,
            locale: getLocale(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Message request failed");
        }
        addMessage("bot", data?.reply || config?.messages?.errorMessage, {
          source: data?.source || "",
        });
        setRuntimeEscalation(data?.escalation || null);
        if (Array.isArray(data?.quickActions)) {
          setRuntimeQuickActions(data.quickActions);
        }
      } catch {
        addMessage("bot", config?.messages?.errorMessage || "");
      } finally {
        setSending(false);
      }
    },
    [addMessage, config?.messages?.errorMessage, currentPath, sending],
  );

  const executeQuickAction = useCallback(
    (action) => {
      if (!action || sending) return;
      const type = toSafeString(action.actionType).toLowerCase();
      const value = toSafeString(action.value);
      if (type === "message") {
        sendMessage(value || action.label);
        return;
      }
      if (type === "route") {
        if (value.startsWith("/")) router.push(value);
        return;
      }
      if (type === "url") {
        if (!value) return;
        if (value.startsWith("/")) {
          router.push(value);
        } else {
          window.open(value, "_blank", "noopener,noreferrer");
        }
        return;
      }
      if (type === "contact") {
        const mode = toSafeString(
          runtimeEscalation?.mode || config?.escalation?.mode || "both",
        );
        if (mode === "redirect_contact") {
          router.push(runtimeEscalation?.contactRoute || config?.escalation?.contactRoute || "/contact");
          return;
        }
        setShowInlineEscalation(true);
      }
    },
    [
      config?.escalation?.contactRoute,
      config?.escalation?.mode,
      router,
      runtimeEscalation?.contactRoute,
      runtimeEscalation?.mode,
      sendMessage,
      sending,
    ],
  );

  const submitEscalation = useCallback(async () => {
    const name = toSafeString(escalationForm.name);
    const email = toSafeString(escalationForm.email);
    const messageText = toSafeString(escalationForm.message);
    if (!name || !email || !messageText) return;

    setSubmittingEscalation(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message: messageText,
          page: currentPath,
          source: "chatbot-widget",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Escalation submission failed");

      addMessage("bot", config?.messages?.escalationSuccessMessage || "");
      setShowInlineEscalation(false);
      setEscalationForm({ name: "", email: "", message: "" });
    } catch {
      addMessage("bot", config?.messages?.escalationErrorMessage || "");
    } finally {
      setSubmittingEscalation(false);
    }
  }, [addMessage, config?.messages?.escalationErrorMessage, config?.messages?.escalationSuccessMessage, currentPath, escalationForm.email, escalationForm.message, escalationForm.name]);

  const effectiveEscalation = runtimeEscalation || config?.escalation || null;
  const quickActions = runtimeQuickActions || [];
  const faqSuggestions = Array.isArray(config?.faqs) ? config.faqs.slice(0, 4) : [];

  if (loadingConfig || !shouldRender) return null;

  const position = config?.position === "bottom-left" ? "left" : "right";
  const launcherStyle =
    position === "left"
      ? { left: 18, right: "auto" }
      : { right: 18, left: "auto" };
  const panelStyle =
    position === "left"
      ? { left: 18, right: "auto" }
      : { right: 18, left: "auto" };

  return (
    <>
      <button
        type="button"
        aria-label={config?.messages?.openButtonAriaLabel || ""}
        className={`chatbot-launcher ${open ? "hidden" : ""}`}
        style={{
          ...launcherStyle,
          background: config?.appearance?.launcherBgColor,
          color: config?.appearance?.launcherIconColor,
        }}
        onClick={() => setOpen(true)}
      >
        {config?.messages?.launcherLabel || ""}
      </button>

      {open ? (
        <div
          className={`chatbot-panel ${isMobile ? "mobile" : ""}`}
          style={{
            ...panelStyle,
            background: config?.appearance?.panelBgColor,
            color: config?.appearance?.panelTextColor,
            borderRadius: Number(config?.appearance?.borderRadius) || 14,
          }}
        >
          <div className="chatbot-header">
            <div className="chatbot-title-wrap">
              {config?.avatarUrl ? (
                <img className="chatbot-avatar" src={config.avatarUrl} alt={config?.name || ""} />
              ) : (
                <div
                  className="chatbot-avatar"
                  style={{
                    background: config?.appearance?.buttonBgColor,
                    color: config?.appearance?.buttonTextColor,
                  }}
                >
                  {toSafeString(config?.name || config?.messages?.launcherLabel).slice(0, 1)}
                </div>
              )}
              <div className="chatbot-title">{config?.name || ""}</div>
            </div>
            <button
              type="button"
              className="chatbot-close"
              aria-label={config?.messages?.closeButtonAriaLabel || ""}
              onClick={() => setOpen(false)}
            >
              x
            </button>
          </div>

          <div className="chatbot-body">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chatbot-msg ${msg.role === "user" ? "user" : "bot"}`}
                style={
                  msg.role === "user"
                    ? {
                        background: config?.appearance?.userBubbleBgColor,
                        color: config?.appearance?.userBubbleTextColor,
                      }
                    : {
                        background: config?.appearance?.botBubbleBgColor,
                        color: config?.appearance?.botBubbleTextColor,
                      }
                }
              >
                {msg.text}
              </div>
            ))}
            {sending ? (
              <div
                className="chatbot-msg bot"
                style={{
                  background: config?.appearance?.botBubbleBgColor,
                  color: config?.appearance?.botBubbleTextColor,
                }}
              >
                {config?.messages?.typingLabel || ""}
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          {quickActions.length > 0 ? (
            <div className="chatbot-quick-actions">
              {quickActions.map((action) => (
                <button
                  key={action.id || `${action.label}-${action.value}`}
                  type="button"
                  className="chatbot-quick-btn"
                  style={{
                    borderColor: config?.appearance?.buttonBgColor,
                    color: config?.appearance?.buttonBgColor,
                  }}
                  onClick={() => executeQuickAction(action)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}

          {faqSuggestions.length > 0 ? (
            <div className="chatbot-faq-suggestions">
              {faqSuggestions.map((faq) => (
                <button
                  key={faq.id || faq.question}
                  type="button"
                  className="chatbot-faq-btn"
                  style={{
                    borderColor: config?.appearance?.buttonBgColor,
                    color: config?.appearance?.buttonBgColor,
                  }}
                  onClick={() => sendMessage(faq.question)}
                >
                  {faq.question}
                </button>
              ))}
            </div>
          ) : null}

          {effectiveEscalation?.enabled ? (
            <div className="chatbot-escalation">
              <div className="chatbot-escalation-text">
                {config?.messages?.escalationPromptMessage || ""}
              </div>
              <div className="chatbot-escalation-actions">
                {(effectiveEscalation.mode === "redirect_contact" ||
                  effectiveEscalation.mode === "both") && (
                  <button
                    type="button"
                    className="chatbot-escalate-btn"
                    style={{
                      background: config?.appearance?.buttonBgColor,
                      color: config?.appearance?.buttonTextColor,
                    }}
                    onClick={() =>
                      router.push(effectiveEscalation.contactRoute || "/contact")
                    }
                  >
                    {effectiveEscalation.ctaLabel || ""}
                  </button>
                )}
                {(effectiveEscalation.mode === "inline_capture" ||
                  effectiveEscalation.mode === "both") && (
                  <button
                    type="button"
                    className="chatbot-escalate-outline"
                    style={{
                      borderColor: config?.appearance?.buttonBgColor,
                      color: config?.appearance?.buttonBgColor,
                    }}
                    onClick={() => setShowInlineEscalation((prev) => !prev)}
                  >
                    {config?.messages?.shareDetailsLabel || ""}
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {showInlineEscalation ? (
            <div className="chatbot-inline-form">
              <input
                className="chatbot-input"
                type="text"
                placeholder={config?.messages?.escalationInlineNamePlaceholder || ""}
                value={escalationForm.name}
                onChange={(e) =>
                  setEscalationForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <input
                className="chatbot-input"
                type="email"
                placeholder={config?.messages?.escalationInlineEmailPlaceholder || ""}
                value={escalationForm.email}
                onChange={(e) =>
                  setEscalationForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
              <textarea
                className="chatbot-input chatbot-textarea"
                placeholder={config?.messages?.escalationInlineMessagePlaceholder || ""}
                value={escalationForm.message}
                onChange={(e) =>
                  setEscalationForm((prev) => ({ ...prev, message: e.target.value }))
                }
              />
              <button
                type="button"
                className="chatbot-escalate-btn"
                style={{
                  background: config?.appearance?.buttonBgColor,
                  color: config?.appearance?.buttonTextColor,
                }}
                onClick={submitEscalation}
                disabled={submittingEscalation}
              >
                {submittingEscalation
                  ? config?.messages?.typingLabel || ""
                  : effectiveEscalation?.ctaLabel || ""}
              </button>
            </div>
          ) : null}

          <div className="chatbot-input-row">
            <input
              type="text"
              value={input}
              className="chatbot-input"
              placeholder={config?.messages?.inputPlaceholder || ""}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              disabled={sending}
            />
            <button
              type="button"
              className="chatbot-send"
              style={{
                background: config?.appearance?.buttonBgColor,
                color: config?.appearance?.buttonTextColor,
              }}
              onClick={() => sendMessage(input)}
              disabled={sending || !toSafeString(input)}
            >
              {config?.messages?.sendButtonLabel || ""}
            </button>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .chatbot-launcher {
          position: fixed;
          bottom: calc(18px + env(safe-area-inset-bottom, 0px));
          z-index: 1180;
          border: none;
          border-radius: 999px;
          min-width: 64px;
          height: 52px;
          padding: 0 16px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.22);
        }
        .chatbot-launcher.hidden {
          display: none;
        }
        .chatbot-panel {
          position: fixed;
          bottom: calc(18px + env(safe-area-inset-bottom, 0px));
          z-index: 1181;
          width: min(380px, calc(100vw - 24px));
          height: min(72vh, 580px);
          border: 1px solid rgba(15, 23, 42, 0.12);
          box-shadow: 0 20px 46px rgba(2, 6, 23, 0.28);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .chatbot-panel.mobile {
          width: calc(100vw - 16px);
          left: 8px !important;
          right: 8px !important;
          bottom: 8px;
          height: min(78vh, 620px);
        }
        .chatbot-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          border-bottom: 1px solid rgba(15, 23, 42, 0.08);
        }
        .chatbot-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .chatbot-avatar {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          object-fit: cover;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }
        .chatbot-title {
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .chatbot-close {
          border: none;
          background: transparent;
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          color: inherit;
        }
        .chatbot-body {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .chatbot-msg {
          max-width: 85%;
          padding: 8px 10px;
          border-radius: 10px;
          font-size: 13px;
          line-height: 1.45;
          white-space: pre-wrap;
        }
        .chatbot-msg.user {
          align-self: flex-end;
        }
        .chatbot-msg.bot {
          align-self: flex-start;
        }
        .chatbot-quick-actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          padding: 8px 10px 4px;
          border-top: 1px solid rgba(15, 23, 42, 0.06);
        }
        .chatbot-faq-suggestions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          padding: 4px 10px 8px;
          border-top: 1px solid rgba(15, 23, 42, 0.06);
        }
        .chatbot-faq-btn {
          border: 1px solid;
          background: transparent;
          border-radius: 7px;
          padding: 5px 8px;
          font-size: 12px;
          cursor: pointer;
          text-align: left;
        }
        .chatbot-quick-btn {
          border: 1px solid;
          background: transparent;
          border-radius: 999px;
          padding: 5px 10px;
          font-size: 12px;
          cursor: pointer;
        }
        .chatbot-escalation {
          border-top: 1px solid rgba(15, 23, 42, 0.06);
          padding: 8px 10px;
          display: grid;
          gap: 8px;
        }
        .chatbot-escalation-text {
          font-size: 12px;
          line-height: 1.4;
          opacity: 0.92;
        }
        .chatbot-escalation-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .chatbot-escalate-btn,
        .chatbot-escalate-outline {
          border-radius: 8px;
          font-size: 12px;
          padding: 6px 10px;
          cursor: pointer;
          border: 1px solid transparent;
        }
        .chatbot-escalate-outline {
          background: transparent;
          border: 1px solid;
        }
        .chatbot-inline-form {
          border-top: 1px solid rgba(15, 23, 42, 0.06);
          display: grid;
          gap: 8px;
          padding: 8px 10px;
        }
        .chatbot-input-row {
          padding: 8px 10px;
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
        }
        .chatbot-input {
          width: 100%;
          border: 1px solid rgba(15, 23, 42, 0.18);
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 13px;
          background: #fff;
          color: #0f172a;
        }
        .chatbot-textarea {
          min-height: 72px;
          resize: vertical;
        }
        .chatbot-send {
          border: none;
          border-radius: 8px;
          padding: 0 14px;
          font-weight: 600;
          cursor: pointer;
          min-width: 64px;
        }
        .chatbot-send:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}
