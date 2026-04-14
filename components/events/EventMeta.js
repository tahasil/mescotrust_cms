import { formatEventDateTimeLine, formatLocationLine } from "./eventDisplay";

/**
 * Event date, time, location / online (compact block for cards and detail).
 */
export default function EventMeta({ event, style = {} }) {
  const dateLine = formatEventDateTimeLine(event);
  const locLine = formatLocationLine(event);

  return (
    <div style={{ fontSize: 14, color: "rgba(0,0,0,0.5)", ...style }}>
      {dateLine ? <div>{dateLine}</div> : null}
      {locLine ? <div style={{ marginTop: dateLine ? 4 : 0 }}>{locLine}</div> : null}
    </div>
  );
}
