export default function EmbedBlock({ url, caption }) {
  if (!url) return null;

  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);

  let embedSrc = null;
  if (youtubeMatch) {
    embedSrc = `https://www.youtube-nocookie.com/embed/${youtubeMatch[1]}`;
  } else if (vimeoMatch) {
    embedSrc = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  if (embedSrc) {
    return (
      <figure style={{ margin: "1em 0" }}>
        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
          <iframe
            src={embedSrc}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none", borderRadius: 6 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            title={caption || "Embedded content"}
          />
        </div>
        {caption && <figcaption style={{ marginTop: "0.5em", color: "#666", fontSize: "0.9em" }}>{caption}</figcaption>}
      </figure>
    );
  }

  return (
    <figure style={{ margin: "1em 0" }}>
      <iframe
        src={url}
        style={{ width: "100%", minHeight: 400, border: "1px solid #e0e0e0", borderRadius: 6 }}
        loading="lazy"
        title={caption || "Embedded content"}
      />
      {caption && <figcaption style={{ marginTop: "0.5em", color: "#666", fontSize: "0.9em" }}>{caption}</figcaption>}
    </figure>
  );
}
