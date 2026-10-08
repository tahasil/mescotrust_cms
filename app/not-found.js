import Link from "next/link";
import { connectDB } from "@/lib/db";
import Appearance from "@/models/Appearance";
import ThemeConfig from "@/models/ThemeConfig";
import { ensureAppearanceDocuments } from "@/lib/appearance";
import NotFoundCanvas from "@/components/common/NotFoundCanvas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function get404HeaderData() {
  try {
    await connectDB();
    await ensureAppearanceDocuments();
    const doc = await Appearance.findOne({ moduleKey: "header" }).lean();
    const headerProps = doc?.defaultProps || {};
    const logoType = headerProps.logoType || "image";
    const logoLightUrl = String(
      headerProps.logoLightUrl || headerProps.logoImageUrl || "",
    ).trim();
    const logoUrl = String(headerProps.logoUrl || "/").trim() || "/";
    const logoTarget = headerProps.logoTarget === "_blank" ? "_blank" : "_self";

    let finalLogo = logoLightUrl;
    if (!finalLogo) {
      const themeDoc = await ThemeConfig.findOne({
        $or: [{ themeKey: "default" }, { themeKey: { $exists: false } }],
      })
        .sort({ updatedAt: -1 })
        .lean();
      finalLogo = String(
        themeDoc?.logoLightUrl || themeDoc?.logoImageUrl || "",
      ).trim();
    }

    const headerDonateBg = String(headerProps.headerDonateBgValue || "#A82D2D").trim();
    const headerDonateText = String(headerProps.headerDonateTextValue || "#ffffff").trim();
    const headerDonateHoverBg = String(
      headerProps.headerDonateHoverBgValue || headerDonateBg || "#8C1C13",
    ).trim();
    const headerDonateHoverText = String(
      headerProps.headerDonateHoverTextValue || headerDonateText || "#ffffff",
    ).trim();

    return {
      logoType,
      logoImage: finalLogo || "/uploads/1772597551416_logo.webp",
      logoUrl,
      logoTarget,
      siteTitle: headerProps.siteTitle || "MESCO Trust",
      headerDonateBg,
      headerDonateText,
      headerDonateHoverBg,
      headerDonateHoverText,
    };
  } catch (error) {
    console.error("[404] Error fetching header logo:", error);
    return {
      logoType: "image",
      logoImage: "/uploads/1772597551416_logo.webp",
      logoUrl: "/",
      logoTarget: "_self",
      siteTitle: "MESCO Trust",
      headerDonateBg: "#A82D2D",
      headerDonateText: "#ffffff",
      headerDonateHoverBg: "#8C1C13",
      headerDonateHoverText: "#ffffff",
    };
  }
}

