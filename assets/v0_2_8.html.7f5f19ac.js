import{r as s,o as i,c as r,a as e,b as n,F as a,e as l,d as t}from"./app.0f507fb3.js";import{_ as h}from"./plugin-vue_export-helper.21dcd24c.js";const d={},c=l('<h1 id="preview-version-0-2-8" tabindex="-1"><a class="header-anchor" href="#preview-version-0-2-8" aria-hidden="true">#</a> [Preview] Version 0.2.8</h1><h3 id="\u26A0\uFE0F-\u26A0\uFE0F-please-read-the-notes-below-before-upgrading-from-v0-1-x-\u26A0\uFE0F-\u26A0\uFE0F" tabindex="-1"><a class="header-anchor" href="#\u26A0\uFE0F-\u26A0\uFE0F-please-read-the-notes-below-before-upgrading-from-v0-1-x-\u26A0\uFE0F-\u26A0\uFE0F" aria-hidden="true">#</a> \u26A0\uFE0F \u26A0\uFE0F Please read the notes below before upgrading from <code>v0.1.x</code> \u26A0\uFE0F \u26A0\uFE0F</h3><p>Version 0.2 is here, but be warned: this is considered a beta release at this time. What does that mean? In short, the odds of you running into some bugs or quirks are definitely higher than on the previous releases. The more users who try it out though, the faster we can fix any bugs that you find.</p><p>This release is a bugfix release to try and resolve some issues that came out of the v0.2.6 and v0.2.7 releases. The most important ones are a noticeable drop in performance, and continuing issues with the new loading filter.</p><p>Extension performance is a tricky one to balance as what we&#39;re doing is inherenly against how the browser wants extensions to work. This release tweaks a few things so that the recent additions to the extension should run a bit more efficiently and shouldn&#39;t slow your browser down too much while censoring is running.</p><p>The &quot;loading filter&quot; was introduced a few releases ago to try and prevent uncensored images from showing before the placeholders are loaded in their place. It has caused a whole bunch of issues in recent versions of the extension that have made things quite tricky. This version introduces a revised version of the loading filter that will hopefully be the final implementation of this functionality. This should cut down on uncensored images, but if this version still doesn&#39;t work the loading filter may have to be removed for stability and performance.</p><p>Thanks to the users who reported these issues across the last few releases. If you notice other changes in how the settings, modes or overrides work after this update, please raise an issue. In short, this version completely changes a lot of things behind the scenes, and adds some smaller features. That being said: there&#39;s a few new features and fixes you might like in the 0.2.x release tree up to now:</p><ul><li><strong>Hardcore Options</strong><ul><li>These are special options that once enabled <em>cannot be disabled</em> again. These options allow for a more stringent experience for users who prefer their censoring experience that way.</li><li>To start with, we have two hardcore options, both related to local censoring: Forcing overwriting originals, and enforcing active overrides</li><li>You can find the new Hardcore Options in the Danger Zone section of the extension options.</li></ul></li><li>Fix placeholder loading and some duplicate permission prompts</li><li>Cleaned up some parts of the extension to be faster and more responsive.</li><li>Improved domain lists (allow and block lists) to work the way they should have the whole time</li><li>Images are now hidden before censoring starts</li></ul><p>Thanks to many BP users for reporting issues and requesting features.</p>',9),u=t("Even if you've been using Beta Protection before now, I'd "),p=e("strong",null,"strongly",-1),g=t(" recommend checking out the new "),f={href:"https://silveredgold.github.io/beta-protection/guide/usage.html",target:"_blank",rel:"noopener noreferrer"},m=t("user guide"),w=t("."),_=e("h2",{id:"installation-guide",tabindex:"-1"},[e("a",{class:"header-anchor",href:"#installation-guide","aria-hidden":"true"},"#"),t(" Installation Guide")],-1),b=t("As always, check out the "),v={href:"https://silveredgold.github.io/beta-protection/getting-started",target:"_blank",rel:"noopener noreferrer"},y=t("Getting Started guide"),x=t(" or the "),k={href:"https://silveredgold.github.io/beta-protection/guide/installation.html",target:"_blank",rel:"noopener noreferrer"},T=t("Installation guide"),I=t(" for all the details on installing Beta Protection and getting set up."),B=e("h2",{id:"upgrade-guide",tabindex:"-1"},[e("a",{class:"header-anchor",href:"#upgrade-guide","aria-hidden":"true"},"#"),t(" Upgrade Guide")],-1),P=e("p",null,"To upgrade your installed Beta Protection, simply repeat whatever install steps you used to install Beta Protection.",-1),E=e("ul",null,[e("li",null,"If you loaded it unpacked, just extract the new version over the old one and click the Reload button on the Manage Extensions page in your browser"),e("li",null,"If you installed from the CRX file, just drag and drop it again and your browser should prompt you to update Beta Protection.")],-1);function V(q,F){const o=s("ExternalLinkIcon");return i(),r(a,null,[c,e("p",null,[u,p,g,e("a",f,[m,n(o)]),w]),_,e("p",null,[b,e("a",v,[y,n(o)]),x,e("a",k,[T,n(o)]),I]),B,P,E],64)}var G=h(d,[["render",V]]);export{G as default};
