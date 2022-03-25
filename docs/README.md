# Beta Protection

A Chrome extension for censoring NSFW images as you view them.

This site includes the documentation required to get started with the extension as well as some more background information on the extension and how it's built.

To get started with Beta Protection, read through the documentation and guides using the links on the top and left to navigate. While these docs are kind of barebones, they will be expanded over time.

> These docs are also open-source, so [contributions are always welcome](https://github.com/silveredgold/beta-protection).

## Introduction

Beta Protection is a Chrome extension that uses a configurable censoring backend to censor images in near-real-time as you browse the web.

The extension includes a plethora of configuration options so you can customise its behaviour.

That being said, Beta Protection still **requires a supported censoring backend**, such as Beta Censoring or Beta Safety

### How is this different from Beta Safety?

If you're already using Beta Safety, you most likely already have the Beta Safety chrome extension installed. The extension that comes with Beta Safety is perfectly functional and if you're happy with it, there's no _need_ to upgrade to Beta Protection.

Beta Protection is a more feature-rich, but also more complex, alternative to the extension that comes bundled with Beta Safety.

For more detail on that particular question, check out the [full guide on the differences](./guide/beta-safety.md).

### A note on the backend

The _censoring backend_ is the part that does the actual censoring using the open-source NudeNet AI model. Essentially, as you browse, the browser extension detects images on the pages you view, then sends them to whatever backend you have configured. The backend runs them through the AI and censors the image and sends back the censored image. The extension then replaces the original image with the newly censored one. 

> This is similar to how Beta Safety works, for those familiar with it.

This applies regardless of the censoring backend in use: the extension does all the work of finding, preparing and replacing images; the backend does the actual AI inference and censoring.