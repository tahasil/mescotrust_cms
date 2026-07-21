"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowRightOutlined } from "@ant-design/icons";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname, useRouter } from "next/navigation";
import styled from "styled-components";
import LightGallery from "lightgallery/react";
import lgThumbnail from "lightgallery/plugins/thumbnail";
import lgZoom from "lightgallery/plugins/zoom";
import lgFullscreen from "lightgallery/plugins/fullscreen";
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-thumbnail.css";
import "lightgallery/css/lg-zoom.css";
import "lightgallery/css/lg-fullscreen.css";
import { FullWidthBackground, getColor, PageContainer } from "@/styles/Theme";

gsap.registerPlugin(ScrollTrigger);

const Moments = styled.div`
  width: 100%; color: var(--gallery-ink); font-family: "Instrument Sans",system-ui,sans-serif;
  .momentsHead { display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-bottom:clamp(36px,4vw,56px); }
  .momentsSubTitle { margin:0 0 18px;color:var(--gallery-subtitle);font-size:13px;font-weight:650;letter-spacing:.16em;line-height:1.4;text-transform:uppercase; }
  .momentsTitle { margin:0;color:var(--gallery-title);font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:clamp(36px,4.6vw,64px);font-weight:620;line-height:1.08;letter-spacing:-.02em; }
  .momentsTitle em { color:var(--gallery-accent);font-style:normal; }
  .momentsLink { display:inline-flex;align-items:center;gap:9px;color:var(--gallery-link);font-size:14px;font-weight:650;text-decoration:none;border-bottom:1px solid currentColor;padding-bottom:5px; }
  .momentsLink svg { transition:transform .3s cubic-bezier(.16,1,.3,1); }
  .momentsLink:hover svg { transform:translateX(4px); }
  .marqueeBreakout { width:100vw;margin-left:calc(50% - 50vw);overflow:hidden; }
  .photoMarquee { overflow:hidden;margin-bottom:clamp(18px,2vw,28px); }
  .photoTrack { display:flex;gap:clamp(14px,1.6vw,24px);width:max-content;will-change:transform; }
  .photoButton { flex:0 0 auto;width:clamp(240px,24vw,380px);aspect-ratio:4/3;padding:0;border:0;border-radius:var(--gallery-radius);overflow:hidden;background:transparent;cursor:pointer; }
  .photoButton img { width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s cubic-bezier(.16,1,.3,1); }
  .photoButton:hover img { transform:scale(.97); }
  .hiddenGallery { display:none; }
  @media (max-width:767px) { .momentsHead{align-items:flex-start}.momentsLink{margin-top:4px}.photoButton{width:72vw} }
  @media (prefers-reduced-motion:reduce) { .photoTrack{transform:none!important}.photoButton img{transition:none} }
`;

const text=(v)=>v==null?"":String(v).trim();
const num=(v,f)=>Number.isFinite(Number(v))?Number(v):f;
const color=(v,f)=>text(v)?getColor(text(v)):f;
function normalizeImage(image){ if(typeof image==="string")return {url:text(image),alt:""}; return {url:text(image?.urlDesktop||image?.url||image?.src),alt:text(image?.alt)}; }
function normalizeItem(item){ const cover=text(item?.imageDesktop||item?.image||item?.imageMobile); const images=(Array.isArray(item?.images)?item.images.map(normalizeImage).filter((image)=>image.url):[]); return {title:text(item?.title),type:item?.type==="link"?"link":"album",linkType:item?.linkType==="external"?"external":"internal",linkUrl:text(item?.linkUrl),cover,categories:Array.isArray(item?.categories)?item.categories.map(text).filter(Boolean):[],images:images.length?images:(cover?[{url:cover,alt:text(item?.title)}]:[])}; }
function backgrounds(props){const type=text(props?.photoGallerySectionBgType||"default"),image=text(props?.photoGallerySectionBgImage),key=text(props?.photoGallerySectionBgColorKey);const sectionBgClassName=type==="default"?"defaultBackground":undefined;const sectionBgStyle={...(type==="image"&&image?{backgroundImage:`url(${image})`,backgroundSize:"cover",backgroundPosition:"center",backgroundRepeat:"no-repeat"}:type==="color"&&key?{backgroundColor:getColor(key),backgroundImage:"none"}:{}),...Object.fromEntries([["paddingTop",props?.photoGallerySectionPaddingTop],["paddingBottom",props?.photoGallerySectionPaddingBottom],["marginTop",props?.photoGallerySectionMarginTop],["marginBottom",props?.photoGallerySectionMarginBottom]].filter(([,v])=>v!==""&&v!=null&&num(v,-1)>=0).map(([k,v])=>[k,`${num(v,0)}px`]))};const ct=text(props?.photoGalleryPageContainerBgType||"default"),ci=text(props?.photoGalleryPageContainerBgImage),ck=text(props?.photoGalleryPageContainerBgColorKey);const pageContainerBgStyle={...(ct==="image"&&ci?{backgroundImage:`url(${ci})`,backgroundSize:"cover",backgroundPosition:"center",backgroundRepeat:"no-repeat"}:ct==="color"&&ck?{backgroundColor:getColor(ck),backgroundImage:"none"}:{}),...Object.fromEntries([["paddingTop",props?.photoGalleryPageContainerPaddingTop],["paddingRight",props?.photoGalleryPageContainerPaddingRight],["paddingBottom",props?.photoGalleryPageContainerPaddingBottom],["paddingLeft",props?.photoGalleryPageContainerPaddingLeft],["marginTop",props?.photoGalleryPageContainerMarginTop],["marginBottom",props?.photoGalleryPageContainerMarginBottom]].filter(([,v])=>v!==""&&v!=null&&num(v,-1)>=0).map(([k,v])=>[k,`${num(v,0)}px`]))};return{sectionBgClassName,sectionBgStyle,pageContainerBgStyle};}

