import styled from "styled-components";

const SLIDER_BP = {
  xs: { cardW: 180, cardH: 225, originY: 1400 },
  sm: { cardW: 220, cardH: 275, originY: 1800 },
  md: { cardW: 280, cardH: 350, originY: 2200 },
  lg: { cardW: 350, cardH: 438, originY: 2500 },
};

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
  left: calc(50% - ${SLIDER_BP.xs.cardW / 2}px);
  top: calc((100vh - ${SLIDER_BP.xs.cardH}px) / 2);
  transform-origin: ${SLIDER_BP.xs.cardW / 2}px ${SLIDER_BP.xs.originY}px;
  will-change: transform;
  cursor: grab;
  &:active {
    cursor: grabbing;
  }
  @media (min-width: 576px) {
    left: calc(50% - ${SLIDER_BP.sm.cardW / 2}px);
    top: calc((100vh - ${SLIDER_BP.sm.cardH}px) / 2);
    transform-origin: ${SLIDER_BP.sm.cardW / 2}px ${SLIDER_BP.sm.originY}px;
  }
  @media (min-width: 768px) {
    left: calc(50% - ${SLIDER_BP.md.cardW / 2}px);
    top: calc((100vh - ${SLIDER_BP.md.cardH}px) / 2);
    transform-origin: ${SLIDER_BP.md.cardW / 2}px ${SLIDER_BP.md.originY}px;
  }
  @media (min-width: 992px) {
    left: calc(50% - ${SLIDER_BP.lg.cardW / 2}px);
    top: calc((100vh - ${SLIDER_BP.lg.cardH}px) / 2);
    transform-origin: ${SLIDER_BP.lg.cardW / 2}px ${SLIDER_BP.lg.originY}px;
  }
`;

export const SliderWrapper = styled.div`
  position: absolute;
  height: 100vh;
  transform-origin: ${SLIDER_BP.xs.cardW / 2}px ${SLIDER_BP.xs.originY}px;
  transform: rotate(${(props) => props.$rotation ?? 0}deg);
  pointer-events: none;
  @media (min-width: 576px) {
    transform-origin: ${SLIDER_BP.sm.cardW / 2}px ${SLIDER_BP.sm.originY}px;
  }
  @media (min-width: 768px) {
    transform-origin: ${SLIDER_BP.md.cardW / 2}px ${SLIDER_BP.md.originY}px;
  }
  @media (min-width: 992px) {
    transform-origin: ${SLIDER_BP.lg.cardW / 2}px ${SLIDER_BP.lg.originY}px;
  }
`;

export const SliderSlide = styled.div`
  width: ${SLIDER_BP.xs.cardW}px;
  height: ${SLIDER_BP.xs.cardH}px;
  border-radius: 5px;
  overflow: hidden;
  background: transparent;
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  @media (min-width: 576px) {
    width: ${SLIDER_BP.sm.cardW}px;
    height: ${SLIDER_BP.sm.cardH}px;
  }
  @media (min-width: 768px) {
    width: ${SLIDER_BP.md.cardW}px;
    height: ${SLIDER_BP.md.cardH}px;
  }
  @media (min-width: 992px) {
    width: ${SLIDER_BP.lg.cardW}px;
    height: ${SLIDER_BP.lg.cardH}px;
  }
`;
