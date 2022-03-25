# Android Usage

> If you are currently using the Beta Safety Chrome extension, ***disable it first***. Do not attempt to run both Beta Safety and Beta Protection extensions at once. Bad things will happen.

At this time the only platform and browser combination that's known to support Chrome extensions is Kiwi Browser on Android. That means you won't be able to use Beta Protection at all on iOS and it will only be active while browsing with Kiwi (after you've set it up).

It's also worth noting that the experience on Android is sub-optimal at best, and it's not a scenario the author provides official support for. You can give it a try but it will be slow, possibly flaky, and you'll be on your own if anything goes wrong.

## Prerequisites

First off, make sure you have a censoring backend (i.e. Beta Censoring or Beta Safety) running on a PC on your **local** network. Follow the guides for your backend of choice to run the backend, but you can ignore any parts about loading extensions into Chrome/Kiwi since we'll be using Beta Protection for that part.

> You will need the IP address (or hostname) of the PC with the backend running for the next steps, so make sure you have that before proceeding

## Download

Download the extension package from the [GitHub Releases](https://github.com/silveredgold/beta-protection/releases) page. You should download the **beta-protection.crx** file from the Release, _not_ the ZIP file. Remember where you downloaded the CRX file, for later on.

## Installation

In Kiwi, tap the main menu (in the top right) and choose Extensions. Ensure the Developer mode toggle at the top-right of the page is enabled and you should see a few extra buttons at the top of the page.

Tap on the *+ (from .zip/.crx/.user.js)* button at the top and navigate to the CRX file you downloaded in the last step. Beta Protection should appear in your extension list. Tap the toggle in the bottom right of its tile to enable the extension. 

## Usage

At this point Beta Protection is running, but you still need to tell it where your backend is running. Still on the Extensions page, tap on the *Details* button for Beta Protection and scroll down to tap on *Extension options*. That will open the settings screen where you can tap on the *Backend Host* section to reveal the configutation for the backend. In the text box, enter the address for your backend of choice (see below).

Tap *Save and Reconnect* to save your new backend, then scroll up and tap on *Recheck* button under the Connection Status icon to check if your phone can reach the backend successfully. If so, you're ready to go! The "popup" menu will now be at the bottom of the Kiwi main menu and will open in a new tab where you can set the censoring mode(s) or open the full settings (with the button in the top right).

### Beta Censoring

For Beta Censoring your address will generally be `http://<YOUR-IP-ADDRESS-OR-NAME>:2382`, subtituting in the address/hostname of the PC with the Beta Censoring server running on it. If you check the server's web interface, the hostname will be shown at the top of the page header.

### Beta Safety

For Beta Safety, your address will be `ws://<YOUR-IP-ADDRESS-OR-NAME>:8090/ws`, substituting in the address/hostname of the PC with Beta Safety running on it. 