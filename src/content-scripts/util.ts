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