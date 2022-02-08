import { LocalPlaceholder } from "@/placeholders";
import { hashCode } from "@/util";
import { DbClient } from "./db-client";
import { LoadedFileHandle } from "./fs-client";


export class PlaceholderService {
    

    /**
     *
     */
    constructor() {
    }

    public static getCategories = async (): Promise<string[]> => {
        // let resp = await chrome.storage.local.get('placeholders');
        // return resp['placeholders']
        let db = await DbClient.create();
        let placeholders = await db.getLocalPlaceholders();
        const categories = [...new Set(placeholders.map(pl => pl.category))];
        console.debug('mapping', placeholders, categories);
        return categories;
    }


    public static getBackendAssets = async (categories?: string[]) => {
        if (!categories || categories.length == 0) {
            categories = await PlaceholderService.getCategories();
        }
        let relPaths: string[] = await PlaceholderService.getBackendAssetPaths(categories!);
        let fullPaths = relPaths.map(rel => chrome.runtime.getURL(rel)).filter(aPath => !!aPath);
        return fullPaths;
    }

    public static getBackendAssetPaths = async (categories: string[]) => {
        let relPaths: string[] = [];
        let query = {
            'backendAssets': {}
        }
        categories.forEach(cat => {
            query.backendAssets[cat] = [];
        });
        let response = await chrome.storage.local.get(query);
        let foundAssets = response['backendAssets'] as {[key: string]: string[]};
        // console.log('got query response', response);
        for (const category of categories) {
            relPaths.push(...foundAssets[category]);
        }
        return relPaths;
    }

    public static loadBackendPlaceholders = async (message: any) => {
        let placeholderCategories = message['placeholders'] as string[];
        if (placeholderCategories && placeholderCategories.length > 0) {
            await chrome.storage.local.set({'placeholders': placeholderCategories});
            let assets: {[key: string]: string[]} = {
            };
            for (const category of placeholderCategories) {
                let images: string[] = message[category];
                assets[category] = images;
            }
            await chrome.storage.local.set({'backendAssets': assets});
        }
    }

    public static getLocalCategories = async () => {
        const db = await DbClient.create();
        const result = await db.getLocalPlaceholders();
        let cats = result.map(v => v.category);
        let uniqueCats = [...new Set(cats)];
        return uniqueCats;
    }

    public static getLocalPlaceholders = async (categories?: string[]) => {
        const db = await DbClient.create();
        let result = await db.getLocalPlaceholders();
        if (categories && categories.length > 0) {
            result = result.filter(f => categories.includes(f.category));
        }
        console.log('pulled local results', result);
        console.log('sizes: ', result.map(f => f.data?.size ?? -1));
        return result;
    }

    public static loadLocalPlaceholders = async (data: {categoryName: string, files: LoadedFileHandle[]}, persistMode: "data"|"handle") => {
        let files = data.files
        let catName = data.categoryName;
        let records: LocalPlaceholder[] = [];
        if (persistMode == "data") {
            let dataRecordPromises = files.map(async (f): Promise<LocalPlaceholder> => {
                let data = await f.file.arrayBuffer();
                let blob = getBlob(data, f.file.type);
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
            let dataRecords = files.map((f): LocalPlaceholder => {
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

    // public static getLocalAssetPaths = async (categories: string[]) => {
    //     const db = await DbClient.create();
    //     const placeholders = await db.getLocalPlaceholders();
        
    //     let relPaths: string[] = [];
    //     let query = {
    //         'backendAssets': {}
    //     }
    //     categories.forEach(cat => {
    //         query.backendAssets[cat] = [];
    //     });
    //     let response = await chrome.storage.local.get(query);
    //     let foundAssets = response['backendAssets'] as {[key: string]: string[]};
    //     // console.log('got query response', response);
    //     for (const category of categories) {
    //         relPaths.push(...foundAssets[category]);
    //     }
    //     return relPaths;
    // }

    // public static getLocalAssets = async (categories?: string[]) => {
    //     if (!categories || categories.length == 0) {
    //         categories = await PlaceholderService.getCategories();
    //     }
    //     let relPaths: string[] = await PlaceholderService.getBackendAssetPaths(categories!);
    //     let fullPaths = relPaths.map(rel => chrome.runtime.getURL(rel)).filter(aPath => !!aPath);
    //     return fullPaths;
    // }
}

const getBlob = (arr: ArrayBuffer, type: string) => {
    const blob = new Blob([arr], {type});
    
    return blob;
}

export const serializeBlob = async (blob: Blob) => {
    
    let buffer = await blob.arrayBuffer();

    let content = await readFileAsync(blob, "string") as string;
    return content;
}

export const deserializeBlob = (payload: string, type: string) => {
    let bytes = new Uint8Array(payload.length);
    for (let i=0; i<bytes.length; i++) {
    bytes[i] = payload.charCodeAt(i);            
    }             
    const blob = new Blob([bytes], {type});
    return blob;
}

function readFileAsync(file: Blob, type: "buffer"|"string") {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
  
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
      let reader = new FileReader();
  
      reader.onload = () => {
        resolve(reader.result);
      };
  
      reader.onerror = reject;
  
      reader.readAsDataURL(file);
    });
  }