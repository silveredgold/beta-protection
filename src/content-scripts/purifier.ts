import { isValidUrl } from "@/util";
import { CensoringState, ImageStyleElement } from "./types";
import { generateUUID, getRandom } from "./util";
import { debounce } from "throttle-debounce";


export class Purifier {
    private _currentState: CensoringState;
    
    private _backlog : boolean = false;
    public get backlog() : boolean {
        return this._backlog;
    }
    public set backlog(v : boolean) {
        this._backlog = v;
        if (this._backlog) {
            this.queueStart();
        }
    }

    private queueStart = debounce(1000, () => {
        console.log('debounce complete, running purifier');
        this._backlog = false;
        this._start();
    });
    
    private _placeholders: string[];
    private _domain: any;
    private _ready: boolean;
    public get ready(): boolean {
        return this._ready;
    }
    public set ready(v : boolean) {
        this._ready = v;
    }

    
    private _urlTransformers : ((url: string) => string)[] = [];
    public get urlTransformers() : ((url: string) => string)[] {
        return this._urlTransformers;
    }
    
    


    private _lastRun: number;
    private _videoMode: string;
    /**
     *
     */
    constructor(state: CensoringState, videoMode: "Block" | "Blur" | "Allow", location: Location | string, placeholders: string[], lastRun?: number) {
        // Only update once in a while.
        this._lastRun = lastRun ?? new Date().getTime();
        this._currentState = state;
        this._placeholders = placeholders;
        this._ready = true
        this._videoMode = videoMode;
        if (typeof location !== 'string') {
            location = (location as Location).hostname;
        }
        this._domain = location.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").toLowerCase();
        this._urlTransformers.push(srcUrl => srcUrl.replace(".gifv", ".gif"))
    }

    private getPlaceholderSrc = () => {
        let placeholder = chrome.runtime.getURL('/images/loading.png');
        if (this._placeholders.length && this._placeholders.length > 0) {
            placeholder = chrome.runtime.getURL(getRandom(this._placeholders));
        }
        return placeholder;
    }

    private getVideoPlaceholderSrc = (): {poster: string, video: string} => {
        const placeholder = chrome.runtime.getURL("images/video.gif");
        const video = chrome.runtime.getURL("image/video.mp4");
        return {poster: placeholder, video};
    }

    private _start = () => {
        const elements = document.body.getElementsByTagName("img");
        const bgElements = document.body.getElementsByTagName("*");
        //images first
        let targetEls = this.discoverImages([...elements]);
        for (const el of targetEls) {
            this.censorImage(el)
        }

        const targetBacks = this.discoverStyleImages([...bgElements]);
        for (const target of targetBacks) {
            this.censorStyleImage(target);
        }
        if (this._currentState.activeCensoring && this._videoMode == "Block") {
            const videoElements = this.discoverVideos(['video', 'video-element']);
            this.disableVideos(videoElements);
        }
    }

    start = () => {
        this.queueStart();
    }

    private discoverStyleImages = (elements: Element[]) => {
        const backgroundEls: ImageStyleElement[] = elements.map(el => {
            const style = window.getComputedStyle(el, null);
            const background = style.getPropertyValue("background")
            return {element: el, background};
        }).filter(bg => !!bg.background);
        const matchingEls = backgroundEls.map(bg => {
            if (bg.background) {
                const srcChecker = /url\(\s*?['"]?\s*?(\S+?)\s*?["']?\s*?\)/i;
                let match = srcChecker.exec(bg.background);
                if (match) {
                    bg.imageUrl = match[1]
                }
            }
            return bg;
        });
        return matchingEls;
    }

    private discoverImages = (elements: HTMLImageElement[]): HTMLImageElement[] => {
        const targetEls: HTMLImageElement[] = [];
        elements.forEach(el => {
            if (el.tagName === "IMG" && el.srcset.length > 0) {
                const url = el.currentSrc;
                if (url !== "" && isValidUrl(url)) {
                    el.srcset = "";
                    el.src = url;
                }
            }
            if (el.tagName === "IMG" && isValidUrl(el.src)) {
                if (this.isUnsafe(el)) {
                    targetEls.push(el);
                    // this.purifyImage(el);
                }
            }
        });
        return targetEls;
    }

    private censorImage = (img: HTMLImageElement) => {
        if (img.complete && img.naturalWidth > 0) {
            const url = this.normalizeSrcUrl(img);
            this.censorLoadedImage(url, img);
        } else {
            this.backlog = true;
        }
    }

