import { hashCode, isValidUrl } from "@/util";
import { CensoringState, ImageStyleElement } from "./types";
import { generateUUID, getRandom } from "@/util";
import { debounce } from "throttle-debounce";
import { LocalPlaceholder } from "@/placeholders";
import { PlaceholderService } from "@/services/placeholder-service";
import browser from 'webextension-polyfill';


export class Purifier {
    private _currentState: CensoringState;
    
    private _backlog : boolean = false;
    private _port: browser.Runtime.Port | undefined;
    private _portFaulted: boolean = false;
    private _safeList: number[];
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
    
    private _placeholders: LocalPlaceholder[];
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
    
    private _videoMode: string;
    /**
     *
     */
    constructor(state: CensoringState, videoMode: "Block" | "Blur" | "Allow", location: Location | string, placeholders: LocalPlaceholder[], safeList: number[]) {
        // Only update once in a while.
        this._currentState = state;
        this._placeholders = placeholders;
        this._ready = true
        this._videoMode = videoMode;
        if (typeof location !== 'string') {
            location = (location as Location).hostname;
        }
        // this._domain = location.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").toLowerCase();
        this._domain = "unknown.com";
        this._urlTransformers.push(srcUrl => srcUrl.replace(".gifv", ".gif"))
        this._safeList = safeList;
    }

    
    public get port() : browser.Runtime.Port | undefined {
        return this._port;
    }
    public set port(v : browser.Runtime.Port|undefined) {
        this._port = v;
    }
    

    private getPlaceholderSrc = () => {
        let placeholder = browser.runtime.getURL('/images/loading.png');
        if (this._placeholders.length && this._placeholders.length > 0) {
            try {
            const random = getRandom(this._placeholders);
            // console.debug('selecting candidate placeholder', random, random.data?.size ?? -1);
            
            const src = PlaceholderService.toSrc(random);
            placeholder = src ? src : placeholder;
            } catch {
                console.warn('failed to get placeholder!');
            }
        }
        return placeholder;
    }

    private getVideoPlaceholderSrc = (): {poster: string, video: string} => {
        const placeholder = browser.runtime.getURL("images/poster.jpg");
        const video = browser.runtime.getURL("images/blocked_video.mp4");
        return {poster: placeholder, video};
    }

    private _start = () => {
        const elements = document.body.getElementsByTagName("img");
        const bgElements = document.body.getElementsByTagName("*");
        //images first
        const targetEls = this.discoverImages([...elements]);
        for (const el of targetEls) {
            this.censorImage(el)
        }
        // then backgrounds
        const targetBacks = this.discoverStyleImages([...bgElements]);
        for (const target of targetBacks) {
            this.censorStyleImage(target);
        }
        // then videos
        if (this._currentState.activeCensoring && this._videoMode == "Block") {
            const videoElements = this.discoverVideos(['video', 'video-element']);
            this.disableVideos(videoElements);
        }
    }

    run = () => {
        this.queueStart();
    }

