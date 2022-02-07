import { GlobalThemeOverrides } from "naive-ui";


let _extensionVersion: string;

export function getExtensionVersion(): string {
    if (!_extensionVersion) {
        const manifestData = chrome.runtime.getManifest();
        _extensionVersion = manifestData.version;
    }
    return _extensionVersion;
}

export function isValidUrl(url: string) {
    const http = (url.includes("http://") || url.includes("https://") || url.includes("data:image/") || url.includes("file://"));
    return http;
}

export function toTitleCase(str: string) {
    return str.replace(
      /\w\S*/g,
      function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  }


export const themeOverrides: GlobalThemeOverrides = { common: { fontWeightStrong: '600' }, Result: {lineHeight: '1.1', titleFontSizeSmall: '24', iconSizeSmall: '48px'} };

export function isSafe(url: string, safeList: number[]) {
  let chrome = url && url.includes("chrome-extension://");
  let inList = safeList.includes(hashCode(url));
  return chrome || inList;
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