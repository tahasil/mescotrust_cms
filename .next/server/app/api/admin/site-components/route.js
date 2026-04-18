"use strict";(()=>{var e={};e.id=5711,e.ids=[5711],e.modules={11185:e=>{e.exports=require("mongoose")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78893:e=>{e.exports=require("buffer")},84770:e=>{e.exports=require("crypto")},17702:e=>{e.exports=require("events")},92048:e=>{e.exports=require("fs")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},55315:e=>{e.exports=require("path")},21764:e=>{e.exports=require("util")},71568:e=>{e.exports=require("zlib")},90838:(e,t,o)=>{o.r(t),o.d(t,{originalPathname:()=>$,patchFetch:()=>x,requestAsyncStorage:()=>h,routeModule:()=>P,serverHooks:()=>B,staticGenerationAsyncStorage:()=>b});var n={};o.r(n),o.d(n,{GET:()=>y,POST:()=>T});var r=o(49303),a=o(88716),i=o(60670),s=o(87070),l=o(92048),c=o(55315),p=o.n(c),d=o(40533),m=o(84191),u=o(65858),g=o.n(u),f=o(75705),S=o.n(f),C=o(6242);async function y(e){let t=await (0,d.m)(e);if(t instanceof s.NextResponse)return t;try{await (0,m.connectDB)();let e=await g().find({}).lean(),t={};e.forEach(e=>{t[e.componentId]=e});let o=(0,C.I)(),n=e.map(e=>e.componentId).filter(e=>!o.includes(e)),r=[...new Set([...o,...n])].map((e,o)=>{let n=t[e],r=n?.displayName??e;return"OverviewOfOurWork"!==e||r&&"Awards Recognition"!==r||(r="Overview of Our Work"),"ImageSlider"!==e||r&&"ImageSlider"!==r||(r="Circular Slider"),{componentId:e,displayName:r,global:n?.global??!1,order:n?.order??o,position:n?.position??("Header"===e?"before":"after"),enabled:n?.enabled!==!1}});r.sort((e,t)=>e.order!==t.order?e.order-t.order:e.componentId.localeCompare(t.componentId));let a=r.filter(e=>"LatestEvents"!==e.componentId);return s.NextResponse.json(a)}catch(e){return s.NextResponse.json({error:e.message},{status:500})}}async function T(e){let t=await (0,d.m)(e);if(t instanceof s.NextResponse)return t;try{let t=await e.json(),o=(t.displayName||"").trim();if(!o)return s.NextResponse.json({error:"Display name is required"},{status:400});let n=o.replace(/\s+/g,"").replace(/[^a-zA-Z0-9]/g,"");if(!n)return s.NextResponse.json({error:"Display name must contain at least one letter or number"},{status:400});/^[a-zA-Z]/.test(n)||(n="C"+n),await (0,m.connectDB)();let r=n,a=0;for(;await g().findOne({componentId:r});)a+=1,r=`${n}${a}`;let i=!!t.global,c=Number(t.order)??0,d="after"===t.position?"after":"before",u=process.cwd(),f=p().join(u,"components","site"),C=p().join(f,r);(0,l.mkdirSync)(C,{recursive:!0});let y=r.charAt(0).toLowerCase()+r.slice(1),T=p().join(C,`${r}.js`),P=`"use client";

import { Row, Col } from "antd";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";

/**
 * Site component: ${r} (${o}).
 * Section comes from ComponentRenderer. Props from theme/Component defaultProps.
 * Manage Section (background/padding) and Title & Colors come from EditForm.
 */
export default function ${r}(props) {
  const mainTitle = (props?.mainTitle ?? "Section Title").toString().trim();
  const subTitle = (props?.subTitle ?? "Subtitle").toString().trim();
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : getColor("primary");

  const sectionBgType = (props?.${y}SectionBgType ?? "default").toString();
  const sectionBgImage = (props?.${y}SectionBgImage ?? "").toString().trim();
  const sectionBgColorKey = (props?.${y}SectionBgColorKey ?? "").toString().trim();
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? {
          backgroundImage: \`url(\${sectionBgImage})\`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }
      : sectionBgType === "color" && sectionBgColorKey
        ? {
            backgroundColor: getColor(sectionBgColorKey),
            backgroundImage: "none",
          }
        : undefined;
  const sectionPaddingTop = props?.${y}SectionPaddingTop != null ? Number(props.${y}SectionPaddingTop) : null;
  const sectionPaddingBottom = props?.${y}SectionPaddingBottom != null ? Number(props.${y}SectionPaddingBottom) : null;
  const sectionMarginTop = props?.${y}SectionMarginTop != null ? Number(props.${y}SectionMarginTop) : null;
  const sectionMarginBottom = props?.${y}SectionMarginBottom != null ? Number(props.${y}SectionMarginBottom) : null;
  const sectionBgStyle =
    sectionBgStyleBase || sectionPaddingTop != null || sectionPaddingBottom != null || sectionMarginTop != null || sectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(sectionPaddingTop != null && sectionPaddingTop >= 0 ? { paddingTop: \`\${sectionPaddingTop}px\` } : {}),
          ...(sectionPaddingBottom != null && sectionPaddingBottom >= 0 ? { paddingBottom: \`\${sectionPaddingBottom}px\` } : {}),
          ...(sectionMarginTop != null && sectionMarginTop >= 0 ? { marginTop: \`\${sectionMarginTop}px\` } : {}),
          ...(sectionMarginBottom != null && sectionMarginBottom >= 0 ? { marginBottom: \`\${sectionMarginBottom}px\` } : {}),
        }
      : undefined;

  const pageContainerBgType = (props?.${y}PageContainerBgType ?? "default").toString();
  const pageContainerBgImage = (props?.${y}PageContainerBgImage ?? "").toString().trim();
  const pageContainerBgColorKey = (props?.${y}PageContainerBgColorKey ?? "").toString().trim();
  const pageContainerBgStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? {
          backgroundImage: \`url(\${pageContainerBgImage})\`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? {
            backgroundColor: getColor(pageContainerBgColorKey),
            backgroundImage: "none",
          }
        : undefined;
  const containerPaddingTop = props?.${y}PageContainerPaddingTop != null ? Number(props.${y}PageContainerPaddingTop) : null;
  const containerPaddingRight = props?.${y}PageContainerPaddingRight != null ? Number(props.${y}PageContainerPaddingRight) : null;
  const containerPaddingBottom = props?.${y}PageContainerPaddingBottom != null ? Number(props.${y}PageContainerPaddingBottom) : null;
  const containerPaddingLeft = props?.${y}PageContainerPaddingLeft != null ? Number(props.${y}PageContainerPaddingLeft) : null;
  const containerMarginTop = props?.${y}PageContainerMarginTop != null ? Number(props.${y}PageContainerMarginTop) : null;
  const containerMarginBottom = props?.${y}PageContainerMarginBottom != null ? Number(props.${y}PageContainerMarginBottom) : null;
  const pageContainerBgStyle =
    pageContainerBgStyleBase || containerPaddingTop != null || containerPaddingRight != null || containerPaddingBottom != null || containerPaddingLeft != null || containerMarginTop != null || containerMarginBottom != null
      ? {
          ...(pageContainerBgStyleBase || {}),
          ...(containerPaddingTop != null && containerPaddingTop >= 0 ? { paddingTop: \`\${containerPaddingTop}px\` } : {}),
          ...(containerPaddingRight != null && containerPaddingRight >= 0 ? { paddingRight: \`\${containerPaddingRight}px\` } : {}),
          ...(containerPaddingBottom != null && containerPaddingBottom >= 0 ? { paddingBottom: \`\${containerPaddingBottom}px\` } : {}),
          ...(containerPaddingLeft != null && containerPaddingLeft >= 0 ? { paddingLeft: \`\${containerPaddingLeft}px\` } : {}),
          ...(containerMarginTop != null && containerMarginTop >= 0 ? { marginTop: \`\${containerMarginTop}px\` } : {}),
          ...(containerMarginBottom != null && containerMarginBottom >= 0 ? { marginBottom: \`\${containerMarginBottom}px\` } : {}),
        }
      : undefined;

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <Row gutter={[16, 16]}>
          <Col span={24} className="mb-4">
            <SubTitle>{subTitle}</SubTitle>
            <MainTitle color={titleColor}>{mainTitle}</MainTitle>
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            {/* Add your content here */}
          </Col>
        </Row>
      </PageContainer>
    </FullWidthBackground>
  );
}
`;(0,l.writeFileSync)(T,P,"utf8");let h=p().join(C,"EditForm.js"),b=`"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Form, Input, message, Spin, Collapse } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import { getManageSectionInitialValues, getManageSectionPayload } from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const API_PATH = "/api/theme/${r}";
const PREFIX = "${y}";

/**
 * Edit form for ${r} — used in component edit drawer.
 * Includes Manage Section (background/padding) and Title & Colors by default.
 * Loads/saves via API_PATH (Component defaultProps).
 */
function ${r}EditForm({ source, initialData: initialDataProp, onSaveToPage, onSuccess, onCancel, themeColorOptions: themeColorOptionsProp = [] }, ref) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeColorOptions, setThemeColorOptions] = useState(themeColorOptionsProp);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (themeColorOptionsProp?.length > 0) {
      setThemeColorOptions(themeColorOptionsProp);
      return;
    }
    fetch("/api/theme", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((theme) => {
        const palette = theme?.themePalette || {};
        const custom = Array.isArray(theme?.colors) ? theme.colors : [];
        const names = [...new Set([...Object.keys(palette), ...custom.map((c) => c?.name).filter(Boolean)])].sort();
        setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
      })
      .catch(() => {});
  }, [themeColorOptionsProp]);

  useEffect(() => {
    setLoading(true);
    if (isPageBlock) {
      const data = initialDataProp ?? {};
      form.setFieldsValue({
        mainTitle: data.mainTitle ?? "Section Title",
        subTitle: data.subTitle ?? "Subtitle",
        titleColorKey: data.titleColorKey ?? "",
        ...getManageSectionInitialValues(PREFIX, data),
        ...data,
      });
      setLoading(false);
      return;
    }
    fetch(API_PATH, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        form.setFieldsValue({
          mainTitle: (data && data.mainTitle) ?? "Section Title",
          subTitle: (data && data.subTitle) ?? "Subtitle",
          titleColorKey: (data && data.titleColorKey) ?? "",
          ...getManageSectionInitialValues(PREFIX, data),
          ...(data && typeof data === "object" ? data : {}),
        });
      })
      .catch(() => message.error("Failed to load ${r}"))
      .finally(() => setLoading(false));
  }, [form, isPageBlock, initialDataProp]);

  const handleUpdate = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue(true);
      const payload = {
        ...values,
        ...getManageSectionPayload(PREFIX, values),
      };
      if (isPageBlock && onSaveToPage) {
        onSaveToPage(payload);
        message.success("Changes will be saved with the page");
        onSuccess?.();
        return;
      }
      setSaving(true);
      fetch(API_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) return res.json().then((d) => Promise.reject(d));
        })
        .then(() => {
          message.success("${o} saved");
          onSuccess?.();
        })
        .catch((err) => message.error(err?.error || "Failed to save"))
        .finally(() => setSaving(false));
    }).catch(() => {});
  };

  useImperativeHandle(ref, () => ({ update: handleUpdate }), []);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["manage-section", "title-colors", "content"]}
        items={[
          {
            key: "manage-section",
            label: "Manage Section",
            children: <ManageSectionFields prefix={PREFIX} form={form} themeColorOptions={themeColorOptions} />,
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: <TitleAndColorsSection form={form} themeColorOptions={themeColorOptions} {...getTitleAndColorsConfig("${r}")} />,
          },
          {
            key: "content",
            label: "Content",
            children: (
              <>
                <Form.Item name="subTitle" label="Subtitle">
                  <Input placeholder="Subtitle" />
                </Form.Item>
                <Form.Item name="mainTitle" label="Main title">
                  <Input placeholder="Section Title" />
                </Form.Item>
                <p style={{ color: "#666", marginTop: 16 }}>Add more fields in EditForm.js as needed.</p>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(${r}EditForm);
`;(0,l.writeFileSync)(h,b,"utf8");let B=p().join(C,"index.js"),$=`export { default } from "./${r}";
export { default as ${r}EditForm } from "./EditForm";
`;(0,l.writeFileSync)(B,$,"utf8");let x=p().join(u,"lib","siteComponentRegistry.js"),M=(0,l.readFileSync)(x,"utf8"),I=M.match(/SITE_COMPONENT_IDS\s*=\s*\[([^\]]*)\]/);if(I){let e=I[1].split(",").map(e=>e.trim().replace(/^["']|["']$/g,"")).filter(Boolean);e.includes(r)||(e.push(r),M=M.replace(/(SITE_COMPONENT_IDS\s*=\s*\[)[^\]]*(\])/,`$1${e.map(e=>`"${e}"`).join(", ")}$2`),(0,l.writeFileSync)(x,M,"utf8"))}let v=p().join(u,"components","site","index.js"),F=(0,l.readFileSync)(v,"utf8"),E=`export { default as ${r}, ${r}EditForm } from "./${r}/index";`;F.includes(E)||(F=F.replace(/(export \{ default as Subscribe, SubscribeEditForm \} from "\.\/Subscribe\/index";)/,`$1
${E}`));let R=`import ${r}EditForm from "./${r}/EditForm";`;F.includes(R)||(F=F.replace(/(import SubscribeEditForm from "\.\/Subscribe\/EditForm";)/,`$1
import ${r}EditForm from "./${r}/EditForm";`));let w=F.match(/(EDITABLE_SITE_EDIT_FORMS\s*=\s*\{[\s\S]*)(  \w+: \w+EditForm,)(\n\s*)\};/);w&&!F.includes(`${r}: ${r}EditForm`)&&(F=F.replace(w[0],w[1]+w[2]+w[3]+`  ${r}: ${r}EditForm,
};`)),(0,l.writeFileSync)(v,F,"utf8");let N=await g().create({componentId:r,displayName:o,global:i,order:c,position:d,enabled:!0});return await S().findOne({baseComponent:r})||await S().create({name:r,displayName:o,type:"custom",baseComponent:r,defaultProps:{},layout:[],active:!0}),s.NextResponse.json(N.toObject?N.toObject():N)}catch(e){return s.NextResponse.json({error:e.message},{status:500})}}let P=new r.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/admin/site-components/route",pathname:"/api/admin/site-components",filename:"route",bundlePath:"app/api/admin/site-components/route"},resolvedPagePath:"/Users/askari/Documents/projects/MESCO/code/mescotrust_cms/app/api/admin/site-components/route.js",nextConfigOutput:"",userland:n}),{requestAsyncStorage:h,staticGenerationAsyncStorage:b,serverHooks:B}=P,$="/api/admin/site-components/route";function x(){return(0,i.patchFetch)({serverHooks:B,staticGenerationAsyncStorage:b})}},40533:(e,t,o)=>{o.d(t,{m:()=>l});var n=o(20330),r=o(87070),a=o(84191);let i=null;async function s(){return i||(i=(await o.e(3077).then(o.t.bind(o,83077,23))).default),i}async function l(e){let t=await (0,n.getToken)({req:e,secret:process.env.NEXTAUTH_SECRET});if(!t)return r.NextResponse.json({error:"Unauthorized"},{status:401});try{await (0,a.connectDB)();let e=await s(),o=await e.findById(t.id).select("status").lean();if(!o||"active"!==o.status)return r.NextResponse.json({error:"Account deactivated"},{status:403})}catch{}return t}},84191:(e,t,o)=>{let n=o(11185),{validateEnv:r}=o(50534),a=global.mongoose;async function i(){if(a.conn)return a.conn;a.promise||(a.promise=n.connect((r(),process.env.MONGODB_URI),{bufferCommands:!1}).then(e=>e));try{a.conn=await a.promise}catch(e){throw a.promise=null,e}return a.conn}a||(a=global.mongoose={conn:null,promise:null}),e.exports={connectDB:i}},50534:e=>{let t=["MONGODB_URI","NEXTAUTH_SECRET","NEXTAUTH_URL"];e.exports={validateEnv:function(){let e=t.filter(e=>!process.env[e]);if(e.length>0)throw Error(`Missing required environment variables: ${e.join(", ")}. Check .env.local and README for the full list.`)},getSiteUrl:function(){return process.env.NEXT_PUBLIC_SITE_URL||process.env.NEXTAUTH_URL||"http://localhost:3000"}}},6242:(e,t,o)=>{o.d(t,{I:()=>s});var n=o(92048),r=o(55315),a=o.n(r);let i=["Header","Footer","HomeHero","Marquee","Subscribe"];function s(){try{let e=a().join(process.cwd(),"lib","siteComponentRegistry.js"),t=(0,n.readFileSync)(e,"utf8").match(/SITE_COMPONENT_IDS\s*=\s*\[([^\]]*)\]/);if(!t)return[...i];return t[1].split(",").map(e=>e.trim().replace(/^["']|["']$/g,"")).filter(Boolean)}catch{return[...i]}}},75705:(e,t,o)=>{let n=o(11185),r=new n.Schema({name:{type:String,required:!0,trim:!0},displayName:{type:String,default:""},type:{type:String,enum:["system","custom"],default:"custom"},category:{type:String,default:""},baseComponent:{type:String,required:!0},propsSchema:{type:n.Schema.Types.Mixed,default:[]},defaultProps:{type:n.Schema.Types.Mixed,default:{}},layout:{type:n.Schema.Types.Mixed,default:[]},container:{type:String,enum:["container","container-fluid"],default:"container"},active:{type:Boolean,default:!0}},{timestamps:!0});r.index({baseComponent:1}),e.exports=n.models&&n.models.Component||n.model("Component",r)},65858:(e,t,o)=>{let n=o(11185),r=new n.Schema({componentId:{type:String,required:!0,unique:!0,trim:!0},displayName:{type:String,default:""},global:{type:Boolean,default:!1},order:{type:Number,default:0},position:{type:String,enum:["before","after"],default:"before"},enabled:{type:Boolean,default:!0}},{timestamps:!0});r.index({global:1,position:1,order:1}),e.exports=n.models&&n.models.SiteComponentMeta||n.model("SiteComponentMeta",r)}};var t=require("../../../../webpack-runtime.js");t.C(e);var o=e=>t(t.s=e),n=t.X(0,[8948,8902,5972],()=>o(90838));module.exports=n})();