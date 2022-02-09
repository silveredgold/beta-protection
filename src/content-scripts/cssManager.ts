import { IPreferences } from "@/preferences";


export class CSSManager {
    private _prefs: IPreferences;
    private _target: chrome.scripting.InjectionTarget;
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
            await chrome.scripting.insertCSS(this.videoBase);
            await chrome.scripting.insertCSS(this.blurVideo);
        }
        if (this._prefs.videoCensorMode == "Block") {
            await chrome.scripting.insertCSS(this.videoBase);
            await chrome.scripting.insertCSS(this.blockVideo);
        }
    }

    removeVideo = async () => {
        await (chrome.scripting as any).removeCSS(this.videoBase);
        await (chrome.scripting as any).removeCSS(this.blurVideo);
        await (chrome.scripting as any).removeCSS(this.blockVideo);
    }

    addCSS = async () => {
        await chrome.scripting.insertCSS(this.active);

    }

    removeCSS = async () => {
        //TODO: why don't the types include this? It's in Chrome 90+ at least
        await (chrome.scripting as any).removeCSS(this.active);
    }

    addSubliminal = async () => {
        await chrome.scripting.insertCSS(this.subliminal)
    }

    removeSubliminal = async () => {
        await (chrome.scripting as any).removeCSS(this.subliminal)
    }

    public get subliminal() : chrome.scripting.CSSInjection {
        return {
            target: this._target,
            files: ["css/subliminal.css"]
        };
    }
    
    public get active() : chrome.scripting.CSSInjection {
        return {
            target: this._target,
            files: ["css/images.css"]
        };
    }

    public get videoBase() : chrome.scripting.CSSInjection {
        return {
            target: this._target,
            files: ["css/video.css"]
        };
    }

    public get blurVideo() : chrome.scripting.CSSInjection {
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

    public get blockVideo() : chrome.scripting.CSSInjection {
        return {
            target: this._target,
            css: `
video:not([censor-state='censored']) {
    visibility: hidden !important;
}
            `
        }
    }
}