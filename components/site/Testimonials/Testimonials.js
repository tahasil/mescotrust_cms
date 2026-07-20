"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRightOutlined } from "@ant-design/icons";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";

gsap.registerPlugin(ScrollTrigger);

const QuoteSection = styled.div`
  width: 100%; text-align: center; color: var(--q-ink); font-family: "Instrument Sans",system-ui,sans-serif;
  .qSubTitle { margin: 0 0 30px; color: var(--q-subtitle); font-size: 13px; font-weight: 650; letter-spacing: .16em; line-height: 1.4; text-transform: uppercase; }
  .qSlider { position: relative; max-width: 900px; margin: 0 auto; }
  .qMark { display: block; color: var(--q-mark); font-family: "Bricolage Grotesque",system-ui,sans-serif; font-weight: 700; font-size: 76px; line-height: .55; margin-bottom: 30px; }
  .qSlide { animation: qfade var(--q-duration) cubic-bezier(.16,1,.3,1); }
  .qQuote { margin: 0 0 30px; color: var(--q-quote); font-family: "Bricolage Grotesque",system-ui,sans-serif; font-weight: 480; font-size: clamp(23px,2.8vw,38px); line-height: 1.3; letter-spacing: -.015em; }
  .qWho strong { display: block; color: var(--q-name); font-size: 16.5px; }
  .qWho span { display: block; color: var(--q-role); font-size: 14.5px; }
  .qDots { display: flex; gap: 9px; justify-content: center; margin-top: 34px; }
  .qDot { width: 9px; height: 9px; border-radius: 50%; border: 0; padding: 0; background: var(--q-dot); cursor: pointer; transition: background .25s,transform .25s; }
  .qDot.is-active { background: var(--q-dot-active); transform: scale(1.25); }
  .qAll { display: inline-flex; align-items: center; gap: 9px; margin-top: 30px; padding-bottom: 5px; border-bottom: 1px solid currentColor; color: var(--q-link); font-size: 14px; font-weight: 650; text-decoration: none; }
  .qAll svg { transition: transform .3s cubic-bezier(.16,1,.3,1); }
  .qAll:hover svg { transform: translateX(4px); }
  @keyframes qfade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .qSlide { animation: none; } }
`;

const text = (v) => v == null ? "" : String(v).trim();
const num = (v,f) => Number.isFinite(Number(v)) ? Number(v) : f;
const color = (v,f) => text(v) ? getColor(text(v)) : f;
function backgrounds(props) {
  const type = text(props?.testimonialsSectionBgType || "default"), image = text(props?.testimonialsSectionBgImage), key = text(props?.testimonialsSectionBgColorKey);
  const sectionBgClassName = type === "default" ? "defaultBackground" : undefined;
  const sectionBgStyle = { ...(type === "image" && image ? { backgroundImage:`url(${image})`,backgroundSize:"cover",backgroundPosition:"center",backgroundRepeat:"no-repeat" } : type === "color" && key ? { backgroundColor:getColor(key),backgroundImage:"none" } : {}), ...Object.fromEntries([["paddingTop",props?.testimonialsSectionPaddingTop],["paddingBottom",props?.testimonialsSectionPaddingBottom],["marginTop",props?.testimonialsSectionMarginTop],["marginBottom",props?.testimonialsSectionMarginBottom]].filter(([,v])=>v!==""&&v!=null&&num(v,-1)>=0).map(([k,v])=>[k,`${num(v,0)}px`])) };
  const ctype=text(props?.testimonialsPageContainerBgType||"default"),cimage=text(props?.testimonialsPageContainerBgImage),ckey=text(props?.testimonialsPageContainerBgColorKey);
  const pageContainerBgStyle={...(ctype==="image"&&cimage?{backgroundImage:`url(${cimage})`,backgroundSize:"cover",backgroundPosition:"center",backgroundRepeat:"no-repeat"}:ctype==="color"&&ckey?{backgroundColor:getColor(ckey),backgroundImage:"none"}:{}),...Object.fromEntries([["paddingTop",props?.testimonialsPageContainerPaddingTop],["paddingRight",props?.testimonialsPageContainerPaddingRight],["paddingBottom",props?.testimonialsPageContainerPaddingBottom],["paddingLeft",props?.testimonialsPageContainerPaddingLeft],["marginTop",props?.testimonialsPageContainerMarginTop],["marginBottom",props?.testimonialsPageContainerMarginBottom]].filter(([,v])=>v!==""&&v!=null&&num(v,-1)>=0).map(([k,v])=>[k,`${num(v,0)}px`]))};
  return {sectionBgClassName,sectionBgStyle,pageContainerBgStyle};
}

