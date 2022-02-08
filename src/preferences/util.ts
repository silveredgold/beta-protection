import { LocalPlaceholder } from "@/placeholders";
import { PlaceholderService } from "@/services/placeholder-service";
import { StickerService } from "@/services/sticker-service";
import { IPreferences, loadPreferencesFromStorage } from ".";

export async function getAvailableStickers() {
    let cats = await StickerService.getAvailable();
}

export async function getAvailablePlaceholders(): Promise<{categories: string[], allImages: LocalPlaceholder[]}> {
    let placeholderCategories = await PlaceholderService.getCategories();
    let allPlaceholders = await PlaceholderService.getLocalPlaceholders(placeholderCategories);
    // let allPlaceholders = await PlaceholderService.getBackendAssetPaths(placeholderCategories);
    if (placeholderCategories && allPlaceholders) {
        return {allImages: allPlaceholders, categories: placeholderCategories};
    }
    // if (storedHolders['placeholders']) {
    //     let categories = storedHolders['placeholders'] as string[];
    //     console.log(`updating with placeholders: ${categories}`);
    //     // context.preferences!.enabledPlaceholders = storedHolders['placeholders'];
    //     let files = await chrome.storage.local.get(categories) as {[key: string]: string[]};
        
    //     for (const category in files) {
    //         if (Object.prototype.hasOwnProperty.call(files, category)) {
    //             const element = files[category];
    //             allPlaceholders.push(...element);
    //         }
    //     }
    //     console.log(`parsed all available placeholders: ${allPlaceholders}`);
    //     return {categories, allImages: allPlaceholders}
    // }
    return {allImages: [], categories: []}
}

export async function getEnabledPlaceholders(prefs?: IPreferences): Promise<{categories: string[], allImages: LocalPlaceholder[]}> {
    let enabledCategories = await getEnabledPlaceholderCategories(prefs);
    // console.log('getting assets for enabled categories', enabledCategories);
    let enabledPlaceholders = await PlaceholderService.getLocalPlaceholders(enabledCategories);
    console.debug('returning results', enabledCategories, enabledPlaceholders);
    // console.log('got enabled assets', enabledPlaceholders);
    return {
        allImages: enabledPlaceholders,
        categories: enabledCategories
    };
}

export async function getEnabledPlaceholderCategories(prefs?: IPreferences) {
    let placeholderCategories = await PlaceholderService.getCategories();
    // let allPlaceholders = await PlaceholderService.getAssetPaths();
    if (!prefs?.enabledPlaceholders) {
        prefs = await loadPreferencesFromStorage();
    }
    let enabledCategories = placeholderCategories.filter(cat => (prefs!.enabledPlaceholders ?? []).includes(cat));
    return enabledCategories;
}