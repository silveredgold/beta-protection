---
title: Getting Started
---

##### This getting started guide is only a summary of the process intended to get you quickly set up! The full process is covered in the user guide, accessible from the links in the top bar.

## Prerequisites

Beta Protection currently supports Chrome and Edge and _should_ work on any other Chrome derivatives (like Vivaldi). For this guide, we'll assume using Chrome.

First off, make sure you have a censoring backend running somewhere. This will usually be one of [Beta Censoring](https://silveredgold.github.io/beta-censoring/) (the default) or Beta Safety.

## Download

_More details in the [installation guide](./guide/installation.md)_

Download the extension package from the [GitHub Releases](https://github.com/silveredgold/beta-protection/releases) page. You should download the **beta-protection.crx** file from the Release, _not_ the ZIP file. Open the folder where you downloaded the CRX file, for later on.

## Installation

_More details in the [installation guide](./guide/installation.md)_

Open the Extensions screen (from the Manage Extensions menu) and ensure Developer Mode is toggled **on**. Drag and drop the CRX file you downloaded in the last step into the Extensions window. Chrome should prompt you to install Beta Protection, so accept the prompt and Beta Protection should appear in your Extensions list!

> Did your browser refuse to load the extension with an angry message about not being in a Store? Check the [installation guide](./guide/installation.md) for what to do about that.

## Usage

_More details in the [usage guide](./guide/usage.md)_

You should now see the Beta Protection extension in your Chrome extensions window. 

Click the icon in the toolbar to open the popup and check on your extension. At the top of the screen will be the connection status. If this shows *Connected* you're connected to the backend and can skip the next step!

### Backend Configuration

If it doesn't say Connected, you need to tell Beta Protection where to find your backend. Open the Options from the button at the top right of the popup, drop down Backend Host and enter the address for your censoring server. Click *Save and Reconnect* then *Recheck* from the Connection Status window to check the extension can find your backend.

### Start Browsing

Beta Protection will default to "on demand" mode that will only enable sites you either _ask_ to be censored (with the context menu) or sites that are in your Forced list (you can add sites to the list from the extension options). You can set the extension to Enabled mode from the popup to default to censoring all pages.

For more information on all the other features like [overrides](./guide/overrides.md), [placeholders](./guide/usage.md#placeholders) or [local censoring](./guide/usage.md#local-censoring), check the full [Usage section of the User Guide](./guide/usage.md).