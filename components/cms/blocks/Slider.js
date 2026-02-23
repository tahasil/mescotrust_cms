"use client";

import { useState, useEffect, useCallback } from "react";
import NextImage from "next/image";

export default function SliderBlock({
  slides = [],
  autoplay = true,
  interval = 5000,
  showDots = true,
  showArrows = true,
  height = 400,
}) {
  const list = Array.isArray(slides) ? slides : [];
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % list.length);
  }, [list.length]);

  const prev = useCallback(() => {
    setCurrent((p) => (p - 1 + list.length) % list.length);
  }, [list.length]);

  useEffect(() => {
    if (!autoplay || list.length <= 1) return;
    const timer = setInterval(next, Number(interval) || 5000);
    return () => clearInterval(timer);
  }, [autoplay, interval, list.length, next]);

  if (list.length === 0) return null;

  const arrowStyle = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.9)",
    border: "none",
    cursor: "pointer",
    fontSize: "1.2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  };

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 8,
        margin: "1.5rem 0",
        height: Number(height) || 400,
      }}
    >
      {list.map((slide, idx) => (
        <div
          key={idx}
          style={{
            position: "absolute",
            inset: 0,
            opacity: idx === current ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}
        >
          {slide.image && (
            <NextImage
              src={slide.image}
              alt={slide.alt || ""}
              fill
              sizes="100vw"
              style={{ objectFit: "cover" }}
            />
          )}
          {(slide.heading || slide.text) && (
            <>
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
              <div
                style={{
                  position: "absolute",
                  bottom: "2rem",
                  left: "2rem",
                  right: "2rem",
                  zIndex: 1,
                  color: "#fff",
                }}
              >
                {slide.heading && <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>{slide.heading}</h3>}
                {slide.text && <p style={{ margin: 0, opacity: 0.9 }}>{slide.text}</p>}
              </div>
            </>
          )}
        </div>
      ))}

      {showArrows && list.length > 1 && (
        <>
          <button onClick={prev} style={{ ...arrowStyle, left: 12 }} aria-label="Previous">&lsaquo;</button>
          <button onClick={next} style={{ ...arrowStyle, right: 12 }} aria-label="Next">&rsaquo;</button>
        </>
      )}

      {showDots && list.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 6,
            zIndex: 2,
          }}
        >
          {list.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              aria-label={`Slide ${idx + 1}`}
              style={{
                width: idx === current ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: idx === current ? "#fff" : "rgba(255,255,255,0.5)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "width 0.3s, background 0.3s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