export default function PhotoGallery(props){
  const router=useRouter(); const pathname=usePathname(); const isEditor=pathname?.startsWith("/admin")===true; const rootRef=useRef(null); const galleryRefs=useRef({});
  const [activeFilter,setActiveFilter]=useState("All");
  const items=useMemo(()=>(Array.isArray(props?.photoGalleryItems)?props.photoGalleryItems:[]).map(normalizeItem).filter((item)=>item.images.length),[props?.photoGalleryItems]);
  const isInnerPageVariant=props?.photoGalleryLimitEnabled===false&&!text(props?.photoGalleryTitle);
  const photos=useMemo(()=>items.flatMap((item,itemIndex)=>item.images.map((image,imageIndex)=>({...image,itemIndex,imageIndex,title:item.title}))),[items]);
  const split=Math.ceil(photos.length/2); const rows=[photos.slice(0,split),photos.slice(split)]; if(!rows[1].length)rows[1]=rows[0];
  useLayoutEffect(()=>{const root=rootRef.current;if(isInnerPageVariant||!root||typeof window==="undefined"||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const cleanups=[];if(!isEditor){const head=root.querySelector(".momentsHead");if(head){const reveal=gsap.fromTo(head,{autoAlpha:0,y:num(props?.photoGalleryRevealDistance,30)},{autoAlpha:1,y:0,duration:num(props?.photoGalleryRevealDuration,.9),ease:"power3.out",scrollTrigger:{trigger:head,start:"top 86%",once:true}});cleanups.push(()=>reveal.kill());}}root.querySelectorAll(".photoMarquee").forEach((row,index)=>{const track=row.querySelector(".photoTrack");if(!track)return;let x=0;let base=num(props?.photoGallerySpeed,54)/60;const direction=index===0?num(props?.photoGalleryFirstDirection,1):num(props?.photoGallerySecondDirection,-1);const half=()=>track.scrollWidth/2;const tick=(_time,delta)=>{x-=(direction*base*delta)/16.7;const width=half();if(width>0){if(x<=-width)x+=width;if(x>0)x-=width;}gsap.set(track,{x});};gsap.ticker.add(tick);const trigger=ScrollTrigger.create({trigger:row,onUpdate:(self)=>{const velocity=gsap.utils.clamp(-6,6,self.getVelocity()/320);base=num(props?.photoGallerySpeed,54)/60+Math.abs(velocity)*num(props?.photoGalleryVelocityBoost,.8);}});cleanups.push(()=>{gsap.ticker.remove(tick);trigger.kill();});});return()=>cleanups.forEach((cleanup)=>cleanup());},[isEditor,isInnerPageVariant,photos,props?.photoGallerySpeed,props?.photoGalleryFirstDirection,props?.photoGallerySecondDirection,props?.photoGalleryVelocityBoost,props?.photoGalleryRevealDuration,props?.photoGalleryRevealDistance]);
  const open=(photo)=>{const item=items[photo.itemIndex];if(!item)return;if(item.type==="link"&&item.linkUrl){if(item.linkType==="external")window.open(/^https?:\/\//i.test(item.linkUrl)?item.linkUrl:`https://${item.linkUrl}`,"_blank","noopener,noreferrer");else router.push(item.linkUrl);return;}galleryRefs.current[photo.itemIndex]?.openGallery(photo.imageIndex);};
  const {sectionBgClassName,sectionBgStyle,pageContainerBgStyle}=backgrounds(props);const target=text(props?.photoGalleryViewAllTarget)||"_self";
  if(isInnerPageVariant){const tabs=Array.isArray(props?.photoGalleryTabs)&&props.photoGalleryTabs.length?props.photoGalleryTabs:["All"];const filtered=activeFilter==="All"?items:items.filter((item)=>item.categories.includes(activeFilter));return <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}><PageContainer style={pageContainerBgStyle}><div className="fable-section" ref={rootRef}><div className="fable-filters">{tabs.map((tab)=><button type="button" className={`fable-filter${activeFilter===tab?" is-active":""}`} onClick={()=>setActiveFilter(tab)} key={tab}>{tab}</button>)}</div><div className="fable-masonry">{filtered.map((item,index)=><button type="button" className="fable-masonry__item" onClick={()=>open({itemIndex:items.indexOf(item),imageIndex:0})} key={`${item.title}-${index}`}><img src={item.cover||item.images[0]?.url} alt={item.title} loading="lazy" /><span>{item.title}</span></button>)}</div>{items.map((item,itemIndex)=>item.type==="album"?<div className="hiddenGallery" key={itemIndex}><LightGallery onInit={(detail)=>{galleryRefs.current[itemIndex]=detail.instance;}} speed={500} plugins={[lgThumbnail,lgZoom,lgFullscreen]} download={false} counter thumbnail>{item.images.map((image,index)=><a href={image.url} data-thumb={image.url} key={index}><img src={image.url} alt={image.alt||item.title} /></a>)}</LightGallery></div>:null)}</div></PageContainer></FullWidthBackground>;}
  return <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
    <PageContainer style={pageContainerBgStyle}>
      <Moments ref={rootRef} style={{"--gallery-ink":color(props?.photoGalleryTextColorKey,"#2A283E"),"--gallery-subtitle":color(props?.photoGallerySubTitleColorKey,"#E03C33"),"--gallery-title":color(props?.photoGalleryTitleColorKey,"#2A283E"),"--gallery-accent":color(props?.photoGalleryAccentTextColorKey,"#2A283E"),"--gallery-link":color(props?.photoGalleryLinkColorKey,"#2A283E"),"--gallery-radius":`${num(props?.photoGalleryImageRadius,18)}px`}}>
        <div className="momentsHead"><div>{text(props?.photoGallerySubTitle)?<p className="momentsSubTitle">{text(props.photoGallerySubTitle)}</p>:null}{text(props?.photoGalleryTitle)||text(props?.photoGalleryHeadingAccent)?<h2 className="momentsTitle">{text(props?.photoGalleryTitle)}{text(props?.photoGalleryTitle)&&text(props?.photoGalleryHeadingAccent)?" ":null}<em>{text(props?.photoGalleryHeadingAccent)}</em></h2>:null}</div>{text(props?.photoGalleryViewAllText)&&text(props?.photoGalleryViewAllLink)?<a className="momentsLink" href={text(props.photoGalleryViewAllLink)} target={target} rel={target==="_blank"?"noopener noreferrer":undefined}>{text(props.photoGalleryViewAllText)} <ArrowRightOutlined /></a>:null}</div>
        <div className="marqueeBreakout">{rows.map((row,rowIndex)=><div className="photoMarquee" key={rowIndex}><div className="photoTrack">{[...row,...row].map((photo,index)=><button type="button" className="photoButton" onClick={()=>open(photo)} aria-label={photo.alt||photo.title} key={`${rowIndex}-${photo.itemIndex}-${photo.imageIndex}-${index}`}><img src={photo.url} alt={photo.alt||photo.title} loading="lazy" /></button>)}</div></div>)}</div>
        {items.map((item,itemIndex)=>item.type==="album"?<div className="hiddenGallery" key={itemIndex}><LightGallery onInit={(detail)=>{galleryRefs.current[itemIndex]=detail.instance;}} speed={500} plugins={[lgThumbnail,lgZoom,lgFullscreen]} download={false} counter thumbnail>{item.images.map((image,index)=><a href={image.url} data-thumb={image.url} key={index}><img src={image.url} alt={image.alt||item.title} /></a>)}</LightGallery></div>:null)}
      </Moments>
    </PageContainer>
  </FullWidthBackground>;
}