    private discoverStyleImages = (elements: Element[]) => {
        const backgroundEls: ImageStyleElement[] = elements.map(el => {
            const style = window.getComputedStyle(el, null);
            const background = style.getPropertyValue("background")
            return {element: el, background};
        }).filter(bg => !!bg.background);
        const matchingEls = backgroundEls.map(bg => {
            if (bg.background) { // should this be background-image?
                //thanks https://stackoverflow.com/a/34166861
                const urlMatch = /[:,\s]\s*url\s*\(\s*(?:'(\S*?)'|"(\S*?)"|((?:\\\s|\\\)|\\\"|\\\'|\S)*?))\s*\)/gi
                const match = urlMatch.exec(bg.background);
                if (match) {
                    bg.imageUrl = match[1]
                }
            }
            return bg;
        });
        return matchingEls;
    }

    private flattenSrc = (el: HTMLImageElement) => {
        if (el.tagName === "IMG" && el.srcset.length > 0) {
            const url = el.currentSrc;
            if (url !== "" && isValidUrl(url)) {
                el.srcset = "";
                el.src = url;
            }
        }
    }

    private discoverImages = (elements: HTMLImageElement[]): HTMLImageElement[] => {
        const targetEls: HTMLImageElement[] = [];
        elements.forEach(el => {
            this.flattenSrc(el);
            if (el.tagName === "IMG" && isValidUrl(el.src)) {
                if (this.isUnsafe(el)) {
                    targetEls.push(el);
                    // this.purifyImage(el);
                }
            }
        });
        return targetEls;
    }

    censorImage = (img: HTMLImageElement, runOnce: boolean = false) => {
        this.flattenSrc(img);
        // console.debug('censorImage', img, img.complete, img.naturalWidth);
        if (runOnce || (img.complete && img.naturalWidth > 0)) {
            const url = this.normalizeSrcUrl(img);
            // console.debug('running censorLoadedImage', img, runOnce);
            this.censorLoadedImage(url, img, runOnce ? true : (this._currentState && this._currentState.activeCensoring));
        } else if (!runOnce) {
            this.backlog = true;
        } else {
            // console.debug('unmatched');
        }
    }

    // backend seems to take almost anything these days
    // this is more of an extension point.
    private normalizeSrcUrl = (img: HTMLImageElement) => {
        const imageURL = img.getAttribute('censor-src') ?? img.getAttribute('src')!;
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

    private censorLoadedImage = (imageURL: string, img: HTMLImageElement, active: boolean) => {
        if (this.isUnsafe(img) && this._ready) {
            if (img.width * img.height > 15000 && img.width > 100 && img.height > 100 && !imageURL.includes(".svg")) {
                const uniqueID = generateUUID();
                img.setAttribute('censor-id', uniqueID);
                img.setAttribute('censor-src', imageURL);
                if (img.clientWidth > 0) {
                    img.width = img.clientWidth;
                }
                if (active) {
                    img.setAttribute('censor-state', 'censoring');
                    const placeholder = this.getPlaceholderSrc();
                    // console.log(`got placeholder URL: ${placeholder}`);
                    const priority = img.getBoundingClientRect().top | 0;
                    const placeHolderImage = new Image();
                    placeHolderImage.onload = () => {
                        img.addEventListener('load', () => {
                            img.setAttribute('censor-state', 'censored');
                        }, { once: true });
                        img.src = placeHolderImage.src;
                        img.toggleAttribute('censor-placeholder', true);
                        this.sendCensorRequest(imageURL, uniqueID, "normal", priority);
                    };
                    placeHolderImage.setAttribute('src', placeholder);
                } else {
                    this.setImgExcluded(img, 'disabled');
                }
            } else {
                this.setImgExcluded(img, 'size_format');
            }
        } else {
            this.backlog = true;
        }
    }

    private sendCensorRequest = (imageUrl: string, id: string, type: "BG"|"normal", priority?: number) => {
        const msg = {
            msg: 'censorRequest',
            imageURL: imageUrl,
            id: id,
            priority: priority ?? 1,
            type: type,
            domain: this._domain
        };
        const port = browser.runtime.connect({name: id});
        if (port) {
            // console.log('got named port!')
            port.onMessage.addListener((msg, port) => {
                handleCensorResult(msg, this._safeList, port);
            });
            // console.debug('sending request on named port!');
            port.postMessage(msg);
        } else if (this._port && !this._portFaulted) {
            // console.debug('using existing port for runtime message');
            try {
                this._port.postMessage(msg);
            } catch {
                this._portFaulted = true;
                browser.runtime.sendMessage(msg);
            }
        } else {
            // console.debug('using runtime for message');
            browser.runtime.sendMessage(msg);
        }
        // this.messageQueue.push(id);
    }

    private censorStyleImage = (img: ImageStyleElement) => {
        if (img.imageUrl) {
            const imageURL = this.normalizeUrl(img.imageUrl);
            if (isValidUrl(imageURL) && !imageURL.includes(".svg")) {
                const image = new Image();

                // just in case it is not already loaded
                image.addEventListener('on', () => {
                    if (image.width * image.height > 15000 && image.width > 100 && image.height > 100) {
                        const uniqueID = generateUUID();
                        img.element.setAttribute('censor-id', uniqueID);
                        if (this._currentState && this._currentState.activeCensoring) {
                            const placeholder = this.getPlaceholderSrc();
                            try {
                                (img.element as HTMLElement).style.backgroundImage = 'url("' + placeholder + '")';
                            } catch { }
                            this.sendCensorRequest(imageURL, uniqueID, "BG", 1);
                        }
                        img.element.setAttribute('censor-style', 'censored');
                    } else {
                        this.setExcluded(img.element, 'size');
                    }
                }, { once: true });
                image.src = imageURL;
            }
        } else {
            this.setExcluded(img.element, 'unmatched_url');
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
                    `<source type="video/mp4" src="${videoPl.video}">` +
                    `</video>`;
                // const srcEl = videoEl.getElementsByTagName('source');
                // if (srcEl && srcEl.length == 1) {
                //     srcEl[0].setAttribute('src', videoPl.video);
                // }
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

    private setExcluded(el: Element, reason?: string) {
        el.setAttribute('censor-style', 'excluded');
        if (reason) {
            const existing = (el.getAttribute('censor-exclusion') ?? '').replace(reason, '').trim();
            el.setAttribute('censor-exclusion', existing ? `${existing} ${reason}` : reason);
        }
    }

    private setImgExcluded(el: HTMLImageElement, reason?: string) {
        el.setAttribute('censor-state', 'excluded');
        if (reason) {
            const existing = (el.getAttribute('censor-exclusion') ?? '').replace(reason, '').trim();
            el.setAttribute('censor-exclusion', existing ? `${existing} ${reason}` : reason);
        }
    }
}


const handleCensorResult = (request: any, safeList: number[], port: browser.Runtime.Port) => {
    if(request.msg === "setSrc" && request.type === "normal") {
		const requestElement = document.querySelector(`[censor-id="${request.id}"]`)
		if(requestElement){
			// console.log(`finalizing purify for ${requestElement}`)
			requestElement.setAttribute('src', request.censorURL);
			requestElement.setAttribute('censor-state', 'censored');
			requestElement.toggleAttribute('censor-placeholder', false);
			safeList.push(hashCode(request.censorURL));
		}
        port.disconnect();
	} else if(request.msg === "setSrc" && request.type === "BG") {
		console.log(`got background setSrc message! ${request.id}`)
		const requestElement = document.querySelector(`[censor-id="${request.id}"]'`)
		if(requestElement) {
			(requestElement as HTMLElement).style.backgroundImage = "url('" + request.censorURL + "')";
			// console.log(`finalizing BG purify for ${requestElement}`)
			requestElement.setAttribute('censor-style', 'censored');
			requestElement.toggleAttribute('censor-placeholder', false);
			//TODO: should this remove the CSS classes?
			safeList.push(hashCode(request.censorURL));
            port.disconnect();
		}
	}

}