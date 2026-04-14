import { CalendarOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { formatEventDateTimeLine, formatLocationLine } from "./eventDisplay";

/**
 * Event date, time, location / online (compact block for cards and detail).
 */
export default function EventMeta({ event, style = {}, showIcons = false }) {
  const dateLine = formatEventDateTimeLine(event);
  const locLine = formatLocationLine(event);

  return (
    <div style={{ fontSize: 14, color: "rgba(0,0,0,0.5)", ...style }}>
      {dateLine ? (
        <div
          style={
            showIcons
              ? {
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }
              : undefined
          }
        >
          {showIcons ? <CalendarOutlined /> : null}
          <span>{dateLine}</span>
        </div>
      ) : null}
      {locLine ? (
        <div
          style={
            showIcons
              ? {
                  marginTop: dateLine ? 8 : 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }
              : { marginTop: dateLine ? 4 : 0 }
          }
        >
          {showIcons ? <EnvironmentOutlined /> : null}
          <span>{locLine}</span>
        </div>
      ) : null}
    </div>
  );
}
