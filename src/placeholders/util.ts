import { IPreferences } from "@/preferences";
import { PlaceholderSet } from "./types";

export const getEnabledFromSet = (set: PlaceholderSet, prefs?: IPreferences) => {
    const enabledCategories = prefs?.enabledPlaceholders ?? [];
    return set.allImages.filter(img => enabledCategories.includes(img.category));
}