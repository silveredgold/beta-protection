export async function getAvailablePlaceholders(): Promise<{categories: string[], allImages: string[]}> {
    let storedHolders = await chrome.storage.local.get('placeholders');
    let allPlaceholders: string[] = [];
    if (storedHolders['placeholders']) {
        let categories = storedHolders['placeholders'] as string[];
        console.log(`updating with placeholders: ${categories}`);
        // context.preferences!.enabledPlaceholders = storedHolders['placeholders'];
        let files = await chrome.storage.local.get(categories) as {[key: string]: string[]};
        
        for (const category in files) {
            if (Object.prototype.hasOwnProperty.call(files, category)) {
                const element = files[category];
                allPlaceholders.push(...element);
            }
        }
        console.log(`parsed all available placeholders: ${allPlaceholders}`);
        return {categories, allImages: allPlaceholders}
    }
    return {allImages: [], categories: []}
}

export async function getEnabledPlaceholders(): Promise<{categories: string[], allImages: string[]}> {
    let storedHolders = await chrome.storage.local.get('placeholders');
    let allPlaceholders: string[] = [];
    if (storedHolders['placeholders']) {
        let categories = storedHolders['placeholders'] as string[];
        console.log(`updating with placeholders: ${categories}`);
        // context.preferences!.enabledPlaceholders = storedHolders['placeholders'];
        let files = await chrome.storage.local.get(categories) as {[key: string]: string[]};
        
        for (const category in files) {
            if (Object.prototype.hasOwnProperty.call(files, category)) {
                const element = files[category];
                allPlaceholders.push(...element);
            }
        }
        console.log(`parsed all available placeholders: ${allPlaceholders}`);
        return {categories, allImages: allPlaceholders}
    }
    return {allImages: [], categories: []}
}