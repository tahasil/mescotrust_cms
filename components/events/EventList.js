import EventCard from "./EventCard";

export default function EventList({ items }) {
  if (!items?.length) {
    return (
      <p style={{ color: "rgba(0,0,0,0.35)", textAlign: "center", padding: "48px 0" }}>
        No events found.
      </p>
    );
  }
  return (
    <div className="event-list">
      {items.map((event) => (
        <EventCard key={event._id?.toString() || event.slug} event={event} />
      ))}
      <style>{`
        .event-list {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }
        @media (max-width: 992px) {
          .event-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 576px) {
          .event-list { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
