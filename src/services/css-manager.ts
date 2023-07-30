import { IPreferences } from "@/preferences";
import browser from 'webextension-polyfill';


export class CSSManager {
    private _prefs: IPreferences;
    private _target: browser.Scripting.InjectionTarget;
    private _lastFilterStrength?: number;
    /**
     *
     */
    constructor(tabId: number, preferences: IPreferences) {
        this._prefs = preferences;
        this._target = {
            tabId: tabId,
            allFrames: true
        };
    }



    addVideo = async () => {
        if (this._prefs.videoCensorMode == "Blur") {
            await browser.scripting.insertCSS(this.videoBase);
            await browser.scripting.insertCSS(this.blurVideo);
            await browser.scripting.insertCSS(this.blurGifs);
        }
        if (this._prefs.videoCensorMode == "Block") {
            await browser.scripting.insertCSS(this.videoBase);
            await browser.scripting.insertCSS(this.blockVideo);
            await browser.scripting.insertCSS(this.blockGifs);
        }
    }

    removeVideo = async () => {
        await browser.scripting.removeCSS(this.videoBase);
        await browser.scripting.removeCSS(this.blurVideo);
        await browser.scripting.removeCSS(this.blockVideo);
    }

    addCSS = async () => {
        await browser.scripting.insertCSS(this.active);
    }

    removeCSS = async () => {
        await browser.scripting.removeCSS(this.active);
    }

    addReset = async () => {
      // await browser.scripting.insertCSS(this.reset);
      //this almost certainly no-ops since it's not inserted with insertCSS
      await browser.scripting.removeCSS({target: this._target, files: ["css/base.css"]});
    }

    addSubliminal = async () => {
        await browser.scripting.insertCSS(this.subliminal)
    }

    removeSubliminal = async () => {
        await browser.scripting.removeCSS(this.subliminal)
    }

    enableLoadingFilter = async (blurLevel:number = 10) => {
      const blurPx = (blurLevel ?? 10)*2.5;
      this._lastFilterStrength = blurPx;
      await browser.scripting.removeCSS(this.buildLoadingFilter(blurPx));
      await browser.scripting.insertCSS(this.buildLoadingFilter(blurPx));
    }

    disableLoadingFilter = async (blurLevel?:number) => {
      const blurPx = (!!blurLevel ? ((blurLevel??10)*2.5) : this._lastFilterStrength) ?? 25;
      await browser.scripting.removeCSS(this.buildLoadingFilter(blurPx));
    }

    private buildLoadingFilter = (blurPx: number) : browser.Scripting.CSSInjection => {
      return {
          target: this._target,
          css: `
body img:not([img-behaviour="video"]):not([censor-state="censored"]):not([censor-state="excluded"]) {
  -webkit-filter: blur(${blurPx}px);
  -moz-filter: blur(${blurPx}px);
  -o-filter: blur(${blurPx}px);
  -ms-filter: blur(${blurPx}px);
  filter: blur(${blurPx}px);
}

body div:not([censor-style="censored"])[style*="background-image: url("] div:not([censor-style="excluded"])[style*="background-image: url("] {
  -webkit-filter: blur(${blurPx}px);
  -moz-filter: blur(${blurPx}px);
  -o-filter: blur(${blurPx}px);
  -ms-filter: blur(${blurPx}px);
  filter: blur(${blurPx}px);
}
`
      };
    }

    public get subliminal() : browser.Scripting.CSSInjection {
        return {
            target: this._target,
            files: ["css/subliminal.css"]
        };
    }

    public get active() : browser.Scripting.CSSInjection {
        return {
            target: this._target,
            files: ["css/images.css"]
        };
    }

    public get videoBase() : browser.Scripting.CSSInjection {
        return {
            target: this._target,
            files: ["css/video.css"]
        };
    }

    public get blurVideo() : browser.Scripting.CSSInjection {
        return {
            target: this._target,
            css: `
/* Blur only */
video {
    filter: blur(${this._prefs.videoCensorLevel*4}px) !important;
}

video:not([censor-state='censored']) {
    visibility: visible !important;
}
`
        };
    }

    public get blurGifs() : browser.Scripting.CSSInjection {
        return {
            target: this._target,
            css: `
/* Blur only */
img[img-behaviour="video"] {
    filter: blur(${this._prefs.videoCensorLevel*4}px) !important;
}

img[img-behaviour="video"]:not([censor-state='censored']) {
    visibility: visible !important;
}
`
        };
    }

    public get blockVideo() : browser.Scripting.CSSInjection {
        return {
            target: this._target,
            css: `
video:not([censor-state='censored']) {
    visibility: hidden !important;
}
`
        }
    }

    public get blockGifs() : browser.Scripting.CSSInjection {
        return {
            target: this._target,
            css: `
img[img-behaviour="video"]:not([censor-state='censored']) {
    visibility: hidden !important;
}
`
        }
    }
}
