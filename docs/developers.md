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