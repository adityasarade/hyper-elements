import{A as e,C as t,Ct as n,J as r,O as i,S as a,St as o,_t as s,a as c,at as l,bt as ee,ct as te,dt as ne,ft as re,gt as ie,ht as ae,i as oe,it as se,lt as u,mt as ce,ot as le,pt as d,q as f,r as ue,rt as de,st as fe,tt as p,ut as m,vt as h,xt as g,y as _,yt as v}from"./SideBySide-CmUEinHj.js";import{t as y}from"./jsx-runtime-Ce5xnspg.js";var b=(e,t)=>o(e,t),pe=[`label`,`description`,`guidance`,`required`,`default`,`roots`,`editable`,`support`],me={text:[`enum`,`maxLength`,`pattern`],color:[`transparency`],number:[`min`,`max`,`integer`],length:[`units`,`min`],list:[`min`,`max`],blocks:[`min`,`max`]};function x(e,t){let n=[...pe,...me[e]??[]];for(let r of Object.keys(t??{})){if(r===`editor`||r===`editorOptions`)throw Error(`[Elements] prop.${e} takes no ${r}: a prop is edited with its kind's editor, or is a property of your own, made with defineProperty() (price: currency({ label: "Price", symbol: "€" }))`);if(!n.includes(r))throw Error(`[Elements] prop.${e} has no option named ${r} (it takes ${n.join(`, `)})`)}return t??{}}var he={text:e=>{let{enum:t,maxLength:r,pattern:i,...a}=x(`text`,e);if(t!==void 0&&!(Array.isArray(t)&&t.length>0&&t.every(e=>typeof e==`string`)))throw Error(`[Elements] A text's enum lists the texts it may be (["$", "€"]), not ${JSON.stringify(t)}`);if(t!==void 0&&(r!==void 0||i!==void 0))throw Error(`[Elements] A text with an enum is one of the texts it lists: it takes no ${r===void 0?`pattern`:`maxLength`}`);return b(t?d(t):n({maxLength:r,...i===void 0?{}:{pattern:new RegExp(i,`u`)}}),a)},date:e=>b(ne(),x(`date`,e)),color:e=>{let{transparency:t,...n}=x(`color`,e);if(t!==void 0&&typeof t!=`boolean`)throw Error(`[Elements] A color's transparency is true or false, not ${JSON.stringify(t)}`);return b(m({transparency:t}),n)},image:e=>b(fe(),x(`image`,e)),link:e=>b(h(),x(`link`,e)),boolean:e=>b(u(),x(`boolean`,e)),fontFamily:e=>b(ce(),x(`fontFamily`,e)),fontWeight:e=>b(ae(),x(`fontWeight`,e)),number:e=>{let{min:t,max:n,integer:r,...i}=x(`number`,e);return b(ee({min:t,max:n,integer:r}),i)},length:e=>{let{units:t,min:n,...r}=x(`length`,e);return b(s(t,{min:n}),r)}},ge={list:(e,t)=>{let{min:n,max:r,...i}=x(`list`,t);return{...b(v(e.kind,{min:n,max:r}),i),item:e}},blocks:(e,t)=>{let{min:n,max:r,...i}=x(`blocks`,t);return{...b(te(Object.fromEntries(Object.entries(e).map(([e,t])=>[e,t.kind])),{min:n,max:r}),i),blocks:e}},object:(e,t)=>({...b(g(Object.fromEntries(Object.entries(e).map(([e,t])=>[e,{kind:t.kind,...t.required?{required:!0}:{},...t.default===void 0?{}:{default:t.default}}]))),x(`object`,t)),fields:e})},S={...he,...ge,choice:(e,t)=>b(d(e),x(`choice`,t))};function C(e){let t=e.render,n=re({type:e.type,label:e.label,description:e.description,props:e.props,placement:e.placement,expand(e,n){let{nodes:r,components:i,diagnostics:a}=de(t(e,{theme:n.theme??{}}));for(let e of i)n.register(e);if(a.some(e=>e.severity===`error`))throw Error(ie(a));for(let e of a)n.report(e);return r.length===1?r[0]:r}}),r=e=>{let t=se();if(!t)throw Error(`[Elements] <${n.type}> is part of a design: render the design with render(), not this element on its own`);return le(t,n),l(t,n.type,e)};return r.displayName=n.type,Object.defineProperty(r,"definition",{value:n,enumerable:!0}),r}var w=y(),_e=`#F7F3EA`,T=`#FFFDF8`,E=`#1E1C19`,D=`#6C665B`,O=`#A9A293`,k=`#E2DBCC`,A=`#2E5041`,j=`#9A4A2A`,M=`#B0872E`,N=`'Cormorant Garamond', Georgia, 'Times New Roman', serif`,P=`'Instrument Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif`,F=`'DM Mono', SFMono-Regular, Menlo, Consolas, monospace`,I=`https://long-shelf.example`,L={fonts:[{family:`Cormorant Garamond`,src:`https://fonts.gstatic.com/s/cormorantgaramond/v21/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtKky2F7g.woff2`,format:`woff2`,weight:`300 700`},{family:`Cormorant Garamond`,src:`https://fonts.gstatic.com/s/cormorantgaramond/v21/co3ZmX5slCNuHLi8bLeY9MK7whWMhyjYrEtImSqn7B6D.woff2`,format:`woff2`,weight:`300 700`,style:`italic`},{family:`Instrument Sans`,src:`https://fonts.gstatic.com/s/instrumentsans/v4/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1ZuWi3g.woff2`,format:`woff2`,weight:`400 700`},{family:`DM Mono`,src:`https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2`,format:`woff2`,weight:400}],style:{backgroundColor:_e,color:E,fontFamily:P,fontSize:16,lineHeight:1.5}},R={fontFamily:F,fontSize:12,lineHeight:1.5,letterSpacing:1,textTransform:`uppercase`,color:D},z={fontFamily:F,fontSize:12,lineHeight:1.5,color:D},B=e=>({fontFamily:N,fontWeight:500,fontSize:e,lineHeight:1.08,letterSpacing:-.3}),V=e=>(0,w.jsxs)(f,{stackOnMobile:!1,style:{alignItems:`end`,padding:[0,0,10],border:{bottom:`1px solid ${E}`}},children:[(0,w.jsx)(a,{style:{width:140},children:(0,w.jsx)(p,{style:{...B(26),fontStyle:`italic`,lineHeight:`28px`},children:`Long Shelf`})}),(0,w.jsx)(a,{children:(0,w.jsx)(p,{style:{...R,textAlign:`right`},children:e})})]}),ve={title:`Components/Custom components`,args:oe,argTypes:ue,parameters:{docs:{description:{component:"`defineElement()` names a block made of other elements, with typed props: `prop.text`, `prop.color`, `prop.image`, `prop.link`, `prop.number`, `prop.choice`, `prop.boolean`. It's kept as one node in the document, and drawn from its `render` as an Email and as a Page. \"Show code\" has its definition and how it's used."}}}},H=(e,t)=>({...c(t),parameters:{docs:{source:{code:e,language:`tsx`}}}}),U=C({type:`longshelf.Countdown`,label:`Countdown`,props:{headline:S.text({label:`Headline`,default:`The winter sale ends in`}),days:S.text({label:`Days`,default:`02`}),hours:S.text({label:`Hours`,default:`11`}),minutes:S.text({label:`Minutes`,default:`45`}),accent:S.color({label:`Accent`,default:A})},render:({headline:e,days:t,hours:n,minutes:r,accent:o})=>(0,w.jsxs)(a,{style:{gap:14,alignItems:`center`},children:[(0,w.jsx)(i,{level:2,style:{...B(30),textAlign:`center`,color:o},children:e}),(0,w.jsx)(f,{stackOnMobile:!1,style:{gap:8,justifyContent:`center`},children:[[t,`Days`],[n,`Hours`],[r,`Mins`]].map(([e,t])=>(0,w.jsxs)(a,{style:{width:92,padding:[8,0,12],gap:2,backgroundColor:E,color:T,borderRadius:2,textAlign:`center`},children:[(0,w.jsx)(p,{style:{...B(46),lineHeight:1.25},children:e}),(0,w.jsx)(p,{style:{...R,fontSize:11,color:O},children:t})]},t))})]})}),W=H(`import { Column, defineElement, Email, Heading, prop, Row, Section, Text } from "@hyper-elements/react";

const Countdown = defineElement({
  type: "longshelf.Countdown",
  label: "Countdown",
  props: {
    headline: prop.text({ label: "Headline", default: "The winter sale ends in" }),
    days: prop.text({ label: "Days", default: "02" }),
    hours: prop.text({ label: "Hours", default: "11" }),
    minutes: prop.text({ label: "Minutes", default: "45" }),
    accent: prop.color({ label: "Accent", default: "#2E5041" }),
  },
  render: ({ headline, days, hours, minutes, accent }) => (
    <Column style={{ gap: 14, alignItems: "center" }}>
      <Heading level={2} style={{ textAlign: "center", color: accent }}>{headline}</Heading>
      <Row stackOnMobile={false} style={{ gap: 8, justifyContent: "center" }}>
        {/* A Column for each of days, hours and minutes */}
      </Row>
    </Column>
  ),
});

const template = (
  <Email>
    <Section>
      <Countdown />
      <Countdown headline="Doors open for Ines Varga in" days="00" hours="03" minutes="20" accent="#9A4A2A" />
    </Section>
  </Email>
);`,e=>(0,w.jsx)(e,{width:560,...L,children:(0,w.jsxs)(r,{style:{padding:[28,32,44],gap:32,mobile:{padding:[20,20,32],gap:28}},children:[V(`This week`),(0,w.jsx)(U,{}),(0,w.jsx)(t,{style:{borderTop:`1px solid ${k}`}}),(0,w.jsx)(U,{headline:`Doors open for Ines Varga in`,days:`00`,hours:`03`,minutes:`20`,accent:j})]})})),G=(e,t,n,r,i)=>({src:`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="${e}"/><rect x="202" y="32" width="208" height="344" fill="#000" opacity=".12"/><rect x="196" y="24" width="208" height="344" fill="${t}"/>${i}<text x="300" y="332" fill="${n}" font-family="Georgia, serif" font-size="23" text-anchor="middle">${r}</text></svg>`)}`,width:600,height:400}),ye=G(`#E7DFCF`,`#254653`,`#F3E9D2`,`Low Water`,`<circle cx="300" cy="124" r="52" fill="#E2B04A"/><path d="M196 196q26-20 52 0t52 0 52 0 52 0v172H196Z" fill="#17323D"/><path d="M196 234q26-20 52 0t52 0 52 0 52 0" fill="none" stroke="#F3E9D2" stroke-width="2"/>`),K=G(`#E4E2D2`,`#E9DFC6`,`#2E3B24`,`The Orchard Year`,`<circle cx="300" cy="136" r="78" fill="#5C6B3C"/><rect x="294" y="196" width="12" height="84" fill="#3E2E20"/><circle cx="272" cy="118" r="10" fill="#B54A33"/><circle cx="322" cy="104" r="10" fill="#B54A33"/><circle cx="332" cy="154" r="10" fill="#B54A33"/><circle cx="284" cy="160" r="10" fill="#B54A33"/>`),q=C({type:`longshelf.BookCard`,label:`Book card`,props:{jacket:S.image({label:`Jacket`,required:!0}),title:S.text({label:`Title`,required:!0}),blurb:S.text({label:`Blurb`,required:!0}),price:S.text({label:`Price`,required:!0}),href:S.link({label:`Link`,required:!0}),cta:S.text({label:`Button`,default:`Add to basket`}),accent:S.color({label:`Accent`,default:A})},render:({jacket:t,title:n,blurb:r,price:o,href:s,cta:c,accent:l})=>(0,w.jsxs)(a,{style:{gap:14,padding:[0,0,18],backgroundColor:T,borderRadius:3},children:[(0,w.jsx)(e,{src:t,alt:`The jacket of ${n}.`,style:{width:`100%`,borderRadius:[3,3,0,0]}}),(0,w.jsxs)(a,{style:{gap:8,padding:[0,16]},children:[(0,w.jsx)(i,{level:3,style:B(26),children:n}),(0,w.jsx)(p,{style:{fontSize:14,lineHeight:1.45,color:D},children:r}),(0,w.jsx)(p,{style:{...B(28),color:l},children:o}),(0,w.jsx)(_,{href:s,style:{width:`100%`,backgroundColor:l,fontSize:14,fontWeight:600,padding:[12,0],borderRadius:2},children:c})]})]})}),J=H(`import { Button, Column, defineElement, Email, Heading, Image, Text, prop, Row, Section } from "@hyper-elements/react";

