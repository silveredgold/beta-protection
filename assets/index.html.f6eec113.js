import{r as o,o as i,c as r,a as e,b as n,w as h,F as c,d as t,e as d}from"./app.0a012c35.js";import{_ as l}from"./plugin-vue_export-helper.21dcd24c.js";const u={},f=e("h1",{id:"beta-protection",tabindex:"-1"},[e("a",{class:"header-anchor",href:"#beta-protection","aria-hidden":"true"},"#"),t(" Beta Protection")],-1),p=e("p",null,"A Chrome extension for censoring NSFW images as you view them.",-1),m=e("p",null,"This site includes the documentation required to get started with the extension as well as some more background information on the extension and how it's built.",-1),_=e("p",null,"To get started with Beta Protection, read through the documentation and guides using the links on the top and left to navigate. While these docs are kind of barebones, they will be expanded over time.",-1),g=t("These docs are also open-source, so "),b={href:"https://github.com/silveredgold/beta-protection",target:"_blank",rel:"noopener noreferrer"},w=t("contributions are always welcome"),y=t("."),k=d('<h2 id="introduction" tabindex="-1"><a class="header-anchor" href="#introduction" aria-hidden="true">#</a> Introduction</h2><p>Beta Protection is a Chrome extension that uses a configurable censoring backend to censor images in near-real-time as you browse the web.</p><p>The extension includes a plethora of configuration options so you can customise its behaviour.</p><p>That being said, Beta Protection still <strong>requires a supported censoring backend</strong>, such as Beta Censoring or Beta Safety</p><h3 id="how-is-this-different-from-beta-safety" tabindex="-1"><a class="header-anchor" href="#how-is-this-different-from-beta-safety" aria-hidden="true">#</a> How is this different from Beta Safety?</h3><p>If you&#39;re already using Beta Safety, you most likely already have the Beta Safety chrome extension installed. The extension that comes with Beta Safety is perfectly functional and if you&#39;re happy with it, there&#39;s no <em>need</em> to upgrade to Beta Protection.</p><p>Beta Protection is a more feature-rich, but also more complex, alternative to the extension that comes bundled with Beta Safety.</p>',7),x=t("For more detail on that particular question, check out the "),B=t("full guide on the differences"),v=t("."),T=e("h3",{id:"a-note-on-the-backend",tabindex:"-1"},[e("a",{class:"header-anchor",href:"#a-note-on-the-backend","aria-hidden":"true"},"#"),t(" A note on the backend")],-1),S=e("p",null,[t("The "),e("em",null,"censoring backend"),t(" is the part that does the actual censoring using the open-source NudeNet AI model. Essentially, as you browse, the browser extension detects images on the pages you view, then sends them to whatever backend you have configured. The backend runs them through the AI and censors the image and sends back the censored image. The extension then replaces the original image with the newly censored one.")],-1),I=e("blockquote",null,[e("p",null,"This is similar to how Beta Safety works, for those familiar with it.")],-1),N=e("p",null,"This applies regardless of the censoring backend in use: the extension does all the work of finding, preparing and replacing images; the backend does the actual AI inference and censoring.",-1);function P(q,A){const a=o("ExternalLinkIcon"),s=o("RouterLink");return i(),r(c,null,[f,p,m,_,e("blockquote",null,[e("p",null,[g,e("a",b,[w,n(a)]),y])]),k,e("p",null,[x,n(s,{to:"/guide/beta-safety.html"},{default:h(()=>[B]),_:1}),v]),T,S,I,N],64)}var F=l(u,[["render",P]]);export{F as default};
