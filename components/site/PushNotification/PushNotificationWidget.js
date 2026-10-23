"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const VAPID_KEY_FALLBACK =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BP2rup-CdHoYF0c6X6z4l490R8cx7cIDD1PDvqZ33Q1v7yuhvzyN9Sqpx34rAo1Z4Ls7LZllZdR-okBvuW1rWeg";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationWidget() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const popoverRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  // Check support and current subscription status
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isPushSupported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    if (!isPushSupported) {
      setSupported(false);
      return;
    }

    setSupported(true);
    setPermission(Notification.permission);

    // If permission is already granted, verify subscription with service worker
    if (Notification.permission === "granted") {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => {
          if (sub) {
            setIsSubscribed(true);
          } else {
            setIsSubscribed(false);
          }
        })
        .catch(() => {
          setIsSubscribed(false);
        });
    }

    // Allow opening via global custom event (e.g., from footer links)
    const handleOpen = () => setPopoverOpen(true);
    window.addEventListener("mesco:open-push-settings", handleOpen);

    // Close popover when clicking outside
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("mesco:open-push-settings", handleOpen);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch public VAPID key
  const getPublicKey = async () => {
    try {
      const res = await fetch("/api/public/push-subscription/vapid-key");
      if (res.ok) {
        const data = await res.json();
        if (data.publicKey) return data.publicKey;
      }
    } catch {
      /* fallback below */
    }
    return VAPID_KEY_FALLBACK;
  };

  // Handle subscribe action
  const handleSubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        setLoading(false);
        if (perm === "denied") {
          showToast("Notification permission was denied.");
        }
        return;
      }

      // Register or get service worker
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      const publicKey = await getPublicKey();
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // Subscribe with push manager
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }

      const rawJson = sub.toJSON();

      // Save to server
      const res = await fetch("/api/public/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: rawJson.keys,
          userAgent: navigator.userAgent,
          deviceType: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
            ? "mobile"
            : "desktop",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to register subscription on server.");
      }

      setIsSubscribed(true);
      setPopoverOpen(false);
      showToast("Subscribed to MESCO Trust notifications!");
    } catch (err) {
      console.error("[PushNotificationWidget] Subscription failed:", err);
      showToast("Could not subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle unsubscribe action
  const handleUnsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();

        // Notify server
        await fetch("/api/public/push-subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }

      setIsSubscribed(false);
      setPopoverOpen(false);
      showToast("Unsubscribed from browser notifications.");
    } catch (err) {
      console.error("[PushNotificationWidget] Unsubscribe failed:", err);
      showToast("Failed to unsubscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  if (!supported) return null;

  return (
    <div className="mesco-push-root" ref={popoverRef}>
      {/* Floating Bell Trigger Button */}
      <button
        type="button"
        aria-label="Browser Notification Settings"
        className={`mesco-push-bell-btn ${isSubscribed ? "is-active" : ""}`}
        onClick={() => setPopoverOpen((prev) => !prev)}
      >
        <svg
          className="mesco-push-bell-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {isSubscribed && <span className="mesco-push-active-dot" />}
      </button>

      {/* Popover Card */}
      {popoverOpen && (
        <div className="mesco-push-card" role="dialog" aria-modal="false">
          <div className="mesco-push-card-header">
            <div className="mesco-push-card-title-group">
              <span className="mesco-push-icon-badge">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </span>
              <div>
                <h4 className="mesco-push-card-title">Browser Notifications</h4>
                <p className="mesco-push-card-status">
                  {permission === "denied"
                    ? "Status: Blocked in browser"
                    : isSubscribed
                    ? "Status: Subscribed & Active"
                    : "Status: Not Subscribed"}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="mesco-push-close-btn"
              onClick={() => setPopoverOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          <div className="mesco-push-card-body">
            {permission === "denied" ? (
              <p className="mesco-push-desc">
                Notifications are blocked for this site in your browser settings.
                To enable alerts, click the lock or settings icon beside the address
                bar and switch &ldquo;Notifications&rdquo; to Allow.
              </p>
            ) : isSubscribed ? (
              <p className="mesco-push-desc">
                You are currently subscribed to receive instant alerts for announcements,
                educational aids, events, and initiatives from MESCO Trust.
              </p>
            ) : (
              <p className="mesco-push-desc">
                Stay connected with MESCO Trust! Enable browser notifications to receive
                timely updates on emergency relief, education aid, and community events.
              </p>
            )}
          </div>

          <div className="mesco-push-card-actions">
            {permission === "denied" ? (
              <button
                type="button"
                className="mesco-push-btn mesco-push-btn-secondary"
                onClick={() => setPopoverOpen(false)}
              >
                Close
              </button>
            ) : isSubscribed ? (
              <>
                <button
                  type="button"
                  className="mesco-push-btn mesco-push-btn-danger"
                  onClick={handleUnsubscribe}
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Unsubscribe"}
                </button>
                <button
                  type="button"
                  className="mesco-push-btn mesco-push-btn-secondary"
                  onClick={() => setPopoverOpen(false)}
                >
                  Keep Active
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="mesco-push-btn mesco-push-btn-secondary"
                  onClick={() => setPopoverOpen(false)}
                  disabled={loading}
                >
                  Not Now
                </button>
                <button
                  type="button"
                  className="mesco-push-btn mesco-push-btn-primary"
                  onClick={handleSubscribe}
                  disabled={loading}
                >
                  {loading ? "Enabling..." : "Enable Alerts"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMsg && (
        <div className="mesco-push-toast" role="status">
          {toastMsg}
        </div>
      )}

      <style jsx>{`
        .mesco-push-root {
          position: fixed;
          bottom: 24px;
          left: 24px;
          z-index: 9995;
          font-family: var(--font-family, system-ui, -apple-system, sans-serif);
        }

        .mesco-push-bell-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--card-bg-color, #ffffff);
          color: var(--text-color, #222222);
          border: 1px solid var(--border-color, rgba(0, 0, 0, 0.12));
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.14);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .mesco-push-bell-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
          background: #fbfbfb;
        }

        .mesco-push-bell-btn.is-active {
          color: var(--primary-color, #e03c33);
        }

        .mesco-push-bell-icon {
          width: 22px;
          height: 22px;
        }

        .mesco-push-active-dot {
          position: absolute;
          top: 8px;
          right: 9px;
          width: 8px;
          height: 8px;
          background-color: #52c41a;
          border: 2px solid #ffffff;
          border-radius: 50%;
        }

        .mesco-push-card {
          position: absolute;
          bottom: 60px;
          left: 0;
          width: 320px;
          max-width: calc(100vw - 48px);
          background: var(--card-bg-color, #ffffff);
          color: var(--text-color, #222222);
          border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
          border-radius: 12px;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.18);
          padding: 18px;
          animation: mescoPushSlideUp 0.25s ease-out;
        }

        .mesco-push-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 12px;
        }

        .mesco-push-card-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mesco-push-icon-badge {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: rgba(224, 60, 51, 0.1);
          color: var(--primary-color, #e03c33);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .mesco-push-icon-badge svg {
          width: 18px;
          height: 18px;
        }

        .mesco-push-card-title {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: var(--heading-color, #111111);
          line-height: 1.25;
        }

        .mesco-push-card-status {
          margin: 3px 0 0;
          font-size: 12px;
          color: #777777;
          line-height: 1;
        }

        .mesco-push-close-btn {
          background: transparent;
          border: none;
          font-size: 20px;
          line-height: 1;
          color: #999999;
          cursor: pointer;
          padding: 0 4px;
        }

        .mesco-push-close-btn:hover {
          color: #333333;
        }

        .mesco-push-card-body {
          margin-bottom: 16px;
        }

        .mesco-push-desc {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: #555555;
        }

        .mesco-push-card-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .mesco-push-btn {
          appearance: none;
          border: 1px solid var(--border-color, rgba(0, 0, 0, 0.15));
          background: transparent;
          color: inherit;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s ease, opacity 0.15s ease;
        }

        .mesco-push-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .mesco-push-btn-primary {
          background: var(--primary-color, #e03c33);
          border-color: var(--primary-color, #e03c33);
          color: #ffffff;
        }

        .mesco-push-btn-primary:hover:not(:disabled) {
          opacity: 0.92;
        }

        .mesco-push-btn-secondary:hover:not(:disabled) {
          background: rgba(0, 0, 0, 0.04);
        }

        .mesco-push-btn-danger {
          background: transparent;
          border-color: #ff4d4f;
          color: #ff4d4f;
        }

        .mesco-push-btn-danger:hover:not(:disabled) {
          background: rgba(255, 77, 79, 0.08);
        }

        .mesco-push-toast {
          position: absolute;
          bottom: 60px;
          left: 0;
          width: max-content;
          max-width: 280px;
          background: #1f1f1f;
          color: #ffffff;
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 12px;
          line-height: 1.4;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
          animation: mescoPushSlideUp 0.2s ease-out;
        }

        @keyframes mescoPushSlideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
