import { IPreferences } from "@/preferences/types";

export const configureVideo = async (headEl: HTMLElement): Promise<void> => {
    chrome.storage.local.get("video", function (list) {
        if (list["video"] === "blurvideo") {
            chrome.storage.local.get("videolevel", function (items) {
                let level = items["videolevel"];
                appendVideoCSS(level * 4);
            });
        }
        if (list["video"] === "allowvideo") {
            appendVideoCSS(0);
        }
    });
}

export const configureVideoPrefs = async (prefs: IPreferences, headEl: HTMLElement): Promise<void> => {
    if (prefs.videoCensorMode == "Blur") {
        appendVideoCSS(prefs.videoCensorLevel * 4, headEl);
    }
    if (prefs.videoCensorMode == "Allow") {
        appendVideoCSS(0, headEl);
    }
}

function appendVideoCSS(level: number, headEl?: HTMLElement) {
    if (!headEl) {
        headEl = document.getElementsByTagName('head')[0];
    }
    headEl.append('<style class="safetyCSS">' +
        'video {\n' +
        'filter: blur(' + level + 'px) !important;\n' +
        '}\n' +
        'video:not(.purified) {\n' +
        '    visibility: visible !important;\n' +
        '}\n');
}

export function addClassToElement(className: string, element: HTMLElement): void {
    element.classList.add(className);
}

export function getRandom(src: string[]): string {
    return src[Math.floor(Math.random()*src.length)]
}

export function generateUUID() { // Public Domain/MIT
    let d = new Date().getTime();//Timestamp
    let d2 = (performance && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16;//random number between 0 and 16
        if(d > 0){//Use timestamp until depleted
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

export function hashCode(str: string) {
    let hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr   = str.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}


export function isSafe(url: string, safeList: number[]) {
    let chrome = url && url.includes("chrome-extension://");
    let inList = safeList.includes(hashCode(url));
    return chrome || inList;
}