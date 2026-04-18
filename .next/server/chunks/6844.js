"use strict";exports.id=6844,exports.ids=[6844],exports.modules={16594:(e,t,r)=>{async function o({from:e,to:t,subject:r,html:o,text:n,replyTo:i}){if(!process.env.RESEND_API_KEY)return console.log("[Email] No RESEND_API_KEY; would send:",{from:e,to:t,subject:r,preview:(n||o||"").slice(0,120)}),{skipped:!0};let a=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${process.env.RESEND_API_KEY}`},body:JSON.stringify({from:e,to:Array.isArray(t)?t:[t],subject:r,html:o,text:n,...i?{reply_to:i}:{}})});if(!a.ok)throw Error((await a.json().catch(()=>({}))).message||`Resend failed (${a.status})`);return a.json().catch(()=>({}))}function n(e){return null==e?"":String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function i(e){try{return new Date(e).toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return String(e)}}async function a(e){let t=process.env.EMAIL_FROM||"noreply@example.com",r=process.env.EMAIL_TO||process.env.ADMIN_EMAIL||"admin@example.com",{name:o,email:n,message:i}=e.payload||e;if(process.env.RESEND_API_KEY){let e=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${process.env.RESEND_API_KEY}`},body:JSON.stringify({from:t,to:[r],subject:`Contact form: ${o||"No name"}`,text:`From: ${o}
Email: ${n}

${i}`})});if(!e.ok)throw Error((await e.json().catch(()=>({}))).message||"Resend failed");return}console.log("[Contact] No RESEND_API_KEY; would email:",{to:r,from:t,name:o,email:n,message:i?.slice(0,50)})}async function s(e){let t=e.payload?.email||e.email;if(!t)return;let r=process.env.EMAIL_FROM||"noreply@example.com";process.env.RESEND_API_KEY&&await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${process.env.RESEND_API_KEY}`},body:JSON.stringify({from:r,to:[t],subject:"We received your message",text:"Thank you for contacting us. We will get back to you soon."})})}async function l(e,t={}){try{let r=e?.payload?.email;if(!r)return console.log("[EventRegAck] No applicant email; skipping"),{skipped:!0};let a=t.siteTitle||"Mesco Trust",s=t.footerEmail||process.env.EMAIL_FROM||"",l=t.footerPhone||"",p=t.footerAddress||"",d=t.logoLightUrl||t.logoImageUrl||"",c=process.env.EMAIL_FROM||`noreply@${s.split("@")[1]||"example.com"}`,u=process.env.EMAIL_TO||process.env.ADMIN_EMAIL||"",m=i(e.createdAt||new Date),f=[["Event",e.eventTitle||"—"],["Event date",e.eventDate||"—"],["Name",e.payload?.name||"—"],["Email",e.payload?.email||"—"],["Phone",e.payload?.phone||"—"],["School / Institution",e.payload?.school||"—"],["Class / Year",e.payload?.classOrYear||"—"],["Submitted",m]].map(([e,t])=>`<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;font-size:13px;">${n(e)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#222;font-size:13px;font-weight:600;">${n(t)}</td></tr>`).join(""),g=`<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#222;">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px;">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #eaeaea;">
      <div style="padding:24px;text-align:center;background:#cf372f;color:#ffffff;">
        ${d?`<img src="${n(d)}" alt="${n(a)}" style="max-height:60px;margin-bottom:12px;" />`:""}
        <h1 style="margin:0;font-size:22px;font-weight:700;">Registration received</h1>
        <p style="margin:8px 0 0;font-size:14px;opacity:0.92;">Thank you for registering for ${n(e.eventTitle||"our event")}.</p>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#444;">
          Dear ${n(e.payload?.name||"")},<br/>
          We have received your registration. Our team will review the details and reach out to you with the next steps.
        </p>
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden;">
          ${f}
        </table>
        ${e.payload?.message?`<p style="margin:16px 0 0;font-size:13px;color:#555;"><strong>Your message:</strong><br/>${n(e.payload.message).replace(/\n/g,"<br/>")}</p>`:""}
        <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#666;">
          For any queries, please reach out to us
          ${s?`at <a href="mailto:${n(s)}" style="color:#cf372f;">${n(s)}</a>`:""}
          ${l?` or call ${n(l)}`:""}.
        </p>
      </div>
      <div style="padding:16px 24px;background:#fafafa;border-top:1px solid #eee;font-size:12px;color:#888;text-align:center;">
        <strong>${n(a)}</strong>
        ${p?`<br/>${n(p)}`:""}
      </div>
    </div>
  </div>
</body></html>`,h=`Hello ${e.payload?.name||""},

We have received your registration for ${e.eventTitle||"our event"}.
Event date: ${e.eventDate||"—"}
Submitted: ${m}

Our team will review the details and reach out with the next steps.

— ${a}
${s?`Email: ${s}`:""}
${l?`Phone: ${l}`:""}`;if(await o({from:c,to:r,subject:`Registration received — ${e.eventTitle||"Event"}`,html:g,text:h,replyTo:s||void 0}),u)try{await o({from:c,to:u,subject:`[Event Registration] ${e.eventTitle||"Event"} — ${e.payload?.name||""}`,html:g,text:h})}catch(e){console.error("[EventRegAck] Admin copy failed:",e?.message||e)}return{sent:!0}}catch(e){return console.error("[EventRegAck] Failed:",e?.message||e),{error:e?.message||String(e)}}}async function p(e,t={}){try{if(!e?.donor?.email)return console.log("[DonationReceipt] No donor email; skipping"),{skipped:!0};let r=t.siteTitle||"Mesco Trust",a=t.footerEmail||process.env.EMAIL_FROM||"",s=t.footerPhone||"",l=t.footerAddress||"",p=t.logoLightUrl||t.logoImageUrl||"",d=process.env.EMAIL_FROM||`noreply@${a.split("@")[1]||"example.com"}`,c=e.donor.email,u=process.env.EMAIL_TO||process.env.ADMIN_EMAIL||"",m=function(e){let t=Number(e);if(!Number.isFinite(t))return"—";try{return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(t)}catch{return`₹${t.toLocaleString("en-IN")}`}}(e.amount),f=i(e.updatedAt||e.createdAt||new Date),g=[["Receipt / Order ID",e.orderId],["Donor Name",e.donor.name],["Email",e.donor.email],["Mobile",e.donor.mobile],["Amount",m],["Purpose",e.purpose||"General Fund"],["Zakat",e.zakat||"No"],["PAN",e.donor.pan||"—"],["Payment Mode",e.payment?.paymentMode||"—"],["Bank Reference No.",e.payment?.bankRefNo||"—"],["Tracking ID",e.payment?.trackingId||"—"],["Date",f]].map(([e,t])=>`<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;font-size:13px;">${n(e)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#222;font-size:13px;font-weight:600;">${n(t)}</td></tr>`).join(""),h=`<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#222;">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px;">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #eaeaea;">
      <div style="padding:24px;text-align:center;background:#cf372f;color:#ffffff;">
        ${p?`<img src="${n(p)}" alt="${n(r)}" style="max-height:60px;margin-bottom:12px;" />`:""}
        <h1 style="margin:0;font-size:22px;font-weight:700;">Thank you for your donation</h1>
        <p style="margin:8px 0 0;font-size:14px;opacity:0.92;">Your contribution to ${n(r)} has been received.</p>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#444;">
          Dear ${n(e.donor.name)},<br/>
          We gratefully acknowledge your generous contribution. Below is your donation receipt for your records.
        </p>
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden;">
          ${g}
        </table>
        ${e.note?`<p style="margin:16px 0 0;font-size:13px;color:#555;"><strong>Note:</strong> ${n(e.note)}</p>`:""}
        <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#666;">
          This is a system-generated receipt. For any queries about your donation, please reach out to us
          ${a?`at <a href="mailto:${n(a)}" style="color:#cf372f;">${n(a)}</a>`:""}
          ${s?` or call ${n(s)}`:""}.
        </p>
      </div>
      <div style="padding:16px 24px;background:#fafafa;border-top:1px solid #eee;font-size:12px;color:#888;text-align:center;">
        <strong>${n(r)}</strong>
        ${l?`<br/>${n(l)}`:""}
      </div>
    </div>
    <p style="text-align:center;font-size:11px;color:#999;margin-top:16px;">
      You are receiving this email because a donation was made on ${n(f)} using this email address.
    </p>
  </div>
</body></html>`,y=`Thank you for your donation to ${r}!

Receipt / Order ID: ${e.orderId}
Donor: ${e.donor.name}
Amount: ${m}
Purpose: ${e.purpose||"General Fund"}
Date: ${f}
Tracking ID: ${e.payment?.trackingId||"—"}

For queries: ${a||""} ${s||""}`;if(await o({from:d,to:c,subject:`Donation Receipt — ${e.orderId}`,html:h,text:y,replyTo:a||void 0}),u)try{await o({from:d,to:u,subject:`[Donation Received] ${m} from ${e.donor.name}`,html:h,text:y})}catch(e){console.error("[DonationReceipt] Admin copy failed:",e?.message||e)}return{sent:!0}}catch(e){return console.error("[DonationReceipt] Failed:",e?.message||e),{error:e?.message||String(e)}}}r.d(t,{A3:()=>s,Lf:()=>a,QD:()=>p,eI:()=>l})},79925:e=>{var t=Object.defineProperty,r=Object.getOwnPropertyDescriptor,o=Object.getOwnPropertyNames,n=Object.prototype.hasOwnProperty,i={};function a(e){var t;let r=["path"in e&&e.path&&`Path=${e.path}`,"expires"in e&&(e.expires||0===e.expires)&&`Expires=${("number"==typeof e.expires?new Date(e.expires):e.expires).toUTCString()}`,"maxAge"in e&&"number"==typeof e.maxAge&&`Max-Age=${e.maxAge}`,"domain"in e&&e.domain&&`Domain=${e.domain}`,"secure"in e&&e.secure&&"Secure","httpOnly"in e&&e.httpOnly&&"HttpOnly","sameSite"in e&&e.sameSite&&`SameSite=${e.sameSite}`,"partitioned"in e&&e.partitioned&&"Partitioned","priority"in e&&e.priority&&`Priority=${e.priority}`].filter(Boolean),o=`${e.name}=${encodeURIComponent(null!=(t=e.value)?t:"")}`;return 0===r.length?o:`${o}; ${r.join("; ")}`}function s(e){let t=new Map;for(let r of e.split(/; */)){if(!r)continue;let e=r.indexOf("=");if(-1===e){t.set(r,"true");continue}let[o,n]=[r.slice(0,e),r.slice(e+1)];try{t.set(o,decodeURIComponent(null!=n?n:"true"))}catch{}}return t}function l(e){var t,r;if(!e)return;let[[o,n],...i]=s(e),{domain:a,expires:l,httponly:c,maxage:u,path:m,samesite:f,secure:g,partitioned:h,priority:y}=Object.fromEntries(i.map(([e,t])=>[e.toLowerCase(),t]));return function(e){let t={};for(let r in e)e[r]&&(t[r]=e[r]);return t}({name:o,value:decodeURIComponent(n),domain:a,...l&&{expires:new Date(l)},...c&&{httpOnly:!0},..."string"==typeof u&&{maxAge:Number(u)},path:m,...f&&{sameSite:p.includes(t=(t=f).toLowerCase())?t:void 0},...g&&{secure:!0},...y&&{priority:d.includes(r=(r=y).toLowerCase())?r:void 0},...h&&{partitioned:!0}})}((e,r)=>{for(var o in r)t(e,o,{get:r[o],enumerable:!0})})(i,{RequestCookies:()=>c,ResponseCookies:()=>u,parseCookie:()=>s,parseSetCookie:()=>l,stringifyCookie:()=>a}),e.exports=((e,i,a,s)=>{if(i&&"object"==typeof i||"function"==typeof i)for(let a of o(i))n.call(e,a)||void 0===a||t(e,a,{get:()=>i[a],enumerable:!(s=r(i,a))||s.enumerable});return e})(t({},"__esModule",{value:!0}),i);var p=["strict","lax","none"],d=["low","medium","high"],c=class{constructor(e){this._parsed=new Map,this._headers=e;let t=e.get("cookie");if(t)for(let[e,r]of s(t))this._parsed.set(e,{name:e,value:r})}[Symbol.iterator](){return this._parsed[Symbol.iterator]()}get size(){return this._parsed.size}get(...e){let t="string"==typeof e[0]?e[0]:e[0].name;return this._parsed.get(t)}getAll(...e){var t;let r=Array.from(this._parsed);if(!e.length)return r.map(([e,t])=>t);let o="string"==typeof e[0]?e[0]:null==(t=e[0])?void 0:t.name;return r.filter(([e])=>e===o).map(([e,t])=>t)}has(e){return this._parsed.has(e)}set(...e){let[t,r]=1===e.length?[e[0].name,e[0].value]:e,o=this._parsed;return o.set(t,{name:t,value:r}),this._headers.set("cookie",Array.from(o).map(([e,t])=>a(t)).join("; ")),this}delete(e){let t=this._parsed,r=Array.isArray(e)?e.map(e=>t.delete(e)):t.delete(e);return this._headers.set("cookie",Array.from(t).map(([e,t])=>a(t)).join("; ")),r}clear(){return this.delete(Array.from(this._parsed.keys())),this}[Symbol.for("edge-runtime.inspect.custom")](){return`RequestCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`}toString(){return[...this._parsed.values()].map(e=>`${e.name}=${encodeURIComponent(e.value)}`).join("; ")}},u=class{constructor(e){var t,r,o;this._parsed=new Map,this._headers=e;let n=null!=(o=null!=(r=null==(t=e.getSetCookie)?void 0:t.call(e))?r:e.get("set-cookie"))?o:[];for(let e of Array.isArray(n)?n:function(e){if(!e)return[];var t,r,o,n,i,a=[],s=0;function l(){for(;s<e.length&&/\s/.test(e.charAt(s));)s+=1;return s<e.length}for(;s<e.length;){for(t=s,i=!1;l();)if(","===(r=e.charAt(s))){for(o=s,s+=1,l(),n=s;s<e.length&&"="!==(r=e.charAt(s))&&";"!==r&&","!==r;)s+=1;s<e.length&&"="===e.charAt(s)?(i=!0,s=n,a.push(e.substring(t,o)),t=s):s=o+1}else s+=1;(!i||s>=e.length)&&a.push(e.substring(t,e.length))}return a}(n)){let t=l(e);t&&this._parsed.set(t.name,t)}}get(...e){let t="string"==typeof e[0]?e[0]:e[0].name;return this._parsed.get(t)}getAll(...e){var t;let r=Array.from(this._parsed.values());if(!e.length)return r;let o="string"==typeof e[0]?e[0]:null==(t=e[0])?void 0:t.name;return r.filter(e=>e.name===o)}has(e){return this._parsed.has(e)}set(...e){let[t,r,o]=1===e.length?[e[0].name,e[0].value,e[0]]:e,n=this._parsed;return n.set(t,function(e={name:"",value:""}){return"number"==typeof e.expires&&(e.expires=new Date(e.expires)),e.maxAge&&(e.expires=new Date(Date.now()+1e3*e.maxAge)),(null===e.path||void 0===e.path)&&(e.path="/"),e}({name:t,value:r,...o})),function(e,t){for(let[,r]of(t.delete("set-cookie"),e)){let e=a(r);t.append("set-cookie",e)}}(n,this._headers),this}delete(...e){let[t,r,o]="string"==typeof e[0]?[e[0]]:[e[0].name,e[0].path,e[0].domain];return this.set({name:t,path:r,domain:o,value:"",expires:new Date(0)})}[Symbol.for("edge-runtime.inspect.custom")](){return`ResponseCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`}toString(){return[...this._parsed.values()].map(a).join("; ")}}},38238:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"ReflectAdapter",{enumerable:!0,get:function(){return r}});class r{static get(e,t,r){let o=Reflect.get(e,t,r);return"function"==typeof o?o.bind(e):o}static set(e,t,r,o){return Reflect.set(e,t,r,o)}static has(e,t){return Reflect.has(e,t)}static deleteProperty(e,t){return Reflect.deleteProperty(e,t)}}},92044:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{RequestCookies:function(){return o.RequestCookies},ResponseCookies:function(){return o.ResponseCookies},stringifyCookie:function(){return o.stringifyCookie}});let o=r(79925)}};