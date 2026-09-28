"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const RADIUS = 21;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~131.95

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressCircleRef = useRef(null);
  const rafIdRef = useRef(null);

  const calculateScrollProgress = useCallback(() => {
    if (typeof window === "undefined") return;

    const scrollTop =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    const windowHeight =
      window.innerHeight ||
      document.documentElement.clientHeight ||
      document.body.clientHeight ||
      0;

    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.documentElement.clientHeight
    );

    const totalScrollableDistance = Math.max(0, docHeight - windowHeight);

    // Calculate percentage 0 to 100
    let currentProgress = 0;
    if (totalScrollableDistance > 0) {
      currentProgress = Math.min(
        100,
        Math.max(0, (scrollTop / totalScrollableDistance) * 100)
      );
    }

    // Update progress state
    setProgress(currentProgress);

    // Directly update strokeDashoffset for instant 60/120fps smoothness
    if (progressCircleRef.current) {
      const offset = CIRCUMFERENCE - (currentProgress / 100) * CIRCUMFERENCE;
      progressCircleRef.current.style.strokeDashoffset = `${offset}`;
    }

    // Show button once scrolled past 150px
    if (scrollTop > 150) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, []);

  const onScroll = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(() => {
      calculateScrollProgress();
    });
  }, [calculateScrollProgress]);

  useEffect(() => {
    // Initial calculation
    calculateScrollProgress();

    // Scroll listener (passive for optimal performance)
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    // Dynamic content / image resize observer
    let resizeObserver = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        onScroll();
      });
      if (document.body) {
        resizeObserver.observe(document.body);
      }
      if (document.documentElement) {
        resizeObserver.observe(document.documentElement);
      }
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [calculateScrollProgress, onScroll]);

  const scrollToTop = () => {
    if (typeof window === "undefined") return;
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const initialDashOffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <>
      <button
        type="button"
        className={`scroll-to-top-btn ${visible ? "is-visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
        title={`Scroll to top (${Math.round(progress)}%)`}
      >
        {/* SVG Progress Ring & Inner Circle */}
        <svg className="progress-ring-svg" width="50" height="50" viewBox="0 0 50 50">
          {/* Background Track Ring */}
          <circle
            className="progress-track"
            cx="25"
            cy="25"
            r={RADIUS}
            fill="none"
            strokeWidth="3.5"
          />

          {/* Active Dynamic Progress Stroke */}
          <circle
            ref={progressCircleRef}
            className="progress-bar"
            cx="25"
            cy="25"
            r={RADIUS}
            fill="none"
            strokeWidth="3.5"
            strokeDasharray={CIRCUMFERENCE}
            style={{ strokeDashoffset: initialDashOffset }}
            strokeLinecap="round"
          />

          {/* Inner Core Button Fill */}
          <circle className="inner-core" cx="25" cy="25" r="17.5" />
        </svg>

        {/* Upward Arrow Icon */}
        <span className="arrow-icon-wrap">
          <svg
            className="arrow-svg"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19V5" />
            <path d="m5 12 7-7 7 7" />
          </svg>
        </span>
      </button>

      <style jsx>{`
        .scroll-to-top-btn {
          position: fixed;
          bottom: 90px;
          right: 22px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: transparent;
          border: none;
          outline: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2999;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12),
            0 2px 6px rgba(0, 0, 0, 0.08);
          opacity: 0;
          visibility: hidden;
          transform: translateY(18px) scale(0.88);
          transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
            visibility 0.3s ease,
            box-shadow 0.25s ease;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          padding: 0;
        }

        .scroll-to-top-btn.is-visible {
          opacity: 1;
          visibility: visible;
          transform: translateY(0) scale(1);
        }

        .scroll-to-top-btn:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 10px 28px rgba(224, 60, 51, 0.35),
            0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .scroll-to-top-btn:active {
          transform: translateY(-1px) scale(0.96);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* SVG Progress Ring */
        .progress-ring-svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 50px;
          height: 50px;
          transform: rotate(-90deg);
          pointer-events: none;
        }

        .progress-track {
          stroke: rgba(224, 60, 51, 0.15);
        }

        .progress-bar {
          stroke: var(--primary-color, #e03c33);
          transition: stroke-dashoffset 0.1s linear;
        }

        .inner-core {
          fill: #ffffff;
          transition: fill 0.25s ease;
        }

        .scroll-to-top-btn:hover .inner-core {
          fill: var(--primary-color, #e03c33);
        }

        /* Arrow Icon */
        .arrow-icon-wrap {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary-color, #e03c33);
          transition: color 0.25s ease, transform 0.25s ease;
        }

        .scroll-to-top-btn:hover .arrow-icon-wrap {
          color: #ffffff;
          animation: arrowBounce 0.7s ease infinite alternate;
        }

        @keyframes arrowBounce {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-3px);
          }
        }

        @media (max-width: 768px) {
          .scroll-to-top-btn {
            bottom: 86px;
            right: 18px;
            width: 46px;
            height: 46px;
          }
          .progress-ring-svg {
            width: 46px;
            height: 46px;
          }
        }
      `}</style>
    </>
  );
}
