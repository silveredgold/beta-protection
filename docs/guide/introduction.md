# Introduction

Beta Protection is a Chrome extension that uses the Beta Safety backend to censor images in near-real-time as you browse the web.

The extension includes a plethora of configuration options so you can customise its behaviour.

## How is this different from Beta Safety?

If you're already using Beta Safety, you most likely already have the Beta Safety chrome extension installed. The extension that comes with Beta Safety is perfectly functional and if you're happy with it, there's no _need_ to upgrade to Beta Protection.

Beta Protection is a more feature-rich, but also more complex, alternative to the extension that comes bundled with Beta Safety. That being said, Beta Protection still **requires the Beta Safety backend**.

##### A note on the backend

For those who didn't realize, the Beta Safety backend (the `.exe`/`.jar` file you need to run first) is the part that does the actual censoring using the open-source NudeNet AI model. Essentially, as you browse, the browser extension detects images on the pages you view then sends them to the backend. The backend runs them through the API and censors the image and sends back the censored image. The extension then replaces the original image with the newly censored one.

Beta Protection works in much the same way, so it only replaces the _extension_ component of Beta Safety, not the backend.

## So which one should you use?

To reiterate: the extension that comes with Beta Safety is perfectly fine. It generally works and is enough for most users.

Beta Protection introduces some new features and changes that _might_ make it a better fit for you:

#### Improved options and UI

In this author's opinion, the original Beta Safety extension's options are a little too function-over-form and (as a consequence of how they're designed) can be a little daunting. Beta Protection aims to provide even more customization than Beta Safety but with a more approachable and understandable design.

#### Easier customization

Some parts of the original extension were a little more complex to set up than they needed to be. For example, adding new placeholders required you to directly mess around in the extension's installation directory, whereas Beta Protection allows you to import them directly to the extension where it's managed for you.

Plus, Beta Protection allows you to change some settings that Beta Safety didn't expose as options at all, like where your backend is running or what messages the subliminal messages feature would show.

#### Additional features

Beta Protection (at time of writing) supports all the same features as Beta Safety, but includes a few extras of its own. For example, overrides can be used to enforce censoring options, and Beta Protection includes more fine-grained controls for on-demand censoring, among others.

#### Fully open source, and more extensible

**At the time of writing**, Beta Safety is not open source and is difficult to modify even for developers. Beta Protection is fully open-source, published under the GPLv3 license on GitHub. It's also intended to be more scalable and flexible than Beta Safety is.

---

There are also some drawbacks to Beta Protection that you should know before you decide:

#### Dramatically more complex

There's just a lot of moving parts here. Beta Protection (by virtue of its design) is a much more complex and "heavy" tool than the packaged extension.

In general, this should balance out, but it's worth knowing going in.

#### Less tested

Beta Protection is a brand new project that just hasn't had as much time in the hands of users as the packaged extension. There might be some bugs I haven't caught yet. No real way around this.

#### Different performance

Beta Protection handles how it runs quite differently under the covers from Beta Safety which leads to both gains and losses in performance. Experiences will vary but _in general_, Beta Protection will be a little slower to censor images, but will be less performance intensive doing so.

