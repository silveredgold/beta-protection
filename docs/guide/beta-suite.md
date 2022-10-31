---
title: Beta Protection and Beta Suite
---

If you're looking into modern auto-censoring apps, you will probably have seen three names being thrown around: Beta Safety, Beta Protection and Beta Suite. There's a whole comparison for Beta Safety available [here](./beta-safety.md), but this page is intended to deliver a brief summary of how Beta Protection and Beta Suite compare.

To be clear, **neither option is inherenly better than the other**. Beta Suite is a great bit of software and if it meets your needs, use it! This won't try and change your mind, just give you an idea of where each software's strengths lie.

## Scope

The most notable difference between the two (that we'll just call *Protection* and *Suite* from here out) is in their scope: Protection is a censoring extension **for the browser**, while Suite is intended as a system-wide censoring capability. Suite can be set up to censor your whole screen in real-time and that's something that Protection was never designed for and will never support. Instead, Protection focusses on doing in-browser censoring while you browse the web as well as possible.

## Performance

Protection (thanks largely to its reduced scope) will censor notably slower than Suite will, but has a *fraction* of the hardware requirements. Essentially, Protection is not real-time when censoring, but also does not require *any* specialised hardware and does not require any hardware set up. Suite's extremely fast censoring time (how it can do real-time censoring) comes at the cost of requiring reasonably capable NVIDIA graphics hardware and the software setup to enable accelerated censoring. Protection will run on essentially any hardware, and does not require a graphics card at all, with the tradeoff that it will censor images more slowly.

Additionally, because of the performance requirements, currenly only Beta Suite can censor videos (either in real-time or when censoring locally), and Beta Protection simply can't censor videos (only blur them out), even in the browser.

## Usability

This is a tough comparison since the tools have such different purposes, but *in my view*, Suite is more complex to both get started with, and to tune to your liking. Running Suite and customizing it to your preferences will require some command line knowledge, some configuration file editing and the setup process is best suited to those who are more confident with their skills.

## Configuration

Similarly, Suite offers *more* customization than Protection does, but many users will find that customization more daunting to get right. Protection focusses on making the options available to you easy to use, with a simple web-based Settings UI built right into the browser and a lot of simple feedback to make it easier to use. Conversely, Suite will let you tune and tweak a lot of options, but these will often require manually editing configuration files, or a more intimate knowledge of your PC, the software, or both.

> **Neither of these options is a one-click solution!** You will need to ***read the documentation provided*** and ***follow the instructions carefully*** to set up any sort of censoring tool for your needs.

Additionally, Protection offers a bit more options and customisation for how your censoring is applied (particularly with Beta Censoring as a backend). For example, you can use stickers or captions and finely tune the censoring type used by each feature as its censored, all from the settings. In general, Beta Protection will give you more easy-to-use configuration options to tune your censored browsing experience.

## Summary

In short, we believe that both tools (Beta Protection and Beta Suite) have their respective strengths and weaknesses and we strongly recommend getting a feel for your requirements and (if you are able to) we would even recommend trying them out to see which meets your needs better. Both tools are also fully open-source so the community can inspect, contribute and collaborate on improving the censoring tools available.

If I had to give an over-simplified version, it would be this:

- Beta Protection is a lightweight, easy-to-use, browser-only tool for censoring the web as you browse
- Beta Suite is a full-featured, system-wide tool with real-time censoring, intended for advanced users with powerful hardware.
