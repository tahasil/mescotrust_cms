exports.id=6518,exports.ids=[6518],exports.modules={33663:(e,t,n)=>{Promise.resolve().then(n.bind(n,93622))},40169:(e,t,n)=>{Promise.resolve().then(n.bind(n,53910))},93622:(e,t,n)=>{"use strict";n.r(t),n.d(t,{default:()=>a});var i=n(10326);function a({error:e,reset:t}){return(0,i.jsxs)("div",{style:{maxWidth:520,margin:"4rem auto",padding:"2rem",textAlign:"center",background:"#fff",borderRadius:8,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"},children:[i.jsx("h2",{style:{color:"#ff4d4f",marginBottom:8},children:"Admin Error"}),i.jsx("p",{style:{color:"#666",marginBottom:24},children:"Something went wrong while loading this page."}),i.jsx("button",{onClick:()=>t(),style:{padding:"8px 24px",backgroundColor:"#1890ff",color:"#fff",border:"none",borderRadius:6,fontSize:14,cursor:"pointer"},children:"Try again"})]})}n(17577)},53910:(e,t,n)=>{"use strict";n.d(t,{default:()=>U});var i=n(10326),a=n(17577),r=n(90434),o=n(35047),s=n(18418),l=n(28553),d=n(276),m=n(97458),c=n(71209),u=n(25208),b=n(29386),f=n(60846),p=n(80450),h=n(45930),g=n(52145),x=n(6310),y=n(73330),v=n(10907),w=n(68494),j=n(56662),k=n(22817),C=n(32643),S=n(10549),T=n(58111),Z=n(59959),$=n(99251),B=n(91759),A=n(49965),z=n(92014),R=n(44754),L=n(63554),N=n(20331),H=n(77109);let{Header:P,Content:E}=s.default,D={textDecoration:"none"},I=[{key:"/admin",icon:i.jsx(x.Z,{}),label:i.jsx(r.default,{href:"/admin",style:D,children:"Dashboard"})},{key:"/admin/pages",icon:i.jsx(y.Z,{}),label:i.jsx(r.default,{href:"/admin/pages",style:D,children:"Pages"})},{key:"/admin/components",icon:i.jsx(v.Z,{}),label:i.jsx(r.default,{href:"/admin/components",style:D,children:"Components"})},{key:"/admin/sliders",icon:i.jsx(v.Z,{}),label:i.jsx(r.default,{href:"/admin/sliders",style:D,children:"Sliders"})},{key:"/admin/team",icon:i.jsx(w.Z,{}),label:i.jsx(r.default,{href:"/admin/team",style:D,children:"Team"})},{key:"group:admin:blogs",icon:i.jsx(j.Z,{}),label:"Blogs",children:[{key:"/admin/blogs",label:i.jsx(r.default,{href:"/admin/blogs",style:D,children:"View All Posts"})},{key:"/admin/blogs/new",label:i.jsx(r.default,{href:"/admin/blogs/new",style:D,children:"Add Post"})},{key:"/admin/blog-categories",label:i.jsx(r.default,{href:"/admin/blog-categories",style:D,children:"Categories"})},{key:"/admin/blog-comments",label:i.jsx(r.default,{href:"/admin/blog-comments",style:D,children:"Comments"})}]},{key:"group:admin:events",icon:i.jsx(k.Z,{}),label:"Events",children:[{key:"/admin/events",label:i.jsx(r.default,{href:"/admin/events",style:D,children:"View All Events"})},{key:"/admin/events/new",label:i.jsx(r.default,{href:"/admin/events/new",style:D,children:"Add Event"})}]},{key:"/admin/media",icon:i.jsx(v.Z,{}),label:"Media",children:[{key:"/admin/media",label:i.jsx(r.default,{href:"/admin/media",style:D,children:"Library"})},{key:"/admin/media/bulk-optimize",label:i.jsx(r.default,{href:"/admin/media/bulk-optimize",style:D,children:"Bulk Optimize"})},{key:"/admin/media/settings",label:i.jsx(r.default,{href:"/admin/media/settings",style:D,children:"Settings"})}]},{key:"/admin/menus",icon:i.jsx(C.Z,{}),label:i.jsx(r.default,{href:"/admin/menus",style:D,children:"Menus"})},{key:"/admin/theme",icon:i.jsx(S.Z,{}),label:i.jsx(r.default,{href:"/admin/theme",style:D,children:"Theme"})},{key:"/admin/submissions",icon:i.jsx(T.Z,{}),label:"Submissions",children:[{key:"/admin/subscribers",label:i.jsx(r.default,{href:"/admin/subscribers",style:D,children:"Subscribers"})},{key:"/admin/event-registrations",label:i.jsx(r.default,{href:"/admin/event-registrations",style:D,children:"Event Register"})},{key:"/admin/donations",label:i.jsx(r.default,{href:"/admin/donations",style:D,children:"Donate"})},{key:"/admin/volunteer-form",label:i.jsx(r.default,{href:"/admin/volunteer-form",style:D,children:"Volunteer Form"})},{key:"/admin/contacts",label:i.jsx(r.default,{href:"/admin/contacts",style:D,children:"Contact Us"})}]},{key:"/admin/users",icon:i.jsx(w.Z,{}),label:i.jsx(r.default,{href:"/admin/users",style:D,children:"Users"})}],M={adminSiteName:"",adminLogoUrl:"",adminTextColor:"#333333",adminBorderColor:"rgba(0,0,0,0.06)",adminCtaBgColor:"#1677ff",adminCtaTextColor:"#ffffff",adminCtaHoverBgColor:"",adminCtaHoverTextColor:"",adminSidebarBg:"#ffffff",adminSidebarText:"rgba(0,0,0,0.65)",adminSidebarHoverBg:"rgba(0,0,0,0.04)",adminSidebarHoverText:"#1677ff",adminSidebarActiveBg:"#e6f4ff",adminSidebarActiveText:"#1677ff",adminLoaderColor:"#1677ff",adminLoaderBgColor:"rgba(255,255,255,0.5)"};function U({children:e,userName:t,userRole:n}){let[r,x]=(0,a.useState)(!1),[y,v]=(0,a.useState)(!1),[w,j]=(0,a.useState)(!1),C=(0,o.usePathname)(),[S,D]=(0,a.useState)(M),[U,_]=(0,a.useState)([]),[O,W]=(0,a.useState)(!1),[V,F]=(0,a.useState)(!1),[X,K]=(0,a.useState)(!1),Y=(0,a.useRef)(!1),q=(0,a.useRef)(0),G=(0,a.useRef)(null),J=(0,a.useRef)(null),Q=(0,a.useRef)(null),ee=(0,a.useRef)(!1),et=(0,a.useRef)(0),en=(0,a.useRef)(0),ei=(0,a.useCallback)(()=>{G.current&&(window.clearTimeout(G.current),G.current=null),J.current&&(window.clearTimeout(J.current),J.current=null),Q.current&&(window.clearTimeout(Q.current),Q.current=null)},[]);(0,a.useCallback)(()=>{Y.current||G.current||(ei(),ee.current=!1,et.current=0,G.current=window.setTimeout(()=>{q.current=Date.now(),Y.current=!0,K(!0),G.current=null},60))},[ei]),(0,a.useCallback)(()=>{if(Q.current&&(window.clearTimeout(Q.current),Q.current=null),G.current&&(window.clearTimeout(G.current),G.current=null),!Y.current)return;let e=Date.now()-q.current;J.current&&(window.clearTimeout(J.current),J.current=null),J.current=window.setTimeout(()=>{Y.current=!1,K(!1),ee.current=!1,et.current=0,J.current=null},Math.max(0,280-e))},[]);let ea=y?w:!r,er=y?0:r?0:200;(0,a.useCallback)(()=>{Promise.all([fetch("/api/admin/contacts?limit=20").then(e=>e.ok?e.json():{items:[]}),fetch("/api/admin/donations?limit=20").then(e=>e.ok?e.json():{items:[]}),fetch("/api/admin/subscribers?limit=10").then(e=>e.ok?e.json():{items:[]}),fetch("/api/admin/event-registrations?limit=20").then(e=>e.ok?e.json():{items:[]})]).then(([e,t,n,a])=>{let r=[];(e.items||[]).forEach(e=>{e.isRead||r.push({id:e._id,type:"contact",icon:i.jsx(Z.Z,{style:{color:"#1677ff"}}),title:`New message from ${e.payload?.name||"Unknown"}`,time:e.createdAt,link:"/admin/contacts"})}),(t.items||[]).forEach(e=>{"success"===e.status&&r.push({id:e._id,type:"donation",icon:i.jsx($.Z,{style:{color:"#52c41a"}}),title:`₹${Number(e.amount).toLocaleString("en-IN")} donation from ${e.donor?.name||"Unknown"}`,time:e.createdAt,link:"/admin/donations"})});let o=Date.now()-864e5;(n.items||[]).forEach(e=>{"active"===e.status&&new Date(e.createdAt).getTime()>o&&r.push({id:e._id,type:"subscriber",icon:i.jsx(T.Z,{style:{color:"#722ed1"}}),title:`New subscriber: ${e.email}`,time:e.createdAt,link:"/admin/subscribers"})}),(a.items||[]).forEach(e=>{e.isRead||r.push({id:e._id,type:"event-registration",icon:i.jsx(k.Z,{style:{color:"#fa8c16"}}),title:`New event registration: ${e.payload?.name||"Unknown"} → ${e.eventTitle||"Event"}`,time:e.createdAt,link:"/admin/event-registrations"})}),r.sort((e,t)=>new Date(t.time)-new Date(e.time));let s=r.slice(0,10);s.length>en.current&&0!==en.current&&(F(!0),setTimeout(()=>F(!1),1500)),en.current=s.length,_(s)}).catch(()=>{})},[]);let eo=e=>{if(!e)return"";let t=Math.floor((Date.now()-new Date(e).getTime())/6e4);if(t<1)return"just now";if(t<60)return`${t} min ago`;let n=Math.floor(t/60);if(n<24)return`${n} hrs ago`;let i=Math.floor(n/24);return`${i} day${i>1?"s":""} ago`},es=(0,i.jsxs)("div",{style:{width:320,maxWidth:"90vw"},children:[(0,i.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px"},children:[(0,i.jsxs)(l.default.Text,{strong:!0,children:[U.length," New Notifications"]}),i.jsx(l.default.Link,{onClick:()=>{_([]),W(!1)},style:{fontSize:13},children:"Clear all"})]}),i.jsx(d.Z,{style:{margin:0}}),i.jsx(m.Z,{dataSource:U,locale:{emptyText:"No new notifications"},renderItem:e=>i.jsx(m.Z.Item,{style:{padding:"10px 16px",cursor:"pointer",transition:"background 0.2s"},onClick:()=>{W(!1),window.location.href=e.link},onMouseEnter:e=>e.currentTarget.style.background="rgba(0,0,0,0.02)",onMouseLeave:e=>e.currentTarget.style.background="transparent",children:i.jsx(m.Z.Item.Meta,{avatar:i.jsx(c.Z,{size:36,icon:e.icon,style:{background:"rgba(0,0,0,0.04)"}}),title:i.jsx("span",{style:{fontSize:13,fontWeight:500},children:e.title}),description:(0,i.jsxs)("span",{style:{fontSize:12,color:"#999",display:"flex",alignItems:"center",gap:4},children:[i.jsx(k.Z,{style:{fontSize:11}})," ",eo(e.time)]})})})}),U.length>0&&(0,i.jsxs)(i.Fragment,{children:[i.jsx(d.Z,{style:{margin:0}}),i.jsx("div",{style:{textAlign:"center",padding:"10px 16px"},children:i.jsx(l.default.Link,{onClick:()=>W(!1),href:"/admin/contacts",style:{fontSize:13},children:"View all"})})]})]}),el={items:[{key:"logout",icon:i.jsx(B.Z,{}),label:"Sign out",onClick:()=>(0,H.signOut)({callbackUrl:"/admin/login"})}]},ed=S.adminLogoUrl?i.jsx("img",{src:S.adminLogoUrl,alt:"logo",style:{maxHeight:36,maxWidth:140,objectFit:"contain"}}):S.adminSiteName||"CMS";return(0,i.jsxs)(s.default,{style:{minHeight:"100vh"},children:[i.jsx("style",{children:`
        @keyframes bellShake {
          0% { transform: rotate(0); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-14deg); }
          30% { transform: rotate(10deg); }
          40% { transform: rotate(-10deg); }
          50% { transform: rotate(6deg); }
          60% { transform: rotate(-6deg); }
          70% { transform: rotate(2deg); }
          80% { transform: rotate(-2deg); }
          90% { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
        @keyframes badgePulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(255, 77, 79, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 77, 79, 0); }
        }
        .bell-shake .anticon-bell {
          display: inline-block;
          animation: bellShake 0.8s ease-in-out;
          transform-origin: top center;
        }
        .bell-shake + .ant-badge-count,
        .ant-badge .ant-badge-count {
          animation: badgePulse 1.5s infinite;
        }
        .admin-route-loader {
          position: absolute;
          inset: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${S.adminLoaderBgColor};
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 0.2s ease, visibility 0.2s ease;
        }
        .admin-route-loader.visible {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
        .admin-content.admin-route-loading .ant-spin-nested-loading > .ant-spin {
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
        .admin-content.admin-route-loading .ant-spin {
          opacity: 0 !important;
          visibility: hidden !important;
        }
        .admin-route-loader-spinner {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 3px solid rgba(0, 0, 0, 0.12);
          border-top-color: ${S.adminLoaderColor};
          animation: adminRouteSpin 0.8s linear infinite;
          background: transparent;
        }
        @keyframes adminRouteSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Admin sidebar overlay drawer */
        .admin-sidebar-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          z-index: 199;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .admin-sidebar-backdrop.visible {
          opacity: 1;
          visibility: visible;
        }

        .admin-sidebar {
          position: fixed !important;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 200;
          height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 5px 0 15px rgba(0, 0, 0, 0.04);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.2s ease;
        }
        .admin-sidebar-menu-wrap {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .admin-sidebar-menu-wrap::-webkit-scrollbar {
          display: none;
        }

        .admin-sidebar .ant-menu-item:hover {
          background: ${S.adminSidebarHoverBg} !important;
          color: ${S.adminSidebarHoverText} !important;
        }
        .admin-sidebar .ant-menu-item:hover a {
          color: ${S.adminSidebarHoverText} !important;
        }
        .admin-sidebar .ant-menu-item-selected {
          background: ${S.adminSidebarActiveBg} !important;
          color: ${S.adminSidebarActiveText} !important;
        }
        .admin-sidebar .ant-menu-item-selected a {
          color: ${S.adminSidebarActiveText} !important;
        }
        .admin-sidebar .ant-menu-submenu-title:hover {
          background: ${S.adminSidebarHoverBg} !important;
          color: ${S.adminSidebarHoverText} !important;
        }
        .admin-sidebar .ant-menu-item a {
          color: ${S.adminSidebarText};
        }
        .admin-sidebar .ant-menu-submenu-title {
          color: ${S.adminSidebarText} !important;
        }
        .admin-sidebar .ant-menu-light {
          background: transparent;
        }

        /* Inject admin loader color as CSS variable */
        :root {
          --admin-loader-color: ${S.adminLoaderColor};
        }

        /* Override Ant Design Spin color globally for admin */
        .admin-content .ant-spin .ant-spin-dot-item,
        .ant-drawer .ant-spin .ant-spin-dot-item,
        .ant-modal-root .ant-spin .ant-spin-dot-item {
          background-color: ${S.adminLoaderColor} !important;
        }
        .admin-content .ant-spin {
          color: ${S.adminLoaderColor} !important;
        }

        /* Admin CTA button override — covers content, drawers, modals, popovers */
        .admin-content .ant-btn-primary,
        .ant-drawer .ant-btn-primary,
        .ant-modal-root .ant-btn-primary,
        .ant-popover .ant-btn-primary {
          background: ${S.adminCtaBgColor} !important;
          border-color: ${S.adminCtaBgColor} !important;
          color: ${S.adminCtaTextColor} !important;
        }
        .admin-content .ant-btn-primary:hover,
        .ant-drawer .ant-btn-primary:hover,
        .ant-modal-root .ant-btn-primary:hover,
        .ant-popover .ant-btn-primary:hover {
          background: ${S.adminCtaHoverBgColor||S.adminCtaBgColor} !important;
          border-color: ${S.adminCtaHoverBgColor||S.adminCtaBgColor} !important;
          color: ${S.adminCtaHoverTextColor||S.adminCtaTextColor} !important;
          opacity: ${S.adminCtaHoverBgColor?1:.85};
        }

        /* Make all admin tables horizontally scrollable on small screens */
        .admin-content .ant-table-wrapper .ant-table {
          overflow-x: auto;
        }

        /* Responsive overrides */
        @media (max-width: 991px) {
          .admin-sidebar {
            transform: translateX(-100%);
          }
          .admin-sidebar.mobile-open {
            transform: translateX(0);
          }
          .admin-header {
            left: 0 !important;
            padding: 0 12px 0 4px !important;
          }
          .admin-header .admin-search-input {
            display: none;
          }
        }
      `}),i.jsx("div",{className:`admin-sidebar-backdrop ${y&&w?"visible":""}`,onClick:()=>j(!1)}),(0,i.jsxs)("div",{className:`admin-sidebar ${y&&w?"mobile-open":""}`,style:{width:ea?200:0,background:S.adminSidebarBg,...y?{width:200}:{}},children:[(0,i.jsxs)("div",{style:{height:64,minHeight:64,color:S.adminSidebarText,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:600,overflow:"hidden",borderBottom:`1px solid ${S.adminBorderColor}`,padding:"0 12px",position:"relative",flexShrink:0},children:["string"==typeof ed?i.jsx("span",{style:{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},children:ed}):ed,y&&i.jsx(u.ZP,{type:"text",icon:i.jsx(A.Z,{}),onClick:()=>j(!1),style:{position:"absolute",right:4,top:"50%",transform:"translateY(-50%)",color:S.adminSidebarText,fontSize:16}})]}),i.jsx("div",{className:"admin-sidebar-menu-wrap",children:i.jsx(b.Z,{theme:"light",mode:"inline",selectedKeys:[C],items:I,style:{borderRight:0,color:S.adminSidebarText,paddingTop:8}})})]}),(0,i.jsxs)(s.default,{className:`admin-content ${X?"admin-route-loading":""}`,style:{marginLeft:er,minHeight:"100vh",transition:"margin-left 0.2s ease"},children:[(0,i.jsxs)(P,{className:"admin-header",style:{position:"fixed",top:0,left:er,right:0,zIndex:99,padding:"0 16px 0 8px",background:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,height:64,borderBottom:`1px solid ${S.adminBorderColor}`,boxShadow:"0px 4px 6px rgba(0, 0, 0, 0.04)",transition:"left 0.2s ease"},children:[i.jsx(u.ZP,{type:"text",icon:y?w?i.jsx(A.Z,{}):i.jsx(z.Z,{}):r?i.jsx(z.Z,{}):i.jsx(R.Z,{}),onClick:()=>{y?j(!w):x(!r)},style:{fontSize:18,color:S.adminTextColor}}),(0,i.jsxs)(f.Z,{size:"middle",style:{marginLeft:"auto"},children:[i.jsx(p.Z,{content:es,trigger:"click",open:O,onOpenChange:W,placement:"bottomRight",arrow:!1,overlayInnerStyle:{padding:0,borderRadius:12,overflow:"hidden"},children:i.jsx(h.Z,{count:U.length,size:"small",offset:[-2,2],children:i.jsx(u.ZP,{type:"text",className:V?"bell-shake":"",icon:i.jsx(L.Z,{style:{fontSize:18,color:S.adminTextColor}})})})}),i.jsx(g.Z,{menu:el,placement:"bottomRight",children:i.jsx(c.Z,{size:"default",icon:i.jsx(N.Z,{}),style:{backgroundColor:"rgba(0, 0, 0, 0.08)",color:S.adminTextColor,cursor:"pointer"}})})]})]}),(0,i.jsxs)("div",{style:{marginTop:64,minHeight:"calc(100vh - 64px)",position:"relative"},children:[i.jsx(E,{style:{padding:y?8:10},children:e}),i.jsx("div",{className:`admin-route-loader ${X?"visible":""}`,children:i.jsx("div",{className:"admin-route-loader-spinner"})})]})]})]})}},70310:(e,t,n)=>{"use strict";n.r(t),n.d(t,{default:()=>l});var i=n(19510),a=n(75571),r=n(58585),o=n(77999);let s=(0,n(68570).createProxy)(String.raw`/var/www/mescotrust_cms/components/admin/AdminLayoutClient.js#default`);async function l({children:e}){let t=await (0,a.getServerSession)(o.L);t||(0,r.redirect)("/admin/login");let n=t.user?.name||t.user?.email||"Admin",l=t.user?.role||"";return i.jsx(s,{userName:n,userRole:l,children:e})}},7641:(e,t,n)=>{"use strict";function i(){return null}n.r(t),n.d(t,{default:()=>i})},79380:(e,t,n)=>{"use strict";n.r(t),n.d(t,{default:()=>i});let i=(0,n(68570).createProxy)(String.raw`/var/www/mescotrust_cms/app/admin/error.js#default`)},5986:(e,t,n)=>{"use strict";function i({children:e}){return e}n.r(t),n.d(t,{default:()=>i})},77999:(e,t,n)=>{"use strict";n.d(t,{L:()=>l}),n(75571);var i=n(53797),a=n(42023),r=n.n(a),o=n(84191);let s=async()=>{let e=await Promise.resolve().then(n.t.bind(n,11185,23));return{User:(await n.e(3077).then(n.t.bind(n,83077,23))).default,mongoose:e}},l={providers:[(0,i.Z)({name:"Credentials",credentials:{email:{label:"Email",type:"email"},password:{label:"Password",type:"password"}},async authorize(e){if(!e?.email||!e?.password)return null;await (0,o.connectDB)();let{User:t}=await s(),n=await t.findOne({email:e.email,status:"active"}).select("+password");return n&&await r().compare(e.password,n.password)?{id:n._id.toString(),email:n.email,name:n.name,role:n.role}:null}})],callbacks:{jwt:async({token:e,user:t})=>(t&&(e.id=t.id,e.role=t.role),e),session:async({session:e,token:t})=>(e.user&&(e.user.id=t.id,e.user.role=t.role),e)},session:{strategy:"jwt",maxAge:2592e3},pages:{signIn:"/admin/login"},secret:process.env.NEXTAUTH_SECRET}}};