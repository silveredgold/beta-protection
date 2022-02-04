export function setLoadedPreferences(preferences){
    console.log(preferences);
    chrome.storage.local.set(preferences);
}