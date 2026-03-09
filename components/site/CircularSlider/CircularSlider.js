"use client";

import { useEffect, useRef, useId } from "react";
import {
  SliderContainer,
  SliderCarousel,
  SliderWrapper,
  SliderSlide,
} from "./CircularSliderStyle";

const DEFAULTS = {
  slideCount: 37,
  autoInterval: 4000,
  stepDeg: 10,
  duration: 0.6,
};

export default function CircularSlider({
  images = [],
  slideCount = DEFAULTS.slideCount,
  autoInterval = DEFAULTS.autoInterval,
  stepDeg = DEFAULTS.stepDeg,
  duration = DEFAULTS.duration,
}) {
  const uid = useId().replace(/:/g, "");
  const className = `circular-slider-${uid}`;
  const carouselRef = useRef(null);
  const autoIntervalRef = useRef(null);

  useEffect(() => {
    if (!images.length) return;
    let cleanup = () => {};

    const tryInit = () => {
      if (typeof window === "undefined" || !carouselRef.current) return false;
      if (!window.Draggable || !window.InertiaPlugin) return false;
      if (window.gsap && window.InertiaPlugin) {
        window.gsap.registerPlugin(window.InertiaPlugin);
      }
      const gsap = window.gsap;
      const Draggable = window.Draggable;
      const el = carouselRef.current;

      const startAutoRotate = () => {
        if (autoIntervalRef.current) return;
        autoIntervalRef.current = setInterval(() => {
          if (el && gsap) {
            gsap.to(el, {
              rotation: `-=${stepDeg}`,
              duration,
              ease: "power2.inOut",
            });
          }
        }, autoInterval);
      };

      const stopAutoRotate = () => {
        if (autoIntervalRef.current) {
          clearInterval(autoIntervalRef.current);
          autoIntervalRef.current = null;
        }
      };

      const instances = Draggable.create(`.${className}`, {
        type: "rotation",
        inertia: true,
        minimumMovement: 0,
        snap: (endValue) => Math.round(endValue / stepDeg) * stepDeg,
        onDragStart: stopAutoRotate,
        onDragEnd: startAutoRotate,
        onThrowComplete: startAutoRotate,
      });

      startAutoRotate();
      cleanup = () => {
        stopAutoRotate();
        instances?.forEach((d) => d.kill());
      };
      return true;
    };

    if (tryInit()) return cleanup;

    const id = setInterval(() => {
      if (tryInit()) clearInterval(id);
    }, 50);
    return () => {
      clearInterval(id);
      cleanup();
    };
  }, [images, autoInterval, stepDeg, duration, className]);

  if (!images.length) return null;

  return (
    <SliderContainer>
      <SliderCarousel
        ref={carouselRef}
        className={className}
        aria-label="Circular image carousel - drag to rotate"
      >
        {Array.from({ length: slideCount }, (_, i) => {
          const slide = images[i % images.length];
          return (
            <SliderWrapper key={i} $rotation={i * stepDeg}>
              <SliderSlide>
                <img className="img-fluid" src={slide.src} alt={slide.alt} />
              </SliderSlide>
            </SliderWrapper>
          );
        })}
      </SliderCarousel>
    </SliderContainer>
  );
}
