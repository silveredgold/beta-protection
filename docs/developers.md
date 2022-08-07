---
title:  Developers Guide 
description: Guide for developers looking to contribute to Beta Protection
---

## Build

Once you've got the repo cloned, you should be able to just do the usual install/build combo:

```bash
npm i
npm run build
```

That will build a production build of the extension into the `dist/` directory. You can load that into the browser with the usual `Load Unpacked` option, but if you're going to be working on the extension that's unpleasant. You can instead run `npm run serve` to run a dev server. Once the initial build is done, use Load Unpacked from your browser of choice, and now webpack (via the Vue CLI) will watch for changes, rebuild on change and (theoretically) trigger a reload in your browser when required.

## Documentation

The docs live separately in the `docs/` folder, with their own dependencies and their own `docs:dev` and `docs:build` build scripts. The docs are automatically built on change with GitHub Actions, and automatically published from the main branch.

## Implementing an additional backend

> Due to security limitations in the browser, it's borderline impossible to ship backends separately, so at present any additional backend support will have to be contributed directly to this repo.

At it's most basic, a backend consists of two parts: an implementation of `ICensorBackend` to handle the "transport" between Beta Protection and the backend, and an implementation of `IBackendProvider<ICensorBackend>` for that backend to "wire up" the backend with Beta Protection's events and components.

#### Resources

The `ICensorBackend` interface has some reasonably okay documentation [available here](https://silveredgold.github.io/beta-shared/interfaces/transport.ICensorBackend) that should help with that part. As for the provider, that will vary heavily from backend to backend, but you can see the existing examples for Beta Censoring [here](#) and for Beta Safety in this repo at `src/transport/beta-safety/provider.ts`.