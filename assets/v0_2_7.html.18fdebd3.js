import{r as n,o as a,c as i,a as e,b as s,F as r,e as l,d as t}from"./app.0f507fb3.js";import{_ as h}from"./plugin-vue_export-helper.21dcd24c.js";const d={},u=l('<h1 id="preview-version-0-2-7" tabindex="-1"><a class="header-anchor" href="#preview-version-0-2-7" aria-hidden="true">#</a> [Preview] Version 0.2.7</h1><h3 id="\u26A0\uFE0F-\u26A0\uFE0F-please-read-the-notes-below-before-upgrading-from-v0-1-x-\u26A0\uFE0F-\u26A0\uFE0F" tabindex="-1"><a class="header-anchor" href="#\u26A0\uFE0F-\u26A0\uFE0F-please-read-the-notes-below-before-upgrading-from-v0-1-x-\u26A0\uFE0F-\u26A0\uFE0F" aria-hidden="true">#</a> \u26A0\uFE0F \u26A0\uFE0F Please read the notes below before upgrading from <code>v0.1.x</code> \u26A0\uFE0F \u26A0\uFE0F</h3><p>Version 0.2 is here, but be warned: this is considered a beta release at this time. What does that mean? In short, the odds of you running into some bugs or quirks are definitely higher than on the previous releases. The more users who try it out though, the faster we can fix any bugs that you find.</p><p>This release is a bugfix release to try and resolve some issues that came out of the v0.2.6 release. The most notable one is the new preferences and settings introduced in the last release made things a lot more consistent and reliable, but also had a nasty habit of sometimes crashing the browser. <strong>Sorry about that!</strong></p><p>Thanks to the users who reported these issues, it took a while to find the problem, but hopefully the underlying problem (a race condition in the settings storage) has been fixed now. That should resolve the immediate problem of crashes, but <em>might</em> make the extension perform a bit worse. If you notice other changes in how the settings, modes or overrides work after this update, please raise an issue.</p><p>We also dramatically changed how the &quot;loading filter&quot; from v0.2.6 works. The old filter was much more reliable, but in turn was causing lots of issues, false positives and generally caused quite a few problems. This new one will be more performant, less likely to falsely block things, but also might lead to more gaps between images loading and being censored. We&#39;ll be monitoring this.</p><p>In short, this version completely changes a lot of things behind the scenes, and adds some smaller features. That being said: there&#39;s a few new features and fixes you might like in the 0.2.x release tree up to now:</p><ul><li><strong>Hardcore Options</strong><ul><li>These are special options that once enabled <em>cannot be disabled</em> again. These options allow for a more stringent experience for users who prefer their censoring experience that way.</li><li>To start with, we have two hardcore options, both related to local censoring: Forcing overwriting originals, and enforcing active overrides</li><li>You can find the new Hardcore Options in the Danger Zone section of the extension options.</li></ul></li><li>Fix placeholder loading and some duplicate permission prompts</li><li>Cleaned up some parts of the extension to be faster and more responsive.</li><li>Improved domain lists (allow and block lists) to work the way they should have the whole time</li><li>Images are now hidden before censoring starts</li></ul><p>Thanks to many BP users for reporting issues and requesting features.</p>',9),c=t("Even if you've been using Beta Protection before now, I'd "),g=e("strong",null,"strongly",-1),p=t(" recommend checking out the new "),f={href:"https://silveredgold.github.io/beta-protection/guide/usage.html",target:"_blank",rel:"noopener noreferrer"},m=t("user guide"),b=t("."),_=e("h2",{id:"installation-guide",tabindex:"-1"},[e("a",{class:"header-anchor",href:"#installation-guide","aria-hidden":"true"},"#"),t(" Installation Guide")],-1),w=t("As always, check out the "),v={href:"https://silveredgold.github.io/beta-protection/getting-started",target:"_blank",rel:"noopener noreferrer"},y=t("Getting Started guide"),x=t(" or the "),k={href:"https://silveredgold.github.io/beta-protection/guide/installation.html",target:"_blank",rel:"noopener noreferrer"},T=t("Installation guide"),I=t(" for all the details on installing Beta Protection and getting set up."),B=e("h2",{id:"upgrade-guide",tabindex:"-1"},[e("a",{class:"header-anchor",href:"#upgrade-guide","aria-hidden":"true"},"#"),t(" Upgrade Guide")],-1),P=e("p",null,"To upgrade your installed Beta Protection, simply repeat whatever install steps you used to install Beta Protection.",-1),V=e("ul",null,[e("li",null,"If you loaded it unpacked, just extract the new version over the old one and click the Reload button on the Manage Extensions page in your browser"),e("li",null,"If you installed from the CRX file, just drag and drop it again and your browser should prompt you to update Beta Protection.")],-1);function q(E,F){const o=n("ExternalLinkIcon");return a(),i(r,null,[u,e("p",null,[c,g,p,e("a",f,[m,s(o)]),b]),_,e("p",null,[w,e("a",v,[y,s(o)]),x,e("a",k,[T,s(o)]),I]),B,P,V],64)}var G=h(d,[["render",q]]);export{G as default};