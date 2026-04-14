"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styled from "styled-components";

const cardStyle = {
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: 20,
  marginBottom: 24,
  background: "#fff",
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
};

const titleStyle = {
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 16,
  paddingLeft: 12,
  borderLeft: "3px solid var(--primary-color, #8b1a1a)",
};

const contentStyle = {
  paddingLeft: 15,
};

const Item = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
  .img {
    flex-shrink: 0;
    width: 78px;
    height: 68px;
    border-radius: 8px;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.04);
    display: block;
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }
  .body {
    flex: 1;
    min-width: 0;
  }
  .title {
    font-size: 14px;
    font-weight: 700;
    line-height: 1.3;
    margin-bottom: 4px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    a {
      color: inherit;
      text-decoration: none;
      &:hover {
        color: var(--primary-color, #8b1a1a);
      }
    }
  }
  .meta {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.42);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
`;

const MONTHS = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function normalizeEvent(ev) {
  return {
    _id: ev?._id,
    slug: ev?.slug,
    title: ev?.title,
    description: ev?.description,
    featuredImageDesktop: ev?.featuredImageDesktop,
    featuredImageMobile: ev?.featuredImageMobile,
    startDate: ev?.startDate,
    endDate: ev?.endDate,
    updatedAt: ev?.updatedAt,
  };
}

function pickImage(ev) {
  const m = (ev?.featuredImageMobile || "").toString().trim();
  const d = (ev?.featuredImageDesktop || "").toString().trim();
  return m || d;
}

/**
 * Events sidebar — Search + Upcoming Events + Recently Updated Events.
 * Used on /events and /events/[slug].
 */
export default function EventsSidebarFull({ searchQuery, currentSlug }) {
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    fetch("/api/events?limit=40&sort=upcoming")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const items = Array.isArray(data.items) ? data.items.map(normalizeEvent) : [];
        const filtered = items
          .filter((ev) => ev.slug && ev.slug !== currentSlug)
          .filter((ev) => {
            const sd = ev.startDate ? new Date(ev.startDate) : null;
            if (!sd || Number.isNaN(sd.getTime())) return false;
            return sd >= now;
          })
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
          .slice(0, 5);
        setUpcoming(filtered);
      })
      .catch(() => {});

    fetch("/api/events?limit=5&sort=recent")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => {
        const items = Array.isArray(data.items) ? data.items.map(normalizeEvent) : [];
        const filtered = currentSlug ? items.filter((ev) => ev.slug !== currentSlug) : items;
        setRecent(filtered.slice(0, 5));
      })
      .catch(() => {});
  }, [currentSlug]);

  const clearLink = useMemo(() => "/events", []);

  return (
    <div>
      <div style={cardStyle}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
          Search
        </div>
        <form action="/events" method="GET" style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            name="q"
            defaultValue={searchQuery || ""}
            placeholder="Search events..."
            style={{
              flex: 1,
              padding: "9px 14px",
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 8,
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "9px 18px",
              border: "none",
              borderRadius: 8,
              background: "var(--primary-color, #8b1a1a)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>
        {searchQuery ? (
          <Link
            href={clearLink}
            style={{
              fontSize: 12,
              color: "rgba(0,0,0,0.4)",
              marginTop: 10,
              display: "inline-block",
              textDecoration: "none",
            }}
          >
            Clear search
          </Link>
        ) : null}
      </div>

      <div style={cardStyle}>
        <div style={titleStyle}>Upcoming Events</div>
        <div style={contentStyle}>
          {upcoming.length === 0 ? (
            <div style={{ fontSize: 14, color: "rgba(0,0,0,0.35)" }}>
              No upcoming events.
            </div>
          ) : (
            upcoming.map((ev) => (
              <Item key={ev._id || ev.slug}>
                {pickImage(ev) ? (
                  <Link href={`/events/${ev.slug}`} className="img">
                    <img loading="lazy" src={pickImage(ev)} alt={ev.title || "Event"} />
                  </Link>
                ) : (
                  <Link href={`/events/${ev.slug}`} className="img" aria-label={ev.title || "Event"} />
                )}
                <div className="body">
                  <div className="title">
                    <Link href={`/events/${ev.slug}`}>{ev.title}</Link>
                  </div>
                  <div className="meta">
                    {ev.startDate ? formatDate(ev.startDate) : ""}
                  </div>
                </div>
              </Item>
            ))
          )}
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 0 }}>
        <div style={titleStyle}>Recently Updated</div>
        <div style={contentStyle}>
          {recent.length === 0 ? (
            <div style={{ fontSize: 14, color: "rgba(0,0,0,0.35)" }}>
              No events yet.
            </div>
          ) : (
            recent.map((ev) => (
              <Item key={ev._id || ev.slug}>
                {pickImage(ev) ? (
                  <Link href={`/events/${ev.slug}`} className="img">
                    <img loading="lazy" src={pickImage(ev)} alt={ev.title || "Event"} />
                  </Link>
                ) : (
                  <Link href={`/events/${ev.slug}`} className="img" aria-label={ev.title || "Event"} />
                )}
                <div className="body">
                  <div className="title">
                    <Link href={`/events/${ev.slug}`}>{ev.title}</Link>
                  </div>
                  <div className="meta">
                    {ev.updatedAt ? `UPDATED ${formatDate(ev.updatedAt)}` : ""}
                  </div>
                </div>
              </Item>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

