"use client";

import { Fragment } from "react";

/**
 * Single source of truth for every loading state in the admin panel.
 *
 * Why this exists
 * ---------------
 * The admin used to mix several different loaders:
 *   1. a bare full-screen ring spinner in the App Router `loading.js` boundary,
 *   2. antd `<Spin />` dots in ~60 places (page builders, appearance editors,
 *      media pickers, popups, site-component edit forms, detail pages),
 *   3. antd's own spin indicators inside tables/cards,
 *   4. antd skeletons on the Social Wall / Chatbot pages.
 *
 * `ADMIN_LOADING_STYLE` (injected once by `components/admin/AdminLayoutClient.js`)
 * rewrites every antd spin inside the admin shell into the same ring loader and
 * keeps the colour driven by Admin Settings → Admin Loader through the
 * `--admin-loader-color` CSS variable.
 *
 * Frontend/public rendering never imports this module.
 */

/**
 * Scoped to `.admin-shell` (toggled on <body> by the admin layout) so portals
 * such as modals, drawers and dropdowns are covered too, while the public
 * website is untouched.
 */
export const ADMIN_LOADING_STYLE = `
  /* ── shared skeleton ─────────────────────────────────────────── */
  .admin-shell .admin-skeleton {
    width: 100%;
    display: block;
  }
  .admin-shell .admin-skeleton-bar {
    background: rgba(0, 0, 0, 0.06);
    background: color-mix(in srgb, var(--admin-loader-color, #1677ff) 16%, transparent);
    border-radius: 6px;
    animation: admin-skeleton-pulse 1.4s ease-in-out infinite;
  }
  .admin-shell .admin-skeleton-grid {
    display: grid;
    gap: 14px 18px;
    align-items: center;
  }
  .admin-shell .admin-skeleton-bar.is-header {
    animation: none;
    background: rgba(0, 0, 0, 0.1);
    background: color-mix(in srgb, var(--admin-loader-color, #1677ff) 28%, transparent);
    height: 14px;
  }
  @keyframes admin-skeleton-pulse {
    0% { opacity: 1; }
    50% { opacity: 0.45; }
    100% { opacity: 1; }
  }
  @keyframes adminLoadingSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* ── one ring loader for every antd Spin inside the admin ────── */
  .admin-shell .ant-spin .ant-spin-dot-item {
    display: none !important;
  }
  .admin-shell .ant-spin .ant-spin-dot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
  }
  .admin-shell .ant-spin .ant-spin-dot::after {
    content: "";
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: transparent;
    border: 3px solid rgba(0, 0, 0, 0.12);
    border-top-color: var(--admin-loader-color, #1677ff);
    animation: adminLoadingSpin 0.8s linear infinite;
  }
  .admin-shell .ant-spin-sm .ant-spin-dot {
    width: 18px;
    height: 18px;
  }
  .admin-shell .ant-spin-sm .ant-spin-dot::after {
    border-width: 2px;
  }
  .admin-shell .ant-spin-lg .ant-spin-dot {
    width: 44px;
    height: 44px;
  }

  /* antd card skeletons (Social Wall / Chatbot) share the admin palette */
  .admin-shell .ant-card-loading .ant-skeleton-paragraph > li,
  .admin-shell .ant-skeleton-paragraph > li {
    background: rgba(0, 0, 0, 0.06);
    background: color-mix(in srgb, var(--admin-loader-color, #1677ff) 16%, transparent);
    background-image: none;
  }

  /*
   * When the shared skeleton renders inside a table placeholder there is no
   * need for the antd spin overlay on top of it; hide it so a list shows
   * exactly one loader.
   */
  .admin-shell .ant-spin-nested-loading:has(.ant-table-placeholder .admin-skeleton) > .ant-spin {
    display: none !important;
  }
`;

/**
 * The one admin spinner. Size is the only variable; colour always follows
 * `--admin-loader-color` (Admin Settings → Admin Loader → Loader color).
 */
