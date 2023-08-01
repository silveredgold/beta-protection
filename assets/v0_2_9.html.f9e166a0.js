import{r as s,o as i,c as r,a as e,b as n,F as a,e as l,d as t}from"./app.93695a2e.js";import{_ as d}from"./plugin-vue_export-helper.21dcd24c.js";const h={},u=l('<h1 id="preview-version-0-2-9" tabindex="-1"><a class="header-anchor" href="#preview-version-0-2-9" aria-hidden="true">#</a> [Preview] Version 0.2.9</h1><h3 id="\u26A0\uFE0F-\u26A0\uFE0F-please-read-the-notes-below-before-upgrading-from-v0-1-x-\u26A0\uFE0F-\u26A0\uFE0F" tabindex="-1"><a class="header-anchor" href="#\u26A0\uFE0F-\u26A0\uFE0F-please-read-the-notes-below-before-upgrading-from-v0-1-x-\u26A0\uFE0F-\u26A0\uFE0F" aria-hidden="true">#</a> \u26A0\uFE0F \u26A0\uFE0F Please read the notes below before upgrading from <code>v0.1.x</code> \u26A0\uFE0F \u26A0\uFE0F</h3><p>Version 0.2 is here, but be warned: this is considered a beta release at this time. What does that mean? In short, the odds of you running into some bugs or quirks are definitely higher than on the previous releases. The more users who try it out though, the faster we can fix any bugs that you find.</p><p>This release is a maintenance release to build on some of the new features introduced in the v0.2.7 and v0.2.8 releases, mostly surrounding the new loading filter from v0.2.8.</p><p>Here&#39;s the highlights of this release:</p><ul><li><strong>Loading Filter Configuration</strong>: You can now adjust the new loading filter. We support disabling it entirely (not recommended for most users), or configuring how strong the blur effect is (within reason). To pre-empt possible requests: we don&#39;t support making the loading filter insanely strong since it makes the UI of most sites borderline unusable when you crank it too high.</li><li><strong>Loading Filter as Placeholders</strong>: You can also disable using placeholders entirely and use the loading filter as a substitute. With the new &quot;Skip Placeholders&quot; option enabled, placeholders won&#39;t get loaded and the loading filter will instead stay active until the censoring results are complete.</li><li><strong>Minor maintenance fixes</strong>: We&#39;ve fixed a few small minor bugs, and removed a bunch of old legacy code that we&#39;re not using anymore. Not exciting; very necessary.</li></ul><p>Thanks to the users who reported these issues across the last few releases. If you notice other changes in how the settings, modes or overrides work after this update, please raise an issue. In short, this version completely changes a lot of things behind the scenes, and adds some smaller features. That being said: there&#39;s a few new features and fixes you might like in the 0.2.x release tree up to now:</p><ul><li><strong>Hardcore Options</strong><ul><li>These are special options that once enabled <em>cannot be disabled</em> again. These options allow for a more stringent experience for users who prefer their censoring experience that way.</li><li>To start with, we have two hardcore options, both related to local censoring: Forcing overwriting originals, and enforcing active overrides</li><li>You can find the new Hardcore Options in the Danger Zone section of the extension options.</li></ul></li><li>Fix placeholder loading and some duplicate permission prompts</li><li>Cleaned up some parts of the extension to be faster and more responsive.</li><li>Improved domain lists (allow and block lists) to work the way they should have the whole time</li><li>Images are now hidden before censoring starts</li></ul><p>Thanks to many BP users for reporting issues and requesting features.</p>',9),c=t("Even if you've been using Beta Protection before now, I'd "),g=e("strong",null,"strongly",-1),p=t(" recommend checking out the new "),f={href:"https://silveredgold.github.io/beta-protection/guide/usage.html",target:"_blank",rel:"noopener noreferrer"},m=t("user guide"),_=t("."),b=e("h2",{id:"installation-guide",tabindex:"-1"},[e("a",{class:"header-anchor",href:"#installation-guide","aria-hidden":"true"},"#"),t(" Installation Guide")],-1),w=t("As always, check out the "),v={href:"https://silveredgold.github.io/beta-protection/getting-started",target:"_blank",rel:"noopener noreferrer"},y=t("Getting Started guide"),x=t(" or the "),k={href:"https://silveredgold.github.io/beta-protection/guide/installation.html",target:"_blank",rel:"noopener noreferrer"},I=t("Installation guide"),T=t(" for all the details on installing Beta Protection and getting set up."),P=e("h2",{id:"upgrade-guide",tabindex:"-1"},[e("a",{class:"header-anchor",href:"#upgrade-guide","aria-hidden":"true"},"#"),t(" Upgrade Guide")],-1),B=e("p",null,"To upgrade your installed Beta Protection, simply repeat whatever install steps you used to install Beta Protection.",-1),F=e("ul",null,[e("li",null,"If you loaded it unpacked, just extract the new version over the old one and click the Reload button on the Manage Extensions page in your browser"),e("li",null,"If you installed from the CRX file, just drag and drop it again and your browser should prompt you to update Beta Protection.")],-1);function V(q,E){const o=s("ExternalLinkIcon");return i(),r(a,null,[u,e("p",null,[c,g,p,e("a",f,[m,n(o)]),_]),b,e("p",null,[w,e("a",v,[y,n(o)]),x,e("a",k,[I,n(o)]),T]),P,B,F],64)}var L=d(h,[["render",V]]);export{L as default};