    // backend seems to take almost anything these days
    // this is more of an extension point.
    private normalizeSrcUrl = (img: HTMLImageElement) => {
        const imageURL = img.getAttribute('src')!;
        return this.normalizeUrl(imageURL);
    }

    private normalizeUrl = (srcUrl: string) => {
        if (srcUrl) {
            for (const func of this._urlTransformers) {
                srcUrl = func(srcUrl) ?? srcUrl;
            }
        }
        return srcUrl;
    }

    private censorLoadedImage = (imageURL: string, img: HTMLImageElement) => {
        if (this.isUnsafe(img) && this._ready) {
            if (img.width * img.height > 15000 && img.width > 100 && img.height > 100 && !imageURL.includes(".svg")) {
                const uniqueID = generateUUID();
                img.setAttribute('censor-id', uniqueID);
                if (img.clientWidth > 0) {
                    img.width = img.clientWidth;
                }
                if (this._currentState && this._currentState.activeCensoring) {
                    img.setAttribute('censor-state', 'censoring');
                    const placeholder = this.getPlaceholderSrc();
                    console.log(`got placeholder URL: ${placeholder}`);
                    const priority = img.getBoundingClientRect().top | 0;
                    const placeHolderImage = new Image();
                    placeHolderImage.onload = () => {
                        img.addEventListener('load', () => {
                            img.setAttribute('censor-state', 'censored');
                        }, { once: true });
                        img.src = placeHolderImage.src;
                        this.sendCensorRequest(imageURL, uniqueID, "normal", priority);
                    };
                    placeHolderImage.setAttribute('src', placeholder);
                } else {
                    img.setAttribute('censor-state', 'censored');
                }
            } else {
                img.setAttribute('censor-state', 'excluded');
            }
        } else {
            this.backlog = true;
        }
    }

    private sendCensorRequest = (imageUrl: string, id: string, type: "BG"|"normal", priority?: number) => {
        chrome.runtime.sendMessage({
            msg: 'censorRequest',
            imageURL: imageUrl,
            id: id,
            priority: priority ?? 1,
            type: type,
            domain: this._domain
        });
    }

    private censorStyleImage = (img: ImageStyleElement) => {
        if (img.imageUrl) {
            const imageURL = this.normalizeUrl(img.imageUrl);
            if (isValidUrl(imageURL) && !imageURL.includes(".svg")) {
                let image = new Image();

                // just in case it is not already loaded
                image.addEventListener('on', () => {
                    if (image.width * image.height > 15000 && image.width > 100 && image.height > 100) {
                        const uniqueID = generateUUID();
                        img.element.setAttribute('censor-id', uniqueID);
                        if (this._currentState && this._currentState.activeCensoring) {
                            let placeholder = this.getPlaceholderSrc();
                            try {
                                (img.element as HTMLElement).style.backgroundImage = 'url("' + placeholder + '")';
                            } catch { }
                            this.sendCensorRequest(imageURL, uniqueID, "BG", 1);
                        }
                        img.element.setAttribute('censor-style', 'censored');
                    } else {
                        img.element.setAttribute('censor-style', 'excluded');
                        img.element.setAttribute('censor-exclusion', 'size');
                    }
                }, { once: true });
                image.src = imageURL;
            }
        } else {
            img.element.setAttribute('censor-style', 'unmatched_url');
            img.element.setAttribute('censor-exclusion', 'size');
        }
    }

    private discoverVideos = (tagNames: string[]) => {
        const allEls = tagNames.map(tn => document.getElementsByTagName(tn)).flatMap(a => [...a]);
        return allEls;
    }

    private disableVideos = (elements: Element[]) => {
        for (const videoEl of elements) {
            if (this.isUnsafe(videoEl)) {
                const videoPl = this.getVideoPlaceholderSrc();
                videoEl.outerHTML = `<video censor-state="censored" poster='${videoPl.poster}'>` +
                    `<source type="video/mp4">` +
                    `</video>`;
                const srcEl = videoEl.getElementsByTagName('source');
                if (srcEl && srcEl.length == 1) {
                    srcEl[0].setAttribute('src', videoPl.video);
                }
            }
        }
    }

    private isUnsafe = (el: Element, mode: "normal"|"bg" = "normal") => {
        const elState = mode === "normal" ? el.getAttribute('censor-state') : el.getAttribute('censor-style');
        return this.isUnsafeState(elState);
    }

    private isUnsafeState = (elState: string | null) => {
        return elState !== 'censored' && elState !== 'censoring' && elState !== 'excluded';
    }

}