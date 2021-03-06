import { LocalPlaceholder } from "@/placeholders";
import { PlaceholderService } from "@/services/placeholder-service";
import { StickerService } from "@/services/sticker-service";
import { IExtensionPreferences, IPreferences, loadPreferencesFromStorage } from ".";
import { dbg } from "@/util";

export async function getAvailableStickers() {
    const cats = await StickerService.getAvailable();
    return cats;
}

export async function getAvailablePlaceholders(): Promise<{categories: string[], allImages: LocalPlaceholder[]}> {
    const placeholderCategories = await PlaceholderService.getCategories();
    const allPlaceholders = await PlaceholderService.getLocalPlaceholders(placeholderCategories);
    // let allPlaceholders = await PlaceholderService.getBackendAssetPaths(placeholderCategories);
    if (placeholderCategories && allPlaceholders) {
        return {allImages: allPlaceholders, categories: placeholderCategories};
    }
    return {allImages: [], categories: []}
}

export async function getEnabledPlaceholders(prefs?: IExtensionPreferences): Promise<{categories: string[], allImages: LocalPlaceholder[]}> {
    const enabledCategories = await getEnabledPlaceholderCategories(prefs);
    const enabledPlaceholders = await PlaceholderService.getLocalPlaceholders(enabledCategories);
    dbg('returning results', enabledCategories, enabledPlaceholders);
    return {
        allImages: enabledPlaceholders,
        categories: enabledCategories
    };
}

export async function getEnabledPlaceholderCategories(prefs?: IExtensionPreferences) {
    const placeholderCategories = await PlaceholderService.getCategories();
    // let allPlaceholders = await PlaceholderService.getAssetPaths();
    if (!prefs?.enabledPlaceholders) {
        prefs = await loadPreferencesFromStorage();
    }
    const enabledCategories = placeholderCategories.filter(cat => (prefs!.enabledPlaceholders ?? []).includes(cat));
    return enabledCategories;
}