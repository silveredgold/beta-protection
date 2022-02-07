import { IPreferences } from "@/preferences/types";
import { CensoringContext } from "./types";

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

export const readDirectories = (dir: DirectoryEntry): Promise<string[]> => {
    return new Promise(resolve => {
        let subDirs: string[] = [];
    let reader = dir.createReader();
    reader.readEntries((entries) => {
        for (const entry of entries) {
            if (entry.isDirectory) {
                subDirs.push(entry.fullPath)
            }
        }
        if (entries.length == 0) {
            resolve(subDirs);
        }
    })
    });
}