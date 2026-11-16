import{A as e,C as t,Ct as n,J as r,O as i,S as a,St as o,_t as s,a as c,at as l,bt as ee,ct as te,dt as ne,ft as re,gt as ie,ht as u,i as ae,it as oe,lt as se,mt as d,ot as ce,pt as le,q as f,r as p,rt as m,st as h,tt as g,ut as _,vt as ue,xt as de,y as v,yt as y}from"./SideBySide-vjZoGcSf.js";import{t as b}from"./jsx-runtime-CoV0TBG2.js";function x(e){return t=>o(e(),t)}function S(e){return t=>o(e(),t)}var C={text:e=>{let{maxLength:t,pattern:r,...i}=e;return o(n({maxLength:t,...r===void 0?{}:{pattern:new RegExp(r,`u`)}}),i)},date:x(()=>ne()),list:(e,t)=>{let{min:n,max:r,...i}=t;return{...o(y(e.kind,{min:n,max:r}),i),item:e}},blocks:(e,t)=>{let{min:n,max:r,...i}=t,a=te(Object.fromEntries(Object.entries(e).map(([e,t])=>[e,t.kind])),{min:n,max:r});return{...o(a,i),blocks:e}},object:(e,t)=>{let n=de(Object.fromEntries(Object.entries(e).map(([e,t])=>[e,{kind:t.kind,...t.required?{required:!0}:{},...t.default===void 0?{}:{default:t.default}}])));return{...o(n,t),fields:e}},color:S(()=>_()),image:x(()=>h()),link:x(()=>ue()),boolean:x(()=>se()),fontFamily:S(()=>d()),fontWeight:x(()=>u()),number:e=>{let{min:t,max:n,integer:r,...i}=e;return o(ee({min:t,max:n,integer:r}),i)},length:e=>{let{units:t,min:n,...r}=e;return o(s(t,{min:n}),r)},choice:(e,t)=>o(le(e),t)};function w(e){let t=e.render,n=re({type:e.type,label:e.label,description:e.description,props:e.props,placement:e.placement,expand(e,n){let{nodes:r,components:i,diagnostics:a}=m(t(e,{theme:n.theme??{}}));for(let e of i)n.register(e);if(a.some(e=>e.severity===`error`))throw Error(ie(a));for(let e of a)n.report(e);return r.length===1?r[0]:r}}),r=e=>{let t=oe();if(!t)throw Error(`[Elements] <${n.type}> is part of a design: render the design with render(), not this element on its own`);return ce(t,n),l(t,n.type,e)};return r.displayName=n.type,Object.defineProperty(r,"definition",{value:n,enumerable:!0}),r}var T=b(),fe=`#F7F3EA`,E=`#FFFDF8`,D=`#1E1C19`,O=`#6C665B`,k=`#A9A293`,A=`#E2DBCC`,j=`#2E5041`,M=`#9A4A2A`,N=`#B0872E`,P=`'Cormorant Garamond', Georgia, 'Times New Roman', serif`,F=`'Instrument Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif`,I=`'DM Mono', SFMono-Regular, Menlo, Consolas, monospace`,L=`https://long-shelf.example`,R={fonts:[{family:`Cormorant Garamond`,src:`https://fonts.gstatic.com/s/cormorantgaramond/v21/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtKky2F7g.woff2`,format:`woff2`,weight:`300 700`},{family:`Cormorant Garamond`,src:`https://fonts.gstatic.com/s/cormorantgaramond/v21/co3ZmX5slCNuHLi8bLeY9MK7whWMhyjYrEtImSqn7B6D.woff2`,format:`woff2`,weight:`300 700`,style:`italic`},{family:`Instrument Sans`,src:`https://fonts.gstatic.com/s/instrumentsans/v4/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1ZuWi3g.woff2`,format:`woff2`,weight:`400 700`},{family:`DM Mono`,src:`https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2`,format:`woff2`,weight:400}],style:{backgroundColor:fe,color:D,fontFamily:F,fontSize:16,lineHeight:1.5}},z={fontFamily:I,fontSize:12,lineHeight:1.5,letterSpacing:1,textTransform:`uppercase`,color:O},B={fontFamily:I,fontSize:12,lineHeight:1.5,color:O},V=e=>({fontFamily:P,fontWeight:500,fontSize:e,lineHeight:1.08,letterSpacing:-.3}),H=e=>(0,T.jsxs)(f,{stackOnMobile:!1,style:{alignItems:`end`,padding:[0,0,10],border:{bottom:`1px solid ${D}`}},children:[(0,T.jsx)(a,{style:{width:140},children:(0,T.jsx)(g,{style:{...V(26),fontStyle:`italic`,lineHeight:`28px`},children:`Long Shelf`})}),(0,T.jsx)(a,{children:(0,T.jsx)(g,{style:{...z,textAlign:`right`},children:e})})]}),pe={title:`Components/Custom components`,args:ae,argTypes:p,parameters:{docs:{description:{component:"`defineElement()` names a block made of other elements, with typed props: `prop.text`, `prop.color`, `prop.image`, `prop.link`, `prop.number`, `prop.choice`, `prop.boolean`. It's kept as one node in the document, and drawn from its `render` as an Email and as a Page. \"Show code\" has its definition and how it's used."}}}},U=(e,t)=>({...c(t),parameters:{docs:{source:{code:e,language:`tsx`}}}}),W=w({type:`longshelf.Countdown`,label:`Countdown`,props:{headline:C.text({label:`Headline`,default:`The winter sale ends in`}),days:C.text({label:`Days`,default:`02`}),hours:C.text({label:`Hours`,default:`11`}),minutes:C.text({label:`Minutes`,default:`45`}),accent:C.color({label:`Accent`,default:j})},render:({headline:e,days:t,hours:n,minutes:r,accent:o})=>(0,T.jsxs)(a,{style:{gap:14,alignItems:`center`},children:[(0,T.jsx)(i,{level:2,style:{...V(30),textAlign:`center`,color:o},children:e}),(0,T.jsx)(f,{stackOnMobile:!1,style:{gap:8,justifyContent:`center`},children:[[t,`Days`],[n,`Hours`],[r,`Mins`]].map(([e,t])=>(0,T.jsxs)(a,{style:{width:92,padding:[8,0,12],gap:2,backgroundColor:D,color:E,borderRadius:2,textAlign:`center`},children:[(0,T.jsx)(g,{style:{...V(46),lineHeight:1.25},children:e}),(0,T.jsx)(g,{style:{...z,fontSize:11,color:k},children:t})]},t))})]})}),G=U(`import { Column, defineElement, Email, Heading, prop, Row, Section, Text } from "@hyper-elements/react";

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
);`,e=>(0,T.jsx)(e,{width:560,...R,children:(0,T.jsxs)(r,{style:{padding:[28,32,44],gap:32,mobile:{padding:[20,20,32],gap:28}},children:[H(`This week`),(0,T.jsx)(W,{}),(0,T.jsx)(t,{style:{borderTop:`1px solid ${A}`}}),(0,T.jsx)(W,{headline:`Doors open for Ines Varga in`,days:`00`,hours:`03`,minutes:`20`,accent:M})]})})),K=(e,t,n,r,i)=>({src:`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="${e}"/><rect x="202" y="32" width="208" height="344" fill="#000" opacity=".12"/><rect x="196" y="24" width="208" height="344" fill="${t}"/>${i}<text x="300" y="332" fill="${n}" font-family="Georgia, serif" font-size="23" text-anchor="middle">${r}</text></svg>`)}`,width:600,height:400}),me=K(`#E7DFCF`,`#254653`,`#F3E9D2`,`Low Water`,`<circle cx="300" cy="124" r="52" fill="#E2B04A"/><path d="M196 196q26-20 52 0t52 0 52 0 52 0v172H196Z" fill="#17323D"/><path d="M196 234q26-20 52 0t52 0 52 0 52 0" fill="none" stroke="#F3E9D2" stroke-width="2"/>`),he=K(`#E4E2D2`,`#E9DFC6`,`#2E3B24`,`The Orchard Year`,`<circle cx="300" cy="136" r="78" fill="#5C6B3C"/><rect x="294" y="196" width="12" height="84" fill="#3E2E20"/><circle cx="272" cy="118" r="10" fill="#B54A33"/><circle cx="322" cy="104" r="10" fill="#B54A33"/><circle cx="332" cy="154" r="10" fill="#B54A33"/><circle cx="284" cy="160" r="10" fill="#B54A33"/>`),q=w({type:`longshelf.BookCard`,label:`Book card`,props:{jacket:C.image({label:`Jacket`,required:!0}),title:C.text({label:`Title`,required:!0}),blurb:C.text({label:`Blurb`,required:!0}),price:C.text({label:`Price`,required:!0}),href:C.link({label:`Link`,required:!0}),cta:C.text({label:`Button`,default:`Add to basket`}),accent:C.color({label:`Accent`,default:j})},render:({jacket:t,title:n,blurb:r,price:o,href:s,cta:c,accent:l})=>(0,T.jsxs)(a,{style:{gap:14,padding:[0,0,18],backgroundColor:E,borderRadius:3},children:[(0,T.jsx)(e,{src:t,alt:`The jacket of ${n}.`,style:{width:`100%`,borderRadius:[3,3,0,0]}}),(0,T.jsxs)(a,{style:{gap:8,padding:[0,16]},children:[(0,T.jsx)(i,{level:3,style:V(26),children:n}),(0,T.jsx)(g,{style:{fontSize:14,lineHeight:1.45,color:O},children:r}),(0,T.jsx)(g,{style:{...V(28),color:l},children:o}),(0,T.jsx)(v,{href:s,style:{width:`100%`,backgroundColor:l,fontSize:14,fontWeight:600,padding:[12,0],borderRadius:2},children:c})]})]})}),J=U(`import { Button, Column, defineElement, Email, Heading, Image, Text, prop, Row, Section } from "@hyper-elements/react";

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
);`,e=>(0,T.jsx)(e,{width:640,...R,children:(0,T.jsxs)(r,{style:{padding:[28,24,40],gap:20,mobile:{padding:[20,16,32]}},children:[H(`New this week`),(0,T.jsxs)(f,{style:{gap:16},children:[(0,T.jsx)(q,{jacket:me,title:`Low Water`,blurb:`Six stories from the Severn, where the tide comes in faster than a man can run.`,price:`£14`,href:`${L}/low-water`}),(0,T.jsx)(q,{style:{flex:2},jacket:he,title:`The Orchard Year`,blurb:`Twelve months with one Herefordshire orchard: its grafts, its frosts, its pickers, and the three old men who still argue over when to prune. Hardback, with colour plates.`,price:`£22`,href:`${L}/orchard-year`,cta:`Reserve a copy`,accent:M})]})]})})),Y=w({type:`longshelf.Rating`,label:`Rating`,props:{score:C.number({label:`Score`,min:0,max:5,integer:!0,required:!0}),size:C.choice([`small`,`large`],{label:`Size`,default:`small`}),showScore:C.boolean({label:`Show the score`,default:!1})},render:({score:e,size:t,showScore:n})=>(0,T.jsx)(g,{style:{fontSize:t===`large`?30:16,lineHeight:1.2,letterSpacing:t===`large`?3:1,color:N},children:`★`.repeat(e)+`☆`.repeat(5-e)+(n?` ${e} of 5`:``)})}),X=(e,t,n)=>(0,T.jsxs)(a,{style:{gap:6,padding:[16,0],border:{top:`1px solid ${A}`}},children:[e,(0,T.jsx)(g,{style:{...V(21),fontWeight:400,lineHeight:1.25,letterSpacing:0},children:t}),(0,T.jsx)(g,{style:B,children:n})]}),Z=U(`import { defineElement, Email, prop, Section, Text } from "@hyper-elements/react";

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
);`,e=>(0,T.jsx)(e,{width:560,...R,children:(0,T.jsxs)(r,{style:{padding:[28,44,44],gap:24,mobile:{padding:[20,22,32]}},children:[H(`What readers said`),(0,T.jsxs)(a,{style:{gap:8},children:[(0,T.jsx)(Y,{score:5,size:`large`}),(0,T.jsx)(i,{level:2,style:V(38),children:`Low Water`}),(0,T.jsx)(g,{style:{fontSize:15,color:O},children:`Ines Varga. Our book of the month, by a long way.`})]}),(0,T.jsxs)(a,{children:[X((0,T.jsx)(Y,{score:4,showScore:!0}),`I read it on a train, and missed my stop.`,`Priya, Gloucester`),X((0,T.jsx)(Y,{score:3}),`Beautiful, and too sad for January. I’ll try again in spring.`,`Tom, Stroud`)]})]})})),Q=w({type:`longshelf.Hero`,label:`Hero`,placement:`section`,props:{title:C.text({label:`Title`,required:!0}),kicker:C.text({label:`Kicker`,default:`Long Shelf`}),background:C.color({label:`Background`,default:D})},render:({title:e,kicker:t,background:n})=>(0,T.jsxs)(r,{style:{backgroundColor:n,color:E,padding:[52,24,56],gap:10,textAlign:`center`,mobile:{padding:[40,20,44]}},children:[(0,T.jsx)(g,{style:{...z,color:k},children:t}),(0,T.jsx)(i,{level:1,style:{...V(60),fontStyle:`italic`,mobile:{fontSize:48}},children:e})]})}),$=U(`import { defineElement, Email, Heading, Text, prop, Section } from "@hyper-elements/react";

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
);`,e=>(0,T.jsxs)(e,{width:560,...R,children:[(0,T.jsx)(Q,{title:`New arrivals`}),(0,T.jsxs)(r,{style:{padding:[36,44],gap:10,mobile:{padding:[28,22]}},children:[(0,T.jsx)(g,{style:{...V(24),fontWeight:400,lineHeight:1.3,letterSpacing:0,textAlign:`center`},children:`Eleven books came in this week, three of them first novels, and one that Maud has already put aside for herself.`}),(0,T.jsx)(g,{style:{...B,textAlign:`center`},children:`The band above and the one below are each one Hero: it goes where a Section goes.`})]}),(0,T.jsx)(Q,{title:`Last chance`,kicker:`The winter sale`,background:j})]}));G.__docgenInfo={description:`A countdown from its props: with their defaults, and with its own.`,methods:[],displayName:`CountdownTimer`},J.__docgenInfo={description:"A book card: a required jacket and link, and a color and a button's words with defaults. Two sit in a `Row`, one with a larger `flex`.",methods:[],displayName:`ProductCards`},Z.__docgenInfo={description:"A rating worked out from its props in `render`: a number, a choice of sizes, and a switch.",methods:[],displayName:`WorkedOutFromProps`},$.__docgenInfo={description:'`placement: "section"` makes an element a band of its own: it goes where a `Section` goes, and renders one.',methods:[],displayName:`AWholeSection`},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`story(\`import { Column, defineElement, Email, Heading, prop, Row, Section, Text } from "@hyper-elements/react";

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
    </Root>)`,...G.parameters?.docs?.source},description:{story:`A countdown from its props: with their defaults, and with its own.`,...G.parameters?.docs?.description}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`story(\`import { Button, Column, defineElement, Email, Heading, Image, Text, prop, Row, Section } from "@hyper-elements/react";

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
    </Root>)`,...$.parameters?.docs?.source},description:{story:'`placement: "section"` makes an element a band of its own: it goes where a `Section` goes, and renders one.',...$.parameters?.docs?.description}}};var ge=[`CountdownTimer`,`ProductCards`,`WorkedOutFromProps`,`AWholeSection`];export{$ as AWholeSection,G as CountdownTimer,J as ProductCards,Z as WorkedOutFromProps,ge as __namedExportsOrder,pe as default};