export function AdminLoadingSpinner({ size = 44, style, className = "" }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`admin-loading-spinner ${className}`.trim()}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: "transparent",
        borderStyle: "solid",
        borderColor: "rgba(0, 0, 0, 0.12)",
        borderTopColor: "var(--admin-loader-color, #1677ff)",
        borderWidth: Math.max(2, Math.round(size / 14)),
        animation: "adminLoadingSpin 0.8s linear infinite",
        flex: "0 0 auto",
        ...style,
      }}
    />
  );
}

/**
 * Skeleton rows used while a list/table is loading. It replaces the default
 * "No data" placeholder so an empty-looking table never flashes before data
 * arrives.
 */
export function AdminTableSkeleton({ rows = 6, columns = 4, showHeader = true }) {
  const columnCount = Math.max(2, Math.min(8, Number(columns) || 4));
  const rowCount = Math.max(2, Math.min(14, Number(rows) || 6));
  const gridTemplateColumns = new Array(columnCount).fill("minmax(0, 1fr)").join(" ");

  return (
    <div className="admin-skeleton" aria-hidden="true">
      <div className="admin-skeleton-grid" style={{ gridTemplateColumns }}>
        {showHeader
          ? new Array(columnCount).fill(0).map((_, index) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={`admin-skeleton-header-${index}`}
                className="admin-skeleton-bar is-header"
              />
            ))
          : null}
        {new Array(rowCount).fill(0).map((_, rowIndex) => (
          <Fragment key={`admin-skeleton-row-${rowIndex}`}>
            {new Array(columnCount).fill(0).map((__, columnIndex) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={`admin-skeleton-cell-${rowIndex}-${columnIndex}`}
                className="admin-skeleton-bar"
                style={{
                  height: 12,
                  width: `${52 + ((rowIndex * 13 + columnIndex * 17) % 40)}%`,
                  animationDelay: `${(rowIndex % 4) * 0.12}s`,
                }}
              />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

/** Card-shaped skeleton for single-record screens (settings, editors, detail). */
export function AdminCardSkeleton({ rows = 5, showTitle = true }) {
  return (
    <div className="admin-skeleton" aria-hidden="true">
      <div className="admin-skeleton-grid" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
        {showTitle ? (
          <div className="admin-skeleton-bar" style={{ height: 22, width: "32%" }} />
        ) : null}
        {new Array(Math.max(2, Math.min(12, Number(rows) || 5))).fill(0).map((_, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={`admin-skeleton-card-${index}`}
            className="admin-skeleton-bar"
            style={{ height: 14, width: `${100 - (index % 3) * 14}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * App Router route-level skeleton. Rendered by the admin `loading.js`
 * boundaries so every navigation shows the same placeholder instead of a
 * page-specific spinner.
 */
export default function AdminPageSkeleton({
  title = true,
  toolbar = true,
  rows = 8,
  columns = 4,
}) {
  return (
    <div className="admin-page-skeleton" aria-busy="true" aria-live="polite">
      <div
        className="admin-page-skeleton-card"
        style={{
          background: "var(--admin-card-bg, #ffffff)",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03), 0 8px 24px rgba(15, 23, 42, 0.04)",
        }}
      >
        {title ? (
          <div className="admin-skeleton-bar" style={{ height: 20, width: 180, marginBottom: 18 }} />
        ) : null}
        {toolbar ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 20,
              justifyContent: "flex-end",
            }}
          >
            <div className="admin-skeleton-bar" style={{ height: 34, width: 150 }} />
            <div className="admin-skeleton-bar" style={{ height: 34, width: 220 }} />
            <div className="admin-skeleton-bar" style={{ height: 34, width: 110 }} />
          </div>
        ) : null}
        <AdminTableSkeleton rows={rows} columns={columns} />
      </div>
    </div>
  );
}

/**
 * Helpers so a table only needs one consistent pair of props:
 *   <Table loading={adminTableLoading(loading)} locale={adminTableLocale(loading)} />
 */
export function adminTableLoading(loading) {
  return {
    spinning: Boolean(loading),
    indicator: <AdminLoadingSpinner size={32} />,
  };
}

export function adminTableLocale(loading, emptyNode) {
  return {
    emptyText: loading ? <AdminTableSkeleton rows={5} /> : emptyNode || undefined,
  };
}