import { IPreferences } from "@/preferences";
import browser from 'webextension-polyfill';


export class CSSManager {
    private _prefs: IPreferences;
    private _target: browser.Scripting.InjectionTarget;
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

    addSubliminal = async () => {
        await browser.scripting.insertCSS(this.subliminal)
    }

    removeSubliminal = async () => {
        await browser.scripting.removeCSS(this.subliminal)
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
img[src$=".gif"] {
    filter: blur(${this._prefs.videoCensorLevel*4}px) !important;
}

img[src$=".gif"]:not([censor-state='censored']) {
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
img[src$=".gif"]:not([censor-state='censored']) {
    visibility: hidden !important;
}
`
        }
    }
}