const BookCard = defineElement({
  type: "longshelf.BookCard",
  label: "Book card",
  props: {
    jacket: prop.image({ label: "Jacket", required: true }),
    title: prop.text({ label: "Title", required: true }),
    blurb: prop.text({ label: "Blurb", required: true }),
    price: prop.text({ label: "Price", required: true }),
    href: prop.link({ label: "Link", required: true }),
    cta: prop.text({ label: "Button", default: "Add to basket" }),
    accent: prop.color({ label: "Accent", default: "#2E5041" }),
  },
  render: ({ jacket, title, blurb, price, href, cta, accent }) => (
    <Column style={{ gap: 14 }}>
      <Image src={jacket} alt={\`The jacket of \${title}.\`} style={{ width: "100%" }} />
      <Heading level={3}>{title}</Heading>
      <Text>{blurb}</Text>
      <Text style={{ color: accent }}>{price}</Text>
      <Button href={href} style={{ backgroundColor: accent }}>{cta}</Button>
    </Column>
  ),
});

const template = (
  <Email>
    <Section>
      <Row style={{ gap: 16 }}>
        <BookCard jacket={{ src: "https://long-shelf.example/low-water.png", width: 600, height: 400 }} title="Low Water" blurb="Six stories from the Severn." price="£14" href="https://long-shelf.example/low-water" />
        <BookCard style={{ flex: 2 }} jacket={{ src: "https://long-shelf.example/orchard-year.png", width: 600, height: 400 }} title="The Orchard Year" blurb="Twelve months with one Herefordshire orchard." price="£22" href="https://long-shelf.example/orchard-year" cta="Reserve a copy" accent="#9A4A2A" />
      </Row>
    </Section>
  </Email>
);`,e=>(0,w.jsx)(e,{width:640,...L,children:(0,w.jsxs)(r,{style:{padding:[28,24,40],gap:20,mobile:{padding:[20,16,32]}},children:[V(`New this week`),(0,w.jsxs)(f,{style:{gap:16},children:[(0,w.jsx)(q,{jacket:ye,title:`Low Water`,blurb:`Six stories from the Severn, where the tide comes in faster than a man can run.`,price:`£14`,href:`${I}/low-water`}),(0,w.jsx)(q,{style:{flex:2},jacket:K,title:`The Orchard Year`,blurb:`Twelve months with one Herefordshire orchard: its grafts, its frosts, its pickers, and the three old men who still argue over when to prune. Hardback, with colour plates.`,price:`£22`,href:`${I}/orchard-year`,cta:`Reserve a copy`,accent:j})]})]})})),Y=C({type:`longshelf.Rating`,label:`Rating`,props:{score:S.number({label:`Score`,min:0,max:5,integer:!0,required:!0}),size:S.choice([`small`,`large`],{label:`Size`,default:`small`}),showScore:S.boolean({label:`Show the score`,default:!1})},render:({score:e,size:t,showScore:n})=>(0,w.jsx)(p,{style:{fontSize:t===`large`?30:16,lineHeight:1.2,letterSpacing:t===`large`?3:1,color:M},children:`★`.repeat(e)+`☆`.repeat(5-e)+(n?` ${e} of 5`:``)})}),X=(e,t,n)=>(0,w.jsxs)(a,{style:{gap:6,padding:[16,0],border:{top:`1px solid ${k}`}},children:[e,(0,w.jsx)(p,{style:{...B(21),fontWeight:400,lineHeight:1.25,letterSpacing:0},children:t}),(0,w.jsx)(p,{style:z,children:n})]}),Z=H(`import { defineElement, Email, prop, Section, Text } from "@hyper-elements/react";

const Rating = defineElement({
  type: "longshelf.Rating",
  label: "Rating",
  props: {
    score: prop.number({ label: "Score", min: 0, max: 5, integer: true, required: true }),
    size: prop.choice(["small", "large"], { label: "Size", default: "small" }),
    showScore: prop.boolean({ label: "Show the score", default: false }),
  },
  render: ({ score, size, showScore }) => (
    <Text style={{ fontSize: size === "large" ? 30 : 16, color: "#B0872E" }}>
      {"★".repeat(score) + "☆".repeat(5 - score) + (showScore ? \` \${score} of 5\` : "")}
    </Text>
  ),
});

const template = (
  <Email>
    <Section>
      <Rating score={5} size="large" />
      <Rating score={4} showScore />
      <Rating score={3} />
    </Section>
  </Email>
);`,e=>(0,w.jsx)(e,{width:560,...L,children:(0,w.jsxs)(r,{style:{padding:[28,44,44],gap:24,mobile:{padding:[20,22,32]}},children:[V(`What readers said`),(0,w.jsxs)(a,{style:{gap:8},children:[(0,w.jsx)(Y,{score:5,size:`large`}),(0,w.jsx)(i,{level:2,style:B(38),children:`Low Water`}),(0,w.jsx)(p,{style:{fontSize:15,color:D},children:`Ines Varga. Our book of the month, by a long way.`})]}),(0,w.jsxs)(a,{children:[X((0,w.jsx)(Y,{score:4,showScore:!0}),`I read it on a train, and missed my stop.`,`Priya, Gloucester`),X((0,w.jsx)(Y,{score:3}),`Beautiful, and too sad for January. I’ll try again in spring.`,`Tom, Stroud`)]})]})})),Q=C({type:`longshelf.Hero`,label:`Hero`,placement:`section`,props:{title:S.text({label:`Title`,required:!0}),kicker:S.text({label:`Kicker`,default:`Long Shelf`}),background:S.color({label:`Background`,default:E})},render:({title:e,kicker:t,background:n})=>(0,w.jsxs)(r,{style:{backgroundColor:n,color:T,padding:[52,24,56],gap:10,textAlign:`center`,mobile:{padding:[40,20,44]}},children:[(0,w.jsx)(p,{style:{...R,color:O},children:t}),(0,w.jsx)(i,{level:1,style:{...B(60),fontStyle:`italic`,mobile:{fontSize:48}},children:e})]})}),$=H(`import { defineElement, Email, Heading, Text, prop, Section } from "@hyper-elements/react";

const Hero = defineElement({
  type: "longshelf.Hero",
  label: "Hero",
  placement: "section",
  props: {
    title: prop.text({ label: "Title", required: true }),
    kicker: prop.text({ label: "Kicker", default: "Long Shelf" }),
    background: prop.color({ label: "Background", default: "#1E1C19" }),
  },
  render: ({ title, kicker, background }) => (
    <Section style={{ backgroundColor: background, color: "#FFFDF8", padding: [52, 24, 56], textAlign: "center" }}>
      <Text>{kicker}</Text>
      <Heading level={1} style={{ fontSize: 60, fontStyle: "italic" }}>{title}</Heading>
    </Section>
  ),
});

const template = (
  <Email>
    <Hero title="New arrivals" />
    <Section>
      <Text>The rest of the email goes on under it.</Text>
    </Section>
    <Hero title="Last chance" kicker="The winter sale" background="#2E5041" />
  </Email>
);`,e=>(0,w.jsxs)(e,{width:560,...L,children:[(0,w.jsx)(Q,{title:`New arrivals`}),(0,w.jsxs)(r,{style:{padding:[36,44],gap:10,mobile:{padding:[28,22]}},children:[(0,w.jsx)(p,{style:{...B(24),fontWeight:400,lineHeight:1.3,letterSpacing:0,textAlign:`center`},children:`Eleven books came in this week, three of them first novels, and one that Maud has already put aside for herself.`}),(0,w.jsx)(p,{style:{...z,textAlign:`center`},children:`The band above and the one below are each one Hero: it goes where a Section goes.`})]}),(0,w.jsx)(Q,{title:`Last chance`,kicker:`The winter sale`,background:A})]}));W.__docgenInfo={description:`A countdown from its props: with their defaults, and with its own.`,methods:[],displayName:`CountdownTimer`},J.__docgenInfo={description:"A book card: a required jacket and link, and a color and a button's words with defaults. Two sit in a `Row`, one with a larger `flex`.",methods:[],displayName:`ProductCards`},Z.__docgenInfo={description:"A rating worked out from its props in `render`: a number, a choice of sizes, and a switch.",methods:[],displayName:`WorkedOutFromProps`},$.__docgenInfo={description:'`placement: "section"` makes an element a band of its own: it goes where a `Section` goes, and renders one.',methods:[],displayName:`AWholeSection`},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`story(\`import { Column, defineElement, Email, Heading, prop, Row, Section, Text } from "@hyper-elements/react";

const Countdown = defineElement({
  type: "longshelf.Countdown",
  label: "Countdown",
  props: {
    headline: prop.text({ label: "Headline", default: "The winter sale ends in" }),
    days: prop.text({ label: "Days", default: "02" }),
    hours: prop.text({ label: "Hours", default: "11" }),
    minutes: prop.text({ label: "Minutes", default: "45" }),
    accent: prop.color({ label: "Accent", default: "#2E5041" }),
  },
  render: ({ headline, days, hours, minutes, accent }) => (
    <Column style={{ gap: 14, alignItems: "center" }}>
      <Heading level={2} style={{ textAlign: "center", color: accent }}>{headline}</Heading>
      <Row stackOnMobile={false} style={{ gap: 8, justifyContent: "center" }}>
        {/* A Column for each of days, hours and minutes */}
      </Row>
    </Column>
  ),
});

const template = (
  <Email>
    <Section>
      <Countdown />
      <Countdown headline="Doors open for Ines Varga in" days="00" hours="03" minutes="20" accent="#9A4A2A" />
    </Section>
  </Email>
);\`, Root => <Root width={560} {...root}>
      <Section style={{
    padding: [28, 32, 44],
    gap: 32,
    mobile: {
      padding: [20, 20, 32],
      gap: 28
    }
  }}>
        {masthead("This week")}
        <Countdown />
        <Divider style={{
      borderTop: \`1px solid \${RULE}\`
    }} />
        <Countdown headline="Doors open for Ines Varga in" days="00" hours="03" minutes="20" accent={CLAY} />
      </Section>
    </Root>)`,...W.parameters?.docs?.source},description:{story:`A countdown from its props: with their defaults, and with its own.`,...W.parameters?.docs?.description}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`story(\`import { Button, Column, defineElement, Email, Heading, Image, Text, prop, Row, Section } from "@hyper-elements/react";

const BookCard = defineElement({
  type: "longshelf.BookCard",
  label: "Book card",
  props: {
    jacket: prop.image({ label: "Jacket", required: true }),
    title: prop.text({ label: "Title", required: true }),
    blurb: prop.text({ label: "Blurb", required: true }),
    price: prop.text({ label: "Price", required: true }),
    href: prop.link({ label: "Link", required: true }),
    cta: prop.text({ label: "Button", default: "Add to basket" }),
    accent: prop.color({ label: "Accent", default: "#2E5041" }),
  },
  render: ({ jacket, title, blurb, price, href, cta, accent }) => (
    <Column style={{ gap: 14 }}>
      <Image src={jacket} alt={\\\`The jacket of \\\${title}.\\\`} style={{ width: "100%" }} />
      <Heading level={3}>{title}</Heading>
      <Text>{blurb}</Text>
      <Text style={{ color: accent }}>{price}</Text>
      <Button href={href} style={{ backgroundColor: accent }}>{cta}</Button>
    </Column>
  ),
});

const template = (
  <Email>
    <Section>
      <Row style={{ gap: 16 }}>
        <BookCard jacket={{ src: "https://long-shelf.example/low-water.png", width: 600, height: 400 }} title="Low Water" blurb="Six stories from the Severn." price="£14" href="https://long-shelf.example/low-water" />
        <BookCard style={{ flex: 2 }} jacket={{ src: "https://long-shelf.example/orchard-year.png", width: 600, height: 400 }} title="The Orchard Year" blurb="Twelve months with one Herefordshire orchard." price="£22" href="https://long-shelf.example/orchard-year" cta="Reserve a copy" accent="#9A4A2A" />
      </Row>
    </Section>
  </Email>
);\`, Root => <Root width={640} {...root}>
      <Section style={{
    padding: [28, 24, 40],
    gap: 20,
    mobile: {
      padding: [20, 16, 32]
    }
  }}>
        {masthead("New this week")}
        <Row style={{
      gap: 16
    }}>
          <BookCard jacket={LOW_WATER} title="Low Water" blurb="Six stories from the Severn, where the tide comes in faster than a man can run." price="£14" href={\`\${SITE}/low-water\`} />
          <BookCard style={{
        flex: 2
      }} jacket={ORCHARD_YEAR} title="The Orchard Year" blurb="Twelve months with one Herefordshire orchard: its grafts, its frosts, its pickers, and the three old men who still argue over when to prune. Hardback, with colour plates." price="£22" href={\`\${SITE}/orchard-year\`} cta="Reserve a copy" accent={CLAY} />
        </Row>
      </Section>
    </Root>)`,...J.parameters?.docs?.source},description:{story:"A book card: a required jacket and link, and a color and a button's words with defaults. Two sit in a `Row`, one with a larger `flex`.",...J.parameters?.docs?.description}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`story(\`import { defineElement, Email, prop, Section, Text } from "@hyper-elements/react";

const Rating = defineElement({
  type: "longshelf.Rating",
  label: "Rating",
  props: {
    score: prop.number({ label: "Score", min: 0, max: 5, integer: true, required: true }),
    size: prop.choice(["small", "large"], { label: "Size", default: "small" }),
    showScore: prop.boolean({ label: "Show the score", default: false }),
  },
  render: ({ score, size, showScore }) => (
    <Text style={{ fontSize: size === "large" ? 30 : 16, color: "#B0872E" }}>
      {"★".repeat(score) + "☆".repeat(5 - score) + (showScore ? \\\` \\\${score} of 5\\\` : "")}
    </Text>
  ),
});

const template = (
  <Email>
    <Section>
      <Rating score={5} size="large" />
      <Rating score={4} showScore />
      <Rating score={3} />
    </Section>
  </Email>
);\`, Root => <Root width={560} {...root}>
      <Section style={{
    padding: [28, 44, 44],
    gap: 24,
    mobile: {
      padding: [20, 22, 32]
    }
  }}>
        {masthead("What readers said")}
        <Column style={{
      gap: 8
    }}>
          <Rating score={5} size="large" />
          <Heading level={2} style={serif(38)}>
            Low Water
          </Heading>
          <Text style={{
        fontSize: 15,
        color: QUIET
      }}>Ines Varga. Our book of the month, by a long way.</Text>
        </Column>
        <Column>
          {review(<Rating score={4} showScore />, "I read it on a train, and missed my stop.", "Priya, Gloucester")}
          {review(<Rating score={3} />, "Beautiful, and too sad for January. I’ll try again in spring.", "Tom, Stroud")}
        </Column>
      </Section>
    </Root>)`,...Z.parameters?.docs?.source},description:{story:"A rating worked out from its props in `render`: a number, a choice of sizes, and a switch.",...Z.parameters?.docs?.description}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`story(\`import { defineElement, Email, Heading, Text, prop, Section } from "@hyper-elements/react";

const Hero = defineElement({
  type: "longshelf.Hero",
  label: "Hero",
  placement: "section",
  props: {
    title: prop.text({ label: "Title", required: true }),
    kicker: prop.text({ label: "Kicker", default: "Long Shelf" }),
    background: prop.color({ label: "Background", default: "#1E1C19" }),
  },
  render: ({ title, kicker, background }) => (
    <Section style={{ backgroundColor: background, color: "#FFFDF8", padding: [52, 24, 56], textAlign: "center" }}>
      <Text>{kicker}</Text>
      <Heading level={1} style={{ fontSize: 60, fontStyle: "italic" }}>{title}</Heading>
    </Section>
  ),
});

const template = (
  <Email>
    <Hero title="New arrivals" />
    <Section>
      <Text>The rest of the email goes on under it.</Text>
    </Section>
    <Hero title="Last chance" kicker="The winter sale" background="#2E5041" />
  </Email>
);\`, Root => <Root width={560} {...root}>
      <Hero title="New arrivals" />
      <Section style={{
    padding: [36, 44],
    gap: 10,
    mobile: {
      padding: [28, 22]
    }
  }}>
        <Text style={{
      ...serif(24),
      fontWeight: 400,
      lineHeight: 1.3,
      letterSpacing: 0,
      textAlign: "center"
    }}>Eleven books came in this week, three of them first novels, and one that Maud has already put aside for herself.</Text>
        <Text style={{
      ...note,
      textAlign: "center"
    }}>The band above and the one below are each one Hero: it goes where a Section goes.</Text>
      </Section>
      <Hero title="Last chance" kicker="The winter sale" background={CLOTH} />
    </Root>)`,...$.parameters?.docs?.source},description:{story:'`placement: "section"` makes an element a band of its own: it goes where a `Section` goes, and renders one.',...$.parameters?.docs?.description}}};var be=[`CountdownTimer`,`ProductCards`,`WorkedOutFromProps`,`AWholeSection`];export{$ as AWholeSection,W as CountdownTimer,J as ProductCards,Z as WorkedOutFromProps,be as __namedExportsOrder,ve as default};