"use client";

import { useEffect, useMemo, useState } from "react";
import { Tag } from "antd";
import styles from "./CommonDashboard.module.css";

const DASHBOARD_REFRESH_MS = 60 * 1000;

function formatNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    numeric,
  );
}

function formatRelative(value) {
  if (!value) return "just now";
  const target = new Date(value).getTime();
  if (!Number.isFinite(target)) return "just now";
  const diff = Date.now() - target;
  if (diff < 60 * 1000) return "just now";
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
  }
  return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
}

function useAnimatedNumber(value, durationMs = 900) {
  const targetValue = Number(value);
  const safeTarget = Number.isFinite(targetValue) ? targetValue : 0;
  const [displayValue, setDisplayValue] = useState(safeTarget);

  useEffect(() => {
    let raf = 0;
    let mounted = true;
    const start = performance.now();

    const step = (now) => {
      if (!mounted) return;
      const progress = Math.min(1, (now - start) / durationMs);
      const next = Math.round(safeTarget * progress * 10) / 10;
      setDisplayValue(next);
      if (progress < 1) raf = window.requestAnimationFrame(step);
    };

    raf = window.requestAnimationFrame(step);
    return () => {
      mounted = false;
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [safeTarget, durationMs]);

  return displayValue;
}

function ReferenceStatCard({
  label,
  value,
  restricted,
  toneClass,
  chipLabel,
  chipValue,
  sparkline,
}) {
  const animated = useAnimatedNumber(value, 850);
  const lastPoint = sparkline.trim().split(" ").at(-1)?.split(",") || ["92", "21"];

  return (
    <article className={`${styles.metricCard} ${toneClass}`}>
      <header className={styles.metricHeader}>
        <p className={styles.metricLabel}>{label}</p>
        <span className={styles.metricPeriod}>/ Total</span>
      </header>
      <div className={styles.metricContent}>
        <div className={styles.metricNumbers}>
          <p className={styles.metricValue}>
            {restricted ? "Restricted" : formatNumber(animated)}
          </p>
          <p className={styles.metricHint}>
            <span className={styles.metricHintMarker} aria-hidden="true" />
            {restricted
              ? "Permission locked"
              : `${chipLabel}: ${chipValue}`}
          </p>
        </div>
        <svg
          className={styles.metricSparkline}
          viewBox="0 0 96 42"
          role="img"
          aria-label={`${label} trend illustration`}
          preserveAspectRatio="none"
        >
          <path className={styles.metricSparklineGuide} d="M2 34 H94" />
          <polyline
            className={styles.metricSparklineLine}
            points={sparkline}
          />
          <circle
            className={styles.metricSparklineDot}
            cx={lastPoint[0]}
            cy={lastPoint[1]}
            r="2.5"
          />
        </svg>
      </div>
    </article>
  );
}

export default function CommonDashboard({ data }) {
  const [safeData, setSafeData] = useState(data || {});
  const [syncTick, setSyncTick] = useState(0);

  useEffect(() => {
    setSafeData(data || {});
  }, [data]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSyncTick((value) => value + 1);
    }, 30 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let active = true;
    let timerId = 0;
    let fetching = false;

    function scheduleNext() {
      if (!active) return;
      timerId = window.setTimeout(refreshDashboard, DASHBOARD_REFRESH_MS);
    }

    async function refreshDashboard(force = false) {
      if (!active || fetching) return;
      if (!force && document.visibilityState === "hidden") {
        scheduleNext();
        return;
      }

      fetching = true;
      try {
        const res = await fetch("/api/admin/dashboard", {
          method: "GET",
          cache: "no-store",
          headers: { accept: "application/json" },
        });
        if (!res.ok) return;
        const payload = await res.json();
        if (active && payload?.data) {
          setSafeData(payload.data);
        }
      } catch {
        // Ignore polling errors to keep UI stable with last successful payload.
      } finally {
        fetching = false;
        scheduleNext();
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      if (timerId) window.clearTimeout(timerId);
      refreshDashboard(true);
    }

    scheduleNext();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      if (timerId) window.clearTimeout(timerId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const recentUpdates = Array.isArray(safeData.recentUpdates)
    ? safeData.recentUpdates
    : [];

  const lastSyncedLabel = useMemo(() => {
    void syncTick;
    const generatedAt = safeData?.generatedAt;
    if (!generatedAt) return "Last synced: waiting";
    const timestamp = new Date(generatedAt).getTime();
    if (!Number.isFinite(timestamp)) return "Last synced: waiting";
    return `Last synced: ${formatRelative(generatedAt)}`;
  }, [safeData?.generatedAt, syncTick]);

  const kpiByKey = useMemo(() => {
    const sourceKpis = Array.isArray(safeData?.kpis) ? safeData.kpis : [];
    const map = new Map();
    for (const item of sourceKpis) {
      if (!item?.key) continue;
      map.set(String(item.key), item);
    }
    return map;
  }, [safeData?.kpis]);

  const statCards = useMemo(() => {
    const defaults = [
      {
        key: "pages",
        label: "Pages",
        chipLabel: "Published",
        sparkline: "2,32 12,32 20,27 29,29 38,19 48,22 57,13 67,17 77,10 86,13 94,8",
        toneClass: styles.metricTonePrimary,
      },
      {
        key: "blogs",
        label: "Blog Posts",
        chipLabel: "Published",
        sparkline: "2,12 11,17 20,15 29,23 38,20 47,28 56,24 65,31 74,27 84,34 94,31",
        toneClass: styles.metricToneDark,
      },
      {
        key: "blogComments",
        label: "Blog Comments",
        chipLabel: "Pending",
        sparkline: "2,31 11,29 20,33 29,23 38,27 47,19 56,22 65,15 74,20 84,12 94,15",
        toneClass: styles.metricToneNight,
      },
      {
        key: "events",
        label: "Events",
        chipLabel: "Published",
        sparkline: "2,28 11,25 20,29 29,17 38,20 47,12 56,16 65,10 74,14 84,8 94,11",
        toneClass: styles.metricToneLight,
      },
      {
        key: "eventRegistrations",
        label: "Event Registrations",
        chipLabel: "New",
        sparkline: "2,14 11,18 20,16 29,25 38,21 47,29 56,25 65,33 74,28 84,31 94,23",
        toneClass: styles.metricToneRegistration,
      },
      {
        key: "users",
        label: "Users",
        chipLabel: "New Users",
        sparkline: "2,32 11,29 20,31 29,24 38,26 47,18 56,20 65,14 74,17 84,11 94,13",
        toneClass: styles.metricToneSecondary,
      },
      {
        key: "forms",
        label: "Forms",
        chipLabel: "Active",
        sparkline: "2,30 11,31 20,25 29,27 38,18 47,21 56,16 65,19 74,11 84,14 94,9",
        toneClass: styles.metricToneOcean,
      },
    ];

    return defaults.map((base) => {
      const source = kpiByKey.get(base.key) || {};
      return {
        ...base,
        label: String(source.label || base.label),
        value: Number(source.value || 0),
        restricted: Boolean(source.restricted),
        chipLabel: String(source.chipLabel || base.chipLabel),
        chipValue: formatNumber(source.chipValue || 0),
      };
    });
  }, [kpiByKey]);

  return (
    <div className={styles.dashboard}>
      <section className={styles.heroSection}>
        <div className={styles.titleRow}>
          <h2 className={styles.simpleTitle}>Dashboard</h2>
          <span
            className={`${styles.syncBadge} ${
              safeData?.dbConnected ? "" : styles.syncBadgeOffline
            }`}
          >
            {safeData?.dbConnected ? lastSyncedLabel : "Database offline"}
          </span>
        </div>

        <div className={styles.kpiGrid}>
          {statCards.map((card) => (
            <ReferenceStatCard
              key={card.key}
              label={card.label}
              value={card.value}
              restricted={card.restricted}
              toneClass={card.toneClass}
              chipLabel={card.chipLabel}
              chipValue={card.chipValue}
              sparkline={card.sparkline}
            />
          ))}
        </div>
      </section>

      <section className={styles.primaryGrid}>
        <article className={`${styles.glassCard} ${styles.updatesCard}`}>
          <header className={styles.cardHead}>
            <div>
              <h3 className={styles.cardTitle}>Recent Updates</h3>
              <p className={styles.cardSubhead}>
                Live content and module activity feed
              </p>
            </div>
            <div className={styles.segmentedControl}>
              <span className={`${styles.segmentItem} ${styles.segmentActive}`}>
                Live Feed
              </span>
            </div>
          </header>

          <div className={styles.updatesList}>
            {recentUpdates.length ? (
              recentUpdates.map((item) => {
                const actionLabel =
                  item?.moduleKey === "forms"
                    ? String(item?.title || "updated")
                    : String(item?.status || "updated");

                return (
                  <div key={item.id} className={styles.updateRow}>
                    <div className={styles.updateMain}>
                      <span className={styles.updateDot} />
                      <Tag color="default" className={styles.statusTagModule}>
                        {item.moduleLabel}
                      </Tag>
                      <p className={styles.updateTitle}>{item.title}</p>
                      <Tag
                        color="default"
                        className={`${styles.statusTagMuted} ${styles.updateActionTag}`}
                      >
                        {actionLabel}
                      </Tag>
                    </div>
                    <div className={styles.updateMeta}>
                      <span>{formatRelative(item.updatedAt)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className={styles.emptyText}>
                No updates available for your current permissions.
              </p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
