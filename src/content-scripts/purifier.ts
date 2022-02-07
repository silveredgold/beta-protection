import { IPreferences } from "@/preferences/types";
import { isValidUrl } from "@/util";
import { CensoringState } from "./types";
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
        this.start();
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
    }

    private getPlaceholderSrc = () => {
        let placeholder = chrome.runtime.getURL('/images/loading.png');
        if (this._placeholders.length && this._placeholders.length > 0) {
            placeholder = chrome.runtime.getURL(getRandom(this._placeholders));
        }
        return placeholder;
    }

    start = () => {
        let time = new Date().getTime();
        let elements = document.body.getElementsByTagName("img");
        let bgElements = document.body.getElementsByTagName("*");
        if ((time - this._lastRun) > 500 && this._ready) {
            this._lastRun = time;
            this.discoverImages([...elements]);
            this.discoverBackgroundImages([...bgElements]);
            if (this._currentState.activeCensoring && this._videoMode == "Block") {
                this.purifyiVideo("video-element", "images/video.gif");
                this.purifyiVideo("video", "images/video.gif");
            }
        } else {
            this.backlog = true;
        }
    }

    discoverImages = (elements: HTMLImageElement[]) => {
        elements.forEach(el => {
            if (el.tagName === "IMG" && el.srcset.length > 0) {
                let url = el.currentSrc;
                if (url !== "" && isValidUrl(url)) {
                    el.srcset = "";
                    el.src = url;
                }
            }
            if (el.tagName === "IMG" && isValidUrl(el.src)) {
                if (this.isUnsafe(el)) {
                    this.purifyImage(el);
                }
            }
        });
    }

    purifyImage = (img: HTMLImageElement) => {
        if (img.complete && img.naturalWidth > 0) {
            this.parseLoadedImageURL(img);
        } else {
            this.backlog = true;
        }
    }

    // Stage three. Some URL's need to be adapted for the censoring to work.
    // Tumblr images especially need a proper whacking (updated the backend it's more robust now!).
    parseLoadedImageURL = (img: HTMLImageElement) => {
        //$(img).attr('width', img.width);
        let imageURL = img.getAttribute('src')!;
        if (imageURL) {
            imageURL = imageURL.replace(".gifv", ".gif");
        }
        console.log(`parsed ${imageURL}!`);
        this.purifyLoadedImage(imageURL, img);
    }

    purifyLoadedImage = (imageURL: string, img: HTMLImageElement) => {
        let elState = img.getAttribute('censor-state');
        if (this.isUnsafe(img) && this._ready) {
            if (img.width * img.height > 15000 && img.width > 100 && img.height > 100 && !imageURL.includes(".svg")) {
                let uniqueID = generateUUID();
                // img.classList.add(uniqueID);
                img.setAttribute('censor-id', uniqueID);
                if (img.clientWidth > 0) {
                    img.width = img.clientWidth;
                }
                if (this._currentState && this._currentState.activeCensoring) {
                    console.log(`adding purifying class!`);
                    img.setAttribute('censor-state', 'censoring');
                    // img.classList.add("purifying");
                    let placeholder = this.getPlaceholderSrc();
                    console.log(`got placeholder URL: ${placeholder}`);
                    let priority = img.getBoundingClientRect().top | 0;

                    let placeHolderImage = new Image();
                    let domain = this._domain;
                    placeHolderImage.onload = function () {
                        img.addEventListener('load', () => {
                            console.log(`adding purified!`);
                            img.setAttribute('censor-state', 'censored');
                            // img.classList.add("purified");
                        }, { once: true });
                        img.src = placeHolderImage.src;
                        chrome.runtime.sendMessage({
                            msg: 'censorRequest',
                            imageURL: imageURL,
                            id: uniqueID,
                            priority: priority,
                            type: "normal",
                            domain: domain
                        });
                    };
                    placeHolderImage.setAttribute('src', placeholder);
                } else {
                    img.setAttribute('censor-state', 'censored');
                    // img.classList.add("purified");
                }
            } else {
                img.setAttribute('censor-state', 'excluded');
                // img.classList.add("excluded")
                // img.classList.add("purified");
            }
        } else {
            this.backlog = true;
        }

    }

    purifyiVideo = (tagName: string, placeholder: string) => {

        let elementList = document.getElementsByTagName(tagName);
        for (let i = 0; i < elementList.length; i++) {
            let el = elementList[i];
            let elState = el.getAttribute('censor-state');
            if (this.isUnsafe(el)) {
                console.log('found unsafe video element', el);
                elementList[i].outerHTML = "<video censor-state=\"purified\" poster='" + chrome.runtime.getURL(placeholder) + "'>" +
                    "<source type=\"video/mp4\">" +
                    "</video>";

                elementList[i].setAttribute('src', chrome.runtime.getURL("images/video.mp4"))
            }
        }
    }

    // Stage one, iterate over all DOM elements to find (BG) images that need to be censored.
    discoverBackgroundImages = (elements: Element[]) => {
        elements.forEach(el => {
            let style = window.getComputedStyle(el, null).getPropertyValue("background");
            this.checkBackgroundStyle(style, el);
        });
    }

    // Stage two, background images. Send it to the background for censoring.
    purifyBackgroundImage = (imageURL, uniqueID) => {
        imageURL = imageURL.replace(".gifv", ".gif");
        console.log(`sending request for ${imageURL}`);
        chrome.runtime.sendMessage({
            msg: 'censorRequest',
            imageURL: imageURL,
            id: uniqueID,
            priority: 1,
            type: "BG",
            domain: this._domain
        });
    }

    checkBackgroundStyle = (style, el: Element) => {
        // if (style !== "none" && !el.classList.contains("excludedBG") && !el.classList.contains("purifiedBG") && this._ready) {
        if (style !== "none" && this.isUnsafe(el, "bg") && this._ready) {
            const srcChecker = /url\(\s*?['"]?\s*?(\S+?)\s*?["']?\s*?\)/i;
            let match = srcChecker.exec(style);
            if (match) {
                let imageURL = match[1];
                if (isValidUrl(imageURL) && !imageURL.includes(".svg")) {
                    let image = new Image();

                    // just in case it is not already loaded
                    image.addEventListener('on', () => {
                        if (image.width * image.height > 15000 && image.width > 100 && image.height > 100) {
                            let uniqueID = generateUUID();
                            el.setAttribute('censor-id', uniqueID);
                            el.classList.add(uniqueID);
                            if (this._currentState && this._currentState.activeCensoring) {
                                let placeholder = this.getPlaceholderSrc();
                                try {
                                    (el as HTMLElement).style.backgroundImage = 'url("' + placeholder + '")';
                                } catch { }

                                this.purifyBackgroundImage(imageURL, uniqueID); // save background image url
                            }
                            el.setAttribute('censor-style', 'censored');
                            // el.classList.add("purifiedBG");
                        } else {
                            el.setAttribute('censor-style', 'excluded');
                            // el.classList.add("excludedBG");
                            // el.classList.add("purifiedBG");
                        }
                    }, { once: true });
                    image.src = imageURL;
                }
            } else {
                el.setAttribute('censor-style', 'excluded');
                // el.classList.add('excludedBG');
                // el.classList.add("purifiedBG");
            }
        }
    }

    private isUnsafe = (el: Element, mode: "normal"|"bg" = "normal") => {
        let elState = mode === "normal" ? el.getAttribute('censor-state') : el.getAttribute('censor-style');
        return this.isUnsafeState(elState);
    }

    private isUnsafeState = (elState: string | null) => {
        return elState !== 'censored' && elState !== 'censoring' && elState !== 'excluded';
    }

}