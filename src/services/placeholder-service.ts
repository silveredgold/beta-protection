import { LocalPlaceholder } from "@/placeholders";
import { hashCode } from "@/util";
import { DbClient } from "./db-client";
import { LoadedFileHandle } from "./fs-client";
import browser from 'webextension-polyfill';

export class PlaceholderService {


    /**
     *
     */
    constructor() {
    }

    public static getCategories = async (): Promise<string[]> => {
        // let resp = await chrome.storage.local.get('placeholders');
        // return resp['placeholders']
        const db = await DbClient.create();
        const placeholders = await db.getLocalPlaceholders();
        const categories = [...new Set(placeholders.map(pl => pl.category))];
        console.debug('mapping', placeholders, categories);
        return categories;
    }


    public static getBackendAssets = async (categories?: string[]) => {
        if (!categories || categories.length == 0) {
            categories = await PlaceholderService.getCategories();
        }
        const relPaths: string[] = await PlaceholderService.getBackendAssetPaths(categories!);
        const fullPaths = relPaths.map(rel => browser.runtime.getURL(rel)).filter(aPath => !!aPath);
        return fullPaths;
    }

    public static getBackendAssetPaths = async (categories: string[]) => {
        const relPaths: string[] = [];
        const query = {
            'backendAssets': {}
        }
        categories.forEach(cat => {
            query.backendAssets[cat] = [];
        });
        const response = await browser.storage.local.get(query);
        const foundAssets = response['backendAssets'] as { [key: string]: string[] };
        // console.log('got query response', response);
        for (const category of categories) {
            relPaths.push(...foundAssets[category]);
        }
        return relPaths;
    }

    public static loadBackendPlaceholders = async (message: any) => {
        const placeholderCategories = message['placeholders'] as string[];
        if (placeholderCategories && placeholderCategories.length > 0) {
            await browser.storage.local.set({ 'placeholders': placeholderCategories });
            const assets: { [key: string]: string[] } = {
            };
            for (const category of placeholderCategories) {
                const images: string[] = message[category];
                assets[category] = images;
            }
            await browser.storage.local.set({ 'backendAssets': assets });
        }
    }

    public static getLocalCategories = async () => {
        const db = await DbClient.create();
        const result = await db.getLocalPlaceholders();
        const cats = result.map(v => v.category);
        const uniqueCats = [...new Set(cats)];
        return uniqueCats;
    }

    public static getLocalPlaceholders = async (categories?: string[]) => {
        const db = await DbClient.create();
        let result = await db.getLocalPlaceholders();
        if (categories && categories.length > 0) {
            result = result.filter(f => categories.includes(f.category));
        }
        console.debug('pulled local results', result);
        console.debug('sizes: ', result.map(f => f.data?.size ?? -1));
        return result;
    }

    public static loadLocalPlaceholders = async (data: { categoryName: string, files: LoadedFileHandle[] }, persistMode: "data" | "handle") => {
        const files = data.files
        const catName = data.categoryName;
        let records: LocalPlaceholder[] = [];
        if (persistMode == "data") {
            const dataRecordPromises = files.map(async (f): Promise<LocalPlaceholder> => {
                const data = await f.file.arrayBuffer();
                const blob = getBlob(data, f.file.type);
                return {
                    category: catName,
                    filePath: f.file.name,
                    // id: hashCode(f.file.name) + f.file.size,
                    name: f.handle.name,
                    data: blob,
                    type: f.file.type
                };
            });
            records = await Promise.all(dataRecordPromises);
        } else if (persistMode == "handle") {
            const dataRecords = files.map((f): LocalPlaceholder => {
                return {
                    category: catName,
                    filePath: f.file.name,
                    // id: hashCode(f.file.name) + f.file.size,
                    name: f.handle.name,
                    handle: f.handle,
                    type: f.file.type
                };
            });
            records = dataRecords;
        }
        if (records && records.length > 0) {
            const db = await DbClient.create();
            await db.addPlaceholders(records);
        }
    }

    public static toSrc = (placeholder: LocalPlaceholder) => {

        if (placeholder.data && placeholder.data.size > 0) {
            return URL.createObjectURL(placeholder.data);
        }
        if (placeholder.dataUrl) {
            return placeholder.dataUrl!;
        }
        // if (placeholder.payload) {
        //     let blob = deserializeBlob(placeholder.payload, placeholder.type);
        //     // const blob = getBlob(data, placeholder.type)
        //     return URL.createObjectURL(blob);
        // }
        return undefined;
    }

    public static loadToSrc = async (handle: FileSystemFileHandle): Promise<string> => {
        const URL = window.URL || window.webkitURL;
        const file = await handle.getFile();
        const data = await file.arrayBuffer();
        const blob = getBlob(data, file.type);
        return URL.createObjectURL(blob);
    }
}

const getBlob = (arr: ArrayBuffer, type: string) => {
    const blob = new Blob([arr], { type });

    return blob;
}

export const serializeBlob = async (blob: Blob) => {
    const content = await readFileAsync(blob, "string") as string;
    return content;
}

export const deserializeBlob = (payload: string, type: string) => {
    const bytes = new Uint8Array(payload.length);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = payload.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type });
    return blob;
}

function readFileAsync(file: Blob, type: "buffer" | "string") {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result);
        };

        reader.onerror = reject;
        if (type == "buffer") {
            reader.readAsArrayBuffer(file);
        } else if (type == "string") {
            reader.readAsDataURL(file);
        }
    })
}

function readFileUrlAsync(file: Blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result);
        };

        reader.onerror = reject;

        reader.readAsDataURL(file);
    });
}