export default async function NotFound() {
  const {
    logoType,
    logoImage,
    logoUrl,
    logoTarget,
    siteTitle,
    headerDonateBg,
    headerDonateText,
    headerDonateHoverBg,
    headerDonateHoverText,
  } = await get404HeaderData();

  return (
    <div
      className="not-found-page"
      style={{
        "--header-donate-bg": headerDonateBg,
        "--header-donate-text": headerDonateText,
        "--header-donate-hover-bg": headerDonateHoverBg,
        "--header-donate-hover-text": headerDonateHoverText,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;500;600;700;800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap');

        .not-found-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background: #f8fafc;
          position: relative;
          overflow: hidden;
          font-family: var(--font-family, "Instrument Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
          box-sizing: border-box;
          color: #0f172a;
        }

        /* Ambient Glowing Background Orbs */
        .ambient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.45;
          pointer-events: none;
          z-index: 1;
        }

        .orb-1 {
          width: 460px;
          height: 460px;
          background: radial-gradient(circle, rgba(33, 30, 48, 0.18) 0%, rgba(33, 30, 48, 0.02) 70%, transparent 100%);
          top: 15%;
          left: 10%;
          animation: floatOrb1 16s ease-in-out infinite alternate;
        }

        .orb-2 {
          width: 480px;
          height: 480px;
          background: radial-gradient(circle, rgba(224, 60, 51, 0.14) 0%, rgba(224, 60, 51, 0.02) 70%, transparent 100%);
          bottom: 10%;
          right: 15%;
          animation: floatOrb2 18s ease-in-out infinite alternate;
        }

        @keyframes floatOrb1 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.08); }
          100% { transform: translate(-30px, 40px) scale(0.95); }
        }

        @keyframes floatOrb2 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-45px, 30px) scale(1.1); }
          100% { transform: translate(30px, -40px) scale(0.92); }
        }

        /* Main Modern Split Card Frame */
        .not-found-card-frame {
          max-width: 1100px;
          width: 100%;
          min-height: 580px;
          background: #ffffff;
          border-radius: 28px;
          position: relative;
          z-index: 5;
          overflow: hidden;
          box-shadow:
            0 24px 60px -12px rgba(15, 23, 42, 0.1),
            0 8px 24px -4px rgba(15, 23, 42, 0.04),
            0 0 0 1px rgba(226, 232, 240, 0.8);
          animation: cardSlideUp 0.85s cubic-bezier(0.16, 1, 0.3, 1) both;
          display: flex;
          flex-direction: column;
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

        /* Split 2-Column Content Layout */
        .not-found-split-layout {
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          flex: 1;
          position: relative;
          min-height: 580px;
        }

        /* Left Side: Clean Content Area */
        .left-content-area {
          padding: 44px 44px 50px 52px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          z-index: 3;
        }

        .logo-header-wrap {
          margin-bottom: 28px;
        }

        .not-found-logo-link {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
        }

        .not-found-logo-link:hover {
          transform: translateY(-2px) scale(1.02);
          opacity: 0.95;
        }

        .not-found-logo-img {
          max-height: 52px;
          width: auto;
          max-width: 220px;
          object-fit: contain;
          display: block;
        }

        .not-found-logo-text {
          font-family: var(--fable-display, var(--heading-font, "Bricolage Grotesque", sans-serif));
          font-size: 26px;
          font-weight: 800;
          color: var(--heading-color, var(--theme-dark, #211e30));
          letter-spacing: -0.02em;
        }

        .main-text-group {
          margin: auto 0;
          padding: 10px 0 20px;
        }

        .not-found-badge {
          font-family: var(--font-family, "Instrument Sans", sans-serif);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          color: var(--primary-color, #e03c33);
          background: linear-gradient(135deg, rgba(224, 60, 51, 0.1) 0%, rgba(224, 60, 51, 0.04) 100%);
          border: 1px solid rgba(224, 60, 51, 0.2);
          padding: 5px 14px;
          border-radius: 999px;
          margin-bottom: 16px;
        }

        .badge-ping-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--primary-color, #e03c33);
          display: inline-block;
          position: relative;
        }

        .badge-ping-dot::after {
          content: "";
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 1.5px solid var(--primary-color, #e03c33);
          animation: pingBadge 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes pingBadge {
          0% { transform: scale(0.8); opacity: 1; }
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }

        .not-found-title {
          font-family: var(--fable-display, var(--heading-font, "Bricolage Grotesque", "Instrument Sans", sans-serif));
          font-size: clamp(40px, 4.8vw, 56px);
          font-weight: var(--heading-font-weight, 750);
          color: var(--heading-color, var(--theme-dark, #211e30));
          line-height: 1.08;
          margin: 0 0 18px 0;
          letter-spacing: -0.025em;
        }

        .not-found-desc {
          font-family: var(--font-family, "Instrument Sans", system-ui, sans-serif);
          font-size: clamp(15px, 1.8vw, 16.5px);
          color: var(--muted-text-color, #64748b);
          line-height: 1.65;
          margin: 0 0 32px 0;
          max-width: 440px;
          font-weight: 450;
        }

        /* Magic UI Shimmer Button */
        .btn-shimmer-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 9999px;
          padding: 1.5px;
          background: transparent;
          cursor: pointer;
          text-decoration: none !important;
          isolation: isolate;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .btn-shimmer-wrap:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(168, 45, 45, 0.32);
        }

        .btn-shimmer-wrap:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        }

        /* Rotating Shimmer Light Beam (MagicUI Shimmer Effect) */
        .btn-shimmer-spinner {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 300%;
          height: 300%;
          transform: translate(-50%, -50%);
          background: conic-gradient(
            from 0deg at 50% 50%,
            transparent 0deg,
            transparent 280deg,
            rgba(255, 255, 255, 0.4) 330deg,
            rgba(255, 255, 255, 1) 360deg
          );
          animation: shimmerSpin 3.5s linear infinite;
          pointer-events: none;
          z-index: 0;
        }

        @keyframes shimmerSpin {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        /* Inner Button Surface */
        .btn-shimmer-content {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 44px;
          padding: 0 26px;
          border-radius: 9999px;
          background: var(--header-donate-bg, #A82D2D);
          color: var(--header-donate-text, #ffffff) !important;
          font-size: 15px;
          font-weight: 600;
          font-family: var(--font-family, "Instrument Sans", sans-serif);
          white-space: nowrap;
          transition: background 0.25s ease, color 0.25s ease;
          overflow: hidden;
        }

        /* Subtle Smooth Shimmer Sheen Across Surface */
        .btn-shimmer-content::after {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.22) 50%,
            transparent 100%
          );
          animation: shimmerSheenSlide 3.5s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes shimmerSheenSlide {
          0%, 35% {
            left: -100%;
          }
          75%, 100% {
            left: 100%;
          }
        }

        .btn-shimmer-wrap:hover .btn-shimmer-content {
          background: var(--header-donate-hover-bg, #8c1c13);
          color: var(--header-donate-hover-text, #ffffff) !important;
        }

        .btn-icon {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .btn-shimmer-wrap:hover .btn-icon {
          transform: translateY(-2px) scale(1.12);
        }

        /* Right Side: Organic Wave Backdrop & 3D Illustration */
        .right-wave-area {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        /* Smooth Fluid Organic S-Curve Wave Backdrop (Exact Reference Style) */
        .wave-backdrop-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          pointer-events: none;
          z-index: 1;
        }

        /* Large Left Border Reveal Animation (Center to Top & Center to Bottom) */
        .band-mask-stroke-top {
          stroke-dasharray: 600;
          stroke-dashoffset: 600;
          animation: revealBandTop 8.0s cubic-bezier(0.25, 1, 0.5, 1) 0.2s forwards;
        }

        .band-mask-stroke-bottom {
          stroke-dasharray: 600;
          stroke-dashoffset: 600;
          animation: revealBandBottom 8.0s cubic-bezier(0.25, 1, 0.5, 1) 0.2s forwards;
        }

        @keyframes revealBandTop {
          0% {
            stroke-dashoffset: 600;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes revealBandBottom {
          0% {
            stroke-dashoffset: 600;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        .illustration-stage {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 480px;
          height: auto;
          aspect-ratio: 480 / 400;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
        }

        .scene-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        /* Micro-Animations inside 3D Scene */
        .scene-ground-shadow {
          animation: groundShadowPulse 5s ease-in-out infinite alternate;
          transform-origin: 240px 340px;
        }

        @keyframes groundShadowPulse {
          0% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(0.95); opacity: 0.55; }
          100% { transform: scale(1.05); opacity: 0.95; }
        }

        .num-4-left {
          animation: floatNum1 5s ease-in-out infinite alternate;
          transform-origin: 120px 180px;
        }
        .num-0-mid {
          animation: floatNum2 5.5s ease-in-out infinite alternate 0.3s;
          transform-origin: 240px 180px;
        }
        .num-4-right {
          animation: floatNum3 5.2s ease-in-out infinite alternate 0.6s;
          transform-origin: 360px 180px;
        }

        @keyframes floatNum1 {
          0% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(3px); }
        }
        @keyframes floatNum2 {
          0% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(4px); }
        }
        @keyframes floatNum3 {
          0% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(3px); }
        }

        .char-top {
          animation: charTopBob 4.5s ease-in-out infinite;
          transform-origin: 140px 90px;
        }
        .telescope-arm {
          animation: lookAroundScene 4.5s ease-in-out infinite;
          transform-origin: 145px 85px;
        }

        @keyframes charTopBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes lookAroundScene {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }

        .lens-beam {
          animation: lensBeamPulse 2.4s ease-in-out infinite;
          transform-origin: 180px 75px;
        }

        @keyframes lensBeamPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.3); }
        }

        .char-ladder {
          animation: ladderClimb 3.5s ease-in-out infinite alternate;
          transform-origin: 235px 230px;
        }

        @keyframes ladderClimb {
          0% { transform: translateY(0); }
          50% { transform: translateY(-6px) rotate(-1deg); }
          100% { transform: translateY(3px) rotate(1deg); }
        }

        .char-search {
          animation: searchMove 4s ease-in-out infinite;
          transform-origin: 360px 290px;
        }
        .magnifier-group {
          animation: magnifySweep 3s ease-in-out infinite alternate;
          transform-origin: 335px 275px;
        }

        @keyframes searchMove {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        @keyframes magnifySweep {
          0% { transform: rotate(-12deg); }
          100% { transform: rotate(14deg); }
        }

        /* Floating Plus / Question Badges (Exact Reference Accents) */
        .floating-badge-1 {
          animation: badgeFloat1 3.5s ease-in-out infinite;
          transform-origin: 100px 80px;
        }
        .floating-badge-2 {
          animation: badgeFloat2 4s ease-in-out infinite 0.5s;
          transform-origin: 410px 110px;
        }
        .floating-badge-3 {
          animation: badgeFloat3 3.8s ease-in-out infinite 1s;
          transform-origin: 430px 280px;
        }

        @keyframes badgeFloat1 {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          50% { transform: translateY(-8px) rotate(-5deg) scale(1.1); }
        }
        @keyframes badgeFloat2 {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          50% { transform: translateY(-10px) rotate(6deg) scale(1.12); }
        }
        @keyframes badgeFloat3 {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          50% { transform: translateY(-7px) rotate(-8deg) scale(1.08); }
        }

        /* Sparkles */
        .sparkle-scene-1 { animation: sparkleSpin 2.6s ease-in-out infinite; transform-origin: 200px 45px; }
        .sparkle-scene-2 { animation: sparkleSpin 3.2s ease-in-out infinite 0.8s; transform-origin: 320px 240px; }

        @keyframes sparkleSpin {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.45; }
          50% { transform: scale(1.4) rotate(90deg); opacity: 1; }
        }

        /* Responsive */
        @media (max-width: 960px) {
          .not-found-split-layout {
            grid-template-columns: 1fr;
          }
          .left-content-area {
            padding: 36px 28px 24px;
            align-items: center;
            text-align: center;
          }
          .not-found-desc {
            margin: 0 auto 28px;
          }
          .right-wave-area {
            min-height: 380px;
          }
        }

        @media (max-width: 640px) {
          .not-found-page {
            padding: 16px;
          }
          .not-found-card-frame {
            border-radius: 20px;
          }
          .left-content-area {
            padding: 28px 20px 20px;
          }
          .not-found-title {
            font-size: 32px;
          }
          .btn-home-cta {
            width: 100%;
            padding: 13px 24px;
          }
          .right-wave-area {
            min-height: 300px;
          }
          .illustration-stage {
            max-width: 320px;
          }
        }
      `}</style>

      {/* Ambient Glowing Background Orbs */}
      <div className="ambient-orb orb-1" />
      <div className="ambient-orb orb-2" />

      {/* Interactive Background Canvas */}
      <NotFoundCanvas />

      {/* Center Modern Showcase Card with Organic S-Curve Wave */}
      <div className="not-found-card-frame">
        <div className="not-found-split-layout">

          {/* Left Column: Brand Logo, Headline, Description, CTA */}
          <div className="left-content-area">
            {/* Top-Left Desktop Logo */}
            <div className="logo-header-wrap">
              <Link
                href={logoUrl || "/"}
                className="not-found-logo-link"
                target={logoTarget === "_blank" ? "_blank" : undefined}
                rel={logoTarget === "_blank" ? "noopener noreferrer" : undefined}
                aria-label={`${siteTitle} Home`}
              >
                {logoType === "image" && logoImage ? (
                  <img
                    src={logoImage}
                    alt={siteTitle || "MESCO Trust"}
                    className="not-found-logo-img"
                  />
                ) : (
                  <span className="not-found-logo-text">{siteTitle || "MESCO"}</span>
                )}
              </Link>
            </div>

            {/* Main Center Message */}
            <div className="main-text-group">
              <div className="not-found-badge">
                <span className="badge-ping-dot" />
                404 ERROR
              </div>

              <h1 className="not-found-title">
                Oops! <br />
                Page Not Found
              </h1>

              <p className="not-found-desc">
                Sorry, we couldn&apos;t find the page you were looking for. It may have been moved, renamed, or is temporarily unavailable.
              </p>

              <div>
                <Link href="/" className="btn-shimmer-wrap">
                  <span className="btn-shimmer-spinner" aria-hidden="true" />
                  <span className="btn-shimmer-content">
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
                  </span>
                </Link>
              </div>
            </div>

            <div />
          </div>

          {/* Right Column: Organic S-Wave Backdrop + 3D 404 Scene */}
          <div className="right-wave-area">
            {/* Fluid Organic S-Curve Wave Background (Exact Reference Style) */}
            <svg
              className="wave-backdrop-svg"
              viewBox="0 0 540 580"
              preserveAspectRatio="none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="main-wave-grad" x1="0" y1="0" x2="540" y2="580" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2A263D" />
                  <stop offset="0.55" stopColor="#211E30" />
                  <stop offset="1" stopColor="#171422" />
                </linearGradient>
                <linearGradient id="sub-wave-grad" x1="0" y1="0" x2="540" y2="580" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#211E30" stopOpacity="0.14" />
                  <stop offset="0.5" stopColor="#211E30" stopOpacity="0.22" />
                  <stop offset="1" stopColor="#211E30" stopOpacity="0.12" />
                </linearGradient>

                {/* Mask that reveals the Large Border from Center to Top & Center to Bottom */}
                <mask id="large-border-reveal-mask">
                  <rect x="0" y="0" width="540" height="580" fill="black" />
                  <path
                    d="M80 320 C20 220 60 120 120 0"
                    fill="none"
                    stroke="white"
                    strokeWidth="180"
                    strokeLinecap="round"
                    className="band-mask-stroke-top"
                  />
                  <path
                    d="M80 320 C140 420 100 500 40 580"
                    fill="none"
                    stroke="white"
                    strokeWidth="180"
                    strokeLinecap="round"
                    className="band-mask-stroke-bottom"
                  />
                </mask>
              </defs>

              {/* Large Left Border (Sub Secondary Wave) Animated with center-to-out reveal mask */}
              <path
                d="M120 0 C60 120 20 220 80 320 C140 420 100 500 40 580 H540 V0 H120 Z"
                fill="url(#sub-wave-grad)"
                mask="url(#large-border-reveal-mask)"
              />

              {/* Main Fluid Dark Blue S-Curve Wave */}
              <path
                d="M160 0 C90 120 40 210 110 310 C180 410 150 490 80 580 H540 V0 H160 Z"
                fill="url(#main-wave-grad)"
              />
            </svg>

            {/* 3D Isometric 404 Illustration on Wave */}
            <div className="illustration-stage">
              <svg
                className="scene-svg"
                viewBox="0 0 480 380"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Gradients for 3D Numerals on Blue Wave */}
                  <linearGradient id="num4w-front" x1="60" y1="80" x2="160" y2="280" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFFFFF" />
                    <stop offset="0.8" stopColor="#F8FAFC" />
                    <stop offset="1" stopColor="#E2E8F0" />
                  </linearGradient>
                  <linearGradient id="num4w-side" x1="60" y1="80" x2="170" y2="290" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#94A3B8" />
                    <stop offset="1" stopColor="#64748B" />
                  </linearGradient>
                  <linearGradient id="num4w-top" x1="60" y1="80" x2="160" y2="100" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFFFFF" />
                    <stop offset="1" stopColor="#F1F5F9" />
                  </linearGradient>

                  <linearGradient id="num0w-front" x1="180" y1="90" x2="300" y2="290" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFFFFF" />
                    <stop offset="0.75" stopColor="#F8FAFC" />
                    <stop offset="1" stopColor="#CBD5E1" />
                  </linearGradient>
                  <linearGradient id="num0w-side" x1="180" y1="90" x2="310" y2="300" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#94A3B8" />
                    <stop offset="1" stopColor="#475569" />
                  </linearGradient>
                  <linearGradient id="num0w-top" x1="180" y1="90" x2="300" y2="110" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFFFFF" />
                    <stop offset="1" stopColor="#E2E8F0" />
                  </linearGradient>
                </defs>

                {/* Ground Soft Shadow on Wave */}
                <ellipse className="scene-ground-shadow" cx="240" cy="335" rx="190" ry="24" fill="rgba(15, 23, 42, 0.28)" />

                {/* === LEFT 3D "4" === */}
                <g className="num-4-left">
                  <ellipse cx="115" cy="320" rx="45" ry="10" fill="rgba(15, 23, 42, 0.25)" />
                  {/* 3D Side */}
                  <path
                    d="M130 95 L145 80 L145 235 L160 235 L160 270 L145 270 L145 295 L125 310 L125 285 L85 285 L60 215 L75 200 L105 200 L130 200 Z"
                    fill="url(#num4w-side)"
                  />
                  {/* 3D Top */}
                  <path d="M105 95 L130 95 L145 80 L120 80 Z" fill="url(#num4w-top)" />
                  <path d="M60 215 L80 145 L105 95 L120 80 L95 130 L75 200 Z" fill="url(#num4w-top)" />
                  {/* Front Face */}
                  <path
                    d="M105 95 H130 V250 H155 V285 H130 V310 H100 V285 H60 L105 95 Z M100 250 V165 L76 250 H100 Z"
                    fill="url(#num4w-front)"
                  />
                </g>

                {/* === MIDDLE 3D "0" === */}
                <g className="num-0-mid">
                  <ellipse cx="240" cy="326" rx="55" ry="12" fill="rgba(15, 23, 42, 0.3)" />
                  {/* 3D Outer Side */}
                  <path
                    d="M275 105 C295 125 305 160 305 205 C305 250 295 285 275 305 L290 290 C310 270 320 235 320 190 C320 145 310 110 290 90 L275 105 Z"
                    fill="url(#num0w-side)"
                  />
                  {/* 3D Top */}
                  <path
                    d="M240 105 C265 105 285 120 290 90 C265 75 215 75 190 90 C195 120 215 105 240 105 Z"
                    fill="url(#num0w-top)"
                  />
                  {/* Front Face of 0 */}
                  <path
                    d="M240 105 C275 105 295 135 295 205 C295 275 275 305 240 305 C205 305 185 275 185 205 C185 135 205 105 240 105 Z M240 140 C225 140 215 158 215 205 C215 252 225 270 240 270 C255 270 265 252 265 205 C265 158 255 140 240 140 Z"
                    fill="url(#num0w-front)"
                  />
                  {/* Inner 3D Wall */}
                  <path
                    d="M215 205 C215 158 225 140 240 140 L250 130 C235 130 220 148 220 195 C220 242 230 260 245 260 L240 270 C225 270 215 252 215 205 Z"
                    fill="url(#num0w-side)"
                  />
                </g>

                {/* === RIGHT 3D "4" === */}
                <g className="num-4-right">
                  <ellipse cx="370" cy="320" rx="45" ry="10" fill="rgba(15, 23, 42, 0.25)" />
                  {/* 3D Side */}
                  <path
                    d="M385 95 L400 80 L400 235 L415 235 L415 270 L400 270 L400 295 L380 310 L380 285 L340 285 L315 215 L330 200 L360 200 L385 200 Z"
                    fill="url(#num4w-side)"
                  />
                  {/* 3D Top */}
                  <path d="M360 95 L385 95 L400 80 L375 80 Z" fill="url(#num4w-top)" />
                  <path d="M315 215 L335 145 L360 95 L375 80 L350 130 L330 200 Z" fill="url(#num4w-top)" />
                  {/* Front Face */}
                  <path
                    d="M360 95 H385 V250 H410 V285 H385 V310 H355 V285 H315 L360 95 Z M355 250 V165 L331 250 H355 Z"
                    fill="url(#num4w-front)"
                  />
                </g>

                {/* Ladder on "0" */}
                <g className="ladder-group">
                  <line x1="220" y1="170" x2="200" y2="320" stroke="#CBD5E1" strokeWidth="4.5" strokeLinecap="round" />
                  <line x1="245" y1="170" x2="225" y2="320" stroke="#CBD5E1" strokeWidth="4.5" strokeLinecap="round" />
                  <line x1="217" y1="190" x2="242" y2="190" stroke="#94A3B8" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="213" y1="218" x2="238" y2="218" stroke="#94A3B8" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="209" y1="246" x2="234" y2="246" stroke="#94A3B8" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="205" y1="274" x2="230" y2="274" stroke="#94A3B8" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="201" y1="302" x2="226" y2="302" stroke="#94A3B8" strokeWidth="3.5" strokeLinecap="round" />
                </g>

                {/* Character 1 on Top with Telescope */}
                <g className="char-top">
                  <ellipse cx="120" cy="80" rx="14" ry="10" fill="#EF4444" />
                  <path d="M112 84 L110 96" stroke="#7F1D1D" strokeWidth="4" strokeLinecap="round" />
                  <path d="M125 84 L128 96" stroke="#7F1D1D" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="120" cy="66" r="8" fill="#FDE68A" />
                  <path d="M113 64 C113 58 127 58 127 64 Z" fill="#1E293B" />
                  <g className="telescope-arm">
                    <path d="M123 74 L142 66" stroke="#FDE68A" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M136 70 L168 56" stroke="#1E293B" strokeWidth="6" strokeLinecap="round" />
                    <path d="M162 58 L176 52" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" />
                    <circle cx="176" cy="52" r="4.5" fill="#60A5FA" />
                    <circle className="lens-beam" cx="176" cy="52" r="8" fill="rgba(96, 165, 250, 0.4)" />
                  </g>
                </g>

                {/* Character 2 on Ladder */}
                <g className="char-ladder">
                  <ellipse cx="218" cy="225" rx="11" ry="8" fill="#10B981" />
                  <circle cx="218" cy="212" r="7" fill="#FDE68A" />
                  <path d="M212 210 C212 205 224 205 224 210 Z" fill="#78350F" />
                  <path d="M212 222 L206 218" stroke="#FDE68A" strokeWidth="3" strokeLinecap="round" />
                  <path d="M224 222 L230 218" stroke="#FDE68A" strokeWidth="3" strokeLinecap="round" />
                  <path d="M214 230 L212 244" stroke="#064E3B" strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M222 230 L226 244" stroke="#064E3B" strokeWidth="3.5" strokeLinecap="round" />
                </g>

                {/* Character 3 Searching with Magnifier */}
                <g className="char-search">
                  <ellipse cx="340" cy="334" rx="16" ry="5" fill="rgba(15, 23, 42, 0.3)" />
                  <ellipse cx="340" cy="298" rx="12" ry="16" fill="#F59E0B" />
                  <path d="M336 312 L334 330" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
                  <path d="M344 312 L346 330" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="334" cy="278" r="8" fill="#FDE68A" />
                  <path d="M327 274 C327 268 341 268 341 274 Z" fill="#1E293B" />
                  <g className="magnifier-group">
                    <path d="M336 292 L320 285" stroke="#FDE68A" strokeWidth="3.5" strokeLinecap="round" />
                    <line x1="320" y1="285" x2="305" y2="278" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="300" cy="275" r="11" stroke="#EF4444" strokeWidth="3" fill="rgba(253, 230, 138, 0.35)" />
                  </g>
                </g>

                {/* Floating Plus & Question Accent Badges (Exact Reference Style) */}
                <g className="floating-badge-1">
                  <circle cx="75" cy="75" r="16" fill="#EF4444" filter="drop-shadow(0 4px 12px rgba(239, 68, 68, 0.4))" />
                  <path d="M68 75 H82 M75 68 V82" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
                </g>

                <g className="floating-badge-2">
                  <circle cx="415" cy="105" r="16" fill="#EF4444" filter="drop-shadow(0 4px 12px rgba(239, 68, 68, 0.4))" />
                  <path d="M408 105 H422 M415 98 V112" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
                </g>

                <g className="floating-badge-3">
                  <circle cx="430" cy="280" r="15" fill="#EF4444" filter="drop-shadow(0 4px 12px rgba(239, 68, 68, 0.4))" />
                  <path d="M424 280 H436 M430 274 V286" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
                </g>

                {/* Floating Sparkles */}
                <g className="sparkle-scene-1">
                  <path d="M200 38 L202 43 L207 45 L202 47 L200 52 L198 47 L193 45 L198 43 Z" fill="#FDE68A" />
                </g>
                <g className="sparkle-scene-2">
                  <path d="M320 234 L322 238 L326 240 L322 242 L320 246 L318 242 L314 240 L318 238 Z" fill="#FFFFFF" />
                </g>
              </svg>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
