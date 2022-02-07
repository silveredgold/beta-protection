import { WebSocketClient } from "@/transport/webSocketClient";


export class PlaceholderService {
    

    /**
     *
     */
    constructor() {
    }

    public static getCategories = async (): Promise<string[]> => {
        let resp = await chrome.storage.local.get('placeholders');
        return resp['placeholders']
    }


    public static getAssets = async (categories?: string[]) => {
        if (!categories || categories.length == 0) {
            categories = await PlaceholderService.getCategories();
        }
        let relPaths: string[] = await PlaceholderService.getAssetPaths(categories!);
        let fullPaths = relPaths.map(rel => chrome.runtime.getURL(rel)).filter(aPath => !!aPath);
        return fullPaths;
    }

    public static getAssetPaths = async (categories: string[]) => {
        // if (!categories || categories.length == 0) {
        //     console.log('request did not include categories, falling back to all!');
        //     categories = await PlaceholderService.getCategories();
        // }
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
        // for (const cat in categories) {
        //     if (Object.prototype.hasOwnProperty.call(foundAssets, cat)) {

        //         const element = foundAssets[cat];
        //         relPaths.push(...element);
        //     }
        // }
        return relPaths;
    }

    public static loadAvailablePlaceholders = async (message: any) => {
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

    
    
}