import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found-wrapper">
      <style>{`
        .not-found-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          background-color: var(--bg-color, #f8fafc);
          position: relative;
          overflow: hidden;
          font-family: var(--font-family, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
          box-sizing: border-box;
        }

        /* Ambient Glowing Animated Background Orbs */
        .ambient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.55;
          pointer-events: none;
          z-index: 1;
        }

        .orb-1 {
          width: 380px;
          height: 380px;
          background: radial-gradient(circle, rgba(224, 60, 51, 0.28) 0%, rgba(224, 60, 51, 0.05) 70%, transparent 100%);
          top: 15%;
          left: 20%;
          animation: floatOrb1 12s ease-in-out infinite alternate;
        }

        .orb-2 {
          width: 420px;
          height: 420px;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, rgba(245, 158, 11, 0.04) 70%, transparent 100%);
          bottom: 15%;
          right: 20%;
          animation: floatOrb2 14s ease-in-out infinite alternate;
        }

        .orb-3 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(99, 102, 241, 0.03) 70%, transparent 100%);
          top: 45%;
          right: 35%;
          animation: floatOrb3 10s ease-in-out infinite alternate;
        }

        @keyframes floatOrb1 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.08); }
          100% { transform: translate(-30px, 40px) scale(0.95); }
        }

        @keyframes floatOrb2 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, 30px) scale(1.12); }
          100% { transform: translate(30px, -40px) scale(0.92); }
        }

        @keyframes floatOrb3 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, -40px) scale(1.05); }
          100% { transform: translate(40px, 30px) scale(0.98); }
        }

        /* Glassmorphic 404 Floating Card */
        .not-found-card {
          position: relative;
          z-index: 5;
          max-width: 580px;
          width: 100%;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.95);
          border-radius: 28px;
          padding: 48px 36px 44px;
          text-align: center;
          box-shadow:
            0 24px 60px -12px rgba(15, 23, 42, 0.08),
            0 8px 24px -4px rgba(15, 23, 42, 0.04),
            0 0 0 1px rgba(226, 232, 240, 0.6);
          animation: cardSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes cardSlideUp {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Animated Illustration Box */
        .illustration-box {
          width: 220px;
          height: 160px;
          margin: 0 auto 20px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .illustration-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        /* Animation: Looking telescope / lens */
        .telescope-group {
          transform-origin: 105px 75px;
          animation: lookAround 4s ease-in-out infinite;
        }

        @keyframes lookAround {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-8deg); }
          75% { transform: rotate(8deg); }
        }

        /* Animation: Question marks popping */
        .qmark-1 {
          animation: popQmark1 3s ease-in-out infinite;
          transform-origin: 75px 35px;
        }
        .qmark-2 {
          animation: popQmark2 3.5s ease-in-out infinite 0.5s;
          transform-origin: 145px 30px;
        }

        @keyframes popQmark1 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.85; }
          50% { transform: translateY(-6px) scale(1.1); opacity: 1; }
        }

        @keyframes popQmark2 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
          50% { transform: translateY(-8px) scale(1.15); opacity: 0.95; }
        }

        /* Animation: Sparkles pulse */
        .sparkle-dot {
          animation: sparklePulse 2.5s ease-in-out infinite;
        }

        @keyframes sparklePulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 1; }
        }

        /* 404 Headline & Text */
        .not-found-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: var(--primary-color, #e03c33);
          background: var(--theme-primary-light, rgba(224, 60, 51, 0.08));
          padding: 4px 14px;
          border-radius: 999px;
          margin-bottom: 12px;
        }

        .not-found-heading {
          font-family: var(--heading-font, inherit);
          font-size: clamp(26px, 4.5vw, 34px);
          font-weight: var(--heading-font-weight, 800);
          color: var(--heading-color, #0f172a);
          margin: 0 0 10px 0;
          line-height: 1.25;
          letter-spacing: -0.5px;
        }

        .not-found-desc {
          font-size: clamp(14px, 2.2vw, 15.5px);
          color: var(--muted-text-color, #64748b);
          line-height: 1.6;
          margin: 0 auto 30px;
          max-width: 440px;
        }

        /* Return to Home CTA Button */
        .btn-home-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 13px 34px;
          background: var(--button-bg, var(--primary-color, #e03c33));
          color: var(--button-color, #ffffff) !important;
          border-radius: var(--button-radius, 999px);
          font-size: 15px;
          font-weight: 600;
          font-family: var(--button-font, inherit);
          text-decoration: none;
          box-shadow: 0 6px 20px -2px rgba(224, 60, 51, 0.35);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          border: none;
          cursor: pointer;
        }

        .btn-home-cta:hover {
          background: var(--button-hover-bg, var(--link-hover-color, #b92e27));
          color: var(--button-hover-color, #ffffff) !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 28px -2px rgba(224, 60, 51, 0.45);
        }

        .btn-home-cta:active {
          transform: translateY(0);
          box-shadow: 0 4px 12px rgba(224, 60, 51, 0.3);
        }

        .btn-icon {
          transition: transform 0.25s ease;
        }

        .btn-home-cta:hover .btn-icon {
          transform: translateX(-3px);
        }

        @media (max-width: 640px) {
          .not-found-wrapper {
            padding: 40px 16px;
          }
          .not-found-card {
            padding: 36px 22px 34px;
            border-radius: 20px;
          }
          .illustration-box {
            width: 190px;
            height: 140px;
            margin-bottom: 16px;
          }
          .btn-home-cta {
            width: 100%;
            padding: 12px 24px;
          }
        }
      `}</style>

      {/* Floating Ambient Glowing Light Orbs */}
      <div className="ambient-orb orb-1" />
      <div className="ambient-orb orb-2" />
      <div className="ambient-orb orb-3" />

      {/* Center 404 Floating Card */}
      <div className="not-found-card">
        {/* Animated Friendly Searching Character / Portal Illustration */}
        <div className="illustration-box">
          <svg className="illustration-svg" viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Soft backdrop shadow ground */}
            <ellipse cx="110" cy="142" rx="75" ry="8" fill="rgba(15, 23, 42, 0.06)" />

            {/* Desktop / Screen Frame */}
            <rect x="35" y="32" width="150" height="96" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2.5" />
            <rect x="42" y="39" width="136" height="74" rx="8" fill="#F8FAFC" />

            {/* Screen Top Dot Controls */}
            <circle cx="52" cy="46" r="2.5" fill="#EF4444" />
            <circle cx="60" cy="46" r="2.5" fill="#F59E0B" />
            <circle cx="68" cy="46" r="2.5" fill="#10B981" />

            {/* Monitor Stand */}
            <path d="M102 128 L98 140 H122 L118 128" fill="#CBD5E1" />
            <rect x="88" y="140" width="44" height="4" rx="2" fill="#94A3B8" />

            {/* Stylized 404 Inside Screen */}
            <text
              x="110"
              y="85"
              textAnchor="middle"
              fontFamily="system-ui, sans-serif"
              fontSize="34"
              fontWeight="900"
              fill="var(--primary-color, #e03c33)"
              fillOpacity="0.12"
              letterSpacing="2"
            >
              404
            </text>

            {/* Searching Explorer Character */}
            <g className="character-group">
              {/* Body */}
              <ellipse cx="110" cy="98" rx="28" ry="18" fill="var(--primary-color, #e03c33)" fillOpacity="0.85" />
              <ellipse cx="110" cy="94" rx="24" ry="14" fill="var(--primary-color, #e03c33)" />

              {/* Head / Face */}
              <circle cx="110" cy="74" r="14" fill="#FDE68A" />
              <path d="M99 70 C99 60 121 60 121 70 C121 73 118 76 110 76 C102 76 99 73 99 70 Z" fill="#1E293B" />

              {/* Telescope & Looking Arms (Animated) */}
              <g className="telescope-group">
                {/* Arm */}
                <path d="M105 84 L118 78" stroke="#FDE68A" strokeWidth="4" strokeLinecap="round" />
                {/* Telescope Tube */}
                <path d="M112 80 L145 70" stroke="#334155" strokeWidth="7" strokeLinecap="round" />
                <path d="M138 72 L150 68" stroke="var(--primary-color, #e03c33)" strokeWidth="9" strokeLinecap="round" />
                <circle cx="150" cy="68" r="5" fill="#60A5FA" />
                {/* Spy Lens Glow */}
                <circle cx="150" cy="68" r="8" fill="rgba(96, 165, 250, 0.3)" />
              </g>
            </g>

            {/* Floating Curious Question Marks */}
            <g className="qmark-1">
              <text x="70" y="32" fontFamily="system-ui, sans-serif" fontSize="22" fontWeight="800" fill="#F59E0B">
                ?
              </text>
            </g>
            <g className="qmark-2">
              <text x="142" y="26" fontFamily="system-ui, sans-serif" fontSize="26" fontWeight="800" fill="var(--primary-color, #e03c33)">
                ?
              </text>
            </g>

            {/* Sparkles around screen */}
            <g className="sparkle-dot" style={{ transformOrigin: "32px 30px" }}>
              <path d="M32 25 L34 30 L39 32 L34 34 L32 39 L30 34 L25 32 L30 30 Z" fill="#F59E0B" />
            </g>
            <g className="sparkle-dot" style={{ transformOrigin: "188px 115px", animationDelay: "1s" }}>
              <path d="M188 110 L190 114 L194 116 L190 118 L188 122 L186 118 L182 116 L186 114 Z" fill="var(--primary-color, #e03c33)" />
            </g>
          </svg>
        </div>

        {/* 404 Status Pill */}
        <div className="not-found-badge">404 ERROR</div>

        {/* Headline */}
        <h1 className="not-found-heading">Page Not Found</h1>

        {/* Empathetic subtitle */}
        <p className="not-found-desc">
          Sorry, we couldn&apos;t find the page you were looking for. It may have been moved, renamed, or is temporarily unavailable.
        </p>

        {/* Back to Home Action Button */}
        <div>
          <Link href="/" className="btn-home-cta">
            <svg
              className="btn-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
