import Link from "next/link";
import EventMeta from "./EventMeta";
import { getEventImageSources } from "./eventDisplay";
import MediaImage from "@/components/shared/MediaImage";

/**
 * Event card (screenshot-style): image on top + content below.
 */
export default function EventCard({ event }) {
  const { desktop, mobile } = getEventImageSources(event);
  const href = `/events/${event.slug}`;
  const desc = (event.description || "").trim();

  return (
    <article
      className="event-card"
      style={{
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 14,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        height: "100%",
      }}
    >
      <Link
        href={href}
        style={{
          display: "block",
          background: desktop ? "rgba(0,0,0,0.02)" : "rgba(0,0,0,0.04)",
        }}
        className="event-card-image-wrap"
      >
        {desktop ? (
          <MediaImage
            src={desktop}
            mobileSrc={mobile && mobile !== desktop ? mobile : ""}
            alt={event.title || "Event"}
            width={960}
            height={540}
            sizes="(max-width: 576px) 100vw, (max-width: 992px) 50vw, 33vw"
            imgStyle={{
              width: "100%",
              height: 220,
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: 220,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(0,0,0,0.15)",
              fontSize: 14,
            }}
          >
            No image
          </div>
        )}
      </Link>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          padding: 16,
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1.3,
            margin: "0 0 10px 0",
          }}
        >
          <Link
            href={href}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {event.title}
          </Link>
        </h2>
        <EventMeta
          event={event}
          showIcons
          style={{ marginBottom: 10, fontSize: 13 }}
        />
        {desc ? (
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.65,
              color: "rgba(0,0,0,0.55)",
              margin: "0 0 16px 0",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {desc}
          </p>
        ) : null}
        <div style={{ marginTop: "auto", paddingTop: 6 }}>
          <Link
            href={href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 999,
              background:
                "var(--gradient-color, linear-gradient(90deg, #CF372F 0%, #691C18 100%))",
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
              width: "fit-content",
            }}
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
