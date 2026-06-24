import styled from "styled-components";

const SLIDER_SIZE_PRESETS = {
  legacy: {
    xs: { cardW: 180, cardH: 225, originY: 1400 },
    sm: { cardW: 220, cardH: 275, originY: 1800 },
    md: { cardW: 280, cardH: 350, originY: 2200 },
    lg: { cardW: 350, cardH: 438, originY: 2500 },
  },
  portrait350x450: {
    xs: { cardW: 180, cardH: 231, originY: 1400 },
    sm: { cardW: 220, cardH: 283, originY: 1800 },
    md: { cardW: 280, cardH: 360, originY: 2200 },
    lg: { cardW: 350, cardH: 450, originY: 2500 },
  },
};

function getPreset(props) {
  const presetKey = String(props?.$sizePreset || "legacy").trim();
  return SLIDER_SIZE_PRESETS[presetKey] || SLIDER_SIZE_PRESETS.legacy;
}

function getBreakpointSize(props, breakpoint) {
  return getPreset(props)[breakpoint] || getPreset(props).xs;
}

export const SliderContainer = styled.section`
  width: 100%;
  position: relative;
  /* margin-top: -60px; */
  overflow: hidden;
  min-height: calc(100vh + 100px);
  @media (max-width: 576px) {
    margin-top: -150px;
    min-height: calc(80vh + 10px);
  }
  @media (min-width: 768px) {
    min-height: calc(76vh + 100px);
  }
  @media (min-width: 992px) {
    /* margin-top: -80px; */
    min-height: calc(100vh + 60px);
  }
`;

export const SliderCarousel = styled.div`
  position: absolute;
  left: ${(props) => {
    const xs = getBreakpointSize(props, "xs");
    return `calc(50% - ${xs.cardW / 2}px)`;
  }};
  top: ${(props) => {
    const xs = getBreakpointSize(props, "xs");
    return `calc((100vh - ${xs.cardH}px) / 2)`;
  }};
  transform-origin: ${(props) => {
    const xs = getBreakpointSize(props, "xs");
    return `${xs.cardW / 2}px ${xs.originY}px`;
  }};
  will-change: transform;
  cursor: grab;
  &:active {
    cursor: grabbing;
  }
  @media (min-width: 576px) {
    left: ${(props) => {
      const sm = getBreakpointSize(props, "sm");
      return `calc(50% - ${sm.cardW / 2}px)`;
    }};
    top: ${(props) => {
      const sm = getBreakpointSize(props, "sm");
      return `calc((100vh - ${sm.cardH}px) / 2)`;
    }};
    transform-origin: ${(props) => {
      const sm = getBreakpointSize(props, "sm");
      return `${sm.cardW / 2}px ${sm.originY}px`;
    }};
  }
  @media (min-width: 768px) {
    left: ${(props) => {
      const md = getBreakpointSize(props, "md");
      return `calc(50% - ${md.cardW / 2}px)`;
    }};
    top: ${(props) => {
      const md = getBreakpointSize(props, "md");
      return `calc((100vh - ${md.cardH}px) / 2)`;
    }};
    transform-origin: ${(props) => {
      const md = getBreakpointSize(props, "md");
      return `${md.cardW / 2}px ${md.originY}px`;
    }};
  }
  @media (min-width: 992px) {
    left: ${(props) => {
      const lg = getBreakpointSize(props, "lg");
      return `calc(50% - ${lg.cardW / 2}px)`;
    }};
    top: ${(props) => {
      const lg = getBreakpointSize(props, "lg");
      return `calc((100vh - ${lg.cardH}px) / 2)`;
    }};
    transform-origin: ${(props) => {
      const lg = getBreakpointSize(props, "lg");
      return `${lg.cardW / 2}px ${lg.originY}px`;
    }};
  }
`;

export const SliderWrapper = styled.div`
  position: absolute;
  height: 100vh;
  transform-origin: ${(props) => {
    const xs = getBreakpointSize(props, "xs");
    return `${xs.cardW / 2}px ${xs.originY}px`;
  }};
  transform: rotate(${(props) => props.$rotation ?? 0}deg);
  pointer-events: none;
  @media (min-width: 576px) {
    transform-origin: ${(props) => {
      const sm = getBreakpointSize(props, "sm");
      return `${sm.cardW / 2}px ${sm.originY}px`;
    }};
  }
  @media (min-width: 768px) {
    transform-origin: ${(props) => {
      const md = getBreakpointSize(props, "md");
      return `${md.cardW / 2}px ${md.originY}px`;
    }};
  }
  @media (min-width: 992px) {
    transform-origin: ${(props) => {
      const lg = getBreakpointSize(props, "lg");
      return `${lg.cardW / 2}px ${lg.originY}px`;
    }};
  }
`;

export const SliderSlide = styled.div`
  width: ${(props) => `${getBreakpointSize(props, "xs").cardW}px`};
  height: ${(props) => `${getBreakpointSize(props, "xs").cardH}px`};
  border-radius: 5px;
  overflow: hidden;
  background: transparent;
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: ${(props) => props.$imageFit || "cover"};
    object-position: center center;
  }
  @media (min-width: 576px) {
    width: ${(props) => `${getBreakpointSize(props, "sm").cardW}px`};
    height: ${(props) => `${getBreakpointSize(props, "sm").cardH}px`};
  }
  @media (min-width: 768px) {
    width: ${(props) => `${getBreakpointSize(props, "md").cardW}px`};
    height: ${(props) => `${getBreakpointSize(props, "md").cardH}px`};
  }
  @media (min-width: 992px) {
    width: ${(props) => `${getBreakpointSize(props, "lg").cardW}px`};
    height: ${(props) => `${getBreakpointSize(props, "lg").cardH}px`};
  }
`;
