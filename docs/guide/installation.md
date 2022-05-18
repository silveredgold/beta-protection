# Installation

> If you are currently using the Beta Safety Chrome extension, ***disable it first***. Do not attempt to run both Beta Safety and Beta Protection extensions at once. Bad things will happen.

Beta Protection currently supports Chrome and Edge and _should_ work on any other Chrome derivatives (like Vivaldi). The extension actually _would_ support Firefox but Mozilla [still](https://blog.mozilla.org/addons/2021/05/27/manifest-v3-update/) don't support the latest version of the browser API that this extension relies on.

## Prerequisites

First off, make sure you have a censoring backend running somewhere. In general, the majority of Beta Protection's functionality is designed to work with any supported backend but there might be some niche/experimental features that not all backends support.

### Beta Censoring

Beta Censoring is a new highly flexible open source censoring server. You can find all the guides and documentation for Beta Censoring [here](https://silveredgold.github.io/beta-censoring/), or check out the [GitHub repository](https://github.com/silveredgold/beta-censoring/).

Once you have the server running, you're good to continue with setting up Beta Protection.

### Beta Safety

If you'd prefer to stick with using Beta Safety's backend, you can do that. First off, make sure you have Beta Safety running somewhere. Follow the guides included with Beta Safety to run the backend, but you can ignore the parts about loading the extension into Chrome since we'll be using Beta Protection for that part.

## Download

Download the extension package from the [GitHub Releases](https://github.com/silveredgold/beta-protection/releases) page. You should download the **beta-protection.crx** file from the Release, _not_ the ZIP file. Open the folder where you downloaded the CRX file, for later on.

> You can also directly download the CRX file for the latest version using [**this link**](https://github.com/silveredgold/beta-protection/releases/latest/download/beta-protection.crx)

## Installation

In Chrome, click the Extensions button in your browser toolbar (the puzzle piece) and click the Manage Extensions button at the bottom of the menu.

<!-- ![Chrome Manage Extensions menu from Extensions popup on main toolbar](../assets/chrome_manage_extensions.jpg) -->
<img 
  src="/chrome_manage_extensions.jpg"
  width="200"
/>

Ensure the Developer mode toggle at the top-right of the page is enabled and you should see a few extra buttons at the top left of the page.

Finally, drag and drop the CRX file you downloaded in the last step into the Extensions window in Chrome. Chrome should prompt you to install Beta Protection, so accept the prompt and Beta Protection should appear in your Extensions list!

## Whitelisting

Since we do not list Beta Protection in the Chrome Web Store (on account of it falling foul of Google's policies), some browsers may generate warnings or refuse to install Beta Protection without jumping through some hoops.

You can either whitelist Beta Protection specifically or install the extension unpacked from a directory on your PC.

### Registry Whitelist (for Windows)

All the Chrome-based browsers allow you to whitelist specific extensions by their IDs which will allow them to be installed even when not listed in the Chrome Web Store. For convenience, we have included automated scripts to whitelist Beta Protection's extension ID for Chrome, Edge and Brave. Download the `whitelisting.zip` file from the release (where you downloaded the CRX file) and unzip it somewhere. Find the `.reg` file for your browser and double click it.

This will add a key to your registry with Beta Protection's ID that tells the browser you trust it. If you want to confirm that, right-click the `.reg` file and click Edit to see what changes it will make.

### Installing the extension unpacked

If you are having trouble with installing the CRX or don't want to whitelist Beta Protection, the easiest way to get started is to load the extension "unpacked" (this is how Beta Safety installs, if you're more familiar with that).

<img 
  src="/brave-warning.png" 
  width="200"
/>

1. Download the `beta-protection-...` ZIP file from the GitHub Releases page (rather than the `.crx` file), and extract it somewhere
2. From your browser's Manage Extensions page (with Developer Mode on), find the *Load Unpacked* option
3. Click it, and select the folder where you unpacked the ZIP file. Beta Protection should appear in your Extensions list.


## Troubleshooting

#### *Backend and browser versioning appear out of sync*

You can (in general) safely ignore that warning. It's generated as Beta Safety doesn't expect anything other than its own extension to talk to it, and it thinks you might be using an ancient version of Beta Safety or something like that.

#### *This extension is not listed in the (...) Store* error

See the section above on Whitelisting.

#### Can't import placeholders or censor local images with Brave

The Brave developers, for reasons that only make sense to the Brave developers, have disabled the File System Access API completely, even for extensions. You can re-enable it in the browser flags, but you'll have to set that up yourself (I don't use Brave, so can't really provide support for it).

## Permissions

As a result of Chrome's very granular extension API and the complexity of Beta Protection, there's actually quite a few permissions required. In the interest of transparency, here's a rundown of the permissions requested and they're used for:

- `activeTab`: Requred to manipulate the active tab, to replace images on the page with placeholders and censored images
- `contextMenus`:As the name implies, required to show the Beta Protection context menus
- `storage`: Required to access Chrome's extension storage, used to store your extension preferences mostly.
- `scripting`: Chrome requires this permission so we can inject styles and scripts into tabs. This is used for two things:
  - Styling: Since page lifecycles are complicated, the short version is that we add some global CSS styles to hide uncensored images while we process them
  - Subliminals: If you have subliminal messages enabled, the styles and logic for them are injected into each tab
- `notifications`: Only used for the update checker, to notify you when there's an update available, or for breaking changes. This is needed since Chrome only auto-updates extensions from the Chrome Web Store, not locally installed ones.
- `alarms`: Due to changes in the Chrome extension API, this is now the only way to reliably perform tasks on a regular basis, so Beta Protection uses them for a few "utility" tasks.

> As always, if you're worried about what Beta Protection is doing or how it works, you can always check the full source [on GitHub](https://github.com/silveredgold/beta-protection).