export default function Testimonials(props) {
  const rootRef=useRef(null); const pathname=usePathname(); const isEditor=pathname?.startsWith("/admin")===true;
  const items = Array.isArray(props?.testimonialsItems) ? props.testimonialsItems : [];
  const [active,setActive] = useState(0);
  const autoplay = props?.testimonialsAutoplay !== false;
  const delay = Math.max(1000,num(props?.testimonialsAutoplaySpeed,6500));
  useEffect(() => { setActive((v)=>items.length ? Math.min(v,items.length-1) : 0); },[items.length]);
  useEffect(() => { if(!autoplay||items.length<2||typeof window==="undefined"||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return; const timer=window.setInterval(()=>setActive((v)=>(v+1)%items.length),delay); return()=>window.clearInterval(timer); },[autoplay,delay,items.length]);
  useLayoutEffect(()=>{if(isEditor||!rootRef.current||props?.testimonialsRevealEnabled===false||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const targets=rootRef.current.querySelectorAll(".qReveal");const context=gsap.context(()=>ScrollTrigger.batch(targets,{start:text(props?.testimonialsRevealStart)||"top 86%",once:true,onEnter:(els)=>gsap.fromTo(els,{autoAlpha:0,y:num(props?.testimonialsRevealDistance,30)},{autoAlpha:1,y:0,duration:num(props?.testimonialsRevealDuration,.9),stagger:.08,ease:"power3.out",overwrite:true})}),rootRef);return()=>context.revert();},[isEditor,items,props]);
  const item=items[active]; const {sectionBgClassName,sectionBgStyle,pageContainerBgStyle}=backgrounds(props); const target=text(props?.testimonialsViewAllTarget)||"_self";
  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <QuoteSection ref={rootRef} style={{"--q-ink":color(props?.testimonialsTitleColorKey,"#2A283E"),"--q-subtitle":color(props?.testimonialsTitleColorKey,"#E03C33"),"--q-mark":color(props?.testimonialsQuoteMarkColorKey,"#E03C33"),"--q-quote":color(props?.testimonialsQuoteColorKey,"#2A283E"),"--q-name":color(props?.testimonialsNameColorKey,"#2A283E"),"--q-role":color(props?.testimonialsRoleColorKey,"rgba(42,40,62,.55)"),"--q-dot":color(props?.testimonialsDotColorKey,"rgba(42,40,62,.18)"),"--q-dot-active":color(props?.testimonialsDotActiveColorKey,"#E03C33"),"--q-link":color(props?.testimonialsLinkColorKey,"#2A283E"),"--q-duration":`${num(props?.testimonialsSpeed,650)/1000}s`}}>
          {props?.testimonialsTitleEnabled !== false && text(props?.testimonialsTitle) ? <p className="qSubTitle qReveal">{text(props.testimonialsTitle)}</p> : null}
          {item ? <div className="qSlider qReveal"><span className="qMark" aria-hidden="true">“</span><figure className="qSlide" key={active}><p className="qQuote">{text(item?.quote)}</p><figcaption className="qWho"><strong>{text(item?.name)}</strong><span>{text(item?.title)}</span></figcaption></figure>{props?.testimonialsShowDots !== false&&items.length>1?<div className="qDots" role="tablist" aria-label={text(props?.testimonialsDotsLabel)||"Choose testimonial"}>{items.map((entry,index)=><button type="button" role="tab" aria-selected={index===active} aria-label={`${text(props?.testimonialsDotLabel)||"Show testimonial"} ${index+1}`} className={`qDot${index===active?" is-active":""}`} onClick={()=>setActive(index)} key={`${text(entry?.name)}-${index}`} />)}</div>:null}</div>:null}
          {text(props?.testimonialsViewAllLabel)&&text(props?.testimonialsViewAllUrl)?<a className="qAll qReveal" href={text(props.testimonialsViewAllUrl)} target={target} rel={target==="_blank"?"noopener noreferrer":undefined}>{text(props.testimonialsViewAllLabel)} <ArrowRightOutlined aria-hidden="true" /></a>:null}
        </QuoteSection>
      </PageContainer>
    </FullWidthBackground>
  );
}
