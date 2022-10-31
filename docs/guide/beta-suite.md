---
title: Beta Protection and Beta Suite
---

If you're looking into modern auto-censoring apps, you will probably have seen three names being thrown around: Beta Safety, Beta Protection and Beta Suite. There's a whole comparison for Beta Safety available [here](./beta-safety.md), but this page is intended to deliver a brief summary of how Beta Protection and Beta Suite compare.

To be clear, **neither option is inherenly better than the other**. Beta Suite is a great bit of software and if it meets your needs, use it! This won't try and change your mind, just give you an idea of where each software's strengths lie.

## Scope

The most notable difference between the two (that we'll just call *Protection* and *Suite* from here out) is in their scope: Protection is a censoring extension **for the browser**, while Suite is intended as a system-wide censoring capability. Suite can be set up to censor your whole screen in real-time and that's something that Protection was never designed for and will never support. Instead, Protection focusses on doing in-browser censoring while you browse the web as well as possible.

## Performance

Protection (thanks largely to its reduced scope) will censor notably slower than Suite will, but has a *fraction* of the hardware requirements. Essentially, Protection is not real-time when censoring, but also does not require *any* specialised hardware and does not require any hardware set up. Suite's extremely fast censoring time (how it can do real-time censoring) comes at the cost of requiring reasonably capable NVIDIA graphics hardware and the software setup to enable accelerated censoring. Protection will run on essentially any hardware, and does not require a graphics card at all, with the tradeoff that it will censor images more slowly.

## Usability

This is a tough comparison since the tools have such different purposes, but *in my view*, Suite is more complex to both get started with, and to tune to your liking. Running Suite and customizing it to your preferences will require some command line knowledge, some configuration file editing and the setup process is best suited to those who are more confident with their skills.

## Configuration

Similarly, Suite offers *more* customization than Protection does, but many users will find that customization more daunting to get right. Protection focusses on making the options available to you easy to use, with a simple web-based Settings UI built right into the browser and a lot of simple feedback to make it easier to use. Conversely, Suite will let you tune and tweak a lot of options, but these will often require manually editing configuration files, or a more intimate knowledge of your PC, the software, or both.

> **Neither of these options is a one-click solution!** You will need to ***read the documentation provided*** and ***follow the instructions carefully*** to set up any sort of censoring tool for your needs.

## Summary

In short, we believe that both tools (Beta Protection and Beta Suite) have their respective strengths and weaknesses and we strongly recommend getting a feel for your requirements and (if you are able to) we would even recommend trying them out to see which meets your needs better. Both tools are also fully open-source so the community can inspect, contribute and collaborate on improving the censoring tools available.

If I had to give an over-simplified version, it would be this:

- Beta Protection is a lightweight, easy-to-use, browser-only tool for censoring the web as you browse
- Beta Suite is a full-featured, system-wide tool with real-time censoring, intended for advanced users with powerful hardware.


Beta Safety users will probably have noticed the very obvious similarities between Beta Protection and Beta Safety, and that's not a coincidence. Beta Protection (just like Beta Censoring) was borne out of using Beta Safety for a while but finding a lot of things I wanted to change and deciding to build my own vision of a censoring extension.

To reiterate from the introduction guide: 

> If you're already using Beta Safety, you most likely already have the Beta Safety chrome extension installed. The extension that comes with Beta Safety is perfectly functional and if you're happy with it, there's no _need_ to upgrade to Beta Protection.

> Beta Protection is a more feature-rich, but also more complex, alternative to the extension that comes bundled with Beta Safety.


## So which one should you use?

To reiterate: the extension that comes with Beta Safety is perfectly fine. It generally works and is enough for most users.

Beta Protection introduces some new features and changes that _might_ make it a better fit for you:

### Improved options and UI

In this author's opinion, the original Beta Safety extension's options are a little too function-over-form and (as a consequence of how they're designed) can be a little daunting. Beta Protection aims to provide even more customization than Beta Safety but with a more approachable and understandable design.

### Easier customization

Some parts of the original extension were a little more complex to set up than they needed to be. For example, adding new placeholders required you to directly mess around in the extension's installation directory, whereas Beta Protection allows you to import them directly to the extension where it's managed for you.

Plus, Beta Protection allows you to change some settings that Beta Safety didn't expose as options at all, like where your backend is running or what messages the subliminal messages feature would show.

### Backend Choice

Beta Protection is designed to work with any compatible censoring backend you like. Currently that includes [Beta Censoring](https://silveredgold.github.io/beta-censoring/) and Beta Safety. Whichever backend you choose, and wherever it's running, Beta Protection doesn't mind.

### Local censoring improvements

While Beta Safety's backend can be used to censor locally saved images, it's not the most approachable process for most users and tweaking settings for local files is very daunting. Beta Protection includes a guided wizard for censoring your local files, with options to tweak the censoring applied to the files, regardless of whether you're using Beta Censoring or Beta Safety.

### Additional features

Beta Protection (at time of writing) supports largely the same features as Beta Safety, but includes a few extras of its own. For example, overrides can be used to enforce censoring options, and Beta Protection includes more fine-grained controls for on-demand censoring, among others.

### Fully open source, and more extensible

**At the time of writing**, Beta Safety is not open source and is difficult to modify even for developers. Beta Protection is fully open-source, published under the GPLv3 license on GitHub. It's also intended to be more scalable and flexible than Beta Safety is, as well as easier to integrate with other projects (like other backends).

---

## Known Issues and Drawbacks

There are also some drawbacks to Beta Protection that you should know before you decide:

#### Dramatically more complex

There's just a lot of moving parts here. Beta Protection (by virtue of its design) is a much more complex and "heavy" tool than the packaged extension.

In general, this should balance out, but it's worth knowing going in.

#### Less tested

Beta Protection is a brand new project that just hasn't had as much time in the hands of users as the packaged extension. There might be some bugs I haven't caught yet. No real way around this.

#### Different performance

Beta Protection handles how it runs quite differently under the covers from Beta Safety which leads to both gains and losses in performance. Experiences will vary but _in general_, Beta Protection will be a little slower to censor images, but will be less performance intensive doing so.

