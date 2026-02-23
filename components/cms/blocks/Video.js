export default function VideoBlock({ url, caption }) {
  if (!url) return null;

  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);

  if (youtubeMatch) {
    return (
      <figure style={{ margin: "1em 0" }}>
        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeMatch[1]}`}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none", borderRadius: 6 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            title={caption || "Video"}
          />
        </div>
        {caption && <figcaption style={{ marginTop: "0.5em", color: "#666", fontSize: "0.9em" }}>{caption}</figcaption>}
      </figure>
    );
  }

  if (vimeoMatch) {
    return (
      <figure style={{ margin: "1em 0" }}>
        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
          <iframe
            src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none", borderRadius: 6 }}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            loading="lazy"
            title={caption || "Video"}
          />
        </div>
        {caption && <figcaption style={{ marginTop: "0.5em", color: "#666", fontSize: "0.9em" }}>{caption}</figcaption>}
      </figure>
    );
  }

  return (
    <figure style={{ margin: "1em 0" }}>
      <video
        src={url}
        controls
        style={{ width: "100%", maxWidth: "100%", borderRadius: 6 }}
        preload="metadata"
      />
      {caption && <figcaption style={{ marginTop: "0.5em", color: "#666", fontSize: "0.9em" }}>{caption}</figcaption>}
    </figure>
  );
}
